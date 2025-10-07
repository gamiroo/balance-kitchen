// app/components/DishGrid.tsx
'use client';

import Link from "next/link";
import DishCard, { type Dish } from "./DishCard";
import { CTAButton } from "./CTAButton";
import styles from './styles/DishGrid.module.css';
import { useState } from 'react';

interface DishGridProps {
  dishes: Dish[];
  category: string;
  onViewMore: () => void;
  enableSwipe?: boolean;
}

export default function DishGrid({ dishes, category, onViewMore, enableSwipe = false }: DishGridProps) {
  // Limit dishes to 3 for display
  const displayedDishes = dishes.slice(0, 3);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case 'Carnivore': return styles.categoryCarnivore;
      case 'Balanced': return styles.categoryBalanced;
      case 'Vegetarian': return styles.categoryVegetarian;
      case 'Keto': return styles.categoryKeto;
      default: return styles.categoryDefault;
    }
  };

  // Convert category to URL-friendly format (lowercase, no spaces)
  const getCategorySlug = (category: string) => {
    return category.toLowerCase().replace(/\s+/g, '-');
  };

  const handleViewMore = () => {
    setIsLoading(true);
    onViewMore();
    // Simulate loading completion
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Only show grid if there are dishes
  if (displayedDishes.length === 0) {
    return null;
  }

  return (
    <div 
      className={`${styles.dishGridContainer} ${isLoading ? styles.disabledState : ''}`}
      role="region" 
      aria-label={`${category} dishes grid`}
      aria-busy={isLoading}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`${styles.loadingOverlay} ${styles.loadingOverlayActive}`}>
          <div className={styles.loadingSpinner} aria-label="Loading more dishes"></div>
        </div>
      )}
      
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
        <div className={styles.ctaButtonContainer}>
          <Link href={`/menu#${getCategorySlug(category)}`} passHref>
            <CTAButton onClick={handleViewMore}>
              View More
            </CTAButton>
          </Link>
        </div>
      </div>

      {/* Static Grid of 3 dishes - Single responsive class */}
      <div className={styles.gridContainer}>
        {displayedDishes.map((dish, idx) => (
          <div key={`${dish.id}-${idx}`} className={styles.gridItem}>
            <div className={styles.gridItemContent}>
              <DishCard dish={dish} enableSwipe={enableSwipe} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
