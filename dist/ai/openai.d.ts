/**
 * OpenAI Provider Implementation
 */
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';
export declare class OpenAIProvider extends AIProvider {
    private client;
    private model;
    constructor(config: AIProviderConfig);
    isConfigured(): boolean;
    getName(): string;
    getModel(): string;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
}
export declare function createOpenAIProvider(apiKey?: string, model?: string): OpenAIProvider;
//# sourceMappingURL=openai.d.ts.map