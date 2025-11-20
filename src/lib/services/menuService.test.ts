// lib/services/menuService.test.ts
import { 
  getCurrentMenu, 
  getDishById, 
  getDishesByCategory, 
  getCurrentMenuId 
} from './menuService'

// Mock dishData
jest.mock('../../data/dishData', () => ({
  dishData: [
    {
      id: 'dish-1',
      name: 'Test Dish 1',
      description: 'Test description 1',
      category: 'main',
      image: '/images/dish1.jpg',
      allergens: ['gluten']
    },
    {
      id: 'dish-2',
      name: 'Test Dish 2',
      description: 'Test description 2',
      category: 'dessert',
      image: '/images/dish2.jpg',
      allergens: ['dairy']
    },
    {
      id: 'dish-3',
      name: 'Test Dish 3',
      description: 'Test description 3',
      category: 'main',
      image: '/images/dish3.jpg',
      allergens: ['nuts']
    }
  ]
}))

describe('menuService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentMenu', () => {
    it('should return current menu with formatted dates', () => {
      // ACT
      const result = getCurrentMenu()

      // ASSERT
      expect(result).toEqual({
        id: 'week-1',
        weekStartDate: expect.any(String),
        weekEndDate: expect.any(String),
        isActive: true,
        items: [
          {
            id: 'dish-1',
            name: 'Test Dish 1',
            description: 'Test description 1',
            category: 'main',
            isAvailable: true,
            price: 0,
            image: '/images/dish1.jpg',
            allergens: ['gluten']
          },
          {
            id: 'dish-2',
            name: 'Test Dish 2',
            description: 'Test description 2',
            category: 'dessert',
            isAvailable: true,
            price: 0,
            image: '/images/dish2.jpg',
            allergens: ['dairy']
          },
          {
            id: 'dish-3',
            name: 'Test Dish 3',
            description: 'Test description 3',
            category: 'main',
            isAvailable: true,
            price: 0,
            image: '/images/dish3.jpg',
            allergens: ['nuts']
          }
        ]
      })
      expect(result.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.weekEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getDishById', () => {
    it('should return dish when found by ID', () => {
      // ACT
      const result = getDishById('dish-1')

      // ASSERT
      expect(result).toEqual({
        id: 'dish-1',
        name: 'Test Dish 1',
        description: 'Test description 1',
        category: 'main',
        image: '/images/dish1.jpg',
        allergens: ['gluten']
      })
    })

    it('should return undefined when dish not found', () => {
      // ACT
      const result = getDishById('nonexistent-dish')

      // ASSERT
      expect(result).toBeUndefined()
    })
  })

  describe('getDishesByCategory', () => {
    it('should return dishes filtered by category', () => {
      // ACT
      const result = getDishesByCategory('main')

      // ASSERT
      expect(result).toEqual([
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          description: 'Test description 1',
          category: 'main',
          image: '/images/dish1.jpg',
          allergens: ['gluten']
        },
        {
          id: 'dish-3',
          name: 'Test Dish 3',
          description: 'Test description 3',
          category: 'main',
          image: '/images/dish3.jpg',
          allergens: ['nuts']
        }
      ])
    })

    it('should return empty array when no dishes match category', () => {
      // ACT
      const result = getDishesByCategory('appetizer')

      // ASSERT
      expect(result).toEqual([])
    })
  })

  describe('getCurrentMenuId', () => {
    it('should return hardcoded menu ID', async () => {
      // ACT
      const result = await getCurrentMenuId()

      // ASSERT
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })
})
