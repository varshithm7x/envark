/**
 * get_undocumented tool - Find variables not in .env.example or lacking documentation
 */
import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';
// Secret-like patterns
const SECRET_PATTERNS = [
    /SECRET/i,
    /PASSWORD/i,
    /TOKEN/i,
    /KEY$/i,
    /API_KEY/i,
    /PRIVATE/i,
];
/**
 * Generate a suggested description based on variable name and context
 */
function suggestDescription(name, context) {
    // Common patterns
    const patterns = [
        [/^DATABASE_URL$/i, 'Database connection string'],
        [/^DB_HOST$/i, 'Database host address'],
        [/^DB_PORT$/i, 'Database port number'],
        [/^DB_USER$/i, 'Database username'],
        [/^DB_PASSWORD$/i, 'Database password (secret)'],
        [/^DB_NAME$/i, 'Database name'],
        [/^REDIS_URL$/i, 'Redis connection string'],
        [/^API_KEY$/i, 'API key for external service'],
        [/^JWT_SECRET$/i, 'Secret key for JWT token signing'],
        [/^PORT$/i, 'Server port number'],
        [/^HOST$/i, 'Server host address'],
        [/^NODE_ENV$/i, 'Node.js environment (development/production)'],
        [/^LOG_LEVEL$/i, 'Application logging level'],
        [/^AWS_/, 'AWS service configuration'],
        [/^STRIPE_/, 'Stripe payment configuration'],
        [/^SENDGRID_/, 'SendGrid email service configuration'],
        [/^SMTP_/, 'SMTP email server configuration'],
        [/^SENTRY_/, 'Sentry error tracking configuration'],
        [/_URL$/i, `URL endpoint for ${name.replace(/_URL$/i, '').toLowerCase()}`],
        [/_HOST$/i, `Host address for ${name.replace(/_HOST$/i, '').toLowerCase()}`],
        [/_PORT$/i, `Port number for ${name.replace(/_PORT$/i, '').toLowerCase()}`],
        [/_KEY$/i, `API/access key for ${name.replace(/_KEY$/i, '').toLowerCase()}`],
        [/_SECRET$/i, `Secret key for ${name.replace(/_SECRET$/i, '').toLowerCase()}`],
        [/_TOKEN$/i, `Authentication token for ${name.replace(/_TOKEN$/i, '').toLowerCase()}`],
    ];
    for (const [pattern, description] of patterns) {
        if (pattern.test(name)) {
            return description;
        }
    }
    // Generic description based on name parts
    const parts = name.split('_').map(p => p.toLowerCase());
    return `Configuration for ${parts.join(' ')}`;
}
/**
 * Check if variable name looks like a secret
 */
function looksLikeSecret(name) {
    return SECRET_PATTERNS.some(pattern => pattern.test(name));
}
/**
 * Execute the get_undocumented tool
 */
export async function getUndocumented(input) {
    const projectPath = normalizeProjectPath(input.projectPath);
    // Scan project
    const scanResult = scanProject(projectPath);
    // Resolve
    const resolved = resolveEnvMap(scanResult.usages);
    // Check if .env.example exists
    const hasEnvExample = resolved.exampleFiles.length > 0;
    // Find undocumented variables
    const undocumented = [];
    for (const [name, variable] of resolved.variables) {
        // Skip if documented
        if (variable.isDocumented)
            continue;
        // Only include variables actually used in code
        if (!variable.usedInCode)
            continue;
        // Get usage context (first usage)
        const firstUsage = variable.usages[0];
        const context = firstUsage?.context || '';
        undocumented.push({
            name,
            usedIn: variable.files.slice(0, 5),
            languages: variable.languages,
            usageContext: context,
            suggestedDescription: suggestDescription(name, context),
            isSecret: looksLikeSecret(name),
        });
    }
    // Sort by name
    undocumented.sort((a, b) => a.name.localeCompare(b.name));
    return {
        undocumented,
        totalUndocumented: undocumented.length,
        hasEnvExample,
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
export const getUndocumentedTool = {
    name: 'get_undocumented',
    description: 'Returns all environment variables not present in .env.example or lacking a descriptive comment, with usage context and suggested descriptions',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
        },
        required: [],
    },
};
//# sourceMappingURL=get_undocumented.js.map