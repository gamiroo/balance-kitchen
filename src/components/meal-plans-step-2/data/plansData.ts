// data/plansData.ts
export type PackType = 'subscription' | 'bulk' | 'delivery';

export interface Pack {
  title: string;
  meals: number;               // meals per pack (for subscription/bulk)
  basePrice: number;      // price in USD
  bonusDiscount?: number; // percent off on pantry items (optional)
  unlocked: boolean;      // true → user can purchase immediately
  type: PackType;
  highlight?: boolean;    // “Best value” badge
  tag?: string;           // e.g., “Starter”, “Premium”
  description?: string;   // brief tagline
  imageSrc?: string;      // optional image for the card
  unlockCriteria?: string;
}

/** ------------------------------------ */
/**  SUBSCRIPTION (weekly) */
export const subscriptionPacks: Pack[] = [
  { title: 'Starter', meals: 5, basePrice: 29.99, unlocked: true, type: 'subscription', highlight: true, tag: 'Starter', description: 'Perfect for busy professionals', imageSrc: '/images/starter-pack.jpg' },
  { title: 'Basic', meals: 10, basePrice: 49.99, unlocked: true, type: 'subscription', tag: 'Basic', description: 'Flexible 2‑week plan', imageSrc: '/images/basic-pack.jpg' },
  { title: 'Family', meals: 25, basePrice: 119.99, unlocked: true, type: 'subscription', tag: 'Family', description: 'Family‑friendly plan', imageSrc: '/images/family-pack.jpg' },
  { title: 'Pro', meals: 40, basePrice: 169.99, unlocked: true, type: 'subscription', tag: 'Pro', description: 'Pro‑level nutrition', imageSrc: '/images/balanced-plan.jpg' },
  { title: 'Elite', meals: 60, basePrice: 239.99, unlocked: true, type: 'subscription', tag: 'Elite', description: 'Elite savings', imageSrc: '/images/elite-pack.jpg' },
  { title: 'Champion', meals: 80, basePrice: 319.99, unlocked: true, type: 'subscription', tag: 'Champion', description: 'Ultimate health plan', imageSrc: '/images/champion-pack.jpg' },
];

/** ------------------------------------ */
/**  BULK SAVINGS (bulk meal packs) */
export const bulkPacks: Pack[] = [
  { title: 'Bulk Starter', meals: 25, basePrice: 94.99, unlocked: true, type: 'bulk', tag: 'Bulk', description: 'Save 15% on pantry', bonusDiscount: 15 },
  { title: 'Bulk Family', meals: 40, basePrice: 144.99, unlocked: true, type: 'bulk', tag: 'Bulk', description: 'Save 18% on pantry', bonusDiscount: 18 },
  { title: 'Bulk Pro', meals: 60, basePrice: 209.99, unlocked: true, type: 'bulk', tag: 'Bulk', description: 'Save 20% on pantry', bonusDiscount: 20 },
  { title: 'Bulk Champion', meals: 80, basePrice: 279.99, unlocked: true, type: 'bulk', tag: 'Bulk', description: 'Save 22% on pantry', bonusDiscount: 22 },
];

/** ------------------------------------ */
/**  DELIVERY PACKS (pre‑purchased delivery slots) */
export const deliveryPacks: Pack[] = [
  { title: 'Quick 5', meals: 5, basePrice: 24.99, unlocked: true, type: 'delivery', tag: 'Delivery', description: 'Pre‑purchased delivery slot', bonusDiscount: 0 },
  { title: 'Power 10', meals: 10, basePrice: 44.99, unlocked: true, type: 'delivery', tag: 'Delivery', description: 'Pre‑purchased delivery slot', bonusDiscount: 0 },
];
