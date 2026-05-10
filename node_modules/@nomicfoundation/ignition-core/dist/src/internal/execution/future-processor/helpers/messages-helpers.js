import { ExecutionSateType } from "../../types/execution-state.js";
import { JournalMessageType } from "../../types/messages.js";
/**
 * Creates a message indicating that an execution state is now complete.
 *
 * IMPORTANT NOTE: This function is NOT type-safe. It's the caller's responsibility
 * to ensure that the result is of the correct type.
 *
 * @param exState The completed execution state.
 * @param result The result of the execution.
 * @returns The completion message.
 */
export function createExecutionStateCompleteMessage(exState, result) {
    if (exState.type === ExecutionSateType.STATIC_CALL_EXECUTION_STATE) {
        return {
            type: JournalMessageType.STATIC_CALL_EXECUTION_STATE_COMPLETE,
            futureId: exState.id,
            result: result,
        };
    }
    return createExecutionStateCompleteMessageForExecutionsWithOnchainInteractions(exState, result);
}
/**
 * Creates a message indicating that an execution state is now complete for
 * execution states that require onchain interactions.
 *
 * IMPORTANT NOTE: This function is NOT type-safe. It's the caller's responsibility
 * to ensure that the result is of the correct type.
 *
 * @param exState The completed execution state.
 * @param result The result of the execution.
 * @returns The completion message.
 */
export function createExecutionStateCompleteMessageForExecutionsWithOnchainInteractions(exState, result) {
    switch (exState.type) {
        case ExecutionSateType.DEPLOYMENT_EXECUTION_STATE:
            return {
                type: JournalMessageType.DEPLOYMENT_EXECUTION_STATE_COMPLETE,
                futureId: exState.id,
                result: result,
            };
        case ExecutionSateType.CALL_EXECUTION_STATE:
            return {
                type: JournalMessageType.CALL_EXECUTION_STATE_COMPLETE,
                futureId: exState.id,
                result: result,
            };
        case ExecutionSateType.SEND_DATA_EXECUTION_STATE:
            return {
                type: JournalMessageType.SEND_DATA_EXECUTION_STATE_COMPLETE,
                futureId: exState.id,
                result: result,
            };
    }
}
//# sourceMappingURL=messages-helpers.js.map