import type { ZodType } from "zod";
import { z } from "zod";
declare const rpcAuthorizationListTuple: ZodType<{
    chainId: bigint;
    address: Uint8Array;
    nonce: bigint;
    yParity: Uint8Array;
    r: Uint8Array;
    s: Uint8Array;
}>;
export type RpcAuthorizationListTuple = z.infer<typeof rpcAuthorizationListTuple>;
export declare const rpcAuthorizationList: ZodType<RpcAuthorizationListTuple[]>;
export {};
//# sourceMappingURL=authorization-list.d.ts.map