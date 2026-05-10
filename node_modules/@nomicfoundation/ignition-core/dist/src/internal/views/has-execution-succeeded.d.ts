import type { Future } from "../../types/module.js";
import type { DeploymentState } from "../execution/types/deployment-state.js";
/**
 * Returns true if the execution of the given future has succeeded.
 *
 * @param future The future.
 * @param deploymentState The deployment state to check against.
 * @returns true if it succeeded.
 */
export declare function hasExecutionSucceeded(future: Future, deploymentState: DeploymentState): boolean;
//# sourceMappingURL=has-execution-succeeded.d.ts.map