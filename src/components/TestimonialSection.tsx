// app/components/TestimonialsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import styles from './styles/Testimonials.module.css';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  quote: string;
  image: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp',
    quote: 'Balance Kitchen transformed my relationship with food. The convenience and quality are unmatched. I\'ve never felt better!',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    rating: 5
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Software Engineer',
    company: 'StartupXYZ',
    quote: 'As someone with a hectic schedule, this service is a game-changer. Fresh, delicious meals delivered on time every week.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    rating: 5
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    role: 'Fitness Trainer',
    company: 'FitLife Gym',
    quote: 'The nutritional balance is perfect for my active lifestyle. My clients are always asking me about my meals!',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    rating: 5
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Entrepreneur',
    company: 'Venture Capital',
    quote: 'Finally, a meal service that understands premium quality. The flavors are restaurant-grade and the convenience is unbeatable.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    rating: 5
  },
  {
    id: '5',
    name: 'Priya Sharma',
    role: 'Nutritionist',
    company: 'Wellness Center',
    quote: 'I recommend Balance Kitchen to all my clients. The macro tracking is spot-on and the ingredients are always fresh.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    rating: 5
  },
  {
    id: '6',
    name: 'James Wilson',
    role: 'Consultant',
    company: 'Global Solutions',
    quote: 'Traveling frequently, I rely on Balance Kitchen for consistent, healthy meals. It\'s become an essential part of my routine.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    rating: 5
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>([]);
  const [direction, setDirection] = useState(0);

  // Initialize with first testimonial
  useEffect(() => {
    setVisibleTestimonials([testimonials[0]]);
  }, []);

  const nextTestimonial = () => {
    setDirection(1);
    const nextIndex = (currentIndex + 1) % testimonials.length;
    setCurrentIndex(nextIndex);
    setVisibleTestimonials([testimonials[nextIndex]]);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    setCurrentIndex(prevIndex);
    setVisibleTestimonials([testimonials[prevIndex]]);
  };

  const goToTestimonial = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setVisibleTestimonials([testimonials[index]]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-amber-400 fill-current' : 'text-gray-600'}
        aria-hidden="true"
      />
    ));
  };

  return (
    <section className={styles.testimonialsSection} role="region" aria-label="Customer Testimonials">
      <div className={styles.contentContainer}>
        {/* Section Header */}
        <motion.div
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className={styles.badge}>
            <Star className={styles.badgeIcon} size={16} aria-hidden="true" />
            Trusted by thousands
          </div>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleMd}`}>
            What Our <span className={styles.sectionTitleHighlight}>Customers</span> Say
          </h2>
          <p className={styles.sectionDescription}>
            Join thousands of satisfied customers who have transformed their eating habits with Balance Kitchen
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className={styles.carouselContainer}>
          <AnimatePresence mode="wait" custom={direction}>
            {visibleTestimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={styles.testimonialCardWrapper}
              >
                <div className={styles.testimonialCard}>
                  {/* Quote Icon */}
                  <div className={styles.quoteIcon} aria-hidden="true">
                    <Quote size={80} />
                  </div>

                  {/* Main Card */}
                  <div className={`${styles.mainCard} ${styles.mainCardMd}`}>
                    {/* Rating */}
                    <div className={styles.ratingContainer} aria-label={`Rating: ${testimonial.rating} out of 5 stars`}>
                      {renderStars(testimonial.rating)}
                    </div>

                    {/* Quote */}
                    <blockquote className={`${styles.quoteText} ${styles.quoteTextMd}`}>
                      <p className={styles.quoteTextContent}>{testimonial.quote}</p>
                    </blockquote>

                    {/* Author */}
                    <div className={styles.authorContainer}>
                      <div className={styles.authorImageContainer}>
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className={styles.authorImage}
                        />
                        <div className={styles.authorImagePulse}></div>
                      </div>
                      <div className={styles.authorInfo}>
                        <div className={styles.authorName}>
                          {testimonial.name}
                        </div>
                        <div className={styles.authorRole}>
                          {testimonial.role}
                        </div>
                        {testimonial.company && (
                          <div className={styles.authorCompany}>
                            {testimonial.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Navigation Arrows */}
          <div className={styles.navigationContainer}>
            <button
              onClick={prevTestimonial}
              className={`${styles.navButton} ${styles.focusRing}`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>

            {/* Dots Indicator */}
            <div className={styles.dotsContainer} role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`${styles.dotButton} ${
                    index === currentIndex
                      ? styles.dotButtonActive
                      : ''
                  } ${styles.focusRing}`}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-selected={index === currentIndex}
                  role="tab"
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className={`${styles.navButton} ${styles.focusRing}`}
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          className={`${styles.statsGrid} ${styles.statsGridMd}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {[
            { value: '4.9', label: 'Average Rating', suffix: '/5' },
            { value: '1K+', label: 'Happy Brisbane Customers' },
            { value: '98%', label: 'On-Time Delivery' },
            { value: '100+', label: 'Customer Reviews' }
          ].map((stat, index) => (
            <div
              key={index}
              className={styles.statCard}
              role="region"
              aria-label={`${stat.value} ${stat.label}`}
            >
              <div className={`${styles.statValue} ${styles.statValueMd}`}>
                {stat.value}
                {stat.suffix && (
                  <span className={styles.statSuffix}>{stat.suffix}</span>
                )}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
