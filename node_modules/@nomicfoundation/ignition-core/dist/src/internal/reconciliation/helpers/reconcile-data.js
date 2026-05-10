import { assertIgnitionInvariant } from "../../utils/assertions.js";
import { findResultForFutureById } from "../../views/find-result-for-future-by-id.js";
import { compare } from "./compare.js";
export function reconcileData(future, exState, context) {
    if (typeof future.data === "string" || future.data === undefined) {
        return compare(future, "Data", exState.data, future.data ?? "0x");
    }
    const newData = findResultForFutureById(context.deploymentState, future.data.id);
    assertIgnitionInvariant(typeof newData === "string", "Expected data to be a string");
    return compare(future, "Data", exState.data, newData);
}
//# sourceMappingURL=reconcile-data.js.map