import type { DeploymentState } from "./execution/types/deployment-state.js";
import type { AdjacencyList } from "./utils/adjacency-list.js";
import type { IgnitionModule } from "../types/module.js";
declare enum VisitStatus {
    UNVISITED = 0,
    VISITED = 1
}
interface VisitStatusMap {
    [key: string]: VisitStatus;
}
export declare class Batcher {
    static batch(module: IgnitionModule, deploymentState: DeploymentState): string[][];
    private static _initializeBatchStateFrom;
    private static _initializeVisitStateFrom;
    static _eliminateAlreadyVisitedFutures({ adjacencyList, visitState, }: {
        adjacencyList: AdjacencyList;
        visitState: VisitStatusMap;
    }): void;
    private static _allVisited;
    private static _markAsVisited;
    private static _resolveNextBatch;
    private static _allDependenciesVisited;
    /**
     * This is needed because moduleIds are not present in the visit state
     * causing an infinite loop when checking whether a dependency is visited if that dependency is a module.
     */
    private static _checkModuleDependencyIsComplete;
}
export {};
//# sourceMappingURL=batcher.d.ts.map