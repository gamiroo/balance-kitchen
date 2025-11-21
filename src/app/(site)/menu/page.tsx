// app/menu/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import DishCard from "@/shared/components/ui/dish/DishCard";
import { dishData } from "@/data/dishData";
import type { Dish } from "@/shared/components/ui/dish/DishCard";
import { CTAButton } from "@/shared/components/ui/CTAButton/CTAButton";
import styles from './page.module.css';

type DishCategory = 'Carnivore' | 'Balanced' | 'Vegetarian' | 'Keto';

const categories: { name: DishCategory; color: string; label: string }[] = [
  { name: 'Carnivore', color: 'text-red-500', label: 'Carnivore Dishes' },
  { name: 'Balanced', color: 'text-green-500', label: 'Balanced Meals' },
  { name: 'Vegetarian', color: 'text-emerald-500', label: 'Vegetarian Options' },
  { name: 'Keto', color: 'text-purple-500', label: 'Keto Friendly' },
];

// Map URL hashes to category names
const hashToCategory: Record<string, DishCategory> = {
  'carnivore': 'Carnivore',
  'balanced': 'Balanced',
  'vegetarian': 'Vegetarian',
  'keto': 'Keto'
};

export default function MenuSection() {
  const [activeTab, setActiveTab] = useState<DishCategory>('Carnivore');

  // Handle URL hash on mount and when it changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && hashToCategory[hash]) {
        setActiveTab(hashToCategory[hash]);
      }
    };

    // Set initial tab based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const getDishesByCategory = (category: DishCategory): Dish[] => {
    return dishData.filter((dish: Dish) => dish.category === category);
  };

  const dishes = getDishesByCategory(activeTab);

  return (
    <section 
      className={styles.menuSection}
      role="main"
      aria-label="Menu Section"
    >
      <div className={styles.contentContainer}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className={`${styles.headerTitle} ${styles.headerTitleMd}`}>
            Our <span className={styles.headerTitleHighlight}>Menu</span>
          </h2>
          <p className={styles.headerDescription}>
            Explore our carefully crafted dishes designed to meet your dietary needs and taste preferences.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className={styles.tabsContainer}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setActiveTab(category.name);
                // Update URL hash when tab is clicked
                window.location.hash = category.name.toLowerCase();
              }}
              className={`${styles.tabButton} ${
                activeTab === category.name
                  ? styles.tabButtonActive
                  : ''
              } ${styles.focusRing}`}
              aria-selected={activeTab === category.name}
              role="tab"
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Dishes Grid - Single responsive class */}
        <motion.div 
          className={styles.dishesGridContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          key={activeTab}
        >
          {dishes.map((dish, index) => (
            <motion.div
              key={dish.id}
              className={styles.dishCardContainer}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              role="article"
              aria-label={`Dish: ${dish.name}`}
            >
              <DishCard dish={dish} enableSwipe={true} />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className={styles.footerNote}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p>All dishes are prepared with fresh, premium ingredients. Nutritional information may vary.</p>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className={styles.ctaSection}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          <CTAButton 
            href="/order"
            aria-label="Order meals now"
          >
            Order Now
          </CTAButton>
        </motion.div>
      </div>
    </section>
  );
}
