export type ChatCompletionRole = 'system' | 'user' | 'assistant';

export interface ChatCompletionMessage {
  role: ChatCompletionRole;
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  web_search?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
}

export interface ApiError {
  message: string;
  type: string;
  code: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}
