from fastapi.testclient import TestClient

from app.backend import backend_main


def test_api_health_endpoint():
    client = TestClient(backend_main.api)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_completions_endpoint(monkeypatch):
    async def fake_generate_assistant_reply(messages, model):
        assert model == "default"
        assert messages[-1].content == "Привет"
        return "Привет! Чем могу помочь?"

    monkeypatch.setattr(
        backend_main,
        "generate_assistant_reply",
        fake_generate_assistant_reply,
    )
    client = TestClient(backend_main.api)

    response = client.post(
        "/api/chat/completions",
        json={
            "model": "default",
            "messages": [{"role": "user", "content": "Привет"}],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["object"] == "chat.completion"
    assert data["model"] == "default"
    assert data["choices"][0]["message"] == {
        "role": "assistant",
        "content": "Привет! Чем могу помочь?",
    }
    assert data["choices"][0]["finish_reason"] == "stop"


def test_chat_completions_requires_user_message():
    client = TestClient(backend_main.api)

    response = client.post(
        "/api/chat/completions",
        json={
            "model": "default",
            "messages": [{"role": "assistant", "content": "Здравствуйте"}],
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "message": "At least one user message is required",
            "type": "invalid_request_error",
            "code": "missing_user_message",
        }
    }
