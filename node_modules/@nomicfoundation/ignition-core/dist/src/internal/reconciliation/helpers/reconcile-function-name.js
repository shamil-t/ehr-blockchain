import { compare } from "./compare.js";
export function reconcileFunctionName(future, exState, _context) {
    return compare(future, "Function name", exState.functionName, future.functionName);
}
//# sourceMappingURL=reconcile-function-name.js.map