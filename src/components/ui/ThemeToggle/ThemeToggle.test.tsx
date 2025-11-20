/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  const setupMatchMedia = (matches = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? matches : false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  beforeEach(() => {
    window.localStorage.clear();
    setupMatchMedia();
    document.documentElement.removeAttribute('data-theme');
  });

  const renderToggle = () =>
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

  it('defaults to light mode and exposes switch semantics', async () => {
    renderToggle();

    const button = await screen.findByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  });

  it('toggles theme preference when clicked', async () => {
    renderToggle();

    const button = await screen.findByRole('switch');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-checked', 'true');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-checked', 'false');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });
});
