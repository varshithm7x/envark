/**
 * generate_env_template tool - Generate a complete .env.example from codebase analysis
 */
export interface GenerateEnvTemplateInput {
    projectPath?: string;
    outputPath?: string;
}
export interface GenerateEnvTemplateOutput {
    content: string;
    variableCount: number;
    clusterCount: number;
    requiredCount: number;
    optionalCount: number;
    writtenTo?: string;
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the generate_env_template tool
 */
export declare function generateEnvTemplate(input: GenerateEnvTemplateInput): Promise<GenerateEnvTemplateOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const generateEnvTemplateTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
            outputPath: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=generate_env_template.d.ts.map