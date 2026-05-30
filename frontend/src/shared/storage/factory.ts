import { runtimeConfig, type RuntimeConfig } from '../api/config';
import { LocalChatStorage, type ChatStorage } from './local-chat-storage';

export function createChatStorage(
  config: RuntimeConfig = runtimeConfig,
): ChatStorage {
  if (config.historyMode === 'remote') {
    throw new Error('Remote history mode is reserved but not implemented in MVP');
  }

  return new LocalChatStorage();
}
