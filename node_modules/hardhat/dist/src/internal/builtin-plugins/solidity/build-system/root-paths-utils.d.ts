/**
 * @file This file contains utilities to work with the path of root files.
 *
 * The SolidityBuildSystem has a different way to referring to root files when
 * they come from npm packages, which is the `npm:<package>/file` string. This
 * file contains utilities to work with these paths.
 *
 * The main reason for this `npm:` prefix is to make the SolidityBuildSystem
 * APIs ergonomic, instead of using a tagged union type everywhere, but it adds
 * some complexity to the implementation.
 */
import type { ResolvedFile } from "../../../../types/solidity/resolved-file.js";
/**
 * The result of parsing a root path.
 * @see parseRootPath
 */
export type ParsedRootPath = {
    npmPath: string;
} | {
    fsPath: string;
};
/**
 * Parses the path of a root file, as received by the SolidityBuildSystem APIs.
 *
 * @param rootPath The root path.
 * @returns The parsed root path.
 */
export declare function parseRootPath(rootPath: string): {
    npmPath: string;
} | {
    fsPath: string;
};
/**
 * Returns true if the given root path is for a npm file.
 */
export declare function isNpmRootPath(rootPath: string): boolean;
/**
 * Returns an npm root path for the given module.
 * @param mod A module name, i.e. `<package>/<file>`.
 * @returns The npm root path.
 */
export declare function npmModuleToNpmRootPath(mod: string): string;
/**
 * Returns true if the given parsed root path is for a npm file.
 */
export declare function isNpmParsedRootPath(parsedRootPath: ParsedRootPath): parsedRootPath is {
    npmPath: string;
};
/**
 * Formats the path of a root file, making it compatible with the
 * SolidityBuildSystem APIs, which expect an absolute path or an npm: root path.
 *
 * @param userSourceName The user source name of the root file.
 * @param rootFile The root file.
 * @returns The formatted path.
 */
export declare function formatRootPath(userSourceName: string, rootFile: ResolvedFile): string;
//# sourceMappingURL=root-paths-utils.d.ts.map