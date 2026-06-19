# DevOps Project

## Структура проекта

## Frontend

Стек:

- React;
- Vite;
- TypeScript;
- Tailwind CSS;
- Vitest;
- React Testing Library;
- jsdom;
- Playwright;
- Docker Compose.

Перейти в frontend:

```bash
cd frontend
```

Запустить dev-сервер:

```bash
docker compose up frontend-dev
```

Приложение будет доступно по адресу:

```text
http://localhost:5173
```

Создать локальный самоподписанный TLS-сертификат для edge nginx:

```bash
mkdir -p certs
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout certs/local.key \
  -out certs/local.crt \
  -days 365 \
  -subj "/CN=localhost"
chmod 0444 certs/local.crt certs/local.key
```

Запустить production-сборку через единую nginx-точку входа:

```bash
docker compose up --build nginx
```

Production-версия будет доступна по адресу:

```text
https://localhost
```

Остановить контейнеры:

```bash
docker compose down
```

## Доступ с другого устройства

Локально приложение доступно на:

```text
http://localhost:8080
```

Чтобы открыть его с устройства вне локальной сети, запустите Cloudflare Tunnel:

```bash
docker compose --profile public up -d cloudflared
docker compose logs -f cloudflared
```

Для MPS/host Ollama режима используйте:

```bash
docker compose -f docker-compose.mps.yml --profile public up -d cloudflared
docker compose -f docker-compose.mps.yml logs -f cloudflared
```

В логах появится публичная ссылка вида:

```text
https://example.trycloudflare.com
```

Откройте эту ссылку на другом устройстве. Туннель временный: после перезапуска
`cloudflared` ссылка может измениться. Не публикуйте ссылку, если не хотите,
чтобы посторонние могли открыть ваш чат.

Если Cloudflare Tunnel не может подключиться из-за ограничений сети, используйте
fallback через localtunnel:

```bash
docker compose -f docker-compose.mps.yml --profile public-lt up -d localtunnel
docker compose -f docker-compose.mps.yml logs -f localtunnel
```

В логах будет URL вида `https://example.loca.lt`.

Если нужен именно публичный адрес с портом, запустите TCP-туннель через bore:

```bash
docker compose -f docker-compose.mps.yml --profile public-port up -d bore
docker compose -f docker-compose.mps.yml logs -f bore
```

В логах будет адрес вида:

```text
bore.pub:12345
```

На телефоне открывайте:

```text
http://bore.pub:12345
```

Сервис `nginx` принимает внешние HTTP/HTTPS-запросы на портах `80` и `443`, перенаправляет HTTP на HTTPS и проксирует frontend-приложение. `frontend-prod` не публикует собственный порт наружу и доступен только внутри Docker-сети.

Сети в `docker-compose.yml` разделены на `frontend_public`, `frontend_api` и зарезервированную `backend_private` для будущих backend/db/redis сервисов.

## Проверки

Сборка внутри dev-контейнера:

```bash
cd frontend
docker compose run --rm frontend-dev npm run build
```

Тесты внутри dev-контейнера:

```bash
cd frontend
docker compose run --rm frontend-dev npm run test
```

E2E-тесты в согласованном Playwright-контейнере:

```bash
cd frontend
docker compose run --rm frontend-e2e
```

Проверка production-контейнера:

```bash
cd frontend
docker compose up --build -d nginx
curl -k -I https://localhost
docker compose down
```

Локально, без Docker:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
```

Перед каждым e2e-сценарием локальное состояние приложения очищается, поэтому тест начинается с пустой истории чатов.

## Переменные окружения frontend

Файл примера находится в [frontend/.env.example].

```text
VITE_API_MODE=mock
VITE_HISTORY_MODE=local
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_MODEL=default
```

- `VITE_API_MODE=mock|real` задает источник ответа ассистента.
- `VITE_HISTORY_MODE=local|remote` задает источник истории чатов.
- `VITE_DEFAULT_MODEL` задает модель для OpenAI-compatible-like запроса к backend.

В dev-контейнере эти переменные передаются как runtime environment для Vite dev server.

В production-контейнере Vite подставляет `VITE_*` на этапе `npm run build`. Поэтому для `frontend-prod` переменные передаются через Docker build args. Изменение `VITE_API_BASE_URL` после сборки nginx-контейнера не изменит уже собранный frontend. Runtime-конфигурация через отдельный `config.json` не входит в MVP.

## API

Контракт frontend/backend описан в [docs/api-contract.md].
