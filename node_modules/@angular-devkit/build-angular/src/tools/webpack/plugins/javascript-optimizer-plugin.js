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
exports.JavaScriptOptimizerPlugin = void 0;
const piscina_1 = __importDefault(require("piscina"));
const environment_options_1 = require("../../../utils/environment-options");
const webpack_diagnostics_1 = require("../../../utils/webpack-diagnostics");
const utils_1 = require("../../esbuild/utils");
const esbuild_executor_1 = require("./esbuild-executor");
/**
 * The maximum number of Workers that will be created to execute optimize tasks.
 */
const MAX_OPTIMIZE_WORKERS = environment_options_1.maxWorkers;
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-javascript-optimizer';
/**
 * A Webpack plugin that provides JavaScript optimization capabilities.
 *
 * The plugin uses both `esbuild` and `terser` to provide both fast and highly-optimized
 * code output. `esbuild` is used as an initial pass to remove the majority of unused code
 * as well as shorten identifiers. `terser` is then used as a secondary pass to apply
 * optimizations not yet implemented by `esbuild`.
 */
class JavaScriptOptimizerPlugin {
    constructor(options) {
        this.options = options;
        if (options.supportedBrowsers) {
            this.targets = (0, utils_1.transformSupportedBrowsersToTargets)(options.supportedBrowsers);
        }
    }
    apply(compiler) {
        const { OriginalSource, SourceMapSource } = compiler.webpack.sources;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            const logger = compilation.getLogger('build-angular.JavaScriptOptimizerPlugin');
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            }, async (compilationAssets) => {
                logger.time('optimize js assets');
                const scriptsToOptimize = [];
                const cache = compilation.options.cache && compilation.getCache('JavaScriptOptimizerPlugin');
                // Analyze the compilation assets for scripts that require optimization
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!assetName.endsWith('.js')) {
                        continue;
                    }
                    const scriptAsset = compilation.getAsset(assetName);
                    // Skip assets that have already been optimized or are verbatim copies (project assets)
                    if (!scriptAsset || scriptAsset.info.minimized || scriptAsset.info.copied) {
                        continue;
                    }
                    const { source: scriptAssetSource, name } = scriptAsset;
                    let cacheItem;
                    if (cache) {
                        const eTag = cache.getLazyHashedEtag(scriptAssetSource);
                        cacheItem = cache.getItemCache(name, eTag);
                        const cachedOutput = await cacheItem.getPromise();
                        if (cachedOutput) {
                            logger.debug(`${name} restored from cache`);
                            compilation.updateAsset(name, cachedOutput.source, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            continue;
                        }
                    }
                    const { source, map } = scriptAssetSource.sourceAndMap();
                    scriptsToOptimize.push({
                        name: scriptAsset.name,
                        code: typeof source === 'string' ? source : source.toString(),
                        map,
                        cacheItem,
                    });
                }
                if (scriptsToOptimize.length === 0) {
                    return;
                }
                // Ensure all replacement values are strings which is the expected type for esbuild
                let define;
                if (this.options.define) {
                    define = {};
                    for (const [key, value] of Object.entries(this.options.define)) {
                        define[key] = String(value);
                    }
                }
                // Setup the options used by all worker tasks
                const optimizeOptions = {
                    sourcemap: this.options.sourcemap,
                    define,
                    keepIdentifierNames: this.options.keepIdentifierNames,
                    target: this.targets,
                    removeLicenses: this.options.removeLicenses,
                    advanced: this.options.advanced,
                    // Perform a single native esbuild support check.
                    // This removes the need for each worker to perform the check which would
                    // otherwise require spawning a separate process per worker.
                    alwaysUseWasm: !(await esbuild_executor_1.EsbuildExecutor.hasNativeSupport()),
                };
                // Sort scripts so larger scripts start first - worker pool uses a FIFO queue
                scriptsToOptimize.sort((a, b) => a.code.length - b.code.length);
                // Initialize the task worker pool
                const workerPath = require.resolve('./javascript-optimizer-worker');
                const workerPool = new piscina_1.default({
                    filename: workerPath,
                    maxThreads: MAX_OPTIMIZE_WORKERS,
                });
                // Enqueue script optimization tasks and update compilation assets as the tasks complete
                try {
                    const tasks = [];
                    for (const { name, code, map, cacheItem } of scriptsToOptimize) {
                        logger.time(`optimize asset: ${name}`);
                        tasks.push(workerPool
                            .run({
                            asset: {
                                name,
                                code,
                                map,
                            },
                            options: optimizeOptions,
                        })
                            .then(async ({ code, name, map, errors }) => {
                            if (errors?.length) {
                                for (const error of errors) {
                                    (0, webpack_diagnostics_1.addError)(compilation, `Optimization error [${name}]: ${error}`);
                                }
                                return;
                            }
                            const optimizedAsset = map
                                ? new SourceMapSource(code, name, map)
                                : new OriginalSource(code, name);
                            compilation.updateAsset(name, optimizedAsset, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            logger.timeEnd(`optimize asset: ${name}`);
                            return cacheItem?.storePromise({
                                source: optimizedAsset,
                            });
                        }, (error) => {
                            (0, webpack_diagnostics_1.addError)(compilation, `Optimization error [${name}]: ${error.stack || error.message}`);
                        }));
                    }
                    await Promise.all(tasks);
                }
                finally {
                    void workerPool.destroy();
                }
                logger.timeEnd('optimize js assets');
            });
        });
    }
}
exports.JavaScriptOptimizerPlugin = JavaScriptOptimizerPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC1vcHRpbWl6ZXItcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvd2VicGFjay9wbHVnaW5zL2phdmFzY3JpcHQtb3B0aW1pemVyLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCxzREFBOEI7QUFFOUIsNEVBQWdFO0FBQ2hFLDRFQUE4RDtBQUM5RCwrQ0FBMEU7QUFDMUUseURBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxnQ0FBVSxDQUFDO0FBRXhDOztHQUVHO0FBQ0gsTUFBTSxXQUFXLEdBQUcsOEJBQThCLENBQUM7QUE2Q25EOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLHlCQUF5QjtJQUdwQyxZQUFvQixPQUFtQztRQUFuQyxZQUFPLEdBQVAsT0FBTyxDQUE0QjtRQUNyRCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTtZQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsMkNBQW1DLEVBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDL0U7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLE1BQU0sRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFFckUsUUFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQzFELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQztZQUVoRixXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQ3hDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dC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QUssVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUMzQjtnQkFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDdkMsQ0FBQyxDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXBLRCw4REFvS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IFBpc2NpbmEgZnJvbSAncGlzY2luYSc7XG5pbXBvcnQgdHlwZSB7IENvbXBpbGVyLCBzb3VyY2VzIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBtYXhXb3JrZXJzIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZW52aXJvbm1lbnQtb3B0aW9ucyc7XG5pbXBvcnQgeyBhZGRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHsgdHJhbnNmb3JtU3VwcG9ydGVkQnJvd3NlcnNUb1RhcmdldHMgfSBmcm9tICcuLi8uLi9lc2J1aWxkL3V0aWxzJztcbmltcG9ydCB7IEVzYnVpbGRFeGVjdXRvciB9IGZyb20gJy4vZXNidWlsZC1leGVjdXRvcic7XG5pbXBvcnQgdHlwZSB7IE9wdGltaXplUmVxdWVzdE9wdGlvbnMgfSBmcm9tICcuL2phdmFzY3JpcHQtb3B0aW1pemVyLXdvcmtlcic7XG5cbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIFdvcmtlcnMgdGhhdCB3aWxsIGJlIGNyZWF0ZWQgdG8gZXhlY3V0ZSBvcHRpbWl6ZSB0YXNrcy5cbiAqL1xuY29uc3QgTUFYX09QVElNSVpFX1dPUktFUlMgPSBtYXhXb3JrZXJzO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBwbHVnaW4gcHJvdmlkZWQgdG8gV2VicGFjayB3aGVuIHRhcHBpbmcgV2VicGFjayBjb21waWxlciBob29rcy5cbiAqL1xuY29uc3QgUExVR0lOX05BTUUgPSAnYW5ndWxhci1qYXZhc2NyaXB0LW9wdGltaXplcic7XG5cbi8qKlxuICogVGhlIG9wdGlvbnMgdXNlZCB0byBjb25maWd1cmUgdGhlIHtAbGluayBKYXZhU2NyaXB0T3B0aW1pemVyUGx1Z2lufS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBKYXZhU2NyaXB0T3B0aW1pemVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBFbmFibGVzIGFkdmFuY2VkIG9wdGltaXphdGlvbnMgaW4gdGhlIHVuZGVybHlpbmcgSmF2YVNjcmlwdCBvcHRpbWl6ZXJzLlxuICAgKiBUaGlzIGN1cnJlbnRseSBpbmNyZWFzZXMgdGhlIGB0ZXJzZXJgIHBhc3NlcyB0byAyIGFuZCBlbmFibGVzIHRoZSBgcHVyZV9nZXR0ZXJzYFxuICAgKiBvcHRpb24gZm9yIGB0ZXJzZXJgLlxuICAgKi9cbiAgYWR2YW5jZWQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBbiBvYmplY3QgcmVjb3JkIG9mIHN0cmluZyBrZXlzIHRoYXQgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZWlyIHJlc3BlY3RpdmUgdmFsdWVzIHdoZW4gZm91bmRcbiAgICogd2l0aGluIHRoZSBjb2RlIGR1cmluZyBvcHRpbWl6YXRpb24uXG4gICAqL1xuICBkZWZpbmU6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+O1xuXG4gIC8qKlxuICAgKiBFbmFibGVzIHRoZSBnZW5lcmF0aW9uIG9mIGEgc291cmNlbWFwIGR1cmluZyBvcHRpbWl6YXRpb24uXG4gICAqIFRoZSBvdXRwdXQgc291cmNlbWFwIHdpbGwgYmUgYSBmdWxsIHNvdXJjZW1hcCBjb250YWluaW5nIHRoZSBtZXJnZSBvZiB0aGUgaW5wdXQgc291cmNlbWFwIGFuZFxuICAgKiBhbGwgaW50ZXJtZWRpYXRlIHNvdXJjZW1hcHMuXG4gICAqL1xuICBzb3VyY2VtYXA/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygc3VwcG9ydGVkIGJyb3dzZXJzIHRoYXQgaXMgdXNlZCBmb3Igb3V0cHV0IGNvZGUuXG4gICAqL1xuICBzdXBwb3J0ZWRCcm93c2Vycz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBFbmFibGVzIHRoZSByZXRlbnRpb24gb2YgaWRlbnRpZmllciBuYW1lcyBhbmQgZW5zdXJlcyB0aGF0IGZ1bmN0aW9uIGFuZCBjbGFzcyBuYW1lcyBhcmVcbiAgICogcHJlc2VudCBpbiB0aGUgb3V0cHV0IGNvZGUuXG4gICAqXG4gICAqICoqTm90ZSoqOiBpbiBzb21lIGNhc2VzIHN5bWJvbHMgYXJlIHN0aWxsIHJlbmFtZWQgdG8gYXZvaWQgY29sbGlzaW9ucy5cbiAgICovXG4gIGtlZXBJZGVudGlmaWVyTmFtZXM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgdGhlIHJlbW92YWwgb2YgYWxsIGxpY2Vuc2UgY29tbWVudHMgZnJvbSB0aGUgb3V0cHV0IGNvZGUuXG4gICAqL1xuICByZW1vdmVMaWNlbnNlcz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQSBXZWJwYWNrIHBsdWdpbiB0aGF0IHByb3ZpZGVzIEphdmFTY3JpcHQgb3B0aW1pemF0aW9uIGNhcGFiaWxpdGllcy5cbiAqXG4gKiBUaGUgcGx1Z2luIHVzZXMgYm90aCBgZXNidWlsZGAgYW5kIGB0ZXJzZXJgIHRvIHByb3ZpZGUgYm90aCBmYXN0IGFuZCBoaWdobHktb3B0aW1pemVkXG4gKiBjb2RlIG91dHB1dC4gYGVzYnVpbGRgIGlzIHVzZWQgYXMgYW4gaW5pdGlhbCBwYXNzIHRvIHJlbW92ZSB0aGUgbWFqb3JpdHkgb2YgdW51c2VkIGNvZGVcbiAqIGFzIHdlbGwgYXMgc2hvcnRlbiBpZGVudGlmaWVycy4gYHRlcnNlcmAgaXMgdGhlbiB1c2VkIGFzIGEgc2Vjb25kYXJ5IHBhc3MgdG8gYXBwbHlcbiAqIG9wdGltaXphdGlvbnMgbm90IHlldCBpbXBsZW1lbnRlZCBieSBgZXNidWlsZGAuXG4gKi9cbmV4cG9ydCBjbGFzcyBKYXZhU2NyaXB0T3B0aW1pemVyUGx1Z2luIHtcbiAgcHJpdmF0ZSB0YXJnZXRzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IEphdmFTY3JpcHRPcHRpbWl6ZXJPcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuc3VwcG9ydGVkQnJvd3NlcnMpIHtcbiAgICAgIHRoaXMudGFyZ2V0cyA9IHRyYW5zZm9ybVN1cHBvcnRlZEJyb3dzZXJzVG9UYXJnZXRzKG9wdGlvbnMuc3VwcG9ydGVkQnJvd3NlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbnN0IHsgT3JpZ2luYWxTb3VyY2UsIFNvdXJjZU1hcFNvdXJjZSB9ID0gY29tcGlsZXIud2VicGFjay5zb3VyY2VzO1xuXG4gICAgY29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGxvZ2dlciA9IGNvbXBpbGF0aW9uLmdldExvZ2dlcignYnVpbGQtYW5ndWxhci5KYXZhU2NyaXB0T3B0aW1pemVyUGx1Z2luJyk7XG5cbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLnByb2Nlc3NBc3NldHMudGFwUHJvbWlzZShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFBMVUdJTl9OQU1FLFxuICAgICAgICAgIHN0YWdlOiBjb21waWxlci53ZWJwYWNrLkNvbXBpbGF0aW9uLlBST0NFU1NfQVNTRVRTX1NUQUdFX09QVElNSVpFX1NJWkUsXG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIChjb21waWxhdGlvbkFzc2V0cykgPT4ge1xuICAgICAgICAgIGxvZ2dlci50aW1lKCdvcHRpbWl6ZSBqcyBhc3NldHMnKTtcbiAgICAgICAgICBjb25zdCBzY3JpcHRzVG9PcHRpbWl6ZSA9IFtdO1xuICAgICAgICAgIGNvbnN0IGNhY2hlID1cbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLm9wdGlvbnMuY2FjaGUgJiYgY29tcGlsYXRpb24uZ2V0Q2FjaGUoJ0phdmFTY3JpcHRPcHRpbWl6ZXJQbHVnaW4nKTtcblxuICAgICAgICAgIC8vIEFuYWx5emUgdGhlIGNvbXBpbGF0aW9uIGFzc2V0cyBmb3Igc2NyaXB0cyB0aGF0IHJlcXVpcmUgb3B0aW1pemF0aW9uXG4gICAgICAgICAgZm9yIChjb25zdCBhc3NldE5hbWUgb2YgT2JqZWN0LmtleXMoY29tcGlsYXRpb25Bc3NldHMpKSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0TmFtZS5lbmRzV2l0aCgnLmpzJykpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNjcmlwdEFzc2V0ID0gY29tcGlsYXRpb24uZ2V0QXNzZXQoYXNzZXROYW1lKTtcbiAgICAgICAgICAgIC8vIFNraXAgYXNzZXRzIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gb3B0aW1pemVkIG9yIGFyZSB2ZXJiYXRpbSBjb3BpZXMgKHByb2plY3QgYXNzZXRzKVxuICAgICAgICAgICAgaWYgKCFzY3JpcHRBc3NldCB8fCBzY3JpcHRBc3NldC5pbmZvLm1pbmltaXplZCB8fCBzY3JpcHRBc3NldC5pbmZvLmNvcGllZCkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBzb3VyY2U6IHNjcmlwdEFzc2V0U291cmNlLCBuYW1lIH0gPSBzY3JpcHRBc3NldDtcbiAgICAgICAgICAgIGxldCBjYWNoZUl0ZW07XG5cbiAgICAgICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgICAgICBjb25zdCBlVGFnID0gY2FjaGUuZ2V0TGF6eUhhc2hlZEV0YWcoc2NyaXB0QXNzZXRTb3VyY2UpO1xuICAgICAgICAgICAgICBjYWNoZUl0ZW0gPSBjYWNoZS5nZXRJdGVtQ2FjaGUobmFtZSwgZVRhZyk7XG4gICAgICAgICAgICAgIGNvbnN0IGNhY2hlZE91dHB1dCA9IGF3YWl0IGNhY2hlSXRlbS5nZXRQcm9taXNlPFxuICAgICAgICAgICAgICAgIHsgc291cmNlOiBzb3VyY2VzLlNvdXJjZSB9IHwgdW5kZWZpbmVkXG4gICAgICAgICAgICAgID4oKTtcblxuICAgICAgICAgICAgICBpZiAoY2FjaGVkT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKGAke25hbWV9IHJlc3RvcmVkIGZyb20gY2FjaGVgKTtcbiAgICAgICAgICAgICAgICBjb21waWxhdGlvbi51cGRhdGVBc3NldChuYW1lLCBjYWNoZWRPdXRwdXQuc291cmNlLCAoYXNzZXRJbmZvKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgLi4uYXNzZXRJbmZvLFxuICAgICAgICAgICAgICAgICAgbWluaW1pemVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IHNvdXJjZSwgbWFwIH0gPSBzY3JpcHRBc3NldFNvdXJjZS5zb3VyY2VBbmRNYXAoKTtcbiAgICAgICAgICAgIHNjcmlwdHNUb09wdGltaXplLnB1c2goe1xuICAgICAgICAgICAgICBuYW1lOiBzY3JpcHRBc3NldC5uYW1lLFxuICAgICAgICAgICAgICBjb2RlOiB0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJyA/IHNvdXJjZSA6IHNvdXJjZS50b1N0cmluZygpLFxuICAgICAgICAgICAgICBtYXAsXG4gICAgICAgICAgICAgIGNhY2hlSXRlbSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzY3JpcHRzVG9PcHRpbWl6ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFbnN1cmUgYWxsIHJlcGxhY2VtZW50IHZhbHVlcyBhcmUgc3RyaW5ncyB3aGljaCBpcyB0aGUgZXhwZWN0ZWQgdHlwZSBmb3IgZXNidWlsZFxuICAgICAgICAgIGxldCBkZWZpbmU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZWZpbmUpIHtcbiAgICAgICAgICAgIGRlZmluZSA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5vcHRpb25zLmRlZmluZSkpIHtcbiAgICAgICAgICAgICAgZGVmaW5lW2tleV0gPSBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNldHVwIHRoZSBvcHRpb25zIHVzZWQgYnkgYWxsIHdvcmtlciB0YXNrc1xuICAgICAgICAgIGNvbnN0IG9wdGltaXplT3B0aW9uczogT3B0aW1pemVSZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHNvdXJjZW1hcDogdGhpcy5vcHRpb25zLnNvdXJjZW1hcCxcbiAgICAgICAgICAgIGRlZmluZSxcbiAgICAgICAgICAgIGtlZXBJZGVudGlmaWVyTmFtZXM6IHRoaXMub3B0aW9ucy5rZWVwSWRlbnRpZmllck5hbWVzLFxuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldHMsXG4gICAgICAgICAgICByZW1vdmVMaWNlbnNlczogdGhpcy5vcHRpb25zLnJlbW92ZUxpY2Vuc2VzLFxuICAgICAgICAgICAgYWR2YW5jZWQ6IHRoaXMub3B0aW9ucy5hZHZhbmNlZCxcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gYSBzaW5nbGUgbmF0aXZlIGVzYnVpbGQgc3VwcG9ydCBjaGVjay5cbiAgICAgICAgICAgIC8vIFRoaXMgcmVtb3ZlcyB0aGUgbmVlZCBmb3IgZWFjaCB3b3JrZXIgdG8gcGVyZm9ybSB0aGUgY2hlY2sgd2hpY2ggd291bGRcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSByZXF1aXJlIHNwYXduaW5nIGEgc2VwYXJhdGUgcHJvY2VzcyBwZXIgd29ya2VyLlxuICAgICAgICAgICAgYWx3YXlzVXNlV2FzbTogIShhd2FpdCBFc2J1aWxkRXhlY3V0b3IuaGFzTmF0aXZlU3VwcG9ydCgpKSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gU29ydCBzY3JpcHRzIHNvIGxhcmdlciBzY3JpcHRzIHN0YXJ0IGZpcnN0IC0gd29ya2VyIHBvb2wgdXNlcyBhIEZJRk8gcXVldWVcbiAgICAgICAgICBzY3JpcHRzVG9PcHRpbWl6ZS5zb3J0KChhLCBiKSA9PiBhLmNvZGUubGVuZ3RoIC0gYi5jb2RlLmxlbmd0aCk7XG5cbiAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSB0YXNrIHdvcmtlciBwb29sXG4gICAgICAgICAgY29uc3Qgd29ya2VyUGF0aCA9IHJlcXVpcmUucmVzb2x2ZSgnLi9qYXZhc2NyaXB0LW9wdGltaXplci13b3JrZXInKTtcbiAgICAgICAgICBjb25zdCB3b3JrZXJQb29sID0gbmV3IFBpc2NpbmEoe1xuICAgICAgICAgICAgZmlsZW5hbWU6IHdvcmtlclBhdGgsXG4gICAgICAgICAgICBtYXhUaHJlYWRzOiBNQVhfT1BUSU1JWkVfV09SS0VSUyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEVucXVldWUgc2NyaXB0IG9wdGltaXphdGlvbiB0YXNrcyBhbmQgdXBkYXRlIGNvbXBpbGF0aW9uIGFzc2V0cyBhcyB0aGUgdGFza3MgY29tcGxldGVcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdGFza3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyBuYW1lLCBjb2RlLCBtYXAsIGNhY2hlSXRlbSB9IG9mIHNjcmlwdHNUb09wdGltaXplKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci50aW1lKGBvcHRpbWl6ZSBhc3NldDogJHtuYW1lfWApO1xuXG4gICAgICAgICAgICAgIHRhc2tzLnB1c2goXG4gICAgICAgICAgICAgICAgd29ya2VyUG9vbFxuICAgICAgICAgICAgICAgICAgLnJ1bih7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgICAgICAgICAgIG1hcCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW1pemVPcHRpb25zLFxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgICAgICAgICBhc3luYyAoeyBjb2RlLCBuYW1lLCBtYXAsIGVycm9ycyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9ycz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIGVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRFcnJvcihjb21waWxhdGlvbiwgYE9wdGltaXphdGlvbiBlcnJvciBbJHtuYW1lfV06ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpbWl6ZWRBc3NldCA9IG1hcFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBuZXcgU291cmNlTWFwU291cmNlKGNvZGUsIG5hbWUsIG1hcClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IE9yaWdpbmFsU291cmNlKGNvZGUsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGF0aW9uLnVwZGF0ZUFzc2V0KG5hbWUsIG9wdGltaXplZEFzc2V0LCAoYXNzZXRJbmZvKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uYXNzZXRJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluaW1pemVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci50aW1lRW5kKGBvcHRpbWl6ZSBhc3NldDogJHtuYW1lfWApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlSXRlbT8uc3RvcmVQcm9taXNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogb3B0aW1pemVkQXNzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBgT3B0aW1pemF0aW9uIGVycm9yIFske25hbWV9XTogJHtlcnJvci5zdGFjayB8fCBlcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdm9pZCB3b3JrZXJQb29sLmRlc3Ryb3koKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsb2dnZXIudGltZUVuZCgnb3B0aW1pemUganMgYXNzZXRzJyk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG59XG4iXX0=