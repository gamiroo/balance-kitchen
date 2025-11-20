// src/app/frontend/landing/page.tsx
'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AboutSection } from "@/shared/components/frontend/about-section/AboutSection";
import { Header } from "@/shared/components/frontend/header/Header";
import { Hero } from "@/shared/components/frontend/hero/Hero";
import TestimonialsSection from "@/shared/components/frontend/testimonials/TestimonialSection";
import FAQAccordion from "@/shared/components/frontend/faq/FAQAccordion";
import styles from './page.module.css';
import { faqs } from "@/data/faqData";
import { AccountManagerStep } from "@/shared/components/frontend/account-manager-step-1/AccountManagerStep";
import { MealPlanSection } from "@/shared/components/frontend/meal-packs-step-2/MealPacksSection";
import { OrderingSection } from "@/shared/components/frontend/ordering-step-3/OrderingSection";
import { DeliverySection } from "@/shared/components/frontend/delivery-step-4/DeliverySection";
import { FeedbackSection } from "@/shared/components/frontend/feedback-step-5/FeedbackSection";
import { Footer } from "@/shared/components/frontend/footer/Footer";
import { Modal } from "@/shared/components/ui/modal/Modal";
import { EnquiryForm } from "@/shared/components/ui/forms/enquiry/EnquiryForm";

export default function MainPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal handlers
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.landingPage}>
      <Header onOpenModal={openModal} />
      <div className={`${styles.headerSpacer} ${styles.headerSpacerMd}`} />
      <Hero />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      <AboutSection />
      <div className={`${styles.sectionSpacer} ${styles.sectionSpacerMd}`} />
      
      {/* How It Works Title Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.howItWorksContent}>
          <motion.h2 
            className={styles.howItWorksTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Getting Started With Balance Kitchen
          </motion.h2>
          <motion.p 
            className={styles.howItWorksSubtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Simple steps to get delicious, personalized meals delivered to your door
          </motion.p>
        </div>
      </section>
      
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Join Balance Kitchen"
      >
        <div style={{ padding: '30px' }}>
          <EnquiryForm 
            onSubmitSuccess={closeModal}
            onSubmitError={() => console.log('Form submission failed')}
          />
        </div>
      </Modal>
    </div>
  );
}
