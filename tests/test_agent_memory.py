import asyncio

from app.backend import agent_main
from app.backend.working_classes import ChatCompletionMessage


async def fake_summarize_old_messages(messages, model):
    assert model == "default"
    return f"summary for {len(messages)} old messages"


def make_user_message(index: int) -> ChatCompletionMessage:
    return ChatCompletionMessage(role="user", content=f"message {index} " * 10)


def test_compact_messages_keeps_small_context():
    messages = [make_user_message(1)]

    compacted = asyncio.run(agent_main.compact_messages_if_needed(messages, "default"))

    assert compacted == messages


def test_compact_messages_summarizes_old_context(monkeypatch):
    monkeypatch.setattr(agent_main, "MEMORY_CONTEXT_CHAR_BUDGET", 120)
    monkeypatch.setattr(agent_main, "MEMORY_RECENT_MESSAGES", 2)
    monkeypatch.setattr(
        agent_main,
        "summarize_old_messages",
        fake_summarize_old_messages,
    )
    messages = [make_user_message(index) for index in range(5)]

    compacted = asyncio.run(agent_main.compact_messages_if_needed(messages, "default"))

    assert len(compacted) == 3
    assert compacted[0].role == "system"
    assert "summary for 3 old messages" in compacted[0].content
    assert compacted[1:] == messages[-2:]
