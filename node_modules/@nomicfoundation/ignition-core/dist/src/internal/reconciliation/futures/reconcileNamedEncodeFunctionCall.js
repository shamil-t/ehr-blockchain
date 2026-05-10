import { reconcileArguments } from "../helpers/reconcile-arguments.js";
import { reconcileFunctionName } from "../helpers/reconcile-function-name.js";
import { reconcileStrategy } from "../helpers/reconcile-strategy.js";
export function reconcileNamedEncodeFunctionCall(future, executionState, context) {
    let result = reconcileFunctionName(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileArguments(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileStrategy(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    return { success: true };
}
//# sourceMappingURL=reconcileNamedEncodeFunctionCall.js.map