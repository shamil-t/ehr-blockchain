"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const dependencies_1 = require("../utility/dependencies");
const json_file_1 = require("../utility/json-file");
const latest_versions_1 = require("../utility/latest-versions");
const paths_1 = require("../utility/paths");
const workspace_1 = require("../utility/workspace");
const workspace_models_1 = require("../utility/workspace-models");
function updateTsConfig(packageName, ...paths) {
    return (host) => {
        if (!host.exists('tsconfig.json')) {
            return host;
        }
        const file = new json_file_1.JSONFile(host, 'tsconfig.json');
        const jsonPath = ['compilerOptions', 'paths', packageName];
        const value = file.get(jsonPath);
        file.modify(jsonPath, Array.isArray(value) ? [...value, ...paths] : paths);
    };
}
function addDependenciesToPackageJson() {
    return (host) => {
        [
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: '@angular/compiler-cli',
                version: latest_versions_1.latestVersions.Angular,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: '@angular-devkit/build-angular',
                version: latest_versions_1.latestVersions.DevkitBuildAngular,
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'ng-packagr',
                version: latest_versions_1.latestVersions['ng-packagr'],
            },
            {
                type: dependencies_1.NodeDependencyType.Default,
                name: 'tslib',
                version: latest_versions_1.latestVersions['tslib'],
            },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                name: 'typescript',
                version: latest_versions_1.latestVersions['typescript'],
            },
        ].forEach((dependency) => (0, dependencies_1.addPackageJsonDependency)(host, dependency));
        return host;
    };
}
function addLibToWorkspaceFile(options, projectRoot, projectName) {
    return (0, workspace_1.updateWorkspace)((workspace) => {
        workspace.projects.add({
            name: projectName,
            root: projectRoot,
            sourceRoot: `${projectRoot}/src`,
            projectType: workspace_models_1.ProjectType.Library,
            prefix: options.prefix,
            targets: {
                build: {
                    builder: workspace_models_1.Builders.NgPackagr,
                    defaultConfiguration: 'production',
                    options: {
                        project: `${projectRoot}/ng-package.json`,
                    },
                    configurations: {
                        production: {
                            tsConfig: `${projectRoot}/tsconfig.lib.prod.json`,
                        },
                        development: {
                            tsConfig: `${projectRoot}/tsconfig.lib.json`,
                        },
                    },
                },
                test: {
                    builder: workspace_models_1.Builders.Karma,
                    options: {
                        tsConfig: `${projectRoot}/tsconfig.spec.json`,
                        polyfills: ['zone.js', 'zone.js/testing'],
                    },
                },
            },
        });
    });
}
function default_1(options) {
    return async (host) => {
        const prefix = options.prefix;
        // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
        const packageName = options.name;
        if (/^@.*\/.*/.test(options.name)) {
            const [, name] = options.name.split('/');
            options.name = name;
        }
        const workspace = await (0, workspace_1.getWorkspace)(host);
        const newProjectRoot = workspace.extensions.newProjectRoot || '';
        let folderName = packageName.startsWith('@') ? packageName.slice(1) : packageName;
        if (/[A-Z]/.test(folderName)) {
            folderName = schematics_1.strings.dasherize(folderName);
        }
        const libDir = options.projectRoot !== undefined
            ? (0, core_1.normalize)(options.projectRoot)
            : (0, core_1.join)((0, core_1.normalize)(newProjectRoot), folderName);
        const distRoot = `dist/${folderName}`;
        const sourceDir = `${libDir}/src/lib`;
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                ...options,
                packageName,
                libDir,
                distRoot,
                relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(libDir),
                prefix,
                angularLatestVersion: latest_versions_1.latestVersions.Angular.replace(/~|\^/, ''),
                tsLibLatestVersion: latest_versions_1.latestVersions['tslib'].replace(/~|\^/, ''),
                folderName,
            }),
            (0, schematics_1.move)(libDir),
        ]);
        return (0, schematics_1.chain)([
            (0, schematics_1.mergeWith)(templateSource),
            addLibToWorkspaceFile(options, libDir, packageName),
            options.skipPackageJson ? (0, schematics_1.noop)() : addDependenciesToPackageJson(),
            options.skipTsConfig ? (0, schematics_1.noop)() : updateTsConfig(packageName, distRoot),
            options.standalone
                ? (0, schematics_1.noop)()
                : (0, schematics_1.schematic)('module', {
                    name: options.name,
                    commonModule: false,
                    flat: true,
                    path: sourceDir,
                    project: packageName,
                }),
            (0, schematics_1.schematic)('component', {
                name: options.name,
                selector: `${prefix}-${options.name}`,
                inlineStyle: true,
                inlineTemplate: true,
                flat: true,
                path: sourceDir,
                export: true,
                standalone: options.standalone,
                project: packageName,
            }),
            (0, schematics_1.schematic)('service', {
                name: options.name,
                flat: true,
                path: sourceDir,
                project: packageName,
            }),
            (_tree, context) => {
                if (!options.skipPackageJson && !options.skipInstall) {
                    context.addTask(new tasks_1.NodePackageInstallTask());
                }
            },
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbGlicmFyeS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtDQUF1RDtBQUN2RCwyREFhb0M7QUFDcEMsNERBQTBFO0FBQzFFLDBEQUF1RjtBQUN2RixvREFBZ0Q7QUFDaEQsZ0VBQTREO0FBQzVELDRDQUErRDtBQUMvRCxvREFBcUU7QUFDckUsa0VBQW9FO0FBR3BFLFNBQVMsY0FBYyxDQUFDLFdBQW1CLEVBQUUsR0FBRyxLQUFlO0lBQzdELE9BQU8sQ0FBQyxJQUFVLEVBQUUsRUFBRTtRQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNqQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxvQkFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNqRCxNQUFNLFFBQVEsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMzRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0UsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsNEJBQTRCO0lBQ25DLE9BQU8sQ0FBQyxJQUFVLEVBQUUsRUFBRTtRQUNwQjtZQUNFO2dCQUNFLElBQUksRUFBRSxpQ0FBa0IsQ0FBQyxHQUFHO2dCQUM1QixJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixPQUFPLEVBQUUsZ0NBQWMsQ0FBQyxPQUFPO2FBQ2hDO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLGlDQUFrQixDQUFDLEdBQUc7Z0JBQzVCLElBQUksRUFBRSwrQkFBK0I7Z0JBQ3JDLE9BQU8sRUFBRSxnQ0FBYyxDQUFDLGtCQUFrQjthQUMzQztZQUNEO2dCQUNFLElBQUksRUFBRSxpQ0FBa0IsQ0FBQyxHQUFHO2dCQUM1QixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsT0FBTyxFQUFFLGdDQUFjLENBQUMsWUFBWSxDQUFDO2FBQ3RDO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLGlDQUFrQixDQUFDLE9BQU87Z0JBQ2hDLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxnQ0FBYyxDQUFDLE9BQU8sQ0FBQzthQUNqQztZQUNEO2dCQUNFLElBQUksRUFBRSxpQ0FBa0IsQ0FBQyxHQUFHO2dCQUM1QixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsT0FBTyxFQUFFLGdDQUFjLENBQUMsWUFBWSxDQUFDO2FBQ3RDO1NBQ0YsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUEsdUNBQXdCLEVBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFdEUsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDNUIsT0FBdUIsRUFDdkIsV0FBbUIsRUFDbkIsV0FBbUI7SUFFbkIsT0FBTyxJQUFBLDJCQUFlLEVBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNuQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUNyQixJQUFJLEVBQUUsV0FBVztZQUNqQixJQUFJLEVBQUUsV0FBVztZQUNqQixVQUFVLEVBQUUsR0FBRyxXQUFXLE1BQU07WUFDaEMsV0FBVyxFQUFFLDhCQUFXLENBQUMsT0FBTztZQUNoQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDdEIsT0FBTyxFQUFFO2dCQUNQLEtBQUssRUFBRTtvQkFDTCxPQUFPLEVBQUUsMkJBQVEsQ0FBQyxTQUFTO29CQUMzQixvQkFBb0IsRUFBRSxZQUFZO29CQUNsQyxPQUFPLEVBQUU7d0JBQ1AsT0FBTyxFQUFFLEdBQUcsV0FBVyxrQkFBa0I7cUJBQzFDO29CQUNELGNBQWMsRUFBRTt3QkFDZCxVQUFVLEVBQUU7NEJBQ1YsUUFBUSxFQUFFLEdBQUcsV0FBVyx5QkFBeUI7eUJBQ2xEO3dCQUNELFdBQVcsRUFBRTs0QkFDWCxRQUFRLEVBQUUsR0FBRyxXQUFXLG9CQUFvQjt5QkFDN0M7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QsSUFBSSxFQUFFO29CQUNKLE9BQU8sRUFBRSwyQkFBUSxDQUFDLEtBQUs7b0JBQ3ZCLE9BQU8sRUFBRTt3QkFDUCxRQUFRLEVBQUUsR0FBRyxXQUFXLHFCQUFxQjt3QkFDN0MsU0FBUyxFQUFFLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDO3FCQUMxQztpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsbUJBQXlCLE9BQXVCO0lBQzlDLE9BQU8sS0FBSyxFQUFFLElBQVUsRUFBRSxFQUFFO1FBQzFCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFOUIsd0VBQXdFO1FBQ3hFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDakMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUNyQjtRQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSx3QkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLE1BQU0sY0FBYyxHQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsY0FBcUMsSUFBSSxFQUFFLENBQUM7UUFFekYsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ2xGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM1QixVQUFVLEdBQUcsb0JBQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDNUM7UUFFRCxNQUFNLE1BQU0sR0FDVixPQUFPLENBQUMsV0FBVyxLQUFLLFNBQVM7WUFDL0IsQ0FBQyxDQUFDLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFBLGdCQUFTLEVBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFbEQsTUFBTSxRQUFRLEdBQUcsUUFBUSxVQUFVLEVBQUUsQ0FBQztRQUN0QyxNQUFNLFNBQVMsR0FBRyxHQUFHLE1BQU0sVUFBVSxDQUFDO1FBRXRDLE1BQU0sY0FBYyxHQUFHLElBQUEsa0JBQUssRUFBQyxJQUFBLGdCQUFHLEVBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0MsSUFBQSwyQkFBYyxFQUFDO2dCQUNiLEdBQUcsb0JBQU87Z0JBQ1YsR0FBRyxPQUFPO2dCQUNWLFdBQVc7Z0JBQ1gsTUFBTTtnQkFDTixRQUFRO2dCQUNSLDJCQUEyQixFQUFFLElBQUEsbUNBQTJCLEVBQUMsTUFBTSxDQUFDO2dCQUNoRSxNQUFNO2dCQUNOLG9CQUFvQixFQUFFLGdDQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNoRSxrQkFBa0IsRUFBRSxnQ0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUMvRCxVQUFVO2FBQ1gsQ0FBQztZQUNGLElBQUEsaUJBQUksRUFBQyxNQUFNLENBQUM7U0FDYixDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsa0JBQUssRUFBQztZQUNYLElBQUEsc0JBQVMsRUFBQyxjQUFjLENBQUM7WUFDekIscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUM7WUFDbkQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFLENBQUMsQ0FBQyxDQUFDLDRCQUE0QixFQUFFO1lBQ2pFLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQztZQUNyRSxPQUFPLENBQUMsVUFBVTtnQkFDaEIsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtnQkFDUixDQUFDLENBQUMsSUFBQSxzQkFBUyxFQUFDLFFBQVEsRUFBRTtvQkFDbEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO29CQUNsQixZQUFZLEVBQUUsS0FBSztvQkFDbkIsSUFBSSxFQUFFLElBQUk7b0JBQ1YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsT0FBTyxFQUFFLFdBQVc7aUJBQ3JCLENBQUM7WUFDTixJQUFBLHNCQUFTLEVBQUMsV0FBVyxFQUFFO2dCQUNyQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7Z0JBQ2xCLFFBQVEsRUFBRSxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFO2dCQUNyQyxXQUFXLEVBQUUsSUFBSTtnQkFDakIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxTQUFTO2dCQUNmLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtnQkFDOUIsT0FBTyxFQUFFLFdBQVc7YUFDckIsQ0FBQztZQUNGLElBQUEsc0JBQVMsRUFBQyxTQUFTLEVBQUU7Z0JBQ25CLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLFdBQVc7YUFDckIsQ0FBQztZQUNGLENBQUMsS0FBVyxFQUFFLE9BQXlCLEVBQUUsRUFBRTtnQkFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO29CQUNwRCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLEVBQUUsQ0FBQyxDQUFDO2lCQUMvQztZQUNILENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBakZELDRCQWlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqb2luLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNDb250ZXh0LFxuICBUcmVlLFxuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGNoYWluLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIHNjaGVtYXRpYyxcbiAgc3RyaW5ncyxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZUluc3RhbGxUYXNrIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgTm9kZURlcGVuZGVuY3lUeXBlLCBhZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3kgfSBmcm9tICcuLi91dGlsaXR5L2RlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBKU09ORmlsZSB9IGZyb20gJy4uL3V0aWxpdHkvanNvbi1maWxlJztcbmltcG9ydCB7IGxhdGVzdFZlcnNpb25zIH0gZnJvbSAnLi4vdXRpbGl0eS9sYXRlc3QtdmVyc2lvbnMnO1xuaW1wb3J0IHsgcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290IH0gZnJvbSAnLi4vdXRpbGl0eS9wYXRocyc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UsIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IEJ1aWxkZXJzLCBQcm9qZWN0VHlwZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlLW1vZGVscyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgTGlicmFyeU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIHVwZGF0ZVRzQ29uZmlnKHBhY2thZ2VOYW1lOiBzdHJpbmcsIC4uLnBhdGhzOiBzdHJpbmdbXSkge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBpZiAoIWhvc3QuZXhpc3RzKCd0c2NvbmZpZy5qc29uJykpIHtcbiAgICAgIHJldHVybiBob3N0O1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBuZXcgSlNPTkZpbGUoaG9zdCwgJ3RzY29uZmlnLmpzb24nKTtcbiAgICBjb25zdCBqc29uUGF0aCA9IFsnY29tcGlsZXJPcHRpb25zJywgJ3BhdGhzJywgcGFja2FnZU5hbWVdO1xuICAgIGNvbnN0IHZhbHVlID0gZmlsZS5nZXQoanNvblBhdGgpO1xuICAgIGZpbGUubW9kaWZ5KGpzb25QYXRoLCBBcnJheS5pc0FycmF5KHZhbHVlKSA/IFsuLi52YWx1ZSwgLi4ucGF0aHNdIDogcGF0aHMpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGREZXBlbmRlbmNpZXNUb1BhY2thZ2VKc29uKCkge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICdAYW5ndWxhci9jb21waWxlci1jbGknLFxuICAgICAgICB2ZXJzaW9uOiBsYXRlc3RWZXJzaW9ucy5Bbmd1bGFyLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyJyxcbiAgICAgICAgdmVyc2lvbjogbGF0ZXN0VmVyc2lvbnMuRGV2a2l0QnVpbGRBbmd1bGFyLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ25nLXBhY2thZ3InLFxuICAgICAgICB2ZXJzaW9uOiBsYXRlc3RWZXJzaW9uc1snbmctcGFja2FnciddLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRlZmF1bHQsXG4gICAgICAgIG5hbWU6ICd0c2xpYicsXG4gICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zWyd0c2xpYiddLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogTm9kZURlcGVuZGVuY3lUeXBlLkRldixcbiAgICAgICAgbmFtZTogJ3R5cGVzY3JpcHQnLFxuICAgICAgICB2ZXJzaW9uOiBsYXRlc3RWZXJzaW9uc1sndHlwZXNjcmlwdCddLFxuICAgICAgfSxcbiAgICBdLmZvckVhY2goKGRlcGVuZGVuY3kpID0+IGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCBkZXBlbmRlbmN5KSk7XG5cbiAgICByZXR1cm4gaG9zdDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkTGliVG9Xb3Jrc3BhY2VGaWxlKFxuICBvcHRpb25zOiBMaWJyYXJ5T3B0aW9ucyxcbiAgcHJvamVjdFJvb3Q6IHN0cmluZyxcbiAgcHJvamVjdE5hbWU6IHN0cmluZyxcbik6IFJ1bGUge1xuICByZXR1cm4gdXBkYXRlV29ya3NwYWNlKCh3b3Jrc3BhY2UpID0+IHtcbiAgICB3b3Jrc3BhY2UucHJvamVjdHMuYWRkKHtcbiAgICAgIG5hbWU6IHByb2plY3ROYW1lLFxuICAgICAgcm9vdDogcHJvamVjdFJvb3QsXG4gICAgICBzb3VyY2VSb290OiBgJHtwcm9qZWN0Um9vdH0vc3JjYCxcbiAgICAgIHByb2plY3RUeXBlOiBQcm9qZWN0VHlwZS5MaWJyYXJ5LFxuICAgICAgcHJlZml4OiBvcHRpb25zLnByZWZpeCxcbiAgICAgIHRhcmdldHM6IHtcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICBidWlsZGVyOiBCdWlsZGVycy5OZ1BhY2thZ3IsXG4gICAgICAgICAgZGVmYXVsdENvbmZpZ3VyYXRpb246ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwcm9qZWN0OiBgJHtwcm9qZWN0Um9vdH0vbmctcGFja2FnZS5qc29uYCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmZpZ3VyYXRpb25zOiB7XG4gICAgICAgICAgICBwcm9kdWN0aW9uOiB7XG4gICAgICAgICAgICAgIHRzQ29uZmlnOiBgJHtwcm9qZWN0Um9vdH0vdHNjb25maWcubGliLnByb2QuanNvbmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGV2ZWxvcG1lbnQ6IHtcbiAgICAgICAgICAgICAgdHNDb25maWc6IGAke3Byb2plY3RSb290fS90c2NvbmZpZy5saWIuanNvbmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICBidWlsZGVyOiBCdWlsZGVycy5LYXJtYSxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB0c0NvbmZpZzogYCR7cHJvamVjdFJvb3R9L3RzY29uZmlnLnNwZWMuanNvbmAsXG4gICAgICAgICAgICBwb2x5ZmlsbHM6IFsnem9uZS5qcycsICd6b25lLmpzL3Rlc3RpbmcnXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBMaWJyYXJ5T3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBjb25zdCBwcmVmaXggPSBvcHRpb25zLnByZWZpeDtcblxuICAgIC8vIElmIHNjb3BlZCBwcm9qZWN0IChpLmUuIFwiQGZvby9iYXJcIiksIGNvbnZlcnQgcHJvamVjdERpciB0byBcImZvby9iYXJcIi5cbiAgICBjb25zdCBwYWNrYWdlTmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICBpZiAoL15ALipcXC8uKi8udGVzdChvcHRpb25zLm5hbWUpKSB7XG4gICAgICBjb25zdCBbLCBuYW1lXSA9IG9wdGlvbnMubmFtZS5zcGxpdCgnLycpO1xuICAgICAgb3B0aW9ucy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgbmV3UHJvamVjdFJvb3QgPSAod29ya3NwYWNlLmV4dGVuc2lvbnMubmV3UHJvamVjdFJvb3QgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSB8fCAnJztcblxuICAgIGxldCBmb2xkZXJOYW1lID0gcGFja2FnZU5hbWUuc3RhcnRzV2l0aCgnQCcpID8gcGFja2FnZU5hbWUuc2xpY2UoMSkgOiBwYWNrYWdlTmFtZTtcbiAgICBpZiAoL1tBLVpdLy50ZXN0KGZvbGRlck5hbWUpKSB7XG4gICAgICBmb2xkZXJOYW1lID0gc3RyaW5ncy5kYXNoZXJpemUoZm9sZGVyTmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGliRGlyID1cbiAgICAgIG9wdGlvbnMucHJvamVjdFJvb3QgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IG5vcm1hbGl6ZShvcHRpb25zLnByb2plY3RSb290KVxuICAgICAgICA6IGpvaW4obm9ybWFsaXplKG5ld1Byb2plY3RSb290KSwgZm9sZGVyTmFtZSk7XG5cbiAgICBjb25zdCBkaXN0Um9vdCA9IGBkaXN0LyR7Zm9sZGVyTmFtZX1gO1xuICAgIGNvbnN0IHNvdXJjZURpciA9IGAke2xpYkRpcn0vc3JjL2xpYmA7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcycpLCBbXG4gICAgICBhcHBseVRlbXBsYXRlcyh7XG4gICAgICAgIC4uLnN0cmluZ3MsXG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIHBhY2thZ2VOYW1lLFxuICAgICAgICBsaWJEaXIsXG4gICAgICAgIGRpc3RSb290LFxuICAgICAgICByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3Q6IHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdChsaWJEaXIpLFxuICAgICAgICBwcmVmaXgsXG4gICAgICAgIGFuZ3VsYXJMYXRlc3RWZXJzaW9uOiBsYXRlc3RWZXJzaW9ucy5Bbmd1bGFyLnJlcGxhY2UoL358XFxeLywgJycpLFxuICAgICAgICB0c0xpYkxhdGVzdFZlcnNpb246IGxhdGVzdFZlcnNpb25zWyd0c2xpYiddLnJlcGxhY2UoL358XFxeLywgJycpLFxuICAgICAgICBmb2xkZXJOYW1lLFxuICAgICAgfSksXG4gICAgICBtb3ZlKGxpYkRpciksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlKSxcbiAgICAgIGFkZExpYlRvV29ya3NwYWNlRmlsZShvcHRpb25zLCBsaWJEaXIsIHBhY2thZ2VOYW1lKSxcbiAgICAgIG9wdGlvbnMuc2tpcFBhY2thZ2VKc29uID8gbm9vcCgpIDogYWRkRGVwZW5kZW5jaWVzVG9QYWNrYWdlSnNvbigpLFxuICAgICAgb3B0aW9ucy5za2lwVHNDb25maWcgPyBub29wKCkgOiB1cGRhdGVUc0NvbmZpZyhwYWNrYWdlTmFtZSwgZGlzdFJvb3QpLFxuICAgICAgb3B0aW9ucy5zdGFuZGFsb25lXG4gICAgICAgID8gbm9vcCgpXG4gICAgICAgIDogc2NoZW1hdGljKCdtb2R1bGUnLCB7XG4gICAgICAgICAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgICAgICBjb21tb25Nb2R1bGU6IGZhbHNlLFxuICAgICAgICAgICAgZmxhdDogdHJ1ZSxcbiAgICAgICAgICAgIHBhdGg6IHNvdXJjZURpcixcbiAgICAgICAgICAgIHByb2plY3Q6IHBhY2thZ2VOYW1lLFxuICAgICAgICAgIH0pLFxuICAgICAgc2NoZW1hdGljKCdjb21wb25lbnQnLCB7XG4gICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgc2VsZWN0b3I6IGAke3ByZWZpeH0tJHtvcHRpb25zLm5hbWV9YCxcbiAgICAgICAgaW5saW5lU3R5bGU6IHRydWUsXG4gICAgICAgIGlubGluZVRlbXBsYXRlOiB0cnVlLFxuICAgICAgICBmbGF0OiB0cnVlLFxuICAgICAgICBwYXRoOiBzb3VyY2VEaXIsXG4gICAgICAgIGV4cG9ydDogdHJ1ZSxcbiAgICAgICAgc3RhbmRhbG9uZTogb3B0aW9ucy5zdGFuZGFsb25lLFxuICAgICAgICBwcm9qZWN0OiBwYWNrYWdlTmFtZSxcbiAgICAgIH0pLFxuICAgICAgc2NoZW1hdGljKCdzZXJ2aWNlJywge1xuICAgICAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgIGZsYXQ6IHRydWUsXG4gICAgICAgIHBhdGg6IHNvdXJjZURpcixcbiAgICAgICAgcHJvamVjdDogcGFja2FnZU5hbWUsXG4gICAgICB9KSxcbiAgICAgIChfdHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2tpcFBhY2thZ2VKc29uICYmICFvcHRpb25zLnNraXBJbnN0YWxsKSB7XG4gICAgICAgICAgY29udGV4dC5hZGRUYXNrKG5ldyBOb2RlUGFja2FnZUluc3RhbGxUYXNrKCkpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIF0pO1xuICB9O1xufVxuIl19