/**
 * Aegis TUI Theme - Colors and Styling
 */
import { type ChalkInstance } from 'chalk';
export declare const colors: {
    primary: ChalkInstance;
    secondary: ChalkInstance;
    accent: ChalkInstance;
    critical: ChalkInstance;
    high: ChalkInstance;
    medium: ChalkInstance;
    low: ChalkInstance;
    info: ChalkInstance;
    success: ChalkInstance;
    warning: ChalkInstance;
    error: ChalkInstance;
    dim: ChalkInstance;
    muted: ChalkInstance;
    highlight: ChalkInstance;
    border: ChalkInstance;
    prompt: ChalkInstance;
    command: ChalkInstance;
    value: ChalkInstance;
};
export declare const styles: {
    h1: (text: string) => string;
    h2: (text: string) => string;
    h3: (text: string) => string;
    risk: (level: string) => string;
    pass: (text: string) => string;
    fail: (text: string) => string;
    warn: (text: string) => string;
    code: (text: string) => string;
    file: (text: string) => string;
    variable: (text: string) => string;
    number: (text: string) => string;
    prompt: () => string;
    arrow: () => string;
    bullet: () => string;
    separator: () => string;
    doubleSeparator: () => string;
};
export declare const box: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
    teeRight: string;
    teeLeft: string;
    cross: string;
};
export declare function riskColor(level: string): ChalkInstance;
export declare function formatNumber(n: number, highlight?: boolean): string;
//# sourceMappingURL=theme.d.ts.map