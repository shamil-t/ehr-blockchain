"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const add_declaration_to_ng_module_1 = require("../utility/add-declaration-to-ng-module");
const find_module_1 = require("../utility/find-module");
const parse_name_1 = require("../utility/parse-name");
const validation_1 = require("../utility/validation");
const workspace_1 = require("../utility/workspace");
const schema_1 = require("./schema");
function buildSelector(options, projectPrefix) {
    let selector = schematics_1.strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    }
    else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }
    return selector;
}
function default_1(options) {
    return async (host) => {
        const workspace = await (0, workspace_1.getWorkspace)(host);
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project "${options.project}" does not exist.`);
        }
        if (options.path === undefined) {
            options.path = (0, workspace_1.buildDefaultPath)(project);
        }
        options.module = (0, find_module_1.findModuleFromOptions)(host, options);
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector =
            options.selector || buildSelector(options, (project && project.prefix) || '');
        (0, validation_1.validateHtmlSelector)(options.selector);
        const skipStyleFile = options.inlineStyle || options.style === schema_1.Style.None;
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            options.skipTests ? (0, schematics_1.filter)((path) => !path.endsWith('.spec.ts.template')) : (0, schematics_1.noop)(),
            skipStyleFile ? (0, schematics_1.filter)((path) => !path.endsWith('.__style__.template')) : (0, schematics_1.noop)(),
            options.inlineTemplate ? (0, schematics_1.filter)((path) => !path.endsWith('.html.template')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                'if-flat': (s) => (options.flat ? '' : s),
                ...options,
            }),
            !options.type
                ? (0, schematics_1.forEach)(((file) => {
                    return file.path.includes('..')
                        ? {
                            content: file.content,
                            path: file.path.replace('..', '.'),
                        }
                        : file;
                }))
                : (0, schematics_1.noop)(),
            (0, schematics_1.move)(parsedPath.path),
        ]);
        return (0, schematics_1.chain)([
            (0, add_declaration_to_ng_module_1.addDeclarationToNgModule)({
                type: 'component',
                ...options,
            }),
            (0, schematics_1.mergeWith)(templateSource),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvY29tcG9uZW50L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBZW9DO0FBQ3BDLDBGQUFtRjtBQUNuRix3REFBK0Q7QUFDL0Qsc0RBQWtEO0FBQ2xELHNEQUE2RDtBQUM3RCxvREFBc0U7QUFDdEUscUNBQTZEO0FBRTdELFNBQVMsYUFBYSxDQUFDLE9BQXlCLEVBQUUsYUFBcUI7SUFDckUsSUFBSSxRQUFRLEdBQUcsb0JBQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9DLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUNsQixRQUFRLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLFFBQVEsRUFBRSxDQUFDO0tBQzVDO1NBQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLFNBQVMsSUFBSSxhQUFhLEVBQUU7UUFDeEQsUUFBUSxHQUFHLEdBQUcsYUFBYSxJQUFJLFFBQVEsRUFBRSxDQUFDO0tBQzNDO0lBRUQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQUVELG1CQUF5QixPQUF5QjtJQUNoRCxPQUFPLEtBQUssRUFBRSxJQUFVLEVBQUUsRUFBRTtRQUMxQixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsd0JBQVksRUFBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBaUIsQ0FBQyxDQUFDO1FBRWxFLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLElBQUksZ0NBQW1CLENBQUMsWUFBWSxPQUFPLENBQUMsT0FBTyxtQkFBbUIsQ0FBQyxDQUFDO1NBQy9FO1FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUM5QixPQUFPLENBQUMsSUFBSSxHQUFHLElBQUEsNEJBQWdCLEVBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUM7UUFFRCxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUEsbUNBQXFCLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXRELE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQVMsRUFBQyxPQUFPLENBQUMsSUFBYyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDL0IsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQy9CLE9BQU8sQ0FBQyxRQUFRO1lBQ2QsT0FBTyxDQUFDLFFBQVEsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVoRixJQUFBLGlDQUFvQixFQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUV2QyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEtBQUssY0FBSyxDQUFDLElBQUksQ0FBQztRQUMxRSxNQUFNLGNBQWMsR0FBRyxJQUFBLGtCQUFLLEVBQUMsSUFBQSxnQkFBRyxFQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzNDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsbUJBQU0sRUFBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFO1lBQ2xGLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBQSxtQkFBTSxFQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUU7WUFDaEYsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBQSxtQkFBTSxFQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUU7WUFDcEYsSUFBQSwyQkFBYyxFQUFDO2dCQUNiLEdBQUcsb0JBQU87Z0JBQ1YsU0FBUyxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxHQUFHLE9BQU87YUFDWCxDQUFDO1lBQ0YsQ0FBQyxPQUFPLENBQUMsSUFBSTtnQkFDWCxDQUFDLENBQUMsSUFBQSxvQkFBTyxFQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDaEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7d0JBQzdCLENBQUMsQ0FBQzs0QkFDRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87NEJBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO3lCQUNuQzt3QkFDSCxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNYLENBQUMsQ0FBaUIsQ0FBQztnQkFDckIsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtZQUNWLElBQUEsaUJBQUksRUFBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1NBQ3RCLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBQSxrQkFBSyxFQUFDO1lBQ1gsSUFBQSx1REFBd0IsRUFBQztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEdBQUcsT0FBTzthQUNYLENBQUM7WUFDRixJQUFBLHNCQUFTLEVBQUMsY0FBYyxDQUFDO1NBQzFCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUF0REQsNEJBc0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEZpbGVPcGVyYXRvcixcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGFwcGx5VGVtcGxhdGVzLFxuICBjaGFpbixcbiAgZmlsdGVyLFxuICBmb3JFYWNoLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIHN0cmluZ3MsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgYWRkRGVjbGFyYXRpb25Ub05nTW9kdWxlIH0gZnJvbSAnLi4vdXRpbGl0eS9hZGQtZGVjbGFyYXRpb24tdG8tbmctbW9kdWxlJztcbmltcG9ydCB7IGZpbmRNb2R1bGVGcm9tT3B0aW9ucyB9IGZyb20gJy4uL3V0aWxpdHkvZmluZC1tb2R1bGUnO1xuaW1wb3J0IHsgcGFyc2VOYW1lIH0gZnJvbSAnLi4vdXRpbGl0eS9wYXJzZS1uYW1lJztcbmltcG9ydCB7IHZhbGlkYXRlSHRtbFNlbGVjdG9yIH0gZnJvbSAnLi4vdXRpbGl0eS92YWxpZGF0aW9uJztcbmltcG9ydCB7IGJ1aWxkRGVmYXVsdFBhdGgsIGdldFdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IFNjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zLCBTdHlsZSB9IGZyb20gJy4vc2NoZW1hJztcblxuZnVuY3Rpb24gYnVpbGRTZWxlY3RvcihvcHRpb25zOiBDb21wb25lbnRPcHRpb25zLCBwcm9qZWN0UHJlZml4OiBzdHJpbmcpIHtcbiAgbGV0IHNlbGVjdG9yID0gc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKTtcbiAgaWYgKG9wdGlvbnMucHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZml4ID09PSB1bmRlZmluZWQgJiYgcHJvamVjdFByZWZpeCkge1xuICAgIHNlbGVjdG9yID0gYCR7cHJvamVjdFByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogQ29tcG9uZW50T3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQob3B0aW9ucy5wcm9qZWN0IGFzIHN0cmluZyk7XG5cbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBQcm9qZWN0IFwiJHtvcHRpb25zLnByb2plY3R9XCIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvcHRpb25zLnBhdGggPSBidWlsZERlZmF1bHRQYXRoKHByb2plY3QpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubW9kdWxlID0gZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3QsIG9wdGlvbnMpO1xuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGggYXMgc3RyaW5nLCBvcHRpb25zLm5hbWUpO1xuICAgIG9wdGlvbnMubmFtZSA9IHBhcnNlZFBhdGgubmFtZTtcbiAgICBvcHRpb25zLnBhdGggPSBwYXJzZWRQYXRoLnBhdGg7XG4gICAgb3B0aW9ucy5zZWxlY3RvciA9XG4gICAgICBvcHRpb25zLnNlbGVjdG9yIHx8IGJ1aWxkU2VsZWN0b3Iob3B0aW9ucywgKHByb2plY3QgJiYgcHJvamVjdC5wcmVmaXgpIHx8ICcnKTtcblxuICAgIHZhbGlkYXRlSHRtbFNlbGVjdG9yKG9wdGlvbnMuc2VsZWN0b3IpO1xuXG4gICAgY29uc3Qgc2tpcFN0eWxlRmlsZSA9IG9wdGlvbnMuaW5saW5lU3R5bGUgfHwgb3B0aW9ucy5zdHlsZSA9PT0gU3R5bGUuTm9uZTtcbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcycpLCBbXG4gICAgICBvcHRpb25zLnNraXBUZXN0cyA/IGZpbHRlcigocGF0aCkgPT4gIXBhdGguZW5kc1dpdGgoJy5zcGVjLnRzLnRlbXBsYXRlJykpIDogbm9vcCgpLFxuICAgICAgc2tpcFN0eWxlRmlsZSA/IGZpbHRlcigocGF0aCkgPT4gIXBhdGguZW5kc1dpdGgoJy5fX3N0eWxlX18udGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICBvcHRpb25zLmlubGluZVRlbXBsYXRlID8gZmlsdGVyKChwYXRoKSA9PiAhcGF0aC5lbmRzV2l0aCgnLmh0bWwudGVtcGxhdGUnKSkgOiBub29wKCksXG4gICAgICBhcHBseVRlbXBsYXRlcyh7XG4gICAgICAgIC4uLnN0cmluZ3MsXG4gICAgICAgICdpZi1mbGF0JzogKHM6IHN0cmluZykgPT4gKG9wdGlvbnMuZmxhdCA/ICcnIDogcyksXG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICB9KSxcbiAgICAgICFvcHRpb25zLnR5cGVcbiAgICAgICAgPyBmb3JFYWNoKCgoZmlsZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGUucGF0aC5pbmNsdWRlcygnLi4nKVxuICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgIHBhdGg6IGZpbGUucGF0aC5yZXBsYWNlKCcuLicsICcuJyksXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA6IGZpbGU7XG4gICAgICAgICAgfSkgYXMgRmlsZU9wZXJhdG9yKVxuICAgICAgICA6IG5vb3AoKSxcbiAgICAgIG1vdmUocGFyc2VkUGF0aC5wYXRoKSxcbiAgICBdKTtcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICBhZGREZWNsYXJhdGlvblRvTmdNb2R1bGUoe1xuICAgICAgICB0eXBlOiAnY29tcG9uZW50JyxcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIH0pLFxuICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==