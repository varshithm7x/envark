/**
 * Gitignore-aware recursive file traversal utility
 * Handles .gitignore parsing and pattern matching without external dependencies
 */
import { readFileSync, readdirSync, existsSync, lstatSync } from 'fs';
import { join, relative, basename } from 'path';
// Default directories to always skip
const DEFAULT_SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '__pycache__',
    '.cache',
    '.venv',
    'venv',
    '.env',
    '.tox',
    'target',
    'vendor',
    '.bundle',
    '.gradle',
    '.idea',
    '.vscode',
    'tmp',
    'temp',
    'logs',
    '.nyc_output',
    '.pytest_cache',
    '.mypy_cache',
    '.ruff_cache',
    'htmlcov',
    '.coverage',
    '.terraform',
    '.serverless',
]);
// File extensions that are likely binary and should be skipped
const BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg', '.bmp', '.tiff',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
    '.exe', '.dll', '.so', '.dylib', '.bin',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.wav',
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.lock', '.lockfile',
    '.pyc', '.pyo', '.class', '.o', '.obj',
    '.min.js', '.min.css',
]);
/**
 * Parse a .gitignore file and return a list of patterns
 */
function parseGitignore(gitignorePath) {
    if (!existsSync(gitignorePath)) {
        return [];
    }
    try {
        const content = readFileSync(gitignorePath, 'utf-8');
        return content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));
    }
    catch {
        return [];
    }
}
/**
 * Convert a gitignore pattern to a regex
 */
function patternToRegex(pattern) {
    try {
        // Handle negation patterns (we'll skip them for simplicity)
        if (pattern.startsWith('!')) {
            return null;
        }
        // Remove leading slash (means root-relative)
        let isRootRelative = false;
        if (pattern.startsWith('/')) {
            isRootRelative = true;
            pattern = pattern.slice(1);
        }
        // Remove trailing slash (means directory only)
        const dirOnly = pattern.endsWith('/');
        if (dirOnly) {
            pattern = pattern.slice(0, -1);
        }
        // Escape special regex characters except * and ?
        let regexStr = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '{{GLOBSTAR}}')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]')
            .replace(/{{GLOBSTAR}}/g, '.*');
        // If pattern doesn't contain /, it matches anywhere
        if (!pattern.includes('/') && !isRootRelative) {
            regexStr = `(^|/)${regexStr}($|/)`;
        }
        else if (isRootRelative) {
            regexStr = `^${regexStr}`;
        }
        return new RegExp(regexStr);
    }
    catch {
        return null;
    }
}
/**
 * Check if a path matches any gitignore patterns
 */
function matchesGitignore(relativePath, patterns) {
    // Normalize path separators
    const normalizedPath = relativePath.replace(/\\/g, '/');
    for (const pattern of patterns) {
        if (pattern.test(normalizedPath)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a file extension indicates a binary file
 */
function isBinaryFile(filepath) {
    const ext = getExtension(filepath).toLowerCase();
    return BINARY_EXTENSIONS.has(ext);
}
/**
 * Get file extension including handling double extensions like .env.local
 */
function getExtension(filepath) {
    const name = basename(filepath);
    // Handle dotfiles like .env, .gitignore
    if (name.startsWith('.') && !name.includes('.', 1)) {
        return name;
    }
    // Handle double extensions like .env.local, .env.development
    if (name.startsWith('.env')) {
        return name;
    }
    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) {
        return '';
    }
    return name.slice(lastDot);
}
/**
 * Recursively walk a directory and collect file information
 * Respects .gitignore patterns and skips common non-source directories
 */
export function walkDirectory(rootPath, options = {}) {
    const { maxFiles = 10000, maxDepth = 50, includeHidden = false } = options;
    const files = [];
    const gitignorePatterns = [];
    // Load root .gitignore
    const rootGitignore = join(rootPath, '.gitignore');
    const rootPatterns = parseGitignore(rootGitignore);
    for (const pattern of rootPatterns) {
        const regex = patternToRegex(pattern);
        if (regex) {
            gitignorePatterns.push(regex);
        }
    }
    function walk(currentPath, depth, localPatterns) {
        if (depth > maxDepth || files.length >= maxFiles) {
            return;
        }
        let entries;
        try {
            entries = readdirSync(currentPath);
        }
        catch {
            return;
        }
        // Check for local .gitignore
        const localGitignore = join(currentPath, '.gitignore');
        if (existsSync(localGitignore) && currentPath !== rootPath) {
            const patterns = parseGitignore(localGitignore);
            for (const pattern of patterns) {
                const regex = patternToRegex(pattern);
                if (regex) {
                    localPatterns.push(regex);
                }
            }
        }
        for (const entry of entries) {
            if (files.length >= maxFiles) {
                return;
            }
            // Skip hidden files/directories unless explicitly included
            if (!includeHidden && entry.startsWith('.') && !entry.startsWith('.env')) {
                continue;
            }
            const fullPath = join(currentPath, entry);
            const relPath = relative(rootPath, fullPath);
            // Check gitignore patterns
            if (matchesGitignore(relPath, [...gitignorePatterns, ...localPatterns])) {
                continue;
            }
            let stats;
            try {
                // Use lstat to detect symlinks
                stats = lstatSync(fullPath);
            }
            catch {
                continue;
            }
            // Skip symlinks to avoid infinite loops
            if (stats.isSymbolicLink()) {
                continue;
            }
            if (stats.isDirectory()) {
                // Skip default directories
                if (DEFAULT_SKIP_DIRS.has(entry)) {
                    continue;
                }
                walk(fullPath, depth + 1, [...localPatterns]);
            }
            else if (stats.isFile()) {
                // Skip binary files
                if (isBinaryFile(fullPath)) {
                    continue;
                }
                // Skip very large files (> 1MB)
                if (stats.size > 1024 * 1024) {
                    continue;
                }
                files.push({
                    path: fullPath,
                    relativePath: relPath,
                    extension: getExtension(fullPath),
                    size: stats.size,
                    mtime: stats.mtimeMs,
                });
            }
        }
    }
    walk(rootPath, 0, []);
    return files;
}
/**
 * Get all files with a specific extension
 */
export function getFilesByExtension(files, extensions) {
    const extSet = new Set(extensions.map(e => e.toLowerCase()));
    return files.filter(f => extSet.has(f.extension.toLowerCase()));
}
/**
 * Get all env-related files
 */
export function getEnvFiles(files) {
    return files.filter(f => {
        const name = basename(f.path).toLowerCase();
        return (name.startsWith('.env') ||
            name === 'dockerfile' ||
            name === 'docker-compose.yml' ||
            name === 'docker-compose.yaml' ||
            name.endsWith('.dockerfile'));
    });
}
/**
 * Get all source code files
 */
export function getSourceFiles(files) {
    const sourceExtensions = new Set([
        '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
        '.py', '.pyw',
        '.go',
        '.rs',
        '.sh', '.bash', '.zsh',
        '.yml', '.yaml',
    ]);
    return files.filter(f => {
        const ext = f.extension.toLowerCase();
        return sourceExtensions.has(ext);
    });
}
/**
 * Compute a hash of file modification times for cache invalidation
 */
export function computeFilesHash(files) {
    const mtimes = files
        .map(f => `${f.relativePath}:${f.mtime}`)
        .sort()
        .join('|');
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < mtimes.length; i++) {
        const char = mtimes.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}
//# sourceMappingURL=file-walker.js.map