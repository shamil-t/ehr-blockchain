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
exports.isStandaloneApp = exports.getAppModulePath = exports.findBootstrapModuleCall = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const path_1 = require("path");
const standalone_1 = require("../private/standalone");
const ts = __importStar(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const ast_utils_1 = require("../utility/ast-utils");
function findBootstrapModuleCall(host, mainPath) {
    const mainText = host.readText(mainPath);
    const source = ts.createSourceFile(mainPath, mainText, ts.ScriptTarget.Latest, true);
    const allNodes = (0, ast_utils_1.getSourceNodes)(source);
    let bootstrapCall = null;
    for (const node of allNodes) {
        let bootstrapCallNode = null;
        bootstrapCallNode = (0, ast_utils_1.findNode)(node, ts.SyntaxKind.Identifier, 'bootstrapModule');
        // Walk up the parent until CallExpression is found.
        while (bootstrapCallNode &&
            bootstrapCallNode.parent &&
            bootstrapCallNode.parent.kind !== ts.SyntaxKind.CallExpression) {
            bootstrapCallNode = bootstrapCallNode.parent;
        }
        if (bootstrapCallNode !== null &&
            bootstrapCallNode.parent !== undefined &&
            bootstrapCallNode.parent.kind === ts.SyntaxKind.CallExpression) {
            bootstrapCall = bootstrapCallNode.parent;
            break;
        }
    }
    return bootstrapCall;
}
exports.findBootstrapModuleCall = findBootstrapModuleCall;
function findBootstrapModulePath(host, mainPath) {
    const bootstrapCall = findBootstrapModuleCall(host, mainPath);
    if (!bootstrapCall) {
        throw new schematics_1.SchematicsException('Bootstrap call not found');
    }
    const bootstrapModule = bootstrapCall.arguments[0];
    const mainText = host.readText(mainPath);
    const source = ts.createSourceFile(mainPath, mainText, ts.ScriptTarget.Latest, true);
    const allNodes = (0, ast_utils_1.getSourceNodes)(source);
    const bootstrapModuleRelativePath = allNodes
        .filter(ts.isImportDeclaration)
        .filter((imp) => {
        return (0, ast_utils_1.findNode)(imp, ts.SyntaxKind.Identifier, bootstrapModule.getText());
    })
        .map((imp) => {
        const modulePathStringLiteral = imp.moduleSpecifier;
        return modulePathStringLiteral.text;
    })[0];
    return bootstrapModuleRelativePath;
}
function getAppModulePath(host, mainPath) {
    const moduleRelativePath = findBootstrapModulePath(host, mainPath);
    const mainDir = (0, path_1.dirname)(mainPath);
    const modulePath = (0, core_1.normalize)(`/${mainDir}/${moduleRelativePath}.ts`);
    return modulePath;
}
exports.getAppModulePath = getAppModulePath;
function isStandaloneApp(host, mainPath) {
    const source = ts.createSourceFile(mainPath, host.readText(mainPath), ts.ScriptTarget.Latest, true);
    const bootstrapCall = (0, standalone_1.findBootstrapApplicationCall)(source);
    return bootstrapCall !== null;
}
exports.isStandaloneApp = isStandaloneApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctYXN0LXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvbmctYXN0LXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQWlEO0FBQ2pELDJEQUF1RTtBQUN2RSwrQkFBK0I7QUFDL0Isc0RBQXFFO0FBQ3JFLGtHQUFvRjtBQUNwRixvREFBZ0U7QUFFaEUsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFFBQWdCO0lBQ2xFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFckYsTUFBTSxRQUFRLEdBQUcsSUFBQSwwQkFBYyxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXhDLElBQUksYUFBYSxHQUE2QixJQUFJLENBQUM7SUFFbkQsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDM0IsSUFBSSxpQkFBaUIsR0FBbUIsSUFBSSxDQUFDO1FBQzdDLGlCQUFpQixHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUVoRixvREFBb0Q7UUFDcEQsT0FDRSxpQkFBaUI7WUFDakIsaUJBQWlCLENBQUMsTUFBTTtZQUN4QixpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUM5RDtZQUNBLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQztTQUM5QztRQUVELElBQ0UsaUJBQWlCLEtBQUssSUFBSTtZQUMxQixpQkFBaUIsQ0FBQyxNQUFNLEtBQUssU0FBUztZQUN0QyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUM5RDtZQUNBLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxNQUEyQixDQUFDO1lBQzlELE1BQU07U0FDUDtLQUNGO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQWhDRCwwREFnQ0M7QUFFRCxTQUFTLHVCQUF1QixDQUFDLElBQVUsRUFBRSxRQUFnQjtJQUMzRCxNQUFNLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNsQixNQUFNLElBQUksZ0NBQW1CLENBQUMsMEJBQTBCLENBQUMsQ0FBQztLQUMzRDtJQUVELE1BQU0sZUFBZSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyRixNQUFNLFFBQVEsR0FBRyxJQUFBLDBCQUFjLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsTUFBTSwyQkFBMkIsR0FBRyxRQUFRO1NBQ3pDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUM7U0FDOUIsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDZCxPQUFPLElBQUEsb0JBQVEsRUFBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDO1NBQ0QsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDWCxNQUFNLHVCQUF1QixHQUFHLEdBQUcsQ0FBQyxlQUFtQyxDQUFDO1FBRXhFLE9BQU8sdUJBQXVCLENBQUMsSUFBSSxDQUFDO0lBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRVIsT0FBTywyQkFBMkIsQ0FBQztBQUNyQyxDQUFDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBVSxFQUFFLFFBQWdCO0lBQzNELE1BQU0sa0JBQWtCLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25FLE1BQU0sT0FBTyxHQUFHLElBQUEsY0FBTyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sVUFBVSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFJLE9BQU8sSUFBSSxrQkFBa0IsS0FBSyxDQUFDLENBQUM7SUFFckUsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQU5ELDRDQU1DO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQVUsRUFBRSxRQUFnQjtJQUMxRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQ2hDLFFBQVEsRUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUN2QixFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFDdEIsSUFBSSxDQUNMLENBQUM7SUFDRixNQUFNLGFBQWEsR0FBRyxJQUFBLHlDQUE0QixFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTNELE9BQU8sYUFBYSxLQUFLLElBQUksQ0FBQztBQUNoQyxDQUFDO0FBVkQsMENBVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbmRCb290c3RyYXBBcHBsaWNhdGlvbkNhbGwgfSBmcm9tICcuLi9wcml2YXRlL3N0YW5kYWxvbmUnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAnLi4vdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBmaW5kTm9kZSwgZ2V0U291cmNlTm9kZXMgfSBmcm9tICcuLi91dGlsaXR5L2FzdC11dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQm9vdHN0cmFwTW9kdWxlQ2FsbChob3N0OiBUcmVlLCBtYWluUGF0aDogc3RyaW5nKTogdHMuQ2FsbEV4cHJlc3Npb24gfCBudWxsIHtcbiAgY29uc3QgbWFpblRleHQgPSBob3N0LnJlYWRUZXh0KG1haW5QYXRoKTtcbiAgY29uc3Qgc291cmNlID0gdHMuY3JlYXRlU291cmNlRmlsZShtYWluUGF0aCwgbWFpblRleHQsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xuXG4gIGNvbnN0IGFsbE5vZGVzID0gZ2V0U291cmNlTm9kZXMoc291cmNlKTtcblxuICBsZXQgYm9vdHN0cmFwQ2FsbDogdHMuQ2FsbEV4cHJlc3Npb24gfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGNvbnN0IG5vZGUgb2YgYWxsTm9kZXMpIHtcbiAgICBsZXQgYm9vdHN0cmFwQ2FsbE5vZGU6IHRzLk5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBib290c3RyYXBDYWxsTm9kZSA9IGZpbmROb2RlKG5vZGUsIHRzLlN5bnRheEtpbmQuSWRlbnRpZmllciwgJ2Jvb3RzdHJhcE1vZHVsZScpO1xuXG4gICAgLy8gV2FsayB1cCB0aGUgcGFyZW50IHVudGlsIENhbGxFeHByZXNzaW9uIGlzIGZvdW5kLlxuICAgIHdoaWxlIChcbiAgICAgIGJvb3RzdHJhcENhbGxOb2RlICYmXG4gICAgICBib290c3RyYXBDYWxsTm9kZS5wYXJlbnQgJiZcbiAgICAgIGJvb3RzdHJhcENhbGxOb2RlLnBhcmVudC5raW5kICE9PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uXG4gICAgKSB7XG4gICAgICBib290c3RyYXBDYWxsTm9kZSA9IGJvb3RzdHJhcENhbGxOb2RlLnBhcmVudDtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBib290c3RyYXBDYWxsTm9kZSAhPT0gbnVsbCAmJlxuICAgICAgYm9vdHN0cmFwQ2FsbE5vZGUucGFyZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIGJvb3RzdHJhcENhbGxOb2RlLnBhcmVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLkNhbGxFeHByZXNzaW9uXG4gICAgKSB7XG4gICAgICBib290c3RyYXBDYWxsID0gYm9vdHN0cmFwQ2FsbE5vZGUucGFyZW50IGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJvb3RzdHJhcENhbGw7XG59XG5cbmZ1bmN0aW9uIGZpbmRCb290c3RyYXBNb2R1bGVQYXRoKGhvc3Q6IFRyZWUsIG1haW5QYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBib290c3RyYXBDYWxsID0gZmluZEJvb3RzdHJhcE1vZHVsZUNhbGwoaG9zdCwgbWFpblBhdGgpO1xuICBpZiAoIWJvb3RzdHJhcENhbGwpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQm9vdHN0cmFwIGNhbGwgbm90IGZvdW5kJyk7XG4gIH1cblxuICBjb25zdCBib290c3RyYXBNb2R1bGUgPSBib290c3RyYXBDYWxsLmFyZ3VtZW50c1swXTtcblxuICBjb25zdCBtYWluVGV4dCA9IGhvc3QucmVhZFRleHQobWFpblBhdGgpO1xuICBjb25zdCBzb3VyY2UgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKG1haW5QYXRoLCBtYWluVGV4dCwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG4gIGNvbnN0IGFsbE5vZGVzID0gZ2V0U291cmNlTm9kZXMoc291cmNlKTtcbiAgY29uc3QgYm9vdHN0cmFwTW9kdWxlUmVsYXRpdmVQYXRoID0gYWxsTm9kZXNcbiAgICAuZmlsdGVyKHRzLmlzSW1wb3J0RGVjbGFyYXRpb24pXG4gICAgLmZpbHRlcigoaW1wKSA9PiB7XG4gICAgICByZXR1cm4gZmluZE5vZGUoaW1wLCB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIsIGJvb3RzdHJhcE1vZHVsZS5nZXRUZXh0KCkpO1xuICAgIH0pXG4gICAgLm1hcCgoaW1wKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVQYXRoU3RyaW5nTGl0ZXJhbCA9IGltcC5tb2R1bGVTcGVjaWZpZXIgYXMgdHMuU3RyaW5nTGl0ZXJhbDtcblxuICAgICAgcmV0dXJuIG1vZHVsZVBhdGhTdHJpbmdMaXRlcmFsLnRleHQ7XG4gICAgfSlbMF07XG5cbiAgcmV0dXJuIGJvb3RzdHJhcE1vZHVsZVJlbGF0aXZlUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFwcE1vZHVsZVBhdGgoaG9zdDogVHJlZSwgbWFpblBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1vZHVsZVJlbGF0aXZlUGF0aCA9IGZpbmRCb290c3RyYXBNb2R1bGVQYXRoKGhvc3QsIG1haW5QYXRoKTtcbiAgY29uc3QgbWFpbkRpciA9IGRpcm5hbWUobWFpblBhdGgpO1xuICBjb25zdCBtb2R1bGVQYXRoID0gbm9ybWFsaXplKGAvJHttYWluRGlyfS8ke21vZHVsZVJlbGF0aXZlUGF0aH0udHNgKTtcblxuICByZXR1cm4gbW9kdWxlUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RhbmRhbG9uZUFwcChob3N0OiBUcmVlLCBtYWluUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNvdXJjZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoXG4gICAgbWFpblBhdGgsXG4gICAgaG9zdC5yZWFkVGV4dChtYWluUGF0aCksXG4gICAgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCxcbiAgICB0cnVlLFxuICApO1xuICBjb25zdCBib290c3RyYXBDYWxsID0gZmluZEJvb3RzdHJhcEFwcGxpY2F0aW9uQ2FsbChzb3VyY2UpO1xuXG4gIHJldHVybiBib290c3RyYXBDYWxsICE9PSBudWxsO1xufVxuIl19