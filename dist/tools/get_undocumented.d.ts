/**
 * get_undocumented tool - Find variables not in .env.example or lacking documentation
 */
export interface GetUndocumentedInput {
    projectPath?: string;
}
export interface UndocumentedEntry {
    name: string;
    usedIn: string[];
    languages: string[];
    usageContext: string;
    suggestedDescription: string;
    isSecret: boolean;
}
export interface GetUndocumentedOutput {
    undocumented: UndocumentedEntry[];
    totalUndocumented: number;
    hasEnvExample: boolean;
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the get_undocumented tool
 */
export declare function getUndocumented(input: GetUndocumentedInput): Promise<GetUndocumentedOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getUndocumentedTool: {
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
//# sourceMappingURL=get_undocumented.d.ts.map