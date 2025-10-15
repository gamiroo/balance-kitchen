// src/components/ordering-step-3/OrderingSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './OrderingSection.module.css';
import { CTAButton } from '../ui/CTAButton/CTAButton';
import Image from 'next/image';

// Dish card component for the grid
const DishCard = ({ 
  title, 
  image, 
  index 
}: { 
  title: string; 
  image: string;
  index: number;
}) => {
  return (
    <motion.div
      className={styles.dishCard}
      initial={{ 
        opacity: 0, 
        y: 20,
        rotate: (index % 2 === 0 ? 2 : -2)
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotate: 0
      }}
      transition={{ 
        duration: 0.5, 
        delay: 0.1 * index,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -5, 
        rotate: (index % 2 === 0 ? -1 : 1),
        transition: { duration: 0.2 }
      }}
    >
      <div className={styles.cardImageContainer}>
        <Image
          src={image}
          alt={title}
          width={200}
          height={200}
          className={styles.cardImage}
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
        />
        <div className={styles.imageOverlay} />
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
    </motion.div>
  );
};

export const OrderingSection = () => {
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

    const currentSectionRef = sectionRef.current; // Copy ref to variable
    
    if (currentSectionRef) {
      observer.observe(currentSectionRef);
    }

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, []);

  // Sample dish data
  const dishes = [
    { title: "Grilled Salmon", image: "/images/dishes/salmon.jpg" },
    { title: "Quinoa Bowl", image: "/images/dishes/quinoa.jpg" },
    { title: "Beef Stir Fry", image: "/images/dishes/beef.jpg" },
    { title: "Veggie Pasta", image: "/images/dishes/pasta.jpg" },
    { title: "Chicken Caesar", image: "/images/dishes/chicken.jpg" },
    { title: "Tofu Curry", image: "/images/dishes/tofu.jpg" },
    { title: "Lamb Chops", image: "/images/dishes/lamb.jpg" },
    { title: "Shrimp Tacos", image: "/images/dishes/shrimp.jpg" },
    { title: "Mushroom Risotto", image: "/images/dishes/risotto.jpg" }
  ];

  return (
    <section 
      ref={sectionRef}
      className={styles.orderingSection}
      aria-label="Ordering Section"
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
            Step 3 – Easy Ordering
          </h2>
          <p className={styles.sectionDescription}>
            Browse our delicious menu and place your order in seconds. Our intuitive interface makes it simple to customize your meals and schedule deliveries.
            <a href="#"> Learn more</a>
          </p>
          
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Simple Selection</h3>
                <p className={styles.featureDescription}>
                  Choose from 50+ chef-crafted dishes updated weekly
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Customization</h3>
                <p className={styles.featureDescription}>
                  Modify ingredients, portion sizes, and dietary preferences
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Flexible Scheduling</h3>
                <p className={styles.featureDescription}>
                  Set delivery dates and skip weeks whenever you need
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.ctaContainer}>
            <CTAButton 
              onClick={() => console.log('Start Ordering')}
              aria-label="Start ordering your meals"
            >
              Start Ordering
            </CTAButton>
          </div>
        </motion.div>

        {/* Animated Dish Grid - Right Side */}
        <motion.div 
          className={styles.gridContainer}
          initial={{ opacity: 0, x: 50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className={styles.gridWrapper}>
            {dishes.map((dish, index) => (
              <DishCard
                key={index}
                title={dish.title}
                image={dish.image}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
