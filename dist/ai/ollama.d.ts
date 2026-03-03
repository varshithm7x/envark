/**
 * Ollama Local Provider Implementation
 */
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';
export declare class OllamaProvider extends AIProvider {
    private client;
    private model;
    private baseUrl;
    private configured;
    constructor(config: AIProviderConfig);
    isConfigured(): boolean;
    getName(): string;
    getModel(): string;
    checkConnection(): Promise<boolean>;
    listModels(): Promise<string[]>;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
    pullModel(modelName: string): Promise<void>;
}
export declare function createOllamaProvider(model?: string, baseUrl?: string): OllamaProvider;
//# sourceMappingURL=ollama.d.ts.map