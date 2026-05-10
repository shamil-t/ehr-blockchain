import { ExecutionStatus } from "../execution/types/execution-state.js";
/**
 * Determine if an execution state has reached completion, either
 * completing successfully or failing or timing out.
 *
 * @param exState - the execution state
 * @returns true if the execution state is complete, false if it does
 * not exist or is not complete
 */
export function isExecutionStateComplete(exState) {
    return exState.status !== ExecutionStatus.STARTED;
}
//# sourceMappingURL=is-execution-state-complete.js.map