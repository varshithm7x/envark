/**
 * Gitignore-aware recursive file traversal utility
 * Handles .gitignore parsing and pattern matching without external dependencies
 */
export interface FileInfo {
    path: string;
    relativePath: string;
    extension: string;
    size: number;
    mtime: number;
}
export interface WalkOptions {
    maxFiles?: number;
    maxDepth?: number;
    includeHidden?: boolean;
}
/**
 * Recursively walk a directory and collect file information
 * Respects .gitignore patterns and skips common non-source directories
 */
export declare function walkDirectory(rootPath: string, options?: WalkOptions): FileInfo[];
/**
 * Get all files with a specific extension
 */
export declare function getFilesByExtension(files: FileInfo[], extensions: string[]): FileInfo[];
/**
 * Get all env-related files
 */
export declare function getEnvFiles(files: FileInfo[]): FileInfo[];
/**
 * Get all source code files
 */
export declare function getSourceFiles(files: FileInfo[]): FileInfo[];
/**
 * Compute a hash of file modification times for cache invalidation
 */
export declare function computeFilesHash(files: FileInfo[]): string;
//# sourceMappingURL=file-walker.d.ts.map