import { z } from "zod";
import { rpcAccessList } from "./access-list.js";
import { nullableRpcAddress, rpcAddress } from "./address.js";
import { rpcAuthorizationList } from "./authorization-list.js";
import { rpcData } from "./data.js";
import { rpcHash } from "./hash.js";
import { rpcQuantity } from "./quantity.js";
const optional = (schema) => schema.optional();
export const rpcTransactionRequest = z.object({
    from: rpcAddress,
    to: optional(nullableRpcAddress),
    gas: optional(rpcQuantity),
    gasPrice: optional(rpcQuantity),
    value: optional(rpcQuantity),
    nonce: optional(rpcQuantity),
    data: optional(rpcData),
    accessList: optional(rpcAccessList),
    chainId: optional(rpcQuantity),
    maxFeePerGas: optional(rpcQuantity),
    maxPriorityFeePerGas: optional(rpcQuantity),
    blobs: optional(z.array(rpcData)),
    blobVersionedHashes: optional(z.array(rpcHash)),
    authorizationList: optional(rpcAuthorizationList),
});
//# sourceMappingURL=tx-request.js.map