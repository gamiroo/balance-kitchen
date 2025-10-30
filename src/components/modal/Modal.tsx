// src/app/components/modal/Modal.tsx
'use client';

import { useEffect } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      const scrollY = window.scrollY;
      document.body.setAttribute('data-scroll-position', scrollY.toString());
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      if (isOpen) {
        document.body.style.overflow = '';
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
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            {title}
          </h2>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};
