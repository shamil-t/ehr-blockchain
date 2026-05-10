"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRxjsEsmResolutionPlugin = void 0;
const RXJS_ESM_RESOLUTION = Symbol('RXJS_ESM_RESOLUTION');
/**
 * Creates a plugin that forces ESM resolution of rxjs.
 * This is needed as when targeting node, the CJS version is used to the current package conditional exports.
 * @see: https://github.com/ReactiveX/rxjs/blob/2947583bb33e97f3db9e6d9f6cea70c62a173060/package.json#L19.
 *
 * NOTE: This can be removed when and if rxjs adds an import condition that allows ESM usage on Node.js.
 *
 * @returns An esbuild plugin.
 */
function createRxjsEsmResolutionPlugin() {
    return {
        name: 'angular-rxjs-resolution',
        setup(build) {
            build.onResolve({ filter: /^rxjs/ }, async (args) => {
                if (args.pluginData?.[RXJS_ESM_RESOLUTION]) {
                    return null;
                }
                const { importer, kind, resolveDir, namespace, pluginData = {} } = args;
                pluginData[RXJS_ESM_RESOLUTION] = true;
                const result = await build.resolve(args.path, {
                    importer,
                    kind,
                    namespace,
                    pluginData,
                    resolveDir,
                });
                result.path = result.path.replace(/([\\/]dist[\\/])cjs([\\/])/, '$1esm$2');
                return result;
            });
        },
    };
}
exports.createRxjsEsmResolutionPlugin = createRxjsEsmResolutionPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnhqcy1lc20tcmVzb2x1dGlvbi1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL3J4anMtZXNtLXJlc29sdXRpb24tcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUlILE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFFMUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFnQiw2QkFBNkI7SUFDM0MsT0FBTztRQUNMLElBQUksRUFBRSx5QkFBeUI7UUFDL0IsS0FBSyxDQUFDLEtBQUs7WUFDVCxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDbEQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRTtvQkFDMUMsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEdBQUcsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUN4RSxVQUFVLENBQUMsbUJBQW1CLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBRXZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUM1QyxRQUFRO29CQUNSLElBQUk7b0JBQ0osU0FBUztvQkFDVCxVQUFVO29CQUNWLFVBQVU7aUJBQ1gsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsNEJBQTRCLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRTNFLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUM7QUFDSixDQUFDO0FBMUJELHNFQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ2VzYnVpbGQnO1xuXG5jb25zdCBSWEpTX0VTTV9SRVNPTFVUSU9OID0gU3ltYm9sKCdSWEpTX0VTTV9SRVNPTFVUSU9OJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHBsdWdpbiB0aGF0IGZvcmNlcyBFU00gcmVzb2x1dGlvbiBvZiByeGpzLlxuICogVGhpcyBpcyBuZWVkZWQgYXMgd2hlbiB0YXJnZXRpbmcgbm9kZSwgdGhlIENKUyB2ZXJzaW9uIGlzIHVzZWQgdG8gdGhlIGN1cnJlbnQgcGFja2FnZSBjb25kaXRpb25hbCBleHBvcnRzLlxuICogQHNlZTogaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2Jsb2IvMjk0NzU4M2JiMzNlOTdmM2RiOWU2ZDlmNmNlYTcwYzYyYTE3MzA2MC9wYWNrYWdlLmpzb24jTDE5LlxuICpcbiAqIE5PVEU6IFRoaXMgY2FuIGJlIHJlbW92ZWQgd2hlbiBhbmQgaWYgcnhqcyBhZGRzIGFuIGltcG9ydCBjb25kaXRpb24gdGhhdCBhbGxvd3MgRVNNIHVzYWdlIG9uIE5vZGUuanMuXG4gKlxuICogQHJldHVybnMgQW4gZXNidWlsZCBwbHVnaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSeGpzRXNtUmVzb2x1dGlvblBsdWdpbigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLXJ4anMtcmVzb2x1dGlvbicsXG4gICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogL15yeGpzLyB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5wbHVnaW5EYXRhPy5bUlhKU19FU01fUkVTT0xVVElPTl0pIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgaW1wb3J0ZXIsIGtpbmQsIHJlc29sdmVEaXIsIG5hbWVzcGFjZSwgcGx1Z2luRGF0YSA9IHt9IH0gPSBhcmdzO1xuICAgICAgICBwbHVnaW5EYXRhW1JYSlNfRVNNX1JFU09MVVRJT05dID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBidWlsZC5yZXNvbHZlKGFyZ3MucGF0aCwge1xuICAgICAgICAgIGltcG9ydGVyLFxuICAgICAgICAgIGtpbmQsXG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIHBsdWdpbkRhdGEsXG4gICAgICAgICAgcmVzb2x2ZURpcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LnBhdGggPSByZXN1bHQucGF0aC5yZXBsYWNlKC8oW1xcXFwvXWRpc3RbXFxcXC9dKWNqcyhbXFxcXC9dKS8sICckMWVzbSQyJyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG4iXX0=