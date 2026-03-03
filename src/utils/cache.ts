/**
 * Disk-based result caching for scan results
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

export interface CacheEntry<T> {
    hash: string;
    timestamp: number;
    expiresAt: number;
    data: T;
}

export interface CacheResult<T> {
    hit: boolean;
    data: T | null;
    age?: number;
}

const CACHE_DIR = '.envark';
const CACHE_FILE = 'cache.json';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the cache file path for a project
 */
export function getCachePath(projectPath: string): string {
    return join(projectPath, CACHE_DIR, CACHE_FILE);
}

/**
 * Ensure the cache directory exists
 */
function ensureCacheDir(projectPath: string): void {
    const cacheDir = join(projectPath, CACHE_DIR);
    if (!existsSync(cacheDir)) {
        try {
            mkdirSync(cacheDir, { recursive: true });
        } catch {
            // Ignore errors - caching is optional
        }
    }
}

/**
 * Read cached data if valid
 */
export function readCache<T>(projectPath: string, hash: string): CacheResult<T> {
    const cachePath = getCachePath(projectPath);

    if (!existsSync(cachePath)) {
        return { hit: false, data: null };
    }

    try {
        const content = readFileSync(cachePath, 'utf-8');
        const entry: CacheEntry<T> = JSON.parse(content);

        // Check hash match
        if (entry.hash !== hash) {
            return { hit: false, data: null };
        }

        // Check expiry
        const now = Date.now();
        if (now > entry.expiresAt) {
            return { hit: false, data: null };
        }

        const age = now - entry.timestamp;
        return { hit: true, data: entry.data, age };
    } catch {
        return { hit: false, data: null };
    }
}

/**
 * Write data to cache
 */
export function writeCache<T>(projectPath: string, hash: string, data: T): boolean {
    try {
        ensureCacheDir(projectPath);
        const cachePath = getCachePath(projectPath);

        const entry: CacheEntry<T> = {
            hash,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_EXPIRY_MS,
            data,
        };

        writeFileSync(cachePath, JSON.stringify(entry, null, 2), 'utf-8');
        return true;
    } catch {
        return false;
    }
}

/**
 * Invalidate the cache
 */
export function invalidateCache(projectPath: string): boolean {
    const cachePath = getCachePath(projectPath);

    if (!existsSync(cachePath)) {
        return true;
    }

    try {
        unlinkSync(cachePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get cache stats
 */
export interface CacheStats {
    exists: boolean;
    size?: number;
    age?: number;
    expired?: boolean;
}

export function getCacheStats(projectPath: string): CacheStats {
    const cachePath = getCachePath(projectPath);

    if (!existsSync(cachePath)) {
        return { exists: false };
    }

    try {
        const content = readFileSync(cachePath, 'utf-8');
        const entry: CacheEntry<unknown> = JSON.parse(content);
        const now = Date.now();

        return {
            exists: true,
            size: content.length,
            age: now - entry.timestamp,
            expired: now > entry.expiresAt,
        };
    } catch {
        return { exists: false };
    }
}

/**
 * Format cache age for display
 */
export function formatCacheAge(ageMs: number): string {
    if (ageMs < 1000) {
        return 'just now';
    }

    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

/**
 * Simple in-memory cache for current session
 */
class MemoryCache {
    private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
    private ttlMs: number;

    constructor(ttlMs: number = 30000) {
        this.ttlMs = ttlMs;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Export a singleton instance for session caching
export const sessionCache = new MemoryCache();
