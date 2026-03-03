#!/usr/bin/env node
/**
 * Envark - MCP Server Entry Point
 * 
 * A production-quality MCP server that maps, analyzes, and guards
 * environment variables across your entire codebase.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// Import TUI
import { startInkTUI } from './cli/app.js';
import { runCommand } from './cli/tui.js';

// Import tools
import { getEnvMap, getEnvMapTool } from './tools/get_env_map.js';
import { getEnvRisk, getEnvRiskTool } from './tools/get_env_risk.js';
import { getMissingEnvs, getMissingEnvsTool } from './tools/get_missing_envs.js';
import { getDuplicates, getDuplicatesTool } from './tools/get_duplicates.js';
import { getUndocumented, getUndocumentedTool } from './tools/get_undocumented.js';
import { getEnvUsage, getEnvUsageTool } from './tools/get_env_usage.js';
import { getEnvGraph, getEnvGraphTool } from './tools/get_env_graph.js';
import { validateEnvFile, validateEnvFileTool } from './tools/validate_env_file.js';
import { generateEnvTemplate, generateEnvTemplateTool } from './tools/generate_env_template.js';

// All tool definitions
const TOOLS = [
    getEnvMapTool,
    getEnvRiskTool,
    getMissingEnvsTool,
    getDuplicatesTool,
    getUndocumentedTool,
    getEnvUsageTool,
    getEnvGraphTool,
    validateEnvFileTool,
    generateEnvTemplateTool,
];

// Tool handlers mapped by name
const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    get_env_map: (args) => getEnvMap(args as unknown as Parameters<typeof getEnvMap>[0]),
    get_env_risk: (args) => getEnvRisk(args as unknown as Parameters<typeof getEnvRisk>[0]),
    get_missing_envs: (args) => getMissingEnvs(args as unknown as Parameters<typeof getMissingEnvs>[0]),
    get_duplicates: (args) => getDuplicates(args as unknown as Parameters<typeof getDuplicates>[0]),
    get_undocumented: (args) => getUndocumented(args as unknown as Parameters<typeof getUndocumented>[0]),
    get_env_usage: (args) => getEnvUsage(args as unknown as Parameters<typeof getEnvUsage>[0]),
    get_env_graph: (args) => getEnvGraph(args as unknown as Parameters<typeof getEnvGraph>[0]),
    validate_env_file: (args) => validateEnvFile(args as unknown as Parameters<typeof validateEnvFile>[0]),
    generate_env_template: (args) => generateEnvTemplate(args as unknown as Parameters<typeof generateEnvTemplate>[0]),
};

/**
 * Initialize the MCP server
 */
function createServer(): Server {
    const server = new Server(
        {
            name: 'envark',
            version: '0.1.0',
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Handle list tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: TOOLS,
        };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        const handler = TOOL_HANDLERS[name];
        if (!handler) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: `Unknown tool: ${name}` }),
                    },
                ],
                isError: true,
            };
        }

        try {
            const result = await handler(args || {});
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: errorMessage }),
                    },
                ],
                isError: true,
            };
        }
    });

    return server;
}

/**
 * Generate MCP configuration for different IDEs
 */
function generateMcpConfig(ide: string): string {
    const configs: Record<string, object> = {
        'claude': {
            mcpServers: {
                envark: {
                    command: 'npx',
                    args: ['envark'],
                },
            },
        },
        'cursor': {
            mcpServers: {
                envark: {
                    command: 'npx',
                    args: ['envark'],
                },
            },
        },
        'vscode': {
            servers: {
                envark: {
                    type: 'stdio',
                    command: 'npx',
                    args: ['envark'],
                },
            },
        },
        'windsurf': {
            mcpServers: {
                envark: {
                    command: 'npx',
                    args: ['envark'],
                },
            },
        },
    };

    return JSON.stringify(configs[ide] || configs['claude'], null, 2);
}

/**
 * Get the config file path for an IDE
 */
function getConfigPath(ide: string): string {
    const home = homedir();

    const paths: Record<string, string> = {
        'claude': join(home, '.claude', 'mcp.json'),
        'cursor': join(home, '.cursor', 'mcp.json'),
        'vscode': join(process.cwd(), '.vscode', 'mcp.json'),
        'windsurf': join(home, '.windsurf', 'mcp.json'),
    };

    return paths[ide] ?? paths['claude'] ?? join(home, '.claude', 'mcp.json');
}

/**
 * Initialize MCP config for an IDE
 */
function initConfig(ide: string): void {
    const configPath = getConfigPath(ide);
    const config = generateMcpConfig(ide);

    // Ensure directory exists
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    // Check if config already exists
    if (existsSync(configPath)) {
        console.log(`Config file already exists: ${configPath}`);
        console.log('Please manually add the Envark configuration:');
        console.log('');
        console.log(config);
        return;
    }

    // Write config
    writeFileSync(configPath, config, 'utf-8');
    console.log(`Created MCP config at: ${configPath}`);
    console.log('');
    console.log('Envark is now configured. Restart your IDE to start using it.');
}

/**
 * Print help message
 */
function printHelp(): void {
    console.log(`
Envark - Environment Variable Guardian

Usage:
  envark                    Start the MCP server (when piped)
  envark -i, --interactive  Launch interactive TUI mode
  envark <command>          Run a command directly
  envark init <ide>         Initialize MCP config for an IDE
  envark help               Show this help message

Commands:
  scan [filter]     Scan project for environment variables
  risk [min-level]  Analyze environment variable risks
  missing           Find undefined but used variables
  duplicates        Find duplicate or conflicting definitions
  undocumented      Find variables not in .env.example
  usage <var>       Show detailed usage of a variable
  graph             Show variable dependency graph
  validate [path]   Validate a .env file
  generate [path]   Generate .env.example template

Supported IDEs for init:
  claude    - Claude Code (Claude Desktop)
  cursor    - Cursor
  vscode    - VS Code
  windsurf  - Windsurf

Examples:
  envark -i                  # Interactive TUI mode
  envark scan                # Scan current directory
  envark risk high           # Show high+ risk issues
  envark validate .env       # Validate .env file
  npx envark init vscode

For more information, visit: https://github.com/example/envark
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // Handle CLI commands
    if (args[0] === 'init') {
        const ide = args[1] || 'claude';
        const validIdes = ['claude', 'cursor', 'vscode', 'windsurf'];

        if (!validIdes.includes(ide)) {
            console.error(`Unknown IDE: ${ide}`);
            console.error(`Supported: ${validIdes.join(', ')}`);
            process.exit(1);
        }

        initConfig(ide);
        return;
    }

    if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        return;
    }

    if (args[0] === 'version' || args[0] === '--version' || args[0] === '-v') {
        console.log('argis v0.1.0');
        return;
    }

    // Interactive TUI mode
    if (args[0] === '-i' || args[0] === '--interactive' || args[0] === 'tui') {
        await startInkTUI();
        return;
    }

    // TUI command mode (scan, risk, missing, etc.)
    const tuiCommands = ['scan', 'risk', 'missing', 'duplicates', 'undocumented', 'usage', 'graph', 'validate', 'generate'];
    if (args[0] && tuiCommands.includes(args[0])) {
        await runCommand(args);
        return;
    }

    // Check if stdin is a TTY - if so, launch interactive TUI
    if (process.stdin.isTTY && args.length === 0) {
        // No args and interactive terminal - launch full interactive TUI
        await startInkTUI();
        return;
    }

    // Start MCP server (default for non-TTY, e.g., when called by an IDE)
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Keep process running
    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
    });
}

// Run main
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
