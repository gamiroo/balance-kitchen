// app/components/MealPlansSection.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  subscriptionPacks, 
  bulkPacks, 
  deliveryPacks, 
  type Pack, 
  type PackType 
} from '../data/plansData';
import { CTAButton } from './CTAButton';
import styles from './styles/MealPlansSection.module.css';

export default function MealPlansSection() {
  const [activeTab, setActiveTab] = useState<PackType>('subscription');

  const getPacksByType = (type: PackType): Pack[] => {
    switch (type) {
      case 'subscription': return subscriptionPacks;
      case 'bulk': return bulkPacks;
      case 'delivery': return deliveryPacks;
      default: return [];
    }
  };

  const getTabLabel = (type: PackType): string => {
    switch (type) {
      case 'subscription': return 'Weekly Subscriptions';
      case 'bulk': return 'Bulk Meal Packs';
      case 'delivery': return 'Delivery Slots';
      default: return '';
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const calculatePricePerMeal = (pack: Pack): string => {
    if (typeof pack.meals === 'number' && pack.meals > 0) {
      const pricePerMeal = pack.basePrice / pack.meals;
      return `$${pricePerMeal.toFixed(2)}`;
    }
    return 'N/A';
  };

  const getMealsLabel = (type: PackType): string => {
    switch (type) {
      case 'delivery': return 'Deliveries per pack';
      case 'bulk': return 'Meals per pack';
      case 'subscription': return 'Meals per week';
      default: return 'Meals';
    }
  };

  const packs = getPacksByType(activeTab);

  return (
    <section className={styles.mealPlansSection} role="region" aria-label="Meal Plans Section">
      <div className={styles.contentContainer}>
        {/* Header */}
        <div className={styles.header}>
          <motion.h2 
            className={`${styles.headerTitle} ${styles.headerTitleMd}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Choose Your Plan
          </motion.h2>
          <motion.p 
            className={`${styles.headerDescription}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Flexible options to fit your lifestyle and budget. All plans include free delivery and premium ingredients.
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div 
          className={styles.tabsContainer}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {(['subscription', 'bulk', 'delivery'] as PackType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`${styles.tabButton} ${
                activeTab === type
                  ? styles.tabButtonActive
                  : ''
              } ${styles.focusRing}`}
              aria-selected={activeTab === type}
              role="tab"
            >
              {getTabLabel(type)}
            </button>
          ))}
        </motion.div>

        {/* Plans Grid - Single responsive class */}
        <motion.div 
          className={styles.plansGridContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {packs.map((pack, index) => (
            <motion.div
              key={`${pack.type}-${pack.title}`}
              className={`${styles.planCard} ${
                pack.highlight ? styles.planCardHighlighted : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              role="article"
              aria-label={`${pack.title} plan`}
            >
              {/* Highlight Badge */}
              {pack.highlight && (
                <div className={styles.highlightBadge} aria-label="Best value plan">
                  BEST VALUE
                </div>
              )}

              {/* Tag */}
              {pack.tag && (
                <div className={styles.tag} aria-label={`Special tag: ${pack.tag}`}>
                  {pack.tag}
                </div>
              )}

              <div className={styles.cardContent}>
                {/* Title and Description */}
                <div className={styles.titleDescription}>
                  <h3 className={styles.planTitle}>{pack.title}</h3>
                  {pack.description && (
                    <p className={styles.planDescription}>{pack.description}</p>
                  )}
                </div>

                {/* Meals and Price */}
                <div className={styles.mealsPrice}>
                  <div className={styles.mealRow}>
                    <span className={styles.mealLabel}>{getMealsLabel(pack.type)}</span>
                    <span className={styles.mealValue}>{pack.meals}</span>
                  </div>
                  
                  <div className={styles.mealRow}>
                    <span className={styles.mealLabel}>Price</span>
                    <span className={`${styles.mealValue} ${styles.priceValue}`}>
                      {formatPrice(pack.basePrice)}
                    </span>
                  </div>
                  
                  <div className={styles.mealRow}>
                    <span className={styles.mealLabel}>Price per meal</span>
                    <span className={`${styles.mealValue} ${styles.pricePerMeal}`}>
                      {calculatePricePerMeal(pack)}/meal
                    </span>
                  </div>
                </div>

                {/* Bonus Discount */}
                {pack.bonusDiscount && pack.bonusDiscount > 0 && (
                  <div className={styles.bonusDiscount}>
                    <p className={styles.bonusDiscountText}>
                      Save {pack.bonusDiscount}% on pantry items
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <div className={styles.ctaContainer}>
                  <CTAButton 
                    onClick={() => console.log(`Selected ${pack.title} plan`)}
                    aria-label={`Select ${pack.title} plan`}
                  >
                    Select Plan
                  </CTAButton>
                </div>
              </div>
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
          <p>All plans include free delivery and premium ingredients. No commitment required.</p>
        </motion.div>
      </div>
    </section>
  );
}
