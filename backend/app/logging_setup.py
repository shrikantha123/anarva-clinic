"""Structured JSON logging. Log events carry ids and timings, never request bodies or personal data."""
import json
import logging
import sys
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


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


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = []  # route through the JSON handler
    logging.getLogger("uvicorn.access").disabled = True  # replaced by our request log
