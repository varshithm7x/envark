/**
 * validate_env_file tool - Validates a .env file against codebase requirements
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, relative, isAbsolute } from 'path';
import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';

export interface ValidateEnvFileInput {
    envFilePath: string;
    projectPath?: string;
}

export type ValidationStatus = 'pass' | 'warning' | 'fail';

export interface ValidationEntry {
    variable: string;
    status: ValidationStatus;
    issue?: string;
    suggestion?: string;
    value?: string;
}

export interface ValidateEnvFileOutput {
    valid: boolean;
    envFilePath: string;
    results: {
        passed: ValidationEntry[];
        warnings: ValidationEntry[];
        failed: ValidationEntry[];
    };
    summary: {
        total: number;
        passed: number;
        warnings: number;
        failed: number;
        unusedInFile: number;
        missingFromFile: number;
    };
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}

// Placeholder/invalid value patterns
const PLACEHOLDER_PATTERNS = [
    /^changeme$/i,
    /^your[_-]?(key|token|secret|password)/i,
    /^xxx+$/i,
    /^todo$/i,
    /^fixme$/i,
    /^replace[_-]?me$/i,
    /^placeholder$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example$/i,
];

/**
 * Check if a value looks like a placeholder
 */
function isPlaceholder(value: string): boolean {
    if (!value || value.trim() === '') return false;
    return PLACEHOLDER_PATTERNS.some(p => p.test(value.trim()));
}

/**
 * Parse a .env file and return key-value pairs
 */
function parseEnvFileContent(content: string): Map<string, string> {
    const vars = new Map<string, string>();

    for (const line of content.split('\n')) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Parse KEY=VALUE
        const match = trimmed.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)=(.*)$/);
        if (match && match[1]) {
            let value = match[2] || '';

            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            vars.set(match[1], value);
        }
    }

    return vars;
}

/**
 * Execute the validate_env_file tool
 */
export async function validateEnvFile(input: ValidateEnvFileInput): Promise<ValidateEnvFileOutput> {
    const projectPath = normalizeProjectPath(input.projectPath);

    // Resolve env file path
    let envFilePath = input.envFilePath;
    if (!isAbsolute(envFilePath)) {
        envFilePath = resolve(projectPath, envFilePath);
    }

    // Check if env file exists
    if (!existsSync(envFilePath)) {
        throw new Error(`Env file not found: ${envFilePath}`);
    }

    // Read and parse env file
    const envContent = readFileSync(envFilePath, 'utf-8');
    const envVars = parseEnvFileContent(envContent);

    // Scan project
    const scanResult = scanProject(projectPath);

    // Resolve
    const resolved = resolveEnvMap(scanResult.usages);

    // Get all variables used in code
    const usedInCode = new Set<string>();
    for (const [name, variable] of resolved.variables) {
        if (variable.usedInCode) {
            usedInCode.add(name);
        }
    }

    const passed: ValidationEntry[] = [];
    const warnings: ValidationEntry[] = [];
    const failed: ValidationEntry[] = [];

    // Check each variable in the env file
    for (const [varName, value] of envVars) {
        // Check if used in code
        if (!usedInCode.has(varName)) {
            warnings.push({
                variable: varName,
                status: 'warning',
                issue: 'Defined in env file but never used in code',
                suggestion: 'Remove if not needed, or verify it\'s used indirectly',
                value: value.length > 20 ? value.slice(0, 20) + '...' : value,
            });
            continue;
        }

        // Check for empty value
        if (value.trim() === '') {
            failed.push({
                variable: varName,
                status: 'fail',
                issue: 'Empty value',
                suggestion: 'Set a valid value or remove if not needed',
                value: '(empty)',
            });
            continue;
        }

        // Check for placeholder value
        if (isPlaceholder(value)) {
            failed.push({
                variable: varName,
                status: 'fail',
                issue: 'Placeholder value detected',
                suggestion: 'Replace with actual production value',
                value: value.length > 20 ? value.slice(0, 20) + '...' : value,
            });
            continue;
        }

        // Passed validation
        passed.push({
            variable: varName,
            status: 'pass',
            value: value.length > 20 ? value.slice(0, 20) + '...' : value,
        });
    }

    // Check for missing variables (used in code but not in this env file)
    for (const varName of usedInCode) {
        if (!envVars.has(varName)) {
            // Check if it has a default value in code
            const variable = resolved.variables.get(varName);
            if (variable && !variable.hasDefault) {
                failed.push({
                    variable: varName,
                    status: 'fail',
                    issue: 'Used in code but missing from env file',
                    suggestion: 'Add this variable to your env file',
                });
            } else if (variable?.hasDefault) {
                warnings.push({
                    variable: varName,
                    status: 'warning',
                    issue: 'Used in code but missing from env file (has default)',
                    suggestion: 'Consider adding explicitly for clarity',
                });
            }
        }
    }

    // Calculate summary
    const unusedInFile = warnings.filter(w => w.issue?.includes('never used')).length;
    const missingFromFile = failed.filter(f => f.issue?.includes('missing from')).length;

    return {
        valid: failed.length === 0,
        envFilePath: relative(projectPath, envFilePath),
        results: {
            passed,
            warnings,
            failed,
        },
        summary: {
            total: envVars.size,
            passed: passed.length,
            warnings: warnings.length,
            failed: failed.length,
            unusedInFile,
            missingFromFile,
        },
        metadata: {
            projectPath,
            scannedFiles: scanResult.scannedFiles,
            cacheHit: scanResult.cacheHit,
            duration: scanResult.duration,
        },
    };
}

/**
 * Tool definition for MCP registration
 */
export const validateEnvFileTool = {
    name: 'validate_env_file',
    description: 'Validates a .env file against what the codebase actually needs. Finds: vars in the file that code never uses, vars code needs that aren\'t in the file, and vars with empty or placeholder values',
    inputSchema: {
        type: 'object' as const,
        properties: {
            envFilePath: {
                type: 'string',
                description: 'Path to the .env file to validate (relative to project or absolute)',
            },
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
        },
        required: ['envFilePath'],
    },
};
