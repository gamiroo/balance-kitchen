// src/lib/errors/business-errors.test.ts
import { 
  BusinessError, 
  InsufficientBalanceError, 
  PackExpiredError 
} from './business-errors';

describe('business-errors', () => {
  describe('BusinessError', () => {
    it('should create business error with all properties', () => {
      // ACT
      const error = new BusinessError('BUSINESS_ERROR', 'Business error message', 400);

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.name).toBe('BusinessError');
      expect(error.code).toBe('BUSINESS_ERROR');
      expect(error.message).toBe('Business error message');
      expect(error.statusCode).toBe(400);
    });

    it('should use default status code 400', () => {
      // ACT
      const error = new BusinessError('BUSINESS_ERROR', 'Business error message');

      // ASSERT
      expect(error.statusCode).toBe(400);
    });
  });

  describe('InsufficientBalanceError', () => {
    it('should create insufficient balance error with correct message', () => {
      // ACT
      const error = new InsufficientBalanceError(5, 10);

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error).toBeInstanceOf(InsufficientBalanceError);
      expect(error.name).toBe('InsufficientBalanceError');
      expect(error.code).toBe('INSUFFICIENT_BALANCE');
      expect(error.message).toBe('Insufficient meal balance. Available: 5, Requested: 10');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('PackExpiredError', () => {
    it('should create pack expired error with correct message', () => {
      // ACT
      const error = new PackExpiredError();

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error).toBeInstanceOf(PackExpiredError);
      expect(error.name).toBe('PackExpiredError');
      expect(error.code).toBe('PACK_EXPIRED');
      expect(error.message).toBe('Meal pack has expired');
      expect(error.statusCode).toBe(400);
    });
  });
});
