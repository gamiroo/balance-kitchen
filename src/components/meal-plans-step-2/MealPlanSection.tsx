'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MealPlanSection.module.css';
import { CTAButton } from '../ui/CTAButton/CTAButton';
import { subscriptionPacks, bulkPacks, deliveryPacks, Pack } from './data/plansData';
import ProductCard from './components/product-card/ProductCard';

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

  // Combine all packs from plansData
  const allPacks: Pack[] = [
    ...subscriptionPacks, 
    ...bulkPacks, 
    ...deliveryPacks
  ].slice(0, 5);

  // Card positions
  const cardPositions = [
    { top: '20%', left: '10%' },
    { top: '15%', left: '35%' },
    { top: '40%', left: '20%' },
    { top: '35%', left: '55%' },
    { top: '60%', left: '35%' }
  ];

  return (
    <section 
      ref={sectionRef}
      className={styles.menuPlanSection}
      aria-label="Menu Plans Section"
    >
      <div className={styles.contentContainer}>
        {/* Meal Packs - Left on desktop, Bottom on mobile */}
        <div className={styles.packsContainer}>
          <div className={styles.packsWrapper}>
            {allPacks.map((pack, index) => (
              <div
                key={`${pack.type}-${index}`}
                className={styles.menuCard}
                style={{
                  position: 'absolute',
                  top: cardPositions[index]?.top || '0%',
                  left: cardPositions[index]?.left || '0%',
                  width: '220px',
                  height: '300px'
                }}
              >
                <ProductCard pack={pack} />
              </div>
            ))}
          </div>
        </div>

        {/* Text Content - Right on desktop, Top on mobile */}
        <div className={styles.textContent}>
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
        </div>
      </div>
    </section>
  );
};
