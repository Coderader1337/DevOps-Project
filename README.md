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

Запустить production-сборку через nginx:

```bash
docker compose up --build frontend-prod
```

Production-версия будет доступна по адресу:

```text
http://localhost:8080
```

Остановить контейнеры:

```bash
docker compose down
```

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
docker compose up --build -d frontend-prod
curl -I http://localhost:8080
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
