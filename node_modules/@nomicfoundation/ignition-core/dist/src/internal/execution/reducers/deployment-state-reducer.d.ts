import type { DeploymentState } from "../types/deployment-state.js";
import type { JournalMessage } from "../types/messages.js";
/**
 * The root level reducer for the overall deployment state.
 *
 * @param state - the deployment state
 * @param action - a message that can be journaled
 * @returns a copy of the deployment state with the message applied
 */
export declare function deploymentStateReducer(state?: DeploymentState, action?: JournalMessage): DeploymentState;
//# sourceMappingURL=deployment-state-reducer.d.ts.map