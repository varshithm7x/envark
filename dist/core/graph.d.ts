/**
 * Environment variable dependency graph builder
 */
import { type ResolvedEnvMap } from './resolver.js';
export interface GraphNode {
    name: string;
    usageCount: number;
    fileCount: number;
    cluster?: string;
    isLoadBearing: boolean;
    connections: number;
}
export interface GraphEdge {
    from: string;
    to: string;
    weight: number;
    sharedFiles: string[];
}
export interface EnvGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    adjacencyList: Map<string, string[]>;
    clusters: Map<string, string[]>;
    loadBearingVars: GraphNode[];
    isolatedVars: string[];
}
export interface ClusterInfo {
    name: string;
    variables: string[];
    totalUsages: number;
    files: string[];
}
/**
 * Build the dependency graph for environment variables
 */
export declare function buildEnvGraph(resolved: ResolvedEnvMap): EnvGraph;
/**
 * Get cluster information with statistics
 */
export declare function getClusterInfo(graph: EnvGraph): ClusterInfo[];
/**
 * Find strongly connected components (groups of vars that always appear together)
 */
export declare function findStrongConnections(graph: EnvGraph): Map<string, string[]>;
/**
 * Format graph as DOT notation for visualization
 */
export declare function graphToDot(graph: EnvGraph): string;
/**
 * Convert graph to JSON-friendly format
 */
export declare function graphToJson(graph: EnvGraph): object;
//# sourceMappingURL=graph.d.ts.map