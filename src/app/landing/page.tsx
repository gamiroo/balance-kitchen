// app/landing/page.tsx
'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AboutSection } from "../../components/About";
import { Header } from "../../components/Header";
import { Hero } from "../../components/Hero";
import MealPlansSection from "../../components/MealPlansSection";
import DishGrid from "../../components/DishGrid";
import { dishData } from "../../data/dishData";
import type { Dish } from "../../components/DishCard";
import TestimonialsSection from "../../components/TestimonialSection";
import FAQAccordion from "../../components/FAQAccordion";
import styles from './page.module.css';
import Link from "next/link";
import { faqs } from "../../data/faqData";
import { AccountManagerStep } from "components/account-manager-step-1/AccountManagerStep";

// Lazy load carousels (client-side only)
const HowItWorksTrail = dynamic(() => import("../../components/how-it-works/HowItWorksTrail"), { ssr: false });

// Categories for the main page (show only first 6 dishes of each)
const categories = [
  { name: 'Carnivore', color: 'text-red-500' },
  { name: 'Balanced', color: 'text-green-500' },
  { name: 'Vegetarian', color: 'text-emerald-500' },
  { name: 'Keto', color: 'text-purple-500' },
];

export default function MainPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewMore = (category: string) => {
    // Scroll to menu section or navigate to menu page
    console.log(`View more ${category} dishes`);
    // You can add navigation logic here
  };

  const handleGetStarted = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div 
      className={`${styles.landingPage} ${isLoading ? styles.disabledState : ''}`}
      aria-busy={isLoading}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`${styles.loadingOverlay} ${styles.loadingOverlayActive}`}>
          <div className={styles.loadingSpinner} aria-label="Loading content"></div>
        </div>
      )}
      
      <Header />
      <div className={`${styles.headerSpacer} ${styles.headerSpacerMd}`} />
      <Hero />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      
      <AccountManagerStep />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      
      {/* Mission Section */}
      <AboutSection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      
      {/* Scroll Steps */}
      <HowItWorksTrail />

      <MealPlansSection />
      
      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.faqContent}>
          <motion.div 
            className={styles.faqHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`${styles.faqTitle} ${styles.faqTitleMd}`}>
              Frequently Asked <span className={styles.faqTitleHighlight}>Questions</span>
            </h2>
            <p className={styles.faqDescription}>
              Here are a few common questions customers ask about our service
            </p>
          </motion.div>

          <FAQAccordion faqs={faqs} />
        </div>
      </section>

      {/* Menu Section */}
      <section className={styles.menuSection}>
        <div className={styles.menuContent}>
          <motion.div 
            className={styles.menuHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`${styles.menuTitle} ${styles.menuTitleMd}`}>
              Our <span className={styles.menuTitleHighlight}>Menu</span>
            </h2>
            <p className={styles.menuDescription}>
              Explore our carefully crafted dishes designed to meet your dietary needs and taste preferences.
            </p>
          </motion.div>

          {/* Grids for each category */}
          {categories.map((category, index) => {
            const categoryDishes = dishData.filter(
              (dish: Dish) => dish.category === category.name
            );

            if (categoryDishes.length === 0) return null;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <DishGrid
                  dishes={categoryDishes}
                  category={category.name}
                  onViewMore={() => handleViewMore(category.name)}
                  enableSwipe={true}
                />
              </motion.div>
            );
          })}
        </div>
      </section>

     <TestimonialsSection />


      <div className={styles.ctaSection}>
        
        <Link href="/order" passHref>
          <button 
            className={`${styles.ctaButton} ${styles.focusRing}`}
            onClick={handleGetStarted}
            aria-label="Get started with Balance Kitchen"
          >
            Ready to Get Started?
          </button>
        </Link>
      </div>
    </div>
  );
}
