/**
 * get_env_usage tool - Deep dive into a specific environment variable
 */
import { type RiskLevel } from '../core/analyzer.js';
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
export declare function getEnvUsage(input: GetEnvUsageInput): Promise<GetEnvUsageOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getEnvUsageTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            variableName: {
                type: string;
                description: string;
            };
            projectPath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=get_env_usage.d.ts.map