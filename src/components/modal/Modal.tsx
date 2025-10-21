'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
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
      // Prevent iOS safari bounce scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      if (isOpen) {
        // Restore body scroll
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
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
          <div className={styles.modalLogoWrapper}>
            <Image
              src="/assets/icons/logo.svg"
              alt="Balance Kitchen"
              width={160}
              height={120}
              className={styles.modalLogo}
            />
          </div>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Image
              src="/assets/icons/logo-icon.png"
              alt="Close"
              width={24}
              height={24}
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
