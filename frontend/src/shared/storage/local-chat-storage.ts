import type {
  Chat,
  CreateChatInput,
  CreateMessageInput,
  Message,
} from './types';

interface ChatStorageState {
  chats: Chat[];
  messagesByChatId: Record<string, Message[]>;
}

export interface ChatStorage {
  listChats(): Promise<Chat[]>;
  createChat(input?: CreateChatInput): Promise<Chat>;
  deleteChat(chatId: string): Promise<void>;
  getMessages(chatId: string): Promise<Message[]>;
  addMessage(input: CreateMessageInput): Promise<Message>;
  clear(): Promise<void>;
}

const DEFAULT_STORAGE_KEY = 'devops-ai-chat:history';

const initialState: ChatStorageState = {
  chats: [],
  messagesByChatId: {},
};

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export class LocalChatStorage implements ChatStorage {
  private readonly storageKey: string;
  private readonly storage: BrowserStorage;

  constructor(
    storage: BrowserStorage = window.localStorage,
    storageKey = DEFAULT_STORAGE_KEY,
  ) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  async listChats(): Promise<Chat[]> {
    return [...this.readState().chats].sort(compareUpdatedDesc);
  }

  async createChat(input: CreateChatInput = {}): Promise<Chat> {
    const state = this.readState();
    const now = new Date().toISOString();
    const chat: Chat = {
      id: createId('chat'),
      title: input.title?.trim() || 'Новый чат',
      createdAt: now,
      updatedAt: now,
    };

    this.writeState({
      chats: [chat, ...state.chats],
      messagesByChatId: {
        ...state.messagesByChatId,
        [chat.id]: [],
      },
    });

    return chat;
  }

  async deleteChat(chatId: string): Promise<void> {
    const state = this.readState();
    const { [chatId]: _deletedMessages, ...messagesByChatId } =
      state.messagesByChatId;

    this.writeState({
      chats: state.chats.filter((chat) => chat.id !== chatId),
      messagesByChatId,
    });
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return [...(this.readState().messagesByChatId[chatId] ?? [])].sort(
      compareCreatedAsc,
    );
  }

  async addMessage(input: CreateMessageInput): Promise<Message> {
    const state = this.readState();
    const chat = state.chats.find((item) => item.id === input.chatId);

    if (!chat) {
      throw new Error(`Chat "${input.chatId}" was not found`);
    }

    const now = new Date().toISOString();
    const message: Message = {
      id: createId('msg'),
      chatId: input.chatId,
      role: input.role,
      content: input.content,
      createdAt: now,
    };

    const existingMessages = state.messagesByChatId[input.chatId] ?? [];
    const updatedChat: Chat = {
      ...chat,
      title: getNextChatTitle(chat, input.content),
      updatedAt: now,
    };

    this.writeState({
      chats: state.chats.map((item) =>
        item.id === input.chatId ? updatedChat : item,
      ),
      messagesByChatId: {
        ...state.messagesByChatId,
        [input.chatId]: [...existingMessages, message],
      },
    });

    return message;
  }

  async clear(): Promise<void> {
    this.storage.removeItem(this.storageKey);
  }

  private readState(): ChatStorageState {
    const rawState = this.storage.getItem(this.storageKey);

    if (!rawState) {
      return initialState;
    }

    try {
      const parsedState = JSON.parse(rawState) as Partial<ChatStorageState>;

      return {
        chats: Array.isArray(parsedState.chats) ? parsedState.chats : [],
        messagesByChatId:
          parsedState.messagesByChatId &&
          typeof parsedState.messagesByChatId === 'object'
            ? parsedState.messagesByChatId
            : {},
      };
    } catch {
      return initialState;
    }
  }

  private writeState(state: ChatStorageState): void {
    this.storage.setItem(this.storageKey, JSON.stringify(state));
  }
}

function getNextChatTitle(chat: Chat, content: string): string {
  if (chat.title !== 'Новый чат') {
    return chat.title;
  }

  const trimmedContent = content.trim();
  return trimmedContent ? trimmedContent.slice(0, 48) : chat.title;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function compareUpdatedDesc(left: Chat, right: Chat): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function compareCreatedAsc(left: Message, right: Message): number {
  return left.createdAt.localeCompare(right.createdAt);
}
