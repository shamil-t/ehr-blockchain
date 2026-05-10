"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const standalone_1 = require("../private/standalone");
const ts = __importStar(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const utility_1 = require("../utility");
const ast_utils_1 = require("../utility/ast-utils");
const change_1 = require("../utility/change");
const dependencies_1 = require("../utility/dependencies");
const ng_ast_utils_1 = require("../utility/ng-ast-utils");
const paths_1 = require("../utility/paths");
const project_targets_1 = require("../utility/project-targets");
function addDependencies() {
    return (host, context) => {
        const packageName = '@angular/service-worker';
        context.logger.debug(`adding dependency (${packageName})`);
        const coreDep = (0, dependencies_1.getPackageJsonDependency)(host, '@angular/core');
        if (coreDep === null) {
            throw new schematics_1.SchematicsException('Could not find version.');
        }
        const serviceWorkerDep = {
            ...coreDep,
            name: packageName,
        };
        (0, dependencies_1.addPackageJsonDependency)(host, serviceWorkerDep);
        return host;
    };
}
function updateAppModule(mainPath) {
    return (host, context) => {
        context.logger.debug('Updating appmodule');
        const modulePath = (0, ng_ast_utils_1.getAppModulePath)(host, mainPath);
        context.logger.debug(`module path: ${modulePath}`);
        addImport(host, modulePath, 'ServiceWorkerModule', '@angular/service-worker');
        addImport(host, modulePath, 'isDevMode', '@angular/core');
        // register SW in application module
        const importText = core_1.tags.stripIndent `
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })
    `;
        const moduleSource = getTsSourceFile(host, modulePath);
        const metadataChanges = (0, ast_utils_1.addSymbolToNgModuleMetadata)(moduleSource, modulePath, 'imports', importText);
        if (metadataChanges) {
            const recorder = host.beginUpdate(modulePath);
            (0, change_1.applyToUpdateRecorder)(recorder, metadataChanges);
            host.commitUpdate(recorder);
        }
        return host;
    };
}
function addProvideServiceWorker(mainPath) {
    return (host) => {
        const updatedFilePath = (0, standalone_1.addFunctionalProvidersToStandaloneBootstrap)(host, mainPath, 'provideServiceWorker', '@angular/service-worker', [
            ts.factory.createStringLiteral('ngsw-worker.js', true),
            ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(ts.factory.createIdentifier('enabled'), ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, ts.factory.createCallExpression(ts.factory.createIdentifier('isDevMode'), undefined, []))),
                ts.factory.createPropertyAssignment(ts.factory.createIdentifier('registrationStrategy'), ts.factory.createStringLiteral('registerWhenStable:30000', true)),
            ], true),
        ]);
        addImport(host, updatedFilePath, 'isDevMode', '@angular/core');
        return host;
    };
}
function getTsSourceFile(host, path) {
    const content = host.readText(path);
    const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
    return source;
}
function default_1(options) {
    return async (host, context) => {
        const workspace = await (0, utility_1.readWorkspace)(host);
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Invalid project name (${options.project})`);
        }
        if (project.extensions.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`Service worker requires a project type of "application".`);
        }
        const buildTarget = project.targets.get('build');
        if (!buildTarget) {
            throw (0, project_targets_1.targetBuildNotFoundError)();
        }
        const buildOptions = (buildTarget.options || {});
        const root = project.root;
        buildOptions.serviceWorker = true;
        buildOptions.ngswConfigPath = (0, core_1.join)((0, core_1.normalize)(root), 'ngsw-config.json');
        let { resourcesOutputPath = '' } = buildOptions;
        if (resourcesOutputPath) {
            resourcesOutputPath = (0, core_1.normalize)(`/${resourcesOutputPath}`);
        }
        context.addTask(new tasks_1.NodePackageInstallTask());
        await (0, utility_1.writeWorkspace)(host, workspace);
        const { main } = buildOptions;
        return (0, schematics_1.chain)([
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
                (0, schematics_1.applyTemplates)({
                    ...options,
                    resourcesOutputPath,
                    relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(project.root),
                }),
                (0, schematics_1.move)(project.root),
            ])),
            addDependencies(),
            (0, ng_ast_utils_1.isStandaloneApp)(host, main) ? addProvideServiceWorker(main) : updateAppModule(main),
        ]);
    };
}
exports.default = default_1;
function addImport(host, filePath, symbolName, moduleName) {
    const moduleSource = getTsSourceFile(host, filePath);
    const change = (0, ast_utils_1.insertImport)(moduleSource, filePath, symbolName, moduleName);
    if (change) {
        const recorder = host.beginUpdate(filePath);
        (0, change_1.applyToUpdateRecorder)(recorder, [change]);
        host.commitUpdate(recorder);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvc2VydmljZS13b3JrZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUE2RDtBQUM3RCwyREFXb0M7QUFDcEMsNERBQTBFO0FBQzFFLHNEQUFvRjtBQUNwRixrR0FBb0Y7QUFDcEYsd0NBQTJEO0FBQzNELG9EQUFpRjtBQUNqRiw4Q0FBMEQ7QUFDMUQsMERBQTZGO0FBQzdGLDBEQUE0RTtBQUM1RSw0Q0FBK0Q7QUFDL0QsZ0VBQXNFO0FBSXRFLFNBQVMsZUFBZTtJQUN0QixPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUMvQyxNQUFNLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQztRQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsV0FBVyxHQUFHLENBQUMsQ0FBQztRQUMzRCxNQUFNLE9BQU8sR0FBRyxJQUFBLHVDQUF3QixFQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNoRSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDMUQ7UUFDRCxNQUFNLGdCQUFnQixHQUFHO1lBQ3ZCLEdBQUcsT0FBTztZQUNWLElBQUksRUFBRSxXQUFXO1NBQ2xCLENBQUM7UUFDRixJQUFBLHVDQUF3QixFQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRWpELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLFFBQWdCO0lBQ3ZDLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1FBQy9DLE9BQU8sQ0FBQyxN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QUMsQ0FBQztLQUM3QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgam9pbiwgbm9ybWFsaXplLCB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGFwcGx5VGVtcGxhdGVzLFxuICBjaGFpbixcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5pbXBvcnQgeyBhZGRGdW5jdGlvbmFsUHJvdmlkZXJzVG9TdGFuZGFsb25lQm9vdHN0cmFwIH0gZnJvbSAnLi4vcHJpdmF0ZS9zdGFuZGFsb25lJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJy4uL3RoaXJkX3BhcnR5L2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvbGliL3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgcmVhZFdvcmtzcGFjZSwgd3JpdGVXb3Jrc3BhY2UgfSBmcm9tICcuLi91dGlsaXR5JztcbmltcG9ydCB7IGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YSwgaW5zZXJ0SW1wb3J0IH0gZnJvbSAnLi4vdXRpbGl0eS9hc3QtdXRpbHMnO1xuaW1wb3J0IHsgYXBwbHlUb1VwZGF0ZVJlY29yZGVyIH0gZnJvbSAnLi4vdXRpbGl0eS9jaGFuZ2UnO1xuaW1wb3J0IHsgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5LCBnZXRQYWNrYWdlSnNvbkRlcGVuZGVuY3kgfSBmcm9tICcuLi91dGlsaXR5L2RlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBnZXRBcHBNb2R1bGVQYXRoLCBpc1N0YW5kYWxvbmVBcHAgfSBmcm9tICcuLi91dGlsaXR5L25nLWFzdC11dGlscyc7XG5pbXBvcnQgeyByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3QgfSBmcm9tICcuLi91dGlsaXR5L3BhdGhzJztcbmltcG9ydCB7IHRhcmdldEJ1aWxkTm90Rm91bmRFcnJvciB9IGZyb20gJy4uL3V0aWxpdHkvcHJvamVjdC10YXJnZXRzJztcbmltcG9ydCB7IEJyb3dzZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlLW1vZGVscyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgU2VydmljZVdvcmtlck9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIGFkZERlcGVuZGVuY2llcygpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcGFja2FnZU5hbWUgPSAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXInO1xuICAgIGNvbnRleHQubG9nZ2VyLmRlYnVnKGBhZGRpbmcgZGVwZW5kZW5jeSAoJHtwYWNrYWdlTmFtZX0pYCk7XG4gICAgY29uc3QgY29yZURlcCA9IGdldFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCAnQGFuZ3VsYXIvY29yZScpO1xuICAgIGlmIChjb3JlRGVwID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQ291bGQgbm90IGZpbmQgdmVyc2lvbi4nKTtcbiAgICB9XG4gICAgY29uc3Qgc2VydmljZVdvcmtlckRlcCA9IHtcbiAgICAgIC4uLmNvcmVEZXAsXG4gICAgICBuYW1lOiBwYWNrYWdlTmFtZSxcbiAgICB9O1xuICAgIGFkZFBhY2thZ2VKc29uRGVwZW5kZW5jeShob3N0LCBzZXJ2aWNlV29ya2VyRGVwKTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBcHBNb2R1bGUobWFpblBhdGg6IHN0cmluZyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LmxvZ2dlci5kZWJ1ZygnVXBkYXRpbmcgYXBwbW9kdWxlJyk7XG5cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gZ2V0QXBwTW9kdWxlUGF0aChob3N0LCBtYWluUGF0aCk7XG4gICAgY29udGV4dC5sb2dnZXIuZGVidWcoYG1vZHVsZSBwYXRoOiAke21vZHVsZVBhdGh9YCk7XG5cbiAgICBhZGRJbXBvcnQoaG9zdCwgbW9kdWxlUGF0aCwgJ1NlcnZpY2VXb3JrZXJNb2R1bGUnLCAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXInKTtcbiAgICBhZGRJbXBvcnQoaG9zdCwgbW9kdWxlUGF0aCwgJ2lzRGV2TW9kZScsICdAYW5ndWxhci9jb3JlJyk7XG5cbiAgICAvLyByZWdpc3RlciBTVyBpbiBhcHBsaWNhdGlvbiBtb2R1bGVcbiAgICBjb25zdCBpbXBvcnRUZXh0ID0gdGFncy5zdHJpcEluZGVudGBcbiAgICAgIFNlcnZpY2VXb3JrZXJNb2R1bGUucmVnaXN0ZXIoJ25nc3ctd29ya2VyLmpzJywge1xuICAgICAgICBlbmFibGVkOiAhaXNEZXZNb2RlKCksXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBTZXJ2aWNlV29ya2VyIGFzIHNvb24gYXMgdGhlIGFwcGxpY2F0aW9uIGlzIHN0YWJsZVxuICAgICAgICAvLyBvciBhZnRlciAzMCBzZWNvbmRzICh3aGljaGV2ZXIgY29tZXMgZmlyc3QpLlxuICAgICAgICByZWdpc3RyYXRpb25TdHJhdGVneTogJ3JlZ2lzdGVyV2hlblN0YWJsZTozMDAwMCdcbiAgICAgIH0pXG4gICAgYDtcbiAgICBjb25zdCBtb2R1bGVTb3VyY2UgPSBnZXRUc1NvdXJjZUZpbGUoaG9zdCwgbW9kdWxlUGF0aCk7XG4gICAgY29uc3QgbWV0YWRhdGFDaGFuZ2VzID0gYWRkU3ltYm9sVG9OZ01vZHVsZU1ldGFkYXRhKFxuICAgICAgbW9kdWxlU291cmNlLFxuICAgICAgbW9kdWxlUGF0aCxcbiAgICAgICdpbXBvcnRzJyxcbiAgICAgIGltcG9ydFRleHQsXG4gICAgKTtcbiAgICBpZiAobWV0YWRhdGFDaGFuZ2VzKSB7XG4gICAgICBjb25zdCByZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgICBhcHBseVRvVXBkYXRlUmVjb3JkZXIocmVjb3JkZXIsIG1ldGFkYXRhQ2hhbmdlcyk7XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZFByb3ZpZGVTZXJ2aWNlV29ya2VyKG1haW5QYXRoOiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlKSA9PiB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVQYXRoID0gYWRkRnVuY3Rpb25hbFByb3ZpZGVyc1RvU3RhbmRhbG9uZUJvb3RzdHJhcChcbiAgICAgIGhvc3QsXG4gICAgICBtYWluUGF0aCxcbiAgICAgICdwcm92aWRlU2VydmljZVdvcmtlcicsXG4gICAgICAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXInLFxuICAgICAgW1xuICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZVN0cmluZ0xpdGVyYWwoJ25nc3ctd29ya2VyLmpzJywgdHJ1ZSksXG4gICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oXG4gICAgICAgICAgW1xuICAgICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcignZW5hYmxlZCcpLFxuICAgICAgICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZVByZWZpeFVuYXJ5RXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICB0cy5TeW50YXhLaW5kLkV4Y2xhbWF0aW9uVG9rZW4sXG4gICAgICAgICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVDYWxsRXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcignaXNEZXZNb2RlJyksXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoJ3JlZ2lzdHJhdGlvblN0cmF0ZWd5JyksXG4gICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbCgncmVnaXN0ZXJXaGVuU3RhYmxlOjMwMDAwJywgdHJ1ZSksXG4gICAgICAgICAgICApLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgKTtcblxuICAgIGFkZEltcG9ydChob3N0LCB1cGRhdGVkRmlsZVBhdGgsICdpc0Rldk1vZGUnLCAnQGFuZ3VsYXIvY29yZScpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFRzU291cmNlRmlsZShob3N0OiBUcmVlLCBwYXRoOiBzdHJpbmcpOiB0cy5Tb3VyY2VGaWxlIHtcbiAgY29uc3QgY29udGVudCA9IGhvc3QucmVhZFRleHQocGF0aCk7XG4gIGNvbnN0IHNvdXJjZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUocGF0aCwgY29udGVudCwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG5cbiAgcmV0dXJuIHNvdXJjZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFNlcnZpY2VXb3JrZXJPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IHJlYWRXb3Jrc3BhY2UoaG9zdCk7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQob3B0aW9ucy5wcm9qZWN0KTtcbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBJbnZhbGlkIHByb2plY3QgbmFtZSAoJHtvcHRpb25zLnByb2plY3R9KWApO1xuICAgIH1cbiAgICBpZiAocHJvamVjdC5leHRlbnNpb25zLnByb2plY3RUeXBlICE9PSAnYXBwbGljYXRpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgU2VydmljZSB3b3JrZXIgcmVxdWlyZXMgYSBwcm9qZWN0IHR5cGUgb2YgXCJhcHBsaWNhdGlvblwiLmApO1xuICAgIH1cbiAgICBjb25zdCBidWlsZFRhcmdldCA9IHByb2plY3QudGFyZ2V0cy5nZXQoJ2J1aWxkJyk7XG4gICAgaWYgKCFidWlsZFRhcmdldCkge1xuICAgICAgdGhyb3cgdGFyZ2V0QnVpbGROb3RGb3VuZEVycm9yKCk7XG4gICAgfVxuICAgIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IChidWlsZFRhcmdldC5vcHRpb25zIHx8IHt9KSBhcyB1bmtub3duIGFzIEJyb3dzZXJCdWlsZGVyT3B0aW9ucztcbiAgICBjb25zdCByb290ID0gcHJvamVjdC5yb290O1xuICAgIGJ1aWxkT3B0aW9ucy5zZXJ2aWNlV29ya2VyID0gdHJ1ZTtcbiAgICBidWlsZE9wdGlvbnMubmdzd0NvbmZpZ1BhdGggPSBqb2luKG5vcm1hbGl6ZShyb290KSwgJ25nc3ctY29uZmlnLmpzb24nKTtcblxuICAgIGxldCB7IHJlc291cmNlc091dHB1dFBhdGggPSAnJyB9ID0gYnVpbGRPcHRpb25zO1xuICAgIGlmIChyZXNvdXJjZXNPdXRwdXRQYXRoKSB7XG4gICAgICByZXNvdXJjZXNPdXRwdXRQYXRoID0gbm9ybWFsaXplKGAvJHtyZXNvdXJjZXNPdXRwdXRQYXRofWApO1xuICAgIH1cblxuICAgIGNvbnRleHQuYWRkVGFzayhuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzaygpKTtcblxuICAgIGF3YWl0IHdyaXRlV29ya3NwYWNlKGhvc3QsIHdvcmtzcGFjZSk7XG5cbiAgICBjb25zdCB7IG1haW4gfSA9IGJ1aWxkT3B0aW9ucztcblxuICAgIHJldHVybiBjaGFpbihbXG4gICAgICBtZXJnZVdpdGgoXG4gICAgICAgIGFwcGx5KHVybCgnLi9maWxlcycpLCBbXG4gICAgICAgICAgYXBwbHlUZW1wbGF0ZXMoe1xuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIHJlc291cmNlc091dHB1dFBhdGgsXG4gICAgICAgICAgICByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3Q6IHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdChwcm9qZWN0LnJvb3QpLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG1vdmUocHJvamVjdC5yb290KSxcbiAgICAgICAgXSksXG4gICAgICApLFxuICAgICAgYWRkRGVwZW5kZW5jaWVzKCksXG4gICAgICBpc1N0YW5kYWxvbmVBcHAoaG9zdCwgbWFpbikgPyBhZGRQcm92aWRlU2VydmljZVdvcmtlcihtYWluKSA6IHVwZGF0ZUFwcE1vZHVsZShtYWluKSxcbiAgICBdKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkSW1wb3J0KGhvc3Q6IFRyZWUsIGZpbGVQYXRoOiBzdHJpbmcsIHN5bWJvbE5hbWU6IHN0cmluZywgbW9kdWxlTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IG1vZHVsZVNvdXJjZSA9IGdldFRzU291cmNlRmlsZShob3N0LCBmaWxlUGF0aCk7XG4gIGNvbnN0IGNoYW5nZSA9IGluc2VydEltcG9ydChtb2R1bGVTb3VyY2UsIGZpbGVQYXRoLCBzeW1ib2xOYW1lLCBtb2R1bGVOYW1lKTtcblxuICBpZiAoY2hhbmdlKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICBhcHBseVRvVXBkYXRlUmVjb3JkZXIocmVjb3JkZXIsIFtjaGFuZ2VdKTtcbiAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG4gIH1cbn1cbiJdfQ==