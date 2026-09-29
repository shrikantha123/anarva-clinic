"""Patient assessments and appointments: business rules on top of the db layer."""
import datetime as dt
import secrets
import sqlite3
import uuid
from collections.abc import Callable

from app import db, images
from app.errors import AppError
from app.schemas.analysis import SLOTS
from app.schemas.records import AppointmentIn, PatientIn


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _unique_code(prefix: str, taken: Callable[[str], bool]) -> str:
    """`PREFIX-1234-26` style ids; widens to six digits if the short space keeps colliding."""
    for attempt in range(60):
        digits = 4 if attempt < 20 else 6
        code = f"{prefix}-{secrets.randbelow(9 * 10 ** (digits - 1)) + 10 ** (digits - 1)}-26"
        if not taken(code):
            return code
    raise AppError(503, "Could not allocate an id. Please try again.")


def save_patient(conn: sqlite3.Connection, data: PatientIn) -> dict:
    existing = db.find(conn, db.PATIENTS, "patient_id", data.patient_id) if data.patient_id else None
    if existing and (existing["name"], existing["phone"]) == (data.name, data.phone):
        return existing  # the same submission sent twice

    try:
        photos = {slot: images.to_data_uri(getattr(data.photo_urls, slot)) for slot in SLOTS}
    except images.ImageRejected as exc:
        raise AppError(422, str(exc)) from None

    # The frontend picks a random id; keep it unless it belongs to a different patient.
    patient_id = data.patient_id if data.patient_id and not existing else _unique_code(
        "ANR", lambda code: db.find(conn, db.PATIENTS, "patient_id", code) is not None
    )
    record = {
        "patient_id": patient_id,
        "name": data.name or "Patient",
        "phone": data.phone,
        "gender": data.gender,
        "address": data.address,
        "quiz_answers": data.quiz_answers.model_dump(),
        "photo_urls": photos,
        "analysis": data.analysis,
        "status": "Pending Review",
        "created_at": _now(),
    }
    db.insert(conn, db.PATIENTS, record)
    return record


def book_appointment(conn: sqlite3.Connection, data: AppointmentIn) -> dict:
    record = {
        "id": f"apt-{uuid.uuid4().hex[:12]}",
        "appointment_id": _unique_code(
            "APT", lambda code: db.find(conn, db.APPOINTMENTS, "appointment_id", code) is not None
        ),
        **data.model_dump(mode="json"),
        "status": "Confirmed",
        "created_at": _now(),
    }
    db.insert(conn, db.APPOINTMENTS, record)
    return record


def set_patient_status(conn: sqlite3.Connection, patient_id: str, status: str) -> None:
    if not db.set_status(conn, db.PATIENTS, status, "patient_id = ?", (patient_id,)):
        raise AppError(404, "Assessment not found")


def set_appointment_status(conn: sqlite3.Connection, appointment_id: str, status: str) -> None:
    where, params = "id = ? OR appointment_id = ?", (appointment_id, appointment_id)
    if not db.set_status(conn, db.APPOINTMENTS, status, where, params):
        raise AppError(404, "Appointment not found")
