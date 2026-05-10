"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssOptimizerPlugin = void 0;
const webpack_diagnostics_1 = require("../../../utils/webpack-diagnostics");
const utils_1 = require("../../esbuild/utils");
const esbuild_executor_1 = require("./esbuild-executor");
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-css-optimizer';
/**
 * A Webpack plugin that provides CSS optimization capabilities.
 *
 * The plugin uses both `esbuild` to provide both fast and highly-optimized
 * code output.
 */
class CssOptimizerPlugin {
    constructor(options) {
        this.esbuild = new esbuild_executor_1.EsbuildExecutor();
        if (options?.supportedBrowsers) {
            this.targets = (0, utils_1.transformSupportedBrowsersToTargets)(options.supportedBrowsers);
        }
    }
    apply(compiler) {
        const { OriginalSource, SourceMapSource } = compiler.webpack.sources;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            const logger = compilation.getLogger('build-angular.CssOptimizerPlugin');
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            }, async (compilationAssets) => {
                const cache = compilation.options.cache && compilation.getCache(PLUGIN_NAME);
                logger.time('optimize css assets');
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!/\.(?:css|scss|sass|less)$/.test(assetName)) {
                        continue;
                    }
                    const asset = compilation.getAsset(assetName);
                    // Skip assets that have already been optimized or are verbatim copies (project assets)
                    if (!asset || asset.info.minimized || asset.info.copied) {
                        continue;
                    }
                    const { source: styleAssetSource, name } = asset;
                    let cacheItem;
                    if (cache) {
                        const eTag = cache.getLazyHashedEtag(styleAssetSource);
                        cacheItem = cache.getItemCache(name, eTag);
                        const cachedOutput = await cacheItem.getPromise();
                        if (cachedOutput) {
                            logger.debug(`${name} restored from cache`);
                            await this.addWarnings(compilation, cachedOutput.warnings);
                            compilation.updateAsset(name, cachedOutput.source, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            continue;
                        }
                    }
                    const { source, map: inputMap } = styleAssetSource.sourceAndMap();
                    const input = typeof source === 'string' ? source : source.toString();
                    const optimizeAssetLabel = `optimize asset: ${asset.name}`;
                    logger.time(optimizeAssetLabel);
                    const { code, warnings, map } = await this.optimize(input, asset.name, inputMap, this.targets);
                    logger.timeEnd(optimizeAssetLabel);
                    await this.addWarnings(compilation, warnings);
                    const optimizedAsset = map
                        ? new SourceMapSource(code, name, map)
                        : new OriginalSource(code, name);
                    compilation.updateAsset(name, optimizedAsset, (assetInfo) => ({
                        ...assetInfo,
                        minimized: true,
                    }));
                    await cacheItem?.storePromise({
                        source: optimizedAsset,
                        warnings,
                    });
                }
                logger.timeEnd('optimize css assets');
            });
        });
    }
    /**
     * Optimizes a CSS asset using esbuild.
     *
     * @param input The CSS asset source content to optimize.
     * @param name The name of the CSS asset. Used to generate source maps.
     * @param inputMap Optionally specifies the CSS asset's original source map that will
     * be merged with the intermediate optimized source map.
     * @param target Optionally specifies the target browsers for the output code.
     * @returns A promise resolving to the optimized CSS, source map, and any warnings.
     */
    optimize(input, name, inputMap, target) {
        let sourceMapLine;
        if (inputMap) {
            // esbuild will automatically remap the sourcemap if provided
            sourceMapLine = `\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(JSON.stringify(inputMap)).toString('base64')} */`;
        }
        return this.esbuild.transform(sourceMapLine ? input + sourceMapLine : input, {
            loader: 'css',
            legalComments: 'inline',
            minify: true,
            sourcemap: !!inputMap && 'external',
            sourcefile: name,
            target,
        });
    }
    async addWarnings(compilation, warnings) {
        if (warnings.length > 0) {
            for (const warning of await this.esbuild.formatMessages(warnings, { kind: 'warning' })) {
                (0, webpack_diagnostics_1.addWarning)(compilation, warning);
            }
        }
    }
}
exports.CssOptimizerPlugin = CssOptimizerPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLW9wdGltaXplci1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy93ZWJwYWNrL3BsdWdpbnMvY3NzLW9wdGltaXplci1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUgsNEVBQWdFO0FBQ2hFLCtDQUEwRTtBQUMxRSx5REFBcUQ7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQztBQU01Qzs7Ozs7R0FLRztBQUNILE1BQWEsa0JBQWtCO0lBSTdCLFlBQVksT0FBbUM7UUFGdkMsWUFBTyxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO1FBR3RDLElBQUksT0FBTyxFQUFFLGlCQUFpQixFQUFFO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSwyQ0FBbUMsRUFBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUMvRTtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsUUFBa0I7UUFDdEIsTUFBTSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVyRSxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDMUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBRXpFLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDeEM7Z0JBQ0UsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBa0M7YUFDdkUsRUFDRCxLQUFLLEVBQUUsaUJBQWlCLEVB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QUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RGLElBQUEsZ0NBQVUsRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDbEM7U0FDRjtJQUNILENBQUM7Q0FDRjtBQXBJRCxnREFvSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBNZXNzYWdlLCBUcmFuc2Zvcm1SZXN1bHQgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB0eXBlIHsgQ29tcGlsYXRpb24sIENvbXBpbGVyLCBzb3VyY2VzIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBhZGRXYXJuaW5nIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvd2VicGFjay1kaWFnbm9zdGljcyc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1TdXBwb3J0ZWRCcm93c2Vyc1RvVGFyZ2V0cyB9IGZyb20gJy4uLy4uL2VzYnVpbGQvdXRpbHMnO1xuaW1wb3J0IHsgRXNidWlsZEV4ZWN1dG9yIH0gZnJvbSAnLi9lc2J1aWxkLWV4ZWN1dG9yJztcblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUgcGx1Z2luIHByb3ZpZGVkIHRvIFdlYnBhY2sgd2hlbiB0YXBwaW5nIFdlYnBhY2sgY29tcGlsZXIgaG9va3MuXG4gKi9cbmNvbnN0IFBMVUdJTl9OQU1FID0gJ2FuZ3VsYXItY3NzLW9wdGltaXplcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3NzT3B0aW1pemVyUGx1Z2luT3B0aW9ucyB7XG4gIHN1cHBvcnRlZEJyb3dzZXJzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogQSBXZWJwYWNrIHBsdWdpbiB0aGF0IHByb3ZpZGVzIENTUyBvcHRpbWl6YXRpb24gY2FwYWJpbGl0aWVzLlxuICpcbiAqIFRoZSBwbHVnaW4gdXNlcyBib3RoIGBlc2J1aWxkYCB0byBwcm92aWRlIGJvdGggZmFzdCBhbmQgaGlnaGx5LW9wdGltaXplZFxuICogY29kZSBvdXRwdXQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDc3NPcHRpbWl6ZXJQbHVnaW4ge1xuICBwcml2YXRlIHRhcmdldHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVzYnVpbGQgPSBuZXcgRXNidWlsZEV4ZWN1dG9yKCk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IENzc09wdGltaXplclBsdWdpbk9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucz8uc3VwcG9ydGVkQnJvd3NlcnMpIHtcbiAgICAgIHRoaXMudGFyZ2V0cyA9IHRyYW5zZm9ybVN1cHBvcnRlZEJyb3dzZXJzVG9UYXJnZXRzKG9wdGlvbnMuc3VwcG9ydGVkQnJvd3NlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbnN0IHsgT3JpZ2luYWxTb3VyY2UsIFNvdXJjZU1hcFNvdXJjZSB9ID0gY29tcGlsZXIud2VicGFjay5zb3VyY2VzO1xuXG4gICAgY29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGxvZ2dlciA9IGNvbXBpbGF0aW9uLmdldExvZ2dlcignYnVpbGQtYW5ndWxhci5Dc3NPcHRpbWl6ZXJQbHVnaW4nKTtcblxuICAgICAgY29tcGlsYXRpb24uaG9va3MucHJvY2Vzc0Fzc2V0cy50YXBQcm9taXNlKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogUExVR0lOX05BTUUsXG4gICAgICAgICAgc3RhZ2U6IGNvbXBpbGVyLndlYnBhY2suQ29tcGlsYXRpb24uUFJPQ0VTU19BU1NFVFNfU1RBR0VfT1BUSU1JWkVfU0laRSxcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgKGNvbXBpbGF0aW9uQXNzZXRzKSA9PiB7XG4gICAgICAgICAgY29uc3QgY2FjaGUgPSBjb21waWxhdGlvbi5vcHRpb25zLmNhY2hlICYmIGNvbXBpbGF0aW9uLmdldENhY2hlKFBMVUdJTl9OQU1FKTtcblxuICAgICAgICAgIGxvZ2dlci50aW1lKCdvcHRpbWl6ZSBjc3MgYXNzZXRzJyk7XG4gICAgICAgICAgZm9yIChjb25zdCBhc3NldE5hbWUgb2YgT2JqZWN0LmtleXMoY29tcGlsYXRpb25Bc3NldHMpKSB7XG4gICAgICAgICAgICBpZiAoIS9cXC4oPzpjc3N8c2Nzc3xzYXNzfGxlc3MpJC8udGVzdChhc3NldE5hbWUpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IGNvbXBpbGF0aW9uLmdldEFzc2V0KGFzc2V0TmFtZSk7XG4gICAgICAgICAgICAvLyBTa2lwIGFzc2V0cyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIG9wdGltaXplZCBvciBhcmUgdmVyYmF0aW0gY29waWVzIChwcm9qZWN0IGFzc2V0cylcbiAgICAgICAgICAgIGlmICghYXNzZXQgfHwgYXNzZXQuaW5mby5taW5pbWl6ZWQgfHwgYXNzZXQuaW5mby5jb3BpZWQpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgc291cmNlOiBzdHlsZUFzc2V0U291cmNlLCBuYW1lIH0gPSBhc3NldDtcbiAgICAgICAgICAgIGxldCBjYWNoZUl0ZW07XG5cbiAgICAgICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgICAgICBjb25zdCBlVGFnID0gY2FjaGUuZ2V0TGF6eUhhc2hlZEV0YWcoc3R5bGVBc3NldFNvdXJjZSk7XG4gICAgICAgICAgICAgIGNhY2hlSXRlbSA9IGNhY2hlLmdldEl0ZW1DYWNoZShuYW1lLCBlVGFnKTtcbiAgICAgICAgICAgICAgY29uc3QgY2FjaGVkT3V0cHV0ID0gYXdhaXQgY2FjaGVJdGVtLmdldFByb21pc2U8XG4gICAgICAgICAgICAgICAgeyBzb3VyY2U6IHNvdXJjZXMuU291cmNlOyB3YXJuaW5nczogTWVzc2FnZVtdIH0gfCB1bmRlZmluZWRcbiAgICAgICAgICAgICAgPigpO1xuXG4gICAgICAgICAgICAgIGlmIChjYWNoZWRPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoYCR7bmFtZX0gcmVzdG9yZWQgZnJvbSBjYWNoZWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYWRkV2FybmluZ3MoY29tcGlsYXRpb24sIGNhY2hlZE91dHB1dC53YXJuaW5ncyk7XG4gICAgICAgICAgICAgICAgY29tcGlsYXRpb24udXBkYXRlQXNzZXQobmFtZSwgY2FjaGVkT3V0cHV0LnNvdXJjZSwgKGFzc2V0SW5mbykgPT4gKHtcbiAgICAgICAgICAgICAgICAgIC4uLmFzc2V0SW5mbyxcbiAgICAgICAgICAgICAgICAgIG1pbmltaXplZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBzb3VyY2UsIG1hcDogaW5wdXRNYXAgfSA9IHN0eWxlQXNzZXRTb3VyY2Uuc291cmNlQW5kTWFwKCk7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9IHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnID8gc291cmNlIDogc291cmNlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9wdGltaXplQXNzZXRMYWJlbCA9IGBvcHRpbWl6ZSBhc3NldDogJHthc3NldC5uYW1lfWA7XG4gICAgICAgICAgICBsb2dnZXIudGltZShvcHRpbWl6ZUFzc2V0TGFiZWwpO1xuICAgICAgICAgICAgY29uc3QgeyBjb2RlLCB3YXJuaW5ncywgbWFwIH0gPSBhd2FpdCB0aGlzLm9wdGltaXplKFxuICAgICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgICAgYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgaW5wdXRNYXAsXG4gICAgICAgICAgICAgIHRoaXMudGFyZ2V0cyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsb2dnZXIudGltZUVuZChvcHRpbWl6ZUFzc2V0TGFiZWwpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFkZFdhcm5pbmdzKGNvbXBpbGF0aW9uLCB3YXJuaW5ncyk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEFzc2V0ID0gbWFwXG4gICAgICAgICAgICAgID8gbmV3IFNvdXJjZU1hcFNvdXJjZShjb2RlLCBuYW1lLCBtYXApXG4gICAgICAgICAgICAgIDogbmV3IE9yaWdpbmFsU291cmNlKGNvZGUsIG5hbWUpO1xuICAgICAgICAgICAgY29tcGlsYXRpb24udXBkYXRlQXNzZXQobmFtZSwgb3B0aW1pemVkQXNzZXQsIChhc3NldEluZm8pID0+ICh7XG4gICAgICAgICAgICAgIC4uLmFzc2V0SW5mbyxcbiAgICAgICAgICAgICAgbWluaW1pemVkOiB0cnVlLFxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBjYWNoZUl0ZW0/LnN0b3JlUHJvbWlzZSh7XG4gICAgICAgICAgICAgIHNvdXJjZTogb3B0aW1pemVkQXNzZXQsXG4gICAgICAgICAgICAgIHdhcm5pbmdzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxvZ2dlci50aW1lRW5kKCdvcHRpbWl6ZSBjc3MgYXNzZXRzJyk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wdGltaXplcyBhIENTUyBhc3NldCB1c2luZyBlc2J1aWxkLlxuICAgKlxuICAgKiBAcGFyYW0gaW5wdXQgVGhlIENTUyBhc3NldCBzb3VyY2UgY29udGVudCB0byBvcHRpbWl6ZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIENTUyBhc3NldC4gVXNlZCB0byBnZW5lcmF0ZSBzb3VyY2UgbWFwcy5cbiAgICogQHBhcmFtIGlucHV0TWFwIE9wdGlvbmFsbHkgc3BlY2lmaWVzIHRoZSBDU1MgYXNzZXQncyBvcmlnaW5hbCBzb3VyY2UgbWFwIHRoYXQgd2lsbFxuICAgKiBiZSBtZXJnZWQgd2l0aCB0aGUgaW50ZXJtZWRpYXRlIG9wdGltaXplZCBzb3VyY2UgbWFwLlxuICAgKiBAcGFyYW0gdGFyZ2V0IE9wdGlvbmFsbHkgc3BlY2lmaWVzIHRoZSB0YXJnZXQgYnJvd3NlcnMgZm9yIHRoZSBvdXRwdXQgY29kZS5cbiAgICogQHJldHVybnMgQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgb3B0aW1pemVkIENTUywgc291cmNlIG1hcCwgYW5kIGFueSB3YXJuaW5ncy5cbiAgICovXG4gIHByaXZhdGUgb3B0aW1pemUoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaW5wdXRNYXA6IG9iamVjdCxcbiAgICB0YXJnZXQ6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICApOiBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4ge1xuICAgIGxldCBzb3VyY2VNYXBMaW5lO1xuICAgIGlmIChpbnB1dE1hcCkge1xuICAgICAgLy8gZXNidWlsZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVtYXAgdGhlIHNvdXJjZW1hcCBpZiBwcm92aWRlZFxuICAgICAgc291cmNlTWFwTGluZSA9IGBcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsJHtCdWZmZXIuZnJvbShcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoaW5wdXRNYXApLFxuICAgICAgKS50b1N0cmluZygnYmFzZTY0Jyl9ICovYDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5lc2J1aWxkLnRyYW5zZm9ybShzb3VyY2VNYXBMaW5lID8gaW5wdXQgKyBzb3VyY2VNYXBMaW5lIDogaW5wdXQsIHtcbiAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgICBsZWdhbENvbW1lbnRzOiAnaW5saW5lJyxcbiAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgIHNvdXJjZW1hcDogISFpbnB1dE1hcCAmJiAnZXh0ZXJuYWwnLFxuICAgICAgc291cmNlZmlsZTogbmFtZSxcbiAgICAgIHRhcmdldCxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYWRkV2FybmluZ3MoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCB3YXJuaW5nczogTWVzc2FnZVtdKSB7XG4gICAgaWYgKHdhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiBhd2FpdCB0aGlzLmVzYnVpbGQuZm9ybWF0TWVzc2FnZXMod2FybmluZ3MsIHsga2luZDogJ3dhcm5pbmcnIH0pKSB7XG4gICAgICAgIGFkZFdhcm5pbmcoY29tcGlsYXRpb24sIHdhcm5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19