"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBootstrapApplicationCall = exports.addFunctionalProvidersToStandaloneBootstrap = exports.addModuleImportToStandaloneBootstrap = exports.callsProvidersFunction = exports.importsProvidersFrom = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const path_1 = require("path");
const typescript_1 = __importDefault(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const ast_utils_1 = require("../utility/ast-utils");
const change_1 = require("../utility/change");
/**
 * Checks whether the providers from a module are being imported in a `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path of the file in which to check.
 * @param className Class name of the module to search for.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
function importsProvidersFrom(tree, filePath, className) {
    const sourceFile = createSourceFile(tree, filePath);
    const bootstrapCall = findBootstrapApplicationCall(sourceFile);
    const appConfig = bootstrapCall ? findAppConfig(bootstrapCall, tree, filePath) : null;
    const importProvidersFromCall = appConfig ? findImportProvidersFromCall(appConfig.node) : null;
    return !!importProvidersFromCall?.arguments.some((arg) => typescript_1.default.isIdentifier(arg) && arg.text === className);
}
exports.importsProvidersFrom = importsProvidersFrom;
/**
 * Checks whether a providers function is being called in a `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path of the file in which to check.
 * @param functionName Name of the function to search for.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
function callsProvidersFunction(tree, filePath, functionName) {
    const sourceFile = createSourceFile(tree, filePath);
    const bootstrapCall = findBootstrapApplicationCall(sourceFile);
    const appConfig = bootstrapCall ? findAppConfig(bootstrapCall, tree, filePath) : null;
    const providersLiteral = appConfig ? findProvidersLiteral(appConfig.node) : null;
    return !!providersLiteral?.elements.some((el) => typescript_1.default.isCallExpression(el) &&
        typescript_1.default.isIdentifier(el.expression) &&
        el.expression.text === functionName);
}
exports.callsProvidersFunction = callsProvidersFunction;
/**
 * Adds an `importProvidersFrom` call to the `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path to the file that should be updated.
 * @param moduleName Name of the module that should be imported.
 * @param modulePath Path from which to import the module.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
function addModuleImportToStandaloneBootstrap(tree, filePath, moduleName, modulePath) {
    const sourceFile = createSourceFile(tree, filePath);
    const bootstrapCall = findBootstrapApplicationCall(sourceFile);
    const addImports = (file, recorder) => {
        const sourceText = file.getText();
        [
            (0, ast_utils_1.insertImport)(file, sourceText, moduleName, modulePath),
            (0, ast_utils_1.insertImport)(file, sourceText, 'importProvidersFrom', '@angular/core'),
        ].forEach((change) => {
            if (change instanceof change_1.InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        });
    };
    if (!bootstrapCall) {
        throw new schematics_1.SchematicsException(`Could not find bootstrapApplication call in ${filePath}`);
    }
    const importProvidersCall = typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier('importProvidersFrom'), [], [typescript_1.default.factory.createIdentifier(moduleName)]);
    // If there's only one argument, we have to create a new object literal.
    if (bootstrapCall.arguments.length === 1) {
        const recorder = tree.beginUpdate(filePath);
        addNewAppConfigToCall(bootstrapCall, importProvidersCall, recorder);
        addImports(sourceFile, recorder);
        tree.commitUpdate(recorder);
        return;
    }
    // If the config is a `mergeApplicationProviders` call, add another config to it.
    if (isMergeAppConfigCall(bootstrapCall.arguments[1])) {
        const recorder = tree.beginUpdate(filePath);
        addNewAppConfigToCall(bootstrapCall.arguments[1], importProvidersCall, recorder);
        addImports(sourceFile, recorder);
        tree.commitUpdate(recorder);
        return;
    }
    // Otherwise attempt to merge into the current config.
    const appConfig = findAppConfig(bootstrapCall, tree, filePath);
    if (!appConfig) {
        throw new schematics_1.SchematicsException(`Could not statically analyze config in bootstrapApplication call in ${filePath}`);
    }
    const { filePath: configFilePath, node: config } = appConfig;
    const recorder = tree.beginUpdate(configFilePath);
    const importCall = findImportProvidersFromCall(config);
    addImports(config.getSourceFile(), recorder);
    if (importCall) {
        // If there's an `importProvidersFrom` call already, add the module to it.
        recorder.insertRight(importCall.arguments[importCall.arguments.length - 1].getEnd(), `, ${moduleName}`);
    }
    else {
        const providersLiteral = findProvidersLiteral(config);
        if (providersLiteral) {
            // If there's a `providers` array, add the import to it.
            addElementToArray(providersLiteral, importProvidersCall, recorder);
        }
        else {
            // Otherwise add a `providers` array to the existing object literal.
            addProvidersToObjectLiteral(config, importProvidersCall, recorder);
        }
    }
    tree.commitUpdate(recorder);
}
exports.addModuleImportToStandaloneBootstrap = addModuleImportToStandaloneBootstrap;
/**
 * Adds a providers function call to the `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path to the file that should be updated.
 * @param functionName Name of the function that should be called.
 * @param importPath Path from which to import the function.
 * @param args Arguments to use when calling the function.
 * @returns The file path that the provider was added to.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
function addFunctionalProvidersToStandaloneBootstrap(tree, filePath, functionName, importPath, args = []) {
    const sourceFile = createSourceFile(tree, filePath);
    const bootstrapCall = findBootstrapApplicationCall(sourceFile);
    const addImports = (file, recorder) => {
        const change = (0, ast_utils_1.insertImport)(file, file.getText(), functionName, importPath);
        if (change instanceof change_1.InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
        }
    };
    if (!bootstrapCall) {
        throw new schematics_1.SchematicsException(`Could not find bootstrapApplication call in ${filePath}`);
    }
    const providersCall = typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier(functionName), undefined, args);
    // If there's only one argument, we have to create a new object literal.
    if (bootstrapCall.arguments.length === 1) {
        const recorder = tree.beginUpdate(filePath);
        addNewAppConfigToCall(bootstrapCall, providersCall, recorder);
        addImports(sourceFile, recorder);
        tree.commitUpdate(recorder);
        return filePath;
    }
    // If the config is a `mergeApplicationProviders` call, add another config to it.
    if (isMergeAppConfigCall(bootstrapCall.arguments[1])) {
        const recorder = tree.beginUpdate(filePath);
        addNewAppConfigToCall(bootstrapCall.arguments[1], providersCall, recorder);
        addImports(sourceFile, recorder);
        tree.commitUpdate(recorder);
        return filePath;
    }
    // Otherwise attempt to merge into the current config.
    const appConfig = findAppConfig(bootstrapCall, tree, filePath);
    if (!appConfig) {
        throw new schematics_1.SchematicsException(`Could not statically analyze config in bootstrapApplication call in ${filePath}`);
    }
    const { filePath: configFilePath, node: config } = appConfig;
    const recorder = tree.beginUpdate(configFilePath);
    const providersLiteral = findProvidersLiteral(config);
    addImports(config.getSourceFile(), recorder);
    if (providersLiteral) {
        // If there's a `providers` array, add the import to it.
        addElementToArray(providersLiteral, providersCall, recorder);
    }
    else {
        // Otherwise add a `providers` array to the existing object literal.
        addProvidersToObjectLiteral(config, providersCall, recorder);
    }
    tree.commitUpdate(recorder);
    return configFilePath;
}
exports.addFunctionalProvidersToStandaloneBootstrap = addFunctionalProvidersToStandaloneBootstrap;
/**
 * Finds the call to `bootstrapApplication` within a file.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
function findBootstrapApplicationCall(sourceFile) {
    const localName = findImportLocalName(sourceFile, 'bootstrapApplication', '@angular/platform-browser');
    if (!localName) {
        return null;
    }
    let result = null;
    sourceFile.forEachChild(function walk(node) {
        if (typescript_1.default.isCallExpression(node) &&
            typescript_1.default.isIdentifier(node.expression) &&
            node.expression.text === localName) {
            result = node;
        }
        if (!result) {
            node.forEachChild(walk);
        }
    });
    return result;
}
exports.findBootstrapApplicationCall = findBootstrapApplicationCall;
/** Find a call to `importProvidersFrom` within an application config. */
function findImportProvidersFromCall(config) {
    const importProvidersName = findImportLocalName(config.getSourceFile(), 'importProvidersFrom', '@angular/core');
    const providersLiteral = findProvidersLiteral(config);
    if (providersLiteral && importProvidersName) {
        for (const element of providersLiteral.elements) {
            // Look for an array element that calls the `importProvidersFrom` function.
            if (typescript_1.default.isCallExpression(element) &&
                typescript_1.default.isIdentifier(element.expression) &&
                element.expression.text === importProvidersName) {
                return element;
            }
        }
    }
    return null;
}
/** Finds the `providers` array literal within an application config. */
function findProvidersLiteral(config) {
    for (const prop of config.properties) {
        if (typescript_1.default.isPropertyAssignment(prop) &&
            typescript_1.default.isIdentifier(prop.name) &&
            prop.name.text === 'providers' &&
            typescript_1.default.isArrayLiteralExpression(prop.initializer)) {
            return prop.initializer;
        }
    }
    return null;
}
/**
 * Resolves the node that defines the app config from a bootstrap call.
 * @param bootstrapCall Call for which to resolve the config.
 * @param tree File tree of the project.
 * @param filePath File path of the bootstrap call.
 */
function findAppConfig(bootstrapCall, tree, filePath) {
    if (bootstrapCall.arguments.length > 1) {
        const config = bootstrapCall.arguments[1];
        if (typescript_1.default.isObjectLiteralExpression(config)) {
            return { filePath, node: config };
        }
        if (typescript_1.default.isIdentifier(config)) {
            return resolveAppConfigFromIdentifier(config, tree, filePath);
        }
    }
    return null;
}
/**
 * Resolves the app config from an identifier referring to it.
 * @param identifier Identifier referring to the app config.
 * @param tree File tree of the project.
 * @param bootstapFilePath Path of the bootstrap call.
 */
function resolveAppConfigFromIdentifier(identifier, tree, bootstapFilePath) {
    const sourceFile = identifier.getSourceFile();
    for (const node of sourceFile.statements) {
        // Only look at relative imports. This will break if the app uses a path
        // mapping to refer to the import, but in order to resolve those, we would
        // need knowledge about the entire program.
        if (!typescript_1.default.isImportDeclaration(node) ||
            !node.importClause?.namedBindings ||
            !typescript_1.default.isNamedImports(node.importClause.namedBindings) ||
            !typescript_1.default.isStringLiteralLike(node.moduleSpecifier) ||
            !node.moduleSpecifier.text.startsWith('.')) {
            continue;
        }
        for (const specifier of node.importClause.namedBindings.elements) {
            if (specifier.name.text !== identifier.text) {
                continue;
            }
            // Look for a variable with the imported name in the file. Note that ideally we would use
            // the type checker to resolve this, but we can't because these utilities are set up to
            // operate on individual files, not the entire program.
            const filePath = (0, path_1.join)((0, path_1.dirname)(bootstapFilePath), node.moduleSpecifier.text + '.ts');
            const importedSourceFile = createSourceFile(tree, filePath);
            const resolvedVariable = findAppConfigFromVariableName(importedSourceFile, (specifier.propertyName || specifier.name).text);
            if (resolvedVariable) {
                return { filePath, node: resolvedVariable };
            }
        }
    }
    const variableInSameFile = findAppConfigFromVariableName(sourceFile, identifier.text);
    return variableInSameFile ? { filePath: bootstapFilePath, node: variableInSameFile } : null;
}
/**
 * Finds an app config within the top-level variables of a file.
 * @param sourceFile File in which to search for the config.
 * @param variableName Name of the variable containing the config.
 */
function findAppConfigFromVariableName(sourceFile, variableName) {
    for (const node of sourceFile.statements) {
        if (typescript_1.default.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (typescript_1.default.isIdentifier(decl.name) &&
                    decl.name.text === variableName &&
                    decl.initializer &&
                    typescript_1.default.isObjectLiteralExpression(decl.initializer)) {
                    return decl.initializer;
                }
            }
        }
    }
    return null;
}
/**
 * Finds the local name of an imported symbol. Could be the symbol name itself or its alias.
 * @param sourceFile File within which to search for the import.
 * @param name Actual name of the import, not its local alias.
 * @param moduleName Name of the module from which the symbol is imported.
 */
function findImportLocalName(sourceFile, name, moduleName) {
    for (const node of sourceFile.statements) {
        // Only look for top-level imports.
        if (!typescript_1.default.isImportDeclaration(node) ||
            !typescript_1.default.isStringLiteral(node.moduleSpecifier) ||
            node.moduleSpecifier.text !== moduleName) {
            continue;
        }
        // Filter out imports that don't have the right shape.
        if (!node.importClause ||
            !node.importClause.namedBindings ||
            !typescript_1.default.isNamedImports(node.importClause.namedBindings)) {
            continue;
        }
        // Look through the elements of the declaration for the specific import.
        for (const element of node.importClause.namedBindings.elements) {
            if ((element.propertyName || element.name).text === name) {
                // The local name is always in `name`.
                return element.name.text;
            }
        }
    }
    return null;
}
/** Creates a source file from a file path within a project. */
function createSourceFile(tree, filePath) {
    return typescript_1.default.createSourceFile(filePath, tree.readText(filePath), typescript_1.default.ScriptTarget.Latest, true);
}
/**
 * Creates a new app config object literal and adds it to a call expression as an argument.
 * @param call Call to which to add the config.
 * @param expression Expression that should inserted into the new config.
 * @param recorder Recorder to which to log the change.
 */
function addNewAppConfigToCall(call, expression, recorder) {
    const newCall = typescript_1.default.factory.updateCallExpression(call, call.expression, call.typeArguments, [
        ...call.arguments,
        typescript_1.default.factory.createObjectLiteralExpression([
            typescript_1.default.factory.createPropertyAssignment('providers', typescript_1.default.factory.createArrayLiteralExpression([expression])),
        ], true),
    ]);
    recorder.remove(call.getStart(), call.getWidth());
    recorder.insertRight(call.getStart(), typescript_1.default.createPrinter().printNode(typescript_1.default.EmitHint.Unspecified, newCall, call.getSourceFile()));
}
/**
 * Adds an element to an array literal expression.
 * @param node Array to which to add the element.
 * @param element Element to be added.
 * @param recorder Recorder to which to log the change.
 */
function addElementToArray(node, element, recorder) {
    const newLiteral = typescript_1.default.factory.updateArrayLiteralExpression(node, [...node.elements, element]);
    recorder.remove(node.getStart(), node.getWidth());
    recorder.insertRight(node.getStart(), typescript_1.default.createPrinter().printNode(typescript_1.default.EmitHint.Unspecified, newLiteral, node.getSourceFile()));
}
/**
 * Adds a `providers` property to an object literal.
 * @param node Literal to which to add the `providers`.
 * @param expression Provider that should be part of the generated `providers` array.
 * @param recorder Recorder to which to log the change.
 */
function addProvidersToObjectLiteral(node, expression, recorder) {
    const newOptionsLiteral = typescript_1.default.factory.updateObjectLiteralExpression(node, [
        ...node.properties,
        typescript_1.default.factory.createPropertyAssignment('providers', typescript_1.default.factory.createArrayLiteralExpression([expression])),
    ]);
    recorder.remove(node.getStart(), node.getWidth());
    recorder.insertRight(node.getStart(), typescript_1.default.createPrinter().printNode(typescript_1.default.EmitHint.Unspecified, newOptionsLiteral, node.getSourceFile()));
}
/** Checks whether a node is a call to `mergeApplicationConfig`. */
function isMergeAppConfigCall(node) {
    if (!typescript_1.default.isCallExpression(node)) {
        return false;
    }
    const localName = findImportLocalName(node.getSourceFile(), 'mergeApplicationConfig', '@angular/core');
    return !!localName && typescript_1.default.isIdentifier(node.expression) && node.expression.text === localName;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9wcml2YXRlL3N0YW5kYWxvbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBRUgsMkRBQXVGO0FBQ3ZGLCtCQUFxQztBQUNyQywrR0FBK0U7QUFDL0Usb0RBQW9EO0FBQ3BELDhDQUFpRDtBQVdqRDs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQUMsSUFBVSxFQUFFLFFBQWdCLEVBQUUsU0FBaUI7SUFDbEYsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sYUFBYSxHQUFHLDRCQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN0RixNQUFNLHVCQUF1QixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsMkJBQTJCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFL0YsT0FBTyxDQUFDLENBQUMsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FDOUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLG9CQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUN4RCxDQUFDO0FBQ0osQ0FBQztBQVRELG9EQVNDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLHNCQUFzQixDQUNwQyxJQUFVLEVBQ1YsUUFBZ0IsRUFDaEIsWUFBb0I7SUFFcEIsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsSUFB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QW9CLENBQUMsSUFBYTtJQUN6QyxJQUFJLENBQUMsb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM5QixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQ25DLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFDcEIsd0JBQXdCLEVBQ3hCLGVBQWUsQ0FDaEIsQ0FBQztJQUVGLE9BQU8sQ0FBQyxDQUFDLFNBQVMsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO0FBQy9GLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSwgVXBkYXRlUmVjb3JkZXIgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAnLi4vdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBpbnNlcnRJbXBvcnQgfSBmcm9tICcuLi91dGlsaXR5L2FzdC11dGlscyc7XG5pbXBvcnQgeyBJbnNlcnRDaGFuZ2UgfSBmcm9tICcuLi91dGlsaXR5L2NoYW5nZSc7XG5cbi8qKiBBcHAgY29uZmlnIHRoYXQgd2FzIHJlc29sdmVkIHRvIGl0cyBzb3VyY2Ugbm9kZS4gKi9cbmludGVyZmFjZSBSZXNvbHZlZEFwcENvbmZpZyB7XG4gIC8qKiBUcmVlLXJlbGF0aXZlIHBhdGggb2YgdGhlIGZpbGUgY29udGFpbmluZyB0aGUgYXBwIGNvbmZpZy4gKi9cbiAgZmlsZVBhdGg6IHN0cmluZztcblxuICAvKiogTm9kZSBkZWZpbmluZyB0aGUgYXBwIGNvbmZpZy4gKi9cbiAgbm9kZTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIHByb3ZpZGVycyBmcm9tIGEgbW9kdWxlIGFyZSBiZWluZyBpbXBvcnRlZCBpbiBhIGBib290c3RyYXBBcHBsaWNhdGlvbmAgY2FsbC5cbiAqIEBwYXJhbSB0cmVlIEZpbGUgdHJlZSBvZiB0aGUgcHJvamVjdC5cbiAqIEBwYXJhbSBmaWxlUGF0aCBQYXRoIG9mIHRoZSBmaWxlIGluIHdoaWNoIHRvIGNoZWNrLlxuICogQHBhcmFtIGNsYXNzTmFtZSBDbGFzcyBuYW1lIG9mIHRoZSBtb2R1bGUgdG8gc2VhcmNoIGZvci5cbiAqIEBkZXByZWNhdGVkIFByaXZhdGUgdXRpbGl0eSB0aGF0IHdpbGwgYmUgcmVtb3ZlZC4gVXNlIGBhZGRSb290SW1wb3J0YCBvciBgYWRkUm9vdFByb3ZpZGVyYCBmcm9tXG4gKiBgQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5YCBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW1wb3J0c1Byb3ZpZGVyc0Zyb20odHJlZTogVHJlZSwgZmlsZVBhdGg6IHN0cmluZywgY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgc291cmNlRmlsZSA9IGNyZWF0ZVNvdXJjZUZpbGUodHJlZSwgZmlsZVBhdGgpO1xuICBjb25zdCBib290c3RyYXBDYWxsID0gZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbChzb3VyY2VGaWxlKTtcbiAgY29uc3QgYXBwQ29uZmlnID0gYm9vdHN0cmFwQ2FsbCA/IGZpbmRBcHBDb25maWcoYm9vdHN0cmFwQ2FsbCwgdHJlZSwgZmlsZVBhdGgpIDogbnVsbDtcbiAgY29uc3QgaW1wb3J0UHJvdmlkZXJzRnJvbUNhbGwgPSBhcHBDb25maWcgPyBmaW5kSW1wb3J0UHJvdmlkZXJzRnJvbUNhbGwoYXBwQ29uZmlnLm5vZGUpIDogbnVsbDtcblxuICByZXR1cm4gISFpbXBvcnRQcm92aWRlcnNGcm9tQ2FsbD8uYXJndW1lbnRzLnNvbWUoXG4gICAgKGFyZykgPT4gdHMuaXNJZGVudGlmaWVyKGFyZykgJiYgYXJnLnRleHQgPT09IGNsYXNzTmFtZSxcbiAgKTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIHByb3ZpZGVycyBmdW5jdGlvbiBpcyBiZWluZyBjYWxsZWQgaW4gYSBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGwuXG4gKiBAcGFyYW0gdHJlZSBGaWxlIHRyZWUgb2YgdGhlIHByb2plY3QuXG4gKiBAcGFyYW0gZmlsZVBhdGggUGF0aCBvZiB0aGUgZmlsZSBpbiB3aGljaCB0byBjaGVjay5cbiAqIEBwYXJhbSBmdW5jdGlvbk5hbWUgTmFtZSBvZiB0aGUgZnVuY3Rpb24gdG8gc2VhcmNoIGZvci5cbiAqIEBkZXByZWNhdGVkIFByaXZhdGUgdXRpbGl0eSB0aGF0IHdpbGwgYmUgcmVtb3ZlZC4gVXNlIGBhZGRSb290SW1wb3J0YCBvciBgYWRkUm9vdFByb3ZpZGVyYCBmcm9tXG4gKiBgQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5YCBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbHNQcm92aWRlcnNGdW5jdGlvbihcbiAgdHJlZTogVHJlZSxcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgZnVuY3Rpb25OYW1lOiBzdHJpbmcsXG4pOiBib29sZWFuIHtcbiAgY29uc3Qgc291cmNlRmlsZSA9IGNyZWF0ZVNvdXJjZUZpbGUodHJlZSwgZmlsZVBhdGgpO1xuICBjb25zdCBib290c3RyYXBDYWxsID0gZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbChzb3VyY2VGaWxlKTtcbiAgY29uc3QgYXBwQ29uZmlnID0gYm9vdHN0cmFwQ2FsbCA/IGZpbmRBcHBDb25maWcoYm9vdHN0cmFwQ2FsbCwgdHJlZSwgZmlsZVBhdGgpIDogbnVsbDtcbiAgY29uc3QgcHJvdmlkZXJzTGl0ZXJhbCA9IGFwcENvbmZpZyA/IGZpbmRQcm92aWRlcnNMaXRlcmFsKGFwcENvbmZpZy5ub2RlKSA6IG51bGw7XG5cbiAgcmV0dXJuICEhcHJvdmlkZXJzTGl0ZXJhbD8uZWxlbWVudHMuc29tZShcbiAgICAoZWwpID0+XG4gICAgICB0cy5pc0NhbGxFeHByZXNzaW9uKGVsKSAmJlxuICAgICAgdHMuaXNJZGVudGlmaWVyKGVsLmV4cHJlc3Npb24pICYmXG4gICAgICBlbC5leHByZXNzaW9uLnRleHQgPT09IGZ1bmN0aW9uTmFtZSxcbiAgKTtcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBjYWxsIHRvIHRoZSBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGwuXG4gKiBAcGFyYW0gdHJlZSBGaWxlIHRyZWUgb2YgdGhlIHByb2plY3QuXG4gKiBAcGFyYW0gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZSB0aGF0IHNob3VsZCBiZSB1cGRhdGVkLlxuICogQHBhcmFtIG1vZHVsZU5hbWUgTmFtZSBvZiB0aGUgbW9kdWxlIHRoYXQgc2hvdWxkIGJlIGltcG9ydGVkLlxuICogQHBhcmFtIG1vZHVsZVBhdGggUGF0aCBmcm9tIHdoaWNoIHRvIGltcG9ydCB0aGUgbW9kdWxlLlxuICogQGRlcHJlY2F0ZWQgUHJpdmF0ZSB1dGlsaXR5IHRoYXQgd2lsbCBiZSByZW1vdmVkLiBVc2UgYGFkZFJvb3RJbXBvcnRgIG9yIGBhZGRSb290UHJvdmlkZXJgIGZyb21cbiAqIGBAc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHlgIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRNb2R1bGVJbXBvcnRUb1N0YW5kYWxvbmVCb290c3RyYXAoXG4gIHRyZWU6IFRyZWUsXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG1vZHVsZU5hbWU6IHN0cmluZyxcbiAgbW9kdWxlUGF0aDogc3RyaW5nLFxuKSB7XG4gIGNvbnN0IHNvdXJjZUZpbGUgPSBjcmVhdGVTb3VyY2VGaWxlKHRyZWUsIGZpbGVQYXRoKTtcbiAgY29uc3QgYm9vdHN0cmFwQ2FsbCA9IGZpbmRCb290c3RyYXBBcHBsaWNhdGlvbkNhbGwoc291cmNlRmlsZSk7XG4gIGNvbnN0IGFkZEltcG9ydHMgPSAoZmlsZTogdHMuU291cmNlRmlsZSwgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyKSA9PiB7XG4gICAgY29uc3Qgc291cmNlVGV4dCA9IGZpbGUuZ2V0VGV4dCgpO1xuXG4gICAgW1xuICAgICAgaW5zZXJ0SW1wb3J0KGZpbGUsIHNvdXJjZVRleHQsIG1vZHVsZU5hbWUsIG1vZHVsZVBhdGgpLFxuICAgICAgaW5zZXJ0SW1wb3J0KGZpbGUsIHNvdXJjZVRleHQsICdpbXBvcnRQcm92aWRlcnNGcm9tJywgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICBdLmZvckVhY2goKGNoYW5nZSkgPT4ge1xuICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICByZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgaWYgKCFib290c3RyYXBDYWxsKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCBmaW5kIGJvb3RzdHJhcEFwcGxpY2F0aW9uIGNhbGwgaW4gJHtmaWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGltcG9ydFByb3ZpZGVyc0NhbGwgPSB0cy5mYWN0b3J5LmNyZWF0ZUNhbGxFeHByZXNzaW9uKFxuICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcignaW1wb3J0UHJvdmlkZXJzRnJvbScpLFxuICAgIFtdLFxuICAgIFt0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIobW9kdWxlTmFtZSldLFxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgYXJndW1lbnQsIHdlIGhhdmUgdG8gY3JlYXRlIGEgbmV3IG9iamVjdCBsaXRlcmFsLlxuICBpZiAoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICBhZGROZXdBcHBDb25maWdUb0NhbGwoYm9vdHN0cmFwQ2FsbCwgaW1wb3J0UHJvdmlkZXJzQ2FsbCwgcmVjb3JkZXIpO1xuICAgIGFkZEltcG9ydHMoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHRyZWUuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb25maWcgaXMgYSBgbWVyZ2VBcHBsaWNhdGlvblByb3ZpZGVyc2AgY2FsbCwgYWRkIGFub3RoZXIgY29uZmlnIHRvIGl0LlxuICBpZiAoaXNNZXJnZUFwcENvbmZpZ0NhbGwoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHNbMV0pKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICBhZGROZXdBcHBDb25maWdUb0NhbGwoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHNbMV0sIGltcG9ydFByb3ZpZGVyc0NhbGwsIHJlY29yZGVyKTtcbiAgICBhZGRJbXBvcnRzKHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBPdGhlcndpc2UgYXR0ZW1wdCB0byBtZXJnZSBpbnRvIHRoZSBjdXJyZW50IGNvbmZpZy5cbiAgY29uc3QgYXBwQ29uZmlnID0gZmluZEFwcENvbmZpZyhib290c3RyYXBDYWxsLCB0cmVlLCBmaWxlUGF0aCk7XG5cbiAgaWYgKCFhcHBDb25maWcpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBDb3VsZCBub3Qgc3RhdGljYWxseSBhbmFseXplIGNvbmZpZyBpbiBib290c3RyYXBBcHBsaWNhdGlvbiBjYWxsIGluICR7ZmlsZVBhdGh9YCxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgeyBmaWxlUGF0aDogY29uZmlnRmlsZVBhdGgsIG5vZGU6IGNvbmZpZyB9ID0gYXBwQ29uZmlnO1xuICBjb25zdCByZWNvcmRlciA9IHRyZWUuYmVnaW5VcGRhdGUoY29uZmlnRmlsZVBhdGgpO1xuICBjb25zdCBpbXBvcnRDYWxsID0gZmluZEltcG9ydFByb3ZpZGVyc0Zyb21DYWxsKGNvbmZpZyk7XG5cbiAgYWRkSW1wb3J0cyhjb25maWcuZ2V0U291cmNlRmlsZSgpLCByZWNvcmRlcik7XG5cbiAgaWYgKGltcG9ydENhbGwpIHtcbiAgICAvLyBJZiB0aGVyZSdzIGFuIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBjYWxsIGFscmVhZHksIGFkZCB0aGUgbW9kdWxlIHRvIGl0LlxuICAgIHJlY29yZGVyLmluc2VydFJpZ2h0KFxuICAgICAgaW1wb3J0Q2FsbC5hcmd1bWVudHNbaW1wb3J0Q2FsbC5hcmd1bWVudHMubGVuZ3RoIC0gMV0uZ2V0RW5kKCksXG4gICAgICBgLCAke21vZHVsZU5hbWV9YCxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHByb3ZpZGVyc0xpdGVyYWwgPSBmaW5kUHJvdmlkZXJzTGl0ZXJhbChjb25maWcpO1xuXG4gICAgaWYgKHByb3ZpZGVyc0xpdGVyYWwpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3MgYSBgcHJvdmlkZXJzYCBhcnJheSwgYWRkIHRoZSBpbXBvcnQgdG8gaXQuXG4gICAgICBhZGRFbGVtZW50VG9BcnJheShwcm92aWRlcnNMaXRlcmFsLCBpbXBvcnRQcm92aWRlcnNDYWxsLCByZWNvcmRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBhZGQgYSBgcHJvdmlkZXJzYCBhcnJheSB0byB0aGUgZXhpc3Rpbmcgb2JqZWN0IGxpdGVyYWwuXG4gICAgICBhZGRQcm92aWRlcnNUb09iamVjdExpdGVyYWwoY29uZmlnLCBpbXBvcnRQcm92aWRlcnNDYWxsLCByZWNvcmRlcik7XG4gICAgfVxuICB9XG5cbiAgdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xufVxuXG4vKipcbiAqIEFkZHMgYSBwcm92aWRlcnMgZnVuY3Rpb24gY2FsbCB0byB0aGUgYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCBjYWxsLlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGUgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBmdW5jdGlvbk5hbWUgTmFtZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgY2FsbGVkLlxuICogQHBhcmFtIGltcG9ydFBhdGggUGF0aCBmcm9tIHdoaWNoIHRvIGltcG9ydCB0aGUgZnVuY3Rpb24uXG4gKiBAcGFyYW0gYXJncyBBcmd1bWVudHMgdG8gdXNlIHdoZW4gY2FsbGluZyB0aGUgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgZmlsZSBwYXRoIHRoYXQgdGhlIHByb3ZpZGVyIHdhcyBhZGRlZCB0by5cbiAqIEBkZXByZWNhdGVkIFByaXZhdGUgdXRpbGl0eSB0aGF0IHdpbGwgYmUgcmVtb3ZlZC4gVXNlIGBhZGRSb290SW1wb3J0YCBvciBgYWRkUm9vdFByb3ZpZGVyYCBmcm9tXG4gKiBgQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5YCBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRnVuY3Rpb25hbFByb3ZpZGVyc1RvU3RhbmRhbG9uZUJvb3RzdHJhcChcbiAgdHJlZTogVHJlZSxcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgZnVuY3Rpb25OYW1lOiBzdHJpbmcsXG4gIGltcG9ydFBhdGg6IHN0cmluZyxcbiAgYXJnczogdHMuRXhwcmVzc2lvbltdID0gW10sXG4pOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2VGaWxlID0gY3JlYXRlU291cmNlRmlsZSh0cmVlLCBmaWxlUGF0aCk7XG4gIGNvbnN0IGJvb3RzdHJhcENhbGwgPSBmaW5kQm9vdHN0cmFwQXBwbGljYXRpb25DYWxsKHNvdXJjZUZpbGUpO1xuICBjb25zdCBhZGRJbXBvcnRzID0gKGZpbGU6IHRzLlNvdXJjZUZpbGUsIHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlcikgPT4ge1xuICAgIGNvbnN0IGNoYW5nZSA9IGluc2VydEltcG9ydChmaWxlLCBmaWxlLmdldFRleHQoKSwgZnVuY3Rpb25OYW1lLCBpbXBvcnRQYXRoKTtcblxuICAgIGlmIChjaGFuZ2UgaW5zdGFuY2VvZiBJbnNlcnRDaGFuZ2UpIHtcbiAgICAgIHJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKCFib290c3RyYXBDYWxsKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCBmaW5kIGJvb3RzdHJhcEFwcGxpY2F0aW9uIGNhbGwgaW4gJHtmaWxlUGF0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IHByb3ZpZGVyc0NhbGwgPSB0cy5mYWN0b3J5LmNyZWF0ZUNhbGxFeHByZXNzaW9uKFxuICAgIHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcihmdW5jdGlvbk5hbWUpLFxuICAgIHVuZGVmaW5lZCxcbiAgICBhcmdzLFxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgYXJndW1lbnQsIHdlIGhhdmUgdG8gY3JlYXRlIGEgbmV3IG9iamVjdCBsaXRlcmFsLlxuICBpZiAoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICBhZGROZXdBcHBDb25maWdUb0NhbGwoYm9vdHN0cmFwQ2FsbCwgcHJvdmlkZXJzQ2FsbCwgcmVjb3JkZXIpO1xuICAgIGFkZEltcG9ydHMoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHRyZWUuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcblxuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb25maWcgaXMgYSBgbWVyZ2VBcHBsaWNhdGlvblByb3ZpZGVyc2AgY2FsbCwgYWRkIGFub3RoZXIgY29uZmlnIHRvIGl0LlxuICBpZiAoaXNNZXJnZUFwcENvbmZpZ0NhbGwoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHNbMV0pKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICBhZGROZXdBcHBDb25maWdUb0NhbGwoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHNbMV0sIHByb3ZpZGVyc0NhbGwsIHJlY29yZGVyKTtcbiAgICBhZGRJbXBvcnRzKHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcik7XG5cbiAgICByZXR1cm4gZmlsZVBhdGg7XG4gIH1cblxuICAvLyBPdGhlcndpc2UgYXR0ZW1wdCB0byBtZXJnZSBpbnRvIHRoZSBjdXJyZW50IGNvbmZpZy5cbiAgY29uc3QgYXBwQ29uZmlnID0gZmluZEFwcENvbmZpZyhib290c3RyYXBDYWxsLCB0cmVlLCBmaWxlUGF0aCk7XG5cbiAgaWYgKCFhcHBDb25maWcpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBDb3VsZCBub3Qgc3RhdGljYWxseSBhbmFseXplIGNvbmZpZyBpbiBib290c3RyYXBBcHBsaWNhdGlvbiBjYWxsIGluICR7ZmlsZVBhdGh9YCxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgeyBmaWxlUGF0aDogY29uZmlnRmlsZVBhdGgsIG5vZGU6IGNvbmZpZyB9ID0gYXBwQ29uZmlnO1xuICBjb25zdCByZWNvcmRlciA9IHRyZWUuYmVnaW5VcGRhdGUoY29uZmlnRmlsZVBhdGgpO1xuICBjb25zdCBwcm92aWRlcnNMaXRlcmFsID0gZmluZFByb3ZpZGVyc0xpdGVyYWwoY29uZmlnKTtcblxuICBhZGRJbXBvcnRzKGNvbmZpZy5nZXRTb3VyY2VGaWxlKCksIHJlY29yZGVyKTtcblxuICBpZiAocHJvdmlkZXJzTGl0ZXJhbCkge1xuICAgIC8vIElmIHRoZXJlJ3MgYSBgcHJvdmlkZXJzYCBhcnJheSwgYWRkIHRoZSBpbXBvcnQgdG8gaXQuXG4gICAgYWRkRWxlbWVudFRvQXJyYXkocHJvdmlkZXJzTGl0ZXJhbCwgcHJvdmlkZXJzQ2FsbCwgcmVjb3JkZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSBhZGQgYSBgcHJvdmlkZXJzYCBhcnJheSB0byB0aGUgZXhpc3Rpbmcgb2JqZWN0IGxpdGVyYWwuXG4gICAgYWRkUHJvdmlkZXJzVG9PYmplY3RMaXRlcmFsKGNvbmZpZywgcHJvdmlkZXJzQ2FsbCwgcmVjb3JkZXIpO1xuICB9XG5cbiAgdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuXG4gIHJldHVybiBjb25maWdGaWxlUGF0aDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2FsbCB0byBgYm9vdHN0cmFwQXBwbGljYXRpb25gIHdpdGhpbiBhIGZpbGUuXG4gKiBAZGVwcmVjYXRlZCBQcml2YXRlIHV0aWxpdHkgdGhhdCB3aWxsIGJlIHJlbW92ZWQuIFVzZSBgYWRkUm9vdEltcG9ydGAgb3IgYGFkZFJvb3RQcm92aWRlcmAgZnJvbVxuICogYEBzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eWAgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRCb290c3RyYXBBcHBsaWNhdGlvbkNhbGwoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHRzLkNhbGxFeHByZXNzaW9uIHwgbnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZSA9IGZpbmRJbXBvcnRMb2NhbE5hbWUoXG4gICAgc291cmNlRmlsZSxcbiAgICAnYm9vdHN0cmFwQXBwbGljYXRpb24nLFxuICAgICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJyxcbiAgKTtcblxuICBpZiAoIWxvY2FsTmFtZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbGV0IHJlc3VsdDogdHMuQ2FsbEV4cHJlc3Npb24gfCBudWxsID0gbnVsbDtcblxuICBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZChmdW5jdGlvbiB3YWxrKG5vZGUpIHtcbiAgICBpZiAoXG4gICAgICB0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmXG4gICAgICB0cy5pc0lkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgbm9kZS5leHByZXNzaW9uLnRleHQgPT09IGxvY2FsTmFtZVxuICAgICkge1xuICAgICAgcmVzdWx0ID0gbm9kZTtcbiAgICB9XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgbm9kZS5mb3JFYWNoQ2hpbGQod2Fsayk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogRmluZCBhIGNhbGwgdG8gYGltcG9ydFByb3ZpZGVyc0Zyb21gIHdpdGhpbiBhbiBhcHBsaWNhdGlvbiBjb25maWcuICovXG5mdW5jdGlvbiBmaW5kSW1wb3J0UHJvdmlkZXJzRnJvbUNhbGwoY29uZmlnOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbik6IHRzLkNhbGxFeHByZXNzaW9uIHwgbnVsbCB7XG4gIGNvbnN0IGltcG9ydFByb3ZpZGVyc05hbWUgPSBmaW5kSW1wb3J0TG9jYWxOYW1lKFxuICAgIGNvbmZpZy5nZXRTb3VyY2VGaWxlKCksXG4gICAgJ2ltcG9ydFByb3ZpZGVyc0Zyb20nLFxuICAgICdAYW5ndWxhci9jb3JlJyxcbiAgKTtcbiAgY29uc3QgcHJvdmlkZXJzTGl0ZXJhbCA9IGZpbmRQcm92aWRlcnNMaXRlcmFsKGNvbmZpZyk7XG5cbiAgaWYgKHByb3ZpZGVyc0xpdGVyYWwgJiYgaW1wb3J0UHJvdmlkZXJzTmFtZSkge1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBwcm92aWRlcnNMaXRlcmFsLmVsZW1lbnRzKSB7XG4gICAgICAvLyBMb29rIGZvciBhbiBhcnJheSBlbGVtZW50IHRoYXQgY2FsbHMgdGhlIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBmdW5jdGlvbi5cbiAgICAgIGlmIChcbiAgICAgICAgdHMuaXNDYWxsRXhwcmVzc2lvbihlbGVtZW50KSAmJlxuICAgICAgICB0cy5pc0lkZW50aWZpZXIoZWxlbWVudC5leHByZXNzaW9uKSAmJlxuICAgICAgICBlbGVtZW50LmV4cHJlc3Npb24udGV4dCA9PT0gaW1wb3J0UHJvdmlkZXJzTmFtZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogRmluZHMgdGhlIGBwcm92aWRlcnNgIGFycmF5IGxpdGVyYWwgd2l0aGluIGFuIGFwcGxpY2F0aW9uIGNvbmZpZy4gKi9cbmZ1bmN0aW9uIGZpbmRQcm92aWRlcnNMaXRlcmFsKFxuICBjb25maWc6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uLFxuKTogdHMuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbiB8IG51bGwge1xuICBmb3IgKGNvbnN0IHByb3Agb2YgY29uZmlnLnByb3BlcnRpZXMpIHtcbiAgICBpZiAoXG4gICAgICB0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wKSAmJlxuICAgICAgdHMuaXNJZGVudGlmaWVyKHByb3AubmFtZSkgJiZcbiAgICAgIHByb3AubmFtZS50ZXh0ID09PSAncHJvdmlkZXJzJyAmJlxuICAgICAgdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKHByb3AuaW5pdGlhbGl6ZXIpXG4gICAgKSB7XG4gICAgICByZXR1cm4gcHJvcC5pbml0aWFsaXplcjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgbm9kZSB0aGF0IGRlZmluZXMgdGhlIGFwcCBjb25maWcgZnJvbSBhIGJvb3RzdHJhcCBjYWxsLlxuICogQHBhcmFtIGJvb3RzdHJhcENhbGwgQ2FsbCBmb3Igd2hpY2ggdG8gcmVzb2x2ZSB0aGUgY29uZmlnLlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIGZpbGVQYXRoIEZpbGUgcGF0aCBvZiB0aGUgYm9vdHN0cmFwIGNhbGwuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBcHBDb25maWcoXG4gIGJvb3RzdHJhcENhbGw6IHRzLkNhbGxFeHByZXNzaW9uLFxuICB0cmVlOiBUcmVlLFxuICBmaWxlUGF0aDogc3RyaW5nLFxuKTogUmVzb2x2ZWRBcHBDb25maWcgfCBudWxsIHtcbiAgaWYgKGJvb3RzdHJhcENhbGwuYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zdCBjb25maWcgPSBib290c3RyYXBDYWxsLmFyZ3VtZW50c1sxXTtcblxuICAgIGlmICh0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGNvbmZpZykpIHtcbiAgICAgIHJldHVybiB7IGZpbGVQYXRoLCBub2RlOiBjb25maWcgfTtcbiAgICB9XG5cbiAgICBpZiAodHMuaXNJZGVudGlmaWVyKGNvbmZpZykpIHtcbiAgICAgIHJldHVybiByZXNvbHZlQXBwQ29uZmlnRnJvbUlkZW50aWZpZXIoY29uZmlnLCB0cmVlLCBmaWxlUGF0aCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIGFwcCBjb25maWcgZnJvbSBhbiBpZGVudGlmaWVyIHJlZmVycmluZyB0byBpdC5cbiAqIEBwYXJhbSBpZGVudGlmaWVyIElkZW50aWZpZXIgcmVmZXJyaW5nIHRvIHRoZSBhcHAgY29uZmlnLlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIGJvb3RzdGFwRmlsZVBhdGggUGF0aCBvZiB0aGUgYm9vdHN0cmFwIGNhbGwuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVBcHBDb25maWdGcm9tSWRlbnRpZmllcihcbiAgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcixcbiAgdHJlZTogVHJlZSxcbiAgYm9vdHN0YXBGaWxlUGF0aDogc3RyaW5nLFxuKTogUmVzb2x2ZWRBcHBDb25maWcgfCBudWxsIHtcbiAgY29uc3Qgc291cmNlRmlsZSA9IGlkZW50aWZpZXIuZ2V0U291cmNlRmlsZSgpO1xuXG4gIGZvciAoY29uc3Qgbm9kZSBvZiBzb3VyY2VGaWxlLnN0YXRlbWVudHMpIHtcbiAgICAvLyBPbmx5IGxvb2sgYXQgcmVsYXRpdmUgaW1wb3J0cy4gVGhpcyB3aWxsIGJyZWFrIGlmIHRoZSBhcHAgdXNlcyBhIHBhdGhcbiAgICAvLyBtYXBwaW5nIHRvIHJlZmVyIHRvIHRoZSBpbXBvcnQsIGJ1dCBpbiBvcmRlciB0byByZXNvbHZlIHRob3NlLCB3ZSB3b3VsZFxuICAgIC8vIG5lZWQga25vd2xlZGdlIGFib3V0IHRoZSBlbnRpcmUgcHJvZ3JhbS5cbiAgICBpZiAoXG4gICAgICAhdHMuaXNJbXBvcnREZWNsYXJhdGlvbihub2RlKSB8fFxuICAgICAgIW5vZGUuaW1wb3J0Q2xhdXNlPy5uYW1lZEJpbmRpbmdzIHx8XG4gICAgICAhdHMuaXNOYW1lZEltcG9ydHMobm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncykgfHxcbiAgICAgICF0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKG5vZGUubW9kdWxlU3BlY2lmaWVyKSB8fFxuICAgICAgIW5vZGUubW9kdWxlU3BlY2lmaWVyLnRleHQuc3RhcnRzV2l0aCgnLicpXG4gICAgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNwZWNpZmllciBvZiBub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzLmVsZW1lbnRzKSB7XG4gICAgICBpZiAoc3BlY2lmaWVyLm5hbWUudGV4dCAhPT0gaWRlbnRpZmllci50ZXh0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29rIGZvciBhIHZhcmlhYmxlIHdpdGggdGhlIGltcG9ydGVkIG5hbWUgaW4gdGhlIGZpbGUuIE5vdGUgdGhhdCBpZGVhbGx5IHdlIHdvdWxkIHVzZVxuICAgICAgLy8gdGhlIHR5cGUgY2hlY2tlciB0byByZXNvbHZlIHRoaXMsIGJ1dCB3ZSBjYW4ndCBiZWNhdXNlIHRoZXNlIHV0aWxpdGllcyBhcmUgc2V0IHVwIHRvXG4gICAgICAvLyBvcGVyYXRlIG9uIGluZGl2aWR1YWwgZmlsZXMsIG5vdCB0aGUgZW50aXJlIHByb2dyYW0uXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IGpvaW4oZGlybmFtZShib290c3RhcEZpbGVQYXRoKSwgbm9kZS5tb2R1bGVTcGVjaWZpZXIudGV4dCArICcudHMnKTtcbiAgICAgIGNvbnN0IGltcG9ydGVkU291cmNlRmlsZSA9IGNyZWF0ZVNvdXJjZUZpbGUodHJlZSwgZmlsZVBhdGgpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRWYXJpYWJsZSA9IGZpbmRBcHBDb25maWdGcm9tVmFyaWFibGVOYW1lKFxuICAgICAgICBpbXBvcnRlZFNvdXJjZUZpbGUsXG4gICAgICAgIChzcGVjaWZpZXIucHJvcGVydHlOYW1lIHx8IHNwZWNpZmllci5uYW1lKS50ZXh0LFxuICAgICAgKTtcblxuICAgICAgaWYgKHJlc29sdmVkVmFyaWFibGUpIHtcbiAgICAgICAgcmV0dXJuIHsgZmlsZVBhdGgsIG5vZGU6IHJlc29sdmVkVmFyaWFibGUgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB2YXJpYWJsZUluU2FtZUZpbGUgPSBmaW5kQXBwQ29uZmlnRnJvbVZhcmlhYmxlTmFtZShzb3VyY2VGaWxlLCBpZGVudGlmaWVyLnRleHQpO1xuXG4gIHJldHVybiB2YXJpYWJsZUluU2FtZUZpbGUgPyB7IGZpbGVQYXRoOiBib290c3RhcEZpbGVQYXRoLCBub2RlOiB2YXJpYWJsZUluU2FtZUZpbGUgfSA6IG51bGw7XG59XG5cbi8qKlxuICogRmluZHMgYW4gYXBwIGNvbmZpZyB3aXRoaW4gdGhlIHRvcC1sZXZlbCB2YXJpYWJsZXMgb2YgYSBmaWxlLlxuICogQHBhcmFtIHNvdXJjZUZpbGUgRmlsZSBpbiB3aGljaCB0byBzZWFyY2ggZm9yIHRoZSBjb25maWcuXG4gKiBAcGFyYW0gdmFyaWFibGVOYW1lIE5hbWUgb2YgdGhlIHZhcmlhYmxlIGNvbnRhaW5pbmcgdGhlIGNvbmZpZy5cbiAqL1xuZnVuY3Rpb24gZmluZEFwcENvbmZpZ0Zyb21WYXJpYWJsZU5hbWUoXG4gIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsXG4gIHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuKTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24gfCBudWxsIHtcbiAgZm9yIChjb25zdCBub2RlIG9mIHNvdXJjZUZpbGUuc3RhdGVtZW50cykge1xuICAgIGlmICh0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KG5vZGUpKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlY2wgb2Ygbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0cy5pc0lkZW50aWZpZXIoZGVjbC5uYW1lKSAmJlxuICAgICAgICAgIGRlY2wubmFtZS50ZXh0ID09PSB2YXJpYWJsZU5hbWUgJiZcbiAgICAgICAgICBkZWNsLmluaXRpYWxpemVyICYmXG4gICAgICAgICAgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihkZWNsLmluaXRpYWxpemVyKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZGVjbC5pbml0aWFsaXplcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBsb2NhbCBuYW1lIG9mIGFuIGltcG9ydGVkIHN5bWJvbC4gQ291bGQgYmUgdGhlIHN5bWJvbCBuYW1lIGl0c2VsZiBvciBpdHMgYWxpYXMuXG4gKiBAcGFyYW0gc291cmNlRmlsZSBGaWxlIHdpdGhpbiB3aGljaCB0byBzZWFyY2ggZm9yIHRoZSBpbXBvcnQuXG4gKiBAcGFyYW0gbmFtZSBBY3R1YWwgbmFtZSBvZiB0aGUgaW1wb3J0LCBub3QgaXRzIGxvY2FsIGFsaWFzLlxuICogQHBhcmFtIG1vZHVsZU5hbWUgTmFtZSBvZiB0aGUgbW9kdWxlIGZyb20gd2hpY2ggdGhlIHN5bWJvbCBpcyBpbXBvcnRlZC5cbiAqL1xuZnVuY3Rpb24gZmluZEltcG9ydExvY2FsTmFtZShcbiAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbiAgbmFtZTogc3RyaW5nLFxuICBtb2R1bGVOYW1lOiBzdHJpbmcsXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgZm9yIChjb25zdCBub2RlIG9mIHNvdXJjZUZpbGUuc3RhdGVtZW50cykge1xuICAgIC8vIE9ubHkgbG9vayBmb3IgdG9wLWxldmVsIGltcG9ydHMuXG4gICAgaWYgKFxuICAgICAgIXRzLmlzSW1wb3J0RGVjbGFyYXRpb24obm9kZSkgfHxcbiAgICAgICF0cy5pc1N0cmluZ0xpdGVyYWwobm9kZS5tb2R1bGVTcGVjaWZpZXIpIHx8XG4gICAgICBub2RlLm1vZHVsZVNwZWNpZmllci50ZXh0ICE9PSBtb2R1bGVOYW1lXG4gICAgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXIgb3V0IGltcG9ydHMgdGhhdCBkb24ndCBoYXZlIHRoZSByaWdodCBzaGFwZS5cbiAgICBpZiAoXG4gICAgICAhbm9kZS5pbXBvcnRDbGF1c2UgfHxcbiAgICAgICFub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzIHx8XG4gICAgICAhdHMuaXNOYW1lZEltcG9ydHMobm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncylcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIExvb2sgdGhyb3VnaCB0aGUgZWxlbWVudHMgb2YgdGhlIGRlY2xhcmF0aW9uIGZvciB0aGUgc3BlY2lmaWMgaW1wb3J0LlxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzLmVsZW1lbnRzKSB7XG4gICAgICBpZiAoKGVsZW1lbnQucHJvcGVydHlOYW1lIHx8IGVsZW1lbnQubmFtZSkudGV4dCA9PT0gbmFtZSkge1xuICAgICAgICAvLyBUaGUgbG9jYWwgbmFtZSBpcyBhbHdheXMgaW4gYG5hbWVgLlxuICAgICAgICByZXR1cm4gZWxlbWVudC5uYW1lLnRleHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBDcmVhdGVzIGEgc291cmNlIGZpbGUgZnJvbSBhIGZpbGUgcGF0aCB3aXRoaW4gYSBwcm9qZWN0LiAqL1xuZnVuY3Rpb24gY3JlYXRlU291cmNlRmlsZSh0cmVlOiBUcmVlLCBmaWxlUGF0aDogc3RyaW5nKTogdHMuU291cmNlRmlsZSB7XG4gIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKGZpbGVQYXRoLCB0cmVlLnJlYWRUZXh0KGZpbGVQYXRoKSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBhcHAgY29uZmlnIG9iamVjdCBsaXRlcmFsIGFuZCBhZGRzIGl0IHRvIGEgY2FsbCBleHByZXNzaW9uIGFzIGFuIGFyZ3VtZW50LlxuICogQHBhcmFtIGNhbGwgQ2FsbCB0byB3aGljaCB0byBhZGQgdGhlIGNvbmZpZy5cbiAqIEBwYXJhbSBleHByZXNzaW9uIEV4cHJlc3Npb24gdGhhdCBzaG91bGQgaW5zZXJ0ZWQgaW50byB0aGUgbmV3IGNvbmZpZy5cbiAqIEBwYXJhbSByZWNvcmRlciBSZWNvcmRlciB0byB3aGljaCB0byBsb2cgdGhlIGNoYW5nZS5cbiAqL1xuZnVuY3Rpb24gYWRkTmV3QXBwQ29uZmlnVG9DYWxsKFxuICBjYWxsOiB0cy5DYWxsRXhwcmVzc2lvbixcbiAgZXhwcmVzc2lvbjogdHMuRXhwcmVzc2lvbixcbiAgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyLFxuKTogdm9pZCB7XG4gIGNvbnN0IG5ld0NhbGwgPSB0cy5mYWN0b3J5LnVwZGF0ZUNhbGxFeHByZXNzaW9uKGNhbGwsIGNhbGwuZXhwcmVzc2lvbiwgY2FsbC50eXBlQXJndW1lbnRzLCBbXG4gICAgLi4uY2FsbC5hcmd1bWVudHMsXG4gICAgdHMuZmFjdG9yeS5jcmVhdGVPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihcbiAgICAgIFtcbiAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAgICAgJ3Byb3ZpZGVycycsXG4gICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVBcnJheUxpdGVyYWxFeHByZXNzaW9uKFtleHByZXNzaW9uXSksXG4gICAgICAgICksXG4gICAgICBdLFxuICAgICAgdHJ1ZSxcbiAgICApLFxuICBdKTtcblxuICByZWNvcmRlci5yZW1vdmUoY2FsbC5nZXRTdGFydCgpLCBjYWxsLmdldFdpZHRoKCkpO1xuICByZWNvcmRlci5pbnNlcnRSaWdodChcbiAgICBjYWxsLmdldFN0YXJ0KCksXG4gICAgdHMuY3JlYXRlUHJpbnRlcigpLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3Q2FsbCwgY2FsbC5nZXRTb3VyY2VGaWxlKCkpLFxuICApO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZWxlbWVudCB0byBhbiBhcnJheSBsaXRlcmFsIGV4cHJlc3Npb24uXG4gKiBAcGFyYW0gbm9kZSBBcnJheSB0byB3aGljaCB0byBhZGQgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGJlIGFkZGVkLlxuICogQHBhcmFtIHJlY29yZGVyIFJlY29yZGVyIHRvIHdoaWNoIHRvIGxvZyB0aGUgY2hhbmdlLlxuICovXG5mdW5jdGlvbiBhZGRFbGVtZW50VG9BcnJheShcbiAgbm9kZTogdHMuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbixcbiAgZWxlbWVudDogdHMuRXhwcmVzc2lvbixcbiAgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyLFxuKTogdm9pZCB7XG4gIGNvbnN0IG5ld0xpdGVyYWwgPSB0cy5mYWN0b3J5LnVwZGF0ZUFycmF5TGl0ZXJhbEV4cHJlc3Npb24obm9kZSwgWy4uLm5vZGUuZWxlbWVudHMsIGVsZW1lbnRdKTtcbiAgcmVjb3JkZXIucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgcmVjb3JkZXIuaW5zZXJ0UmlnaHQoXG4gICAgbm9kZS5nZXRTdGFydCgpLFxuICAgIHRzLmNyZWF0ZVByaW50ZXIoKS5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0xpdGVyYWwsIG5vZGUuZ2V0U291cmNlRmlsZSgpKSxcbiAgKTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgYHByb3ZpZGVyc2AgcHJvcGVydHkgdG8gYW4gb2JqZWN0IGxpdGVyYWwuXG4gKiBAcGFyYW0gbm9kZSBMaXRlcmFsIHRvIHdoaWNoIHRvIGFkZCB0aGUgYHByb3ZpZGVyc2AuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbiBQcm92aWRlciB0aGF0IHNob3VsZCBiZSBwYXJ0IG9mIHRoZSBnZW5lcmF0ZWQgYHByb3ZpZGVyc2AgYXJyYXkuXG4gKiBAcGFyYW0gcmVjb3JkZXIgUmVjb3JkZXIgdG8gd2hpY2ggdG8gbG9nIHRoZSBjaGFuZ2UuXG4gKi9cbmZ1bmN0aW9uIGFkZFByb3ZpZGVyc1RvT2JqZWN0TGl0ZXJhbChcbiAgbm9kZTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sXG4gIGV4cHJlc3Npb246IHRzLkV4cHJlc3Npb24sXG4gIHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlcixcbikge1xuICBjb25zdCBuZXdPcHRpb25zTGl0ZXJhbCA9IHRzLmZhY3RvcnkudXBkYXRlT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obm9kZSwgW1xuICAgIC4uLm5vZGUucHJvcGVydGllcyxcbiAgICB0cy5mYWN0b3J5LmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICdwcm92aWRlcnMnLFxuICAgICAgdHMuZmFjdG9yeS5jcmVhdGVBcnJheUxpdGVyYWxFeHByZXNzaW9uKFtleHByZXNzaW9uXSksXG4gICAgKSxcbiAgXSk7XG4gIHJlY29yZGVyLnJlbW92ZShub2RlLmdldFN0YXJ0KCksIG5vZGUuZ2V0V2lkdGgoKSk7XG4gIHJlY29yZGVyLmluc2VydFJpZ2h0KFxuICAgIG5vZGUuZ2V0U3RhcnQoKSxcbiAgICB0cy5jcmVhdGVQcmludGVyKCkucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdPcHRpb25zTGl0ZXJhbCwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpLFxuICApO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBub2RlIGlzIGEgY2FsbCB0byBgbWVyZ2VBcHBsaWNhdGlvbkNvbmZpZ2AuICovXG5mdW5jdGlvbiBpc01lcmdlQXBwQ29uZmlnQ2FsbChub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsTmFtZSA9IGZpbmRJbXBvcnRMb2NhbE5hbWUoXG4gICAgbm9kZS5nZXRTb3VyY2VGaWxlKCksXG4gICAgJ21lcmdlQXBwbGljYXRpb25Db25maWcnLFxuICAgICdAYW5ndWxhci9jb3JlJyxcbiAgKTtcblxuICByZXR1cm4gISFsb2NhbE5hbWUgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiYgbm9kZS5leHByZXNzaW9uLnRleHQgPT09IGxvY2FsTmFtZTtcbn1cbiJdfQ==