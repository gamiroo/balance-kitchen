'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect } from 'react';

import type { Theme } from '@/components/theme/ThemeProvider';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /**
   * Optional theme override so callers can align the modal with the current appearance
   * without having to wrap the content in a theme-specific container.
   */
  theme?: Theme;
  /** Allow consumers to append layout-specific class names to the modal content wrapper */
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  theme,
  className,
}: ModalProps) => {
  // Handle escape key press and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.setAttribute('data-scroll-position', scrollY.toString());
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);

      if (isOpen) {
        // Restore body scroll
        document.body.style.overflow = '';

        // Restore scroll position
        const scrollPosition = document.body.getAttribute('data-scroll-position');
        if (scrollPosition) {
          window.scrollTo(0, parseInt(scrollPosition, 10));
        }
        document.body.removeAttribute('data-scroll-position');
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      data-theme={theme}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={clsx(styles.modalContent, className)}
        data-theme={theme}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalLogoWrapper}>
            <Image
              src="/assets/logo/balance-logo.svg"
              alt="Balance Kitchen"
              width={160}
              height={72}
              className={styles.modalLogo}
              priority
            />
          </div>
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Image
              src="/assets/icons/logo-icon-svg.svg"
              alt="Balance Kitchen icon"
              width={32}
              height={32}
              className={styles.closeIcon}
            />
          </button>
        </div>

        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};
