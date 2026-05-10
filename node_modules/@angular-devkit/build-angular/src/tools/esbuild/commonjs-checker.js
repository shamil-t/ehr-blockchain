"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCommonJSModules = void 0;
/**
 * Checks the input files of a build to determine if any of the files included
 * in the build are not ESM. ESM files can be tree-shaken and otherwise optimized
 * in ways that CommonJS and other module formats cannot. The esbuild metafile
 * information is used as the basis for the analysis as it contains information
 * for each input file including its respective format.
 *
 * If any allowed dependencies are provided via the `allowedCommonJsDependencies`
 * parameter, both the direct import and any deep imports will be ignored and no
 * diagnostic will be generated.
 *
 * If a module has been issued a diagnostic message, then all descendant modules
 * will not be checked. This prevents a potential massive amount of inactionable
 * messages since the initial module import is the cause of the problem.
 *
 * @param metafile An esbuild metafile object to check.
 * @param allowedCommonJsDependencies An optional list of allowed dependencies.
 * @returns Zero or more diagnostic messages for any non-ESM modules.
 */
function checkCommonJSModules(metafile, allowedCommonJsDependencies) {
    const messages = [];
    const allowedRequests = new Set(allowedCommonJsDependencies);
    // Ignore Angular locale definitions which are currently UMD
    allowedRequests.add('@angular/common/locales');
    // Ignore zone.js due to it currently being built with a UMD like structure.
    // Once the build output is updated to be fully ESM, this can be removed.
    allowedRequests.add('zone.js');
    // Find all entry points that contain code (JS/TS)
    const files = [];
    for (const { entryPoint } of Object.values(metafile.outputs)) {
        if (!entryPoint) {
            continue;
        }
        if (!isPathCode(entryPoint)) {
            continue;
        }
        files.push(entryPoint);
    }
    // Track seen files so they are only analyzed once.
    // Bundler runtime code is also ignored since it cannot be actionable.
    const seenFiles = new Set(['<runtime>']);
    // Analyze the files present by walking the import graph
    let currentFile;
    while ((currentFile = files.shift())) {
        const input = metafile.inputs[currentFile];
        for (const imported of input.imports) {
            // Ignore imports that were already seen or not originally in the code (bundler injected)
            if (!imported.original || seenFiles.has(imported.path)) {
                continue;
            }
            seenFiles.add(imported.path);
            // Only check actual code files
            if (!isPathCode(imported.path)) {
                continue;
            }
            // Check if non-relative import is ESM format and issue a diagnostic if the file is not allowed
            if (!isPotentialRelative(imported.original) &&
                metafile.inputs[imported.path].format !== 'esm') {
                const request = imported.original;
                let notAllowed = true;
                if (allowedRequests.has(request)) {
                    notAllowed = false;
                }
                else {
                    // Check for deep imports of allowed requests
                    for (const allowed of allowedRequests) {
                        if (request.startsWith(allowed + '/')) {
                            notAllowed = false;
                            break;
                        }
                    }
                }
                if (notAllowed) {
                    // Issue a diagnostic message and skip all descendants since they are also most
                    // likely not ESM but solved by addressing this import.
                    messages.push(createCommonJSModuleError(request, currentFile));
                    continue;
                }
            }
            // Add the path so that its imports can be checked
            files.push(imported.path);
        }
    }
    return messages;
}
exports.checkCommonJSModules = checkCommonJSModules;
/**
 * Determines if a file path has an extension that is a JavaScript or TypeScript
 * code file.
 *
 * @param name A path to check for code file extensions.
 * @returns True, if a code file path; false, otherwise.
 */
function isPathCode(name) {
    return /\.[cm]?[jt]sx?$/.test(name);
}
/**
 * Test an import module specifier to determine if the string potentially references a relative file.
 * npm packages should not start with a period so if the first character is a period than it is not a
 * package. While this is sufficient for the use case in the CommmonJS checker, only checking the
 * first character does not definitely indicate the specifier is a relative path.
 *
 * @param specifier An import module specifier.
 * @returns True, if specifier is potentially relative; false, otherwise.
 */
function isPotentialRelative(specifier) {
    if (specifier[0] === '.') {
        return true;
    }
    return false;
}
/**
 * Creates an esbuild diagnostic message for a given non-ESM module request.
 *
 * @param request The requested non-ESM module name.
 * @param importer The path of the file containing the import.
 * @returns A message representing the diagnostic.
 */
function createCommonJSModuleError(request, importer) {
    const error = {
        text: `Module '${request}' used by '${importer}' is not ESM`,
        notes: [
            {
                text: 'CommonJS or AMD dependencies can cause optimization bailouts.\n' +
                    'For more information see: https://angular.io/guide/build#configuring-commonjs-dependencies',
            },
        ],
    };
    return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uanMtY2hlY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvY29tbW9uanMtY2hlY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQ2xDLFFBQWtCLEVBQ2xCLDJCQUFzQztJQUV0QyxNQUFNLFFBQVEsR0FBcUIsRUFBRSxDQUFDO0lBQ3RDLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFFN0QsNERBQTREO0lBQzVELGVBQWUsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUUvQyw0RUFBNEU7SUFDNUUseUVBQXlFO0lBQ3pFLGVBQWUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFL0Isa0RBQWtEO0lBQ2xELE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUMzQixLQUFLLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM1RCxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2YsU0FBUztTQUNWO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMzQixTQUFTO1NBQ1Y7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3hCO0lBRUQsbURBQW1EO0lBQ25ELHNFQUFzRTtJQUN0RSxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFFakQsd0RBQXdEO0lBQ3hELElBQUksV0FBK0IsQ0FBQztJQUNwQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO1FBQ3BDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFM0MsS0FBSyxNQUFNLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO1lBQ3BDLHlGQUF5RjtZQUN6RixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdEQsU0FBUzthQUNWO1lBQ0QsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFN0IsK0JBQStCO1lBQy9CLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5QixTQUFTO2FBQ1Y7WUFFRCwrRkFBK0Y7WUFDL0YsSUFDRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3ZDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQy9DO2dCQUNBLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBRWxDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDdEIsSUFBSSxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNoQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2lCQUNwQjtxQkFBTTtvQkFDTCw2Q0FBNkM7b0JBQzdDLEtBQUssTUFBTSxPQUFPLElBQUksZUFBZSxFQUFFO3dCQUNyQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxFQUFFOzRCQUNyQyxVQUFVLEdBQUcsS0FBSyxDQUFDOzRCQUNuQixNQUFNO3lCQUNQO3FCQUNGO2lCQUNGO2dCQUVELElBQUksVUFBVSxFQUFFO29CQUNkLCtFQUErRTtvQkFDL0UsdURBQXVEO29CQUN2RCxRQUFRLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxTQUFTO2lCQUNWO2FBQ0Y7WUFFRCxrREFBa0Q7WUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7S0FDRjtJQUVELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFsRkQsb0RBa0ZDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxVQUFVLENBQUMsSUFBWTtJQUM5QixPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLG1CQUFtQixDQUFDLFNBQWlCO0lBQzVDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtRQUN4QixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyx5QkFBeUIsQ0FBQyxPQUFlLEVBQUUsUUFBZ0I7SUFDbEUsTUFBTSxLQUFLLEdBQUc7UUFDWixJQUFJLEVBQUUsV0FBVyxPQUFPLGNBQWMsUUFBUSxjQUFjO1FBQzVELEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFDRixpRUFBaUU7b0JBQ2pFLDRGQUE0RjthQUMvRjtTQUNGO0tBQ0YsQ0FBQztJQUVGLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE1ldGFmaWxlLCBQYXJ0aWFsTWVzc2FnZSB9IGZyb20gJ2VzYnVpbGQnO1xuXG4vKipcbiAqIENoZWNrcyB0aGUgaW5wdXQgZmlsZXMgb2YgYSBidWlsZCB0byBkZXRlcm1pbmUgaWYgYW55IG9mIHRoZSBmaWxlcyBpbmNsdWRlZFxuICogaW4gdGhlIGJ1aWxkIGFyZSBub3QgRVNNLiBFU00gZmlsZXMgY2FuIGJlIHRyZWUtc2hha2VuIGFuZCBvdGhlcndpc2Ugb3B0aW1pemVkXG4gKiBpbiB3YXlzIHRoYXQgQ29tbW9uSlMgYW5kIG90aGVyIG1vZHVsZSBmb3JtYXRzIGNhbm5vdC4gVGhlIGVzYnVpbGQgbWV0YWZpbGVcbiAqIGluZm9ybWF0aW9uIGlzIHVzZWQgYXMgdGhlIGJhc2lzIGZvciB0aGUgYW5hbHlzaXMgYXMgaXQgY29udGFpbnMgaW5mb3JtYXRpb25cbiAqIGZvciBlYWNoIGlucHV0IGZpbGUgaW5jbHVkaW5nIGl0cyByZXNwZWN0aXZlIGZvcm1hdC5cbiAqXG4gKiBJZiBhbnkgYWxsb3dlZCBkZXBlbmRlbmNpZXMgYXJlIHByb3ZpZGVkIHZpYSB0aGUgYGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llc2BcbiAqIHBhcmFtZXRlciwgYm90aCB0aGUgZGlyZWN0IGltcG9ydCBhbmQgYW55IGRlZXAgaW1wb3J0cyB3aWxsIGJlIGlnbm9yZWQgYW5kIG5vXG4gKiBkaWFnbm9zdGljIHdpbGwgYmUgZ2VuZXJhdGVkLlxuICpcbiAqIElmIGEgbW9kdWxlIGhhcyBiZWVuIGlzc3VlZCBhIGRpYWdub3N0aWMgbWVzc2FnZSwgdGhlbiBhbGwgZGVzY2VuZGFudCBtb2R1bGVzXG4gKiB3aWxsIG5vdCBiZSBjaGVja2VkLiBUaGlzIHByZXZlbnRzIGEgcG90ZW50aWFsIG1hc3NpdmUgYW1vdW50IG9mIGluYWN0aW9uYWJsZVxuICogbWVzc2FnZXMgc2luY2UgdGhlIGluaXRpYWwgbW9kdWxlIGltcG9ydCBpcyB0aGUgY2F1c2Ugb2YgdGhlIHByb2JsZW0uXG4gKlxuICogQHBhcmFtIG1ldGFmaWxlIEFuIGVzYnVpbGQgbWV0YWZpbGUgb2JqZWN0IHRvIGNoZWNrLlxuICogQHBhcmFtIGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llcyBBbiBvcHRpb25hbCBsaXN0IG9mIGFsbG93ZWQgZGVwZW5kZW5jaWVzLlxuICogQHJldHVybnMgWmVybyBvciBtb3JlIGRpYWdub3N0aWMgbWVzc2FnZXMgZm9yIGFueSBub24tRVNNIG1vZHVsZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbW1vbkpTTW9kdWxlcyhcbiAgbWV0YWZpbGU6IE1ldGFmaWxlLFxuICBhbGxvd2VkQ29tbW9uSnNEZXBlbmRlbmNpZXM/OiBzdHJpbmdbXSxcbik6IFBhcnRpYWxNZXNzYWdlW10ge1xuICBjb25zdCBtZXNzYWdlczogUGFydGlhbE1lc3NhZ2VbXSA9IFtdO1xuICBjb25zdCBhbGxvd2VkUmVxdWVzdHMgPSBuZXcgU2V0KGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llcyk7XG5cbiAgLy8gSWdub3JlIEFuZ3VsYXIgbG9jYWxlIGRlZmluaXRpb25zIHdoaWNoIGFyZSBjdXJyZW50bHkgVU1EXG4gIGFsbG93ZWRSZXF1ZXN0cy5hZGQoJ0Bhbmd1bGFyL2NvbW1vbi9sb2NhbGVzJyk7XG5cbiAgLy8gSWdub3JlIHpvbmUuanMgZHVlIHRvIGl0IGN1cnJlbnRseSBiZWluZyBidWlsdCB3aXRoIGEgVU1EIGxpa2Ugc3RydWN0dXJlLlxuICAvLyBPbmNlIHRoZSBidWlsZCBvdXRwdXQgaXMgdXBkYXRlZCB0byBiZSBmdWxseSBFU00sIHRoaXMgY2FuIGJlIHJlbW92ZWQuXG4gIGFsbG93ZWRSZXF1ZXN0cy5hZGQoJ3pvbmUuanMnKTtcblxuICAvLyBGaW5kIGFsbCBlbnRyeSBwb2ludHMgdGhhdCBjb250YWluIGNvZGUgKEpTL1RTKVxuICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCB7IGVudHJ5UG9pbnQgfSBvZiBPYmplY3QudmFsdWVzKG1ldGFmaWxlLm91dHB1dHMpKSB7XG4gICAgaWYgKCFlbnRyeVBvaW50KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFpc1BhdGhDb2RlKGVudHJ5UG9pbnQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBmaWxlcy5wdXNoKGVudHJ5UG9pbnQpO1xuICB9XG5cbiAgLy8gVHJhY2sgc2VlbiBmaWxlcyBzbyB0aGV5IGFyZSBvbmx5IGFuYWx5emVkIG9uY2UuXG4gIC8vIEJ1bmRsZXIgcnVudGltZSBjb2RlIGlzIGFsc28gaWdub3JlZCBzaW5jZSBpdCBjYW5ub3QgYmUgYWN0aW9uYWJsZS5cbiAgY29uc3Qgc2VlbkZpbGVzID0gbmV3IFNldDxzdHJpbmc+KFsnPHJ1bnRpbWU+J10pO1xuXG4gIC8vIEFuYWx5emUgdGhlIGZpbGVzIHByZXNlbnQgYnkgd2Fsa2luZyB0aGUgaW1wb3J0IGdyYXBoXG4gIGxldCBjdXJyZW50RmlsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICB3aGlsZSAoKGN1cnJlbnRGaWxlID0gZmlsZXMuc2hpZnQoKSkpIHtcbiAgICBjb25zdCBpbnB1dCA9IG1ldGFmaWxlLmlucHV0c1tjdXJyZW50RmlsZV07XG5cbiAgICBmb3IgKGNvbnN0IGltcG9ydGVkIG9mIGlucHV0LmltcG9ydHMpIHtcbiAgICAgIC8vIElnbm9yZSBpbXBvcnRzIHRoYXQgd2VyZSBhbHJlYWR5IHNlZW4gb3Igbm90IG9yaWdpbmFsbHkgaW4gdGhlIGNvZGUgKGJ1bmRsZXIgaW5qZWN0ZWQpXG4gICAgICBpZiAoIWltcG9ydGVkLm9yaWdpbmFsIHx8IHNlZW5GaWxlcy5oYXMoaW1wb3J0ZWQucGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuRmlsZXMuYWRkKGltcG9ydGVkLnBhdGgpO1xuXG4gICAgICAvLyBPbmx5IGNoZWNrIGFjdHVhbCBjb2RlIGZpbGVzXG4gICAgICBpZiAoIWlzUGF0aENvZGUoaW1wb3J0ZWQucGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIG5vbi1yZWxhdGl2ZSBpbXBvcnQgaXMgRVNNIGZvcm1hdCBhbmQgaXNzdWUgYSBkaWFnbm9zdGljIGlmIHRoZSBmaWxlIGlzIG5vdCBhbGxvd2VkXG4gICAgICBpZiAoXG4gICAgICAgICFpc1BvdGVudGlhbFJlbGF0aXZlKGltcG9ydGVkLm9yaWdpbmFsKSAmJlxuICAgICAgICBtZXRhZmlsZS5pbnB1dHNbaW1wb3J0ZWQucGF0aF0uZm9ybWF0ICE9PSAnZXNtJ1xuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbXBvcnRlZC5vcmlnaW5hbDtcblxuICAgICAgICBsZXQgbm90QWxsb3dlZCA9IHRydWU7XG4gICAgICAgIGlmIChhbGxvd2VkUmVxdWVzdHMuaGFzKHJlcXVlc3QpKSB7XG4gICAgICAgICAgbm90QWxsb3dlZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENoZWNrIGZvciBkZWVwIGltcG9ydHMgb2YgYWxsb3dlZCByZXF1ZXN0c1xuICAgICAgICAgIGZvciAoY29uc3QgYWxsb3dlZCBvZiBhbGxvd2VkUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LnN0YXJ0c1dpdGgoYWxsb3dlZCArICcvJykpIHtcbiAgICAgICAgICAgICAgbm90QWxsb3dlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm90QWxsb3dlZCkge1xuICAgICAgICAgIC8vIElzc3VlIGEgZGlhZ25vc3RpYyBtZXNzYWdlIGFuZCBza2lwIGFsbCBkZXNjZW5kYW50cyBzaW5jZSB0aGV5IGFyZSBhbHNvIG1vc3RcbiAgICAgICAgICAvLyBsaWtlbHkgbm90IEVTTSBidXQgc29sdmVkIGJ5IGFkZHJlc3NpbmcgdGhpcyBpbXBvcnQuXG4gICAgICAgICAgbWVzc2FnZXMucHVzaChjcmVhdGVDb21tb25KU01vZHVsZUVycm9yKHJlcXVlc3QsIGN1cnJlbnRGaWxlKSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHRoZSBwYXRoIHNvIHRoYXQgaXRzIGltcG9ydHMgY2FuIGJlIGNoZWNrZWRcbiAgICAgIGZpbGVzLnB1c2goaW1wb3J0ZWQucGF0aCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1lc3NhZ2VzO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBmaWxlIHBhdGggaGFzIGFuIGV4dGVuc2lvbiB0aGF0IGlzIGEgSmF2YVNjcmlwdCBvciBUeXBlU2NyaXB0XG4gKiBjb2RlIGZpbGUuXG4gKlxuICogQHBhcmFtIG5hbWUgQSBwYXRoIHRvIGNoZWNrIGZvciBjb2RlIGZpbGUgZXh0ZW5zaW9ucy5cbiAqIEByZXR1cm5zIFRydWUsIGlmIGEgY29kZSBmaWxlIHBhdGg7IGZhbHNlLCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGlzUGF0aENvZGUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXFwuW2NtXT9banRdc3g/JC8udGVzdChuYW1lKTtcbn1cblxuLyoqXG4gKiBUZXN0IGFuIGltcG9ydCBtb2R1bGUgc3BlY2lmaWVyIHRvIGRldGVybWluZSBpZiB0aGUgc3RyaW5nIHBvdGVudGlhbGx5IHJlZmVyZW5jZXMgYSByZWxhdGl2ZSBmaWxlLlxuICogbnBtIHBhY2thZ2VzIHNob3VsZCBub3Qgc3RhcnQgd2l0aCBhIHBlcmlvZCBzbyBpZiB0aGUgZmlyc3QgY2hhcmFjdGVyIGlzIGEgcGVyaW9kIHRoYW4gaXQgaXMgbm90IGFcbiAqIHBhY2thZ2UuIFdoaWxlIHRoaXMgaXMgc3VmZmljaWVudCBmb3IgdGhlIHVzZSBjYXNlIGluIHRoZSBDb21tbW9uSlMgY2hlY2tlciwgb25seSBjaGVja2luZyB0aGVcbiAqIGZpcnN0IGNoYXJhY3RlciBkb2VzIG5vdCBkZWZpbml0ZWx5IGluZGljYXRlIHRoZSBzcGVjaWZpZXIgaXMgYSByZWxhdGl2ZSBwYXRoLlxuICpcbiAqIEBwYXJhbSBzcGVjaWZpZXIgQW4gaW1wb3J0IG1vZHVsZSBzcGVjaWZpZXIuXG4gKiBAcmV0dXJucyBUcnVlLCBpZiBzcGVjaWZpZXIgaXMgcG90ZW50aWFsbHkgcmVsYXRpdmU7IGZhbHNlLCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGlzUG90ZW50aWFsUmVsYXRpdmUoc3BlY2lmaWVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKHNwZWNpZmllclswXSA9PT0gJy4nKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlc2J1aWxkIGRpYWdub3N0aWMgbWVzc2FnZSBmb3IgYSBnaXZlbiBub24tRVNNIG1vZHVsZSByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSByZXF1ZXN0IFRoZSByZXF1ZXN0ZWQgbm9uLUVTTSBtb2R1bGUgbmFtZS5cbiAqIEBwYXJhbSBpbXBvcnRlciBUaGUgcGF0aCBvZiB0aGUgZmlsZSBjb250YWluaW5nIHRoZSBpbXBvcnQuXG4gKiBAcmV0dXJucyBBIG1lc3NhZ2UgcmVwcmVzZW50aW5nIHRoZSBkaWFnbm9zdGljLlxuICovXG5mdW5jdGlvbiBjcmVhdGVDb21tb25KU01vZHVsZUVycm9yKHJlcXVlc3Q6IHN0cmluZywgaW1wb3J0ZXI6IHN0cmluZyk6IFBhcnRpYWxNZXNzYWdlIHtcbiAgY29uc3QgZXJyb3IgPSB7XG4gICAgdGV4dDogYE1vZHVsZSAnJHtyZXF1ZXN0fScgdXNlZCBieSAnJHtpbXBvcnRlcn0nIGlzIG5vdCBFU01gLFxuICAgIG5vdGVzOiBbXG4gICAgICB7XG4gICAgICAgIHRleHQ6XG4gICAgICAgICAgJ0NvbW1vbkpTIG9yIEFNRCBkZXBlbmRlbmNpZXMgY2FuIGNhdXNlIG9wdGltaXphdGlvbiBiYWlsb3V0cy5cXG4nICtcbiAgICAgICAgICAnRm9yIG1vcmUgaW5mb3JtYXRpb24gc2VlOiBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvYnVpbGQjY29uZmlndXJpbmctY29tbW9uanMtZGVwZW5kZW5jaWVzJyxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcblxuICByZXR1cm4gZXJyb3I7XG59XG4iXX0=