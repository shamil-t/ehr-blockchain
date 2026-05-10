"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCssResourcePlugin = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const load_result_cache_1 = require("../load-result-cache");
/**
 * Symbol marker used to indicate CSS resource resolution is being attempted.
 * This is used to prevent an infinite loop within the plugin's resolve hook.
 */
const CSS_RESOURCE_RESOLUTION = Symbol('CSS_RESOURCE_RESOLUTION');
/**
 * Creates an esbuild {@link Plugin} that loads all CSS url token references using the
 * built-in esbuild `file` loader. A plugin is used to allow for all file extensions
 * and types to be supported without needing to manually specify all extensions
 * within the build configuration.
 *
 * @returns An esbuild {@link Plugin} instance.
 */
function createCssResourcePlugin(cache) {
    return {
        name: 'angular-css-resource',
        setup(build) {
            build.onResolve({ filter: /.*/ }, async (args) => {
                // Only attempt to resolve url tokens which only exist inside CSS.
                // Also, skip this plugin if already attempting to resolve the url-token.
                if (args.kind !== 'url-token' || args.pluginData?.[CSS_RESOURCE_RESOLUTION]) {
                    return null;
                }
                // If root-relative, absolute or protocol relative url, mark as external to leave the
                // path/URL in place.
                if (/^((?:\w+:)?\/\/|data:|chrome:|#|\/)/.test(args.path)) {
                    return {
                        path: args.path,
                        external: true,
                    };
                }
                const { importer, kind, resolveDir, namespace, pluginData = {} } = args;
                pluginData[CSS_RESOURCE_RESOLUTION] = true;
                const result = await build.resolve(args.path, {
                    importer,
                    kind,
                    namespace,
                    pluginData,
                    resolveDir,
                });
                if (result.errors.length && args.path[0] === '~') {
                    result.errors[0].notes = [
                        {
                            location: null,
                            text: 'You can remove the tilde and use a relative path to reference it, which should remove this error.',
                        },
                    ];
                }
                // Return results that are not files since these are most likely specific to another plugin
                // and cannot be loaded by this plugin.
                if (result.namespace !== 'file') {
                    return result;
                }
                // All file results are considered CSS resources and will be loaded via the file loader
                return {
                    ...result,
                    // Use a relative path to prevent fully resolved paths in the metafile (JSON stats file).
                    // This is only necessary for custom namespaces. esbuild will handle the file namespace.
                    path: (0, node_path_1.relative)(build.initialOptions.absWorkingDir ?? '', result.path),
                    namespace: 'css-resource',
                };
            });
            build.onLoad({ filter: /./, namespace: 'css-resource' }, (0, load_result_cache_1.createCachedLoad)(cache, async (args) => {
                const resourcePath = (0, node_path_1.join)(build.initialOptions.absWorkingDir ?? '', args.path);
                return {
                    contents: await (0, promises_1.readFile)(resourcePath),
                    loader: 'file',
                    watchFiles: [resourcePath],
                };
            }));
        },
    };
}
exports.createCssResourcePlugin = createCssResourcePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXJlc291cmNlLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvc3R5bGVzaGVldHMvY3NzLXJlc291cmNlLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCwrQ0FBNEM7QUFDNUMseUNBQTJDO0FBQzNDLDREQUF5RTtBQUV6RTs7O0dBR0c7QUFDSCxNQUFNLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBRWxFOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxLQUF1QjtJQUM3RCxPQUFPO1FBQ0wsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixLQUFLLENBQUMsS0FBa0I7WUFDdEIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQy9DLGtFQUFrRTtnQkFDbEUseUVBQXlFO2dCQUN6RSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO29CQUMzRSxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCxxRkFBcUY7Z0JBQ3JGLHFCQUFxQjtnQkFDckIsSUFBSSxxQ0FBcUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN6RCxPQUFPO3dCQUNMLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTt3QkFDZixRQUFRLEVBQUUsSUFBSTtxQkFDZixDQUFDO2lCQUNIO2dCQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQztnQkFDeEUsVUFBVSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUUzQyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtvQkFDNUMsUUFBUTtvQkFDUixJQUFJO29CQUNKLFNBQVM7b0JBQ1QsVUFBVTtvQkFDVixVQUFVO2lCQUNYLENBQUMsQ0FBQztnQkFFSCxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO29CQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRzt3QkFDdkI7NEJBQ0UsUUFBUSxFQUFFLElBQUk7NEJBQ2QsSUFBSSxFQUFFLG1HQUFtRzt5QkFDMUc7cUJBQ0YsQ0FBQztpQkFDSDtnQkFFRCwyRkFBMkY7Z0JBQzNGLHVDQUF1QztnQkFDdkMsSUFBSSxNQUFNLENBQUMsU0FBUyxLQUFLLE1BQU0sRUFBRTtvQkFDL0IsT0FBTyxNQUFNLENBQUM7aUJBQ2Y7Z0JBRUQsdUZBQXVGO2dCQUN2RixPQUFPO29CQUNMLEdBQUcsTUFBTTtvQkFDVCx5RkFBeUY7b0JBQ3pGLHdGQUF3RjtvQkFDeEYsSUFBSSxFQUFFLElBQUEsb0JBQVEsRUFBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDckUsU0FBUyxFQUFFLGNBQWM7aUJBQzFCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxNQUFNLENBQ1YsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsRUFDMUMsSUFBQSxvQ0FBZ0IsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUNyQyxNQUFNLFlBQVksR0FBRyxJQUFBLGdCQUFJLEVBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxhQUFhLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFL0UsT0FBTztvQkFDTCxRQUFRLEVBQUUsTUFBTSxJQUFBLG1CQUFRLEVBQUMsWUFBWSxDQUFDO29CQUN0QyxNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsQ0FBQyxZQUFZLENBQUM7aUJBQzNCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ0osQ0FBQztLQUNGLENBQUM7QUFDSixDQUFDO0FBdEVELDBEQXNFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgUGx1Z2luQnVpbGQgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBqb2luLCByZWxhdGl2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBMb2FkUmVzdWx0Q2FjaGUsIGNyZWF0ZUNhY2hlZExvYWQgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5cbi8qKlxuICogU3ltYm9sIG1hcmtlciB1c2VkIHRvIGluZGljYXRlIENTUyByZXNvdXJjZSByZXNvbHV0aW9uIGlzIGJlaW5nIGF0dGVtcHRlZC5cbiAqIFRoaXMgaXMgdXNlZCB0byBwcmV2ZW50IGFuIGluZmluaXRlIGxvb3Agd2l0aGluIHRoZSBwbHVnaW4ncyByZXNvbHZlIGhvb2suXG4gKi9cbmNvbnN0IENTU19SRVNPVVJDRV9SRVNPTFVUSU9OID0gU3ltYm9sKCdDU1NfUkVTT1VSQ0VfUkVTT0xVVElPTicpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gZXNidWlsZCB7QGxpbmsgUGx1Z2lufSB0aGF0IGxvYWRzIGFsbCBDU1MgdXJsIHRva2VuIHJlZmVyZW5jZXMgdXNpbmcgdGhlXG4gKiBidWlsdC1pbiBlc2J1aWxkIGBmaWxlYCBsb2FkZXIuIEEgcGx1Z2luIGlzIHVzZWQgdG8gYWxsb3cgZm9yIGFsbCBmaWxlIGV4dGVuc2lvbnNcbiAqIGFuZCB0eXBlcyB0byBiZSBzdXBwb3J0ZWQgd2l0aG91dCBuZWVkaW5nIHRvIG1hbnVhbGx5IHNwZWNpZnkgYWxsIGV4dGVuc2lvbnNcbiAqIHdpdGhpbiB0aGUgYnVpbGQgY29uZmlndXJhdGlvbi5cbiAqXG4gKiBAcmV0dXJucyBBbiBlc2J1aWxkIHtAbGluayBQbHVnaW59IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3NzUmVzb3VyY2VQbHVnaW4oY2FjaGU/OiBMb2FkUmVzdWx0Q2FjaGUpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLWNzcy1yZXNvdXJjZScsXG4gICAgc2V0dXAoYnVpbGQ6IFBsdWdpbkJ1aWxkKTogdm9pZCB7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uKi8gfSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgLy8gT25seSBhdHRlbXB0IHRvIHJlc29sdmUgdXJsIHRva2VucyB3aGljaCBvbmx5IGV4aXN0IGluc2lkZSBDU1MuXG4gICAgICAgIC8vIEFsc28sIHNraXAgdGhpcyBwbHVnaW4gaWYgYWxyZWFkeSBhdHRlbXB0aW5nIHRvIHJlc29sdmUgdGhlIHVybC10b2tlbi5cbiAgICAgICAgaWYgKGFyZ3Mua2luZCAhPT0gJ3VybC10b2tlbicgfHwgYXJncy5wbHVnaW5EYXRhPy5bQ1NTX1JFU09VUkNFX1JFU09MVVRJT05dKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiByb290LXJlbGF0aXZlLCBhYnNvbHV0ZSBvciBwcm90b2NvbCByZWxhdGl2ZSB1cmwsIG1hcmsgYXMgZXh0ZXJuYWwgdG8gbGVhdmUgdGhlXG4gICAgICAgIC8vIHBhdGgvVVJMIGluIHBsYWNlLlxuICAgICAgICBpZiAoL14oKD86XFx3KzopP1xcL1xcL3xkYXRhOnxjaHJvbWU6fCN8XFwvKS8udGVzdChhcmdzLnBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGltcG9ydGVyLCBraW5kLCByZXNvbHZlRGlyLCBuYW1lc3BhY2UsIHBsdWdpbkRhdGEgPSB7fSB9ID0gYXJncztcbiAgICAgICAgcGx1Z2luRGF0YVtDU1NfUkVTT1VSQ0VfUkVTT0xVVElPTl0gPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkLnJlc29sdmUoYXJncy5wYXRoLCB7XG4gICAgICAgICAgaW1wb3J0ZXIsXG4gICAgICAgICAga2luZCxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgcGx1Z2luRGF0YSxcbiAgICAgICAgICByZXNvbHZlRGlyLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0LmVycm9ycy5sZW5ndGggJiYgYXJncy5wYXRoWzBdID09PSAnficpIHtcbiAgICAgICAgICByZXN1bHQuZXJyb3JzWzBdLm5vdGVzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsb2NhdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgdGV4dDogJ1lvdSBjYW4gcmVtb3ZlIHRoZSB0aWxkZSBhbmQgdXNlIGEgcmVsYXRpdmUgcGF0aCB0byByZWZlcmVuY2UgaXQsIHdoaWNoIHNob3VsZCByZW1vdmUgdGhpcyBlcnJvci4nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHJlc3VsdHMgdGhhdCBhcmUgbm90IGZpbGVzIHNpbmNlIHRoZXNlIGFyZSBtb3N0IGxpa2VseSBzcGVjaWZpYyB0byBhbm90aGVyIHBsdWdpblxuICAgICAgICAvLyBhbmQgY2Fubm90IGJlIGxvYWRlZCBieSB0aGlzIHBsdWdpbi5cbiAgICAgICAgaWYgKHJlc3VsdC5uYW1lc3BhY2UgIT09ICdmaWxlJykge1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbGwgZmlsZSByZXN1bHRzIGFyZSBjb25zaWRlcmVkIENTUyByZXNvdXJjZXMgYW5kIHdpbGwgYmUgbG9hZGVkIHZpYSB0aGUgZmlsZSBsb2FkZXJcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5yZXN1bHQsXG4gICAgICAgICAgLy8gVXNlIGEgcmVsYXRpdmUgcGF0aCB0byBwcmV2ZW50IGZ1bGx5IHJlc29sdmVkIHBhdGhzIGluIHRoZSBtZXRhZmlsZSAoSlNPTiBzdGF0cyBmaWxlKS5cbiAgICAgICAgICAvLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGZvciBjdXN0b20gbmFtZXNwYWNlcy4gZXNidWlsZCB3aWxsIGhhbmRsZSB0aGUgZmlsZSBuYW1lc3BhY2UuXG4gICAgICAgICAgcGF0aDogcmVsYXRpdmUoYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpciA/PyAnJywgcmVzdWx0LnBhdGgpLFxuICAgICAgICAgIG5hbWVzcGFjZTogJ2Nzcy1yZXNvdXJjZScsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICB7IGZpbHRlcjogLy4vLCBuYW1lc3BhY2U6ICdjc3MtcmVzb3VyY2UnIH0sXG4gICAgICAgIGNyZWF0ZUNhY2hlZExvYWQoY2FjaGUsIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzb3VyY2VQYXRoID0gam9pbihidWlsZC5pbml0aWFsT3B0aW9ucy5hYnNXb3JraW5nRGlyID8/ICcnLCBhcmdzLnBhdGgpO1xuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBhd2FpdCByZWFkRmlsZShyZXNvdXJjZVBhdGgpLFxuICAgICAgICAgICAgbG9hZGVyOiAnZmlsZScsXG4gICAgICAgICAgICB3YXRjaEZpbGVzOiBbcmVzb3VyY2VQYXRoXSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==