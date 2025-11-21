'use client';

import clsx from 'clsx';
import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  className?: string;
  id?: string;
}

export const ThemeToggle = ({ className, id }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id={id}
      className={clsx(styles.toggleButton, className)}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-theme-state={theme}
    >
      <span className={styles.icon} aria-hidden="true" data-active={!isDark}>
        <SunMedium size={16} />
      </span>
      <span className={styles.icon} aria-hidden="true" data-active={isDark}>
        <Moon size={16} />
      </span>
      <span className={styles.thumb} aria-hidden="true" />
      <span className="sr-only">Theme toggle switch</span>
    </button>
  );
};