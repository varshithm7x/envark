/**
 * Anthropic Claude Provider Implementation
 */
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';
export declare class AnthropicProvider extends AIProvider {
    private client;
    private model;
    constructor(config: AIProviderConfig);
    isConfigured(): boolean;
    getName(): string;
    getModel(): string;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
}
export declare function createAnthropicProvider(apiKey?: string, model?: string): AnthropicProvider;
//# sourceMappingURL=anthropic.d.ts.map