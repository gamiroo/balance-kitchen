// src/tests/test-helpers.d.ts
export {};

declare global {
  // Test utility functions
  function createMockUser(overrides?: Partial<User>): User;
  function createMockOrder(overrides?: any): any;
  function createMockMenu(overrides?: any): any;
  
  // Custom matchers
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
