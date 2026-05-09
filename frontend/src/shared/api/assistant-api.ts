import type { ChatCompletionRequest, ChatCompletionResponse } from './types';

export interface AssistantApi {
  createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;
}

export interface MockAssistantApiOptions {
  delayMs?: number;
}

export class MockAssistantApi implements AssistantApi {
  private readonly delayMs: number;

  constructor(options: MockAssistantApiOptions = {}) {
    this.delayMs = options.delayMs ?? 600;
  }

  async createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    if (this.delayMs > 0) {
      await delay(this.delayMs);
    }

    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === 'user');

    return {
      id: createCompletionId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: createMockResponse(lastUserMessage?.content),
          },
          finish_reason: 'stop',
        },
      ],
    };
  }
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly type?: string;

  constructor(message: string, status: number, code?: string, type?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.type = type;
  }
}

type Fetcher = typeof fetch;

export class RestAssistantApi implements AssistantApi {
  private readonly apiBaseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(apiBaseUrl: string, fetcher: Fetcher = fetch) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    this.fetcher = fetcher;
  }

  async createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    const response = await this.fetcher(
      `${this.apiBaseUrl}/api/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      const error = payload?.error;

      throw new ApiRequestError(
        error?.message ?? 'Assistant request failed',
        response.status,
        error?.code,
        error?.type,
      );
    }

    return payload as ChatCompletionResponse;
  }
}

function createMockResponse(userContent = ''): string {
  const normalizedContent = userContent.trim();

  if (!normalizedContent) {
    return 'Я готов помочь. Напишите сообщение, и мы начнем диалог.';
  }

  return `Mock-ответ ассистента на сообщение: "${normalizedContent}"`;
}

function createCompletionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `chatcmpl_mock_${crypto.randomUUID()}`;
  }

  return `chatcmpl_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
