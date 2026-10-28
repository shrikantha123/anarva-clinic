"""Brevo (formerly Sendinblue) email service for notifications."""
import logging
from datetime import datetime
from typing import Optional

import requests

from app.config import get_settings
from app.logging_setup import record_operation

logger = logging.getLogger(__name__)


def _send_brevo_email(
    to_email: str,
    subject: str,
    html_content: str,
    sender_name: Optional[str] = None,
    sender_email: Optional[str] = None,
) -> None:
    """Send email using Brevo API."""
    settings = get_settings()
    
    api_key = getattr(settings, "brevo_api_key", None)
    if not api_key:
        raise RuntimeError("Brevo API key not configured. Set BREVO_API_KEY environment variable.")
    
    sender_email = sender_email or settings.gmail_sender_email
    sender_name = sender_name or "Anarva Clinic"
    
    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    
    return response.json()


def _send_notification_brevo(
    event: str,
    subject: str,
    body: str,
    resource_id: Optional[str] = None,
) -> None:
    """Send notification using Brevo with error handling."""
    started = datetime.now()
    
    try:
        settings = get_settings()
        to_email = settings.gmail_notification_email
        
        # Convert plain text body to HTML
        html_content = body.replace("\n", "<br>")
        
        _send_brevo_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )
        
        record_operation(
            "email",
            "success",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            resource_id=resource_id,
            email_status="sent",
            route="/notifications",
            http_method="EMAIL",
            error_details=None,
        )
        logger.info("Brevo %s notification sent successfully for resource: %s", event, resource_id)
        
    except requests.exceptions.HTTPError as exc:
        error_msg = f"HTTP {exc.response.status_code}: {exc.response.text}"
        logger.error("Brevo HTTP error for %s notification: %s", event, error_msg)
        record_operation(
            "email",
            "failed",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            resource_id=resource_id,
            email_status="http_error",
            route="/notifications",
            http_method="EMAIL",
            error_details=error_msg,
        )
    except requests.exceptions.RequestException as exc:
        logger.error("Brevo network error for %s notification: %s", event, exc)
        record_operation(
            "email",
            "failed",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            resource_id=resource_id,
            email_status="network_error",
            route="/notifications",
            http_method="EMAIL",
            error_details=f"Network Error: {exc}",
        )
    except Exception as exc:
        logger.exception("Brevo %s notification could not be sent", event)
        record_operation(
            "email",
            "failed",
            latency_ms=int((datetime.now() - started).total_seconds() * 1000),
            resource_id=resource_id,
            email_status="api_error",
            route="/notifications",
            http_method="EMAIL",
            error_details=f"{type(exc).__name__}: {exc}",
        )


def notify_report_saved_brevo(record: dict) -> None:
    """Send report saved notification using Brevo."""
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
    
    settings = get_settings()
    dashboard_url = settings.app_public_url.rstrip("/") + "/"
    
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
            "The patient's health responses, scalp images, and AI-generated analysis have been saved securely in your doctor dashboard.",
            "",
            f"Summary: {stage}; overall score {score_text}; consultation urgency {urgency}.",
            "",
            "View Patient Report:",
            f"{dashboard_url}?doctor=1&patient_id={report_id}",
            "",
            "You can review the complete report and patient details from your dashboard.",
            "",
            "Regards,",
            "Anarva Clinic Team",
        )
    )
    _send_notification_brevo("report", subject, body, resource_id=report_id)


def notify_appointment_booked_brevo(appointment: dict) -> None:
    """Send appointment booked notification using Brevo."""
    appointment_id = appointment.get("appointment_id") or "Not provided"
    
    settings = get_settings()
    dashboard_url = settings.app_public_url.rstrip("/") + "/"
    
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
            f"{dashboard_url}?doctor=1&tab=appointments&appointment_id={appointment_id}",
            "",
            "You can review the patient's AI report and appointment details from your dashboard.",
            "",
            "Regards,",
            "Anarva Clinic Team",
        )
    )
    _send_notification_brevo("appointment", subject, body, resource_id=appointment_id)


def _display_datetime(value: str | None) -> str:
    """Format datetime for email."""
    if not value:
        return "Not provided"
    try:
        from datetime import datetime
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return timestamp.astimezone().strftime("%d %b %Y, %I:%M %p %Z")
    except ValueError:
        return value


def _display_date(value: str | None) -> str:
    """Format date for email."""
    if not value:
        return "Not provided"
    try:
        from datetime import date
        return date.fromisoformat(value).strftime("%d %b %Y")
    except ValueError:
        return value
