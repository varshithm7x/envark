/**
 * get_env_map tool - Returns the complete environment variable map
 */

import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap, filterVariables, type EnvVariable } from '../core/resolver.js';
import { analyzeEnvVariables, type AnalyzedVariable } from '../core/analyzer.js';

export interface GetEnvMapInput {
    projectPath?: string;
    filter?: 'all' | 'missing' | 'unused' | 'risky' | 'undocumented';
}

export interface EnvVariableSummary {
    name: string;
    definedIn: string[];
    usedIn: string[];
    languages: string[];
    hasDefault: boolean;
    isDocumented: boolean;
    riskLevel: string;
    issueCount: number;
}

export interface GetEnvMapOutput {
    summary: {
        totalEnvVars: number;
        defined: number;
        used: number;
        missing: number;
        undocumented: number;
        dead: number;
        critical: number;
    };
    variables: EnvVariableSummary[];
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}

/**
 * Create a summary version of an analyzed variable
 */
function toVariableSummary(v: AnalyzedVariable): EnvVariableSummary {
    return {
        name: v.name,
        definedIn: v.definitions.map(d => d.relativePath),
        usedIn: v.usages.map(u => u.relativePath).slice(0, 5), // Limit for token efficiency
        languages: v.languages,
        hasDefault: v.hasDefault,
        isDocumented: v.isDocumented,
        riskLevel: v.riskLevel,
        issueCount: v.issues.length,
    };
}

/**
 * Execute the get_env_map tool
 */
export async function getEnvMap(input: GetEnvMapInput): Promise<GetEnvMapOutput> {
    const projectPath = normalizeProjectPath(input.projectPath);
    const filter = input.filter || 'all';

    // Scan project
    const scanResult = scanProject(projectPath);

    // Resolve and analyze
    const resolved = resolveEnvMap(scanResult.usages);
    const analysis = analyzeEnvVariables(resolved);

    // Apply filter
    let filteredVars: AnalyzedVariable[];

    switch (filter) {
        case 'missing':
            filteredVars = analysis.variables.filter(
                v => v.usedInCode && !v.definedInEnvFile && !v.hasDefault
            );
            break;
        case 'unused':
            filteredVars = analysis.variables.filter(
                v => v.definedInEnvFile && !v.usedInCode
            );
            break;
        case 'risky':
            filteredVars = analysis.variables.filter(
                v => v.riskLevel === 'critical' || v.riskLevel === 'high'
            );
            break;
        case 'undocumented':
            filteredVars = analysis.variables.filter(
                v => !v.isDocumented && v.usedInCode
            );
            break;
        default:
            filteredVars = analysis.variables;
    }

    // Calculate summary stats
    const summary = {
        totalEnvVars: resolved.variables.size,
        defined: Array.from(resolved.variables.values()).filter(v => v.definedInEnvFile).length,
        used: Array.from(resolved.variables.values()).filter(v => v.usedInCode).length,
        missing: analysis.summary.byIssueType.MISSING,
        undocumented: analysis.summary.byIssueType.UNDOCUMENTED,
        dead: analysis.summary.byIssueType.DEAD,
        critical: analysis.summary.critical,
    };

    return {
        summary,
        variables: filteredVars.map(toVariableSummary),
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
export const getEnvMapTool = {
    name: 'get_env_map',
    description: 'Returns the complete environment variable map for the project, with optional filtering by status (all, missing, unused, risky, undocumented)',
    inputSchema: {
        type: 'object' as const,
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
            filter: {
                type: 'string',
                enum: ['all', 'missing', 'unused', 'risky', 'undocumented'],
                description: 'Filter variables by status. Defaults to "all".',
            },
        },
        required: [],
    },
};
