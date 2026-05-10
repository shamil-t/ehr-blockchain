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
const utility_1 = require("@schematics/angular/utility");
const path_1 = require("path");
const paths_1 = require("../utility/paths");
const schema_1 = require("./schema");
function default_1(options) {
    switch (options.type) {
        case schema_1.Type.Karma:
            return addKarmaConfig(options);
        case schema_1.Type.Browserslist:
            return addBrowserslistConfig(options);
        default:
            throw new schematics_1.SchematicsException(`"${options.type}" is an unknown configuration file type.`);
    }
}
exports.default = default_1;
function addBrowserslistConfig(options) {
    return async (host) => {
        const workspace = await (0, utility_1.readWorkspace)(host);
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project name "${options.project}" doesn't not exist.`);
        }
        return (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            (0, schematics_1.filter)((p) => p.endsWith('.browserslistrc.template')),
            (0, schematics_1.applyTemplates)({}),
            (0, schematics_1.move)(project.root),
        ]));
    };
}
function addKarmaConfig(options) {
    return (0, utility_1.updateWorkspace)((workspace) => {
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project name "${options.project}" doesn't not exist.`);
        }
        const testTarget = project.targets.get('test');
        if (!testTarget) {
            throw new schematics_1.SchematicsException(`No "test" target found for project "${options.project}".` +
                ' A "test" target is required to generate a karma configuration.');
        }
        if (testTarget.builder !== utility_1.AngularBuilder.Karma) {
            throw new schematics_1.SchematicsException(`Cannot add a karma configuration as builder for "test" target in project does not use "${utility_1.AngularBuilder.Karma}".`);
        }
        testTarget.options ?? (testTarget.options = {});
        testTarget.options.karmaConfig = path_1.posix.join(project.root, 'karma.conf.js');
        // If scoped project (i.e. "@foo/bar"), convert dir to "foo/bar".
        let folderName = options.project.startsWith('@') ? options.project.slice(1) : options.project;
        if (/[A-Z]/.test(folderName)) {
            folderName = schematics_1.strings.dasherize(folderName);
        }
        return (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            (0, schematics_1.filter)((p) => p.endsWith('karma.conf.js.template')),
            (0, schematics_1.applyTemplates)({
                relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(project.root),
                folderName,
            }),
            (0, schematics_1.move)(project.root),
        ]));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvY29uZmlnL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBVW9DO0FBQ3BDLHlEQUE2RjtBQUM3RiwrQkFBcUM7QUFDckMsNENBQStEO0FBQy9ELHFDQUF1RTtBQUV2RSxtQkFBeUIsT0FBc0I7SUFDN0MsUUFBUSxPQUFPLENBQUMsSUFBSSxFQUFFO1FBQ3BCLEtBQUssYUFBVSxDQUFDLEtBQUs7WUFDbkIsT0FBTyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsS0FBSyxhQUFVLENBQUMsWUFBWTtZQUMxQixPQUFPLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDO1lBQ0UsTUFBTSxJQUFJLGdDQUFtQixDQUFDLElBQUksT0FBTyxDQUFDLElBQUksMENBQTBDLENBQUMsQ0FBQztLQUM3RjtBQUNILENBQUM7QUFURCw0QkFTQztBQUVELFNBQVMscUJBQXFCLENBQUMsT0FBc0I7SUFDbkQsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFDcEIsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLHVCQUFhLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLElBQUksZ0NBQW1CLENBQUMsaUJBQWlCLE9BQU8sQ0FBQyxPQUFPLHNCQUFzQixDQUFDLENBQUM7U0FDdkY7UUFFRCxPQUFPLElBQUEsc0JBQVMsRUFDZCxJQUFBLGtCQUFLLEVBQUMsSUFBQSxnQkFBRyxFQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3BCLElBQUEsbUJBQU0sRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ3JELElBQUEsMkJBQWMsRUFBQyxFQUFFLENBQUM7WUFDbEIsSUFBQSxpQkFBSSxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDbkIsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsT0FBc0I7SUFDNUMsT0FBTyxJQUFBLHlCQUFlLEVBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNuQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxpQkFBaUIsT0FBTyxDQUFDLE9BQU8sc0JBQXNCLENBQUMsQ0FBQztTQUN2RjtRQUVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixNQUFNLElBQUksZ0NBQW1CLENBQzNCLHVDQUF1QyxPQUFPLENBQUMsT0FBTyxJQUFJO2dCQUN4RCxpRUFBaUUsQ0FDcEUsQ0FBQztTQUNIO1FBRUQsSUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLHdCQUFjLENBQUMsS0FBSyxFQUFFO1lBQy9DLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDM0IsMEZBQTBGLHdCQUFjLENBQUMsS0FBSyxJQUFJLENBQ25ILENBQUM7U0FDSDtRQUVELFVBQVUsQ0FBQyxPQUFPLEtBQWxCLFVBQVUsQ0FBQyxPQUFPLEdBQUssRUFBRSxFQUFDO1FBQzFCLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUUxRSxpRUFBaUU7UUFDakUsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQzlGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM1QixVQUFVLEdBQUcsb0JBQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDNUM7UUFFRCxPQUFPLElBQUEsc0JBQVMsRUFDZCxJQUFBLGtCQUFLLEVBQUMsSUFBQSxnQkFBRyxFQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3BCLElBQUEsbUJBQU0sRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ25ELElBQUEsMkJBQWMsRUFBQztnQkFDYiwyQkFBMkIsRUFBRSxJQUFBLG1DQUEyQixFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ3RFLFVBQVU7YUFDWCxDQUFDO1lBQ0YsSUFBQSxpQkFBSSxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDbkIsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgYXBwbHksXG4gIGFwcGx5VGVtcGxhdGVzLFxuICBmaWx0ZXIsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgc3RyaW5ncyxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBBbmd1bGFyQnVpbGRlciwgcmVhZFdvcmtzcGFjZSwgdXBkYXRlV29ya3NwYWNlIH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5JztcbmltcG9ydCB7IHBvc2l4IGFzIHBhdGggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdCB9IGZyb20gJy4uL3V0aWxpdHkvcGF0aHMnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIENvbmZpZ09wdGlvbnMsIFR5cGUgYXMgQ29uZmlnVHlwZSB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IENvbmZpZ09wdGlvbnMpOiBSdWxlIHtcbiAgc3dpdGNoIChvcHRpb25zLnR5cGUpIHtcbiAgICBjYXNlIENvbmZpZ1R5cGUuS2FybWE6XG4gICAgICByZXR1cm4gYWRkS2FybWFDb25maWcob3B0aW9ucyk7XG4gICAgY2FzZSBDb25maWdUeXBlLkJyb3dzZXJzbGlzdDpcbiAgICAgIHJldHVybiBhZGRCcm93c2Vyc2xpc3RDb25maWcob3B0aW9ucyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBcIiR7b3B0aW9ucy50eXBlfVwiIGlzIGFuIHVua25vd24gY29uZmlndXJhdGlvbiBmaWxlIHR5cGUuYCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkQnJvd3NlcnNsaXN0Q29uZmlnKG9wdGlvbnM6IENvbmZpZ09wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jIChob3N0KSA9PiB7XG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgcmVhZFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgbmFtZSBcIiR7b3B0aW9ucy5wcm9qZWN0fVwiIGRvZXNuJ3Qgbm90IGV4aXN0LmApO1xuICAgIH1cblxuICAgIHJldHVybiBtZXJnZVdpdGgoXG4gICAgICBhcHBseSh1cmwoJy4vZmlsZXMnKSwgW1xuICAgICAgICBmaWx0ZXIoKHApID0+IHAuZW5kc1dpdGgoJy5icm93c2Vyc2xpc3RyYy50ZW1wbGF0ZScpKSxcbiAgICAgICAgYXBwbHlUZW1wbGF0ZXMoe30pLFxuICAgICAgICBtb3ZlKHByb2plY3Qucm9vdCksXG4gICAgICBdKSxcbiAgICApO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRLYXJtYUNvbmZpZyhvcHRpb25zOiBDb25maWdPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiB1cGRhdGVXb3Jrc3BhY2UoKHdvcmtzcGFjZSkgPT4ge1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBuYW1lIFwiJHtvcHRpb25zLnByb2plY3R9XCIgZG9lc24ndCBub3QgZXhpc3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGVzdFRhcmdldCA9IHByb2plY3QudGFyZ2V0cy5nZXQoJ3Rlc3QnKTtcbiAgICBpZiAoIXRlc3RUYXJnZXQpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICBgTm8gXCJ0ZXN0XCIgdGFyZ2V0IGZvdW5kIGZvciBwcm9qZWN0IFwiJHtvcHRpb25zLnByb2plY3R9XCIuYCArXG4gICAgICAgICAgJyBBIFwidGVzdFwiIHRhcmdldCBpcyByZXF1aXJlZCB0byBnZW5lcmF0ZSBhIGthcm1hIGNvbmZpZ3VyYXRpb24uJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRlc3RUYXJnZXQuYnVpbGRlciAhPT0gQW5ndWxhckJ1aWxkZXIuS2FybWEpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICBgQ2Fubm90IGFkZCBhIGthcm1hIGNvbmZpZ3VyYXRpb24gYXMgYnVpbGRlciBmb3IgXCJ0ZXN0XCIgdGFyZ2V0IGluIHByb2plY3QgZG9lcyBub3QgdXNlIFwiJHtBbmd1bGFyQnVpbGRlci5LYXJtYX1cIi5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0ZXN0VGFyZ2V0Lm9wdGlvbnMgPz89IHt9O1xuICAgIHRlc3RUYXJnZXQub3B0aW9ucy5rYXJtYUNvbmZpZyA9IHBhdGguam9pbihwcm9qZWN0LnJvb3QsICdrYXJtYS5jb25mLmpzJyk7XG5cbiAgICAvLyBJZiBzY29wZWQgcHJvamVjdCAoaS5lLiBcIkBmb28vYmFyXCIpLCBjb252ZXJ0IGRpciB0byBcImZvby9iYXJcIi5cbiAgICBsZXQgZm9sZGVyTmFtZSA9IG9wdGlvbnMucHJvamVjdC5zdGFydHNXaXRoKCdAJykgPyBvcHRpb25zLnByb2plY3Quc2xpY2UoMSkgOiBvcHRpb25zLnByb2plY3Q7XG4gICAgaWYgKC9bQS1aXS8udGVzdChmb2xkZXJOYW1lKSkge1xuICAgICAgZm9sZGVyTmFtZSA9IHN0cmluZ3MuZGFzaGVyaXplKGZvbGRlck5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBtZXJnZVdpdGgoXG4gICAgICBhcHBseSh1cmwoJy4vZmlsZXMnKSwgW1xuICAgICAgICBmaWx0ZXIoKHApID0+IHAuZW5kc1dpdGgoJ2thcm1hLmNvbmYuanMudGVtcGxhdGUnKSksXG4gICAgICAgIGFwcGx5VGVtcGxhdGVzKHtcbiAgICAgICAgICByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3Q6IHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdChwcm9qZWN0LnJvb3QpLFxuICAgICAgICAgIGZvbGRlck5hbWUsXG4gICAgICAgIH0pLFxuICAgICAgICBtb3ZlKHByb2plY3Qucm9vdCksXG4gICAgICBdKSxcbiAgICApO1xuICB9KTtcbn1cbiJdfQ==