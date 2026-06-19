<<<<<<< HEAD
import os
import json
from typing import Dict, Any

from fastapi import FastAPI, HTTPException

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory

from working_classes import *
from agent_main import agent

api = FastAPI(title="Ollama Backend")


chat_histories: Dict[str, InMemoryChatMessageHistory] = {}


@api.get("/health")
async def health():
    return {
        "status": "ok",
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
        "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
    }



@api.post("/chat", response_model=ChatResponse)
async def post_message(request: ChatRequest):
    try:
        
        response = await agent.ainvoke(
            {"message":request.message}
        )

        return {
            "message": response,
            "model":os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        }
    except:
        return {
            "message" : "Error:200",
            "model":os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        }


=======
import asyncio
import logging
import os
import time
import uuid

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
            answer = await generate_assistant_reply(request.messages, request.model)
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
    response = await create_chat_completion(
        ChatCompletionRequest(
            model=os.getenv("OLLAMA_MODEL", "default"),
            messages=[message],
        )
    )

    return ChatResponse(
        message=response.choices[0].message.content,
        model=response.model,
    )
>>>>>>> 39e2fbb (Working LLM)
