import { produce } from "immer";
import { ExecutionResultType } from "../../types/execution-result.js";
import { ExecutionStatus } from "../../types/execution-state.js";
/**
 * Update the execution state for a future to complete.
 *
 * This can be done generically currently because all execution states
 * excluding contractAt and readEventArg have a result property, and
 * contractAt and readEventArg are initialized completed.
 *
 * @param state - the execution state that will be completed
 * @param message - the execution state specific completion message
 * @returns - a copy of the execution state with the result and status updated
 */
export function completeExecutionState(state, message) {
    return produce(state, (draft) => {
        draft.status = _mapResultTypeToStatus(message.result);
        draft.result = message.result;
    });
}
function _mapResultTypeToStatus(result) {
    switch (result.type) {
        case ExecutionResultType.SUCCESS:
            return ExecutionStatus.SUCCESS;
        case ExecutionResultType.SIMULATION_ERROR:
            return ExecutionStatus.FAILED;
        case ExecutionResultType.STRATEGY_SIMULATION_ERROR:
            return ExecutionStatus.FAILED;
        case ExecutionResultType.REVERTED_TRANSACTION:
            return ExecutionStatus.FAILED;
        case ExecutionResultType.STATIC_CALL_ERROR:
            return ExecutionStatus.FAILED;
        case ExecutionResultType.STRATEGY_ERROR:
            return ExecutionStatus.FAILED;
        case ExecutionResultType.STRATEGY_HELD:
            return ExecutionStatus.HELD;
    }
}
//# sourceMappingURL=complete-execution-state.js.map