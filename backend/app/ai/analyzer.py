"""AI orchestration: call the model, validate its output, retry transient failures."""
import asyncio
import logging
import time

from pydantic import ValidationError

from app.ai.gemini import Gemini
from app.ai.prompt import build_contents
from app.errors import AIError
from app.logging_setup import event
from app.schemas.analysis import AnalyzeResult, QuizAnswers

logger = logging.getLogger("app.ai")
RETRY_BACKOFF_SECONDS = 1


async def run(ai: Gemini, images: dict[str, bytes], quiz: QuizAnswers, attempts: int) -> AnalyzeResult:
    """Return validated model output. Raises AIError once retries are exhausted."""
    contents = build_contents(quiz, images)
    for attempt in range(1, attempts + 1):
        started = time.monotonic()
        try:
            result = AnalyzeResult.model_validate_json(await ai.generate(contents))
        except ValidationError as exc:
            # Log only where validation failed, never the offending values.
            fields = sorted({".".join(map(str, e["loc"])) for e in exc.errors()})[:10]
            error = AIError(502, "malformed_response", retryable=True)
            event(logger, "ai_malformed_response", logging.WARNING, attempt=attempt, fields=fields)
        except AIError as exc:
            error = exc
        else:
            event(logger, "ai_analysis_ok", attempt=attempt, ms=int((time.monotonic() - started) * 1000),
                  all_valid=result.image_validation.all_valid)
            return result
        event(logger, "ai_attempt_failed", logging.WARNING, attempt=attempt, reason=error.reason,
              ms=int((time.monotonic() - started) * 1000))
        if not error.retryable or attempt == attempts:
            raise error
        await asyncio.sleep(attempt * RETRY_BACKOFF_SECONDS)
