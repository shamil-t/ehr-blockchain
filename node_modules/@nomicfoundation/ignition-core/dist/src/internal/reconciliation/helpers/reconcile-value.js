import { resolveValue } from "../../execution/future-processor/helpers/future-resolvers.js";
import { compare } from "./compare.js";
export function reconcileValue(future, exState, context) {
    const resolvedValue = resolveValue(future.value, context.deploymentParameters, context.deploymentState, context.accounts);
    return compare(future, "Value", exState.value, resolvedValue);
}
//# sourceMappingURL=reconcile-value.js.map