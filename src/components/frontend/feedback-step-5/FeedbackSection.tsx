// src/components/feedback-step-5/FeedbackSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './FeedbackSection.module.css';
import { CTAButton } from '../../ui/CTAButton/CTAButton';
import Image from 'next/image';

export const FeedbackSection = () => {
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Detect when section comes into viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const currentSectionRef = sectionRef.current;
    
    if (currentSectionRef) {
      observer.observe(currentSectionRef);
    }

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className={styles.feedbackSection}
      aria-label="Feedback Section"
    >
      <div className={styles.contentContainer}>
        {/* Text Content - Left Side */}
        <motion.div 
          className={styles.textContent}
          initial={{ opacity: 0, x: -50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className={styles.sectionTitle}>
            Step 5 – Your Feedback
          </h2>
          <p className={styles.sectionDescription}>
            Your opinion matters! Help us improve by sharing your experience with our meals and service. 
            We use your feedback to enhance our menu and delivery experience.
            <a href="#"> Learn more</a>
          </p>
          
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Easy Submission</h3>
                <p className={styles.featureDescription}>
                  Quick 2-minute feedback form via Jotform after each delivery
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Multiple Channels</h3>
                <p className={styles.featureDescription}>
                  Email, social media, or in-app feedback options available
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Impactful Input</h3>
                <p className={styles.featureDescription}>
                  Your suggestions directly influence our menu development
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.ctaContainer}>
            <CTAButton 
              onClick={() => console.log('Give Feedback')}
              aria-label="Give your feedback"
            >
              Give Feedback
            </CTAButton>
          </div>
        </motion.div>

        {/* Animated Forms Graphic - Right Side */}
        <motion.div 
          className={styles.formsContainer}
          initial={{ opacity: 0, x: 50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className={styles.formsWrapper}>
            {/* Background Forms - Stacked */}
            <motion.div 
              className={`${styles.formCard} ${styles.formBack}`}
              initial={{ y: 20, opacity: 0.7 }}
              animate={sectionVisible ? { 
                y: [0, -5, 0],
              } : { y: 20, opacity: 0.7 }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Delivery Experience</div>
              </div>
              <div className={styles.formContent}>
                <div className={styles.formField}></div>
                <div className={styles.formField}></div>
                <div className={styles.formField}></div>
              </div>
            </motion.div>
            
            <motion.div 
              className={`${styles.formCard} ${styles.formMiddle}`}
              initial={{ y: 10, opacity: 0.8 }}
              animate={sectionVisible ? { 
                y: [0, -8, 0],
              } : { y: 10, opacity: 0.8 }}
              transition={{ 
                duration: 3.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: 0.2
              }}
            >
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Meal Quality</div>
              </div>
              <div className={styles.formContent}>
                <div className={styles.formField}></div>
                <div className={styles.formField}></div>
                <div className={styles.formField}></div>
              </div>
            </motion.div>
            
            {/* Foreground Form with Feedback Section Highlight */}
            <motion.div 
              className={`${styles.formCard} ${styles.formFront}`}
              initial={{ opacity: 0 }}
              animate={sectionVisible ? { 
                opacity: 1,
                y: [0, -3, 0],
              } : { opacity: 0 }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: 0.4
              }}
            >
              <div className={styles.formHeader}>
                <div className={styles.formTitle}>Your Feedback</div>
              </div>
              <div className={styles.formContent}>
                <div className={styles.formField}></div>
                <div className={styles.formField}></div>
                <div className={`${styles.formField} ${styles.highlightField}`}>
                  <motion.div 
                    className={styles.highlightOverlay}
                    initial={{ opacity: 0 }}
                    animate={sectionVisible ? { 
                      opacity: [0, 1, 0],
                    } : { opacity: 0 }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: 1
                    }}
                  >
                    <span className={styles.highlightText}>Rate Your Experience</span>
                  </motion.div>
                </div>
                <div className={styles.formField}></div>
              </div>
              <div className={styles.formFooter}>
                <div className={styles.submitButton}>Submit Feedback</div>
              </div>
            </motion.div>
            
            {/* Jotform Logo Overlay */}
            <div className={styles.jotformBadge}>
              <span className={styles.badgeText}>Powered by</span>
              <Image
                src="/assets/jotform-logo.svg"
                alt="Jotform"
                width={15}
                height={20}
                className={styles.jotformLogo}
              />
              <span className={styles.badgeText1}>Jotform</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
