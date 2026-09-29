"""SQLite persistence: a few small functions, no ORM."""
import json
import sqlite3
from pathlib import Path

PATIENTS = "patient_assessments"
APPOINTMENTS = "appointments"
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
    return {k: json.loads(row[k]) if k in JSON_COLUMNS else row[k] for k in row.keys()}


# Table and column names below are internal constants, never user input.
def insert(conn: sqlite3.Connection, table: str, record: dict) -> None:
    values = [json.dumps(v) if k in JSON_COLUMNS else v for k, v in record.items()]
    marks = ", ".join("?" * len(record))
    with conn:
        conn.execute(f"INSERT INTO {table} ({', '.join(record)}) VALUES ({marks})", values)


def list_all(conn: sqlite3.Connection, table: str) -> list[dict]:
    rows = conn.execute(f"SELECT * FROM {table} ORDER BY created_at DESC, rowid DESC").fetchall()
    return [_to_dict(r) for r in rows]


def find(conn: sqlite3.Connection, table: str, column: str, value: str) -> dict | None:
    row = conn.execute(f"SELECT * FROM {table} WHERE {column} = ?", (value,)).fetchone()
    return _to_dict(row) if row else None


def set_status(conn: sqlite3.Connection, table: str, status: str, where: str, params: tuple) -> bool:
    with conn:
        cursor = conn.execute(f"UPDATE {table} SET status = ? WHERE {where}", (status, *params))
    return cursor.rowcount > 0
