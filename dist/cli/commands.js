/**
 * Aegis TUI Commands - Command Handlers
 */
import ora from 'ora';
import { colors } from './theme.js';
import { displaySection, displaySectionEnd } from './banner.js';
import { renderSummary, renderVariables, renderRiskAnalysis, renderMissing, renderValidation, renderJson, renderError, renderSuccess, } from './renderer.js';
// Import core functions
import { getEnvMap } from '../tools/get_env_map.js';
import { getEnvRisk } from '../tools/get_env_risk.js';
import { getMissingEnvs } from '../tools/get_missing_envs.js';
import { getDuplicates } from '../tools/get_duplicates.js';
import { getUndocumented } from '../tools/get_undocumented.js';
import { getEnvUsage } from '../tools/get_env_usage.js';
import { getEnvGraph } from '../tools/get_env_graph.js';
import { validateEnvFile } from '../tools/validate_env_file.js';
import { generateEnvTemplate } from '../tools/generate_env_template.js';
/**
 * Create a styled spinner
 */
function createSpinner(text) {
    return ora({
        text,
        color: 'green',
        spinner: {
            interval: 80,
            frames: ['◐', '◓', '◑', '◒'],
        },
    });
}
/**
 * All available commands
 */
export const commands = [
    {
        name: 'scan',
        aliases: ['s', 'map'],
        description: 'Scan project for environment variables',
        usage: 'scan [filter]',
        handler: async (args, projectPath) => {
            const spinner = createSpinner('Scanning project...');
            spinner.start();
            try {
                const filter = args[0];
                const result = await getEnvMap({ projectPath, filter });
                spinner.stop();
                renderSummary(result);
                renderVariables(result);
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'risk',
        aliases: ['r', 'risks'],
        description: 'Analyze environment variable risks',
        usage: 'risk [min-level]',
        handler: async (args, projectPath) => {
            const spinner = createSpinner('Analyzing risks...');
            spinner.start();
            try {
                const minRisk = args[0];
                const result = await getEnvRisk({ projectPath, minRisk });
                spinner.stop();
                renderRiskAnalysis(result);
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'missing',
        aliases: ['m', 'undefined'],
        description: 'Find undefined but used variables',
        usage: 'missing',
        handler: async (_args, projectPath) => {
            const spinner = createSpinner('Finding missing variables...');
            spinner.start();
            try {
                const result = await getMissingEnvs({ projectPath });
                spinner.stop();
                renderMissing(result);
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'duplicates',
        aliases: ['d', 'dups'],
        description: 'Find duplicate or conflicting definitions',
        usage: 'duplicates',
        handler: async (_args, projectPath) => {
            const spinner = createSpinner('Checking for duplicates...');
            spinner.start();
            try {
                const result = await getDuplicates({ projectPath });
                spinner.stop();
                renderJson(result, 'DUPLICATES');
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'undocumented',
        aliases: ['u', 'undoc'],
        description: 'Find variables not in .env.example',
        usage: 'undocumented',
        handler: async (_args, projectPath) => {
            const spinner = createSpinner('Finding undocumented variables...');
            spinner.start();
            try {
                const result = await getUndocumented({ projectPath });
                spinner.stop();
                renderJson(result, 'UNDOCUMENTED');
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'usage',
        aliases: ['env'],
        description: 'Show detailed usage of a variable',
        usage: 'usage <variable-name>',
        handler: async (args, projectPath) => {
            if (!args[0]) {
                renderError('Variable name required. Usage: usage <variable-name>');
                return;
            }
            const spinner = createSpinner(`Analyzing ${args[0]}...`);
            spinner.start();
            try {
                const result = await getEnvUsage({ variableName: args[0], projectPath });
                spinner.stop();
                renderJson(result, `VARIABLE: ${args[0]}`);
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'graph',
        aliases: ['g', 'deps'],
        description: 'Show variable dependency graph',
        usage: 'graph',
        handler: async (_args, projectPath) => {
            const spinner = createSpinner('Building dependency graph...');
            spinner.start();
            try {
                const result = await getEnvGraph({ projectPath });
                spinner.stop();
                renderJson(result, 'DEPENDENCY GRAPH');
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'validate',
        aliases: ['v', 'check'],
        description: 'Validate a .env file',
        usage: 'validate [path]',
        handler: async (args, projectPath) => {
            const envFilePath = args[0] || '.env';
            const spinner = createSpinner(`Validating ${envFilePath}...`);
            spinner.start();
            try {
                const result = await validateEnvFile({ envFilePath, projectPath });
                spinner.stop();
                renderValidation(result);
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'generate',
        aliases: ['gen', 'template'],
        description: 'Generate .env.example template',
        usage: 'generate [output-path]',
        handler: async (args, projectPath) => {
            const outputPath = args[0];
            const spinner = createSpinner('Generating template...');
            spinner.start();
            try {
                const result = await generateEnvTemplate({ projectPath, outputPath });
                spinner.stop();
                if (outputPath) {
                    renderSuccess(`Template written to ${outputPath}`);
                }
                else {
                    displaySection('GENERATED TEMPLATE');
                    console.log('');
                    console.log(result.content);
                    displaySectionEnd();
                }
            }
            catch (error) {
                spinner.stop();
                renderError(error instanceof Error ? error.message : String(error));
            }
        },
    },
    {
        name: 'help',
        aliases: ['h', '?'],
        description: 'Show help information',
        usage: 'help [command]',
        handler: async (args) => {
            const cmdName = args[0];
            if (cmdName) {
                const cmd = commands.find(c => c.name === cmdName || c.aliases.includes(cmdName));
                if (cmd) {
                    displaySection(`HELP: ${cmd.name.toUpperCase()}`);
                    console.log('');
                    console.log(colors.dim('  Description: ') + colors.value(cmd.description));
                    console.log(colors.dim('  Usage:       ') + colors.accent(cmd.usage));
                    console.log(colors.dim('  Aliases:     ') + colors.muted(cmd.aliases.join(', ')));
                    console.log('');
                    displaySectionEnd();
                }
                else {
                    renderError(`Unknown command: ${cmdName}`);
                }
            }
            else {
                displaySection('AVAILABLE COMMANDS');
                console.log('');
                for (const cmd of commands) {
                    console.log('  ' +
                        colors.primary(cmd.name.padEnd(15)) +
                        colors.dim(cmd.description));
                }
                console.log('');
                console.log(colors.dim('  Type "help <command>" for detailed information.'));
                console.log('');
                displaySectionEnd();
            }
        },
    },
    {
        name: 'clear',
        aliases: ['cls', 'c'],
        description: 'Clear the screen',
        usage: 'clear',
        handler: async () => {
            console.clear();
        },
    },
    {
        name: 'exit',
        aliases: ['quit', 'q'],
        description: 'Exit Aegis',
        usage: 'exit',
        handler: async () => {
            console.log('');
            console.log(colors.primary('  Goodbye! Stay secure. 🛡️'));
            console.log('');
            process.exit(0);
        },
    },
];
/**
 * Find a command by name or alias
 */
export function findCommand(input) {
    const name = input.toLowerCase().trim();
    return commands.find(cmd => cmd.name === name || cmd.aliases.includes(name));
}
/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(partial) {
    const p = partial.toLowerCase();
    const matches = [];
    for (const cmd of commands) {
        if (cmd.name.startsWith(p)) {
            matches.push(cmd.name);
        }
        for (const alias of cmd.aliases) {
            if (alias.startsWith(p)) {
                matches.push(alias);
            }
        }
    }
    return [...new Set(matches)];
}
//# sourceMappingURL=commands.js.map