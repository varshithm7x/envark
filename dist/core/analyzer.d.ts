/**
 * Risk analysis and issue detection for environment variables
 */
import { type EnvVariable, type ResolvedEnvMap } from './resolver.js';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IssueType = 'MISSING' | 'UNDOCUMENTED' | 'DEAD' | 'DUPLICATE' | 'NO_DEFAULT' | 'INCONSISTENT' | 'EXPOSED' | 'EMPTY_VALUE' | 'PLACEHOLDER_VALUE';
export interface Issue {
    type: IssueType;
    severity: RiskLevel;
    message: string;
    recommendation: string;
    details?: string;
}
export interface AnalyzedVariable extends EnvVariable {
    riskLevel: RiskLevel;
    issues: Issue[];
    recommendations: string[];
}
export interface AnalysisResult {
    variables: AnalyzedVariable[];
    summary: {
        totalVariables: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
        byIssueType: Record<IssueType, number>;
    };
    duplicateGroups: Map<string, Array<{
        file: string;
        value: string;
    }>>;
    similarNameGroups: Map<string, string[]>;
}
/**
 * Analyze all resolved environment variables
 */
export declare function analyzeEnvVariables(resolved: ResolvedEnvMap): AnalysisResult;
/**
 * Filter analyzed variables by minimum risk level
 */
export declare function filterByRisk(result: AnalysisResult, minRisk: RiskLevel): AnalyzedVariable[];
/**
 * Get variables with a specific issue type
 */
export declare function filterByIssueType(result: AnalysisResult, issueType: IssueType): AnalyzedVariable[];
/**
 * Generate a risk report summary
 */
export declare function generateRiskReportSummary(result: AnalysisResult): string;
//# sourceMappingURL=analyzer.d.ts.map