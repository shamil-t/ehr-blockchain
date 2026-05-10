import { HardhatError } from "@nomicfoundation/hardhat-errors";
export function assertIgnitionInvariant(invariant, description) {
    if (!invariant) {
        throw new HardhatError(HardhatError.ERRORS.IGNITION.GENERAL.ASSERTION_ERROR, { description });
    }
}
//# sourceMappingURL=assertions.js.map