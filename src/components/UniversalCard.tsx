// app/components/UniversalCard.tsx
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import styles from './styles/UniversalCard.module.css';

export interface UniversalCardProps {
  /** Tailwind width class (e.g. 'w-[340px]') */
  width?: string;
  /** Tailwind height class (e.g. 'h-[520px]') */
  height?: string;
  /** Tailwind perspective class (e.g. 'perspective-[1200px]') */
  perspective?: string;
  /** Additional container classes */
  className?: string;
  /** Disable 3D tilt effect */
  tilt?: boolean;
  /** Content for the front face */
  front: ReactNode;
  /** Content for the back face */
  back: ReactNode;
  /** Enable swipe gestures (for mobile) */
  enableSwipe?: boolean;
  /** Custom swipe threshold */
  swipeThreshold?: number;
}

// Define proper type for Tilt component props
interface TiltProps {
  glareEnable: boolean;
  glareColor: string;
  glareMaxOpacity: number;
  tiltMaxAngleX: number;
  tiltMaxAngleY: number;
  glareBorderRadius: string;
  className: string;
}

export default function UniversalCard({
  width = "w-[340px]",
  height = "h-[520px]",
  perspective = "perspective-[1200px]",
  className = "",
  tilt = true,
  front,
  back,
  enableSwipe = false,
  swipeThreshold = 50,
}: UniversalCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const Container = tilt ? Tilt : React.Fragment;
  const containerProps: TiltProps = tilt
    ? {
        glareEnable: true,
        glareColor: "#ffffff",
        glareMaxOpacity: 0.2,
        tiltMaxAngleX: 5,
        tiltMaxAngleY: 5,
        glareBorderRadius: "24px",
        className: styles.tiltContainer,
      }
    : ({} as TiltProps); // Cast empty object to TiltProps type

  // Handle touch start for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchStart(e.touches[0].clientX);
  };

  // Handle touch end for swipe detection
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || touchStart === 0) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe left to flip to back
    if (diff > swipeThreshold && !flipped) {
      setFlipped(true);
    }
    // Swipe right to flip back to front
    else if (diff < -swipeThreshold && flipped) {
      setFlipped(false);
    }
    
    setTouchStart(0);
  };

  // Handle click for non-mobile or when swipe is disabled
  const handleClick = () => {
    if (!enableSwipe || !isMobile) {
      setFlipped((v) => !v);
    }
  };

  // Map Tailwind classes to CSS module classes
  const getWidthClass = (width: string) => {
    switch (width) {
      case "w-[340px]": return styles.width340;
      case "w-full": return styles.widthFull;
      default: return "";
    }
  };

  const getHeightClass = (height: string) => {
    switch (height) {
      case "h-[520px]": return styles.height520;
      case "h-full": return styles.heightFull;
      default: return "";
    }
  };

  const getPerspectiveClass = (perspective: string) => {
    switch (perspective) {
      case "perspective-[1200px]": return styles.perspective1200;
      case "perspective-[1000px]": return styles.perspective1000;
      case "perspective-[800px]": return styles.perspective800;
      default: return "";
    }
  };

  return (
    <Container {...(containerProps as React.ComponentProps<typeof Tilt>)}>
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`${styles.universalCardContainer} ${getWidthClass(width)} ${getHeightClass(height)} ${getPerspectiveClass(perspective)} ${className}`}
        role="button"
        aria-label="Flip card to view details"
        aria-pressed={flipped}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!enableSwipe || !isMobile) {
              setFlipped((v) => !v);
            }
          }
        }}
      >
        <motion.div
          className={styles.cardWrapper}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Front Face */}
          <div
            className={`${styles.cardFace} ${styles.cardFaceFront}`}
          >
            {front}
          </div>
          {/* Back Face */}
          <div
            className={`${styles.cardFace} ${styles.cardFaceBack}`}
          >
            {back}
          </div>
        </motion.div>
      </div>
    </Container>
  );
}
