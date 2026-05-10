import type { HardhatPlugin } from "../../../types/plugins.js";
/**
 * Validate that a plugin is installed and that its peer dependencies are
 * installed and satisfy the version constraints.
 *
 * @param basePathForNpmResolution the dir path for node module resolution
 * @param plugin the plugin to be validated
 * @param originalError the original error why we are running this function
 * @throws {HardhatError} with descriptor:
 * - {@link HardhatError.ERRORS.CORE.PLUGINS.PLUGIN_NOT_INSTALLED} if the plugin is
 * not installed as an npm package
 * - {@link HardhatError.ERRORS.CORE.PLUGINS.PLUGIN_MISSING_DEPENDENCY} if the
 * plugin's package peer dependency is not installed
 * - {@link HardhatError.ERRORS.CORE.PLUGINS.DEPENDENCY_VERSION_MISMATCH} if the
 * plugin's package peer dependency is installed but has the wrong version
 */
export declare function detectPluginNpmDependencyProblems(basePathForNpmResolution: string, plugin: HardhatPlugin, originalError: Error): Promise<void>;
//# sourceMappingURL=detect-plugin-npm-dependency-problems.d.ts.map