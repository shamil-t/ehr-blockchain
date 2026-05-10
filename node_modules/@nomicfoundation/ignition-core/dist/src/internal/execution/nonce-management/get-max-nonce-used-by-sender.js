import { getPendingNonceAndSender } from "../../views/execution-state/get-pending-nonce-and-sender.js";
export function getMaxNonceUsedBySender(deploymentState) {
    const nonces = {};
    for (const executionState of Object.values(deploymentState.executionStates)) {
        const pendingNonceAndSender = getPendingNonceAndSender(executionState);
        if (pendingNonceAndSender === undefined) {
            continue;
        }
        const { sender, nonce } = pendingNonceAndSender;
        if (nonces[sender] === undefined) {
            nonces[sender] = nonce;
        }
        else {
            nonces[sender] = Math.max(nonces[sender], nonce);
        }
    }
    return nonces;
}
//# sourceMappingURL=get-max-nonce-used-by-sender.js.map