import { z } from "zod";
import { rpcAddress } from "./address.js";
import { rpcHash } from "./hash.js";
import { rpcQuantity } from "./quantity.js";
import { rpcParity } from "./rpc-parity.js";
const rpcAuthorizationListTuple = z.object({
    chainId: rpcQuantity,
    address: rpcAddress,
    nonce: rpcQuantity,
    yParity: rpcParity,
    r: rpcHash,
    s: rpcHash,
});
export const rpcAuthorizationList = z.array(rpcAuthorizationListTuple);
//# sourceMappingURL=authorization-list.js.map