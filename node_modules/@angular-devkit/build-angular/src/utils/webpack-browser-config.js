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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexInputFile = exports.getIndexOutputFile = exports.generateBrowserWebpackConfigFromContext = exports.generateI18nBrowserWebpackConfigFromContext = exports.generateWebpackConfig = void 0;
const path = __importStar(require("path"));
const webpack_1 = require("webpack");
const webpack_merge_1 = require("webpack-merge");
const builder_watch_plugin_1 = require("../tools/webpack/plugins/builder-watch-plugin");
const utils_1 = require("../utils");
const read_tsconfig_1 = require("../utils/read-tsconfig");
const i18n_options_1 = require("./i18n-options");
async function generateWebpackConfig(workspaceRoot, projectRoot, sourceRoot, projectName, options, webpackPartialGenerator, logger, extraBuildOptions) {
    // Ensure Build Optimizer is only used with AOT.
    if (options.buildOptimizer && !options.aot) {
        throw new Error(`The 'buildOptimizer' option cannot be used without 'aot'.`);
    }
    const tsConfigPath = path.resolve(workspaceRoot, options.tsConfig);
    const tsConfig = await (0, read_tsconfig_1.readTsconfig)(tsConfigPath);
    const buildOptions = { ...options, ...extraBuildOptions };
    const wco = {
        root: workspaceRoot,
        logger: logger.createChild('webpackConfigOptions'),
        projectRoot,
        sourceRoot,
        buildOptions,
        tsConfig,
        tsConfigPath,
        projectName,
    };
    wco.buildOptions.progress = (0, utils_1.defaultProgress)(wco.buildOptions.progress);
    const partials = await Promise.all(webpackPartialGenerator(wco));
    const webpackConfig = (0, webpack_merge_1.merge)(partials);
    return webpackConfig;
}
exports.generateWebpackConfig = generateWebpackConfig;
async function generateI18nBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, extraBuildOptions = {}) {
    const { buildOptions, i18n } = await (0, i18n_options_1.configureI18nBuild)(context, options);
    const result = await generateBrowserWebpackConfigFromContext(buildOptions, context, (wco) => {
        return webpackPartialGenerator(wco);
    }, extraBuildOptions);
    const config = result.config;
    if (i18n.shouldInline) {
        // Remove localize "polyfill" if in AOT mode
        if (buildOptions.aot) {
            if (!config.resolve) {
                config.resolve = {};
            }
            if (Array.isArray(config.resolve.alias)) {
                config.resolve.alias.push({
                    name: '@angular/localize/init',
                    alias: false,
                });
            }
            else {
                if (!config.resolve.alias) {
                    config.resolve.alias = {};
                }
                config.resolve.alias['@angular/localize/init'] = false;
            }
        }
        // Update file hashes to include translation file content
        const i18nHash = Object.values(i18n.locales).reduce((data, locale) => data + locale.files.map((file) => file.integrity || '').join('|'), '');
        config.plugins ?? (config.plugins = []);
        config.plugins.push({
            apply(compiler) {
                compiler.hooks.compilation.tap('build-angular', (compilation) => {
                    webpack_1.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation).chunkHash.tap('build-angular', (_, hash) => {
                        hash.update('$localize' + i18nHash);
                    });
                });
            },
        });
    }
    return { ...result, i18n };
}
exports.generateI18nBrowserWebpackConfigFromContext = generateI18nBrowserWebpackConfigFromContext;
async function generateBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, extraBuildOptions = {}) {
    const projectName = context.target && context.target.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const workspaceRoot = context.workspaceRoot;
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = path.join(workspaceRoot, projectMetadata.root ?? '');
    const sourceRoot = projectMetadata.sourceRoot;
    const projectSourceRoot = sourceRoot ? path.join(workspaceRoot, sourceRoot) : undefined;
    const normalizedOptions = (0, utils_1.normalizeBrowserSchema)(workspaceRoot, projectRoot, projectSourceRoot, options, projectMetadata, context.logger);
    const config = await generateWebpackConfig(workspaceRoot, projectRoot, projectSourceRoot, projectName, normalizedOptions, webpackPartialGenerator, context.logger, extraBuildOptions);
    // If builder watch support is present in the context, add watch plugin
    // This is internal only and currently only used for testing
    const watcherFactory = context.watcherFactory;
    if (watcherFactory) {
        if (!config.plugins) {
            config.plugins = [];
        }
        config.plugins.push(new builder_watch_plugin_1.BuilderWatchPlugin(watcherFactory));
    }
    return {
        config,
        projectRoot,
        projectSourceRoot,
    };
}
exports.generateBrowserWebpackConfigFromContext = generateBrowserWebpackConfigFromContext;
function getIndexOutputFile(index) {
    if (typeof index === 'string') {
        return path.basename(index);
    }
    else {
        return index.output || 'index.html';
    }
}
exports.getIndexOutputFile = getIndexOutputFile;
function getIndexInputFile(index) {
    if (typeof index === 'string') {
        return index;
    }
    else {
        return index.input;
    }
}
exports.getIndexInputFile = getIndexInputFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1icm93c2VyLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3dlYnBhY2stYnJvd3Nlci1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCwyQ0FBNkI7QUFDN0IscUNBQW9EO0FBQ3BELGlEQUFzRDtBQUV0RCx3RkFHdUQ7QUFDdkQsb0NBQW1HO0FBRW5HLDBEQUFzRDtBQUN0RCxpREFBaUU7QUFRMUQsS0FBSyxVQUFVLHFCQUFxQixDQUN6QyxhQUFxQixFQUNyQixXQUFtQixFQUNuQixVQUE4QixFQUM5QixXQUFtQixFQUNuQixPQUF1QyxFQUN2Qyx1QkFBZ0QsRUFDaEQsTUFBeUIsRUFDekIsaUJBQTBEO0lBRTFELGdEQUFnRDtJQUNoRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQzFDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELENBQUMsQ0FBQztLQUM5RTtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsNEJBQVksRUFBQyxZQUFZLENBQUMsQ0FBQztJQUVsRCxNQUFNLFlBQVksR0FBbUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxHQUFHLGlCQUFpQixFQUFFLENBQUM7SUFDMUYsTUFBTSxHQUFHLEdBQWdDO1FBQ3ZDLElBQUksRUFBRSxhQUFhO1FBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDO1FBQ2xELFdBQVc7UUFDWCxVQUFVO1FBQ1YsWUFBWTtRQUNaLFFBQVE7UUFD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dUIsRUFDdkIsT0FBTyxDQUFDLE1BQU0sRUFDZCxpQkFBaUIsQ0FDbEIsQ0FBQztJQUVGLHVFQUF1RTtJQUN2RSw0REFBNEQ7SUFDNUQsTUFBTSxjQUFjLEdBQ2xCLE9BR0QsQ0FBQyxjQUFjLENBQUM7SUFDakIsSUFBSSxjQUFjLEVBQUU7UUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7U0FDckI7UUFDRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHlDQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7SUFFRCxPQUFPO1FBQ0wsTUFBTTtRQUNOLFdBQVc7UUFDWCxpQkFBaUI7S0FDbEIsQ0FBQztBQUNKLENBQUM7QUF4REQsMEZBd0RDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsS0FBb0M7SUFDckUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksWUFBWSxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQztBQU5ELGdEQU1DO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBb0M7SUFDcEUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxLQUFLLENBQUM7S0FDZDtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQztBQU5ELDhDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGphdmFzY3JpcHQgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IG1lcmdlIGFzIHdlYnBhY2tNZXJnZSB9IGZyb20gJ3dlYnBhY2stbWVyZ2UnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi4vYnVpbGRlcnMvYnJvd3Nlci9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgQnVpbGRlcldhdGNoUGx1Z2luLFxuICBCdWlsZGVyV2F0Y2hlckZhY3RvcnksXG59IGZyb20gJy4uL3Rvb2xzL3dlYnBhY2svcGx1Z2lucy9idWlsZGVyLXdhdGNoLXBsdWdpbic7XG5pbXBvcnQgeyBOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWEsIGRlZmF1bHRQcm9ncmVzcywgbm9ybWFsaXplQnJvd3NlclNjaGVtYSB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zIH0gZnJvbSAnLi4vdXRpbHMvYnVpbGQtb3B0aW9ucyc7XG5pbXBvcnQgeyByZWFkVHNjb25maWcgfSBmcm9tICcuLi91dGlscy9yZWFkLXRzY29uZmlnJztcbmltcG9ydCB7IEkxOG5PcHRpb25zLCBjb25maWd1cmVJMThuQnVpbGQgfSBmcm9tICcuL2kxOG4tb3B0aW9ucyc7XG5cbmV4cG9ydCB0eXBlIEJyb3dzZXJXZWJwYWNrQ29uZmlnT3B0aW9ucyA9IFdlYnBhY2tDb25maWdPcHRpb25zPE5vcm1hbGl6ZWRCcm93c2VyQnVpbGRlclNjaGVtYT47XG5cbmV4cG9ydCB0eXBlIFdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yID0gKFxuICBjb25maWd1cmF0aW9uT3B0aW9uczogQnJvd3NlcldlYnBhY2tDb25maWdPcHRpb25zLFxuKSA9PiAoUHJvbWlzZTxDb25maWd1cmF0aW9uPiB8IENvbmZpZ3VyYXRpb24pW107XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVdlYnBhY2tDb25maWcoXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgcHJvamVjdFJvb3Q6IHN0cmluZyxcbiAgc291cmNlUm9vdDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBvcHRpb25zOiBOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWEsXG4gIHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yOiBXZWJwYWNrUGFydGlhbEdlbmVyYXRvcixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgZXh0cmFCdWlsZE9wdGlvbnM6IFBhcnRpYWw8Tm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hPixcbik6IFByb21pc2U8Q29uZmlndXJhdGlvbj4ge1xuICAvLyBFbnN1cmUgQnVpbGQgT3B0aW1pemVyIGlzIG9ubHkgdXNlZCB3aXRoIEFPVC5cbiAgaWYgKG9wdGlvbnMuYnVpbGRPcHRpbWl6ZXIgJiYgIW9wdGlvbnMuYW90KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgJ2J1aWxkT3B0aW1pemVyJyBvcHRpb24gY2Fubm90IGJlIHVzZWQgd2l0aG91dCAnYW90Jy5gKTtcbiAgfVxuXG4gIGNvbnN0IHRzQ29uZmlnUGF0aCA9IHBhdGgucmVzb2x2ZSh3b3Jrc3BhY2VSb290LCBvcHRpb25zLnRzQ29uZmlnKTtcbiAgY29uc3QgdHNDb25maWcgPSBhd2FpdCByZWFkVHNjb25maWcodHNDb25maWdQYXRoKTtcblxuICBjb25zdCBidWlsZE9wdGlvbnM6IE5vcm1hbGl6ZWRCcm93c2VyQnVpbGRlclNjaGVtYSA9IHsgLi4ub3B0aW9ucywgLi4uZXh0cmFCdWlsZE9wdGlvbnMgfTtcbiAgY29uc3Qgd2NvOiBCcm93c2VyV2VicGFja0NvbmZpZ09wdGlvbnMgPSB7XG4gICAgcm9vdDogd29ya3NwYWNlUm9vdCxcbiAgICBsb2dnZXI6IGxvZ2dlci5jcmVhdGVDaGlsZCgnd2VicGFja0NvbmZpZ09wdGlvbnMnKSxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBzb3VyY2VSb290LFxuICAgIGJ1aWxkT3B0aW9ucyxcbiAgICB0c0NvbmZpZyxcbiAgICB0c0NvbmZpZ1BhdGgsXG4gICAgcHJvamVjdE5hbWUsXG4gIH07XG5cbiAgd2NvLmJ1aWxkT3B0aW9ucy5wcm9ncmVzcyA9IGRlZmF1bHRQcm9ncmVzcyh3Y28uYnVpbGRPcHRpb25zLnByb2dyZXNzKTtcblxuICBjb25zdCBwYXJ0aWFscyA9IGF3YWl0IFByb21pc2UuYWxsKHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yKHdjbykpO1xuICBjb25zdCB3ZWJwYWNrQ29uZmlnID0gd2VicGFja01lcmdlKHBhcnRpYWxzKTtcblxuICByZXR1cm4gd2VicGFja0NvbmZpZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSTE4bkJyb3dzZXJXZWJwYWNrQ29uZmlnRnJvbUNvbnRleHQoXG4gIG9wdGlvbnM6IEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgd2VicGFja1BhcnRpYWxHZW5lcmF0b3I6IFdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yLFxuICBleHRyYUJ1aWxkT3B0aW9uczogUGFydGlhbDxOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWE+ID0ge30sXG4pOiBQcm9taXNlPHtcbiAgY29uZmlnOiBDb25maWd1cmF0aW9uO1xuICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuICBwcm9qZWN0U291cmNlUm9vdD86IHN0cmluZztcbiAgaTE4bjogSTE4bk9wdGlvbnM7XG59PiB7XG4gIGNvbnN0IHsgYnVpbGRPcHRpb25zLCBpMThuIH0gPSBhd2FpdCBjb25maWd1cmVJMThuQnVpbGQoY29udGV4dCwgb3B0aW9ucyk7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdlbmVyYXRlQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dChcbiAgICBidWlsZE9wdGlvbnMsXG4gICAgY29udGV4dCxcbiAgICAod2NvKSA9PiB7XG4gICAgICByZXR1cm4gd2VicGFja1BhcnRpYWxHZW5lcmF0b3Iod2NvKTtcbiAgICB9LFxuICAgIGV4dHJhQnVpbGRPcHRpb25zLFxuICApO1xuICBjb25zdCBjb25maWcgPSByZXN1bHQuY29uZmlnO1xuXG4gIGlmIChpMThuLnNob3VsZElubGluZSkge1xuICAgIC8vIFJlbW92ZSBsb2NhbGl6ZSBcInBvbHlmaWxsXCIgaWYgaW4gQU9UIG1vZGVcbiAgICBpZiAoYnVpbGRPcHRpb25zLmFvdCkge1xuICAgICAgaWYgKCFjb25maWcucmVzb2x2ZSkge1xuICAgICAgICBjb25maWcucmVzb2x2ZSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29uZmlnLnJlc29sdmUuYWxpYXMpKSB7XG4gICAgICAgIGNvbmZpZy5yZXNvbHZlLmFsaWFzLnB1c2goe1xuICAgICAgICAgIG5hbWU6ICdAYW5ndWxhci9sb2NhbGl6ZS9pbml0JyxcbiAgICAgICAgICBhbGlhczogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFjb25maWcucmVzb2x2ZS5hbGlhcykge1xuICAgICAgICAgIGNvbmZpZy5yZXNvbHZlLmFsaWFzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnLnJlc29sdmUuYWxpYXNbJ0Bhbmd1bGFyL2xvY2FsaXplL2luaXQnXSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBmaWxlIGhhc2hlcyB0byBpbmNsdWRlIHRyYW5zbGF0aW9uIGZpbGUgY29udGVudFxuICAgIGNvbnN0IGkxOG5IYXNoID0gT2JqZWN0LnZhbHVlcyhpMThuLmxvY2FsZXMpLnJlZHVjZShcbiAgICAgIChkYXRhLCBsb2NhbGUpID0+IGRhdGEgKyBsb2NhbGUuZmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLmludGVncml0eSB8fCAnJykuam9pbignfCcpLFxuICAgICAgJycsXG4gICAgKTtcblxuICAgIGNvbmZpZy5wbHVnaW5zID8/PSBbXTtcbiAgICBjb25maWcucGx1Z2lucy5wdXNoKHtcbiAgICAgIGFwcGx5KGNvbXBpbGVyKSB7XG4gICAgICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnYnVpbGQtYW5ndWxhcicsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgICAgIGphdmFzY3JpcHQuSmF2YXNjcmlwdE1vZHVsZXNQbHVnaW4uZ2V0Q29tcGlsYXRpb25Ib29rcyhjb21waWxhdGlvbikuY2h1bmtIYXNoLnRhcChcbiAgICAgICAgICAgICdidWlsZC1hbmd1bGFyJyxcbiAgICAgICAgICAgIChfLCBoYXNoKSA9PiB7XG4gICAgICAgICAgICAgIGhhc2gudXBkYXRlKCckbG9jYWxpemUnICsgaTE4bkhhc2gpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4geyAuLi5yZXN1bHQsIGkxOG4gfTtcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUJyb3dzZXJXZWJwYWNrQ29uZmlnRnJvbUNvbnRleHQoXG4gIG9wdGlvbnM6IEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgd2VicGFja1BhcnRpYWxHZW5lcmF0b3I6IFdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yLFxuICBleHRyYUJ1aWxkT3B0aW9uczogUGFydGlhbDxOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWE+ID0ge30sXG4pOiBQcm9taXNlPHsgY29uZmlnOiBDb25maWd1cmF0aW9uOyBwcm9qZWN0Um9vdDogc3RyaW5nOyBwcm9qZWN0U291cmNlUm9vdD86IHN0cmluZyB9PiB7XG4gIGNvbnN0IHByb2plY3ROYW1lID0gY29udGV4dC50YXJnZXQgJiYgY29udGV4dC50YXJnZXQucHJvamVjdDtcbiAgaWYgKCFwcm9qZWN0TmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGJ1aWxkZXIgcmVxdWlyZXMgYSB0YXJnZXQuJyk7XG4gIH1cblxuICBjb25zdCB3b3Jrc3BhY2VSb290ID0gY29udGV4dC53b3Jrc3BhY2VSb290O1xuICBjb25zdCBwcm9qZWN0TWV0YWRhdGEgPSBhd2FpdCBjb250ZXh0LmdldFByb2plY3RNZXRhZGF0YShwcm9qZWN0TmFtZSk7XG4gIGNvbnN0IHByb2plY3RSb290ID0gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIChwcm9qZWN0TWV0YWRhdGEucm9vdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKTtcbiAgY29uc3Qgc291cmNlUm9vdCA9IHByb2plY3RNZXRhZGF0YS5zb3VyY2VSb290IGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3QgcHJvamVjdFNvdXJjZVJvb3QgPSBzb3VyY2VSb290ID8gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIHNvdXJjZVJvb3QpIDogdW5kZWZpbmVkO1xuXG4gIGNvbnN0IG5vcm1hbGl6ZWRPcHRpb25zID0gbm9ybWFsaXplQnJvd3NlclNjaGVtYShcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIHByb2plY3RSb290LFxuICAgIHByb2plY3RTb3VyY2VSb290LFxuICAgIG9wdGlvbnMsXG4gICAgcHJvamVjdE1ldGFkYXRhLFxuICAgIGNvbnRleHQubG9nZ2VyLFxuICApO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdlbmVyYXRlV2VicGFja0NvbmZpZyhcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIHByb2plY3RSb290LFxuICAgIHByb2plY3RTb3VyY2VSb290LFxuICAgIHByb2plY3ROYW1lLFxuICAgIG5vcm1hbGl6ZWRPcHRpb25zLFxuICAgIHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yLFxuICAgIGNvbnRleHQubG9nZ2VyLFxuICAgIGV4dHJhQnVpbGRPcHRpb25zLFxuICApO1xuXG4gIC8vIElmIGJ1aWxkZXIgd2F0Y2ggc3VwcG9ydCBpcyBwcmVzZW50IGluIHRoZSBjb250ZXh0LCBhZGQgd2F0Y2ggcGx1Z2luXG4gIC8vIFRoaXMgaXMgaW50ZXJuYWwgb25seSBhbmQgY3VycmVudGx5IG9ubHkgdXNlZCBmb3IgdGVzdGluZ1xuICBjb25zdCB3YXRjaGVyRmFjdG9yeSA9IChcbiAgICBjb250ZXh0IGFzIHtcbiAgICAgIHdhdGNoZXJGYWN0b3J5PzogQnVpbGRlcldhdGNoZXJGYWN0b3J5O1xuICAgIH1cbiAgKS53YXRjaGVyRmFjdG9yeTtcbiAgaWYgKHdhdGNoZXJGYWN0b3J5KSB7XG4gICAgaWYgKCFjb25maWcucGx1Z2lucykge1xuICAgICAgY29uZmlnLnBsdWdpbnMgPSBbXTtcbiAgICB9XG4gICAgY29uZmlnLnBsdWdpbnMucHVzaChuZXcgQnVpbGRlcldhdGNoUGx1Z2luKHdhdGNoZXJGYWN0b3J5KSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvbmZpZyxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBwcm9qZWN0U291cmNlUm9vdCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluZGV4T3V0cHV0RmlsZShpbmRleDogQnJvd3NlckJ1aWxkZXJTY2hlbWFbJ2luZGV4J10pOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGluZGV4ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKGluZGV4KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaW5kZXgub3V0cHV0IHx8ICdpbmRleC5odG1sJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5kZXhJbnB1dEZpbGUoaW5kZXg6IEJyb3dzZXJCdWlsZGVyU2NoZW1hWydpbmRleCddKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBpbmRleCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGluZGV4LmlucHV0O1xuICB9XG59XG4iXX0=