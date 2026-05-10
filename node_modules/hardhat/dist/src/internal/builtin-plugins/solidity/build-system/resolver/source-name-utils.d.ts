/**
 * Transforms an fs path into a sourceName or import path, by normalizing their
 * path separators to /.
 *
 * Note that source
 *
 * Note: This function is exported for testing purposes, but it's not meant to
 * be used outside of the resolver.
 */
export declare function fsPathToSourceNamePath(fsPath: string): string;
/**
 * Transforms a sourceName or import path into an fs path, by normalizing their
 * path separators to /.
 *
 * Note: This function is exported for testing purposes, but it's not meant to
 * be used outside of the resolver.
 */
export declare function sourceNamePathToFsPath(sourceNamePath: string): string;
/**
 * The equivalent of path.join but for sourceName or import paths, not fs paths.
 *
 * Note: This function preserves trailing slashes.
 */
export declare function sourceNamePathJoin(...parts: string[]): string;
//# sourceMappingURL=source-name-utils.d.ts.map