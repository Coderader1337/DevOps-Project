# DevOps AI Chat: описание проекта

## 1. Возможности

DevOps AI Chat - это локально разворачиваемое AI-chat приложение с frontend,
backend, LLM-сервисом и reverse proxy.

Основные возможности:

- диалоговый chat UI с локальной историей чатов в браузере;
- создание, удаление и очистка истории чатов;
- OpenAI-compatible-like endpoint `POST /api/chat/completions`;
- подключение локальной LLM через Ollama;
- режим host Ollama для MacBook с Metal/MPS ускорением;
- явный web search режим через кнопку `Поиск` в интерфейсе;
- MCP tools для web search/fetch через backend;
- диалоговая память: backend получает историю сообщений, а при превышении лимита сжимает старую часть диалога в summary;
- runtime context для даты, времени и timezone;
- запуск через Docker Compose;
- единая точка входа через nginx на `http://localhost:8080`;
- доступ из локальной сети через `http://LAN_IP:8080`


## 2. Технологический стек

Frontend:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- localStorage как MVP-хранилище истории;
- Vitest и React Testing Library;
- Playwright для e2e-тестов.

Backend:

- Python;
- FastAPI;
- Pydantic;
- Uvicorn;
- LangChain;
- LangChain Ollama;
- LangChain MCP adapters;
- MCP tools для интернет-поиска и fetch;
- in-memory session memory для legacy endpoint `/chat`;
- compaction/summarization старого контекста перед вызовом LLM.

Model layer:

- Ollama;
- основная модель по умолчанию: `qwen2.5:14b`;
- container Ollama для обычного compose;
- host Ollama для MacBook/MPS через `docker-compose.mps.yml`.

Infrastructure:

- Docker;
- Docker Compose;
- nginx как edge proxy;
- Cloudflare Tunnel, localtunnel и bore как опциональные публичные туннели.

## 3. Архитектура

### Компоненты

```text
Browser
  |
  | HTTP :8080
  v
nginx edge proxy
  |---------------------> frontend nginx container
  |
  | /api/*
  v
FastAPI backend
  |
  | LangChain / HTTP
  v
Ollama
  |
  v
qwen2.5:14b
```

В MPS-режиме Ollama запускается не в Docker, а на macOS host:

```text
FastAPI backend container
  |
  | http://host.docker.internal:11434
  v
Host Ollama on MacBook
```

### Поток сообщения

1. Пользователь вводит сообщение во frontend.
2. Frontend сохраняет сообщение в локальную историю чата.
3. Frontend отправляет текущий контекст сообщений на backend:

```http
POST /api/chat/completions
```

4. Backend валидирует запрос.
5. Backend проверяет размер контекста.
6. Если контекст большой, backend сжимает старые сообщения в summary.
7. Backend добавляет системный runtime context с датой, временем и timezone.
8. Если в UI включена кнопка `Поиск`, backend получает web context через MCP search tool.
9. Backend отправляет подготовленные сообщения в Ollama.
10. Backend возвращает ответ в OpenAI-compatible-like формате.
11. Frontend сохраняет ответ ассистента локально.

### Память диалога

Frontend хранит историю чата локально и при каждом запросе отправляет backend весь
доступный контекст. Backend дополнительно защищает LLM от слишком большого
контекста:

- `MEMORY_CONTEXT_CHAR_BUDGET=24000` - примерный лимит размера истории;
- `MEMORY_RECENT_MESSAGES=12` - количество свежих сообщений, которые сохраняются без сжатия;
- `MEMORY_SUMMARY_TARGET_CHARS=4000` - целевой размер summary старых сообщений.

Если история превышает лимит, старые сообщения превращаются в системную память,
а последние сообщения остаются в исходном виде.

### Интернет-поиск

Поиск не включается автоматически по ключевым словам. Он включается только явно,
когда пользователь нажимает кнопку `Поиск` в UI. Frontend отправляет:

```json
{
  "web_search": true
}
```

Backend при этом вызывает MCP DuckDuckGo search tool и добавляет результаты как
дополнительный контекст перед вызовом LLM.

## 4. Версии библиотек

### Docker images

| Компонент | Версия |
| --- | --- |
| Backend base image | `python:3.12-slim` |
| Frontend build image | `node:20-alpine` |
| Frontend runtime image | `nginxinc/nginx-unprivileged:1.27-alpine` |
| Model image | `ollama/ollama:0.20.5` |
| Public TCP tunnel | `ekzhang/bore:latest` |
| Cloudflare tunnel | `cloudflare/cloudflared:latest` |

### Frontend dependencies

| Библиотека | Версия |
| --- | --- |
| `react` | `^18.3.1` |
| `react-dom` | `^18.3.1` |
| `@vitejs/plugin-react` | `^4.3.4` |

### Frontend devDependencies

| Библиотека | Версия |
| --- | --- |
| `@playwright/test` | `^1.59.1` |
| `@testing-library/jest-dom` | `^6.6.3` |
| `@testing-library/react` | `^16.1.0` |
| `@testing-library/user-event` | `^14.5.2` |
| `@types/node` | `^22.10.2` |
| `@types/react` | `^18.3.18` |
| `@types/react-dom` | `^18.3.5` |
| `autoprefixer` | `^10.4.20` |
| `jsdom` | `^25.0.1` |
| `postcss` | `^8.4.49` |
| `tailwindcss` | `^3.4.17` |
| `typescript` | `~5.7.2` |
| `vite` | `^5.4.11` |
| `vitest` | `^2.1.8` |

### Backend dependencies

В `app/backend/requirements.txt` версии не закреплены. Фактические версии в
текущем backend image:

| Библиотека | Версия |
| --- | --- |
| `fastapi` | `0.137.2` |
| `uvicorn` | `0.49.0` |
| `pydantic` | `2.13.4` |
| `langchain` | `1.3.10` |
| `langchain-ollama` | `1.1.0` |
| `langchain-mcp-adapters` | `0.3.0` |
| `langgraph` | `1.2.6` |
| `uv` | `0.11.23` |

Root Flask demo app dependencies:

| Библиотека | Версия |
| --- | --- |
| `flask` | `3.1.3` |
| `gunicorn` | `22.0.0` |

Проверить фактические версии backend:

```bash
docker run --rm devops-project-backend python -m pip freeze
```

## 5. Как запустить приложение

### Вариант A: запуск полностью в Docker Compose

Этот режим поднимает `nginx`, `frontend`, `backend` и container Ollama.

```bash
docker compose up --build -d
```

Открыть:

```text
http://localhost:8080
```

Проверить backend:

```bash
curl http://localhost:8080/api/health
```

Остановить:

```bash
docker compose down
```

### Вариант B: запуск на MacBook с Ollama на MPS/Metal

Этот режим рекомендуется для MacBook, потому что Docker на macOS не дает
Ollama нормальный доступ к Metal/MPS.

1. Установить и запустить Ollama на macOS.
2. Скачать модель:

```bash
ollama pull qwen2.5:14b
```

3. Поднять frontend, backend и nginx:

```bash
docker compose -f docker-compose.mps.yml up --build -d
```

4. Открыть:

```text
http://localhost:8080
```

5. Проверить:

```bash
curl http://localhost:8080/api/health
```

### Доступ с телефона в той же локальной сети

Узнать LAN IP MacBook:

```bash
./scripts/lan-url.sh
```

Пример:

```text
http://192.168.1.72:8080
```

Телефон должен быть в той же сети, а сеть не должна блокировать client-to-client
доступ.

### Публичный доступ из интернета через host:port

Для доступа не из локальной сети используйте `bore`:

```bash
docker compose -f docker-compose.mps.yml --profile public-port up -d bore
docker compose -f docker-compose.mps.yml logs -f bore
```

В логах будет строка:

```text
listening at bore.pub:63139
```

Открывать с телефона:

```text
http://bore.pub:63139
```

Остановить публичный доступ:

```bash
docker compose -f docker-compose.mps.yml stop bore
```

После перезапуска `bore` порт может измениться.

### Альтернативные публичные туннели

Cloudflare Tunnel:

```bash
docker compose -f docker-compose.mps.yml --profile public up -d cloudflared
docker compose -f docker-compose.mps.yml logs -f cloudflared
```

localtunnel:

```bash
docker compose -f docker-compose.mps.yml --profile public-lt up -d localtunnel
docker compose -f docker-compose.mps.yml logs -f localtunnel
```

### Проверки

Backend tests:

```bash
docker run --rm -v "$PWD":/src -w /src devops-project-backend \
  sh -lc 'python -m pip install -q -r requirements.txt pytest httpx && python -m pytest'
```

Frontend build:

```bash
docker compose build frontend
```

Compose config validation:

```bash
docker compose config
docker compose -f docker-compose.mps.yml config
```
