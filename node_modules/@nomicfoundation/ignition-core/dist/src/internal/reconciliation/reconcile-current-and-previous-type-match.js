import { FutureType } from "../../types/module.js";
import { fail } from "./utils.js";
export function reconcileCurrentAndPreviousTypeMatch(future, executionState, _context) {
    if (executionState.futureType === future.type) {
        return { success: true };
    }
    return fail(future, `Future with id ${future.id} has changed from ${FutureType[executionState.futureType]} to ${FutureType[future.type]}`);
}
//# sourceMappingURL=reconcile-current-and-previous-type-match.js.map