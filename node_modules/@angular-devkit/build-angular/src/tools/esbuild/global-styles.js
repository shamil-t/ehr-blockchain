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
exports.createGlobalStylesBundleOptions = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const bundle_options_1 = require("./stylesheets/bundle-options");
const virtual_module_plugin_1 = require("./virtual-module-plugin");
function createGlobalStylesBundleOptions(options, target, initial, cache) {
    const { workspaceRoot, optimizationOptions, sourcemapOptions, outputNames, globalStyles, preserveSymlinks, externalDependencies, stylePreprocessorOptions, tailwindConfiguration, } = options;
    const namespace = 'angular:styles/global';
    const entryPoints = {};
    let found = false;
    for (const style of globalStyles) {
        if (style.initial === initial) {
            found = true;
            entryPoints[style.name] = `${namespace};${style.name}`;
        }
    }
    // Skip if there are no entry points for the style loading type
    if (found === false) {
        return;
    }
    const buildOptions = (0, bundle_options_1.createStylesheetBundleOptions)({
        workspaceRoot,
        optimization: !!optimizationOptions.styles.minify,
        sourcemap: !!sourcemapOptions.styles,
        preserveSymlinks,
        target,
        externalDependencies,
        outputNames: initial
            ? outputNames
            : {
                ...outputNames,
                bundles: '[name]',
            },
        includePaths: stylePreprocessorOptions?.includePaths,
        tailwindConfiguration,
    }, cache);
    buildOptions.legalComments = options.extractLicenses ? 'none' : 'eof';
    buildOptions.entryPoints = entryPoints;
    buildOptions.plugins.unshift((0, virtual_module_plugin_1.createVirtualModulePlugin)({
        namespace,
        transformPath: (path) => path.split(';', 2)[1],
        loadContent: (args) => {
            const files = globalStyles.find(({ name }) => name === args.path)?.files;
            (0, node_assert_1.default)(files, `global style name should always be found [${args.path}]`);
            return {
                contents: files.map((file) => `@import '${file.replace(/\\/g, '/')}';`).join('\n'),
                loader: 'css',
                resolveDir: workspaceRoot,
            };
        },
    }));
    return buildOptions;
}
exports.createGlobalStylesBundleOptions = createGlobalStylesBundleOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLXN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvZ2xvYmFsLXN0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFHSCw4REFBaUM7QUFHakMsaUVBQTZFO0FBQzdFLG1FQUFvRTtBQUVwRSxTQUFnQiwrQkFBK0IsQ0FDN0MsT0FBMEMsRUFDMUMsTUFBZ0IsRUFDaEIsT0FBZ0IsRUFDaEIsS0FBdUI7SUFFdkIsTUFBTSxFQUNKLGFBQWEsRUFDYixtQkFBbUIsRUFDbkIsZ0JBQWdCLEVBQ2hCLFdBQVcsRUFDWCxZQUFZLEVBQ1osZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQix3QkFBd0IsRUFDeEIscUJBQXFCLEdBQ3RCLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7SUFDMUMsTUFBTSxXQUFXLEdBQTJCLEVBQUUsQ0FBQztJQUMvQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbEIsS0FBSyxNQUFNLEtBQUssSUFBSSxZQUFZLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtZQUM3QixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2IsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDeEQ7S0FDRjtJQUVELCtEQUErRDtJQUMvRCxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUU7UUFDbkIsT0FBTztLQUNSO0lBRUQsTUFBTSxZQUFZLEdBQUcsSUFBQSw4Q0FBNkIsRUFDaEQ7UUFDRSxhQUFhO1FBQ2IsWUFBWSxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsTUFBTTtRQUNqRCxTQUFTLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQU07UUFDcEMsZ0JBQWdCO1FBQ2hCLE1BQU07UUFDTixvQkFBb0I7UUFDcEIsV0FBVyxFQUFFLE9BQU87WUFDbEIsQ0FBQyxDQUFDLFdBQVc7WUFDYixDQUFDLENBQUM7Z0JBQ0UsR0FBRyxXQUFXO2dCQUNkLE9BQU8sRUFBRSxRQUFRO2FBQ2xCO1FBQ0wsWUFBWSxFQUFFLHdCQUF3QixFQUFFLFlBQVk7UUFDcEQscUJBQXFCO0tBQ3RCLEVBQ0QsS0FBSyxDQUNOLENBQUM7SUFDRixZQUFZLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3RFLFlBQVksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBRXZDLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUMxQixJQUFBLGlEQUF5QixFQUFDO1FBQ3hCLFNBQVM7UUFDVCxhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNwQixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUM7WUFDekUsSUFBQSxxQkFBTSxFQUFDLEtBQUssRUFBRSw2Q0FBNkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7WUFFekUsT0FBTztnQkFDTCxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDbEYsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsVUFBVSxFQUFFLGFBQWE7YUFDMUIsQ0FBQztRQUNKLENBQUM7S0FDRixDQUFDLENBQ0gsQ0FBQztJQUVGLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUF6RUQsMEVBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQnVpbGRPcHRpb25zIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB7IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyB9IGZyb20gJy4uLy4uL2J1aWxkZXJzL2FwcGxpY2F0aW9uL29wdGlvbnMnO1xuaW1wb3J0IHsgTG9hZFJlc3VsdENhY2hlIH0gZnJvbSAnLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQgeyBjcmVhdGVTdHlsZXNoZWV0QnVuZGxlT3B0aW9ucyB9IGZyb20gJy4vc3R5bGVzaGVldHMvYnVuZGxlLW9wdGlvbnMnO1xuaW1wb3J0IHsgY3JlYXRlVmlydHVhbE1vZHVsZVBsdWdpbiB9IGZyb20gJy4vdmlydHVhbC1tb2R1bGUtcGx1Z2luJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdsb2JhbFN0eWxlc0J1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyxcbiAgdGFyZ2V0OiBzdHJpbmdbXSxcbiAgaW5pdGlhbDogYm9vbGVhbixcbiAgY2FjaGU/OiBMb2FkUmVzdWx0Q2FjaGUsXG4pOiBCdWlsZE9wdGlvbnMgfCB1bmRlZmluZWQge1xuICBjb25zdCB7XG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBvcHRpbWl6YXRpb25PcHRpb25zLFxuICAgIHNvdXJjZW1hcE9wdGlvbnMsXG4gICAgb3V0cHV0TmFtZXMsXG4gICAgZ2xvYmFsU3R5bGVzLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgZXh0ZXJuYWxEZXBlbmRlbmNpZXMsXG4gICAgc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zLFxuICAgIHRhaWx3aW5kQ29uZmlndXJhdGlvbixcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgbmFtZXNwYWNlID0gJ2FuZ3VsYXI6c3R5bGVzL2dsb2JhbCc7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHN0eWxlIG9mIGdsb2JhbFN0eWxlcykge1xuICAgIGlmIChzdHlsZS5pbml0aWFsID09PSBpbml0aWFsKSB7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICBlbnRyeVBvaW50c1tzdHlsZS5uYW1lXSA9IGAke25hbWVzcGFjZX07JHtzdHlsZS5uYW1lfWA7XG4gICAgfVxuICB9XG5cbiAgLy8gU2tpcCBpZiB0aGVyZSBhcmUgbm8gZW50cnkgcG9pbnRzIGZvciB0aGUgc3R5bGUgbG9hZGluZyB0eXBlXG4gIGlmIChmb3VuZCA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBidWlsZE9wdGlvbnMgPSBjcmVhdGVTdHlsZXNoZWV0QnVuZGxlT3B0aW9ucyhcbiAgICB7XG4gICAgICB3b3Jrc3BhY2VSb290LFxuICAgICAgb3B0aW1pemF0aW9uOiAhIW9wdGltaXphdGlvbk9wdGlvbnMuc3R5bGVzLm1pbmlmeSxcbiAgICAgIHNvdXJjZW1hcDogISFzb3VyY2VtYXBPcHRpb25zLnN0eWxlcyxcbiAgICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgICB0YXJnZXQsXG4gICAgICBleHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICAgIG91dHB1dE5hbWVzOiBpbml0aWFsXG4gICAgICAgID8gb3V0cHV0TmFtZXNcbiAgICAgICAgOiB7XG4gICAgICAgICAgICAuLi5vdXRwdXROYW1lcyxcbiAgICAgICAgICAgIGJ1bmRsZXM6ICdbbmFtZV0nLFxuICAgICAgICAgIH0sXG4gICAgICBpbmNsdWRlUGF0aHM6IHN0eWxlUHJlcHJvY2Vzc29yT3B0aW9ucz8uaW5jbHVkZVBhdGhzLFxuICAgICAgdGFpbHdpbmRDb25maWd1cmF0aW9uLFxuICAgIH0sXG4gICAgY2FjaGUsXG4gICk7XG4gIGJ1aWxkT3B0aW9ucy5sZWdhbENvbW1lbnRzID0gb3B0aW9ucy5leHRyYWN0TGljZW5zZXMgPyAnbm9uZScgOiAnZW9mJztcbiAgYnVpbGRPcHRpb25zLmVudHJ5UG9pbnRzID0gZW50cnlQb2ludHM7XG5cbiAgYnVpbGRPcHRpb25zLnBsdWdpbnMudW5zaGlmdChcbiAgICBjcmVhdGVWaXJ0dWFsTW9kdWxlUGx1Z2luKHtcbiAgICAgIG5hbWVzcGFjZSxcbiAgICAgIHRyYW5zZm9ybVBhdGg6IChwYXRoKSA9PiBwYXRoLnNwbGl0KCc7JywgMilbMV0sXG4gICAgICBsb2FkQ29udGVudDogKGFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBnbG9iYWxTdHlsZXMuZmluZCgoeyBuYW1lIH0pID0+IG5hbWUgPT09IGFyZ3MucGF0aCk/LmZpbGVzO1xuICAgICAgICBhc3NlcnQoZmlsZXMsIGBnbG9iYWwgc3R5bGUgbmFtZSBzaG91bGQgYWx3YXlzIGJlIGZvdW5kIFske2FyZ3MucGF0aH1dYCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZW50czogZmlsZXMubWFwKChmaWxlKSA9PiBgQGltcG9ydCAnJHtmaWxlLnJlcGxhY2UoL1xcXFwvZywgJy8nKX0nO2ApLmpvaW4oJ1xcbicpLFxuICAgICAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgICAgICAgcmVzb2x2ZURpcjogd29ya3NwYWNlUm9vdCxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSksXG4gICk7XG5cbiAgcmV0dXJuIGJ1aWxkT3B0aW9ucztcbn1cbiJdfQ==