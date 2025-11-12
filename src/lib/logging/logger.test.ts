// src/lib/logging/logger.test.ts
/**
 * @jest-environment node
 */

describe('logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have required logging methods', async () => {
    // ACT
    const { logger } = await import('./logger');

    // ASSERT
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should be able to call logging methods without throwing', async () => {
    // ACT
    const { logger } = await import('./logger');

    // ASSERT
    expect(() => logger.info('Test info message')).not.toThrow();
    expect(() => logger.error('Test error message')).not.toThrow();
    expect(() => logger.warn('Test warn message')).not.toThrow();
    expect(() => logger.debug('Test debug message')).not.toThrow();
  });

  it('should handle logging with objects', async () => {
    // ACT
    const { logger } = await import('./logger');

    // ASSERT
    expect(() => logger.info('Test with object', { key: 'value' })).not.toThrow();
    expect(() => logger.error('Test error with object', new Error('Test error'))).not.toThrow();
  });
});
