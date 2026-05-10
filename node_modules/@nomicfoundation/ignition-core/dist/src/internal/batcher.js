import { ExecutionStatus } from "./execution/types/execution-state.js";
import { AdjacencyListConverter } from "./utils/adjacency-list-converter.js";
import { getFuturesFromModule } from "./utils/get-futures-from-module.js";
var VisitStatus;
(function (VisitStatus) {
    VisitStatus[VisitStatus["UNVISITED"] = 0] = "UNVISITED";
    VisitStatus[VisitStatus["VISITED"] = 1] = "VISITED";
})(VisitStatus || (VisitStatus = {}));
export class Batcher {
    static batch(module, deploymentState) {
        const batchState = this._initializeBatchStateFrom(module, deploymentState);
        const batches = [];
        while (!this._allVisited(batchState)) {
            const nextBatch = this._resolveNextBatch(batchState);
            batches.push(nextBatch);
            this._markAsVisited(batchState, nextBatch);
        }
        return batches;
    }
    static _initializeBatchStateFrom(module, deploymentState) {
        const allFutures = getFuturesFromModule(module);
        const visitState = this._initializeVisitStateFrom(allFutures, deploymentState);
        const adjacencyList = AdjacencyListConverter.buildAdjacencyListFromFutures(allFutures);
        this._eliminateAlreadyVisitedFutures({ adjacencyList, visitState });
        return { adjacencyList, visitState };
    }
    static _initializeVisitStateFrom(futures, deploymentState) {
        return Object.fromEntries(futures.map((f) => {
            const executionState = deploymentState.executionStates[f.id];
            if (executionState === undefined) {
                return [f.id, VisitStatus.UNVISITED];
            }
            switch (executionState.status) {
                case ExecutionStatus.FAILED:
                case ExecutionStatus.TIMEOUT:
                case ExecutionStatus.HELD:
                case ExecutionStatus.STARTED:
                    return [f.id, VisitStatus.UNVISITED];
                case ExecutionStatus.SUCCESS:
                    return [f.id, VisitStatus.VISITED];
            }
        }));
    }
    static _eliminateAlreadyVisitedFutures({ adjacencyList, visitState, }) {
        const visitedFutures = Object.entries(visitState)
            .filter(([, vs]) => vs === VisitStatus.VISITED)
            .map(([futureId]) => futureId);
        for (const visitedFuture of visitedFutures) {
            adjacencyList.eliminate(visitedFuture);
        }
    }
    static _allVisited(batchState) {
        return Object.values(batchState.visitState).every((s) => s === VisitStatus.VISITED);
    }
    static _markAsVisited(batchState, nextBatch) {
        for (const futureId of nextBatch) {
            batchState.visitState[futureId] = VisitStatus.VISITED;
        }
    }
    static _resolveNextBatch(batchState) {
        const allUnvisited = Object.entries(batchState.visitState)
            .filter(([, state]) => state === VisitStatus.UNVISITED)
            .map(([id]) => id);
        const allUnvisitedWhereDepsVisited = allUnvisited.filter((futureId) => this._allDependenciesVisited(futureId, batchState));
        return allUnvisitedWhereDepsVisited.sort();
    }
    static _allDependenciesVisited(futureId, batchState) {
        const dependencies = batchState.adjacencyList.getDependenciesFor(futureId);
        return [...dependencies].every((depId) => {
            // We distinguish between module and future ids here, as the future's always have `#` and the modules don't.
            if (/#/.test(depId)) {
                return batchState.visitState[depId] === VisitStatus.VISITED;
            }
            return this._checkModuleDependencyIsComplete(depId, batchState);
        });
    }
    /**
     * This is needed because moduleIds are not present in the visit state
     * causing an infinite loop when checking whether a dependency is visited if that dependency is a module.
     */
    static _checkModuleDependencyIsComplete(moduleId, batchState) {
        const dependencies = Object.keys(batchState.visitState).filter((futureId) => futureId.startsWith(moduleId));
        return dependencies.every((depId) => batchState.visitState[depId] === VisitStatus.VISITED);
    }
}
//# sourceMappingURL=batcher.js.map