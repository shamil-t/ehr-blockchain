"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalScriptsBundleOptions = void 0;
const magic_string_1 = __importStar(require("magic-string"));
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const error_1 = require("../../utils/error");
const load_result_cache_1 = require("./load-result-cache");
const sourcemap_ignorelist_plugin_1 = require("./sourcemap-ignorelist-plugin");
const virtual_module_plugin_1 = require("./virtual-module-plugin");
/**
 * Create an esbuild 'build' options object for all global scripts defined in the user provied
 * build options.
 * @param options The builder's user-provider normalized options.
 * @returns An esbuild BuildOptions object.
 */
function createGlobalScriptsBundleOptions(options, initial, loadCache) {
    const { globalScripts, optimizationOptions, outputNames, preserveSymlinks, sourcemapOptions, workspaceRoot, } = options;
    const namespace = 'angular:script/global';
    const entryPoints = {};
    let found = false;
    for (const script of globalScripts) {
        if (script.initial === initial) {
            found = true;
            entryPoints[script.name] = `${namespace}:${script.name}`;
        }
    }
    // Skip if there are no entry points for the style loading type
    if (found === false) {
        return;
    }
    return {
        absWorkingDir: workspaceRoot,
        bundle: false,
        splitting: false,
        entryPoints,
        entryNames: initial ? outputNames.bundles : '[name]',
        assetNames: outputNames.media,
        mainFields: ['script', 'browser', 'main'],
        conditions: ['script'],
        resolveExtensions: ['.mjs', '.js'],
        logLevel: options.verbose ? 'debug' : 'silent',
        metafile: true,
        minify: optimizationOptions.scripts,
        outdir: workspaceRoot,
        sourcemap: sourcemapOptions.scripts && (sourcemapOptions.hidden ? 'external' : true),
        write: false,
        platform: 'neutral',
        preserveSymlinks,
        plugins: [
            (0, sourcemap_ignorelist_plugin_1.createSourcemapIgnorelistPlugin)(),
            (0, virtual_module_plugin_1.createVirtualModulePlugin)({
                namespace,
                external: true,
                // Add the `js` extension here so that esbuild generates an output file with the extension
                transformPath: (path) => path.slice(namespace.length + 1) + '.js',
                loadContent: (args, build) => (0, load_result_cache_1.createCachedLoad)(loadCache, async (args) => {
                    const files = globalScripts.find(({ name }) => name === args.path.slice(0, -3))?.files;
                    (0, node_assert_1.default)(files, `Invalid operation: global scripts name not found [${args.path}]`);
                    // Global scripts are concatenated using magic-string instead of bundled via esbuild.
                    const bundleContent = new magic_string_1.Bundle();
                    const watchFiles = [];
                    for (const filename of files) {
                        let fileContent;
                        try {
                            // Attempt to read as a relative path from the workspace root
                            const fullPath = node_path_1.default.join(workspaceRoot, filename);
                            fileContent = await (0, promises_1.readFile)(fullPath, 'utf-8');
                            watchFiles.push(fullPath);
                        }
                        catch (e) {
                            (0, error_1.assertIsError)(e);
                            if (e.code !== 'ENOENT') {
                                throw e;
                            }
                            // If not found, attempt to resolve as a module specifier
                            const resolveResult = await build.resolve(filename, {
                                kind: 'entry-point',
                                resolveDir: workspaceRoot,
                            });
                            if (resolveResult.errors.length) {
                                // Remove resolution failure notes about marking as external since it doesn't apply
                                // to global scripts.
                                resolveResult.errors.forEach((error) => (error.notes = []));
                                return {
                                    errors: resolveResult.errors,
                                    warnings: resolveResult.warnings,
                                };
                            }
                            watchFiles.push(resolveResult.path);
                            fileContent = await (0, promises_1.readFile)(resolveResult.path, 'utf-8');
                        }
                        bundleContent.addSource(new magic_string_1.default(fileContent, { filename }));
                    }
                    return {
                        contents: bundleContent.toString(),
                        loader: 'js',
                        watchFiles,
                    };
                }).call(build, args),
            }),
        ],
    };
}
exports.createGlobalScriptsBundleOptions = createGlobalScriptsBundleOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLXNjcmlwdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2dsb2JhbC1zY3JpcHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsNkRBQW1EO0FBQ25ELDhEQUFpQztBQUNqQywrQ0FBNEM7QUFDNUMsMERBQTZCO0FBRTdCLDZDQUFrRDtBQUNsRCwyREFBd0U7QUFDeEUsK0VBQWdGO0FBQ2hGLG1FQUFvRTtBQUVwRTs7Ozs7R0FLRztBQUNILFNBQWdCLGdDQUFnQyxDQUM5QyxPQUEwQyxFQUMxQyxPQUFnQixFQUNoQixTQUEyQjtJQUUzQixNQUFNLEVBQ0osYUFBYSxFQUNiLG1CQUFtQixFQUNuQixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixhQUFhLEdBQ2QsR0FBRyxPQUFPLENBQUM7SUFFWixNQUFNLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztJQUMxQyxNQUFNLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0lBQy9DLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNsQixLQUFLLE1BQU0sTUFBTSxJQUFJLGFBQWEsRUFBRTtRQUNsQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO1lBQzlCLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDYixXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUMxRDtLQUNGO0lBRUQsK0RBQStEO0lBQy9ELElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtRQUNuQixPQUFPO0tBQ1I7SUFFRCxPQUFPO1FBQ0wsYUFBYSxFQUFFLGFBQWE7UUFDNUIsTUFBTSxF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Q3JCLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQ0FFNUQsT0FBTztvQ0FDTCxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU07b0NBQzVCLFFBQVEsRUFBRSxhQUFhLENBQUMsUUFBUTtpQ0FDakMsQ0FBQzs2QkFDSDs0QkFFRCxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDcEMsV0FBVyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7eUJBQzNEO3dCQUVELGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxzQkFBVyxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDckU7b0JBRUQsT0FBTzt3QkFDTCxRQUFRLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRTt3QkFDbEMsTUFBTSxFQUFFLElBQUk7d0JBQ1osVUFBVTtxQkFDWCxDQUFDO2dCQUNKLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDO2FBQ3ZCLENBQUM7U0FDSDtLQUNGLENBQUM7QUFDSixDQUFDO0FBNUdELDRFQTRHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEJ1aWxkT3B0aW9ucyB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IE1hZ2ljU3RyaW5nLCB7IEJ1bmRsZSB9IGZyb20gJ21hZ2ljLXN0cmluZyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHR5cGUgeyBOb3JtYWxpemVkQXBwbGljYXRpb25CdWlsZE9wdGlvbnMgfSBmcm9tICcuLi8uLi9idWlsZGVycy9hcHBsaWNhdGlvbi9vcHRpb25zJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5pbXBvcnQgeyBMb2FkUmVzdWx0Q2FjaGUsIGNyZWF0ZUNhY2hlZExvYWQgfSBmcm9tICcuL2xvYWQtcmVzdWx0LWNhY2hlJztcbmltcG9ydCB7IGNyZWF0ZVNvdXJjZW1hcElnbm9yZWxpc3RQbHVnaW4gfSBmcm9tICcuL3NvdXJjZW1hcC1pZ25vcmVsaXN0LXBsdWdpbic7XG5pbXBvcnQgeyBjcmVhdGVWaXJ0dWFsTW9kdWxlUGx1Z2luIH0gZnJvbSAnLi92aXJ0dWFsLW1vZHVsZS1wbHVnaW4nO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBlc2J1aWxkICdidWlsZCcgb3B0aW9ucyBvYmplY3QgZm9yIGFsbCBnbG9iYWwgc2NyaXB0cyBkZWZpbmVkIGluIHRoZSB1c2VyIHByb3ZpZWRcbiAqIGJ1aWxkIG9wdGlvbnMuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgYnVpbGRlcidzIHVzZXItcHJvdmlkZXIgbm9ybWFsaXplZCBvcHRpb25zLlxuICogQHJldHVybnMgQW4gZXNidWlsZCBCdWlsZE9wdGlvbnMgb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR2xvYmFsU2NyaXB0c0J1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyxcbiAgaW5pdGlhbDogYm9vbGVhbixcbiAgbG9hZENhY2hlPzogTG9hZFJlc3VsdENhY2hlLFxuKTogQnVpbGRPcHRpb25zIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qge1xuICAgIGdsb2JhbFNjcmlwdHMsXG4gICAgb3B0aW1pemF0aW9uT3B0aW9ucyxcbiAgICBvdXRwdXROYW1lcyxcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzLFxuICAgIHNvdXJjZW1hcE9wdGlvbnMsXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgbmFtZXNwYWNlID0gJ2FuZ3VsYXI6c2NyaXB0L2dsb2JhbCc7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBnbG9iYWxTY3JpcHRzKSB7XG4gICAgaWYgKHNjcmlwdC5pbml0aWFsID09PSBpbml0aWFsKSB7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICBlbnRyeVBvaW50c1tzY3JpcHQubmFtZV0gPSBgJHtuYW1lc3BhY2V9OiR7c2NyaXB0Lm5hbWV9YDtcbiAgICB9XG4gIH1cblxuICAvLyBTa2lwIGlmIHRoZXJlIGFyZSBubyBlbnRyeSBwb2ludHMgZm9yIHRoZSBzdHlsZSBsb2FkaW5nIHR5cGVcbiAgaWYgKGZvdW5kID09PSBmYWxzZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWJzV29ya2luZ0Rpcjogd29ya3NwYWNlUm9vdCxcbiAgICBidW5kbGU6IGZhbHNlLFxuICAgIHNwbGl0dGluZzogZmFsc2UsXG4gICAgZW50cnlQb2ludHMsXG4gICAgZW50cnlOYW1lczogaW5pdGlhbCA/IG91dHB1dE5hbWVzLmJ1bmRsZXMgOiAnW25hbWVdJyxcbiAgICBhc3NldE5hbWVzOiBvdXRwdXROYW1lcy5tZWRpYSxcbiAgICBtYWluRmllbGRzOiBbJ3NjcmlwdCcsICdicm93c2VyJywgJ21haW4nXSxcbiAgICBjb25kaXRpb25zOiBbJ3NjcmlwdCddLFxuICAgIHJlc29sdmVFeHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJ10sXG4gICAgbG9nTGV2ZWw6IG9wdGlvbnMudmVyYm9zZSA/ICdkZWJ1ZycgOiAnc2lsZW50JyxcbiAgICBtZXRhZmlsZTogdHJ1ZSxcbiAgICBtaW5pZnk6IG9wdGltaXphdGlvbk9wdGlvbnMuc2NyaXB0cyxcbiAgICBvdXRkaXI6IHdvcmtzcGFjZVJvb3QsXG4gICAgc291cmNlbWFwOiBzb3VyY2VtYXBPcHRpb25zLnNjcmlwdHMgJiYgKHNvdXJjZW1hcE9wdGlvbnMuaGlkZGVuID8gJ2V4dGVybmFsJyA6IHRydWUpLFxuICAgIHdyaXRlOiBmYWxzZSxcbiAgICBwbGF0Zm9ybTogJ25ldXRyYWwnLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgcGx1Z2luczogW1xuICAgICAgY3JlYXRlU291cmNlbWFwSWdub3JlbGlzdFBsdWdpbigpLFxuICAgICAgY3JlYXRlVmlydHVhbE1vZHVsZVBsdWdpbih7XG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgIC8vIEFkZCB0aGUgYGpzYCBleHRlbnNpb24gaGVyZSBzbyB0aGF0IGVzYnVpbGQgZ2VuZXJhdGVzIGFuIG91dHB1dCBmaWxlIHdpdGggdGhlIGV4dGVuc2lvblxuICAgICAgICB0cmFuc2Zvcm1QYXRoOiAocGF0aCkgPT4gcGF0aC5zbGljZShuYW1lc3BhY2UubGVuZ3RoICsgMSkgKyAnLmpzJyxcbiAgICAgICAgbG9hZENvbnRlbnQ6IChhcmdzLCBidWlsZCkgPT5cbiAgICAgICAgICBjcmVhdGVDYWNoZWRMb2FkKGxvYWRDYWNoZSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZ2xvYmFsU2NyaXB0cy5maW5kKCh7IG5hbWUgfSkgPT4gbmFtZSA9PT0gYXJncy5wYXRoLnNsaWNlKDAsIC0zKSk/LmZpbGVzO1xuICAgICAgICAgICAgYXNzZXJ0KGZpbGVzLCBgSW52YWxpZCBvcGVyYXRpb246IGdsb2JhbCBzY3JpcHRzIG5hbWUgbm90IGZvdW5kIFske2FyZ3MucGF0aH1dYCk7XG5cbiAgICAgICAgICAgIC8vIEdsb2JhbCBzY3JpcHRzIGFyZSBjb25jYXRlbmF0ZWQgdXNpbmcgbWFnaWMtc3RyaW5nIGluc3RlYWQgb2YgYnVuZGxlZCB2aWEgZXNidWlsZC5cbiAgICAgICAgICAgIGNvbnN0IGJ1bmRsZUNvbnRlbnQgPSBuZXcgQnVuZGxlKCk7XG4gICAgICAgICAgICBjb25zdCB3YXRjaEZpbGVzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIGZpbGVzKSB7XG4gICAgICAgICAgICAgIGxldCBmaWxlQ29udGVudDtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHJlYWQgYXMgYSByZWxhdGl2ZSBwYXRoIGZyb20gdGhlIHdvcmtzcGFjZSByb290XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIGZpbGVDb250ZW50ID0gYXdhaXQgcmVhZEZpbGUoZnVsbFBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgIHdhdGNoRmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICAgICAgICAgIGlmIChlLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIG5vdCBmb3VuZCwgYXR0ZW1wdCB0byByZXNvbHZlIGFzIGEgbW9kdWxlIHNwZWNpZmllclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVSZXN1bHQgPSBhd2FpdCBidWlsZC5yZXNvbHZlKGZpbGVuYW1lLCB7XG4gICAgICAgICAgICAgICAgICBraW5kOiAnZW50cnktcG9pbnQnLFxuICAgICAgICAgICAgICAgICAgcmVzb2x2ZURpcjogd29ya3NwYWNlUm9vdCxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlUmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSByZXNvbHV0aW9uIGZhaWx1cmUgbm90ZXMgYWJvdXQgbWFya2luZyBhcyBleHRlcm5hbCBzaW5jZSBpdCBkb2Vzbid0IGFwcGx5XG4gICAgICAgICAgICAgICAgICAvLyB0byBnbG9iYWwgc2NyaXB0cy5cbiAgICAgICAgICAgICAgICAgIHJlc29sdmVSZXN1bHQuZXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiAoZXJyb3Iubm90ZXMgPSBbXSkpO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnM6IHJlc29sdmVSZXN1bHQuZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICB3YXJuaW5nczogcmVzb2x2ZVJlc3VsdC53YXJuaW5ncyxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2F0Y2hGaWxlcy5wdXNoKHJlc29sdmVSZXN1bHQucGF0aCk7XG4gICAgICAgICAgICAgICAgZmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShyZXNvbHZlUmVzdWx0LnBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgYnVuZGxlQ29udGVudC5hZGRTb3VyY2UobmV3IE1hZ2ljU3RyaW5nKGZpbGVDb250ZW50LCB7IGZpbGVuYW1lIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgY29udGVudHM6IGJ1bmRsZUNvbnRlbnQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgbG9hZGVyOiAnanMnLFxuICAgICAgICAgICAgICB3YXRjaEZpbGVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KS5jYWxsKGJ1aWxkLCBhcmdzKSxcbiAgICAgIH0pLFxuICAgIF0sXG4gIH07XG59XG4iXX0=