// src/app/components/meal-plans-step-2/MealPlanSection.tsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { useTheme } from '../../../hooks/useTheme';
import { CTAButton } from '../../ui/CTAButton/CTAButton';
import { Modal } from '../../ui/modal/Modal';
import ProductCard from './components/product-card/ProductCard';
import styles from './MealPacksSection.module.css';
import { bulkPacks, deliveryPacks, Pack, subscriptionPacks } from './data/plansData';

export const MealPlanSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentNode = sectionRef.current;
    if (!currentNode) return;

    const observer = new IntersectionObserver(
      () => {
        // Intersection observer callback - currently not tracking specific entry data
        // This can be enhanced later for analytics or other intersection-based functionality
      },
      { threshold: 0.2 }
    );

    observer.observe(currentNode);

    return () => {
      // Use the captured node value
      observer.unobserve(currentNode);
    };
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    setActiveStep(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const allPacks: Pack[] = [
    ...subscriptionPacks,
    ...bulkPacks,
    ...deliveryPacks,
  ].slice(0, 5);

  const cardPositions = [
    { top: '20%', left: '10%' },
    { top: '15%', left: '35%' },
    { top: '40%', left: '20%' },
    { top: '35%', left: '55%' },
    { top: '60%', left: '35%' },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        className={styles.menuPlanSection}
        aria-label="Menu Plans Section"
      >
        <div className={styles.contentContainer}>
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
                    height: '320px',
                  }}
                >
                  <ProductCard pack={pack} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.textContent}>
            <h2 className={styles.sectionTitle}>
              Step 2 – Choose Your Pack and/or Subscription
            </h2>
            <p className={styles.sectionDescription}>
              Start by selecting your meal size, then customize with optional subscription services.
              Our tiered customization options build upon each other to give you exactly what you need.
            </p>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>1</div>
                <div>
                  <h3 className={styles.featureTitle}>Choose Your Meal Size</h3>
                  <p className={styles.featureDescription}>
                    Select from our perfectly portioned Lean or Power packs
                  </p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>2</div>
                <div>
                  <h3 className={styles.featureTitle}>Customize Your Plan</h3>
                  <p className={styles.featureDescription}>
                    Add subscription services with 3 tiers of customization
                  </p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>3</div>
                <div>
                  <h3 className={styles.featureTitle}>Select Delivery or Pick-up</h3>
                  <p className={styles.featureDescription}>
                    Choose delivery or pick-up for your meals
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.readMoreContainer}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  openModal();
                }}
                className={styles.readMoreLink}
                aria-label="Learn more about meal plans and subscriptions"
              >
                Learn More About Our Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Meal Plans & Subscriptions"
          theme={theme}
        >
          <div className={`${styles.modalContent} ${styles[theme]}`}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className={styles.modalWrapper}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Our Meal Plans Explained</h2>
                <p className={styles.modalSubtitle}>Choose the perfect plan for your lifestyle</p>
              </div>

              <div className={styles.tabContainer}>
                <div className={styles.tabHeaders}>
                  <button
                    className={`${styles.tabButton} ${activeStep === 0 ? styles.active : ''}`}
                    onClick={() => setActiveStep(0)}
                  >
                    Meal Sizes
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeStep === 1 ? styles.active : ''}`}
                    onClick={() => setActiveStep(1)}
                  >
                    Customization
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeStep === 2 ? styles.active : ''}`}
                    onClick={() => setActiveStep(2)}
                  >
                    Delivery
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeStep === 3 ? styles.active : ''}`}
                    onClick={() => setActiveStep(3)}
                  >
                    Summary
                  </button>
                </div>

                <div className={styles.tabContent}>
                    {activeStep === 0 && (
                      <div className={styles.stepContent}>
                        <h3 className={styles.modalSubheading}>Step 1: Choose Your Meal Size</h3>
                        <p className={styles.modalDescription}>
                          Start by selecting from our two perfectly portioned options:
                        </p>

                        <div className={styles.modalPlanContainer}>
                          <div className={styles.modalPlan}>
                            <div className={styles.modalPlanHalf}>
                              <div className={styles.imagePlaceholder}>
                                <Image
                                  src="/images/balanced-plan.jpg"
                                  alt="Busy professional woman eating portion-controlled healthy meal at office desk"
                                  className={styles.planImage}
                                  width={512}
                                  height={384}
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </div>
                            </div>
                            <div className={styles.modalPlanHalf}>
                              <div className={styles.modalPlanContent}>
                                <h4 className={styles.modalPlanTitle}>Balance Lean</h4>
                                <p className={styles.modalPlanDetails}>120G PROTEIN, 100G CARB, 80G VEG</p>
                                <ul className={styles.modalPlanPricing}>
                                  <li>1–10 Meals: $15 each</li>
                                  <li>20 Meals: $14 each</li>
                                  <li>40 Meals: $13 each</li>
                                </ul>
                                <button
                                  className={`${styles.ctaButton} ${styles.inactiveButton}`}
                                  aria-label="Select Balance Lean plan"
                                  disabled
                                >
                                  <span className={styles.buttonText}>
                                    <span>Select Plan</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className={styles.modalPlan}>
                            <div className={styles.modalPlanHalf}>
                              <div className={styles.imagePlaceholder}>
                                <Image
                                  src="/images/balance-power.png"
                                  alt="Athletic man eating high-protein meal at gym between workout sets"
                                  className={styles.planImage}
                                  width={512}
                                  height={384}
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </div>
                            </div>
                            <div className={styles.modalPlanHalf}>
                              <div className={styles.modalPlanContent}>
                                <h4 className={styles.modalPlanTitle}>Balance Power</h4>
                                <p className={styles.modalPlanDetails}>160G PROTEIN, 160G CARB, 110G VEG</p>
                                <ul className={styles.modalPlanPricing}>
                                  <li>1–10 Meals: $17 each</li>
                                  <li>20 Meals: $16 each</li>
                                  <li>40 Meals: $15 each</li>
                                </ul>
                                <button
                                  className={`${styles.ctaButton} ${styles.inactiveButton}`}
                                  aria-label="Select Balance Power plan"
                                  disabled
                                >
                                  <span className={styles.buttonText}>
                                    <span>Select Plan</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 1 && (
                      <div className={styles.stepContent}>
                        <h3 className={styles.modalSubheading}>Step 2: Customization Subscriptions</h3>
                        <p className={styles.modalDescription}>
                          Have specific dietary needs or fitness goals? We specialise in tailored meals
                          designed just for you. From low-histamine diets to keto, low-fiber, or allergy-friendly
                          options, we&apos;ve got you covered.
                        </p>

                        <div className={styles.modalTierContainer}>
                          <div className={styles.modalTier}>
                            <div className={styles.tierHeader}>
                              <h4 className={styles.modalTierTitle}>Basic</h4>
                              <span className={styles.tierPrice}>$5/month</span>
                            </div>
                            <ul className={styles.modalTierFeatures}>
                              <li>Standard dietary modifications</li>
                              <li>Basic macro adjustments</li>
                              <li>Email support</li>
                            </ul>
                            <button
                              className={`${styles.ctaButton} ${styles.inactiveButton}`}
                              aria-label="Add Basic Customization to plan"
                              disabled
                            >
                              <span className={styles.buttonText}>
                                <span>Add to Plan</span>
                              </span>
                            </button>
                          </div>

                          <div className={styles.modalTier}>
                            <div className={styles.tierHeader}>
                              <h4 className={styles.modalTierTitle}>Advanced</h4>
                              <span className={styles.tierPrice}>$15/month</span>
                            </div>
                            <p className={styles.modalTierIncludes}>(Includes everything from Tier 1)</p>
                            <ul className={styles.modalTierFeatures}>
                              <li>Specialized diet plans (keto, paleo, etc.)</li>
                              <li>Precise macro/calorie targeting</li>
                              <li>Priority email support</li>
                              <li>Weekly check-ins</li>
                            </ul>
                            <button
                              className={`${styles.ctaButton} ${styles.inactiveButton}`}
                              aria-label="Add Advanced Customization to plan"
                              disabled
                            >
                              <span className={styles.buttonText}>
                                <span>Add to Plan</span>
                              </span>
                            </button>
                          </div>

                          <div className={styles.modalTier}>
                            <div className={styles.tierHeader}>
                              <h4 className={styles.modalTierTitle}>Premium</h4>
                              <span className={styles.tierPrice}>$30/month</span>
                            </div>
                            <p className={styles.modalTierIncludes}>(Includes everything from Tier 1 &amp; 2)</p>
                            <ul className={styles.modalTierFeatures}>
                              <li>Completely personalized meal plans</li>
                              <li>Direct consultation with nutritionist</li>
                              <li>Unlimited support</li>
                              <li>Daily check-ins</li>
                              <li>Progress tracking &amp; adjustments</li>
                            </ul>
                            <button
                              className={`${styles.ctaButton} ${styles.inactiveButton}`}
                              aria-label="Add Premium Customization to plan"
                              disabled
                            >
                              <span className={styles.buttonText}>
                                <span>Add to Plan</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 2 && (
                      <div className={styles.stepContent}>
                        <h3 className={styles.modalSubheading}>Step 3: Delivery Options</h3>
                        <p className={styles.modalDescription}>
                          After selecting your meal size and customization tier, you must choose a delivery or pick-up option:
                        </p>

                        <div className={styles.deliveryOptions}>
                          <div className={styles.deliveryOption}>
                            <div className={styles.optionIcon}>🚚</div>
                            <div className={styles.optionContent}>
                              <h4 className={styles.optionTitle}>Delivery Subscription</h4>
                              <p className={styles.optionDescription}>
                                Convenient doorstep delivery with flexible scheduling.
                                Choose from weekly, bi-weekly, or custom delivery schedules.
                              </p>
                              <div className={styles.optionPrice}>$8/week</div>
                              <button
                                className={`${styles.ctaButton} ${styles.inactiveButton}`}
                                aria-label="Select Delivery Subscription"
                                disabled
                              >
                                <span className={styles.buttonText}>
                                  <span>Add to Plan</span>
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className={styles.deliveryOption}>
                            <div className={styles.optionIcon}>🏪</div>
                            <div className={styles.optionContent}>
                              <h4 className={styles.optionTitle}>Pick-Up</h4>
                              <p className={styles.optionDescription}>
                                Free option to collect your meals at our facility.
                                Available Monday through Friday from 10am-6pm.
                              </p>
                              <div className={styles.optionPrice}>FREE</div>
                              <button
                                className={`${styles.ctaButton} ${styles.inactiveButton}`}
                                aria-label="Select Pick-Up"
                                disabled
                              >
                                <span className={styles.buttonText}>
                                  <span>Add to Plan</span>
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className={styles.modalDescription}>
                          Enquire now to see if we can help you achieve your dietary goals!
                        </p>
                      </div>
                    )}

                    {activeStep === 3 && (
                      <div className={styles.stepContent}>
                        <h3 className={styles.modalSubheading}>Your Plan Summary</h3>
                        <p className={styles.modalDescription}>
                          Review your selected meal plan before proceeding to checkout.
                        </p>

                        <div className={styles.summaryContainer}>
                          <div className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                              <h4 className={styles.summaryTitle}>Balance Power Pack</h4>
                              <span className={styles.summaryPrice}>$16/meal</span>
                            </div>
                            <div className={styles.summaryDetails}>
                              <p>20 Meals per month</p>
                              <p className={styles.summarySubtext}>160G PROTEIN, 160G CARB, 110G VEG</p>
                            </div>
                            <div className={styles.summaryTotal}>
                              <span>Subtotal:</span>
                              <span>$320/month</span>
                            </div>
                          </div>

                          <div className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                              <h4 className={styles.summaryTitle}>Advanced Customization</h4>
                              <span className={styles.summaryPrice}>$15/month</span>
                            </div>
                            <div className={styles.summaryDetails}>
                              <p>Specialized diet plans</p>
                              <p>Precise macro targeting</p>
                              <p>Priority support &amp; check-ins</p>
                            </div>
                            <div className={styles.summaryTotal}>
                              <span>Subtotal:</span>
                              <span>$15/month</span>
                            </div>
                          </div>

                          <div className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                              <h4 className={styles.summaryTitle}>Delivery Subscription</h4>
                              <span className={styles.summaryPrice}>$32/month</span>
                            </div>
                            <div className={styles.summaryDetails}>
                              <p>Weekly doorstep delivery</p>
                              <p>Flexible scheduling</p>
                            </div>
                            <div className={styles.summaryTotal}>
                              <span>Subtotal:</span>
                              <span>$32/month</span>
                            </div>
                          </div>

                          <div className={styles.summaryTotalCard}>
                            <div className={styles.totalRow}>
                              <span>Subtotal:</span>
                              <span>$367/month</span>
                            </div>
                            <div className={styles.totalRow}>
                              <span>Tax (10%):</span>
                              <span>$36.70/month</span>
                            </div>
                            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                              <span>Grand Total:</span>
                              <span>$403.70/month</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.summaryActions}>
                          <button 
                            className={styles.summaryBackButton} 
                            onClick={() => setActiveStep(2)}
                          >
                            ← Back to Delivery
                          </button>
                          <button
                            className={`${styles.ctaButton} ${styles.checkoutButton}`}
                            onClick={() => {}}
                          >
                            <span className={styles.buttonText}>
                              <span>Proceed to Checkout</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalNavigation}>
                  <button
                    className={styles.navButton}
                    onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                    disabled={activeStep === 0}
                  >
                    ← Previous
                  </button>
                  <button
                    className={styles.navButton}
                    onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
                    disabled={activeStep === 3}
                  >
                    Next →
                  </button>
                </div>

                <div className={styles.modalCtaContainer}>
                  <CTAButton 
                    href="/waitlist" 
                    aria-label="Join the waitlist for Balance Kitchen"
                  >
                    Enquire About Custom Plans
                  </CTAButton>
                </div>
              </div>
            </div>
        </Modal>
      )}
    </>
  );
};
