import { assertIgnitionInvariant } from "../../../utils/assertions.js";
import { ExecutionResultType } from "../../types/execution-result.js";
import { JournalMessageType } from "../../types/messages.js";
import { NetworkInteractionType } from "../../types/network-interaction.js";
import { decodeSimulationResult } from "../helpers/decode-simulation-result.js";
import { createExecutionStateCompleteMessageForExecutionsWithOnchainInteractions } from "../helpers/messages-helpers.js";
import { TRANSACTION_SENT_TYPE, sendTransactionForOnchainInteraction, } from "../helpers/network-interaction-execution.js";
import { replayStrategy } from "../helpers/replay-strategy.js";
/**
 * Sends a transaction for the execution state's latest NetworkInteraction
 * and returns a TransactionSendMessage, or an execution state complete message
 * in case of an error.
 *
 * This function can send the first transaction of an OnchainInteraction, as well
 * as new transactions to bump fees and recovering from dropped transactions.
 *
 * SIDE EFFECTS: This function has side effects, as it sends a transaction. These
 *  include: sending the transaction to the network, allocating a nonce in the
 *  NonceManager if needed, and adding the transaction to the TransactionTrackingTimer.
 *
 * @param exState The execution state that requires a transaction to be sent.
 * @param executionStrategy The execution strategy to use for simulations.
 * @param jsonRpcClient The JSON RPC client to use for the transaction.
 * @param nonceManager The NonceManager to allocate nonces if needed.
 * @param transactionTrackingTimer The TransactionTrackingTimer to add the transaction to.
 * @returns A message indicating the result of trying to send the transaction.
 */
export async function sendTransaction(exState, executionStrategy, jsonRpcClient, nonceManager, transactionTrackingTimer, deploymentLoader) {
    const lastNetworkInteraction = exState.networkInteractions.at(-1);
    assertIgnitionInvariant(lastNetworkInteraction !== undefined, `No network interaction found for ExecutionState ${exState.id} when trying to send a transaction`);
    assertIgnitionInvariant(lastNetworkInteraction.type === NetworkInteractionType.ONCHAIN_INTERACTION, `StaticCall found as last network interaction of ExecutionState ${exState.id} when trying to send a transaction`);
    const generator = await replayStrategy(exState, executionStrategy);
    // This cast is safe because the execution state is of static call type.
    const strategyGenerator = generator;
    const result = await sendTransactionForOnchainInteraction(jsonRpcClient, exState.from, lastNetworkInteraction, nonceManager, decodeSimulationResult(strategyGenerator, exState), deploymentLoader, exState.id);
    // If the transaction failed during simulation, we need to revert the nonce allocation
    if (result.type === ExecutionResultType.STRATEGY_SIMULATION_ERROR ||
        result.type === ExecutionResultType.SIMULATION_ERROR) {
        nonceManager.revertNonce(exState.from);
    }
    if (result.type === TRANSACTION_SENT_TYPE) {
        transactionTrackingTimer.addTransaction(result.transaction.hash);
        return {
            type: JournalMessageType.TRANSACTION_SEND,
            futureId: exState.id,
            networkInteractionId: lastNetworkInteraction.id,
            transaction: result.transaction,
            nonce: result.nonce,
        };
    }
    return createExecutionStateCompleteMessageForExecutionsWithOnchainInteractions(exState, result);
}
//# sourceMappingURL=send-transaction.js.map