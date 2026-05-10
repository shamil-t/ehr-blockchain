/**
 * Parses a direct import as if it were an npm import, returning `undefined`
 * if the format is invalid.
 *
 * Note: The returned subpath is not an fs path, and always use path.posix.sep
 */
export declare function parseNpmDirectImport(directImport: string): {
    package: string;
    subpath: string;
} | undefined;
/**
 * Parses an npm module or prefix of a module, returning the name of the
 * package.
 *
 * The reason it supports prefixes is because we want to extract npm package
 * names from remappings, which may be just `@openzeppelin/contracts/`, and
 * not an entire module.
 *
 * @param npmModuleOrPrefixOfModule The npm module or prefix of a module.
 * @returns The name of the package.
 */
export declare function getNpmPackageName(npmModuleOrPrefixOfModule: string): string | undefined;
//# sourceMappingURL=npm-module-parsing.d.ts.map