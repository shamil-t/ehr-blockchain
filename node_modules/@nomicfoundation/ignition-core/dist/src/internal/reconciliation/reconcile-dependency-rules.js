import { difference } from "lodash-es";
import { ExecutionStatus } from "../execution/types/execution-state.js";
import { fail } from "./utils.js";
export function reconcileDependencyRules(future, executionState, context) {
    const previousDeps = [...executionState.dependencies];
    const currentDeps = [...future.dependencies].map((f) => f.id);
    const additionalDeps = difference(currentDeps, previousDeps);
    for (const additionalDep of additionalDeps) {
        const additionalExecutionState = context.deploymentState.executionStates[additionalDep];
        if (additionalExecutionState === undefined) {
            return fail(future, `A dependency from ${future.id} to ${additionalDep} has been added. The former has started executing before the latter started executing, so this change is incompatible.`);
        }
        // TODO: Check that is was successfully executed before `executionState` was created.
        if (additionalExecutionState.status === ExecutionStatus.SUCCESS) {
            continue;
        }
        return fail(future, `A dependency from ${future.id} to ${additionalDep} has been added, and both futures had already started executing, so this change is incompatible`);
    }
    return { success: true };
}
//# sourceMappingURL=reconcile-dependency-rules.js.map