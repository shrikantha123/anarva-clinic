"""Thin Gemini wrapper: one bounded call per attempt, with provider failures mapped to AIError."""
import asyncio
import logging
import time

from google.genai import errors, types

from app.errors import AIError
from app.logging_setup import event, record_operation
from app.schemas.analysis import AnalyzeResult

logger = logging.getLogger("app.ai")
MAX_OUTPUT_TOKENS = 4096
THINKING_BUDGET = 2048

# Used when the configured model returns capacity errors (503).
MODEL_FALLBACKS = ("gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash")


class Gemini:
    def __init__(self, client, model: str, timeout: float):
        self._client = client
        self._model = model
        self._timeout = timeout

    def _models_to_try(self) -> list[str]:
        ordered: list[str] = []
        for name in (self._model, *MODEL_FALLBACKS):
            if name not in ordered:
                ordered.append(name)
        return ordered

    async def _generate_once(self, model: str, contents: list) -> str:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnalyzeResult,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            thinking_config=types.ThinkingConfig(thinking_budget=THINKING_BUDGET),
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
            event(
                logger,
                "ai_provider_call_failed",
                logging.WARNING,
                model=model,
                reason="timeout",
                ms=latency_ms,
            )
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details="timeout", route="/api/analyze", http_method="POST")
            raise AIError(504, "timeout", retryable=True) from None
        except errors.APIError as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            event(
                logger,
                "ai_provider_call_failed",
                logging.WARNING,
                model=model,
                reason=f"provider_{exc.code}",
                ms=latency_ms,
            )
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=f"provider_{exc.code}", route="/api/analyze", http_method="POST")
            if exc.code in (401, 403):
                raise AIError(503, "provider_auth") from None
            retryable = exc.code in (408, 429) or exc.code >= 500
            raise AIError(502, f"provider_{exc.code}", retryable=retryable) from None
        except Exception as exc:  # network and SDK failures; never surface their details
            latency_ms = int((time.perf_counter() - started) * 1000)
            event(
                logger,
                "ai_provider_call_failed",
                logging.WARNING,
                model=model,
                reason=type(exc).__name__,
                ms=latency_ms,
            )
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=type(exc).__name__, route="/api/analyze", http_method="POST")
            raise AIError(502, type(exc).__name__, retryable=True) from None
        if not response.text:
            latency_ms = int((time.perf_counter() - started) * 1000)
            event(
                logger,
                "ai_provider_call_failed",
                logging.WARNING,
                model=model,
                reason="empty_response",
                ms=latency_ms,
            )
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details="empty_response", route="/api/analyze", http_method="POST")
            raise AIError(502, "empty_response", retryable=True)
        usage = getattr(response, "usage_metadata", None)
        latency_ms = int((time.perf_counter() - started) * 1000)
        prompt_tokens = getattr(usage, "prompt_token_count", None)
        candidate_tokens = getattr(usage, "candidates_token_count", None)
        estimated_cost_usd = ((prompt_tokens or 0) + (candidate_tokens or 0)) / 1000 * 0.0006
        event(
            logger,
            "ai_provider_call_ok",
            model=model,
            model_version=getattr(response, "model_version", None),
            ms=latency_ms,
            response_chars=len(response.text),
            prompt_tokens=prompt_tokens,
            candidate_tokens=candidate_tokens,
            thought_tokens=getattr(usage, "thoughts_token_count", None),
            total_tokens=getattr(usage, "total_token_count", None),
        )
        record_operation(
            "llm",
            "success",
            latency_ms=latency_ms,
            llm_status="success",
            model=model,
            prompt_tokens=prompt_tokens,
            output_tokens=candidate_tokens,
            estimated_cost_usd=estimated_cost_usd,
            route="/api/analyze",
            http_method="POST",
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
                capacity = exc.reason == "provider_503"
                if capacity and index + 1 < len(models):
                    event(
                        logger,
                        "ai_model_fallback",
                        model=model,
                        next_model=models[index + 1],
                        reason=exc.reason,
                    )
                    continue
                raise
        if last_error:
            raise last_error
        raise AIError(502, "empty_models", retryable=False)

    async def aclose(self) -> None:
        await self._client.aio.aclose()
