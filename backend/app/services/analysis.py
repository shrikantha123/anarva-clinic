"""Analysis workflow: validate photos locally, then make at most one AI call per unique input."""
import asyncio
import hashlib

from app import images
from app.ai import analyzer
from app.ai.gemini import Gemini
from app.schemas.analysis import SLOTS, AnalyzeResult, ImageCheck, ImageValidation, Photos, QuizAnswers

CACHE_TTL_SECONDS = 300
MAX_TRACKED = 128

# Successful results stay for a few minutes so double submits and retries reuse them.
# Concurrent identical requests share one in-flight task; failures are never kept.
_tasks: dict[str, asyncio.Task] = {}


def _prepare(photos: Photos) -> tuple[dict[str, bytes], dict[str, str]]:
    accepted, rejected = {}, {}
    for slot in SLOTS:
        try:
            accepted[slot] = images.process(getattr(photos, slot))
        except images.ImageRejected as exc:
            rejected[slot] = str(exc)
    return accepted, rejected


def _rejection(rejected: dict[str, str]) -> AnalyzeResult:
    """Unusable files are reported in the same shape the AI uses, so the UI asks for a retake."""
    checks = {
        slot: ImageCheck(
            is_valid=slot not in rejected,
            angle_correct=slot not in rejected,
            quality_pass=slot not in rejected,
            rejection_reason=rejected.get(slot),
        )
        for slot in SLOTS
    }
    return AnalyzeResult(image_validation=ImageValidation(all_valid=False, **checks), analysis=None)


def _release(key: str, task: asyncio.Task) -> None:
    if task.cancelled() or task.exception() is not None:
        _tasks.pop(key, None)
    else:
        asyncio.get_running_loop().call_later(CACHE_TTL_SECONDS, _tasks.pop, key, None)


async def analyze(photos: Photos, quiz: QuizAnswers, ai: Gemini, attempts: int) -> AnalyzeResult:
    accepted, rejected = await asyncio.to_thread(_prepare, photos)
    if rejected:
        return _rejection(rejected)  # no AI call for files we already know are unusable

    digest = hashlib.sha256(quiz.model_dump_json().encode())
    for slot in SLOTS:
        digest.update(hashlib.sha256(accepted[slot]).digest())
    key = digest.hexdigest()

    task = _tasks.get(key)
    if task is None:
        while len(_tasks) >= MAX_TRACKED:
            _tasks.pop(next(iter(_tasks)))
        task = _tasks[key] = asyncio.create_task(analyzer.run(ai, accepted, quiz, attempts))
        task.add_done_callback(lambda t: _release(key, t))
    return await asyncio.shield(task)  # a client disconnect must not cancel the shared call
