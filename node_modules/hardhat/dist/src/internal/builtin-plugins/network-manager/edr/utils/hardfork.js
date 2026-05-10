import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors";
import { L1HardforkName, OpHardforkName } from "../types/hardfork.js";
export function getL1HardforkName(name) {
    const hardforkName = Object.values(L1HardforkName)[Object.values(L1HardforkName).indexOf(name)];
    assertHardhatInvariant(hardforkName !== undefined, `Invalid hardfork name ${name}`);
    return hardforkName;
}
export function getOpHardforkName(name) {
    const hardforkName = Object.values(OpHardforkName)[Object.values(OpHardforkName).indexOf(name)];
    assertHardhatInvariant(hardforkName !== undefined, `Invalid hardfork name ${name}`);
    return hardforkName;
}
//# sourceMappingURL=hardfork.js.map