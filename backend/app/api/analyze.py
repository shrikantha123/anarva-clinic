from fastapi import APIRouter

from app.deps import AI, SettingsDep
from app.schemas.analysis import AnalyzeRequest, AnalyzeResult
from app.services import analysis

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResult, response_model_exclude_none=True)
async def analyze(body: AnalyzeRequest, ai: AI, settings: SettingsDep):
    return await analysis.analyze(body.photos, body.quiz_answers, ai, settings.ai_max_attempts)
