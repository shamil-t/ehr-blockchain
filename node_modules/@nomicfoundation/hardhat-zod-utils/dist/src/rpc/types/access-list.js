import { z } from "zod";
import { rpcData } from "./data.js";
const nullable = (schema) => schema.nullable();
const rpcAccessListTuple = z.object({
    address: rpcData,
    storageKeys: nullable(z.array(rpcData)),
});
export const rpcAccessList = z.array(rpcAccessListTuple);
//# sourceMappingURL=access-list.js.map