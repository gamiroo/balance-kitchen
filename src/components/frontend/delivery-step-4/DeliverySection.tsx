// src/components/frontend/delivery-step-4/DeliverySection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './DeliverySection.module.css';
import { CTAButton } from '../../ui/CTAButton/CTAButton';
import Image from 'next/image';

export const DeliverySection = () => {
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Detect when section comes into viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Handle case where entries might be empty
        if (entries && entries.length > 0) {
          const entry = entries[0];
          // Handle case where entry might be undefined and check isIntersecting
          if (entry && entry.isIntersecting) {
            setSectionVisible(true);
          }
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
      className={styles.deliverySection}
      aria-label="Delivery and Pickup Section"
    >
      <div className={styles.contentContainer}>
        {/* Animated Map Graphic - Left Side */}
        <motion.div 
          className={styles.mapContainer}
          initial={{ opacity: 0, x: -50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={styles.mapWrapper}>
            {/* Brisbane Map Background */}
            <div className={styles.mapBackground}>
              <Image
                src="/assets/brisbane.svg"
                alt="Map of Brisbane, Australia"
                fill
                className={styles.mapImage}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            
            {/* Animated Truck */}
            <motion.div
              className={styles.truckContainer}
              initial={{ x: -100, y: 50, opacity: 0 }}
              animate={sectionVisible ? { 
                x: [-80, 0, 80, 150, 200, 250, 250, 250],
                y: [50, 0, -30, -60, -40, -80, -80, -80],
                opacity: [0, 1, 1, 1, 1, 1, 1, 0],
                rotate: [0, 0, 5, -5, 0, -5, -5]
              } : { x: -100, y: 50, opacity: 0 }}
              transition={{ 
                duration: 6,
                times: [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1],
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            >
              <Image
                src="/assets/delivery-van.png"
                alt="Delivery van"
                width={120}
                height={100}
                className={styles.truckImage}
              />
            </motion.div>
            
            {/* Route Markers */}
            <div className={styles.startMarker}>
              <div className={styles.markerDot} />
              <span className={styles.markerLabel}>Our Kitchen</span>
            </div>
            
            <div className={styles.endMarker}>
              <div className={styles.markerDot} />
              <span className={styles.markerLabel}>Your Door</span>
            </div>
          </div>
        </motion.div>

        {/* Text Content - Right Side */}
        <motion.div 
          className={styles.textContent}
          initial={{ opacity: 0, x: 50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className={styles.sectionTitle}>
            Step 4 – Delivery & Pickup
          </h2>
          <p className={styles.sectionDescription}>
            Fresh meals delivered right to your doorstep or ready for pickup at your convenience. 
            Track your delivery in real-time and enjoy our reliable service across Brisbane.
            <a href="#"> Learn more</a>
          </p>
          
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Fast & Reliable</h3>
                <p className={styles.featureDescription}>
                  30-minute delivery windows with real-time tracking
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Flexible Options</h3>
                <p className={styles.featureDescription}>
                  Choose delivery or pickup based on your schedule
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Eco-Friendly</h3>
                <p className={styles.featureDescription}>
                  Electric vehicles and sustainable packaging
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.ctaContainer}>
            <CTAButton 
              onClick={() => console.log('Schedule Delivery')}
              aria-label="Schedule your delivery or pickup"
            >
              Schedule Delivery
            </CTAButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
