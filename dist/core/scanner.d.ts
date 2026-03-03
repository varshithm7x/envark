/**
 * File traversal and environment variable detection engine
 */
import { type FileInfo } from '../utils/file-walker.js';
import { type EnvUsage } from './parser.js';
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
export declare function normalizeProjectPath(projectPath?: string): string;
/**
 * Scan a project directory for environment variable usages
 */
export declare function scanProject(projectPath: string, options?: ScanOptions): ScanResult;
/**
 * Quick check if a project has any env files
 */
export declare function hasEnvFiles(projectPath: string): boolean;
/**
 * Get project stats without full parsing
 */
export declare function getProjectStats(projectPath: string): {
    totalFiles: number;
    sourceFiles: number;
    envFiles: number;
    languages: Set<string>;
};
//# sourceMappingURL=scanner.d.ts.map