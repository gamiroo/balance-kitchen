// app/components/FAQAccordion.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

// ✅ Use the real FAQItem type from your data file
import type { FAQItem } from '../../../data/faqData';

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export default function FAQAccordion({ faqs = [] }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className={styles.faqContainer} role="region" aria-label="Frequently Asked Questions">
      <div
        className={`${styles.accordionContainer} ${isLoading ? styles.disabledState : ''}`}
        aria-busy={isLoading}
      >
        {isLoading && (
          <div className={`${styles.loadingOverlay} ${styles.loadingOverlayActive}`}>
            <div className={styles.loadingSpinner} aria-label="Loading FAQ content"></div>
          </div>
        )}

        {faqs.map((faq) => (
          <motion.div
            key={faq.id}
            className={styles.accordionItem}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            role="group"
            aria-label={`Question: ${faq.question}`}
          >
            <button
              className={styles.accordionButton}
              onClick={() => toggleAccordion(faq.id)}
              aria-expanded={openIndex === faq.id}
              aria-controls={`faq-answer-${faq.id}`}
              id={`faq-question-${faq.id}`}
            >
              <h3 className={`${styles.questionText} ${styles.questionTextMd}`}>
                {faq.question}
              </h3>
              <motion.div
                animate={{ rotate: openIndex === faq.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={styles.chevronContainer}
              >
                <ChevronDown className={styles.chevronIcon} size={24} aria-hidden="true" />
              </motion.div>
            </button>

            <motion.div
              id={`faq-answer-${faq.id}`}
              initial={false}
              animate={{
                height: openIndex === faq.id ? 'auto' : 0,
                opacity: openIndex === faq.id ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className={styles.answerContainer}
              role="region"
              aria-labelledby={`faq-question-${faq.id}`}
            >
              <div className={styles.answerContent}>{faq.answer}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
