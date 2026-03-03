/**
 * Aegis TUI Theme - Colors and Styling
 */

import chalk, { type ChalkInstance } from 'chalk';

// Color palette - cybersecurity/hacker aesthetic
export const colors = {
    // Primary colors
    primary: chalk.hex('#00ff00'),       // Matrix green
    secondary: chalk.hex('#00cc00'),     // Darker green
    accent: chalk.hex('#00ffcc'),        // Cyan-green

    // Risk levels
    critical: chalk.hex('#ff0000'),      // Red
    high: chalk.hex('#ff6600'),          // Orange
    medium: chalk.hex('#ffcc00'),        // Yellow
    low: chalk.hex('#00ccff'),           // Light blue
    info: chalk.hex('#888888'),          // Gray

    // Status
    success: chalk.hex('#00ff00'),       // Green
    warning: chalk.hex('#ffcc00'),       // Yellow
    error: chalk.hex('#ff0000'),         // Red

    // UI elements
    dim: chalk.hex('#555555'),           // Dimmed text
    muted: chalk.hex('#888888'),         // Muted text
    highlight: chalk.hex('#ffffff'),     // White highlight
    border: chalk.hex('#444444'),        // Border color

    // Special
    prompt: chalk.hex('#00ff00'),        // Prompt color
    command: chalk.hex('#00ffcc'),       // Command color
    value: chalk.hex('#ffffff'),         // Value color
};

// Styled text helpers
export const styles = {
    // Headings
    h1: (text: string) => colors.primary.bold(text),
    h2: (text: string) => colors.secondary.bold(text),
    h3: (text: string) => colors.accent(text),

    // Risk level styling
    risk: (level: string) => {
        const levelLower = level.toLowerCase();
        switch (levelLower) {
            case 'critical': return colors.critical.bold(`■ ${level.toUpperCase()}`);
            case 'high': return colors.high.bold(`■ ${level.toUpperCase()}`);
            case 'medium': return colors.medium(`■ ${level.toUpperCase()}`);
            case 'low': return colors.low(`■ ${level.toUpperCase()}`);
            default: return colors.info(`■ ${level.toUpperCase()}`);
        }
    },

    // Status styling
    pass: (text: string) => colors.success(`✓ ${text}`),
    fail: (text: string) => colors.error(`✗ ${text}`),
    warn: (text: string) => colors.warning(`⚠ ${text}`),

    // Code/technical styling
    code: (text: string) => colors.accent(text),
    file: (text: string) => colors.muted(text),
    variable: (text: string) => colors.highlight.bold(text),
    number: (text: string) => colors.accent(text),

    // Prompt styling
    prompt: () => colors.primary('❯ '),
    arrow: () => colors.dim('→'),
    bullet: () => colors.dim('•'),

    // Decorative
    separator: () => colors.dim('─'.repeat(60)),
    doubleSeparator: () => colors.dim('═'.repeat(60)),
};

// Box characters for borders
export const box = {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    teeRight: '├',
    teeLeft: '┤',
    cross: '┼',
};

// Risk level to color function
export function riskColor(level: string): ChalkInstance {
    switch (level.toLowerCase()) {
        case 'critical': return colors.critical;
        case 'high': return colors.high;
        case 'medium': return colors.medium;
        case 'low': return colors.low;
        default: return colors.info;
    }
}

// Format a number with color
export function formatNumber(n: number, highlight = false): string {
    if (highlight && n > 0) {
        return colors.highlight.bold(n.toString());
    }
    return colors.accent(n.toString());
}
