/**
 * Simple cache utility for the server-side
 * Implements an in-memory LRU (Least Recently Used) cache with TTL (Time To Live)
 */

// Cache interface
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

// LRU Cache with size limit and TTL
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number; // milliseconds

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  // Get an item from cache
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    // Cache miss
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    
    return entry.value;
  }

  // Set an item in cache
  set(key: string, value: T, ttl?: number): void {
    // Clean expired entries first
    this.evictExpired();
    
    // Add new entry
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      lastAccessed: Date.now()
    });
    
    // Check if we need to evict least recently used items
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  // Remove an item from cache
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Remove the least recently used entry
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestKey = key;
        oldestTime = entry.lastAccessed;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Get cache stats
  getStats(): { size: number, maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Create test data cache
export const testDataCache = new LRUCache<any>(20, 10 * 60 * 1000); // 10 minutes TTL

// Create test questions cache
export const questionsCache = new LRUCache<any>(50, 15 * 60 * 1000); // 15 minutes TTL

// Create test answers cache
export const answersCache = new LRUCache<any>(100, 20 * 60 * 1000); // 20 minutes TTL

// Utility functions for specific cache operations
export function getCachedTestData(testId: string): any | null {
  return testDataCache.get(`test:${testId}`);
}

export function cacheTestData(testId: string, data: any): void {
  testDataCache.set(`test:${testId}`, data);
}

export function getCachedQuestions(testId: string): any | null {
  return questionsCache.get(`questions:${testId}`);
}

export function cacheQuestions(testId: string, questions: any[]): void {
  questionsCache.set(`questions:${testId}`, questions);
}

export function getCachedAnswers(questionId: string): any | null {
  return answersCache.get(`answers:${questionId}`);
}

export function cacheAnswers(questionId: string, answers: any[]): void {
  answersCache.set(`answers:${questionId}`, answers);
}

export function getCachedBatchAnswers(questionType: string, questionIds: string[]): any | null {
  const cacheKey = `batch:${questionType}:${questionIds.sort().join(',')}`;
  return answersCache.get(cacheKey);
}

export function cacheBatchAnswers(questionType: string, questionIds: string[], answers: any[]): void {
  const cacheKey = `batch:${questionType}:${questionIds.sort().join(',')}`;
  answersCache.set(cacheKey, answers);
}

export function clearTestCache(testId: string): void {
  testDataCache.delete(`test:${testId}`);
  questionsCache.delete(`questions:${testId}`);
  // Clear related answer caches would require knowing the question IDs
}

// Clear all caches
export function clearAllCaches(): void {
  testDataCache.clear();
  questionsCache.clear();
  answersCache.clear();
}