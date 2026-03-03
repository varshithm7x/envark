/**
 * OpenAI Provider Implementation
 */
import OpenAI from 'openai';
import { AIProvider } from './provider.js';
export class OpenAIProvider extends AIProvider {
    client = null;
    model;
    constructor(config) {
        super(config);
        this.model = config.model || 'gpt-4o';
        if (config.apiKey) {
            this.client = new OpenAI({
                apiKey: config.apiKey,
                baseURL: config.baseUrl
            });
        }
    }
    isConfigured() {
        return this.client !== null;
    }
    getName() {
        return 'OpenAI';
    }
    getModel() {
        return this.model;
    }
    async chat(messages, options) {
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
    async *stream(messages, options) {
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
export function createOpenAIProvider(apiKey, model) {
    const key = apiKey || process.env['OPENAI_API_KEY'];
    return new OpenAIProvider({
        provider: 'openai',
        apiKey: key,
        model: model || 'gpt-4o'
    });
}
//# sourceMappingURL=openai.js.map