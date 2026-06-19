from pydantic import BaseModel, Field
<<<<<<< HEAD
from typing import Literal, Optional
=======
from typing import Literal
>>>>>>> 39e2fbb (Working LLM)


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    message: str
    model: str
<<<<<<< HEAD
=======


ChatCompletionRole = Literal["system", "user", "assistant"]
FinishReason = Literal["stop", "length", "content_filter"] | None


class ChatCompletionMessage(BaseModel):
    role: ChatCompletionRole
    content: str = Field(..., min_length=1)


class ChatCompletionRequest(BaseModel):
    model: str = Field(default="default", min_length=1)
    messages: list[ChatCompletionMessage] = Field(..., min_length=1)


class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatCompletionMessage
    finish_reason: FinishReason = "stop"


class ChatCompletionResponse(BaseModel):
    id: str
    object: Literal["chat.completion"] = "chat.completion"
    created: int
    model: str
    choices: list[ChatCompletionChoice]


class ApiError(BaseModel):
    message: str
    type: str
    code: str


class ApiErrorResponse(BaseModel):
    error: ApiError
>>>>>>> 39e2fbb (Working LLM)
