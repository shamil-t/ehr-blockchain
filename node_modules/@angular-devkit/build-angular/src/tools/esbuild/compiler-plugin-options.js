"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompilerPluginOptions = void 0;
function createCompilerPluginOptions(options, target, sourceFileCache) {
    const { workspaceRoot, optimizationOptions, sourcemapOptions, tsconfig, outputNames, fileReplacements, externalDependencies, preserveSymlinks, stylePreprocessorOptions, advancedOptimizations, inlineStyleLanguage, jit, tailwindConfiguration, } = options;
    return {
        // JS/TS options
        pluginOptions: {
            sourcemap: !!sourcemapOptions.scripts,
            thirdPartySourcemaps: sourcemapOptions.vendor,
            tsconfig,
            jit,
            advancedOptimizations,
            fileReplacements,
            sourceFileCache,
            loadResultCache: sourceFileCache?.loadResultCache,
        },
        // Component stylesheet options
        styleOptions: {
            workspaceRoot,
            optimization: !!optimizationOptions.styles.minify,
            sourcemap: 
            // Hidden component stylesheet sourcemaps are inaccessible which is effectively
            // the same as being disabled. Disabling has the advantage of avoiding the overhead
            // of sourcemap processing.
            !!sourcemapOptions.styles && (sourcemapOptions.hidden ? false : 'inline'),
            outputNames,
            includePaths: stylePreprocessorOptions?.includePaths,
            externalDependencies,
            target,
            inlineStyleLanguage,
            preserveSymlinks,
            tailwindConfiguration,
        },
    };
}
exports.createCompilerPluginOptions = createCompilerPluginOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXItcGx1Z2luLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2NvbXBpbGVyLXBsdWdpbi1vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQU9ILFNBQWdCLDJCQUEyQixDQUN6QyxPQUEwQyxFQUMxQyxNQUFnQixFQUNoQixlQUFpQztJQUtqQyxNQUFNLEVBQ0osYUFBYSxFQUNiLG1CQUFtQixFQUNuQixnQkFBZ0IsRUFDaEIsUUFBUSxFQUNSLFdBQVcsRUFDWCxnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGdCQUFnQixFQUNoQix3QkFBd0IsRUFDeEIscUJBQXFCLEVBQ3JCLG1CQUFtQixFQUNuQixHQUFHLEVBQ0gscUJBQXFCLEdBQ3RCLEdBQUcsT0FBTyxDQUFDO0lBRVosT0FBTztRQUNMLGdCQUFnQjtRQUNoQixhQUFhLEVBQUU7WUFDYixTQUFTLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE9BQU87WUFDckMsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUMsTUFBTTtZQUM3QyxRQUFRO1lBQ1IsR0FBRztZQUNILHFCQUFxQjtZQUNyQixnQkFBZ0I7WUFDaEIsZUFBZTtZQUNmLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZTtTQUNsRDtRQUNELCtCQUErQjtRQUMvQixZQUFZLEVBQUU7WUFDWixhQUFhO1lBQ2IsWUFBWSxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUNqRCxTQUFTO1lBQ1AsK0VBQStFO1lBQy9FLG1GQUFtRjtZQUNuRiwyQkFBMkI7WUFDM0IsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDM0UsV0FBVztZQUNYLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxZQUFZO1lBQ3BELG9CQUFvQjtZQUNwQixNQUFNO1lBQ04sbUJBQW1CO1lBQ25CLGdCQUFnQjtZQUNoQixxQkFBcUI7U0FDdEI7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXRERCxrRUFzREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgTm9ybWFsaXplZEFwcGxpY2F0aW9uQnVpbGRPcHRpb25zIH0gZnJvbSAnLi4vLi4vYnVpbGRlcnMvYXBwbGljYXRpb24vb3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IFNvdXJjZUZpbGVDYWNoZSwgY3JlYXRlQ29tcGlsZXJQbHVnaW4gfSBmcm9tICcuL2FuZ3VsYXIvY29tcGlsZXItcGx1Z2luJztcblxudHlwZSBDcmVhdGVDb21waWxlclBsdWdpblBhcmFtZXRlcnMgPSBQYXJhbWV0ZXJzPHR5cGVvZiBjcmVhdGVDb21waWxlclBsdWdpbj47XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21waWxlclBsdWdpbk9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRBcHBsaWNhdGlvbkJ1aWxkT3B0aW9ucyxcbiAgdGFyZ2V0OiBzdHJpbmdbXSxcbiAgc291cmNlRmlsZUNhY2hlPzogU291cmNlRmlsZUNhY2hlLFxuKToge1xuICBwbHVnaW5PcHRpb25zOiBDcmVhdGVDb21waWxlclBsdWdpblBhcmFtZXRlcnNbMF07XG4gIHN0eWxlT3B0aW9uczogQ3JlYXRlQ29tcGlsZXJQbHVnaW5QYXJhbWV0ZXJzWzFdO1xufSB7XG4gIGNvbnN0IHtcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIG9wdGltaXphdGlvbk9wdGlvbnMsXG4gICAgc291cmNlbWFwT3B0aW9ucyxcbiAgICB0c2NvbmZpZyxcbiAgICBvdXRwdXROYW1lcyxcbiAgICBmaWxlUmVwbGFjZW1lbnRzLFxuICAgIGV4dGVybmFsRGVwZW5kZW5jaWVzLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zLFxuICAgIGFkdmFuY2VkT3B0aW1pemF0aW9ucyxcbiAgICBpbmxpbmVTdHlsZUxhbmd1YWdlLFxuICAgIGppdCxcbiAgICB0YWlsd2luZENvbmZpZ3VyYXRpb24sXG4gIH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiB7XG4gICAgLy8gSlMvVFMgb3B0aW9uc1xuICAgIHBsdWdpbk9wdGlvbnM6IHtcbiAgICAgIHNvdXJjZW1hcDogISFzb3VyY2VtYXBPcHRpb25zLnNjcmlwdHMsXG4gICAgICB0aGlyZFBhcnR5U291cmNlbWFwczogc291cmNlbWFwT3B0aW9ucy52ZW5kb3IsXG4gICAgICB0c2NvbmZpZyxcbiAgICAgIGppdCxcbiAgICAgIGFkdmFuY2VkT3B0aW1pemF0aW9ucyxcbiAgICAgIGZpbGVSZXBsYWNlbWVudHMsXG4gICAgICBzb3VyY2VGaWxlQ2FjaGUsXG4gICAgICBsb2FkUmVzdWx0Q2FjaGU6IHNvdXJjZUZpbGVDYWNoZT8ubG9hZFJlc3VsdENhY2hlLFxuICAgIH0sXG4gICAgLy8gQ29tcG9uZW50IHN0eWxlc2hlZXQgb3B0aW9uc1xuICAgIHN0eWxlT3B0aW9uczoge1xuICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgIG9wdGltaXphdGlvbjogISFvcHRpbWl6YXRpb25PcHRpb25zLnN0eWxlcy5taW5pZnksXG4gICAgICBzb3VyY2VtYXA6XG4gICAgICAgIC8vIEhpZGRlbiBjb21wb25lbnQgc3R5bGVzaGVldCBzb3VyY2VtYXBzIGFyZSBpbmFjY2Vzc2libGUgd2hpY2ggaXMgZWZmZWN0aXZlbHlcbiAgICAgICAgLy8gdGhlIHNhbWUgYXMgYmVpbmcgZGlzYWJsZWQuIERpc2FibGluZyBoYXMgdGhlIGFkdmFudGFnZSBvZiBhdm9pZGluZyB0aGUgb3ZlcmhlYWRcbiAgICAgICAgLy8gb2Ygc291cmNlbWFwIHByb2Nlc3NpbmcuXG4gICAgICAgICEhc291cmNlbWFwT3B0aW9ucy5zdHlsZXMgJiYgKHNvdXJjZW1hcE9wdGlvbnMuaGlkZGVuID8gZmFsc2UgOiAnaW5saW5lJyksXG4gICAgICBvdXRwdXROYW1lcyxcbiAgICAgIGluY2x1ZGVQYXRoczogc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zPy5pbmNsdWRlUGF0aHMsXG4gICAgICBleHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICAgIHRhcmdldCxcbiAgICAgIGlubGluZVN0eWxlTGFuZ3VhZ2UsXG4gICAgICBwcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgdGFpbHdpbmRDb25maWd1cmF0aW9uLFxuICAgIH0sXG4gIH07XG59XG4iXX0=