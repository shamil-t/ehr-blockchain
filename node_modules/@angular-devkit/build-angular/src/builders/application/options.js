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
exports.normalizeOptions = void 0;
const node_module_1 = require("node:module");
const node_path_1 = __importDefault(require("node:path"));
const helpers_1 = require("../../tools/webpack/utils/helpers");
const utils_1 = require("../../utils");
const normalize_cache_1 = require("../../utils/normalize-cache");
const package_chunk_sort_1 = require("../../utils/package-chunk-sort");
const tailwind_1 = require("../../utils/tailwind");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const schema_1 = require("./schema");
/**
 * Normalize the user provided options by creating full paths for all path based options
 * and converting multi-form options into a single form that can be directly used
 * by the build process.
 *
 * @param context The context for current builder execution.
 * @param projectName The name of the project for the current execution.
 * @param options An object containing the options to use for the build.
 * @returns An object containing normalized options required to perform the build.
 */
// eslint-disable-next-line max-lines-per-function
async function normalizeOptions(context, projectName, options) {
    const workspaceRoot = context.workspaceRoot;
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = normalizeDirectoryPath(node_path_1.default.join(workspaceRoot, projectMetadata.root ?? ''));
    const projectSourceRoot = normalizeDirectoryPath(node_path_1.default.join(workspaceRoot, projectMetadata.sourceRoot ?? 'src'));
    // Gather persistent caching option and provide a project specific cache location
    const cacheOptions = (0, normalize_cache_1.normalizeCacheOptions)(projectMetadata, workspaceRoot);
    cacheOptions.path = node_path_1.default.join(cacheOptions.path, projectName);
    const entryPoints = normalizeEntryPoints(workspaceRoot, options.browser, options.entryPoints);
    const tsconfig = node_path_1.default.join(workspaceRoot, options.tsConfig);
    const outputPath = normalizeDirectoryPath(node_path_1.default.join(workspaceRoot, options.outputPath));
    const optimizationOptions = (0, utils_1.normalizeOptimization)(options.optimization);
    const sourcemapOptions = (0, utils_1.normalizeSourceMaps)(options.sourceMap ?? false);
    const assets = options.assets?.length
        ? (0, utils_1.normalizeAssetPatterns)(options.assets, workspaceRoot, projectRoot, projectSourceRoot)
        : undefined;
    const outputNames = {
        bundles: options.outputHashing === schema_1.OutputHashing.All || options.outputHashing === schema_1.OutputHashing.Bundles
            ? '[name].[hash]'
            : '[name]',
        media: 'media/' +
            (options.outputHashing === schema_1.OutputHashing.All || options.outputHashing === schema_1.OutputHashing.Media
                ? '[name].[hash]'
                : '[name]'),
    };
    let fileReplacements;
    if (options.fileReplacements) {
        for (const replacement of options.fileReplacements) {
            fileReplacements ?? (fileReplacements = {});
            fileReplacements[node_path_1.default.join(workspaceRoot, replacement.replace)] = node_path_1.default.join(workspaceRoot, replacement.with);
        }
    }
    const globalStyles = [];
    if (options.styles?.length) {
        const { entryPoints: stylesheetEntrypoints, noInjectNames } = (0, helpers_1.normalizeGlobalStyles)(options.styles || []);
        for (const [name, files] of Object.entries(stylesheetEntrypoints)) {
            globalStyles.push({ name, files, initial: !noInjectNames.includes(name) });
        }
    }
    const globalScripts = [];
    if (options.scripts?.length) {
        for (const { bundleName, paths, inject } of (0, helpers_1.globalScriptsByBundleName)(options.scripts)) {
            globalScripts.push({ name: bundleName, files: paths, initial: inject });
        }
    }
    let tailwindConfiguration;
    const tailwindConfigurationPath = await (0, tailwind_1.findTailwindConfigurationFile)(workspaceRoot, projectRoot);
    if (tailwindConfigurationPath) {
        // Create a node resolver at the project root as a directory
        const resolver = (0, node_module_1.createRequire)(projectRoot + '/');
        try {
            tailwindConfiguration = {
                file: tailwindConfigurationPath,
                package: resolver.resolve('tailwindcss'),
            };
        }
        catch {
            const relativeTailwindConfigPath = node_path_1.default.relative(workspaceRoot, tailwindConfigurationPath);
            context.logger.warn(`Tailwind CSS configuration file found (${relativeTailwindConfigPath})` +
                ` but the 'tailwindcss' package is not installed.` +
                ` To enable Tailwind CSS, please install the 'tailwindcss' package.`);
        }
    }
    let indexHtmlOptions;
    // index can never have a value of `true` but in the schema it's of type `boolean`.
    if (typeof options.index !== 'boolean') {
        indexHtmlOptions = {
            input: node_path_1.default.join(workspaceRoot, (0, webpack_browser_config_1.getIndexInputFile)(options.index)),
            // The output file will be created within the configured output path
            output: (0, webpack_browser_config_1.getIndexOutputFile)(options.index),
            // TODO: Use existing information from above to create the insertion order
            insertionOrder: (0, package_chunk_sort_1.generateEntryPoints)({
                scripts: options.scripts ?? [],
                styles: options.styles ?? [],
            }),
        };
    }
    let serverEntryPoint;
    if (options.server) {
        serverEntryPoint = node_path_1.default.join(workspaceRoot, options.server);
    }
    else if (options.server === '') {
        throw new Error('`server` option cannot be an empty string.');
    }
    let prerenderOptions;
    if (options.prerender) {
        const { discoverRoutes = true, routes = [], routesFile = undefined, } = options.prerender === true ? {} : options.prerender;
        prerenderOptions = {
            discoverRoutes,
            routes,
            routesFile: routesFile && node_path_1.default.join(workspaceRoot, routesFile),
        };
    }
    let ssrOptions;
    if (options.ssr === true) {
        ssrOptions = {};
    }
    else if (typeof options.ssr === 'object') {
        const { entry } = options.ssr;
        ssrOptions = {
            entry: entry && node_path_1.default.join(workspaceRoot, entry),
        };
    }
    let appShellOptions;
    if (options.appShell) {
        appShellOptions = {
            route: 'shell',
        };
    }
    // Initial options to keep
    const { allowedCommonJsDependencies, aot, baseHref, crossOrigin, externalDependencies, extractLicenses, inlineStyleLanguage = 'css', outExtension, serviceWorker, poll, polyfills, preserveSymlinks, statsJson, stylePreprocessorOptions, subresourceIntegrity, verbose, watch, progress = true, externalPackages, deleteOutputPath, } = options;
    // Return all the normalized options
    return {
        advancedOptimizations: !!aot,
        allowedCommonJsDependencies,
        baseHref,
        cacheOptions,
        crossOrigin,
        deleteOutputPath,
        externalDependencies,
        extractLicenses,
        inlineStyleLanguage,
        jit: !aot,
        stats: !!statsJson,
        polyfills: polyfills === undefined || Array.isArray(polyfills) ? polyfills : [polyfills],
        poll,
        progress,
        externalPackages,
        // If not explicitly set, default to the Node.js process argument
        preserveSymlinks: preserveSymlinks ?? process.execArgv.includes('--preserve-symlinks'),
        stylePreprocessorOptions,
        subresourceIntegrity,
        serverEntryPoint,
        prerenderOptions,
        appShellOptions,
        ssrOptions,
        verbose,
        watch,
        workspaceRoot,
        entryPoints,
        optimizationOptions,
        outputPath,
        outExtension,
        sourcemapOptions,
        tsconfig,
        projectRoot,
        assets,
        outputNames,
        fileReplacements,
        globalStyles,
        globalScripts,
        serviceWorker: typeof serviceWorker === 'string' ? node_path_1.default.join(workspaceRoot, serviceWorker) : undefined,
        indexHtmlOptions,
        tailwindConfiguration,
    };
}
exports.normalizeOptions = normalizeOptions;
/**
 * Normalize entry point options. To maintain compatibility with the legacy browser builder, we need a single `browser`
 * option which defines a single entry point. However, we also want to support multiple entry points as an internal option.
 * The two options are mutually exclusive and if `browser` is provided it will be used as the sole entry point.
 * If `entryPoints` are provided, they will be used as the set of entry points.
 *
 * @param workspaceRoot Path to the root of the Angular workspace.
 * @param browser The `browser` option pointing at the application entry point. While required per the schema file, it may be omitted by
 *     programmatic usages of `browser-esbuild`.
 * @param entryPoints Set of entry points to use if provided.
 * @returns An object mapping entry point names to their file paths.
 */
function normalizeEntryPoints(workspaceRoot, browser, entryPoints = new Set()) {
    if (browser === '') {
        throw new Error('`browser` option cannot be an empty string.');
    }
    // `browser` and `entryPoints` are mutually exclusive.
    if (browser && entryPoints.size > 0) {
        throw new Error('Only one of `browser` or `entryPoints` may be provided.');
    }
    if (!browser && entryPoints.size === 0) {
        // Schema should normally reject this case, but programmatic usages of the builder might make this mistake.
        throw new Error('Either `browser` or at least one `entryPoints` value must be provided.');
    }
    // Schema types force `browser` to always be provided, but it may be omitted when the builder is invoked programmatically.
    if (browser) {
        // Use `browser` alone.
        return { 'main': node_path_1.default.join(workspaceRoot, browser) };
    }
    else {
        // Use `entryPoints` alone.
        const entryPointPaths = {};
        for (const entryPoint of entryPoints) {
            const parsedEntryPoint = node_path_1.default.parse(entryPoint);
            // Use the input file path without an extension as the "name" of the entry point dictating its output location.
            // Relative entry points are generated at the same relative path in the output directory.
            // Absolute entry points are always generated with the same file name in the root of the output directory. This includes absolute
            // paths pointing at files actually within the workspace root.
            const entryPointName = node_path_1.default.isAbsolute(entryPoint)
                ? parsedEntryPoint.name
                : node_path_1.default.join(parsedEntryPoint.dir, parsedEntryPoint.name);
            // Get the full file path to the entry point input.
            const entryPointPath = node_path_1.default.isAbsolute(entryPoint)
                ? entryPoint
                : node_path_1.default.join(workspaceRoot, entryPoint);
            // Check for conflicts with previous entry points.
            const existingEntryPointPath = entryPointPaths[entryPointName];
            if (existingEntryPointPath) {
                throw new Error(`\`${existingEntryPointPath}\` and \`${entryPointPath}\` both output to the same location \`${entryPointName}\`.` +
                    ' Rename or move one of the files to fix the conflict.');
            }
            entryPointPaths[entryPointName] = entryPointPath;
        }
        return entryPointPaths;
    }
}
/**
 * Normalize a directory path string.
 * Currently only removes a trailing slash if present.
 * @param path A path string.
 * @returns A normalized path string.
 */
function normalizeDirectoryPath(path) {
    const last = path[path.length - 1];
    if (last === '/' || last === '\\') {
        return path.slice(0, -1);
    }
    return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2FwcGxpY2F0aW9uL29wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBR0gsNkNBQTRDO0FBQzVDLDBEQUE2QjtBQUM3QiwrREFHMkM7QUFDM0MsdUNBQWlHO0FBQ2pHLGlFQUFvRTtBQUNwRSx1RUFBcUU7QUFDckUsbURBQXFFO0FBQ3JFLCtFQUEyRjtBQUMzRixxQ0FBOEU7QUFpQzlFOzs7Ozs7Ozs7R0FTRztBQUNILGtEQUFrRDtBQUMzQyxLQUFLLFVBQVUsZ0JBQWdCLENBQ3BDLE9BQXVCLEVBQ3ZCLFdBQW1CLEVBQ25CLE9BQTBDO0lBRTFDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDNUMsTUFBTSxlQUFlLEdBQUcsTUFBTSxPQUFPLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEUsTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQ3hDLG1CQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRyxlQUFlLENBQUMsSUFBMkIsSUFBSSxFQUFFLENBQUMsQ0FDN0UsQ0FBQztJQUNGLE1BQU0saUJBQWlCLEdBQUcsc0JBQXNCLENBQzlDLG1CQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRyxlQUFlLENBQUMsVUFBaUMsSUFBSSxLQUFLLENBQUMsQ0FDdEYsQ0FBQztJQUVGLGlGQUFpRjtJQUNqRixNQUFNLFlBQVksR0FBRyxJQUFBLHVDQUFxQixFQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMzRSxZQUFZLENBQUMsSUFBSSxHQUFHLG1CQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFOUQsTUFB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QUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUI7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRlckNvbnRleHQgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdub2RlOm1vZHVsZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHtcbiAgZ2xvYmFsU2NyaXB0c0J5QnVuZGxlTmFtZSxcbiAgbm9ybWFsaXplR2xvYmFsU3R5bGVzLFxufSBmcm9tICcuLi8uLi90b29scy93ZWJwYWNrL3V0aWxzL2hlbHBlcnMnO1xuaW1wb3J0IHsgbm9ybWFsaXplQXNzZXRQYXR0ZXJucywgbm9ybWFsaXplT3B0aW1pemF0aW9uLCBub3JtYWxpemVTb3VyY2VNYXBzIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2FjaGVPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvbm9ybWFsaXplLWNhY2hlJztcbmltcG9ydCB7IGdlbmVyYXRlRW50cnlQb2ludHMgfSBmcm9tICcuLi8uLi91dGlscy9wYWNrYWdlLWNodW5rLXNvcnQnO1xuaW1wb3J0IHsgZmluZFRhaWx3aW5kQ29uZmlndXJhdGlvbkZpbGUgfSBmcm9tICcuLi8uLi91dGlscy90YWlsd2luZCc7XG5pbXBvcnQgeyBnZXRJbmRleElucHV0RmlsZSwgZ2V0SW5kZXhPdXRwdXRGaWxlIH0gZnJvbSAnLi4vLi4vdXRpbHMvd2VicGFjay1icm93c2VyLWNvbmZpZyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgQXBwbGljYXRpb25CdWlsZGVyT3B0aW9ucywgT3V0cHV0SGFzaGluZyB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IHR5cGUgTm9ybWFsaXplZEFwcGxpY2F0aW9uQnVpbGRPcHRpb25zID0gQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBub3JtYWxpemVPcHRpb25zPj47XG5cbi8qKiBJbnRlcm5hbCBvcHRpb25zIGhpZGRlbiBmcm9tIGJ1aWxkZXIgc2NoZW1hIGJ1dCBhdmFpbGFibGUgd2hlbiBpbnZva2VkIHByb2dyYW1tYXRpY2FsbHkuICovXG5pbnRlcmZhY2UgSW50ZXJuYWxPcHRpb25zIHtcbiAgLyoqXG4gICAqIEVudHJ5IHBvaW50cyB0byB1c2UgZm9yIHRoZSBjb21waWxhdGlvbi4gSW5jb21wYXRpYmxlIHdpdGggYGJyb3dzZXJgLCB3aGljaCBtdXN0IG5vdCBiZSBwcm92aWRlZC4gTWF5IGJlIHJlbGF0aXZlIG9yIGFic29sdXRlIHBhdGhzLlxuICAgKiBJZiBnaXZlbiBhIHJlbGF0aXZlIHBhdGgsIGl0IGlzIHJlc29sdmVkIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHdvcmtzcGFjZSBhbmQgd2lsbCBnZW5lcmF0ZSBhbiBvdXRwdXQgYXQgdGhlIHNhbWUgcmVsYXRpdmUgbG9jYXRpb25cbiAgICogaW4gdGhlIG91dHB1dCBkaXJlY3RvcnkuIElmIGdpdmVuIGFuIGFic29sdXRlIHBhdGgsIHRoZSBvdXRwdXQgd2lsbCBiZSBnZW5lcmF0ZWQgaW4gdGhlIHJvb3Qgb2YgdGhlIG91dHB1dCBkaXJlY3Rvcnkgd2l0aCB0aGUgc2FtZSBiYXNlXG4gICAqIG5hbWUuXG4gICAqL1xuICBlbnRyeVBvaW50cz86IFNldDxzdHJpbmc+O1xuXG4gIC8qKiBGaWxlIGV4dGVuc2lvbiB0byB1c2UgZm9yIHRoZSBnZW5lcmF0ZWQgb3V0cHV0IGZpbGVzLiAqL1xuICBvdXRFeHRlbnNpb24/OiAnanMnIHwgJ21qcyc7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIGFsbCBub2RlIHBhY2thZ2VzIHNob3VsZCBiZSBtYXJrZWQgYXMgZXh0ZXJuYWwuXG4gICAqIEN1cnJlbnRseSB1c2VkIGJ5IHRoZSBkZXYtc2VydmVyIHRvIHN1cHBvcnQgcHJlYnVuZGxpbmcuXG4gICAqL1xuICBleHRlcm5hbFBhY2thZ2VzPzogYm9vbGVhbjtcbn1cblxuLyoqIEZ1bGwgc2V0IG9mIG9wdGlvbnMgZm9yIGBhcHBsaWNhdGlvbmAgYnVpbGRlci4gKi9cbmV4cG9ydCB0eXBlIEFwcGxpY2F0aW9uQnVpbGRlckludGVybmFsT3B0aW9ucyA9IE9taXQ8XG4gIEFwcGxpY2F0aW9uQnVpbGRlck9wdGlvbnMgJiBJbnRlcm5hbE9wdGlvbnMsXG4gICdicm93c2VyJ1xuPiAmIHtcbiAgLy8gYGJyb3dzZXJgIGNhbiBiZSBgdW5kZWZpbmVkYCBpZiBgZW50cnlQb2ludHNgIGlzIHVzZWQuXG4gIGJyb3dzZXI/OiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgdXNlciBwcm92aWRlZCBvcHRpb25zIGJ5IGNyZWF0aW5nIGZ1bGwgcGF0aHMgZm9yIGFsbCBwYXRoIGJhc2VkIG9wdGlvbnNcbiAqIGFuZCBjb252ZXJ0aW5nIG11bHRpLWZvcm0gb3B0aW9ucyBpbnRvIGEgc2luZ2xlIGZvcm0gdGhhdCBjYW4gYmUgZGlyZWN0bHkgdXNlZFxuICogYnkgdGhlIGJ1aWxkIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIGN1cnJlbnQgYnVpbGRlciBleGVjdXRpb24uXG4gKiBAcGFyYW0gcHJvamVjdE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb2plY3QgZm9yIHRoZSBjdXJyZW50IGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIGJ1aWxkLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgbm9ybWFsaXplZCBvcHRpb25zIHJlcXVpcmVkIHRvIHBlcmZvcm0gdGhlIGJ1aWxkLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG5vcm1hbGl6ZU9wdGlvbnMoXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBvcHRpb25zOiBBcHBsaWNhdGlvbkJ1aWxkZXJJbnRlcm5hbE9wdGlvbnMsXG4pIHtcbiAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IGNvbnRleHQud29ya3NwYWNlUm9vdDtcbiAgY29uc3QgcHJvamVjdE1ldGFkYXRhID0gYXdhaXQgY29udGV4dC5nZXRQcm9qZWN0TWV0YWRhdGEocHJvamVjdE5hbWUpO1xuICBjb25zdCBwcm9qZWN0Um9vdCA9IG5vcm1hbGl6ZURpcmVjdG9yeVBhdGgoXG4gICAgcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIChwcm9qZWN0TWV0YWRhdGEucm9vdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKSxcbiAgKTtcbiAgY29uc3QgcHJvamVjdFNvdXJjZVJvb3QgPSBub3JtYWxpemVEaXJlY3RvcnlQYXRoKFxuICAgIHBhdGguam9pbih3b3Jrc3BhY2VSb290LCAocHJvamVjdE1ldGFkYXRhLnNvdXJjZVJvb3QgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnc3JjJyksXG4gICk7XG5cbiAgLy8gR2F0aGVyIHBlcnNpc3RlbnQgY2FjaGluZyBvcHRpb24gYW5kIHByb3ZpZGUgYSBwcm9qZWN0IHNwZWNpZmljIGNhY2hlIGxvY2F0aW9uXG4gIGNvbnN0IGNhY2hlT3B0aW9ucyA9IG5vcm1hbGl6ZUNhY2hlT3B0aW9ucyhwcm9qZWN0TWV0YWRhdGEsIHdvcmtzcGFjZVJvb3QpO1xuICBjYWNoZU9wdGlvbnMucGF0aCA9IHBhdGguam9pbihjYWNoZU9wdGlvbnMucGF0aCwgcHJvamVjdE5hbWUpO1xuXG4gIGNvbnN0IGVudHJ5UG9pbnRzID0gbm9ybWFsaXplRW50cnlQb2ludHMod29ya3NwYWNlUm9vdCwgb3B0aW9ucy5icm93c2VyLCBvcHRpb25zLmVudHJ5UG9pbnRzKTtcbiAgY29uc3QgdHNjb25maWcgPSBwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgb3B0aW9ucy50c0NvbmZpZyk7XG4gIGNvbnN0IG91dHB1dFBhdGggPSBub3JtYWxpemVEaXJlY3RvcnlQYXRoKHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBvcHRpb25zLm91dHB1dFBhdGgpKTtcbiAgY29uc3Qgb3B0aW1pemF0aW9uT3B0aW9ucyA9IG5vcm1hbGl6ZU9wdGltaXphdGlvbihvcHRpb25zLm9wdGltaXphdGlvbik7XG4gIGNvbnN0IHNvdXJjZW1hcE9wdGlvbnMgPSBub3JtYWxpemVTb3VyY2VNYXBzKG9wdGlvbnMuc291cmNlTWFwID8/IGZhbHNlKTtcbiAgY29uc3QgYXNzZXRzID0gb3B0aW9ucy5hc3NldHM/Lmxlbmd0aFxuICAgID8gbm9ybWFsaXplQXNzZXRQYXR0ZXJucyhvcHRpb25zLmFzc2V0cywgd29ya3NwYWNlUm9vdCwgcHJvamVjdFJvb3QsIHByb2plY3RTb3VyY2VSb290KVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIGNvbnN0IG91dHB1dE5hbWVzID0ge1xuICAgIGJ1bmRsZXM6XG4gICAgICBvcHRpb25zLm91dHB1dEhhc2hpbmcgPT09IE91dHB1dEhhc2hpbmcuQWxsIHx8IG9wdGlvbnMub3V0cHV0SGFzaGluZyA9PT0gT3V0cHV0SGFzaGluZy5CdW5kbGVzXG4gICAgICAgID8gJ1tuYW1lXS5baGFzaF0nXG4gICAgICAgIDogJ1tuYW1lXScsXG4gICAgbWVkaWE6XG4gICAgICAnbWVkaWEvJyArXG4gICAgICAob3B0aW9ucy5vdXRwdXRIYXNoaW5nID09PSBPdXRwdXRIYXNoaW5nLkFsbCB8fCBvcHRpb25zLm91dHB1dEhhc2hpbmcgPT09IE91dHB1dEhhc2hpbmcuTWVkaWFcbiAgICAgICAgPyAnW25hbWVdLltoYXNoXSdcbiAgICAgICAgOiAnW25hbWVdJyksXG4gIH07XG5cbiAgbGV0IGZpbGVSZXBsYWNlbWVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gIGlmIChvcHRpb25zLmZpbGVSZXBsYWNlbWVudHMpIHtcbiAgICBmb3IgKGNvbnN0IHJlcGxhY2VtZW50IG9mIG9wdGlvbnMuZmlsZVJlcGxhY2VtZW50cykge1xuICAgICAgZmlsZVJlcGxhY2VtZW50cyA/Pz0ge307XG4gICAgICBmaWxlUmVwbGFjZW1lbnRzW3BhdGguam9pbih3b3Jrc3BhY2VSb290LCByZXBsYWNlbWVudC5yZXBsYWNlKV0gPSBwYXRoLmpvaW4oXG4gICAgICAgIHdvcmtzcGFjZVJvb3QsXG4gICAgICAgIHJlcGxhY2VtZW50LndpdGgsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGdsb2JhbFN0eWxlczogeyBuYW1lOiBzdHJpbmc7IGZpbGVzOiBzdHJpbmdbXTsgaW5pdGlhbDogYm9vbGVhbiB9W10gPSBbXTtcbiAgaWYgKG9wdGlvbnMuc3R5bGVzPy5sZW5ndGgpIHtcbiAgICBjb25zdCB7IGVudHJ5UG9pbnRzOiBzdHlsZXNoZWV0RW50cnlwb2ludHMsIG5vSW5qZWN0TmFtZXMgfSA9IG5vcm1hbGl6ZUdsb2JhbFN0eWxlcyhcbiAgICAgIG9wdGlvbnMuc3R5bGVzIHx8IFtdLFxuICAgICk7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgZmlsZXNdIG9mIE9iamVjdC5lbnRyaWVzKHN0eWxlc2hlZXRFbnRyeXBvaW50cykpIHtcbiAgICAgIGdsb2JhbFN0eWxlcy5wdXNoKHsgbmFtZSwgZmlsZXMsIGluaXRpYWw6ICFub0luamVjdE5hbWVzLmluY2x1ZGVzKG5hbWUpIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGdsb2JhbFNjcmlwdHM6IHsgbmFtZTogc3RyaW5nOyBmaWxlczogc3RyaW5nW107IGluaXRpYWw6IGJvb2xlYW4gfVtdID0gW107XG4gIGlmIChvcHRpb25zLnNjcmlwdHM/Lmxlbmd0aCkge1xuICAgIGZvciAoY29uc3QgeyBidW5kbGVOYW1lLCBwYXRocywgaW5qZWN0IH0gb2YgZ2xvYmFsU2NyaXB0c0J5QnVuZGxlTmFtZShvcHRpb25zLnNjcmlwdHMpKSB7XG4gICAgICBnbG9iYWxTY3JpcHRzLnB1c2goeyBuYW1lOiBidW5kbGVOYW1lLCBmaWxlczogcGF0aHMsIGluaXRpYWw6IGluamVjdCB9KTtcbiAgICB9XG4gIH1cblxuICBsZXQgdGFpbHdpbmRDb25maWd1cmF0aW9uOiB7IGZpbGU6IHN0cmluZzsgcGFja2FnZTogc3RyaW5nIH0gfCB1bmRlZmluZWQ7XG4gIGNvbnN0IHRhaWx3aW5kQ29uZmlndXJhdGlvblBhdGggPSBhd2FpdCBmaW5kVGFpbHdpbmRDb25maWd1cmF0aW9uRmlsZSh3b3Jrc3BhY2VSb290LCBwcm9qZWN0Um9vdCk7XG4gIGlmICh0YWlsd2luZENvbmZpZ3VyYXRpb25QYXRoKSB7XG4gICAgLy8gQ3JlYXRlIGEgbm9kZSByZXNvbHZlciBhdCB0aGUgcHJvamVjdCByb290IGFzIGEgZGlyZWN0b3J5XG4gICAgY29uc3QgcmVzb2x2ZXIgPSBjcmVhdGVSZXF1aXJlKHByb2plY3RSb290ICsgJy8nKTtcbiAgICB0cnkge1xuICAgICAgdGFpbHdpbmRDb25maWd1cmF0aW9uID0ge1xuICAgICAgICBmaWxlOiB0YWlsd2luZENvbmZpZ3VyYXRpb25QYXRoLFxuICAgICAgICBwYWNrYWdlOiByZXNvbHZlci5yZXNvbHZlKCd0YWlsd2luZGNzcycpLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnN0IHJlbGF0aXZlVGFpbHdpbmRDb25maWdQYXRoID0gcGF0aC5yZWxhdGl2ZSh3b3Jrc3BhY2VSb290LCB0YWlsd2luZENvbmZpZ3VyYXRpb25QYXRoKTtcbiAgICAgIGNvbnRleHQubG9nZ2VyLndhcm4oXG4gICAgICAgIGBUYWlsd2luZCBDU1MgY29uZmlndXJhdGlvbiBmaWxlIGZvdW5kICgke3JlbGF0aXZlVGFpbHdpbmRDb25maWdQYXRofSlgICtcbiAgICAgICAgICBgIGJ1dCB0aGUgJ3RhaWx3aW5kY3NzJyBwYWNrYWdlIGlzIG5vdCBpbnN0YWxsZWQuYCArXG4gICAgICAgICAgYCBUbyBlbmFibGUgVGFpbHdpbmQgQ1NTLCBwbGVhc2UgaW5zdGFsbCB0aGUgJ3RhaWx3aW5kY3NzJyBwYWNrYWdlLmAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGxldCBpbmRleEh0bWxPcHRpb25zO1xuICAvLyBpbmRleCBjYW4gbmV2ZXIgaGF2ZSBhIHZhbHVlIG9mIGB0cnVlYCBidXQgaW4gdGhlIHNjaGVtYSBpdCdzIG9mIHR5cGUgYGJvb2xlYW5gLlxuICBpZiAodHlwZW9mIG9wdGlvbnMuaW5kZXggIT09ICdib29sZWFuJykge1xuICAgIGluZGV4SHRtbE9wdGlvbnMgPSB7XG4gICAgICBpbnB1dDogcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIGdldEluZGV4SW5wdXRGaWxlKG9wdGlvbnMuaW5kZXgpKSxcbiAgICAgIC8vIFRoZSBvdXRwdXQgZmlsZSB3aWxsIGJlIGNyZWF0ZWQgd2l0aGluIHRoZSBjb25maWd1cmVkIG91dHB1dCBwYXRoXG4gICAgICBvdXRwdXQ6IGdldEluZGV4T3V0cHV0RmlsZShvcHRpb25zLmluZGV4KSxcbiAgICAgIC8vIFRPRE86IFVzZSBleGlzdGluZyBpbmZvcm1hdGlvbiBmcm9tIGFib3ZlIHRvIGNyZWF0ZSB0aGUgaW5zZXJ0aW9uIG9yZGVyXG4gICAgICBpbnNlcnRpb25PcmRlcjogZ2VuZXJhdGVFbnRyeVBvaW50cyh7XG4gICAgICAgIHNjcmlwdHM6IG9wdGlvbnMuc2NyaXB0cyA/PyBbXSxcbiAgICAgICAgc3R5bGVzOiBvcHRpb25zLnN0eWxlcyA/PyBbXSxcbiAgICAgIH0pLFxuICAgIH07XG4gIH1cblxuICBsZXQgc2VydmVyRW50cnlQb2ludDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAob3B0aW9ucy5zZXJ2ZXIpIHtcbiAgICBzZXJ2ZXJFbnRyeVBvaW50ID0gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIG9wdGlvbnMuc2VydmVyKTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLnNlcnZlciA9PT0gJycpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzZXJ2ZXJgIG9wdGlvbiBjYW5ub3QgYmUgYW4gZW1wdHkgc3RyaW5nLicpO1xuICB9XG5cbiAgbGV0IHByZXJlbmRlck9wdGlvbnM7XG4gIGlmIChvcHRpb25zLnByZXJlbmRlcikge1xuICAgIGNvbnN0IHtcbiAgICAgIGRpc2NvdmVyUm91dGVzID0gdHJ1ZSxcbiAgICAgIHJvdXRlcyA9IFtdLFxuICAgICAgcm91dGVzRmlsZSA9IHVuZGVmaW5lZCxcbiAgICB9ID0gb3B0aW9ucy5wcmVyZW5kZXIgPT09IHRydWUgPyB7fSA6IG9wdGlvbnMucHJlcmVuZGVyO1xuXG4gICAgcHJlcmVuZGVyT3B0aW9ucyA9IHtcbiAgICAgIGRpc2NvdmVyUm91dGVzLFxuICAgICAgcm91dGVzLFxuICAgICAgcm91dGVzRmlsZTogcm91dGVzRmlsZSAmJiBwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgcm91dGVzRmlsZSksXG4gICAgfTtcbiAgfVxuXG4gIGxldCBzc3JPcHRpb25zO1xuICBpZiAob3B0aW9ucy5zc3IgPT09IHRydWUpIHtcbiAgICBzc3JPcHRpb25zID0ge307XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuc3NyID09PSAnb2JqZWN0Jykge1xuICAgIGNvbnN0IHsgZW50cnkgfSA9IG9wdGlvbnMuc3NyO1xuXG4gICAgc3NyT3B0aW9ucyA9IHtcbiAgICAgIGVudHJ5OiBlbnRyeSAmJiBwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgZW50cnkpLFxuICAgIH07XG4gIH1cblxuICBsZXQgYXBwU2hlbGxPcHRpb25zO1xuICBpZiAob3B0aW9ucy5hcHBTaGVsbCkge1xuICAgIGFwcFNoZWxsT3B0aW9ucyA9IHtcbiAgICAgIHJvdXRlOiAnc2hlbGwnLFxuICAgIH07XG4gIH1cblxuICAvLyBJbml0aWFsIG9wdGlvbnMgdG8ga2VlcFxuICBjb25zdCB7XG4gICAgYWxsb3dlZENvbW1vbkpzRGVwZW5kZW5jaWVzLFxuICAgIGFvdCxcbiAgICBiYXNlSHJlZixcbiAgICBjcm9zc09yaWdpbixcbiAgICBleHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICBleHRyYWN0TGljZW5zZXMsXG4gICAgaW5saW5lU3R5bGVMYW5ndWFnZSA9ICdjc3MnLFxuICAgIG91dEV4dGVuc2lvbixcbiAgICBzZXJ2aWNlV29ya2VyLFxuICAgIHBvbGwsXG4gICAgcG9seWZpbGxzLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgc3RhdHNKc29uLFxuICAgIHN0eWxlUHJlcHJvY2Vzc29yT3B0aW9ucyxcbiAgICBzdWJyZXNvdXJjZUludGVncml0eSxcbiAgICB2ZXJib3NlLFxuICAgIHdhdGNoLFxuICAgIHByb2dyZXNzID0gdHJ1ZSxcbiAgICBleHRlcm5hbFBhY2thZ2VzLFxuICAgIGRlbGV0ZU91dHB1dFBhdGgsXG4gIH0gPSBvcHRpb25zO1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIG5vcm1hbGl6ZWQgb3B0aW9uc1xuICByZXR1cm4ge1xuICAgIGFkdmFuY2VkT3B0aW1pemF0aW9uczogISFhb3QsXG4gICAgYWxsb3dlZENvbW1vbkpzRGVwZW5kZW5jaWVzLFxuICAgIGJhc2VIcmVmLFxuICAgIGNhY2hlT3B0aW9ucyxcbiAgICBjcm9zc09yaWdpbixcbiAgICBkZWxldGVPdXRwdXRQYXRoLFxuICAgIGV4dGVybmFsRGVwZW5kZW5jaWVzLFxuICAgIGV4dHJhY3RMaWNlbnNlcyxcbiAgICBpbmxpbmVTdHlsZUxhbmd1YWdlLFxuICAgIGppdDogIWFvdCxcbiAgICBzdGF0czogISFzdGF0c0pzb24sXG4gICAgcG9seWZpbGxzOiBwb2x5ZmlsbHMgPT09IHVuZGVmaW5lZCB8fCBBcnJheS5pc0FycmF5KHBvbHlmaWxscykgPyBwb2x5ZmlsbHMgOiBbcG9seWZpbGxzXSxcbiAgICBwb2xsLFxuICAgIHByb2dyZXNzLFxuICAgIGV4dGVybmFsUGFja2FnZXMsXG4gICAgLy8gSWYgbm90IGV4cGxpY2l0bHkgc2V0LCBkZWZhdWx0IHRvIHRoZSBOb2RlLmpzIHByb2Nlc3MgYXJndW1lbnRcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzOiBwcmVzZXJ2ZVN5bWxpbmtzID8/IHByb2Nlc3MuZXhlY0FyZ3YuaW5jbHVkZXMoJy0tcHJlc2VydmUtc3ltbGlua3MnKSxcbiAgICBzdHlsZVByZXByb2Nlc3Nvck9wdGlvbnMsXG4gICAgc3VicmVzb3VyY2VJbnRlZ3JpdHksXG4gICAgc2VydmVyRW50cnlQb2ludCxcbiAgICBwcmVyZW5kZXJPcHRpb25zLFxuICAgIGFwcFNoZWxsT3B0aW9ucyxcbiAgICBzc3JPcHRpb25zLFxuICAgIHZlcmJvc2UsXG4gICAgd2F0Y2gsXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBlbnRyeVBvaW50cyxcbiAgICBvcHRpbWl6YXRpb25PcHRpb25zLFxuICAgIG91dHB1dFBhdGgsXG4gICAgb3V0RXh0ZW5zaW9uLFxuICAgIHNvdXJjZW1hcE9wdGlvbnMsXG4gICAgdHNjb25maWcsXG4gICAgcHJvamVjdFJvb3QsXG4gICAgYXNzZXRzLFxuICAgIG91dHB1dE5hbWVzLFxuICAgIGZpbGVSZXBsYWNlbWVudHMsXG4gICAgZ2xvYmFsU3R5bGVzLFxuICAgIGdsb2JhbFNjcmlwdHMsXG4gICAgc2VydmljZVdvcmtlcjpcbiAgICAgIHR5cGVvZiBzZXJ2aWNlV29ya2VyID09PSAnc3RyaW5nJyA/IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBzZXJ2aWNlV29ya2VyKSA6IHVuZGVmaW5lZCxcbiAgICBpbmRleEh0bWxPcHRpb25zLFxuICAgIHRhaWx3aW5kQ29uZmlndXJhdGlvbixcbiAgfTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgZW50cnkgcG9pbnQgb3B0aW9ucy4gVG8gbWFpbnRhaW4gY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBsZWdhY3kgYnJvd3NlciBidWlsZGVyLCB3ZSBuZWVkIGEgc2luZ2xlIGBicm93c2VyYFxuICogb3B0aW9uIHdoaWNoIGRlZmluZXMgYSBzaW5nbGUgZW50cnkgcG9pbnQuIEhvd2V2ZXIsIHdlIGFsc28gd2FudCB0byBzdXBwb3J0IG11bHRpcGxlIGVudHJ5IHBvaW50cyBhcyBhbiBpbnRlcm5hbCBvcHRpb24uXG4gKiBUaGUgdHdvIG9wdGlvbnMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZSBhbmQgaWYgYGJyb3dzZXJgIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCBhcyB0aGUgc29sZSBlbnRyeSBwb2ludC5cbiAqIElmIGBlbnRyeVBvaW50c2AgYXJlIHByb3ZpZGVkLCB0aGV5IHdpbGwgYmUgdXNlZCBhcyB0aGUgc2V0IG9mIGVudHJ5IHBvaW50cy5cbiAqXG4gKiBAcGFyYW0gd29ya3NwYWNlUm9vdCBQYXRoIHRvIHRoZSByb290IG9mIHRoZSBBbmd1bGFyIHdvcmtzcGFjZS5cbiAqIEBwYXJhbSBicm93c2VyIFRoZSBgYnJvd3NlcmAgb3B0aW9uIHBvaW50aW5nIGF0IHRoZSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludC4gV2hpbGUgcmVxdWlyZWQgcGVyIHRoZSBzY2hlbWEgZmlsZSwgaXQgbWF5IGJlIG9taXR0ZWQgYnlcbiAqICAgICBwcm9ncmFtbWF0aWMgdXNhZ2VzIG9mIGBicm93c2VyLWVzYnVpbGRgLlxuICogQHBhcmFtIGVudHJ5UG9pbnRzIFNldCBvZiBlbnRyeSBwb2ludHMgdG8gdXNlIGlmIHByb3ZpZGVkLlxuICogQHJldHVybnMgQW4gb2JqZWN0IG1hcHBpbmcgZW50cnkgcG9pbnQgbmFtZXMgdG8gdGhlaXIgZmlsZSBwYXRocy5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplRW50cnlQb2ludHMoXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgYnJvd3Nlcjogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICBlbnRyeVBvaW50czogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCksXG4pOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgaWYgKGJyb3dzZXIgPT09ICcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgYnJvd3NlcmAgb3B0aW9uIGNhbm5vdCBiZSBhbiBlbXB0eSBzdHJpbmcuJyk7XG4gIH1cblxuICAvLyBgYnJvd3NlcmAgYW5kIGBlbnRyeVBvaW50c2AgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS5cbiAgaWYgKGJyb3dzZXIgJiYgZW50cnlQb2ludHMuc2l6ZSA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgb25lIG9mIGBicm93c2VyYCBvciBgZW50cnlQb2ludHNgIG1heSBiZSBwcm92aWRlZC4nKTtcbiAgfVxuICBpZiAoIWJyb3dzZXIgJiYgZW50cnlQb2ludHMuc2l6ZSA9PT0gMCkge1xuICAgIC8vIFNjaGVtYSBzaG91bGQgbm9ybWFsbHkgcmVqZWN0IHRoaXMgY2FzZSwgYnV0IHByb2dyYW1tYXRpYyB1c2FnZXMgb2YgdGhlIGJ1aWxkZXIgbWlnaHQgbWFrZSB0aGlzIG1pc3Rha2UuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFaXRoZXIgYGJyb3dzZXJgIG9yIGF0IGxlYXN0IG9uZSBgZW50cnlQb2ludHNgIHZhbHVlIG11c3QgYmUgcHJvdmlkZWQuJyk7XG4gIH1cblxuICAvLyBTY2hlbWEgdHlwZXMgZm9yY2UgYGJyb3dzZXJgIHRvIGFsd2F5cyBiZSBwcm92aWRlZCwgYnV0IGl0IG1heSBiZSBvbWl0dGVkIHdoZW4gdGhlIGJ1aWxkZXIgaXMgaW52b2tlZCBwcm9ncmFtbWF0aWNhbGx5LlxuICBpZiAoYnJvd3Nlcikge1xuICAgIC8vIFVzZSBgYnJvd3NlcmAgYWxvbmUuXG4gICAgcmV0dXJuIHsgJ21haW4nOiBwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgYnJvd3NlcikgfTtcbiAgfSBlbHNlIHtcbiAgICAvLyBVc2UgYGVudHJ5UG9pbnRzYCBhbG9uZS5cbiAgICBjb25zdCBlbnRyeVBvaW50UGF0aHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5UG9pbnQgb2YgZW50cnlQb2ludHMpIHtcbiAgICAgIGNvbnN0IHBhcnNlZEVudHJ5UG9pbnQgPSBwYXRoLnBhcnNlKGVudHJ5UG9pbnQpO1xuXG4gICAgICAvLyBVc2UgdGhlIGlucHV0IGZpbGUgcGF0aCB3aXRob3V0IGFuIGV4dGVuc2lvbiBhcyB0aGUgXCJuYW1lXCIgb2YgdGhlIGVudHJ5IHBvaW50IGRpY3RhdGluZyBpdHMgb3V0cHV0IGxvY2F0aW9uLlxuICAgICAgLy8gUmVsYXRpdmUgZW50cnkgcG9pbnRzIGFyZSBnZW5lcmF0ZWQgYXQgdGhlIHNhbWUgcmVsYXRpdmUgcGF0aCBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS5cbiAgICAgIC8vIEFic29sdXRlIGVudHJ5IHBvaW50cyBhcmUgYWx3YXlzIGdlbmVyYXRlZCB3aXRoIHRoZSBzYW1lIGZpbGUgbmFtZSBpbiB0aGUgcm9vdCBvZiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gVGhpcyBpbmNsdWRlcyBhYnNvbHV0ZVxuICAgICAgLy8gcGF0aHMgcG9pbnRpbmcgYXQgZmlsZXMgYWN0dWFsbHkgd2l0aGluIHRoZSB3b3Jrc3BhY2Ugcm9vdC5cbiAgICAgIGNvbnN0IGVudHJ5UG9pbnROYW1lID0gcGF0aC5pc0Fic29sdXRlKGVudHJ5UG9pbnQpXG4gICAgICAgID8gcGFyc2VkRW50cnlQb2ludC5uYW1lXG4gICAgICAgIDogcGF0aC5qb2luKHBhcnNlZEVudHJ5UG9pbnQuZGlyLCBwYXJzZWRFbnRyeVBvaW50Lm5hbWUpO1xuXG4gICAgICAvLyBHZXQgdGhlIGZ1bGwgZmlsZSBwYXRoIHRvIHRoZSBlbnRyeSBwb2ludCBpbnB1dC5cbiAgICAgIGNvbnN0IGVudHJ5UG9pbnRQYXRoID0gcGF0aC5pc0Fic29sdXRlKGVudHJ5UG9pbnQpXG4gICAgICAgID8gZW50cnlQb2ludFxuICAgICAgICA6IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBlbnRyeVBvaW50KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIGNvbmZsaWN0cyB3aXRoIHByZXZpb3VzIGVudHJ5IHBvaW50cy5cbiAgICAgIGNvbnN0IGV4aXN0aW5nRW50cnlQb2ludFBhdGggPSBlbnRyeVBvaW50UGF0aHNbZW50cnlQb2ludE5hbWVdO1xuICAgICAgaWYgKGV4aXN0aW5nRW50cnlQb2ludFBhdGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBcXGAke2V4aXN0aW5nRW50cnlQb2ludFBhdGh9XFxgIGFuZCBcXGAke2VudHJ5UG9pbnRQYXRofVxcYCBib3RoIG91dHB1dCB0byB0aGUgc2FtZSBsb2NhdGlvbiBcXGAke2VudHJ5UG9pbnROYW1lfVxcYC5gICtcbiAgICAgICAgICAgICcgUmVuYW1lIG9yIG1vdmUgb25lIG9mIHRoZSBmaWxlcyB0byBmaXggdGhlIGNvbmZsaWN0LicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGVudHJ5UG9pbnRQYXRoc1tlbnRyeVBvaW50TmFtZV0gPSBlbnRyeVBvaW50UGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gZW50cnlQb2ludFBhdGhzO1xuICB9XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgZGlyZWN0b3J5IHBhdGggc3RyaW5nLlxuICogQ3VycmVudGx5IG9ubHkgcmVtb3ZlcyBhIHRyYWlsaW5nIHNsYXNoIGlmIHByZXNlbnQuXG4gKiBAcGFyYW0gcGF0aCBBIHBhdGggc3RyaW5nLlxuICogQHJldHVybnMgQSBub3JtYWxpemVkIHBhdGggc3RyaW5nLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVEaXJlY3RvcnlQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gIGlmIChsYXN0ID09PSAnLycgfHwgbGFzdCA9PT0gJ1xcXFwnKSB7XG4gICAgcmV0dXJuIHBhdGguc2xpY2UoMCwgLTEpO1xuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG4iXX0=