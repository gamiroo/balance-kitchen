// src/app/components/ui/CTAButton/CTAButton.tsx
import { motion } from 'framer-motion';
import styles from './CTAButton.module.css';

interface CTAButtonProps {
  href?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const CTAButton = ({
  href,
  children = 'Order Now',
  onClick,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  type = 'button',
}: CTAButtonProps) => {
  const handleClick = () => {
    if (disabled || loading) return;
    onClick?.();
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={styles.ctaButton}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      disabled={disabled || loading}
    >
      <span className={styles.buttonText}>
        <span>{children}</span>
      </span>
    </motion.button>
  );
};

CTAButton.displayName = 'CTAButton';
