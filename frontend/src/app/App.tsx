import { runtimeConfig } from '../shared/api/config';

export function App() {
  return (
    <main className="min-h-screen bg-paper-50 text-ink-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-ink-950/10 bg-ink-950 px-5 py-6 text-paper-50 lg:flex lg:flex-col">
          <div>
            <h1 className="font-display text-3xl leading-tight">AI Chat</h1>
          </div>

          <button
            className="mt-8 rounded-panel border border-paper-200/20 bg-paper-50 px-4 py-3 text-left text-sm font-semibold text-ink-950 shadow-soft transition hover:bg-paper-100"
            type="button"
          >
            Новый чат
          </button>

          <div className="mt-8 flex-1 rounded-panel border border-paper-200/10 bg-paper-50/5 p-4">
            <p className="text-sm text-paper-200/80">Диалоги появятся здесь.</p>
          </div>

          <div className="mt-6 text-xs leading-relaxed text-paper-200/60">
            API: {runtimeConfig.apiMode} · History: {runtimeConfig.historyMode}
          </div>
        </aside>

        <section
          aria-label="Рабочая область чата"
          className="min-w-0 flex-1 bg-paper-50"
        />
      </div>
    </main>
  );
}
