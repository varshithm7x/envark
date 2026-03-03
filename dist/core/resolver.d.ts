/**
 * Cross-file environment variable relationship resolver
 * Builds a unified map of all env variables with their relationships
 */
import { type EnvUsage } from './parser.js';
import { type Language } from '../utils/language.js';
export interface Location {
    filePath: string;
    relativePath: string;
    lineNumber: number;
    context: string;
    rawLine: string;
}
export interface EnvVariable {
    name: string;
    definitions: Location[];
    usages: Location[];
    languages: Language[];
    files: string[];
    hasDefault: boolean;
    defaultValues: string[];
    isDocumented: boolean;
    documentation?: string;
    definedInEnvFile: boolean;
    definedInExample: boolean;
    usedInCode: boolean;
    riskScore: number;
    usageCount: number;
}
export interface ResolvedEnvMap {
    variables: Map<string, EnvVariable>;
    envFiles: string[];
    exampleFiles: string[];
    sourceFiles: string[];
    totalUsages: number;
    totalDefinitions: number;
}
/**
 * Resolve all env usages into a unified map
 */
export declare function resolveEnvMap(usages: EnvUsage[]): ResolvedEnvMap;
/**
 * Get variables by filter criteria
 */
export declare function filterVariables(resolved: ResolvedEnvMap, filter: 'all' | 'missing' | 'unused' | 'risky' | 'undocumented'): EnvVariable[];
/**
 * Find similar variable names (potential duplicates with different naming)
 */
export declare function findSimilarNames(resolved: ResolvedEnvMap): Map<string, string[]>;
/**
 * Find variables defined with different values across env files
 */
export declare function findConflictingDefinitions(resolved: ResolvedEnvMap): Map<string, Array<{
    file: string;
    value: string;
}>>;
/**
 * Get variables grouped by their primary use case / cluster
 */
export declare function groupByCluster(resolved: ResolvedEnvMap): Map<string, EnvVariable[]>;
//# sourceMappingURL=resolver.d.ts.map