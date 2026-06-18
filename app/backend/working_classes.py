from pydantic import BaseModel, Field
from typing import Literal, Optional


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    message: str
    model: str
