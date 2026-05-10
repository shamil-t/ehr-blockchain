import { reconcileArtifacts } from "../helpers/reconcile-artifacts.js";
import { reconcileContractName } from "../helpers/reconcile-contract-name.js";
import { reconcileFrom } from "../helpers/reconcile-from.js";
import { reconcileLibraries } from "../helpers/reconcile-libraries.js";
import { reconcileStrategy } from "../helpers/reconcile-strategy.js";
export async function reconcileNamedLibraryDeployment(future, executionState, context) {
    let result = reconcileContractName(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = await reconcileArtifacts(future, executionState, context);
    if (result !== undefined) {
        return result;
    }
    result = reconcileLibraries(future, executionState, context);
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
//# sourceMappingURL=reconcileNamedLibraryDeployment.js.map