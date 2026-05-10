import { resolveLibraries } from "../../execution/future-processor/helpers/future-resolvers.js";
import { fail } from "../utils.js";
export function reconcileLibraries(future, exState, context) {
    const futureLibraries = resolveLibraries(future.libraries, context.deploymentState);
    for (const [libName, exStateLib] of Object.entries(exState.libraries)) {
        if (futureLibraries[libName] === undefined) {
            return fail(future, `Library ${libName} has been removed`);
        }
        if (futureLibraries[libName] !== exStateLib) {
            return fail(future, `Library ${libName}'s address has been changed`);
        }
    }
    for (const libName of Object.keys(futureLibraries)) {
        if (exState.libraries[libName] === undefined) {
            return fail(future, `Library ${libName} has been added`);
        }
    }
}
//# sourceMappingURL=reconcile-libraries.js.map