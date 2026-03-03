/**
 * Aegis TUI - Interactive Terminal Interface
 */
/**
 * Start the interactive TUI
 */
export declare function startTUI(): Promise<void>;
/**
 * Run a single command (non-interactive mode)
 */
export declare function runCommand(args: string[]): Promise<void>;
/**
 * Export for index.ts
 */
export { displayBanner, displayNavHints } from './banner.js';
//# sourceMappingURL=tui.d.ts.map