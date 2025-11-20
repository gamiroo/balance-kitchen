import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../../providers/ThemeProvider';

jest.mock('@/shared/hooks/useTheme', () => {
  let theme: Theme = 'light';

  const applyTheme = () => {
    const doc = globalThis.document;
    if (doc && doc.documentElement) {
      doc.documentElement.dataset.theme = theme;
    }
  };

  return {
    __getTheme: () => theme,
    __setTheme: (nextTheme: Theme) => {
      theme = nextTheme;
      applyTheme();
    },
    useTheme: () => ({
      theme,
      toggleTheme: () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme();
      },
    }),
  };
});

const mockUseTheme = () => jest.requireMock('@/shared/hooks/useTheme');

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockUseTheme().__setTheme('light');
  });

  const renderToggle = () => renderToStaticMarkup(<ThemeToggle />);

  it('renders switch markup for the current theme', () => {
    const html = renderToggle();
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('data-theme-state="light"');
  });

  it('toggles aria-checked state when the theme changes', () => {
    const { useTheme } = mockUseTheme();

    let html = renderToggle();
    expect(html).toContain('aria-checked="false"');
    expect(document.documentElement.dataset.theme).toBe('light');

    useTheme().toggleTheme();
    html = renderToggle();
    expect(html).toContain('aria-checked="true"');
    expect(document.documentElement.dataset.theme).toBe('dark');

    useTheme().toggleTheme();
    html = renderToggle();
    expect(html).toContain('aria-checked="false"');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
