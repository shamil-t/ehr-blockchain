import { resolveAddressLike } from "../../execution/future-processor/helpers/future-resolvers.js";
import { compare } from "./compare.js";
export function reconcileAddress(future, exState, context) {
    const resolvedAddress = resolveAddressLike(future.address, context.deploymentState, context.deploymentParameters, context.accounts);
    return compare(future, "Address", exState.contractAddress, resolvedAddress);
}
//# sourceMappingURL=reconcile-address.js.map