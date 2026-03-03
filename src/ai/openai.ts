/**
 * OpenAI Provider Implementation
 */

import OpenAI from 'openai';
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';

export class OpenAIProvider extends AIProvider {
    private client: OpenAI | null = null;
    private model: string;

    constructor(config: AIProviderConfig) {
        super(config);
        this.model = config.model || 'gpt-4o';

        if (config.apiKey) {
            this.client = new OpenAI({
                apiKey: config.apiKey,
                baseURL: config.baseUrl
            });
        }
    }

    isConfigured(): boolean {
        return this.client !== null;
    }

    getName(): string {
        return 'OpenAI';
    }

    getModel(): string {
        return this.model;
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
        if (!this.client) {
            throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable or use /config command.');
        }

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096
        });

        return response.choices[0]?.message?.content || '';
    }

    async *stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        if (!this.client) {
            throw new Error('OpenAI API key not configured');
        }

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            const done = chunk.choices[0]?.finish_reason !== null;
            yield { content, done };
        }
    }
}

export function createOpenAIProvider(apiKey?: string, model?: string): OpenAIProvider {
    const key = apiKey || process.env['OPENAI_API_KEY'];
    return new OpenAIProvider({
        provider: 'openai',
        apiKey: key,
        model: model || 'gpt-4o'
    });
}
