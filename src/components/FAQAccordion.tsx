// app/components/FAQ.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './styles/FAQ.module.css';
import { type FAQItem } from '../data/faqData';

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isLoading] = useState(false); // Keep isLoading but don't destructure setIsLoading

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faqContainer} role="region" aria-label="Frequently Asked Questions">
      <div 
        className={`${styles.accordionContainer} ${isLoading ? styles.disabledState : ''}`}
        aria-busy={isLoading}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className={`${styles.loadingOverlay} ${styles.loadingOverlayActive}`}>
            <div className={styles.loadingSpinner} aria-label="Loading FAQ content"></div>
          </div>
        )}
        
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            className={styles.accordionItem}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            viewport={{ once: true }}
            role="group" // Changed from "article" to "group"
            aria-expanded={openIndex === index}
            aria-label={`Question: ${faq.question}`}
          >
            <button
              className={styles.accordionButton}
              onClick={() => toggleAccordion(index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className={`${styles.questionText} ${styles.questionTextMd}`}>
                {faq.question}
              </h3>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={styles.chevronContainer}
              >
                <ChevronDown 
                  className={styles.chevronIcon} 
                  size={24} 
                  aria-hidden="true"
                />
              </motion.div>
            </button>
            
            <motion.div
              id={`faq-answer-${index}`}
              initial={false}
              animate={{
                height: openIndex === index ? 'auto' : 0,
                opacity: openIndex === index ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className={styles.answerContainer}
              role="region"
              aria-labelledby={`faq-question-${index}`}
            >
              <div className={styles.answerContent}>
                {faq.answer}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
