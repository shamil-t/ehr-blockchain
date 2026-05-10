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
exports.createCompilerPlugin = exports.SourceFileCache = void 0;
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const path = __importStar(require("node:path"));
const node_url_1 = require("node:url");
const typescript_1 = __importDefault(require("typescript"));
const environment_options_1 = require("../../../utils/environment-options");
const javascript_transformer_1 = require("../javascript-transformer");
const load_result_cache_1 = require("../load-result-cache");
const profiling_1 = require("../profiling");
const bundle_options_1 = require("../stylesheets/bundle-options");
const compilation_1 = require("./compilation");
const diagnostics_1 = require("./diagnostics");
const jit_plugin_callbacks_1 = require("./jit-plugin-callbacks");
const USING_WINDOWS = (0, node_os_1.platform)() === 'win32';
const WINDOWS_SEP_REGEXP = new RegExp(`\\${path.win32.sep}`, 'g');
class SourceFileCache extends Map {
    constructor(persistentCachePath) {
        super();
        this.persistentCachePath = persistentCachePath;
        this.modifiedFiles = new Set();
        this.babelFileCache = new Map();
        this.typeScriptFileCache = new Map();
        this.loadResultCache = new load_result_cache_1.MemoryLoadResultCache();
    }
    invalidate(files) {
        this.modifiedFiles.clear();
        for (let file of files) {
            this.babelFileCache.delete(file);
            this.typeScriptFileCache.delete((0, node_url_1.pathToFileURL)(file).href);
            this.loadResultCache.invalidate(file);
            // Normalize separators to allow matching TypeScript Host paths
            if (USING_WINDOWS) {
                file = file.replace(WINDOWS_SEP_REGEXP, path.posix.sep);
            }
            this.delete(file);
            this.modifiedFiles.add(file);
        }
    }
}
exports.SourceFileCache = SourceFileCache;
// TODO: find a better way to unblock TS compilation of server bundles.
let TS_COMPILATION_READY;
// eslint-disable-next-line max-lines-per-function
function createCompilerPlugin(pluginOptions, styleOptions) {
    let resolveCompilationReady;
    if (!pluginOptions.noopTypeScriptCompilation) {
        TS_COMPILATION_READY = new Promise((resolve) => {
            resolveCompilationReady = resolve;
        });
    }
    return {
        name: 'angular-compiler',
        // eslint-disable-next-line max-lines-per-function
        async setup(build) {
            var _a;
            let setupWarnings = [];
            const preserveSymlinks = build.initialOptions.preserveSymlinks;
            let tsconfigPath = pluginOptions.tsconfig;
            if (!preserveSymlinks) {
                // Use the real path of the tsconfig if not preserving symlinks.
                // This ensures the TS source file paths are based on the real path of the configuration.
                try {
                    tsconfigPath = await (0, promises_1.realpath)(tsconfigPath);
                }
                catch { }
            }
            // Initialize a worker pool for JavaScript transformations
            const javascriptTransformer = new javascript_transformer_1.JavaScriptTransformer(pluginOptions, environment_options_1.maxWorkers);
            // Setup defines based on the values provided by the Angular compiler-cli
            const { GLOBAL_DEFS_FOR_TERSER_WITH_AOT } = await compilation_1.AngularCompilation.loadCompilerCli();
            (_a = build.initialOptions).define ?? (_a.define = {});
            for (const [key, value] of Object.entries(GLOBAL_DEFS_FOR_TERSER_WITH_AOT)) {
                if (key in build.initialOptions.define) {
                    // Skip keys that have been manually provided
                    continue;
                }
                if (key === 'ngDevMode') {
                    // ngDevMode is already set based on the builder's script optimization option
                    continue;
                }
                // esbuild requires values to be a string (actual strings need to be quoted).
                // In this case, all provided values are booleans.
                build.initialOptions.define[key] = value.toString();
            }
            // The in-memory cache of TypeScript file outputs will be used during the build in `onLoad` callbacks for TS files.
            // A string value indicates direct TS/NG output and a Uint8Array indicates fully transformed code.
            const typeScriptFileCache = pluginOptions.sourceFileCache?.typeScriptFileCache ??
                new Map();
            // The stylesheet resources from component stylesheets that will be added to the build results output files
            let stylesheetResourceFiles = [];
            let stylesheetMetafiles;
            // Create new reusable compilation for the appropriate mode based on the `jit` plugin option
            const compilation = pluginOptions.noopTypeScriptCompilation
                ? new compilation_1.NoopCompilation()
                : pluginOptions.jit
                    ? new compilation_1.JitCompilation()
                    : new compilation_1.AotCompilation();
            // Determines if TypeScript should process JavaScript files based on tsconfig `allowJs` option
            let shouldTsIgnoreJs = true;
            build.onStart(async () => {
                const result = {
                    warnings: setupWarnings,
                };
                // Reset debug performance tracking
                (0, profiling_1.resetCumulativeDurations)();
                // Reset stylesheet resource output files
                stylesheetResourceFiles = [];
                stylesheetMetafiles = [];
                // Create Angular compiler host options
                const hostOptions = {
                    fileReplacements: pluginOptions.fileReplacements,
                    modifiedFiles: pluginOptions.sourceFileCache?.modifiedFiles,
                    sourceFileCache: pluginOptions.sourceFileCache,
                    async transformStylesheet(data, containingFile, stylesheetFile) {
                        // Stylesheet file only exists for external stylesheets
                        const filename = stylesheetFile ?? containingFile;
                        const stylesheetResult = await (0, bundle_options_1.bundleComponentStylesheet)(styleOptions.inlineStyleLanguage, data, filename, !stylesheetFile, styleOptions, pluginOptions.loadResultCache);
                        const { contents, resourceFiles, errors, warnings } = stylesheetResult;
                        if (errors) {
                            (result.errors ?? (result.errors = [])).push(...errors);
                        }
                        (result.warnings ?? (result.warnings = [])).push(...warnings);
                        stylesheetResourceFiles.push(...resourceFiles);
                        if (stylesheetResult.metafile) {
                            stylesheetMetafiles.push(stylesheetResult.metafile);
                        }
                        return contents;
                    },
                };
                // Initialize the Angular compilation for the current build.
                // In watch mode, previous build state will be reused.
                const { compilerOptions: { allowJs }, referencedFiles, } = await compilation.initialize(tsconfigPath, hostOptions, (compilerOptions) => {
                    if (compilerOptions.target === undefined ||
                        compilerOptions.target < typescript_1.default.ScriptTarget.ES2022) {
                        // If 'useDefineForClassFields' is already defined in the users project leave the value as is.
                        // Otherwise fallback to false due to https://github.com/microsoft/TypeScript/issues/45995
                        // which breaks the deprecated `@Effects` NGRX decorator and potentially other existing code as well.
                        compilerOptions.target = typescript_1.default.ScriptTarget.ES2022;
                        compilerOptions.useDefineForClassFields ?? (compilerOptions.useDefineForClassFields = false);
                        // Only add the warning on the initial build
                        setupWarnings?.push({
                            text: 'TypeScript compiler options "target" and "useDefineForClassFields" are set to "ES2022" and ' +
                                '"false" respectively by the Angular CLI.',
                            location: { file: pluginOptions.tsconfig },
                            notes: [
                                {
                                    text: 'To control ECMA version and features use the Browerslist configuration. ' +
                                        'For more information, see https://angular.io/guide/build#configuring-browser-compatibility',
                                },
                            ],
                        });
                    }
                    // Enable incremental compilation by default if caching is enabled
                    if (pluginOptions.sourceFileCache?.persistentCachePath) {
                        compilerOptions.incremental ?? (compilerOptions.incremental = true);
                        // Set the build info file location to the configured cache directory
                        compilerOptions.tsBuildInfoFile = path.join(pluginOptions.sourceFileCache?.persistentCachePath, '.tsbuildinfo');
                    }
                    else {
                        compilerOptions.incremental = false;
                    }
                    return {
                        ...compilerOptions,
                        noEmitOnError: false,
                        inlineSources: pluginOptions.sourcemap,
                        inlineSourceMap: pluginOptions.sourcemap,
                        mapRoot: undefined,
                        sourceRoot: undefined,
                        preserveSymlinks,
                    };
                });
                shouldTsIgnoreJs = !allowJs;
                if (compilation instanceof compilation_1.NoopCompilation) {
                    await TS_COMPILATION_READY;
                    return result;
                }
                (0, profiling_1.profileSync)('NG_DIAGNOSTICS_TOTAL', () => {
                    for (const diagnostic of compilation.collectDiagnostics()) {
                        const message = (0, diagnostics_1.convertTypeScriptDiagnostic)(diagnostic);
                        if (diagnostic.category === typescript_1.default.DiagnosticCategory.Error) {
                            (result.errors ?? (result.errors = [])).push(message);
                        }
                        else {
                            (result.warnings ?? (result.warnings = [])).push(message);
                        }
                    }
                });
                // Update TypeScript file output cache for all affected files
                (0, profiling_1.profileSync)('NG_EMIT_TS', () => {
                    for (const { filename, contents } of compilation.emitAffectedFiles()) {
                        typeScriptFileCache.set((0, node_url_1.pathToFileURL)(filename).href, contents);
                    }
                });
                // Store referenced files for updated file watching if enabled
                if (pluginOptions.sourceFileCache) {
                    pluginOptions.sourceFileCache.referencedFiles = referencedFiles;
                }
                // Reset the setup warnings so that they are only shown during the first build.
                setupWarnings = undefined;
                // TODO: find a better way to unblock TS compilation of server bundles.
                resolveCompilationReady?.();
                return result;
            });
            build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
                const request = pluginOptions.fileReplacements?.[args.path] ?? args.path;
                // Skip TS load attempt if JS TypeScript compilation not enabled and file is JS
                if (shouldTsIgnoreJs && /\.[cm]?js$/.test(request)) {
                    return undefined;
                }
                // The filename is currently used as a cache key. Since the cache is memory only,
                // the options cannot change and do not need to be represented in the key. If the
                // cache is later stored to disk, then the options that affect transform output
                // would need to be added to the key as well as a check for any change of content.
                let contents = typeScriptFileCache.get((0, node_url_1.pathToFileURL)(request).href);
                if (contents === undefined) {
                    // No TS result indicates the file is not part of the TypeScript program.
                    // If allowJs is enabled and the file is JS then defer to the next load hook.
                    if (!shouldTsIgnoreJs && /\.[cm]?js$/.test(request)) {
                        return undefined;
                    }
                    // Otherwise return an error
                    return {
                        errors: [
                            createMissingFileError(request, args.path, build.initialOptions.absWorkingDir ?? ''),
                        ],
                    };
                }
                else if (typeof contents === 'string') {
                    // A string indicates untransformed output from the TS/NG compiler
                    contents = await javascriptTransformer.transformData(request, contents, true /* skipLinker */);
                    // Store as the returned Uint8Array to allow caching the fully transformed code
                    typeScriptFileCache.set((0, node_url_1.pathToFileURL)(request).href, contents);
                }
                return {
                    contents,
                    loader: 'js',
                };
            });
            build.onLoad({ filter: /\.[cm]?js$/ }, (args) => (0, profiling_1.profileAsync)('NG_EMIT_JS*', async () => {
                // The filename is currently used as a cache key. Since the cache is memory only,
                // the options cannot change and do not need to be represented in the key. If the
                // cache is later stored to disk, then the options that affect transform output
                // would need to be added to the key as well as a check for any change of content.
                let contents = pluginOptions.sourceFileCache?.babelFileCache.get(args.path);
                if (contents === undefined) {
                    contents = await javascriptTransformer.transformFile(args.path, pluginOptions.jit);
                    pluginOptions.sourceFileCache?.babelFileCache.set(args.path, contents);
                }
                return {
                    contents,
                    loader: 'js',
                };
            }, true));
            // Setup bundling of component templates and stylesheets when in JIT mode
            if (pluginOptions.jit) {
                (0, jit_plugin_callbacks_1.setupJitPluginCallbacks)(build, styleOptions, stylesheetResourceFiles, pluginOptions.loadResultCache);
            }
            build.onEnd((result) => {
                // Add any component stylesheet resource files to the output files
                if (stylesheetResourceFiles.length) {
                    result.outputFiles?.push(...stylesheetResourceFiles);
                }
                // Combine component stylesheet metafiles with main metafile
                if (result.metafile && stylesheetMetafiles.length) {
                    for (const metafile of stylesheetMetafiles) {
                        result.metafile.inputs = { ...result.metafile.inputs, ...metafile.inputs };
                        result.metafile.outputs = { ...result.metafile.outputs, ...metafile.outputs };
                    }
                }
                (0, profiling_1.logCumulativeDurations)();
            });
        },
    };
}
exports.createCompilerPlugin = createCompilerPlugin;
function createMissingFileError(request, original, root) {
    const error = {
        text: `File '${path.relative(root, request)}' is missing from the TypeScript compilation.`,
        notes: [
            {
                text: `Ensure the file is part of the TypeScript program via the 'files' or 'include' property.`,
            },
        ],
    };
    if (request !== original) {
        error.notes.push({
            text: `File is requested from a file replacement of '${path.relative(root, original)}'.`,
        });
    }
    return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXItcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9hbmd1bGFyL2NvbXBpbGVyLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVILCtDQUE0QztBQUM1QyxxQ0FBbUM7QUFDbkMsZ0RBQWtDO0FBQ2xDLHVDQUF5QztBQUN6Qyw0REFBNEI7QUFDNUIsNEVBQWdFO0FBQ2hFLHNFQUFrRTtBQUNsRSw0REFBOEU7QUFDOUUsNENBS3NCO0FBQ3RCLGtFQUFtRztBQUVuRywrQ0FBb0c7QUFDcEcsK0NBQTREO0FBQzVELGlFQUFpRTtBQUVqRSxNQUFNLGFBQWEsR0FBRyxJQUFBLGtCQUFRLEdBQUUsS0FBSyxPQUFPLENBQUM7QUFDN0MsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFFbEUsTUFBYSxlQUFnQixTQUFRLEdBQTBCO0lBUTdELFlBQXFCLG1CQUE0QjtRQUMvQyxLQUFLLEVBQUUsQ0FBQztRQURXLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUztRQVB4QyxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDbEMsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBc0IsQ0FBQztRQUMvQyx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztRQUM3RCxvQkFBZSxHQUFHLElBQUkseUNBQXFCLEVBQUUsQ0FBQztJQU12RCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQXVCO1FBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsS0FBSyxJ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QUE0RDtnQkFDNUQsSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLG1CQUFtQixDQUFDLE1BQU0sRUFBRTtvQkFDakQsS0FBSyxNQUFNLFFBQVEsSUFBSSxtQkFBbUIsRUFBRTt3QkFDMUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUMzRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQy9FO2lCQUNGO2dCQUVELElBQUEsa0NBQXNCLEdBQUUsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQTlTRCxvREE4U0M7QUFFRCxTQUFTLHNCQUFzQixDQUFDLE9BQWUsRUFBRSxRQUFnQixFQUFFLElBQVk7SUFDN0UsTUFBTSxLQUFLLEdBQUc7UUFDWixJQUFJLEVBQUUsU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsK0NBQStDO1FBQzFGLEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFBRSwwRkFBMEY7YUFDakc7U0FDRjtLQUNGLENBQUM7SUFFRixJQUFJLE9BQU8sS0FBSyxRQUFRLEVBQUU7UUFDeEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDZixJQUFJLEVBQUUsaURBQWlELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1NBQ3pGLENBQUMsQ0FBQztLQUNKO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgTWV0YWZpbGUsXG4gIE9uU3RhcnRSZXN1bHQsXG4gIE91dHB1dEZpbGUsXG4gIFBhcnRpYWxNZXNzYWdlLFxuICBQbHVnaW4sXG4gIFBsdWdpbkJ1aWxkLFxufSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IHJlYWxwYXRoIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBwbGF0Zm9ybSB9IGZyb20gJ25vZGU6b3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcGF0aFRvRmlsZVVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IG1heFdvcmtlcnMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9lbnZpcm9ubWVudC1vcHRpb25zJztcbmltcG9ydCB7IEphdmFTY3JpcHRUcmFuc2Zvcm1lciB9IGZyb20gJy4uL2phdmFzY3JpcHQtdHJhbnNmb3JtZXInO1xuaW1wb3J0IHsgTG9hZFJlc3VsdENhY2hlLCBNZW1vcnlMb2FkUmVzdWx0Q2FjaGUgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQge1xuICBsb2dDdW11bGF0aXZlRHVyYXRpb25zLFxuICBwcm9maWxlQXN5bmMsXG4gIHByb2ZpbGVTeW5jLFxuICByZXNldEN1bXVsYXRpdmVEdXJhdGlvbnMsXG59IGZyb20gJy4uL3Byb2ZpbGluZyc7XG5pbXBvcnQgeyBCdW5kbGVTdHlsZXNoZWV0T3B0aW9ucywgYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldCB9IGZyb20gJy4uL3N0eWxlc2hlZXRzL2J1bmRsZS1vcHRpb25zJztcbmltcG9ydCB7IEFuZ3VsYXJIb3N0T3B0aW9ucyB9IGZyb20gJy4vYW5ndWxhci1ob3N0JztcbmltcG9ydCB7IEFuZ3VsYXJDb21waWxhdGlvbiwgQW90Q29tcGlsYXRpb24sIEppdENvbXBpbGF0aW9uLCBOb29wQ29tcGlsYXRpb24gfSBmcm9tICcuL2NvbXBpbGF0aW9uJztcbmltcG9ydCB7IGNvbnZlcnRUeXBlU2NyaXB0RGlhZ25vc3RpYyB9IGZyb20gJy4vZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHsgc2V0dXBKaXRQbHVnaW5DYWxsYmFja3MgfSBmcm9tICcuL2ppdC1wbHVnaW4tY2FsbGJhY2tzJztcblxuY29uc3QgVVNJTkdfV0lORE9XUyA9IHBsYXRmb3JtKCkgPT09ICd3aW4zMic7XG5jb25zdCBXSU5ET1dTX1NFUF9SRUdFWFAgPSBuZXcgUmVnRXhwKGBcXFxcJHtwYXRoLndpbjMyLnNlcH1gLCAnZycpO1xuXG5leHBvcnQgY2xhc3MgU291cmNlRmlsZUNhY2hlIGV4dGVuZHMgTWFwPHN0cmluZywgdHMuU291cmNlRmlsZT4ge1xuICByZWFkb25seSBtb2RpZmllZEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJlYWRvbmx5IGJhYmVsRmlsZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFVpbnQ4QXJyYXk+KCk7XG4gIHJlYWRvbmx5IHR5cGVTY3JpcHRGaWxlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nIHwgVWludDhBcnJheT4oKTtcbiAgcmVhZG9ubHkgbG9hZFJlc3VsdENhY2hlID0gbmV3IE1lbW9yeUxvYWRSZXN1bHRDYWNoZSgpO1xuXG4gIHJlZmVyZW5jZWRGaWxlcz86IHJlYWRvbmx5IHN0cmluZ1tdO1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHBlcnNpc3RlbnRDYWNoZVBhdGg/OiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgaW52YWxpZGF0ZShmaWxlczogSXRlcmFibGU8c3RyaW5nPik6IHZvaWQge1xuICAgIHRoaXMubW9kaWZpZWRGaWxlcy5jbGVhcigpO1xuICAgIGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgIHRoaXMuYmFiZWxGaWxlQ2FjaGUuZGVsZXRlKGZpbGUpO1xuICAgICAgdGhpcy50eXBlU2NyaXB0RmlsZUNhY2hlLmRlbGV0ZShwYXRoVG9GaWxlVVJMKGZpbGUpLmhyZWYpO1xuICAgICAgdGhpcy5sb2FkUmVzdWx0Q2FjaGUuaW52YWxpZGF0ZShmaWxlKTtcblxuICAgICAgLy8gTm9ybWFsaXplIHNlcGFyYXRvcnMgdG8gYWxsb3cgbWF0Y2hpbmcgVHlwZVNjcmlwdCBIb3N0IHBhdGhzXG4gICAgICBpZiAoVVNJTkdfV0lORE9XUykge1xuICAgICAgICBmaWxlID0gZmlsZS5yZXBsYWNlKFdJTkRPV1NfU0VQX1JFR0VYUCwgcGF0aC5wb3NpeC5zZXApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRlbGV0ZShmaWxlKTtcbiAgICAgIHRoaXMubW9kaWZpZWRGaWxlcy5hZGQoZmlsZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGlsZXJQbHVnaW5PcHRpb25zIHtcbiAgc291cmNlbWFwOiBib29sZWFuO1xuICB0c2NvbmZpZzogc3RyaW5nO1xuICBqaXQ/OiBib29sZWFuO1xuICAvKiogU2tpcCBUeXBlU2NyaXB0IGNvbXBpbGF0aW9uIHNldHVwLiBUaGlzIGlzIHVzZWZ1bCB0byByZS11c2UgdGhlIFR5cGVTY3JpcHQgY29tcGlsYXRpb24gZnJvbSBhbm90aGVyIHBsdWdpbi4gKi9cbiAgbm9vcFR5cGVTY3JpcHRDb21waWxhdGlvbj86IGJvb2xlYW47XG4gIGFkdmFuY2VkT3B0aW1pemF0aW9ucz86IGJvb2xlYW47XG4gIHRoaXJkUGFydHlTb3VyY2VtYXBzPzogYm9vbGVhbjtcbiAgZmlsZVJlcGxhY2VtZW50cz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHNvdXJjZUZpbGVDYWNoZT86IFNvdXJjZUZpbGVDYWNoZTtcbiAgbG9hZFJlc3VsdENhY2hlPzogTG9hZFJlc3VsdENhY2hlO1xufVxuXG4vLyBUT0RPOiBmaW5kIGEgYmV0dGVyIHdheSB0byB1bmJsb2NrIFRTIGNvbXBpbGF0aW9uIG9mIHNlcnZlciBidW5kbGVzLlxubGV0IFRTX0NPTVBJTEFUSU9OX1JFQURZOiBQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbXBpbGVyUGx1Z2luKFxuICBwbHVnaW5PcHRpb25zOiBDb21waWxlclBsdWdpbk9wdGlvbnMsXG4gIHN0eWxlT3B0aW9uczogQnVuZGxlU3R5bGVzaGVldE9wdGlvbnMgJiB7IGlubGluZVN0eWxlTGFuZ3VhZ2U6IHN0cmluZyB9LFxuKTogUGx1Z2luIHtcbiAgbGV0IHJlc29sdmVDb21waWxhdGlvblJlYWR5OiAoKCkgPT4gdm9pZCkgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKCFwbHVnaW5PcHRpb25zLm5vb3BUeXBlU2NyaXB0Q29tcGlsYXRpb24pIHtcbiAgICBUU19DT01QSUxBVElPTl9SRUFEWSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICByZXNvbHZlQ29tcGlsYXRpb25SZWFkeSA9IHJlc29sdmU7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLWNvbXBpbGVyJyxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICAgIGFzeW5jIHNldHVwKGJ1aWxkOiBQbHVnaW5CdWlsZCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgbGV0IHNldHVwV2FybmluZ3M6IFBhcnRpYWxNZXNzYWdlW10gfCB1bmRlZmluZWQgPSBbXTtcblxuICAgICAgY29uc3QgcHJlc2VydmVTeW1saW5rcyA9IGJ1aWxkLmluaXRpYWxPcHRpb25zLnByZXNlcnZlU3ltbGlua3M7XG4gICAgICBsZXQgdHNjb25maWdQYXRoID0gcGx1Z2luT3B0aW9ucy50c2NvbmZpZztcbiAgICAgIGlmICghcHJlc2VydmVTeW1saW5rcykge1xuICAgICAgICAvLyBVc2UgdGhlIHJlYWwgcGF0aCBvZiB0aGUgdHNjb25maWcgaWYgbm90IHByZXNlcnZpbmcgc3ltbGlua3MuXG4gICAgICAgIC8vIFRoaXMgZW5zdXJlcyB0aGUgVFMgc291cmNlIGZpbGUgcGF0aHMgYXJlIGJhc2VkIG9uIHRoZSByZWFsIHBhdGggb2YgdGhlIGNvbmZpZ3VyYXRpb24uXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdHNjb25maWdQYXRoID0gYXdhaXQgcmVhbHBhdGgodHNjb25maWdQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuXG4gICAgICAvLyBJbml0aWFsaXplIGEgd29ya2VyIHBvb2wgZm9yIEphdmFTY3JpcHQgdHJhbnNmb3JtYXRpb25zXG4gICAgICBjb25zdCBqYXZhc2NyaXB0VHJhbnNmb3JtZXIgPSBuZXcgSmF2YVNjcmlwdFRyYW5zZm9ybWVyKHBsdWdpbk9wdGlvbnMsIG1heFdvcmtlcnMpO1xuXG4gICAgICAvLyBTZXR1cCBkZWZpbmVzIGJhc2VkIG9uIHRoZSB2YWx1ZXMgcHJvdmlkZWQgYnkgdGhlIEFuZ3VsYXIgY29tcGlsZXItY2xpXG4gICAgICBjb25zdCB7IEdMT0JBTF9ERUZTX0ZPUl9URVJTRVJfV0lUSF9BT1QgfSA9IGF3YWl0IEFuZ3VsYXJDb21waWxhdGlvbi5sb2FkQ29tcGlsZXJDbGkoKTtcbiAgICAgIGJ1aWxkLmluaXRpYWxPcHRpb25zLmRlZmluZSA/Pz0ge307XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhHTE9CQUxfREVGU19GT1JfVEVSU0VSX1dJVEhfQU9UKSkge1xuICAgICAgICBpZiAoa2V5IGluIGJ1aWxkLmluaXRpYWxPcHRpb25zLmRlZmluZSkge1xuICAgICAgICAgIC8vIFNraXAga2V5cyB0aGF0IGhhdmUgYmVlbiBtYW51YWxseSBwcm92aWRlZFxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09ICduZ0Rldk1vZGUnKSB7XG4gICAgICAgICAgLy8gbmdEZXZNb2RlIGlzIGFscmVhZHkgc2V0IGJhc2VkIG9uIHRoZSBidWlsZGVyJ3Mgc2NyaXB0IG9wdGltaXphdGlvbiBvcHRpb25cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlc2J1aWxkIHJlcXVpcmVzIHZhbHVlcyB0byBiZSBhIHN0cmluZyAoYWN0dWFsIHN0cmluZ3MgbmVlZCB0byBiZSBxdW90ZWQpLlxuICAgICAgICAvLyBJbiB0aGlzIGNhc2UsIGFsbCBwcm92aWRlZCB2YWx1ZXMgYXJlIGJvb2xlYW5zLlxuICAgICAgICBidWlsZC5pbml0aWFsT3B0aW9ucy5kZWZpbmVba2V5XSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBpbi1tZW1vcnkgY2FjaGUgb2YgVHlwZVNjcmlwdCBmaWxlIG91dHB1dHMgd2lsbCBiZSB1c2VkIGR1cmluZyB0aGUgYnVpbGQgaW4gYG9uTG9hZGAgY2FsbGJhY2tzIGZvciBUUyBmaWxlcy5cbiAgICAgIC8vIEEgc3RyaW5nIHZhbHVlIGluZGljYXRlcyBkaXJlY3QgVFMvTkcgb3V0cHV0IGFuZCBhIFVpbnQ4QXJyYXkgaW5kaWNhdGVzIGZ1bGx5IHRyYW5zZm9ybWVkIGNvZGUuXG4gICAgICBjb25zdCB0eXBlU2NyaXB0RmlsZUNhY2hlID1cbiAgICAgICAgcGx1Z2luT3B0aW9ucy5zb3VyY2VGaWxlQ2FjaGU/LnR5cGVTY3JpcHRGaWxlQ2FjaGUgPz9cbiAgICAgICAgbmV3IE1hcDxzdHJpbmcsIHN0cmluZyB8IFVpbnQ4QXJyYXk+KCk7XG5cbiAgICAgIC8vIFRoZSBzdHlsZXNoZWV0IHJlc291cmNlcyBmcm9tIGNvbXBvbmVudCBzdHlsZXNoZWV0cyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGJ1aWxkIHJlc3VsdHMgb3V0cHV0IGZpbGVzXG4gICAgICBsZXQgc3R5bGVzaGVldFJlc291cmNlRmlsZXM6IE91dHB1dEZpbGVbXSA9IFtdO1xuICAgICAgbGV0IHN0eWxlc2hlZXRNZXRhZmlsZXM6IE1ldGFmaWxlW107XG5cbiAgICAgIC8vIENyZWF0ZSBuZXcgcmV1c2FibGUgY29tcGlsYXRpb24gZm9yIHRoZSBhcHByb3ByaWF0ZSBtb2RlIGJhc2VkIG9uIHRoZSBgaml0YCBwbHVnaW4gb3B0aW9uXG4gICAgICBjb25zdCBjb21waWxhdGlvbjogQW5ndWxhckNvbXBpbGF0aW9uID0gcGx1Z2luT3B0aW9ucy5ub29wVHlwZVNjcmlwdENvbXBpbGF0aW9uXG4gICAgICAgID8gbmV3IE5vb3BDb21waWxhdGlvbigpXG4gICAgICAgIDogcGx1Z2luT3B0aW9ucy5qaXRcbiAgICAgICAgPyBuZXcgSml0Q29tcGlsYXRpb24oKVxuICAgICAgICA6IG5ldyBBb3RDb21waWxhdGlvbigpO1xuXG4gICAgICAvLyBEZXRlcm1pbmVzIGlmIFR5cGVTY3JpcHQgc2hvdWxkIHByb2Nlc3MgSmF2YVNjcmlwdCBmaWxlcyBiYXNlZCBvbiB0c2NvbmZpZyBgYWxsb3dKc2Agb3B0aW9uXG4gICAgICBsZXQgc2hvdWxkVHNJZ25vcmVKcyA9IHRydWU7XG5cbiAgICAgIGJ1aWxkLm9uU3RhcnQoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQ6IE9uU3RhcnRSZXN1bHQgPSB7XG4gICAgICAgICAgd2FybmluZ3M6IHNldHVwV2FybmluZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVzZXQgZGVidWcgcGVyZm9ybWFuY2UgdHJhY2tpbmdcbiAgICAgICAgcmVzZXRDdW11bGF0aXZlRHVyYXRpb25zKCk7XG5cbiAgICAgICAgLy8gUmVzZXQgc3R5bGVzaGVldCByZXNvdXJjZSBvdXRwdXQgZmlsZXNcbiAgICAgICAgc3R5bGVzaGVldFJlc291cmNlRmlsZXMgPSBbXTtcbiAgICAgICAgc3R5bGVzaGVldE1ldGFmaWxlcyA9IFtdO1xuXG4gICAgICAgIC8vIENyZWF0ZSBBbmd1bGFyIGNvbXBpbGVyIGhvc3Qgb3B0aW9uc1xuICAgICAgICBjb25zdCBob3N0T3B0aW9uczogQW5ndWxhckhvc3RPcHRpb25zID0ge1xuICAgICAgICAgIGZpbGVSZXBsYWNlbWVudHM6IHBsdWdpbk9wdGlvbnMuZmlsZVJlcGxhY2VtZW50cyxcbiAgICAgICAgICBtb2RpZmllZEZpbGVzOiBwbHVnaW5PcHRpb25zLnNvdXJjZUZpbGVDYWNoZT8ubW9kaWZpZWRGaWxlcyxcbiAgICAgICAgICBzb3VyY2VGaWxlQ2FjaGU6IHBsdWdpbk9wdGlvbnMuc291cmNlRmlsZUNhY2hlLFxuICAgICAgICAgIGFzeW5jIHRyYW5zZm9ybVN0eWxlc2hlZXQoZGF0YSwgY29udGFpbmluZ0ZpbGUsIHN0eWxlc2hlZXRGaWxlKSB7XG4gICAgICAgICAgICAvLyBTdHlsZXNoZWV0IGZpbGUgb25seSBleGlzdHMgZm9yIGV4dGVybmFsIHN0eWxlc2hlZXRzXG4gICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHN0eWxlc2hlZXRGaWxlID8/IGNvbnRhaW5pbmdGaWxlO1xuXG4gICAgICAgICAgICBjb25zdCBzdHlsZXNoZWV0UmVzdWx0ID0gYXdhaXQgYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldChcbiAgICAgICAgICAgICAgc3R5bGVPcHRpb25zLmlubGluZVN0eWxlTGFuZ3VhZ2UsXG4gICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgIGZpbGVuYW1lLFxuICAgICAgICAgICAgICAhc3R5bGVzaGVldEZpbGUsXG4gICAgICAgICAgICAgIHN0eWxlT3B0aW9ucyxcbiAgICAgICAgICAgICAgcGx1Z2luT3B0aW9ucy5sb2FkUmVzdWx0Q2FjaGUsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCB7IGNvbnRlbnRzLCByZXNvdXJjZUZpbGVzLCBlcnJvcnMsIHdhcm5pbmdzIH0gPSBzdHlsZXNoZWV0UmVzdWx0O1xuICAgICAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgICAgICAocmVzdWx0LmVycm9ycyA/Pz0gW10pLnB1c2goLi4uZXJyb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIChyZXN1bHQud2FybmluZ3MgPz89IFtdKS5wdXNoKC4uLndhcm5pbmdzKTtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRSZXNvdXJjZUZpbGVzLnB1c2goLi4ucmVzb3VyY2VGaWxlcyk7XG4gICAgICAgICAgICBpZiAoc3R5bGVzaGVldFJlc3VsdC5tZXRhZmlsZSkge1xuICAgICAgICAgICAgICBzdHlsZXNoZWV0TWV0YWZpbGVzLnB1c2goc3R5bGVzaGVldFJlc3VsdC5tZXRhZmlsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb250ZW50cztcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdGhlIEFuZ3VsYXIgY29tcGlsYXRpb24gZm9yIHRoZSBjdXJyZW50IGJ1aWxkLlxuICAgICAgICAvLyBJbiB3YXRjaCBtb2RlLCBwcmV2aW91cyBidWlsZCBzdGF0ZSB3aWxsIGJlIHJldXNlZC5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGNvbXBpbGVyT3B0aW9uczogeyBhbGxvd0pzIH0sXG4gICAgICAgICAgcmVmZXJlbmNlZEZpbGVzLFxuICAgICAgICB9ID0gYXdhaXQgY29tcGlsYXRpb24uaW5pdGlhbGl6ZSh0c2NvbmZpZ1BhdGgsIGhvc3RPcHRpb25zLCAoY29tcGlsZXJPcHRpb25zKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY29tcGlsZXJPcHRpb25zLnRhcmdldCA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnMudGFyZ2V0IDwgdHMuU2NyaXB0VGFyZ2V0LkVTMjAyMlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLy8gSWYgJ3VzZURlZmluZUZvckNsYXNzRmllbGRzJyBpcyBhbHJlYWR5IGRlZmluZWQgaW4gdGhlIHVzZXJzIHByb2plY3QgbGVhdmUgdGhlIHZhbHVlIGFzIGlzLlxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGZhbGxiYWNrIHRvIGZhbHNlIGR1ZSB0byBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ1OTk1XG4gICAgICAgICAgICAvLyB3aGljaCBicmVha3MgdGhlIGRlcHJlY2F0ZWQgYEBFZmZlY3RzYCBOR1JYIGRlY29yYXRvciBhbmQgcG90ZW50aWFsbHkgb3RoZXIgZXhpc3RpbmcgY29kZSBhcyB3ZWxsLlxuICAgICAgICAgICAgY29tcGlsZXJPcHRpb25zLnRhcmdldCA9IHRzLlNjcmlwdFRhcmdldC5FUzIwMjI7XG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnMudXNlRGVmaW5lRm9yQ2xhc3NGaWVsZHMgPz89IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBPbmx5IGFkZCB0aGUgd2FybmluZyBvbiB0aGUgaW5pdGlhbCBidWlsZFxuICAgICAgICAgICAgc2V0dXBXYXJuaW5ncz8ucHVzaCh7XG4gICAgICAgICAgICAgIHRleHQ6XG4gICAgICAgICAgICAgICAgJ1R5cGVTY3JpcHQgY29tcGlsZXIgb3B0aW9ucyBcInRhcmdldFwiIGFuZCBcInVzZURlZmluZUZvckNsYXNzRmllbGRzXCIgYXJlIHNldCB0byBcIkVTMjAyMlwiIGFuZCAnICtcbiAgICAgICAgICAgICAgICAnXCJmYWxzZVwiIHJlc3BlY3RpdmVseSBieSB0aGUgQW5ndWxhciBDTEkuJyxcbiAgICAgICAgICAgICAgbG9jYXRpb246IHsgZmlsZTogcGx1Z2luT3B0aW9ucy50c2NvbmZpZyB9LFxuICAgICAgICAgICAgICBub3RlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHRleHQ6XG4gICAgICAgICAgICAgICAgICAgICdUbyBjb250cm9sIEVDTUEgdmVyc2lvbiBhbmQgZmVhdHVyZXMgdXNlIHRoZSBCcm93ZXJzbGlzdCBjb25maWd1cmF0aW9uLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2J1aWxkI2NvbmZpZ3VyaW5nLWJyb3dzZXItY29tcGF0aWJpbGl0eScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEVuYWJsZSBpbmNyZW1lbnRhbCBjb21waWxhdGlvbiBieSBkZWZhdWx0IGlmIGNhY2hpbmcgaXMgZW5hYmxlZFxuICAgICAgICAgIGlmIChwbHVnaW5PcHRpb25zLnNvdXJjZUZpbGVDYWNoZT8ucGVyc2lzdGVudENhY2hlUGF0aCkge1xuICAgICAgICAgICAgY29tcGlsZXJPcHRpb25zLmluY3JlbWVudGFsID8/PSB0cnVlO1xuICAgICAgICAgICAgLy8gU2V0IHRoZSBidWlsZCBpbmZvIGZpbGUgbG9jYXRpb24gdG8gdGhlIGNvbmZpZ3VyZWQgY2FjaGUgZGlyZWN0b3J5XG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnMudHNCdWlsZEluZm9GaWxlID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICBwbHVnaW5PcHRpb25zLnNvdXJjZUZpbGVDYWNoZT8ucGVyc2lzdGVudENhY2hlUGF0aCxcbiAgICAgICAgICAgICAgJy50c2J1aWxkaW5mbycsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnMuaW5jcmVtZW50YWwgPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uY29tcGlsZXJPcHRpb25zLFxuICAgICAgICAgICAgbm9FbWl0T25FcnJvcjogZmFsc2UsXG4gICAgICAgICAgICBpbmxpbmVTb3VyY2VzOiBwbHVnaW5PcHRpb25zLnNvdXJjZW1hcCxcbiAgICAgICAgICAgIGlubGluZVNvdXJjZU1hcDogcGx1Z2luT3B0aW9ucy5zb3VyY2VtYXAsXG4gICAgICAgICAgICBtYXBSb290OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBzb3VyY2VSb290OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBwcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBzaG91bGRUc0lnbm9yZUpzID0gIWFsbG93SnM7XG5cbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uIGluc3RhbmNlb2YgTm9vcENvbXBpbGF0aW9uKSB7XG4gICAgICAgICAgYXdhaXQgVFNfQ09NUElMQVRJT05fUkVBRFk7XG5cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvZmlsZVN5bmMoJ05HX0RJQUdOT1NUSUNTX1RPVEFMJywgKCkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgZGlhZ25vc3RpYyBvZiBjb21waWxhdGlvbi5jb2xsZWN0RGlhZ25vc3RpY3MoKSkge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGNvbnZlcnRUeXBlU2NyaXB0RGlhZ25vc3RpYyhkaWFnbm9zdGljKTtcbiAgICAgICAgICAgIGlmIChkaWFnbm9zdGljLmNhdGVnb3J5ID09PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IpIHtcbiAgICAgICAgICAgICAgKHJlc3VsdC5lcnJvcnMgPz89IFtdKS5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgKHJlc3VsdC53YXJuaW5ncyA/Pz0gW10pLnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBVcGRhdGUgVHlwZVNjcmlwdCBmaWxlIG91dHB1dCBjYWNoZSBmb3IgYWxsIGFmZmVjdGVkIGZpbGVzXG4gICAgICAgIHByb2ZpbGVTeW5jKCdOR19FTUlUX1RTJywgKCkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgeyBmaWxlbmFtZSwgY29udGVudHMgfSBvZiBjb21waWxhdGlvbi5lbWl0QWZmZWN0ZWRGaWxlcygpKSB7XG4gICAgICAgICAgICB0eXBlU2NyaXB0RmlsZUNhY2hlLnNldChwYXRoVG9GaWxlVVJMKGZpbGVuYW1lKS5ocmVmLCBjb250ZW50cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdG9yZSByZWZlcmVuY2VkIGZpbGVzIGZvciB1cGRhdGVkIGZpbGUgd2F0Y2hpbmcgaWYgZW5hYmxlZFxuICAgICAgICBpZiAocGx1Z2luT3B0aW9ucy5zb3VyY2VGaWxlQ2FjaGUpIHtcbiAgICAgICAgICBwbHVnaW5PcHRpb25zLnNvdXJjZUZpbGVDYWNoZS5yZWZlcmVuY2VkRmlsZXMgPSByZWZlcmVuY2VkRmlsZXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCB0aGUgc2V0dXAgd2FybmluZ3Mgc28gdGhhdCB0aGV5IGFyZSBvbmx5IHNob3duIGR1cmluZyB0aGUgZmlyc3QgYnVpbGQuXG4gICAgICAgIHNldHVwV2FybmluZ3MgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gVE9ETzogZmluZCBhIGJldHRlciB3YXkgdG8gdW5ibG9jayBUUyBjb21waWxhdGlvbiBvZiBzZXJ2ZXIgYnVuZGxlcy5cbiAgICAgICAgcmVzb2x2ZUNvbXBpbGF0aW9uUmVhZHk/LigpO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuW2NtXT9banRdc3g/JC8gfSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHBsdWdpbk9wdGlvbnMuZmlsZVJlcGxhY2VtZW50cz8uW2FyZ3MucGF0aF0gPz8gYXJncy5wYXRoO1xuXG4gICAgICAgIC8vIFNraXAgVFMgbG9hZCBhdHRlbXB0IGlmIEpTIFR5cGVTY3JpcHQgY29tcGlsYXRpb24gbm90IGVuYWJsZWQgYW5kIGZpbGUgaXMgSlNcbiAgICAgICAgaWYgKHNob3VsZFRzSWdub3JlSnMgJiYgL1xcLltjbV0/anMkLy50ZXN0KHJlcXVlc3QpKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBmaWxlbmFtZSBpcyBjdXJyZW50bHkgdXNlZCBhcyBhIGNhY2hlIGtleS4gU2luY2UgdGhlIGNhY2hlIGlzIG1lbW9yeSBvbmx5LFxuICAgICAgICAvLyB0aGUgb3B0aW9ucyBjYW5ub3QgY2hhbmdlIGFuZCBkbyBub3QgbmVlZCB0byBiZSByZXByZXNlbnRlZCBpbiB0aGUga2V5LiBJZiB0aGVcbiAgICAgICAgLy8gY2FjaGUgaXMgbGF0ZXIgc3RvcmVkIHRvIGRpc2ssIHRoZW4gdGhlIG9wdGlvbnMgdGhhdCBhZmZlY3QgdHJhbnNmb3JtIG91dHB1dFxuICAgICAgICAvLyB3b3VsZCBuZWVkIHRvIGJlIGFkZGVkIHRvIHRoZSBrZXkgYXMgd2VsbCBhcyBhIGNoZWNrIGZvciBhbnkgY2hhbmdlIG9mIGNvbnRlbnQuXG4gICAgICAgIGxldCBjb250ZW50cyA9IHR5cGVTY3JpcHRGaWxlQ2FjaGUuZ2V0KHBhdGhUb0ZpbGVVUkwocmVxdWVzdCkuaHJlZik7XG5cbiAgICAgICAgaWYgKGNvbnRlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBObyBUUyByZXN1bHQgaW5kaWNhdGVzIHRoZSBmaWxlIGlzIG5vdCBwYXJ0IG9mIHRoZSBUeXBlU2NyaXB0IHByb2dyYW0uXG4gICAgICAgICAgLy8gSWYgYWxsb3dKcyBpcyBlbmFibGVkIGFuZCB0aGUgZmlsZSBpcyBKUyB0aGVuIGRlZmVyIHRvIHRoZSBuZXh0IGxvYWQgaG9vay5cbiAgICAgICAgICBpZiAoIXNob3VsZFRzSWdub3JlSnMgJiYgL1xcLltjbV0/anMkLy50ZXN0KHJlcXVlc3QpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE90aGVyd2lzZSByZXR1cm4gYW4gZXJyb3JcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3JzOiBbXG4gICAgICAgICAgICAgIGNyZWF0ZU1pc3NpbmdGaWxlRXJyb3IocmVxdWVzdCwgYXJncy5wYXRoLCBidWlsZC5pbml0aWFsT3B0aW9ucy5hYnNXb3JraW5nRGlyID8/ICcnKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29udGVudHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgLy8gQSBzdHJpbmcgaW5kaWNhdGVzIHVudHJhbnNmb3JtZWQgb3V0cHV0IGZyb20gdGhlIFRTL05HIGNvbXBpbGVyXG4gICAgICAgICAgY29udGVudHMgPSBhd2FpdCBqYXZhc2NyaXB0VHJhbnNmb3JtZXIudHJhbnNmb3JtRGF0YShcbiAgICAgICAgICAgIHJlcXVlc3QsXG4gICAgICAgICAgICBjb250ZW50cyxcbiAgICAgICAgICAgIHRydWUgLyogc2tpcExpbmtlciAqLyxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gU3RvcmUgYXMgdGhlIHJldHVybmVkIFVpbnQ4QXJyYXkgdG8gYWxsb3cgY2FjaGluZyB0aGUgZnVsbHkgdHJhbnNmb3JtZWQgY29kZVxuICAgICAgICAgIHR5cGVTY3JpcHRGaWxlQ2FjaGUuc2V0KHBhdGhUb0ZpbGVVUkwocmVxdWVzdCkuaHJlZiwgY29udGVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZW50cyxcbiAgICAgICAgICBsb2FkZXI6ICdqcycsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuW2NtXT9qcyQvIH0sIChhcmdzKSA9PlxuICAgICAgICBwcm9maWxlQXN5bmMoXG4gICAgICAgICAgJ05HX0VNSVRfSlMqJyxcbiAgICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyBUaGUgZmlsZW5hbWUgaXMgY3VycmVudGx5IHVzZWQgYXMgYSBjYWNoZSBrZXkuIFNpbmNlIHRoZSBjYWNoZSBpcyBtZW1vcnkgb25seSxcbiAgICAgICAgICAgIC8vIHRoZSBvcHRpb25zIGNhbm5vdCBjaGFuZ2UgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIHJlcHJlc2VudGVkIGluIHRoZSBrZXkuIElmIHRoZVxuICAgICAgICAgICAgLy8gY2FjaGUgaXMgbGF0ZXIgc3RvcmVkIHRvIGRpc2ssIHRoZW4gdGhlIG9wdGlvbnMgdGhhdCBhZmZlY3QgdHJhbnNmb3JtIG91dHB1dFxuICAgICAgICAgICAgLy8gd291bGQgbmVlZCB0byBiZSBhZGRlZCB0byB0aGUga2V5IGFzIHdlbGwgYXMgYSBjaGVjayBmb3IgYW55IGNoYW5nZSBvZiBjb250ZW50LlxuICAgICAgICAgICAgbGV0IGNvbnRlbnRzID0gcGx1Z2luT3B0aW9ucy5zb3VyY2VGaWxlQ2FjaGU/LmJhYmVsRmlsZUNhY2hlLmdldChhcmdzLnBhdGgpO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgY29udGVudHMgPSBhd2FpdCBqYXZhc2NyaXB0VHJhbnNmb3JtZXIudHJhbnNmb3JtRmlsZShhcmdzLnBhdGgsIHBsdWdpbk9wdGlvbnMuaml0KTtcbiAgICAgICAgICAgICAgcGx1Z2luT3B0aW9ucy5zb3VyY2VGaWxlQ2FjaGU/LmJhYmVsRmlsZUNhY2hlLnNldChhcmdzLnBhdGgsIGNvbnRlbnRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgY29udGVudHMsXG4gICAgICAgICAgICAgIGxvYWRlcjogJ2pzJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICApLFxuICAgICAgKTtcblxuICAgICAgLy8gU2V0dXAgYnVuZGxpbmcgb2YgY29tcG9uZW50IHRlbXBsYXRlcyBhbmQgc3R5bGVzaGVldHMgd2hlbiBpbiBKSVQgbW9kZVxuICAgICAgaWYgKHBsdWdpbk9wdGlvbnMuaml0KSB7XG4gICAgICAgIHNldHVwSml0UGx1Z2luQ2FsbGJhY2tzKFxuICAgICAgICAgIGJ1aWxkLFxuICAgICAgICAgIHN0eWxlT3B0aW9ucyxcbiAgICAgICAgICBzdHlsZXNoZWV0UmVzb3VyY2VGaWxlcyxcbiAgICAgICAgICBwbHVnaW5PcHRpb25zLmxvYWRSZXN1bHRDYWNoZSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYnVpbGQub25FbmQoKHJlc3VsdCkgPT4ge1xuICAgICAgICAvLyBBZGQgYW55IGNvbXBvbmVudCBzdHlsZXNoZWV0IHJlc291cmNlIGZpbGVzIHRvIHRoZSBvdXRwdXQgZmlsZXNcbiAgICAgICAgaWYgKHN0eWxlc2hlZXRSZXNvdXJjZUZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIHJlc3VsdC5vdXRwdXRGaWxlcz8ucHVzaCguLi5zdHlsZXNoZWV0UmVzb3VyY2VGaWxlcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb21iaW5lIGNvbXBvbmVudCBzdHlsZXNoZWV0IG1ldGFmaWxlcyB3aXRoIG1haW4gbWV0YWZpbGVcbiAgICAgICAgaWYgKHJlc3VsdC5tZXRhZmlsZSAmJiBzdHlsZXNoZWV0TWV0YWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgIGZvciAoY29uc3QgbWV0YWZpbGUgb2Ygc3R5bGVzaGVldE1ldGFmaWxlcykge1xuICAgICAgICAgICAgcmVzdWx0Lm1ldGFmaWxlLmlucHV0cyA9IHsgLi4ucmVzdWx0Lm1ldGFmaWxlLmlucHV0cywgLi4ubWV0YWZpbGUuaW5wdXRzIH07XG4gICAgICAgICAgICByZXN1bHQubWV0YWZpbGUub3V0cHV0cyA9IHsgLi4ucmVzdWx0Lm1ldGFmaWxlLm91dHB1dHMsIC4uLm1ldGFmaWxlLm91dHB1dHMgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2dDdW11bGF0aXZlRHVyYXRpb25zKCk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNaXNzaW5nRmlsZUVycm9yKHJlcXVlc3Q6IHN0cmluZywgb3JpZ2luYWw6IHN0cmluZywgcm9vdDogc3RyaW5nKTogUGFydGlhbE1lc3NhZ2Uge1xuICBjb25zdCBlcnJvciA9IHtcbiAgICB0ZXh0OiBgRmlsZSAnJHtwYXRoLnJlbGF0aXZlKHJvb3QsIHJlcXVlc3QpfScgaXMgbWlzc2luZyBmcm9tIHRoZSBUeXBlU2NyaXB0IGNvbXBpbGF0aW9uLmAsXG4gICAgbm90ZXM6IFtcbiAgICAgIHtcbiAgICAgICAgdGV4dDogYEVuc3VyZSB0aGUgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXBlU2NyaXB0IHByb2dyYW0gdmlhIHRoZSAnZmlsZXMnIG9yICdpbmNsdWRlJyBwcm9wZXJ0eS5gLFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xuXG4gIGlmIChyZXF1ZXN0ICE9PSBvcmlnaW5hbCkge1xuICAgIGVycm9yLm5vdGVzLnB1c2goe1xuICAgICAgdGV4dDogYEZpbGUgaXMgcmVxdWVzdGVkIGZyb20gYSBmaWxlIHJlcGxhY2VtZW50IG9mICcke3BhdGgucmVsYXRpdmUocm9vdCwgb3JpZ2luYWwpfScuYCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBlcnJvcjtcbn1cbiJdfQ==