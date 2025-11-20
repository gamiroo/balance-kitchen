import React from 'react';
import { Pack } from '../../data/plansData';
import Image from 'next/image';
import styles from './ProductCard.module.css';
import { AnimatedGradientBorder } from '../../../../ui/animated-border/AnimatedGradientBorder';
import { CTAButton } from '../../../../ui/CTAButton/CTAButton';

interface ProductCardProps {
  pack: Pack;
}

const ProductCard: React.FC<ProductCardProps> = ({ pack }) => {
  const {
    title,
    meals,
    basePrice,
    bonusDiscount,
    unlocked,
    highlight,
    tag,
    description,
    imageSrc,
    unlockCriteria,
  } = pack;

  // Sample image sources - replace with your actual image paths
  const defaultImageSources = [
    "/images/starter-pack.jpg",
    "/images/balanced-plan.jpg", 
    "/images/family-feast.jpg",
    "/images/athletes-choice.jpg",
    "/images/vegan-delight.jpg"
  ];

  // Simple hash function to get consistent image index
  const getImageIndex = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % defaultImageSources.length;
  };

  const imageUrl = imageSrc || defaultImageSources[getImageIndex(title)];

  return (
    <div className={styles.cardWrapper}>
      <AnimatedGradientBorder
      >
        <div className={`${styles.productCard} ${highlight ? styles.highlighted : ''}`}>
          {/* Top Section - Image with overlaid content */}
          <div className={styles.imageSection}>
            {/* Replace img with Next.js Image component */}
            <Image
              src={imageUrl}
              alt={title}
              width={200}
              height={150}
              className={styles.cardImage}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            <div className={styles.imageOverlay}></div>
            
            {/* Overlaid content on image */}
            <div className={styles.imageContent}>
              <div className={styles.titleSection}>
                <h3 className={styles.title}>{title}</h3>
                {highlight && (
                  <span className={styles.badge}>BEST VALUE</span>
                )}
              </div>
              {tag && <p className={styles.tag}>{tag}</p>}
              <p className={styles.description}>{description}</p>
            </div>
          </div>

          {/* Bottom Section - Details only */}
          <div className={styles.detailsSection}>
            <div className={styles.pricing}>
              <p className={styles.price}>${basePrice.toFixed(2)}</p>
              <p className={styles.meals}>
                {meals} meals
                {bonusDiscount && bonusDiscount > 0 && (
                  <span className={styles.bonus}>+{bonusDiscount}% off pantry</span>
                )}
              </p>
            </div>

            <div className={styles.actionSection}>
              {unlocked ? (
                <CTAButton>
                  Select Pack
                </CTAButton>
              ) : (
                <div className={styles.lockedState}>
                  <span className={styles.lockIcon}>🔒</span>
                  <span className={styles.lockedText}>Locked</span>
                  {unlockCriteria && (
                    <p className={styles.unlockCriteria}>Unlock by: {unlockCriteria}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedGradientBorder>
    </div>
  );
};

export default ProductCard;
