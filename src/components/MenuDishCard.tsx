// app/components/MenuDishCard.tsx
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
import Image from 'next/image';
import styles from './MenuDishCard.module.css';

interface MenuDish {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  allergens: string[];
  isAvailable: boolean;
}

interface MenuDishCardProps {
  dish: MenuDish;
  onQuantityChange: (id: string, quantity: number) => void;
  quantity: number;
}

const getAllergenIcon = (allergen: string) => {
  switch (allergen.toLowerCase()) {
    case 'gluten': return <Wheat size={14} className={styles.allergenIcon} />;
    case 'dairy': return <Milk size={14} className={styles.allergenIcon} />;
    case 'eggs': return <Egg size={14} className={styles.allergenIcon} />;
    case 'fish': return <Fish size={14} className={styles.allergenIcon} />;
    case 'nuts': return <Nut size={14} className={styles.allergenIcon} />;
    case 'soy': return <Wheat size={14} className={styles.allergenIcon} />;
    default: return null;
  }
};

export default function MenuDishCard({ dish, onQuantityChange, quantity }: MenuDishCardProps) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div className={styles.mealCard}>
      {/* Image */}
      <div className={styles.imageContainer}>
        <Image 
          src={dish.image} 
          alt={dish.name}
          fill
          className={styles.dishImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className={styles.imageGradient} />
        
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={styles.likeButton}
          aria-label={liked ? `Unlike ${dish.name}` : `Like ${dish.name}`}
        >
          <Heart 
            size={20} 
            className={`${styles.likeIcon} ${liked ? styles.likeIconLiked : styles.likeIconDefault}`} 
          />
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{dish.name}</h3>
            <span className={`${styles.categoryBadge} ${styles[`category${dish.category}`]}`}>
              {dish.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className={styles.description}>{dish.description}</p>

        {/* Allergens */}
        {dish.allergens.length > 0 && (
          <div className={styles.allergens}>
            {dish.allergens.map((allergen) => (
              <div key={allergen} className={styles.allergen} title={allergen}>
                {getAllergenIcon(allergen)}
                <span className={styles.allergenText}>{allergen}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quantity Control */}
        <div className={styles.footer}>
          <div className={styles.quantityControl}>
            <button 
              className={styles.quantityBtn}
              onClick={() => onQuantityChange(dish.id, Math.max(0, quantity - 1))}
              disabled={quantity === 0}
              aria-label={`Decrease quantity of ${dish.name}`}
            >
              -
            </button>
            <span className={styles.quantity}>{quantity}</span>
            <button 
              className={styles.quantityBtn}
              onClick={() => onQuantityChange(dish.id, quantity + 1)}
              aria-label={`Increase quantity of ${dish.name}`}
            >
              +
            </button>
          </div>
          <span className={styles.mealLabel}>meals</span>
        </div>
      </div>
    </div>
  );
}
