"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFromFiles = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("./parse-name");
const validation_1 = require("./validation");
const workspace_1 = require("./workspace");
function generateFromFiles(options, extraTemplateValues = {}) {
    return async (host) => {
        options.path ?? (options.path = await (0, workspace_1.createDefaultPath)(host, options.project));
        options.prefix ?? (options.prefix = '');
        options.flat ?? (options.flat = true);
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        (0, validation_1.validateClassName)(schematics_1.strings.classify(options.name));
        const templateFilesDirectory = options.templateFilesDirectory ?? './files';
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)(templateFilesDirectory), [
            options.skipTests ? (0, schematics_1.filter)((path) => !path.endsWith('.spec.ts.template')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                ...options,
                ...extraTemplateValues,
            }),
            (0, schematics_1.move)(parsedPath.path + (options.flat ? '' : '/' + schematics_1.strings.dasherize(options.name))),
        ]);
        return (0, schematics_1.chain)([(0, schematics_1.mergeWith)(templateSource)]);
    };
}
exports.generateFromFiles = generateFromFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtZnJvbS1maWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2dlbmVyYXRlLWZyb20tZmlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsMkRBWW9DO0FBQ3BDLDZDQUF5QztBQUN6Qyw2Q0FBaUQ7QUFDakQsMkNBQWdEO0FBWWhELFNBQWdCLGlCQUFpQixDQUMvQixPQUFpQyxFQUNqQyxzQkFBd0UsRUFBRTtJQUUxRSxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsRUFBRTtRQUMxQixPQUFPLENBQUMsSUFBSSxLQUFaLE9BQU8sQ0FBQyxJQUFJLEdBQUssTUFBTSxJQUFBLDZCQUFpQixFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUM7UUFDaEUsT0FBTyxDQUFDLE1BQU0sS0FBZCxPQUFPLENBQUMsTUFBTSxHQUFLLEVBQUUsRUFBQztRQUN0QixPQUFPLENBQUMsSUFBSSxLQUFaLE9BQU8sQ0FBQyxJQUFJLEdBQUssSUFBSSxFQUFDO1FBRXRCLE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQVMsRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDL0IsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBRS9CLElBQUEsOEJBQWlCLEVBQUMsb0JBQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFbEQsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsc0JBQXNCLElBQUksU0FBUyxDQUFDO1FBQzNFLE1BQU0sY0FBYyxHQUFHLElBQUEsa0JBQUssRUFBQyxJQUFBLGdCQUFHLEVBQUMsc0JBQXNCLENBQUMsRUFBRTtZQUN4RCxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLG1CQUFNLEVBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtZQUNsRixJQUFBLDJCQUFjLEVBQUM7Z0JBQ2IsR0FBRyxvQkFBTztnQkFDVixHQUFHLE9BQU87Z0JBQ1YsR0FBRyxtQkFBbUI7YUFDdkIsQ0FBQztZQUNGLElBQUEsaUJBQUksRUFBQyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsb0JBQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDcEYsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGtCQUFLLEVBQUMsQ0FBQyxJQUFBLHNCQUFTLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQztBQUNKLENBQUM7QUE1QkQsOENBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBhcHBseVRlbXBsYXRlcyxcbiAgY2hhaW4sXG4gIGZpbHRlcixcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICBub29wLFxuICBzdHJpbmdzLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IHBhcnNlTmFtZSB9IGZyb20gJy4vcGFyc2UtbmFtZSc7XG5pbXBvcnQgeyB2YWxpZGF0ZUNsYXNzTmFtZSB9IGZyb20gJy4vdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBjcmVhdGVEZWZhdWx0UGF0aCB9IGZyb20gJy4vd29ya3NwYWNlJztcblxuZXhwb3J0IGludGVyZmFjZSBHZW5lcmF0ZUZyb21GaWxlc09wdGlvbnMge1xuICBmbGF0PzogYm9vbGVhbjtcbiAgbmFtZTogc3RyaW5nO1xuICBwYXRoPzogc3RyaW5nO1xuICBwcmVmaXg/OiBzdHJpbmc7XG4gIHByb2plY3Q6IHN0cmluZztcbiAgc2tpcFRlc3RzPzogYm9vbGVhbjtcbiAgdGVtcGxhdGVGaWxlc0RpcmVjdG9yeT86IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRnJvbUZpbGVzKFxuICBvcHRpb25zOiBHZW5lcmF0ZUZyb21GaWxlc09wdGlvbnMsXG4gIGV4dHJhVGVtcGxhdGVWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8ICgodjogc3RyaW5nKSA9PiBzdHJpbmcpPiA9IHt9LFxuKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIG9wdGlvbnMucGF0aCA/Pz0gYXdhaXQgY3JlYXRlRGVmYXVsdFBhdGgoaG9zdCwgb3B0aW9ucy5wcm9qZWN0KTtcbiAgICBvcHRpb25zLnByZWZpeCA/Pz0gJyc7XG4gICAgb3B0aW9ucy5mbGF0ID8/PSB0cnVlO1xuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGgsIG9wdGlvbnMubmFtZSk7XG4gICAgb3B0aW9ucy5uYW1lID0gcGFyc2VkUGF0aC5uYW1lO1xuICAgIG9wdGlvbnMucGF0aCA9IHBhcnNlZFBhdGgucGF0aDtcblxuICAgIHZhbGlkYXRlQ2xhc3NOYW1lKHN0cmluZ3MuY2xhc3NpZnkob3B0aW9ucy5uYW1lKSk7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZUZpbGVzRGlyZWN0b3J5ID0gb3B0aW9ucy50ZW1wbGF0ZUZpbGVzRGlyZWN0b3J5ID8/ICcuL2ZpbGVzJztcbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCh0ZW1wbGF0ZUZpbGVzRGlyZWN0b3J5KSwgW1xuICAgICAgb3B0aW9ucy5za2lwVGVzdHMgPyBmaWx0ZXIoKHBhdGgpID0+ICFwYXRoLmVuZHNXaXRoKCcuc3BlYy50cy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtcbiAgICAgICAgLi4uc3RyaW5ncyxcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgLi4uZXh0cmFUZW1wbGF0ZVZhbHVlcyxcbiAgICAgIH0pLFxuICAgICAgbW92ZShwYXJzZWRQYXRoLnBhdGggKyAob3B0aW9ucy5mbGF0ID8gJycgOiAnLycgKyBzdHJpbmdzLmRhc2hlcml6ZShvcHRpb25zLm5hbWUpKSksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW21lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZSldKTtcbiAgfTtcbn1cbiJdfQ==