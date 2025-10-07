// app/components/DishCard.tsx
'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Wheat, 
  Milk, 
  Egg, 
  Fish,
  Nut,
} from 'lucide-react';
import Image from 'next/image'; // Import Next.js Image component
import UniversalCard from './UniversalCard';
import styles from './styles/DishCard.module.css';

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: 'Carnivore' | 'Balanced' | 'Vegetarian' | 'Keto';
  image: string;
  allergens: string[];
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  liked?: boolean;
}

interface DishCardProps {
  dish: Dish;
  onLike?: (id: string, liked: boolean) => void;
  enableSwipe?: boolean;
}

const getAllergenIcon = (allergen: string) => {
  switch (allergen.toLowerCase()) {
    case 'gluten': return <Wheat size={16} className={styles.allergenIcon} />;
    case 'dairy': return <Milk size={16} className={styles.allergenIcon} />;
    case 'eggs': return <Egg size={16} className={styles.allergenIcon} />;
    case 'fish': return <Fish size={16} className={styles.allergenIcon} />;
    case 'nuts': return <Nut size={16} className={styles.allergenIcon} />;
    case 'soy': return <Wheat size={16} className={styles.allergenIcon} />;
    default: return null;
  }
};

export default function DishCard({ dish, onLike, enableSwipe = false }: DishCardProps) {
  const [liked, setLiked] = useState(dish.liked || false);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    onLike?.(dish.id, newLiked);
  };

  const frontContent = (
    <div className={styles.cardContent} role="article" aria-label={`${dish.name} dish card`}>
      {/* Image */}
      <div className={styles.imageContainer}>
        <Image 
          src={dish.image} 
          alt={dish.name}
          fill
          className={styles.dishImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        <div className={styles.imageGradient} />
      </div>

      {/* Content */}
      <div className={styles.contentContainer}>
        {/* Category Badge */}
        <div className={`${styles.categoryBadge} ${
          dish.category === 'Carnivore' ? styles.categoryCarnivore :
          dish.category === 'Balanced' ? styles.categoryBalanced :
          dish.category === 'Vegetarian' ? styles.categoryVegetarian :
          dish.category === 'Keto' ? styles.categoryKeto :
          styles.categoryDefault
        }`}>
          {dish.category}
        </div>

        {/* Title */}
        <h3 className={styles.dishTitle}>{dish.name}</h3>

        {/* Description */}
        <p className={`${styles.dishDescription} ${styles.descriptionClamp}`}>{dish.description}</p>

        {/* Allergens */}
        <div className={styles.allergensContainer}>
          {dish.allergens.map((allergen) => (
            <div 
              key={allergen} 
              className={styles.allergenItem}
              title={allergen}
              aria-label={`Contains ${allergen}`}
            >
              {getAllergenIcon(allergen)}
              <span>{allergen}</span>
            </div>
          ))}
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className={styles.likeButton}
          aria-label={liked ? `Unlike ${dish.name}` : `Like ${dish.name}`}
          aria-checked={liked}
          role="switch"
        >
          <Heart 
            size={20} 
            className={`${styles.likeIcon} ${
              liked ? styles.likeIconLiked : styles.likeIconDefault
            }`} 
          />
        </button>
      </div>
    </div>
  );

  const backContent = (
    <div className={styles.backCardContent} role="article" aria-label={`Details for ${dish.name}`}>
      {/* Header */}
      <div className={styles.backHeader}>
        <div>
          <h3 className={styles.backTitle}>{dish.name}</h3>
          <p className={`${styles.backCategory} ${
            dish.category === 'Carnivore' ? styles.categoryTextCarnivore :
            dish.category === 'Balanced' ? styles.categoryTextBalanced :
            dish.category === 'Vegetarian' ? styles.categoryTextVegetarian :
            dish.category === 'Keto' ? styles.categoryTextKeto :
            styles.categoryTextDefault
          }`}>
            {dish.category}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className={styles.likeButton}
          aria-label={liked ? `Unlike ${dish.name}` : `Like ${dish.name}`}
          aria-checked={liked}
          role="switch"
        >
          <Heart 
            size={20} 
            className={`${styles.likeIcon} ${
              liked ? styles.likeIconLiked : styles.likeIconDefault
            }`} 
          />
        </button>
      </div>

      {/* Ingredients */}
      <div className={styles.ingredientsSection}>
        <h4 className={styles.ingredientsTitle}>Ingredients</h4>
        <ul className={styles.ingredientsList} aria-label="List of ingredients">
          {dish.ingredients.map((ingredient, index) => (
            <li key={index} className={styles.ingredientItem}>
              <span className={styles.ingredientBullet} aria-hidden="true"></span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Nutritional Panel */}
      <div className={styles.nutritionPanel} aria-labelledby="nutrition-heading">
        <h4 id="nutrition-heading" className={styles.nutritionTitle}>Nutrition (per serving)</h4>
        <div className={styles.nutritionGrid}>
          <div className={styles.nutritionCard}>
            <p className={`${styles.nutritionValue} ${styles.caloriesValue}`}>{dish.calories}</p>
            <p className={styles.nutritionLabel}>Calories</p>
          </div>
          <div className={styles.nutritionCard}>
            <p className={`${styles.nutritionValue} ${styles.proteinValue}`}>{dish.protein}g</p>
            <p className={styles.nutritionLabel}>Protein</p>
          </div>
          <div className={styles.nutritionCard}>
            <p className={`${styles.nutritionValue} ${styles.carbsValue}`}>{dish.carbs}g</p>
            <p className={styles.nutritionLabel}>Carbs</p>
          </div>
          <div className={styles.nutritionCard}>
            <p className={`${styles.nutritionValue} ${styles.fatValue}`}>{dish.fat}g</p>
            <p className={styles.nutritionLabel}>Fat</p>
          </div>
        </div>
        {dish.fiber && (
          <div className={styles.fiberCard}>
            <p className={`${styles.nutritionValue} ${styles.fiberValue}`}>{dish.fiber}g Fiber</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.dishCardContainer} role="region" aria-label="Dish card">
      <UniversalCard
        width="w-full"
        height="h-[520px]"
        front={frontContent}
        back={backContent}
        enableSwipe={enableSwipe}
      />
    </div>
  );
}
