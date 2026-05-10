"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const babel_loader_1 = require("babel-loader");
const load_esm_1 = require("../../utils/load-esm");
const package_version_1 = require("../../utils/package-version");
const application_1 = require("./presets/application");
/**
 * Cached instance of the compiler-cli linker's Babel plugin factory function.
 */
let linkerPluginCreator;
/**
 * Cached instance of the localize Babel plugins factory functions.
 */
let i18nPluginCreators;
// eslint-disable-next-line max-lines-per-function
exports.default = (0, babel_loader_1.custom)(() => {
    const baseOptions = Object.freeze({
        babelrc: false,
        configFile: false,
        compact: false,
        cacheCompression: false,
        sourceType: 'unambiguous',
        inputSourceMap: false,
    });
    return {
        async customOptions(options, { source, map }) {
            const { i18n, aot, optimize, instrumentCode, supportedBrowsers, ...rawOptions } = options;
            // Must process file if plugins are added
            let shouldProcess = Array.isArray(rawOptions.plugins) && rawOptions.plugins.length > 0;
            const customOptions = {
                forceAsyncTransformation: false,
                angularLinker: undefined,
                i18n: undefined,
                instrumentCode: undefined,
                supportedBrowsers,
            };
            // Analyze file for linking
            if (await (0, application_1.requiresLinking)(this.resourcePath, source)) {
                // Load ESM `@angular/compiler-cli/linker/babel` using the TypeScript dynamic import workaround.
                // Once TypeScript provides support for keeping the dynamic import this workaround can be
                // changed to a direct dynamic import.
                linkerPluginCreator ?? (linkerPluginCreator = (await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli/linker/babel')).createEs2015LinkerPlugin);
                customOptions.angularLinker = {
                    shouldLink: true,
                    jitMode: aot !== true,
                    linkerPluginCreator,
                };
                shouldProcess = true;
            }
            // Application code (TS files) will only contain native async if target is ES2017+.
            // However, third-party libraries can regardless of the target option.
            // APF packages with code in [f]esm2015 directories is downlevelled to ES2015 and
            // will not have native async.
            customOptions.forceAsyncTransformation =
                !/[\\/][_f]?esm2015[\\/]/.test(this.resourcePath) && source.includes('async');
            shouldProcess || (shouldProcess = customOptions.forceAsyncTransformation ||
                customOptions.supportedBrowsers !== undefined ||
                false);
            // Analyze for i18n inlining
            if (i18n &&
                !/[\\/]@angular[\\/](?:compiler|localize)/.test(this.resourcePath) &&
                source.includes('$localize')) {
                // Load the i18n plugin creators from the new `@angular/localize/tools` entry point.
                // This may fail during the transition to ESM due to the entry point not yet existing.
                // During the transition, this will always attempt to load the entry point for each file.
                // This will only occur during prerelease and will be automatically corrected once the new
                // entry point exists.
                if (i18nPluginCreators === undefined) {
                    // Load ESM `@angular/localize/tools` using the TypeScript dynamic import workaround.
                    // Once TypeScript provides support for keeping the dynamic import this workaround can be
                    // changed to a direct dynamic import.
                    i18nPluginCreators = await (0, load_esm_1.loadEsmModule)('@angular/localize/tools');
                }
                customOptions.i18n = {
                    ...i18n,
                    pluginCreators: i18nPluginCreators,
                };
                // Add translation files as dependencies of the file to support rebuilds
                // Except for `@angular/core` which needs locale injection but has no translations
                if (customOptions.i18n.translationFiles &&
                    !/[\\/]@angular[\\/]core/.test(this.resourcePath)) {
                    for (const file of customOptions.i18n.translationFiles) {
                        this.addDependency(file);
                    }
                }
                shouldProcess = true;
            }
            if (optimize) {
                const AngularPackage = /[\\/]node_modules[\\/]@angular[\\/]/.test(this.resourcePath);
                const sideEffectFree = !!this._module?.factoryMeta?.sideEffectFree;
                customOptions.optimize = {
                    // Angular packages provide additional tested side effects guarantees and can use
                    // otherwise unsafe optimizations. (@angular/platform-server/init) however has side-effects.
                    pureTopLevel: AngularPackage && sideEffectFree,
                    // JavaScript modules that are marked as side effect free are considered to have
                    // no decorators that contain non-local effects.
                    wrapDecorators: sideEffectFree,
                };
                shouldProcess = true;
            }
            if (instrumentCode &&
                !instrumentCode.excludedPaths.has(this.resourcePath) &&
                !/\.(e2e|spec)\.tsx?$|[\\/]node_modules[\\/]/.test(this.resourcePath) &&
                this.resourcePath.startsWith(instrumentCode.includedBasePath)) {
                // `babel-plugin-istanbul` has it's own includes but we do the below so that we avoid running the the loader.
                customOptions.instrumentCode = {
                    includedBasePath: instrumentCode.includedBasePath,
                    inputSourceMap: map,
                };
                shouldProcess = true;
            }
            // Add provided loader options to default base options
            const loaderOptions = {
                ...baseOptions,
                ...rawOptions,
                cacheIdentifier: JSON.stringify({
                    buildAngular: package_version_1.VERSION,
                    customOptions,
                    baseOptions,
                    rawOptions,
                }),
            };
            // Skip babel processing if no actions are needed
            if (!shouldProcess) {
                // Force the current file to be ignored
                loaderOptions.ignore = [() => true];
            }
            return { custom: customOptions, loader: loaderOptions };
        },
        config(configuration, { customOptions }) {
            return {
                ...configuration.options,
                // Using `false` disables babel from attempting to locate sourcemaps or process any inline maps.
                // The babel types do not include the false option even though it is valid
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                inputSourceMap: configuration.options.inputSourceMap ?? false,
                presets: [
                    ...(configuration.options.presets || []),
                    [
                        require('./presets/application').default,
                        {
                            ...customOptions,
                            diagnosticReporter: (type, message) => {
                                switch (type) {
                                    case 'error':
                                        this.emitError(message);
                                        break;
                                    case 'info':
                                    // Webpack does not currently have an informational diagnostic
                                    case 'warning':
                                        this.emitWarning(message);
                                        break;
                                }
                            },
                        },
                    ],
                ],
            };
        },
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9iYWJlbC93ZWJwYWNrLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtDQUFzQztBQUN0QyxtREFBcUQ7QUFDckQsaUVBQXNEO0FBQ3RELHVEQUkrQjtBQVkvQjs7R0FFRztBQUNILElBQUksbUJBRVMsQ0FBQztBQUVkOztHQUVHO0FBQ0gsSUFBSSxrQkFBa0QsQ0FBQztBQUV2RCxrREFBa0Q7QUFDbEQsa0JBQWUsSUFBQSxxQkFBTSxFQUEyQixHQUFHLEVBQUU7SUFDbkQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNoQyxPQUFPLEVBQUUsS0FBSztRQUNkLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsZ0JBQWdCLEVBQUUsS0FBSztRQUN2QixVQUFVLEVBQUUsYUFBYTtRQUN6QixjQUFjLEVBQUUsS0FBSztLQUN0QixDQUFDLENBQUM7SUFFSCxPQUFPO1FBQ0wsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQzFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxVQUFVLEVBQUUsR0FDN0UsT0FBb0MsQ0FBQztZQUV2Qyx5Q0FBeUM7WUFDekMsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRXZGLE1BQU0sYUFBYSxHQUE2QjtnQkFDOUMsd0JBQXdCLEVBQUUsS0FBSztnQkFD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Q0FBQyx1QkFBdUIsQ0FBQyxDQUFDLE9BQU87d0JBQ3hDOzRCQUNFLEdBQUcsYUFBYTs0QkFDaEIsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0NBQ3BDLFFBQVEsSUFBSSxFQUFFO29DQUNaLEtBQUssT0FBTzt3Q0FDVixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dDQUN4QixNQUFNO29DQUNSLEtBQUssTUFBTSxDQUFDO29DQUNaLDhEQUE4RDtvQ0FDOUQsS0FBSyxTQUFTO3dDQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7d0NBQzFCLE1BQU07aUNBQ1Q7NEJBQ0gsQ0FBQzt5QkFDMEI7cUJBQzlCO2lCQUNGO2FBQ0YsQ0FBQztRQUNKLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgY3VzdG9tIH0gZnJvbSAnYmFiZWwtbG9hZGVyJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuLi8uLi91dGlscy9sb2FkLWVzbSc7XG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGFja2FnZS12ZXJzaW9uJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uUHJlc2V0T3B0aW9ucyxcbiAgSTE4blBsdWdpbkNyZWF0b3JzLFxuICByZXF1aXJlc0xpbmtpbmcsXG59IGZyb20gJy4vcHJlc2V0cy9hcHBsaWNhdGlvbic7XG5cbmludGVyZmFjZSBBbmd1bGFyQ3VzdG9tT3B0aW9ucyBleHRlbmRzIE9taXQ8QXBwbGljYXRpb25QcmVzZXRPcHRpb25zLCAnaW5zdHJ1bWVudENvZGUnPiB7XG4gIGluc3RydW1lbnRDb2RlPzoge1xuICAgIC8qKiBub2RlX21vZHVsZXMgYW5kIHRlc3QgZmlsZXMgYXJlIGFsd2F5cyBleGNsdWRlZC4gKi9cbiAgICBleGNsdWRlZFBhdGhzOiBTZXQ8c3RyaW5nPjtcbiAgICBpbmNsdWRlZEJhc2VQYXRoOiBzdHJpbmc7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIEFuZ3VsYXJCYWJlbExvYWRlck9wdGlvbnMgPSBBbmd1bGFyQ3VzdG9tT3B0aW9ucyAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXG4vKipcbiAqIENhY2hlZCBpbnN0YW5jZSBvZiB0aGUgY29tcGlsZXItY2xpIGxpbmtlcidzIEJhYmVsIHBsdWdpbiBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5sZXQgbGlua2VyUGx1Z2luQ3JlYXRvcjpcbiAgfCB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGkvbGlua2VyL2JhYmVsJykuY3JlYXRlRXMyMDE1TGlua2VyUGx1Z2luXG4gIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIENhY2hlZCBpbnN0YW5jZSBvZiB0aGUgbG9jYWxpemUgQmFiZWwgcGx1Z2lucyBmYWN0b3J5IGZ1bmN0aW9ucy5cbiAqL1xubGV0IGkxOG5QbHVnaW5DcmVhdG9yczogSTE4blBsdWdpbkNyZWF0b3JzIHwgdW5kZWZpbmVkO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGRlZmF1bHQgY3VzdG9tPEFwcGxpY2F0aW9uUHJlc2V0T3B0aW9ucz4oKCkgPT4ge1xuICBjb25zdCBiYXNlT3B0aW9ucyA9IE9iamVjdC5mcmVlemUoe1xuICAgIGJhYmVscmM6IGZhbHNlLFxuICAgIGNvbmZpZ0ZpbGU6IGZhbHNlLFxuICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgIGNhY2hlQ29tcHJlc3Npb246IGZhbHNlLFxuICAgIHNvdXJjZVR5cGU6ICd1bmFtYmlndW91cycsXG4gICAgaW5wdXRTb3VyY2VNYXA6IGZhbHNlLFxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGFzeW5jIGN1c3RvbU9wdGlvbnMob3B0aW9ucywgeyBzb3VyY2UsIG1hcCB9KSB7XG4gICAgICBjb25zdCB7IGkxOG4sIGFvdCwgb3B0aW1pemUsIGluc3RydW1lbnRDb2RlLCBzdXBwb3J0ZWRCcm93c2VycywgLi4ucmF3T3B0aW9ucyB9ID1cbiAgICAgICAgb3B0aW9ucyBhcyBBbmd1bGFyQmFiZWxMb2FkZXJPcHRpb25zO1xuXG4gICAgICAvLyBNdXN0IHByb2Nlc3MgZmlsZSBpZiBwbHVnaW5zIGFyZSBhZGRlZFxuICAgICAgbGV0IHNob3VsZFByb2Nlc3MgPSBBcnJheS5pc0FycmF5KHJhd09wdGlvbnMucGx1Z2lucykgJiYgcmF3T3B0aW9ucy5wbHVnaW5zLmxlbmd0aCA+IDA7XG5cbiAgICAgIGNvbnN0IGN1c3RvbU9wdGlvbnM6IEFwcGxpY2F0aW9uUHJlc2V0T3B0aW9ucyA9IHtcbiAgICAgICAgZm9yY2VBc3luY1RyYW5zZm9ybWF0aW9uOiBmYWxzZSxcbiAgICAgICAgYW5ndWxhckxpbmtlcjogdW5kZWZpbmVkLFxuICAgICAgICBpMThuOiB1bmRlZmluZWQsXG4gICAgICAgIGluc3RydW1lbnRDb2RlOiB1bmRlZmluZWQsXG4gICAgICAgIHN1cHBvcnRlZEJyb3dzZXJzLFxuICAgICAgfTtcblxuICAgICAgLy8gQW5hbHl6ZSBmaWxlIGZvciBsaW5raW5nXG4gICAgICBpZiAoYXdhaXQgcmVxdWlyZXNMaW5raW5nKHRoaXMucmVzb3VyY2VQYXRoLCBzb3VyY2UpKSB7XG4gICAgICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlci1jbGkvbGlua2VyL2JhYmVsYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgICBsaW5rZXJQbHVnaW5DcmVhdG9yID8/PSAoXG4gICAgICAgICAgYXdhaXQgbG9hZEVzbU1vZHVsZTx0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGkvbGlua2VyL2JhYmVsJyk+KFxuICAgICAgICAgICAgJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9saW5rZXIvYmFiZWwnLFxuICAgICAgICAgIClcbiAgICAgICAgKS5jcmVhdGVFczIwMTVMaW5rZXJQbHVnaW47XG5cbiAgICAgICAgY3VzdG9tT3B0aW9ucy5hbmd1bGFyTGlua2VyID0ge1xuICAgICAgICAgIHNob3VsZExpbms6IHRydWUsXG4gICAgICAgICAgaml0TW9kZTogYW90ICE9PSB0cnVlLFxuICAgICAgICAgIGxpbmtlclBsdWdpbkNyZWF0b3IsXG4gICAgICAgIH07XG4gICAgICAgIHNob3VsZFByb2Nlc3MgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBsaWNhdGlvbiBjb2RlIChUUyBmaWxlcykgd2lsbCBvbmx5IGNvbnRhaW4gbmF0aXZlIGFzeW5jIGlmIHRhcmdldCBpcyBFUzIwMTcrLlxuICAgICAgLy8gSG93ZXZlciwgdGhpcmQtcGFydHkgbGlicmFyaWVzIGNhbiByZWdhcmRsZXNzIG9mIHRoZSB0YXJnZXQgb3B0aW9uLlxuICAgICAgLy8gQVBGIHBhY2thZ2VzIHdpdGggY29kZSBpbiBbZl1lc20yMDE1IGRpcmVjdG9yaWVzIGlzIGRvd25sZXZlbGxlZCB0byBFUzIwMTUgYW5kXG4gICAgICAvLyB3aWxsIG5vdCBoYXZlIG5hdGl2ZSBhc3luYy5cbiAgICAgIGN1c3RvbU9wdGlvbnMuZm9yY2VBc3luY1RyYW5zZm9ybWF0aW9uID1cbiAgICAgICAgIS9bXFxcXC9dW19mXT9lc20yMDE1W1xcXFwvXS8udGVzdCh0aGlzLnJlc291cmNlUGF0aCkgJiYgc291cmNlLmluY2x1ZGVzKCdhc3luYycpO1xuXG4gICAgICBzaG91bGRQcm9jZXNzIHx8PVxuICAgICAgICBjdXN0b21PcHRpb25zLmZvcmNlQXN5bmNUcmFuc2Zvcm1hdGlvbiB8fFxuICAgICAgICBjdXN0b21PcHRpb25zLnN1cHBvcnRlZEJyb3dzZXJzICE9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgZmFsc2U7XG5cbiAgICAgIC8vIEFuYWx5emUgZm9yIGkxOG4gaW5saW5pbmdcbiAgICAgIGlmIChcbiAgICAgICAgaTE4biAmJlxuICAgICAgICAhL1tcXFxcL11AYW5ndWxhcltcXFxcL10oPzpjb21waWxlcnxsb2NhbGl6ZSkvLnRlc3QodGhpcy5yZXNvdXJjZVBhdGgpICYmXG4gICAgICAgIHNvdXJjZS5pbmNsdWRlcygnJGxvY2FsaXplJylcbiAgICAgICkge1xuICAgICAgICAvLyBMb2FkIHRoZSBpMThuIHBsdWdpbiBjcmVhdG9ycyBmcm9tIHRoZSBuZXcgYEBhbmd1bGFyL2xvY2FsaXplL3Rvb2xzYCBlbnRyeSBwb2ludC5cbiAgICAgICAgLy8gVGhpcyBtYXkgZmFpbCBkdXJpbmcgdGhlIHRyYW5zaXRpb24gdG8gRVNNIGR1ZSB0byB0aGUgZW50cnkgcG9pbnQgbm90IHlldCBleGlzdGluZy5cbiAgICAgICAgLy8gRHVyaW5nIHRoZSB0cmFuc2l0aW9uLCB0aGlzIHdpbGwgYWx3YXlzIGF0dGVtcHQgdG8gbG9hZCB0aGUgZW50cnkgcG9pbnQgZm9yIGVhY2ggZmlsZS5cbiAgICAgICAgLy8gVGhpcyB3aWxsIG9ubHkgb2NjdXIgZHVyaW5nIHByZXJlbGVhc2UgYW5kIHdpbGwgYmUgYXV0b21hdGljYWxseSBjb3JyZWN0ZWQgb25jZSB0aGUgbmV3XG4gICAgICAgIC8vIGVudHJ5IHBvaW50IGV4aXN0cy5cbiAgICAgICAgaWYgKGkxOG5QbHVnaW5DcmVhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2xvY2FsaXplL3Rvb2xzYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgICAgIC8vIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuIGJlXG4gICAgICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgICAgICBpMThuUGx1Z2luQ3JlYXRvcnMgPSBhd2FpdCBsb2FkRXNtTW9kdWxlPEkxOG5QbHVnaW5DcmVhdG9ycz4oJ0Bhbmd1bGFyL2xvY2FsaXplL3Rvb2xzJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjdXN0b21PcHRpb25zLmkxOG4gPSB7XG4gICAgICAgICAgLi4uKGkxOG4gYXMgTm9uTnVsbGFibGU8QXBwbGljYXRpb25QcmVzZXRPcHRpb25zWydpMThuJ10+KSxcbiAgICAgICAgICBwbHVnaW5DcmVhdG9yczogaTE4blBsdWdpbkNyZWF0b3JzLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEFkZCB0cmFuc2xhdGlvbiBmaWxlcyBhcyBkZXBlbmRlbmNpZXMgb2YgdGhlIGZpbGUgdG8gc3VwcG9ydCByZWJ1aWxkc1xuICAgICAgICAvLyBFeGNlcHQgZm9yIGBAYW5ndWxhci9jb3JlYCB3aGljaCBuZWVkcyBsb2NhbGUgaW5qZWN0aW9uIGJ1dCBoYXMgbm8gdHJhbnNsYXRpb25zXG4gICAgICAgIGlmIChcbiAgICAgICAgICBjdXN0b21PcHRpb25zLmkxOG4udHJhbnNsYXRpb25GaWxlcyAmJlxuICAgICAgICAgICEvW1xcXFwvXUBhbmd1bGFyW1xcXFwvXWNvcmUvLnRlc3QodGhpcy5yZXNvdXJjZVBhdGgpXG4gICAgICAgICkge1xuICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBjdXN0b21PcHRpb25zLmkxOG4udHJhbnNsYXRpb25GaWxlcykge1xuICAgICAgICAgICAgdGhpcy5hZGREZXBlbmRlbmN5KGZpbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNob3VsZFByb2Nlc3MgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW1pemUpIHtcbiAgICAgICAgY29uc3QgQW5ndWxhclBhY2thZ2UgPSAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL10vLnRlc3QodGhpcy5yZXNvdXJjZVBhdGgpO1xuICAgICAgICBjb25zdCBzaWRlRWZmZWN0RnJlZSA9ICEhdGhpcy5fbW9kdWxlPy5mYWN0b3J5TWV0YT8uc2lkZUVmZmVjdEZyZWU7XG4gICAgICAgIGN1c3RvbU9wdGlvbnMub3B0aW1pemUgPSB7XG4gICAgICAgICAgLy8gQW5ndWxhciBwYWNrYWdlcyBwcm92aWRlIGFkZGl0aW9uYWwgdGVzdGVkIHNpZGUgZWZmZWN0cyBndWFyYW50ZWVzIGFuZCBjYW4gdXNlXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIHVuc2FmZSBvcHRpbWl6YXRpb25zLiAoQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyL2luaXQpIGhvd2V2ZXIgaGFzIHNpZGUtZWZmZWN0cy5cbiAgICAgICAgICBwdXJlVG9wTGV2ZWw6IEFuZ3VsYXJQYWNrYWdlICYmIHNpZGVFZmZlY3RGcmVlLFxuICAgICAgICAgIC8vIEphdmFTY3JpcHQgbW9kdWxlcyB0aGF0IGFyZSBtYXJrZWQgYXMgc2lkZSBlZmZlY3QgZnJlZSBhcmUgY29uc2lkZXJlZCB0byBoYXZlXG4gICAgICAgICAgLy8gbm8gZGVjb3JhdG9ycyB0aGF0IGNvbnRhaW4gbm9uLWxvY2FsIGVmZmVjdHMuXG4gICAgICAgICAgd3JhcERlY29yYXRvcnM6IHNpZGVFZmZlY3RGcmVlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHNob3VsZFByb2Nlc3MgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGluc3RydW1lbnRDb2RlICYmXG4gICAgICAgICFpbnN0cnVtZW50Q29kZS5leGNsdWRlZFBhdGhzLmhhcyh0aGlzLnJlc291cmNlUGF0aCkgJiZcbiAgICAgICAgIS9cXC4oZTJlfHNwZWMpXFwudHN4PyR8W1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL10vLnRlc3QodGhpcy5yZXNvdXJjZVBhdGgpICYmXG4gICAgICAgIHRoaXMucmVzb3VyY2VQYXRoLnN0YXJ0c1dpdGgoaW5zdHJ1bWVudENvZGUuaW5jbHVkZWRCYXNlUGF0aClcbiAgICAgICkge1xuICAgICAgICAvLyBgYmFiZWwtcGx1Z2luLWlzdGFuYnVsYCBoYXMgaXQncyBvd24gaW5jbHVkZXMgYnV0IHdlIGRvIHRoZSBiZWxvdyBzbyB0aGF0IHdlIGF2b2lkIHJ1bm5pbmcgdGhlIHRoZSBsb2FkZXIuXG4gICAgICAgIGN1c3RvbU9wdGlvbnMuaW5zdHJ1bWVudENvZGUgPSB7XG4gICAgICAgICAgaW5jbHVkZWRCYXNlUGF0aDogaW5zdHJ1bWVudENvZGUuaW5jbHVkZWRCYXNlUGF0aCxcbiAgICAgICAgICBpbnB1dFNvdXJjZU1hcDogbWFwLFxuICAgICAgICB9O1xuXG4gICAgICAgIHNob3VsZFByb2Nlc3MgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgcHJvdmlkZWQgbG9hZGVyIG9wdGlvbnMgdG8gZGVmYXVsdCBiYXNlIG9wdGlvbnNcbiAgICAgIGNvbnN0IGxvYWRlck9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgICAuLi5iYXNlT3B0aW9ucyxcbiAgICAgICAgLi4ucmF3T3B0aW9ucyxcbiAgICAgICAgY2FjaGVJZGVudGlmaWVyOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgYnVpbGRBbmd1bGFyOiBWRVJTSU9OLFxuICAgICAgICAgIGN1c3RvbU9wdGlvbnMsXG4gICAgICAgICAgYmFzZU9wdGlvbnMsXG4gICAgICAgICAgcmF3T3B0aW9ucyxcbiAgICAgICAgfSksXG4gICAgICB9O1xuXG4gICAgICAvLyBTa2lwIGJhYmVsIHByb2Nlc3NpbmcgaWYgbm8gYWN0aW9ucyBhcmUgbmVlZGVkXG4gICAgICBpZiAoIXNob3VsZFByb2Nlc3MpIHtcbiAgICAgICAgLy8gRm9yY2UgdGhlIGN1cnJlbnQgZmlsZSB0byBiZSBpZ25vcmVkXG4gICAgICAgIGxvYWRlck9wdGlvbnMuaWdub3JlID0gWygpID0+IHRydWVdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBjdXN0b206IGN1c3RvbU9wdGlvbnMsIGxvYWRlcjogbG9hZGVyT3B0aW9ucyB9O1xuICAgIH0sXG4gICAgY29uZmlnKGNvbmZpZ3VyYXRpb24sIHsgY3VzdG9tT3B0aW9ucyB9KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5jb25maWd1cmF0aW9uLm9wdGlvbnMsXG4gICAgICAgIC8vIFVzaW5nIGBmYWxzZWAgZGlzYWJsZXMgYmFiZWwgZnJvbSBhdHRlbXB0aW5nIHRvIGxvY2F0ZSBzb3VyY2VtYXBzIG9yIHByb2Nlc3MgYW55IGlubGluZSBtYXBzLlxuICAgICAgICAvLyBUaGUgYmFiZWwgdHlwZXMgZG8gbm90IGluY2x1ZGUgdGhlIGZhbHNlIG9wdGlvbiBldmVuIHRob3VnaCBpdCBpcyB2YWxpZFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICBpbnB1dFNvdXJjZU1hcDogY29uZmlndXJhdGlvbi5vcHRpb25zLmlucHV0U291cmNlTWFwID8/IChmYWxzZSBhcyBhbnkpLFxuICAgICAgICBwcmVzZXRzOiBbXG4gICAgICAgICAgLi4uKGNvbmZpZ3VyYXRpb24ub3B0aW9ucy5wcmVzZXRzIHx8IFtdKSxcbiAgICAgICAgICBbXG4gICAgICAgICAgICByZXF1aXJlKCcuL3ByZXNldHMvYXBwbGljYXRpb24nKS5kZWZhdWx0LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAuLi5jdXN0b21PcHRpb25zLFxuICAgICAgICAgICAgICBkaWFnbm9zdGljUmVwb3J0ZXI6ICh0eXBlLCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ2luZm8nOlxuICAgICAgICAgICAgICAgICAgLy8gV2VicGFjayBkb2VzIG5vdCBjdXJyZW50bHkgaGF2ZSBhbiBpbmZvcm1hdGlvbmFsIGRpYWdub3N0aWNcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRXYXJuaW5nKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9IGFzIEFwcGxpY2F0aW9uUHJlc2V0T3B0aW9ucyxcbiAgICAgICAgICBdLFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9LFxuICB9O1xufSk7XG4iXX0=