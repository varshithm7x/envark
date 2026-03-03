/**
 * get_env_risk tool - Returns env variables sorted by risk with detailed explanations
 */
import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';
import { analyzeEnvVariables, filterByRisk } from '../core/analyzer.js';
/**
 * Execute the get_env_risk tool
 */
export async function getEnvRisk(input) {
    const projectPath = normalizeProjectPath(input.projectPath);
    const minRisk = input.minRisk || 'info';
    // Scan project
    const scanResult = scanProject(projectPath);
    // Resolve and analyze
    const resolved = resolveEnvMap(scanResult.usages);
    const analysis = analyzeEnvVariables(resolved);
    // Filter by minimum risk
    const riskyVars = filterByRisk(analysis, minRisk);
    // Build risk report
    const riskReport = riskyVars.map(v => ({
        name: v.name,
        riskLevel: v.riskLevel,
        issues: v.issues.map(i => ({
            type: i.type,
            severity: i.severity,
            message: i.message,
            recommendation: i.recommendation,
        })),
        usageCount: v.usageCount,
        files: v.files.slice(0, 5), // Limit for token efficiency
    }));
    return {
        summary: {
            critical: analysis.summary.critical,
            high: analysis.summary.high,
            medium: analysis.summary.medium,
            low: analysis.summary.low,
            info: analysis.summary.info,
        },
        riskReport,
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
export const getEnvRiskTool = {
    name: 'get_env_risk',
    description: 'Returns all environment variables sorted by risk score with detailed issue explanations and specific recommended fixes',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
            minRisk: {
                type: 'string',
                enum: ['info', 'low', 'medium', 'high', 'critical'],
                description: 'Minimum risk level to include. Defaults to "info" (show all).',
            },
        },
        required: [],
    },
};
//# sourceMappingURL=get_env_risk.js.map