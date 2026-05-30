export type StoredMessageRole = 'user' | 'assistant';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: StoredMessageRole;
  content: string;
  createdAt: string;
}

export interface CreateChatInput {
  title?: string;
}

export interface CreateMessageInput {
  chatId: string;
  role: StoredMessageRole;
  content: string;
}
