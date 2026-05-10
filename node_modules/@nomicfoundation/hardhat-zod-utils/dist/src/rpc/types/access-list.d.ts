import type { ZodType } from "zod";
import { z } from "zod";
declare const rpcAccessListTuple: ZodType<{
    address: Uint8Array;
    storageKeys: Uint8Array[] | null;
}>;
export type RpcAccessListTuple = z.infer<typeof rpcAccessListTuple>;
export declare const rpcAccessList: ZodType<RpcAccessListTuple[]>;
export {};
//# sourceMappingURL=access-list.d.ts.map