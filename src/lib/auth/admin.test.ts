// lib/auth/admin.test.ts
import { getServerSession } from "next-auth";
import { isAdmin } from './admin';
import { authOptions } from "./auth";

// Mock dependencies
jest.mock("next-auth");

describe('admin auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          role: 'admin'
        }
      });

      // ACT
      const result = await isAdmin();

      // ASSERT
      expect(result).toBe(true);
      expect(getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it('should return false for non-admin users', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          role: 'user'
        }
      });

      // ACT
      const result = await isAdmin();

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return false when user has no role', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {}
      });

      // ACT
      const result = await isAdmin();

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await isAdmin();

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return false when session has no user', async () => {
      // ARRANGE
      (getServerSession as jest.Mock).mockResolvedValue({});

      // ACT
      const result = await isAdmin();

      // ASSERT
      expect(result).toBe(false);
    });
  });
});
