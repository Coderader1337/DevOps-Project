from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_ollama import ChatOllama
import asyncio
import os
from agent_tools import *
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

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
