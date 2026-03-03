/**
 * Disk-based result caching for scan results
 */
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
/**
 * Get the cache file path for a project
 */
export declare function getCachePath(projectPath: string): string;
/**
 * Read cached data if valid
 */
export declare function readCache<T>(projectPath: string, hash: string): CacheResult<T>;
/**
 * Write data to cache
 */
export declare function writeCache<T>(projectPath: string, hash: string, data: T): boolean;
/**
 * Invalidate the cache
 */
export declare function invalidateCache(projectPath: string): boolean;
/**
 * Get cache stats
 */
export interface CacheStats {
    exists: boolean;
    size?: number;
    age?: number;
    expired?: boolean;
}
export declare function getCacheStats(projectPath: string): CacheStats;
/**
 * Format cache age for display
 */
export declare function formatCacheAge(ageMs: number): string;
/**
 * Simple in-memory cache for current session
 */
declare class MemoryCache {
    private cache;
    private ttlMs;
    constructor(ttlMs?: number);
    get<T>(key: string): T | null;
    set<T>(key: string, data: T): void;
    clear(): void;
    size(): number;
}
export declare const sessionCache: MemoryCache;
export {};
//# sourceMappingURL=cache.d.ts.map