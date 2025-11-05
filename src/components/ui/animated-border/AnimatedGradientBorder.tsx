import styles from './AnimatedGradientBorder.module.css';
import { ReactNode } from 'react';

interface AnimatedGradientBorderProps {
  children: ReactNode;
  className?: string;
  isActive?: boolean;
}

export const AnimatedGradientBorder = ({
  children,
  className = '',
  isActive = false,
}: AnimatedGradientBorderProps) => {
  return (
    <div className={`${styles.box} ${className} ${isActive ? styles.active : ''}`}>
      {children}
    </div>
  );
};
