"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BundlerContext_esbuildContext, _BundlerContext_esbuildOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundlerContext = void 0;
const esbuild_1 = require("esbuild");
const node_path_1 = require("node:path");
/**
 * Determines if an unknown value is an esbuild BuildFailure error object thrown by esbuild.
 * @param value A potential esbuild BuildFailure error object.
 * @returns `true` if the object is determined to be a BuildFailure object; otherwise, `false`.
 */
function isEsBuildFailure(value) {
    return !!value && typeof value === 'object' && 'errors' in value && 'warnings' in value;
}
class BundlerContext {
    constructor(workspaceRoot, incremental, options, initialFilter) {
        this.workspaceRoot = workspaceRoot;
        this.incremental = incremental;
        this.initialFilter = initialFilter;
        _BundlerContext_esbuildContext.set(this, void 0);
        _BundlerContext_esbuildOptions.set(this, void 0);
        this.watchFiles = new Set();
        __classPrivateFieldSet(this, _BundlerContext_esbuildOptions, {
            ...options,
            metafile: true,
            write: false,
        }, "f");
    }
    static async bundleAll(contexts) {
        const individualResults = await Promise.all([...contexts].map((context) => context.bundle()));
        // Return directly if only one result
        if (individualResults.length === 1) {
            return individualResults[0];
        }
        let errors;
        const warnings = [];
        const metafile = { inputs: {}, outputs: {} };
        const initialFiles = new Map();
        const outputFiles = [];
        for (const result of individualResults) {
            warnings.push(...result.warnings);
            if (result.errors) {
                errors ?? (errors = []);
                errors.push(...result.errors);
                continue;
            }
            // Combine metafiles used for the stats option as well as bundle budgets and console output
            if (result.metafile) {
                metafile.inputs = { ...metafile.inputs, ...result.metafile.inputs };
                metafile.outputs = { ...metafile.outputs, ...result.metafile.outputs };
            }
            result.initialFiles.forEach((value, key) => initialFiles.set(key, value));
            outputFiles.push(...result.outputFiles);
        }
        if (errors !== undefined) {
            return { errors, warnings };
        }
        return {
            errors,
            warnings,
            metafile,
            initialFiles,
            outputFiles,
        };
    }
    /**
     * Executes the esbuild build function and normalizes the build result in the event of a
     * build failure that results in no output being generated.
     * All builds use the `write` option with a value of `false` to allow for the output files
     * build result array to be populated.
     *
     * @returns If output files are generated, the full esbuild BuildResult; if not, the
     * warnings and errors for the attempted build.
     */
    async bundle() {
        let result;
        try {
            if (__classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f")) {
                // Rebuild using the existing incremental build context
                result = await __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f").rebuild();
            }
            else if (this.incremental) {
                // Create an incremental build context and perform the first build.
                // Context creation does not perform a build.
                __classPrivateFieldSet(this, _BundlerContext_esbuildContext, await (0, esbuild_1.context)(__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f")), "f");
                result = await __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f").rebuild();
            }
            else {
                // For non-incremental builds, perform a single build
                result = await (0, esbuild_1.build)(__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f"));
            }
        }
        catch (failure) {
            // Build failures will throw an exception which contains errors/warnings
            if (isEsBuildFailure(failure)) {
                return failure;
            }
            else {
                throw failure;
            }
        }
        // Update files that should be watched.
        // While this should technically not be linked to incremental mode, incremental is only
        // currently enabled with watch mode where watch files are needed.
        if (this.incremental) {
            this.watchFiles.clear();
            // Add input files except virtual angular files which do not exist on disk
            Object.keys(result.metafile.inputs)
                .filter((input) => !input.startsWith('angular:'))
                .forEach((input) => this.watchFiles.add((0, node_path_1.join)(this.workspaceRoot, input)));
        }
        // Return if the build encountered any errors
        if (result.errors.length) {
            return {
                errors: result.errors,
                warnings: result.warnings,
            };
        }
        // Find all initial files
        const initialFiles = new Map();
        for (const outputFile of result.outputFiles) {
            // Entries in the metafile are relative to the `absWorkingDir` option which is set to the workspaceRoot
            const relativeFilePath = (0, node_path_1.relative)(this.workspaceRoot, outputFile.path);
            const entryPoint = result.metafile.outputs[relativeFilePath]?.entryPoint;
            outputFile.path = relativeFilePath;
            if (entryPoint) {
                // The first part of the filename is the name of file (e.g., "polyfills" for "polyfills.7S5G3MDY.js")
                const name = (0, node_path_1.basename)(relativeFilePath).split('.', 1)[0];
                // Entry points are only styles or scripts
                const type = (0, node_path_1.extname)(relativeFilePath) === '.css' ? 'style' : 'script';
                // Only entrypoints with an entry in the options are initial files.
                // Dynamic imports also have an entryPoint value in the meta file.
                if (__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f").entryPoints?.[name]) {
                    // An entryPoint value indicates an initial file
                    const record = {
                        name,
                        type,
                        entrypoint: true,
                    };
                    if (!this.initialFilter || this.initialFilter(record)) {
                        initialFiles.set(relativeFilePath, record);
                    }
                }
            }
        }
        // Analyze for transitive initial files
        const files = [...initialFiles.keys()];
        for (const file of files) {
            for (const initialImport of result.metafile.outputs[file].imports) {
                if (initialFiles.has(initialImport.path)) {
                    continue;
                }
                if (initialImport.kind === 'import-statement' || initialImport.kind === 'import-rule') {
                    const record = {
                        type: initialImport.kind === 'import-rule' ? 'style' : 'script',
                        entrypoint: false,
                        external: initialImport.external,
                    };
                    if (!this.initialFilter || this.initialFilter(record)) {
                        initialFiles.set(initialImport.path, record);
                    }
                    if (!initialImport.external) {
                        files.push(initialImport.path);
                    }
                }
            }
        }
        // Return the successful build results
        return { ...result, initialFiles, errors: undefined };
    }
    /**
     * Disposes incremental build resources present in the context.
     *
     * @returns A promise that resolves when disposal is complete.
     */
    async dispose() {
        try {
            return __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f")?.dispose();
        }
        finally {
            __classPrivateFieldSet(this, _BundlerContext_esbuildContext, undefined, "f");
        }
    }
}
exports.BundlerContext = BundlerContext;
_BundlerContext_esbuildContext = new WeakMap(), _BundlerContext_esbuildOptions = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlci1jb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9idW5kbGVyLWNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7O0FBRUgscUNBU2lCO0FBQ2pCLHlDQUE4RDtBQW1COUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsS0FBYztJQUN0QyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLFFBQVEsSUFBSSxLQUFLLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQztBQUMxRixDQUFDO0FBRUQsTUFBYSxjQUFjO0lBTXpCLFlBQ1UsYUFBcUIsRUFDckIsV0FBb0IsRUFDNUIsT0FBcUIsRUFDYixhQUFpRTtRQUhqRSxrQkFBYSxHQUFiLGFBQWEsQ0FBUTtRQUNyQixnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUVwQixrQkFBYSxHQUFiLGFBQWEsQ0FBb0Q7UUFUM0UsaURBQWlFO1FBQ2pFLGlEQUFpRTtRQUV4RCxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQVF0Qyx1QkFBQSxJQUFJLGtDQUFtQjtZQUNyQixHQUFHLE9BQU87WUFDVixRQUFRLEVBQUUsSUFBSTtZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsTUFBQSxDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQWtDO1FBQ3ZELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7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Q0FBQyxDQUFDLENBQUMsUUFBUTt3QkFDL0QsVUFBVSxFQUFFLEtBQUs7d0JBQ2pCLFFBQVEsRUFBRSxhQUFhLENBQUMsUUFBUTtxQkFDakMsQ0FBQztvQkFFRixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNyRCxZQUFZLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7cUJBQzlDO29CQUVELElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFO3dCQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDaEM7aUJBQ0Y7YUFDRjtTQUNGO1FBRUQsc0NBQXNDO1FBQ3RDLE9BQU8sRUFBRSxHQUFHLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ3hELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxJQUFJO1lBQ0YsT0FBTyx1QkFBQSxJQUFJLHNDQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO1NBQ3hDO2dCQUFTO1lBQ1IsdUJBQUEsSUFBSSxrQ0FBbUIsU0FBUyxNQUFBLENBQUM7U0FDbEM7SUFDSCxDQUFDO0NBQ0Y7QUE3TEQsd0NBNkxDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJ1aWxkQ29udGV4dCxcbiAgQnVpbGRGYWlsdXJlLFxuICBCdWlsZE9wdGlvbnMsXG4gIE1lc3NhZ2UsXG4gIE1ldGFmaWxlLFxuICBPdXRwdXRGaWxlLFxuICBidWlsZCxcbiAgY29udGV4dCxcbn0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZXh0bmFtZSwgam9pbiwgcmVsYXRpdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuXG5leHBvcnQgdHlwZSBCdW5kbGVDb250ZXh0UmVzdWx0ID1cbiAgfCB7IGVycm9yczogTWVzc2FnZVtdOyB3YXJuaW5nczogTWVzc2FnZVtdIH1cbiAgfCB7XG4gICAgICBlcnJvcnM6IHVuZGVmaW5lZDtcbiAgICAgIHdhcm5pbmdzOiBNZXNzYWdlW107XG4gICAgICBtZXRhZmlsZTogTWV0YWZpbGU7XG4gICAgICBvdXRwdXRGaWxlczogT3V0cHV0RmlsZVtdO1xuICAgICAgaW5pdGlhbEZpbGVzOiBNYXA8c3RyaW5nLCBJbml0aWFsRmlsZVJlY29yZD47XG4gICAgfTtcblxuZXhwb3J0IGludGVyZmFjZSBJbml0aWFsRmlsZVJlY29yZCB7XG4gIGVudHJ5cG9pbnQ6IGJvb2xlYW47XG4gIG5hbWU/OiBzdHJpbmc7XG4gIHR5cGU6ICdzY3JpcHQnIHwgJ3N0eWxlJztcbiAgZXh0ZXJuYWw/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYW4gdW5rbm93biB2YWx1ZSBpcyBhbiBlc2J1aWxkIEJ1aWxkRmFpbHVyZSBlcnJvciBvYmplY3QgdGhyb3duIGJ5IGVzYnVpbGQuXG4gKiBAcGFyYW0gdmFsdWUgQSBwb3RlbnRpYWwgZXNidWlsZCBCdWlsZEZhaWx1cmUgZXJyb3Igb2JqZWN0LlxuICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3QgaXMgZGV0ZXJtaW5lZCB0byBiZSBhIEJ1aWxkRmFpbHVyZSBvYmplY3Q7IG90aGVyd2lzZSwgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNFc0J1aWxkRmFpbHVyZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIEJ1aWxkRmFpbHVyZSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgJ2Vycm9ycycgaW4gdmFsdWUgJiYgJ3dhcm5pbmdzJyBpbiB2YWx1ZTtcbn1cblxuZXhwb3J0IGNsYXNzIEJ1bmRsZXJDb250ZXh0IHtcbiAgI2VzYnVpbGRDb250ZXh0PzogQnVpbGRDb250ZXh0PHsgbWV0YWZpbGU6IHRydWU7IHdyaXRlOiBmYWxzZSB9PjtcbiAgI2VzYnVpbGRPcHRpb25zOiBCdWlsZE9wdGlvbnMgJiB7IG1ldGFmaWxlOiB0cnVlOyB3cml0ZTogZmFsc2UgfTtcblxuICByZWFkb25seSB3YXRjaEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSB3b3Jrc3BhY2VSb290OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBpbmNyZW1lbnRhbDogYm9vbGVhbixcbiAgICBvcHRpb25zOiBCdWlsZE9wdGlvbnMsXG4gICAgcHJpdmF0ZSBpbml0aWFsRmlsdGVyPzogKGluaXRpYWw6IFJlYWRvbmx5PEluaXRpYWxGaWxlUmVjb3JkPikgPT4gYm9vbGVhbixcbiAgKSB7XG4gICAgdGhpcy4jZXNidWlsZE9wdGlvbnMgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbWV0YWZpbGU6IHRydWUsXG4gICAgICB3cml0ZTogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBidW5kbGVBbGwoY29udGV4dHM6IEl0ZXJhYmxlPEJ1bmRsZXJDb250ZXh0Pik6IFByb21pc2U8QnVuZGxlQ29udGV4dFJlc3VsdD4ge1xuICAgIGNvbnN0IGluZGl2aWR1YWxSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoWy4uLmNvbnRleHRzXS5tYXAoKGNvbnRleHQpID0+IGNvbnRleHQuYnVuZGxlKCkpKTtcblxuICAgIC8vIFJldHVybiBkaXJlY3RseSBpZiBvbmx5IG9uZSByZXN1bHRcbiAgICBpZiAoaW5kaXZpZHVhbFJlc3VsdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gaW5kaXZpZHVhbFJlc3VsdHNbMF07XG4gICAgfVxuXG4gICAgbGV0IGVycm9yczogTWVzc2FnZVtdIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHdhcm5pbmdzOiBNZXNzYWdlW10gPSBbXTtcbiAgICBjb25zdCBtZXRhZmlsZTogTWV0YWZpbGUgPSB7IGlucHV0czoge30sIG91dHB1dHM6IHt9IH07XG4gICAgY29uc3QgaW5pdGlhbEZpbGVzID0gbmV3IE1hcDxzdHJpbmcsIEluaXRpYWxGaWxlUmVjb3JkPigpO1xuICAgIGNvbnN0IG91dHB1dEZpbGVzID0gW107XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgaW5kaXZpZHVhbFJlc3VsdHMpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goLi4ucmVzdWx0Lndhcm5pbmdzKTtcbiAgICAgIGlmIChyZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgIGVycm9ycyA/Pz0gW107XG4gICAgICAgIGVycm9ycy5wdXNoKC4uLnJlc3VsdC5lcnJvcnMpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29tYmluZSBtZXRhZmlsZXMgdXNlZCBmb3IgdGhlIHN0YXRzIG9wdGlvbiBhcyB3ZWxsIGFzIGJ1bmRsZSBidWRnZXRzIGFuZCBjb25zb2xlIG91dHB1dFxuICAgICAgaWYgKHJlc3VsdC5tZXRhZmlsZSkge1xuICAgICAgICBtZXRhZmlsZS5pbnB1dHMgPSB7IC4uLm1ldGFmaWxlLmlucHV0cywgLi4ucmVzdWx0Lm1ldGFmaWxlLmlucHV0cyB9O1xuICAgICAgICBtZXRhZmlsZS5vdXRwdXRzID0geyAuLi5tZXRhZmlsZS5vdXRwdXRzLCAuLi5yZXN1bHQubWV0YWZpbGUub3V0cHV0cyB9O1xuICAgICAgfVxuXG4gICAgICByZXN1bHQuaW5pdGlhbEZpbGVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IGluaXRpYWxGaWxlcy5zZXQoa2V5LCB2YWx1ZSkpO1xuICAgICAgb3V0cHV0RmlsZXMucHVzaCguLi5yZXN1bHQub3V0cHV0RmlsZXMpO1xuICAgIH1cblxuICAgIGlmIChlcnJvcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHsgZXJyb3JzLCB3YXJuaW5ncyB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBlcnJvcnMsXG4gICAgICB3YXJuaW5ncyxcbiAgICAgIG1ldGFmaWxlLFxuICAgICAgaW5pdGlhbEZpbGVzLFxuICAgICAgb3V0cHV0RmlsZXMsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgZXNidWlsZCBidWlsZCBmdW5jdGlvbiBhbmQgbm9ybWFsaXplcyB0aGUgYnVpbGQgcmVzdWx0IGluIHRoZSBldmVudCBvZiBhXG4gICAqIGJ1aWxkIGZhaWx1cmUgdGhhdCByZXN1bHRzIGluIG5vIG91dHB1dCBiZWluZyBnZW5lcmF0ZWQuXG4gICAqIEFsbCBidWlsZHMgdXNlIHRoZSBgd3JpdGVgIG9wdGlvbiB3aXRoIGEgdmFsdWUgb2YgYGZhbHNlYCB0byBhbGxvdyBmb3IgdGhlIG91dHB1dCBmaWxlc1xuICAgKiBidWlsZCByZXN1bHQgYXJyYXkgdG8gYmUgcG9wdWxhdGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBJZiBvdXRwdXQgZmlsZXMgYXJlIGdlbmVyYXRlZCwgdGhlIGZ1bGwgZXNidWlsZCBCdWlsZFJlc3VsdDsgaWYgbm90LCB0aGVcbiAgICogd2FybmluZ3MgYW5kIGVycm9ycyBmb3IgdGhlIGF0dGVtcHRlZCBidWlsZC5cbiAgICovXG4gIGFzeW5jIGJ1bmRsZSgpOiBQcm9taXNlPEJ1bmRsZUNvbnRleHRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy4jZXNidWlsZENvbnRleHQpIHtcbiAgICAgICAgLy8gUmVidWlsZCB1c2luZyB0aGUgZXhpc3RpbmcgaW5jcmVtZW50YWwgYnVpbGQgY29udGV4dFxuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLiNlc2J1aWxkQ29udGV4dC5yZWJ1aWxkKCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaW5jcmVtZW50YWwpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGluY3JlbWVudGFsIGJ1aWxkIGNvbnRleHQgYW5kIHBlcmZvcm0gdGhlIGZpcnN0IGJ1aWxkLlxuICAgICAgICAvLyBDb250ZXh0IGNyZWF0aW9uIGRvZXMgbm90IHBlcmZvcm0gYSBidWlsZC5cbiAgICAgICAgdGhpcy4jZXNidWlsZENvbnRleHQgPSBhd2FpdCBjb250ZXh0KHRoaXMuI2VzYnVpbGRPcHRpb25zKTtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy4jZXNidWlsZENvbnRleHQucmVidWlsZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIG5vbi1pbmNyZW1lbnRhbCBidWlsZHMsIHBlcmZvcm0gYSBzaW5nbGUgYnVpbGRcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgYnVpbGQodGhpcy4jZXNidWlsZE9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGZhaWx1cmUpIHtcbiAgICAgIC8vIEJ1aWxkIGZhaWx1cmVzIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIHdoaWNoIGNvbnRhaW5zIGVycm9ycy93YXJuaW5nc1xuICAgICAgaWYgKGlzRXNCdWlsZEZhaWx1cmUoZmFpbHVyZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhaWx1cmU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBmYWlsdXJlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBmaWxlcyB0aGF0IHNob3VsZCBiZSB3YXRjaGVkLlxuICAgIC8vIFdoaWxlIHRoaXMgc2hvdWxkIHRlY2huaWNhbGx5IG5vdCBiZSBsaW5rZWQgdG8gaW5jcmVtZW50YWwgbW9kZSwgaW5jcmVtZW50YWwgaXMgb25seVxuICAgIC8vIGN1cnJlbnRseSBlbmFibGVkIHdpdGggd2F0Y2ggbW9kZSB3aGVyZSB3YXRjaCBmaWxlcyBhcmUgbmVlZGVkLlxuICAgIGlmICh0aGlzLmluY3JlbWVudGFsKSB7XG4gICAgICB0aGlzLndhdGNoRmlsZXMuY2xlYXIoKTtcbiAgICAgIC8vIEFkZCBpbnB1dCBmaWxlcyBleGNlcHQgdmlydHVhbCBhbmd1bGFyIGZpbGVzIHdoaWNoIGRvIG5vdCBleGlzdCBvbiBkaXNrXG4gICAgICBPYmplY3Qua2V5cyhyZXN1bHQubWV0YWZpbGUuaW5wdXRzKVxuICAgICAgICAuZmlsdGVyKChpbnB1dCkgPT4gIWlucHV0LnN0YXJ0c1dpdGgoJ2FuZ3VsYXI6JykpXG4gICAgICAgIC5mb3JFYWNoKChpbnB1dCkgPT4gdGhpcy53YXRjaEZpbGVzLmFkZChqb2luKHRoaXMud29ya3NwYWNlUm9vdCwgaW5wdXQpKSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGlmIHRoZSBidWlsZCBlbmNvdW50ZXJlZCBhbnkgZXJyb3JzXG4gICAgaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlcnJvcnM6IHJlc3VsdC5lcnJvcnMsXG4gICAgICAgIHdhcm5pbmdzOiByZXN1bHQud2FybmluZ3MsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIGluaXRpYWwgZmlsZXNcbiAgICBjb25zdCBpbml0aWFsRmlsZXMgPSBuZXcgTWFwPHN0cmluZywgSW5pdGlhbEZpbGVSZWNvcmQ+KCk7XG4gICAgZm9yIChjb25zdCBvdXRwdXRGaWxlIG9mIHJlc3VsdC5vdXRwdXRGaWxlcykge1xuICAgICAgLy8gRW50cmllcyBpbiB0aGUgbWV0YWZpbGUgYXJlIHJlbGF0aXZlIHRvIHRoZSBgYWJzV29ya2luZ0RpcmAgb3B0aW9uIHdoaWNoIGlzIHNldCB0byB0aGUgd29ya3NwYWNlUm9vdFxuICAgICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlKHRoaXMud29ya3NwYWNlUm9vdCwgb3V0cHV0RmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IGVudHJ5UG9pbnQgPSByZXN1bHQubWV0YWZpbGUub3V0cHV0c1tyZWxhdGl2ZUZpbGVQYXRoXT8uZW50cnlQb2ludDtcblxuICAgICAgb3V0cHV0RmlsZS5wYXRoID0gcmVsYXRpdmVGaWxlUGF0aDtcblxuICAgICAgaWYgKGVudHJ5UG9pbnQpIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IHBhcnQgb2YgdGhlIGZpbGVuYW1lIGlzIHRoZSBuYW1lIG9mIGZpbGUgKGUuZy4sIFwicG9seWZpbGxzXCIgZm9yIFwicG9seWZpbGxzLjdTNUczTURZLmpzXCIpXG4gICAgICAgIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShyZWxhdGl2ZUZpbGVQYXRoKS5zcGxpdCgnLicsIDEpWzBdO1xuICAgICAgICAvLyBFbnRyeSBwb2ludHMgYXJlIG9ubHkgc3R5bGVzIG9yIHNjcmlwdHNcbiAgICAgICAgY29uc3QgdHlwZSA9IGV4dG5hbWUocmVsYXRpdmVGaWxlUGF0aCkgPT09ICcuY3NzJyA/ICdzdHlsZScgOiAnc2NyaXB0JztcblxuICAgICAgICAvLyBPbmx5IGVudHJ5cG9pbnRzIHdpdGggYW4gZW50cnkgaW4gdGhlIG9wdGlvbnMgYXJlIGluaXRpYWwgZmlsZXMuXG4gICAgICAgIC8vIER5bmFtaWMgaW1wb3J0cyBhbHNvIGhhdmUgYW4gZW50cnlQb2ludCB2YWx1ZSBpbiB0aGUgbWV0YSBmaWxlLlxuICAgICAgICBpZiAoKHRoaXMuI2VzYnVpbGRPcHRpb25zLmVudHJ5UG9pbnRzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pPy5bbmFtZV0pIHtcbiAgICAgICAgICAvLyBBbiBlbnRyeVBvaW50IHZhbHVlIGluZGljYXRlcyBhbiBpbml0aWFsIGZpbGVcbiAgICAgICAgICBjb25zdCByZWNvcmQ6IEluaXRpYWxGaWxlUmVjb3JkID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBlbnRyeXBvaW50OiB0cnVlLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbEZpbHRlciB8fCB0aGlzLmluaXRpYWxGaWx0ZXIocmVjb3JkKSkge1xuICAgICAgICAgICAgaW5pdGlhbEZpbGVzLnNldChyZWxhdGl2ZUZpbGVQYXRoLCByZWNvcmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFuYWx5emUgZm9yIHRyYW5zaXRpdmUgaW5pdGlhbCBmaWxlc1xuICAgIGNvbnN0IGZpbGVzID0gWy4uLmluaXRpYWxGaWxlcy5rZXlzKCldO1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgZm9yIChjb25zdCBpbml0aWFsSW1wb3J0IG9mIHJlc3VsdC5tZXRhZmlsZS5vdXRwdXRzW2ZpbGVdLmltcG9ydHMpIHtcbiAgICAgICAgaWYgKGluaXRpYWxGaWxlcy5oYXMoaW5pdGlhbEltcG9ydC5wYXRoKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluaXRpYWxJbXBvcnQua2luZCA9PT0gJ2ltcG9ydC1zdGF0ZW1lbnQnIHx8IGluaXRpYWxJbXBvcnQua2luZCA9PT0gJ2ltcG9ydC1ydWxlJykge1xuICAgICAgICAgIGNvbnN0IHJlY29yZDogSW5pdGlhbEZpbGVSZWNvcmQgPSB7XG4gICAgICAgICAgICB0eXBlOiBpbml0aWFsSW1wb3J0LmtpbmQgPT09ICdpbXBvcnQtcnVsZScgPyAnc3R5bGUnIDogJ3NjcmlwdCcsXG4gICAgICAgICAgICBlbnRyeXBvaW50OiBmYWxzZSxcbiAgICAgICAgICAgIGV4dGVybmFsOiBpbml0aWFsSW1wb3J0LmV4dGVybmFsLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbEZpbHRlciB8fCB0aGlzLmluaXRpYWxGaWx0ZXIocmVjb3JkKSkge1xuICAgICAgICAgICAgaW5pdGlhbEZpbGVzLnNldChpbml0aWFsSW1wb3J0LnBhdGgsIHJlY29yZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpbml0aWFsSW1wb3J0LmV4dGVybmFsKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKGluaXRpYWxJbXBvcnQucGF0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBzdWNjZXNzZnVsIGJ1aWxkIHJlc3VsdHNcbiAgICByZXR1cm4geyAuLi5yZXN1bHQsIGluaXRpYWxGaWxlcywgZXJyb3JzOiB1bmRlZmluZWQgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwb3NlcyBpbmNyZW1lbnRhbCBidWlsZCByZXNvdXJjZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBkaXNwb3NhbCBpcyBjb21wbGV0ZS5cbiAgICovXG4gIGFzeW5jIGRpc3Bvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLiNlc2J1aWxkQ29udGV4dD8uZGlzcG9zZSgpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiNlc2J1aWxkQ29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==