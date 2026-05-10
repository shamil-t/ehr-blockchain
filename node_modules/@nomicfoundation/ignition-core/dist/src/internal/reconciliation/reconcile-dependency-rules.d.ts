import type { ReconciliationFutureResult } from "./types.js";
import type { Future } from "../../types/module.js";
import type { DeploymentState } from "../execution/types/deployment-state.js";
import type { ExecutionState } from "../execution/types/execution-state.js";
export declare function reconcileDependencyRules(future: Future, executionState: ExecutionState, context: {
    deploymentState: DeploymentState;
}): ReconciliationFutureResult;
//# sourceMappingURL=reconcile-dependency-rules.d.ts.map