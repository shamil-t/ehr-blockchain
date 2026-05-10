import { resolveAddressLike } from "../../execution/future-processor/helpers/future-resolvers.js";
import { compare } from "./compare.js";
export function reconcileContract(future, exState, context) {
    const resolvedAddress = resolveAddressLike(future.contract, context.deploymentState, context.deploymentParameters, context.accounts);
    return compare(future, "Contract address", exState.contractAddress, resolvedAddress, ` (future ${future.contract.id})`);
}
//# sourceMappingURL=reconcile-contract.js.map