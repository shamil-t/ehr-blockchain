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
exports.findAppConfig = void 0;
const path_1 = require("path");
const typescript_1 = __importDefault(require("../../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const util_1 = require("./util");
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
exports.findAppConfig = findAppConfig;
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
            const importedSourceFile = (0, util_1.getSourceFile)(tree, filePath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwX2NvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3N0YW5kYWxvbmUvYXBwX2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFHSCwrQkFBcUM7QUFDckMsa0hBQWtGO0FBQ2xGLGlDQUF1QztBQVd2Qzs7Ozs7R0FLRztBQUNILFNBQWdCLGFBQWEsQ0FDM0IsYUFBZ0MsRUFDaEMsSUFBVSxFQUNWLFFBQWdCO0lBRWhCLElBQUksYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3RDLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFMUMsSUFBSSxvQkFBRSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3hDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO1NBQ25DO1FBRUQsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMzQixPQUFPLDhCQUE4QixDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDL0Q7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQWxCRCxzQ0FrQkM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsOEJBQThCLENBQ3JDLFVBQXlCLEVBQ3pCLElBQVUsRUFDVixnQkFBd0I7SUFFeEIsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBRTlDLEtBQUssTUFBTSxJQUFJLElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRTtRQUN4Qyx3RUFBd0U7UUFDeEUsMEVBQTBFO1FBQzFFLDJDQUEyQztRQUMzQyxJQUNFLENBQUMsb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDN0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGFBQWE7WUFDakMsQ0FBQyxvQkFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQztZQUNuRCxDQUFDLG9CQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM3QyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFDMUM7WUFDQSxTQUFTO1NBQ1Y7UUFFRCxLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRTtZQUNoRSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxJQUFJLEVBQUU7Z0JBQzNDLFNBQVM7YUFDVjtZQUVELHlGQUF5RjtZQUN6Rix1RkFBdUY7WUFDdkYsdURBQXVEO1lBQ3ZELE1BQU0sUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLElBQUEsY0FBTyxFQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDcEYsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLG9CQUFhLEVBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsNkJBQTZCLENBQ3BELGtCQUFrQixFQUNsQixDQUFDLFNBQVMsQ0FBQyxZQUFZLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDaEQsQ0FBQztZQUVGLElBQUksZ0JBQWdCLEVBQUU7Z0JBQ3BCLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUM7YUFDN0M7U0FDRjtLQUNGO0lBRUQsTUFBTSxrQkFBa0IsR0FBRyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXRGLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDOUYsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLDZCQUE2QixDQUNwQyxVQUF5QixFQUN6QixZQUFvQjtJQUVwQixLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUU7UUFDeEMsSUFBSSxvQkFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2hDLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUU7Z0JBQ3BELElBQ0Usb0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWTtvQkFDL0IsSUFBSSxDQUFDLFdBQVc7b0JBQ2hCLG9CQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUM5QztvQkFDQSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7aUJBQ3pCO2FBQ0Y7U0FDRjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRyZWUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAnLi4vLi4vdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBnZXRTb3VyY2VGaWxlIH0gZnJvbSAnLi91dGlsJztcblxuLyoqIEFwcCBjb25maWcgdGhhdCB3YXMgcmVzb2x2ZWQgdG8gaXRzIHNvdXJjZSBub2RlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZEFwcENvbmZpZyB7XG4gIC8qKiBUcmVlLXJlbGF0aXZlIHBhdGggb2YgdGhlIGZpbGUgY29udGFpbmluZyB0aGUgYXBwIGNvbmZpZy4gKi9cbiAgZmlsZVBhdGg6IHN0cmluZztcblxuICAvKiogTm9kZSBkZWZpbmluZyB0aGUgYXBwIGNvbmZpZy4gKi9cbiAgbm9kZTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIG5vZGUgdGhhdCBkZWZpbmVzIHRoZSBhcHAgY29uZmlnIGZyb20gYSBib290c3RyYXAgY2FsbC5cbiAqIEBwYXJhbSBib290c3RyYXBDYWxsIENhbGwgZm9yIHdoaWNoIHRvIHJlc29sdmUgdGhlIGNvbmZpZy5cbiAqIEBwYXJhbSB0cmVlIEZpbGUgdHJlZSBvZiB0aGUgcHJvamVjdC5cbiAqIEBwYXJhbSBmaWxlUGF0aCBGaWxlIHBhdGggb2YgdGhlIGJvb3RzdHJhcCBjYWxsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEFwcENvbmZpZyhcbiAgYm9vdHN0cmFwQ2FsbDogdHMuQ2FsbEV4cHJlc3Npb24sXG4gIHRyZWU6IFRyZWUsXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4pOiBSZXNvbHZlZEFwcENvbmZpZyB8IG51bGwge1xuICBpZiAoYm9vdHN0cmFwQ2FsbC5hcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGJvb3RzdHJhcENhbGwuYXJndW1lbnRzWzFdO1xuXG4gICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oY29uZmlnKSkge1xuICAgICAgcmV0dXJuIHsgZmlsZVBhdGgsIG5vZGU6IGNvbmZpZyB9O1xuICAgIH1cblxuICAgIGlmICh0cy5pc0lkZW50aWZpZXIoY29uZmlnKSkge1xuICAgICAgcmV0dXJuIHJlc29sdmVBcHBDb25maWdGcm9tSWRlbnRpZmllcihjb25maWcsIHRyZWUsIGZpbGVQYXRoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgYXBwIGNvbmZpZyBmcm9tIGFuIGlkZW50aWZpZXIgcmVmZXJyaW5nIHRvIGl0LlxuICogQHBhcmFtIGlkZW50aWZpZXIgSWRlbnRpZmllciByZWZlcnJpbmcgdG8gdGhlIGFwcCBjb25maWcuXG4gKiBAcGFyYW0gdHJlZSBGaWxlIHRyZWUgb2YgdGhlIHByb2plY3QuXG4gKiBAcGFyYW0gYm9vdHN0YXBGaWxlUGF0aCBQYXRoIG9mIHRoZSBib290c3RyYXAgY2FsbC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUFwcENvbmZpZ0Zyb21JZGVudGlmaWVyKFxuICBpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyLFxuICB0cmVlOiBUcmVlLFxuICBib290c3RhcEZpbGVQYXRoOiBzdHJpbmcsXG4pOiBSZXNvbHZlZEFwcENvbmZpZyB8IG51bGwge1xuICBjb25zdCBzb3VyY2VGaWxlID0gaWRlbnRpZmllci5nZXRTb3VyY2VGaWxlKCk7XG5cbiAgZm9yIChjb25zdCBub2RlIG9mIHNvdXJjZUZpbGUuc3RhdGVtZW50cykge1xuICAgIC8vIE9ubHkgbG9vayBhdCByZWxhdGl2ZSBpbXBvcnRzLiBUaGlzIHdpbGwgYnJlYWsgaWYgdGhlIGFwcCB1c2VzIGEgcGF0aFxuICAgIC8vIG1hcHBpbmcgdG8gcmVmZXIgdG8gdGhlIGltcG9ydCwgYnV0IGluIG9yZGVyIHRvIHJlc29sdmUgdGhvc2UsIHdlIHdvdWxkXG4gICAgLy8gbmVlZCBrbm93bGVkZ2UgYWJvdXQgdGhlIGVudGlyZSBwcm9ncmFtLlxuICAgIGlmIChcbiAgICAgICF0cy5pc0ltcG9ydERlY2xhcmF0aW9uKG5vZGUpIHx8XG4gICAgICAhbm9kZS5pbXBvcnRDbGF1c2U/Lm5hbWVkQmluZGluZ3MgfHxcbiAgICAgICF0cy5pc05hbWVkSW1wb3J0cyhub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKSB8fFxuICAgICAgIXRzLmlzU3RyaW5nTGl0ZXJhbExpa2Uobm9kZS5tb2R1bGVTcGVjaWZpZXIpIHx8XG4gICAgICAhbm9kZS5tb2R1bGVTcGVjaWZpZXIudGV4dC5zdGFydHNXaXRoKCcuJylcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc3BlY2lmaWVyIG9mIG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MuZWxlbWVudHMpIHtcbiAgICAgIGlmIChzcGVjaWZpZXIubmFtZS50ZXh0ICE9PSBpZGVudGlmaWVyLnRleHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIExvb2sgZm9yIGEgdmFyaWFibGUgd2l0aCB0aGUgaW1wb3J0ZWQgbmFtZSBpbiB0aGUgZmlsZS4gTm90ZSB0aGF0IGlkZWFsbHkgd2Ugd291bGQgdXNlXG4gICAgICAvLyB0aGUgdHlwZSBjaGVja2VyIHRvIHJlc29sdmUgdGhpcywgYnV0IHdlIGNhbid0IGJlY2F1c2UgdGhlc2UgdXRpbGl0aWVzIGFyZSBzZXQgdXAgdG9cbiAgICAgIC8vIG9wZXJhdGUgb24gaW5kaXZpZHVhbCBmaWxlcywgbm90IHRoZSBlbnRpcmUgcHJvZ3JhbS5cbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gam9pbihkaXJuYW1lKGJvb3RzdGFwRmlsZVBhdGgpLCBub2RlLm1vZHVsZVNwZWNpZmllci50ZXh0ICsgJy50cycpO1xuICAgICAgY29uc3QgaW1wb3J0ZWRTb3VyY2VGaWxlID0gZ2V0U291cmNlRmlsZSh0cmVlLCBmaWxlUGF0aCk7XG4gICAgICBjb25zdCByZXNvbHZlZFZhcmlhYmxlID0gZmluZEFwcENvbmZpZ0Zyb21WYXJpYWJsZU5hbWUoXG4gICAgICAgIGltcG9ydGVkU291cmNlRmlsZSxcbiAgICAgICAgKHNwZWNpZmllci5wcm9wZXJ0eU5hbWUgfHwgc3BlY2lmaWVyLm5hbWUpLnRleHQsXG4gICAgICApO1xuXG4gICAgICBpZiAocmVzb2x2ZWRWYXJpYWJsZSkge1xuICAgICAgICByZXR1cm4geyBmaWxlUGF0aCwgbm9kZTogcmVzb2x2ZWRWYXJpYWJsZSB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZhcmlhYmxlSW5TYW1lRmlsZSA9IGZpbmRBcHBDb25maWdGcm9tVmFyaWFibGVOYW1lKHNvdXJjZUZpbGUsIGlkZW50aWZpZXIudGV4dCk7XG5cbiAgcmV0dXJuIHZhcmlhYmxlSW5TYW1lRmlsZSA/IHsgZmlsZVBhdGg6IGJvb3RzdGFwRmlsZVBhdGgsIG5vZGU6IHZhcmlhYmxlSW5TYW1lRmlsZSB9IDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyBhbiBhcHAgY29uZmlnIHdpdGhpbiB0aGUgdG9wLWxldmVsIHZhcmlhYmxlcyBvZiBhIGZpbGUuXG4gKiBAcGFyYW0gc291cmNlRmlsZSBGaWxlIGluIHdoaWNoIHRvIHNlYXJjaCBmb3IgdGhlIGNvbmZpZy5cbiAqIEBwYXJhbSB2YXJpYWJsZU5hbWUgTmFtZSBvZiB0aGUgdmFyaWFibGUgY29udGFpbmluZyB0aGUgY29uZmlnLlxuICovXG5mdW5jdGlvbiBmaW5kQXBwQ29uZmlnRnJvbVZhcmlhYmxlTmFtZShcbiAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbiAgdmFyaWFibGVOYW1lOiBzdHJpbmcsXG4pOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiB8IG51bGwge1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygc291cmNlRmlsZS5zdGF0ZW1lbnRzKSB7XG4gICAgaWYgKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRzLmlzSWRlbnRpZmllcihkZWNsLm5hbWUpICYmXG4gICAgICAgICAgZGVjbC5uYW1lLnRleHQgPT09IHZhcmlhYmxlTmFtZSAmJlxuICAgICAgICAgIGRlY2wuaW5pdGlhbGl6ZXIgJiZcbiAgICAgICAgICB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGRlY2wuaW5pdGlhbGl6ZXIpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiBkZWNsLmluaXRpYWxpemVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=