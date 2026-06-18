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


