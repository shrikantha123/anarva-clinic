from fastapi import APIRouter, BackgroundTasks

from app.deps import DB
from app.schemas.records import PatientIn, PatientSaved
from app.services import email_notifications, records

router = APIRouter(tags=["patients"])


import time
from app.logging_setup import record_operation

@router.post("/patients", response_model=PatientSaved)
def create_patient(body: PatientIn, background_tasks: BackgroundTasks, db: DB):
    started = time.perf_counter()
    record, created = records.save_patient(db, body)
    latency_ms = int((time.perf_counter() - started) * 1000)

    if created:
        record_operation(
            operation="database",
            status="success",
            event_type="patient_record",
            route="/api/patients",
            http_method="POST",
            http_status=200,
            latency_ms=latency_ms,
            resource_id=record.get("patient_id"),
            db_status="success",
            email_status="queued",
        )
        background_tasks.add_task(email_notifications.notify_report_saved, record)
    return {"patient_id": record["patient_id"], "record": record}
