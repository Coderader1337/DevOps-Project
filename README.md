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

Локально, без Docker:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run test
```

## Переменные окружения frontend

Файл примера находится в [frontend/.env.example].

```text
VITE_API_MODE=mock
VITE_HISTORY_MODE=local
VITE_API_BASE_URL=http://localhost:8080
```

- `VITE_API_MODE=mock|real` задает источник ответа ассистента.
- `VITE_HISTORY_MODE=local|remote` задает источник истории чатов.

## API

Контракт frontend/backend описан в [docs/api-contract.md].