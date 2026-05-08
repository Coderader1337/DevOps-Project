import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the application shell', () => {
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
  });
});
