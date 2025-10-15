// src/app/components/AboutSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CTAButton } from '../CTAButton';
import { MovingBorder } from '../ui/AnimatedBorderBox';
import styles from './AboutSection.module.css';

export const AboutSection = () => {
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Detect mobile devices for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { 
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const currentSectionRef = sectionRef.current; // Copy ref to variable
    
    if (currentSectionRef) {
      observer.observe(currentSectionRef);
    }

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [sectionRef]); // Add sectionRef to dependency array

  return (
    <section 
      ref={sectionRef}
      className={styles.section}
      role="region"
      aria-labelledby="about-heading"
      aria-describedby="about-description"
    >
      {/* Images positioned absolutely but within the scroll context */}
      <div className={styles.imageContainer}>
        {/* Left Image with Dark Overlay - Responsive positioning */}
        <motion.div
          className={`${styles.imageWrapper} ${styles.leftImage}`}
          style={{ 
            right: isMobile ? '20%' : '16%',
            top: isMobile ? '3%' : '15%',
            transform: isMobile 
              ? 'translateY(-30%) translateX(-30vw)' 
              : 'translateY(-50%) translateX(-50vw)',
            marginLeft: isMobile ? '30vw' : '50vw'
          }}
          initial={{ x: '-100vw', rotate: 0, opacity: 0 }}
          animate={inView ? { 
            x: isMobile ? '-30vw' : '-50vw', 
            rotate: isMobile ? -40 : -64, 
            opacity: 1 
          } : { x: '-100vw', rotate: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          aria-hidden="true"
        >
          <Image
            src="/images/about-left.png"
            alt=""
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 30vw, 25vw"
            priority={false}
            loading="lazy"
          />
          {/* Dark overlay to reduce glare */}
          <div 
            className={styles.overlay}
            aria-hidden="true"
          />
        </motion.div>

        {/* Right Image with Dark Overlay - Responsive positioning */}
        <motion.div
          className={`${styles.imageWrapper} ${styles.rightImage}`}
          style={{ 
            right: isMobile ? '-20%' : '-18%',
            top: isMobile ? '72%' : '14%',
            bottom: isMobile ? '5%' : 'auto',
            transform: isMobile 
              ? 'translateY(30%) translateX(30vw)' 
              : 'translateY(-50%) translateX(50vw)',
            marginRight: isMobile ? '30vw' : '50vw'
          }}
          initial={{ x: '100vw', rotate: 0, opacity: 0 }}
          animate={inView ? { 
            x: isMobile ? '30vw' : '50vw', 
            rotate: isMobile ? -40 : 64, 
            opacity: 1 
          } : { x: '100vw', rotate: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          aria-hidden="true"
        >
          <Image
            src="/images/about-side-right.png"
            alt=""
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 30vw, 25vw"
            priority={false}
            loading="lazy"
          />
          {/* Dark overlay to reduce glare */}
          <div 
            className={styles.overlay}
            aria-hidden="true"
          />
        </motion.div>
      </div>

      {/* Content with Moving Border - above images with glass effect */}
      <div className={styles.contentContainer}>
        <MovingBorder
          width="100%"
          height="100%"
          strokeWidth={isMobile ? 1.5 : 2}
          duration={70}
          opacity={0.7}
          blur={isMobile ? 2 : 4}
          radius={isMobile ? 16 : 20}
          className={styles.movingBorder}
          gradientColors={['#ffc33e', '#cb2e12']}
          background="transparent"
          ariaLabel="About Balance Kitchen section"
          ariaDescribedBy="about-content"
          role="region"
        >
          {/* Centered content */}
          <div className={styles.contentWrapper}>
            {/* Centered text content */}
            <div className={styles.textContent} id="about-content">
              {/* Heading - centered */}
              <motion.h2 
                id="about-heading"
                className={styles.heading}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Nourish your body with Balance Kitchen
              </motion.h2>
              
              {/* Animated Badges - centered */}
              <motion.div
                className={styles.badgeContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <span 
                  className={`${styles.badge} ${styles.animatedBadge}`}
                  aria-label="Balanced Meals category"
                >
                  Balanced Meals
                </span>
                <span 
                  className={`${styles.badge} ${styles.animatedBadge}`}
                  aria-label="Crafted your way category"
                >
                  crafted your way
                </span>
                <span 
                  className={`${styles.badge} ${styles.animatedBadge}`}
                  aria-label="Nutritious category"
                >
                  nutritious
                </span>
              </motion.div>

              {/* Description - centered */}
              <motion.p 
                id="about-description"
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                Work quickly and efficiently with <strong className={styles.strong}>Balance Kitchen</strong>. Get nutritious, chef‑crafted meals delivered straight to your doorstep—so you can focus on the things that matter. We offer rotating menu plans, a flexible 80‑meal savings account, and a dedicated account manager who tailors every dish to your taste and dietary goals. Use our mobile‑friendly interface or our Messenger bot to place an order in seconds.
              </motion.p>
              
              <motion.p 
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                New customers can sign up now for the waitlist and be the first to try our upcoming subscription service. 
                <a
                  href="/waitlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                  aria-label="Sign up for waitlist (opens in new tab)"
                >
                  Sign up
                  <span className="sr-only">(opens in new tab)</span>
                </a>
                to get early access and exclusive launch offers.
              </motion.p>

              {/* CTA Button - centered */}
              <motion.div
                className={styles.ctaContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.6 }}
              >
                <CTAButton 
                  href="/waitlist"
                  aria-label="Join the waitlist for Balance Kitchen"
                >
                  Speak to your Account Manager
                </CTAButton>
              </motion.div>
            </div>
          </div>
        </MovingBorder>
      </div>

      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className={styles.skipLink}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
    </section>
  );
};
