import { describe, expect, it } from 'vitest';

import type { RuntimeConfig } from '../api/config';
import { createChatStorage, LocalChatStorage } from './index';

const baseConfig: RuntimeConfig = {
  apiMode: 'mock',
  historyMode: 'local',
  apiBaseUrl: 'http://localhost:8080',
  defaultModel: 'default',
};

describe('createChatStorage', () => {
  it('returns local storage implementation for local history mode', () => {
    expect(createChatStorage(baseConfig)).toBeInstanceOf(LocalChatStorage);
  });

  it('keeps remote history mode reserved for future versions', () => {
    expect(() =>
      createChatStorage({
        ...baseConfig,
        historyMode: 'remote',
      }),
    ).toThrow(/reserved/i);
  });
});
