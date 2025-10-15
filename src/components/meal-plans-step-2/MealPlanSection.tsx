// app/components/MenuPlanSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './MealPlanSection.module.css';
import { CTAButton } from '../ui/CTAButton/CTAButton';

// MenuCard component for individual meal packs
const MenuCard = ({ 
  title, 
  description, 
  meals, 
  price, 
  index,
  isHighlighted = false
}: { 
  title: string; 
  description: string; 
  meals: number; 
  price: number;
  index: number;
  isHighlighted?: boolean;
}) => {
  return (
    <motion.div
      className={`${styles.menuCard} ${isHighlighted ? styles.highlightedCard : ''}`}
      initial={{ opacity: 0, y: 30, rotate: index * 2 - 5 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotate: 0,
        x: index === 0 ? -20 : index === 1 ? -10 : index === 3 ? 10 : index === 4 ? 20 : 0,
        z: index === 0 ? -10 : index === 1 ? -5 : index === 3 ? -5 : index === 4 ? -10 : 0
      }}
      transition={{ 
        duration: 0.8, 
        delay: 0.2 * index,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -10, 
        rotate: index % 2 === 0 ? 2 : -2,
        transition: { duration: 0.3 }
      }}
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
        <div className={styles.cardDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Meals:</span>
            <span className={styles.detailValue}>{meals}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Price:</span>
            <span className={styles.priceValue}>${price.toFixed(2)}</span>
          </div>
        </div>
        {isHighlighted && (
          <div className={styles.highlightBadge}>BEST VALUE</div>
        )}
      </div>
    </motion.div>
  );
};

export const MealPlanSection = () => {
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Sample meal pack data
  const mealPacks = [
    {
      title: "Starter Pack",
      description: "Perfect for individuals trying our service",
      meals: 5,
      price: 49.99,
      isHighlighted: false
    },
    {
      title: "Balanced Plan",
      description: "Ideal for couples or small families",
      meals: 10,
      price: 89.99,
      isHighlighted: true
    },
    {
      title: "Family Feast",
      description: "Great for larger families",
      meals: 15,
      price: 129.99,
      isHighlighted: false
    },
    {
      title: "Athlete's Choice",
      description: "High-protein meals for fitness enthusiasts",
      meals: 12,
      price: 109.99,
      isHighlighted: false
    },
    {
      title: "Vegan Delight",
      description: "Plant-based meals for vegans",
      meals: 8,
      price: 79.99,
      isHighlighted: false
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className={styles.menuPlanSection}
      aria-label="Menu Plans Section"
    >
      <div className={styles.contentContainer}>
        {/* Animated Meal Packs - Left Side */}
        <motion.div 
          className={styles.packsContainer}
          initial={{ opacity: 0, x: -50 }}
          animate={sectionVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={styles.packsWrapper}>
            {mealPacks.map((pack, index) => (
              <MenuCard
                key={index}
                title={pack.title}
                description={pack.description}
                meals={pack.meals}
                price={pack.price}
                index={index}
                isHighlighted={pack.isHighlighted}
              />
            ))}
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
            Step 2 – Choose Your Menu Plan
          </h2>
          <p className={styles.sectionDescription}>
            Select from our carefully crafted meal plans designed to meet your dietary needs and taste preferences. 
            Each plan offers a variety of delicious, nutritious options that rotate weekly to keep your meals exciting.
            <a href="#"> Learn more</a>
          </p>
          
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Flexible Options</h3>
                <p className={styles.featureDescription}>
                  Choose from 5, 10, or 15 meal plans to suit your household size
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Dietary Variety</h3>
                <p className={styles.featureDescription}>
                  Specialized plans for vegan, keto, paleo, and high-protein diets
                </p>
              </div>
            </div>
            
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3 className={styles.featureTitle}>Fresh Ingredients</h3>
                <p className={styles.featureDescription}>
                  Chef-crafted meals with organic, locally-sourced ingredients
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.ctaContainer}>
            <CTAButton 
              onClick={() => console.log('View Menu Plans')}
              aria-label="View all menu plans"
            >
              View Menu Plans
            </CTAButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
