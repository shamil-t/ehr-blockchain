import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors";
let hre;
/**
 * This function returns a global instance of the Hardhat Runtime Environment
 * if it was already initialized.
 *
 * It exists so that the CLI and the programmatic API (as in `import "hardhat"`)
 * are always using the same HRE instance.
 */
export function getGlobalHardhatRuntimeEnvironment() {
    return hre;
}
/**
 * Sets the global instance of the Hardhat Runtime Environment.
 */
export function setGlobalHardhatRuntimeEnvironment(newHre) {
    assertHardhatInvariant(hre === undefined, "The global instances of the HRE is already set");
    hre = newHre;
}
/**
 * This function resets the global instance of the Hardhat Runtime Environment,
 * so that it can be reinitialized.
 *
 * It should be used only in tests.
 */
export function resetGlobalHardhatRuntimeEnvironment() {
    hre = undefined;
}
//# sourceMappingURL=global-hre-instance.js.map