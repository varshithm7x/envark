/**
 * Language detection by file extension
 */
export type Language = 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'shell' | 'dockerfile' | 'yaml' | 'env' | 'unknown';
export interface LanguageInfo {
    language: Language;
    isSourceCode: boolean;
    isEnvFile: boolean;
    supportsEnvUsage: boolean;
    fileExtension: string;
}
/**
 * Detect the language of a file based on its path
 */
export declare function detectLanguage(filePath: string): LanguageInfo;
/**
 * Get all languages that support env variable usage
 */
export declare function getEnvCapableLanguages(): Language[];
/**
 * Get display name for a language
 */
export declare function getLanguageDisplayName(lang: Language): string;
/**
 * Check if two languages are from the same ecosystem
 */
export declare function isSameEcosystem(lang1: Language, lang2: Language): boolean;
//# sourceMappingURL=language.d.ts.map