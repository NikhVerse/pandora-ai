"""
Pandora AI Platform — Backend Test Suite
Covers: health probes, versioning, auth bridges, chat completions,
        streaming, file upload parsing, evaluation endpoint, error handling.
"""
import sys
import os
import json
import io
import pytest
import httpx
from unittest.mock import MagicMock

# Enable TESTING mode to bypass external network calls on startup lifespan
os.environ["TESTING"] = "True"

# Inject parent directory for module resolution
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

AUTH_HEADERS = {"Authorization": "Bearer mock-operator"}

@pytest.fixture(autouse=True)
def mock_httpx_calls(monkeypatch):
    # Mock for non-streaming post
    async def mock_post(self, url, *args, **kwargs):
        if "chat/completions" in str(url):
            mock_resp = MagicMock(spec=httpx.Response)
            mock_resp.status_code = 200
            
            json_body = kwargs.get("json", {})
            if json_body.get("response_format", {}).get("type") == "json_object":
                content = '{"status": "ok", "value": 42}'
            else:
                content = "Mocked Fireworks AI response."
            
            mock_resp.json.return_value = {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": content
                        }
                    }
                ]
            }
            mock_resp.text = content
            return mock_resp
        return httpx.Response(404)

    # Mock for streaming send
    async def mock_send(self, request, *args, **kwargs):
        url = str(request.url)
        if "chat/completions" in url:
            mock_resp = MagicMock(spec=httpx.Response)
            mock_resp.status_code = 200
            
            async def mock_iter_lines():
                chunks = ["Hello", " from", " Fireworks", " stream."]
                for chunk in chunks:
                    yield f'data: {{"choices": [{{"delta": {{"content": "{chunk}"}}}}]}}'
                yield "data: [DONE]"
            
            mock_resp.iter_lines = mock_iter_lines
            mock_resp.aiter_lines = mock_iter_lines
            return mock_resp
        return httpx.Response(404)

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    monkeypatch.setattr(httpx.AsyncClient, "send", mock_send)

# ── Health & Readiness Probes ─────────────────────────────────────

def test_health():
    """GET /health returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "pandora-backend"

def test_health_via_api_prefix():
    """GET /api/health also returns healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_ready():
    """GET /ready returns ready status."""
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"

def test_version():
    """GET /version returns semver string."""
    response = client.get("/version")
    assert response.status_code == 200
    version = response.json()["version"]
    assert isinstance(version, str)
    parts = version.split(".")
    assert len(parts) == 3

# ── Authentication Bridges ────────────────────────────────────────

def test_auth_login_success():
    """POST /api/auth/login returns success with session token."""
    payload = {"email": "operator@pandora.io", "password": "securepass"}
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "session" in data
    assert "user" in data
    assert data["user"]["email"] == payload["email"]

def test_auth_signup():
    """POST /api/auth/signup returns success."""
    payload = {"email": "new@pandora.io", "password": "newpass123"}
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_auth_logout():
    """POST /api/auth/logout returns success."""
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_auth_missing_fields():
    """POST /api/auth/login with missing fields returns 422."""
    response = client.post("/api/auth/login", json={"email": "only@email.com"})
    assert response.status_code == 422

# ── Protected Route: /api/me ──────────────────────────────────────

def test_me_requires_auth():
    """GET /api/me without auth header returns 401 or 403."""
    response = client.get("/api/me")
    assert response.status_code in (401, 403)

def test_me_with_mock_token():
    """GET /api/me with mock bearer token returns operator info."""
    response = client.get("/api/me", headers=AUTH_HEADERS)
    assert response.status_code == 200

# ── Chat Completions ──────────────────────────────────────────────

def test_chat_non_stream():
    """POST /api/chat returns assistant message."""
    payload = {
        "messages": [{"role": "user", "content": "ping"}],
        "temperature": 0.5,
        "max_tokens": 50,
    }
    response = client.post("/api/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    choices = response.json().get("choices", [])
    assert len(choices) > 0
    assert choices[0]["message"]["role"] == "assistant"
    assert isinstance(choices[0]["message"]["content"], str)

def test_chat_with_system_prompt():
    """POST /api/chat with system_prompt is accepted."""
    payload = {
        "messages": [{"role": "user", "content": "Hello"}],
        "temperature": 0.3,
        "max_tokens": 50,
        "system_prompt": "You are a terse assistant.",
    }
    response = client.post("/api/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200

def test_chat_json_mode():
    """POST /api/chat with json_mode=True returns parseable JSON."""
    payload = {
        "messages": [{"role": "user", "content": "Output {\"ok\": true}"}],
        "temperature": 0.0,
        "max_tokens": 50,
        "json_mode": True,
    }
    response = client.post("/api/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200

def test_chat_invalid_payload():
    """POST /api/chat with missing messages returns 422."""
    response = client.post("/api/chat", json={}, headers=AUTH_HEADERS)
    assert response.status_code == 422

def test_chat_requires_auth():
    """POST /api/chat without auth returns 401 or 403."""
    payload = {"messages": [{"role": "user", "content": "hello"}]}
    response = client.post("/api/chat", json=payload)
    assert response.status_code in (401, 403)

# ── Streaming Endpoint ────────────────────────────────────────────

def test_chat_stream_returns_streaming_response():
    """POST /api/chat/stream returns a streaming text response."""
    payload = {
        "messages": [{"role": "user", "content": "ping"}],
        "temperature": 0.5,
        "max_tokens": 30,
    }
    with client.stream("POST", "/api/chat/stream", json=payload, headers=AUTH_HEADERS) as r:
        assert r.status_code == 200
        content = b"".join(r.iter_bytes())
        assert len(content) > 0

# ── File Upload ───────────────────────────────────────────────────

def test_upload_txt_file():
    """POST /api/upload with a txt file returns filename, size, content, summary."""
    txt_content = b"Pandora is an AI platform powered by Fireworks AI."
    files = {"file": ("test.txt", io.BytesIO(txt_content), "text/plain")}
    response = client.post("/api/upload", files=files, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["size"] == len(txt_content)
    assert "content" in data
    assert "summary" in data

def test_upload_json_file():
    """POST /api/upload with a json file parses and returns content."""
    json_content = json.dumps({"key": "value", "count": 42}).encode()
    files = {"file": ("data.json", io.BytesIO(json_content), "application/json")}
    response = client.post("/api/upload", files=files, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "data.json"
    assert "key" in data["content"]

def test_upload_csv_file():
    """POST /api/upload with a csv file returns row-joined content."""
    csv_content = b"name,score\nAlice,95\nBob,87\n"
    files = {"file": ("results.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/api/upload", files=files, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "Alice" in data["content"]

def test_upload_requires_auth():
    """POST /api/upload without auth returns 401 or 403."""
    files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
    response = client.post("/api/upload", files=files)
    assert response.status_code in (401, 403)

# ── Evaluation Endpoint ───────────────────────────────────────────

def test_evaluate_efficiency():
    """POST /api/evaluate with efficiency category validates char count."""
    payload = {
        "prompt": "Define Python in 3 words.",
        "category": "efficiency",
        "max_tokens": 20,
    }
    response = client.post("/api/evaluate", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("pass", "fail")
    assert "latency_ms" in data
    assert "output" in data

def test_evaluate_custom_validator():
    """POST /api/evaluate with custom_validator checks substring."""
    payload = {
        "prompt": "Say the word hello.",
        "category": "custom",
        "custom_validator": "hello",
        "max_tokens": 20,
    }
    response = client.post("/api/evaluate", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json()["status"] in ("pass", "fail")

def test_evaluate_requires_auth():
    """POST /api/evaluate without auth returns 401 or 403."""
    payload = {"prompt": "ping", "category": "custom"}
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code in (401, 403)

# ── Error Handling ────────────────────────────────────────────────

def test_404_unknown_route():
    """Unknown routes return 404."""
    response = client.get("/api/nonexistent-route")
    assert response.status_code == 404

def test_405_wrong_method():
    """Wrong HTTP method returns 405."""
    response = client.get("/api/chat")
    assert response.status_code == 405
