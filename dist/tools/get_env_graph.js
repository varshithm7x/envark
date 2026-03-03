/**
 * get_env_graph tool - Returns the dependency graph of environment variables
 */
import { scanProject, normalizeProjectPath } from '../core/scanner.js';
import { resolveEnvMap } from '../core/resolver.js';
import { buildEnvGraph, getClusterInfo } from '../core/graph.js';
/**
 * Execute the get_env_graph tool
 */
export async function getEnvGraph(input) {
    const projectPath = normalizeProjectPath(input.projectPath);
    // Scan project
    const scanResult = scanProject(projectPath);
    // Resolve
    const resolved = resolveEnvMap(scanResult.usages);
    // Build graph
    const graph = buildEnvGraph(resolved);
    const clusters = getClusterInfo(graph);
    // Calculate average connections
    const totalConnections = graph.nodes.reduce((sum, n) => sum + n.connections, 0);
    const avgConnections = graph.nodes.length > 0 ? totalConnections / graph.nodes.length : 0;
    // Convert adjacency list to plain object
    const adjacencyList = {};
    for (const [key, value] of graph.adjacencyList) {
        adjacencyList[key] = value;
    }
    return {
        graph: {
            nodes: graph.nodes.slice(0, 50).map(n => ({
                name: n.name,
                usageCount: n.usageCount,
                fileCount: n.fileCount,
                cluster: n.cluster,
                isLoadBearing: n.isLoadBearing,
                connections: n.connections,
            })),
            edges: graph.edges.slice(0, 100).map(e => ({
                from: e.from,
                to: e.to,
                weight: e.weight,
                sharedFiles: e.sharedFiles.slice(0, 3),
            })),
            adjacencyList,
        },
        clusters,
        loadBearingVars: graph.loadBearingVars.map(n => n.name),
        isolatedVars: graph.isolatedVars,
        stats: {
            totalNodes: graph.nodes.length,
            totalEdges: graph.edges.length,
            totalClusters: graph.clusters.size,
            avgConnections: Math.round(avgConnections * 100) / 100,
        },
        metadata: {
            projectPath,
            scannedFiles: scanResult.scannedFiles,
            cacheHit: scanResult.cacheHit,
            duration: scanResult.duration,
        },
    };
}
/**
 * Tool definition for MCP registration
 */
export const getEnvGraphTool = {
    name: 'get_env_graph',
    description: 'Returns the dependency graph of environment variables - shows which ones cluster together, which are load-bearing (used in most files), and which are isolated',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the project directory. Defaults to current working directory.',
            },
        },
        required: [],
    },
};
//# sourceMappingURL=get_env_graph.js.map