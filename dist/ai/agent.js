/**
 * Aegis AI Agent
 * Orchestrates AI providers for environment variable analysis
 */
import { getAIProvider, setAIProvider, isAIConfigured } from './provider.js';
import { createOpenAIProvider } from './openai.js';
import { createAnthropicProvider } from './anthropic.js';
import { createOllamaProvider } from './ollama.js';
import { createGeminiProvider } from './gemini.js';
import { loadAIConfig, saveAIConfig } from './config.js';
export class AegisAIAgent {
    provider = null;
    conversationHistory = [];
    maxHistoryLength = 20;
    constructor() {
        // First try to load persisted config, then fallback to environment
        this.loadPersistedConfig();
    }
    loadPersistedConfig() {
        const savedConfig = loadAIConfig();
        if (savedConfig) {
            // Use persisted config
            this.configure({
                provider: savedConfig.provider,
                apiKey: savedConfig.apiKey,
                model: savedConfig.model,
                baseUrl: savedConfig.baseUrl
            }, false); // Don't save again
            return;
        }
        // Fallback to environment variables
        this.autoConfigureProvider();
    }
    autoConfigureProvider() {
        // Priority: OpenAI > Anthropic > Gemini > Ollama
        const openaiKey = process.env['OPENAI_API_KEY'];
        const anthropicKey = process.env['ANTHROPIC_API_KEY'];
        const geminiKey = process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY'];
        if (openaiKey) {
            this.provider = createOpenAIProvider(openaiKey);
            setAIProvider(this.provider);
        }
        else if (anthropicKey) {
            this.provider = createAnthropicProvider(anthropicKey);
            setAIProvider(this.provider);
        }
        else if (geminiKey) {
            this.provider = createGeminiProvider(geminiKey);
            setAIProvider(this.provider);
        }
        else {
            // Default to Ollama (local, no key required)
            this.provider = createOllamaProvider();
            setAIProvider(this.provider);
        }
    }
    configure(config, persist = true) {
        switch (config.provider) {
            case 'openai':
                this.provider = createOpenAIProvider(config.apiKey, config.model);
                break;
            case 'anthropic':
                this.provider = createAnthropicProvider(config.apiKey, config.model);
                break;
            case 'gemini':
                this.provider = createGeminiProvider(config.apiKey, config.model);
                break;
            case 'ollama':
                this.provider = createOllamaProvider(config.model, config.baseUrl);
                break;
            case 'auto':
                this.autoConfigureProvider();
                break;
        }
        if (this.provider) {
            setAIProvider(this.provider);
        }
        // Persist config if requested (and not 'auto')
        if (persist && config.provider !== 'auto') {
            saveAIConfig({
                provider: config.provider,
                apiKey: config.apiKey,
                model: config.model,
                baseUrl: config.baseUrl
            });
        }
    }
    isConfigured() {
        return this.provider !== null && this.provider.isConfigured();
    }
    getProviderInfo() {
        return {
            name: this.provider?.getName() || 'None',
            model: this.provider?.getModel() || 'N/A',
            configured: this.isConfigured()
        };
    }
    async chat(message) {
        if (!this.provider) {
            return 'AI not configured. Use /config to set up a provider.';
        }
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        try {
            // Build messages for API
            const systemPrompt = this.getEnhancedSystemPrompt();
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.conversationHistory.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ];
            const response = await this.provider.chat(messages);
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response,
                timestamp: new Date()
            });
            return response;
        }
        catch (error) {
            const err = error;
            return `AI Error: ${err.message}`;
        }
    }
    async *chatStream(message) {
        if (!this.provider) {
            yield 'AI not configured. Use /config to set up a provider.';
            return;
        }
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        try {
            const systemPrompt = this.getEnhancedSystemPrompt();
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.conversationHistory.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ];
            let fullResponse = '';
            for await (const chunk of this.provider.stream(messages)) {
                fullResponse += chunk.content;
                yield chunk.content;
            }
            this.conversationHistory.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date()
            });
        }
        catch (error) {
            const err = error;
            yield `AI Error: ${err.message}`;
        }
    }
    async analyzeEnvironment(context) {
        if (!this.provider) {
            return {
                summary: 'AI not configured',
                recommendations: ['Configure an AI provider using /config command'],
                securityIssues: []
            };
        }
        return this.provider.analyzeEnvironment(context);
    }
    async suggestVariableImprovements(variableName, currentValue) {
        if (!this.provider) {
            return ['Configure an AI provider to get suggestions'];
        }
        const context = currentValue ? `Current value pattern: ${this.maskSensitiveValue(currentValue)}` : undefined;
        return this.provider.suggestImprovements(variableName, context);
    }
    async generateEnvTemplate(projectType, requirements) {
        if (!this.provider) {
            return '# AI not configured\n# Use /config to set up a provider';
        }
        const fullRequirements = `
Project type: ${projectType}
${requirements || ''}

Generate a comprehensive .env template with:
- All common variables for this project type
- Security best practices
- Development vs production considerations
`;
        return this.provider.generateEnvTemplate(fullRequirements);
    }
    async generateValidationCode(variables, language = 'typescript') {
        if (!this.provider) {
            return '// AI not configured';
        }
        return this.provider.generateValidationCode(variables, language);
    }
    async explainVariable(variableName) {
        const prompt = `Explain the environment variable "${variableName}":

1. What is its typical purpose?
2. What values does it usually accept?
3. Is it typically a secret that needs protection?
4. What are common naming alternatives?
5. Any security considerations?

Be concise but comprehensive.`;
        return this.chat(prompt);
    }
    async assessSecurityRisk(variableName, value) {
        const maskedValue = value ? this.maskSensitiveValue(value) : undefined;
        const prompt = `Assess the security risk of this environment variable:

Name: ${variableName}
${maskedValue ? `Value pattern: ${maskedValue}` : ''}

Return a JSON object with:
{
  "riskLevel": "critical|high|medium|low|info",
  "explanation": "Brief explanation",
  "recommendations": ["rec1", "rec2"]
}`;
        try {
            const response = await this.chat(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch { }
        return {
            riskLevel: 'info',
            explanation: 'Unable to assess',
            recommendations: []
        };
    }
    clearHistory() {
        this.conversationHistory = [];
    }
    getHistory() {
        return [...this.conversationHistory];
    }
    getEnhancedSystemPrompt() {
        return `You are Aegis AI, an expert environment variable security analyst integrated into the Aegis CLI tool.

Your capabilities:
- Analyze environment variables for security risks
- Provide recommendations for better configuration management
- Generate secure .env templates and validation code
- Explain best practices for different frameworks and languages
- Help debug configuration issues

Current context:
- Running in Aegis CLI terminal interface
- User can scan their project with /scan, /risk, /missing commands
- Use markdown formatting for code blocks

Guidelines:
- Be concise but thorough
- Always consider security implications
- Provide actionable recommendations
- Use code examples when helpful
- Consider different deployment environments`;
    }
    maskSensitiveValue(value) {
        if (value.length < 4)
            return '***';
        if (value.length < 8)
            return value.slice(0, 1) + '***' + value.slice(-1);
        return value.slice(0, 2) + '***' + value.slice(-2);
    }
}
// Singleton instance
let agentInstance = null;
export function getAIAgent() {
    if (!agentInstance) {
        agentInstance = new AegisAIAgent();
    }
    return agentInstance;
}
export function resetAIAgent() {
    agentInstance = null;
}
// Re-export provider functions
export { isAIConfigured, getAIProvider, setAIProvider };
//# sourceMappingURL=agent.js.map