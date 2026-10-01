"""FastAPI dependencies."""
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request

from app.ai.gemini import Gemini
from app.config import Settings, get_settings
from app.errors import AIError, AppError
from app.services import auth
from app.storage import RecordStore, SupabaseStore

SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_db(request: Request) -> Iterator[RecordStore]:
    store = getattr(request.app.state, "db", None)
    if store is None:
        raise AppError(503, "Supabase storage is not configured")
    yield store


def get_ai(request: Request) -> Gemini:
    if request.app.state.ai is None:
        raise AIError(503, "not_configured")
    return request.app.state.ai


def require_doctor(request: Request, settings: SettingsDep) -> None:
    token = request.cookies.get(auth.COOKIE_NAME, "")
    if not auth.verify_token(settings.secret_key.get_secret_value(), token):
        raise AppError(401, "Doctor login required")


DB = Annotated[RecordStore, Depends(get_db)]
AI = Annotated[Gemini, Depends(get_ai)]
DoctorOnly = Depends(require_doctor)
