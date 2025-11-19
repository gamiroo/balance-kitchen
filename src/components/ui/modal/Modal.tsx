'use client';

import { useEffect } from 'react';
import styles from './Modal.module.css';
import Image from 'next/image';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export const Modal = ({ isOpen, onClose, title, children, theme }: ModalProps) => {
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
        className={styles.modalContent}
        data-theme={theme}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalLogoWrapper}>
            {/* Logo placeholder - replace with your actual logo component */}
            <div style={{ 
              width: '160px', 
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffc33e',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              <Image src="assets/logo/balance-logo.svg" alt="balance kitchen logo" width={220} height={370} />
            </div>
          </div>
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Image src="assets/icons/logo-icon-svg.svg" alt="balance kitchen logo icon" width={220} height={370} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};
