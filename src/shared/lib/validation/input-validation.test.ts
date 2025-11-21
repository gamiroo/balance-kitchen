// src/lib/validation/input-validation.test.ts
import { z } from 'zod';
import { validateInput, emailSchema, passwordSchema, mealPackSchema } from './input-validation';
import { ValidationError } from '../errors/system-errors';

describe('input-validation', () => {
  describe('emailSchema', () => {
    it('should validate valid email addresses', () => {
      // ACT & ASSERT
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
      expect(emailSchema.parse('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk');
    });

    it('should throw error for invalid email addresses', () => {
      // ACT & ASSERT
      expect(() => emailSchema.parse('invalid-email')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
    });
  });

  describe('passwordSchema', () => {
    it('should validate valid passwords', () => {
      // ACT & ASSERT
      expect(passwordSchema.parse('password123')).toBe('password123');
      expect(passwordSchema.parse('a'.repeat(6))).toBe('a'.repeat(6));
      expect(passwordSchema.parse('a'.repeat(50))).toBe('a'.repeat(50));
    });

    it('should throw error for passwords that are too short', () => {
      // ACT & ASSERT
      expect(() => passwordSchema.parse('pass')).toThrow();
      expect(() => passwordSchema.parse('12345')).toThrow();
    });

    it('should throw error for passwords that are too long', () => {
      // ACT & ASSERT
      expect(() => passwordSchema.parse('a'.repeat(129))).toThrow();
    });
  });

  describe('mealPackSchema', () => {
    it('should validate valid meal pack data', () => {
      // ARRANGE
      const validData = {
        packSize: 10,
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };

      // ACT
      const result = mealPackSchema.parse(validData);

      // ASSERT
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid pack size', () => {
      // ARRANGE
      const invalidData = {
        packSize: -5,
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };

      // ACT & ASSERT
      expect(() => mealPackSchema.parse(invalidData)).toThrow();
    });

    it('should throw error for invalid user ID', () => {
      // ARRANGE
      const invalidData = {
        packSize: 10,
        userId: 'invalid-uuid'
      };

      // ACT & ASSERT
      expect(() => mealPackSchema.parse(invalidData)).toThrow();
    });

    it('should throw error for missing fields', () => {
      // ACT & ASSERT
      expect(() => mealPackSchema.parse({})).toThrow();
      expect(() => mealPackSchema.parse({ packSize: 10 })).toThrow();
      expect(() => mealPackSchema.parse({ userId: '123e4567-e89b-12d3-a456-426614174000' })).toThrow();
    });
  });

  describe('validateInput', () => {
    it('should return parsed data for valid input', () => {
      // ARRANGE
      const schema = z.object({ name: z.string(), age: z.number() });
      const validData = { name: 'John', age: 30 };

      // ACT
      const result = validateInput(schema, validData);

      // ASSERT
      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid input', () => {
      // ARRANGE
      const schema = z.object({ name: z.string(), age: z.number() });
      const invalidData = { name: 'John', age: 'thirty' };

      // ACT & ASSERT
      try {
        validateInput(schema, invalidData);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
        expect((error as ValidationError).statusCode).toBe(400);
        expect((error as ValidationError).details).toBeDefined();
        // Check that details contains the expected validation issues
        expect((error as ValidationError).details).toEqual({
          'age': expect.any(String)
        });
      }
    });

    it('should throw ValidationError with multiple issues for complex invalid input', () => {
      // ARRANGE
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number()
        }),
        email: z.string().email()
      });
      const invalidData = {
        user: { name: 123, age: 'thirty' },
        email: 'invalid-email'
      };

      // ACT & ASSERT
      try {
        validateInput(schema, invalidData);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
        expect((error as ValidationError).statusCode).toBe(400);
        expect((error as ValidationError).details).toBeDefined();
        // Check that details contains the expected validation issues
        expect((error as ValidationError).details).toEqual({
          'user.name': expect.any(String),
          'user.age': expect.any(String),
          'email': expect.any(String)
        });
      }
    });

    it('should re-throw non-Zod errors', () => {
      // ARRANGE
      const schema = {
        parse: jest.fn(() => {
          throw new Error('Non-Zod error');
        })
      } as unknown as z.Schema<unknown>;
      const data = { test: 'data' };

      // ACT & ASSERT
      expect(() => validateInput(schema, data)).toThrow('Non-Zod error');
    });
  });
});
