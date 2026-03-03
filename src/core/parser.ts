/**
 * Multi-language environment variable usage parser
 * Detects env variable usage patterns across many languages
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import { detectLanguage, type Language } from '../utils/language.js';

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
export function parseFile(filePath: string, relativePath: string): ParseResult {
    const langInfo = detectLanguage(filePath);

    let content: string;
    try {
        content = readFileSync(filePath, 'utf-8');
    } catch (error) {
        return {
            usages: [],
            errors: [`Failed to read file: ${relativePath}`],
        };
    }

    const lines = content.split('\n');
    const usages: EnvUsage[] = [];
    const errors: string[] = [];

    try {
        switch (langInfo.language) {
            case 'javascript':
            case 'typescript':
                usages.push(...parseJavaScriptTypeScript(lines, filePath, relativePath, langInfo.language));
                break;
            case 'python':
                usages.push(...parsePython(lines, filePath, relativePath));
                break;
            case 'go':
                usages.push(...parseGo(lines, filePath, relativePath));
                break;
            case 'rust':
                usages.push(...parseRust(lines, filePath, relativePath));
                break;
            case 'shell':
                usages.push(...parseShell(lines, filePath, relativePath));
                break;
            case 'dockerfile':
                usages.push(...parseDockerfile(lines, filePath, relativePath));
                break;
            case 'yaml':
                usages.push(...parseYaml(lines, filePath, relativePath));
                break;
            case 'env':
                usages.push(...parseEnvFile(lines, filePath, relativePath));
                break;
            default:
                // Unknown language - no parsing
                break;
        }
    } catch (error) {
        errors.push(`Error parsing ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { usages, errors };
}

/**
 * Get context lines around a specific line
 */
function getContext(lines: string[], lineIndex: number, contextLines: number = 2): string {
    const start = Math.max(0, lineIndex - contextLines);
    const end = Math.min(lines.length, lineIndex + contextLines + 1);

    return lines
        .slice(start, end)
        .map((line, i) => {
            const actualLine = start + i + 1;
            const prefix = actualLine === lineIndex + 1 ? '> ' : '  ';
            return `${prefix}${actualLine}: ${line}`;
        })
        .join('\n');
}

/**
 * Check if a variable name looks valid
 */
function isValidEnvName(name: string): boolean {
    // Env vars should be uppercase letters, numbers, underscores
    // and typically start with a letter
    return /^[A-Z][A-Z0-9_]*$/.test(name) || /^[a-z][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Parse JavaScript/TypeScript files
 */
function parseJavaScriptTypeScript(
    lines: string[],
    filePath: string,
    relativePath: string,
    language: Language
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    // Patterns to detect
    const patterns = [
        // process.env.VARIABLE_NAME
        /process\.env\.([A-Z][A-Z0-9_]*)/g,
        // process.env['VARIABLE_NAME'] or process.env["VARIABLE_NAME"]
        /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
        // import.meta.env.VARIABLE_NAME (Vite)
        /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
        // import.meta.env['VARIABLE_NAME']
        /import\.meta\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
    ];

    // Pattern for destructuring: const { VAR1, VAR2 } = process.env
    const destructurePattern = /const\s*\{([^}]+)\}\s*=\s*process\.env/g;

    lines.forEach((line, lineIndex) => {
        // Check standard patterns
        for (const pattern of patterns) {
            pattern.lastIndex = 0; // Reset regex state
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const varName = match[1];
                if (varName && isValidEnvName(varName)) {
                    // Check if there's a default value (|| or ??)
                    const afterMatch = line.slice(match.index + match[0].length);
                    const defaultMatch = afterMatch.match(/^\s*(?:\|\||\?\?)\s*['"]?([^'",;\s)]+)['"]?/);

                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language,
                        usageType: defaultMatch ? 'default_provided' : 'usage',
                        defaultValue: defaultMatch?.[1],
                        hasDefaultValue: !!defaultMatch,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }

        // Check destructuring
        destructurePattern.lastIndex = 0;
        const destructureMatch = destructurePattern.exec(line);
        if (destructureMatch) {
            const vars = destructureMatch[1]!
                .split(',')
                .map(v => v.trim())
                .filter(v => v && !v.includes(':')) // Skip renamed vars for now
                .map(v => v.split('=')[0]!.trim()); // Handle defaults in destructure

            for (const varName of vars) {
                if (isValidEnvName(varName)) {
                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language,
                        usageType: 'usage',
                        hasDefaultValue: false,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }
    });

    return usages;
}

/**
 * Parse Python files
 */
function parsePython(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    const patterns = [
        // os.environ['VAR'] or os.environ["VAR"]
        /os\.environ\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
        // os.environ.get('VAR') or os.environ.get('VAR', 'default')
        /os\.environ\.get\(\s*['"]([A-Z][A-Z0-9_]*)['"](?:\s*,\s*['"]?([^'")\s]+)['"]?)?\)/g,
        // os.getenv('VAR') or os.getenv('VAR', 'default')
        /os\.getenv\(\s*['"]([A-Z][A-Z0-9_]*)['"](?:\s*,\s*['"]?([^'")\s]+)['"]?)?\)/g,
    ];

    lines.forEach((line, lineIndex) => {
        for (const pattern of patterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const varName = match[1];
                const defaultValue = match[2];

                if (varName && isValidEnvName(varName)) {
                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language: 'python',
                        usageType: defaultValue ? 'default_provided' : 'usage',
                        defaultValue,
                        hasDefaultValue: !!defaultValue,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }
    });

    return usages;
}

/**
 * Parse Go files
 */
function parseGo(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    const patterns = [
        // os.Getenv("VAR")
        /os\.Getenv\(\s*"([A-Z][A-Z0-9_]*)"\s*\)/g,
        // os.LookupEnv("VAR")
        /os\.LookupEnv\(\s*"([A-Z][A-Z0-9_]*)"\s*\)/g,
    ];

    lines.forEach((line, lineIndex) => {
        for (const pattern of patterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const varName = match[1];

                if (varName && isValidEnvName(varName)) {
                    // LookupEnv returns (value, ok) so we consider it a required check
                    const isLookup = line.includes('LookupEnv');

                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language: 'go',
                        usageType: isLookup ? 'required_check' : 'usage',
                        hasDefaultValue: false,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }
    });

    return usages;
}

/**
 * Parse Rust files
 */
function parseRust(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    const patterns = [
        // env::var("VAR") or std::env::var("VAR")
        /(?:std::)?env::var\(\s*"([A-Z][A-Z0-9_]*)"\s*\)/g,
        // env::var_os("VAR")
        /(?:std::)?env::var_os\(\s*"([A-Z][A-Z0-9_]*)"\s*\)/g,
    ];

    lines.forEach((line, lineIndex) => {
        for (const pattern of patterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const varName = match[1];

                if (varName && isValidEnvName(varName)) {
                    // Check for .unwrap_or, .unwrap_or_default, .ok()
                    const hasDefault = /\.(unwrap_or|unwrap_or_default|ok)\s*\(/.test(line.slice(match.index));

                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language: 'rust',
                        usageType: hasDefault ? 'default_provided' : 'usage',
                        hasDefaultValue: hasDefault,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }
    });

    return usages;
}

/**
 * Parse shell script files
 */
function parseShell(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    lines.forEach((line, lineIndex) => {
        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
            return;
        }

        // export VAR=value or VAR=value
        const exportMatch = line.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)=/);
        if (exportMatch && exportMatch[1]) {
            const varName = exportMatch[1];
            const valueMatch = line.match(/=(.*)$/);
            const value = valueMatch?.[1]?.replace(/^["']|["']$/g, '');

            usages.push({
                variableName: varName,
                filePath,
                relativePath,
                lineNumber: lineIndex + 1,
                language: 'shell',
                usageType: 'definition',
                defaultValue: value,
                hasDefaultValue: true,
                context: getContext(lines, lineIndex),
                rawLine: line,
            });
        }

        // $VAR or ${VAR} usage
        const varPatterns = [
            /\$\{([A-Z][A-Z0-9_]*)\}/g,
            /\$([A-Z][A-Z0-9_]*)\b/g,
        ];

        for (const pattern of varPatterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const varName = match[1];

                // Skip if this is a definition line
                if (line.match(new RegExp(`^(?:export\\s+)?${varName}=`))) {
                    continue;
                }

                if (varName && isValidEnvName(varName)) {
                    // Check for default syntax ${VAR:-default}
                    const defaultMatch = line.slice(match.index).match(/\$\{[A-Z][A-Z0-9_]*:-([^}]*)\}/);

                    usages.push({
                        variableName: varName,
                        filePath,
                        relativePath,
                        lineNumber: lineIndex + 1,
                        language: 'shell',
                        usageType: defaultMatch ? 'default_provided' : 'usage',
                        defaultValue: defaultMatch?.[1],
                        hasDefaultValue: !!defaultMatch,
                        context: getContext(lines, lineIndex),
                        rawLine: line,
                    });
                }
            }
        }
    });

    return usages;
}

/**
 * Parse Dockerfile
 */
function parseDockerfile(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Skip comments
        if (trimmed.startsWith('#')) {
            return;
        }

        // ENV VAR=value or ENV VAR value
        const envMatch = trimmed.match(/^ENV\s+([A-Z][A-Z0-9_]*)(?:=|\s+)(.*)$/i);
        if (envMatch && envMatch[1]) {
            const varName = envMatch[1];
            const value = envMatch[2]?.replace(/^["']|["']$/g, '');

            usages.push({
                variableName: varName,
                filePath,
                relativePath,
                lineNumber: lineIndex + 1,
                language: 'dockerfile',
                usageType: 'definition',
                defaultValue: value,
                hasDefaultValue: true,
                context: getContext(lines, lineIndex),
                rawLine: line,
            });
        }

        // ARG VAR or ARG VAR=default
        const argMatch = trimmed.match(/^ARG\s+([A-Z][A-Z0-9_]*)(?:=(.*))?$/i);
        if (argMatch && argMatch[1]) {
            const varName = argMatch[1];
            const defaultValue = argMatch[2]?.replace(/^["']|["']$/g, '');

            usages.push({
                variableName: varName,
                filePath,
                relativePath,
                lineNumber: lineIndex + 1,
                language: 'dockerfile',
                usageType: defaultValue ? 'default_provided' : 'usage',
                defaultValue,
                hasDefaultValue: !!defaultValue,
                context: getContext(lines, lineIndex),
                rawLine: line,
            });
        }
    });

    return usages;
}

/**
 * Parse YAML files (docker-compose, etc.)
 */
function parseYaml(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];
    const fileName = basename(filePath).toLowerCase();

    // Only parse docker-compose files for now
    if (!fileName.includes('docker-compose') && !fileName.includes('compose')) {
        return usages;
    }

    let inEnvironmentSection = false;
    let environmentIndent = 0;

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Detect environment section
        if (trimmed.startsWith('environment:')) {
            inEnvironmentSection = true;
            const match = line.match(/^(\s*)/);
            environmentIndent = match && match[1] ? match[1].length + 2 : 2;
            return;
        }

        // Check if we've exited the environment section
        if (inEnvironmentSection) {
            const match = line.match(/^(\s*)/);
            const indent = match && match[1] ? match[1].length : 0;

            if (trimmed && indent < environmentIndent && !trimmed.startsWith('-')) {
                inEnvironmentSection = false;
            }
        }

        // Parse environment variables
        if (inEnvironmentSection && trimmed.startsWith('-')) {
            // - VAR=value or - VAR
            const envMatch = trimmed.match(/^-\s*([A-Z][A-Z0-9_]*)(?:=(.*))?$/);
            if (envMatch && envMatch[1]) {
                const varName = envMatch[1];
                const value = envMatch[2]?.replace(/^["']|["']$/g, '');

                usages.push({
                    variableName: varName,
                    filePath,
                    relativePath,
                    lineNumber: lineIndex + 1,
                    language: 'yaml',
                    usageType: value !== undefined ? 'definition' : 'usage',
                    defaultValue: value,
                    hasDefaultValue: value !== undefined,
                    context: getContext(lines, lineIndex),
                    rawLine: line,
                });
            }
        }

        // Also check for ${VAR} interpolation
        const interpolationPattern = /\$\{([A-Z][A-Z0-9_]*)(?::-([^}]*))?\}/g;
        let match;
        while ((match = interpolationPattern.exec(line)) !== null) {
            const varName = match[1];
            const defaultValue = match[2];

            if (varName && isValidEnvName(varName)) {
                usages.push({
                    variableName: varName,
                    filePath,
                    relativePath,
                    lineNumber: lineIndex + 1,
                    language: 'yaml',
                    usageType: defaultValue ? 'default_provided' : 'usage',
                    defaultValue,
                    hasDefaultValue: !!defaultValue,
                    context: getContext(lines, lineIndex),
                    rawLine: line,
                });
            }
        }
    });

    return usages;
}

/**
 * Parse .env files
 */
function parseEnvFile(
    lines: string[],
    filePath: string,
    relativePath: string
): EnvUsage[] {
    const usages: EnvUsage[] = [];
    let pendingComment: string | undefined;

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();

        // Track comments as documentation
        if (trimmed.startsWith('#')) {
            pendingComment = trimmed.slice(1).trim();
            return;
        }

        // Skip empty lines (but preserve pending comment)
        if (!trimmed) {
            return;
        }

        // Parse KEY=VALUE, KEY="VALUE", KEY='VALUE', export KEY=VALUE
        const envMatch = trimmed.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)=(.*)$/);
        if (envMatch && envMatch[1]) {
            const varName = envMatch[1];
            let value = envMatch[2] ?? '';

            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            usages.push({
                variableName: varName,
                filePath,
                relativePath,
                lineNumber: lineIndex + 1,
                language: 'env',
                usageType: 'definition',
                defaultValue: value,
                hasDefaultValue: true,
                context: getContext(lines, lineIndex),
                documentation: pendingComment,
                rawLine: line,
            });
        }

        // Clear pending comment after non-empty line
        pendingComment = undefined;
    });

    return usages;
}

/**
 * Parse multiple files and aggregate results
 */
export function parseFiles(
    files: Array<{ path: string; relativePath: string }>
): { usages: EnvUsage[]; errors: string[] } {
    const allUsages: EnvUsage[] = [];
    const allErrors: string[] = [];

    for (const file of files) {
        const result = parseFile(file.path, file.relativePath);
        allUsages.push(...result.usages);
        allErrors.push(...result.errors);
    }

    return { usages: allUsages, errors: allErrors };
}
