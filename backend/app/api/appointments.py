from fastapi import APIRouter, BackgroundTasks, HTTPException

from app import db as store
from app.deps import DB, DoctorOnly
from app.schemas.records import (
    AppointmentBooked,
    AppointmentIn,
    AppointmentList,
    AppointmentStatusIn,
    AppointmentStatusUpdated,
)
from app.services import email_notifications, records

router = APIRouter(tags=["appointments"])


import time
from app.logging_setup import record_operation

@router.post("/appointments", response_model=AppointmentBooked)
def book(body: AppointmentIn, background_tasks: BackgroundTasks, db: DB):
    started = time.perf_counter()
    appointment = records.book_appointment(db, body)
    latency_ms = int((time.perf_counter() - started) * 1000)

    # Website appointment booking recorded as database operation
    record_operation(
        operation="database",
        status="success",
        event_type="appointment",
        route="/api/appointments",
        http_method="POST",
        http_status=200,
        latency_ms=latency_ms,
        resource_id=appointment.get("appointment_id"),
        db_status="success",
        email_status="queued",
    )

    background_tasks.add_task(email_notifications.notify_appointment_booked, appointment)
    return {"appointment": appointment}


@router.get("/appointments", response_model=AppointmentList, dependencies=[DoctorOnly])
def list_appointments(db: DB):
    return {"appointments": db.list_all(store.APPOINTMENTS)}


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentStatusUpdated, dependencies=[DoctorOnly])
def update_status(appointment_id: str, body: AppointmentStatusIn, db: DB):
    records.set_appointment_status(db, appointment_id, body.status)
    return {"id": appointment_id, "status": body.status}


@router.post("/test-email", dependencies=[DoctorOnly])
def test_email():
    """Test endpoint to verify email configuration is working."""
    test_appointment = {
        "appointment_id": "TEST-" + str(int(__import__("time").time())),
        "patient_name": "Test Patient",
        "patient_phone": "+919876543210",
        "date": "2026-10-25",
        "time_slot": "10:00 AM",
        "type": "In-Person Consultation",
        "created_at": __import__("datetime").datetime.now().isoformat(),
    }
    try:
        email_notifications.notify_appointment_booked(test_appointment)
        return {
            "status": "success",
            "message": "Test email sent successfully",
            "appointment_id": test_appointment["appointment_id"]
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Email test failed: {type(exc).__name__}: {str(exc)}"
        )


@router.get("/check-email-config", dependencies=[DoctorOnly])
def check_email_config():
    """Check email configuration without sending an email."""
    import os
    from app.config import get_settings

    settings = get_settings()
    env_token = getattr(settings, "gmail_token_json", None) or os.getenv("GMAIL_TOKEN_JSON")
    file_exists = settings.gmail_token_file.is_file()

    return {
        "gmail_token_json_env": "FOUND" if env_token else "NOT FOUND",
        "gmail_token_file": str(settings.gmail_token_file),
        "gmail_token_file_exists": file_exists,
        "gmail_notification_email": settings.gmail_notification_email,
        "gmail_sender_email": settings.gmail_sender_email,
        "env_token_preview": str(env_token)[:100] if env_token else None,
    }
