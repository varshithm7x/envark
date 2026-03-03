/**
 * Aegis TUI Renderer - Formatted Output Display
 */
import Table from 'cli-table3';
import { colors, styles, riskColor, formatNumber } from './theme.js';
import { displaySection, displaySectionEnd } from './banner.js';
/**
 * Render the scan summary
 */
export function renderSummary(result) {
    displaySection('SCAN SUMMARY');
    const { summary, metadata } = result;
    console.log('');
    console.log(colors.dim('  Project: ') + colors.value(metadata.projectPath));
    console.log(colors.dim('  Files:   ') + formatNumber(metadata.scannedFiles) + colors.dim(' scanned'));
    console.log(colors.dim('  Time:    ') + formatNumber(metadata.duration) + colors.dim('ms') + (metadata.cacheHit ? colors.dim(' (cached)') : ''));
    console.log('');
    // Stats table
    const statsTable = new Table({
        chars: {
            'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
            'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
            'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
            'right': '│', 'right-mid': '┤', 'middle': '│'
        },
        style: {
            head: [],
            border: ['dim'],
            'padding-left': 1,
            'padding-right': 1
        },
    });
    statsTable.push([colors.dim('Total Vars'), colors.dim('Defined'), colors.dim('Used'), colors.dim('Missing'), colors.dim('Dead'), colors.dim('Critical')], [
        formatNumber(summary.totalEnvVars, true),
        colors.success(summary.defined.toString()),
        formatNumber(summary.used),
        summary.missing > 0 ? colors.error(summary.missing.toString()) : colors.dim('0'),
        summary.dead > 0 ? colors.warning(summary.dead.toString()) : colors.dim('0'),
        summary.critical > 0 ? colors.critical(summary.critical.toString()) : colors.dim('0'),
    ]);
    console.log(statsTable.toString());
    displaySectionEnd();
}
/**
 * Render environment variables list
 */
export function renderVariables(result) {
    displaySection('ENVIRONMENT VARIABLES');
    console.log('');
    if (result.variables.length === 0) {
        console.log(colors.dim('  No environment variables found.'));
        displaySectionEnd();
        return;
    }
    const table = new Table({
        head: [
            colors.dim('Variable'),
            colors.dim('Risk'),
            colors.dim('Defined'),
            colors.dim('Used'),
            colors.dim('Default'),
        ],
        chars: {
            'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
            'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
            'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
            'right': '│', 'right-mid': '┤', 'middle': '│'
        },
        style: { head: [], border: ['dim'] },
        colWidths: [25, 12, 10, 10, 10],
    });
    for (const v of result.variables) {
        table.push([
            styles.variable(v.name.length > 23 ? v.name.slice(0, 20) + '...' : v.name),
            styles.risk(v.riskLevel),
            v.definedIn.length > 0 ? colors.success('✓') : colors.error('✗'),
            formatNumber(v.usedIn.length),
            v.hasDefault ? colors.success('✓') : colors.dim('-'),
        ]);
    }
    console.log(table.toString());
    displaySectionEnd();
}
/**
 * Render risk analysis
 */
export function renderRiskAnalysis(result) {
    displaySection('RISK ANALYSIS');
    console.log('');
    // Risk summary bar
    const { summary } = result;
    const total = summary.critical + summary.high + summary.medium + summary.low + summary.info;
    if (total === 0) {
        console.log(colors.success('  ✓ No risks detected. Your environment is healthy!'));
        displaySectionEnd();
        return;
    }
    // Risk distribution
    console.log('  ' +
        (summary.critical > 0 ? colors.critical(`█ Critical: ${summary.critical}  `) : '') +
        (summary.high > 0 ? colors.high(`█ High: ${summary.high}  `) : '') +
        (summary.medium > 0 ? colors.medium(`█ Medium: ${summary.medium}  `) : '') +
        (summary.low > 0 ? colors.low(`█ Low: ${summary.low}  `) : '') +
        (summary.info > 0 ? colors.info(`█ Info: ${summary.info}`) : ''));
    console.log('');
    // Detailed risk items
    for (const item of result.riskReport) {
        const riskColorFn = riskColor(item.riskLevel);
        console.log(riskColorFn(`  ┌─ ${item.name}`));
        console.log(colors.dim(`  │  Risk: `) + styles.risk(item.riskLevel));
        console.log(colors.dim(`  │  Usages: `) + formatNumber(item.usageCount));
        for (const issue of item.issues) {
            console.log(colors.dim(`  │  `));
            console.log(colors.dim(`  │  `) + riskColor(issue.severity)(`⚠ ${issue.message}`));
            console.log(colors.dim(`  │  `) + colors.dim(`→ ${issue.recommendation}`));
        }
        console.log(riskColorFn('  └' + '─'.repeat(50)));
        console.log('');
    }
    displaySectionEnd();
}
/**
 * Render missing variables
 */
export function renderMissing(result) {
    displaySection('MISSING VARIABLES');
    console.log('');
    if (result.totalMissing === 0) {
        console.log(colors.success('  ✓ All environment variables are defined!'));
        displaySectionEnd();
        return;
    }
    console.log(colors.error(`  ⚠ ${result.totalMissing} undefined variables found`));
    if (result.willCauseRuntimeCrash > 0) {
        console.log(colors.critical(`  ⛔ ${result.willCauseRuntimeCrash} will cause runtime crashes`));
    }
    console.log('');
    for (const missing of result.missing) {
        const dangerColor = riskColor(missing.dangerLevel);
        console.log(dangerColor(`  ┌─ ${missing.name}`));
        console.log(colors.dim(`  │  Danger: `) + styles.risk(missing.dangerLevel));
        console.log(colors.dim(`  │  Languages: `) + colors.accent(missing.languages.join(', ')));
        console.log(colors.dim(`  │  `));
        for (const usage of missing.usages.slice(0, 3)) {
            console.log(colors.dim(`  │  `) + styles.file(`${usage.file}:${usage.line}`));
            console.log(colors.dim(`  │    `) + colors.dim(usage.context));
        }
        if (missing.usages.length > 3) {
            console.log(colors.dim(`  │  `) + colors.dim(`... and ${missing.usages.length - 3} more`));
        }
        console.log(dangerColor('  └' + '─'.repeat(50)));
        console.log('');
    }
    displaySectionEnd();
}
/**
 * Render validation results
 */
export function renderValidation(result) {
    displaySection('VALIDATION RESULTS');
    console.log('');
    // File info
    console.log(colors.dim('  File: ') + colors.value(result.envFilePath));
    console.log(colors.dim('  Status: ') + (result.valid ? colors.success('✓ VALID') : colors.error('✗ INVALID')));
    console.log('');
    // Summary bar
    const { summary } = result;
    console.log('  ' +
        colors.success(`✓ ${summary.passed} passed  `) +
        (summary.warnings > 0 ? colors.warning(`⚠ ${summary.warnings} warnings  `) : '') +
        (summary.failed > 0 ? colors.error(`✗ ${summary.failed} failed`) : ''));
    console.log('');
    // Failed items
    if (result.results.failed.length > 0) {
        console.log(colors.error('  Failed:'));
        for (const item of result.results.failed) {
            console.log(colors.error(`    ✗ ${item.variable}`));
            console.log(colors.dim(`      ${item.issue}`));
        }
        console.log('');
    }
    // Warnings
    if (result.results.warnings.length > 0) {
        console.log(colors.warning('  Warnings:'));
        for (const item of result.results.warnings) {
            console.log(colors.warning(`    ⚠ ${item.variable}`));
            console.log(colors.dim(`      ${item.issue}`));
        }
        console.log('');
    }
    displaySectionEnd();
}
/**
 * Render generic JSON result with nice formatting
 */
export function renderJson(data, title = 'RESULT') {
    displaySection(title);
    console.log('');
    const jsonStr = JSON.stringify(data, null, 2);
    const lines = jsonStr.split('\n');
    for (const line of lines) {
        // Color code JSON
        let colored = line
            .replace(/"([^"]+)":/g, (_, key) => `${colors.accent(`"${key}"`)}:`)
            .replace(/: "([^"]+)"/g, (_, val) => `: ${colors.value(`"${val}"`)}`)
            .replace(/: (\d+)/g, (_, num) => `: ${colors.primary(num)}`)
            .replace(/: (true|false)/g, (_, bool) => `: ${bool === 'true' ? colors.success(bool) : colors.error(bool)}`);
        console.log('  ' + colored);
    }
    console.log('');
    displaySectionEnd();
}
/**
 * Render a progress spinner message
 */
export function renderProgress(message) {
    console.log(colors.primary('  ◆ ') + colors.dim(message));
}
/**
 * Render an error message
 */
export function renderError(message) {
    console.log('');
    console.log(colors.error('  ✗ Error: ') + colors.value(message));
    console.log('');
}
/**
 * Render a success message
 */
export function renderSuccess(message) {
    console.log('');
    console.log(colors.success('  ✓ ') + colors.value(message));
    console.log('');
}
//# sourceMappingURL=renderer.js.map