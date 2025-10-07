// app/components/DishCarousel.tsx
'use client';

import { useRef, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DishCard, { type Dish } from "./DishCard";
import { CTAButton } from "./CTAButton";
import styles from './DishCarousel.module.css';

interface DishCarouselProps {
  dishes: Dish[];
  category: string;
  onViewMore: () => void;
}

export default function DishCarousel({ dishes, category, onViewMore }: DishCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Limit dishes to 6 for display
  const displayedDishes = dishes.slice(0, 6);
  
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: "snap",
    slides: {
      perView: 1,
      spacing: 16,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: { perView: 2, spacing: 16 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 3, spacing: 24 },
      },
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    }
  });

  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case 'Carnivore': return styles.categoryCarnivore;
      case 'Balanced': return styles.categoryBalanced;
      case 'Vegetarian': return styles.categoryVegetarian;
      case 'Keto': return styles.categoryKeto;
      default: return styles.categoryDefault;
    }
  };

  // Only show carousel if there are dishes
  if (displayedDishes.length === 0) {
    return null;
  }

  return (
    <div className={styles.carouselContainer} role="region" aria-label={`${category} dishes carousel`}>
      {/* Category Header */}
      <div className={styles.categoryHeader}>
        <div>
          <h2 className={`${styles.categoryTitle} ${getCategoryColorClass(category)}`}>
            {category}
          </h2>
          <p className={styles.categoryDescription}>
            Discover our delicious {category.toLowerCase()} options
          </p>
        </div>
        <Link href="/menu" passHref>
          <CTAButton onClick={onViewMore}>
            View More
          </CTAButton>
        </Link>
      </div>

      {/* Carousel */}
      <div className={styles.carouselWrapper}>
        <div
          ref={(node) => {
            sliderRef(node);
            containerRef.current = node;
          }}
          className={`${styles.sliderContainer} keen-slider`}
        >
          {displayedDishes.map((dish, idx) => (
            <div
              key={`${dish.id}-${idx}`}
              className={`${styles.slide} keen-slider__slide`}
            >
              <div className={styles.slideContent}>
                <DishCard dish={dish} />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {instanceRef.current && displayedDishes.length > 1 && (
          <>
            <button
              onClick={() => {
                const newIndex = (currentSlide - 1 + displayedDishes.length) % displayedDishes.length;
                instanceRef.current?.moveToIdx(newIndex);
                setCurrentSlide(newIndex);
              }}
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              aria-label="Previous slide"
              aria-controls="carousel-slider"
            >
              <ArrowLeft size={20} className={styles.navIcon} />
            </button>
            <button
              onClick={() => {
                const newIndex = (currentSlide + 1) % displayedDishes.length;
                instanceRef.current?.moveToIdx(newIndex);
                setCurrentSlide(newIndex);
              }}
              className={`${styles.navButton} ${styles.navButtonNext}`}
              aria-label="Next slide"
              aria-controls="carousel-slider"
            >
              <ArrowRight size={20} className={styles.navIcon} />
            </button>
          </>
        )}

        {/* Dots Indicator - One dot per slide */}
        {instanceRef.current && displayedDishes.length > 1 && (
          <div className={styles.dotsContainer} role="tablist" aria-label="Slide controls">
            {displayedDishes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  instanceRef.current?.moveToIdx(idx);
                  setCurrentSlide(idx);
                }}
                className={`${styles.dotButton} ${
                  currentSlide === idx ? styles.dotButtonActive : ''
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={currentSlide === idx}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
