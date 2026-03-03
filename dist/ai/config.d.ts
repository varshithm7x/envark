/**
 * Aegis AI Configuration Persistence
 * Saves and loads AI provider settings
 */
export interface PersistedAIConfig {
    provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    lastUpdated: string;
}
export declare function ensureConfigDir(): void;
export declare function saveAIConfig(config: Omit<PersistedAIConfig, 'lastUpdated'>): void;
export declare function loadAIConfig(): PersistedAIConfig | null;
export declare function clearAIConfig(): void;
export declare function getConfigPath(): string;
//# sourceMappingURL=config.d.ts.map