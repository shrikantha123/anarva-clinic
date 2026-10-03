"""Thin Gemini wrapper: fast bounded call per attempt, with full error logging."""
import asyncio
import logging
import time
from google.genai import errors, types
from app.errors import AIError
from app.logging_setup import event, record_operation
from app.schemas.analysis import AnalyzeResult

logger = logging.getLogger("app.ai")

MAX_OUTPUT_TOKENS = 4096
MODEL_FALLBACKS = ("gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash")


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
        # Fast schema generation without slow thinking delay
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
            logger.error("Gemini API Error [%s]: %s (model: %s)", getattr(exc, 'code', 'unknown'), str(exc), model)
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=str(exc), route="/api/analyze", http_method="POST")
            if getattr(exc, 'code', None) in (401, 403):
                raise AIError(503, "provider_auth") from None
            retryable = getattr(exc, 'code', 0) in (408, 429) or getattr(exc, 'code', 0) >= 500
            raise AIError(502, f"provider_{getattr(exc, 'code', 'error')}", retryable=retryable) from None
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            logger.error("Gemini Unexpected Error: %s: %s (model: %s)", type(exc).__name__, str(exc), model)
            record_operation("llm", "failed", latency_ms=latency_ms, llm_status="failed", model=model,
                             error_details=f"{type(exc).__name__}: {str(exc)}", route="/api/analyze", http_method="POST")
            raise AIError(502, str(exc), retryable=True) from None

        if not response.text:
            logger.error("Gemini returned empty text for model %s", model)
            raise AIError(502, "empty_response", retryable=True)

        latency_ms = int((time.perf_counter() - started) * 1000)
        logger.info("Gemini Analysis Succeeded in %d ms (model: %s)", latency_ms, model)
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
                    logger.warning("Falling back from %s to %s due to: %s", model, models[index + 1], str(exc))
                    continue
                raise
        if last_error:
            raise last_error
        raise AIError(502, "empty_models", retryable=False)

    async def aclose(self) -> None:
        await self._client.aio.aclose()
