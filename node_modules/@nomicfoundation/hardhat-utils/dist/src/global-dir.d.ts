/**
 * Sets a mock cache directory for getCacheDir. This is intended for testing
 * purposes only, to isolate tests from the real global cache.
 *
 * @param dir The directory path to use as the mock cache directory.
 */
export declare function setMockCacheDir(dir: string): void;
/**
 * Resets the mock cache directory set by setMockCacheDir.
 * Call this in test cleanup to restore normal behavior.
 */
export declare function resetMockCacheDir(): void;
/**
 * Returns the configuration directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat configuration directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getConfigDir(packageName?: string): Promise<string>;
/**
 * Returns the cache directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * For testing purposes, the cache directory can be overridden using
 * setMockCacheDir(). This is intended to isolate tests from the real
 * global cache.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns The path to the hardhat cache directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getCacheDir(packageName?: string): Promise<string>;
/**
 * Returns the telemetry directory path for a given package (defaults to "hardhat").
 * Ensures that the directory exists before returning the path.
 *
 * @param packageName The name of the package for which to generate paths. Defaults to "hardhat" if no package name is provided.
 * @returns A promise that resolves to the path of the telemetry directory.
 * @throws FileSystemAccessError for any error.
 */
export declare function getTelemetryDir(packageName?: string): Promise<string>;
//# sourceMappingURL=global-dir.d.ts.map