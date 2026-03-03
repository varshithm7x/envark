/**
 * get_env_graph tool - Returns the dependency graph of environment variables
 */
import { type ClusterInfo } from '../core/graph.js';
export interface GetEnvGraphInput {
    projectPath?: string;
}
export interface GraphNodeOutput {
    name: string;
    usageCount: number;
    fileCount: number;
    cluster?: string;
    isLoadBearing: boolean;
    connections: number;
}
export interface GraphEdgeOutput {
    from: string;
    to: string;
    weight: number;
    sharedFiles: string[];
}
export interface GetEnvGraphOutput {
    graph: {
        nodes: GraphNodeOutput[];
        edges: GraphEdgeOutput[];
        adjacencyList: Record<string, string[]>;
    };
    clusters: ClusterInfo[];
    loadBearingVars: string[];
    isolatedVars: string[];
    stats: {
        totalNodes: number;
        totalEdges: number;
        totalClusters: number;
        avgConnections: number;
    };
    metadata: {
        projectPath: string;
        scannedFiles: number;
        cacheHit: boolean;
        duration: number;
    };
}
/**
 * Execute the get_env_graph tool
 */
export declare function getEnvGraph(input: GetEnvGraphInput): Promise<GetEnvGraphOutput>;
/**
 * Tool definition for MCP registration
 */
export declare const getEnvGraphTool: {
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
//# sourceMappingURL=get_env_graph.d.ts.map