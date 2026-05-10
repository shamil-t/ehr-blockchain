import type { HardhatUserConfig } from "../types/config.js";
/**
 * Resolves the path to the Hardhat config file using these rules:
 *  - If the user provided a path, that path is returned.
 *  - Otherwise, if the HARDHAT_CONFIG env var is set, that path is returned.
 *  - Otherwise, the closest Hardhat config file to the current working
 *    directory is returned.
 *
 * @param userProvidedPath An optional path to the Hardhat config file, provided
 * by the user.
 * @returns The path to the Hardhat config file, as an absolute path.
 * @throws HardhatError If no Hardhat config file can be found.
 */
export declare function resolveHardhatConfigPath(userProvidedPath?: string): Promise<string>;
/**
 * Finds the closest Hardhat config file to the current working directory.
 *
 * @returns The absolute path to the closest Hardhat config file.
 * @throw HardhatError if no Hardhat config file can be found.
 */
export declare function findClosestHardhatConfig(from?: string): Promise<string>;
/**
 * Imports the user config and returns it.
 * @param configPath The path to the config file.
 * @returns The user config.
 */
export declare function importUserConfig(configPath: string): Promise<HardhatUserConfig>;
//# sourceMappingURL=config-loading.d.ts.map