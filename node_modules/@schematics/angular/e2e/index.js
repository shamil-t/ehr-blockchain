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
const json_file_1 = require("../utility/json-file");
const latest_versions_1 = require("../utility/latest-versions");
/**
 * The list of development dependencies used by the E2E protractor-based builder.
 * The versions are sourced from the latest versions `../utility/latest-versions/package.json`
 * file which is automatically updated via renovate.
 */
const E2E_DEV_DEPENDENCIES = Object.freeze([
    'protractor',
    'jasmine-spec-reporter',
    'ts-node',
    '@types/node',
]);
function addScriptsToPackageJson() {
    return (host) => {
        const pkgJson = new json_file_1.JSONFile(host, 'package.json');
        const e2eScriptPath = ['scripts', 'e2e'];
        if (!pkgJson.get(e2eScriptPath)) {
            pkgJson.modify(e2eScriptPath, 'ng e2e', false);
        }
    };
}
function default_1(options) {
    const { relatedAppName } = options;
    return (0, utility_1.updateWorkspace)((workspace) => {
        const project = workspace.projects.get(relatedAppName);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project name "${relatedAppName}" doesn't not exist.`);
        }
        const e2eRootPath = path_1.posix.join(project.root, 'e2e');
        project.targets.add({
            name: 'e2e',
            builder: utility_1.AngularBuilder.Protractor,
            defaultConfiguration: 'development',
            options: {
                protractorConfig: path_1.posix.join(e2eRootPath, 'protractor.conf.js'),
            },
            configurations: {
                production: {
                    devServerTarget: `${relatedAppName}:serve:production`,
                },
                development: {
                    devServerTarget: `${relatedAppName}:serve:development`,
                },
            },
        });
        return (0, schematics_1.chain)([
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
                (0, schematics_1.applyTemplates)({
                    utils: schematics_1.strings,
                    ...options,
                    relativePathToWorkspaceRoot: path_1.posix.relative(path_1.posix.join('/', e2eRootPath), '/'),
                }),
                (0, schematics_1.move)(e2eRootPath),
            ])),
            ...E2E_DEV_DEPENDENCIES.map((name) => (0, utility_1.addDependency)(name, latest_versions_1.latestVersions[name], {
                type: utility_1.DependencyType.Dev,
                existing: utility_1.ExistingBehavior.Skip,
            })),
            addScriptsToPackageJson(),
        ]);
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvZTJlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBVW9DO0FBQ3BDLHlEQU1xQztBQUNyQywrQkFBcUM7QUFDckMsb0RBQWdEO0FBQ2hELGdFQUE0RDtBQUc1RDs7OztHQUlHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3pDLFlBQVk7SUFDWix1QkFBdUI7SUFDdkIsU0FBUztJQUNULGFBQWE7Q0FDZCxDQUFDLENBQUM7QUFFSCxTQUFTLHVCQUF1QjtJQUM5QixPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDZCxNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFRLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sYUFBYSxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXpDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQy9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxtQkFBeUIsT0FBbUI7SUFDMUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUVuQyxPQUFPLElBQUEseUJBQWUsRUFBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1FBQ25DLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXZELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLElBQUksZ0NBQW1CLENBQUMsaUJBQWlCLGNBQWMsc0JBQXNCLENBQUMsQ0FBQztTQUN0RjtRQUVELE1BQU0sV0FBVyxHQUFHLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVuRCxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNsQixJQUFJLEVBQUUsS0FBSztZQUNYLE9BQU8sRUFBRSx3QkFBYyxDQUFDLFVBQVU7WUFDbEMsb0JBQW9CLEVBQUUsYUFBYTtZQUNuQyxPQUFPLEVBQUU7Z0JBQ1AsZ0JBQWdCLEVBQUUsWUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsb0JBQW9CLENBQUM7YUFDL0Q7WUFDRCxjQUFjLEVBQUU7Z0JBQ2QsVUFBVSxFQUFFO29CQUNWLGVBQWUsRUFBRSxHQUFHLGNBQWMsbUJBQW1CO2lCQUN0RDtnQkFDRCxXQUFXLEVBQUU7b0JBQ1gsZUFBZSxFQUFFLEdBQUcsY0FBYyxvQkFBb0I7aUJBQ3ZEO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsa0JBQUssRUFBQztZQUNYLElBQUEsc0JBQVMsRUFDUCxJQUFBLGtCQUFLLEVBQUMsSUFBQSxnQkFBRyxFQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNwQixJQUFBLDJCQUFjLEVBQUM7b0JBQ2IsS0FBSyxFQUFFLG9CQUFPO29CQUNkLEdBQUcsT0FBTztvQkFDViwyQkFBMkIsRUFBRSxZQUFJLENBQUMsUUFBUSxDQUFDLFlBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxFQUFFLEdBQUcsQ0FBQztpQkFDN0UsQ0FBQztnQkFDRixJQUFBLGlCQUFJLEVBQUMsV0FBVyxDQUFDO2FBQ2xCLENBQUMsQ0FDSDtZQUNELEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDbkMsSUFBQSx1QkFBYSxFQUFDLElBQUksRUFBRSxnQ0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsd0JBQWMsQ0FBQyxHQUFHO2dCQUN4QixRQUFRLEVBQUUsMEJBQWdCLENBQUMsSUFBSTthQUNoQyxDQUFDLENBQ0g7WUFDRCx1QkFBdUIsRUFBRTtTQUMxQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFqREQsNEJBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIGFwcGx5LFxuICBhcHBseVRlbXBsYXRlcyxcbiAgY2hhaW4sXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgc3RyaW5ncyxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1xuICBBbmd1bGFyQnVpbGRlcixcbiAgRGVwZW5kZW5jeVR5cGUsXG4gIEV4aXN0aW5nQmVoYXZpb3IsXG4gIGFkZERlcGVuZGVuY3ksXG4gIHVwZGF0ZVdvcmtzcGFjZSxcbn0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5JztcbmltcG9ydCB7IHBvc2l4IGFzIHBhdGggfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEpTT05GaWxlIH0gZnJvbSAnLi4vdXRpbGl0eS9qc29uLWZpbGUnO1xuaW1wb3J0IHsgbGF0ZXN0VmVyc2lvbnMgfSBmcm9tICcuLi91dGlsaXR5L2xhdGVzdC12ZXJzaW9ucyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgRTJlT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuLyoqXG4gKiBUaGUgbGlzdCBvZiBkZXZlbG9wbWVudCBkZXBlbmRlbmNpZXMgdXNlZCBieSB0aGUgRTJFIHByb3RyYWN0b3ItYmFzZWQgYnVpbGRlci5cbiAqIFRoZSB2ZXJzaW9ucyBhcmUgc291cmNlZCBmcm9tIHRoZSBsYXRlc3QgdmVyc2lvbnMgYC4uL3V0aWxpdHkvbGF0ZXN0LXZlcnNpb25zL3BhY2thZ2UuanNvbmBcbiAqIGZpbGUgd2hpY2ggaXMgYXV0b21hdGljYWxseSB1cGRhdGVkIHZpYSByZW5vdmF0ZS5cbiAqL1xuY29uc3QgRTJFX0RFVl9ERVBFTkRFTkNJRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3Byb3RyYWN0b3InLFxuICAnamFzbWluZS1zcGVjLXJlcG9ydGVyJyxcbiAgJ3RzLW5vZGUnLFxuICAnQHR5cGVzL25vZGUnLFxuXSk7XG5cbmZ1bmN0aW9uIGFkZFNjcmlwdHNUb1BhY2thZ2VKc29uKCk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3QpID0+IHtcbiAgICBjb25zdCBwa2dKc29uID0gbmV3IEpTT05GaWxlKGhvc3QsICdwYWNrYWdlLmpzb24nKTtcbiAgICBjb25zdCBlMmVTY3JpcHRQYXRoID0gWydzY3JpcHRzJywgJ2UyZSddO1xuXG4gICAgaWYgKCFwa2dKc29uLmdldChlMmVTY3JpcHRQYXRoKSkge1xuICAgICAgcGtnSnNvbi5tb2RpZnkoZTJlU2NyaXB0UGF0aCwgJ25nIGUyZScsIGZhbHNlKTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBFMmVPcHRpb25zKTogUnVsZSB7XG4gIGNvbnN0IHsgcmVsYXRlZEFwcE5hbWUgfSA9IG9wdGlvbnM7XG5cbiAgcmV0dXJuIHVwZGF0ZVdvcmtzcGFjZSgod29ya3NwYWNlKSA9PiB7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocmVsYXRlZEFwcE5hbWUpO1xuXG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUHJvamVjdCBuYW1lIFwiJHtyZWxhdGVkQXBwTmFtZX1cIiBkb2Vzbid0IG5vdCBleGlzdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBlMmVSb290UGF0aCA9IHBhdGguam9pbihwcm9qZWN0LnJvb3QsICdlMmUnKTtcblxuICAgIHByb2plY3QudGFyZ2V0cy5hZGQoe1xuICAgICAgbmFtZTogJ2UyZScsXG4gICAgICBidWlsZGVyOiBBbmd1bGFyQnVpbGRlci5Qcm90cmFjdG9yLFxuICAgICAgZGVmYXVsdENvbmZpZ3VyYXRpb246ICdkZXZlbG9wbWVudCcsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIHByb3RyYWN0b3JDb25maWc6IHBhdGguam9pbihlMmVSb290UGF0aCwgJ3Byb3RyYWN0b3IuY29uZi5qcycpLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYXRpb25zOiB7XG4gICAgICAgIHByb2R1Y3Rpb246IHtcbiAgICAgICAgICBkZXZTZXJ2ZXJUYXJnZXQ6IGAke3JlbGF0ZWRBcHBOYW1lfTpzZXJ2ZTpwcm9kdWN0aW9uYCxcbiAgICAgICAgfSxcbiAgICAgICAgZGV2ZWxvcG1lbnQ6IHtcbiAgICAgICAgICBkZXZTZXJ2ZXJUYXJnZXQ6IGAke3JlbGF0ZWRBcHBOYW1lfTpzZXJ2ZTpkZXZlbG9wbWVudGAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIG1lcmdlV2l0aChcbiAgICAgICAgYXBwbHkodXJsKCcuL2ZpbGVzJyksIFtcbiAgICAgICAgICBhcHBseVRlbXBsYXRlcyh7XG4gICAgICAgICAgICB1dGlsczogc3RyaW5ncyxcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3Q6IHBhdGgucmVsYXRpdmUocGF0aC5qb2luKCcvJywgZTJlUm9vdFBhdGgpLCAnLycpLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG1vdmUoZTJlUm9vdFBhdGgpLFxuICAgICAgICBdKSxcbiAgICAgICksXG4gICAgICAuLi5FMkVfREVWX0RFUEVOREVOQ0lFUy5tYXAoKG5hbWUpID0+XG4gICAgICAgIGFkZERlcGVuZGVuY3kobmFtZSwgbGF0ZXN0VmVyc2lvbnNbbmFtZV0sIHtcbiAgICAgICAgICB0eXBlOiBEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgICAgZXhpc3Rpbmc6IEV4aXN0aW5nQmVoYXZpb3IuU2tpcCxcbiAgICAgICAgfSksXG4gICAgICApLFxuICAgICAgYWRkU2NyaXB0c1RvUGFja2FnZUpzb24oKSxcbiAgICBdKTtcbiAgfSk7XG59XG4iXX0=