import type { JsonRpcClient } from "../../jsonrpc-client.js";
import type { TransactionTrackingTimer } from "../../transaction-tracking-timer.js";
import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState } from "../../types/execution-state.js";
import type { OnchainInteractionBumpFeesMessage, OnchainInteractionTimeoutMessage, TransactionConfirmMessage } from "../../types/messages.js";
import type { GetTransactionRetryConfig } from "../../types/network-interaction.js";
/**
 * Checks the transactions of the latest network interaction of the execution state,
 * and returns a message, or undefined if we need to wait for more confirmations.
 *
 * This method can return messages indicating that a transaction has enough confirmations,
 * that we need to bump the fees, or that the execution of this onchain interaction has
 * timed out.
 *
 * If all of the transactions of the latest network interaction have been dropped, this
 * method throws a HardhatError.
 *
 * SIDE EFFECTS: This function doesn't have any side effects.
 *
 * @param params.exState The execution state that requires the transactions to be checked.
 * @param params.jsonRpcClient The JSON RPC client to use for accessing the network.
 * @param params.transactionTrackingTimer The TransactionTrackingTimer to use for checking the
 *  if a transaction has been pending for too long.
 * @param params.requiredConfirmations The number of confirmations required for a transaction
 *  to be considered confirmed.
 * @param params.millisecondBeforeBumpingFees The number of milliseconds before bumping the fees
 *  of a transaction.
 * @param params.maxFeeBumps The maximum number of times we can bump the fees of a transaction
 *  before considering the onchain interaction timed out.
 * @param params.getTransactionRetryConfig This is really only a parameter to help with testing this function
 * @param params.disableFeeBumping Disables fee bumping for all transactions.
 * @param params.maxRetries The maximum number of times to retry fetching a transaction from the mempool.
 * @param params.retryInterval The number of milliseconds to wait between retries when fetching
 *  a transaction from the mempool.
 * @returns A message indicating the result of checking the transactions of the latest
 *  network interaction.
 */
export declare function monitorOnchainInteraction(params: {
    exState: DeploymentExecutionState | CallExecutionState | SendDataExecutionState;
    jsonRpcClient: JsonRpcClient;
    transactionTrackingTimer: TransactionTrackingTimer;
    requiredConfirmations: number;
    millisecondBeforeBumpingFees: number;
    maxFeeBumps: number;
    disableFeeBumping: boolean;
} & GetTransactionRetryConfig): Promise<TransactionConfirmMessage | OnchainInteractionBumpFeesMessage | OnchainInteractionTimeoutMessage | undefined>;
//# sourceMappingURL=monitor-onchain-interaction.d.ts.map