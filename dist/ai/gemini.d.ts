/**
 * Google Gemini Provider Implementation
 */
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';
export declare class GeminiProvider extends AIProvider {
    private client;
    private model;
    private modelName;
    constructor(config: AIProviderConfig);
    isConfigured(): boolean;
    getName(): string;
    getModel(): string;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
}
export declare function createGeminiProvider(apiKey?: string, model?: string): GeminiProvider;
//# sourceMappingURL=gemini.d.ts.map