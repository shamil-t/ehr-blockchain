import type { ExecutionState } from "../../execution/types/execution-state.js";
import type { OnchainInteraction } from "../../execution/types/network-interaction.js";
/**
 * Returns the last NetworkInteraction if there's one and it's an
 * OnchainInteraction without a confirmed transaction.
 *
 * @param exState The execution state to check.
 * @returns Returns the pending nonce and sender if the last network interaction
 *  was a transaction, and it hasn't been been confirmed yet.
 */
export declare function getPendingOnchainInteraction(exState: ExecutionState): OnchainInteraction | undefined;
//# sourceMappingURL=get-pending-onchain-interaction.d.ts.map