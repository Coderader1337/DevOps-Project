from fastapi.testclient import TestClient

from app.backend import backend_main


def test_api_health_endpoint():
    client = TestClient(backend_main.api)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_completions_endpoint(monkeypatch):
    async def fake_generate_assistant_reply(messages, model, web_search=False):
        assert model == "default"
        assert web_search is False
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


def test_chat_completions_passes_web_search_flag(monkeypatch):
    async def fake_generate_assistant_reply(messages, model, web_search=False):
        assert web_search is True
        return "Нашел через поиск."

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
            "web_search": True,
            "messages": [{"role": "user", "content": "Найди сайт OpenAI"}],
        },
    )

    assert response.status_code == 200
    assert response.json()["choices"][0]["message"]["content"] == "Нашел через поиск."


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


def test_legacy_chat_keeps_session_memory(monkeypatch):
    seen_message_counts = []

    async def fake_generate_assistant_reply(messages, model, web_search=False):
        seen_message_counts.append(len(messages))
        return f"Ответ {len(messages)}"

    monkeypatch.setattr(
        backend_main,
        "generate_assistant_reply",
        fake_generate_assistant_reply,
    )
    backend_main.legacy_chat_memory.clear()
    client = TestClient(backend_main.api)

    first_response = client.post(
        "/chat",
        json={"message": "Меня зовут Артур", "session_id": "memory-test"},
    )
    second_response = client.post(
        "/chat",
        json={"message": "Как меня зовут?", "session_id": "memory-test"},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert seen_message_counts == [1, 3]
    assert second_response.json()["message"] == "Ответ 3"
