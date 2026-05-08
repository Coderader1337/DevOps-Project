# Контракт API между frontend и backend

Документ описывает ожидаемый REST-контракт для AI-чата. Контракт разделен на обязательный MVP API и опциональный future API для серверного хранения истории.

- пользователь работает без регистрации и авторизации;
- frontend может хранить чаты и сообщения локально;
- backend обязателен только для обработки сообщения и генерации ответа ассистента;
- серверное хранение истории не является обязательным для MVP.

Backend предоставляет минимальный OpenAI-compatible-like endpoint для генерации ответа ассистента. Frontend не обращается напрямую к OpenAI API или другому LLM-провайдеру; все запросы идут только на backend приложения.

## Режимы frontend

Frontend настраивается через переменные окружения Vite:

```text
VITE_API_MODE=mock|real
VITE_HISTORY_MODE=local|remote
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_MODEL=default
```

Значения по умолчанию для MVP:

```text
VITE_API_MODE=mock
VITE_HISTORY_MODE=local
```

Production режим без авторизации:

```text
VITE_API_MODE=real
VITE_HISTORY_MODE=local
```

Назначение переменных:

- `VITE_API_MODE` определяет источник ответа ассистента;
- `VITE_HISTORY_MODE` определяет источник истории чатов;
- `VITE_API_BASE_URL` задает базовый URL backend для REST-запросов.
- `VITE_DEFAULT_MODEL` задает модель, которая передается в OpenAI-compatible request body.

Режим `remote` для истории зарезервирован на будущее, но не реализуется в MVP.

## Обязательный MVP API

### `ChatCompletionMessage`

Минимальный формат сообщения в OpenAI-compatible style:

```ts
type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
```

Поля:

- `role` — роль сообщения в диалоге;
- `content` — текст сообщения.

В MVP обязательны роли `user` и `assistant`. Роль `system` допускается, но не обязательна.

### `GET /api/health`

Проверяет доступность backend.

Успешный ответ `200 OK`:

```json
{
  "status": "ok"
}
```

### `POST /api/chat/completions`

OpenAI-compatible-like endpoint для отправки текущего контекста сообщений на backend и получения ответа ассистента.

Endpoint реализует только минимальную часть Chat Completions API, необходимую для MVP. Полная совместимость с OpenAI API не требуется.

Endpoint не обязан:

- создавать чат на backend;
- хранить историю сообщений;
- знать пользователя;
- синхронизировать историю между устройствами.

Пример запроса:

```json
{
  "model": "default",
  "messages": [
    {
      "role": "user",
      "content": "Привет"
    }
  ]
}
```

Пример успешного ответа `200 OK`:

```json
{
  "id": "chat_001",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "default",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Привет! Чем могу помочь?"
      },
      "finish_reason": "stop"
    }
  ]
}
```

В MVP рабочим endpoint считается `POST /api/chat/completions`.

Frontend не обязан поддерживать все поля OpenAI Chat Completions API. Для MVP достаточно:

- `model`;
- `messages`;
- `choices[0].message.content`.

Streaming, tools, function calling, usage, temperature, top_p и другие расширенные параметры не входят в MVP.

## Поток данных MVP

1. Frontend хранит чаты и сообщения через локальный слой хранения.
2. Пользователь отправляет сообщение.
3. Frontend сохраняет сообщение пользователя локально.
4. Frontend отправляет текущий контекст сообщений на backend через `POST /api/chat/completions` в OpenAI-compatible формате.
5. Backend возвращает ответ ассистента.
6. Frontend сохраняет ответ ассистента локально.
7. UI перечитывает состояние через слой данных, не обращаясь напрямую к `localStorage` или `fetch`.

## Ошибки

Рекомендуемый формат ошибки:

```json
{
  "error": {
    "message": "Assistant service is unavailable",
    "type": "server_error",
    "code": "assistant_unavailable"
  }
}
```

Формат ошибки приближен к OpenAI-compatible style, но для MVP достаточно полей `message`, `type` и `code`.

Рекомендуемые HTTP-коды:

- `400 Bad Request` — некорректный запрос;
- `429 Too Many Requests` — превышен лимит запросов;
- `500 Internal Server Error` — внутренняя ошибка backend;
- `503 Service Unavailable` — сервис ассистента временно недоступен.

## Optional future API: серверная история

Эти endpoints не входят в обязательный MVP. Они нужны только если появятся авторизация, пользователи и серверное хранение истории.

### `GET /api/chats`

Возвращает список чатов пользователя.

### `POST /api/chats`

Создает новый серверный чат.

### `GET /api/chats/{chatId}/messages`

Возвращает сообщения выбранного серверного чата.

### `POST /api/chats/{chatId}/messages`

Отправляет сообщение в серверный чат, если в будущем будет реализовано серверное хранение истории. В MVP этот endpoint не используется, так как история хранится локально, а ответ ассистента получается через `POST /api/chat/completions`.
