// src/tests/test-helpers.d.ts
import { User, Order, Menu } from '../lib/types/database';
export {};

declare global {
  // Test utility functions
  function createMockUser(overrides?: Partial<User>): User;
  function createMockOrder(overrides?: Partial<Order>): Order;
  function createMockMenu(overrides?: Partial<Menu>): Menu;
  
  // Custom matchers
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

