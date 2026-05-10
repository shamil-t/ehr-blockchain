import { fail } from "../utils.js";
export function compare(future, fieldName, existingValue, newValue, messageSuffix) {
    if (existingValue !== newValue) {
        return fail(future, `${fieldName} has been changed from ${existingValue?.toString() ?? '"undefined"'} to ${newValue?.toString() ?? '"undefined"'}${messageSuffix ?? ""}`);
    }
}
//# sourceMappingURL=compare.js.map