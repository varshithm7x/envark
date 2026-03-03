/**
 * get_env_usage tool - Deep dive into a specific environment variable
 */

import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';
import { analyzeEnvVariables, type RiskLevel } from '../core/analyzer.js';

export interface GetEnvUsageInput {
    variableName: string;
    projectPath?: string;
}

export interface UsageLocation {
    file: string;
    line: number;
    language: string;
    context: string;
    hasDefault: boolean;
    defaultValue?: string;
}

export interface GetEnvUsageOutput {
    found: boolean;
    variable?: {
        name: string;
        definitions: UsageLocation[];
        usages: UsageLocation[];
        riskLevel: RiskLevel;
        issues: Array<{
            type: string;
            message: string;
            recommendation: string;
        }>;
        summary: {
            totalUsages: number;
            totalDefinitions: number;
            languages: string[];
            hasDefault: boolean;
            isDocumented: boolean;
            definedInEnvFile: boolean;
            definedInExample: boolean;
        };
        recommendations: string[];
    };
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}

/**
 * Execute the get_env_usage tool
 */
export async function getEnvUsage(input: GetEnvUsageInput): Promise<GetEnvUsageOutput> {
    const projectPath = normalizeProjectPath(input.projectPath);
    const varName = input.variableName.toUpperCase();

    // Scan project
    const scanResult = scanProject(projectPath);

    // Resolve and analyze
    const resolved = resolveEnvMap(scanResult.usages);
    const analysis = analyzeEnvVariables(resolved);

    // Find the variable
    const variable = resolved.variables.get(varName);
    const analyzedVar = analysis.variables.find(v => v.name === varName);

    if (!variable || !analyzedVar) {
        return {
            found: false,
            metadata: {
                projectPath,
                scannedFiles: scanResult.scannedFiles,
                cacheHit: scanResult.cacheHit,
                duration: scanResult.duration,
            },
        };
    }

    // Build usage locations from original usages
    const usageByFile = new Map<string, UsageLocation>();

    for (const usage of scanResult.usages) {
        if (usage.variableName === varName) {
            const key = `${usage.relativePath}:${usage.lineNumber}`;
            if (!usageByFile.has(key)) {
                usageByFile.set(key, {
                    file: usage.relativePath,
                    line: usage.lineNumber,
                    language: usage.language,
                    context: usage.context,
                    hasDefault: usage.hasDefaultValue,
                    defaultValue: usage.defaultValue,
                });
            }
        }
    }

    // Separate definitions from usages
    const definitions: UsageLocation[] = [];
    const usages: UsageLocation[] = [];

    for (const loc of usageByFile.values()) {
        if (loc.language === 'env') {
            definitions.push(loc);
        } else {
            usages.push(loc);
        }
    }

    return {
        found: true,
        variable: {
            name: varName,
            definitions,
            usages: usages.slice(0, 20), // Limit for token efficiency
            riskLevel: analyzedVar.riskLevel,
            issues: analyzedVar.issues.map(i => ({
                type: i.type,
                message: i.message,
                recommendation: i.recommendation,
            })),
            summary: {
                totalUsages: usages.length,
                totalDefinitions: definitions.length,
                languages: variable.languages,
                hasDefault: variable.hasDefault,
                isDocumented: variable.isDocumented,
                definedInEnvFile: variable.definedInEnvFile,
                definedInExample: variable.definedInExample,
            },
            recommendations: analyzedVar.recommendations,
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
export const getEnvUsageTool = {
    name: 'get_env_usage',
    description: 'Deep dive into a specific environment variable - shows every place it\'s used, what the code does with it, whether it has fallbacks, and its full risk profile',
    inputSchema: {
        type: 'object' as const,
        properties: {
            variableName: {
                type: 'string',
                description: 'The name of the environment variable to analyze',
            },
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
        },
        required: ['variableName'],
    },
};
