import { CustomError } from "@nomicfoundation/hardhat-utils/error";
export declare class UsingHardhat2PluginError extends CustomError {
    readonly callerRelativePath: string | undefined;
    constructor();
}
/**
 * Returns the relative path of the file that called a deprecated Hardhat
 * plugin API, based on the stack trace. This helps identify which plugin
 * file is triggering usage of Hardhat 2 APIs in a Hardhat 3 project.
 *
 * @param {number} [depth=5] The stack trace depth to locate the caller's
 * source file. By default, depth 5 is used because:
 *   0 = message
 *   1 = getCallerRelativePath
 *   2 = UsingHardhat2PluginError constructor
 *   3 = throwUsingHardhat2PluginError
 *   4 = deprecated function
 *   5 = actual caller (the plugin file)
 *
 * @returns {string|undefined} The shortened relative path of the caller file,
 * or undefined if not found.
 *
 * @example
 * If the stack trace is:
 * // Error
 * //     at getCallerRelativePath (src/internal/using-hardhat2-plugin-errors.ts:34:15)
 * //     at UsingHardhat2PluginError.constructor (src/internal/using-hardhat2-plugin-errors.ts:7:3)
 * //     at throwUsingHardhat2PluginError (src/internal/using-hardhat2-plugin-errors.ts:90:3)
 * //     at deprecatedFunction (plugins/example-plugin/deprecated.js:50:10)
 * //     at main (plugins/example-plugin/index.js:100:5)
 * Calling getCallerRelativePath() returns 'plugins/example-plugin/index.js'
 */
export declare function getCallerRelativePath(depth?: number): string | undefined;
export declare function throwUsingHardhat2PluginError(): never;
//# sourceMappingURL=using-hardhat2-plugin-errors.d.ts.map