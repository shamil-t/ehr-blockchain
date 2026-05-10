export type PackageExports = PackageExportPath | {
    [path: PackageExportsEntry]: PackageExportsValue;
    [condition: string]: PackageExportsValue;
};
/** Allows "." and "./{name}" */
export type PackageExportsEntry = `.${string}`;
/** Internal path */
export type PackageExportPath = `./${string}`;
export type PackageExportsValue = PackageExportPath | null | {
    [condition: string]: PackageExportsValue;
} | PackageExportsValue[];
/**
 * The structure of a `package.json` file. This is a subset of the actual
 * `package.json` file, if you need to access other fields you add them here.
 */
export interface PackageJson {
    name: string;
    version: string;
    description?: string;
    type?: "commonjs" | "module";
    engines?: {
        node?: string;
    };
    exports?: PackageExports;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
}
/**
 * Searches for the nearest `package.json` file, starting from the directory of
 * the provided file path or url string and moving up the directory tree.
 *
 * @param pathOrUrl A path or url string from which to start the search. The url
 * must be a file url. This is useful when you want to find the nearest
 * `package.json` file relative to the current module, as you can use
 * `import.meta.url`.
 * @returns The absolute path to the nearest `package.json` file.
 * @throws PackageJsonNotFoundError If no `package.json` file is found.
 */
export declare function findClosestPackageJson(pathOrUrl: string): Promise<string>;
/**
 * Reads the nearest `package.json` file, starting from provided path or url
 * string and moving up the directory tree.
 *
 * @param pathOrUrl A path or url string from which to start the search. The url
 * must be a file url. This is useful when you want to find the nearest
 * `package.json` file relative to the current module, as you can use
 * `import.meta.url`.
 * @returns The contents of the nearest `package.json` file, parsed as a
 * {@link PackageJson} object.
 * @throws PackageJsonNotFoundError If no `package.json` file is found.
 * @throws PackageJsonReadError If the `package.json` file is found but cannot
 * be read.
 */
export declare function readClosestPackageJson(pathOrUrl: string): Promise<PackageJson>;
/**
 * Finds the root directory of the nearest package, starting from the provided
 * path or url string and moving up the directory tree.
 *
 * This function uses `findClosestPackageJson` to find the nearest `package.json`
 * file and then returns the directory that contains that file.
 *
 * @param pathOrUrl A path or url string from which to start the search. The url
 * must be a file url. This is useful when you want to find the nearest
 * `package.json` file relative to the current module, as you can use
 * `import.meta.url`.
 * @returns The absolute path of the root directory of the nearest package.
 */
export declare function findClosestPackageRoot(filePathOrUrl: string): Promise<string>;
/**
 * Resolve a dependency starting by following the Node.js resolution algorithm
 * starting from `from`, and returns the dependency's package.json file, or
 * `undefined` if the dependency is not found.
 *
 * Note: This function uses Node.js's CommonJS resolution algorithm to find the
 * package.json file, and works with packages using package#exports, even if
 * they don't export the package.json file.
 *
 * @param from The absolute path from where to start the search (i.e. the file
 *  importing the dependency, or its package root).
 * @param dependencyPackageName The name of the package to find.
 * @returns The absolute real path (resolved symlinks) of the package.json.
 */
export declare function findDependencyPackageJson(from: string, dependencyPackageName: string): Promise<string | undefined>;
export { PackageJsonNotFoundError, PackageJsonReadError, } from "./errors/package.js";
//# sourceMappingURL=package.d.ts.map