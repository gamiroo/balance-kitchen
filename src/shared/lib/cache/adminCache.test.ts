// lib/cache/adminCache.test.ts
import { adminCache } from './adminCache';
import { logger } from '../logging/logger';

// Mock logger
jest.mock('../logging/logger');

describe('adminCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminCache.clear();
  });

  describe('get and set', () => {
    it('should set and get cache data', () => {
      // ARRANGE
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };

      // ACT
      adminCache.set(key, data);
      const result = adminCache.get(key);

      // ASSERT
      expect(result).toEqual(data);
      expect(logger.debug).toHaveBeenCalledWith('Cache set', { key, ttl: 300000 });
      expect(logger.debug).toHaveBeenCalledWith('Cache hit', { key });
    });

    it('should return null for non-existent keys', () => {
      // ACT
      const result = adminCache.get('non-existent-key');

      // ASSERT
      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Cache miss', { 
        key: 'non-existent-key', 
        reason: 'not_found' 
      });
    });

    it('should return null for expired keys', () => {
      // ARRANGE
      jest.useFakeTimers();
      const key = 'expired-key';
      const data = 'test data';
      
      adminCache.set(key, data, 100); // 100ms TTL
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(150);

      // ACT
      const result = adminCache.get(key);

      // ASSERT
      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('Cache miss', { 
        key, 
        reason: 'expired' 
      });
      
      // Cleanup
      jest.useRealTimers();
    });

    it('should set custom TTL for cache entries', () => {
      // ARRANGE
      jest.useFakeTimers();
      const key = 'custom-ttl-key';
      const data = 'custom data';
      
      adminCache.set(key, data, 500); // 500ms TTL

      // ACT
      const result1 = adminCache.get(key);
      
      // Advance time
      jest.advanceTimersByTime(300);
      const result2 = adminCache.get(key);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(300);
      const result3 = adminCache.get(key);

      // ASSERT
      expect(result1).toEqual(data);
      expect(result2).toEqual(data);
      expect(result3).toBeNull();
      
      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      // ARRANGE
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2');
      
      // ACT
      adminCache.clear();

      // ASSERT
      expect(adminCache.get('key1')).toBeNull();
      expect(adminCache.get('key2')).toBeNull();
      expect(logger.info).toHaveBeenCalledWith('Cache cleared', { entriesCleared: 2 });
    });

    it('should clear empty cache without error', () => {
      // ACT
      adminCache.clear();

      // ASSERT
      expect(logger.info).toHaveBeenCalledWith('Cache cleared', { entriesCleared: 0 });
    });
  });

  describe('clearKey', () => {
    it('should clear specific cache entry', () => {
      // ARRANGE
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2');

      // ACT
      adminCache.clearKey('key1');

      // ASSERT
      expect(adminCache.get('key1')).toBeNull();
      expect(adminCache.get('key2')).toEqual('data2');
      expect(logger.debug).toHaveBeenCalledWith('Cache key cleared', { key: 'key1' });
    });

    it('should handle clearing non-existent key', () => {
      // ACT
      adminCache.clearKey('non-existent-key');

      // ASSERT
      expect(logger.debug).toHaveBeenCalledWith('Cache key not found for clearing', { key: 'non-existent-key' });
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      // ARRANGE
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2');

      // ACT
      const stats = adminCache.getStats();

      // ASSERT
      expect(stats).toEqual({
        size: 2,
        maxSize: 1000,
        defaultTTL: 300000,
        expiredCount: 0,
        memoryUsage: expect.any(Number)
      });
    });

    it('should count expired entries in statistics', () => {
      // ARRANGE
      jest.useFakeTimers();
      adminCache.set('expired-key', 'data', 100);
      adminCache.set('valid-key', 'data');
      
      // Advance time to expire first entry
      jest.advanceTimersByTime(150);

      // ACT
      const stats = adminCache.getStats();

      // ASSERT
      expect(stats.expiredCount).toBe(1);
      
      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      // ARRANGE
      jest.useFakeTimers();
      adminCache.set('expired-key1', 'data1', 100);
      adminCache.set('expired-key2', 'data2', 150);
      adminCache.set('valid-key', 'data3');
      
      // Advance time to expire first two entries
      jest.advanceTimersByTime(200);

      // ACT
      const removedCount = adminCache.cleanup();

      // ASSERT
      expect(removedCount).toBe(2);
      expect(adminCache.get('expired-key1')).toBeNull();
      expect(adminCache.get('expired-key2')).toBeNull();
      expect(adminCache.get('valid-key')).toEqual('data3');
      expect(logger.debug).toHaveBeenCalledWith('Cache cleanup completed', { removedCount: 2 });
      
      // Cleanup
      jest.useRealTimers();
    });

    it('should return 0 when no entries are expired', () => {
      // ARRANGE
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2');

      // ACT
      const removedCount = adminCache.cleanup();

      // ASSERT
      expect(removedCount).toBe(0);
    });
  });

  describe('has', () => {
    it('should return true for existing valid keys', () => {
      // ARRANGE
      adminCache.set('key', 'data');

      // ACT
      const result = adminCache.has('key');

      // ASSERT
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      // ACT
      const result = adminCache.has('non-existent-key');

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return false for expired keys', () => {
      // ARRANGE
      jest.useFakeTimers();
      adminCache.set('key', 'data', 100);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(150);

      // ACT
      const result = adminCache.has('key');

      // ASSERT
      expect(result).toBe(false);
      
      // Cleanup
      jest.useRealTimers();
    });
  });

  describe('keys', () => {
    it('should return all valid keys', () => {
      // ARRANGE
      jest.useFakeTimers();
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2', 100);
      adminCache.set('key3', 'data3');
      
      // Expire key2
      jest.advanceTimersByTime(150);

      // ACT
      const keys = adminCache.keys();

      // ASSERT
      expect(keys).toEqual(['key1', 'key3']);
      
      // Cleanup
      jest.useRealTimers();
    });

    it('should return empty array when no valid keys exist', () => {
      // ACT
      const keys = adminCache.keys();

      // ASSERT
      expect(keys).toEqual([]);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when cache reaches max size', () => {
      // ARRANGE
      const originalMaxSize = adminCache['maxSize'];
      adminCache['maxSize'] = 2; // Set small max size for testing
      
      adminCache.set('key1', 'data1');
      adminCache.set('key2', 'data2');

      // ACT
      adminCache.set('key3', 'data3');

      // ASSERT
      expect(adminCache.get('key1')).toBeNull(); // Should be evicted
      expect(adminCache.get('key2')).toEqual('data2');
      expect(adminCache.get('key3')).toEqual('data3');
      expect(logger.warn).toHaveBeenCalledWith('Cache eviction due to size limit', { 
        evictedKey: 'key1', 
        maxSize: 2 
      });
      
      // Restore original maxSize
      adminCache['maxSize'] = originalMaxSize;
    });
  });
});
