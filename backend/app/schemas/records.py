"""Request/response models for patients, appointments and doctor login."""
import datetime as dt
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.schemas.analysis import Photos, QuizAnswers

Short = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)]
Long = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]
PatientStatus = Literal["Pending Review", "Reviewed", "Contacted", "Treatment Started", "Completed"]
AppointmentStatus = Literal["Confirmed", "Pending", "Completed", "Cancelled"]
MAX_ANALYSIS_CHARS = 200_000


class PatientIn(BaseModel):
    patient_id: str | None = Field(None, pattern=r"^[A-Za-z0-9-]{1,40}$")
    name: Short = "Patient"
    phone: Short = ""
    gender: Short = ""
    address: Long = ""
    quiz_answers: QuizAnswers = Field(default_factory=QuizAnswers)
    photo_urls: Photos
    analysis: dict[str, Any]

    @field_validator("analysis")
    @classmethod
    def _bounded_analysis(cls, value):
        if not value or len(str(value)) > MAX_ANALYSIS_CHARS:
            raise ValueError("a completed analysis of reasonable size is required")
        return value


class PatientRecord(BaseModel):
    patient_id: str
    name: str
    phone: str
    gender: str
    address: str
    quiz_answers: dict[str, Any]
    photo_urls: dict[str, str]
    analysis: dict[str, Any]
    status: PatientStatus
    created_at: str


class PatientSaved(BaseModel):
    success: bool = True
    patient_id: str
    record: PatientRecord


class PatientList(BaseModel):
    assessments: list[PatientRecord]


class PatientStatusIn(BaseModel):
    status: PatientStatus


class PatientStatusUpdated(BaseModel):
    success: bool = True
    patient_id: str
    status: PatientStatus


class AppointmentIn(BaseModel):
    patient_name: Short = "Patient"
    patient_phone: Short = ""
    specialist: Short = "Anarva Clinic Team"
    date: dt.date = Field(default_factory=dt.date.today)
    time_slot: Short = "10:30 AM - Morning"
    type: Short = "In-Clinic Visit (Indiranagar Center)"
    notes: Long = ""

    @field_validator("date")
    @classmethod
    def _not_in_the_past(cls, value):
        if value < dt.date.today():
            raise ValueError("appointment date cannot be in the past")
        return value


class AppointmentRecord(BaseModel):
    id: str
    appointment_id: str
    patient_name: str
    patient_phone: str
    specialist: str
    date: str
    time_slot: str
    type: str
    notes: str
    status: AppointmentStatus
    created_at: str


class AppointmentBooked(BaseModel):
    success: bool = True
    appointment: AppointmentRecord


class AppointmentList(BaseModel):
    appointments: list[AppointmentRecord]


class AppointmentStatusIn(BaseModel):
    status: AppointmentStatus


class AppointmentStatusUpdated(BaseModel):
    success: bool = True
    id: str
    status: AppointmentStatus


class LoginIn(BaseModel):
    username: str = Field(max_length=200)
    password: str = Field(max_length=200)


class DoctorProfile(BaseModel):
    name: str
    role: str
    clinic: str


class LoginOut(BaseModel):
    success: bool = True
    doctor: DoctorProfile
