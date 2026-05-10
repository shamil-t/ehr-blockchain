import type { DeploymentState } from "../../types/deployment-state.js";
import type { WipeExecutionStateMessage } from "../../types/messages.js";
/**
 * Removes an existing execution state from the deployment state.
 *
 * @param state - The deployment state.
 * @param message - The message containing the info of the execution state to remove.
 * @returns - a copy of the deployment state with the execution state removed.
 */
export declare function wipeExecutionState(deploymentState: DeploymentState, message: WipeExecutionStateMessage): DeploymentState;
//# sourceMappingURL=deployment-state-helpers.d.ts.map