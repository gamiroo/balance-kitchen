import { motion } from 'framer-motion';
import styles from './CTAButton.module.css';

interface CTAButtonProps {
  /** If you want the button to open a link directly. */
  href?: string;
  /** Custom button text – default "Order Now". */
  children?: React.ReactNode;
  /** Callback – called after the click (used by the table cells). */
  onClick?: () => void;
  /** For accessibility - indicates if button is disabled */
  disabled?: boolean;
  /** For accessibility - indicates loading state */
  loading?: boolean;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

export const CTAButton = ({
  href,
  children = 'Order Now',
  onClick,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
}: CTAButtonProps) => {
  const handleClick = () => {
    if (disabled || loading) return;
    
    // Call the onClick callback if provided
    onClick?.();
    
    // If href is provided, navigate to the link
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.button
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
