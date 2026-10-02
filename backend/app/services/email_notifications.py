"""Gmail API notifications for newly saved reports and booked appointments."""
import base64
import logging
from datetime import date, datetime
from email.message import EmailMessage
from urllib.parse import urlencode

from app.config import get_settings
from app.logging_setup import record_operation

logger = logging.getLogger(__name__)
GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def _send_email(subject: str, body: str) -> None:
    settings = get_settings()
    if not settings.gmail_token_file.is_file():
        raise RuntimeError("Gmail is not authorized; run `python -m app.gmail_auth` from backend.")

    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    credentials = Credentials.from_authorized_user_file(
        str(settings.gmail_token_file), [GMAIL_SEND_SCOPE]
    )
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    if not credentials.valid:
        raise RuntimeError("Gmail OAuth token is invalid; run `python -m app.gmail_auth` again.")

    message = EmailMessage()
    message["To"] = settings.gmail_notification_email
    message["From"] = settings.gmail_sender_email
    message["Subject"] = subject
    message.set_content(body)
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")

    service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
    service.users().messages().send(userId="me", body={"raw": raw_message}).execute()


def _send_notification(event: str, subject: str, body: str) -> None:
    started = datetime.now()
    try:
        _send_email(subject, body)
        record_operation(
            "email",
            "success",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            email_status="success",
            route="/notifications",
            http_method="EMAIL",
            error_details=None,
        )
    except Exception as exc:
        logger.exception("Gmail %s notification could not be sent", event)
        record_operation(
            "email",
            "failed",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            email_status="failed",
            route="/notifications",
            http_method="EMAIL",
            error_details=f"{type(exc).__name__}: {exc}",
        )


def _dashboard_link(**query: str) -> str:
    settings = get_settings()
    dashboard_url = settings.app_public_url.rstrip("/") + "/"
    params = urlencode({"doctor": "1", **query})
    return f"{dashboard_url}?{params}"


def _display_datetime(value: str | None) -> str:
    if not value:
        return "Not provided"
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return timestamp.astimezone().strftime("%d %b %Y, %I:%M %p %Z")
    except ValueError:
        return value


def _display_date(value: str | None) -> str:
    if not value:
        return "Not provided"
    try:
        return date.fromisoformat(value).strftime("%d %b %Y")
    except ValueError:
        return value


def notify_report_saved(record: dict) -> None:
    analysis = record.get("analysis") or {}
    if not isinstance(analysis, dict):
        analysis = {}
    consultation = analysis.get("consultation") or {}
    if not isinstance(consultation, dict):
        consultation = {}

    stage = analysis.get("stageName") or analysis.get("stage_name") or "Not provided"
    score = analysis.get("overallScore")
    if score is None:
        score = analysis.get("overall_health_score")
    score_text = f"{score}%" if score is not None else "Not provided"
    urgency = consultation.get("urgency") or "Not provided"
    report_id = record.get("patient_id") or "Not provided"
    report_link = _dashboard_link(patient_id=report_id)
    subject = f"[Anarva Clinic] New AI Hair Analysis Report: {report_id}"
    body = "\n".join(
        (
            "Hello Doctor,",
            "",
            "A new patient has completed the AI hair analysis on Anarva Clinic.",
            "",
            f"Patient: {record.get('name') or 'Not provided'}",
            f"Phone: {record.get('phone') or 'Not provided'}",
            f"Report ID: {report_id}",
            f"Submitted: {_display_datetime(record.get('created_at'))}",
            "",
            "The patient’s health responses, scalp images, and AI-generated analysis have been saved securely in your doctor dashboard.",
            "",
            f"Summary: {stage}; overall score {score_text}; consultation urgency {urgency}.",
            "",
            "View Patient Report:",
            report_link,
            "",
            "You can review the complete report and patient details from your dashboard.",
            "",
            "Regards,",
            "Anarva Clinic Team",
        )
    )
    _send_notification("report", subject, body)


def notify_appointment_booked(appointment: dict) -> None:
    appointment_id = appointment.get("appointment_id") or "Not provided"
    appointment_link = _dashboard_link(tab="appointments", appointment_id=appointment_id)
    subject = f"[Anarva Clinic] Appointment Booked: {appointment_id}"
    body = "\n".join(
        (
            "Hello Doctor,",
            "",
            "A patient has booked an appointment through Anarva Clinic.",
            "",
            f"Patient: {appointment.get('patient_name') or 'Not provided'}",
            f"Phone: {appointment.get('patient_phone') or 'Not provided'}",
            f"Appointment: {_display_date(appointment.get('date'))} at {appointment.get('time_slot') or 'Not provided'}",
            f"Booking ID: {appointment_id}",
            f"Consultation mode: {appointment.get('type') or 'Not provided'}",
            f"Booked at: {_display_datetime(appointment.get('created_at'))}",
            "",
            "The appointment details have been saved in your appointment dashboard.",
            "",
            "View Appointment:",
            appointment_link,
            "",
            "You can review the patient’s AI report and appointment details from your dashboard.",
            "",
            "Regards,",
            "Anarva Clinic Team",
        )
    )
    _send_notification("appointment", subject, body)