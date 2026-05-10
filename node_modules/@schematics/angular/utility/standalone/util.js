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
exports.findProvidersLiteral = exports.isMergeAppConfigCall = exports.applyChangesToFile = exports.findBootstrapApplicationCall = exports.getSourceFile = exports.getMainFilePath = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const typescript_1 = __importDefault(require("../../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const change_1 = require("../change");
const project_targets_1 = require("../project-targets");
const workspace_1 = require("../workspace");
/**
 * Finds the main file of a project.
 * @param tree File tree for the project.
 * @param projectName Name of the project in which to search.
 */
async function getMainFilePath(tree, projectName) {
    const workspace = await (0, workspace_1.getWorkspace)(tree);
    const project = workspace.projects.get(projectName);
    const buildTarget = project?.targets.get('build');
    if (!buildTarget) {
        throw (0, project_targets_1.targetBuildNotFoundError)();
    }
    return (buildTarget.options || {}).main;
}
exports.getMainFilePath = getMainFilePath;
/**
 * Gets a TypeScript source file at a specific path.
 * @param tree File tree of a project.
 * @param path Path to the file.
 */
function getSourceFile(tree, path) {
    const content = tree.readText(path);
    const source = typescript_1.default.createSourceFile(path, content, typescript_1.default.ScriptTarget.Latest, true);
    return source;
}
exports.getSourceFile = getSourceFile;
/** Finds the call to `bootstrapApplication` within a file. */
function findBootstrapApplicationCall(tree, mainFilePath) {
    const sourceFile = getSourceFile(tree, mainFilePath);
    const localName = findImportLocalName(sourceFile, 'bootstrapApplication', '@angular/platform-browser');
    if (localName) {
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
        if (result) {
            return result;
        }
    }
    throw new schematics_1.SchematicsException(`Could not find bootstrapApplication call in ${mainFilePath}`);
}
exports.findBootstrapApplicationCall = findBootstrapApplicationCall;
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
/**
 * Applies a set of changes to a file.
 * @param tree File tree of the project.
 * @param path Path to the file that is being changed.
 * @param changes Changes that should be applied to the file.
 */
function applyChangesToFile(tree, path, changes) {
    if (changes.length > 0) {
        const recorder = tree.beginUpdate(path);
        (0, change_1.applyToUpdateRecorder)(recorder, changes);
        tree.commitUpdate(recorder);
    }
}
exports.applyChangesToFile = applyChangesToFile;
/** Checks whether a node is a call to `mergeApplicationConfig`. */
function isMergeAppConfigCall(node) {
    if (!typescript_1.default.isCallExpression(node)) {
        return false;
    }
    const localName = findImportLocalName(node.getSourceFile(), 'mergeApplicationConfig', '@angular/core');
    return !!localName && typescript_1.default.isIdentifier(node.expression) && node.expression.text === localName;
}
exports.isMergeAppConfigCall = isMergeAppConfigCall;
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
exports.findProvidersLiteral = findProvidersLiteral;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3N0YW5kYWxvbmUvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwyREFBdUU7QUFDdkUsa0hBQWtGO0FBQ2xGLHNDQUEwRDtBQUMxRCx3REFBOEQ7QUFDOUQsNENBQTRDO0FBRzVDOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsZUFBZSxDQUFDLElBQVUsRUFBRSxXQUFtQjtJQUNuRSxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsd0JBQVksRUFBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNwRCxNQUFNLFdBQVcsR0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVsRCxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE1BQU0sSUFBQSwwQ0FBd0IsR0FBRSxDQUFDO0tBQ2xDO0lBRUQsT0FBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFzQyxDQUFDLElBQUksQ0FBQztBQUNoRixDQUFDO0FBVkQsMENBVUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLElBQVUsRUFBRSxJQUFZO0lBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsTUFBTSxNQUFNLEdBQUcsb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLG9CQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVoRixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBTEQsc0NBS0M7QUFF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QixDQUNuQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQ3BCLHdCQUF3QixFQUN4QixlQUFlLENBQ2hCLENBQUM7SUFFRixPQUFPLENBQUMsQ0FBQyxTQUFTLElBQUksb0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQztBQUMvRixDQUFDO0FBWkQsb0RBWUM7QUFFRCx3RUFBd0U7QUFDeEUsU0FBZ0Isb0JBQW9CLENBQ2xDLE1BQWtDO0lBRWxDLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUNwQyxJQUNFLG9CQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDO1lBQzdCLG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVztZQUM5QixvQkFBRSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFDN0M7WUFDQSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDekI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQWZELG9EQWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgdHMgZnJvbSAnLi4vLi4vdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBDaGFuZ2UsIGFwcGx5VG9VcGRhdGVSZWNvcmRlciB9IGZyb20gJy4uL2NoYW5nZSc7XG5pbXBvcnQgeyB0YXJnZXRCdWlsZE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi9wcm9qZWN0LXRhcmdldHMnO1xuaW1wb3J0IHsgZ2V0V29ya3NwYWNlIH0gZnJvbSAnLi4vd29ya3NwYWNlJztcbmltcG9ydCB7IEJyb3dzZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4uL3dvcmtzcGFjZS1tb2RlbHMnO1xuXG4vKipcbiAqIEZpbmRzIHRoZSBtYWluIGZpbGUgb2YgYSBwcm9qZWN0LlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIGZvciB0aGUgcHJvamVjdC5cbiAqIEBwYXJhbSBwcm9qZWN0TmFtZSBOYW1lIG9mIHRoZSBwcm9qZWN0IGluIHdoaWNoIHRvIHNlYXJjaC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1haW5GaWxlUGF0aCh0cmVlOiBUcmVlLCBwcm9qZWN0TmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKHRyZWUpO1xuICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSk7XG4gIGNvbnN0IGJ1aWxkVGFyZ2V0ID0gcHJvamVjdD8udGFyZ2V0cy5nZXQoJ2J1aWxkJyk7XG5cbiAgaWYgKCFidWlsZFRhcmdldCkge1xuICAgIHRocm93IHRhcmdldEJ1aWxkTm90Rm91bmRFcnJvcigpO1xuICB9XG5cbiAgcmV0dXJuICgoYnVpbGRUYXJnZXQub3B0aW9ucyB8fCB7fSkgYXMgdW5rbm93biBhcyBCcm93c2VyQnVpbGRlck9wdGlvbnMpLm1haW47XG59XG5cbi8qKlxuICogR2V0cyBhIFR5cGVTY3JpcHQgc291cmNlIGZpbGUgYXQgYSBzcGVjaWZpYyBwYXRoLlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIG9mIGEgcHJvamVjdC5cbiAqIEBwYXJhbSBwYXRoIFBhdGggdG8gdGhlIGZpbGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VGaWxlKHRyZWU6IFRyZWUsIHBhdGg6IHN0cmluZyk6IHRzLlNvdXJjZUZpbGUge1xuICBjb25zdCBjb250ZW50ID0gdHJlZS5yZWFkVGV4dChwYXRoKTtcbiAgY29uc3Qgc291cmNlID0gdHMuY3JlYXRlU291cmNlRmlsZShwYXRoLCBjb250ZW50LCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKTtcblxuICByZXR1cm4gc291cmNlO1xufVxuXG4vKiogRmluZHMgdGhlIGNhbGwgdG8gYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCB3aXRoaW4gYSBmaWxlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRCb290c3RyYXBBcHBsaWNhdGlvbkNhbGwodHJlZTogVHJlZSwgbWFpbkZpbGVQYXRoOiBzdHJpbmcpOiB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGNvbnN0IHNvdXJjZUZpbGUgPSBnZXRTb3VyY2VGaWxlKHRyZWUsIG1haW5GaWxlUGF0aCk7XG4gIGNvbnN0IGxvY2FsTmFtZSA9IGZpbmRJbXBvcnRMb2NhbE5hbWUoXG4gICAgc291cmNlRmlsZSxcbiAgICAnYm9vdHN0cmFwQXBwbGljYXRpb24nLFxuICAgICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJyxcbiAgKTtcblxuICBpZiAobG9jYWxOYW1lKSB7XG4gICAgbGV0IHJlc3VsdDogdHMuQ2FsbEV4cHJlc3Npb24gfCBudWxsID0gbnVsbDtcblxuICAgIHNvdXJjZUZpbGUuZm9yRWFjaENoaWxkKGZ1bmN0aW9uIHdhbGsobm9kZSkge1xuICAgICAgaWYgKFxuICAgICAgICB0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmXG4gICAgICAgIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgIG5vZGUuZXhwcmVzc2lvbi50ZXh0ID09PSBsb2NhbE5hbWVcbiAgICAgICkge1xuICAgICAgICByZXN1bHQgPSBub2RlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBub2RlLmZvckVhY2hDaGlsZCh3YWxrKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYENvdWxkIG5vdCBmaW5kIGJvb3RzdHJhcEFwcGxpY2F0aW9uIGNhbGwgaW4gJHttYWluRmlsZVBhdGh9YCk7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGxvY2FsIG5hbWUgb2YgYW4gaW1wb3J0ZWQgc3ltYm9sLiBDb3VsZCBiZSB0aGUgc3ltYm9sIG5hbWUgaXRzZWxmIG9yIGl0cyBhbGlhcy5cbiAqIEBwYXJhbSBzb3VyY2VGaWxlIEZpbGUgd2l0aGluIHdoaWNoIHRvIHNlYXJjaCBmb3IgdGhlIGltcG9ydC5cbiAqIEBwYXJhbSBuYW1lIEFjdHVhbCBuYW1lIG9mIHRoZSBpbXBvcnQsIG5vdCBpdHMgbG9jYWwgYWxpYXMuXG4gKiBAcGFyYW0gbW9kdWxlTmFtZSBOYW1lIG9mIHRoZSBtb2R1bGUgZnJvbSB3aGljaCB0aGUgc3ltYm9sIGlzIGltcG9ydGVkLlxuICovXG5mdW5jdGlvbiBmaW5kSW1wb3J0TG9jYWxOYW1lKFxuICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLFxuICBuYW1lOiBzdHJpbmcsXG4gIG1vZHVsZU5hbWU6IHN0cmluZyxcbik6IHN0cmluZyB8IG51bGwge1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygc291cmNlRmlsZS5zdGF0ZW1lbnRzKSB7XG4gICAgLy8gT25seSBsb29rIGZvciB0b3AtbGV2ZWwgaW1wb3J0cy5cbiAgICBpZiAoXG4gICAgICAhdHMuaXNJbXBvcnREZWNsYXJhdGlvbihub2RlKSB8fFxuICAgICAgIXRzLmlzU3RyaW5nTGl0ZXJhbChub2RlLm1vZHVsZVNwZWNpZmllcikgfHxcbiAgICAgIG5vZGUubW9kdWxlU3BlY2lmaWVyLnRleHQgIT09IG1vZHVsZU5hbWVcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgaW1wb3J0cyB0aGF0IGRvbid0IGhhdmUgdGhlIHJpZ2h0IHNoYXBlLlxuICAgIGlmIChcbiAgICAgICFub2RlLmltcG9ydENsYXVzZSB8fFxuICAgICAgIW5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MgfHxcbiAgICAgICF0cy5pc05hbWVkSW1wb3J0cyhub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKVxuICAgICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gTG9vayB0aHJvdWdoIHRoZSBlbGVtZW50cyBvZiB0aGUgZGVjbGFyYXRpb24gZm9yIHRoZSBzcGVjaWZpYyBpbXBvcnQuXG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MuZWxlbWVudHMpIHtcbiAgICAgIGlmICgoZWxlbWVudC5wcm9wZXJ0eU5hbWUgfHwgZWxlbWVudC5uYW1lKS50ZXh0ID09PSBuYW1lKSB7XG4gICAgICAgIC8vIFRoZSBsb2NhbCBuYW1lIGlzIGFsd2F5cyBpbiBgbmFtZWAuXG4gICAgICAgIHJldHVybiBlbGVtZW50Lm5hbWUudGV4dDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGEgc2V0IG9mIGNoYW5nZXMgdG8gYSBmaWxlLlxuICogQHBhcmFtIHRyZWUgRmlsZSB0cmVlIG9mIHRoZSBwcm9qZWN0LlxuICogQHBhcmFtIHBhdGggUGF0aCB0byB0aGUgZmlsZSB0aGF0IGlzIGJlaW5nIGNoYW5nZWQuXG4gKiBAcGFyYW0gY2hhbmdlcyBDaGFuZ2VzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGZpbGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNoYW5nZXNUb0ZpbGUodHJlZTogVHJlZSwgcGF0aDogc3RyaW5nLCBjaGFuZ2VzOiBDaGFuZ2VbXSkge1xuICBpZiAoY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHBhdGgpO1xuICAgIGFwcGx5VG9VcGRhdGVSZWNvcmRlcihyZWNvcmRlciwgY2hhbmdlcyk7XG4gICAgdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuICB9XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYSBjYWxsIHRvIGBtZXJnZUFwcGxpY2F0aW9uQ29uZmlnYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01lcmdlQXBwQ29uZmlnQ2FsbChub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsTmFtZSA9IGZpbmRJbXBvcnRMb2NhbE5hbWUoXG4gICAgbm9kZS5nZXRTb3VyY2VGaWxlKCksXG4gICAgJ21lcmdlQXBwbGljYXRpb25Db25maWcnLFxuICAgICdAYW5ndWxhci9jb3JlJyxcbiAgKTtcblxuICByZXR1cm4gISFsb2NhbE5hbWUgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiYgbm9kZS5leHByZXNzaW9uLnRleHQgPT09IGxvY2FsTmFtZTtcbn1cblxuLyoqIEZpbmRzIHRoZSBgcHJvdmlkZXJzYCBhcnJheSBsaXRlcmFsIHdpdGhpbiBhbiBhcHBsaWNhdGlvbiBjb25maWcuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZFByb3ZpZGVyc0xpdGVyYWwoXG4gIGNvbmZpZzogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sXG4pOiB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uIHwgbnVsbCB7XG4gIGZvciAoY29uc3QgcHJvcCBvZiBjb25maWcucHJvcGVydGllcykge1xuICAgIGlmIChcbiAgICAgIHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3ApICYmXG4gICAgICB0cy5pc0lkZW50aWZpZXIocHJvcC5uYW1lKSAmJlxuICAgICAgcHJvcC5uYW1lLnRleHQgPT09ICdwcm92aWRlcnMnICYmXG4gICAgICB0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24ocHJvcC5pbml0aWFsaXplcilcbiAgICApIHtcbiAgICAgIHJldHVybiBwcm9wLmluaXRpYWxpemVyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19