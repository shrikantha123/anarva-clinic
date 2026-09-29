import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Isolated DB and doctor login for every test run.
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DOCTOR_PASSWORD", "pytest-doctor-secret")
os.environ.setdefault("SECRET_KEY", "pytest-secret-key-for-cookies-only")

import app.config as config_module
from app.main import create_app

config_module.get_settings.cache_clear()


@pytest.fixture()
def tmp_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_path))
    config_module.get_settings.cache_clear()
    yield db_path
    config_module.get_settings.cache_clear()


@pytest.fixture()
def client(tmp_db: Path):
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
