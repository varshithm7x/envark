/**
 * get_duplicates tool - Find conflicting definitions and similar variable names
 */
export interface GetDuplicatesInput {
    projectPath?: string;
}
export interface ConflictingValue {
    file: string;
    value: string;
}
export interface DuplicateGroup {
    variableName: string;
    type: 'value_conflict' | 'similar_name';
    values?: ConflictingValue[];
    similarNames?: string[];
    recommendation: string;
}
export interface GetDuplicatesOutput {
    duplicates: DuplicateGroup[];
    valueConflicts: number;
    similarNameGroups: number;
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the get_duplicates tool
 */
export declare function getDuplicates(input: GetDuplicatesInput): Promise<GetDuplicatesOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getDuplicatesTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=get_duplicates.d.ts.map