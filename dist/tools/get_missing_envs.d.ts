/**
 * get_missing_envs tool - Returns env variables used but never defined
 */
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
export declare function getMissingEnvs(input: GetMissingEnvsInput): Promise<GetMissingEnvsOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getMissingEnvsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=get_missing_envs.d.ts.map