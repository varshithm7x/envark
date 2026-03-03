/**
 * get_env_risk tool - Returns env variables sorted by risk with detailed explanations
 */
import { type RiskLevel } from '../core/analyzer.js';
export interface GetEnvRiskInput {
    projectPath?: string;
    minRisk?: 'info' | 'low' | 'medium' | 'high' | 'critical';
}
export interface RiskEntry {
    name: string;
    riskLevel: RiskLevel;
    issues: Array<{
        type: string;
        severity: string;
        message: string;
        recommendation: string;
    }>;
    usageCount: number;
    files: string[];
}
export interface GetEnvRiskOutput {
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    riskReport: RiskEntry[];
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the get_env_risk tool
 */
export declare function getEnvRisk(input: GetEnvRiskInput): Promise<GetEnvRiskOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getEnvRiskTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
            minRisk: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=get_env_risk.d.ts.map