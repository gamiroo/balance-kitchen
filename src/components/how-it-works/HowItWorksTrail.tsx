// app/components/HowItWorks.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Calendar,
  Utensils,
  Soup,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { CTAButton } from '../CTAButton';
import { MovingBorder } from '../ui/AnimatedBorderBox';
import Image from 'next/image';
import styles from '../styles/HowItWorks.module.css';

/* ------------------------------------------------------------------ */
/* 1️⃣  Step data with optional media */
const steps = [
  {
    title: 'Meet Your Account Manager',
    description:
      'Quickly sign up with your email or social login. We’ll send you a confirmation to keep your account safe.',
    icon: <User size={24} />,
    image: '/images/step1.jpg',
    alt: 'Account manager consultation',
  },
  {
    title: 'Create Your Profile',
    description:
      'Choose the plan that fits your lifestyle: a weekly subscription for steady supply, or an 80‑meal savings account to pay once and eat at your own pace.',
    icon: <Calendar size={24} />,
    video: '/videos/profile-setup.mp4',
    alt: 'Profile creation process',
  },
  {
    title: 'Pick a Plan',
    description:
      'Help us match your taste buds and dietary needs. A short questionnaire tells us about your allergens, preferred flavors, and health goals.',
    icon: <Utensils size={24} />,
    image: '/images/step3.jpg',
    alt: 'Meal plan selection',
  },
  {
    title: 'Start Ordering',
    description:
      'Your first box arrives, ready to eat. Each meal keeps your nutrition on track, while the savings account gives you flexibility.',
    icon: <Soup size={24} />,
    image: '/images/step4.jpg',
    alt: 'Fresh meal delivery',
  },
];

/* ------------------------------------------------------------------ */
/* 2️⃣  Component – progress bar sits above the icons                */
export default function HowItWorks() {
  const [active, setActive] = useState<number | null>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const total = steps.length;

  // Width percent for the filled bar
  const barWidth = active !== null ? ((active + 1) / total) * 100 : 0;

  // Navigation functions
  const goToNext = () => {
    if (active !== null && active < total - 1) {
      setActive(active + 1);
    }
  };

  const goToPrevious = () => {
    if (active !== null && active > 0) {
      setActive(active - 1);
    }
  };

  // Handle video play/pause
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Intersection Observer effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenInView) {
          setActive(0); // Activate step 1 when section comes into view
          setHasBeenInView(true);
        }
      },
      { threshold: 0.5 }
    );

    const section = document.getElementById('how-it-works');
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [hasBeenInView]);

  // Pause video when changing steps
  useEffect(() => {
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [active, isVideoPlaying]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force re-render MovingBorder when active step changes
  const [borderKey, setBorderKey] = useState(0);
  useEffect(() => {
    setBorderKey(prev => prev + 1);
  }, [active]);

  return (
    <section 
      id="how-it-works"
      className={`${styles.howItWorksSection} ${styles.howItWorksSectionMd} ${isLoading ? styles.disabledState : ''}`}
      role="region"
      aria-labelledby="how-it-works-heading"
      aria-describedby="how-it-works-description"
      aria-busy={isLoading}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`${styles.loadingOverlay} ${styles.loadingOverlayActive}`}>
          <div className={styles.loadingSpinner} aria-label="Loading content"></div>
        </div>
      )}

      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className={styles.skipLink}
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header & progress counter */}
      <div className={`${styles.header} ${styles.headerMd}`}>
        <h2 
          id="how-it-works-heading"
          className={`${styles.headerTitle} ${styles.headerTitleMd}`}
        >
          How It Works
        </h2>
        <p 
          id="how-it-works-description"
          className={styles.headerDescription}
        >
          Follow our step‑by‑step journey from signing up to enjoying your first meal.
        </p>
        <p className={styles.stepCounter}>
          Step <span aria-live="polite">{active !== null ? active + 1 : 1}</span> of {total}
        </p>
      </div>

      {/* ---------------------------------  Progress Bar  --------------------------------- */}
      <div className={`${styles.progressBarContainer} ${styles.progressBarContainerMd}`}>
        <div className={styles.progressBarTrack}>
          <motion.div
            className={styles.progressBarFill}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-valuenow={barWidth}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label="Progress through steps"
          />
        </div>
      </div>

      {/* ---------------------------------  Timeline (icons) - Centered and Aligned  --------------------------------- */}
      <div className={`${styles.timelineContainer} ${styles.timelineContainerMd}`}>
        <div className={`${styles.timelineGrid} ${styles.timelineGridSm}`}>
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className={styles.timelineStep}
            >
              <button
                onClick={() => setActive(idx)}
                aria-current={active === idx ? 'step' : undefined}
                aria-label={`Go to step ${idx + 1}: ${step.title}`}
                className={`${styles.stepButton} ${
                  active === idx
                    ? styles.stepButtonActive
                    : ''
                } ${styles.focusRing}`}
              >
                {step.icon}
              </button>
              <h3 
                className={`${styles.stepTitle} ${styles.stepTitleSm} ${
                  active === idx
                    ? styles.stepTitleActive
                    : ''
                }`}
              >
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------  Content Box with Moving Border  --------------------------------- */}
      <div className={`${styles.contentBox} ${styles.contentBoxMd}`}>
        <div className={styles.contentWrapper}>
          <AnimatePresence mode="wait">
            {active !== null && (
              <motion.div
                key={`${steps[active].title}-${active}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={styles.movingBorderContainer}
              >
                <MovingBorder
                  key={`border-${borderKey}`} // Force re-render to recalculate dimensions
                  width="100%"
                  height="100%"
                  strokeWidth={isMobile ? 1.5 : 2}
                  duration={70}
                  radius={isMobile ? 12 : 16}
                  gradientColors={['#ffc33e', '#cb2e12']}
                  className={styles.movingBorderContainer}
                  ariaLabel={`Step ${active + 1} content`}
                  ariaDescribedBy={`step-${active}-description`}
                  role="region"
                  reduceMotion={false}
                >
                  <div className="p-6 md:p-8 bg-slate-900/25 backdrop-blur-lg rounded-xl border border-slate-800/50">
                    {/* Media Section - Image or Video with consistent dimensions */}
                    <div className={styles.mediaContainer}>
                      {steps[active].image && (
                        <div className={styles.mediaWrapper} style={{ aspectRatio: '16/9' }}>
                          <Image
                            src={steps[active].image!}
                            alt={steps[active].alt || steps[active].title}
                            fill
                            className={styles.mediaImage}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            loading="lazy"
                            priority={false}
                          />
                        </div>
                      )}
                      
                      {steps[active].video && (
                        <div className={styles.mediaWrapper} style={{ aspectRatio: '16/9' }}>
                          <video
                            ref={videoRef}
                            src={steps[active].video!}
                            className={styles.mediaVideo}
                            controls={false}
                            aria-label={steps[active].alt || steps[active].title}
                            poster="/images/video-poster.jpg"
                          />
                          <button
                            onClick={toggleVideo}
                            className={styles.videoOverlay}
                            aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                          >
                            {!isVideoPlaying && (
                              <div className={styles.playButtonContainer}>
                                <Play size={32} className={styles.playButton} />
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p 
                      id={`step-${active}-description`}
                      className={`${styles.description} ${styles.descriptionMd}`}
                    >
                      {steps[active].description}
                    </p>
                    
                    {/* Navigation buttons and CTA */}
                    <div className={`${styles.navigationContainer} ${styles.navigationContainerSm}`}>
                      {/* Previous button - only show from step 2 onwards */}
                      {active > 0 && (
                        <motion.button
                          onClick={goToPrevious}
                          whileHover={{ scale: 0.85 }}
                          whileTap={{ scale: 0.95 }}
                          className={`${styles.navButton} ${styles.focusRing}`}
                          aria-label="Go to previous step"
                        >
                          <ChevronLeft size={20} className={styles.navButtonIconLeft} />
                          <span className={styles.navButtonText}>Previous</span>
                        </motion.button>
                      )}
                      
                      {/* Spacer when no previous button */}
                      {active === 0 && <div className={`${styles.navSpacer} ${styles.navSpacerSm}`}></div>}
                      
                      {/* CTA Button */}
                      <div className="flex-grow flex justify-center my-2 sm:my-0">
                        <CTAButton 
                          aria-label="Get started with Balance Kitchen"
                          onClick={() => setIsLoading(true)}
                        >
                          Get Started
                        </CTAButton>
                      </div>
                      
                      {/* Next button - show on all steps except the last */}
                      {active < total - 1 && (
                        <motion.button
                          onClick={goToNext}
                          whileHover={{ scale: 0.85 }}
                          whileTap={{ scale: 0.95 }}
                          className={`${styles.navButton} ${styles.focusRing}`}
                          aria-label="Go to next step"
                        >
                          <span className={styles.navButtonText}>Next</span>
                          <ChevronRight size={20} className={styles.navButtonIconRight} />
                        </motion.button>
                      )}
                      
                      {/* Spacer when no next button */}
                      {active === total - 1 && <div className={`${styles.navSpacer} ${styles.navSpacerSm}`}></div>}
                    </div>
                  </div>
                </MovingBorder>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
