import type { UnsafeHardhatRuntimeEnvironmentOptions } from "./core/types.js";
import type { HardhatUserConfig } from "../types/config.js";
import type { GlobalOptions } from "../types/global-options.js";
import type { HardhatRuntimeEnvironment } from "../types/hre.js";
/**
 * Creates an instance of the Hardhat Runtime Environment.
 *
 * @param config - The user's Hardhat configuration. Note that the config
 * doesn't have to come from a file, but if it does, you should provide its
 * path as the `config` property in the `userProvidedGlobalOptions` object.
 * @param userProvidedGlobalOptions - The global options provided by the
 *  user.
 * @param projectRoot - The root of the Hardhat project. Hardhat expects this
 * to be the root of the npm project containing your config file. If none is
 * provided, it will use the root of the npm project that contains the CWD.
 * @returns The Hardhat Runtime Environment.
 */
export declare function createHardhatRuntimeEnvironment(config: HardhatUserConfig, userProvidedGlobalOptions?: Partial<GlobalOptions>, projectRoot?: string, unsafeOptions?: UnsafeHardhatRuntimeEnvironmentOptions): Promise<HardhatRuntimeEnvironment>;
/**
 * Gets the global Hardhat Runtime Environment, or creates it if it doesn't exist.
 *
 * This function is meant to be used when `hardhat` is imported as a library.
 */
export declare function getOrCreateGlobalHardhatRuntimeEnvironment(): Promise<HardhatRuntimeEnvironment>;
//# sourceMappingURL=hre-initialization.d.ts.map