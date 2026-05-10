"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLicenses = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
/**
 * The path segment used to signify that a file is part of a package.
 */
const NODE_MODULE_SEGMENT = 'node_modules';
/**
 * String constant for the NPM recommended custom license wording.
 *
 * See: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#license
 *
 * Example:
 * ```
 * {
 *   "license" : "SEE LICENSE IN <filename>"
 * }
 * ```
 */
const CUSTOM_LICENSE_TEXT = 'SEE LICENSE IN ';
/**
 * A list of commonly named license files found within packages.
 */
const LICENSE_FILES = ['LICENSE', 'LICENSE.txt', 'LICENSE.md'];
/**
 * Header text that will be added to the top of the output license extraction file.
 */
const EXTRACTION_FILE_HEADER = '';
/**
 * The package entry separator to use within the output license extraction file.
 */
const EXTRACTION_FILE_SEPARATOR = '-'.repeat(80) + '\n';
/**
 * Extracts license information for each node module package included in the output
 * files of the built code. This includes JavaScript and CSS output files. The esbuild
 * metafile generated during the bundling steps is used as the source of information
 * regarding what input files where included and where they are located. A path segment
 * of `node_modules` is used to indicate that a file belongs to a package and its license
 * should be include in the output licenses file.
 *
 * The package name and license field are extracted from the `package.json` file for the
 * package. If a license file (e.g., `LICENSE`) is present in the root of the package, it
 * will also be included in the output licenses file.
 *
 * @param metafile An esbuild metafile object.
 * @param rootDirectory The root directory of the workspace.
 * @returns A string containing the content of the output licenses file.
 */
async function extractLicenses(metafile, rootDirectory) {
    let extractedLicenseContent = `${EXTRACTION_FILE_HEADER}\n${EXTRACTION_FILE_SEPARATOR}`;
    const seenPaths = new Set();
    const seenPackages = new Set();
    for (const entry of Object.values(metafile.outputs)) {
        for (const [inputPath, { bytesInOutput }] of Object.entries(entry.inputs)) {
            // Skip if not included in output
            if (bytesInOutput <= 0) {
                continue;
            }
            // Skip already processed paths
            if (seenPaths.has(inputPath)) {
                continue;
            }
            seenPaths.add(inputPath);
            // Skip non-package paths
            if (!inputPath.includes(NODE_MODULE_SEGMENT)) {
                continue;
            }
            // Extract the package name from the path
            let baseDirectory = node_path_1.default.join(rootDirectory, inputPath);
            let nameOrScope, nameOrFile;
            let found = false;
            while (baseDirectory !== node_path_1.default.dirname(baseDirectory)) {
                const segment = node_path_1.default.basename(baseDirectory);
                if (segment === NODE_MODULE_SEGMENT) {
                    found = true;
                    break;
                }
                nameOrFile = nameOrScope;
                nameOrScope = segment;
                baseDirectory = node_path_1.default.dirname(baseDirectory);
            }
            // Skip non-package path edge cases that are not caught in the includes check above
            if (!found || !nameOrScope) {
                continue;
            }
            const packageName = nameOrScope.startsWith('@')
                ? `${nameOrScope}/${nameOrFile}`
                : nameOrScope;
            const packageDirectory = node_path_1.default.join(baseDirectory, packageName);
            // Load the package's metadata to find the package's name, version, and license type
            const packageJsonPath = node_path_1.default.join(packageDirectory, 'package.json');
            let packageJson;
            try {
                packageJson = JSON.parse(await (0, promises_1.readFile)(packageJsonPath, 'utf-8'));
            }
            catch {
                // Invalid package
                continue;
            }
            // Skip already processed packages
            const packageId = `${packageName}@${packageJson.version}`;
            if (seenPackages.has(packageId)) {
                continue;
            }
            seenPackages.add(packageId);
            // Attempt to find license text inside package
            let licenseText = '';
            if (typeof packageJson.license === 'string' &&
                packageJson.license.toLowerCase().startsWith(CUSTOM_LICENSE_TEXT)) {
                // Attempt to load the package's custom license
                let customLicensePath;
                const customLicenseFile = node_path_1.default.normalize(packageJson.license.slice(CUSTOM_LICENSE_TEXT.length + 1).trim());
                if (customLicenseFile.startsWith('..') || node_path_1.default.isAbsolute(customLicenseFile)) {
                    // Path is attempting to access files outside of the package
                    // TODO: Issue warning?
                }
                else {
                    customLicensePath = node_path_1.default.join(packageDirectory, customLicenseFile);
                    try {
                        licenseText = await (0, promises_1.readFile)(customLicensePath, 'utf-8');
                        break;
                    }
                    catch { }
                }
            }
            else {
                // Search for a license file within the root of the package
                for (const potentialLicense of LICENSE_FILES) {
                    const packageLicensePath = node_path_1.default.join(packageDirectory, potentialLicense);
                    try {
                        licenseText = await (0, promises_1.readFile)(packageLicensePath, 'utf-8');
                        break;
                    }
                    catch { }
                }
            }
            // Generate the package's license entry in the output content
            extractedLicenseContent += `Package: ${packageJson.name}\n`;
            extractedLicenseContent += `License: ${JSON.stringify(packageJson.license, null, 2)}\n`;
            extractedLicenseContent += `\n${licenseText}\n`;
            extractedLicenseContent += EXTRACTION_FILE_SEPARATOR;
        }
    }
    return extractedLicenseContent;
}
exports.extractLicenses = extractLicenses;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGljZW5zZS1leHRyYWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2xpY2Vuc2UtZXh0cmFjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILCtDQUE0QztBQUM1QywwREFBNkI7QUFFN0I7O0dBRUc7QUFDSCxNQUFNLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztBQUUzQzs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sbUJBQW1CLEdBQUcsaUJBQWlCLENBQUM7QUFFOUM7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBRyxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFFL0Q7O0dBRUc7QUFDSCxNQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztBQUVsQzs7R0FFRztBQUNILE1BQU0seUJBQXlCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7QUFFeEQ7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0ksS0FBSyxVQUFVLGVBQWUsQ0FBQyxRQUFrQixFQUFFLGFBQXFCO0lBQzdFLElBQUksdUJBQXVCLEdBQUcsR0FBRyxzQkFBc0IsS0FBSyx5QkFBeUIsRUFBRSxDQUFDO0lBRXhGLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFDcEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUV2QyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ25ELEtBQUssTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENB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QkFBaUIsQ0FBQyxFQUFFO29CQUM1RSw0REFBNEQ7b0JBQzVELHVCQUF1QjtpQkFDeEI7cUJBQU07b0JBQ0wsaUJBQWlCLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztvQkFDbkUsSUFBSTt3QkFDRixXQUFXLEdBQUcsTUFBTSxJQUFBLG1CQUFRLEVBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ3pELE1BQU07cUJBQ1A7b0JBQUMsTUFBTSxHQUFFO2lCQUNYO2FBQ0Y7aUJBQU07Z0JBQ0wsMkRBQTJEO2dCQUMzRCxLQUFLLE1BQU0sZ0JBQWdCLElBQUksYUFBYSxFQUFFO29CQUM1QyxNQUFNLGtCQUFrQixHQUFHLG1CQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQ3pFLElBQUk7d0JBQ0YsV0FBVyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO3dCQUMxRCxNQUFNO3FCQUNQO29CQUFDLE1BQU0sR0FBRTtpQkFDWDthQUNGO1lBRUQsNkRBQTZEO1lBQzdELHVCQUF1QixJQUFJLFlBQVksV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDO1lBQzVELHVCQUF1QixJQUFJLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hGLHVCQUF1QixJQUFJLEtBQUssV0FBVyxJQUFJLENBQUM7WUFDaEQsdUJBQXVCLElBQUkseUJBQXlCLENBQUM7U0FDdEQ7S0FDRjtJQUVELE9BQU8sdUJBQXVCLENBQUM7QUFDakMsQ0FBQztBQWpIRCwwQ0FpSEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBNZXRhZmlsZSB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbi8qKlxuICogVGhlIHBhdGggc2VnbWVudCB1c2VkIHRvIHNpZ25pZnkgdGhhdCBhIGZpbGUgaXMgcGFydCBvZiBhIHBhY2thZ2UuXG4gKi9cbmNvbnN0IE5PREVfTU9EVUxFX1NFR01FTlQgPSAnbm9kZV9tb2R1bGVzJztcblxuLyoqXG4gKiBTdHJpbmcgY29uc3RhbnQgZm9yIHRoZSBOUE0gcmVjb21tZW5kZWQgY3VzdG9tIGxpY2Vuc2Ugd29yZGluZy5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZG9jcy5ucG1qcy5jb20vY2xpL3Y5L2NvbmZpZ3VyaW5nLW5wbS9wYWNrYWdlLWpzb24jbGljZW5zZVxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIHtcbiAqICAgXCJsaWNlbnNlXCIgOiBcIlNFRSBMSUNFTlNFIElOIDxmaWxlbmFtZT5cIlxuICogfVxuICogYGBgXG4gKi9cbmNvbnN0IENVU1RPTV9MSUNFTlNFX1RFWFQgPSAnU0VFIExJQ0VOU0UgSU4gJztcblxuLyoqXG4gKiBBIGxpc3Qgb2YgY29tbW9ubHkgbmFtZWQgbGljZW5zZSBmaWxlcyBmb3VuZCB3aXRoaW4gcGFja2FnZXMuXG4gKi9cbmNvbnN0IExJQ0VOU0VfRklMRVMgPSBbJ0xJQ0VOU0UnLCAnTElDRU5TRS50eHQnLCAnTElDRU5TRS5tZCddO1xuXG4vKipcbiAqIEhlYWRlciB0ZXh0IHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgdG9wIG9mIHRoZSBvdXRwdXQgbGljZW5zZSBleHRyYWN0aW9uIGZpbGUuXG4gKi9cbmNvbnN0IEVYVFJBQ1RJT05fRklMRV9IRUFERVIgPSAnJztcblxuLyoqXG4gKiBUaGUgcGFja2FnZSBlbnRyeSBzZXBhcmF0b3IgdG8gdXNlIHdpdGhpbiB0aGUgb3V0cHV0IGxpY2Vuc2UgZXh0cmFjdGlvbiBmaWxlLlxuICovXG5jb25zdCBFWFRSQUNUSU9OX0ZJTEVfU0VQQVJBVE9SID0gJy0nLnJlcGVhdCg4MCkgKyAnXFxuJztcblxuLyoqXG4gKiBFeHRyYWN0cyBsaWNlbnNlIGluZm9ybWF0aW9uIGZvciBlYWNoIG5vZGUgbW9kdWxlIHBhY2thZ2UgaW5jbHVkZWQgaW4gdGhlIG91dHB1dFxuICogZmlsZXMgb2YgdGhlIGJ1aWx0IGNvZGUuIFRoaXMgaW5jbHVkZXMgSmF2YVNjcmlwdCBhbmQgQ1NTIG91dHB1dCBmaWxlcy4gVGhlIGVzYnVpbGRcbiAqIG1ldGFmaWxlIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGJ1bmRsaW5nIHN0ZXBzIGlzIHVzZWQgYXMgdGhlIHNvdXJjZSBvZiBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHdoYXQgaW5wdXQgZmlsZXMgd2hlcmUgaW5jbHVkZWQgYW5kIHdoZXJlIHRoZXkgYXJlIGxvY2F0ZWQuIEEgcGF0aCBzZWdtZW50XG4gKiBvZiBgbm9kZV9tb2R1bGVzYCBpcyB1c2VkIHRvIGluZGljYXRlIHRoYXQgYSBmaWxlIGJlbG9uZ3MgdG8gYSBwYWNrYWdlIGFuZCBpdHMgbGljZW5zZVxuICogc2hvdWxkIGJlIGluY2x1ZGUgaW4gdGhlIG91dHB1dCBsaWNlbnNlcyBmaWxlLlxuICpcbiAqIFRoZSBwYWNrYWdlIG5hbWUgYW5kIGxpY2Vuc2UgZmllbGQgYXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBgcGFja2FnZS5qc29uYCBmaWxlIGZvciB0aGVcbiAqIHBhY2thZ2UuIElmIGEgbGljZW5zZSBmaWxlIChlLmcuLCBgTElDRU5TRWApIGlzIHByZXNlbnQgaW4gdGhlIHJvb3Qgb2YgdGhlIHBhY2thZ2UsIGl0XG4gKiB3aWxsIGFsc28gYmUgaW5jbHVkZWQgaW4gdGhlIG91dHB1dCBsaWNlbnNlcyBmaWxlLlxuICpcbiAqIEBwYXJhbSBtZXRhZmlsZSBBbiBlc2J1aWxkIG1ldGFmaWxlIG9iamVjdC5cbiAqIEBwYXJhbSByb290RGlyZWN0b3J5IFRoZSByb290IGRpcmVjdG9yeSBvZiB0aGUgd29ya3NwYWNlLlxuICogQHJldHVybnMgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgY29udGVudCBvZiB0aGUgb3V0cHV0IGxpY2Vuc2VzIGZpbGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0TGljZW5zZXMobWV0YWZpbGU6IE1ldGFmaWxlLCByb290RGlyZWN0b3J5OiBzdHJpbmcpIHtcbiAgbGV0IGV4dHJhY3RlZExpY2Vuc2VDb250ZW50ID0gYCR7RVhUUkFDVElPTl9GSUxFX0hFQURFUn1cXG4ke0VYVFJBQ1RJT05fRklMRV9TRVBBUkFUT1J9YDtcblxuICBjb25zdCBzZWVuUGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgc2VlblBhY2thZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBPYmplY3QudmFsdWVzKG1ldGFmaWxlLm91dHB1dHMpKSB7XG4gICAgZm9yIChjb25zdCBbaW5wdXRQYXRoLCB7IGJ5dGVzSW5PdXRwdXQgfV0gb2YgT2JqZWN0LmVudHJpZXMoZW50cnkuaW5wdXRzKSkge1xuICAgICAgLy8gU2tpcCBpZiBub3QgaW5jbHVkZWQgaW4gb3V0cHV0XG4gICAgICBpZiAoYnl0ZXNJbk91dHB1dCA8PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGFscmVhZHkgcHJvY2Vzc2VkIHBhdGhzXG4gICAgICBpZiAoc2VlblBhdGhzLmhhcyhpbnB1dFBhdGgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2VlblBhdGhzLmFkZChpbnB1dFBhdGgpO1xuXG4gICAgICAvLyBTa2lwIG5vbi1wYWNrYWdlIHBhdGhzXG4gICAgICBpZiAoIWlucHV0UGF0aC5pbmNsdWRlcyhOT0RFX01PRFVMRV9TRUdNRU5UKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXh0cmFjdCB0aGUgcGFja2FnZSBuYW1lIGZyb20gdGhlIHBhdGhcbiAgICAgIGxldCBiYXNlRGlyZWN0b3J5ID0gcGF0aC5qb2luKHJvb3REaXJlY3RvcnksIGlucHV0UGF0aCk7XG4gICAgICBsZXQgbmFtZU9yU2NvcGUsIG5hbWVPckZpbGU7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChiYXNlRGlyZWN0b3J5ICE9PSBwYXRoLmRpcm5hbWUoYmFzZURpcmVjdG9yeSkpIHtcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IHBhdGguYmFzZW5hbWUoYmFzZURpcmVjdG9yeSk7XG4gICAgICAgIGlmIChzZWdtZW50ID09PSBOT0RFX01PRFVMRV9TRUdNRU5UKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgbmFtZU9yRmlsZSA9IG5hbWVPclNjb3BlO1xuICAgICAgICBuYW1lT3JTY29wZSA9IHNlZ21lbnQ7XG4gICAgICAgIGJhc2VEaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUoYmFzZURpcmVjdG9yeSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgbm9uLXBhY2thZ2UgcGF0aCBlZGdlIGNhc2VzIHRoYXQgYXJlIG5vdCBjYXVnaHQgaW4gdGhlIGluY2x1ZGVzIGNoZWNrIGFib3ZlXG4gICAgICBpZiAoIWZvdW5kIHx8ICFuYW1lT3JTY29wZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSBuYW1lT3JTY29wZS5zdGFydHNXaXRoKCdAJylcbiAgICAgICAgPyBgJHtuYW1lT3JTY29wZX0vJHtuYW1lT3JGaWxlfWBcbiAgICAgICAgOiBuYW1lT3JTY29wZTtcbiAgICAgIGNvbnN0IHBhY2thZ2VEaXJlY3RvcnkgPSBwYXRoLmpvaW4oYmFzZURpcmVjdG9yeSwgcGFja2FnZU5hbWUpO1xuXG4gICAgICAvLyBMb2FkIHRoZSBwYWNrYWdlJ3MgbWV0YWRhdGEgdG8gZmluZCB0aGUgcGFja2FnZSdzIG5hbWUsIHZlcnNpb24sIGFuZCBsaWNlbnNlIHR5cGVcbiAgICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHBhdGguam9pbihwYWNrYWdlRGlyZWN0b3J5LCAncGFja2FnZS5qc29uJyk7XG4gICAgICBsZXQgcGFja2FnZUpzb247XG4gICAgICB0cnkge1xuICAgICAgICBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZEZpbGUocGFja2FnZUpzb25QYXRoLCAndXRmLTgnKSkgYXMge1xuICAgICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAgICB2ZXJzaW9uOiBzdHJpbmc7XG4gICAgICAgICAgLy8gVGhlIG9iamVjdCBmb3JtIGlzIGRlcHJlY2F0ZWQgYW5kIHNob3VsZCBvbmx5IGJlIHByZXNlbnQgaW4gb2xkIHBhY2thZ2VzXG4gICAgICAgICAgbGljZW5zZT86IHN0cmluZyB8IHsgdHlwZTogc3RyaW5nIH07XG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSW52YWxpZCBwYWNrYWdlXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGFscmVhZHkgcHJvY2Vzc2VkIHBhY2thZ2VzXG4gICAgICBjb25zdCBwYWNrYWdlSWQgPSBgJHtwYWNrYWdlTmFtZX1AJHtwYWNrYWdlSnNvbi52ZXJzaW9ufWA7XG4gICAgICBpZiAoc2VlblBhY2thZ2VzLmhhcyhwYWNrYWdlSWQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2VlblBhY2thZ2VzLmFkZChwYWNrYWdlSWQpO1xuXG4gICAgICAvLyBBdHRlbXB0IHRvIGZpbmQgbGljZW5zZSB0ZXh0IGluc2lkZSBwYWNrYWdlXG4gICAgICBsZXQgbGljZW5zZVRleHQgPSAnJztcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIHBhY2thZ2VKc29uLmxpY2Vuc2UgPT09ICdzdHJpbmcnICYmXG4gICAgICAgIHBhY2thZ2VKc29uLmxpY2Vuc2UudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKENVU1RPTV9MSUNFTlNFX1RFWFQpXG4gICAgICApIHtcbiAgICAgICAgLy8gQXR0ZW1wdCB0byBsb2FkIHRoZSBwYWNrYWdlJ3MgY3VzdG9tIGxpY2Vuc2VcbiAgICAgICAgbGV0IGN1c3RvbUxpY2Vuc2VQYXRoO1xuICAgICAgICBjb25zdCBjdXN0b21MaWNlbnNlRmlsZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgIHBhY2thZ2VKc29uLmxpY2Vuc2Uuc2xpY2UoQ1VTVE9NX0xJQ0VOU0VfVEVYVC5sZW5ndGggKyAxKS50cmltKCksXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjdXN0b21MaWNlbnNlRmlsZS5zdGFydHNXaXRoKCcuLicpIHx8IHBhdGguaXNBYnNvbHV0ZShjdXN0b21MaWNlbnNlRmlsZSkpIHtcbiAgICAgICAgICAvLyBQYXRoIGlzIGF0dGVtcHRpbmcgdG8gYWNjZXNzIGZpbGVzIG91dHNpZGUgb2YgdGhlIHBhY2thZ2VcbiAgICAgICAgICAvLyBUT0RPOiBJc3N1ZSB3YXJuaW5nP1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1c3RvbUxpY2Vuc2VQYXRoID0gcGF0aC5qb2luKHBhY2thZ2VEaXJlY3RvcnksIGN1c3RvbUxpY2Vuc2VGaWxlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGljZW5zZVRleHQgPSBhd2FpdCByZWFkRmlsZShjdXN0b21MaWNlbnNlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNlYXJjaCBmb3IgYSBsaWNlbnNlIGZpbGUgd2l0aGluIHRoZSByb290IG9mIHRoZSBwYWNrYWdlXG4gICAgICAgIGZvciAoY29uc3QgcG90ZW50aWFsTGljZW5zZSBvZiBMSUNFTlNFX0ZJTEVTKSB7XG4gICAgICAgICAgY29uc3QgcGFja2FnZUxpY2Vuc2VQYXRoID0gcGF0aC5qb2luKHBhY2thZ2VEaXJlY3RvcnksIHBvdGVudGlhbExpY2Vuc2UpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsaWNlbnNlVGV4dCA9IGF3YWl0IHJlYWRGaWxlKHBhY2thZ2VMaWNlbnNlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gR2VuZXJhdGUgdGhlIHBhY2thZ2UncyBsaWNlbnNlIGVudHJ5IGluIHRoZSBvdXRwdXQgY29udGVudFxuICAgICAgZXh0cmFjdGVkTGljZW5zZUNvbnRlbnQgKz0gYFBhY2thZ2U6ICR7cGFja2FnZUpzb24ubmFtZX1cXG5gO1xuICAgICAgZXh0cmFjdGVkTGljZW5zZUNvbnRlbnQgKz0gYExpY2Vuc2U6ICR7SlNPTi5zdHJpbmdpZnkocGFja2FnZUpzb24ubGljZW5zZSwgbnVsbCwgMil9XFxuYDtcbiAgICAgIGV4dHJhY3RlZExpY2Vuc2VDb250ZW50ICs9IGBcXG4ke2xpY2Vuc2VUZXh0fVxcbmA7XG4gICAgICBleHRyYWN0ZWRMaWNlbnNlQ29udGVudCArPSBFWFRSQUNUSU9OX0ZJTEVfU0VQQVJBVE9SO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBleHRyYWN0ZWRMaWNlbnNlQ29udGVudDtcbn1cbiJdfQ==