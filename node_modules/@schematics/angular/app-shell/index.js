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
const standalone_1 = require("../private/standalone");
const ts = __importStar(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const ast_utils_1 = require("../utility/ast-utils");
const change_1 = require("../utility/change");
const ng_ast_utils_1 = require("../utility/ng-ast-utils");
const project_targets_1 = require("../utility/project-targets");
const workspace_1 = require("../utility/workspace");
const workspace_models_1 = require("../utility/workspace-models");
function getSourceFile(host, path) {
    const content = host.readText(path);
    const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
    return source;
}
function getServerModulePath(host, sourceRoot, mainPath) {
    const mainSource = getSourceFile(host, (0, core_1.join)((0, core_1.normalize)(sourceRoot), mainPath));
    const allNodes = (0, ast_utils_1.getSourceNodes)(mainSource);
    const expNode = allNodes.find((node) => ts.isExportDeclaration(node));
    if (!expNode) {
        return null;
    }
    const relativePath = expNode.moduleSpecifier;
    const modulePath = (0, core_1.normalize)(`/${sourceRoot}/${relativePath.text}.ts`);
    return modulePath;
}
function getComponentTemplateInfo(host, componentPath) {
    const compSource = getSourceFile(host, componentPath);
    const compMetadata = (0, ast_utils_1.getDecoratorMetadata)(compSource, 'Component', '@angular/core')[0];
    return {
        templateProp: getMetadataProperty(compMetadata, 'template'),
        templateUrlProp: getMetadataProperty(compMetadata, 'templateUrl'),
    };
}
function getComponentTemplate(host, compPath, tmplInfo) {
    let template = '';
    if (tmplInfo.templateProp) {
        template = tmplInfo.templateProp.getFullText();
    }
    else if (tmplInfo.templateUrlProp) {
        const templateUrl = tmplInfo.templateUrlProp.initializer.text;
        const dir = (0, core_1.dirname)((0, core_1.normalize)(compPath));
        const templatePath = (0, core_1.join)(dir, templateUrl);
        try {
            template = host.readText(templatePath);
        }
        catch { }
    }
    return template;
}
function getBootstrapComponentPath(host, mainPath) {
    const mainSource = getSourceFile(host, mainPath);
    const bootstrapAppCall = (0, standalone_1.findBootstrapApplicationCall)(mainSource);
    let bootstrappingFilePath;
    let bootstrappingSource;
    let componentName;
    if (bootstrapAppCall) {
        // Standalone Application
        componentName = bootstrapAppCall.arguments[0].getText();
        bootstrappingFilePath = mainPath;
        bootstrappingSource = mainSource;
    }
    else {
        // NgModule Application
        const modulePath = (0, ng_ast_utils_1.getAppModulePath)(host, mainPath);
        const moduleSource = getSourceFile(host, modulePath);
        const metadataNode = (0, ast_utils_1.getDecoratorMetadata)(moduleSource, 'NgModule', '@angular/core')[0];
        const bootstrapProperty = getMetadataProperty(metadataNode, 'bootstrap');
        const arrLiteral = bootstrapProperty.initializer;
        componentName = arrLiteral.elements[0].getText();
        bootstrappingSource = moduleSource;
        bootstrappingFilePath = modulePath;
    }
    const componentRelativeFilePath = (0, ast_utils_1.getSourceNodes)(bootstrappingSource)
        .filter(ts.isImportDeclaration)
        .filter((imp) => {
        return (0, ast_utils_1.findNode)(imp, ts.SyntaxKind.Identifier, componentName);
    })
        .map((imp) => {
        const pathStringLiteral = imp.moduleSpecifier;
        return pathStringLiteral.text;
    })[0];
    return (0, core_1.join)((0, core_1.dirname)((0, core_1.normalize)(bootstrappingFilePath)), componentRelativeFilePath + '.ts');
}
// end helper functions.
function validateProject(mainPath) {
    return (host, context) => {
        const routerOutletCheckRegex = /<router-outlet.*?>([\s\S]*?)<\/router-outlet>/;
        const componentPath = getBootstrapComponentPath(host, mainPath);
        const tmpl = getComponentTemplateInfo(host, componentPath);
        const template = getComponentTemplate(host, componentPath, tmpl);
        if (!routerOutletCheckRegex.test(template)) {
            const errorMsg = `Prerequisite for application shell is to define a router-outlet in your root component.`;
            context.logger.error(errorMsg);
            throw new schematics_1.SchematicsException(errorMsg);
        }
    };
}
function addUniversalTarget(options) {
    return () => {
        // Copy options.
        const universalOptions = {
            ...options,
        };
        // Delete non-universal options.
        delete universalOptions.route;
        return (0, schematics_1.schematic)('universal', universalOptions);
    };
}
function addAppShellConfigToWorkspace(options) {
    return (host, context) => {
        if (!options.route) {
            throw new schematics_1.SchematicsException(`Route is not defined`);
        }
        return (0, workspace_1.updateWorkspace)((workspace) => {
            const project = workspace.projects.get(options.project);
            if (!project) {
                return;
            }
            // Validation of targets is handled already in the main function.
            // Duplicate keys means that we have configurations in both server and build builders.
            const serverConfigKeys = project.targets.get('server')?.configurations ?? {};
            const buildConfigKeys = project.targets.get('build')?.configurations ?? {};
            const configurationNames = Object.keys({
                ...serverConfigKeys,
                ...buildConfigKeys,
            });
            const configurations = {};
            for (const key of configurationNames) {
                if (!serverConfigKeys[key]) {
                    context.logger.warn(`Skipped adding "${key}" configuration to "app-shell" target as it's missing from "server" target.`);
                    continue;
                }
                if (!buildConfigKeys[key]) {
                    context.logger.warn(`Skipped adding "${key}" configuration to "app-shell" target as it's missing from "build" target.`);
                    continue;
                }
                configurations[key] = {
                    browserTarget: `${options.project}:build:${key}`,
                    serverTarget: `${options.project}:server:${key}`,
                };
            }
            project.targets.add({
                name: 'app-shell',
                builder: workspace_models_1.Builders.AppShell,
                defaultConfiguration: configurations['production'] ? 'production' : undefined,
                options: {
                    route: options.route,
                },
                configurations,
            });
        });
    };
}
function addRouterModule(mainPath) {
    return (host) => {
        const modulePath = (0, ng_ast_utils_1.getAppModulePath)(host, mainPath);
        const moduleSource = getSourceFile(host, modulePath);
        const changes = (0, ast_utils_1.addImportToModule)(moduleSource, modulePath, 'RouterModule', '@angular/router');
        const recorder = host.beginUpdate(modulePath);
        (0, change_1.applyToUpdateRecorder)(recorder, changes);
        host.commitUpdate(recorder);
        return host;
    };
}
function getMetadataProperty(metadata, propertyName) {
    const properties = metadata.properties;
    const property = properties.filter(ts.isPropertyAssignment).filter((prop) => {
        const name = prop.name;
        switch (name.kind) {
            case ts.SyntaxKind.Identifier:
                return name.getText() === propertyName;
            case ts.SyntaxKind.StringLiteral:
                return name.text === propertyName;
        }
        return false;
    })[0];
    return property;
}
function addServerRoutes(options) {
    return async (host) => {
        // The workspace gets updated so this needs to be reloaded
        const workspace = await (0, workspace_1.getWorkspace)(host);
        const clientProject = workspace.projects.get(options.project);
        if (!clientProject) {
            throw new Error('Universal schematic removed client project.');
        }
        const clientServerTarget = clientProject.targets.get('server');
        if (!clientServerTarget) {
            throw new Error('Universal schematic did not add server target to client project.');
        }
        const clientServerOptions = clientServerTarget.options;
        if (!clientServerOptions) {
            throw new schematics_1.SchematicsException('Server target does not contain options.');
        }
        const modulePath = getServerModulePath(host, clientProject.sourceRoot || 'src', options.main);
        if (modulePath === null) {
            throw new schematics_1.SchematicsException('Universal/server module not found.');
        }
        let moduleSource = getSourceFile(host, modulePath);
        if (!(0, ast_utils_1.isImported)(moduleSource, 'Routes', '@angular/router')) {
            const recorder = host.beginUpdate(modulePath);
            const routesChange = (0, ast_utils_1.insertImport)(moduleSource, modulePath, 'Routes', '@angular/router');
            if (routesChange) {
                (0, change_1.applyToUpdateRecorder)(recorder, [routesChange]);
            }
            const imports = (0, ast_utils_1.getSourceNodes)(moduleSource)
                .filter((node) => node.kind === ts.SyntaxKind.ImportDeclaration)
                .sort((a, b) => a.getStart() - b.getStart());
            const insertPosition = imports[imports.length - 1].getEnd();
            const routeText = `\n\nconst routes: Routes = [ { path: '${options.route}', component: AppShellComponent }];`;
            recorder.insertRight(insertPosition, routeText);
            host.commitUpdate(recorder);
        }
        moduleSource = getSourceFile(host, modulePath);
        if (!(0, ast_utils_1.isImported)(moduleSource, 'RouterModule', '@angular/router')) {
            const recorder = host.beginUpdate(modulePath);
            const routerModuleChange = (0, ast_utils_1.insertImport)(moduleSource, modulePath, 'RouterModule', '@angular/router');
            if (routerModuleChange) {
                (0, change_1.applyToUpdateRecorder)(recorder, [routerModuleChange]);
            }
            const metadataChange = (0, ast_utils_1.addSymbolToNgModuleMetadata)(moduleSource, modulePath, 'imports', 'RouterModule.forRoot(routes)');
            if (metadataChange) {
                (0, change_1.applyToUpdateRecorder)(recorder, metadataChange);
            }
            host.commitUpdate(recorder);
        }
    };
}
function addStandaloneServerRoute(options) {
    return async (host) => {
        const workspace = await (0, workspace_1.getWorkspace)(host);
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project name "${options.project}" doesn't not exist.`);
        }
        const configFilePath = (0, core_1.join)((0, core_1.normalize)(project.sourceRoot ?? 'src'), 'app/app.config.server.ts');
        if (!host.exists(configFilePath)) {
            throw new schematics_1.SchematicsException(`Cannot find "${configFilePath}".`);
        }
        let configSourceFile = getSourceFile(host, configFilePath);
        if (!(0, ast_utils_1.isImported)(configSourceFile, 'ROUTES', '@angular/router')) {
            const routesChange = (0, ast_utils_1.insertImport)(configSourceFile, configFilePath, 'ROUTES', '@angular/router');
            const recorder = host.beginUpdate(configFilePath);
            if (routesChange) {
                (0, change_1.applyToUpdateRecorder)(recorder, [routesChange]);
                host.commitUpdate(recorder);
            }
        }
        configSourceFile = getSourceFile(host, configFilePath);
        const providersLiteral = (0, ast_utils_1.findNodes)(configSourceFile, ts.isPropertyAssignment).find((n) => ts.isArrayLiteralExpression(n.initializer) && n.name.getText() === 'providers')?.initializer;
        if (!providersLiteral) {
            throw new schematics_1.SchematicsException(`Cannot find the "providers" configuration in "${configFilePath}".`);
        }
        // Add route to providers literal.
        const newProvidersLiteral = ts.factory.updateArrayLiteralExpression(providersLiteral, [
            ...providersLiteral.elements,
            ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment('provide', ts.factory.createIdentifier('ROUTES')),
                ts.factory.createPropertyAssignment('multi', ts.factory.createIdentifier('true')),
                ts.factory.createPropertyAssignment('useValue', ts.factory.createArrayLiteralExpression([
                    ts.factory.createObjectLiteralExpression([
                        ts.factory.createPropertyAssignment('path', ts.factory.createIdentifier(`'${options.route}'`)),
                        ts.factory.createPropertyAssignment('component', ts.factory.createIdentifier('AppShellComponent')),
                    ], true),
                ], true)),
            ], true),
        ]);
        const recorder = host.beginUpdate(configFilePath);
        recorder.remove(providersLiteral.getStart(), providersLiteral.getWidth());
        const printer = ts.createPrinter();
        recorder.insertRight(providersLiteral.getStart(), printer.printNode(ts.EmitHint.Unspecified, newProvidersLiteral, configSourceFile));
        // Add AppShellComponent import
        const appShellImportChange = (0, ast_utils_1.insertImport)(configSourceFile, configFilePath, 'AppShellComponent', './app-shell/app-shell.component');
        (0, change_1.applyToUpdateRecorder)(recorder, [appShellImportChange]);
        host.commitUpdate(recorder);
    };
}
function default_1(options) {
    return async (tree) => {
        const workspace = await (0, workspace_1.getWorkspace)(tree);
        const clientProject = workspace.projects.get(options.project);
        if (!clientProject || clientProject.extensions.projectType !== 'application') {
            throw new schematics_1.SchematicsException(`A client project type of "application" is required.`);
        }
        const clientBuildTarget = clientProject.targets.get('build');
        if (!clientBuildTarget) {
            throw (0, project_targets_1.targetBuildNotFoundError)();
        }
        const clientBuildOptions = (clientBuildTarget.options ||
            {});
        const isStandalone = (0, ng_ast_utils_1.isStandaloneApp)(tree, clientBuildOptions.main);
        return (0, schematics_1.chain)([
            validateProject(clientBuildOptions.main),
            clientProject.targets.has('server') ? (0, schematics_1.noop)() : addUniversalTarget(options),
            addAppShellConfigToWorkspace(options),
            isStandalone ? (0, schematics_1.noop)() : addRouterModule(clientBuildOptions.main),
            isStandalone ? addStandaloneServerRoute(options) : addServerRoutes(options),
            (0, schematics_1.schematic)('component', {
                name: 'app-shell',
                module: options.rootModuleFileName,
                project: options.project,
                standalone: isStandalone,
            }),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvYXBwLXNoZWxsL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBZ0U7QUFDaEUsMkRBUW9DO0FBQ3BDLHNEQUFxRTtBQUNyRSxrR0FBb0Y7QUFDcEYsb0RBUzhCO0FBQzlCLDhDQUEwRDtBQUMxRCwwREFBNEU7QUFDNUUsZ0VBQXNFO0FBQ3RFLG9EQUFxRTtBQUNyRSxrRUFBb0c7QUFHcEcsU0FBUyxhQUFhLENBQUMsSUFBVSxFQUFFLElBQVk7SUFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVoRixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFVLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtJQUMzRSxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLElBQUEsZ0JBQVMsRUFBQyxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sUUFBUSxHQUFHLElBQUEsMEJBQWMsRUFBQyxVQUFVLENBQUMsQ0FBQztJQUM1QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RSxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1os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LENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztZQUMxRSw0QkFBNEIsQ0FBQyxPQUFPLENBQUM7WUFDckMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQztZQUNoRSxZQUFZLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNFLElBQUEsc0JBQVMsRUFBQyxXQUFXLEVBQUU7Z0JBQ3JCLElBQUksRUFBRSxXQUFXO2dCQUNqQixNQUFNLEVBQUUsT0FBTyxDQUFDLGtCQUFrQjtnQkFDbEMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2dCQUN4QixVQUFVLEVBQUUsWUFBWTthQUN6QixDQUFDO1NBQ0gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTlCRCw0QkE4QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgZGlybmFtZSwgam9pbiwgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljc0V4Y2VwdGlvbixcbiAgVHJlZSxcbiAgY2hhaW4sXG4gIG5vb3AsXG4gIHNjaGVtYXRpYyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbCB9IGZyb20gJy4uL3ByaXZhdGUvc3RhbmRhbG9uZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICcuLi90aGlyZF9wYXJ0eS9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2xpYi90eXBlc2NyaXB0JztcbmltcG9ydCB7XG4gIGFkZEltcG9ydFRvTW9kdWxlLFxuICBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEsXG4gIGZpbmROb2RlLFxuICBmaW5kTm9kZXMsXG4gIGdldERlY29yYXRvck1ldGFkYXRhLFxuICBnZXRTb3VyY2VOb2RlcyxcbiAgaW5zZXJ0SW1wb3J0LFxuICBpc0ltcG9ydGVkLFxufSBmcm9tICcuLi91dGlsaXR5L2FzdC11dGlscyc7XG5pbXBvcnQgeyBhcHBseVRvVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuLi91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQgeyBnZXRBcHBNb2R1bGVQYXRoLCBpc1N0YW5kYWxvbmVBcHAgfSBmcm9tICcuLi91dGlsaXR5L25nLWFzdC11dGlscyc7XG5pbXBvcnQgeyB0YXJnZXRCdWlsZE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi91dGlsaXR5L3Byb2plY3QtdGFyZ2V0cyc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UsIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IEJyb3dzZXJCdWlsZGVyT3B0aW9ucywgQnVpbGRlcnMsIFNlcnZlckJ1aWxkZXJPcHRpb25zIH0gZnJvbSAnLi4vdXRpbGl0eS93b3Jrc3BhY2UtbW9kZWxzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBBcHBTaGVsbE9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmZ1bmN0aW9uIGdldFNvdXJjZUZpbGUoaG9zdDogVHJlZSwgcGF0aDogc3RyaW5nKTogdHMuU291cmNlRmlsZSB7XG4gIGNvbnN0IGNvbnRlbnQgPSBob3N0LnJlYWRUZXh0KHBhdGgpO1xuICBjb25zdCBzb3VyY2UgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKHBhdGgsIGNvbnRlbnQsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xuXG4gIHJldHVybiBzb3VyY2U7XG59XG5cbmZ1bmN0aW9uIGdldFNlcnZlck1vZHVsZVBhdGgoaG9zdDogVHJlZSwgc291cmNlUm9vdDogc3RyaW5nLCBtYWluUGF0aDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IG1haW5Tb3VyY2UgPSBnZXRTb3VyY2VGaWxlKGhvc3QsIGpvaW4obm9ybWFsaXplKHNvdXJjZVJvb3QpLCBtYWluUGF0aCkpO1xuICBjb25zdCBhbGxOb2RlcyA9IGdldFNvdXJjZU5vZGVzKG1haW5Tb3VyY2UpO1xuICBjb25zdCBleHBOb2RlID0gYWxsTm9kZXMuZmluZCgobm9kZSkgPT4gdHMuaXNFeHBvcnREZWNsYXJhdGlvbihub2RlKSk7XG4gIGlmICghZXhwTm9kZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IHJlbGF0aXZlUGF0aCA9IChleHBOb2RlIGFzIHRzLkV4cG9ydERlY2xhcmF0aW9uKS5tb2R1bGVTcGVjaWZpZXIgYXMgdHMuU3RyaW5nTGl0ZXJhbDtcbiAgY29uc3QgbW9kdWxlUGF0aCA9IG5vcm1hbGl6ZShgLyR7c291cmNlUm9vdH0vJHtyZWxhdGl2ZVBhdGgudGV4dH0udHNgKTtcblxuICByZXR1cm4gbW9kdWxlUGF0aDtcbn1cblxuaW50ZXJmYWNlIFRlbXBsYXRlSW5mbyB7XG4gIHRlbXBsYXRlUHJvcD86IHRzLlByb3BlcnR5QXNzaWdubWVudDtcbiAgdGVtcGxhdGVVcmxQcm9wPzogdHMuUHJvcGVydHlBc3NpZ25tZW50O1xufVxuXG5mdW5jdGlvbiBnZXRDb21wb25lbnRUZW1wbGF0ZUluZm8oaG9zdDogVHJlZSwgY29tcG9uZW50UGF0aDogc3RyaW5nKTogVGVtcGxhdGVJbmZvIHtcbiAgY29uc3QgY29tcFNvdXJjZSA9IGdldFNvdXJjZUZpbGUoaG9zdCwgY29tcG9uZW50UGF0aCk7XG4gIGNvbnN0IGNvbXBNZXRhZGF0YSA9IGdldERlY29yYXRvck1ldGFkYXRhKGNvbXBTb3VyY2UsICdDb21wb25lbnQnLCAnQGFuZ3VsYXIvY29yZScpWzBdO1xuXG4gIHJldHVybiB7XG4gICAgdGVtcGxhdGVQcm9wOiBnZXRNZXRhZGF0YVByb3BlcnR5KGNvbXBNZXRhZGF0YSwgJ3RlbXBsYXRlJyksXG4gICAgdGVtcGxhdGVVcmxQcm9wOiBnZXRNZXRhZGF0YVByb3BlcnR5KGNvbXBNZXRhZGF0YSwgJ3RlbXBsYXRlVXJsJyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudFRlbXBsYXRlKGhvc3Q6IFRyZWUsIGNvbXBQYXRoOiBzdHJpbmcsIHRtcGxJbmZvOiBUZW1wbGF0ZUluZm8pOiBzdHJpbmcge1xuICBsZXQgdGVtcGxhdGUgPSAnJztcblxuICBpZiAodG1wbEluZm8udGVtcGxhdGVQcm9wKSB7XG4gICAgdGVtcGxhdGUgPSB0bXBsSW5mby50ZW1wbGF0ZVByb3AuZ2V0RnVsbFRleHQoKTtcbiAgfSBlbHNlIGlmICh0bXBsSW5mby50ZW1wbGF0ZVVybFByb3ApIHtcbiAgICBjb25zdCB0ZW1wbGF0ZVVybCA9ICh0bXBsSW5mby50ZW1wbGF0ZVVybFByb3AuaW5pdGlhbGl6ZXIgYXMgdHMuU3RyaW5nTGl0ZXJhbCkudGV4dDtcbiAgICBjb25zdCBkaXIgPSBkaXJuYW1lKG5vcm1hbGl6ZShjb21wUGF0aCkpO1xuICAgIGNvbnN0IHRlbXBsYXRlUGF0aCA9IGpvaW4oZGlyLCB0ZW1wbGF0ZVVybCk7XG4gICAgdHJ5IHtcbiAgICAgIHRlbXBsYXRlID0gaG9zdC5yZWFkVGV4dCh0ZW1wbGF0ZVBhdGgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxuXG4gIHJldHVybiB0ZW1wbGF0ZTtcbn1cblxuZnVuY3Rpb24gZ2V0Qm9vdHN0cmFwQ29tcG9uZW50UGF0aChob3N0OiBUcmVlLCBtYWluUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbWFpblNvdXJjZSA9IGdldFNvdXJjZUZpbGUoaG9zdCwgbWFpblBhdGgpO1xuICBjb25zdCBib290c3RyYXBBcHBDYWxsID0gZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbChtYWluU291cmNlKTtcblxuICBsZXQgYm9vdHN0cmFwcGluZ0ZpbGVQYXRoOiBzdHJpbmc7XG4gIGxldCBib290c3RyYXBwaW5nU291cmNlOiB0cy5Tb3VyY2VGaWxlO1xuICBsZXQgY29tcG9uZW50TmFtZTogc3RyaW5nO1xuXG4gIGlmIChib290c3RyYXBBcHBDYWxsKSB7XG4gICAgLy8gU3RhbmRhbG9uZSBBcHBsaWNhdGlvblxuICAgIGNvbXBvbmVudE5hbWUgPSBib290c3RyYXBBcHBDYWxsLmFyZ3VtZW50c1swXS5nZXRUZXh0KCk7XG4gICAgYm9vdHN0cmFwcGluZ0ZpbGVQYXRoID0gbWFpblBhdGg7XG4gICAgYm9vdHN0cmFwcGluZ1NvdXJjZSA9IG1haW5Tb3VyY2U7XG4gIH0gZWxzZSB7XG4gICAgLy8gTmdNb2R1bGUgQXBwbGljYXRpb25cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gZ2V0QXBwTW9kdWxlUGF0aChob3N0LCBtYWluUGF0aCk7XG4gICAgY29uc3QgbW9kdWxlU291cmNlID0gZ2V0U291cmNlRmlsZShob3N0LCBtb2R1bGVQYXRoKTtcbiAgICBjb25zdCBtZXRhZGF0YU5vZGUgPSBnZXREZWNvcmF0b3JNZXRhZGF0YShtb2R1bGVTb3VyY2UsICdOZ01vZHVsZScsICdAYW5ndWxhci9jb3JlJylbMF07XG4gICAgY29uc3QgYm9vdHN0cmFwUHJvcGVydHkgPSBnZXRNZXRhZGF0YVByb3BlcnR5KG1ldGFkYXRhTm9kZSwgJ2Jvb3RzdHJhcCcpO1xuICAgIGNvbnN0IGFyckxpdGVyYWwgPSBib290c3RyYXBQcm9wZXJ0eS5pbml0aWFsaXplciBhcyB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uO1xuICAgIGNvbXBvbmVudE5hbWUgPSBhcnJMaXRlcmFsLmVsZW1lbnRzWzBdLmdldFRleHQoKTtcbiAgICBib290c3RyYXBwaW5nU291cmNlID0gbW9kdWxlU291cmNlO1xuICAgIGJvb3RzdHJhcHBpbmdGaWxlUGF0aCA9IG1vZHVsZVBhdGg7XG4gIH1cblxuICBjb25zdCBjb21wb25lbnRSZWxhdGl2ZUZpbGVQYXRoID0gZ2V0U291cmNlTm9kZXMoYm9vdHN0cmFwcGluZ1NvdXJjZSlcbiAgICAuZmlsdGVyKHRzLmlzSW1wb3J0RGVjbGFyYXRpb24pXG4gICAgLmZpbHRlcigoaW1wKSA9PiB7XG4gICAgICByZXR1cm4gZmluZE5vZGUoaW1wLCB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIsIGNvbXBvbmVudE5hbWUpO1xuICAgIH0pXG4gICAgLm1hcCgoaW1wKSA9PiB7XG4gICAgICBjb25zdCBwYXRoU3RyaW5nTGl0ZXJhbCA9IGltcC5tb2R1bGVTcGVjaWZpZXIgYXMgdHMuU3RyaW5nTGl0ZXJhbDtcblxuICAgICAgcmV0dXJuIHBhdGhTdHJpbmdMaXRlcmFsLnRleHQ7XG4gICAgfSlbMF07XG5cbiAgcmV0dXJuIGpvaW4oZGlybmFtZShub3JtYWxpemUoYm9vdHN0cmFwcGluZ0ZpbGVQYXRoKSksIGNvbXBvbmVudFJlbGF0aXZlRmlsZVBhdGggKyAnLnRzJyk7XG59XG4vLyBlbmQgaGVscGVyIGZ1bmN0aW9ucy5cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm9qZWN0KG1haW5QYXRoOiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgcm91dGVyT3V0bGV0Q2hlY2tSZWdleCA9IC88cm91dGVyLW91dGxldC4qPz4oW1xcc1xcU10qPyk8XFwvcm91dGVyLW91dGxldD4vO1xuXG4gICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGdldEJvb3RzdHJhcENvbXBvbmVudFBhdGgoaG9zdCwgbWFpblBhdGgpO1xuICAgIGNvbnN0IHRtcGwgPSBnZXRDb21wb25lbnRUZW1wbGF0ZUluZm8oaG9zdCwgY29tcG9uZW50UGF0aCk7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBnZXRDb21wb25lbnRUZW1wbGF0ZShob3N0LCBjb21wb25lbnRQYXRoLCB0bXBsKTtcbiAgICBpZiAoIXJvdXRlck91dGxldENoZWNrUmVnZXgudGVzdCh0ZW1wbGF0ZSkpIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gYFByZXJlcXVpc2l0ZSBmb3IgYXBwbGljYXRpb24gc2hlbGwgaXMgdG8gZGVmaW5lIGEgcm91dGVyLW91dGxldCBpbiB5b3VyIHJvb3QgY29tcG9uZW50LmA7XG4gICAgICBjb250ZXh0LmxvZ2dlci5lcnJvcihlcnJvck1zZyk7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihlcnJvck1zZyk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRVbml2ZXJzYWxUYXJnZXQob3B0aW9uczogQXBwU2hlbGxPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgLy8gQ29weSBvcHRpb25zLlxuICAgIGNvbnN0IHVuaXZlcnNhbE9wdGlvbnMgPSB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgIH07XG5cbiAgICAvLyBEZWxldGUgbm9uLXVuaXZlcnNhbCBvcHRpb25zLlxuICAgIGRlbGV0ZSB1bml2ZXJzYWxPcHRpb25zLnJvdXRlO1xuXG4gICAgcmV0dXJuIHNjaGVtYXRpYygndW5pdmVyc2FsJywgdW5pdmVyc2FsT3B0aW9ucyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZEFwcFNoZWxsQ29uZmlnVG9Xb3Jrc3BhY2Uob3B0aW9uczogQXBwU2hlbGxPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdCwgY29udGV4dCkgPT4ge1xuICAgIGlmICghb3B0aW9ucy5yb3V0ZSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFJvdXRlIGlzIG5vdCBkZWZpbmVkYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVwZGF0ZVdvcmtzcGFjZSgod29ya3NwYWNlKSA9PiB7XG4gICAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gVmFsaWRhdGlvbiBvZiB0YXJnZXRzIGlzIGhhbmRsZWQgYWxyZWFkeSBpbiB0aGUgbWFpbiBmdW5jdGlvbi5cbiAgICAgIC8vIER1cGxpY2F0ZSBrZXlzIG1lYW5zIHRoYXQgd2UgaGF2ZSBjb25maWd1cmF0aW9ucyBpbiBib3RoIHNlcnZlciBhbmQgYnVpbGQgYnVpbGRlcnMuXG4gICAgICBjb25zdCBzZXJ2ZXJDb25maWdLZXlzID0gcHJvamVjdC50YXJnZXRzLmdldCgnc2VydmVyJyk/LmNvbmZpZ3VyYXRpb25zID8/IHt9O1xuICAgICAgY29uc3QgYnVpbGRDb25maWdLZXlzID0gcHJvamVjdC50YXJnZXRzLmdldCgnYnVpbGQnKT8uY29uZmlndXJhdGlvbnMgPz8ge307XG5cbiAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25OYW1lcyA9IE9iamVjdC5rZXlzKHtcbiAgICAgICAgLi4uc2VydmVyQ29uZmlnS2V5cyxcbiAgICAgICAgLi4uYnVpbGRDb25maWdLZXlzLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25zOiBSZWNvcmQ8c3RyaW5nLCB7fT4gPSB7fTtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGNvbmZpZ3VyYXRpb25OYW1lcykge1xuICAgICAgICBpZiAoIXNlcnZlckNvbmZpZ0tleXNba2V5XSkge1xuICAgICAgICAgIGNvbnRleHQubG9nZ2VyLndhcm4oXG4gICAgICAgICAgICBgU2tpcHBlZCBhZGRpbmcgXCIke2tleX1cIiBjb25maWd1cmF0aW9uIHRvIFwiYXBwLXNoZWxsXCIgdGFyZ2V0IGFzIGl0J3MgbWlzc2luZyBmcm9tIFwic2VydmVyXCIgdGFyZ2V0LmAsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFidWlsZENvbmZpZ0tleXNba2V5XSkge1xuICAgICAgICAgIGNvbnRleHQubG9nZ2VyLndhcm4oXG4gICAgICAgICAgICBgU2tpcHBlZCBhZGRpbmcgXCIke2tleX1cIiBjb25maWd1cmF0aW9uIHRvIFwiYXBwLXNoZWxsXCIgdGFyZ2V0IGFzIGl0J3MgbWlzc2luZyBmcm9tIFwiYnVpbGRcIiB0YXJnZXQuYCxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWd1cmF0aW9uc1trZXldID0ge1xuICAgICAgICAgIGJyb3dzZXJUYXJnZXQ6IGAke29wdGlvbnMucHJvamVjdH06YnVpbGQ6JHtrZXl9YCxcbiAgICAgICAgICBzZXJ2ZXJUYXJnZXQ6IGAke29wdGlvbnMucHJvamVjdH06c2VydmVyOiR7a2V5fWAsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHByb2plY3QudGFyZ2V0cy5hZGQoe1xuICAgICAgICBuYW1lOiAnYXBwLXNoZWxsJyxcbiAgICAgICAgYnVpbGRlcjogQnVpbGRlcnMuQXBwU2hlbGwsXG4gICAgICAgIGRlZmF1bHRDb25maWd1cmF0aW9uOiBjb25maWd1cmF0aW9uc1sncHJvZHVjdGlvbiddID8gJ3Byb2R1Y3Rpb24nIDogdW5kZWZpbmVkLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgcm91dGU6IG9wdGlvbnMucm91dGUsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25zLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZFJvdXRlck1vZHVsZShtYWluUGF0aDogc3RyaW5nKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IG1vZHVsZVBhdGggPSBnZXRBcHBNb2R1bGVQYXRoKGhvc3QsIG1haW5QYXRoKTtcbiAgICBjb25zdCBtb2R1bGVTb3VyY2UgPSBnZXRTb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuICAgIGNvbnN0IGNoYW5nZXMgPSBhZGRJbXBvcnRUb01vZHVsZShtb2R1bGVTb3VyY2UsIG1vZHVsZVBhdGgsICdSb3V0ZXJNb2R1bGUnLCAnQGFuZ3VsYXIvcm91dGVyJyk7XG4gICAgY29uc3QgcmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKG1vZHVsZVBhdGgpO1xuICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgY2hhbmdlcyk7XG4gICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldE1ldGFkYXRhUHJvcGVydHkobWV0YWRhdGE6IHRzLk5vZGUsIHByb3BlcnR5TmFtZTogc3RyaW5nKTogdHMuUHJvcGVydHlBc3NpZ25tZW50IHtcbiAgY29uc3QgcHJvcGVydGllcyA9IChtZXRhZGF0YSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikucHJvcGVydGllcztcbiAgY29uc3QgcHJvcGVydHkgPSBwcm9wZXJ0aWVzLmZpbHRlcih0cy5pc1Byb3BlcnR5QXNzaWdubWVudCkuZmlsdGVyKChwcm9wKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IHByb3AubmFtZTtcbiAgICBzd2l0Y2ggKG5hbWUua2luZCkge1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXI6XG4gICAgICAgIHJldHVybiBuYW1lLmdldFRleHQoKSA9PT0gcHJvcGVydHlOYW1lO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiBuYW1lLnRleHQgPT09IHByb3BlcnR5TmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pWzBdO1xuXG4gIHJldHVybiBwcm9wZXJ0eTtcbn1cblxuZnVuY3Rpb24gYWRkU2VydmVyUm91dGVzKG9wdGlvbnM6IEFwcFNoZWxsT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3Q6IFRyZWUpID0+IHtcbiAgICAvLyBUaGUgd29ya3NwYWNlIGdldHMgdXBkYXRlZCBzbyB0aGlzIG5lZWRzIHRvIGJlIHJlbG9hZGVkXG4gICAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGhvc3QpO1xuICAgIGNvbnN0IGNsaWVudFByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFjbGllbnRQcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuaXZlcnNhbCBzY2hlbWF0aWMgcmVtb3ZlZCBjbGllbnQgcHJvamVjdC4nKTtcbiAgICB9XG4gICAgY29uc3QgY2xpZW50U2VydmVyVGFyZ2V0ID0gY2xpZW50UHJvamVjdC50YXJnZXRzLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKCFjbGllbnRTZXJ2ZXJUYXJnZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5pdmVyc2FsIHNjaGVtYXRpYyBkaWQgbm90IGFkZCBzZXJ2ZXIgdGFyZ2V0IHRvIGNsaWVudCBwcm9qZWN0LicpO1xuICAgIH1cbiAgICBjb25zdCBjbGllbnRTZXJ2ZXJPcHRpb25zID0gY2xpZW50U2VydmVyVGFyZ2V0Lm9wdGlvbnMgYXMgdW5rbm93biBhcyBTZXJ2ZXJCdWlsZGVyT3B0aW9ucztcbiAgICBpZiAoIWNsaWVudFNlcnZlck9wdGlvbnMpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdTZXJ2ZXIgdGFyZ2V0IGRvZXMgbm90IGNvbnRhaW4gb3B0aW9ucy4nKTtcbiAgICB9XG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IGdldFNlcnZlck1vZHVsZVBhdGgoXG4gICAgICBob3N0LFxuICAgICAgY2xpZW50UHJvamVjdC5zb3VyY2VSb290IHx8ICdzcmMnLFxuICAgICAgb3B0aW9ucy5tYWluIGFzIHN0cmluZyxcbiAgICApO1xuICAgIGlmIChtb2R1bGVQYXRoID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignVW5pdmVyc2FsL3NlcnZlciBtb2R1bGUgbm90IGZvdW5kLicpO1xuICAgIH1cblxuICAgIGxldCBtb2R1bGVTb3VyY2UgPSBnZXRTb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuICAgIGlmICghaXNJbXBvcnRlZChtb2R1bGVTb3VyY2UsICdSb3V0ZXMnLCAnQGFuZ3VsYXIvcm91dGVyJykpIHtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICAgIGNvbnN0IHJvdXRlc0NoYW5nZSA9IGluc2VydEltcG9ydChtb2R1bGVTb3VyY2UsIG1vZHVsZVBhdGgsICdSb3V0ZXMnLCAnQGFuZ3VsYXIvcm91dGVyJyk7XG4gICAgICBpZiAocm91dGVzQ2hhbmdlKSB7XG4gICAgICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgW3JvdXRlc0NoYW5nZV0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbXBvcnRzID0gZ2V0U291cmNlTm9kZXMobW9kdWxlU291cmNlKVxuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSW1wb3J0RGVjbGFyYXRpb24pXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLmdldFN0YXJ0KCkgLSBiLmdldFN0YXJ0KCkpO1xuICAgICAgY29uc3QgaW5zZXJ0UG9zaXRpb24gPSBpbXBvcnRzW2ltcG9ydHMubGVuZ3RoIC0gMV0uZ2V0RW5kKCk7XG4gICAgICBjb25zdCByb3V0ZVRleHQgPSBgXFxuXFxuY29uc3Qgcm91dGVzOiBSb3V0ZXMgPSBbIHsgcGF0aDogJyR7b3B0aW9ucy5yb3V0ZX0nLCBjb21wb25lbnQ6IEFwcFNoZWxsQ29tcG9uZW50IH1dO2A7XG4gICAgICByZWNvcmRlci5pbnNlcnRSaWdodChpbnNlcnRQb3NpdGlvbiwgcm91dGVUZXh0KTtcbiAgICAgIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcbiAgICB9XG5cbiAgICBtb2R1bGVTb3VyY2UgPSBnZXRTb3VyY2VGaWxlKGhvc3QsIG1vZHVsZVBhdGgpO1xuICAgIGlmICghaXNJbXBvcnRlZChtb2R1bGVTb3VyY2UsICdSb3V0ZXJNb2R1bGUnLCAnQGFuZ3VsYXIvcm91dGVyJykpIHtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICAgIGNvbnN0IHJvdXRlck1vZHVsZUNoYW5nZSA9IGluc2VydEltcG9ydChcbiAgICAgICAgbW9kdWxlU291cmNlLFxuICAgICAgICBtb2R1bGVQYXRoLFxuICAgICAgICAnUm91dGVyTW9kdWxlJyxcbiAgICAgICAgJ0Bhbmd1bGFyL3JvdXRlcicsXG4gICAgICApO1xuXG4gICAgICBpZiAocm91dGVyTW9kdWxlQ2hhbmdlKSB7XG4gICAgICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgW3JvdXRlck1vZHVsZUNoYW5nZV0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtZXRhZGF0YUNoYW5nZSA9IGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShcbiAgICAgICAgbW9kdWxlU291cmNlLFxuICAgICAgICBtb2R1bGVQYXRoLFxuICAgICAgICAnaW1wb3J0cycsXG4gICAgICAgICdSb3V0ZXJNb2R1bGUuZm9yUm9vdChyb3V0ZXMpJyxcbiAgICAgICk7XG4gICAgICBpZiAobWV0YWRhdGFDaGFuZ2UpIHtcbiAgICAgICAgYXBwbHlUb1VwZGF0ZVJlY29yZGVyKHJlY29yZGVyLCBtZXRhZGF0YUNoYW5nZSk7XG4gICAgICB9XG4gICAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBhZGRTdGFuZGFsb25lU2VydmVyUm91dGUob3B0aW9uczogQXBwU2hlbGxPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgbmFtZSBcIiR7b3B0aW9ucy5wcm9qZWN0fVwiIGRvZXNuJ3Qgbm90IGV4aXN0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gam9pbihub3JtYWxpemUocHJvamVjdC5zb3VyY2VSb290ID8/ICdzcmMnKSwgJ2FwcC9hcHAuY29uZmlnLnNlcnZlci50cycpO1xuICAgIGlmICghaG9zdC5leGlzdHMoY29uZmlnRmlsZVBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ2Fubm90IGZpbmQgXCIke2NvbmZpZ0ZpbGVQYXRofVwiLmApO1xuICAgIH1cblxuICAgIGxldCBjb25maWdTb3VyY2VGaWxlID0gZ2V0U291cmNlRmlsZShob3N0LCBjb25maWdGaWxlUGF0aCk7XG4gICAgaWYgKCFpc0ltcG9ydGVkKGNvbmZpZ1NvdXJjZUZpbGUsICdST1VURVMnLCAnQGFuZ3VsYXIvcm91dGVyJykpIHtcbiAgICAgIGNvbnN0IHJvdXRlc0NoYW5nZSA9IGluc2VydEltcG9ydChcbiAgICAgICAgY29uZmlnU291cmNlRmlsZSxcbiAgICAgICAgY29uZmlnRmlsZVBhdGgsXG4gICAgICAgICdST1VURVMnLFxuICAgICAgICAnQGFuZ3VsYXIvcm91dGVyJyxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShjb25maWdGaWxlUGF0aCk7XG4gICAgICBpZiAocm91dGVzQ2hhbmdlKSB7XG4gICAgICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgW3JvdXRlc0NoYW5nZV0pO1xuICAgICAgICBob3N0LmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uZmlnU291cmNlRmlsZSA9IGdldFNvdXJjZUZpbGUoaG9zdCwgY29uZmlnRmlsZVBhdGgpO1xuICAgIGNvbnN0IHByb3ZpZGVyc0xpdGVyYWwgPSBmaW5kTm9kZXMoY29uZmlnU291cmNlRmlsZSwgdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpLmZpbmQoXG4gICAgICAobikgPT4gdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKG4uaW5pdGlhbGl6ZXIpICYmIG4ubmFtZS5nZXRUZXh0KCkgPT09ICdwcm92aWRlcnMnLFxuICAgICk/LmluaXRpYWxpemVyIGFzIHRzLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFwcm92aWRlcnNMaXRlcmFsKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgYENhbm5vdCBmaW5kIHRoZSBcInByb3ZpZGVyc1wiIGNvbmZpZ3VyYXRpb24gaW4gXCIke2NvbmZpZ0ZpbGVQYXRofVwiLmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEFkZCByb3V0ZSB0byBwcm92aWRlcnMgbGl0ZXJhbC5cbiAgICBjb25zdCBuZXdQcm92aWRlcnNMaXRlcmFsID0gdHMuZmFjdG9yeS51cGRhdGVBcnJheUxpdGVyYWxFeHByZXNzaW9uKHByb3ZpZGVyc0xpdGVyYWwsIFtcbiAgICAgIC4uLnByb3ZpZGVyc0xpdGVyYWwuZWxlbWVudHMsXG4gICAgICB0cy5mYWN0b3J5LmNyZWF0ZU9iamVjdExpdGVyYWxFeHByZXNzaW9uKFxuICAgICAgICBbXG4gICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoJ3Byb3ZpZGUnLCB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoJ1JPVVRFUycpKSxcbiAgICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudCgnbXVsdGknLCB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoJ3RydWUnKSksXG4gICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAgICAgICAndXNlVmFsdWUnLFxuICAgICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVBcnJheUxpdGVyYWxFeHByZXNzaW9uKFxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAgICAgICAgICAgICAgICAgJ3BhdGgnLFxuICAgICAgICAgICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcihgJyR7b3B0aW9ucy5yb3V0ZX0nYCksXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgICAgICAgICAgICAgICAgICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcignQXBwU2hlbGxDb21wb25lbnQnKSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICksXG4gICAgICAgIF0sXG4gICAgICAgIHRydWUsXG4gICAgICApLFxuICAgIF0pO1xuXG4gICAgY29uc3QgcmVjb3JkZXIgPSBob3N0LmJlZ2luVXBkYXRlKGNvbmZpZ0ZpbGVQYXRoKTtcbiAgICByZWNvcmRlci5yZW1vdmUocHJvdmlkZXJzTGl0ZXJhbC5nZXRTdGFydCgpLCBwcm92aWRlcnNMaXRlcmFsLmdldFdpZHRoKCkpO1xuICAgIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gICAgcmVjb3JkZXIuaW5zZXJ0UmlnaHQoXG4gICAgICBwcm92aWRlcnNMaXRlcmFsLmdldFN0YXJ0KCksXG4gICAgICBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3UHJvdmlkZXJzTGl0ZXJhbCwgY29uZmlnU291cmNlRmlsZSksXG4gICAgKTtcblxuICAgIC8vIEFkZCBBcHBTaGVsbENvbXBvbmVudCBpbXBvcnRcbiAgICBjb25zdCBhcHBTaGVsbEltcG9ydENoYW5nZSA9IGluc2VydEltcG9ydChcbiAgICAgIGNvbmZpZ1NvdXJjZUZpbGUsXG4gICAgICBjb25maWdGaWxlUGF0aCxcbiAgICAgICdBcHBTaGVsbENvbXBvbmVudCcsXG4gICAgICAnLi9hcHAtc2hlbGwvYXBwLXNoZWxsLmNvbXBvbmVudCcsXG4gICAgKTtcblxuICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgW2FwcFNoZWxsSW1wb3J0Q2hhbmdlXSk7XG4gICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogQXBwU2hlbGxPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZSkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZSh0cmVlKTtcbiAgICBjb25zdCBjbGllbnRQcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghY2xpZW50UHJvamVjdCB8fCBjbGllbnRQcm9qZWN0LmV4dGVuc2lvbnMucHJvamVjdFR5cGUgIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBBIGNsaWVudCBwcm9qZWN0IHR5cGUgb2YgXCJhcHBsaWNhdGlvblwiIGlzIHJlcXVpcmVkLmApO1xuICAgIH1cbiAgICBjb25zdCBjbGllbnRCdWlsZFRhcmdldCA9IGNsaWVudFByb2plY3QudGFyZ2V0cy5nZXQoJ2J1aWxkJyk7XG4gICAgaWYgKCFjbGllbnRCdWlsZFRhcmdldCkge1xuICAgICAgdGhyb3cgdGFyZ2V0QnVpbGROb3RGb3VuZEVycm9yKCk7XG4gICAgfVxuICAgIGNvbnN0IGNsaWVudEJ1aWxkT3B0aW9ucyA9IChjbGllbnRCdWlsZFRhcmdldC5vcHRpb25zIHx8XG4gICAgICB7fSkgYXMgdW5rbm93biBhcyBCcm93c2VyQnVpbGRlck9wdGlvbnM7XG5cbiAgICBjb25zdCBpc1N0YW5kYWxvbmUgPSBpc1N0YW5kYWxvbmVBcHAodHJlZSwgY2xpZW50QnVpbGRPcHRpb25zLm1haW4pO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIHZhbGlkYXRlUHJvamVjdChjbGllbnRCdWlsZE9wdGlvbnMubWFpbiksXG4gICAgICBjbGllbnRQcm9qZWN0LnRhcmdldHMuaGFzKCdzZXJ2ZXInKSA/IG5vb3AoKSA6IGFkZFVuaXZlcnNhbFRhcmdldChvcHRpb25zKSxcbiAgICAgIGFkZEFwcFNoZWxsQ29uZmlnVG9Xb3Jrc3BhY2Uob3B0aW9ucyksXG4gICAgICBpc1N0YW5kYWxvbmUgPyBub29wKCkgOiBhZGRSb3V0ZXJNb2R1bGUoY2xpZW50QnVpbGRPcHRpb25zLm1haW4pLFxuICAgICAgaXNTdGFuZGFsb25lID8gYWRkU3RhbmRhbG9uZVNlcnZlclJvdXRlKG9wdGlvbnMpIDogYWRkU2VydmVyUm91dGVzKG9wdGlvbnMpLFxuICAgICAgc2NoZW1hdGljKCdjb21wb25lbnQnLCB7XG4gICAgICAgIG5hbWU6ICdhcHAtc2hlbGwnLFxuICAgICAgICBtb2R1bGU6IG9wdGlvbnMucm9vdE1vZHVsZUZpbGVOYW1lLFxuICAgICAgICBwcm9qZWN0OiBvcHRpb25zLnByb2plY3QsXG4gICAgICAgIHN0YW5kYWxvbmU6IGlzU3RhbmRhbG9uZSxcbiAgICAgIH0pLFxuICAgIF0pO1xuICB9O1xufVxuIl19