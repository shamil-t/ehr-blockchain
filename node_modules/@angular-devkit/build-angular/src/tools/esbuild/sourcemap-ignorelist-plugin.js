"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourcemapIgnorelistPlugin = void 0;
/**
 * The field identifier for the sourcemap Chrome Devtools ignore list extension.
 *
 * Following the naming conventions from https://sourcemaps.info/spec.html#h.ghqpj1ytqjbm
 */
const IGNORE_LIST_ID = 'x_google_ignoreList';
/**
 * The UTF-8 bytes for the node modules check text used to avoid unnecessary parsing
 * of a full source map if not present in the source map data.
 */
const NODE_MODULE_BYTES = Buffer.from('node_modules/', 'utf-8');
/**
 * Creates an esbuild plugin that updates generated sourcemaps to include the Chrome
 * DevTools ignore list extension. All source files that originate from a node modules
 * directory are added to the ignore list by this plugin.
 *
 * For more information, see https://developer.chrome.com/articles/x-google-ignore-list/
 * @returns An esbuild plugin.
 */
function createSourcemapIgnorelistPlugin() {
    return {
        name: 'angular-sourcemap-ignorelist',
        setup(build) {
            if (!build.initialOptions.sourcemap) {
                return;
            }
            build.onEnd((result) => {
                if (!result.outputFiles) {
                    return;
                }
                for (const file of result.outputFiles) {
                    // Only process sourcemap files
                    if (!file.path.endsWith('.map')) {
                        continue;
                    }
                    // Create a Buffer object that shares the memory of the output file contents
                    const contents = Buffer.from(file.contents.buffer, file.contents.byteOffset, file.contents.byteLength);
                    // Avoid parsing sourcemaps that have no node modules references
                    if (!contents.includes(NODE_MODULE_BYTES)) {
                        continue;
                    }
                    const map = JSON.parse(contents.toString('utf-8'));
                    const ignoreList = [];
                    // Check and store the index of each source originating from a node modules directory
                    for (let index = 0; index < map.sources.length; ++index) {
                        const location = map.sources[index].indexOf('node_modules/');
                        if (location === 0 || (location > 0 && map.sources[index][location - 1] === '/')) {
                            ignoreList.push(index);
                        }
                    }
                    // Avoid regenerating the source map if nothing changed
                    if (ignoreList.length === 0) {
                        continue;
                    }
                    // Update the sourcemap in the output file
                    map[IGNORE_LIST_ID] = ignoreList;
                    file.contents = Buffer.from(JSON.stringify(map), 'utf-8');
                }
            });
        },
    };
}
exports.createSourcemapIgnorelistPlugin = createSourcemapIgnorelistPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwLWlnbm9yZWxpc3QtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9zb3VyY2VtYXAtaWdub3JlbGlzdC1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUg7Ozs7R0FJRztBQUNILE1BQU0sY0FBYyxHQUFHLHFCQUFxQixDQUFDO0FBRTdDOzs7R0FHRztBQUNILE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFVaEU7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLCtCQUErQjtJQUM3QyxPQUFPO1FBQ0wsSUFBSSxFQUFFLDhCQUE4QjtRQUNwQyxLQUFLLENBQUMsS0FBSztZQUNULElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRTtnQkFDbkMsT0FBTzthQUNSO1lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtvQkFDdkIsT0FBTztpQkFDUjtnQkFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7b0JBQ3JDLCtCQUErQjtvQkFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMvQixTQUFTO3FCQUNWO29CQUVELDRFQUE0RTtvQkFDNUUsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FDekIsQ0FBQztvQkFFRixnRUFBZ0U7b0JBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7d0JBQ3pDLFNBQVM7cUJBQ1Y7b0JBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFjLENBQUM7b0JBQ2hFLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztvQkFFdEIscUZBQXFGO29CQUNyRixLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUU7d0JBQ3ZELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUM3RCxJQUFJLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFOzRCQUNoRixVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3lCQUN4QjtxQkFDRjtvQkFFRCx1REFBdUQ7b0JBQ3ZELElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7d0JBQzNCLFNBQVM7cUJBQ1Y7b0JBRUQsMENBQTBDO29CQUMxQyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsVUFBVSxDQUFDO29CQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDM0Q7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXRERCwwRUFzREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICdlc2J1aWxkJztcblxuLyoqXG4gKiBUaGUgZmllbGQgaWRlbnRpZmllciBmb3IgdGhlIHNvdXJjZW1hcCBDaHJvbWUgRGV2dG9vbHMgaWdub3JlIGxpc3QgZXh0ZW5zaW9uLlxuICpcbiAqIEZvbGxvd2luZyB0aGUgbmFtaW5nIGNvbnZlbnRpb25zIGZyb20gaHR0cHM6Ly9zb3VyY2VtYXBzLmluZm8vc3BlYy5odG1sI2guZ2hxcGoxeXRxamJtXG4gKi9cbmNvbnN0IElHTk9SRV9MSVNUX0lEID0gJ3hfZ29vZ2xlX2lnbm9yZUxpc3QnO1xuXG4vKipcbiAqIFRoZSBVVEYtOCBieXRlcyBmb3IgdGhlIG5vZGUgbW9kdWxlcyBjaGVjayB0ZXh0IHVzZWQgdG8gYXZvaWQgdW5uZWNlc3NhcnkgcGFyc2luZ1xuICogb2YgYSBmdWxsIHNvdXJjZSBtYXAgaWYgbm90IHByZXNlbnQgaW4gdGhlIHNvdXJjZSBtYXAgZGF0YS5cbiAqL1xuY29uc3QgTk9ERV9NT0RVTEVfQllURVMgPSBCdWZmZXIuZnJvbSgnbm9kZV9tb2R1bGVzLycsICd1dGYtOCcpO1xuXG4vKipcbiAqIE1pbmltYWwgc291cmNlbWFwIG9iamVjdCByZXF1aXJlZCB0byBjcmVhdGUgdGhlIGlnbm9yZSBsaXN0LlxuICovXG5pbnRlcmZhY2UgU291cmNlTWFwIHtcbiAgc291cmNlczogc3RyaW5nW107XG4gIFtJR05PUkVfTElTVF9JRF0/OiBudW1iZXJbXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVzYnVpbGQgcGx1Z2luIHRoYXQgdXBkYXRlcyBnZW5lcmF0ZWQgc291cmNlbWFwcyB0byBpbmNsdWRlIHRoZSBDaHJvbWVcbiAqIERldlRvb2xzIGlnbm9yZSBsaXN0IGV4dGVuc2lvbi4gQWxsIHNvdXJjZSBmaWxlcyB0aGF0IG9yaWdpbmF0ZSBmcm9tIGEgbm9kZSBtb2R1bGVzXG4gKiBkaXJlY3RvcnkgYXJlIGFkZGVkIHRvIHRoZSBpZ25vcmUgbGlzdCBieSB0aGlzIHBsdWdpbi5cbiAqXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vYXJ0aWNsZXMveC1nb29nbGUtaWdub3JlLWxpc3QvXG4gKiBAcmV0dXJucyBBbiBlc2J1aWxkIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNvdXJjZW1hcElnbm9yZWxpc3RQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnYW5ndWxhci1zb3VyY2VtYXAtaWdub3JlbGlzdCcsXG4gICAgc2V0dXAoYnVpbGQpOiB2b2lkIHtcbiAgICAgIGlmICghYnVpbGQuaW5pdGlhbE9wdGlvbnMuc291cmNlbWFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYnVpbGQub25FbmQoKHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoIXJlc3VsdC5vdXRwdXRGaWxlcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiByZXN1bHQub3V0cHV0RmlsZXMpIHtcbiAgICAgICAgICAvLyBPbmx5IHByb2Nlc3Mgc291cmNlbWFwIGZpbGVzXG4gICAgICAgICAgaWYgKCFmaWxlLnBhdGguZW5kc1dpdGgoJy5tYXAnKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGEgQnVmZmVyIG9iamVjdCB0aGF0IHNoYXJlcyB0aGUgbWVtb3J5IG9mIHRoZSBvdXRwdXQgZmlsZSBjb250ZW50c1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gQnVmZmVyLmZyb20oXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnRzLmJ1ZmZlcixcbiAgICAgICAgICAgIGZpbGUuY29udGVudHMuYnl0ZU9mZnNldCxcbiAgICAgICAgICAgIGZpbGUuY29udGVudHMuYnl0ZUxlbmd0aCxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gQXZvaWQgcGFyc2luZyBzb3VyY2VtYXBzIHRoYXQgaGF2ZSBubyBub2RlIG1vZHVsZXMgcmVmZXJlbmNlc1xuICAgICAgICAgIGlmICghY29udGVudHMuaW5jbHVkZXMoTk9ERV9NT0RVTEVfQllURVMpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBtYXAgPSBKU09OLnBhcnNlKGNvbnRlbnRzLnRvU3RyaW5nKCd1dGYtOCcpKSBhcyBTb3VyY2VNYXA7XG4gICAgICAgICAgY29uc3QgaWdub3JlTGlzdCA9IFtdO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgYW5kIHN0b3JlIHRoZSBpbmRleCBvZiBlYWNoIHNvdXJjZSBvcmlnaW5hdGluZyBmcm9tIGEgbm9kZSBtb2R1bGVzIGRpcmVjdG9yeVxuICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBtYXAuc291cmNlcy5sZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2F0aW9uID0gbWFwLnNvdXJjZXNbaW5kZXhdLmluZGV4T2YoJ25vZGVfbW9kdWxlcy8nKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PT0gMCB8fCAobG9jYXRpb24gPiAwICYmIG1hcC5zb3VyY2VzW2luZGV4XVtsb2NhdGlvbiAtIDFdID09PSAnLycpKSB7XG4gICAgICAgICAgICAgIGlnbm9yZUxpc3QucHVzaChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXZvaWQgcmVnZW5lcmF0aW5nIHRoZSBzb3VyY2UgbWFwIGlmIG5vdGhpbmcgY2hhbmdlZFxuICAgICAgICAgIGlmIChpZ25vcmVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VyY2VtYXAgaW4gdGhlIG91dHB1dCBmaWxlXG4gICAgICAgICAgbWFwW0lHTk9SRV9MSVNUX0lEXSA9IGlnbm9yZUxpc3Q7XG4gICAgICAgICAgZmlsZS5jb250ZW50cyA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KG1hcCksICd1dGYtOCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuIl19