"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExternalPackagesPlugin = void 0;
const EXTERNAL_PACKAGE_RESOLUTION = Symbol('EXTERNAL_PACKAGE_RESOLUTION');
/**
 * Creates a plugin that marks any resolved path as external if it is within a node modules directory.
 * This is used instead of the esbuild `packages` option to avoid marking bare specifiers that use
 * tsconfig path mapping to resolve to a workspace relative path. This is common for monorepos that
 * contain libraries that are built along with the application. These libraries should not be considered
 *
 * @returns An esbuild plugin.
 */
function createExternalPackagesPlugin() {
    return {
        name: 'angular-external-packages',
        setup(build) {
            build.onResolve({ filter: /./ }, async (args) => {
                if (args.pluginData?.[EXTERNAL_PACKAGE_RESOLUTION]) {
                    return null;
                }
                const { importer, kind, resolveDir, namespace, pluginData = {} } = args;
                pluginData[EXTERNAL_PACKAGE_RESOLUTION] = true;
                const result = await build.resolve(args.path, {
                    importer,
                    kind,
                    namespace,
                    pluginData,
                    resolveDir,
                });
                if (result.path && /[\\/]node_modules[\\/]/.test(result.path)) {
                    return {
                        path: args.path,
                        external: true,
                    };
                }
                return result;
            });
        },
    };
}
exports.createExternalPackagesPlugin = createExternalPackagesPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWwtcGFja2FnZXMtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9leHRlcm5hbC1wYWNrYWdlcy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUgsTUFBTSwyQkFBMkIsR0FBRyxNQUFNLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUUxRTs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsNEJBQTRCO0lBQzFDLE9BQU87UUFDTCxJQUFJLEVBQUUsMkJBQTJCO1FBQ2pDLEtBQUssQ0FBQyxLQUFLO1lBQ1QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzlDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLDJCQUEyQixDQUFDLEVBQUU7b0JBQ2xELE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQztnQkFDeEUsVUFBVSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUUvQyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtvQkFDNUMsUUFBUTtvQkFDUixJQUFJO29CQUNKLFNBQVM7b0JBQ1QsVUFBVTtvQkFDVixVQUFVO2lCQUNYLENBQUMsQ0FBQztnQkFFSCxJQUFJLE1BQU0sQ0FBQyxJQUFJLElBQUksd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDN0QsT0FBTzt3QkFDTCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7d0JBQ2YsUUFBUSxFQUFFLElBQUk7cUJBQ2YsQ0FBQztpQkFDSDtnQkFFRCxPQUFPLE1BQU0sQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQS9CRCxvRUErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICdlc2J1aWxkJztcblxuY29uc3QgRVhURVJOQUxfUEFDS0FHRV9SRVNPTFVUSU9OID0gU3ltYm9sKCdFWFRFUk5BTF9QQUNLQUdFX1JFU09MVVRJT04nKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgcGx1Z2luIHRoYXQgbWFya3MgYW55IHJlc29sdmVkIHBhdGggYXMgZXh0ZXJuYWwgaWYgaXQgaXMgd2l0aGluIGEgbm9kZSBtb2R1bGVzIGRpcmVjdG9yeS5cbiAqIFRoaXMgaXMgdXNlZCBpbnN0ZWFkIG9mIHRoZSBlc2J1aWxkIGBwYWNrYWdlc2Agb3B0aW9uIHRvIGF2b2lkIG1hcmtpbmcgYmFyZSBzcGVjaWZpZXJzIHRoYXQgdXNlXG4gKiB0c2NvbmZpZyBwYXRoIG1hcHBpbmcgdG8gcmVzb2x2ZSB0byBhIHdvcmtzcGFjZSByZWxhdGl2ZSBwYXRoLiBUaGlzIGlzIGNvbW1vbiBmb3IgbW9ub3JlcG9zIHRoYXRcbiAqIGNvbnRhaW4gbGlicmFyaWVzIHRoYXQgYXJlIGJ1aWx0IGFsb25nIHdpdGggdGhlIGFwcGxpY2F0aW9uLiBUaGVzZSBsaWJyYXJpZXMgc2hvdWxkIG5vdCBiZSBjb25zaWRlcmVkXG4gKlxuICogQHJldHVybnMgQW4gZXNidWlsZCBwbHVnaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFeHRlcm5hbFBhY2thZ2VzUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2FuZ3VsYXItZXh0ZXJuYWwtcGFja2FnZXMnLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uLyB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5wbHVnaW5EYXRhPy5bRVhURVJOQUxfUEFDS0FHRV9SRVNPTFVUSU9OXSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBpbXBvcnRlciwga2luZCwgcmVzb2x2ZURpciwgbmFtZXNwYWNlLCBwbHVnaW5EYXRhID0ge30gfSA9IGFyZ3M7XG4gICAgICAgIHBsdWdpbkRhdGFbRVhURVJOQUxfUEFDS0FHRV9SRVNPTFVUSU9OXSA9IHRydWU7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYnVpbGQucmVzb2x2ZShhcmdzLnBhdGgsIHtcbiAgICAgICAgICBpbXBvcnRlcixcbiAgICAgICAgICBraW5kLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBwbHVnaW5EYXRhLFxuICAgICAgICAgIHJlc29sdmVEaXIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXN1bHQucGF0aCAmJiAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL10vLnRlc3QocmVzdWx0LnBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==