import asyncio
import logging
import os
import time
import uuid
from collections import defaultdict, deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from agent_main import generate_assistant_reply
    from working_classes import (
        ApiErrorResponse,
        ChatCompletionChoice,
        ChatCompletionMessage,
        ChatCompletionRequest,
        ChatCompletionResponse,
        ChatRequest,
        ChatResponse,
    )
except ImportError:
    from .agent_main import generate_assistant_reply
    from .working_classes import (
        ApiErrorResponse,
        ChatCompletionChoice,
        ChatCompletionMessage,
        ChatCompletionRequest,
        ChatCompletionResponse,
        ChatRequest,
        ChatResponse,
    )


api = FastAPI(title="AI Chat Backend")
logger = logging.getLogger("backend.chat")
LEGACY_SESSION_MAX_MESSAGES = int(os.getenv("LEGACY_SESSION_MAX_MESSAGES", "80"))
legacy_chat_memory: defaultdict[str, deque[ChatCompletionMessage]] = defaultdict(
    lambda: deque(maxlen=LEGACY_SESSION_MAX_MESSAGES)
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOW_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080",
    ).split(",")
    if origin.strip()
]

api.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def api_error(
    message: str,
    error_type: str,
    code: str,
    status_code: int,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "message": message,
                "type": error_type,
                "code": code,
            }
        },
    )


@api.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return api_error(
        "Invalid chat completion request",
        "invalid_request_error",
        "invalid_request",
        400,
    )


@api.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {}

    return api_error(
        detail.get("message", str(exc.detail)),
        detail.get("type", "server_error"),
        detail.get("code", "server_error"),
        exc.status_code,
    )


@api.get("/api/health")
async def api_health() -> dict[str, str]:
    return {"status": "ok"}


@api.get("/health")
async def health() -> dict[str, str]:
    return await api_health()


@api.post(
    "/api/chat/completions",
    response_model=ChatCompletionResponse,
    responses={
        400: {"model": ApiErrorResponse},
        500: {"model": ApiErrorResponse},
        503: {"model": ApiErrorResponse},
    },
)
async def create_chat_completion(
    request: ChatCompletionRequest,
) -> ChatCompletionResponse:
    if not any(message.role == "user" for message in request.messages):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "At least one user message is required",
                "type": "invalid_request_error",
                "code": "missing_user_message",
            },
        )

    last_error: Exception | None = None

    for attempt in range(3):
        try:
            answer = await generate_assistant_reply(
                request.messages,
                request.model,
                web_search=request.web_search,
            )
            break
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Assistant generation failed on attempt %s/3: %s",
                attempt + 1,
                exc,
            )

            if attempt < 2:
                await asyncio.sleep(2)
    else:
        logger.exception("Assistant service is unavailable", exc_info=last_error)
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Assistant service is unavailable",
                "type": "server_error",
                "code": "assistant_unavailable",
            },
        ) from last_error

    return ChatCompletionResponse(
        id=f"chatcmpl_{uuid.uuid4().hex}",
        created=int(time.time()),
        model=request.model,
        choices=[
            ChatCompletionChoice(
                index=0,
                message=ChatCompletionMessage(role="assistant", content=answer),
                finish_reason="stop",
            )
        ],
    )


@api.post("/chat", response_model=ChatResponse)
async def post_message(request: ChatRequest) -> ChatResponse:
    message = ChatCompletionMessage(role="user", content=request.message)
    session_messages = legacy_chat_memory[request.session_id]
    session_messages.append(message)

    response = await create_chat_completion(
        ChatCompletionRequest(
            model=os.getenv("OLLAMA_MODEL", "default"),
            messages=list(session_messages),
            web_search=False,
        )
    )
    session_messages.append(response.choices[0].message)

    return ChatResponse(
        message=response.choices[0].message.content,
        model=response.model,
    )
