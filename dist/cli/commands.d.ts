/**
 * Aegis TUI Commands - Command Handlers
 */
export interface Command {
    name: string;
    aliases: string[];
    description: string;
    usage: string;
    handler: (args: string[], projectPath: string) => Promise<void>;
}
/**
 * All available commands
 */
export declare const commands: Command[];
/**
 * Find a command by name or alias
 */
export declare function findCommand(input: string): Command | undefined;
/**
 * Get command suggestions for autocomplete
 */
export declare function getCommandSuggestions(partial: string): string[];
//# sourceMappingURL=commands.d.ts.map