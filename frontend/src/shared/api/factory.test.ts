import { describe, expect, it } from 'vitest';

import { MockAssistantApi, RestAssistantApi } from './assistant-api';
import { createAssistantApi } from './factory';
import type { RuntimeConfig } from './config';

const baseConfig: RuntimeConfig = {
  apiMode: 'mock',
  historyMode: 'local',
  apiBaseUrl: 'http://localhost:8080',
  defaultModel: 'default',
};

describe('createAssistantApi', () => {
  it('returns mock assistant implementation for mock mode', () => {
    const api = createAssistantApi({
      ...baseConfig,
      apiMode: 'mock',
    });

    expect(api).toBeInstanceOf(MockAssistantApi);
  });

  it('returns REST assistant implementation for real mode without making a request', () => {
    const api = createAssistantApi({
      ...baseConfig,
      apiMode: 'real',
    });

    expect(api).toBeInstanceOf(RestAssistantApi);
  });
});
