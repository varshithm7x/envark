/**
 * Aegis AI Configuration Persistence
 * Saves and loads AI provider settings
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PersistedAIConfig {
    provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    lastUpdated: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.envark');
const CONFIG_FILE = path.join(CONFIG_DIR, 'ai-config.json');

export function ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function saveAIConfig(config: Omit<PersistedAIConfig, 'lastUpdated'>): void {
    ensureConfigDir();
    const fullConfig: PersistedAIConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(fullConfig, null, 2), 'utf-8');
}

export function loadAIConfig(): PersistedAIConfig | null {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(content) as PersistedAIConfig;
        }
    } catch (error) {
        // Config file corrupted or missing, return null
    }
    return null;
}

export function clearAIConfig(): void {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            fs.unlinkSync(CONFIG_FILE);
        }
    } catch (error) {
        // Ignore errors
    }
}

export function getConfigPath(): string {
    return CONFIG_FILE;
}
