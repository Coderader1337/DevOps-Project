export type ApiMode = 'mock' | 'real';
export type HistoryMode = 'local' | 'remote';

export interface RuntimeConfig {
  apiMode: ApiMode;
  historyMode: HistoryMode;
  apiBaseUrl: string;
  defaultModel: string;
}

function parseApiMode(value: unknown): ApiMode {
  return value === 'real' ? 'real' : 'mock';
}

function parseHistoryMode(value: unknown): HistoryMode {
  return value === 'remote' ? 'remote' : 'local';
}

export const runtimeConfig: RuntimeConfig = {
  apiMode: parseApiMode(import.meta.env.VITE_API_MODE),
  historyMode: parseHistoryMode(import.meta.env.VITE_HISTORY_MODE),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL ?? 'default',
};
