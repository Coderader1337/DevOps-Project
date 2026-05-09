import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatWorkspace } from './ChatWorkspace';
import type {
  AssistantApi,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '../../shared/api';
import { LocalChatStorage } from '../../shared/storage';

function createStorage() {
  return new LocalChatStorage(window.localStorage);
}

function createAssistantResponse(
  content = 'Ответ ассистента',
): ChatCompletionResponse {
  return {
    id: 'chatcmpl_test_001',
    object: 'chat.completion',
    created: 1710000000,
    model: 'default',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
  };
}

function createAssistantApi(
  handler: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>,
): AssistantApi {
  return {
    createChatCompletion: vi.fn(handler),
  };
}

describe('ChatWorkspace messages', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lets user type and send a message', async () => {
    const user = userEvent.setup();
    const assistantApi = createAssistantApi(async () =>
      createAssistantResponse('Привет! Я на связи.'),
    );

    render(<ChatWorkspace assistantApi={assistantApi} storage={createStorage()} />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));
    await user.type(screen.getByLabelText(/сообщение/i), 'Привет');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Привет').length).toBeGreaterThan(0);
    });
    expect(await screen.findByText('Привет! Я на связи.')).toBeInTheDocument();
    expect(assistantApi.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'default',
        messages: [expect.objectContaining({ role: 'user', content: 'Привет' })],
      }),
    );
  });

  it('does not send an empty message', async () => {
    const user = userEvent.setup();
    const assistantApi = createAssistantApi(async () => createAssistantResponse());

    render(<ChatWorkspace assistantApi={assistantApi} storage={createStorage()} />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));
    await user.type(screen.getByLabelText(/сообщение/i), '   ');

    expect(screen.getByRole('button', { name: /отправить/i })).toBeDisabled();
    expect(assistantApi.createChatCompletion).not.toHaveBeenCalled();
  });

  it('shows loading state while waiting for assistant response', async () => {
    const user = userEvent.setup();
    let resolveResponse: (response: ChatCompletionResponse) => void = () => {};
    const assistantApi = createAssistantApi(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    );

    render(<ChatWorkspace assistantApi={assistantApi} storage={createStorage()} />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));
    await user.type(screen.getByLabelText(/сообщение/i), 'Проверь статус');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      /ассистент отвечает/i,
    );

    resolveResponse(createAssistantResponse('Готово.'));

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('shows assistant response', async () => {
    const user = userEvent.setup();
    const assistantApi = createAssistantApi(async () =>
      createAssistantResponse('Это mock-ответ.'),
    );

    render(<ChatWorkspace assistantApi={assistantApi} storage={createStorage()} />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));
    await user.type(screen.getByLabelText(/сообщение/i), 'Нужен ответ');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(await screen.findByText('Это mock-ответ.')).toBeInTheDocument();
  });

  it('shows API error state', async () => {
    const user = userEvent.setup();
    const assistantApi = createAssistantApi(async () => {
      throw new Error('API failed');
    });

    render(<ChatWorkspace assistantApi={assistantApi} storage={createStorage()} />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));
    await user.type(screen.getByLabelText(/сообщение/i), 'Ошибка?');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(
      await screen.findByText(/не удалось получить ответ ассистента/i),
    ).toBeInTheDocument();
  });

  it('restores saved messages from local storage layer', async () => {
    const storage = createStorage();
    const chat = await storage.createChat({ title: 'История' });

    await storage.addMessage({
      chatId: chat.id,
      role: 'user',
      content: 'Сохраненный вопрос',
    });
    await storage.addMessage({
      chatId: chat.id,
      role: 'assistant',
      content: 'Сохраненный ответ',
    });

    render(
      <ChatWorkspace
        assistantApi={createAssistantApi(async () => createAssistantResponse())}
        storage={storage}
      />,
    );

    expect(await screen.findByText('Сохраненный вопрос')).toBeInTheDocument();
    expect(await screen.findByText('Сохраненный ответ')).toBeInTheDocument();
  });

  it('deletes one chat from the page', async () => {
    const user = userEvent.setup();
    const storage = createStorage();

    await storage.createChat({ title: 'Первый чат' });
    await storage.createChat({ title: 'Второй чат' });

    render(
      <ChatWorkspace
        assistantApi={createAssistantApi(async () => createAssistantResponse())}
        storage={storage}
      />,
    );

    expect(
      await screen.findByRole('button', { name: /^Первый чат/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /удалить чат первый чат/i }),
    );

    expect(
      screen.queryByRole('button', { name: /^Первый чат/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Второй чат/i }),
    ).toBeInTheDocument();
  });

  it('clears all chat history from the page', async () => {
    const user = userEvent.setup();
    const storage = createStorage();
    const chat = await storage.createChat({ title: 'История' });

    await storage.addMessage({
      chatId: chat.id,
      role: 'user',
      content: 'Вопрос из истории',
    });

    render(
      <ChatWorkspace
        assistantApi={createAssistantApi(async () => createAssistantResponse())}
        storage={storage}
      />,
    );

    expect(await screen.findByText('Вопрос из истории')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /очистить историю/i }));

    expect(screen.queryByText('Вопрос из истории')).not.toBeInTheDocument();
    expect(
      await screen.findByText(/диалоги появятся здесь/i),
    ).toBeInTheDocument();
  });
});
