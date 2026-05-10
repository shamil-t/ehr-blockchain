import { HardhatError } from "@nomicfoundation/hardhat-errors";
export function bigintReviver(key, value) {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
    }
    if (typeof value === "number" && value > Number.MAX_SAFE_INTEGER) {
        throw new HardhatError(HardhatError.ERRORS.IGNITION.INTERNAL.PARAMETER_EXCEEDS_MAXIMUM_SAFE_INTEGER, { parameter: key, value });
    }
    return value;
}
//# sourceMappingURL=bigintReviver.js.map