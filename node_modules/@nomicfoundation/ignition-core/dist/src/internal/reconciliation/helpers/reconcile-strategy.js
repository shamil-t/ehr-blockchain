import isEqual from "lodash-es/isEqual.js";
import { ExecutionStatus } from "../../execution/types/execution-state.js";
import { fail } from "../utils.js";
export function reconcileStrategy(future, exState, context) {
    /**
     * If the execution was successful, we don't need to reconcile the strategy.
     *
     * The strategy is set per run, so reconciling already completed futures
     * would lead to a false positive. We only want to reconcile futures that
     * will be run again.
     */
    if (exState.status === ExecutionStatus.SUCCESS) {
        return undefined;
    }
    const storedStrategyName = exState.strategy;
    const newStrategyName = context.strategy;
    if (storedStrategyName !== newStrategyName) {
        return fail(future, `Strategy changed from "${storedStrategyName}" to "${newStrategyName}"`);
    }
    // We may have an `undefined` strategy config when reading a journal, as
    // some previous versions of Ignition didn't set this property
    const storedStrategyConfig = exState.strategyConfig ?? {};
    const newStrategyConfig = context.strategyConfig;
    if (!isEqual(storedStrategyConfig, newStrategyConfig)) {
        return fail(future, `Strategy config changed from ${JSON.stringify(storedStrategyConfig)} to ${JSON.stringify(newStrategyConfig)}`);
    }
}
//# sourceMappingURL=reconcile-strategy.js.map