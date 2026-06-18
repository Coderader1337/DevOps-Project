from langchain_mcp_adapters.client import MultiServerMCPClient


async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "filesystem": {
                "transport": "stdio",
                "command": "npx",
                "args": [
                    "-y",
                    "@modelcontextprotocol/server-filesystem",
                    "/app/workspace",
                ],
            },

            # Чтение конкретных web-страниц по URL
            "fetch": {
                "transport": "stdio",
                "command": "uvx",
                "args": [
                    "mcp-server-fetch",
                ],
            },

            # Поиск в интернете без API ключей
            "duckduckgo": {
                "transport": "stdio",
                "command": "uvx",
                "args": [
                    "duckduckgo-mcp-server",
                ],
                "env": {
                    "DDG_SAFE_SEARCH": "MODERATE",
                    "DDG_REGION": "wt-wt",
                },
            },
        }
    )

    tools = await client.get_tools()
    return tools