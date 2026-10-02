import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

from app.ai.gemini import Gemini
from app.api import analyze, appointments, doctor, patients
from app.config import APP_BASE, DIST_DIR, SITE_DIR, get_settings
from app.deps import get_db
from app.errors import AppError, install_handlers
from app.images import MAX_BYTES
from app.logging_setup import event, record_operation, request_id_var, setup_logging
from app.storage import SupabaseStore

logger = logging.getLogger("app")
MAX_BODY_BYTES = 3 * MAX_BYTES * 4 // 3 + 1024 * 1024  # three base64 photos plus JSON overhead
SUPABASE_KEEPALIVE_INTERVAL_SECONDS = 20 * 60
STARTED = time.monotonic()


async def _supabase_keepalive(store):
    while True:
        started = time.perf_counter()
        try:
            await asyncio.to_thread(store.health_check)
        except Exception as exc:
            event(
                logger,
                "supabase_keepalive_failed",
                logging.WARNING,
                reason=type(exc).__name__,
                ms=int((time.perf_counter() - started) * 1000),
            )
        else:
            event(logger, "supabase_keepalive_ok", ms=int((time.perf_counter() - started) * 1000))
        await asyncio.sleep(SUPABASE_KEEPALIVE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    started = time.perf_counter()
    settings = get_settings()
    setup_logging()
    key = settings.gemini_api_key
    app.state.ai = Gemini(
        genai.Client(api_key=key.get_secret_value()), settings.gemini_model, settings.ai_timeout_seconds
    ) if key else None
    service_role_key = settings.supabase_service_role_key
    app.state.db = (
        SupabaseStore(settings.supabase_url, service_role_key.get_secret_value())
        if settings.supabase_url and service_role_key and service_role_key.get_secret_value().strip()
        else None
    )
    keepalive_task = (
        asyncio.create_task(_supabase_keepalive(app.state.db)) if app.state.db is not None else None
    )
    if app.state.ai is None:
        event(logger, "GEMINI_API_KEY is not set: /api/analyze is disabled", logging.WARNING)
    if app.state.db is None:
        event(logger, "Supabase storage is not configured: record routes are disabled", logging.WARNING)
    if not settings.doctor_username or not settings.doctor_username.strip() or settings.doctor_password is None:
        event(logger, "Doctor credentials are not set: doctor login is disabled", logging.WARNING)
    startup_status = "success" if app.state.ai and app.state.db and settings.doctor_username else "failed"
    record_operation(
        "startup",
        startup_status,
        latency_ms=int((time.perf_counter() - started) * 1000),
        llm_status="success" if app.state.ai else "failed",
        db_status="success" if app.state.db else "failed",
        email_status="not_configured",
        route="/startup",
        http_method="startup",
    )
    event(logger, "startup", environment=settings.environment, status=startup_status)
    yield
    if keepalive_task:
        keepalive_task.cancel()
        try:
            await keepalive_task
        except asyncio.CancelledError:
            pass
    if app.state.db:
        app.state.db.close()
    if app.state.ai:
        await app.state.ai.aclose()
    record_operation("shutdown", "success", latency_ms=0, route="/shutdown", http_method="shutdown")
    event(logger, "shutdown")


class BodyLimit:
    """Rejects oversized bodies (declared or streamed) before they are buffered."""

    def __init__(self, app, max_bytes: int):
        self.app, self.max_bytes = app, max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        declared = dict(scope["headers"]).get(b"content-length", b"0")
        if declared.isdigit() and int(declared) > self.max_bytes:
            response = JSONResponse(
                {"error": "The upload is too large. Please use smaller photos."}, status_code=413
            )
            return await response(scope, receive, send)
        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            received += len(message.get("body", b"")) if message["type"] == "http.request" else 0
            if received > self.max_bytes:
                raise AppError(413, "The upload is too large. Please use smaller photos.")
            return message

        try:
            await self.app(scope, limited_receive, send)
        except AppError as exc:
            response = JSONResponse({"error": exc.message}, status_code=exc.status_code)
            await response(scope, receive, send)


class StaticSPA(StaticFiles):
    """Serves the built React app, falling back to index.html for client-side routes."""

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code != 404:
                raise
            return await super().get_response("index.html", scope)


async def request_log(request: Request, call_next):
    request_id = request_id_var.set(uuid.uuid4().hex[:12])
    started, status = time.perf_counter(), 500
    try:
        response = await call_next(request)
        status = response.status_code
        response.headers["X-Request-ID"] = request_id_var.get()
        return response
    finally:
        event(logger, "request", method=request.method, path=request.url.path, status=status,
              ms=int((time.perf_counter() - started) * 1000))
        request_id_var.reset(request_id)


def health():
    """Health check endpoint for Render cron monitoring (every 5 minutes)"""
    return {
        "status": "healthy",
        "uptime": round(time.monotonic() - STARTED),
        "timestamp": time.time(),
        "service": "anarva-backend"
    }


def create_app() -> FastAPI:
    hidden = get_settings().production  # no interactive API docs in production
    app = FastAPI(
        title="Anarva Clinic API", lifespan=lifespan,
        docs_url=None if hidden else "/docs", redoc_url=None, openapi_url=None if hidden else "/openapi.json",
    )
    app.state.db = None

    # CORS Middleware Configuration for Render
    # Allow requests from your deployed frontend Render URL
    # For local development, you can add "http://localhost:5173" to allowed_origins
  # CORS Middleware Configuration for Render & Custom Domains
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

    app.middleware("http")(request_log)
    app.add_middleware(BodyLimit, max_bytes=MAX_BODY_BYTES)
    install_handlers(app)

    for module in (analyze, patients, doctor, appointments):
        app.include_router(module.router, prefix="/api")
    app.add_api_route("/health", health, methods=["GET"])

    # Only mount static files in development or when directories exist
    # For Render/production with separate frontend deployment, these won't be mounted
    if DIST_DIR.is_dir():
        app.mount(APP_BASE, StaticSPA(directory=DIST_DIR, html=True), name="assessment")
    if SITE_DIR.is_dir():
        app.mount("/", StaticFiles(directory=SITE_DIR, html=True), name="site")
    return app


app = create_app()
