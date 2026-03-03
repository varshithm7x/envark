/**
 * Aegis TUI Renderer - Formatted Output Display
 */
interface EnvVariable {
    name: string;
    definedIn: string[];
    usedIn: string[];
    languages: string[];
    hasDefault: boolean;
    isDocumented: boolean;
    riskLevel: string;
    issueCount: number;
}
interface EnvMapResult {
    summary: {
        totalEnvVars: number;
        defined: number;
        used: number;
        missing: number;
        undocumented: number;
        dead: number;
        critical: number;
    };
    variables: EnvVariable[];
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
interface RiskItem {
    name: string;
    riskLevel: string;
    issues: Array<{
        type: string;
        severity: string;
        message: string;
        recommendation: string;
    }>;
    usageCount: number;
    files: string[];
}
interface RiskResult {
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    riskReport: RiskItem[];
}
interface MissingEnv {
    name: string;
    usages: Array<{
        file: string;
        line: number;
        context: string;
    }>;
    usageCount: number;
    languages: string[];
    dangerLevel: string;
}
interface MissingResult {
    missing: MissingEnv[];
    totalMissing: number;
    willCauseRuntimeCrash: number;
}
interface ValidationResult {
    valid: boolean;
    envFilePath: string;
    results: {
        passed: Array<{
            variable: string;
            status: string;
            value?: string;
        }>;
        warnings: Array<{
            variable: string;
            status: string;
            issue: string;
        }>;
        failed: Array<{
            variable: string;
            status: string;
            issue: string;
            value?: string;
        }>;
    };
    summary: {
        total: number;
        passed: number;
        warnings: number;
        failed: number;
    };
}
/**
 * Render the scan summary
 */
export declare function renderSummary(result: EnvMapResult): void;
/**
 * Render environment variables list
 */
export declare function renderVariables(result: EnvMapResult): void;
/**
 * Render risk analysis
 */
export declare function renderRiskAnalysis(result: RiskResult): void;
/**
 * Render missing variables
 */
export declare function renderMissing(result: MissingResult): void;
/**
 * Render validation results
 */
export declare function renderValidation(result: ValidationResult): void;
/**
 * Render generic JSON result with nice formatting
 */
export declare function renderJson(data: unknown, title?: string): void;
/**
 * Render a progress spinner message
 */
export declare function renderProgress(message: string): void;
/**
 * Render an error message
 */
export declare function renderError(message: string): void;
/**
 * Render a success message
 */
export declare function renderSuccess(message: string): void;
export {};
//# sourceMappingURL=renderer.d.ts.map