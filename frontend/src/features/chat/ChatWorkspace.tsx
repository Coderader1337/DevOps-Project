import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  createAssistantApi,
  runtimeConfig,
  type AssistantApi,
  type ChatCompletionMessage,
} from '../../shared/api';
import {
  createChatStorage,
  type Chat,
  type ChatStorage,
  type Message,
} from '../../shared/storage';

const defaultChatStorage = createChatStorage();
const defaultAssistantApi = createAssistantApi();

interface ChatWorkspaceProps {
  assistantApi?: AssistantApi;
  storage?: ChatStorage;
}

export function ChatWorkspace({
  assistantApi = defaultAssistantApi,
  storage = defaultChatStorage,
}: ChatWorkspaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      try {
        setIsLoading(true);
        setError(null);
        const loadedChats = await storage.listChats();

        if (!isMounted) {
          return;
        }

        setChats(loadedChats);
        setActiveChatId((currentChatId) =>
          currentChatId ?? loadedChats[0]?.id ?? null,
        );
      } catch {
        if (isMounted) {
          setError('Не удалось загрузить список диалогов.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadChats();

    return () => {
      isMounted = false;
    };
  }, [storage]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      try {
        setError(null);
        const loadedMessages = await storage.getMessages(activeChatId);

        if (isMounted) {
          setMessages(loadedMessages);
        }
      } catch {
        if (isMounted) {
          setError('Не удалось загрузить сообщения диалога.');
        }
      }
    }

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeChatId, storage]);

  async function handleCreateChat() {
    try {
      setError(null);
      const chat = await storage.createChat();
      const updatedChats = await storage.listChats();

      setChats(updatedChats);
      setActiveChatId(chat.id);
    } catch {
      setError('Не удалось создать новый чат.');
    }
  }

  async function handleDeleteChat(chatId: string) {
    try {
      setError(null);
      await storage.deleteChat(chatId);
      const updatedChats = await storage.listChats();

      setChats(updatedChats);

      if (chatId === activeChatId) {
        setActiveChatId(updatedChats[0]?.id ?? null);
        setMessages([]);
        setDraftMessage('');
      }
    } catch {
      setError('Не удалось удалить чат.');
    }
  }

  async function handleClearHistory() {
    try {
      setError(null);
      await storage.clear();
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      setDraftMessage('');
    } catch {
      setError('Не удалось очистить историю.');
    }
  }

  async function handleSubmitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draftMessage.trim();

    if (!content || isSending || isLoading) {
      return;
    }

    try {
      setError(null);
      setIsSending(true);
      setDraftMessage('');

      const targetChatId = activeChatId ?? (await storage.createChat()).id;
      const userMessage = await storage.addMessage({
        chatId: targetChatId,
        role: 'user',
        content,
      });
      const baseMessages = activeChatId ? messages : [];
      const nextMessages = [...baseMessages, userMessage];

      setActiveChatId(targetChatId);
      setMessages(nextMessages);
      setChats(await storage.listChats());

      const completion = await assistantApi.createChatCompletion({
        model: runtimeConfig.defaultModel,
        messages: toChatCompletionMessages(nextMessages),
      });
      const assistantContent =
        completion.choices[0]?.message.content.trim() ||
        'Не удалось получить текст ответа.';
      const assistantMessage = await storage.addMessage({
        chatId: targetChatId,
        role: 'assistant',
        content: assistantContent,
      });

      setMessages([...nextMessages, assistantMessage]);
      setChats(await storage.listChats());
    } catch {
      setError('Не удалось получить ответ ассистента. Попробуйте еще раз.');
    } finally {
      setIsSending(false);
    }
  }

  const canSendMessage = Boolean(draftMessage.trim() && !isSending && !isLoading);

  return (
    <main className="min-h-screen bg-paper-50 text-ink-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex border-b border-ink-950/10 bg-ink-950 text-paper-50 lg:min-h-screen lg:w-80 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex w-full flex-col gap-4 px-4 py-4 lg:px-5 lg:py-6">
            <div className="flex items-center justify-between gap-4 lg:block">
              <h1 className="font-display text-2xl leading-tight lg:text-3xl">
                AI Chat
              </h1>

              <span className="rounded-panel border border-paper-200/15 px-2.5 py-1 text-xs text-paper-200/70 lg:hidden">
                {runtimeConfig.apiMode}/{runtimeConfig.historyMode}
              </span>
            </div>

            <button
              className="rounded-panel border border-paper-200/20 bg-paper-50 px-4 py-3 text-left text-sm font-semibold text-ink-950 shadow-soft transition hover:bg-paper-100"
              onClick={handleCreateChat}
              type="button"
            >
              Новый чат
            </button>

            <nav
              aria-label="Список диалогов"
              className="min-h-28 flex-1 rounded-panel border border-paper-200/10 bg-paper-50/5 p-2 lg:min-h-0"
            >
              {isLoading ? (
                <p className="px-2 py-2 text-sm text-paper-200/80">
                  Загружаем диалоги...
                </p>
              ) : chats.length > 0 ? (
                <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible">
                  {chats.map((chat) => {
                    const isActive = chat.id === activeChatId;

                    return (
                      <li className="min-w-48 lg:min-w-0" key={chat.id}>
                        <div
                          className={`flex items-stretch gap-1 rounded-panel transition ${
                            isActive
                              ? 'bg-paper-50 text-ink-950 shadow-soft'
                              : 'text-paper-200/80 hover:bg-paper-50/10 hover:text-paper-50'
                          }`}
                        >
                          <button
                            aria-current={isActive ? 'page' : undefined}
                            className="min-w-0 flex-1 rounded-panel px-3 py-2 text-left text-sm"
                            onClick={() => setActiveChatId(chat.id)}
                            type="button"
                          >
                            <span className="block truncate font-medium">
                              {chat.title}
                            </span>
                            <span
                              className={`mt-1 block text-xs ${
                                isActive ? 'text-ink-700' : 'text-paper-200/50'
                              }`}
                            >
                              {formatChatDate(chat.updatedAt)}
                            </span>
                          </button>
                          <button
                            aria-label={`Удалить чат ${chat.title}`}
                            className={`my-1 mr-1 rounded-panel px-2 text-xs font-semibold transition ${
                              isActive
                                ? 'text-ink-700 hover:bg-ink-950/10 hover:text-ink-950'
                                : 'text-paper-200/50 hover:bg-paper-50/10 hover:text-paper-50'
                            }`}
                            onClick={() => void handleDeleteChat(chat.id)}
                            type="button"
                          >
                            Удалить
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-2 py-2 text-sm text-paper-200/80">
                  Диалоги появятся здесь.
                </p>
              )}
            </nav>

            <button
              className="rounded-panel border border-paper-200/15 px-4 py-2 text-left text-sm font-semibold text-paper-200/80 transition hover:bg-paper-50/10 hover:text-paper-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={chats.length === 0}
              onClick={handleClearHistory}
              type="button"
            >
              Очистить историю
            </button>

            <div className="hidden text-xs leading-relaxed text-paper-200/60 lg:block">
              API: {runtimeConfig.apiMode} · History: {runtimeConfig.historyMode}
            </div>
          </div>
        </aside>

        <section
          aria-label="Рабочая область чата"
          className="flex min-w-0 flex-1 flex-col bg-paper-50"
        >
          <div className="border-b border-ink-950/10 bg-paper-50/90 px-5 py-4">
            <h2 className="truncate text-lg font-semibold text-ink-950">
              {activeChat?.title ?? 'Новый диалог'}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              {!activeChat ? (
                <StartChatState
                  canSendMessage={canSendMessage}
                  draftMessage={draftMessage}
                  isSending={isSending}
                  onDraftMessageChange={setDraftMessage}
                  onSubmit={handleSubmitMessage}
                />
              ) : messages.length > 0 ? (
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                  {messages.map((message) => (
                    <MessageBubble message={message} key={message.id} />
                  ))}
                  {isSending ? <AssistantLoading /> : null}
                </div>
              ) : (
                <EmptyChatState text="Напишите первое сообщение, чтобы начать диалог." />
              )}
            </div>

            {error ? (
              <div className="border-t border-signal-500/20 bg-signal-500/10 px-5 py-3 text-sm text-ink-900">
                {error}
              </div>
            ) : null}

            {activeChat ? (
              <form
                className="border-t border-ink-950/10 bg-paper-50 px-4 py-4 lg:px-6"
                onSubmit={handleSubmitMessage}
              >
                <MessageComposer
                  canSendMessage={canSendMessage}
                  draftMessage={draftMessage}
                  isSending={isSending}
                  onDraftMessageChange={setDraftMessage}
                  placeholder="Введите сообщение"
                />
              </form>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function EmptyChatState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss-600">
          Пустой чат
        </p>
        <p className="mt-3 text-base leading-7 text-ink-700">{text}</p>
      </div>
    </div>
  );
}

interface StartChatStateProps {
  canSendMessage: boolean;
  draftMessage: string;
  isSending: boolean;
  onDraftMessageChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}

function StartChatState({
  canSendMessage,
  draftMessage,
  isSending,
  onDraftMessageChange,
  onSubmit,
}: StartChatStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <form className="w-full max-w-3xl" onSubmit={onSubmit}>
        <MessageComposer
          canSendMessage={canSendMessage}
          draftMessage={draftMessage}
          inputId="start-chat-message-input"
          isSending={isSending}
          onDraftMessageChange={onDraftMessageChange}
          placeholder="Введите сообщение, чтобы начать чат"
        />
      </form>
    </div>
  );
}

interface MessageComposerProps {
  canSendMessage: boolean;
  draftMessage: string;
  inputId?: string;
  isSending: boolean;
  onDraftMessageChange(value: string): void;
  placeholder: string;
}

function MessageComposer({
  canSendMessage,
  draftMessage,
  inputId = 'chat-message-input',
  isSending,
  onDraftMessageChange,
  placeholder,
}: MessageComposerProps) {
  return (
    <div className="mx-auto flex max-w-3xl gap-3">
      <label className="sr-only" htmlFor={inputId}>
        Сообщение
      </label>
      <textarea
        className="min-h-12 flex-1 resize-none rounded-panel border border-ink-950/15 bg-white px-4 py-3 text-sm leading-6 text-ink-950 shadow-sm transition placeholder:text-ink-700/50 focus:border-moss-600"
        disabled={isSending}
        id={inputId}
        onChange={(event) => onDraftMessageChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        value={draftMessage}
      />
      <button
        className="h-12 rounded-panel bg-moss-600 px-5 text-sm font-semibold text-paper-50 transition hover:bg-moss-500 disabled:cursor-not-allowed disabled:bg-ink-700/30 disabled:text-ink-700/60"
        disabled={!canSendMessage}
        type="submit"
      >
        Отправить
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-panel px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? 'bg-ink-950 text-paper-50'
            : 'border border-ink-950/10 bg-white text-ink-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </article>
  );
}

function AssistantLoading() {
  return (
    <div className="flex justify-start" role="status">
      <div className="rounded-panel border border-ink-950/10 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm">
        Ассистент отвечает...
      </div>
    </div>
  );
}

function formatChatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toChatCompletionMessages(messages: Message[]): ChatCompletionMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
