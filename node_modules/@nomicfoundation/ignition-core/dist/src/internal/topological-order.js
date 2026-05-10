export function getNodesInTopologicalOrder(graph) {
    const visited = new Set();
    const sorted = [];
    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            visit(graph, node, visited, sorted);
        }
    }
    return sorted.reverse();
}
function visit(graph, node, visited, sorted) {
    visited.add(node);
    for (const to of graph.get(node)) {
        if (!visited.has(to)) {
            visit(graph, to, visited, sorted);
        }
    }
    sorted.push(node);
}
//# sourceMappingURL=topological-order.js.map