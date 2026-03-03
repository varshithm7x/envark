import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Envark TUI App - Advanced React/Ink Application
 * Features: Multi-step commands, Interactive chat, Provider wizard
 */
import { useState, useEffect, useCallback } from 'react';
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
// Provider options
const PROVIDERS = [
    { value: 'openai', label: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5' },
    { value: 'anthropic', label: 'Anthropic', description: 'Claude 3.5 Sonnet, Opus' },
    { value: 'gemini', label: 'Google Gemini', description: 'Gemini 1.5 Pro, Flash' },
    { value: 'ollama', label: 'Ollama (Local)', description: 'Llama, Mistral, CodeLlama' },
];
const DEFAULT_MODELS = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    gemini: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
};
const COMMANDS = [
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
function formatScanResult(result) {
    const { summary, variables } = result;
    let output = `\n┌─ SCAN SUMMARY ────────────────────────────────────────────┐\n`;
    output += `│  Total: ${summary.totalEnvVars}  Defined: ${summary.defined}  Missing: ${summary.missing}  Critical: ${summary.critical}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n\n`;
    if (variables.length > 0) {
        output += `Variables:\n`;
        for (const v of variables.slice(0, 10)) {
            output += `  ${v.name.padEnd(25)} [${v.riskLevel.toUpperCase()}] ${v.definedIn.length > 0 ? '✓' : '✗'}\n`;
        }
        if (variables.length > 10)
            output += `  ... and ${variables.length - 10} more\n`;
    }
    return output;
}
function formatRiskResult(result) {
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
function formatMissingResult(result) {
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
function formatValidateResult(result) {
    const { valid, summary } = result;
    let output = `\n┌─ VALIDATION ──────────────────────────────────────────────┐\n`;
    output += `│  Status: ${valid ? '✓ VALID' : '✗ INVALID'}\n`;
    output += `│  Passed: ${summary.passed}  Warnings: ${summary.warnings}  Failed: ${summary.failed}\n`;
    output += `└──────────────────────────────────────────────────────────┘\n`;
    return output;
}
function formatHelp() {
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
const ProviderSelect = ({ selectedIndex }) => {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", marginY: 1, children: [_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "red", bold: true, children: "Select AI Provider (\u2191\u2193 to navigate, Enter to select)" }) }), PROVIDERS.map((p, idx) => (_jsxs(Box, { paddingX: 1, children: [_jsxs(Text, { color: idx === selectedIndex ? 'white' : 'red', backgroundColor: idx === selectedIndex ? 'red' : undefined, children: [idx === selectedIndex ? '▸ ' : '  ', p.label.padEnd(20)] }), _jsxs(Text, { color: "white", children: [" ", p.description] })] }, p.value)))] }));
};
// Model Selection Dropdown
const ModelSelect = ({ provider, selectedIndex }) => {
    const models = DEFAULT_MODELS[provider] || [];
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", marginY: 1, children: [_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "red", bold: true, children: "Select Model (\u2191\u2193 to navigate, Enter to select)" }) }), models.map((m, idx) => (_jsx(Box, { paddingX: 1, children: _jsxs(Text, { color: idx === selectedIndex ? 'white' : 'red', backgroundColor: idx === selectedIndex ? 'red' : undefined, children: [idx === selectedIndex ? '▸ ' : '  ', m] }) }, m)))] }));
};
// API Key Input
const APIKeyInput = ({ provider, value }) => {
    const isOllama = provider === 'ollama';
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", marginY: 1, children: [_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "red", bold: true, children: isOllama ? 'Ollama runs locally - Press Enter to continue' : `Enter ${provider.toUpperCase()} API Key:` }) }), !isOllama && (_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { color: "red", children: value ? '●'.repeat(Math.min(value.length, 40)) : 'Type your API key...' }), _jsx(Text, { color: "red", children: "\u258C" })] }))] }));
};
// Chat Interface
const ChatInterface = ({ messages, input, loading }) => {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", marginY: 1, padding: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "red", bold: true, children: "\uD83D\uDCAC AI Chat" }), _jsx(Text, { color: "white", children: " (type message, Enter to send, /exit to leave)" })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [messages.slice(-8).map((msg, idx) => (_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Box, { children: _jsx(Text, { color: msg.role === 'user' ? 'red' : 'white', bold: true, children: msg.role === 'user' ? '  You: ' : '   AI: ' }) }), _jsx(Box, { marginLeft: 7, children: _jsxs(Text, { color: "white", wrap: "wrap", children: [msg.content.slice(0, 500), msg.content.length > 500 ? '...' : ''] }) })] }, idx))), loading && (_jsxs(Box, { children: [_jsx(Text, { color: "white", bold: true, children: "   AI: " }), _jsx(Text, { color: "white", children: "\u280B Thinking..." })] }))] }), _jsxs(Box, { borderStyle: "round", borderColor: "red", paddingX: 1, children: [_jsx(Text, { color: "red", children: "\u25B8 " }), _jsx(Text, { children: input || 'Type your message...' }), _jsx(Text, { color: "red", children: "\u258C" })] })] }));
};
// Command Dropdown
const Dropdown = ({ items, selectedIndex, visible }) => {
    if (!visible || items.length === 0)
        return null;
    return (_jsx(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", marginTop: -1, children: items.map((item, index) => (_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { color: index === selectedIndex ? 'white' : 'red', backgroundColor: index === selectedIndex ? 'red' : undefined, children: item.label.padEnd(15) }), _jsxs(Text, { color: "white", children: [" \u2013 ", item.description] })] }, item.value))) }));
};
// Standard Input Box
const InputBox = ({ value, placeholder, label }) => {
    return (_jsxs(Box, { borderStyle: "single", borderColor: "red", paddingX: 1, children: [_jsx(Text, { color: "red", children: label || 'Command' }), _jsx(Text, { children: " " }), _jsx(Text, { children: value || placeholder || '' }), _jsx(Text, { color: "red", children: "\u258C" })] }));
};
// Footer
const Footer = ({ mode }) => {
    const info = aiAgent.getProviderInfo();
    const aiStatus = info.configured ? `${info.name}/${info.model}` : 'Not configured';
    const modeLabel = mode === 'chat' ? ' | CHAT MODE' : mode === 'config' ? ' | CONFIG WIZARD' : '';
    return (_jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsxs(Text, { color: "white", children: ["~ | Envark v0.1.0 | AI: ", aiStatus, modeLabel] }), _jsxs(Text, { children: [_jsx(Text, { color: "red", children: "[Ctrl+C]" }), _jsxs(Text, { color: "white", children: [" ", mode === 'normal' ? 'Clear/Exit' : 'Cancel'] })] })] }));
};
// ============ MAIN APP ============
const App = () => {
    const { exit } = useApp();
    const projectPath = process.cwd();
    // Core state
    const [mode, setMode] = useState('normal');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    // Command dropdown state
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredCommands, setFilteredCommands] = useState([]);
    // Config wizard state
    const [configState, setConfigState] = useState({
        step: 'provider',
        provider: '',
        apiKey: '',
        model: ''
    });
    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    // Filter commands based on input (hide AI commands if not configured)
    useEffect(() => {
        if (mode === 'normal' && input.startsWith('/')) {
            const search = input.toLowerCase();
            const aiConfigured = aiAgent.getProviderInfo().configured;
            const filtered = COMMANDS.filter(cmd => {
                // Hide AI-requiring commands if AI is not configured
                if (cmd.requiresAI && !aiConfigured)
                    return false;
                return cmd.name.toLowerCase().startsWith(search) ||
                    cmd.shortcut.startsWith(search.slice(1));
            });
            setFilteredCommands(filtered);
            // Show dropdown if we have matches (limit display to first 10)
            setShowDropdown(filtered.length > 0);
            setSelectedIndex(0);
        }
        else {
            setShowDropdown(false);
            setFilteredCommands([]);
        }
    }, [input, mode]);
    // Execute command
    const executeCommand = useCallback(async (cmd) => {
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
                    result = genResult.content || JSON.stringify(genResult, null, 2);
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
                        variables: scanResult.variables.map((v) => ({
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
                    }
                    else {
                        const suggestions = await aiAgent.suggestVariableImprovements(args[0]);
                        result = `Suggestions for ${args[0]}:\n${suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`;
                    }
                    break;
                case '/explain':
                case 'explain':
                case 'ex':
                    if (!args[0]) {
                        result = 'Usage: /explain <VARIABLE_NAME>';
                    }
                    else {
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
        }
        catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
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
        }
        else if (step === 'apikey') {
            if (provider === 'ollama') {
                setConfigState(prev => ({ ...prev, apiKey: '', step: 'model' }));
            }
            else {
                setConfigState(prev => ({ ...prev, apiKey: input, step: 'model' }));
            }
            setInput('');
            setSelectedIndex(0);
        }
        else if (step === 'model') {
            const models = DEFAULT_MODELS[provider] || [];
            const selectedModel = models[selectedIndex] || models[0] || '';
            // Configure the provider
            aiAgent.configure({
                provider: provider,
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
        if (!input.trim())
            return;
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
        }
        catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
        }
        finally {
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
            }
            else if (output) {
                setOutput('');
            }
            else {
                exit();
            }
            return;
        }
        // Handle Enter
        if (key.return) {
            if (mode === 'config') {
                handleConfigInput();
            }
            else if (mode === 'chat') {
                handleChatMessage();
            }
            else if (showDropdown && filteredCommands[selectedIndex]) {
                const cmd = filteredCommands[selectedIndex];
                if (cmd.hasWizard) {
                    setInput('');
                    setShowDropdown(false);
                    executeCommand(cmd.name);
                }
                else {
                    executeCommand(cmd.name);
                }
            }
            else if (input.trim()) {
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
            }
            else if (showDropdown) {
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
        }
        else if (char && !key.ctrl && !key.meta) {
            setInput(prev => prev + char);
        }
    });
    // Dropdown items (limit to first 10)
    const dropdownItems = filteredCommands.slice(0, 10).map(cmd => ({
        label: cmd.name,
        value: cmd.name,
        description: cmd.description,
    }));
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: "red", children: BANNER }) }), _jsxs(Box, { justifyContent: "center", marginBottom: 1, children: [_jsx(Text, { color: "red", children: "Envark " }), _jsx(Text, { color: "white", children: "(v0.1.0)" })] }), _jsx(Box, { justifyContent: "center", marginBottom: 1, children: _jsx(Text, { color: "white", children: "Environment Variable Guardian" }) }), mode === 'normal' && (_jsxs(_Fragment, { children: [_jsx(InputBox, { value: input, placeholder: "Type / for commands..." }), _jsx(Dropdown, { items: dropdownItems, selectedIndex: selectedIndex, visible: showDropdown }), loading && _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "red", children: "\u280B Loading..." }) }), output && _jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsx(Text, { children: output }) })] })), mode === 'config' && (_jsxs(_Fragment, { children: [configState.step === 'provider' && (_jsx(ProviderSelect, { selectedIndex: selectedIndex })), configState.step === 'apikey' && (_jsx(APIKeyInput, { provider: configState.provider, value: input })), configState.step === 'model' && (_jsx(ModelSelect, { provider: configState.provider, selectedIndex: selectedIndex }))] })), mode === 'chat' && (_jsx(ChatInterface, { messages: chatMessages, input: input, loading: loading })), _jsx(Footer, { mode: mode })] }));
};
// Start the TUI
export async function startInkTUI() {
    const { waitUntilExit } = render(_jsx(App, {}));
    await waitUntilExit();
}
export default App;
//# sourceMappingURL=app.js.map