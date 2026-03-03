/**
 * Ollama Local Provider Implementation
 */
import { Ollama } from 'ollama';
import { AIProvider } from './provider.js';
export class OllamaProvider extends AIProvider {
    client;
    model;
    baseUrl;
    configured = false;
    constructor(config) {
        super(config);
        this.model = config.model || 'llama3.2';
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.client = new Ollama({
            host: this.baseUrl
        });
        // Mark as configured - Ollama doesn't require API key
        this.configured = true;
    }
    isConfigured() {
        return this.configured;
    }
    getName() {
        return 'Ollama';
    }
    getModel() {
        return this.model;
    }
    async checkConnection() {
        try {
            await this.client.list();
            return true;
        }
        catch {
            return false;
        }
    }
    async listModels() {
        try {
            const response = await this.client.list();
            return response.models.map(m => m.name);
        }
        catch {
            return [];
        }
    }
    async chat(messages, options) {
        try {
            const response = await this.client.chat({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096
                }
            });
            return response.message.content;
        }
        catch (error) {
            const err = error;
            if (err.message?.includes('ECONNREFUSED')) {
                throw new Error('Ollama is not running. Start it with: ollama serve');
            }
            if (err.message?.includes('model')) {
                throw new Error(`Model "${this.model}" not found. Pull it with: ollama pull ${this.model}`);
            }
            throw error;
        }
    }
    async *stream(messages, options) {
        try {
            const response = await this.client.chat({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                stream: true,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096
                }
            });
            for await (const chunk of response) {
                yield {
                    content: chunk.message.content,
                    done: chunk.done
                };
            }
        }
        catch (error) {
            const err = error;
            if (err.message?.includes('ECONNREFUSED')) {
                throw new Error('Ollama is not running. Start it with: ollama serve');
            }
            throw error;
        }
    }
    async pullModel(modelName) {
        await this.client.pull({ model: modelName });
    }
}
export function createOllamaProvider(model, baseUrl) {
    return new OllamaProvider({
        provider: 'ollama',
        model: model || process.env['OLLAMA_MODEL'] || 'llama3.2',
        baseUrl: baseUrl || process.env['OLLAMA_HOST'] || 'http://localhost:11434'
    });
}
//# sourceMappingURL=ollama.js.map