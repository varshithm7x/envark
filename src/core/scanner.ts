/**
 * File traversal and environment variable detection engine
 */

import { existsSync, statSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import { walkDirectory, getSourceFiles, getEnvFiles, computeFilesHash, type FileInfo } from '../utils/file-walker.js';
import { parseFiles, type EnvUsage } from './parser.js';
import { readCache, writeCache, type CacheResult } from '../utils/cache.js';

export interface ScanOptions {
    maxFiles?: number;
    maxDepth?: number;
    useCache?: boolean;
}

export interface ScanResult {
    projectPath: string;
    usages: EnvUsage[];
    files: FileInfo[];
    scannedFiles: number;
    sourceFiles: number;
    envFiles: number;
    cacheHit: boolean;
    duration: number;
    errors: string[];
    hash: string;
}

export interface CachedScanData {
    usages: EnvUsage[];
    scannedFiles: number;
    sourceFiles: number;
    envFiles: number;
}

/**
 * Normalize and validate project path
 */
export function normalizeProjectPath(projectPath?: string): string {
    if (!projectPath) {
        return process.cwd();
    }

    const normalized = isAbsolute(projectPath) ? projectPath : resolve(process.cwd(), projectPath);

    if (!existsSync(normalized)) {
        throw new Error(`Project path does not exist: ${normalized}`);
    }

    const stats = statSync(normalized);
    if (!stats.isDirectory()) {
        throw new Error(`Project path is not a directory: ${normalized}`);
    }

    return normalized;
}

/**
 * Scan a project directory for environment variable usages
 */
export function scanProject(
    projectPath: string,
    options: ScanOptions = {}
): ScanResult {
    const startTime = Date.now();
    const { maxFiles = 10000, maxDepth = 50, useCache = true } = options;

    // Normalize path
    const normalizedPath = normalizeProjectPath(projectPath);

    // Walk directory to get all files
    const allFiles = walkDirectory(normalizedPath, { maxFiles, maxDepth });

    // Compute hash for cache validation
    const hash = computeFilesHash(allFiles);

    // Check cache
    if (useCache) {
        const cached: CacheResult<CachedScanData> = readCache(normalizedPath, hash);
        if (cached.hit && cached.data) {
            return {
                projectPath: normalizedPath,
                usages: cached.data.usages,
                files: allFiles,
                scannedFiles: cached.data.scannedFiles,
                sourceFiles: cached.data.sourceFiles,
                envFiles: cached.data.envFiles,
                cacheHit: true,
                duration: Date.now() - startTime,
                errors: [],
                hash,
            };
        }
    }

    // Get relevant files
    const sourceFiles = getSourceFiles(allFiles);
    const envFiles = getEnvFiles(allFiles);

    // Combine files to parse
    const filesToParse = [...sourceFiles, ...envFiles].map(f => ({
        path: f.path,
        relativePath: f.relativePath,
    }));

    // Parse all files
    const { usages, errors } = parseFiles(filesToParse);

    // Cache results
    const cacheData: CachedScanData = {
        usages,
        scannedFiles: filesToParse.length,
        sourceFiles: sourceFiles.length,
        envFiles: envFiles.length,
    };

    if (useCache) {
        writeCache(normalizedPath, hash, cacheData);
    }

    return {
        projectPath: normalizedPath,
        usages,
        files: allFiles,
        scannedFiles: filesToParse.length,
        sourceFiles: sourceFiles.length,
        envFiles: envFiles.length,
        cacheHit: false,
        duration: Date.now() - startTime,
        errors,
        hash,
    };
}

/**
 * Quick check if a project has any env files
 */
export function hasEnvFiles(projectPath: string): boolean {
    try {
        const normalized = normalizeProjectPath(projectPath);
        const files = walkDirectory(normalized, { maxFiles: 100, maxDepth: 3 });
        return getEnvFiles(files).length > 0;
    } catch {
        return false;
    }
}

/**
 * Get project stats without full parsing
 */
export function getProjectStats(projectPath: string): {
    totalFiles: number;
    sourceFiles: number;
    envFiles: number;
    languages: Set<string>;
} {
    const normalized = normalizeProjectPath(projectPath);
    const allFiles = walkDirectory(normalized, { maxFiles: 10000 });
    const sourceFiles = getSourceFiles(allFiles);
    const envFiles = getEnvFiles(allFiles);

    const languages = new Set<string>();
    for (const file of sourceFiles) {
        languages.add(file.extension);
    }

    return {
        totalFiles: allFiles.length,
        sourceFiles: sourceFiles.length,
        envFiles: envFiles.length,
        languages,
    };
}
