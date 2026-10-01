"""Regression tests for the FastAPI backend (no live Gemini calls)."""
import asyncio
import base64
import datetime as dt
import io
import threading
from types import SimpleNamespace

import pytest
from PIL import Image
import httpx

from app import main
from app.config import Settings
from app.deps import get_db
from app.storage import SupabaseStore
from app.main import MAX_BODY_BYTES

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


def test_supabase_store_uses_server_credentials_and_rest_api():
    requests = []

    def respond(request):
        requests.append(request)
        return httpx.Response(200, json=[{"patient_id": "ANR-1234-26"}])

    client = httpx.Client(
        base_url="https://project.supabase.co/rest/v1/",
        transport=httpx.MockTransport(respond),
    )
    store = SupabaseStore("https://project.supabase.co", "server-only-test-key", client)
    try:
        assert store.find("patient_assessments", "patient_id", "ANR-1234-26") == {
            "patient_id": "ANR-1234-26"
        }
        store.insert("appointments", {"appointment_id": "APT-1234-26"})
    finally:
        store.close()

    assert requests[0].url.path == "/rest/v1/patient_assessments"
    assert requests[0].headers["apikey"] == "server-only-test-key"
    assert requests[0].headers["authorization"] == "Bearer server-only-test-key"
    assert requests[1].method == "POST"


def test_app_lifespan_reuses_and_pings_supabase_store(monkeypatch):
    settings = Settings(
        environment="test",
        supabase_url="https://project.supabase.co",
        supabase_service_role_key="server-only-test-key",
    )
    pinged = threading.Event()

    class FakeStore:
        health_checks = 0
        close_calls = 0

        def health_check(self):
            self.health_checks += 1
            pinged.set()

        def close(self):
            self.close_calls += 1

    store = FakeStore()
    monkeypatch.setattr(main, "get_settings", lambda: settings)
    monkeypatch.setattr(main, "setup_logging", lambda: None)
    monkeypatch.setattr(main, "SUPABASE_KEEPALIVE_INTERVAL_SECONDS", 0.01)
    monkeypatch.setattr(main, "SupabaseStore", lambda _url, _key: store)
    app = main.create_app()

    async def exercise_lifespan():
        async with main.lifespan(app):
            request = SimpleNamespace(app=SimpleNamespace(state=app.state))
            first = get_db(request)
            assert next(first) is store
            first.close()
            second = get_db(request)
            assert next(second) is store
            second.close()
            await asyncio.wait_for(asyncio.to_thread(pinged.wait, 1), timeout=2)
            assert store.health_checks >= 1
            assert store.close_calls == 0
        assert store.close_calls == 1

    asyncio.run(exercise_lifespan())


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


def test_oversized_declared_body_is_rejected(client):
    response = client.post(
        "/api/analyze",
        content=b" " * (MAX_BODY_BYTES + 1),
    )

    assert response.status_code == 413, response.text
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
    future_date = (dt.date.today() + dt.timedelta(days=30)).isoformat()
    response = client.post(
        "/api/appointments",
        json={
            "patient_name": "Test User",
            "patient_phone": "9876543210",
            "specialist": "Dr. S. Mukherjee (Senior Trichologist)",
            "date": future_date,
            "time_slot": "10:30 AM - Morning",
            "type": "In-Clinic Visit (Indiranagar Center)",
        },
    )
    assert response.status_code == 200
    assert response.json()["appointment"]["status"] == "Confirmed"


def test_doctor_status_updates_and_appointment_list(client):
    assert client.get("/api/appointments").status_code == 401
    assert client.patch(
        "/api/appointments/apt-test/status", json={"status": "Completed"}
    ).status_code == 401

    payload = {
        "patient_id": "ANR-1212-26",
        "name": "Status User",
        "phone": "12345",
        "gender": "",
        "address": "",
        "quiz_answers": QUIZ,
        "photo_urls": _photos(),
        "analysis": {"score": 50},
    }
    assert client.post("/api/patients", json=payload).status_code == 200
    future_date = (dt.date.today() + dt.timedelta(days=30)).isoformat()
    appointment = client.post("/api/appointments", json={"date": future_date}).json()["appointment"]

    login = client.post(
        "/api/doctor/login",
        json={"username": "doctor@anarvaclinic.com", "password": "pytest-doctor-secret"},
    )
    assert login.status_code == 200

    patient_status = client.patch(
        "/api/doctor/assessments/ANR-1212-26/status", json={"status": "Reviewed"}
    )
    appointment_status = client.patch(
        f"/api/appointments/{appointment['appointment_id']}/status", json={"status": "Completed"}
    )
    listed = client.get("/api/appointments")

    assert patient_status.status_code == 200
    assert patient_status.json()["status"] == "Reviewed"
    assert appointment_status.status_code == 200
    assert appointment_status.json()["status"] == "Completed"
    assert listed.status_code == 200
    assert listed.json()["appointments"][0]["status"] == "Completed"


def test_appointment_rejects_past_date(client):
    yesterday = (dt.date.today() - dt.timedelta(days=1)).isoformat()

    response = client.post("/api/appointments", json={"date": yesterday})

    assert response.status_code == 422


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
