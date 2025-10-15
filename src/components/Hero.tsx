// src/app/components/Hero.tsx
'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import { CTAButton } from './ui/CTAButton/CTAButton'
import { ChevronDown } from 'lucide-react'
import styles from './styles/Hero.module.css'

export const Hero = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll to next section
  const scrollToNext = () => {
    const nextSection = document.getElementById('about');
    if (nextSection) {
      nextSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section
      className={styles.heroSection}
      style={{
        backgroundImage: 'url(/images/hero-bg1.jpg)',
      }}
      role="banner"
      aria-label="Hero section - Healthy meals delivered fast"
    >
      {/* Dark overlay for better text contrast */}
      <div 
        className={styles.backgroundOverlay} 
        aria-hidden="true"
      />

      {/* Main content container */}
      <div className={`${styles.contentContainer} ${styles.contentContainerSm} ${styles.contentContainerLg}`}>
        {/* Animated heading */}
        <motion.h1 
          className={`${styles.heroHeading} ${styles.heroHeadingSm} ${styles.heroHeadingMd} ${styles.heroHeadingLg}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          id="hero-heading"
        >
          Healthy meals, delivered fast.
        </motion.h1>
        
        {/* Animated subtitle */}
        <motion.p 
          className={`${styles.heroSubtitle} ${styles.heroSubtitleSm} ${styles.heroSubtitleMd}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          id="hero-description"
        >
          Save time, stay fit, taste the difference.
        </motion.p>
        
        {/* Animated CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className={styles.ctaContainer}
        >
          <CTAButton 
            href="#about" 
            onClick={() => {
              scrollToNext();
            }}
            aria-label="Find out more about Balance Kitchen - scrolls to next section"
          >
            Find out more
          </CTAButton>
        </motion.div>
      </div>
      
      {/* Animated scroll indicator */}
      <motion.div 
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={styles.scrollIndicatorContent}
        >
          <button
            onClick={scrollToNext}
            className={styles.scrollButton}
            aria-label="Scroll to next section"
          >
            <ChevronDown 
              className={`${styles.scrollIcon} ${isMobile ? styles.scrollIconMobile : ''}`} 
              size={isMobile ? 32 : 40} 
              aria-hidden="true" 
            />
            <span className={styles.scrollText}>Scroll down to learn more</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className={styles.skipLink}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
    </section>
  )
}
