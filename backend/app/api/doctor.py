from fastapi import APIRouter, Request, Response

from app import db as store
from app.deps import DB, DoctorOnly, SettingsDep
from app.logging_setup import read_recent_operation_logs
from app.schemas.records import LoginIn, LoginOut, PatientList, PatientStatusIn, PatientStatusUpdated
from app.services import auth, records

router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, request: Request, response: Response, settings: SettingsDep):
    client_ip = request.client.host if request.client else "unknown"
    token = auth.login(settings, body.username, body.password, client_ip)
    # The session lives in an HttpOnly cookie, so the frontend needs no token handling.
    response.set_cookie(
        auth.COOKIE_NAME, token, max_age=auth.TOKEN_TTL_SECONDS, httponly=True,
        samesite="strict", secure=settings.production, path="/api",
    )
    return {"doctor": auth.DOCTOR_PROFILE}


@router.get("/assessments", response_model=PatientList, dependencies=[DoctorOnly])
def list_assessments(db: DB):
    return {"assessments": db.list_all(store.PATIENTS)}


@router.patch("/assessments/{patient_id}/status", response_model=PatientStatusUpdated, dependencies=[DoctorOnly])
def update_status(patient_id: str, body: PatientStatusIn, db: DB):
    records.set_patient_status(db, patient_id, body.status)
    return {"patient_id": patient_id, "status": body.status}


@router.get("/logs", dependencies=[DoctorOnly])
def list_logs():
    return {"logs": read_recent_operation_logs(200)}
