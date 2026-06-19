import os

from langchain_mcp_adapters.client import MultiServerMCPClient


async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "fetch": {
                "transport": "stdio",
                "command": "uvx",
                "args": ["mcp-server-fetch"],
            },
            "duckduckgo": {
                "transport": "stdio",
                "command": "uvx",
                "args": ["duckduckgo-mcp-server"],
                "env": {
                    "DDG_SAFE_SEARCH": os.getenv("DDG_SAFE_SEARCH", "MODERATE"),
                    "DDG_REGION": os.getenv("DDG_REGION", "wt-wt"),
                },
            },
        }
    )

    return await client.get_tools()
