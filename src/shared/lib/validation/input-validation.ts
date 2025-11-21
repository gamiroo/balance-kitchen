// src/lib/validation/input-validation.ts
import { z } from 'zod';
import { ValidationError } from '../errors/system-errors';

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(6).max(128);
export const mealPackSchema = z.object({
  packSize: z.number().int().positive().min(1).max(100),
  userId: z.string().uuid()
});

export function validateInput<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert array of issues to a Record format
      const issues: Record<string, string> = {};
      error.issues.forEach(issue => {
        const path = issue.path.join('.');
        issues[path] = issue.message;
      });
      throw new ValidationError('Invalid input data', issues);
    }
    throw error;
  }
}
