"""Thin Gemini wrapper: fast bounded call per attempt, 3-model cascade, and full operational logging."""

import asyncio
import logging
import time

from google.genai import errors, types

from app.errors import AIError
from app.logging_setup import record_operation
from app.schemas.analysis import AnalyzeResult

logger = logging.getLogger("app.ai")

MAX_OUTPUT_TOKENS = 4096
PER_MODEL_TIMEOUT_SECONDS = 24.0

# 3-model free-tier cascade across distinct Google hardware clusters & quota buckets:
# 1. gemini-3.1-flash-lite (30 RPM, 1500 RPD, fastest ~10-12s)
# 2. gemini-2.5-flash (15 RPM, 1500 RPD, high accuracy core cluster)
# 3. gemini-2.5-flash-lite (30 RPM, 1500 RPD, independent lite cluster)
MODEL_FALLBACKS = ("gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite")


class Gemini:
    def __init__(self, client, model: str, timeout: float):
        self._client = client
        self._model = "gemini-3.1-flash-lite"
        self._timeout = min(float(timeout), PER_MODEL_TIMEOUT_SECONDS)

    def _models_to_try(self) -> list[str]:
        return list(MODEL_FALLBACKS)

    async def _generate_once(self, model: str, contents: list) -> str:
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
                self._timeout,
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
        models = self._models_to_try()
        last_error: AIError | None = None
        for index, model in enumerate(models):
            try:
                return await self._generate_once(model, contents)
            except AIError as exc:
                last_error = exc
                if index + 1 < len(models):
                    logger.warning(
                        "Model %s busy/error (%s), switching immediately to %s",
                        model, str(exc), models[index + 1]
                    )
                    await asyncio.sleep(0.5)
                    continue
                raise
        if last_error:
            raise last_error
        raise AIError(502, "empty_models", retryable=False)

    async def aclose(self) -> None:
        await self._client.aio.aclose()
