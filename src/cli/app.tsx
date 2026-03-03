/**
 * Envark TUI App - Advanced React/Ink Application
 * Features: Multi-step commands, Interactive chat, Provider wizard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';

// Import tool handlers
import { getEnvMap } from '../tools/get_env_map.js';
import { getEnvRisk } from '../tools/get_env_risk.js';
import { getMissingEnvs } from '../tools/get_missing_envs.js';
import { getDuplicates } from '../tools/get_duplicates.js';
import { getEnvGraph } from '../tools/get_env_graph.js';
import { validateEnvFile } from '../tools/validate_env_file.js';
import { generateEnvTemplate } from '../tools/generate_env_template.js';

// Import AI Agent
import { getAIAgent } from '../ai/agent.js';

// ASCII Banner
const BANNER = `
 ███████╗███╗   ██╗██╗   ██╗ █████╗ ██████╗ ██╗  ██╗
 ██╔════╝████╗  ██║██║   ██║██╔══██╗██╔══██╗██║ ██╔╝
 █████╗  ██╔██╗ ██║██║   ██║███████║██████╔╝█████╔╝ 
 ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝██╔══██║██╔══██╗██╔═██╗ 
 ███████╗██║ ╚████║ ╚████╔╝ ██║  ██║██║  ██║██║  ██╗
 ╚══════╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`;

// Initialize AI Agent
const aiAgent = getAIAgent();

// Types
type UIMode = 'normal' | 'config' | 'chat';
type ConfigStep = 'provider' | 'apikey' | 'model';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ConfigState {
    step: ConfigStep;
    provider: string;
    apiKey: string;
    model: string;
}

// Provider options
const PROVIDERS = [
    { value: 'openai', label: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5' },
    { value: 'anthropic', label: 'Anthropic', description: 'Claude 3.5 Sonnet, Opus' },
    { value: 'gemini', label: 'Google Gemini', description: 'Gemini 1.5 Pro, Flash' },
    { value: 'ollama', label: 'Ollama (Local)', description: 'Llama, Mistral, CodeLlama' },
];

const DEFAULT_MODELS: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    gemini: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
};

// Command definitions
interface Command {
    name: string;
    shortcut: string;
    description: string;
    hasWizard?: boolean;
    requiresAI?: boolean;
}

const COMMANDS: Command[] = [
    { name: '/scan', shortcut: 's', description: 'Scan project for environment variables' },
    { name: '/risk', shortcut: 'r', description: 'Analyze environment variable risks' },
    { name: '/missing', shortcut: 'm', description: 'Find undefined but used variables' },
    { name: '/duplicates', shortcut: 'd', description: 'Find duplicate definitions' },
    { name: '/validate', shortcut: 'v', description: 'Validate a .env file' },
    { name: '/generate', shortcut: 'g', description: 'Generate .env.example template' },
    { name: '/graph', shortcut: 'gr', description: 'Show variable dependency graph' },
    { name: '/ai-config', shortcut: 'cfg', description: 'Configure AI provider', hasWizard: true },
    { name: '/chat', shortcut: 'ch', description: 'Start AI chat mode', requiresAI: true },
    { name: '/ask', shortcut: 'a', description: 'Quick AI question', requiresAI: true },
    { name: '/analyze', shortcut: 'an', description: 'AI analysis of your environment', requiresAI: true },
    { name: '/suggest', shortcut: 'su', description: 'Get AI suggestions for a variable', requiresAI: true },
    { name: '/explain', shortcut: 'ex', description: 'AI explains an environment variable', requiresAI: true },
    { name: '/template', shortcut: 'tpl', description: 'AI generates .env template', requiresAI: true },
    { name: '/help', shortcut: 'h', description: 'Show help dialog' },
    { name: '/clear', shortcut: 'c', description: 'Clear the output' },
    { name: '/exit', shortcut: 'q', description: 'Exit Envark' },
];

// Format helpers
function formatScanResult(result: any): string {
    const { summary, variables } = result;
    let output = `\n┌─ SCAN SUMMARY ────────────────────────────────────────────┐\n`;
    output += `│  Total: ${summary.totalEnvVars}  Defined: ${summary.defined}  Missing: ${summary.missing}  Critical: ${summary.critical}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n\n`;
    if (variables.length > 0) {
        output += `Variables:\n`;
        for (const v of variables.slice(0, 10)) {
            output += `  ${v.name.padEnd(25)} [${v.riskLevel.toUpperCase()}] ${v.definedIn.length > 0 ? '✓' : '✗'}\n`;
        }
        if (variables.length > 10) output += `  ... and ${variables.length - 10} more\n`;
    }
    return output;
}

function formatRiskResult(result: any): string {
    const { summary, riskReport } = result;
    let output = `\n┌─ RISK ANALYSIS ───────────────────────────────────────────┐\n`;
    output += `│  Critical: ${summary.critical}  High: ${summary.high}  Medium: ${summary.medium}  Low: ${summary.low}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n\n`;
    for (const item of riskReport.slice(0, 5)) {
        output += `  ⚠ ${item.name} [${item.riskLevel.toUpperCase()}]\n`;
        for (const issue of item.issues.slice(0, 2)) {
            output += `    → ${issue.message}\n`;
        }
    }
    return output;
}

function formatMissingResult(result: any): string {
    const { missing, totalMissing } = result;
    let output = `\n┌─ MISSING VARIABLES ───────────────────────────────────────┐\n`;
    output += `│  Total missing: ${totalMissing}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n\n`;
    for (const item of missing.slice(0, 5)) {
        output += `  ✗ ${item.name} [${item.dangerLevel.toUpperCase()}]\n`;
        for (const usage of item.usages.slice(0, 2)) {
            output += `    └─ ${usage.file}:${usage.line}\n`;
        }
    }
    return output;
}

function formatValidateResult(result: any): string {
    const { valid, summary } = result;
    let output = `\n┌─ VALIDATION ──────────────────────────────────────────────┐\n`;
    output += `│  Status: ${valid ? '✓ VALID' : '✗ INVALID'}\n`;
    output += `│  Passed: ${summary.passed}  Warnings: ${summary.warnings}  Failed: ${summary.failed}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n`;
    return output;
}

function formatHelp(): string {
    const info = aiAgent.getProviderInfo();
    let output = `\n┌─ ENVARK COMMANDS ─────────────────────────────────────────┐\n`;
    output += `│  SCANNING                                                │\n`;
    output += `│   /scan, /risk, /missing, /duplicates, /validate        │\n`;
    output += `│   /generate, /graph                                      │\n`;
    output += `│  AI SETUP                                                │\n`;
    output += `│   /ai-config  - Configure AI provider (wizard)           │\n`;
    if (info.configured) {
        output += `│  AI ASSISTANT (${info.name})                              │\n`.slice(0, 59) + '│\n';
        output += `│   /chat, /ask, /analyze, /suggest, /explain, /template  │\n`;
    }
    output += `│  GENERAL                                                 │\n`;
    output += `│   /help, /clear, /exit                                   │\n`;
    output += `└──────────────────────────────────────────────────────────┘\n`;
    return output;
}

// ============ COMPONENTS ============

// Provider Selection Dropdown
const ProviderSelect: React.FC<{ selectedIndex: number }> = ({ selectedIndex }) => {
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="red" marginY={1}>
            <Box paddingX={1}>
                <Text color="red" bold>Select AI Provider (↑↓ to navigate, Enter to select)</Text>
            </Box>
            {PROVIDERS.map((p, idx) => (
                <Box key={p.value} paddingX={1}>
                    <Text
                        color={idx === selectedIndex ? 'white' : 'red'}
                        backgroundColor={idx === selectedIndex ? 'red' : undefined}
                    >
                        {idx === selectedIndex ? '▸ ' : '  '}{p.label.padEnd(20)}
                    </Text>
                    <Text color="white"> {p.description}</Text>
                </Box>
            ))}
        </Box>
    );
};

// Model Selection Dropdown
const ModelSelect: React.FC<{ provider: string; selectedIndex: number }> = ({ provider, selectedIndex }) => {
    const models = DEFAULT_MODELS[provider] || [];
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="red" marginY={1}>
            <Box paddingX={1}>
                <Text color="red" bold>Select Model (↑↓ to navigate, Enter to select)</Text>
            </Box>
            {models.map((m, idx) => (
                <Box key={m} paddingX={1}>
                    <Text
                        color={idx === selectedIndex ? 'white' : 'red'}
                        backgroundColor={idx === selectedIndex ? 'red' : undefined}
                    >
                        {idx === selectedIndex ? '▸ ' : '  '}{m}
                    </Text>
                </Box>
            ))}
        </Box>
    );
};

// API Key Input
const APIKeyInput: React.FC<{ provider: string; value: string }> = ({ provider, value }) => {
    const isOllama = provider === 'ollama';
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="red" marginY={1}>
            <Box paddingX={1}>
                <Text color="red" bold>
                    {isOllama ? 'Ollama runs locally - Press Enter to continue' : `Enter ${provider.toUpperCase()} API Key:`}
                </Text>
            </Box>
            {!isOllama && (
                <Box paddingX={1}>
                    <Text color="red">{value ? '●'.repeat(Math.min(value.length, 40)) : 'Type your API key...'}</Text>
                    <Text color="red">▌</Text>
                </Box>
            )}
        </Box>
    );
};

// Chat Interface
const ChatInterface: React.FC<{ messages: ChatMessage[]; input: string; loading: boolean }> = ({ messages, input, loading }) => {
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="red" marginY={1} padding={1}>
            <Box marginBottom={1}>
                <Text color="red" bold>💬 AI Chat</Text>
                <Text color="white"> (type message, Enter to send, /exit to leave)</Text>
            </Box>

            {/* Message History */}
            <Box flexDirection="column" marginBottom={1}>
                {messages.slice(-8).map((msg, idx) => (
                    <Box key={idx} marginBottom={1} flexDirection="column">
                        <Box>
                            <Text color={msg.role === 'user' ? 'red' : 'white'} bold>
                                {msg.role === 'user' ? '  You: ' : '   AI: '}
                            </Text>
                        </Box>
                        <Box marginLeft={7}>
                            <Text color="white" wrap="wrap">
                                {msg.content.slice(0, 500)}{msg.content.length > 500 ? '...' : ''}
                            </Text>
                        </Box>
                    </Box>
                ))}
                {loading && (
                    <Box>
                        <Text color="white" bold>   AI: </Text>
                        <Text color="white">⠋ Thinking...</Text>
                    </Box>
                )}
            </Box>

            {/* Input Area */}
            <Box borderStyle="round" borderColor="red" paddingX={1}>
                <Text color="red">▸ </Text>
                <Text>{input || 'Type your message...'}</Text>
                <Text color="red">▌</Text>
            </Box>
        </Box>
    );
};

// Command Dropdown
const Dropdown: React.FC<{ items: Array<{ label: string; value: string; description: string }>; selectedIndex: number; visible: boolean }> = ({ items, selectedIndex, visible }) => {
    if (!visible || items.length === 0) return null;
    return (
        <Box flexDirection="column" borderStyle="single" borderColor="red" marginTop={-1}>
            {items.map((item, index) => (
                <Box key={item.value} paddingX={1}>
                    <Text
                        color={index === selectedIndex ? 'white' : 'red'}
                        backgroundColor={index === selectedIndex ? 'red' : undefined}
                    >
                        {item.label.padEnd(15)}
                    </Text>
                    <Text color="white"> – {item.description}</Text>
                </Box>
            ))}
        </Box>
    );
};

// Standard Input Box
const InputBox: React.FC<{ value: string; placeholder?: string; label?: string }> = ({ value, placeholder, label }) => {
    return (
        <Box borderStyle="single" borderColor="red" paddingX={1}>
            <Text color="red">{label || 'Command'}</Text>
            <Text> </Text>
            <Text>{value || placeholder || ''}</Text>
            <Text color="red">▌</Text>
        </Box>
    );
};

// Footer
const Footer: React.FC<{ mode: UIMode }> = ({ mode }) => {
    const info = aiAgent.getProviderInfo();
    const aiStatus = info.configured ? `${info.name}/${info.model}` : 'Not configured';
    const modeLabel = mode === 'chat' ? ' | CHAT MODE' : mode === 'config' ? ' | CONFIG WIZARD' : '';

    return (
        <Box justifyContent="space-between" marginTop={1}>
            <Text color="white">~ | Envark v0.1.0 | AI: {aiStatus}{modeLabel}</Text>
            <Text>
                <Text color="red">[Ctrl+C]</Text>
                <Text color="white"> {mode === 'normal' ? 'Clear/Exit' : 'Cancel'}</Text>
            </Text>
        </Box>
    );
};

// ============ MAIN APP ============

const App: React.FC = () => {
    const { exit } = useApp();
    const projectPath = process.cwd();

    // Core state
    const [mode, setMode] = useState<UIMode>('normal');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // Command dropdown state
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);

    // Config wizard state
    const [configState, setConfigState] = useState<ConfigState>({
        step: 'provider',
        provider: '',
        apiKey: '',
        model: ''
    });

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Filter commands based on input (hide AI commands if not configured)
    useEffect(() => {
        if (mode === 'normal' && input.startsWith('/')) {
            const search = input.toLowerCase();
            const aiConfigured = aiAgent.getProviderInfo().configured;
            const filtered = COMMANDS.filter(cmd => {
                // Hide AI-requiring commands if AI is not configured
                if (cmd.requiresAI && !aiConfigured) return false;
                return cmd.name.toLowerCase().startsWith(search) ||
                    cmd.shortcut.startsWith(search.slice(1));
            });
            setFilteredCommands(filtered);
            // Show dropdown if we have matches (limit display to first 10)
            setShowDropdown(filtered.length > 0);
            setSelectedIndex(0);
        } else {
            setShowDropdown(false);
            setFilteredCommands([]);
        }
    }, [input, mode]);

    // Execute command
    const executeCommand = useCallback(async (cmd: string) => {
        const parts = cmd.trim().split(/\s+/);
        const commandName = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        // Check for /ai-config - start wizard
        if (commandName === '/ai-config' || commandName === 'ai-config' || commandName === 'cfg') {
            setMode('config');
            setConfigState({ step: 'provider', provider: '', apiKey: '', model: '' });
            setInput('');
            setSelectedIndex(0);
            return;
        }

        // Check for /chat - start chat mode
        if (commandName === '/chat' || commandName === 'chat' || commandName === 'ch') {
            setMode('chat');
            setChatMessages([]);
            setInput('');
            return;
        }

        // Check for /exit
        if (commandName === '/exit' || commandName === 'exit' || commandName === 'q') {
            exit();
            return;
        }

        // Check for /clear
        if (commandName === '/clear' || commandName === 'clear' || commandName === 'c') {
            setOutput('');
            setInput('');
            return;
        }

        // Check for /help
        if (commandName === '/help' || commandName === 'help' || commandName === 'h') {
            setOutput(formatHelp());
            setInput('');
            return;
        }

        setLoading(true);
        setShowDropdown(false);

        try {
            let result = '';

            switch (commandName) {
                case '/scan':
                case 'scan':
                case 's':
                    result = formatScanResult(await getEnvMap({ projectPath }));
                    break;
                case '/risk':
                case 'risk':
                case 'r':
                    result = formatRiskResult(await getEnvRisk({ projectPath }));
                    break;
                case '/missing':
                case 'missing':
                case 'm':
                    result = formatMissingResult(await getMissingEnvs({ projectPath }));
                    break;
                case '/duplicates':
                case 'duplicates':
                case 'd':
                    result = JSON.stringify(await getDuplicates({ projectPath }), null, 2);
                    break;
                case '/validate':
                case 'validate':
                case 'v':
                    result = formatValidateResult(await validateEnvFile({ envFilePath: args[0] || '.env', projectPath }));
                    break;
                case '/generate':
                case 'generate':
                case 'g':
                    const genResult = await generateEnvTemplate({ projectPath });
                    result = (genResult as any).content || JSON.stringify(genResult, null, 2);
                    break;
                case '/graph':
                case 'graph':
                case 'gr':
                    result = JSON.stringify(await getEnvGraph({ projectPath }), null, 2);
                    break;
                case '/ask':
                case 'ask':
                case 'a':
                    if (args.length === 0) {
                        setMode('chat');
                        setChatMessages([]);
                        setInput('');
                        setLoading(false);
                        return;
                    }
                    result = await aiAgent.chat(args.join(' '));
                    break;
                case '/analyze':
                case 'analyze':
                case 'an':
                    const scanResult = await getEnvMap({ projectPath });
                    const analysis = await aiAgent.analyzeEnvironment({
                        variables: scanResult.variables.map((v: any) => ({
                            name: v.name,
                            file: v.definedIn[0] || 'unknown',
                            line: 1,
                            riskLevel: v.riskLevel
                        })),
                        projectPath
                    });
                    result = `Summary: ${analysis.summary}\n\nRecommendations:\n${analysis.recommendations.map(r => `  • ${r}`).join('\n')}`;
                    break;
                case '/suggest':
                case 'suggest':
                case 'su':
                    if (!args[0]) {
                        result = 'Usage: /suggest <VARIABLE_NAME>';
                    } else {
                        const suggestions = await aiAgent.suggestVariableImprovements(args[0]);
                        result = `Suggestions for ${args[0]}:\n${suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`;
                    }
                    break;
                case '/explain':
                case 'explain':
                case 'ex':
                    if (!args[0]) {
                        result = 'Usage: /explain <VARIABLE_NAME>';
                    } else {
                        result = await aiAgent.explainVariable(args[0]);
                    }
                    break;
                case '/template':
                case 'template':
                case 'tpl':
                    result = await aiAgent.generateEnvTemplate(args.join(' ') || 'Node.js web application');
                    break;
                default:
                    result = `Unknown command: ${commandName}\nType /help for available commands.`;
            }

            setOutput(result);
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
            setInput('');
        }
    }, [projectPath, exit]);

    // Handle config wizard
    const handleConfigInput = useCallback(() => {
        const { step, provider } = configState;

        if (step === 'provider') {
            const selectedProvider = PROVIDERS[selectedIndex]?.value || 'openai';
            setConfigState(prev => ({ ...prev, provider: selectedProvider, step: 'apikey' }));
            setSelectedIndex(0);
            setInput('');
        } else if (step === 'apikey') {
            if (provider === 'ollama') {
                setConfigState(prev => ({ ...prev, apiKey: '', step: 'model' }));
            } else {
                setConfigState(prev => ({ ...prev, apiKey: input, step: 'model' }));
            }
            setInput('');
            setSelectedIndex(0);
        } else if (step === 'model') {
            const models = DEFAULT_MODELS[provider] || [];
            const selectedModel = models[selectedIndex] || models[0] || '';

            // Configure the provider
            aiAgent.configure({
                provider: provider as 'openai' | 'anthropic' | 'gemini' | 'ollama',
                apiKey: configState.apiKey || undefined,
                model: selectedModel
            });

            const info = aiAgent.getProviderInfo();
            setOutput(`✓ Configured ${info.name} with model ${info.model}`);
            setMode('normal');
            setConfigState({ step: 'provider', provider: '', apiKey: '', model: '' });
            setSelectedIndex(0);
        }
    }, [configState, input, selectedIndex]);

    // Handle chat message
    const handleChatMessage = useCallback(async () => {
        if (!input.trim()) return;

        // Check for exit
        if (input.toLowerCase() === '/exit' || input.toLowerCase() === 'exit') {
            setMode('normal');
            setInput('');
            return;
        }

        const userMessage = input.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiAgent.chat(userMessage);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
        } finally {
            setLoading(false);
        }
    }, [input]);

    // Handle keyboard input
    useInput((char, key) => {
        // Cancel/Exit with Ctrl+C
        if (key.ctrl && char === 'c') {
            if (mode !== 'normal') {
                setMode('normal');
                setConfigState({ step: 'provider', provider: '', apiKey: '', model: '' });
                setChatMessages([]);
                setInput('');
            } else if (output) {
                setOutput('');
            } else {
                exit();
            }
            return;
        }

        // Handle Enter
        if (key.return) {
            if (mode === 'config') {
                handleConfigInput();
            } else if (mode === 'chat') {
                handleChatMessage();
            } else if (showDropdown && filteredCommands[selectedIndex]) {
                const cmd = filteredCommands[selectedIndex];
                if (cmd.hasWizard) {
                    setInput('');
                    setShowDropdown(false);
                    executeCommand(cmd.name);
                } else {
                    executeCommand(cmd.name);
                }
            } else if (input.trim()) {
                executeCommand(input);
            }
            return;
        }

        // Arrow navigation
        if (key.downArrow) {
            if (mode === 'config') {
                const max = configState.step === 'provider'
                    ? PROVIDERS.length - 1
                    : configState.step === 'model'
                        ? (DEFAULT_MODELS[configState.provider]?.length || 1) - 1
                        : 0;
                setSelectedIndex(prev => Math.min(prev + 1, max));
            } else if (showDropdown) {
                setSelectedIndex(prev => Math.min(prev + 1, Math.min(filteredCommands.length, 10) - 1));
            }
            return;
        }
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            return;
        }

        // Tab for autocomplete
        if (key.tab && showDropdown && filteredCommands[selectedIndex]) {
            setInput(filteredCommands[selectedIndex].name + ' ');
            setShowDropdown(false);
            return;
        }

        // Text input (skip for config provider/model selection steps)
        if (mode === 'config' && (configState.step === 'provider' || configState.step === 'model')) {
            return;
        }

        if (key.backspace || key.delete) {
            setInput(prev => prev.slice(0, -1));
        } else if (char && !key.ctrl && !key.meta) {
            setInput(prev => prev + char);
        }
    });

    // Dropdown items (limit to first 10)
    const dropdownItems = filteredCommands.slice(0, 10).map(cmd => ({
        label: cmd.name,
        value: cmd.name,
        description: cmd.description,
    }));

    return (
        <Box flexDirection="column" padding={1}>
            {/* Banner */}
            <Box justifyContent="center">
                <Text color="red">{BANNER}</Text>
            </Box>
            <Box justifyContent="center" marginBottom={1}>
                <Text color="red">Envark </Text>
                <Text color="white">(v0.1.0)</Text>
            </Box>
            <Box justifyContent="center" marginBottom={1}>
                <Text color="white">Environment Variable Guardian</Text>
            </Box>

            {/* MODE: Normal */}
            {mode === 'normal' && (
                <>
                    <InputBox value={input} placeholder="Type / for commands..." />
                    <Dropdown items={dropdownItems} selectedIndex={selectedIndex} visible={showDropdown} />
                    {loading && <Box marginTop={1}><Text color="red">⠋ Loading...</Text></Box>}
                    {output && <Box flexDirection="column" marginTop={1}><Text>{output}</Text></Box>}
                </>
            )}

            {/* MODE: Config Wizard */}
            {mode === 'config' && (
                <>
                    {configState.step === 'provider' && (
                        <ProviderSelect selectedIndex={selectedIndex} />
                    )}
                    {configState.step === 'apikey' && (
                        <APIKeyInput provider={configState.provider} value={input} />
                    )}
                    {configState.step === 'model' && (
                        <ModelSelect provider={configState.provider} selectedIndex={selectedIndex} />
                    )}
                </>
            )}

            {/* MODE: Chat */}
            {mode === 'chat' && (
                <ChatInterface messages={chatMessages} input={input} loading={loading} />
            )}

            {/* Footer */}
            <Footer mode={mode} />
        </Box>
    );
};

// Start the TUI
export async function startInkTUI(): Promise<void> {
    const { waitUntilExit } = render(<App />);
    await waitUntilExit();
}

export default App;
