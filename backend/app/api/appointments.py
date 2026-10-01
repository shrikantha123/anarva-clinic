from fastapi import APIRouter

from app import db as store
from app.deps import DB, DoctorOnly
from app.schemas.records import (
    AppointmentBooked,
    AppointmentIn,
    AppointmentList,
    AppointmentStatusIn,
    AppointmentStatusUpdated,
)
from app.services import records

router = APIRouter(tags=["appointments"])


@router.post("/appointments", response_model=AppointmentBooked)
def book(body: AppointmentIn, db: DB):
    return {"appointment": records.book_appointment(db, body)}


@router.get("/appointments", response_model=AppointmentList, dependencies=[DoctorOnly])
def list_appointments(db: DB):
    return {"appointments": db.list_all(store.APPOINTMENTS)}


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentStatusUpdated, dependencies=[DoctorOnly])
def update_status(appointment_id: str, body: AppointmentStatusIn, db: DB):
    records.set_appointment_status(db, appointment_id, body.status)
    return {"id": appointment_id, "status": body.status}
