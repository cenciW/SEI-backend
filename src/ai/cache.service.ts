import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
}

@Injectable()
export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;

  constructor() {
    // Get TTL from environment or use default (1 hour)
    this.defaultTTL = parseInt(process.env.AI_CACHE_TTL || '3600') * 1000;

    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  private generateKey(data: any): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        console.log(`[Cache] MISS: ${key}`);
        return null;
      }

      // Check if cache is expired
      const now = new Date();
      if (now > entry.expiresAt) {
        console.log(`[Cache] EXPIRED: ${key}`);
        this.cache.delete(key);
        return null;
      }

      console.log(`[Cache] HIT: ${key}`);
      return entry.data as T;
    } catch (error) {
      console.error(`[Cache] Error reading cache for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const expiresAt = new Date(
        Date.now() + (ttl ? ttl * 1000 : this.defaultTTL),
      );

      this.cache.set(key, {
        data,
        expiresAt,
      });

      console.log(`[Cache] SET: ${key}`);
    } catch (error) {
      console.error(`[Cache] Error writing cache for ${key}:`, error);
    }
  }

  generateCacheKey(params: any): string {
    return this.generateKey(params);
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      console.log('[Cache] Cleared all cache entries');
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  async getStats(): Promise<{ total: number; expired: number }> {
    try {
      const now = new Date();
      let expired = 0;

      for (const [_, entry] of this.cache) {
        if (now > entry.expiresAt) {
          expired++;
        }
      }

      return { total: this.cache.size, expired };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { total: 0, expired: 0 };
    }
  }

  async cleanExpired(): Promise<number> {
    try {
      const now = new Date();
      let count = 0;

      for (const [key, entry] of this.cache) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          count++;
        }
      }

      if (count > 0) {
        console.log(`[Cache] Cleaned ${count} expired entries`);
      }
      return count;
    } catch (error) {
      console.error('[Cache] Error cleaning expired entries:', error);
      return 0;
    }
  }
}
