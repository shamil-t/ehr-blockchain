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
const latest_versions_1 = require("../utility/latest-versions");
const ng_ast_utils_1 = require("../utility/ng-ast-utils");
const paths_1 = require("../utility/paths");
const project_targets_1 = require("../utility/project-targets");
const workspace_1 = require("../utility/workspace");
const workspace_models_1 = require("../utility/workspace-models");
function updateConfigFile(options, tsConfigDirectory) {
    return (0, workspace_1.updateWorkspace)((workspace) => {
        const clientProject = workspace.projects.get(options.project);
        if (clientProject) {
            // In case the browser builder hashes the assets
            // we need to add this setting to the server builder
            // as otherwise when assets it will be requested twice.
            // One for the server which will be unhashed, and other on the client which will be hashed.
            const getServerOptions = (options = {}) => {
                return {
                    buildOptimizer: options?.buildOptimizer,
                    outputHashing: options?.outputHashing === 'all' ? 'media' : options?.outputHashing,
                    fileReplacements: options?.fileReplacements,
                    optimization: options?.optimization === undefined ? undefined : !!options?.optimization,
                    sourceMap: options?.sourceMap,
                    localization: options?.localization,
                    stylePreprocessorOptions: options?.stylePreprocessorOptions,
                    resourcesOutputPath: options?.resourcesOutputPath,
                    deployUrl: options?.deployUrl,
                    i18nMissingTranslation: options?.i18nMissingTranslation,
                    preserveSymlinks: options?.preserveSymlinks,
                    extractLicenses: options?.extractLicenses,
                    inlineStyleLanguage: options?.inlineStyleLanguage,
                    vendorChunk: options?.vendorChunk,
                };
            };
            const buildTarget = clientProject.targets.get('build');
            if (buildTarget?.options) {
                buildTarget.options.outputPath = `dist/${options.project}/browser`;
            }
            const buildConfigurations = buildTarget?.configurations;
            const configurations = {};
            if (buildConfigurations) {
                for (const [key, options] of Object.entries(buildConfigurations)) {
                    configurations[key] = getServerOptions(options);
                }
            }
            const mainPath = options.main;
            const sourceRoot = clientProject.sourceRoot ?? (0, core_1.join)((0, core_1.normalize)(clientProject.root), 'src');
            const serverTsConfig = (0, core_1.join)(tsConfigDirectory, 'tsconfig.server.json');
            clientProject.targets.add({
                name: 'server',
                builder: workspace_models_1.Builders.Server,
                defaultConfiguration: 'production',
                options: {
                    outputPath: `dist/${options.project}/server`,
                    main: (0, core_1.join)((0, core_1.normalize)(sourceRoot), mainPath.endsWith('.ts') ? mainPath : mainPath + '.ts'),
                    tsConfig: serverTsConfig,
                    ...(buildTarget?.options ? getServerOptions(buildTarget?.options) : {}),
                },
                configurations,
            });
        }
    });
}
function addDependencies() {
    return (host) => {
        const coreDep = (0, dependencies_1.getPackageJsonDependency)(host, '@angular/core');
        if (coreDep === null) {
            throw new schematics_1.SchematicsException('Could not find version.');
        }
        const platformServerDep = {
            ...coreDep,
            name: '@angular/platform-server',
        };
        (0, dependencies_1.addPackageJsonDependency)(host, platformServerDep);
        (0, dependencies_1.addPackageJsonDependency)(host, {
            type: dependencies_1.NodeDependencyType.Dev,
            name: '@types/node',
            version: latest_versions_1.latestVersions['@types/node'],
        });
    };
}
function default_1(options) {
    return async (host, context) => {
        const workspace = await (0, workspace_1.getWorkspace)(host);
        const clientProject = workspace.projects.get(options.project);
        if (!clientProject || clientProject.extensions.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`Universal requires a project type of "application".`);
        }
        const clientBuildTarget = clientProject.targets.get('build');
        if (!clientBuildTarget) {
            throw (0, project_targets_1.targetBuildNotFoundError)();
        }
        const clientBuildOptions = (clientBuildTarget.options ||
            {});
        if (!options.skipInstall) {
            context.addTask(new tasks_1.NodePackageInstallTask());
        }
        const isStandalone = (0, ng_ast_utils_1.isStandaloneApp)(host, clientBuildOptions.main);
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)(isStandalone ? './files/standalone-src' : './files/src'), [
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                ...options,
                stripTsExtension: (s) => s.replace(/\.ts$/, ''),
            }),
            (0, schematics_1.move)((0, core_1.join)((0, core_1.normalize)(clientProject.root), 'src')),
        ]);
        const clientTsConfig = (0, core_1.normalize)(clientBuildOptions.tsConfig);
        const tsConfigExtends = (0, core_1.basename)(clientTsConfig);
        const tsConfigDirectory = (0, core_1.dirname)(clientTsConfig);
        const rootSource = (0, schematics_1.apply)((0, schematics_1.url)('./files/root'), [
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                ...options,
                stripTsExtension: (s) => s.replace(/\.ts$/, ''),
                tsConfigExtends,
                hasLocalizePackage: !!(0, dependencies_1.getPackageJsonDependency)(host, '@angular/localize'),
                relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(tsConfigDirectory),
            }),
            (0, schematics_1.move)(tsConfigDirectory),
        ]);
        return (0, schematics_1.chain)([
            (0, schematics_1.mergeWith)(templateSource),
            (0, schematics_1.mergeWith)(rootSource),
            addDependencies(),
            updateConfigFile(options, tsConfigDirectory),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdW5pdmVyc2FsL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0NBQTJGO0FBQzNGLDJEQVlvQztBQUNwQyw0REFBMEU7QUFDMUUsMERBSWlDO0FBQ2pDLGdFQUE0RDtBQUM1RCwwREFBMEQ7QUFDMUQsNENBQStEO0FBQy9ELGdFQUFzRTtBQUN0RSxvREFBcUU7QUFDckUsa0VBQThFO0FBRzlFLFNBQVMsZ0JBQWdCLENBQUMsT0FBeUIsRUFBRSxpQkFBdUI7SUFDMUUsT0FBTyxJQUFBLDJCQUFlLEVBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNuQyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFOUQsSUFBSSxhQUFhLEVBQUU7WUFDakIsZ0RBQWdEO1lBQ2hELG9EQUFvRDtZQUNwRCx1REFBdUQ7WUFDdkQsMkZBQTJGO1lBQzNGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxVQUFpRCxFQUFFLEVBQU0sRUFBRTtnQkFDbkYsT0FBTztvQkFDTCxjQUFjLEVBQUUsT0FBTyxFQUFFLGNBQWM7b0JBQ3ZDLGFBQWEsRUFBRSxPQUFPLEVBQUUsYUFBYSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsYUFBYTtvQkFDbEYsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLGdCQUFnQjtvQkFDM0MsWUFBWSxFQUFFLE9BQU8sRUFBRSxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsWUFBWTtvQkFDdkYsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTO29CQUM3QixZQUFZ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QUFTLEVBQUMsY0FBYyxDQUFDO1lBQ3pCLElBQUEsc0JBQVMsRUFBQyxVQUFVLENBQUM7WUFDckIsZUFBZSxFQUFFO1lBQ2pCLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztTQUM3QyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBdkRELDRCQXVEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBKc29uVmFsdWUsIFBhdGgsIGJhc2VuYW1lLCBkaXJuYW1lLCBqb2luLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNDb250ZXh0LFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxuICBUcmVlLFxuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGNoYWluLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIHN0cmluZ3MsXG4gIHVybCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7XG4gIE5vZGVEZXBlbmRlbmN5VHlwZSxcbiAgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5LFxuICBnZXRQYWNrYWdlSnNvbkRlcGVuZGVuY3ksXG59IGZyb20gJy4uL3V0aWxpdHkvZGVwZW5kZW5jaWVzJztcbmltcG9ydCB7IGxhdGVzdFZlcnNpb25zIH0gZnJvbSAnLi4vdXRpbGl0eS9sYXRlc3QtdmVyc2lvbnMnO1xuaW1wb3J0IHsgaXNTdGFuZGFsb25lQXBwIH0gZnJvbSAnLi4vdXRpbGl0eS9uZy1hc3QtdXRpbHMnO1xuaW1wb3J0IHsgcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290IH0gZnJvbSAnLi4vdXRpbGl0eS9wYXRocyc7XG5pbXBvcnQgeyB0YXJnZXRCdWlsZE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi91dGlsaXR5L3Byb2plY3QtdGFyZ2V0cyc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UsIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IEJyb3dzZXJCdWlsZGVyT3B0aW9ucywgQnVpbGRlcnMgfSBmcm9tICcuLi91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFVuaXZlcnNhbE9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbmZpZ0ZpbGUob3B0aW9uczogVW5pdmVyc2FsT3B0aW9ucywgdHNDb25maWdEaXJlY3Rvcnk6IFBhdGgpOiBSdWxlIHtcbiAgcmV0dXJuIHVwZGF0ZVdvcmtzcGFjZSgod29ya3NwYWNlKSA9PiB7XG4gICAgY29uc3QgY2xpZW50UHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQob3B0aW9ucy5wcm9qZWN0KTtcblxuICAgIGlmIChjbGllbnRQcm9qZWN0KSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSBicm93c2VyIGJ1aWxkZXIgaGFzaGVzIHRoZSBhc3NldHNcbiAgICAgIC8vIHdlIG5lZWQgdG8gYWRkIHRoaXMgc2V0dGluZyB0byB0aGUgc2VydmVyIGJ1aWxkZXJcbiAgICAgIC8vIGFzIG90aGVyd2lzZSB3aGVuIGFzc2V0cyBpdCB3aWxsIGJlIHJlcXVlc3RlZCB0d2ljZS5cbiAgICAgIC8vIE9uZSBmb3IgdGhlIHNlcnZlciB3aGljaCB3aWxsIGJlIHVuaGFzaGVkLCBhbmQgb3RoZXIgb24gdGhlIGNsaWVudCB3aGljaCB3aWxsIGJlIGhhc2hlZC5cbiAgICAgIGNvbnN0IGdldFNlcnZlck9wdGlvbnMgPSAob3B0aW9uczogUmVjb3JkPHN0cmluZywgSnNvblZhbHVlIHwgdW5kZWZpbmVkPiA9IHt9KToge30gPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGJ1aWxkT3B0aW1pemVyOiBvcHRpb25zPy5idWlsZE9wdGltaXplcixcbiAgICAgICAgICBvdXRwdXRIYXNoaW5nOiBvcHRpb25zPy5vdXRwdXRIYXNoaW5nID09PSAnYWxsJyA/ICdtZWRpYScgOiBvcHRpb25zPy5vdXRwdXRIYXNoaW5nLFxuICAgICAgICAgIGZpbGVSZXBsYWNlbWVudHM6IG9wdGlvbnM/LmZpbGVSZXBsYWNlbWVudHMsXG4gICAgICAgICAgb3B0aW1pemF0aW9uOiBvcHRpb25zPy5vcHRpbWl6YXRpb24gPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6ICEhb3B0aW9ucz8ub3B0aW1pemF0aW9uLFxuICAgICAgICAgIHNvdXJjZU1hcDogb3B0aW9ucz8uc291cmNlTWFwLFxuICAgICAgICAgIGxvY2FsaXphdGlvbjogb3B0aW9ucz8ubG9jYWxpemF0aW9uLFxuICAgICAgICAgIHN0eWxlUHJlcHJvY2Vzc29yT3B0aW9uczogb3B0aW9ucz8uc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zLFxuICAgICAgICAgIHJlc291cmNlc091dHB1dFBhdGg6IG9wdGlvbnM/LnJlc291cmNlc091dHB1dFBhdGgsXG4gICAgICAgICAgZGVwbG95VXJsOiBvcHRpb25zPy5kZXBsb3lVcmwsXG4gICAgICAgICAgaTE4bk1pc3NpbmdUcmFuc2xhdGlvbjogb3B0aW9ucz8uaTE4bk1pc3NpbmdUcmFuc2xhdGlvbixcbiAgICAgICAgICBwcmVzZXJ2ZVN5bWxpbmtzOiBvcHRpb25zPy5wcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgICAgIGV4dHJhY3RMaWNlbnNlczogb3B0aW9ucz8uZXh0cmFjdExpY2Vuc2VzLFxuICAgICAgICAgIGlubGluZVN0eWxlTGFuZ3VhZ2U6IG9wdGlvbnM/LmlubGluZVN0eWxlTGFuZ3VhZ2UsXG4gICAgICAgICAgdmVuZG9yQ2h1bms6IG9wdGlvbnM/LnZlbmRvckNodW5rLFxuICAgICAgICB9O1xuICAgICAgfTtcblxuICAgICAgY29uc3QgYnVpbGRUYXJnZXQgPSBjbGllbnRQcm9qZWN0LnRhcmdldHMuZ2V0KCdidWlsZCcpO1xuICAgICAgaWYgKGJ1aWxkVGFyZ2V0Py5vcHRpb25zKSB7XG4gICAgICAgIGJ1aWxkVGFyZ2V0Lm9wdGlvbnMub3V0cHV0UGF0aCA9IGBkaXN0LyR7b3B0aW9ucy5wcm9qZWN0fS9icm93c2VyYDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYnVpbGRDb25maWd1cmF0aW9ucyA9IGJ1aWxkVGFyZ2V0Py5jb25maWd1cmF0aW9ucztcbiAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25zOiBSZWNvcmQ8c3RyaW5nLCB7fT4gPSB7fTtcbiAgICAgIGlmIChidWlsZENvbmZpZ3VyYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgb3B0aW9uc10gb2YgT2JqZWN0LmVudHJpZXMoYnVpbGRDb25maWd1cmF0aW9ucykpIHtcbiAgICAgICAgICBjb25maWd1cmF0aW9uc1trZXldID0gZ2V0U2VydmVyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtYWluUGF0aCA9IG9wdGlvbnMubWFpbiBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBzb3VyY2VSb290ID0gY2xpZW50UHJvamVjdC5zb3VyY2VSb290ID8/IGpvaW4obm9ybWFsaXplKGNsaWVudFByb2plY3Qucm9vdCksICdzcmMnKTtcbiAgICAgIGNvbnN0IHNlcnZlclRzQ29uZmlnID0gam9pbih0c0NvbmZpZ0RpcmVjdG9yeSwgJ3RzY29uZmlnLnNlcnZlci5qc29uJyk7XG4gICAgICBjbGllbnRQcm9qZWN0LnRhcmdldHMuYWRkKHtcbiAgICAgICAgbmFtZTogJ3NlcnZlcicsXG4gICAgICAgIGJ1aWxkZXI6IEJ1aWxkZXJzLlNlcnZlcixcbiAgICAgICAgZGVmYXVsdENvbmZpZ3VyYXRpb246ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIG91dHB1dFBhdGg6IGBkaXN0LyR7b3B0aW9ucy5wcm9qZWN0fS9zZXJ2ZXJgLFxuICAgICAgICAgIG1haW46IGpvaW4obm9ybWFsaXplKHNvdXJjZVJvb3QpLCBtYWluUGF0aC5lbmRzV2l0aCgnLnRzJykgPyBtYWluUGF0aCA6IG1haW5QYXRoICsgJy50cycpLFxuICAgICAgICAgIHRzQ29uZmlnOiBzZXJ2ZXJUc0NvbmZpZyxcbiAgICAgICAgICAuLi4oYnVpbGRUYXJnZXQ/Lm9wdGlvbnMgPyBnZXRTZXJ2ZXJPcHRpb25zKGJ1aWxkVGFyZ2V0Py5vcHRpb25zKSA6IHt9KSxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhdGlvbnMsXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGREZXBlbmRlbmNpZXMoKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IGNvcmVEZXAgPSBnZXRQYWNrYWdlSnNvbkRlcGVuZGVuY3koaG9zdCwgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICBpZiAoY29yZURlcCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIHZlcnNpb24uJyk7XG4gICAgfVxuICAgIGNvbnN0IHBsYXRmb3JtU2VydmVyRGVwID0ge1xuICAgICAgLi4uY29yZURlcCxcbiAgICAgIG5hbWU6ICdAYW5ndWxhci9wbGF0Zm9ybS1zZXJ2ZXInLFxuICAgIH07XG4gICAgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5KGhvc3QsIHBsYXRmb3JtU2VydmVyRGVwKTtcblxuICAgIGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCB7XG4gICAgICB0eXBlOiBOb2RlRGVwZW5kZW5jeVR5cGUuRGV2LFxuICAgICAgbmFtZTogJ0B0eXBlcy9ub2RlJyxcbiAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zWydAdHlwZXMvbm9kZSddLFxuICAgIH0pO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogVW5pdmVyc2FsT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoaG9zdCk7XG5cbiAgICBjb25zdCBjbGllbnRQcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghY2xpZW50UHJvamVjdCB8fCBjbGllbnRQcm9qZWN0LmV4dGVuc2lvbnMucHJvamVjdFR5cGUgIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBVbml2ZXJzYWwgcmVxdWlyZXMgYSBwcm9qZWN0IHR5cGUgb2YgXCJhcHBsaWNhdGlvblwiLmApO1xuICAgIH1cblxuICAgIGNvbnN0IGNsaWVudEJ1aWxkVGFyZ2V0ID0gY2xpZW50UHJvamVjdC50YXJnZXRzLmdldCgnYnVpbGQnKTtcbiAgICBpZiAoIWNsaWVudEJ1aWxkVGFyZ2V0KSB7XG4gICAgICB0aHJvdyB0YXJnZXRCdWlsZE5vdEZvdW5kRXJyb3IoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGllbnRCdWlsZE9wdGlvbnMgPSAoY2xpZW50QnVpbGRUYXJnZXQub3B0aW9ucyB8fFxuICAgICAge30pIGFzIHVua25vd24gYXMgQnJvd3NlckJ1aWxkZXJPcHRpb25zO1xuXG4gICAgaWYgKCFvcHRpb25zLnNraXBJbnN0YWxsKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNTdGFuZGFsb25lID0gaXNTdGFuZGFsb25lQXBwKGhvc3QsIGNsaWVudEJ1aWxkT3B0aW9ucy5tYWluKTtcblxuICAgIGNvbnN0IHRlbXBsYXRlU291cmNlID0gYXBwbHkodXJsKGlzU3RhbmRhbG9uZSA/ICcuL2ZpbGVzL3N0YW5kYWxvbmUtc3JjJyA6ICcuL2ZpbGVzL3NyYycpLCBbXG4gICAgICBhcHBseVRlbXBsYXRlcyh7XG4gICAgICAgIC4uLnN0cmluZ3MsXG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIHN0cmlwVHNFeHRlbnNpb246IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXFwudHMkLywgJycpLFxuICAgICAgfSksXG4gICAgICBtb3ZlKGpvaW4obm9ybWFsaXplKGNsaWVudFByb2plY3Qucm9vdCksICdzcmMnKSksXG4gICAgXSk7XG5cbiAgICBjb25zdCBjbGllbnRUc0NvbmZpZyA9IG5vcm1hbGl6ZShjbGllbnRCdWlsZE9wdGlvbnMudHNDb25maWcpO1xuICAgIGNvbnN0IHRzQ29uZmlnRXh0ZW5kcyA9IGJhc2VuYW1lKGNsaWVudFRzQ29uZmlnKTtcbiAgICBjb25zdCB0c0NvbmZpZ0RpcmVjdG9yeSA9IGRpcm5hbWUoY2xpZW50VHNDb25maWcpO1xuXG4gICAgY29uc3Qgcm9vdFNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcy9yb290JyksIFtcbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtcbiAgICAgICAgLi4uc3RyaW5ncyxcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc3RyaXBUc0V4dGVuc2lvbjogKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9cXC50cyQvLCAnJyksXG4gICAgICAgIHRzQ29uZmlnRXh0ZW5kcyxcbiAgICAgICAgaGFzTG9jYWxpemVQYWNrYWdlOiAhIWdldFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCAnQGFuZ3VsYXIvbG9jYWxpemUnKSxcbiAgICAgICAgcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290OiByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3QodHNDb25maWdEaXJlY3RvcnkpLFxuICAgICAgfSksXG4gICAgICBtb3ZlKHRzQ29uZmlnRGlyZWN0b3J5KSxcbiAgICBdKTtcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICBtZXJnZVdpdGgodGVtcGxhdGVTb3VyY2UpLFxuICAgICAgbWVyZ2VXaXRoKHJvb3RTb3VyY2UpLFxuICAgICAgYWRkRGVwZW5kZW5jaWVzKCksXG4gICAgICB1cGRhdGVDb25maWdGaWxlKG9wdGlvbnMsIHRzQ29uZmlnRGlyZWN0b3J5KSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==