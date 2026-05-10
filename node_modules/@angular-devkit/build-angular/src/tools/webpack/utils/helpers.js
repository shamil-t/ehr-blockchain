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
exports.isPlatformServerInstalled = exports.getStatsOptions = exports.assetPatterns = exports.globalScriptsByBundleName = exports.getCacheSettings = exports.normalizeGlobalStyles = exports.getInstrumentationExcludedPaths = exports.assetNameTemplateFactory = exports.normalizeExtraEntryPoints = exports.getOutputHashFormat = void 0;
const crypto_1 = require("crypto");
const fast_glob_1 = __importDefault(require("fast-glob"));
const path = __importStar(require("path"));
const schema_1 = require("../../../builders/browser/schema");
const package_version_1 = require("../../../utils/package-version");
function getOutputHashFormat(outputHashing = schema_1.OutputHashing.None, length = 20) {
    const hashTemplate = `.[contenthash:${length}]`;
    switch (outputHashing) {
        case 'media':
            return {
                chunk: '',
                extract: '',
                file: hashTemplate,
                script: '',
            };
        case 'bundles':
            return {
                chunk: hashTemplate,
                extract: hashTemplate,
                file: '',
                script: hashTemplate,
            };
        case 'all':
            return {
                chunk: hashTemplate,
                extract: hashTemplate,
                file: hashTemplate,
                script: hashTemplate,
            };
        case 'none':
        default:
            return {
                chunk: '',
                extract: '',
                file: '',
                script: '',
            };
    }
}
exports.getOutputHashFormat = getOutputHashFormat;
function normalizeExtraEntryPoints(extraEntryPoints, defaultBundleName) {
    return extraEntryPoints.map((entry) => {
        if (typeof entry === 'string') {
            return { input: entry, inject: true, bundleName: defaultBundleName };
        }
        const { inject = true, ...newEntry } = entry;
        let bundleName;
        if (entry.bundleName) {
            bundleName = entry.bundleName;
        }
        else if (!inject) {
            // Lazy entry points use the file name as bundle name.
            bundleName = path.parse(entry.input).name;
        }
        else {
            bundleName = defaultBundleName;
        }
        return { ...newEntry, inject, bundleName };
    });
}
exports.normalizeExtraEntryPoints = normalizeExtraEntryPoints;
function assetNameTemplateFactory(hashFormat) {
    const visitedFiles = new Map();
    return (resourcePath) => {
        if (hashFormat.file) {
            // File names are hashed therefore we don't need to handle files with the same file name.
            return `[name]${hashFormat.file}.[ext]`;
        }
        const filename = path.basename(resourcePath);
        // Check if the file with the same name has already been processed.
        const visited = visitedFiles.get(filename);
        if (!visited) {
            // Not visited.
            visitedFiles.set(filename, resourcePath);
            return filename;
        }
        else if (visited === resourcePath) {
            // Same file.
            return filename;
        }
        // File has the same name but it's in a different location.
        return '[path][name].[ext]';
    };
}
exports.assetNameTemplateFactory = assetNameTemplateFactory;
function getInstrumentationExcludedPaths(root, excludedPaths) {
    const excluded = new Set();
    for (const excludeGlob of excludedPaths) {
        const excludePath = excludeGlob[0] === '/' ? excludeGlob.slice(1) : excludeGlob;
        fast_glob_1.default.sync(excludePath, { cwd: root }).forEach((p) => excluded.add(path.join(root, p)));
    }
    return excluded;
}
exports.getInstrumentationExcludedPaths = getInstrumentationExcludedPaths;
function normalizeGlobalStyles(styleEntrypoints) {
    var _a;
    const entryPoints = {};
    const noInjectNames = [];
    if (styleEntrypoints.length === 0) {
        return { entryPoints, noInjectNames };
    }
    for (const style of normalizeExtraEntryPoints(styleEntrypoints, 'styles')) {
        // Add style entry points.
        entryPoints[_a = style.bundleName] ?? (entryPoints[_a] = []);
        entryPoints[style.bundleName].push(style.input);
        // Add non injected styles to the list.
        if (!style.inject) {
            noInjectNames.push(style.bundleName);
        }
    }
    return { entryPoints, noInjectNames };
}
exports.normalizeGlobalStyles = normalizeGlobalStyles;
function getCacheSettings(wco, angularVersion) {
    const { enabled, path: cacheDirectory } = wco.buildOptions.cache;
    if (enabled) {
        return {
            type: 'filesystem',
            profile: wco.buildOptions.verbose,
            cacheDirectory: path.join(cacheDirectory, 'angular-webpack'),
            maxMemoryGenerations: 1,
            // We use the versions and build options as the cache name. The Webpack configurations are too
            // dynamic and shared among different build types: test, build and serve.
            // None of which are "named".
            name: (0, crypto_1.createHash)('sha1')
                .update(angularVersion)
                .update(package_version_1.VERSION)
                .update(wco.projectRoot)
                .update(JSON.stringify(wco.tsConfig))
                .update(JSON.stringify({
                ...wco.buildOptions,
                // Needed because outputPath changes on every build when using i18n extraction
                // https://github.com/angular/angular-cli/blob/736a5f89deaca85f487b78aec9ff66d4118ceb6a/packages/angular_devkit/build_angular/src/utils/i18n-options.ts#L264-L265
                outputPath: undefined,
            }))
                .digest('hex'),
        };
    }
    if (wco.buildOptions.watch) {
        return {
            type: 'memory',
            maxGenerations: 1,
        };
    }
    return false;
}
exports.getCacheSettings = getCacheSettings;
function globalScriptsByBundleName(scripts) {
    return normalizeExtraEntryPoints(scripts, 'scripts').reduce((prev, curr) => {
        const { bundleName, inject, input } = curr;
        const existingEntry = prev.find((el) => el.bundleName === bundleName);
        if (existingEntry) {
            if (existingEntry.inject && !inject) {
                // All entries have to be lazy for the bundle to be lazy.
                throw new Error(`The ${bundleName} bundle is mixing injected and non-injected scripts.`);
            }
            existingEntry.paths.push(input);
        }
        else {
            prev.push({
                bundleName,
                inject,
                paths: [input],
            });
        }
        return prev;
    }, []);
}
exports.globalScriptsByBundleName = globalScriptsByBundleName;
function assetPatterns(root, assets) {
    return assets.map((asset, index) => {
        // Resolve input paths relative to workspace root and add slash at the end.
        // eslint-disable-next-line prefer-const
        let { input, output, ignore = [], glob } = asset;
        input = path.resolve(root, input).replace(/\\/g, '/');
        input = input.endsWith('/') ? input : input + '/';
        output = output.endsWith('/') ? output : output + '/';
        if (output.startsWith('..')) {
            throw new Error('An asset cannot be written to a location outside of the output path.');
        }
        return {
            context: input,
            // Now we remove starting slash to make Webpack place it from the output root.
            to: output.replace(/^\//, ''),
            from: glob,
            noErrorOnMissing: true,
            force: true,
            globOptions: {
                dot: true,
                followSymbolicLinks: !!asset.followSymlinks,
                ignore: [
                    '.gitkeep',
                    '**/.DS_Store',
                    '**/Thumbs.db',
                    // Negate patterns needs to be absolute because copy-webpack-plugin uses absolute globs which
                    // causes negate patterns not to match.
                    // See: https://github.com/webpack-contrib/copy-webpack-plugin/issues/498#issuecomment-639327909
                    ...ignore,
                ].map((i) => path.posix.join(input, i)),
            },
            priority: index,
        };
    });
}
exports.assetPatterns = assetPatterns;
function getStatsOptions(verbose = false) {
    const webpackOutputOptions = {
        all: false,
        colors: true,
        hash: true,
        timings: true,
        chunks: true,
        builtAt: true,
        warnings: true,
        errors: true,
        assets: true,
        cachedAssets: true,
        // Needed for markAsyncChunksNonInitial.
        ids: true,
        entrypoints: true,
    };
    const verboseWebpackOutputOptions = {
        // The verbose output will most likely be piped to a file, so colors just mess it up.
        colors: false,
        usedExports: true,
        optimizationBailout: true,
        reasons: true,
        children: true,
        assets: true,
        version: true,
        chunkModules: true,
        errorDetails: true,
        errorStack: true,
        moduleTrace: true,
        logging: 'verbose',
        modulesSpace: Infinity,
    };
    return verbose
        ? { ...webpackOutputOptions, ...verboseWebpackOutputOptions }
        : webpackOutputOptions;
}
exports.getStatsOptions = getStatsOptions;
/**
 * @param root the workspace root
 * @returns `true` when `@angular/platform-server` is installed.
 */
function isPlatformServerInstalled(root) {
    try {
        require.resolve('@angular/platform-server', { paths: [root] });
        return true;
    }
    catch {
        return false;
    }
}
exports.isPlatformServerInstalled = isPlatformServerInstalled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL3dlYnBhY2svdXRpbHMvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILG1DQUFvQztBQUNwQywwREFBNkI7QUFDN0IsMkNBQTZCO0FBRTdCLDZEQUswQztBQUUxQyxvRUFBeUQ7QUFXekQsU0FBZ0IsbUJBQW1CLENBQUMsYUFBYSxHQUFHLHNCQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sR0FBRyxFQUFFO0lBQ2pGLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixNQUFNLEdBQUcsQ0FBQztJQUVoRCxRQUFRLGFBQWEsRUFBRTtRQUNyQixLQUFLLE9BQU87WUFDVixPQUFPO2dCQUNMLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLElBQUksRUFBRSxZQUFZO2dCQUNsQixNQUFNLEVBQUUsRUFBRTthQUNYLENBQUM7UUFDSixLQUFLLFNBQVM7WUFDWixPQUFPO2dCQUNMLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsTUFBTSxFQUFFLFlBQVk7YUFDckIsQ0FBQztRQUNKLEtBQUssS0FBSztZQUNSLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsTUFBTSxFQUFFLFlBQVk7YUFDckIsQ0FBQztRQUNKLEtBQUssTUFBTSxDQUFDO1FBQ1o7WUFDRSxPQUFPO2dCQUNMLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLElBQUksRUFBRSxFQUFFO2dCQUNSLE1BQU0sRUFBRSxFQUFFO2FBQ1gsQ0FBQztLQUNMO0FBQ0gsQ0FBQztBQWxDRCxrREFrQ0M7QUFJRCxTQUFnQix5QkFBeUIsQ0FDdkMsZ0JBQWtELEVBQ2xELGlCQUF5QjtJQUV6QixPQUFPLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3BDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLENBQUM7U0FDdEU7UUFFRCxNQUFNLEVBQUUsTUFBTSxHQUFHLElBQUksRUFBRSxHQUFHLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUM3QyxJQUFJLFVBQVUsQ0FBQztRQUNmLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwQixVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztTQUMvQjthQUFNLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDbEIsc0RBQXNEO1lBQ3RELFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDM0M7YUFBTTtZQUNMLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztTQUNoQztRQUVELE9BQU8sRUFBRSxHQUFHLFFBQVEsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUM7SUFDN0MsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBdEJELDhEQXNCQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLFVBQXNCO0lBQzdELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBRS9DLE9BQU8sQ0FBQyxZQUFvQixFQUFFLEVBQUU7UUFDOUIsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFO1lBQ25CLHlGQUF5RjtZQUN6RixPQUFPLFNBQVMsVUFBVSxDQUFDLElBQUksUUFBUSxDQUFDO1NBQ3pDO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxtRUFBbUU7UUFDbkUsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osZUFBZTtZQUNmLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRXpDLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO2FBQU0sSUFBSSxPQUFPLEtBQUssWUFBWSxFQUFFO1lBQ25DLGFBQWE7WUFDYixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUVELDJEQUEyRDtRQUMzRCxPQUFPLG9CQUFvQixDQUFDO0lBQzlCLENBQUMsQ0FBQztBQUNKLENBQUM7QUF6QkQsNERBeUJDO0FBRUQsU0FBZ0IsK0JBQStCLENBQzdDLElBQVksRUFDWixhQUF1QjtJQUV2QixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBRW5DLEtBQUssTUFBTSxXQUFXLElBQUksYUFBYSxFQUFFO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUNoRixtQkFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hGO0lBRUQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQVpELDBFQVlDO0FBRUQsU0FBZ0IscUJBQXFCLENBQUMsZ0JBQWdDOztJQUlwRSxNQUFNLFdBQVcsR0FBNkIsRUFBRSxDQUFDO0lBQ2pELE1BQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQztJQUVuQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDakMsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsQ0FBQztLQUN2QztJQUVELEtBQUssTUFBTSxLQUFLLElBQUkseUJBQXlCLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDekUsMEJBQTBCO1FBQzFCLFdBQVcsTUFBQyxLQUFLLENBQUMsVUFBVSxNQUE1QixXQUFXLE9BQXVCLEVBQUUsRUFBQztRQUNyQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFaEQsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ2pCLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3RDO0tBQ0Y7SUFFRCxPQUFPLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUF2QkQsc0RBdUJDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQzlCLEdBQXlCLEVBQ3pCLGNBQXNCO0lBRXRCLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ2pFLElBQUksT0FBTyxFQUFFO1FBQ1gsT0FBTztZQUNMLElBQUksRUFBRSxZQUFZO1lBQ2xCLE9BQU8sRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLE9BQU87WUFDakMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDO1lBQzVELG9CQUFvQixFQUFFLENBQUM7WUFDdkIsOEZBQThGO1lBQzlGLHlFQUF5RTtZQUN6RSw2QkFBNkI7WUFDN0IsSUFBSSxFQUFFLElBQUEsbUJBQVUsRUFBQyxNQUFNLENBQUM7aUJBQ3JCLE1BQU0sQ0FBQyxjQUFjLENBQUM7aUJBQ3RCLE1BQU0sQ0FBQyx5QkFBTyxDQUFDO2lCQUNmLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO2lCQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3BDLE1BQU0sQ0FDTCxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNiLEdBQUcsR0FBRyxDQUFDLFlBQVk7Z0JBQ25CLDhFQUE4RTtnQkFDOUUsaUtBQWlLO2dCQUNqSyxVQUFVLEVBQUUsU0FBUzthQUN0QixDQUFDLENBQ0g7aUJBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNqQixDQUFDO0tBQ0g7SUFFRCxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFO1FBQzFCLE9BQU87WUFDTCxJQUFJLEVBQUUsUUFBUTtZQUNkLGNBQWMsRUFBRSxDQUFDO1NBQ2xCLENBQUM7S0FDSDtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQXZDRCw0Q0F1Q0M7QUFFRCxTQUFnQix5QkFBeUIsQ0FDdkMsT0FBd0I7SUFFeEIsT0FBTyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUN6RCxDQUFDLElBQWdFLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFDekUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRTNDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDdEUsSUFBSSxhQUFhLEVBQUU7WUFDakIsSUFBSSxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNuQyx5REFBeUQ7Z0JBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxVQUFVLHNEQUFzRCxDQUFDLENBQUM7YUFDMUY7WUFFRCxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNqQzthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDUixVQUFVO2dCQUNWLE1BQU07Z0JBQ04sS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDO2FBQ2YsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUMsRUFDRCxFQUFFLENBQ0gsQ0FBQztBQUNKLENBQUM7QUEzQkQsOERBMkJDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLElBQVksRUFBRSxNQUEyQjtJQUNyRSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUF3QixFQUFFLEtBQWEsRUFBaUIsRUFBRTtRQUMzRSwyRUFBMkU7UUFDM0Usd0NBQXdDO1FBQ3hDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ2pELEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7UUFDbEQsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUV0RCxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO1NBQ3pGO1FBRUQsT0FBTztZQUNMLE9BQU8sRUFBRSxLQUFLO1lBQ2QsOEVBQThFO1lBQzlFLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDN0IsSUFBSSxFQUFFLElBQUk7WUFDVixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLEtBQUssRUFBRSxJQUFJO1lBQ1gsV0FBVyxFQUFFO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2dCQUNULG1CQUFtQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYztnQkFDM0MsTUFBTSxFQUFFO29CQUNOLFVBQVU7b0JBQ1YsY0FBYztvQkFDZCxjQUFjO29CQUNkLDZGQUE2RjtvQkFDN0YsdUNBQXVDO29CQUN2QyxnR0FBZ0c7b0JBQ2hHLEdBQUcsTUFBTTtpQkFDVixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1lBQ0QsUUFBUSxFQUFFLEtBQUs7U0FDaEIsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXBDRCxzQ0FvQ0M7QUFFRCxTQUFnQixlQUFlLENBQUMsT0FBTyxHQUFHLEtBQUs7SUFDN0MsTUFBTSxvQkFBb0IsR0FBd0I7UUFDaEQsR0FBRyxFQUFFLEtBQUs7UUFDVixNQUFNLEVBQUUsSUFBSTtRQUNaLElBQUksRUFBRSxJQUFJO1FBQ1YsT0FBTyxFQUFFLElBQUk7UUFDYixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLElBQUk7UUFDZCxNQUFNLEVBQUUsSUFBSTtRQUNaLE1BQU0sRUFBRSxJQUFJO1FBQ1osWUFBWSxFQUFFLElBQUk7UUFFbEIsd0NBQXdDO1FBQ3hDLEdBQUcsRUFBRSxJQUFJO1FBQ1QsV0FBVyxFQUFFLElBQUk7S0FDbEIsQ0FBQztJQUVGLE1BQU0sMkJBQTJCLEdBQXdCO1FBQ3ZELHFGQUFxRjtRQUNyRixNQUFNLEVBQUUsS0FBSztRQUNiLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLG1CQUFtQixFQUFFLElBQUk7UUFDekIsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsSUFBSTtRQUNkLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7UUFDYixZQUFZLEVBQUUsSUFBSTtRQUNsQixZQUFZLEVBQUUsSUFBSTtRQUNsQixVQUFVLEVBQUUsSUFBSTtRQUNoQixXQUFXLEVBQUUsSUFBSTtRQUNqQixPQUFPLEVBQUUsU0FBUztRQUNsQixZQUFZLEVBQUUsUUFBUTtLQUN2QixDQUFDO0lBRUYsT0FBTyxPQUFPO1FBQ1osQ0FBQyxDQUFDLEVBQUUsR0FBRyxvQkFBb0IsRUFBRSxHQUFHLDJCQUEyQixFQUFFO1FBQzdELENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztBQUMzQixDQUFDO0FBdENELDBDQXNDQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLHlCQUF5QixDQUFDLElBQVk7SUFDcEQsSUFBSTtRQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsMEJBQTBCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFL0QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUFDLE1BQU07UUFDTixPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQztBQVJELDhEQVFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgT2JqZWN0UGF0dGVybiB9IGZyb20gJ2NvcHktd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgZ2xvYiBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB0eXBlIHsgQ29uZmlndXJhdGlvbiwgV2VicGFja09wdGlvbnNOb3JtYWxpemVkIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQge1xuICBBc3NldFBhdHRlcm5DbGFzcyxcbiAgT3V0cHV0SGFzaGluZyxcbiAgU2NyaXB0RWxlbWVudCxcbiAgU3R5bGVFbGVtZW50LFxufSBmcm9tICcuLi8uLi8uLi9idWlsZGVycy9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3BhY2thZ2UtdmVyc2lvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGFzaEZvcm1hdCB7XG4gIGNodW5rOiBzdHJpbmc7XG4gIGV4dHJhY3Q6IHN0cmluZztcbiAgZmlsZTogc3RyaW5nO1xuICBzY3JpcHQ6IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgV2VicGFja1N0YXRzT3B0aW9ucyA9IEV4Y2x1ZGU8Q29uZmlndXJhdGlvblsnc3RhdHMnXSwgc3RyaW5nIHwgYm9vbGVhbiB8IHVuZGVmaW5lZD47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPdXRwdXRIYXNoRm9ybWF0KG91dHB1dEhhc2hpbmcgPSBPdXRwdXRIYXNoaW5nLk5vbmUsIGxlbmd0aCA9IDIwKTogSGFzaEZvcm1hdCB7XG4gIGNvbnN0IGhhc2hUZW1wbGF0ZSA9IGAuW2NvbnRlbnRoYXNoOiR7bGVuZ3RofV1gO1xuXG4gIHN3aXRjaCAob3V0cHV0SGFzaGluZykge1xuICAgIGNhc2UgJ21lZGlhJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNodW5rOiAnJyxcbiAgICAgICAgZXh0cmFjdDogJycsXG4gICAgICAgIGZpbGU6IGhhc2hUZW1wbGF0ZSxcbiAgICAgICAgc2NyaXB0OiAnJyxcbiAgICAgIH07XG4gICAgY2FzZSAnYnVuZGxlcyc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaHVuazogaGFzaFRlbXBsYXRlLFxuICAgICAgICBleHRyYWN0OiBoYXNoVGVtcGxhdGUsXG4gICAgICAgIGZpbGU6ICcnLFxuICAgICAgICBzY3JpcHQ6IGhhc2hUZW1wbGF0ZSxcbiAgICAgIH07XG4gICAgY2FzZSAnYWxsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNodW5rOiBoYXNoVGVtcGxhdGUsXG4gICAgICAgIGV4dHJhY3Q6IGhhc2hUZW1wbGF0ZSxcbiAgICAgICAgZmlsZTogaGFzaFRlbXBsYXRlLFxuICAgICAgICBzY3JpcHQ6IGhhc2hUZW1wbGF0ZSxcbiAgICAgIH07XG4gICAgY2FzZSAnbm9uZSc6XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNodW5rOiAnJyxcbiAgICAgICAgZXh0cmFjdDogJycsXG4gICAgICAgIGZpbGU6ICcnLFxuICAgICAgICBzY3JpcHQ6ICcnLFxuICAgICAgfTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBOb3JtYWxpemVkRW50cnlQb2ludCA9IFJlcXVpcmVkPEV4Y2x1ZGU8U2NyaXB0RWxlbWVudCB8IFN0eWxlRWxlbWVudCwgc3RyaW5nPj47XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKFxuICBleHRyYUVudHJ5UG9pbnRzOiAoU2NyaXB0RWxlbWVudCB8IFN0eWxlRWxlbWVudClbXSxcbiAgZGVmYXVsdEJ1bmRsZU5hbWU6IHN0cmluZyxcbik6IE5vcm1hbGl6ZWRFbnRyeVBvaW50W10ge1xuICByZXR1cm4gZXh0cmFFbnRyeVBvaW50cy5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB7IGlucHV0OiBlbnRyeSwgaW5qZWN0OiB0cnVlLCBidW5kbGVOYW1lOiBkZWZhdWx0QnVuZGxlTmFtZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgaW5qZWN0ID0gdHJ1ZSwgLi4ubmV3RW50cnkgfSA9IGVudHJ5O1xuICAgIGxldCBidW5kbGVOYW1lO1xuICAgIGlmIChlbnRyeS5idW5kbGVOYW1lKSB7XG4gICAgICBidW5kbGVOYW1lID0gZW50cnkuYnVuZGxlTmFtZTtcbiAgICB9IGVsc2UgaWYgKCFpbmplY3QpIHtcbiAgICAgIC8vIExhenkgZW50cnkgcG9pbnRzIHVzZSB0aGUgZmlsZSBuYW1lIGFzIGJ1bmRsZSBuYW1lLlxuICAgICAgYnVuZGxlTmFtZSA9IHBhdGgucGFyc2UoZW50cnkuaW5wdXQpLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1bmRsZU5hbWUgPSBkZWZhdWx0QnVuZGxlTmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4geyAuLi5uZXdFbnRyeSwgaW5qZWN0LCBidW5kbGVOYW1lIH07XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXROYW1lVGVtcGxhdGVGYWN0b3J5KGhhc2hGb3JtYXQ6IEhhc2hGb3JtYXQpOiAocmVzb3VyY2VQYXRoOiBzdHJpbmcpID0+IHN0cmluZyB7XG4gIGNvbnN0IHZpc2l0ZWRGaWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgcmV0dXJuIChyZXNvdXJjZVBhdGg6IHN0cmluZykgPT4ge1xuICAgIGlmIChoYXNoRm9ybWF0LmZpbGUpIHtcbiAgICAgIC8vIEZpbGUgbmFtZXMgYXJlIGhhc2hlZCB0aGVyZWZvcmUgd2UgZG9uJ3QgbmVlZCB0byBoYW5kbGUgZmlsZXMgd2l0aCB0aGUgc2FtZSBmaWxlIG5hbWUuXG4gICAgICByZXR1cm4gYFtuYW1lXSR7aGFzaEZvcm1hdC5maWxlfS5bZXh0XWA7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc291cmNlUGF0aCk7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lIGhhcyBhbHJlYWR5IGJlZW4gcHJvY2Vzc2VkLlxuICAgIGNvbnN0IHZpc2l0ZWQgPSB2aXNpdGVkRmlsZXMuZ2V0KGZpbGVuYW1lKTtcbiAgICBpZiAoIXZpc2l0ZWQpIHtcbiAgICAgIC8vIE5vdCB2aXNpdGVkLlxuICAgICAgdmlzaXRlZEZpbGVzLnNldChmaWxlbmFtZSwgcmVzb3VyY2VQYXRoKTtcblxuICAgICAgcmV0dXJuIGZpbGVuYW1lO1xuICAgIH0gZWxzZSBpZiAodmlzaXRlZCA9PT0gcmVzb3VyY2VQYXRoKSB7XG4gICAgICAvLyBTYW1lIGZpbGUuXG4gICAgICByZXR1cm4gZmlsZW5hbWU7XG4gICAgfVxuXG4gICAgLy8gRmlsZSBoYXMgdGhlIHNhbWUgbmFtZSBidXQgaXQncyBpbiBhIGRpZmZlcmVudCBsb2NhdGlvbi5cbiAgICByZXR1cm4gJ1twYXRoXVtuYW1lXS5bZXh0XSc7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnN0cnVtZW50YXRpb25FeGNsdWRlZFBhdGhzKFxuICByb290OiBzdHJpbmcsXG4gIGV4Y2x1ZGVkUGF0aHM6IHN0cmluZ1tdLFxuKTogU2V0PHN0cmluZz4ge1xuICBjb25zdCBleGNsdWRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgZXhjbHVkZUdsb2Igb2YgZXhjbHVkZWRQYXRocykge1xuICAgIGNvbnN0IGV4Y2x1ZGVQYXRoID0gZXhjbHVkZUdsb2JbMF0gPT09ICcvJyA/IGV4Y2x1ZGVHbG9iLnNsaWNlKDEpIDogZXhjbHVkZUdsb2I7XG4gICAgZ2xvYi5zeW5jKGV4Y2x1ZGVQYXRoLCB7IGN3ZDogcm9vdCB9KS5mb3JFYWNoKChwKSA9PiBleGNsdWRlZC5hZGQocGF0aC5qb2luKHJvb3QsIHApKSk7XG4gIH1cblxuICByZXR1cm4gZXhjbHVkZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHbG9iYWxTdHlsZXMoc3R5bGVFbnRyeXBvaW50czogU3R5bGVFbGVtZW50W10pOiB7XG4gIGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XG4gIG5vSW5qZWN0TmFtZXM6IHN0cmluZ1tdO1xufSB7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcbiAgY29uc3Qgbm9JbmplY3ROYW1lczogc3RyaW5nW10gPSBbXTtcblxuICBpZiAoc3R5bGVFbnRyeXBvaW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyBlbnRyeVBvaW50cywgbm9JbmplY3ROYW1lcyB9O1xuICB9XG5cbiAgZm9yIChjb25zdCBzdHlsZSBvZiBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKHN0eWxlRW50cnlwb2ludHMsICdzdHlsZXMnKSkge1xuICAgIC8vIEFkZCBzdHlsZSBlbnRyeSBwb2ludHMuXG4gICAgZW50cnlQb2ludHNbc3R5bGUuYnVuZGxlTmFtZV0gPz89IFtdO1xuICAgIGVudHJ5UG9pbnRzW3N0eWxlLmJ1bmRsZU5hbWVdLnB1c2goc3R5bGUuaW5wdXQpO1xuXG4gICAgLy8gQWRkIG5vbiBpbmplY3RlZCBzdHlsZXMgdG8gdGhlIGxpc3QuXG4gICAgaWYgKCFzdHlsZS5pbmplY3QpIHtcbiAgICAgIG5vSW5qZWN0TmFtZXMucHVzaChzdHlsZS5idW5kbGVOYW1lKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBlbnRyeVBvaW50cywgbm9JbmplY3ROYW1lcyB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FjaGVTZXR0aW5ncyhcbiAgd2NvOiBXZWJwYWNrQ29uZmlnT3B0aW9ucyxcbiAgYW5ndWxhclZlcnNpb246IHN0cmluZyxcbik6IFdlYnBhY2tPcHRpb25zTm9ybWFsaXplZFsnY2FjaGUnXSB7XG4gIGNvbnN0IHsgZW5hYmxlZCwgcGF0aDogY2FjaGVEaXJlY3RvcnkgfSA9IHdjby5idWlsZE9wdGlvbnMuY2FjaGU7XG4gIGlmIChlbmFibGVkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdmaWxlc3lzdGVtJyxcbiAgICAgIHByb2ZpbGU6IHdjby5idWlsZE9wdGlvbnMudmVyYm9zZSxcbiAgICAgIGNhY2hlRGlyZWN0b3J5OiBwYXRoLmpvaW4oY2FjaGVEaXJlY3RvcnksICdhbmd1bGFyLXdlYnBhY2snKSxcbiAgICAgIG1heE1lbW9yeUdlbmVyYXRpb25zOiAxLFxuICAgICAgLy8gV2UgdXNlIHRoZSB2ZXJzaW9ucyBhbmQgYnVpbGQgb3B0aW9ucyBhcyB0aGUgY2FjaGUgbmFtZS4gVGhlIFdlYnBhY2sgY29uZmlndXJhdGlvbnMgYXJlIHRvb1xuICAgICAgLy8gZHluYW1pYyBhbmQgc2hhcmVkIGFtb25nIGRpZmZlcmVudCBidWlsZCB0eXBlczogdGVzdCwgYnVpbGQgYW5kIHNlcnZlLlxuICAgICAgLy8gTm9uZSBvZiB3aGljaCBhcmUgXCJuYW1lZFwiLlxuICAgICAgbmFtZTogY3JlYXRlSGFzaCgnc2hhMScpXG4gICAgICAgIC51cGRhdGUoYW5ndWxhclZlcnNpb24pXG4gICAgICAgIC51cGRhdGUoVkVSU0lPTilcbiAgICAgICAgLnVwZGF0ZSh3Y28ucHJvamVjdFJvb3QpXG4gICAgICAgIC51cGRhdGUoSlNPTi5zdHJpbmdpZnkod2NvLnRzQ29uZmlnKSlcbiAgICAgICAgLnVwZGF0ZShcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAuLi53Y28uYnVpbGRPcHRpb25zLFxuICAgICAgICAgICAgLy8gTmVlZGVkIGJlY2F1c2Ugb3V0cHV0UGF0aCBjaGFuZ2VzIG9uIGV2ZXJ5IGJ1aWxkIHdoZW4gdXNpbmcgaTE4biBleHRyYWN0aW9uXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9ibG9iLzczNmE1Zjg5ZGVhY2E4NWY0ODdiNzhhZWM5ZmY2NmQ0MTE4Y2ViNmEvcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaTE4bi1vcHRpb25zLnRzI0wyNjQtTDI2NVxuICAgICAgICAgICAgb3V0cHV0UGF0aDogdW5kZWZpbmVkLFxuICAgICAgICAgIH0pLFxuICAgICAgICApXG4gICAgICAgIC5kaWdlc3QoJ2hleCcpLFxuICAgIH07XG4gIH1cblxuICBpZiAod2NvLmJ1aWxkT3B0aW9ucy53YXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnbWVtb3J5JyxcbiAgICAgIG1heEdlbmVyYXRpb25zOiAxLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbG9iYWxTY3JpcHRzQnlCdW5kbGVOYW1lKFxuICBzY3JpcHRzOiBTY3JpcHRFbGVtZW50W10sXG4pOiB7IGJ1bmRsZU5hbWU6IHN0cmluZzsgaW5qZWN0OiBib29sZWFuOyBwYXRoczogc3RyaW5nW10gfVtdIHtcbiAgcmV0dXJuIG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoc2NyaXB0cywgJ3NjcmlwdHMnKS5yZWR1Y2UoXG4gICAgKHByZXY6IHsgYnVuZGxlTmFtZTogc3RyaW5nOyBwYXRoczogc3RyaW5nW107IGluamVjdDogYm9vbGVhbiB9W10sIGN1cnIpID0+IHtcbiAgICAgIGNvbnN0IHsgYnVuZGxlTmFtZSwgaW5qZWN0LCBpbnB1dCB9ID0gY3VycjtcblxuICAgICAgY29uc3QgZXhpc3RpbmdFbnRyeSA9IHByZXYuZmluZCgoZWwpID0+IGVsLmJ1bmRsZU5hbWUgPT09IGJ1bmRsZU5hbWUpO1xuICAgICAgaWYgKGV4aXN0aW5nRW50cnkpIHtcbiAgICAgICAgaWYgKGV4aXN0aW5nRW50cnkuaW5qZWN0ICYmICFpbmplY3QpIHtcbiAgICAgICAgICAvLyBBbGwgZW50cmllcyBoYXZlIHRvIGJlIGxhenkgZm9yIHRoZSBidW5kbGUgdG8gYmUgbGF6eS5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSAke2J1bmRsZU5hbWV9IGJ1bmRsZSBpcyBtaXhpbmcgaW5qZWN0ZWQgYW5kIG5vbi1pbmplY3RlZCBzY3JpcHRzLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhpc3RpbmdFbnRyeS5wYXRocy5wdXNoKGlucHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXYucHVzaCh7XG4gICAgICAgICAgYnVuZGxlTmFtZSxcbiAgICAgICAgICBpbmplY3QsXG4gICAgICAgICAgcGF0aHM6IFtpbnB1dF0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJldjtcbiAgICB9LFxuICAgIFtdLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXRQYXR0ZXJucyhyb290OiBzdHJpbmcsIGFzc2V0czogQXNzZXRQYXR0ZXJuQ2xhc3NbXSkge1xuICByZXR1cm4gYXNzZXRzLm1hcCgoYXNzZXQ6IEFzc2V0UGF0dGVybkNsYXNzLCBpbmRleDogbnVtYmVyKTogT2JqZWN0UGF0dGVybiA9PiB7XG4gICAgLy8gUmVzb2x2ZSBpbnB1dCBwYXRocyByZWxhdGl2ZSB0byB3b3Jrc3BhY2Ugcm9vdCBhbmQgYWRkIHNsYXNoIGF0IHRoZSBlbmQuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1jb25zdFxuICAgIGxldCB7IGlucHV0LCBvdXRwdXQsIGlnbm9yZSA9IFtdLCBnbG9iIH0gPSBhc3NldDtcbiAgICBpbnB1dCA9IHBhdGgucmVzb2x2ZShyb290LCBpbnB1dCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIGlucHV0ID0gaW5wdXQuZW5kc1dpdGgoJy8nKSA/IGlucHV0IDogaW5wdXQgKyAnLyc7XG4gICAgb3V0cHV0ID0gb3V0cHV0LmVuZHNXaXRoKCcvJykgPyBvdXRwdXQgOiBvdXRwdXQgKyAnLyc7XG5cbiAgICBpZiAob3V0cHV0LnN0YXJ0c1dpdGgoJy4uJykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQW4gYXNzZXQgY2Fubm90IGJlIHdyaXR0ZW4gdG8gYSBsb2NhdGlvbiBvdXRzaWRlIG9mIHRoZSBvdXRwdXQgcGF0aC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGV4dDogaW5wdXQsXG4gICAgICAvLyBOb3cgd2UgcmVtb3ZlIHN0YXJ0aW5nIHNsYXNoIHRvIG1ha2UgV2VicGFjayBwbGFjZSBpdCBmcm9tIHRoZSBvdXRwdXQgcm9vdC5cbiAgICAgIHRvOiBvdXRwdXQucmVwbGFjZSgvXlxcLy8sICcnKSxcbiAgICAgIGZyb206IGdsb2IsXG4gICAgICBub0Vycm9yT25NaXNzaW5nOiB0cnVlLFxuICAgICAgZm9yY2U6IHRydWUsXG4gICAgICBnbG9iT3B0aW9uczoge1xuICAgICAgICBkb3Q6IHRydWUsXG4gICAgICAgIGZvbGxvd1N5bWJvbGljTGlua3M6ICEhYXNzZXQuZm9sbG93U3ltbGlua3MsXG4gICAgICAgIGlnbm9yZTogW1xuICAgICAgICAgICcuZ2l0a2VlcCcsXG4gICAgICAgICAgJyoqLy5EU19TdG9yZScsXG4gICAgICAgICAgJyoqL1RodW1icy5kYicsXG4gICAgICAgICAgLy8gTmVnYXRlIHBhdHRlcm5zIG5lZWRzIHRvIGJlIGFic29sdXRlIGJlY2F1c2UgY29weS13ZWJwYWNrLXBsdWdpbiB1c2VzIGFic29sdXRlIGdsb2JzIHdoaWNoXG4gICAgICAgICAgLy8gY2F1c2VzIG5lZ2F0ZSBwYXR0ZXJucyBub3QgdG8gbWF0Y2guXG4gICAgICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay1jb250cmliL2NvcHktd2VicGFjay1wbHVnaW4vaXNzdWVzLzQ5OCNpc3N1ZWNvbW1lbnQtNjM5MzI3OTA5XG4gICAgICAgICAgLi4uaWdub3JlLFxuICAgICAgICBdLm1hcCgoaSkgPT4gcGF0aC5wb3NpeC5qb2luKGlucHV0LCBpKSksXG4gICAgICB9LFxuICAgICAgcHJpb3JpdHk6IGluZGV4LFxuICAgIH07XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RhdHNPcHRpb25zKHZlcmJvc2UgPSBmYWxzZSk6IFdlYnBhY2tTdGF0c09wdGlvbnMge1xuICBjb25zdCB3ZWJwYWNrT3V0cHV0T3B0aW9uczogV2VicGFja1N0YXRzT3B0aW9ucyA9IHtcbiAgICBhbGw6IGZhbHNlLCAvLyBGYWxsYmFjayB2YWx1ZSBmb3Igc3RhdHMgb3B0aW9ucyB3aGVuIGFuIG9wdGlvbiBpcyBub3QgZGVmaW5lZC4gSXQgaGFzIHByZWNlZGVuY2Ugb3ZlciBsb2NhbCB3ZWJwYWNrIGRlZmF1bHRzLlxuICAgIGNvbG9yczogdHJ1ZSxcbiAgICBoYXNoOiB0cnVlLCAvLyByZXF1aXJlZCBieSBjdXN0b20gc3RhdCBvdXRwdXRcbiAgICB0aW1pbmdzOiB0cnVlLCAvLyByZXF1aXJlZCBieSBjdXN0b20gc3RhdCBvdXRwdXRcbiAgICBjaHVua3M6IHRydWUsIC8vIHJlcXVpcmVkIGJ5IGN1c3RvbSBzdGF0IG91dHB1dFxuICAgIGJ1aWx0QXQ6IHRydWUsIC8vIHJlcXVpcmVkIGJ5IGN1c3RvbSBzdGF0IG91dHB1dFxuICAgIHdhcm5pbmdzOiB0cnVlLFxuICAgIGVycm9yczogdHJ1ZSxcbiAgICBhc3NldHM6IHRydWUsIC8vIHJlcXVpcmVkIGJ5IGN1c3RvbSBzdGF0IG91dHB1dFxuICAgIGNhY2hlZEFzc2V0czogdHJ1ZSwgLy8gcmVxdWlyZWQgZm9yIGJ1bmRsZSBzaXplIGNhbGN1bGF0b3JzXG5cbiAgICAvLyBOZWVkZWQgZm9yIG1hcmtBc3luY0NodW5rc05vbkluaXRpYWwuXG4gICAgaWRzOiB0cnVlLFxuICAgIGVudHJ5cG9pbnRzOiB0cnVlLFxuICB9O1xuXG4gIGNvbnN0IHZlcmJvc2VXZWJwYWNrT3V0cHV0T3B0aW9uczogV2VicGFja1N0YXRzT3B0aW9ucyA9IHtcbiAgICAvLyBUaGUgdmVyYm9zZSBvdXRwdXQgd2lsbCBtb3N0IGxpa2VseSBiZSBwaXBlZCB0byBhIGZpbGUsIHNvIGNvbG9ycyBqdXN0IG1lc3MgaXQgdXAuXG4gICAgY29sb3JzOiBmYWxzZSxcbiAgICB1c2VkRXhwb3J0czogdHJ1ZSxcbiAgICBvcHRpbWl6YXRpb25CYWlsb3V0OiB0cnVlLFxuICAgIHJlYXNvbnM6IHRydWUsXG4gICAgY2hpbGRyZW46IHRydWUsXG4gICAgYXNzZXRzOiB0cnVlLFxuICAgIHZlcnNpb246IHRydWUsXG4gICAgY2h1bmtNb2R1bGVzOiB0cnVlLFxuICAgIGVycm9yRGV0YWlsczogdHJ1ZSxcbiAgICBlcnJvclN0YWNrOiB0cnVlLFxuICAgIG1vZHVsZVRyYWNlOiB0cnVlLFxuICAgIGxvZ2dpbmc6ICd2ZXJib3NlJyxcbiAgICBtb2R1bGVzU3BhY2U6IEluZmluaXR5LFxuICB9O1xuXG4gIHJldHVybiB2ZXJib3NlXG4gICAgPyB7IC4uLndlYnBhY2tPdXRwdXRPcHRpb25zLCAuLi52ZXJib3NlV2VicGFja091dHB1dE9wdGlvbnMgfVxuICAgIDogd2VicGFja091dHB1dE9wdGlvbnM7XG59XG5cbi8qKlxuICogQHBhcmFtIHJvb3QgdGhlIHdvcmtzcGFjZSByb290XG4gKiBAcmV0dXJucyBgdHJ1ZWAgd2hlbiBgQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyYCBpcyBpbnN0YWxsZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYXRmb3JtU2VydmVySW5zdGFsbGVkKHJvb3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIHJlcXVpcmUucmVzb2x2ZSgnQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyJywgeyBwYXRoczogW3Jvb3RdIH0pO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19