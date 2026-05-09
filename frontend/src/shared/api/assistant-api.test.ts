import { describe, expect, it } from 'vitest';

import { MockAssistantApi } from './assistant-api';

describe('MockAssistantApi', () => {
  it('returns an OpenAI-compatible-like assistant response', async () => {
    const api = new MockAssistantApi({ delayMs: 0 });

    const response = await api.createChatCompletion({
      model: 'default',
      messages: [
        {
          role: 'user',
          content: 'Привет',
        },
      ],
    });

    expect(response).toEqual(
      expect.objectContaining({
        object: 'chat.completion',
        model: 'default',
        choices: [
          expect.objectContaining({
            index: 0,
            message: expect.objectContaining({
              role: 'assistant',
              content: expect.stringContaining('Привет'),
            }),
            finish_reason: 'stop',
          }),
        ],
      }),
    );
  });
});
