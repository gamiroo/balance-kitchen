'use client';

import React, { useState } from "react";
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
import { EnquiryForm } from "components/ui/forms/enquiry/EnquiryForm";

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

      {/* MODAL FOR JOTFORM - Simple embed without spinner */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Join Balance Kitchen"
      >
        <div style={{ padding: '20px' }}>
          <EnquiryForm 
            onSubmitSuccess={closeModal}
            onSubmitError={() => console.log('Form submission failed')}
          />
        </div>
      </Modal>
    </div>
  );
}
