// data/dishData.ts
import type { Dish } from '../components/ui/dish/DishCard';

export const dishData: Dish[] = [
  // CARNIVORE DISHES
  {
    id: 'c1',
    name: 'Grass-Fed Beef Burger',
    description: 'Juicy grass-fed beef patty with caramelized onions, aged cheddar, and house-made garlic aioli on a brioche bun.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    allergens: ['Gluten', 'Dairy'],
    ingredients: [
      'Grass-fed beef patty (6 oz)',
      'Brioche bun',
      'Aged cheddar cheese',
      'Caramelized onions',
      'Garlic aioli',
      'Lettuce',
      'Tomato'
    ],
    calories: 780,
    protein: 42,
    carbs: 38,
    fat: 45,
    fiber: 3
  },
  {
    id: 'c2',
    name: 'Herb-Crusted Lamb Chops',
    description: 'Tender lamb chops coated in fresh herbs and roasted to perfection, served with mint chimichurri.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800',
    allergens: [],
    ingredients: [
      'New Zealand lamb chops (8 oz)',
      'Fresh rosemary',
      'Thyme',
      'Garlic',
      'Olive oil',
      'Mint chimichurri',
      'Sea salt'
    ],
    calories: 620,
    protein: 52,
    carbs: 2,
    fat: 42,
    fiber: 1
  },
  {
    id: 'c3',
    name: 'Maple-Glazed Salmon',
    description: 'Wild-caught salmon fillet with maple glaze, served with roasted Brussels sprouts and lemon butter.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    allergens: ['Fish'],
    ingredients: [
      'Wild-caught salmon (6 oz)',
      'Pure maple syrup',
      'Lemon',
      'Butter',
      'Brussels sprouts',
      'Garlic',
      'Dill'
    ],
    calories: 540,
    protein: 38,
    carbs: 12,
    fat: 32,
    fiber: 4
  },
  {
    id: 'c4',
    name: 'BBQ Chicken Bowl',
    description: 'Grilled chicken thigh with smoky BBQ sauce, served over cauliflower rice with pickled vegetables.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
    allergens: ['Soy'],
    ingredients: [
      'Grilled chicken thigh (5 oz)',
      'House-made BBQ sauce',
      'Cauliflower rice',
      'Pickled carrots',
      'Pickled daikon',
      'Cilantro',
      'Sesame seeds'
    ],
    calories: 480,
    protein: 36,
    carbs: 18,
    fat: 26,
    fiber: 5
  },
  {
    id: 'c5',
    name: 'Ribeye Steak with Garlic Butter',
    description: 'Premium ribeye steak cooked to perfection, topped with herb garlic butter and served with asparagus.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',
    allergens: ['Dairy'],
    ingredients: [
      'Ribeye steak (8 oz)',
      'Garlic',
      'Fresh herbs',
      'Butter',
      'Asparagus',
      'Sea salt',
      'Black pepper'
    ],
    calories: 680,
    protein: 58,
    carbs: 4,
    fat: 48,
    fiber: 2
  },
  {
    id: 'c6',
    name: 'Turkey & Avocado Wrap',
    description: 'Lean turkey breast with avocado, spinach, and tomato wrapped in a low-carb tortilla with chipotle mayo.',
    category: 'Carnivore',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800',
    allergens: ['Gluten'],
    ingredients: [
      'Lean turkey breast (4 oz)',
      'Avocado',
      'Spinach',
      'Tomato',
      'Low-carb tortilla',
      'Chipotle mayo',
      'Red onion'
    ],
    calories: 420,
    protein: 32,
    carbs: 22,
    fat: 24,
    fiber: 8
  },

  // BALANCED DISHES
  {
    id: 'b1',
    name: 'Mediterranean Quinoa Bowl',
    description: 'Protein-packed quinoa bowl with grilled chicken, olives, feta, and tahini dressing.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    allergens: ['Dairy', 'Sesame'],
    ingredients: [
      'Quinoa',
      'Grilled chicken breast (4 oz)',
      'Cherry tomatoes',
      'Cucumber',
      'Kalamata olives',
      'Feta cheese',
      'Tahini dressing'
    ],
    calories: 490,
    protein: 34,
    carbs: 38,
    fat: 22,
    fiber: 6
  },
  {
    id: 'b2',
    name: 'Salmon & Sweet Potato',
    description: 'Baked salmon with roasted sweet potato, broccoli, and lemon dill sauce.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270022c?w=800',
    allergens: ['Fish'],
    ingredients: [
      'Atlantic salmon (5 oz)',
      'Sweet potato',
      'Broccoli',
      'Lemon',
      'Fresh dill',
      'Olive oil',
      'Garlic'
    ],
    calories: 520,
    protein: 36,
    carbs: 32,
    fat: 26,
    fiber: 7
  },
  {
    id: 'b3',
    name: 'Chicken & Brown Rice',
    description: 'Herb-roasted chicken with brown rice pilaf and seasonal vegetables.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bbd814503?w=800',
    allergens: [],
    ingredients: [
      'Herb-roasted chicken thigh (5 oz)',
      'Brown rice',
      'Carrots',
      'Green beans',
      'Fresh herbs',
      'Lemon',
      'Olive oil'
    ],
    calories: 510,
    protein: 32,
    carbs: 42,
    fat: 22,
    fiber: 6
  },
  {
    id: 'b4',
    name: 'Turkey & Veggie Stir Fry',
    description: 'Lean ground turkey stir-fried with mixed vegetables and ginger soy sauce over cauliflower rice.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    allergens: ['Soy', 'Sesame'],
    ingredients: [
      'Lean ground turkey (4 oz)',
      'Bell peppers',
      'Broccoli',
      'Snap peas',
      'Carrots',
      'Ginger soy sauce',
      'Sesame oil'
    ],
    calories: 380,
    protein: 28,
    carbs: 24,
    fat: 18,
    fiber: 8
  },
  {
    id: 'b5',
    name: 'Greek Chicken Bowl',
    description: 'Grilled chicken with Greek salad, olives, and creamy tzatziki sauce.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    allergens: ['Dairy'],
    ingredients: [
      'Grilled chicken breast (5 oz)',
      'Cucumber',
      'Tomatoes',
      'Red onion',
      'Kalamata olives',
      'Feta cheese',
      'Tzatziki sauce'
    ],
    calories: 460,
    protein: 38,
    carbs: 22,
    fat: 24,
    fiber: 4
  },
  {
    id: 'b6',
    name: 'Lentil & Vegetable Curry',
    description: 'Hearty lentil curry with seasonal vegetables, served with basmati rice.',
    category: 'Balanced',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    allergens: [],
    ingredients: [
      'Red lentils',
      'Coconut milk',
      'Carrots',
      'Spinach',
      'Tomatoes',
      'Onion',
      'Curry spices',
      'Basmati rice'
    ],
    calories: 440,
    protein: 18,
    carbs: 52,
    fat: 16,
    fiber: 12
  },

  // VEGETARIAN DISHES
  {
    id: 'v1',
    name: 'Mushroom & Walnut Burger',
    description: 'Hearty mushroom and walnut patty with avocado, sprouts, and chipotle mayo on a whole grain bun.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    allergens: ['Gluten', 'Nuts'],
    ingredients: [
      'Mushroom walnut patty',
      'Whole grain bun',
      'Avocado',
      'Sprouts',
      'Red onion',
      'Chipotle mayo',
      'Lettuce'
    ],
    calories: 480,
    protein: 18,
    carbs: 42,
    fat: 26,
    fiber: 9
  },
  {
    id: 'v2',
    name: 'Eggplant Parmesan',
    description: 'Breaded eggplant with marinara sauce and melted mozzarella, served with zucchini noodles.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1561758033-7e924f619b47?w=800',
    allergens: ['Gluten', 'Dairy'],
    ingredients: [
      'Breaded eggplant slices',
      'Marinara sauce',
      'Mozzarella cheese',
      'Parmesan cheese',
      'Zucchini noodles',
      'Basil',
      'Garlic'
    ],
    calories: 520,
    protein: 22,
    carbs: 38,
    fat: 28,
    fiber: 6
  },
  {
    id: 'v3',
    name: 'Quinoa-Stuffed Bell Peppers',
    description: 'Bell peppers stuffed with quinoa, black beans, corn, and melted cheese.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    allergens: ['Dairy'],
    ingredients: [
      'Bell peppers',
      'Quinoa',
      'Black beans',
      'Corn',
      'Onion',
      'Cheddar cheese',
      'Cilantro'
    ],
    calories: 390,
    protein: 16,
    carbs: 52,
    fat: 12,
    fiber: 11
  },
  {
    id: 'v4',
    name: 'Vegetable Tempura Bowl',
    description: 'Crispy tempura vegetables with tofu over brown rice and miso ginger dressing.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    allergens: ['Gluten', 'Soy'],
    ingredients: [
      'Tempura vegetables',
      'Fried tofu',
      'Brown rice',
      'Miso paste',
      'Ginger',
      'Sesame seeds',
      'Green onions'
    ],
    calories: 460,
    protein: 18,
    carbs: 48,
    fat: 18,
    fiber: 7
  },
  {
    id: 'v5',
    name: 'Spinach & Ricotta Stuffed Shells',
    description: 'Jumbo pasta shells stuffed with spinach and ricotta, baked in marinara sauce.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    allergens: ['Gluten', 'Dairy'],
    ingredients: [
      'Jumbo pasta shells',
      'Spinach',
      'Ricotta cheese',
      'Marinara sauce',
      'Mozzarella cheese',
      'Parmesan cheese',
      'Garlic'
    ],
    calories: 510,
    protein: 24,
    carbs: 56,
    fat: 22,
    fiber: 5
  },
  {
    id: 'v6',
    name: 'Chickpea & Avocado Salad',
    description: 'Protein-rich chickpea salad with avocado, cucumber, and lemon tahini dressing.',
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    allergens: ['Sesame'],
    ingredients: [
      'Chickpeas',
      'Avocado',
      'Cucumber',
      'Cherry tomatoes',
      'Red onion',
      'Lemon tahini dressing',
      'Parsley'
    ],
    calories: 420,
    protein: 14,
    carbs: 32,
    fat: 24,
    fiber: 10
  },

  // KETO DISHES
  {
    id: 'k1',
    name: 'Zucchini Noodles with Pesto',
    description: 'Spiralized zucchini with basil pesto, cherry tomatoes, and grilled chicken.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    allergens: ['Dairy', 'Nuts'],
    ingredients: [
      'Zucchini noodles',
      'Basil pesto',
      'Grilled chicken breast (4 oz)',
      'Cherry tomatoes',
      'Pine nuts',
      'Parmesan cheese',
      'Olive oil'
    ],
    calories: 380,
    protein: 32,
    carbs: 8,
    fat: 24,
    fiber: 3
  },
  {
    id: 'k2',
    name: 'Cauliflower Crust Pizza',
    description: 'Low-carb cauliflower crust pizza with mozzarella, pepperoni, and fresh basil.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    allergens: ['Dairy', 'Gluten'],
    ingredients: [
      'Cauliflower crust',
      'Mozzarella cheese',
      'Pepperoni',
      'Tomato sauce',
      'Fresh basil',
      'Olive oil',
      'Garlic'
    ],
    calories: 460,
    protein: 26,
    carbs: 12,
    fat: 32,
    fiber: 4
  },
  {
    id: 'k3',
    name: 'Avocado Egg Salad',
    description: 'Creamy egg salad with avocado, served in lettuce wraps with everything bagel seasoning.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    allergens: ['Eggs'],
    ingredients: [
      'Hard-boiled eggs',
      'Avocado',
      'Mayo',
      'Lemon juice',
      'Everything bagel seasoning',
      'Lettuce leaves',
      'Chives'
    ],
    calories: 340,
    protein: 16,
    carbs: 6,
    fat: 28,
    fiber: 5
  },
  {
    id: 'k4',
    name: 'Keto Chicken Alfredo',
    description: 'Creamy Alfredo sauce with grilled chicken over spiralized zucchini noodles.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    allergens: ['Dairy'],
    ingredients: [
      'Grilled chicken breast (5 oz)',
      'Heavy cream',
      'Parmesan cheese',
      'Garlic',
      'Butter',
      'Zucchini noodles',
      'Parsley'
    ],
    calories: 520,
    protein: 38,
    carbs: 8,
    fat: 36,
    fiber: 3
  },
  {
    id: 'k5',
    name: 'Bunless Bacon Cheeseburger',
    description: 'Juicy beef patty with bacon, cheese, and special sauce served in a lettuce wrap.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    allergens: ['Dairy'],
    ingredients: [
      'Grass-fed beef patty (6 oz)',
      'Bacon',
      'Cheddar cheese',
      'Lettuce wrap',
      'Tomato',
      'Onion',
      'Special keto sauce'
    ],
    calories: 680,
    protein: 42,
    carbs: 6,
    fat: 52,
    fiber: 2
  },
  {
    id: 'k6',
    name: 'Coconut Curry with Shrimp',
    description: 'Creamy coconut curry with shrimp, spinach, and cauliflower rice.',
    category: 'Keto',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bbd814503?w=800',
    allergens: ['Shellfish'],
    ingredients: [
      'Shrimp (6 oz)',
      'Coconut milk',
      'Spinach',
      'Cauliflower rice',
      'Red curry paste',
      'Lime',
      'Cilantro'
    ],
    calories: 420,
    protein: 28,
    carbs: 12,
    fat: 32,
    fiber: 4
  }
];
