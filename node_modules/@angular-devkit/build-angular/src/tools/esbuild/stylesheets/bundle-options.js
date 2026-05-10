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
exports.bundleComponentStylesheet = exports.createStylesheetBundleOptions = void 0;
const node_crypto_1 = require("node:crypto");
const node_path_1 = __importDefault(require("node:path"));
const bundler_context_1 = require("../bundler-context");
const css_language_1 = require("./css-language");
const css_resource_plugin_1 = require("./css-resource-plugin");
const less_language_1 = require("./less-language");
const sass_language_1 = require("./sass-language");
const stylesheet_plugin_factory_1 = require("./stylesheet-plugin-factory");
/**
 * A counter for component styles used to generate unique build-time identifiers for each stylesheet.
 */
let componentStyleCounter = 0;
function createStylesheetBundleOptions(options, cache, inlineComponentData) {
    // Ensure preprocessor include paths are absolute based on the workspace root
    const includePaths = options.includePaths?.map((includePath) => node_path_1.default.resolve(options.workspaceRoot, includePath));
    const pluginFactory = new stylesheet_plugin_factory_1.StylesheetPluginFactory({
        sourcemap: !!options.sourcemap,
        includePaths,
        inlineComponentData,
        tailwindConfiguration: options.tailwindConfiguration,
    }, cache);
    return {
        absWorkingDir: options.workspaceRoot,
        bundle: true,
        entryNames: options.outputNames.bundles,
        assetNames: options.outputNames.media,
        logLevel: 'silent',
        minify: options.optimization,
        metafile: true,
        sourcemap: options.sourcemap,
        outdir: options.workspaceRoot,
        write: false,
        platform: 'browser',
        target: options.target,
        preserveSymlinks: options.preserveSymlinks,
        external: options.externalDependencies,
        conditions: ['style', 'sass'],
        mainFields: ['style', 'sass'],
        plugins: [
            pluginFactory.create(sass_language_1.SassStylesheetLanguage),
            pluginFactory.create(less_language_1.LessStylesheetLanguage),
            pluginFactory.create(css_language_1.CssStylesheetLanguage),
            (0, css_resource_plugin_1.createCssResourcePlugin)(cache),
        ],
    };
}
exports.createStylesheetBundleOptions = createStylesheetBundleOptions;
/**
 * Bundles a component stylesheet. The stylesheet can be either an inline stylesheet that
 * is contained within the Component's metadata definition or an external file referenced
 * from the Component's metadata definition.
 *
 * @param identifier A unique string identifier for the component stylesheet.
 * @param language The language of the stylesheet such as `css` or `scss`.
 * @param data The string content of the stylesheet.
 * @param filename The filename representing the source of the stylesheet content.
 * @param inline If true, the stylesheet source is within the component metadata;
 * if false, the source is a stylesheet file.
 * @param options An object containing the stylesheet bundling options.
 * @returns An object containing the output of the bundling operation.
 */
async function bundleComponentStylesheet(language, data, filename, inline, options, cache) {
    const namespace = 'angular:styles/component';
    // Use a hash of the inline stylesheet content to ensure a consistent identifier. External stylesheets will resolve
    // to the actual stylesheet file path.
    // TODO: Consider xxhash instead for hashing
    const id = inline ? (0, node_crypto_1.createHash)('sha256').update(data).digest('hex') : componentStyleCounter++;
    const entry = [language, id, filename].join(';');
    const buildOptions = createStylesheetBundleOptions(options, cache, { [entry]: data });
    buildOptions.entryPoints = [`${namespace};${entry}`];
    buildOptions.plugins.push({
        name: 'angular-component-styles',
        setup(build) {
            build.onResolve({ filter: /^angular:styles\/component;/ }, (args) => {
                if (args.kind !== 'entry-point') {
                    return null;
                }
                if (inline) {
                    return {
                        path: entry,
                        namespace,
                    };
                }
                else {
                    return {
                        path: filename,
                    };
                }
            });
            build.onLoad({ filter: /^css;/, namespace }, async () => {
                return {
                    contents: data,
                    loader: 'css',
                    resolveDir: node_path_1.default.dirname(filename),
                };
            });
        },
    });
    // Execute esbuild
    const context = new bundler_context_1.BundlerContext(options.workspaceRoot, false, buildOptions);
    const result = await context.bundle();
    // Extract the result of the bundling from the output files
    let contents = '';
    let map;
    let outputPath;
    const resourceFiles = [];
    if (!result.errors) {
        for (const outputFile of result.outputFiles) {
            const filename = node_path_1.default.basename(outputFile.path);
            if (filename.endsWith('.css')) {
                outputPath = outputFile.path;
                contents = outputFile.text;
            }
            else if (filename.endsWith('.css.map')) {
                map = outputFile.text;
            }
            else {
                // The output files could also contain resources (images/fonts/etc.) that were referenced
                resourceFiles.push(outputFile);
            }
        }
    }
    let metafile;
    if (!result.errors) {
        metafile = result.metafile;
        // Remove entryPoint fields from outputs to prevent the internal component styles from being
        // treated as initial files. Also mark the entry as a component resource for stat reporting.
        Object.values(metafile.outputs).forEach((output) => {
            delete output.entryPoint;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output['ng-component'] = true;
        });
    }
    return {
        errors: result.errors,
        warnings: result.warnings,
        contents,
        map,
        path: outputPath,
        resourceFiles,
        metafile,
    };
}
exports.bundleComponentStylesheet = bundleComponentStylesheet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL3N0eWxlc2hlZXRzL2J1bmRsZS1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILDZDQUF5QztBQUN6QywwREFBNkI7QUFDN0Isd0RBQW9EO0FBRXBELGlEQUF1RDtBQUN2RCwrREFBZ0U7QUFDaEUsbURBQXlEO0FBQ3pELG1EQUF5RDtBQUN6RCwyRUFBc0U7QUFFdEU7O0dBRUc7QUFDSCxJQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQWM5QixTQUFnQiw2QkFBNkIsQ0FDM0MsT0FBZ0MsRUFDaEMsS0FBdUIsRUFDdkIsbUJBQTRDO0lBRTVDLDZFQUE2RTtJQUM3RSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQzdELG1CQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQ2pELENBQUM7SUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLG1EQUF1QixDQUMvQztRQUNFLFNBQVMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVM7UUFDOUIsWUFBWTtRQUNaLG1CQUFtQjtRQUNuQixxQkFBcUIsRUFBRSxPQUFPLENBQUMscUJBQXFCO0tBQ3JELEVBQ0QsS0FBSyxDQUNOLENBQUM7SUFFRixPQUFPO1FBQ0wsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO1FBQ3BDLE1BQU0sRUFBRSxJQUFJO1FBQ1osVUFBVSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTztRQUN2QyxVQUFVLEVBQUUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLO1FBQ3JDLFFBQVEs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TUFBYyxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsT0FBTztRQUNMLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtRQUNyQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7UUFDekIsUUFBUTtRQUNSLEdBQUc7UUFDSCxJQUFJLEVBQUUsVUFBVTtRQUNoQixhQUFhO1FBQ2IsUUFBUTtLQUNULENBQUM7QUFDSixDQUFDO0FBM0ZELDhEQTJGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEJ1aWxkT3B0aW9ucywgT3V0cHV0RmlsZSB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBCdW5kbGVyQ29udGV4dCB9IGZyb20gJy4uL2J1bmRsZXItY29udGV4dCc7XG5pbXBvcnQgeyBMb2FkUmVzdWx0Q2FjaGUgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQgeyBDc3NTdHlsZXNoZWV0TGFuZ3VhZ2UgfSBmcm9tICcuL2Nzcy1sYW5ndWFnZSc7XG5pbXBvcnQgeyBjcmVhdGVDc3NSZXNvdXJjZVBsdWdpbiB9IGZyb20gJy4vY3NzLXJlc291cmNlLXBsdWdpbic7XG5pbXBvcnQgeyBMZXNzU3R5bGVzaGVldExhbmd1YWdlIH0gZnJvbSAnLi9sZXNzLWxhbmd1YWdlJztcbmltcG9ydCB7IFNhc3NTdHlsZXNoZWV0TGFuZ3VhZ2UgfSBmcm9tICcuL3Nhc3MtbGFuZ3VhZ2UnO1xuaW1wb3J0IHsgU3R5bGVzaGVldFBsdWdpbkZhY3RvcnkgfSBmcm9tICcuL3N0eWxlc2hlZXQtcGx1Z2luLWZhY3RvcnknO1xuXG4vKipcbiAqIEEgY291bnRlciBmb3IgY29tcG9uZW50IHN0eWxlcyB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBidWlsZC10aW1lIGlkZW50aWZpZXJzIGZvciBlYWNoIHN0eWxlc2hlZXQuXG4gKi9cbmxldCBjb21wb25lbnRTdHlsZUNvdW50ZXIgPSAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJ1bmRsZVN0eWxlc2hlZXRPcHRpb25zIHtcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nO1xuICBvcHRpbWl6YXRpb246IGJvb2xlYW47XG4gIHByZXNlcnZlU3ltbGlua3M/OiBib29sZWFuO1xuICBzb3VyY2VtYXA6IGJvb2xlYW4gfCAnZXh0ZXJuYWwnIHwgJ2lubGluZSc7XG4gIG91dHB1dE5hbWVzOiB7IGJ1bmRsZXM6IHN0cmluZzsgbWVkaWE6IHN0cmluZyB9O1xuICBpbmNsdWRlUGF0aHM/OiBzdHJpbmdbXTtcbiAgZXh0ZXJuYWxEZXBlbmRlbmNpZXM/OiBzdHJpbmdbXTtcbiAgdGFyZ2V0OiBzdHJpbmdbXTtcbiAgdGFpbHdpbmRDb25maWd1cmF0aW9uPzogeyBmaWxlOiBzdHJpbmc7IHBhY2thZ2U6IHN0cmluZyB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3R5bGVzaGVldEJ1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IEJ1bmRsZVN0eWxlc2hlZXRPcHRpb25zLFxuICBjYWNoZT86IExvYWRSZXN1bHRDYWNoZSxcbiAgaW5saW5lQ29tcG9uZW50RGF0YT86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4pOiBCdWlsZE9wdGlvbnMgJiB7IHBsdWdpbnM6IE5vbk51bGxhYmxlPEJ1aWxkT3B0aW9uc1sncGx1Z2lucyddPiB9IHtcbiAgLy8gRW5zdXJlIHByZXByb2Nlc3NvciBpbmNsdWRlIHBhdGhzIGFyZSBhYnNvbHV0ZSBiYXNlZCBvbiB0aGUgd29ya3NwYWNlIHJvb3RcbiAgY29uc3QgaW5jbHVkZVBhdGhzID0gb3B0aW9ucy5pbmNsdWRlUGF0aHM/Lm1hcCgoaW5jbHVkZVBhdGgpID0+XG4gICAgcGF0aC5yZXNvbHZlKG9wdGlvbnMud29ya3NwYWNlUm9vdCwgaW5jbHVkZVBhdGgpLFxuICApO1xuXG4gIGNvbnN0IHBsdWdpbkZhY3RvcnkgPSBuZXcgU3R5bGVzaGVldFBsdWdpbkZhY3RvcnkoXG4gICAge1xuICAgICAgc291cmNlbWFwOiAhIW9wdGlvbnMuc291cmNlbWFwLFxuICAgICAgaW5jbHVkZVBhdGhzLFxuICAgICAgaW5saW5lQ29tcG9uZW50RGF0YSxcbiAgICAgIHRhaWx3aW5kQ29uZmlndXJhdGlvbjogb3B0aW9ucy50YWlsd2luZENvbmZpZ3VyYXRpb24sXG4gICAgfSxcbiAgICBjYWNoZSxcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIGFic1dvcmtpbmdEaXI6IG9wdGlvbnMud29ya3NwYWNlUm9vdCxcbiAgICBidW5kbGU6IHRydWUsXG4gICAgZW50cnlOYW1lczogb3B0aW9ucy5vdXRwdXROYW1lcy5idW5kbGVzLFxuICAgIGFzc2V0TmFtZXM6IG9wdGlvbnMub3V0cHV0TmFtZXMubWVkaWEsXG4gICAgbG9nTGV2ZWw6ICdzaWxlbnQnLFxuICAgIG1pbmlmeTogb3B0aW9ucy5vcHRpbWl6YXRpb24sXG4gICAgbWV0YWZpbGU6IHRydWUsXG4gICAgc291cmNlbWFwOiBvcHRpb25zLnNvdXJjZW1hcCxcbiAgICBvdXRkaXI6IG9wdGlvbnMud29ya3NwYWNlUm9vdCxcbiAgICB3cml0ZTogZmFsc2UsXG4gICAgcGxhdGZvcm06ICdicm93c2VyJyxcbiAgICB0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0LFxuICAgIHByZXNlcnZlU3ltbGlua3M6IG9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICBleHRlcm5hbDogb3B0aW9ucy5leHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICBjb25kaXRpb25zOiBbJ3N0eWxlJywgJ3Nhc3MnXSxcbiAgICBtYWluRmllbGRzOiBbJ3N0eWxlJywgJ3Nhc3MnXSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBwbHVnaW5GYWN0b3J5LmNyZWF0ZShTYXNzU3R5bGVzaGVldExhbmd1YWdlKSxcbiAgICAgIHBsdWdpbkZhY3RvcnkuY3JlYXRlKExlc3NTdHlsZXNoZWV0TGFuZ3VhZ2UpLFxuICAgICAgcGx1Z2luRmFjdG9yeS5jcmVhdGUoQ3NzU3R5bGVzaGVldExhbmd1YWdlKSxcbiAgICAgIGNyZWF0ZUNzc1Jlc291cmNlUGx1Z2luKGNhY2hlKSxcbiAgICBdLFxuICB9O1xufVxuXG4vKipcbiAqIEJ1bmRsZXMgYSBjb21wb25lbnQgc3R5bGVzaGVldC4gVGhlIHN0eWxlc2hlZXQgY2FuIGJlIGVpdGhlciBhbiBpbmxpbmUgc3R5bGVzaGVldCB0aGF0XG4gKiBpcyBjb250YWluZWQgd2l0aGluIHRoZSBDb21wb25lbnQncyBtZXRhZGF0YSBkZWZpbml0aW9uIG9yIGFuIGV4dGVybmFsIGZpbGUgcmVmZXJlbmNlZFxuICogZnJvbSB0aGUgQ29tcG9uZW50J3MgbWV0YWRhdGEgZGVmaW5pdGlvbi5cbiAqXG4gKiBAcGFyYW0gaWRlbnRpZmllciBBIHVuaXF1ZSBzdHJpbmcgaWRlbnRpZmllciBmb3IgdGhlIGNvbXBvbmVudCBzdHlsZXNoZWV0LlxuICogQHBhcmFtIGxhbmd1YWdlIFRoZSBsYW5ndWFnZSBvZiB0aGUgc3R5bGVzaGVldCBzdWNoIGFzIGBjc3NgIG9yIGBzY3NzYC5cbiAqIEBwYXJhbSBkYXRhIFRoZSBzdHJpbmcgY29udGVudCBvZiB0aGUgc3R5bGVzaGVldC5cbiAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgZmlsZW5hbWUgcmVwcmVzZW50aW5nIHRoZSBzb3VyY2Ugb2YgdGhlIHN0eWxlc2hlZXQgY29udGVudC5cbiAqIEBwYXJhbSBpbmxpbmUgSWYgdHJ1ZSwgdGhlIHN0eWxlc2hlZXQgc291cmNlIGlzIHdpdGhpbiB0aGUgY29tcG9uZW50IG1ldGFkYXRhO1xuICogaWYgZmFsc2UsIHRoZSBzb3VyY2UgaXMgYSBzdHlsZXNoZWV0IGZpbGUuXG4gKiBAcGFyYW0gb3B0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgc3R5bGVzaGVldCBidW5kbGluZyBvcHRpb25zLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG91dHB1dCBvZiB0aGUgYnVuZGxpbmcgb3BlcmF0aW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldChcbiAgbGFuZ3VhZ2U6IHN0cmluZyxcbiAgZGF0YTogc3RyaW5nLFxuICBmaWxlbmFtZTogc3RyaW5nLFxuICBpbmxpbmU6IGJvb2xlYW4sXG4gIG9wdGlvbnM6IEJ1bmRsZVN0eWxlc2hlZXRPcHRpb25zLFxuICBjYWNoZT86IExvYWRSZXN1bHRDYWNoZSxcbikge1xuICBjb25zdCBuYW1lc3BhY2UgPSAnYW5ndWxhcjpzdHlsZXMvY29tcG9uZW50JztcbiAgLy8gVXNlIGEgaGFzaCBvZiB0aGUgaW5saW5lIHN0eWxlc2hlZXQgY29udGVudCB0byBlbnN1cmUgYSBjb25zaXN0ZW50IGlkZW50aWZpZXIuIEV4dGVybmFsIHN0eWxlc2hlZXRzIHdpbGwgcmVzb2x2ZVxuICAvLyB0byB0aGUgYWN0dWFsIHN0eWxlc2hlZXQgZmlsZSBwYXRoLlxuICAvLyBUT0RPOiBDb25zaWRlciB4eGhhc2ggaW5zdGVhZCBmb3IgaGFzaGluZ1xuICBjb25zdCBpZCA9IGlubGluZSA/IGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShkYXRhKS5kaWdlc3QoJ2hleCcpIDogY29tcG9uZW50U3R5bGVDb3VudGVyKys7XG4gIGNvbnN0IGVudHJ5ID0gW2xhbmd1YWdlLCBpZCwgZmlsZW5hbWVdLmpvaW4oJzsnKTtcblxuICBjb25zdCBidWlsZE9wdGlvbnMgPSBjcmVhdGVTdHlsZXNoZWV0QnVuZGxlT3B0aW9ucyhvcHRpb25zLCBjYWNoZSwgeyBbZW50cnldOiBkYXRhIH0pO1xuICBidWlsZE9wdGlvbnMuZW50cnlQb2ludHMgPSBbYCR7bmFtZXNwYWNlfTske2VudHJ5fWBdO1xuICBidWlsZE9wdGlvbnMucGx1Z2lucy5wdXNoKHtcbiAgICBuYW1lOiAnYW5ndWxhci1jb21wb25lbnQtc3R5bGVzJyxcbiAgICBzZXR1cChidWlsZCkge1xuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvXmFuZ3VsYXI6c3R5bGVzXFwvY29tcG9uZW50Oy8gfSwgKGFyZ3MpID0+IHtcbiAgICAgICAgaWYgKGFyZ3Mua2luZCAhPT0gJ2VudHJ5LXBvaW50Jykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlubGluZSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoOiBlbnRyeSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoOiBmaWxlbmFtZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogL15jc3M7LywgbmFtZXNwYWNlIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZW50czogZGF0YSxcbiAgICAgICAgICBsb2FkZXI6ICdjc3MnLFxuICAgICAgICAgIHJlc29sdmVEaXI6IHBhdGguZGlybmFtZShmaWxlbmFtZSksXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcblxuICAvLyBFeGVjdXRlIGVzYnVpbGRcbiAgY29uc3QgY29udGV4dCA9IG5ldyBCdW5kbGVyQ29udGV4dChvcHRpb25zLndvcmtzcGFjZVJvb3QsIGZhbHNlLCBidWlsZE9wdGlvbnMpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb250ZXh0LmJ1bmRsZSgpO1xuXG4gIC8vIEV4dHJhY3QgdGhlIHJlc3VsdCBvZiB0aGUgYnVuZGxpbmcgZnJvbSB0aGUgb3V0cHV0IGZpbGVzXG4gIGxldCBjb250ZW50cyA9ICcnO1xuICBsZXQgbWFwO1xuICBsZXQgb3V0cHV0UGF0aDtcbiAgY29uc3QgcmVzb3VyY2VGaWxlczogT3V0cHV0RmlsZVtdID0gW107XG4gIGlmICghcmVzdWx0LmVycm9ycykge1xuICAgIGZvciAoY29uc3Qgb3V0cHV0RmlsZSBvZiByZXN1bHQub3V0cHV0RmlsZXMpIHtcbiAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aC5iYXNlbmFtZShvdXRwdXRGaWxlLnBhdGgpO1xuICAgICAgaWYgKGZpbGVuYW1lLmVuZHNXaXRoKCcuY3NzJykpIHtcbiAgICAgICAgb3V0cHV0UGF0aCA9IG91dHB1dEZpbGUucGF0aDtcbiAgICAgICAgY29udGVudHMgPSBvdXRwdXRGaWxlLnRleHQ7XG4gICAgICB9IGVsc2UgaWYgKGZpbGVuYW1lLmVuZHNXaXRoKCcuY3NzLm1hcCcpKSB7XG4gICAgICAgIG1hcCA9IG91dHB1dEZpbGUudGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBvdXRwdXQgZmlsZXMgY291bGQgYWxzbyBjb250YWluIHJlc291cmNlcyAoaW1hZ2VzL2ZvbnRzL2V0Yy4pIHRoYXQgd2VyZSByZWZlcmVuY2VkXG4gICAgICAgIHJlc291cmNlRmlsZXMucHVzaChvdXRwdXRGaWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbWV0YWZpbGU7XG4gIGlmICghcmVzdWx0LmVycm9ycykge1xuICAgIG1ldGFmaWxlID0gcmVzdWx0Lm1ldGFmaWxlO1xuICAgIC8vIFJlbW92ZSBlbnRyeVBvaW50IGZpZWxkcyBmcm9tIG91dHB1dHMgdG8gcHJldmVudCB0aGUgaW50ZXJuYWwgY29tcG9uZW50IHN0eWxlcyBmcm9tIGJlaW5nXG4gICAgLy8gdHJlYXRlZCBhcyBpbml0aWFsIGZpbGVzLiBBbHNvIG1hcmsgdGhlIGVudHJ5IGFzIGEgY29tcG9uZW50IHJlc291cmNlIGZvciBzdGF0IHJlcG9ydGluZy5cbiAgICBPYmplY3QudmFsdWVzKG1ldGFmaWxlLm91dHB1dHMpLmZvckVhY2goKG91dHB1dCkgPT4ge1xuICAgICAgZGVsZXRlIG91dHB1dC5lbnRyeVBvaW50O1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIChvdXRwdXQgYXMgYW55KVsnbmctY29tcG9uZW50J10gPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBlcnJvcnM6IHJlc3VsdC5lcnJvcnMsXG4gICAgd2FybmluZ3M6IHJlc3VsdC53YXJuaW5ncyxcbiAgICBjb250ZW50cyxcbiAgICBtYXAsXG4gICAgcGF0aDogb3V0cHV0UGF0aCxcbiAgICByZXNvdXJjZUZpbGVzLFxuICAgIG1ldGFmaWxlLFxuICB9O1xufVxuIl19