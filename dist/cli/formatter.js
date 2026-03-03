/**
 * CLI output formatter for Aegis
 * Pretty-prints analysis results for terminal output
 */
// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
};
const c = {
    reset: colors.reset,
    bold: (s) => `${colors.bold}${s}${colors.reset}`,
    dim: (s) => `${colors.dim}${s}${colors.reset}`,
    red: (s) => `${colors.red}${s}${colors.reset}`,
    green: (s) => `${colors.green}${s}${colors.reset}`,
    yellow: (s) => `${colors.yellow}${s}${colors.reset}`,
    blue: (s) => `${colors.blue}${s}${colors.reset}`,
    magenta: (s) => `${colors.magenta}${s}${colors.reset}`,
    cyan: (s) => `${colors.cyan}${s}${colors.reset}`,
};
function riskColor(risk) {
    switch (risk) {
        case 'critical': return `${colors.bgRed}${colors.white} CRITICAL ${colors.reset}`;
        case 'high': return `${colors.red} HIGH ${colors.reset}`;
        case 'medium': return `${colors.yellow} MEDIUM ${colors.reset}`;
        case 'low': return `${colors.blue} LOW ${colors.reset}`;
        default: return `${colors.green} INFO ${colors.reset}`;
    }
}
function statusIcon(status) {
    switch (status) {
        case 'pass': return c.green('✓');
        case 'warning': return c.yellow('⚠');
        case 'fail': return c.red('✗');
        default: return '•';
    }
}
export function formatEnvMap(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Aegis Environment Scan ━━━'));
    lines.push('');
    // Summary
    lines.push(c.bold('Summary:'));
    lines.push(`  Total variables:  ${c.cyan(data.summary.totalEnvVars.toString())}`);
    lines.push(`  Defined:          ${c.green(data.summary.defined.toString())}`);
    lines.push(`  Used in code:     ${c.blue(data.summary.used.toString())}`);
    lines.push(`  Missing:          ${data.summary.missing > 0 ? c.red(data.summary.missing.toString()) : c.green('0')}`);
    lines.push(`  Undocumented:     ${data.summary.undocumented > 0 ? c.yellow(data.summary.undocumented.toString()) : c.green('0')}`);
    lines.push(`  Dead (unused):    ${data.summary.dead > 0 ? c.dim(data.summary.dead.toString()) : c.green('0')}`);
    lines.push(`  Critical issues:  ${data.summary.critical > 0 ? c.red(data.summary.critical.toString()) : c.green('0')}`);
    lines.push('');
    // Variables
    if (data.variables.length > 0) {
        lines.push(c.bold('Variables:'));
        lines.push('');
        for (const v of data.variables) {
            lines.push(`  ${riskColor(v.riskLevel)} ${c.bold(v.name)}`);
            if (v.definedIn.length > 0) {
                lines.push(`    ${c.dim('Defined in:')} ${v.definedIn.join(', ')}`);
            }
            if (v.usedIn.length > 0) {
                const uniqueFiles = [...new Set(v.usedIn)];
                lines.push(`    ${c.dim('Used in:')} ${uniqueFiles.slice(0, 3).join(', ')}${uniqueFiles.length > 3 ? ` (+${uniqueFiles.length - 3} more)` : ''}`);
            }
            if (v.hasDefault) {
                lines.push(`    ${c.green('✓')} Has default value`);
            }
            if (v.isDocumented) {
                lines.push(`    ${c.green('✓')} Documented`);
            }
            lines.push('');
        }
    }
    // Metadata
    lines.push(c.dim(`Scanned ${data.metadata.scannedFiles} files in ${data.metadata.duration}ms${data.metadata.cacheHit ? ' (cached)' : ''}`));
    lines.push('');
    return lines.join('\n');
}
export function formatEnvRisk(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Aegis Risk Report ━━━'));
    lines.push('');
    // Summary
    lines.push(c.bold('Risk Summary:'));
    lines.push(`  ${c.red('Critical:')} ${data.summary.critical}`);
    lines.push(`  ${c.red('High:')}     ${data.summary.high}`);
    lines.push(`  ${c.yellow('Medium:')}   ${data.summary.medium}`);
    lines.push(`  ${c.blue('Low:')}      ${data.summary.low}`);
    lines.push(`  ${c.green('Info:')}     ${data.summary.info}`);
    lines.push('');
    // Risk report
    if (data.riskReport.length > 0) {
        lines.push(c.bold('Issues:'));
        lines.push('');
        for (const item of data.riskReport) {
            lines.push(`  ${riskColor(item.riskLevel)} ${c.bold(item.name)}`);
            for (const issue of item.issues) {
                lines.push(`    ${c.red('→')} ${issue.message}`);
                if (issue.recommendation) {
                    lines.push(`      ${c.dim(issue.recommendation)}`);
                }
            }
            lines.push(`    ${c.dim(`Used ${item.usageCount} times in ${item.files.length} files`)}`);
            lines.push('');
        }
    }
    else {
        lines.push(c.green('  No issues found! Your environment configuration looks healthy.'));
        lines.push('');
    }
    return lines.join('\n');
}
export function formatMissingEnvs(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Missing Environment Variables ━━━'));
    lines.push('');
    if (data.missing.length === 0) {
        lines.push(c.green('  ✓ No missing environment variables!'));
        lines.push('');
        return lines.join('\n');
    }
    lines.push(`  ${c.red(`${data.totalMissing} missing variables found`)}`);
    if (data.willCauseRuntimeCrash > 0) {
        lines.push(`  ${c.red(`${data.willCauseRuntimeCrash} will cause runtime crashes!`)}`);
    }
    lines.push('');
    for (const v of data.missing) {
        lines.push(`  ${c.red('✗')} ${c.bold(v.name)} ${c.dim(`(${v.dangerLevel})`)}`);
        lines.push(`    Used ${v.usageCount} times in ${v.languages.join(', ')}`);
        if (v.usages && v.usages.length > 0) {
            const usage = v.usages[0];
            lines.push(`    ${c.dim(usage.file)}:${usage.line}`);
            if (usage.context) {
                lines.push(`    ${c.cyan(usage.context.trim())}`);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
export function formatDuplicates(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Duplicate & Conflicting Variables ━━━'));
    lines.push('');
    if (data.duplicates.length === 0) {
        lines.push(c.green('  ✓ No duplicates or conflicts found!'));
        lines.push('');
        return lines.join('\n');
    }
    lines.push(`  ${c.yellow(`${data.valueConflicts} value conflicts, ${data.similarNameGroups} similar name groups`)}`);
    lines.push('');
    for (const dup of data.duplicates) {
        const icon = dup.type === 'value_conflict' ? c.red('⚠') : c.yellow('~');
        lines.push(`  ${icon} ${c.bold(dup.variableName)} ${c.dim(`(${dup.type.replace('_', ' ')})`)}`);
        if (dup.values) {
            for (const val of dup.values) {
                lines.push(`    ${c.dim(val.file)}: ${val.value}`);
            }
        }
        if (dup.similarNames) {
            lines.push(`    Similar: ${dup.similarNames.join(', ')}`);
        }
        if (dup.recommendation) {
            lines.push(`    ${c.cyan('→')} ${dup.recommendation}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
export function formatUndocumented(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Undocumented Variables ━━━'));
    lines.push('');
    if (data.undocumented.length === 0) {
        lines.push(c.green('  ✓ All variables are documented!'));
        lines.push('');
        return lines.join('\n');
    }
    lines.push(`  ${c.yellow(`${data.totalUndocumented} undocumented variables`)}`);
    lines.push(`  .env.example exists: ${data.hasEnvExample ? c.green('yes') : c.red('no')}`);
    lines.push('');
    for (const v of data.undocumented) {
        const secretIcon = v.isSecret ? c.red('🔐') : '';
        lines.push(`  ${c.yellow('?')} ${c.bold(v.name)} ${secretIcon}`);
        lines.push(`    Used in: ${v.usedIn.join(', ')}`);
        if (v.suggestedDescription) {
            lines.push(`    ${c.dim(`Suggested: ${v.suggestedDescription}`)}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
export function formatEnvUsage(data) {
    const lines = [];
    lines.push('');
    if (!data.found) {
        lines.push(c.red(`  Variable "${data.searchedName}" not found in project.`));
        lines.push('');
        return lines.join('\n');
    }
    const v = data.variable;
    lines.push(c.bold(`━━━ ${v.name} ━━━`));
    lines.push('');
    lines.push(`  Risk Level: ${riskColor(v.riskLevel)}`);
    lines.push(`  Usages: ${v.summary.totalUsages}`);
    lines.push(`  Definitions: ${v.summary.totalDefinitions}`);
    lines.push(`  Languages: ${v.summary.languages.join(', ')}`);
    lines.push(`  Has Default: ${v.summary.hasDefault ? c.green('yes') : c.yellow('no')}`);
    lines.push(`  Documented: ${v.summary.isDocumented ? c.green('yes') : c.yellow('no')}`);
    lines.push('');
    if (v.definitions && v.definitions.length > 0) {
        lines.push(c.bold('  Definitions:'));
        for (const def of v.definitions) {
            lines.push(`    ${c.dim(def.file)}:${def.line}`);
        }
        lines.push('');
    }
    if (v.usages && v.usages.length > 0) {
        lines.push(c.bold('  Usages:'));
        for (const usage of v.usages.slice(0, 5)) {
            lines.push(`    ${c.dim(usage.file)}:${usage.line}`);
            if (usage.context) {
                lines.push(`      ${c.cyan(usage.context.trim())}`);
            }
        }
        if (v.usages.length > 5) {
            lines.push(`    ${c.dim(`... and ${v.usages.length - 5} more`)}`);
        }
        lines.push('');
    }
    if (v.issues && v.issues.length > 0) {
        lines.push(c.bold('  Issues:'));
        for (const issue of v.issues) {
            lines.push(`    ${c.red('→')} ${issue.message}`);
        }
        lines.push('');
    }
    if (v.recommendations && v.recommendations.length > 0) {
        lines.push(c.bold('  Recommendations:'));
        for (const rec of v.recommendations) {
            lines.push(`    ${c.cyan('•')} ${rec}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
export function formatEnvGraph(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Environment Variable Graph ━━━'));
    lines.push('');
    // Load-bearing vars
    if (data.loadBearingVars && data.loadBearingVars.length > 0) {
        lines.push(c.bold('  Load-bearing variables:'));
        lines.push(`    ${data.loadBearingVars.map((v) => c.red(v)).join(', ')}`);
        lines.push('');
    }
    // Clusters
    if (data.clusters && data.clusters.length > 0) {
        lines.push(c.bold('  Clusters:'));
        for (const cluster of data.clusters) {
            lines.push(`    ${c.cyan(cluster.name)} (${cluster.totalUsages} usages)`);
            lines.push(`      ${cluster.variables.join(', ')}`);
        }
        lines.push('');
    }
    // Isolated vars
    if (data.isolatedVars && data.isolatedVars.length > 0) {
        lines.push(c.bold('  Isolated variables:'));
        lines.push(`    ${c.dim(data.isolatedVars.join(', '))}`);
        lines.push('');
    }
    // Graph nodes
    if (data.graph && data.graph.nodes && data.graph.nodes.length > 0) {
        lines.push(c.bold('  Variables:'));
        for (const node of data.graph.nodes.slice(0, 10)) {
            const loadBearing = node.isLoadBearing ? c.red('★') : ' ';
            lines.push(`    ${loadBearing} ${c.bold(node.name)} (${node.usageCount} uses, ${node.connections} connections)`);
        }
        if (data.graph.nodes.length > 10) {
            lines.push(`    ${c.dim(`... and ${data.graph.nodes.length - 10} more`)}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
export function formatValidation(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold(`━━━ Validation: ${data.envFilePath} ━━━`));
    lines.push('');
    const validIcon = data.valid ? c.green('✓ VALID') : c.red('✗ INVALID');
    lines.push(`  Status: ${validIcon}`);
    lines.push(`  Total: ${data.summary.total} | Passed: ${c.green(data.summary.passed.toString())} | Warnings: ${c.yellow(data.summary.warnings.toString())} | Failed: ${c.red(data.summary.failed.toString())}`);
    lines.push('');
    // Failed
    if (data.results.failed && data.results.failed.length > 0) {
        lines.push(c.bold('  Failed:'));
        for (const item of data.results.failed) {
            lines.push(`    ${c.red('✗')} ${c.bold(item.variable)}: ${item.issue}`);
        }
        lines.push('');
    }
    // Warnings
    if (data.results.warnings && data.results.warnings.length > 0) {
        lines.push(c.bold('  Warnings:'));
        for (const item of data.results.warnings) {
            lines.push(`    ${c.yellow('⚠')} ${c.bold(item.variable)}: ${item.issue}`);
        }
        lines.push('');
    }
    // Passed (summary only)
    if (data.results.passed && data.results.passed.length > 0) {
        lines.push(`  ${c.green('✓')} ${data.results.passed.length} variables passed validation`);
        lines.push('');
    }
    return lines.join('\n');
}
export function formatTemplate(data) {
    const lines = [];
    lines.push('');
    lines.push(c.bold('━━━ Generated .env Template ━━━'));
    lines.push('');
    lines.push(`  Variables: ${data.variableCount}`);
    lines.push(`  Clusters: ${data.clusterCount}`);
    lines.push(`  Required: ${c.red(data.requiredCount.toString())}`);
    lines.push(`  Optional: ${c.green(data.optionalCount.toString())}`);
    if (data.writtenTo) {
        lines.push('');
        lines.push(`  ${c.green('✓')} Written to: ${data.writtenTo}`);
    }
    lines.push('');
    lines.push(c.dim('─'.repeat(50)));
    lines.push('');
    lines.push(data.content);
    return lines.join('\n');
}
//# sourceMappingURL=formatter.js.map