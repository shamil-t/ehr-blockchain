"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVirtualModulePlugin = void 0;
/**
 * Creates an esbuild plugin that generated virtual modules.
 *
 * @returns An esbuild plugin.
 */
function createVirtualModulePlugin(options) {
    const { namespace, external, transformPath: pathTransformer, loadContent } = options;
    return {
        name: namespace.replace(/[/:]/g, '-'),
        setup(build) {
            build.onResolve({ filter: new RegExp('^' + namespace) }, ({ kind, path }) => {
                if (kind !== 'entry-point') {
                    return null;
                }
                return {
                    path: pathTransformer?.(path) ?? path,
                    namespace,
                };
            });
            if (external) {
                build.onResolve({ filter: /./, namespace }, ({ path }) => {
                    return {
                        path,
                        external: true,
                    };
                });
            }
            build.onLoad({ filter: /./, namespace }, (args) => loadContent(args, build));
        },
    };
}
exports.createVirtualModulePlugin = createVirtualModulePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1tb2R1bGUtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC92aXJ0dWFsLW1vZHVsZS1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBc0JIOzs7O0dBSUc7QUFDSCxTQUFnQix5QkFBeUIsQ0FBQyxPQUFtQztJQUMzRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUVyRixPQUFPO1FBQ0wsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQztRQUNyQyxLQUFLLENBQUMsS0FBSztZQUNULEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO2dCQUMxRSxJQUFJLElBQUksS0FBSyxhQUFhLEVBQUU7b0JBQzFCLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELE9BQU87b0JBQ0wsSUFBSSxFQUFFLGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUk7b0JBQ3JDLFNBQVM7aUJBQ1YsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7b0JBQ3ZELE9BQU87d0JBQ0wsSUFBSTt3QkFDSixRQUFRLEVBQUUsSUFBSTtxQkFDZixDQUFDO2dCQUNKLENBQUMsQ0FBQyxDQUFDO2FBQ0o7WUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQTdCRCw4REE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBPbkxvYWRBcmdzLCBQbHVnaW4sIFBsdWdpbkJ1aWxkIH0gZnJvbSAnZXNidWlsZCc7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgdGhlIGNyZWF0ZVZpcnR1YWxNb2R1bGVQbHVnaW5cbiAqIEBzZWUgY3JlYXRlVmlydHVhbE1vZHVsZVBsdWdpblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFZpcnR1YWxNb2R1bGVQbHVnaW5PcHRpb25zIHtcbiAgLyoqIE5hbWVzcGFjZS4gRXhhbXBsZTogYGFuZ3VsYXI6cG9seWZpbGxzYC4gKi9cbiAgbmFtZXNwYWNlOiBzdHJpbmc7XG4gIC8qKiBJZiB0aGUgZ2VuZXJhdGVkIG1vZHVsZSBzaG91bGQgYmUgbWFya2VkIGFzIGV4dGVybmFsLiAqL1xuICBleHRlcm5hbD86IGJvb2xlYW47XG4gIC8qKiBNZXRob2QgdG8gdHJhbnNmb3JtIHRoZSBvblJlc29sdmUgcGF0aC4gKi9cbiAgdHJhbnNmb3JtUGF0aD86IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZztcbiAgLyoqIE1ldGhvZCB0byBwcm92aWRlIHRoZSBtb2R1bGUgY29udGVudC4gKi9cbiAgbG9hZENvbnRlbnQ6IChcbiAgICBhcmdzOiBPbkxvYWRBcmdzLFxuICAgIGJ1aWxkOiBQbHVnaW5CdWlsZCxcbiAgKSA9PiBSZXR1cm5UeXBlPFBhcmFtZXRlcnM8UGx1Z2luQnVpbGRbJ29uTG9hZCddPlsxXT47XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlc2J1aWxkIHBsdWdpbiB0aGF0IGdlbmVyYXRlZCB2aXJ0dWFsIG1vZHVsZXMuXG4gKlxuICogQHJldHVybnMgQW4gZXNidWlsZCBwbHVnaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaXJ0dWFsTW9kdWxlUGx1Z2luKG9wdGlvbnM6IFZpcnR1YWxNb2R1bGVQbHVnaW5PcHRpb25zKTogUGx1Z2luIHtcbiAgY29uc3QgeyBuYW1lc3BhY2UsIGV4dGVybmFsLCB0cmFuc2Zvcm1QYXRoOiBwYXRoVHJhbnNmb3JtZXIsIGxvYWRDb250ZW50IH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogbmFtZXNwYWNlLnJlcGxhY2UoL1svOl0vZywgJy0nKSxcbiAgICBzZXR1cChidWlsZCk6IHZvaWQge1xuICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiBuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZSkgfSwgKHsga2luZCwgcGF0aCB9KSA9PiB7XG4gICAgICAgIGlmIChraW5kICE9PSAnZW50cnktcG9pbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IHBhdGhUcmFuc2Zvcm1lcj8uKHBhdGgpID8/IHBhdGgsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChleHRlcm5hbCkge1xuICAgICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uLywgbmFtZXNwYWNlIH0sICh7IHBhdGggfSkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgZXh0ZXJuYWw6IHRydWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogLy4vLCBuYW1lc3BhY2UgfSwgKGFyZ3MpID0+IGxvYWRDb250ZW50KGFyZ3MsIGJ1aWxkKSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==