from fastapi import APIRouter, BackgroundTasks

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
