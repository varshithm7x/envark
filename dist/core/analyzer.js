/**
 * Risk analysis and issue detection for environment variables
 */
import { findSimilarNames, findConflictingDefinitions } from './resolver.js';
// Secret-like patterns in variable names
const SECRET_PATTERNS = [
    /SECRET/i,
    /PASSWORD/i,
    /PASS$/i,
    /TOKEN/i,
    /KEY$/i,
    /API_KEY/i,
    /PRIVATE/i,
    /CREDENTIAL/i,
    /AUTH/i,
];
// Placeholder values that indicate incomplete configuration
const PLACEHOLDER_VALUES = [
    'changeme',
    'your-key-here',
    'your_key_here',
    'xxx',
    'todo',
    'fixme',
    'replace-me',
    'replace_me',
    'placeholder',
    'example',
    'test',
    'development',
    'your-',
    'your_',
    '<',
    '>',
];
/**
 * Check if a variable name looks like a secret
 */
function looksLikeSecret(name) {
    return SECRET_PATTERNS.some(pattern => pattern.test(name));
}
/**
 * Check if a value looks like a placeholder
 */
function isPlaceholderValue(value) {
    const lower = value.toLowerCase();
    return PLACEHOLDER_VALUES.some(p => lower.includes(p) || lower === p);
}
/**
 * Calculate risk score (0-5) for a variable
 */
function calculateRiskScore(variable) {
    let score = 0;
    // Critical: Used but never defined anywhere and no default
    if (variable.usedInCode && !variable.definedInEnvFile && !variable.hasDefault) {
        score += 5;
    }
    // High: Defined in .env but not in .env.example (potential secret leak)
    if (variable.definedInEnvFile && !variable.definedInExample && looksLikeSecret(variable.name)) {
        score += 4;
    }
    // Medium: Used in multiple files with no default
    if (variable.usedInCode && variable.usages.length > 2 && !variable.hasDefault) {
        score += 3;
    }
    // Low: Not documented
    if (!variable.isDocumented && variable.usedInCode) {
        score += 1;
    }
    // Low: Dead variable (defined but never used)
    if (variable.definedInEnvFile && !variable.usedInCode) {
        score += 1;
    }
    return Math.min(score, 5);
}
/**
 * Get risk level from score
 */
function scoreToRiskLevel(score) {
    if (score >= 5)
        return 'critical';
    if (score >= 4)
        return 'high';
    if (score >= 3)
        return 'medium';
    if (score >= 1)
        return 'low';
    return 'info';
}
/**
 * Detect all issues for a variable
 */
function detectIssues(variable, duplicateGroups, similarNameGroups) {
    const issues = [];
    // MISSING: Used in code but not defined anywhere
    if (variable.usedInCode && !variable.definedInEnvFile && !variable.hasDefault) {
        issues.push({
            type: 'MISSING',
            severity: 'critical',
            message: `${variable.name} is used in code but not defined in any .env file`,
            recommendation: `Add ${variable.name} to your .env file or provide a default value in code`,
            details: `Used in ${variable.usages.length} location(s)`,
        });
    }
    // UNDOCUMENTED: Not in .env.example and no documentation
    if (!variable.isDocumented && variable.usedInCode) {
        issues.push({
            type: 'UNDOCUMENTED',
            severity: 'low',
            message: `${variable.name} is not documented`,
            recommendation: `Add ${variable.name} to .env.example with a descriptive comment`,
        });
    }
    // DEAD: Defined but never used
    if (variable.definedInEnvFile && !variable.usedInCode && variable.definitions.length > 0) {
        issues.push({
            type: 'DEAD',
            severity: 'low',
            message: `${variable.name} is defined but never used in code`,
            recommendation: `Remove ${variable.name} from .env files or verify it's actually needed`,
            details: `Defined in: ${variable.definitions.map(d => d.relativePath).join(', ')}`,
        });
    }
    // DUPLICATE: Different values across .env files
    const duplicates = duplicateGroups.get(variable.name);
    if (duplicates && duplicates.length > 1) {
        const values = duplicates.map(d => `${d.file}: "${d.value}"`).join('\n');
        issues.push({
            type: 'DUPLICATE',
            severity: 'medium',
            message: `${variable.name} has different values across .env files`,
            recommendation: `Ensure ${variable.name} has consistent values or document why they differ`,
            details: values,
        });
    }
    // INCONSISTENT: Similar names that might be the same variable
    for (const [, names] of similarNameGroups) {
        if (names.includes(variable.name) && names.length > 1) {
            const others = names.filter(n => n !== variable.name);
            issues.push({
                type: 'INCONSISTENT',
                severity: 'medium',
                message: `${variable.name} may be the same as: ${others.join(', ')}`,
                recommendation: `Standardize variable naming across the codebase`,
                details: `Found in different files with similar purposes`,
            });
            break;
        }
    }
    // NO_DEFAULT: Critical path usage without fallback
    if (variable.usedInCode && !variable.hasDefault && variable.usages.length > 1) {
        issues.push({
            type: 'NO_DEFAULT',
            severity: 'medium',
            message: `${variable.name} is used in ${variable.usages.length} places with no default value`,
            recommendation: `Add a default value or ensure it's always set before app starts`,
        });
    }
    // EXPOSED: Looks like a secret but in wrong file type
    if (looksLikeSecret(variable.name) && variable.definedInEnvFile && !variable.definedInExample) {
        // Check if it's in a committed .env file (not .env.local)
        const inCommittedFile = variable.definitions.some(d => {
            const path = d.relativePath.toLowerCase();
            return path === '.env' || path.endsWith('/.env');
        });
        if (inCommittedFile) {
            issues.push({
                type: 'EXPOSED',
                severity: 'high',
                message: `${variable.name} looks like a secret but is in a potentially committed .env file`,
                recommendation: `Move ${variable.name} to .env.local or ensure .env is in .gitignore`,
            });
        }
    }
    // EMPTY_VALUE: Defined with empty value
    if (variable.defaultValues.some(v => v === '' || v === '""' || v === "''")) {
        issues.push({
            type: 'EMPTY_VALUE',
            severity: 'low',
            message: `${variable.name} is defined with an empty value`,
            recommendation: `Set an actual value or remove if not needed`,
        });
    }
    // PLACEHOLDER_VALUE: Defined with obvious placeholder
    if (variable.defaultValues.some(v => isPlaceholderValue(v))) {
        issues.push({
            type: 'PLACEHOLDER_VALUE',
            severity: 'medium',
            message: `${variable.name} has a placeholder value that should be replaced`,
            recommendation: `Replace the placeholder value with actual configuration`,
        });
    }
    return issues;
}
/**
 * Generate recommendations for a variable
 */
function generateRecommendations(variable, issues) {
    const recommendations = [];
    // Add unique recommendations from issues
    const seen = new Set();
    for (const issue of issues) {
        if (!seen.has(issue.recommendation)) {
            recommendations.push(issue.recommendation);
            seen.add(issue.recommendation);
        }
    }
    // Add general recommendations
    if (variable.usedInCode && variable.usages.length > 3 && !variable.hasDefault) {
        recommendations.push(`Consider creating a config module that validates ${variable.name} at startup`);
    }
    if (variable.languages.length > 1) {
        recommendations.push(`${variable.name} is used across ${variable.languages.join(', ')} - ensure consistent handling`);
    }
    return recommendations;
}
/**
 * Analyze all resolved environment variables
 */
export function analyzeEnvVariables(resolved) {
    const duplicateGroups = findConflictingDefinitions(resolved);
    const similarNameGroups = findSimilarNames(resolved);
    const analyzedVariables = [];
    const summary = {
        totalVariables: resolved.variables.size,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        byIssueType: {
            MISSING: 0,
            UNDOCUMENTED: 0,
            DEAD: 0,
            DUPLICATE: 0,
            NO_DEFAULT: 0,
            INCONSISTENT: 0,
            EXPOSED: 0,
            EMPTY_VALUE: 0,
            PLACEHOLDER_VALUE: 0,
        },
    };
    for (const variable of resolved.variables.values()) {
        // Calculate risk score
        const riskScore = calculateRiskScore(variable);
        variable.riskScore = riskScore;
        // Detect issues
        const issues = detectIssues(variable, duplicateGroups, similarNameGroups);
        // Generate recommendations
        const recommendations = generateRecommendations(variable, issues);
        // Determine risk level
        const riskLevel = scoreToRiskLevel(riskScore);
        // Create analyzed variable
        const analyzed = {
            ...variable,
            riskLevel,
            issues,
            recommendations,
        };
        analyzedVariables.push(analyzed);
        // Update summary
        summary[riskLevel]++;
        for (const issue of issues) {
            summary.byIssueType[issue.type]++;
        }
    }
    // Sort by risk (highest first)
    analyzedVariables.sort((a, b) => {
        const riskOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
    return {
        variables: analyzedVariables,
        summary,
        duplicateGroups,
        similarNameGroups,
    };
}
/**
 * Filter analyzed variables by minimum risk level
 */
export function filterByRisk(result, minRisk) {
    const riskOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    const minScore = riskOrder[minRisk];
    return result.variables.filter(v => riskOrder[v.riskLevel] >= minScore);
}
/**
 * Get variables with a specific issue type
 */
export function filterByIssueType(result, issueType) {
    return result.variables.filter(v => v.issues.some(i => i.type === issueType));
}
/**
 * Generate a risk report summary
 */
export function generateRiskReportSummary(result) {
    const lines = [];
    lines.push('Environment Variable Risk Report');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(`Total Variables: ${result.summary.totalVariables}`);
    lines.push('');
    lines.push('By Risk Level:');
    lines.push(`  🔴 Critical: ${result.summary.critical}`);
    lines.push(`  🟠 High: ${result.summary.high}`);
    lines.push(`  🟡 Medium: ${result.summary.medium}`);
    lines.push(`  🟢 Low: ${result.summary.low}`);
    lines.push(`  ⚪ Info: ${result.summary.info}`);
    lines.push('');
    lines.push('By Issue Type:');
    for (const [type, count] of Object.entries(result.summary.byIssueType)) {
        if (count > 0) {
            lines.push(`  ${type}: ${count}`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=analyzer.js.map