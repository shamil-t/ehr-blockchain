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
exports.createServerCodeBundleOptions = exports.createBrowserCodeBundleOptions = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_path_1 = __importDefault(require("node:path"));
const environment_options_1 = require("../../utils/environment-options");
const compiler_plugin_1 = require("./angular/compiler-plugin");
const compiler_plugin_options_1 = require("./compiler-plugin-options");
const external_packages_plugin_1 = require("./external-packages-plugin");
const rxjs_esm_resolution_plugin_1 = require("./rxjs-esm-resolution-plugin");
const sourcemap_ignorelist_plugin_1 = require("./sourcemap-ignorelist-plugin");
const utils_1 = require("./utils");
const virtual_module_plugin_1 = require("./virtual-module-plugin");
function createBrowserCodeBundleOptions(options, target, sourceFileCache) {
    const { workspaceRoot, entryPoints, outputNames, jit } = options;
    const { pluginOptions, styleOptions } = (0, compiler_plugin_options_1.createCompilerPluginOptions)(options, target, sourceFileCache);
    const buildOptions = {
        ...getEsBuildCommonOptions(options),
        platform: 'browser',
        // Note: `es2015` is needed for RxJS v6. If not specified, `module` would
        // match and the ES5 distribution would be bundled and ends up breaking at
        // runtime with the RxJS testing library.
        // More details: https://github.com/angular/angular-cli/issues/25405.
        mainFields: ['es2020', 'es2015', 'browser', 'module', 'main'],
        entryNames: outputNames.bundles,
        entryPoints,
        target,
        supported: (0, utils_1.getFeatureSupport)(target),
        plugins: [
            (0, sourcemap_ignorelist_plugin_1.createSourcemapIgnorelistPlugin)(),
            (0, compiler_plugin_1.createCompilerPlugin)(
            // JS/TS options
            pluginOptions, 
            // Component stylesheet options
            styleOptions),
        ],
    };
    if (options.externalPackages) {
        buildOptions.plugins ?? (buildOptions.plugins = []);
        buildOptions.plugins.push((0, external_packages_plugin_1.createExternalPackagesPlugin)());
    }
    const polyfills = options.polyfills ? [...options.polyfills] : [];
    if (jit) {
        polyfills.push('@angular/compiler');
    }
    if (polyfills?.length) {
        const namespace = 'angular:polyfills';
        buildOptions.entryPoints = {
            ...buildOptions.entryPoints,
            'polyfills': namespace,
        };
        buildOptions.plugins?.unshift((0, virtual_module_plugin_1.createVirtualModulePlugin)({
            namespace,
            loadContent: () => ({
                contents: polyfills.map((file) => `import '${file.replace(/\\/g, '/')}';`).join('\n'),
                loader: 'js',
                resolveDir: workspaceRoot,
            }),
        }));
    }
    return buildOptions;
}
exports.createBrowserCodeBundleOptions = createBrowserCodeBundleOptions;
/**
 * Create an esbuild 'build' options object for the server bundle.
 * @param options The builder's user-provider normalized options.
 * @returns An esbuild BuildOptions object.
 */
function createServerCodeBundleOptions(options, target, sourceFileCache) {
    const { jit, serverEntryPoint, workspaceRoot, ssrOptions } = options;
    (0, node_assert_1.default)(serverEntryPoint, 'createServerCodeBundleOptions should not be called without a defined serverEntryPoint.');
    const { pluginOptions, styleOptions } = (0, compiler_plugin_options_1.createCompilerPluginOptions)(options, target, sourceFileCache);
    const mainServerNamespace = 'angular:main-server';
    const ssrEntryNamespace = 'angular:ssr-entry';
    const entryPoints = {
        'main.server': mainServerNamespace,
    };
    const ssrEntryPoint = ssrOptions?.entry;
    if (ssrEntryPoint) {
        entryPoints['server'] = ssrEntryNamespace;
    }
    const buildOptions = {
        ...getEsBuildCommonOptions(options),
        platform: 'node',
        outExtension: { '.js': '.mjs' },
        // Note: `es2015` is needed for RxJS v6. If not specified, `module` would
        // match and the ES5 distribution would be bundled and ends up breaking at
        // runtime with the RxJS testing library.
        // More details: https://github.com/angular/angular-cli/issues/25405.
        mainFields: ['es2020', 'es2015', 'module', 'main'],
        entryNames: '[name]',
        target,
        banner: {
            // Note: Needed as esbuild does not provide require shims / proxy from ESModules.
            // See: https://github.com/evanw/esbuild/issues/1921.
            js: [
                `import { createRequire } from 'node:module';`,
                `globalThis['require'] ??= createRequire(import.meta.url);`,
            ].join('\n'),
        },
        entryPoints,
        supported: (0, utils_1.getFeatureSupport)(target),
        plugins: [
            (0, sourcemap_ignorelist_plugin_1.createSourcemapIgnorelistPlugin)(),
            (0, compiler_plugin_1.createCompilerPlugin)(
            // JS/TS options
            { ...pluginOptions, noopTypeScriptCompilation: true }, 
            // Component stylesheet options
            styleOptions),
        ],
    };
    buildOptions.plugins ?? (buildOptions.plugins = []);
    if (options.externalPackages) {
        buildOptions.plugins.push((0, external_packages_plugin_1.createExternalPackagesPlugin)());
    }
    else {
        buildOptions.plugins.push((0, rxjs_esm_resolution_plugin_1.createRxjsEsmResolutionPlugin)());
    }
    const polyfills = [`import '@angular/platform-server/init';`];
    if (options.polyfills?.includes('zone.js')) {
        polyfills.push(`import 'zone.js/fesm2015/zone-node.js';`);
    }
    if (jit) {
        polyfills.push(`import '@angular/compiler';`);
    }
    buildOptions.plugins.push((0, virtual_module_plugin_1.createVirtualModulePlugin)({
        namespace: mainServerNamespace,
        loadContent: () => {
            const mainServerEntryPoint = node_path_1.default
                .relative(workspaceRoot, serverEntryPoint)
                .replace(/\\/g, '/');
            return {
                contents: [
                    ...polyfills,
                    `import moduleOrBootstrapFn from './${mainServerEntryPoint}';`,
                    `export default moduleOrBootstrapFn;`,
                    `export * from './${mainServerEntryPoint}';`,
                    `export { renderApplication, renderModule, ɵSERVER_CONTEXT } from '@angular/platform-server';`,
                ].join('\n'),
                loader: 'js',
                resolveDir: workspaceRoot,
            };
        },
    }));
    if (ssrEntryPoint) {
        buildOptions.plugins.push((0, virtual_module_plugin_1.createVirtualModulePlugin)({
            namespace: ssrEntryNamespace,
            loadContent: () => {
                const mainServerEntryPoint = node_path_1.default
                    .relative(workspaceRoot, ssrEntryPoint)
                    .replace(/\\/g, '/');
                return {
                    contents: [
                        ...polyfills,
                        `import './${mainServerEntryPoint}';`,
                        `export * from './${mainServerEntryPoint}';`,
                    ].join('\n'),
                    loader: 'js',
                    resolveDir: workspaceRoot,
                };
            },
        }));
    }
    return buildOptions;
}
exports.createServerCodeBundleOptions = createServerCodeBundleOptions;
function getEsBuildCommonOptions(options) {
    const { workspaceRoot, outExtension, optimizationOptions, sourcemapOptions, tsconfig, externalDependencies, outputNames, preserveSymlinks, jit, } = options;
    return {
        absWorkingDir: workspaceRoot,
        bundle: true,
        format: 'esm',
        assetNames: outputNames.media,
        conditions: ['es2020', 'es2015', 'module'],
        resolveExtensions: ['.ts', '.tsx', '.mjs', '.js'],
        metafile: true,
        legalComments: options.extractLicenses ? 'none' : 'eof',
        logLevel: options.verbose ? 'debug' : 'silent',
        minifyIdentifiers: optimizationOptions.scripts && environment_options_1.allowMangle,
        minifySyntax: optimizationOptions.scripts,
        minifyWhitespace: optimizationOptions.scripts,
        pure: ['forwardRef'],
        outdir: workspaceRoot,
        outExtension: outExtension ? { '.js': `.${outExtension}` } : undefined,
        sourcemap: sourcemapOptions.scripts && (sourcemapOptions.hidden ? 'external' : true),
        splitting: true,
        chunkNames: 'chunk-[hash]',
        tsconfig,
        external: externalDependencies,
        write: false,
        preserveSymlinks,
        define: {
            // Only set to false when script optimizations are enabled. It should not be set to true because
            // Angular turns `ngDevMode` into an object for development debugging purposes when not defined
            // which a constant true value would break.
            ...(optimizationOptions.scripts ? { 'ngDevMode': 'false' } : undefined),
            'ngJitMode': jit ? 'true' : 'false',
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24tY29kZS1idW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2FwcGxpY2F0aW9uLWNvZGUtYnVuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILDhEQUFpQztBQUNqQywwREFBNkI7QUFFN0IseUVBQThEO0FBQzlELCtEQUFrRjtBQUNsRix1RUFBd0U7QUFDeEUseUVBQTBFO0FBQzFFLDZFQUE2RTtBQUM3RSwrRUFBZ0Y7QUFDaEYsbUNBQTRDO0FBQzVDLG1FQUFvRTtBQUVwRSxTQUFnQiw4QkFBOEIsQ0FDNUMsT0FBMEMsRUFDMUMsTUFBZ0IsRUFDaEIsZUFBaUM7SUFFakMsTUFBTSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUVqRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUEscURBQTJCLEVBQ2pFLE9BQU8sRUFDUCxNQUFNLEVBQ04sZUFBZSxDQUNoQixDQUFDO0lBRUYsTUFBTSxZQUFZLEdBQWlCO1FBQ2pDLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDO1FBQ25DLFFBQVEsRUFBRSxTQUFTO1FBQ25CLHlFQUF5RTtRQUN6RSwwRUFBMEU7UUFDMUUseUNBQXlDO1FBQ3pDLHFFQUFxRTtRQUNyRSxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDO1FBQzdELFVBQVUsRUFBRSxXQUFXLENBQUMsT0FBTztRQUMvQixXQUFXO1FBQ1gsTUFBTTtRQUNOLFNBQVMsRUFBRSxJQUFBLHlCQUFpQixFQUFDLE1BQU0sQ0FBQztRQUNwQyxPQUFPLEVBQUU7WUFDUCxJQUFBLDZEQUErQixHQUFFO1lBQ2pDLElBQUEsc0NBQW9CO1lBQ2xCLGdCQUFnQjtZQUNoQixhQUFhO1lBQ2IsK0JBQStCO1lBQy9CLFlBQVksQ0FDYjtTQUNGO0tBQ0YsQ0FBQztJQUVGLElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFO1FBQzVCLFlBQVksQ0FBQyxPQUFPLEtBQXBCLFlBQVksQ0FBQyxPQUFPLEdBQUssRUFBRSxFQUFDO1FBQzVCLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsdURBQTRCLEdBQUUsQ0FBQyxDQUFDO0tBQzNEO0lBRUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2xFLElBQUksR0FBRyxFQUFFO1FBQ1AsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsSUFBSSxTQUFTLEVBQUUsTUFBTSxFQUFFO1FBQ3JCLE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDO1FBQ3RDLFlBQVksQ0FBQyxXQUFXLEdBQUc7WUFDekIsR0FBRyxZQUFZLENBQUMsV0FBVztZQUMzQixXQUFXLEVBQUUsU0FBUztTQUN2QixDQUFDO1FBRUYsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQzNCLElBQUEsaURBQXlCLEVBQUM7WUFDeEIsU0FBUztZQUNULFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQixRQUFRLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDckYsTUFBTSxFQUFFLElBQUk7Z0JBQ1osVUFBVSxFQUFFLGFBQWE7YUFDMUIsQ0FBQztTQUNILENBQUMsQ0FDSCxDQUFDO0tBQ0g7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBbEVELHdFQWtFQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQiw2QkFBNkIsQ0FDM0MsT0FBMEMsRUFDMUMsTUFBZ0IsRUFDaEIsZUFBZ0M7SUFFaEMsTUFBTSxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBRXJFLElBQUEscUJBQU0sRUFDSixnQkFBZ0IsRUFDaEIsd0ZBQXdGLENBQ3pGLENBQUM7SUFFRixNQUFNLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUEscURBQTJCLEVBQ2pFLE9BQU8sRUFDUCxNQUFNLEVBQ04sZUFBZSxDQUNoQixDQUFDO0lBRUYsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztJQUNsRCxNQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDO0lBRTlDLE1BQU0sV0FBVyxHQUEyQjtRQUMxQyxhQUFhLEVBQUUsbUJBQW1CO0tBQ25DLENBQUM7SUFFRixNQUFNLGFBQWEsR0FBRyxVQUFVLEVBQUUsS0FBSyxDQUFDO0lBQ3hDLElBQUksYUFBYSxFQUFFO1FBQ2pCLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztLQUMzQztJQUVELE1BQU0sWUFBWSxHQUFpQjtRQUNqQyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQztRQUNuQyxRQUFRLEVBQUUsTUFBTTtRQUNoQixZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO1FBQy9CLHlFQUF5RTtRQUN6RSwwRUFBMEU7UUFDMUUseUNBQXlDO1FBQ3pDLHFFQUFxRTtRQUNyRSxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUM7UUFDbEQsVUFBVSxFQUFFLFFBQVE7UUFDcEIsTUFBTTtRQUNOLE1BQU0sRUFBRTtZQUNOLGlGQUFpRjtZQUNqRixxREFBcUQ7WUFDckQsRUFBRSxFQUFFO2dCQUNGLDhDQUE4QztnQkFDOUMsMkRBQTJEO2FBQzVELENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNiO1FBQ0QsV0FBVztRQUNYLFNBQVMsRUFBRSxJQUFBLHlCQUFpQixFQUFDLE1BQU0sQ0FBQztRQUNwQyxPQUFPLEVBQUU7WUFDUCxJQUFBLDZEQUErQixHQUFFO1lBQ2pDLElBQUEsc0NBQW9CO1lBQ2xCLGdCQUFnQjtZQUNoQixFQUFFLEdBQUcsYUFBYSxFQUFFLHlCQUF5QixFQUFFLElBQUksRUFBRTtZQUNyRCwrQkFBK0I7WUFDL0IsWUFBWSxDQUNiO1NBQ0Y7S0FDRixDQUFDO0lBRUYsWUFBWSxDQUFDLE9BQU8sS0FBcEIsWUFBWSxDQUFDLE9BQU8sR0FBSyxFQUFFLEVBQUM7SUFDNUIsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7UUFDNUIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSx1REFBNEIsR0FBRSxDQUFDLENBQUM7S0FDM0Q7U0FBTTtRQUNMLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsMERBQTZCLEdBQUUsQ0FBQyxDQUFDO0tBQzVEO0lBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO0lBRTlELElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDMUMsU0FBUyxDQUFDLElBQUksQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO0tBQzNEO0lBRUQsSUFBSSxHQUFHLEVBQUU7UUFDUCxTQUFTLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7S0FDL0M7SUFFRCxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDdkIsSUFBQSxpREFBeUIsRUFBQztRQUN4QixTQUFTLEVBQUUsbUJBQW1CO1FBQzlCLFdBQVcsRUFBRSxHQUFHLEVBQUU7WUFDaEIsTUFBTSxvQkFBb0IsR0FBRyxtQkFBSTtpQkFDOUIsUUFBUSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQztpQkFDekMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV2QixPQUFPO2dCQUNMLFFBQVEsRUFBRTtvQkFDUixHQUFHLFNBQVM7b0JBQ1osc0NBQXNDLG9CQUFvQixJQUFJO29CQUM5RCxxQ0FBcUM7b0JBQ3JDLG9CQUFvQixvQkFBb0IsSUFBSTtvQkFDNUMsOEZBQThGO2lCQUMvRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ1osTUFBTSxFQUFFLElBQUk7Z0JBQ1osVUFBVSxFQUFFLGFBQWE7YUFDMUIsQ0FBQztRQUNKLENBQUM7S0FDRixDQUFDLENBQ0gsQ0FBQztJQUVGLElBQUksYUFBYSxFQUFFO1FBQ2pCLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUN2QixJQUFBLGlEQUF5QixFQUFDO1lBQ3hCLFNBQVMsRUFBRSxpQkFBaUI7WUFDNUIsV0FBVyxFQUFFLEdBQUcsRUFBRTtnQkFDaEIsTUFBTSxvQkFBb0IsR0FBRyxtQkFBSTtxQkFDOUIsUUFBUSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7cUJBQ3RDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRXZCLE9BQU87b0JBQ0wsUUFBUSxFQUFFO3dCQUNSLEdBQUcsU0FBUzt3QkFDWixhQUFhLG9CQUFvQixJQUFJO3dCQUNyQyxvQkFBb0Isb0JBQW9CLElBQUk7cUJBQzdDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDWixNQUFNLEVBQUUsSUFBSTtvQkFDWixVQUFVLEVBQUUsYUFBYTtpQkFDMUIsQ0FBQztZQUNKLENBQUM7U0FDRixDQUFDLENBQ0gsQ0FBQztLQUNIO0lBRUQsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQTlIRCxzRUE4SEM7QUFFRCxTQUFTLHVCQUF1QixDQUFDLE9BQTBDO0lBQ3pFLE1BQU0sRUFDSixhQUFhLEVBQ2IsWUFBWSxFQUNaLG1CQUFtQixFQUNuQixnQkFBZ0IsRUFDaEIsUUFBUSxFQUNSLG9CQUFvQixFQUNwQixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLEdBQUcsR0FDSixHQUFHLE9BQU8sQ0FBQztJQUVaLE9BQU87UUFDTCxhQUFhLEVBQUUsYUFBYTtRQUM1QixNQUFNLEVBQUUsSUFBSTtRQUNaLE1BQU0sRUFBRSxLQUFLO1FBQ2IsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLO1FBQzdCLFVBQVUsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQzFDLGlCQUFpQixFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ2pELFFBQVEsRUFBRSxJQUFJO1FBQ2QsYUFBYSxFQUFFLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSztRQUN2RCxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRO1FBQzlDLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLE9BQU8sSUFBSSxpQ0FBVztRQUM3RCxZQUFZLEVBQUUsbUJBQW1CLENBQUMsT0FBTztRQUN6QyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxPQUFPO1FBQzdDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQztRQUNwQixNQUFNLEVBQUUsYUFBYTtRQUNyQixZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDdEUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDcEYsU0FBUyxFQUFFLElBQUk7UUFDZixVQUFVLEVBQUUsY0FBYztRQUMxQixRQUFRO1FBQ1IsUUFBUSxFQUFFLG9CQUFvQjtRQUM5QixLQUFLLEVBQUUsS0FBSztRQUNaLGdCQUFnQjtRQUNoQixNQUFNLEVBQUU7WUFDTixnR0FBZ0c7WUFDaEcsK0ZBQStGO1lBQy9GLDJDQUEyQztZQUMzQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3ZFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTztTQUNwQztLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQnVpbGRPcHRpb25zIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdHlwZSB7IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyB9IGZyb20gJy4uLy4uL2J1aWxkZXJzL2FwcGxpY2F0aW9uL29wdGlvbnMnO1xuaW1wb3J0IHsgYWxsb3dNYW5nbGUgfSBmcm9tICcuLi8uLi91dGlscy9lbnZpcm9ubWVudC1vcHRpb25zJztcbmltcG9ydCB7IFNvdXJjZUZpbGVDYWNoZSwgY3JlYXRlQ29tcGlsZXJQbHVnaW4gfSBmcm9tICcuL2FuZ3VsYXIvY29tcGlsZXItcGx1Z2luJztcbmltcG9ydCB7IGNyZWF0ZUNvbXBpbGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vY29tcGlsZXItcGx1Z2luLW9wdGlvbnMnO1xuaW1wb3J0IHsgY3JlYXRlRXh0ZXJuYWxQYWNrYWdlc1BsdWdpbiB9IGZyb20gJy4vZXh0ZXJuYWwtcGFja2FnZXMtcGx1Z2luJztcbmltcG9ydCB7IGNyZWF0ZVJ4anNFc21SZXNvbHV0aW9uUGx1Z2luIH0gZnJvbSAnLi9yeGpzLWVzbS1yZXNvbHV0aW9uLXBsdWdpbic7XG5pbXBvcnQgeyBjcmVhdGVTb3VyY2VtYXBJZ25vcmVsaXN0UGx1Z2luIH0gZnJvbSAnLi9zb3VyY2VtYXAtaWdub3JlbGlzdC1wbHVnaW4nO1xuaW1wb3J0IHsgZ2V0RmVhdHVyZVN1cHBvcnQgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGNyZWF0ZVZpcnR1YWxNb2R1bGVQbHVnaW4gfSBmcm9tICcuL3ZpcnR1YWwtbW9kdWxlLXBsdWdpbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCcm93c2VyQ29kZUJ1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyxcbiAgdGFyZ2V0OiBzdHJpbmdbXSxcbiAgc291cmNlRmlsZUNhY2hlPzogU291cmNlRmlsZUNhY2hlLFxuKTogQnVpbGRPcHRpb25zIHtcbiAgY29uc3QgeyB3b3Jrc3BhY2VSb290LCBlbnRyeVBvaW50cywgb3V0cHV0TmFtZXMsIGppdCB9ID0gb3B0aW9ucztcblxuICBjb25zdCB7IHBsdWdpbk9wdGlvbnMsIHN0eWxlT3B0aW9ucyB9ID0gY3JlYXRlQ29tcGlsZXJQbHVnaW5PcHRpb25zKFxuICAgIG9wdGlvbnMsXG4gICAgdGFyZ2V0LFxuICAgIHNvdXJjZUZpbGVDYWNoZSxcbiAgKTtcblxuICBjb25zdCBidWlsZE9wdGlvbnM6IEJ1aWxkT3B0aW9ucyA9IHtcbiAgICAuLi5nZXRFc0J1aWxkQ29tbW9uT3B0aW9ucyhvcHRpb25zKSxcbiAgICBwbGF0Zm9ybTogJ2Jyb3dzZXInLFxuICAgIC8vIE5vdGU6IGBlczIwMTVgIGlzIG5lZWRlZCBmb3IgUnhKUyB2Ni4gSWYgbm90IHNwZWNpZmllZCwgYG1vZHVsZWAgd291bGRcbiAgICAvLyBtYXRjaCBhbmQgdGhlIEVTNSBkaXN0cmlidXRpb24gd291bGQgYmUgYnVuZGxlZCBhbmQgZW5kcyB1cCBicmVha2luZyBhdFxuICAgIC8vIHJ1bnRpbWUgd2l0aCB0aGUgUnhKUyB0ZXN0aW5nIGxpYnJhcnkuXG4gICAgLy8gTW9yZSBkZXRhaWxzOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMjU0MDUuXG4gICAgbWFpbkZpZWxkczogWydlczIwMjAnLCAnZXMyMDE1JywgJ2Jyb3dzZXInLCAnbW9kdWxlJywgJ21haW4nXSxcbiAgICBlbnRyeU5hbWVzOiBvdXRwdXROYW1lcy5idW5kbGVzLFxuICAgIGVudHJ5UG9pbnRzLFxuICAgIHRhcmdldCxcbiAgICBzdXBwb3J0ZWQ6IGdldEZlYXR1cmVTdXBwb3J0KHRhcmdldCksXG4gICAgcGx1Z2luczogW1xuICAgICAgY3JlYXRlU291cmNlbWFwSWdub3JlbGlzdFBsdWdpbigpLFxuICAgICAgY3JlYXRlQ29tcGlsZXJQbHVnaW4oXG4gICAgICAgIC8vIEpTL1RTIG9wdGlvbnNcbiAgICAgICAgcGx1Z2luT3B0aW9ucyxcbiAgICAgICAgLy8gQ29tcG9uZW50IHN0eWxlc2hlZXQgb3B0aW9uc1xuICAgICAgICBzdHlsZU9wdGlvbnMsXG4gICAgICApLFxuICAgIF0sXG4gIH07XG5cbiAgaWYgKG9wdGlvbnMuZXh0ZXJuYWxQYWNrYWdlcykge1xuICAgIGJ1aWxkT3B0aW9ucy5wbHVnaW5zID8/PSBbXTtcbiAgICBidWlsZE9wdGlvbnMucGx1Z2lucy5wdXNoKGNyZWF0ZUV4dGVybmFsUGFja2FnZXNQbHVnaW4oKSk7XG4gIH1cblxuICBjb25zdCBwb2x5ZmlsbHMgPSBvcHRpb25zLnBvbHlmaWxscyA/IFsuLi5vcHRpb25zLnBvbHlmaWxsc10gOiBbXTtcbiAgaWYgKGppdCkge1xuICAgIHBvbHlmaWxscy5wdXNoKCdAYW5ndWxhci9jb21waWxlcicpO1xuICB9XG5cbiAgaWYgKHBvbHlmaWxscz8ubGVuZ3RoKSB7XG4gICAgY29uc3QgbmFtZXNwYWNlID0gJ2FuZ3VsYXI6cG9seWZpbGxzJztcbiAgICBidWlsZE9wdGlvbnMuZW50cnlQb2ludHMgPSB7XG4gICAgICAuLi5idWlsZE9wdGlvbnMuZW50cnlQb2ludHMsXG4gICAgICAncG9seWZpbGxzJzogbmFtZXNwYWNlLFxuICAgIH07XG5cbiAgICBidWlsZE9wdGlvbnMucGx1Z2lucz8udW5zaGlmdChcbiAgICAgIGNyZWF0ZVZpcnR1YWxNb2R1bGVQbHVnaW4oe1xuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgIGxvYWRDb250ZW50OiAoKSA9PiAoe1xuICAgICAgICAgIGNvbnRlbnRzOiBwb2x5ZmlsbHMubWFwKChmaWxlKSA9PiBgaW1wb3J0ICcke2ZpbGUucmVwbGFjZSgvXFxcXC9nLCAnLycpfSc7YCkuam9pbignXFxuJyksXG4gICAgICAgICAgbG9hZGVyOiAnanMnLFxuICAgICAgICAgIHJlc29sdmVEaXI6IHdvcmtzcGFjZVJvb3QsXG4gICAgICAgIH0pLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBidWlsZE9wdGlvbnM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGVzYnVpbGQgJ2J1aWxkJyBvcHRpb25zIG9iamVjdCBmb3IgdGhlIHNlcnZlciBidW5kbGUuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgYnVpbGRlcidzIHVzZXItcHJvdmlkZXIgbm9ybWFsaXplZCBvcHRpb25zLlxuICogQHJldHVybnMgQW4gZXNidWlsZCBCdWlsZE9wdGlvbnMgb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VydmVyQ29kZUJ1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyxcbiAgdGFyZ2V0OiBzdHJpbmdbXSxcbiAgc291cmNlRmlsZUNhY2hlOiBTb3VyY2VGaWxlQ2FjaGUsXG4pOiBCdWlsZE9wdGlvbnMge1xuICBjb25zdCB7IGppdCwgc2VydmVyRW50cnlQb2ludCwgd29ya3NwYWNlUm9vdCwgc3NyT3B0aW9ucyB9ID0gb3B0aW9ucztcblxuICBhc3NlcnQoXG4gICAgc2VydmVyRW50cnlQb2ludCxcbiAgICAnY3JlYXRlU2VydmVyQ29kZUJ1bmRsZU9wdGlvbnMgc2hvdWxkIG5vdCBiZSBjYWxsZWQgd2l0aG91dCBhIGRlZmluZWQgc2VydmVyRW50cnlQb2ludC4nLFxuICApO1xuXG4gIGNvbnN0IHsgcGx1Z2luT3B0aW9ucywgc3R5bGVPcHRpb25zIH0gPSBjcmVhdGVDb21waWxlclBsdWdpbk9wdGlvbnMoXG4gICAgb3B0aW9ucyxcbiAgICB0YXJnZXQsXG4gICAgc291cmNlRmlsZUNhY2hlLFxuICApO1xuXG4gIGNvbnN0IG1haW5TZXJ2ZXJOYW1lc3BhY2UgPSAnYW5ndWxhcjptYWluLXNlcnZlcic7XG4gIGNvbnN0IHNzckVudHJ5TmFtZXNwYWNlID0gJ2FuZ3VsYXI6c3NyLWVudHJ5JztcblxuICBjb25zdCBlbnRyeVBvaW50czogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAnbWFpbi5zZXJ2ZXInOiBtYWluU2VydmVyTmFtZXNwYWNlLFxuICB9O1xuXG4gIGNvbnN0IHNzckVudHJ5UG9pbnQgPSBzc3JPcHRpb25zPy5lbnRyeTtcbiAgaWYgKHNzckVudHJ5UG9pbnQpIHtcbiAgICBlbnRyeVBvaW50c1snc2VydmVyJ10gPSBzc3JFbnRyeU5hbWVzcGFjZTtcbiAgfVxuXG4gIGNvbnN0IGJ1aWxkT3B0aW9uczogQnVpbGRPcHRpb25zID0ge1xuICAgIC4uLmdldEVzQnVpbGRDb21tb25PcHRpb25zKG9wdGlvbnMpLFxuICAgIHBsYXRmb3JtOiAnbm9kZScsXG4gICAgb3V0RXh0ZW5zaW9uOiB7ICcuanMnOiAnLm1qcycgfSxcbiAgICAvLyBOb3RlOiBgZXMyMDE1YCBpcyBuZWVkZWQgZm9yIFJ4SlMgdjYuIElmIG5vdCBzcGVjaWZpZWQsIGBtb2R1bGVgIHdvdWxkXG4gICAgLy8gbWF0Y2ggYW5kIHRoZSBFUzUgZGlzdHJpYnV0aW9uIHdvdWxkIGJlIGJ1bmRsZWQgYW5kIGVuZHMgdXAgYnJlYWtpbmcgYXRcbiAgICAvLyBydW50aW1lIHdpdGggdGhlIFJ4SlMgdGVzdGluZyBsaWJyYXJ5LlxuICAgIC8vIE1vcmUgZGV0YWlsczogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci1jbGkvaXNzdWVzLzI1NDA1LlxuICAgIG1haW5GaWVsZHM6IFsnZXMyMDIwJywgJ2VzMjAxNScsICdtb2R1bGUnLCAnbWFpbiddLFxuICAgIGVudHJ5TmFtZXM6ICdbbmFtZV0nLFxuICAgIHRhcmdldCxcbiAgICBiYW5uZXI6IHtcbiAgICAgIC8vIE5vdGU6IE5lZWRlZCBhcyBlc2J1aWxkIGRvZXMgbm90IHByb3ZpZGUgcmVxdWlyZSBzaGltcyAvIHByb3h5IGZyb20gRVNNb2R1bGVzLlxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZXZhbncvZXNidWlsZC9pc3N1ZXMvMTkyMS5cbiAgICAgIGpzOiBbXG4gICAgICAgIGBpbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbm9kZTptb2R1bGUnO2AsXG4gICAgICAgIGBnbG9iYWxUaGlzWydyZXF1aXJlJ10gPz89IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtgLFxuICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICB9LFxuICAgIGVudHJ5UG9pbnRzLFxuICAgIHN1cHBvcnRlZDogZ2V0RmVhdHVyZVN1cHBvcnQodGFyZ2V0KSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBjcmVhdGVTb3VyY2VtYXBJZ25vcmVsaXN0UGx1Z2luKCksXG4gICAgICBjcmVhdGVDb21waWxlclBsdWdpbihcbiAgICAgICAgLy8gSlMvVFMgb3B0aW9uc1xuICAgICAgICB7IC4uLnBsdWdpbk9wdGlvbnMsIG5vb3BUeXBlU2NyaXB0Q29tcGlsYXRpb246IHRydWUgfSxcbiAgICAgICAgLy8gQ29tcG9uZW50IHN0eWxlc2hlZXQgb3B0aW9uc1xuICAgICAgICBzdHlsZU9wdGlvbnMsXG4gICAgICApLFxuICAgIF0sXG4gIH07XG5cbiAgYnVpbGRPcHRpb25zLnBsdWdpbnMgPz89IFtdO1xuICBpZiAob3B0aW9ucy5leHRlcm5hbFBhY2thZ2VzKSB7XG4gICAgYnVpbGRPcHRpb25zLnBsdWdpbnMucHVzaChjcmVhdGVFeHRlcm5hbFBhY2thZ2VzUGx1Z2luKCkpO1xuICB9IGVsc2Uge1xuICAgIGJ1aWxkT3B0aW9ucy5wbHVnaW5zLnB1c2goY3JlYXRlUnhqc0VzbVJlc29sdXRpb25QbHVnaW4oKSk7XG4gIH1cblxuICBjb25zdCBwb2x5ZmlsbHMgPSBbYGltcG9ydCAnQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyL2luaXQnO2BdO1xuXG4gIGlmIChvcHRpb25zLnBvbHlmaWxscz8uaW5jbHVkZXMoJ3pvbmUuanMnKSkge1xuICAgIHBvbHlmaWxscy5wdXNoKGBpbXBvcnQgJ3pvbmUuanMvZmVzbTIwMTUvem9uZS1ub2RlLmpzJztgKTtcbiAgfVxuXG4gIGlmIChqaXQpIHtcbiAgICBwb2x5ZmlsbHMucHVzaChgaW1wb3J0ICdAYW5ndWxhci9jb21waWxlcic7YCk7XG4gIH1cblxuICBidWlsZE9wdGlvbnMucGx1Z2lucy5wdXNoKFxuICAgIGNyZWF0ZVZpcnR1YWxNb2R1bGVQbHVnaW4oe1xuICAgICAgbmFtZXNwYWNlOiBtYWluU2VydmVyTmFtZXNwYWNlLFxuICAgICAgbG9hZENvbnRlbnQ6ICgpID0+IHtcbiAgICAgICAgY29uc3QgbWFpblNlcnZlckVudHJ5UG9pbnQgPSBwYXRoXG4gICAgICAgICAgLnJlbGF0aXZlKHdvcmtzcGFjZVJvb3QsIHNlcnZlckVudHJ5UG9pbnQpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgICAuLi5wb2x5ZmlsbHMsXG4gICAgICAgICAgICBgaW1wb3J0IG1vZHVsZU9yQm9vdHN0cmFwRm4gZnJvbSAnLi8ke21haW5TZXJ2ZXJFbnRyeVBvaW50fSc7YCxcbiAgICAgICAgICAgIGBleHBvcnQgZGVmYXVsdCBtb2R1bGVPckJvb3RzdHJhcEZuO2AsXG4gICAgICAgICAgICBgZXhwb3J0ICogZnJvbSAnLi8ke21haW5TZXJ2ZXJFbnRyeVBvaW50fSc7YCxcbiAgICAgICAgICAgIGBleHBvcnQgeyByZW5kZXJBcHBsaWNhdGlvbiwgcmVuZGVyTW9kdWxlLCDJtVNFUlZFUl9DT05URVhUIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyJztgLFxuICAgICAgICAgIF0uam9pbignXFxuJyksXG4gICAgICAgICAgbG9hZGVyOiAnanMnLFxuICAgICAgICAgIHJlc29sdmVEaXI6IHdvcmtzcGFjZVJvb3QsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0pLFxuICApO1xuXG4gIGlmIChzc3JFbnRyeVBvaW50KSB7XG4gICAgYnVpbGRPcHRpb25zLnBsdWdpbnMucHVzaChcbiAgICAgIGNyZWF0ZVZpcnR1YWxNb2R1bGVQbHVnaW4oe1xuICAgICAgICBuYW1lc3BhY2U6IHNzckVudHJ5TmFtZXNwYWNlLFxuICAgICAgICBsb2FkQ29udGVudDogKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1haW5TZXJ2ZXJFbnRyeVBvaW50ID0gcGF0aFxuICAgICAgICAgICAgLnJlbGF0aXZlKHdvcmtzcGFjZVJvb3QsIHNzckVudHJ5UG9pbnQpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgICAgIC4uLnBvbHlmaWxscyxcbiAgICAgICAgICAgICAgYGltcG9ydCAnLi8ke21haW5TZXJ2ZXJFbnRyeVBvaW50fSc7YCxcbiAgICAgICAgICAgICAgYGV4cG9ydCAqIGZyb20gJy4vJHttYWluU2VydmVyRW50cnlQb2ludH0nO2AsXG4gICAgICAgICAgICBdLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgbG9hZGVyOiAnanMnLFxuICAgICAgICAgICAgcmVzb2x2ZURpcjogd29ya3NwYWNlUm9vdCxcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBidWlsZE9wdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGdldEVzQnVpbGRDb21tb25PcHRpb25zKG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyk6IEJ1aWxkT3B0aW9ucyB7XG4gIGNvbnN0IHtcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIG91dEV4dGVuc2lvbixcbiAgICBvcHRpbWl6YXRpb25PcHRpb25zLFxuICAgIHNvdXJjZW1hcE9wdGlvbnMsXG4gICAgdHNjb25maWcsXG4gICAgZXh0ZXJuYWxEZXBlbmRlbmNpZXMsXG4gICAgb3V0cHV0TmFtZXMsXG4gICAgcHJlc2VydmVTeW1saW5rcyxcbiAgICBqaXQsXG4gIH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiB7XG4gICAgYWJzV29ya2luZ0Rpcjogd29ya3NwYWNlUm9vdCxcbiAgICBidW5kbGU6IHRydWUsXG4gICAgZm9ybWF0OiAnZXNtJyxcbiAgICBhc3NldE5hbWVzOiBvdXRwdXROYW1lcy5tZWRpYSxcbiAgICBjb25kaXRpb25zOiBbJ2VzMjAyMCcsICdlczIwMTUnLCAnbW9kdWxlJ10sXG4gICAgcmVzb2x2ZUV4dGVuc2lvbnM6IFsnLnRzJywgJy50c3gnLCAnLm1qcycsICcuanMnXSxcbiAgICBtZXRhZmlsZTogdHJ1ZSxcbiAgICBsZWdhbENvbW1lbnRzOiBvcHRpb25zLmV4dHJhY3RMaWNlbnNlcyA/ICdub25lJyA6ICdlb2YnLFxuICAgIGxvZ0xldmVsOiBvcHRpb25zLnZlcmJvc2UgPyAnZGVidWcnIDogJ3NpbGVudCcsXG4gICAgbWluaWZ5SWRlbnRpZmllcnM6IG9wdGltaXphdGlvbk9wdGlvbnMuc2NyaXB0cyAmJiBhbGxvd01hbmdsZSxcbiAgICBtaW5pZnlTeW50YXg6IG9wdGltaXphdGlvbk9wdGlvbnMuc2NyaXB0cyxcbiAgICBtaW5pZnlXaGl0ZXNwYWNlOiBvcHRpbWl6YXRpb25PcHRpb25zLnNjcmlwdHMsXG4gICAgcHVyZTogWydmb3J3YXJkUmVmJ10sXG4gICAgb3V0ZGlyOiB3b3Jrc3BhY2VSb290LFxuICAgIG91dEV4dGVuc2lvbjogb3V0RXh0ZW5zaW9uID8geyAnLmpzJzogYC4ke291dEV4dGVuc2lvbn1gIH0gOiB1bmRlZmluZWQsXG4gICAgc291cmNlbWFwOiBzb3VyY2VtYXBPcHRpb25zLnNjcmlwdHMgJiYgKHNvdXJjZW1hcE9wdGlvbnMuaGlkZGVuID8gJ2V4dGVybmFsJyA6IHRydWUpLFxuICAgIHNwbGl0dGluZzogdHJ1ZSxcbiAgICBjaHVua05hbWVzOiAnY2h1bmstW2hhc2hdJyxcbiAgICB0c2NvbmZpZyxcbiAgICBleHRlcm5hbDogZXh0ZXJuYWxEZXBlbmRlbmNpZXMsXG4gICAgd3JpdGU6IGZhbHNlLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgZGVmaW5lOiB7XG4gICAgICAvLyBPbmx5IHNldCB0byBmYWxzZSB3aGVuIHNjcmlwdCBvcHRpbWl6YXRpb25zIGFyZSBlbmFibGVkLiBJdCBzaG91bGQgbm90IGJlIHNldCB0byB0cnVlIGJlY2F1c2VcbiAgICAgIC8vIEFuZ3VsYXIgdHVybnMgYG5nRGV2TW9kZWAgaW50byBhbiBvYmplY3QgZm9yIGRldmVsb3BtZW50IGRlYnVnZ2luZyBwdXJwb3NlcyB3aGVuIG5vdCBkZWZpbmVkXG4gICAgICAvLyB3aGljaCBhIGNvbnN0YW50IHRydWUgdmFsdWUgd291bGQgYnJlYWsuXG4gICAgICAuLi4ob3B0aW1pemF0aW9uT3B0aW9ucy5zY3JpcHRzID8geyAnbmdEZXZNb2RlJzogJ2ZhbHNlJyB9IDogdW5kZWZpbmVkKSxcbiAgICAgICduZ0ppdE1vZGUnOiBqaXQgPyAndHJ1ZScgOiAnZmFsc2UnLFxuICAgIH0sXG4gIH07XG59XG4iXX0=