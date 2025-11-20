// lib/services/menuService.ts
import { dishData } from '../../data/dishData'
import type { Dish } from '@/shared/components/ui/dish/DishCard'


// Convert your dish data to the menu format we need
export const getCurrentMenu = () => {
  return {
    id: "week-1",
    weekStartDate: new Date().toISOString().split('T')[0],
    weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    items: dishData.map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      category: dish.category,
      isAvailable: true,
      // You can add pricing if needed, or keep it at 0 since it's pre-paid
      price: 0,
      // Include any other fields you want to display
      image: dish.image,
      allergens: dish.allergens,
    }))
  }
}

// Get detailed dish information by ID
export const getDishById = (id: string): Dish | undefined => {
  return dishData.find(dish => dish.id === id)
}

// Get dishes by category
export const getDishesByCategory = (category: string): Dish[] => {
  return dishData.filter(dish => dish.category === category)
}

export const getCurrentMenuId = async () => {
  // For now, return the hardcoded ID
  // Later you can make this dynamic
  return '123e4567-e89b-12d3-a456-426614174000'
}




