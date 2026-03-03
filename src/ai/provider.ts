/**
 * Aegis AI Provider Abstraction
 * Base interface and types for AI provider implementations
 */

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIStreamChunk {
    content: string;
    done: boolean;
}

export interface AICompletionOptions {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface AIProviderConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'gemini';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
}

export interface EnvAnalysisContext {
    variables: Array<{
        name: string;
        value?: string;
        file: string;
        line: number;
        isSecret?: boolean;
        riskLevel?: string;
    }>;
    projectPath: string;
    language?: string;
    framework?: string;
}

export interface AIAnalysisResult {
    summary: string;
    recommendations: string[];
    securityIssues: Array<{
        severity: 'critical' | 'high' | 'medium' | 'low';
        variable: string;
        issue: string;
        fix: string;
    }>;
    codeSnippets?: Array<{
        description: string;
        code: string;
        language: string;
    }>;
}

export abstract class AIProvider {
    protected config: AIProviderConfig;
    protected systemPrompt: string;

    constructor(config: AIProviderConfig) {
        this.config = config;
        this.systemPrompt = this.getSystemPrompt();
    }

    protected getSystemPrompt(): string {
        return `You are Aegis AI, an expert environment variable security analyst and DevOps assistant.
Your role is to:
1. Analyze environment variables for security risks and best practices
2. Identify potential secrets, API keys, and sensitive data
3. Recommend proper naming conventions and organization
4. Suggest security improvements and mitigation strategies
5. Generate secure configuration code and .env templates
6. Help with environment variable management across different environments

Guidelines:
- Always prioritize security in your recommendations
- Be specific and actionable in your suggestions
- Consider different deployment environments (dev, staging, production)
- Follow 12-factor app methodology for configuration
- Identify patterns that indicate secrets (API keys, tokens, passwords)
- Suggest environment-specific naming conventions
- Recommend secret management solutions when appropriate

When analyzing variables, classify risks as:
- CRITICAL: Hardcoded secrets, exposed credentials
- HIGH: Weak encryption keys, missing required vars
- MEDIUM: Poor naming, inconsistent conventions
- LOW: Documentation issues, minor improvements

Respond in a clear, structured format. Use markdown for code blocks.`;
    }

    abstract chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
    abstract stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<AIStreamChunk>;
    abstract isConfigured(): boolean;
    abstract getName(): string;
    abstract getModel(): string;

    async analyzeEnvironment(context: EnvAnalysisContext): Promise<AIAnalysisResult> {
        const prompt = this.buildAnalysisPrompt(context);
        const response = await this.chat([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ], { temperature: 0.3 });

        return this.parseAnalysisResponse(response);
    }

    async suggestImprovements(variableName: string, context?: string): Promise<string[]> {
        const prompt = `Analyze the environment variable "${variableName}"${context ? ` in the context of: ${context}` : ''}.

Provide 3-5 specific, actionable recommendations for:
1. Naming convention improvements
2. Security considerations
3. Documentation suggestions
4. Environment-specific handling

Return as a JSON array of strings.`;

        const response = await this.chat([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ], { temperature: 0.5 });

        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch { }

        return response.split('\n').filter(line => line.trim().startsWith('-')).map(l => l.replace(/^-\s*/, ''));
    }

    async generateEnvTemplate(requirements: string): Promise<string> {
        const prompt = `Generate a production-ready .env template file for the following requirements:

${requirements}

Include:
1. Organized sections with comments
2. Example values (use placeholders for secrets)
3. Required vs optional markers
4. Type hints in comments
5. Links to documentation where relevant

Format as a valid .env file with comments.`;

        return this.chat([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ], { temperature: 0.4 });
    }

    async generateValidationCode(variables: string[], language: string): Promise<string> {
        const prompt = `Generate ${language} validation code for these environment variables:

${variables.map(v => `- ${v}`).join('\n')}

Requirements:
1. Type validation and coercion
2. Required vs optional handling
3. Default values where appropriate
4. Clear error messages
5. Export as a typed configuration object

Use best practices for ${language}.`;

        return this.chat([
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
        ], { temperature: 0.2 });
    }

    protected buildAnalysisPrompt(context: EnvAnalysisContext): string {
        const varsJson = JSON.stringify(context.variables.slice(0, 50), null, 2);

        return `Analyze these environment variables from a ${context.language || 'unknown'} project${context.framework ? ` using ${context.framework}` : ''}:

Project path: ${context.projectPath}

Variables found:
${varsJson}

Provide a comprehensive security and best-practices analysis. Return your response in this exact JSON format:
{
  "summary": "Brief overview of findings",
  "recommendations": ["recommendation1", "recommendation2"],
  "securityIssues": [
    {
      "severity": "critical|high|medium|low",
      "variable": "VAR_NAME",
      "issue": "Description of the issue",
      "fix": "How to fix it"
    }
  ],
  "codeSnippets": [
    {
      "description": "What this code does",
      "code": "actual code",
      "language": "typescript"
    }
  ]
}`;
    }

    protected parseAnalysisResponse(response: string): AIAnalysisResult {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary || 'Analysis complete',
                    recommendations: parsed.recommendations || [],
                    securityIssues: parsed.securityIssues || [],
                    codeSnippets: parsed.codeSnippets || []
                };
            }
        } catch (e) {
            // Fall back to text parsing
        }

        return {
            summary: response.slice(0, 500),
            recommendations: [],
            securityIssues: [],
            codeSnippets: []
        };
    }
}

// Provider factory
let currentProvider: AIProvider | null = null;
let providerConfig: AIProviderConfig | null = null;

export function setAIProvider(provider: AIProvider): void {
    currentProvider = provider;
}

export function getAIProvider(): AIProvider | null {
    return currentProvider;
}

export function setAIConfig(config: AIProviderConfig): void {
    providerConfig = config;
}

export function getAIConfig(): AIProviderConfig | null {
    return providerConfig;
}

export function isAIConfigured(): boolean {
    return currentProvider !== null && currentProvider.isConfigured();
}
