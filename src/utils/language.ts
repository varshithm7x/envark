/**
 * Language detection by file extension
 */

import { basename } from 'path';

export type Language =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'go'
    | 'rust'
    | 'shell'
    | 'dockerfile'
    | 'yaml'
    | 'env'
    | 'unknown';

export interface LanguageInfo {
    language: Language;
    isSourceCode: boolean;
    isEnvFile: boolean;
    supportsEnvUsage: boolean;
    fileExtension: string;
}

const EXTENSION_MAP: Record<string, Language> = {
    // JavaScript / TypeScript
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mts': 'typescript',
    '.cts': 'typescript',

    // Python
    '.py': 'python',
    '.pyw': 'python',
    '.pyi': 'python',

    // Go
    '.go': 'go',

    // Rust
    '.rs': 'rust',

    // Shell
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.fish': 'shell',
    '.ksh': 'shell',

    // Docker / YAML
    '.yml': 'yaml',
    '.yaml': 'yaml',
};

const FILENAME_MAP: Record<string, Language> = {
    'dockerfile': 'dockerfile',
    'docker-compose.yml': 'yaml',
    'docker-compose.yaml': 'yaml',
    '.bashrc': 'shell',
    '.zshrc': 'shell',
    '.bash_profile': 'shell',
    '.profile': 'shell',
};

/**
 * Detect the language of a file based on its path
 */
export function detectLanguage(filePath: string): LanguageInfo {
    const name = basename(filePath).toLowerCase();
    const extension = getFileExtension(filePath).toLowerCase();

    // Check for env files first
    if (name.startsWith('.env')) {
        return {
            language: 'env',
            isSourceCode: false,
            isEnvFile: true,
            supportsEnvUsage: false,
            fileExtension: name,
        };
    }

    // Check special filenames
    if (FILENAME_MAP[name]) {
        const lang = FILENAME_MAP[name]!;
        return {
            language: lang,
            isSourceCode: lang === 'shell',
            isEnvFile: false,
            supportsEnvUsage: true,
            fileExtension: extension || name,
        };
    }

    // Check Dockerfile patterns
    if (name === 'dockerfile' || name.endsWith('.dockerfile')) {
        return {
            language: 'dockerfile',
            isSourceCode: false,
            isEnvFile: false,
            supportsEnvUsage: true,
            fileExtension: '.dockerfile',
        };
    }

    // Check extension
    const lang = EXTENSION_MAP[extension];
    if (lang) {
        return {
            language: lang,
            isSourceCode: ['javascript', 'typescript', 'python', 'go', 'rust', 'shell'].includes(lang),
            isEnvFile: false,
            supportsEnvUsage: true,
            fileExtension: extension,
        };
    }

    return {
        language: 'unknown',
        isSourceCode: false,
        isEnvFile: false,
        supportsEnvUsage: false,
        fileExtension: extension,
    };
}

/**
 * Get file extension handling edge cases
 */
function getFileExtension(filePath: string): string {
    const name = basename(filePath);

    // Handle dotfiles
    if (name.startsWith('.') && !name.includes('.', 1)) {
        return name;
    }

    const lastDot = name.lastIndexOf('.');
    if (lastDot <= 0) {
        return '';
    }

    return name.slice(lastDot);
}

/**
 * Get all languages that support env variable usage
 */
export function getEnvCapableLanguages(): Language[] {
    return ['javascript', 'typescript', 'python', 'go', 'rust', 'shell', 'dockerfile', 'yaml'];
}

/**
 * Get display name for a language
 */
export function getLanguageDisplayName(lang: Language): string {
    const names: Record<Language, string> = {
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        python: 'Python',
        go: 'Go',
        rust: 'Rust',
        shell: 'Shell',
        dockerfile: 'Dockerfile',
        yaml: 'YAML',
        env: 'Environment File',
        unknown: 'Unknown',
    };
    return names[lang];
}

/**
 * Check if two languages are from the same ecosystem
 */
export function isSameEcosystem(lang1: Language, lang2: Language): boolean {
    const ecosystems: Language[][] = [
        ['javascript', 'typescript'],
        ['python'],
        ['go'],
        ['rust'],
        ['shell'],
        ['dockerfile', 'yaml'],
    ];

    for (const ecosystem of ecosystems) {
        if (ecosystem.includes(lang1) && ecosystem.includes(lang2)) {
            return true;
        }
    }

    return false;
}
