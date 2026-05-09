import { useEffect, useMemo, useState } from 'react';

import { runtimeConfig } from '../../shared/api';
import {
  createChatStorage,
  type Chat,
  type ChatStorage,
} from '../../shared/storage';

const defaultChatStorage = createChatStorage();

interface ChatWorkspaceProps {
  storage?: ChatStorage;
}

export function ChatWorkspace({ storage = defaultChatStorage }: ChatWorkspaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
                        <button
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full rounded-panel px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-paper-50 text-ink-950 shadow-soft'
                              : 'text-paper-200/80 hover:bg-paper-50/10 hover:text-paper-50'
                          }`}
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

          <div className="flex flex-1 items-center justify-center px-5 py-10">
            <div className="max-w-xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss-600">
                {activeChat ? 'Диалог выбран' : 'Пока нет активного диалога'}
              </p>
              <p className="mt-3 text-base leading-7 text-ink-700">
                {activeChat
                  ? 'Сообщения и поле ввода появятся в следующей версии.'
                  : 'Создайте новый чат в боковой панели, чтобы начать работу.'}
              </p>
              {error ? (
                <p className="mt-4 rounded-panel border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-sm text-ink-900">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
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
