import { assertIgnitionInvariant } from "../../utils/assertions.js";
import { ExecutionSateType } from "../types/execution-state.js";
import { JournalMessageType } from "../types/messages.js";
import { completeExecutionState } from "./helpers/complete-execution-state.js";
import { initialiseCallExecutionStateFrom, initialiseContractAtExecutionStateFrom, initialiseDeploymentExecutionStateFrom, initialiseEncodeFunctionCallExecutionStateFrom, initialiseReadEventArgumentExecutionStateFrom, initialiseSendDataExecutionStateFrom, initialiseStaticCallExecutionStateFrom, } from "./helpers/initializers.js";
import { appendNetworkInteraction, appendTransactionToOnchainInteraction, applyNonceToOnchainInteraction, bumpOnchainInteractionFees, completeStaticCall, confirmTransaction, onchainInteractionTimedOut, resendDroppedOnchainInteraction, resetOnchainInteractionReplacedByUser, } from "./helpers/network-interaction-helpers.js";
const exStateTypesThatSupportOnchainInteractions = [
    ExecutionSateType.DEPLOYMENT_EXECUTION_STATE,
    ExecutionSateType.CALL_EXECUTION_STATE,
    ExecutionSateType.SEND_DATA_EXECUTION_STATE,
];
const exStateTypesThatSupportOnchainInteractionsAndStaticCalls = [
    ...exStateTypesThatSupportOnchainInteractions,
    ExecutionSateType.STATIC_CALL_EXECUTION_STATE,
];
export function executionStateReducer(state, action) {
    switch (action.type) {
        case JournalMessageType.DEPLOYMENT_EXECUTION_STATE_INITIALIZE:
            return initialiseDeploymentExecutionStateFrom(action);
        case JournalMessageType.CALL_EXECUTION_STATE_INITIALIZE:
            return initialiseCallExecutionStateFrom(action);
        case JournalMessageType.STATIC_CALL_EXECUTION_STATE_INITIALIZE:
            return initialiseStaticCallExecutionStateFrom(action);
        case JournalMessageType.SEND_DATA_EXECUTION_STATE_INITIALIZE:
            return initialiseSendDataExecutionStateFrom(action);
        case JournalMessageType.CONTRACT_AT_EXECUTION_STATE_INITIALIZE:
            return initialiseContractAtExecutionStateFrom(action);
        case JournalMessageType.READ_EVENT_ARGUMENT_EXECUTION_STATE_INITIALIZE:
            return initialiseReadEventArgumentExecutionStateFrom(action);
        case JournalMessageType.ENCODE_FUNCTION_CALL_EXECUTION_STATE_INITIALIZE:
            return initialiseEncodeFunctionCallExecutionStateFrom(action);
        case JournalMessageType.DEPLOYMENT_EXECUTION_STATE_COMPLETE:
            return _ensureStateThen(state, action, [ExecutionSateType.DEPLOYMENT_EXECUTION_STATE], completeExecutionState);
        case JournalMessageType.CALL_EXECUTION_STATE_COMPLETE:
            return _ensureStateThen(state, action, [ExecutionSateType.CALL_EXECUTION_STATE], completeExecutionState);
        case JournalMessageType.STATIC_CALL_EXECUTION_STATE_COMPLETE:
            return _ensureStateThen(state, action, [ExecutionSateType.STATIC_CALL_EXECUTION_STATE], completeExecutionState);
        case JournalMessageType.SEND_DATA_EXECUTION_STATE_COMPLETE:
            return _ensureStateThen(state, action, [ExecutionSateType.SEND_DATA_EXECUTION_STATE], completeExecutionState);
        case JournalMessageType.NETWORK_INTERACTION_REQUEST:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractionsAndStaticCalls, appendNetworkInteraction);
        case JournalMessageType.STATIC_CALL_COMPLETE:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractionsAndStaticCalls, completeStaticCall);
        case JournalMessageType.TRANSACTION_PREPARE_SEND:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, applyNonceToOnchainInteraction);
        case JournalMessageType.TRANSACTION_SEND:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, appendTransactionToOnchainInteraction);
        case JournalMessageType.TRANSACTION_CONFIRM:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, confirmTransaction);
        case JournalMessageType.ONCHAIN_INTERACTION_BUMP_FEES:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, bumpOnchainInteractionFees);
        case JournalMessageType.ONCHAIN_INTERACTION_DROPPED:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, resendDroppedOnchainInteraction);
        case JournalMessageType.ONCHAIN_INTERACTION_REPLACED_BY_USER:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, resetOnchainInteractionReplacedByUser);
        case JournalMessageType.ONCHAIN_INTERACTION_TIMEOUT:
            return _ensureStateThen(state, action, exStateTypesThatSupportOnchainInteractions, onchainInteractionTimedOut);
    }
}
/**
 * Ensure the execution state is defined and of the correct type, then
 * run the given `then` function.
 *
 * @param state - the execution state
 * @param action - the message to reduce
 * @param allowedExStateTypes - the allowed execution states for the message
 * @param then - the reducer that will be passed the checked state and message
 * @returns a copy of the updated execution state
 */
function _ensureStateThen(state, action, allowedExStateTypes, then) {
    assertIgnitionInvariant(state !== undefined, `Execution state must be defined`);
    assertIgnitionInvariant(allowedExStateTypes.includes(state.type), `The execution state ${state.type} is not supported`);
    return then(state, action);
}
//# sourceMappingURL=execution-state-reducer.js.map