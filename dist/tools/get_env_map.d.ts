/**
 * get_env_map tool - Returns the complete environment variable map
 */
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
 * Execute the get_env_map tool
 */
export declare function getEnvMap(input: GetEnvMapInput): Promise<GetEnvMapOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getEnvMapTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
            filter: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=get_env_map.d.ts.map