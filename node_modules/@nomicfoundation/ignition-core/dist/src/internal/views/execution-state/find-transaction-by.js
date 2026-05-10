import { assertIgnitionInvariant } from "../../utils/assertions.js";
import { findOnchainInteractionBy } from "./find-onchain-interaction-by.js";
export function findTransactionBy(executionState, networkInteractionId, hash) {
    const onchainInteraction = findOnchainInteractionBy(executionState, networkInteractionId);
    const transaction = onchainInteraction.transactions.find((tx) => tx.hash === hash);
    assertIgnitionInvariant(transaction !== undefined, `Expected transaction ${executionState.id}/${networkInteractionId}/${hash} to exist, but it did not`);
    return transaction;
}
//# sourceMappingURL=find-transaction-by.js.map