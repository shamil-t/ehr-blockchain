import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { isAccountRuntimeValue, isFuture, isRuntimeValue, } from "../../type-guards.js";
/**
 * Given the deployment parameters and a ModuleParameterRuntimeValue,
 * resolve the value for the ModuleParameterRuntimeValue.
 *
 * The logic runs, use the specific module parameter if available,
 * fall back to a globally defined parameter, then finally use
 * the default value. It is possible that the ModuleParameterRuntimeValue
 * has no default value, in which case this function will return undefined.
 */
export function resolvePotentialModuleParameterValueFrom(deploymentParameters, moduleRuntimeValue) {
    return (deploymentParameters[moduleRuntimeValue.moduleId]?.[moduleRuntimeValue.name] ??
        deploymentParameters.$global?.[moduleRuntimeValue.name] ??
        moduleRuntimeValue.defaultValue);
}
export function validateAccountRuntimeValue(arv, accounts) {
    const errors = [];
    if (arv.accountIndex < 0) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.NEGATIVE_ACCOUNT_INDEX));
    }
    if (arv.accountIndex >= accounts.length) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.ACCOUNT_INDEX_TOO_HIGH, {
            accountIndex: arv.accountIndex,
            accountsLength: accounts.length,
        }));
    }
    return errors;
}
export function filterToAccountRuntimeValues(runtimeValues) {
    return runtimeValues
        .map((rv) => {
        if (isAccountRuntimeValue(rv)) {
            return rv;
        }
        else if (isAccountRuntimeValue(rv.defaultValue)) {
            return rv.defaultValue;
        }
        else {
            return undefined;
        }
    })
        .filter((rv) => rv !== undefined);
}
export function retrieveNestedRuntimeValues(args) {
    return args.flatMap(checkForValues).filter(isRuntimeValue);
}
function checkForValues(arg) {
    if (isRuntimeValue(arg)) {
        return arg;
    }
    if (Array.isArray(arg)) {
        return arg.flatMap(checkForValues);
    }
    if (!isFuture(arg) && typeof arg === "object" && arg !== null) {
        return Object.values(arg).flatMap(checkForValues);
    }
    return null;
}
//# sourceMappingURL=utils.js.map