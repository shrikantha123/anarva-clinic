"""Regression tests for the FastAPI backend (no live Gemini calls)."""
import base64
import io

import pytest
from PIL import Image

SAMPLE_FRONT = "/hair-loss-assessment/assets/q3_frontals_hairline_1790578848301-Qd1jja4a.jpg"
SAMPLE_MID = "/hair-loss-assessment/assets/q3_mid_scalp_1790578883640-DRH5QOaV.jpg"
SAMPLE_CROWN = "/hair-loss-assessment/assets/q3_crown_thinning_1790578871838-BqEqFThK.jpg"

QUIZ = {
    "q1_onset": "6-12 months",
    "q2_progression": "Slowly getting worse",
    "q3_locations": ["Front hairline"],
    "q4_shedding": 2,
    "q5_family": ["Father"],
    "q6_events": [],
    "q6_timing": "",
    "q7_symptoms": [],
    "q8_treatments": [],
    "q8_duration": "",
}


def _tiny_png_data_uri() -> str:
    img = Image.new("RGB", (50, 50), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


def _photos(front=SAMPLE_FRONT, mid=SAMPLE_MID, crown=SAMPLE_CROWN):
    return {"front": front, "mid": mid, "crown": crown}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "uptime" in body


def test_site_and_spa_mount(client):
    assert client.get("/").status_code == 200
    assert client.get("/hair-loss-assessment/").status_code == 200


def test_analyze_rejects_too_small_image(client):
    small = _tiny_png_data_uri()
    response = client.post(
        "/api/analyze",
        json={"photos": _photos(front=small, mid=small, crown=small), "quizAnswers": QUIZ},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["image_validation"]["all_valid"] is False
    assert data.get("analysis") is None


def test_analyze_validation_error_missing_photos(client):
    response = client.post("/api/analyze", json={"quizAnswers": QUIZ})
    assert response.status_code == 422
    assert "error" in response.json()


def test_patient_save_and_doctor_list(client):
    analysis = {"norwoodStage": 2, "stageName": "Stage 2", "overallScore": 70}
    payload = {
        "patient_id": "ANR-9999-26",
        "name": "Test User",
        "phone": "9876543210",
        "gender": "Male",
        "address": "Bangalore",
        "quiz_answers": QUIZ,
        "photo_urls": _photos(),
        "analysis": analysis,
    }
    save = client.post("/api/patients", json=payload)
    assert save.status_code == 200
    saved = save.json()
    assert saved["patient_id"] == "ANR-9999-26"
    assert saved["record"]["name"] == "Test User"

    login = client.post(
        "/api/doctor/login",
        json={"username": "doctor@anarvaclinic.com", "password": "pytest-doctor-secret"},
    )
    assert login.status_code == 200

    listed = client.get("/api/doctor/assessments")
    assert listed.status_code == 200
    ids = [row["patient_id"] for row in listed.json()["assessments"]]
    assert "ANR-9999-26" in ids


def test_doctor_login_invalid(client):
    response = client.post(
        "/api/doctor/login",
        json={"username": "doctor@anarvaclinic.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_doctor_routes_require_session(client):
    assert client.get("/api/doctor/assessments").status_code == 401


def test_appointment_booking(client):
    response = client.post(
        "/api/appointments",
        json={
            "patient_name": "Test User",
            "patient_phone": "9876543210",
            "specialist": "Dr. S. Mukherjee (Senior Trichologist)",
            "date": "2026-12-01",
            "time_slot": "10:30 AM - Morning",
            "type": "In-Clinic Visit (Indiranagar Center)",
        },
    )
    assert response.status_code == 200
    assert response.json()["appointment"]["status"] == "Confirmed"


def test_patient_duplicate_idempotent(client):
    analysis = {"score": 1}
    payload = {
        "patient_id": "ANR-8888-26",
        "name": "Dup User",
        "phone": "111",
        "gender": "",
        "address": "",
        "quiz_answers": QUIZ,
        "photo_urls": _photos(),
        "analysis": analysis,
    }
    first = client.post("/api/patients", json=payload)
    second = client.post("/api/patients", json=payload)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["patient_id"] == second.json()["patient_id"]
