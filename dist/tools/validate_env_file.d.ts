/**
 * validate_env_file tool - Validates a .env file against codebase requirements
 */
export interface ValidateEnvFileInput {
    envFilePath: string;
    projectPath?: string;
}
export type ValidationStatus = 'pass' | 'warning' | 'fail';
export interface ValidationEntry {
    variable: string;
    status: ValidationStatus;
    issue?: string;
    suggestion?: string;
    value?: string;
}
export interface ValidateEnvFileOutput {
    valid: boolean;
    envFilePath: string;
    results: {
        passed: ValidationEntry[];
        warnings: ValidationEntry[];
        failed: ValidationEntry[];
    };
    summary: {
        total: number;
        passed: number;
        warnings: number;
        failed: number;
        unusedInFile: number;
        missingFromFile: number;
    };
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the validate_env_file tool
 */
export declare function validateEnvFile(input: ValidateEnvFileInput): Promise<ValidateEnvFileOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const validateEnvFileTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            envFilePath: {
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
//# sourceMappingURL=validate_env_file.d.ts.map