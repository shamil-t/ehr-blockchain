import { produce } from "immer";
import { assertIgnitionInvariant } from "../../../utils/assertions.js";
/**
 * Removes an existing execution state from the deployment state.
 *
 * @param state - The deployment state.
 * @param message - The message containing the info of the execution state to remove.
 * @returns - a copy of the deployment state with the execution state removed.
 */
export function wipeExecutionState(deploymentState, message) {
    return produce(deploymentState, (draft) => {
        assertIgnitionInvariant(draft.executionStates[message.futureId] !== undefined, `ExecutionState ${message.futureId} must exist to be wiped.`);
        delete draft.executionStates[message.futureId];
    });
}
//# sourceMappingURL=deployment-state-helpers.js.map