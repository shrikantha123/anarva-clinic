from fastapi import APIRouter

from app.deps import DB
from app.schemas.records import PatientIn, PatientSaved
from app.services import records

router = APIRouter(tags=["patients"])


@router.post("/patients", response_model=PatientSaved)
def create_patient(body: PatientIn, db: DB):
    record = records.save_patient(db, body)
    return {"patient_id": record["patient_id"], "record": record}
