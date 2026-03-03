/**
 * Aegis AI Provider Abstraction
 * Base interface and types for AI provider implementations
 */
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface AIStreamChunk {
    content: string;
    done: boolean;
}
export interface AICompletionOptions {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}
export interface AIProviderConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'gemini';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}
export interface EnvAnalysisContext {
    variables: Array<{
        name: string;
        value?: string;
        file: string;
        line: number;
        isSecret?: boolean;
        riskLevel?: string;
    }>;
    projectPath: string;
    language?: string;
    framework?: string;
}
export interface AIAnalysisResult {
    summary: string;
    recommendations: string[];
    securityIssues: Array<{
        severity: 'critical' | 'high' | 'medium' | 'low';
        variable: string;
        issue: string;
        fix: string;
    }>;
    codeSnippets?: Array<{
        description: string;
        code: string;
        language: string;
    }>;
}
export declare abstract class AIProvider {
    protected config: AIProviderConfig;
    protected systemPrompt: string;
    constructor(config: AIProviderConfig);
    protected getSystemPrompt(): string;
    abstract chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    abstract stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
    abstract isConfigured(): boolean;
    abstract getName(): string;
    abstract getModel(): string;
    analyzeEnvironment(context: EnvAnalysisContext): Promise<AIAnalysisResult>;
    suggestImprovements(variableName: string, context?: string): Promise<string[]>;
    generateEnvTemplate(requirements: string): Promise<string>;
    generateValidationCode(variables: string[], language: string): Promise<string>;
    protected buildAnalysisPrompt(context: EnvAnalysisContext): string;
    protected parseAnalysisResponse(response: string): AIAnalysisResult;
}
export declare function setAIProvider(provider: AIProvider): void;
export declare function getAIProvider(): AIProvider | null;
export declare function setAIConfig(config: AIProviderConfig): void;
export declare function getAIConfig(): AIProviderConfig | null;
export declare function isAIConfigured(): boolean;
//# sourceMappingURL=provider.d.ts.map