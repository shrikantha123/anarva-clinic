from fastapi import APIRouter, BackgroundTasks

from app.deps import DB
from app.schemas.records import PatientIn, PatientSaved
from app.services import email_notifications, records

router = APIRouter(tags=["patients"])


@router.post("/patients", response_model=PatientSaved)
def create_patient(body: PatientIn, background_tasks: BackgroundTasks, db: DB):
    record, created = records.save_patient(db, body)
    if created:
        background_tasks.add_task(email_notifications.notify_report_saved, record)
    return {"patient_id": record["patient_id"], "record": record}
