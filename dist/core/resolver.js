/**
 * Cross-file environment variable relationship resolver
 * Builds a unified map of all env variables with their relationships
 */
import { basename } from 'path';
/**
 * Check if a file is an env example/template file
 */
function isExampleFile(relativePath) {
    const name = basename(relativePath).toLowerCase();
    return (name.includes('.example') ||
        name.includes('.template') ||
        name.includes('.sample') ||
        name === '.env.example' ||
        name === '.env.template' ||
        name === '.env.sample');
}
/**
 * Check if a file is an actual env file (not example)
 */
function isActualEnvFile(relativePath) {
    const name = basename(relativePath).toLowerCase();
    return (name.startsWith('.env') &&
        !isExampleFile(relativePath));
}
/**
 * Resolve all env usages into a unified map
 */
export function resolveEnvMap(usages) {
    const variables = new Map();
    const envFiles = new Set();
    const exampleFiles = new Set();
    const sourceFiles = new Set();
    let totalUsages = 0;
    let totalDefinitions = 0;
    // Group usages by variable name
    for (const usage of usages) {
        // Track file types
        if (usage.language === 'env') {
            if (isExampleFile(usage.relativePath)) {
                exampleFiles.add(usage.relativePath);
            }
            else {
                envFiles.add(usage.relativePath);
            }
        }
        else {
            sourceFiles.add(usage.relativePath);
        }
        // Get or create variable entry
        let variable = variables.get(usage.variableName);
        if (!variable) {
            variable = {
                name: usage.variableName,
                definitions: [],
                usages: [],
                languages: [],
                files: [],
                hasDefault: false,
                defaultValues: [],
                isDocumented: false,
                documentation: undefined,
                definedInEnvFile: false,
                definedInExample: false,
                usedInCode: false,
                riskScore: 0,
                usageCount: 0,
            };
            variables.set(usage.variableName, variable);
        }
        // Create location
        const location = {
            filePath: usage.filePath,
            relativePath: usage.relativePath,
            lineNumber: usage.lineNumber,
            context: usage.context,
            rawLine: usage.rawLine,
        };
        // Categorize as definition or usage
        if (usage.usageType === 'definition') {
            variable.definitions.push(location);
            totalDefinitions++;
            if (usage.language === 'env') {
                if (isExampleFile(usage.relativePath)) {
                    variable.definedInExample = true;
                }
                else {
                    variable.definedInEnvFile = true;
                }
            }
        }
        else {
            variable.usages.push(location);
            totalUsages++;
            variable.usedInCode = true;
        }
        // Track defaults
        if (usage.hasDefaultValue) {
            variable.hasDefault = true;
            if (usage.defaultValue && !variable.defaultValues.includes(usage.defaultValue)) {
                variable.defaultValues.push(usage.defaultValue);
            }
        }
        // Track documentation
        if (usage.documentation) {
            variable.isDocumented = true;
            variable.documentation = usage.documentation;
        }
        // Track languages
        if (!variable.languages.includes(usage.language)) {
            variable.languages.push(usage.language);
        }
        // Track files
        if (!variable.files.includes(usage.relativePath)) {
            variable.files.push(usage.relativePath);
        }
        variable.usageCount++;
    }
    // Check documentation from example files
    for (const variable of variables.values()) {
        if (variable.definedInExample) {
            variable.isDocumented = true;
        }
    }
    return {
        variables,
        envFiles: Array.from(envFiles),
        exampleFiles: Array.from(exampleFiles),
        sourceFiles: Array.from(sourceFiles),
        totalUsages,
        totalDefinitions,
    };
}
/**
 * Get variables by filter criteria
 */
export function filterVariables(resolved, filter) {
    const vars = Array.from(resolved.variables.values());
    switch (filter) {
        case 'all':
            return vars;
        case 'missing':
            // Used in code but not defined in any env file
            return vars.filter(v => v.usedInCode && !v.definedInEnvFile && !v.hasDefault);
        case 'unused':
            // Defined in env file but never used in code
            return vars.filter(v => v.definedInEnvFile && !v.usedInCode);
        case 'risky':
            // High risk score (calculated by analyzer)
            return vars.filter(v => v.riskScore >= 3);
        case 'undocumented':
            // Not in example file and no documentation comment
            return vars.filter(v => !v.isDocumented && v.usedInCode);
        default:
            return vars;
    }
}
/**
 * Find similar variable names (potential duplicates with different naming)
 */
export function findSimilarNames(resolved) {
    const groups = new Map();
    const varNames = Array.from(resolved.variables.keys());
    // Common prefix/suffix patterns to normalize
    const normalizePatterns = [
        [/^(DATABASE|DB)_/, 'DB_'],
        [/_URL$/, '_URL'],
        [/_URI$/, '_URL'],
        [/_CONNECTION_STRING$/, '_URL'],
        [/^(API|SERVICE)_/, 'API_'],
        [/_KEY$/, '_KEY'],
        [/_SECRET$/, '_KEY'],
        [/_TOKEN$/, '_TOKEN'],
        [/_PASSWORD$/, '_PASSWORD'],
        [/_PASS$/, '_PASSWORD'],
    ];
    // Normalize a variable name for comparison
    function normalize(name) {
        let normalized = name;
        for (const [pattern, replacement] of normalizePatterns) {
            normalized = normalized.replace(pattern, replacement);
        }
        return normalized;
    }
    // Group by normalized name
    const normalizedGroups = new Map();
    for (const name of varNames) {
        const norm = normalize(name);
        const group = normalizedGroups.get(norm) || [];
        group.push(name);
        normalizedGroups.set(norm, group);
    }
    // Return only groups with multiple names
    for (const [normalized, names] of normalizedGroups) {
        if (names.length > 1) {
            groups.set(normalized, names);
        }
    }
    return groups;
}
/**
 * Find variables defined with different values across env files
 */
export function findConflictingDefinitions(resolved) {
    const conflicts = new Map();
    for (const [name, variable] of resolved.variables) {
        if (variable.defaultValues.length > 1) {
            // Multiple different values found
            const valuesByFile = [];
            for (const def of variable.definitions) {
                // Extract value from the raw line
                const match = def.rawLine.match(/=(.*)$/);
                if (match && match[1]) {
                    let value = match[1].trim();
                    // Remove quotes
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    valuesByFile.push({
                        file: def.relativePath,
                        value,
                    });
                }
            }
            // Check if values are actually different
            const uniqueValues = new Set(valuesByFile.map(v => v.value));
            if (uniqueValues.size > 1) {
                conflicts.set(name, valuesByFile);
            }
        }
    }
    return conflicts;
}
/**
 * Get variables grouped by their primary use case / cluster
 */
export function groupByCluster(resolved) {
    const clusters = new Map();
    // Define cluster patterns
    const clusterPatterns = [
        [/^(DATABASE|DB|POSTGRES|PG|MYSQL|MONGO|REDIS)_/, 'Database'],
        [/^(AUTH|JWT|SESSION|OAUTH|OIDC)_/, 'Authentication'],
        [/^(AWS|S3|CLOUDFRONT|LAMBDA|EC2)_/, 'AWS'],
        [/^(GCP|GOOGLE|GCS|FIREBASE)_/, 'Google Cloud'],
        [/^(AZURE|AZ_)/, 'Azure'],
        [/^(STRIPE|PAYMENT|PAYPAL)_/, 'Payment'],
        [/^(SMTP|MAIL|EMAIL|SENDGRID|MAILGUN)_/, 'Email'],
        [/^(SENTRY|DATADOG|NEWRELIC|LOGGING)_/, 'Monitoring'],
        [/^(REDIS|MEMCACHED|CACHE)_/, 'Caching'],
        [/^(API|SERVICE|BACKEND|FRONTEND)_/, 'API'],
        [/^(NODE_|NEXT_|VITE_|REACT_)/, 'Framework'],
        [/^(PORT|HOST|URL|BASE_URL)$/, 'Server'],
        [/(SECRET|KEY|TOKEN|PASSWORD|PRIVATE)/, 'Secrets'],
    ];
    for (const variable of resolved.variables.values()) {
        let assigned = false;
        for (const [pattern, clusterName] of clusterPatterns) {
            if (pattern.test(variable.name)) {
                const cluster = clusters.get(clusterName) || [];
                cluster.push(variable);
                clusters.set(clusterName, cluster);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            const cluster = clusters.get('Other') || [];
            cluster.push(variable);
            clusters.set('Other', cluster);
        }
    }
    return clusters;
}
//# sourceMappingURL=resolver.js.map