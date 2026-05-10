import { isFuture } from "../type-guards.js";
export function resolveArgsToFutures(args) {
    return args.flatMap(_resolveArgToFutures);
}
function _resolveArgToFutures(argument) {
    if (isFuture(argument)) {
        return [argument];
    }
    if (Array.isArray(argument)) {
        return resolveArgsToFutures(argument);
    }
    if (typeof argument === "object" && argument !== null) {
        return resolveArgsToFutures(Object.values(argument));
    }
    return [];
}
//# sourceMappingURL=utils.js.map