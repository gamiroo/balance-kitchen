// src/tests/test-helpers.ts
import { User, MealPack } from '@/shared/lib/types/database';

// Mock the database query function for tests
export async function createTestUser(email: string = 'test@example.com'): Promise<User> {
  // This is just for type safety in tests - we'll mock the actual database call
  return {
    id: 'user-123',
    email: email,
    name: 'Test User',
    password_hash: 'hashed-password',
    created_at: new Date(),
    role: 'user'
  } as User;
}

export async function createTestMealPack(userId: string, packSize: number): Promise<MealPack> {
  // This is just for type safety in tests - we'll mock the actual database call
  return {
    id: 'pack-123',
    user_id: userId,
    pack_size: packSize,
    remaining_balance: packSize,
    purchase_date: new Date(),
    is_active: true,
    created_at: new Date()
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hashed-password',
    role: 'user',
    created_at: new Date(),
    ...overrides
  } as User;
}

export function createMockOrder(overrides: object = {}) {
  return {
    id: 'order-' + Math.random().toString(36).substr(2, 9),
    user_id: 'user-123',
    menu_id: 'menu-123',
    order_date: new Date(),
    total_meals: 4,
    total_price: 0,
    status: 'pending',
    created_at: new Date(),
    ...overrides
  };
}

export function createMockMenu(overrides: object = {}) {
  return {
    id: 'menu-' + Math.random().toString(36).substr(2, 9),
    week_start_date: new Date('2024-01-15'),
    week_end_date: new Date('2024-01-21'),
    is_active: true,
    is_published: true,
    created_at: new Date(),
    ...overrides
  };
}
