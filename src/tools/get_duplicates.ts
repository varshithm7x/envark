/**
 * get_duplicates tool - Find conflicting definitions and similar variable names
 */

import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap, findConflictingDefinitions, findSimilarNames } from '../core/resolver.js';

export interface GetDuplicatesInput {
    projectPath?: string;
}

export interface ConflictingValue {
    file: string;
    value: string;
}

export interface DuplicateGroup {
    variableName: string;
    type: 'value_conflict' | 'similar_name';
    values?: ConflictingValue[];
    similarNames?: string[];
    recommendation: string;
}

export interface GetDuplicatesOutput {
    duplicates: DuplicateGroup[];
    valueConflicts: number;
    similarNameGroups: number;
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}

/**
 * Execute the get_duplicates tool
 */
export async function getDuplicates(input: GetDuplicatesInput): Promise<GetDuplicatesOutput> {
    const projectPath = normalizeProjectPath(input.projectPath);

    // Scan project
    const scanResult = scanProject(projectPath);

    // Resolve
    const resolved = resolveEnvMap(scanResult.usages);

    // Find conflicts and similar names
    const conflicts = findConflictingDefinitions(resolved);
    const similar = findSimilarNames(resolved);

    const duplicates: DuplicateGroup[] = [];

    // Add value conflicts
    for (const [varName, values] of conflicts) {
        duplicates.push({
            variableName: varName,
            type: 'value_conflict',
            values,
            recommendation: `Consolidate ${varName} to have the same value across all .env files, or use environment-specific values intentionally.`,
        });
    }

    // Add similar name groups
    for (const [, names] of similar) {
        // Use the most used name as the primary
        const primaryName = names[0]!;
        duplicates.push({
            variableName: primaryName,
            type: 'similar_name',
            similarNames: names,
            recommendation: `Consider standardizing these variable names: ${names.join(', ')}. They may represent the same concept.`,
        });
    }

    return {
        duplicates,
        valueConflicts: conflicts.size,
        similarNameGroups: similar.size,
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
export const getDuplicatesTool = {
    name: 'get_duplicates',
    description: 'Find environment variables defined with different values across multiple .env files, or similar variable names that might represent the same concept (e.g., DB_URL vs DATABASE_URL)',
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
