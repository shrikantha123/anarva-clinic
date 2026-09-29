"""Thin Gemini wrapper: one bounded call per attempt, with provider failures mapped to AIError."""
import asyncio
import logging

from google.genai import errors, types

from app.errors import AIError
from app.logging_setup import event
from app.schemas.analysis import AnalyzeResult

logger = logging.getLogger("app.ai")

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
            response_mime_type="application/json", response_schema=AnalyzeResult
        )
        try:
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=model, contents=contents, config=config
                ),
                self._timeout,
            )
        except TimeoutError:
            raise AIError(504, "timeout", retryable=True) from None
        except errors.APIError as exc:
            if exc.code in (401, 403):
                raise AIError(503, "provider_auth") from None
            retryable = exc.code in (408, 429) or exc.code >= 500
            raise AIError(502, f"provider_{exc.code}", retryable=retryable) from None
        except Exception as exc:  # network and SDK failures; never surface their details
            raise AIError(502, type(exc).__name__, retryable=True) from None
        if not response.text:
            raise AIError(502, "empty_response", retryable=True)
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
