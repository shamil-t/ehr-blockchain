import { resolveFutureFrom } from "../../execution/future-processor/helpers/future-resolvers.js";
import { compare } from "./compare.js";
export function reconcileFrom(future, exState, context) {
    if (future.from === undefined && context.accounts.includes(exState.from)) {
        return undefined;
    }
    const resolvedFrom = resolveFutureFrom(future.from, context.accounts, context.defaultSender);
    return compare(future, "From account", exState.from, resolvedFrom);
}
//# sourceMappingURL=reconcile-from.js.map