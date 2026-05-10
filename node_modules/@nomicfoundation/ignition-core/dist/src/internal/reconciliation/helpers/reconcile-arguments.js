import isEqual from "lodash-es/isEqual.js";
import { isDeploymentFuture } from "../../../type-guards.js";
import { resolveArgs } from "../../execution/future-processor/helpers/future-resolvers.js";
import { ExecutionSateType } from "../../execution/types/execution-state.js";
import { isAddress, equalAddresses } from "../../execution/utils/address.js";
import { fail } from "../utils.js";
export function reconcileArguments(future, exState, context) {
    const unresolvedFutureArgs = isDeploymentFuture(future)
        ? future.constructorArgs
        : future.args;
    const futureArgs = resolveArgs(unresolvedFutureArgs, context.deploymentState, context.deploymentParameters, context.accounts);
    const exStateArgs = exState.type === ExecutionSateType.DEPLOYMENT_EXECUTION_STATE
        ? exState.constructorArgs
        : exState.args;
    if (futureArgs.length !== exStateArgs.length) {
        return fail(future, `The number of arguments changed from ${exStateArgs.length} to ${futureArgs.length}`);
    }
    for (const [i, futureArg] of futureArgs.entries()) {
        const exStateArg = exStateArgs[i];
        // if both args are addresses, we need to compare the checksummed versions
        // to ensure case discrepancies are ignored
        if (isAddress(futureArg) && isAddress(exStateArg)) {
            if (!equalAddresses(futureArg, exStateArg)) {
                return fail(future, `Argument at index ${i} has been changed`);
            }
        }
        else if (!isEqual(futureArg, exStateArg)) {
            return fail(future, `Argument at index ${i} has been changed`);
        }
    }
}
//# sourceMappingURL=reconcile-arguments.js.map