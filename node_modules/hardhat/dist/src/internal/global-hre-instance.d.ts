import type { HardhatRuntimeEnvironment } from "../types/hre.js";
/**
 * This function returns a global instance of the Hardhat Runtime Environment
 * if it was already initialized.
 *
 * It exists so that the CLI and the programmatic API (as in `import "hardhat"`)
 * are always using the same HRE instance.
 */
export declare function getGlobalHardhatRuntimeEnvironment(): HardhatRuntimeEnvironment | undefined;
/**
 * Sets the global instance of the Hardhat Runtime Environment.
 */
export declare function setGlobalHardhatRuntimeEnvironment(newHre: HardhatRuntimeEnvironment): void;
/**
 * This function resets the global instance of the Hardhat Runtime Environment,
 * so that it can be reinitialized.
 *
 * It should be used only in tests.
 */
export declare function resetGlobalHardhatRuntimeEnvironment(): void;
//# sourceMappingURL=global-hre-instance.d.ts.map