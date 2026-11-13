import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.config import settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_status" in data
    assert "device" in data

def test_model_status():
    response = client.get("/api/model/status")
    assert response.status_code == 200
    data = response.json()
    assert "model_status" in data

def test_list_voices():
    response = client.get("/api/voices")
    assert response.status_code == 200
    voices = response.json()
    assert isinstance(voices, list)
    assert len(voices) > 0  # Seeded default voice

def test_upload_missing_consent():
    response = client.post(
        "/api/voice/upload",
        data={"consent_confirmed": "false", "name": "Unauthorized Voice"},
        files={"file": ("test.wav", b"fake audio content", "audio/wav")}
    )
    assert response.status_code == 400
    assert "consent is required" in response.json()["detail"].lower()

def test_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_cleanup_temporary():
    response = client.post("/api/settings/cleanup")
    assert response.status_code == 200
    assert "deleted_count" in response.json()

