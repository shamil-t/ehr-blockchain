import { reconcileArguments } from "../helpers/reconcile-arguments.js";
import { reconcileContract } from "../helpers/reconcile-contract.js";
import { reconcileFrom } from "../helpers/reconcile-from.js";
import { reconcileFunctionName } from "../helpers/reconcile-function-name.js";
import { reconcileStrategy } from "../helpers/reconcile-strategy.js";
import { reconcileValue } from "../helpers/reconcile-value.js";
export function reconcileNamedContractCall(future, executionState, context) {
    let result = reconcileContract(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileFunctionName(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileArguments(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileValue(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileFrom(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileStrategy(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    return { success: true };
}
//# sourceMappingURL=reconcileNamedContractCall.js.map