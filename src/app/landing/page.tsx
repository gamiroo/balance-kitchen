'use client';

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AboutSection } from "../../components/about-section/About";
import { Header } from "../../components/Header";
import { Hero } from "../../components/Hero";
import TestimonialsSection from "../../components/TestimonialSection";
import FAQAccordion from "../../components/FAQAccordion";
import styles from './page.module.css';
import { faqs } from "../../data/faqData";
import { AccountManagerStep } from "components/account-manager-step-1/AccountManagerStep";
import { MealPlanSection } from "../../components/meal-plans-step-2/MealPlanSection";
import { OrderingSection } from "components/ordering-step-3/OrderingSection";
import { DeliverySection } from "components/delivery-step-4/DeliverySection";
import { FeedbackSection } from "components/feedback-step-5/FeedbackSection";
import { Footer } from "components/Footer";
import { Modal } from "../../components/modal/Modal";

// Categories for the main page (show only first 6 dishes of each)
const categories = [
  { name: 'Carnivore', color: 'text-red-500' },
  { name: 'Balanced', color: 'text-green-500' },
  { name: 'Vegetarian', color: 'text-emerald-500' },
  { name: 'Keto', color: 'text-purple-500' },
];

export default function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* -------------------------------------------------
     Preload Jotform resources for better performance
     ------------------------------------------------- */
  useEffect(() => {
    const preloadResources = () => {
      if (typeof window !== 'undefined') {
        // Preload Jotform script
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = 'https://form.jotform.com/jsform/251188224283053';
        document.head.appendChild(link);
      }
    };

    preloadResources();
  }, []);

  /* -------------------------------------------------
     Simple Jotform loading without spinner
     ------------------------------------------------- */
  const loadJotformForm = useCallback(() => {
    if (!isModalOpen) return;

    const container = document.getElementById('jotform-form-container');
    
    if (container) {
      // Clear container first
      container.innerHTML = '';

      // Load Jotform form script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://form.jotform.com/jsform/251188224283053';
      script.async = true;
      
      script.onerror = () => {
        container.innerHTML = `
          <div style="
            text-align: center;
            padding: 40px;
            color: #ef4444;
          ">
            <p>Failed to load form. Please try again.</p>
            <button 
              onclick="location.reload()"
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 10px;
                font-family: inherit;
              "
            >
              Retry
            </button>
          </div>
        `;
      };

      container.appendChild(script);
    }
  }, [isModalOpen]);

  /* -------------------------------------------------
     Load form when modal opens
     ------------------------------------------------- */
  useEffect(() => {
    if (isModalOpen) {
      // Load Jotform form with small delay
      const timeoutId = setTimeout(() => {
        loadJotformForm();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clean up when modal closes
      const container = document.getElementById('jotform-form-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  }, [isModalOpen, loadJotformForm]);

  const handleViewMore = (category: string) => {
    console.log(`View more ${category} dishes`);
  };

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Modal handlers
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
      
      <Header onOpenModal={openModal} />
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
      <FeedbackSection />
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
        <Footer />
      </div>

      {/* MODAL FOR JOTFORM - Simple embed without spinner */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Join Balance Kitchen"
      >
        <div 
          id="jotform-form-container" 
          style={{ 
            minHeight: '600px',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          {/* Form will be loaded directly - no spinner */}
        </div>
      </Modal>
    </div>
  );
}
