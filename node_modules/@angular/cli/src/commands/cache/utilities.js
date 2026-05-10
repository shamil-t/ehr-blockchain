"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheConfig = exports.updateCacheConfig = void 0;
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const workspace_schema_1 = require("../../../lib/config/workspace-schema");
function updateCacheConfig(workspace, key, value) {
    var _a;
    const cli = ((_a = workspace.extensions)['cli'] ?? (_a['cli'] = {}));
    const cache = (cli['cache'] ?? (cli['cache'] = {}));
    cache[key] = value;
    return workspace.save();
}
exports.updateCacheConfig = updateCacheConfig;
function getCacheConfig(workspace) {
    if (!workspace) {
        throw new Error(`Cannot retrieve cache configuration as workspace is not defined.`);
    }
    const defaultSettings = {
        path: (0, path_1.resolve)(workspace.basePath, '.angular/cache'),
        environment: workspace_schema_1.Environment.Local,
        enabled: true,
    };
    const cliSetting = workspace.extensions['cli'];
    if (!cliSetting || !(0, core_1.isJsonObject)(cliSetting)) {
        return defaultSettings;
    }
    const cacheSettings = cliSetting['cache'];
    if (!(0, core_1.isJsonObject)(cacheSettings)) {
        return defaultSettings;
    }
    const { path = defaultSettings.path, environment = defaultSettings.environment, enabled = defaultSettings.enabled,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
     } = cacheSettings;
    return {
        path: (0, path_1.resolve)(workspace.basePath, path),
        environment,
        enabled,
    };
}
exports.getCacheConfig = getCacheConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0aWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NhY2hlL3V0aWxpdGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBb0Q7QUFDcEQsK0JBQStCO0FBQy9CLDJFQUEwRTtBQUcxRSxTQUFnQixpQkFBaUIsQ0FDL0IsU0FBMkIsRUFDM0IsR0FBTSxFQUNOLEtBQWU7O0lBRWYsTUFBTSxHQUFHLEdBQUcsT0FBQyxTQUFTLENBQUMsVUFBVSxFQUFDLEtBQUssU0FBTCxLQUFLLElBQU0sRUFBRSxFQUE0QyxDQUFDO0lBQzVGLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sTUFBWCxHQUFHLENBQUMsT0FBTyxJQUFNLEVBQUUsRUFBQyxDQUFDO0lBQ3BDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7SUFFbkIsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUIsQ0FBQztBQVZELDhDQVVDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLFNBQXVDO0lBQ3BFLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7S0FDckY7SUFFRCxNQUFNLGVBQWUsR0FBb0I7UUFDdkMsSUFBSSxFQUFFLElBQUEsY0FBTyxFQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUM7UUFDbkQsV0FBVyxFQUFFLDhCQUFXLENBQUMsS0FBSztRQUM5QixPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUM7SUFFRixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFBLG1CQUFZLEVBQUMsVUFBVSxDQUFDLEVBQUU7UUFDNUMsT0FBTyxlQUFlLENBQUM7S0FDeEI7SUFFRCxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUMsSUFBSSxDQUFDLElBQUEsbUJBQVksRUFBQyxhQUFhLENBQUMsRUFBRTtRQUNoQyxPQUFPLGVBQWUsQ0FBQztLQUN4QjtJQUVELE1BQU0sRUFDSixJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksRUFDM0IsV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLEVBQ3pDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTztJQUNqQyw4REFBOEQ7TUFDL0QsR0FBRyxhQUFvQyxDQUFDO0lBRXpDLE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBQSxjQUFPLEVBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7UUFDdkMsV0FBVztRQUNYLE9BQU87S0FDUixDQUFDO0FBQ0osQ0FBQztBQWpDRCx3Q0FpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgaXNKc29uT2JqZWN0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ2FjaGUsIEVudmlyb25tZW50IH0gZnJvbSAnLi4vLi4vLi4vbGliL2NvbmZpZy93b3Jrc3BhY2Utc2NoZW1hJztcbmltcG9ydCB7IEFuZ3VsYXJXb3Jrc3BhY2UgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29uZmlnJztcblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNhY2hlQ29uZmlnPEsgZXh0ZW5kcyBrZXlvZiBDYWNoZT4oXG4gIHdvcmtzcGFjZTogQW5ndWxhcldvcmtzcGFjZSxcbiAga2V5OiBLLFxuICB2YWx1ZTogQ2FjaGVbS10sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2xpID0gKHdvcmtzcGFjZS5leHRlbnNpb25zWydjbGknXSA/Pz0ge30pIGFzIFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+PjtcbiAgY29uc3QgY2FjaGUgPSAoY2xpWydjYWNoZSddID8/PSB7fSk7XG4gIGNhY2hlW2tleV0gPSB2YWx1ZTtcblxuICByZXR1cm4gd29ya3NwYWNlLnNhdmUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhY2hlQ29uZmlnKHdvcmtzcGFjZTogQW5ndWxhcldvcmtzcGFjZSB8IHVuZGVmaW5lZCk6IFJlcXVpcmVkPENhY2hlPiB7XG4gIGlmICghd29ya3NwYWNlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcmV0cmlldmUgY2FjaGUgY29uZmlndXJhdGlvbiBhcyB3b3Jrc3BhY2UgaXMgbm90IGRlZmluZWQuYCk7XG4gIH1cblxuICBjb25zdCBkZWZhdWx0U2V0dGluZ3M6IFJlcXVpcmVkPENhY2hlPiA9IHtcbiAgICBwYXRoOiByZXNvbHZlKHdvcmtzcGFjZS5iYXNlUGF0aCwgJy5hbmd1bGFyL2NhY2hlJyksXG4gICAgZW52aXJvbm1lbnQ6IEVudmlyb25tZW50LkxvY2FsLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gIH07XG5cbiAgY29uc3QgY2xpU2V0dGluZyA9IHdvcmtzcGFjZS5leHRlbnNpb25zWydjbGknXTtcbiAgaWYgKCFjbGlTZXR0aW5nIHx8ICFpc0pzb25PYmplY3QoY2xpU2V0dGluZykpIHtcbiAgICByZXR1cm4gZGVmYXVsdFNldHRpbmdzO1xuICB9XG5cbiAgY29uc3QgY2FjaGVTZXR0aW5ncyA9IGNsaVNldHRpbmdbJ2NhY2hlJ107XG4gIGlmICghaXNKc29uT2JqZWN0KGNhY2hlU2V0dGluZ3MpKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRTZXR0aW5ncztcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBwYXRoID0gZGVmYXVsdFNldHRpbmdzLnBhdGgsXG4gICAgZW52aXJvbm1lbnQgPSBkZWZhdWx0U2V0dGluZ3MuZW52aXJvbm1lbnQsXG4gICAgZW5hYmxlZCA9IGRlZmF1bHRTZXR0aW5ncy5lbmFibGVkLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIH0gPSBjYWNoZVNldHRpbmdzIGFzIFJlY29yZDxzdHJpbmcsIGFueT47XG5cbiAgcmV0dXJuIHtcbiAgICBwYXRoOiByZXNvbHZlKHdvcmtzcGFjZS5iYXNlUGF0aCwgcGF0aCksXG4gICAgZW52aXJvbm1lbnQsXG4gICAgZW5hYmxlZCxcbiAgfTtcbn1cbiJdfQ==