"""Ultra-fast Gemini wrapper: hedged parallel racing with a strict 25s total time ceiling."""

import asyncio
import logging
import time

from google.genai import errors, types

from app.errors import AIError
from app.logging_setup import record_operation
from app.schemas.analysis import AnalyzeResult

logger = logging.getLogger("app.ai")

MAX_OUTPUT_TOKENS = 3072
TOTAL_BUDGET_SECONDS = 25.0
PER_CALL_TIMEOUT_SECONDS = 22.0
HEDGE_DELAY_SECONDS = 10.0

# Independent free-tier quota buckets
MODEL_FALLBACKS = ("gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite")


class Gemini:
    def __init__(self, client, model: str, timeout: float):
        self._client = client
        self._model = "gemini-3.1-flash-lite"
        self._timeout = min(float(timeout), PER_CALL_TIMEOUT_SECONDS)

    def _models_to_try(self) -> list[str]:
        return list(MODEL_FALLBACKS)

    async def _generate_once(self, model: str, contents: list, timeout_sec: float) -> str:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnalyzeResult,
            max_output_tokens=MAX_OUTPUT_TOKENS,
        )
        started = time.perf_counter()
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=model, contents=contents, config=config
                ),
                timeout_sec,
            )
        except TimeoutError:
            latency_ms = int((time.perf_counter() - started) * 1000)
            logger.error("Gemini call timed out after %d ms for model %s", latency_ms, model)
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details="timeout", route="/api/analyze", http_method="POST")
            raise AIError(504, "timeout", retryable=True) from None
        except errors.APIError as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            code = getattr(exc, 'code', None)
            err_msg = str(exc).lower()
            logger.error("Gemini API Error [%s]: %s (model: %s)", code or 'unknown', str(exc), model)
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=str(exc), route="/api/analyze", http_method="POST")
            if code in (401, 403) and "quota" not in err_msg and "rate" not in err_msg:
                raise AIError(503, "provider_auth") from None
            is_overloaded = "overloaded" in err_msg or "high demand" in err_msg or "resource_exhausted" in err_msg
            retryable = (code in (408, 429, 503)) or (code is not None and code >= 500) or is_overloaded
            raise AIError(503 if is_overloaded or code == 503 else 502, f"provider_{code or 'error'}", retryable=retryable) from None
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            err_msg = str(exc).lower()
            is_overloaded = "overloaded" in err_msg or "high demand" in err_msg or "503" in err_msg
            logger.error("Gemini Unexpected Error: %s: %s (model: %s)", type(exc).__name__, str(exc), model)
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=f"{type(exc).__name__}: {str(exc)}", route="/api/analyze", http_method="POST")
            raise AIError(503 if is_overloaded else 502, str(exc), retryable=True) from None

        if not response.text:
            logger.error("Gemini returned empty text for model %s", model)
            raise AIError(502, "empty_response", retryable=True)

        latency_ms = int((time.perf_counter() - started) * 1000)
        logger.info("Gemini Analysis Succeeded in %d ms (model: %s)", latency_ms, model)

        prompt_tokens = None
        output_tokens = None
        estimated_cost_usd = None
        usage = getattr(response, "usage_metadata", None)
        if usage:
            prompt_tokens = getattr(usage, "prompt_token_count", None)
            output_tokens = getattr(usage, "candidates_token_count", None)
            if prompt_tokens is not None and output_tokens is not None:
                estimated_cost_usd = round(
                    ((prompt_tokens * 0.15) + (output_tokens * 0.60)) / 1_000_000, 6
                )

        record_operation(
            operation="llm",
            status="success",
            event_type="analysis",
            route="/api/analyze",
            http_method="POST",
            http_status=200,
            latency_ms=latency_ms,
            model=model,
            prompt_tokens=prompt_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=estimated_cost_usd,
            llm_cost_usd=estimated_cost_usd,
            llm_status="success",
            email_status="not_applicable",
        )

        return response.text

    async def generate(self, contents: list) -> str:
        """
        Fast bounded execution with strict 25s total wall-clock budget:
        - Fires primary model (gemini-3.1-flash-lite) immediately.
        - If it errors quickly (503/429 in ~0.3s), switches with ZERO sleep to next model.
        - If it is still running at 6.5s, launches secondary model in parallel (hedged race) so whichever finishes first wins.
        - Never exceeds TOTAL_BUDGET_SECONDS (25s) total across all models.
        """
        models = self._models_to_try()
        deadline = time.perf_counter() + TOTAL_BUDGET_SECONDS
        last_error: AIError | None = None

        primary_task = asyncio.create_task(
            self._generate_once(models[0], contents, min(self._timeout, TOTAL_BUDGET_SECONDS))
        )
        active_tasks: set[asyncio.Task] = {primary_task}
        next_model_idx = 1

        try:
            while active_tasks:
                remaining = deadline - time.perf_counter()
                if remaining <= 0.2:
                    raise AIError(504, "timeout", retryable=True)

                wait_timeout = min(HEDGE_DELAY_SECONDS, remaining) if next_model_idx < len(models) else remaining
                done, _ = await asyncio.wait(
                    active_tasks,
                    timeout=wait_timeout,
                    return_when=asyncio.FIRST_COMPLETED,
                )

                for finished in done:
                    active_tasks.discard(finished)
                    try:
                        result_text = finished.result()
                        return result_text
                    except AIError as exc:
                        last_error = exc
                    except Exception as exc:
                        last_error = AIError(502, str(exc), retryable=True)

                # Launch next backup model immediately if primary failed OR if hedge timer fired while primary is slow
                remaining_after = deadline - time.perf_counter()
                if next_model_idx < len(models) and remaining_after > 2.5:
                    backup_model = models[next_model_idx]
                    next_model_idx += 1
                    logger.info("Launching hedged/failover model %s (%.1fs budget left)", backup_model, remaining_after)
                    backup_task = asyncio.create_task(
                        self._generate_once(backup_model, contents, min(self._timeout, remaining_after))
                    )
                    active_tasks.add(backup_task)
        finally:
            for t in active_tasks:
                t.cancel()

        if last_error:
            raise last_error
        raise AIError(503, "high_demand", retryable=True)

    async def aclose(self) -> None:
        await self._client.aio.aclose()
