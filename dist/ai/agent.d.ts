/**
 * Aegis AI Agent
 * Orchestrates AI providers for environment variable analysis
 */
import { AIAnalysisResult, EnvAnalysisContext, getAIProvider, setAIProvider, isAIConfigured } from './provider.js';
export interface AIAgentConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'gemini' | 'auto';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}
export declare class AegisAIAgent {
    private provider;
    private conversationHistory;
    private maxHistoryLength;
    constructor();
    private loadPersistedConfig;
    private autoConfigureProvider;
    configure(config: AIAgentConfig, persist?: boolean): void;
    isConfigured(): boolean;
    getProviderInfo(): {
        name: string;
        model: string;
        configured: boolean;
    };
    chat(message: string): Promise<string>;
    chatStream(message: string): AsyncGenerator<string>;
    analyzeEnvironment(context: EnvAnalysisContext): Promise<AIAnalysisResult>;
    suggestVariableImprovements(variableName: string, currentValue?: string): Promise<string[]>;
    generateEnvTemplate(projectType: string, requirements?: string): Promise<string>;
    generateValidationCode(variables: string[], language?: string): Promise<string>;
    explainVariable(variableName: string): Promise<string>;
    assessSecurityRisk(variableName: string, value?: string): Promise<{
        riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
        explanation: string;
        recommendations: string[];
    }>;
    clearHistory(): void;
    getHistory(): ConversationMessage[];
    private getEnhancedSystemPrompt;
    private maskSensitiveValue;
}
export declare function getAIAgent(): AegisAIAgent;
export declare function resetAIAgent(): void;
export { isAIConfigured, getAIProvider, setAIProvider };
//# sourceMappingURL=agent.d.ts.map