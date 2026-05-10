import { isFuture } from "../../type-guards.js";
import { AdjacencyList } from "./adjacency-list.js";
export class AdjacencyListConverter {
    static buildAdjacencyListFromFutures(futures) {
        const dependencyGraph = new AdjacencyList(futures.map((f) => f.id));
        for (const future of futures) {
            for (const dependency of future.dependencies) {
                dependencyGraph.addDependency({ from: future.id, to: dependency.id });
                if (isFuture(dependency)) {
                    this._optionallyAddDependenciesSubmoduleSiblings(dependencyGraph, future, dependency);
                }
            }
        }
        return dependencyGraph;
    }
    /**
     * The famed Malaga rule, if a future's dependency is in a submodule,
     * then that future should not be executed until all futures in the
     * submodule have been run.
     */
    static _optionallyAddDependenciesSubmoduleSiblings(dependencyGraph, future, dependency) {
        if (future.module === dependency.module) {
            return;
        }
        for (const moduleDep of dependency.module.futures) {
            dependencyGraph.addDependency({
                from: future.id,
                to: moduleDep.id,
            });
        }
    }
}
//# sourceMappingURL=adjacency-list-converter.js.map