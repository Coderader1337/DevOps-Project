from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
import asyncio
import os
from agent_tools import *
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
=======
import os
from functools import lru_cache

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

try:
    from working_classes import ChatCompletionMessage
except ImportError:
    from .working_classes import ChatCompletionMessage


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIME_OUT = int(os.getenv("OLLAMA_TIME_OUT", "120"))





llm = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL,
    temperature=1.0,
    timeout=OLLAMA_TIME_OUT,
)

prompt = ChatPromptTemplate(
    [("system","You are AI-agent helper. Yout must anwer on Russian"), 
     ("human", "{message}")])

tools = await get_mcp_tools()
llm.bind_tools(tools)

agent  = prompt | llm | StrOutputParser()
=======
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "256"))

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful AI assistant. Answer in Russian unless the user asks "
    "for another language."
)


@lru_cache(maxsize=16)
def get_llm(model: str) -> ChatOllama:
    selected_model = OLLAMA_MODEL if model == "default" else model

    return ChatOllama(
        model=selected_model,
        base_url=OLLAMA_BASE_URL,
        temperature=float(os.getenv("OLLAMA_TEMPERATURE", "0.7")),
        timeout=OLLAMA_TIME_OUT,
        num_predict=OLLAMA_NUM_PREDICT,
    )


def to_langchain_messages(
    messages: list[ChatCompletionMessage],
) -> list[BaseMessage]:
    langchain_messages: list[BaseMessage] = []
    has_system_message = False

    for message in messages:
        if message.role == "system":
            has_system_message = True
            langchain_messages.append(SystemMessage(content=message.content))
        elif message.role == "assistant":
            langchain_messages.append(AIMessage(content=message.content))
        else:
            langchain_messages.append(HumanMessage(content=message.content))

    if not has_system_message:
        langchain_messages.insert(0, SystemMessage(content=DEFAULT_SYSTEM_PROMPT))

    return langchain_messages


async def generate_assistant_reply(
    messages: list[ChatCompletionMessage],
    model: str = "default",
) -> str:
    response = await get_llm(model).ainvoke(to_langchain_messages(messages))
    content = getattr(response, "content", response)

    if isinstance(content, list):
        return "\n".join(str(item) for item in content)

    return str(content)
