import type { ZodType } from "zod";
export interface RpcTransactionRequest {
    from: Uint8Array;
    to?: Uint8Array | null;
    gas?: bigint;
    gasPrice?: bigint;
    value?: bigint;
    nonce?: bigint;
    data?: Uint8Array;
    accessList?: Array<{
        address: Uint8Array;
        storageKeys: Uint8Array[] | null;
    }>;
    chainId?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    blobs?: Uint8Array[];
    blobVersionedHashes?: Uint8Array[];
    authorizationList?: Array<{
        chainId: bigint;
        address: Uint8Array;
        nonce: bigint;
        yParity: Uint8Array;
        r: Uint8Array;
        s: Uint8Array;
    }>;
}
export declare const rpcTransactionRequest: ZodType<RpcTransactionRequest>;
//# sourceMappingURL=tx-request.d.ts.map