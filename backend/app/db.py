"""SQLite persistence: a few small functions, no ORM."""
import json
import sqlite3
from pathlib import Path

PATIENTS = "patient_assessments"
APPOINTMENTS = "appointments"
OPERATIONAL_LOGS = "operational_logs"
JSON_COLUMNS = {"quiz_answers", "photo_urls", "analysis"}

SCHEMA = f"""
CREATE TABLE IF NOT EXISTS {PATIENTS} (
    patient_id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, gender TEXT NOT NULL,
    address TEXT NOT NULL, quiz_answers TEXT NOT NULL, photo_urls TEXT NOT NULL,
    analysis TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS {APPOINTMENTS} (
    id TEXT PRIMARY KEY, appointment_id TEXT NOT NULL UNIQUE, patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL, specialist TEXT NOT NULL, date TEXT NOT NULL, time_slot TEXT NOT NULL,
    type TEXT NOT NULL, notes TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS {OPERATIONAL_LOGS} (
    id TEXT PRIMARY KEY, created_at TEXT NOT NULL, request_id TEXT NOT NULL,
    event_type TEXT NOT NULL, operation TEXT NOT NULL, status TEXT NOT NULL,
    route TEXT NOT NULL DEFAULT '', http_method TEXT NOT NULL DEFAULT '',
    http_status INTEGER, latency_ms INTEGER, resource_id TEXT, model TEXT,
    prompt_tokens INTEGER, output_tokens INTEGER, estimated_cost_usd REAL,
    llm_status TEXT DEFAULT '', db_status TEXT DEFAULT '', email_status TEXT DEFAULT '',
    error_details TEXT
);
CREATE INDEX IF NOT EXISTS patient_assessments_created_at_idx
    ON {PATIENTS} (created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx
    ON {APPOINTMENTS} (created_at DESC);
CREATE INDEX IF NOT EXISTS operational_logs_created_at_idx
    ON {OPERATIONAL_LOGS} (created_at DESC);
"""


def connect(path: Path) -> sqlite3.Connection:
    # Sync routes run in a thread pool, so a connection may be closed from another thread.
    conn = sqlite3.connect(path, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(path)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript(SCHEMA)
    finally:
        conn.close()


def _to_dict(row: sqlite3.Row) -> dict:
    data = {k: json.loads(row[k]) if k in JSON_COLUMNS else row[k] for k in row.keys()}
    if "estimated_cost_usd" in data and "llm_cost_usd" not in data:
        data["llm_cost_usd"] = data["estimated_cost_usd"]
    return data


# Table and column names below are internal constants, never user input.
def insert(conn: sqlite3.Connection, table: str, record: dict) -> None:
    values = [json.dumps(v) if k in JSON_COLUMNS else v for k, v in record.items()]
    marks = ", ".join("?" * len(record))
    with conn:
        conn.execute(f"INSERT INTO {table} ({', '.join(record)}) VALUES ({marks})", values)


def list_all(conn: sqlite3.Connection, table: str) -> list[dict]:
    rows = conn.execute(f"SELECT * FROM {table} ORDER BY created_at DESC, rowid DESC").fetchall()
    return [_to_dict(r) for r in rows]


def list_recent_logs(conn: sqlite3.Connection, limit: int = 200) -> list[dict]:
    bounded_limit = max(1, min(int(limit), 500))
    rows = conn.execute(
        f"SELECT * FROM {OPERATIONAL_LOGS} ORDER BY created_at DESC, rowid DESC LIMIT ?",
        (bounded_limit,),
    ).fetchall()
    return [_to_dict(r) for r in rows]


def find(conn: sqlite3.Connection, table: str, column: str, value: str) -> dict | None:
    row = conn.execute(f"SELECT * FROM {table} WHERE {column} = ?", (value,)).fetchone()
    return _to_dict(row) if row else None


def set_status(conn: sqlite3.Connection, table: str, status: str, where: str, params: tuple) -> bool:
    with conn:
        cursor = conn.execute(f"UPDATE {table} SET status = ? WHERE {where}", (status, *params))
    return cursor.rowcount > 0


class SQLiteStore:
    """SQLite adapter used only by isolated backend tests."""

    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def health_check(self) -> None:
        self._conn.execute("SELECT 1")

    def find(self, table: str, column: str, value: str) -> dict | None:
        return find(self._conn, table, column, value)

    def insert(self, table: str, record: dict) -> None:
        insert(self._conn, table, record)

    def list_all(self, table: str) -> list[dict]:
        return list_all(self._conn, table)

    def list_recent_logs(self, limit: int = 200) -> list[dict]:
        return list_recent_logs(self._conn, limit)

    def set_status(self, table: str, status: str, column: str, value: str) -> bool:
        if column not in {"patient_id", "id", "appointment_id"}:
            raise ValueError("Unknown record filter")
        return set_status(self._conn, table, status, f"{column} = ?", (value,))

    def close(self) -> None:
        self._conn.close()
