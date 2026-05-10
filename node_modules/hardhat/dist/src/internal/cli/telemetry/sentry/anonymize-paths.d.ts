export declare const ANONYMIZED_PATH = "<user-path>";
/**
 * Anonymizes all user paths contained in str, except for:
 *   - Node.js core modules
 *   - node_modules files
 *   - Yarn cache files
 *   - pnpm global store
 *   - bare file names (i.e. foo.json)
 *
 * Note that in the case where a path is not a Node.js core module,
 * it does anonymize the directory containing the outermost node_modules or
 * yarn cache folder.
 * e.g. `/home/user/node_modules/my-package/node_modules/some-other-package`
 * will be anonymized to `<user-path>/node_modules/my-package/node_modules/some-other-package`.
 *
 * This function supports both Windows and Unix paths, as well as `file://` URLs,
 * preserving the original format.
 *
 * It normalizes all path separators to `/`.
 *
 * It also supports all major node package managers, including pnpm, yarn, and npm.
 *
 * Finally, it should work with strings that are paths in their entirety, as well as
 * messages that contain paths, such as error messages.
 **/
export declare function anonymizeUserPaths(str: string): string;
//# sourceMappingURL=anonymize-paths.d.ts.map