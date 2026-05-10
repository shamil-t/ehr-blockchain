import { HardhatError } from "@nomicfoundation/hardhat-errors";
/**
 * An implementation of NonceManager that validates the nonces using
 * the _maxUsedNonce params and a JsonRpcClient.
 */
export class JsonRpcNonceManager {
    _jsonRpcClient;
    _maxUsedNonce;
    constructor(_jsonRpcClient, _maxUsedNonce) {
        this._jsonRpcClient = _jsonRpcClient;
        this._maxUsedNonce = _maxUsedNonce;
    }
    async getNextNonce(sender) {
        const pendingCount = await this._jsonRpcClient.getTransactionCount(sender, "pending");
        const expectedNonce = this._maxUsedNonce[sender] !== undefined
            ? this._maxUsedNonce[sender] + 1
            : pendingCount;
        if (expectedNonce !== pendingCount) {
            throw new HardhatError(HardhatError.ERRORS.IGNITION.EXECUTION.INVALID_NONCE, {
                sender,
                expectedNonce,
                pendingCount,
            });
        }
        // The nonce hasn't been used yet, but we update as
        // it will be immediately used.
        this._maxUsedNonce[sender] = expectedNonce;
        return expectedNonce;
    }
    revertNonce(sender) {
        this._maxUsedNonce[sender] -= 1;
    }
}
//# sourceMappingURL=json-rpc-nonce-manager.js.map