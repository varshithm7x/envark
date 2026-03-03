/**
 * get_missing_envs tool - Returns env variables used but never defined
 */

import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';

export interface GetMissingEnvsInput {
    projectPath?: string;
}

export interface MissingEnvEntry {
    name: string;
    usages: Array<{
        file: string;
        line: number;
        context: string;
    }>;
    usageCount: number;
    languages: string[];
    dangerLevel: 'critical' | 'high';
}

export interface GetMissingEnvsOutput {
    missing: MissingEnvEntry[];
    totalMissing: number;
    willCauseRuntimeCrash: number;
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}

/**
 * Execute the get_missing_envs tool
 */
export async function getMissingEnvs(input: GetMissingEnvsInput): Promise<GetMissingEnvsOutput> {
    const projectPath = normalizeProjectPath(input.projectPath);

    // Scan project
    const scanResult = scanProject(projectPath);

    // Resolve
    const resolved = resolveEnvMap(scanResult.usages);

    // Find missing variables
    const missingVars: MissingEnvEntry[] = [];

    for (const [name, variable] of resolved.variables) {
        // Missing: used in code but not defined anywhere with no default
        if (variable.usedInCode && !variable.definedInEnvFile && !variable.hasDefault) {
            missingVars.push({
                name,
                usages: variable.usages.slice(0, 10).map(u => ({
                    file: u.relativePath,
                    line: u.lineNumber,
                    context: u.context,
                })),
                usageCount: variable.usages.length,
                languages: variable.languages,
                dangerLevel: variable.usages.length > 2 ? 'critical' : 'high',
            });
        }
    }

    // Sort by usage count (most dangerous first)
    missingVars.sort((a, b) => b.usageCount - a.usageCount);

    // Count critical (will definitely crash)
    const willCrash = missingVars.filter(m => m.dangerLevel === 'critical').length;

    return {
        missing: missingVars,
        totalMissing: missingVars.length,
        willCauseRuntimeCrash: willCrash,
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
export const getMissingEnvsTool = {
    name: 'get_missing_envs',
    description: 'Returns every environment variable used in code that has no definition anywhere and no default value. These will cause runtime crashes.',
    inputSchema: {
        type: 'object' as const,
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
        },
        required: [],
    },
};
