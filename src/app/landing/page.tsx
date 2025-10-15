// app/landing/page.tsx
'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AboutSection } from "../../components/about-section/About";
import { Header } from "../../components/Header";
import { Hero } from "../../components/Hero";
import DishGrid from "../../components/DishGrid";
import { dishData } from "../../data/dishData";
import type { Dish } from "../../components/DishCard";
import TestimonialsSection from "../../components/TestimonialSection";
import FAQAccordion from "../../components/FAQAccordion";
import styles from './page.module.css';
import Link from "next/link";
import { faqs } from "../../data/faqData";
import { AccountManagerStep } from "components/account-manager-step-1/AccountManagerStep";
import { MealPlanSection } from "../../components/meal-plans-step-2/MealPlanSection";
import { OrderingSection } from "components/ordering-step-3/OrderingSection";
import { DeliverySection } from "components/delivery-step-4/DeliverySection";

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
      <AboutSection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      <AccountManagerStep />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      <MealPlanSection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      <OrderingSection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      <DeliverySection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      
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
