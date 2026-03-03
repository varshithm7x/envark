/**
 * Environment variable dependency graph builder
 */

import { type ResolvedEnvMap, type EnvVariable, groupByCluster } from './resolver.js';

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
    weight: number; // Number of files where they appear together
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
export function buildEnvGraph(resolved: ResolvedEnvMap): EnvGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const adjacencyList = new Map<string, string[]>();

    // Track which variables appear in which files
    const varsByFile = new Map<string, Set<string>>();

    for (const [name, variable] of resolved.variables) {
        for (const file of variable.files) {
            const vars = varsByFile.get(file) || new Set();
            vars.add(name);
            varsByFile.set(file, vars);
        }
    }

    // Build edges: connect variables that appear in the same files
    const edgeMap = new Map<string, { weight: number; files: string[] }>();

    for (const [file, vars] of varsByFile) {
        const varList = Array.from(vars);

        // Create edges between all pairs of variables in the same file
        for (let i = 0; i < varList.length; i++) {
            for (let j = i + 1; j < varList.length; j++) {
                const from = varList[i]!;
                const to = varList[j]!;
                const key = [from, to].sort().join('::');

                const existing = edgeMap.get(key);
                if (existing) {
                    existing.weight++;
                    existing.files.push(file);
                } else {
                    edgeMap.set(key, { weight: 1, files: [file] });
                }
            }
        }
    }

    // Convert edge map to edges array
    for (const [key, data] of edgeMap) {
        const [from, to] = key.split('::') as [string, string];
        edges.push({
            from,
            to,
            weight: data.weight,
            sharedFiles: data.files,
        });
    }

    // Build adjacency list
    for (const edge of edges) {
        // Add bidirectional connections
        const fromList = adjacencyList.get(edge.from) || [];
        if (!fromList.includes(edge.to)) {
            fromList.push(edge.to);
        }
        adjacencyList.set(edge.from, fromList);

        const toList = adjacencyList.get(edge.to) || [];
        if (!toList.includes(edge.from)) {
            toList.push(edge.from);
        }
        adjacencyList.set(edge.to, toList);
    }

    // Get clusters
    const clusterMap = groupByCluster(resolved);
    const clusters = new Map<string, string[]>();
    for (const [clusterName, vars] of clusterMap) {
        clusters.set(clusterName, vars.map(v => v.name));
    }

    // Build nodes and determine which cluster each belongs to
    for (const [name, variable] of resolved.variables) {
        // Find cluster for this variable
        let varCluster: string | undefined;
        for (const [clusterName, varNames] of clusters) {
            if (varNames.includes(name)) {
                varCluster = clusterName;
                break;
            }
        }

        const connections = adjacencyList.get(name)?.length || 0;

        nodes.push({
            name,
            usageCount: variable.usageCount,
            fileCount: variable.files.length,
            cluster: varCluster,
            isLoadBearing: false, // Will be set below
            connections,
        });
    }

    // Determine load-bearing variables (top 10% by file count)
    nodes.sort((a, b) => b.fileCount - a.fileCount);
    const loadBearingThreshold = Math.max(2, Math.ceil(nodes.length * 0.1));
    const loadBearingVars = nodes.slice(0, loadBearingThreshold);

    for (const node of loadBearingVars) {
        node.isLoadBearing = true;
    }

    // Find isolated variables (no connections to other env vars)
    const isolatedVars = nodes
        .filter(n => n.connections === 0 && n.fileCount === 1)
        .map(n => n.name);

    // Sort nodes by usage for final output
    nodes.sort((a, b) => {
        // Load bearing first, then by usage count
        if (a.isLoadBearing !== b.isLoadBearing) {
            return a.isLoadBearing ? -1 : 1;
        }
        return b.usageCount - a.usageCount;
    });

    return {
        nodes,
        edges: edges.sort((a, b) => b.weight - a.weight),
        adjacencyList,
        clusters,
        loadBearingVars,
        isolatedVars,
    };
}

/**
 * Get cluster information with statistics
 */
export function getClusterInfo(graph: EnvGraph): ClusterInfo[] {
    const clusterInfo: ClusterInfo[] = [];

    for (const [clusterName, varNames] of graph.clusters) {
        const clusterNodes = graph.nodes.filter(n => varNames.includes(n.name));
        const totalUsages = clusterNodes.reduce((sum, n) => sum + n.usageCount, 0);

        // Get all files used by variables in this cluster
        const fileSet = new Set<string>();
        for (const node of clusterNodes) {
            const neighbors = graph.adjacencyList.get(node.name) || [];
            for (const neighbor of neighbors) {
                const edge = graph.edges.find(
                    e => (e.from === node.name && e.to === neighbor) ||
                        (e.to === node.name && e.from === neighbor)
                );
                if (edge) {
                    edge.sharedFiles.forEach(f => fileSet.add(f));
                }
            }
        }

        clusterInfo.push({
            name: clusterName,
            variables: varNames,
            totalUsages,
            files: Array.from(fileSet),
        });
    }

    // Sort by total usages
    clusterInfo.sort((a, b) => b.totalUsages - a.totalUsages);

    return clusterInfo;
}

/**
 * Find strongly connected components (groups of vars that always appear together)
 */
export function findStrongConnections(graph: EnvGraph): Map<string, string[]> {
    const strongGroups = new Map<string, string[]>();
    const visited = new Set<string>();

    for (const node of graph.nodes) {
        if (visited.has(node.name)) continue;

        // Find all vars that ALWAYS appear with this var
        const neighbors = graph.adjacencyList.get(node.name) || [];
        const strongNeighbors: string[] = [];

        for (const neighbor of neighbors) {
            const edge = graph.edges.find(
                e => (e.from === node.name && e.to === neighbor) ||
                    (e.to === node.name && e.from === neighbor)
            );

            if (edge && edge.weight >= node.fileCount * 0.8) {
                // This neighbor appears in 80%+ of the same files
                strongNeighbors.push(neighbor);
            }
        }

        if (strongNeighbors.length > 0) {
            const group = [node.name, ...strongNeighbors];
            group.forEach(v => visited.add(v));
            strongGroups.set(node.name, group);
        }
    }

    return strongGroups;
}

/**
 * Format graph as DOT notation for visualization
 */
export function graphToDot(graph: EnvGraph): string {
    const lines: string[] = [];
    lines.push('digraph EnvGraph {');
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box];');
    lines.push('');

    // Add cluster subgraphs
    let clusterIndex = 0;
    for (const [clusterName, varNames] of graph.clusters) {
        if (clusterName === 'Other') continue;

        lines.push(`  subgraph cluster_${clusterIndex} {`);
        lines.push(`    label="${clusterName}";`);
        lines.push(`    style=dashed;`);
        for (const varName of varNames) {
            const node = graph.nodes.find(n => n.name === varName);
            const style = node?.isLoadBearing ? 'style=bold,color=red' : '';
            lines.push(`    "${varName}" [${style}];`);
        }
        lines.push('  }');
        lines.push('');
        clusterIndex++;
    }

    // Add edges (only strong ones to avoid clutter)
    for (const edge of graph.edges) {
        if (edge.weight >= 2) {
            lines.push(`  "${edge.from}" -> "${edge.to}" [label="${edge.weight}" dir=none];`);
        }
    }

    lines.push('}');
    return lines.join('\n');
}

/**
 * Convert graph to JSON-friendly format
 */
export function graphToJson(graph: EnvGraph): object {
    return {
        nodes: graph.nodes.map(n => ({
            name: n.name,
            usageCount: n.usageCount,
            fileCount: n.fileCount,
            cluster: n.cluster,
            isLoadBearing: n.isLoadBearing,
            connections: n.connections,
        })),
        edges: graph.edges.slice(0, 50).map(e => ({
            from: e.from,
            to: e.to,
            weight: e.weight,
            sharedFiles: e.sharedFiles.slice(0, 5),
        })),
        clusters: Object.fromEntries(graph.clusters),
        loadBearingVars: graph.loadBearingVars.map(n => n.name),
        isolatedVars: graph.isolatedVars,
        stats: {
            totalNodes: graph.nodes.length,
            totalEdges: graph.edges.length,
            totalClusters: graph.clusters.size,
            loadBearingCount: graph.loadBearingVars.length,
            isolatedCount: graph.isolatedVars.length,
        },
    };
}
