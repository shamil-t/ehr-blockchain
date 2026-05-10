"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRootProvider = exports.addRootImport = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const ast_utils_1 = require("../ast-utils");
const change_1 = require("../change");
const ng_ast_utils_1 = require("../ng-ast-utils");
const app_config_1 = require("./app_config");
const code_block_1 = require("./code_block");
const util_1 = require("./util");
/**
 * Adds an import to the root of the project.
 * @param project Name of the project to which to add the import.
 * @param callback Function that generates the code block which should be inserted.
 * @example
 *
 * ```ts
 * import { Rule } from '@angular-devkit/schematics';
 * import { addRootImport } from '@schematics/angular/utility';
 *
 * export default function(): Rule {
 *   return addRootImport('default', ({code, external}) => {
 *     return code`${external('MyModule', '@my/module')}.forRoot({})`;
 *   });
 * }
 * ```
 */
function addRootImport(project, callback) {
    return getRootInsertionRule(project, callback, 'imports', {
        name: 'importProvidersFrom',
        module: '@angular/core',
    });
}
exports.addRootImport = addRootImport;
/**
 * Adds a provider to the root of the project.
 * @param project Name of the project to which to add the import.
 * @param callback Function that generates the code block which should be inserted.
 * @example
 *
 * ```ts
 * import { Rule } from '@angular-devkit/schematics';
 * import { addRootProvider } from '@schematics/angular/utility';
 *
 * export default function(): Rule {
 *   return addRootProvider('default', ({code, external}) => {
 *     return code`${external('provideLibrary', '@my/library')}({})`;
 *   });
 * }
 * ```
 */
function addRootProvider(project, callback) {
    return getRootInsertionRule(project, callback, 'providers');
}
exports.addRootProvider = addRootProvider;
/**
 * Creates a rule that inserts code at the root of either a standalone or NgModule-based project.
 * @param project Name of the project into which to inser tthe code.
 * @param callback Function that generates the code block which should be inserted.
 * @param ngModuleField Field of the root NgModule into which the code should be inserted, if the
 * app is based on NgModule
 * @param standaloneWrapperFunction Function with which to wrap the code if the app is standalone.
 */
function getRootInsertionRule(project, callback, ngModuleField, standaloneWrapperFunction) {
    return async (host) => {
        const mainFilePath = await (0, util_1.getMainFilePath)(host, project);
        const codeBlock = new code_block_1.CodeBlock();
        if ((0, ng_ast_utils_1.isStandaloneApp)(host, mainFilePath)) {
            return (tree) => addProviderToStandaloneBootstrap(tree, callback(codeBlock), mainFilePath, standaloneWrapperFunction);
        }
        const modulePath = (0, ng_ast_utils_1.getAppModulePath)(host, mainFilePath);
        const pendingCode = code_block_1.CodeBlock.transformPendingCode(callback(codeBlock), modulePath);
        return (0, schematics_1.chain)([
            ...pendingCode.rules,
            (tree) => {
                const changes = (0, ast_utils_1.addSymbolToNgModuleMetadata)((0, util_1.getSourceFile)(tree, modulePath), modulePath, ngModuleField, pendingCode.code.expression, 
                // Explicitly set the import path to null since we deal with imports here separately.
                null);
                (0, util_1.applyChangesToFile)(tree, modulePath, changes);
            },
        ]);
    };
}
/**
 * Adds a provider to the root of a standalone project.
 * @param host Tree of the root rule.
 * @param pendingCode Code that should be inserted.
 * @param mainFilePath Path to the project's main file.
 * @param wrapperFunction Optional function with which to wrap the provider.
 */
function addProviderToStandaloneBootstrap(host, pendingCode, mainFilePath, wrapperFunction) {
    const bootstrapCall = (0, util_1.findBootstrapApplicationCall)(host, mainFilePath);
    const fileToEdit = (0, app_config_1.findAppConfig)(bootstrapCall, host, mainFilePath)?.filePath || mainFilePath;
    const { code, rules } = code_block_1.CodeBlock.transformPendingCode(pendingCode, fileToEdit);
    return (0, schematics_1.chain)([
        ...rules,
        () => {
            let wrapped;
            let additionalRules;
            if (wrapperFunction) {
                const block = new code_block_1.CodeBlock();
                const result = code_block_1.CodeBlock.transformPendingCode(block.code `${block.external(wrapperFunction.name, wrapperFunction.module)}(${code.expression})`, fileToEdit);
                wrapped = result.code;
                additionalRules = result.rules;
            }
            else {
                wrapped = code;
                additionalRules = [];
            }
            return (0, schematics_1.chain)([
                ...additionalRules,
                (tree) => insertStandaloneRootProvider(tree, mainFilePath, wrapped.expression),
            ]);
        },
    ]);
}
/**
 * Inserts a string expression into the root of a standalone project.
 * @param tree File tree used to modify the project.
 * @param mainFilePath Path to the main file of the project.
 * @param expression Code expression to be inserted.
 */
function insertStandaloneRootProvider(tree, mainFilePath, expression) {
    const bootstrapCall = (0, util_1.findBootstrapApplicationCall)(tree, mainFilePath);
    const appConfig = (0, app_config_1.findAppConfig)(bootstrapCall, tree, mainFilePath);
    if (bootstrapCall.arguments.length === 0) {
        throw new schematics_1.SchematicsException(`Cannot add provider to invalid bootstrapApplication call in ${bootstrapCall.getSourceFile().fileName}`);
    }
    if (appConfig) {
        addProvidersExpressionToAppConfig(tree, appConfig, expression);
        return;
    }
    const newAppConfig = `, {\n${core_1.tags.indentBy(2) `providers: [${expression}]`}\n}`;
    let targetCall;
    if (bootstrapCall.arguments.length === 1) {
        targetCall = bootstrapCall;
    }
    else if ((0, util_1.isMergeAppConfigCall)(bootstrapCall.arguments[1])) {
        targetCall = bootstrapCall.arguments[1];
    }
    else {
        throw new schematics_1.SchematicsException(`Cannot statically analyze bootstrapApplication call in ${bootstrapCall.getSourceFile().fileName}`);
    }
    (0, util_1.applyChangesToFile)(tree, mainFilePath, [
        (0, ast_utils_1.insertAfterLastOccurrence)(targetCall.arguments, newAppConfig, mainFilePath, targetCall.getEnd() - 1),
    ]);
}
/**
 * Adds a string expression to an app config object.
 * @param tree File tree used to modify the project.
 * @param appConfig Resolved configuration object of the project.
 * @param expression Code expression to be inserted.
 */
function addProvidersExpressionToAppConfig(tree, appConfig, expression) {
    const { node, filePath } = appConfig;
    const configProps = node.properties;
    const providersLiteral = (0, util_1.findProvidersLiteral)(node);
    // If there's a `providers` property, we can add the provider
    // to it, otherwise we need to declare it ourselves.
    if (providersLiteral) {
        const hasTrailingComma = providersLiteral.elements.hasTrailingComma;
        (0, util_1.applyChangesToFile)(tree, filePath, [
            (0, ast_utils_1.insertAfterLastOccurrence)(providersLiteral.elements, (hasTrailingComma || providersLiteral.elements.length === 0 ? '' : ', ') + expression, filePath, providersLiteral.getStart() + 1),
        ]);
    }
    else {
        const prop = core_1.tags.indentBy(2) `providers: [${expression}]`;
        let toInsert;
        let insertPosition;
        if (configProps.length === 0) {
            toInsert = '\n' + prop + '\n';
            insertPosition = node.getEnd() - 1;
        }
        else {
            const hasTrailingComma = configProps.hasTrailingComma;
            toInsert = (hasTrailingComma ? '' : ',') + '\n' + prop;
            insertPosition = configProps[configProps.length - 1].getEnd() + (hasTrailingComma ? 1 : 0);
        }
        (0, util_1.applyChangesToFile)(tree, filePath, [new change_1.InsertChange(filePath, insertPosition, toInsert)]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9zdGFuZGFsb25lL3J1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUE0QztBQUM1QywyREFBb0Y7QUFFcEYsNENBQXNGO0FBQ3RGLHNDQUF5QztBQUN6QyxrREFBb0U7QUFDcEUsNkNBQWdFO0FBQ2hFLDZDQUF5RTtBQUN6RSxpQ0FPZ0I7QUFFaEI7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxTQUFnQixhQUFhLENBQUMsT0FBZSxFQUFFLFFBQTJCO0lBQ3hFLE9BQU8sb0JBQW9CLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7UUFDeEQsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixNQUFNLEVBQUUsZUFBZTtLQUN4QixDQUFDLENBQUM7QUFDTCxDQUFDO0FBTEQsc0NBS0M7QUFFRDs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILFNBQWdCLGVBQWUsQ0FBQyxPQUFlLEVBQUUsUUFBMkI7SUFDMUUsT0FBTyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCwwQ0FFQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLG9CQUFvQixDQUMzQixPQUFlLEVBQ2YsUUFBMkIsRUFDM0IsYUFBcUIsRUFDckIseUJBQTREO0lBRTVELE9BQU8sS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3BCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSxzQkFBZSxFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLEVBQUUsQ0FBQztRQUVsQyxJQUFJLElBQUEsOEJBQWUsRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLEVB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WUFDdkQsY0FBYyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDNUY7UUFFRCxJQUFBLHlCQUFrQixFQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLHFCQUFZLENBQUMsUUFBUSxFQUFFLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUY7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlLCBjaGFpbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB0cyBmcm9tICcuLi8uLi90aGlyZF9wYXJ0eS9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2xpYi90eXBlc2NyaXB0JztcbmltcG9ydCB7IGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YSwgaW5zZXJ0QWZ0ZXJMYXN0T2NjdXJyZW5jZSB9IGZyb20gJy4uL2FzdC11dGlscyc7XG5pbXBvcnQgeyBJbnNlcnRDaGFuZ2UgfSBmcm9tICcuLi9jaGFuZ2UnO1xuaW1wb3J0IHsgZ2V0QXBwTW9kdWxlUGF0aCwgaXNTdGFuZGFsb25lQXBwIH0gZnJvbSAnLi4vbmctYXN0LXV0aWxzJztcbmltcG9ydCB7IFJlc29sdmVkQXBwQ29uZmlnLCBmaW5kQXBwQ29uZmlnIH0gZnJvbSAnLi9hcHBfY29uZmlnJztcbmltcG9ydCB7IENvZGVCbG9jaywgQ29kZUJsb2NrQ2FsbGJhY2ssIFBlbmRpbmdDb2RlIH0gZnJvbSAnLi9jb2RlX2Jsb2NrJztcbmltcG9ydCB7XG4gIGFwcGx5Q2hhbmdlc1RvRmlsZSxcbiAgZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbCxcbiAgZmluZFByb3ZpZGVyc0xpdGVyYWwsXG4gIGdldE1haW5GaWxlUGF0aCxcbiAgZ2V0U291cmNlRmlsZSxcbiAgaXNNZXJnZUFwcENvbmZpZ0NhbGwsXG59IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogQWRkcyBhbiBpbXBvcnQgdG8gdGhlIHJvb3Qgb2YgdGhlIHByb2plY3QuXG4gKiBAcGFyYW0gcHJvamVjdCBOYW1lIG9mIHRoZSBwcm9qZWN0IHRvIHdoaWNoIHRvIGFkZCB0aGUgaW1wb3J0LlxuICogQHBhcmFtIGNhbGxiYWNrIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIHRoZSBjb2RlIGJsb2NrIHdoaWNoIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqIEBleGFtcGxlXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFJ1bGUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG4gKiBpbXBvcnQgeyBhZGRSb290SW1wb3J0IH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5JztcbiAqXG4gKiBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAqICAgcmV0dXJuIGFkZFJvb3RJbXBvcnQoJ2RlZmF1bHQnLCAoe2NvZGUsIGV4dGVybmFsfSkgPT4ge1xuICogICAgIHJldHVybiBjb2RlYCR7ZXh0ZXJuYWwoJ015TW9kdWxlJywgJ0BteS9tb2R1bGUnKX0uZm9yUm9vdCh7fSlgO1xuICogICB9KTtcbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUm9vdEltcG9ydChwcm9qZWN0OiBzdHJpbmcsIGNhbGxiYWNrOiBDb2RlQmxvY2tDYWxsYmFjayk6IFJ1bGUge1xuICByZXR1cm4gZ2V0Um9vdEluc2VydGlvblJ1bGUocHJvamVjdCwgY2FsbGJhY2ssICdpbXBvcnRzJywge1xuICAgIG5hbWU6ICdpbXBvcnRQcm92aWRlcnNGcm9tJyxcbiAgICBtb2R1bGU6ICdAYW5ndWxhci9jb3JlJyxcbiAgfSk7XG59XG5cbi8qKlxuICogQWRkcyBhIHByb3ZpZGVyIHRvIHRoZSByb290IG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIHByb2plY3QgTmFtZSBvZiB0aGUgcHJvamVjdCB0byB3aGljaCB0byBhZGQgdGhlIGltcG9ydC5cbiAqIEBwYXJhbSBjYWxsYmFjayBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyB0aGUgY29kZSBibG9jayB3aGljaCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBSdWxlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuICogaW1wb3J0IHsgYWRkUm9vdFByb3ZpZGVyIH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5JztcbiAqXG4gKiBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAqICAgcmV0dXJuIGFkZFJvb3RQcm92aWRlcignZGVmYXVsdCcsICh7Y29kZSwgZXh0ZXJuYWx9KSA9PiB7XG4gKiAgICAgcmV0dXJuIGNvZGVgJHtleHRlcm5hbCgncHJvdmlkZUxpYnJhcnknLCAnQG15L2xpYnJhcnknKX0oe30pYDtcbiAqICAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJvb3RQcm92aWRlcihwcm9qZWN0OiBzdHJpbmcsIGNhbGxiYWNrOiBDb2RlQmxvY2tDYWxsYmFjayk6IFJ1bGUge1xuICByZXR1cm4gZ2V0Um9vdEluc2VydGlvblJ1bGUocHJvamVjdCwgY2FsbGJhY2ssICdwcm92aWRlcnMnKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcnVsZSB0aGF0IGluc2VydHMgY29kZSBhdCB0aGUgcm9vdCBvZiBlaXRoZXIgYSBzdGFuZGFsb25lIG9yIE5nTW9kdWxlLWJhc2VkIHByb2plY3QuXG4gKiBAcGFyYW0gcHJvamVjdCBOYW1lIG9mIHRoZSBwcm9qZWN0IGludG8gd2hpY2ggdG8gaW5zZXIgdHRoZSBjb2RlLlxuICogQHBhcmFtIGNhbGxiYWNrIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIHRoZSBjb2RlIGJsb2NrIHdoaWNoIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqIEBwYXJhbSBuZ01vZHVsZUZpZWxkIEZpZWxkIG9mIHRoZSByb290IE5nTW9kdWxlIGludG8gd2hpY2ggdGhlIGNvZGUgc2hvdWxkIGJlIGluc2VydGVkLCBpZiB0aGVcbiAqIGFwcCBpcyBiYXNlZCBvbiBOZ01vZHVsZVxuICogQHBhcmFtIHN0YW5kYWxvbmVXcmFwcGVyRnVuY3Rpb24gRnVuY3Rpb24gd2l0aCB3aGljaCB0byB3cmFwIHRoZSBjb2RlIGlmIHRoZSBhcHAgaXMgc3RhbmRhbG9uZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdEluc2VydGlvblJ1bGUoXG4gIHByb2plY3Q6IHN0cmluZyxcbiAgY2FsbGJhY2s6IENvZGVCbG9ja0NhbGxiYWNrLFxuICBuZ01vZHVsZUZpZWxkOiBzdHJpbmcsXG4gIHN0YW5kYWxvbmVXcmFwcGVyRnVuY3Rpb24/OiB7IG5hbWU6IHN0cmluZzsgbW9kdWxlOiBzdHJpbmcgfSxcbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGhvc3QpID0+IHtcbiAgICBjb25zdCBtYWluRmlsZVBhdGggPSBhd2FpdCBnZXRNYWluRmlsZVBhdGgoaG9zdCwgcHJvamVjdCk7XG4gICAgY29uc3QgY29kZUJsb2NrID0gbmV3IENvZGVCbG9jaygpO1xuXG4gICAgaWYgKGlzU3RhbmRhbG9uZUFwcChob3N0LCBtYWluRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gKHRyZWUpID0+XG4gICAgICAgIGFkZFByb3ZpZGVyVG9TdGFuZGFsb25lQm9vdHN0cmFwKFxuICAgICAgICAgIHRyZWUsXG4gICAgICAgICAgY2FsbGJhY2soY29kZUJsb2NrKSxcbiAgICAgICAgICBtYWluRmlsZVBhdGgsXG4gICAgICAgICAgc3RhbmRhbG9uZVdyYXBwZXJGdW5jdGlvbixcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gZ2V0QXBwTW9kdWxlUGF0aChob3N0LCBtYWluRmlsZVBhdGgpO1xuICAgIGNvbnN0IHBlbmRpbmdDb2RlID0gQ29kZUJsb2NrLnRyYW5zZm9ybVBlbmRpbmdDb2RlKGNhbGxiYWNrKGNvZGVCbG9jayksIG1vZHVsZVBhdGgpO1xuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIC4uLnBlbmRpbmdDb2RlLnJ1bGVzLFxuICAgICAgKHRyZWUpID0+IHtcbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShcbiAgICAgICAgICBnZXRTb3VyY2VGaWxlKHRyZWUsIG1vZHVsZVBhdGgpLFxuICAgICAgICAgIG1vZHVsZVBhdGgsXG4gICAgICAgICAgbmdNb2R1bGVGaWVsZCxcbiAgICAgICAgICBwZW5kaW5nQ29kZS5jb2RlLmV4cHJlc3Npb24sXG4gICAgICAgICAgLy8gRXhwbGljaXRseSBzZXQgdGhlIGltcG9ydCBwYXRoIHRvIG51bGwgc2luY2Ugd2UgZGVhbCB3aXRoIGltcG9ydHMgaGVyZSBzZXBhcmF0ZWx5LlxuICAgICAgICAgIG51bGwsXG4gICAgICAgICk7XG5cbiAgICAgICAgYXBwbHlDaGFuZ2VzVG9GaWxlKHRyZWUsIG1vZHVsZVBhdGgsIGNoYW5nZXMpO1xuICAgICAgfSxcbiAgICBdKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgcHJvdmlkZXIgdG8gdGhlIHJvb3Qgb2YgYSBzdGFuZGFsb25lIHByb2plY3QuXG4gKiBAcGFyYW0gaG9zdCBUcmVlIG9mIHRoZSByb290IHJ1bGUuXG4gKiBAcGFyYW0gcGVuZGluZ0NvZGUgQ29kZSB0aGF0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqIEBwYXJhbSBtYWluRmlsZVBhdGggUGF0aCB0byB0aGUgcHJvamVjdCdzIG1haW4gZmlsZS5cbiAqIEBwYXJhbSB3cmFwcGVyRnVuY3Rpb24gT3B0aW9uYWwgZnVuY3Rpb24gd2l0aCB3aGljaCB0byB3cmFwIHRoZSBwcm92aWRlci5cbiAqL1xuZnVuY3Rpb24gYWRkUHJvdmlkZXJUb1N0YW5kYWxvbmVCb290c3RyYXAoXG4gIGhvc3Q6IFRyZWUsXG4gIHBlbmRpbmdDb2RlOiBQZW5kaW5nQ29kZSxcbiAgbWFpbkZpbGVQYXRoOiBzdHJpbmcsXG4gIHdyYXBwZXJGdW5jdGlvbj86IHsgbmFtZTogc3RyaW5nOyBtb2R1bGU6IHN0cmluZyB9LFxuKTogUnVsZSB7XG4gIGNvbnN0IGJvb3RzdHJhcENhbGwgPSBmaW5kQm9vdHN0cmFwQXBwbGljYXRpb25DYWxsKGhvc3QsIG1haW5GaWxlUGF0aCk7XG4gIGNvbnN0IGZpbGVUb0VkaXQgPSBmaW5kQXBwQ29uZmlnKGJvb3RzdHJhcENhbGwsIGhvc3QsIG1haW5GaWxlUGF0aCk/LmZpbGVQYXRoIHx8IG1haW5GaWxlUGF0aDtcbiAgY29uc3QgeyBjb2RlLCBydWxlcyB9ID0gQ29kZUJsb2NrLnRyYW5zZm9ybVBlbmRpbmdDb2RlKHBlbmRpbmdDb2RlLCBmaWxlVG9FZGl0KTtcblxuICByZXR1cm4gY2hhaW4oW1xuICAgIC4uLnJ1bGVzLFxuICAgICgpID0+IHtcbiAgICAgIGxldCB3cmFwcGVkOiBQZW5kaW5nQ29kZTtcbiAgICAgIGxldCBhZGRpdGlvbmFsUnVsZXM6IFJ1bGVbXTtcblxuICAgICAgaWYgKHdyYXBwZXJGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBibG9jayA9IG5ldyBDb2RlQmxvY2soKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gQ29kZUJsb2NrLnRyYW5zZm9ybVBlbmRpbmdDb2RlKFxuICAgICAgICAgIGJsb2NrLmNvZGVgJHtibG9jay5leHRlcm5hbCh3cmFwcGVyRnVuY3Rpb24ubmFtZSwgd3JhcHBlckZ1bmN0aW9uLm1vZHVsZSl9KCR7XG4gICAgICAgICAgICBjb2RlLmV4cHJlc3Npb25cbiAgICAgICAgICB9KWAsXG4gICAgICAgICAgZmlsZVRvRWRpdCxcbiAgICAgICAgKTtcblxuICAgICAgICB3cmFwcGVkID0gcmVzdWx0LmNvZGU7XG4gICAgICAgIGFkZGl0aW9uYWxSdWxlcyA9IHJlc3VsdC5ydWxlcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdyYXBwZWQgPSBjb2RlO1xuICAgICAgICBhZGRpdGlvbmFsUnVsZXMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNoYWluKFtcbiAgICAgICAgLi4uYWRkaXRpb25hbFJ1bGVzLFxuICAgICAgICAodHJlZSkgPT4gaW5zZXJ0U3RhbmRhbG9uZVJvb3RQcm92aWRlcih0cmVlLCBtYWluRmlsZVBhdGgsIHdyYXBwZWQuZXhwcmVzc2lvbiksXG4gICAgICBdKTtcbiAgICB9LFxuICBdKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgc3RyaW5nIGV4cHJlc3Npb24gaW50byB0aGUgcm9vdCBvZiBhIHN0YW5kYWxvbmUgcHJvamVjdC5cbiAqIEBwYXJhbSB0cmVlIEZpbGUgdHJlZSB1c2VkIHRvIG1vZGlmeSB0aGUgcHJvamVjdC5cbiAqIEBwYXJhbSBtYWluRmlsZVBhdGggUGF0aCB0byB0aGUgbWFpbiBmaWxlIG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIGV4cHJlc3Npb24gQ29kZSBleHByZXNzaW9uIHRvIGJlIGluc2VydGVkLlxuICovXG5mdW5jdGlvbiBpbnNlcnRTdGFuZGFsb25lUm9vdFByb3ZpZGVyKHRyZWU6IFRyZWUsIG1haW5GaWxlUGF0aDogc3RyaW5nLCBleHByZXNzaW9uOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgYm9vdHN0cmFwQ2FsbCA9IGZpbmRCb290c3RyYXBBcHBsaWNhdGlvbkNhbGwodHJlZSwgbWFpbkZpbGVQYXRoKTtcbiAgY29uc3QgYXBwQ29uZmlnID0gZmluZEFwcENvbmZpZyhib290c3RyYXBDYWxsLCB0cmVlLCBtYWluRmlsZVBhdGgpO1xuXG4gIGlmIChib290c3RyYXBDYWxsLmFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBDYW5ub3QgYWRkIHByb3ZpZGVyIHRvIGludmFsaWQgYm9vdHN0cmFwQXBwbGljYXRpb24gY2FsbCBpbiAke1xuICAgICAgICBib290c3RyYXBDYWxsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZVxuICAgICAgfWAsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChhcHBDb25maWcpIHtcbiAgICBhZGRQcm92aWRlcnNFeHByZXNzaW9uVG9BcHBDb25maWcodHJlZSwgYXBwQ29uZmlnLCBleHByZXNzaW9uKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5ld0FwcENvbmZpZyA9IGAsIHtcXG4ke3RhZ3MuaW5kZW50QnkoMilgcHJvdmlkZXJzOiBbJHtleHByZXNzaW9ufV1gfVxcbn1gO1xuICBsZXQgdGFyZ2V0Q2FsbDogdHMuQ2FsbEV4cHJlc3Npb247XG5cbiAgaWYgKGJvb3RzdHJhcENhbGwuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHRhcmdldENhbGwgPSBib290c3RyYXBDYWxsO1xuICB9IGVsc2UgaWYgKGlzTWVyZ2VBcHBDb25maWdDYWxsKGJvb3RzdHJhcENhbGwuYXJndW1lbnRzWzFdKSkge1xuICAgIHRhcmdldENhbGwgPSBib290c3RyYXBDYWxsLmFyZ3VtZW50c1sxXTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgIGBDYW5ub3Qgc3RhdGljYWxseSBhbmFseXplIGJvb3RzdHJhcEFwcGxpY2F0aW9uIGNhbGwgaW4gJHtcbiAgICAgICAgYm9vdHN0cmFwQ2FsbC5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWVcbiAgICAgIH1gLFxuICAgICk7XG4gIH1cblxuICBhcHBseUNoYW5nZXNUb0ZpbGUodHJlZSwgbWFpbkZpbGVQYXRoLCBbXG4gICAgaW5zZXJ0QWZ0ZXJMYXN0T2NjdXJyZW5jZShcbiAgICAgIHRhcmdldENhbGwuYXJndW1lbnRzLFxuICAgICAgbmV3QXBwQ29uZmlnLFxuICAgICAgbWFpbkZpbGVQYXRoLFxuICAgICAgdGFyZ2V0Q2FsbC5nZXRFbmQoKSAtIDEsXG4gICAgKSxcbiAgXSk7XG59XG5cbi8qKlxuICogQWRkcyBhIHN0cmluZyBleHByZXNzaW9uIHRvIGFuIGFwcCBjb25maWcgb2JqZWN0LlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIHVzZWQgdG8gbW9kaWZ5IHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIGFwcENvbmZpZyBSZXNvbHZlZCBjb25maWd1cmF0aW9uIG9iamVjdCBvZiB0aGUgcHJvamVjdC5cbiAqIEBwYXJhbSBleHByZXNzaW9uIENvZGUgZXhwcmVzc2lvbiB0byBiZSBpbnNlcnRlZC5cbiAqL1xuZnVuY3Rpb24gYWRkUHJvdmlkZXJzRXhwcmVzc2lvblRvQXBwQ29uZmlnKFxuICB0cmVlOiBUcmVlLFxuICBhcHBDb25maWc6IFJlc29sdmVkQXBwQ29uZmlnLFxuICBleHByZXNzaW9uOiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgeyBub2RlLCBmaWxlUGF0aCB9ID0gYXBwQ29uZmlnO1xuICBjb25zdCBjb25maWdQcm9wcyA9IG5vZGUucHJvcGVydGllcztcbiAgY29uc3QgcHJvdmlkZXJzTGl0ZXJhbCA9IGZpbmRQcm92aWRlcnNMaXRlcmFsKG5vZGUpO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBgcHJvdmlkZXJzYCBwcm9wZXJ0eSwgd2UgY2FuIGFkZCB0aGUgcHJvdmlkZXJcbiAgLy8gdG8gaXQsIG90aGVyd2lzZSB3ZSBuZWVkIHRvIGRlY2xhcmUgaXQgb3Vyc2VsdmVzLlxuICBpZiAocHJvdmlkZXJzTGl0ZXJhbCkge1xuICAgIGNvbnN0IGhhc1RyYWlsaW5nQ29tbWEgPSBwcm92aWRlcnNMaXRlcmFsLmVsZW1lbnRzLmhhc1RyYWlsaW5nQ29tbWE7XG5cbiAgICBhcHBseUNoYW5nZXNUb0ZpbGUodHJlZSwgZmlsZVBhdGgsIFtcbiAgICAgIGluc2VydEFmdGVyTGFzdE9jY3VycmVuY2UoXG4gICAgICAgIHByb3ZpZGVyc0xpdGVyYWwuZWxlbWVudHMsXG4gICAgICAgIChoYXNUcmFpbGluZ0NvbW1hIHx8IHByb3ZpZGVyc0xpdGVyYWwuZWxlbWVudHMubGVuZ3RoID09PSAwID8gJycgOiAnLCAnKSArIGV4cHJlc3Npb24sXG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBwcm92aWRlcnNMaXRlcmFsLmdldFN0YXJ0KCkgKyAxLFxuICAgICAgKSxcbiAgICBdKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwcm9wID0gdGFncy5pbmRlbnRCeSgyKWBwcm92aWRlcnM6IFske2V4cHJlc3Npb259XWA7XG4gICAgbGV0IHRvSW5zZXJ0OiBzdHJpbmc7XG4gICAgbGV0IGluc2VydFBvc2l0aW9uOiBudW1iZXI7XG5cbiAgICBpZiAoY29uZmlnUHJvcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0b0luc2VydCA9ICdcXG4nICsgcHJvcCArICdcXG4nO1xuICAgICAgaW5zZXJ0UG9zaXRpb24gPSBub2RlLmdldEVuZCgpIC0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaGFzVHJhaWxpbmdDb21tYSA9IGNvbmZpZ1Byb3BzLmhhc1RyYWlsaW5nQ29tbWE7XG4gICAgICB0b0luc2VydCA9IChoYXNUcmFpbGluZ0NvbW1hID8gJycgOiAnLCcpICsgJ1xcbicgKyBwcm9wO1xuICAgICAgaW5zZXJ0UG9zaXRpb24gPSBjb25maWdQcm9wc1tjb25maWdQcm9wcy5sZW5ndGggLSAxXS5nZXRFbmQoKSArIChoYXNUcmFpbGluZ0NvbW1hID8gMSA6IDApO1xuICAgIH1cblxuICAgIGFwcGx5Q2hhbmdlc1RvRmlsZSh0cmVlLCBmaWxlUGF0aCwgW25ldyBJbnNlcnRDaGFuZ2UoZmlsZVBhdGgsIGluc2VydFBvc2l0aW9uLCB0b0luc2VydCldKTtcbiAgfVxufVxuIl19