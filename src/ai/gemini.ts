/**
 * Google Gemini Provider Implementation
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIProvider, AIMessage, AIStreamChunk, AICompletionOptions, AIProviderConfig } from './provider.js';

export class GeminiProvider extends AIProvider {
    private client: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private modelName: string;

    constructor(config: AIProviderConfig) {
        super(config);
        this.modelName = config.model || 'gemini-2.0-flash';

        if (config.apiKey) {
            this.client = new GoogleGenerativeAI(config.apiKey);
            this.model = this.client.getGenerativeModel({ model: this.modelName });
        }
    }

    isConfigured(): boolean {
        return this.client !== null && this.model !== null;
    }

    getName(): string {
        return 'Google Gemini';
    }

    getModel(): string {
        return this.modelName;
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
        if (!this.model) {
            throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable or use /config command.');
        }

        // Build chat history and extract system instruction
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        // Prepend system message to first user message (Gemini doesn't handle systemInstruction well)
        const history = chatMessages.slice(0, -1).map((m, idx) => {
            let content = m.content;
            // Prepend system instruction to first user message
            if (idx === 0 && m.role === 'user' && systemMessage) {
                content = `[System: ${systemMessage.content}]\n\n${content}`;
            }
            return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: content }]
            };
        });

        // If no history but we have system message, we'll add it to the current message
        const lastMessage = chatMessages[chatMessages.length - 1];
        let messageToSend = lastMessage?.content || '';

        // If this is the first message and we have a system message, prepend it
        if (history.length === 0 && systemMessage) {
            messageToSend = `[System: ${systemMessage.content}]\n\nUser: ${messageToSend}`;
        }

        // Start chat
        const chat = this.model.startChat({
            history,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4096,
            }
        });

        const result = await chat.sendMessage(messageToSend);
        return result.response.text();
    }

    async *stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        if (!this.model) {
            throw new Error('Gemini API key not configured');
        }

        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        // Prepend system message to first user message
        const history = chatMessages.slice(0, -1).map((m, idx) => {
            let content = m.content;
            if (idx === 0 && m.role === 'user' && systemMessage) {
                content = `[System: ${systemMessage.content}]\n\n${content}`;
            }
            return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: content }]
            };
        });

        const lastMessage = chatMessages[chatMessages.length - 1];
        let messageToSend = lastMessage?.content || '';

        if (history.length === 0 && systemMessage) {
            messageToSend = `[System: ${systemMessage.content}]\n\nUser: ${messageToSend}`;
        }

        const chat = this.model.startChat({
            history,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4096,
            }
        });

        const result = await chat.sendMessageStream(messageToSend);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            yield { content: text, done: false };
        }
        yield { content: '', done: true };
    }
}

export function createGeminiProvider(apiKey?: string, model?: string): GeminiProvider {
    const key = apiKey || process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY'];
    return new GeminiProvider({
        provider: 'gemini',
        apiKey: key,
        model: model || 'gemini-2.0-flash'
    });
}
