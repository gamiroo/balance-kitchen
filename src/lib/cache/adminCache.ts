// lib/cache/adminCache.ts
import { logger } from '../logging/logger';

// Define the cache item structure
interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache for admin data
class AdminCache {
  private cache: Map<string, CacheItem> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxSize: number = 1000; // Maximum number of cache entries

  /**
   * Get cached data by key
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T = unknown>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      logger.debug('Cache miss', { key, reason: 'not_found' });
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug('Cache miss', { key, reason: 'expired' });
      return null;
    }

    logger.debug('Cache hit', { key });
    return item.data as T;
  }

  /**
   * Set data in cache with optional custom TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Custom TTL in milliseconds (optional)
   */
  set<T = unknown>(key: string, data: T, ttl?: number): void {
    // Implement LRU eviction if cache is at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        logger.warn('Cache eviction due to size limit', { 
          evictedKey: firstKey, 
          maxSize: this.maxSize 
        });
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });

    logger.debug('Cache set', { key, ttl: ttl || this.defaultTTL });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesCleared: size });
  }

  /**
   * Clear specific cache entry
   * @param key Cache key to clear
   */
  clearKey(key: string): void {
    const hadItem = this.cache.has(key);
    this.cache.delete(key);
    
    if (hadItem) {
      logger.debug('Cache key cleared', { key });
    } else {
      logger.debug('Cache key not found for clearing', { key });
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
    expiredCount: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    
    // Count expired entries
    for (const [ , item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      expiredCount,
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage().heapUsed : 0
    };
  }

  /**
   * Clean up expired entries
   * @returns Number of expired entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug('Cache cleanup completed', { removedCount });
    }

    return removedCount;
  }

  /**
   * Check if key exists in cache (without updating access time)
   * @param key Cache key
   * @returns Boolean indicating if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp <= item.ttl) {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }
}

export const adminCache = new AdminCache();
