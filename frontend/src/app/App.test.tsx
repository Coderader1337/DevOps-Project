import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { LocalChatStorage } from '../shared/storage';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the chat layout', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /ai chat/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /новый чат/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/рабочая область чата/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/диалоги появятся здесь/i),
    ).toBeInTheDocument();
  });

  it('creates a new chat from the sidebar', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /новый чат/i }));

    const chatButtons = await screen.findAllByRole('button', {
      name: /новый чат/i,
    });

    expect(chatButtons).toHaveLength(2);
    expect(chatButtons[1]).toHaveAttribute('aria-current', 'page');
  });

  it('marks the selected chat as active', async () => {
    const user = userEvent.setup();
    const storage = new LocalChatStorage();
    const firstChat = await storage.createChat({ title: 'Первый диалог' });
    const secondChat = await storage.createChat({ title: 'Второй диалог' });

    render(<App />);

    const firstChatButton = await screen.findByRole('button', {
      name: new RegExp(firstChat.title, 'i'),
    });
    const secondChatButton = await screen.findByRole('button', {
      name: new RegExp(secondChat.title, 'i'),
    });

    await user.click(firstChatButton);

    expect(firstChatButton).toHaveAttribute('aria-current', 'page');
    expect(secondChatButton).not.toHaveAttribute('aria-current');

    await user.click(secondChatButton);

    expect(secondChatButton).toHaveAttribute('aria-current', 'page');
    expect(firstChatButton).not.toHaveAttribute('aria-current');
  });

  it('loads chat list through the data layer', async () => {
    const storage = new LocalChatStorage();

    await storage.createChat({ title: 'Сохраненный диалог' });

    render(<App />);

    expect(
      await screen.findByRole('button', { name: /сохраненный диалог/i }),
    ).toBeInTheDocument();
  });
});
