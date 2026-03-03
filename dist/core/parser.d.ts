/**
 * Multi-language environment variable usage parser
 * Detects env variable usage patterns across many languages
 */
import { type Language } from '../utils/language.js';
export type UsageType = 'definition' | 'usage' | 'default_provided' | 'required_check';
export interface EnvUsage {
    variableName: string;
    filePath: string;
    relativePath: string;
    lineNumber: number;
    language: Language;
    usageType: UsageType;
    defaultValue?: string;
    hasDefaultValue: boolean;
    context: string;
    documentation?: string;
    rawLine: string;
}
export interface ParseResult {
    usages: EnvUsage[];
    errors: string[];
}
/**
 * Parse a file for environment variable usages
 */
export declare function parseFile(filePath: string, relativePath: string): ParseResult;
/**
 * Parse multiple files and aggregate results
 */
export declare function parseFiles(files: Array<{
    path: string;
    relativePath: string;
}>): {
    usages: EnvUsage[];
    errors: string[];
};
//# sourceMappingURL=parser.d.ts.map