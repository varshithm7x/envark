/**
 * Aegis TUI - Interactive Terminal Interface
 */

import { createInterface, Interface } from 'readline';
import { colors, styles } from './theme.js';
import { displayBanner, displayNavHints } from './banner.js';
import { commands, findCommand, getCommandSuggestions } from './commands.js';
import { renderError } from './renderer.js';

// Current project path
let currentProjectPath = process.cwd();

// Global readline instance
let rl: Interface | null = null;

/**
 * Parse command input into command name and arguments
 */
function parseInput(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || '';
    const args = parts.slice(1);
    return { command, args };
}

/**
 * Display the command menu
 */
function showCommandMenu(): void {
    console.log('');
    console.log(colors.primary.bold('┌─ COMMANDS ────────────────────────────────────────────────┐'));
    console.log('');

    const cmdList = [
        { cmd: 'scan', alias: 's', desc: 'Scan project for environment variables' },
        { cmd: 'risk', alias: 'r', desc: 'Analyze environment variable risks' },
        { cmd: 'missing', alias: 'm', desc: 'Find undefined but used variables' },
        { cmd: 'duplicates', alias: 'd', desc: 'Find duplicate definitions' },
        { cmd: 'undocumented', alias: 'u', desc: 'Find undocumented variables' },
        { cmd: 'usage <var>', alias: 'env', desc: 'Show detailed usage of a variable' },
        { cmd: 'graph', alias: 'g', desc: 'Show variable dependency graph' },
        { cmd: 'validate', alias: 'v', desc: 'Validate a .env file' },
        { cmd: 'generate', alias: 'gen', desc: 'Generate .env.example template' },
        { cmd: 'cd <path>', alias: '', desc: 'Change project directory' },
        { cmd: 'clear', alias: 'cls', desc: 'Clear the screen' },
        { cmd: 'help', alias: 'h', desc: 'Show this menu' },
        { cmd: 'exit', alias: 'q', desc: 'Exit Aegis' },
    ];

    for (const item of cmdList) {
        const aliasStr = item.alias ? colors.dim(` (${item.alias})`) : '';
        console.log(
            '  ' +
            colors.primary(item.cmd.padEnd(18)) +
            aliasStr.padEnd(12) +
            colors.dim(item.desc)
        );
    }

    console.log('');
    console.log(colors.primary.bold('└──────────────────────────────────────────────────────────┘'));
    console.log('');
}

/**
 * Execute a command
 */
async function executeCommand(input: string): Promise<void> {
    const { command, args } = parseInput(input);

    if (!command) {
        return;
    }

    // Handle slash command - show menu
    if (command === '/' || command === 'menu') {
        showCommandMenu();
        return;
    }

    // Handle special commands
    if (command === 'cd' || command === 'project') {
        if (args[0]) {
            currentProjectPath = args[0].startsWith('/')
                ? args[0]
                : `${currentProjectPath}/${args[0]}`;
            console.log(colors.dim(`  Project path: ${currentProjectPath}`));
        } else {
            console.log(colors.dim(`  Current path: ${currentProjectPath}`));
        }
        return;
    }

    // Find and execute command
    const cmd = findCommand(command);

    if (cmd) {
        try {
            await cmd.handler(args, currentProjectPath);
        } catch (error) {
            renderError(error instanceof Error ? error.message : String(error));
        }
    } else {
        renderError(`Unknown command: ${command}. Type "/" to see available commands.`);
    }
}

/**
 * Setup readline with custom completer
 */
function createCompleter() {
    return function completer(line: string): [string[], string] {
        const suggestions = getCommandSuggestions(line);
        return [suggestions, line];
    };
}

/**
 * Prompt for next command
 */
function prompt(): void {
    process.stdout.write(colors.primary('❯ '));
}

/**
 * Start the interactive TUI
 */
export async function startTUI(): Promise<void> {
    // Display banner once
    displayBanner();
    displayNavHints();

    // Create readline interface
    rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: createCompleter(),
        terminal: true,
        historySize: 100,
    });

    // Handle SIGINT gracefully (Ctrl+C)
    rl.on('SIGINT', () => {
        console.log('');
        console.log(colors.primary('  Goodbye! Stay secure. 🛡️'));
        console.log('');
        process.exit(0);
    });

    // Handle each line of input
    rl.on('line', async (line) => {
        const input = line.trim();

        if (input) {
            await executeCommand(input);
        }

        console.log(''); // Add spacing
        prompt();
    });

    // Initial prompt
    prompt();

    // Keep the process alive indefinitely
    return new Promise(() => {
        // This promise never resolves, keeping the TUI running
    });
}

/**
 * Run a single command (non-interactive mode)
 */
export async function runCommand(args: string[]): Promise<void> {
    const command = args[0];
    const commandArgs = args.slice(1);

    if (!command) {
        displayBanner();
        displayNavHints();
        console.log(colors.dim('  Use "aegis --interactive" for interactive mode'));
        console.log(colors.dim('  Use "aegis <command>" to run a command'));
        console.log(colors.dim('  Use "aegis help" to see available commands'));
        console.log('');
        return;
    }

    // Display compact header for single commands
    console.log('');
    console.log(colors.primary.bold('  ◆ AEGIS'));
    console.log('');

    await executeCommand(`${command} ${commandArgs.join(' ')}`);
}

/**
 * Export for index.ts
 */
export { displayBanner, displayNavHints } from './banner.js';
