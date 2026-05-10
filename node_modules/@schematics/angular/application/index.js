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
const paths_1 = require("../utility/paths");
const workspace_1 = require("../utility/workspace");
const workspace_models_1 = require("../utility/workspace-models");
const schema_1 = require("./schema");
function default_1(options) {
    return async (host, context) => {
        const { appDir, appRootSelector, componentOptions, folderName, sourceDir } = await getAppOptions(host, options);
        if (options.standalone) {
            context.logger.warn('Standalone application structure is new and not yet supported by many existing' +
                ` 'ng add' and 'ng update' integrations with community libraries.`);
        }
        return (0, schematics_1.chain)([
            addAppToWorkspaceFile(options, appDir, folderName),
            options.standalone
                ? (0, schematics_1.noop)()
                : (0, schematics_1.schematic)('module', {
                    name: 'app',
                    commonModule: false,
                    flat: true,
                    routing: options.routing,
                    routingScope: 'Root',
                    path: sourceDir,
                    project: options.name,
                }),
            (0, schematics_1.schematic)('component', {
                name: 'app',
                selector: appRootSelector,
                flat: true,
                path: sourceDir,
                skipImport: true,
                project: options.name,
                ...componentOptions,
            }),
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)(options.standalone ? './files/standalone-files' : './files/module-files'), [
                options.routing ? (0, schematics_1.noop)() : (0, schematics_1.filter)((path) => !path.endsWith('app.routes.ts.template')),
                componentOptions.skipTests
                    ? (0, schematics_1.filter)((path) => !path.endsWith('.spec.ts.template'))
                    : (0, schematics_1.noop)(),
                (0, schematics_1.applyTemplates)({
                    utils: schematics_1.strings,
                    ...options,
                    ...componentOptions,
                    selector: appRootSelector,
                    relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(appDir),
                    appName: options.name,
                    folderName,
                }),
                (0, schematics_1.move)(appDir),
            ]), schematics_1.MergeStrategy.Overwrite),
            (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files/common-files'), [
                options.minimal
                    ? (0, schematics_1.filter)((path) => !path.endsWith('tsconfig.spec.json.template'))
                    : (0, schematics_1.noop)(),
                componentOptions.inlineTemplate
                    ? (0, schematics_1.filter)((path) => !path.endsWith('component.html.template'))
                    : (0, schematics_1.noop)(),
                (0, schematics_1.applyTemplates)({
                    utils: schematics_1.strings,
                    ...options,
                    selector: appRootSelector,
                    relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(appDir),
                    appName: options.name,
                    folderName,
                }),
                (0, schematics_1.move)(appDir),
            ]), schematics_1.MergeStrategy.Overwrite),
            options.skipPackageJson ? (0, schematics_1.noop)() : addDependenciesToPackageJson(options),
        ]);
    };
}
exports.default = default_1;
function addDependenciesToPackageJson(options) {
    return (host, context) => {
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
                name: 'typescript',
                version: latest_versions_1.latestVersions['typescript'],
            },
        ].forEach((dependency) => (0, dependencies_1.addPackageJsonDependency)(host, dependency));
        if (!options.skipInstall) {
            context.addTask(new tasks_1.NodePackageInstallTask());
        }
        return host;
    };
}
function addAppToWorkspaceFile(options, appDir, folderName) {
    let projectRoot = appDir;
    if (projectRoot) {
        projectRoot += '/';
    }
    const schematics = {};
    if (options.inlineTemplate ||
        options.inlineStyle ||
        options.minimal ||
        options.style !== schema_1.Style.Css) {
        const componentSchematicsOptions = {};
        if (options.inlineTemplate ?? options.minimal) {
            componentSchematicsOptions.inlineTemplate = true;
        }
        if (options.inlineStyle ?? options.minimal) {
            componentSchematicsOptions.inlineStyle = true;
        }
        if (options.style && options.style !== schema_1.Style.Css) {
            componentSchematicsOptions.style = options.style;
        }
        schematics['@schematics/angular:component'] = componentSchematicsOptions;
    }
    if (options.skipTests || options.minimal) {
        const schematicsWithTests = [
            'class',
            'component',
            'directive',
            'guard',
            'interceptor',
            'pipe',
            'resolver',
            'service',
        ];
        schematicsWithTests.forEach((type) => {
            if (!(`@schematics/angular:${type}` in schematics)) {
                schematics[`@schematics/angular:${type}`] = {};
            }
            schematics[`@schematics/angular:${type}`].skipTests = true;
        });
    }
    if (options.standalone) {
        const schematicsWithStandalone = ['component', 'directive', 'pipe'];
        schematicsWithStandalone.forEach((type) => {
            if (!(`@schematics/angular:${type}` in schematics)) {
                schematics[`@schematics/angular:${type}`] = {};
            }
            schematics[`@schematics/angular:${type}`].standalone = true;
        });
    }
    const sourceRoot = (0, core_1.join)((0, core_1.normalize)(projectRoot), 'src');
    let budgets = [];
    if (options.strict) {
        budgets = [
            {
                type: 'initial',
                maximumWarning: '500kb',
                maximumError: '1mb',
            },
            {
                type: 'anyComponentStyle',
                maximumWarning: '2kb',
                maximumError: '4kb',
            },
        ];
    }
    else {
        budgets = [
            {
                type: 'initial',
                maximumWarning: '2mb',
                maximumError: '5mb',
            },
            {
                type: 'anyComponentStyle',
                maximumWarning: '6kb',
                maximumError: '10kb',
            },
        ];
    }
    const inlineStyleLanguage = options?.style !== schema_1.Style.Css ? options.style : undefined;
    const project = {
        root: (0, core_1.normalize)(projectRoot),
        sourceRoot,
        projectType: workspace_models_1.ProjectType.Application,
        prefix: options.prefix || 'app',
        schematics,
        targets: {
            build: {
                builder: workspace_models_1.Builders.Browser,
                defaultConfiguration: 'production',
                options: {
                    outputPath: `dist/${folderName}`,
                    index: `${sourceRoot}/index.html`,
                    main: `${sourceRoot}/main.ts`,
                    polyfills: ['zone.js'],
                    tsConfig: `${projectRoot}tsconfig.app.json`,
                    inlineStyleLanguage,
                    assets: [`${sourceRoot}/favicon.ico`, `${sourceRoot}/assets`],
                    styles: [`${sourceRoot}/styles.${options.style}`],
                    scripts: [],
                },
                configurations: {
                    production: {
                        budgets,
                        outputHashing: 'all',
                    },
                    development: {
                        buildOptimizer: false,
                        optimization: false,
                        vendorChunk: true,
                        extractLicenses: false,
                        sourceMap: true,
                        namedChunks: true,
                    },
                },
            },
            serve: {
                builder: workspace_models_1.Builders.DevServer,
                defaultConfiguration: 'development',
                options: {},
                configurations: {
                    production: {
                        browserTarget: `${options.name}:build:production`,
                    },
                    development: {
                        browserTarget: `${options.name}:build:development`,
                    },
                },
            },
            'extract-i18n': {
                builder: workspace_models_1.Builders.ExtractI18n,
                options: {
                    browserTarget: `${options.name}:build`,
                },
            },
            test: options.minimal
                ? undefined
                : {
                    builder: workspace_models_1.Builders.Karma,
                    options: {
                        polyfills: ['zone.js', 'zone.js/testing'],
                        tsConfig: `${projectRoot}tsconfig.spec.json`,
                        inlineStyleLanguage,
                        assets: [`${sourceRoot}/favicon.ico`, `${sourceRoot}/assets`],
                        styles: [`${sourceRoot}/styles.${options.style}`],
                        scripts: [],
                    },
                },
        },
    };
    return (0, workspace_1.updateWorkspace)((workspace) => {
        workspace.projects.add({
            name: options.name,
            ...project,
        });
    });
}
async function getAppOptions(host, options) {
    const appRootSelector = `${options.prefix}-root`;
    const componentOptions = getComponentOptions(options);
    const workspace = await (0, workspace_1.getWorkspace)(host);
    const newProjectRoot = workspace.extensions.newProjectRoot || '';
    // If scoped project (i.e. "@foo/bar"), convert dir to "foo/bar".
    let folderName = options.name.startsWith('@') ? options.name.slice(1) : options.name;
    if (/[A-Z]/.test(folderName)) {
        folderName = schematics_1.strings.dasherize(folderName);
    }
    const appDir = options.projectRoot === undefined
        ? (0, core_1.join)((0, core_1.normalize)(newProjectRoot), folderName)
        : (0, core_1.normalize)(options.projectRoot);
    const sourceDir = `${appDir}/src/app`;
    return {
        appDir,
        appRootSelector,
        componentOptions,
        folderName,
        sourceDir,
    };
}
function getComponentOptions(options) {
    const componentOptions = !options.minimal
        ? {
            inlineStyle: options.inlineStyle,
            inlineTemplate: options.inlineTemplate,
            skipTests: options.skipTests,
            style: options.style,
            viewEncapsulation: options.viewEncapsulation,
        }
        : {
            inlineStyle: options.inlineStyle ?? true,
            inlineTemplate: options.inlineTemplate ?? true,
            skipTests: true,
            style: options.style,
            viewEncapsulation: options.viewEncapsulation,
        };
    return componentOptions;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvYXBwbGljYXRpb24vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQ0FBbUU7QUFDbkUsMkRBZW9DO0FBQ3BDLDREQUEwRTtBQUUxRSwwREFBdUY7QUFDdkYsZ0VBQTREO0FBQzVELDRDQUErRDtBQUMvRCxvREFBcUU7QUFDckUsa0VBQW9FO0FBQ3BFLHFDQUErRDtBQUUvRCxtQkFBeUIsT0FBMkI7SUFDbEQsT0FBTyxLQUFLLEVBQUUsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNyRCxNQUFNLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEdBQ3hFLE1BQU0sYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVyQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDdEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2pCLGdGQUFnRjtnQkFDOUUsa0VBQWtFLENBQ3JFLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBQSxrQkFBSyxFQUFDO1lBQ1gscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUM7WUFDbEQsT0FBTyxDQUFDLFVBQVU7Z0JBQ2hCLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUU7Z0JBQ1IsQ0FBQyxDQUFDLElBQUEsc0JBQVMsRUFBQyxRQUFRLEVBQUU7b0JBQ2xCLElBQUksRUFBRSxLQUFLO29CQUNYLFlBQVksRUFBRSxLQUFLO29CQUNuQixJQUFJLEVBQUUsSUFBSTtvQkFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87b0JBQ3hCLFlBQVksRUFBRSxNQUFNO29CQUNwQixJQUFJLEVBQUUsU0FBUztvQkFDZixPQUFPLEVBQUUsT0FB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QUM3QztRQUNILENBQUMsQ0FBQztZQUNFLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLElBQUk7WUFDeEMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjLElBQUksSUFBSTtZQUM5QyxTQUFTLEVBQUUsSUFBSTtZQUNmLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixpQkFBaUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCO1NBQzdDLENBQUM7SUFFTixPQUFPLGdCQUFnQixDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgSnNvbk9iamVjdCwgam9pbiwgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgTWVyZ2VTdHJhdGVneSxcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgVHJlZSxcbiAgYXBwbHksXG4gIGFwcGx5VGVtcGxhdGVzLFxuICBjaGFpbixcbiAgZmlsdGVyLFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIHNjaGVtYXRpYyxcbiAgc3RyaW5ncyxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZUluc3RhbGxUYXNrIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIENvbXBvbmVudE9wdGlvbnMgfSBmcm9tICcuLi9jb21wb25lbnQvc2NoZW1hJztcbmltcG9ydCB7IE5vZGVEZXBlbmRlbmN5VHlwZSwgYWRkUGFja2FnZUpzb25EZXBlbmRlbmN5IH0gZnJvbSAnLi4vdXRpbGl0eS9kZXBlbmRlbmNpZXMnO1xuaW1wb3J0IHsgbGF0ZXN0VmVyc2lvbnMgfSBmcm9tICcuLi91dGlsaXR5L2xhdGVzdC12ZXJzaW9ucyc7XG5pbXBvcnQgeyByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3QgfSBmcm9tICcuLi91dGlsaXR5L3BhdGhzJztcbmltcG9ydCB7IGdldFdvcmtzcGFjZSwgdXBkYXRlV29ya3NwYWNlIH0gZnJvbSAnLi4vdXRpbGl0eS93b3Jrc3BhY2UnO1xuaW1wb3J0IHsgQnVpbGRlcnMsIFByb2plY3RUeXBlIH0gZnJvbSAnLi4vdXRpbGl0eS93b3Jrc3BhY2UtbW9kZWxzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBBcHBsaWNhdGlvbk9wdGlvbnMsIFN0eWxlIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogQXBwbGljYXRpb25PcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHsgYXBwRGlyLCBhcHBSb290U2VsZWN0b3IsIGNvbXBvbmVudE9wdGlvbnMsIGZvbGRlck5hbWUsIHNvdXJjZURpciB9ID1cbiAgICAgIGF3YWl0IGdldEFwcE9wdGlvbnMoaG9zdCwgb3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5zdGFuZGFsb25lKSB7XG4gICAgICBjb250ZXh0LmxvZ2dlci53YXJuKFxuICAgICAgICAnU3RhbmRhbG9uZSBhcHBsaWNhdGlvbiBzdHJ1Y3R1cmUgaXMgbmV3IGFuZCBub3QgeWV0IHN1cHBvcnRlZCBieSBtYW55IGV4aXN0aW5nJyArXG4gICAgICAgICAgYCAnbmcgYWRkJyBhbmQgJ25nIHVwZGF0ZScgaW50ZWdyYXRpb25zIHdpdGggY29tbXVuaXR5IGxpYnJhcmllcy5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYWRkQXBwVG9Xb3Jrc3BhY2VGaWxlKG9wdGlvbnMsIGFwcERpciwgZm9sZGVyTmFtZSksXG4gICAgICBvcHRpb25zLnN0YW5kYWxvbmVcbiAgICAgICAgPyBub29wKClcbiAgICAgICAgOiBzY2hlbWF0aWMoJ21vZHVsZScsIHtcbiAgICAgICAgICAgIG5hbWU6ICdhcHAnLFxuICAgICAgICAgICAgY29tbW9uTW9kdWxlOiBmYWxzZSxcbiAgICAgICAgICAgIGZsYXQ6IHRydWUsXG4gICAgICAgICAgICByb3V0aW5nOiBvcHRpb25zLnJvdXRpbmcsXG4gICAgICAgICAgICByb3V0aW5nU2NvcGU6ICdSb290JyxcbiAgICAgICAgICAgIHBhdGg6IHNvdXJjZURpcixcbiAgICAgICAgICAgIHByb2plY3Q6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgICB9KSxcbiAgICAgIHNjaGVtYXRpYygnY29tcG9uZW50Jywge1xuICAgICAgICBuYW1lOiAnYXBwJyxcbiAgICAgICAgc2VsZWN0b3I6IGFwcFJvb3RTZWxlY3RvcixcbiAgICAgICAgZmxhdDogdHJ1ZSxcbiAgICAgICAgcGF0aDogc291cmNlRGlyLFxuICAgICAgICBza2lwSW1wb3J0OiB0cnVlLFxuICAgICAgICBwcm9qZWN0OiBvcHRpb25zLm5hbWUsXG4gICAgICAgIC4uLmNvbXBvbmVudE9wdGlvbnMsXG4gICAgICB9KSxcbiAgICAgIG1lcmdlV2l0aChcbiAgICAgICAgYXBwbHkodXJsKG9wdGlvbnMuc3RhbmRhbG9uZSA/ICcuL2ZpbGVzL3N0YW5kYWxvbmUtZmlsZXMnIDogJy4vZmlsZXMvbW9kdWxlLWZpbGVzJyksIFtcbiAgICAgICAgICBvcHRpb25zLnJvdXRpbmcgPyBub29wKCkgOiBmaWx0ZXIoKHBhdGgpID0+ICFwYXRoLmVuZHNXaXRoKCdhcHAucm91dGVzLnRzLnRlbXBsYXRlJykpLFxuICAgICAgICAgIGNvbXBvbmVudE9wdGlvbnMuc2tpcFRlc3RzXG4gICAgICAgICAgICA/IGZpbHRlcigocGF0aCkgPT4gIXBhdGguZW5kc1dpdGgoJy5zcGVjLnRzLnRlbXBsYXRlJykpXG4gICAgICAgICAgICA6IG5vb3AoKSxcbiAgICAgICAgICBhcHBseVRlbXBsYXRlcyh7XG4gICAgICAgICAgICB1dGlsczogc3RyaW5ncyxcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICAuLi5jb21wb25lbnRPcHRpb25zLFxuICAgICAgICAgICAgc2VsZWN0b3I6IGFwcFJvb3RTZWxlY3RvcixcbiAgICAgICAgICAgIHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdDogcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290KGFwcERpciksXG4gICAgICAgICAgICBhcHBOYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgICAgICBmb2xkZXJOYW1lLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG1vdmUoYXBwRGlyKSxcbiAgICAgICAgXSksXG4gICAgICAgIE1lcmdlU3RyYXRlZ3kuT3ZlcndyaXRlLFxuICAgICAgKSxcbiAgICAgIG1lcmdlV2l0aChcbiAgICAgICAgYXBwbHkodXJsKCcuL2ZpbGVzL2NvbW1vbi1maWxlcycpLCBbXG4gICAgICAgICAgb3B0aW9ucy5taW5pbWFsXG4gICAgICAgICAgICA/IGZpbHRlcigocGF0aCkgPT4gIXBhdGguZW5kc1dpdGgoJ3RzY29uZmlnLnNwZWMuanNvbi50ZW1wbGF0ZScpKVxuICAgICAgICAgICAgOiBub29wKCksXG4gICAgICAgICAgY29tcG9uZW50T3B0aW9ucy5pbmxpbmVUZW1wbGF0ZVxuICAgICAgICAgICAgPyBmaWx0ZXIoKHBhdGgpID0+ICFwYXRoLmVuZHNXaXRoKCdjb21wb25lbnQuaHRtbC50ZW1wbGF0ZScpKVxuICAgICAgICAgICAgOiBub29wKCksXG4gICAgICAgICAgYXBwbHlUZW1wbGF0ZXMoe1xuICAgICAgICAgICAgdXRpbHM6IHN0cmluZ3MsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgc2VsZWN0b3I6IGFwcFJvb3RTZWxlY3RvcixcbiAgICAgICAgICAgIHJlbGF0aXZlUGF0aFRvV29ya3NwYWNlUm9vdDogcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290KGFwcERpciksXG4gICAgICAgICAgICBhcHBOYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgICAgICBmb2xkZXJOYW1lLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG1vdmUoYXBwRGlyKSxcbiAgICAgICAgXSksXG4gICAgICAgIE1lcmdlU3RyYXRlZ3kuT3ZlcndyaXRlLFxuICAgICAgKSxcbiAgICAgIG9wdGlvbnMuc2tpcFBhY2thZ2VKc29uID8gbm9vcCgpIDogYWRkRGVwZW5kZW5jaWVzVG9QYWNrYWdlSnNvbihvcHRpb25zKSxcbiAgICBdKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkRGVwZW5kZW5jaWVzVG9QYWNrYWdlSnNvbihvcHRpb25zOiBBcHBsaWNhdGlvbk9wdGlvbnMpIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgW1xuICAgICAge1xuICAgICAgICB0eXBlOiBOb2RlRGVwZW5kZW5jeVR5cGUuRGV2LFxuICAgICAgICBuYW1lOiAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJyxcbiAgICAgICAgdmVyc2lvbjogbGF0ZXN0VmVyc2lvbnMuQW5ndWxhcixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcicsXG4gICAgICAgIHZlcnNpb246IGxhdGVzdFZlcnNpb25zLkRldmtpdEJ1aWxkQW5ndWxhcixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IE5vZGVEZXBlbmRlbmN5VHlwZS5EZXYsXG4gICAgICAgIG5hbWU6ICd0eXBlc2NyaXB0JyxcbiAgICAgICAgdmVyc2lvbjogbGF0ZXN0VmVyc2lvbnNbJ3R5cGVzY3JpcHQnXSxcbiAgICAgIH0sXG4gICAgXS5mb3JFYWNoKChkZXBlbmRlbmN5KSA9PiBhZGRQYWNrYWdlSnNvbkRlcGVuZGVuY3koaG9zdCwgZGVwZW5kZW5jeSkpO1xuXG4gICAgaWYgKCFvcHRpb25zLnNraXBJbnN0YWxsKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZEFwcFRvV29ya3NwYWNlRmlsZShcbiAgb3B0aW9uczogQXBwbGljYXRpb25PcHRpb25zLFxuICBhcHBEaXI6IHN0cmluZyxcbiAgZm9sZGVyTmFtZTogc3RyaW5nLFxuKTogUnVsZSB7XG4gIGxldCBwcm9qZWN0Um9vdCA9IGFwcERpcjtcbiAgaWYgKHByb2plY3RSb290KSB7XG4gICAgcHJvamVjdFJvb3QgKz0gJy8nO1xuICB9XG5cbiAgY29uc3Qgc2NoZW1hdGljczogSnNvbk9iamVjdCA9IHt9O1xuXG4gIGlmIChcbiAgICBvcHRpb25zLmlubGluZVRlbXBsYXRlIHx8XG4gICAgb3B0aW9ucy5pbmxpbmVTdHlsZSB8fFxuICAgIG9wdGlvbnMubWluaW1hbCB8fFxuICAgIG9wdGlvbnMuc3R5bGUgIT09IFN0eWxlLkNzc1xuICApIHtcbiAgICBjb25zdCBjb21wb25lbnRTY2hlbWF0aWNzT3B0aW9uczogSnNvbk9iamVjdCA9IHt9O1xuICAgIGlmIChvcHRpb25zLmlubGluZVRlbXBsYXRlID8/IG9wdGlvbnMubWluaW1hbCkge1xuICAgICAgY29tcG9uZW50U2NoZW1hdGljc09wdGlvbnMuaW5saW5lVGVtcGxhdGUgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5pbmxpbmVTdHlsZSA/PyBvcHRpb25zLm1pbmltYWwpIHtcbiAgICAgIGNvbXBvbmVudFNjaGVtYXRpY3NPcHRpb25zLmlubGluZVN0eWxlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuc3R5bGUgJiYgb3B0aW9ucy5zdHlsZSAhPT0gU3R5bGUuQ3NzKSB7XG4gICAgICBjb21wb25lbnRTY2hlbWF0aWNzT3B0aW9ucy5zdHlsZSA9IG9wdGlvbnMuc3R5bGU7XG4gICAgfVxuXG4gICAgc2NoZW1hdGljc1snQHNjaGVtYXRpY3MvYW5ndWxhcjpjb21wb25lbnQnXSA9IGNvbXBvbmVudFNjaGVtYXRpY3NPcHRpb25zO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuc2tpcFRlc3RzIHx8IG9wdGlvbnMubWluaW1hbCkge1xuICAgIGNvbnN0IHNjaGVtYXRpY3NXaXRoVGVzdHMgPSBbXG4gICAgICAnY2xhc3MnLFxuICAgICAgJ2NvbXBvbmVudCcsXG4gICAgICAnZGlyZWN0aXZlJyxcbiAgICAgICdndWFyZCcsXG4gICAgICAnaW50ZXJjZXB0b3InLFxuICAgICAgJ3BpcGUnLFxuICAgICAgJ3Jlc29sdmVyJyxcbiAgICAgICdzZXJ2aWNlJyxcbiAgICBdO1xuXG4gICAgc2NoZW1hdGljc1dpdGhUZXN0cy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICBpZiAoIShgQHNjaGVtYXRpY3MvYW5ndWxhcjoke3R5cGV9YCBpbiBzY2hlbWF0aWNzKSkge1xuICAgICAgICBzY2hlbWF0aWNzW2BAc2NoZW1hdGljcy9hbmd1bGFyOiR7dHlwZX1gXSA9IHt9O1xuICAgICAgfVxuICAgICAgKHNjaGVtYXRpY3NbYEBzY2hlbWF0aWNzL2FuZ3VsYXI6JHt0eXBlfWBdIGFzIEpzb25PYmplY3QpLnNraXBUZXN0cyA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5zdGFuZGFsb25lKSB7XG4gICAgY29uc3Qgc2NoZW1hdGljc1dpdGhTdGFuZGFsb25lID0gWydjb21wb25lbnQnLCAnZGlyZWN0aXZlJywgJ3BpcGUnXTtcbiAgICBzY2hlbWF0aWNzV2l0aFN0YW5kYWxvbmUuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgaWYgKCEoYEBzY2hlbWF0aWNzL2FuZ3VsYXI6JHt0eXBlfWAgaW4gc2NoZW1hdGljcykpIHtcbiAgICAgICAgc2NoZW1hdGljc1tgQHNjaGVtYXRpY3MvYW5ndWxhcjoke3R5cGV9YF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIChzY2hlbWF0aWNzW2BAc2NoZW1hdGljcy9hbmd1bGFyOiR7dHlwZX1gXSBhcyBKc29uT2JqZWN0KS5zdGFuZGFsb25lID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZVJvb3QgPSBqb2luKG5vcm1hbGl6ZShwcm9qZWN0Um9vdCksICdzcmMnKTtcbiAgbGV0IGJ1ZGdldHMgPSBbXTtcbiAgaWYgKG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgYnVkZ2V0cyA9IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2luaXRpYWwnLFxuICAgICAgICBtYXhpbXVtV2FybmluZzogJzUwMGtiJyxcbiAgICAgICAgbWF4aW11bUVycm9yOiAnMW1iJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdhbnlDb21wb25lbnRTdHlsZScsXG4gICAgICAgIG1heGltdW1XYXJuaW5nOiAnMmtiJyxcbiAgICAgICAgbWF4aW11bUVycm9yOiAnNGtiJyxcbiAgICAgIH0sXG4gICAgXTtcbiAgfSBlbHNlIHtcbiAgICBidWRnZXRzID0gW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnaW5pdGlhbCcsXG4gICAgICAgIG1heGltdW1XYXJuaW5nOiAnMm1iJyxcbiAgICAgICAgbWF4aW11bUVycm9yOiAnNW1iJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdhbnlDb21wb25lbnRTdHlsZScsXG4gICAgICAgIG1heGltdW1XYXJuaW5nOiAnNmtiJyxcbiAgICAgICAgbWF4aW11bUVycm9yOiAnMTBrYicsXG4gICAgICB9LFxuICAgIF07XG4gIH1cblxuICBjb25zdCBpbmxpbmVTdHlsZUxhbmd1YWdlID0gb3B0aW9ucz8uc3R5bGUgIT09IFN0eWxlLkNzcyA/IG9wdGlvbnMuc3R5bGUgOiB1bmRlZmluZWQ7XG5cbiAgY29uc3QgcHJvamVjdCA9IHtcbiAgICByb290OiBub3JtYWxpemUocHJvamVjdFJvb3QpLFxuICAgIHNvdXJjZVJvb3QsXG4gICAgcHJvamVjdFR5cGU6IFByb2plY3RUeXBlLkFwcGxpY2F0aW9uLFxuICAgIHByZWZpeDogb3B0aW9ucy5wcmVmaXggfHwgJ2FwcCcsXG4gICAgc2NoZW1hdGljcyxcbiAgICB0YXJnZXRzOiB7XG4gICAgICBidWlsZDoge1xuICAgICAgICBidWlsZGVyOiBCdWlsZGVycy5Ccm93c2VyLFxuICAgICAgICBkZWZhdWx0Q29uZmlndXJhdGlvbjogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgb3V0cHV0UGF0aDogYGRpc3QvJHtmb2xkZXJOYW1lfWAsXG4gICAgICAgICAgaW5kZXg6IGAke3NvdXJjZVJvb3R9L2luZGV4Lmh0bWxgLFxuICAgICAgICAgIG1haW46IGAke3NvdXJjZVJvb3R9L21haW4udHNgLFxuICAgICAgICAgIHBvbHlmaWxsczogWyd6b25lLmpzJ10sXG4gICAgICAgICAgdHNDb25maWc6IGAke3Byb2plY3RSb290fXRzY29uZmlnLmFwcC5qc29uYCxcbiAgICAgICAgICBpbmxpbmVTdHlsZUxhbmd1YWdlLFxuICAgICAgICAgIGFzc2V0czogW2Ake3NvdXJjZVJvb3R9L2Zhdmljb24uaWNvYCwgYCR7c291cmNlUm9vdH0vYXNzZXRzYF0sXG4gICAgICAgICAgc3R5bGVzOiBbYCR7c291cmNlUm9vdH0vc3R5bGVzLiR7b3B0aW9ucy5zdHlsZX1gXSxcbiAgICAgICAgICBzY3JpcHRzOiBbXSxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlndXJhdGlvbnM6IHtcbiAgICAgICAgICBwcm9kdWN0aW9uOiB7XG4gICAgICAgICAgICBidWRnZXRzLFxuICAgICAgICAgICAgb3V0cHV0SGFzaGluZzogJ2FsbCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZXZlbG9wbWVudDoge1xuICAgICAgICAgICAgYnVpbGRPcHRpbWl6ZXI6IGZhbHNlLFxuICAgICAgICAgICAgb3B0aW1pemF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIHZlbmRvckNodW5rOiB0cnVlLFxuICAgICAgICAgICAgZXh0cmFjdExpY2Vuc2VzOiBmYWxzZSxcbiAgICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgICAgIG5hbWVkQ2h1bmtzOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgc2VydmU6IHtcbiAgICAgICAgYnVpbGRlcjogQnVpbGRlcnMuRGV2U2VydmVyLFxuICAgICAgICBkZWZhdWx0Q29uZmlndXJhdGlvbjogJ2RldmVsb3BtZW50JyxcbiAgICAgICAgb3B0aW9uczoge30sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25zOiB7XG4gICAgICAgICAgcHJvZHVjdGlvbjoge1xuICAgICAgICAgICAgYnJvd3NlclRhcmdldDogYCR7b3B0aW9ucy5uYW1lfTpidWlsZDpwcm9kdWN0aW9uYCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRldmVsb3BtZW50OiB7XG4gICAgICAgICAgICBicm93c2VyVGFyZ2V0OiBgJHtvcHRpb25zLm5hbWV9OmJ1aWxkOmRldmVsb3BtZW50YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgICdleHRyYWN0LWkxOG4nOiB7XG4gICAgICAgIGJ1aWxkZXI6IEJ1aWxkZXJzLkV4dHJhY3RJMThuLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgYnJvd3NlclRhcmdldDogYCR7b3B0aW9ucy5uYW1lfTpidWlsZGAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGVzdDogb3B0aW9ucy5taW5pbWFsXG4gICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgIDoge1xuICAgICAgICAgICAgYnVpbGRlcjogQnVpbGRlcnMuS2FybWEsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIHBvbHlmaWxsczogWyd6b25lLmpzJywgJ3pvbmUuanMvdGVzdGluZyddLFxuICAgICAgICAgICAgICB0c0NvbmZpZzogYCR7cHJvamVjdFJvb3R9dHNjb25maWcuc3BlYy5qc29uYCxcbiAgICAgICAgICAgICAgaW5saW5lU3R5bGVMYW5ndWFnZSxcbiAgICAgICAgICAgICAgYXNzZXRzOiBbYCR7c291cmNlUm9vdH0vZmF2aWNvbi5pY29gLCBgJHtzb3VyY2VSb290fS9hc3NldHNgXSxcbiAgICAgICAgICAgICAgc3R5bGVzOiBbYCR7c291cmNlUm9vdH0vc3R5bGVzLiR7b3B0aW9ucy5zdHlsZX1gXSxcbiAgICAgICAgICAgICAgc2NyaXB0czogW10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gdXBkYXRlV29ya3NwYWNlKCh3b3Jrc3BhY2UpID0+IHtcbiAgICB3b3Jrc3BhY2UucHJvamVjdHMuYWRkKHtcbiAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgIC4uLnByb2plY3QsXG4gICAgfSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBcHBPcHRpb25zKFxuICBob3N0OiBUcmVlLFxuICBvcHRpb25zOiBBcHBsaWNhdGlvbk9wdGlvbnMsXG4pOiBQcm9taXNlPHtcbiAgYXBwRGlyOiBzdHJpbmc7XG4gIGFwcFJvb3RTZWxlY3Rvcjogc3RyaW5nO1xuICBjb21wb25lbnRPcHRpb25zOiBQYXJ0aWFsPENvbXBvbmVudE9wdGlvbnM+O1xuICBmb2xkZXJOYW1lOiBzdHJpbmc7XG4gIHNvdXJjZURpcjogc3RyaW5nO1xufT4ge1xuICBjb25zdCBhcHBSb290U2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tcm9vdGA7XG4gIGNvbnN0IGNvbXBvbmVudE9wdGlvbnMgPSBnZXRDb21wb25lbnRPcHRpb25zKG9wdGlvbnMpO1xuXG4gIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcbiAgY29uc3QgbmV3UHJvamVjdFJvb3QgPSAod29ya3NwYWNlLmV4dGVuc2lvbnMubmV3UHJvamVjdFJvb3QgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSB8fCAnJztcblxuICAvLyBJZiBzY29wZWQgcHJvamVjdCAoaS5lLiBcIkBmb28vYmFyXCIpLCBjb252ZXJ0IGRpciB0byBcImZvby9iYXJcIi5cbiAgbGV0IGZvbGRlck5hbWUgPSBvcHRpb25zLm5hbWUuc3RhcnRzV2l0aCgnQCcpID8gb3B0aW9ucy5uYW1lLnNsaWNlKDEpIDogb3B0aW9ucy5uYW1lO1xuICBpZiAoL1tBLVpdLy50ZXN0KGZvbGRlck5hbWUpKSB7XG4gICAgZm9sZGVyTmFtZSA9IHN0cmluZ3MuZGFzaGVyaXplKGZvbGRlck5hbWUpO1xuICB9XG5cbiAgY29uc3QgYXBwRGlyID1cbiAgICBvcHRpb25zLnByb2plY3RSb290ID09PSB1bmRlZmluZWRcbiAgICAgID8gam9pbihub3JtYWxpemUobmV3UHJvamVjdFJvb3QpLCBmb2xkZXJOYW1lKVxuICAgICAgOiBub3JtYWxpemUob3B0aW9ucy5wcm9qZWN0Um9vdCk7XG5cbiAgY29uc3Qgc291cmNlRGlyID0gYCR7YXBwRGlyfS9zcmMvYXBwYDtcblxuICByZXR1cm4ge1xuICAgIGFwcERpcixcbiAgICBhcHBSb290U2VsZWN0b3IsXG4gICAgY29tcG9uZW50T3B0aW9ucyxcbiAgICBmb2xkZXJOYW1lLFxuICAgIHNvdXJjZURpcixcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50T3B0aW9ucyhvcHRpb25zOiBBcHBsaWNhdGlvbk9wdGlvbnMpOiBQYXJ0aWFsPENvbXBvbmVudE9wdGlvbnM+IHtcbiAgY29uc3QgY29tcG9uZW50T3B0aW9uczogUGFydGlhbDxDb21wb25lbnRPcHRpb25zPiA9ICFvcHRpb25zLm1pbmltYWxcbiAgICA/IHtcbiAgICAgICAgaW5saW5lU3R5bGU6IG9wdGlvbnMuaW5saW5lU3R5bGUsXG4gICAgICAgIGlubGluZVRlbXBsYXRlOiBvcHRpb25zLmlubGluZVRlbXBsYXRlLFxuICAgICAgICBza2lwVGVzdHM6IG9wdGlvbnMuc2tpcFRlc3RzLFxuICAgICAgICBzdHlsZTogb3B0aW9ucy5zdHlsZSxcbiAgICAgICAgdmlld0VuY2Fwc3VsYXRpb246IG9wdGlvbnMudmlld0VuY2Fwc3VsYXRpb24sXG4gICAgICB9XG4gICAgOiB7XG4gICAgICAgIGlubGluZVN0eWxlOiBvcHRpb25zLmlubGluZVN0eWxlID8/IHRydWUsXG4gICAgICAgIGlubGluZVRlbXBsYXRlOiBvcHRpb25zLmlubGluZVRlbXBsYXRlID8/IHRydWUsXG4gICAgICAgIHNraXBUZXN0czogdHJ1ZSxcbiAgICAgICAgc3R5bGU6IG9wdGlvbnMuc3R5bGUsXG4gICAgICAgIHZpZXdFbmNhcHN1bGF0aW9uOiBvcHRpb25zLnZpZXdFbmNhcHN1bGF0aW9uLFxuICAgICAgfTtcblxuICByZXR1cm4gY29tcG9uZW50T3B0aW9ucztcbn1cbiJdfQ==