"""Structured JSON logging. Log events carry ids and timings, never request bodies or personal data."""
import json
import logging
import sqlite3
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path

from app import db

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")
import tempfile

# In Docker /app is parent.parent; fallback to data dir
BASE_DIR = Path(__file__).resolve().parent.parent
OPERATIONAL_LOG_PATH = BASE_DIR / "data" / "operational_logs.db"


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": request_id_var.get(),
            **getattr(record, "ctx", {}),
        }
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, default=str)


def event(logger: logging.Logger, message: str, level: int = logging.INFO, **fields) -> None:
    logger.log(level, message, extra={"ctx": fields})


def ensure_operational_log_db() -> Path:
    global OPERATIONAL_LOG_PATH
    try:
        OPERATIONAL_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    except (PermissionError, OSError):
        # Container fallback: /tmp is always writable
        fallback_dir = Path(tempfile.gettempdir()) / "anarva_data"
        fallback_dir.mkdir(parents=True, exist_ok=True)
        OPERATIONAL_LOG_PATH = fallback_dir / "operational_logs.db"
    
    db.init_db(OPERATIONAL_LOG_PATH)
    return OPERATIONAL_LOG_PATH


def record_operation(
    operation: str,
    status: str,
    *,
    event_type: str = "system",
    route: str = "",
    http_method: str = "",
    http_status: int | None = None,
    latency_ms: int | None = None,
    resource_id: str | None = None,
    model: str | None = None,
    prompt_tokens: int | None = None,
    output_tokens: int | None = None,
    estimated_cost_usd: float | None = None,
    llm_cost_usd: float | None = None,
    llm_status: str | None = None,
    db_status: str | None = None,
    email_status: str | None = None,
    error_details: str | None = None,
) -> None:
    # Log to stdout/Render logs immediately
    ops_logger = logging.getLogger("app.operations")
    log_msg = (
        f"operation={operation} status={status} route={route} method={http_method} "
        f"latency_ms={latency_ms} http_status={http_status} "
        f"llm_status={llm_status} db_status={db_status} email_status={email_status}"
    )
    if error_details:
        log_msg += f" error={error_details}"
    
    level = logging.ERROR if status == "failed" else logging.INFO
    ops_logger.log(level, log_msg)

    # Write to database for persistent operation logs
    path = ensure_operational_log_db()
    conn = db.connect(path)
    try:
        cost = estimated_cost_usd if estimated_cost_usd is not None else llm_cost_usd
        row = {
            "id": uuid.uuid4().hex,
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "request_id": request_id_var.get(),
            "event_type": event_type,
            "operation": operation,
            "status": status,
            "route": route,
            "http_method": http_method,
            "http_status": http_status,
            "latency_ms": latency_ms,
            "resource_id": resource_id,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "output_tokens": output_tokens,
            "estimated_cost_usd": cost,
            "llm_status": llm_status or "",
            "db_status": db_status or "",
            "email_status": email_status or "",
            "error_details": error_details,
        }
        columns = (
            "id", "created_at", "request_id", "event_type", "operation", "status", "route",
            "http_method", "http_status", "latency_ms", "resource_id", "model", "prompt_tokens",
            "output_tokens", "estimated_cost_usd", "llm_status", "db_status", "email_status",
            "error_details",
        )
        placeholders = ", ".join("?" for _ in columns)
        conn.execute(
            f"INSERT INTO {db.OPERATIONAL_LOGS} ({', '.join(columns)}) VALUES ({placeholders})",
            tuple(row[col] for col in columns),
        )
        conn.commit()
    finally:
        conn.close()


def read_recent_operation_logs(limit: int = 200) -> list[dict]:
    path = ensure_operational_log_db()
    conn = db.connect(path)
    try:
        return db.list_recent_logs(conn, limit)
    finally:
        conn.close()


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = []
    logging.getLogger("uvicorn.access").disabled = True
    # Ensure operations logger also logs to stdout
    logging.getLogger("app.operations").setLevel(logging.INFO)
