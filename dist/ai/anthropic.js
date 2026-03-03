/**
 * Anthropic Claude Provider Implementation
 */
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './provider.js';
export class AnthropicProvider extends AIProvider {
    client = null;
    model;
    constructor(config) {
        super(config);
        this.model = config.model || 'claude-sonnet-4-20250514';
        if (config.apiKey) {
            this.client = new Anthropic({
                apiKey: config.apiKey
            });
        }
    }
    isConfigured() {
        return this.client !== null;
    }
    getName() {
        return 'Anthropic';
    }
    getModel() {
        return this.model;
    }
    async chat(messages, options) {
        if (!this.client) {
            throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable or use /config command.');
        }
        // Extract system message if present
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4096,
            system: systemMessage?.content,
            messages: chatMessages.map(m => ({
                role: m.role,
                content: m.content
            }))
        });
        const textBlock = response.content.find(block => block.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
    }
    async *stream(messages, options) {
        if (!this.client) {
            throw new Error('Anthropic API key not configured');
        }
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        const stream = this.client.messages.stream({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4096,
            system: systemMessage?.content,
            messages: chatMessages.map(m => ({
                role: m.role,
                content: m.content
            }))
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta') {
                const delta = event.delta;
                if ('text' in delta) {
                    yield { content: delta.text, done: false };
                }
            }
            else if (event.type === 'message_stop') {
                yield { content: '', done: true };
            }
        }
    }
}
export function createAnthropicProvider(apiKey, model) {
    const key = apiKey || process.env['ANTHROPIC_API_KEY'];
    return new AnthropicProvider({
        provider: 'anthropic',
        apiKey: key,
        model: model || 'claude-sonnet-4-20250514'
    });
}
//# sourceMappingURL=anthropic.js.map