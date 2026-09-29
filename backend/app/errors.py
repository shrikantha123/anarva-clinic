"""One error type plus centralized handlers: clients only ever see safe, friendly messages."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app.errors")

AI_UNAVAILABLE = (
    "We could not complete your hair analysis right now. "
    "Please check your connection and try again in a moment."
)


class AppError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class AIError(AppError):
    """AI provider failure. `reason` is for logs only; clients get the friendly message."""

    def __init__(self, status_code: int, reason: str, retryable: bool = False):
        super().__init__(status_code, AI_UNAVAILABLE)
        self.reason = reason
        self.retryable = retryable


def _error(status_code: int, message: str, **extra) -> JSONResponse:
    return JSONResponse({"error": message, **extra}, status_code=status_code)


def install_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error(_: Request, exc: AppError):
        return _error(exc.status_code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_: Request, exc: RequestValidationError):
        fields = [".".join(str(part) for part in e["loc"][1:]) for e in exc.errors()]
        return _error(422, "Invalid request data", fields=fields)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException):
        messages = {404: "Not found", 405: "Method not allowed"}
        return _error(exc.status_code, messages.get(exc.status_code, "Request failed"))

    @app.exception_handler(Exception)
    async def unexpected(_: Request, exc: Exception):
        logger.exception("unhandled_error")
        return _error(500, "Something went wrong. Please try again.")
