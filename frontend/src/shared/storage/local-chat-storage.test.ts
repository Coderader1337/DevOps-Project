import { beforeEach, describe, expect, it } from 'vitest';

import { LocalChatStorage } from './local-chat-storage';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('LocalChatStorage', () => {
  let storage: LocalChatStorage;

  beforeEach(() => {
    storage = new LocalChatStorage(new MemoryStorage(), 'test-history');
  });

  it('creates and reads a local chat', async () => {
    const chat = await storage.createChat({ title: 'План проекта' });

    await expect(storage.listChats()).resolves.toEqual([chat]);
  });

  it('saves and reads messages for a chat', async () => {
    const chat = await storage.createChat();
    const userMessage = await storage.addMessage({
      chatId: chat.id,
      role: 'user',
      content: 'Привет',
    });
    const assistantMessage = await storage.addMessage({
      chatId: chat.id,
      role: 'assistant',
      content: 'Привет! Чем могу помочь?',
    });

    await expect(storage.getMessages(chat.id)).resolves.toEqual([
      userMessage,
      assistantMessage,
    ]);
  });

  it('updates default chat title from the first message', async () => {
    const chat = await storage.createChat();

    await storage.addMessage({
      chatId: chat.id,
      role: 'user',
      content: 'Как запустить frontend?',
    });

    await expect(storage.listChats()).resolves.toEqual([
      expect.objectContaining({
        id: chat.id,
        title: 'Как запустить frontend?',
      }),
    ]);
  });
});
