'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CTAButton } from '../ui/CTAButton/CTAButton';
import { MovingBorder } from '../ui/animated-border/AnimatedBorderBox';
import { Modal } from '../modal/Modal';
import styles from './AboutSection.module.css';

export const AboutSection = () => {
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

    // Copy ref to variable to fix the warning
    const currentSectionRef = sectionRef.current;
    
    if (currentSectionRef) {
      observer.observe(currentSectionRef);
    }

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, []); // Remove sectionRef from dependency array

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
            right: isMobile ? '20%' : '9%',
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
            src="/images/dishes/butter-chicken.png"
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
            right: isMobile ? '-20%' : '15%',
            top: isMobile ? '72%' : '44%',
            bottom: isMobile ? '5%' : 'auto',
            transform: isMobile 
              ? 'translateY(30%) translateX(30vw)' 
              : 'translateY(-50%) translateX(50vw)',
            marginRight: isMobile ? '30vw' : '50vw'
          }}
          initial={{ x: '100vw', rotate: 0, opacity: 0 }}
          animate={inView ? { 
            x: isMobile ? '30vw' : '50vw', 
            rotate: isMobile ? -40 : -64, 
            opacity: 1 
          } : { x: '100vw', rotate: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          aria-hidden="true"
        >
          <Image
            src="/images/dishes/chicken-chimichurri.png"
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
          width="fit"
          height="fit"
          strokeWidth={isMobile ? 2 : 4}
          duration={50}
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
                About Balance Kitchen
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
                  aria-label="Family owned category"
                >
                  Family Owned
                </span>
                <span 
                  className={`${styles.badge} ${styles.animatedBadge}`}
                  aria-label="Custom meals category"
                >
                  Custom Meals
                </span>
                <span 
                  className={`${styles.badge} ${styles.animatedBadge}`}
                  aria-label="Community focused category"
                >
                  Community Focused
                </span>
              </motion.div>

              {/* Intro Description - centered */}
              <motion.p 
                id="about-description"
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                At Balance Kitchen, we&apos;re more than just a meal prep company, we&apos;re a family-owned business with a passion for great food and genuine care for our community. Balance Kitchen was born out of a simple observation: there were few meal prep services that truly catered to individual needs...
              </motion.p>
              
              {/* Read More Link - centered */}
              <motion.div
                className={styles.readMoreContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                <button
                  onClick={openModal}
                  className={styles.readMoreLink}
                  aria-label="Read more about Balance Kitchen"
                >
                  Learn More
                </button>
              </motion.div>
            </div>
          </div>
        </MovingBorder>
      </div>

      {/* Modal for full content */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title="About Balance Kitchen"
      >
        <div className={styles.modalContentWrapper}>
          <h2 className={styles.modalHeading}>About Balance Kitchen</h2>
          
          <div className={styles.modalBadges}>
            <span className={styles.modalBadge}>Family Owned</span>
            <span className={styles.modalBadge}>Custom Meals</span>
            <span className={styles.modalBadge}>Community Focused</span>
          </div>
          
          <div className={styles.modalTextContent}>
            <p className={styles.modalDescription}>
              At Balance Kitchen, we&apos;re more than just a meal prep company, we&apos;re a family-owned business with a passion for great food and genuine care for our community.
            </p>
            
            <p className={styles.modalDescription}>
              Balance Kitchen was born out of a simple observation: there were few meal prep services that truly catered to individual needs. Whether it&apos;s specific macros, calorie counts, dietary restrictions, or just a preference for cleaner eating, Balance Kitchen aims to support in the ways we can. What began as a small operation serving friends and family has now grown into a trusted name in custom meal prep.
            </p>

            <p className={styles.modalDescription}>
              Today, Balance Kitchen is backed by a passionate and growing team, all working together to help more people find balance in their busy lives through personalised, delicious, ready-made meals.
            </p>
          </div>
          
          {/* CTA Button moved inside modal */}
          <div className={styles.modalCtaContainer}>
            <CTAButton 
              href="/waitlist"
              aria-label="Join the waitlist for Balance Kitchen"
            >
              How Do I Start?
            </CTAButton>
          </div>
        </div>
      </Modal>

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
