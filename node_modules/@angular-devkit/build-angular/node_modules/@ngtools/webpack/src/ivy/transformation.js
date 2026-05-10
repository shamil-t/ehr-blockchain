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
exports.replaceBootstrap = exports.mergeTransformers = exports.createJitTransformers = exports.createAotTransformers = void 0;
const ts = __importStar(require("typescript"));
const elide_imports_1 = require("../transformers/elide_imports");
const remove_ivy_jit_support_calls_1 = require("../transformers/remove-ivy-jit-support-calls");
const replace_resources_1 = require("../transformers/replace_resources");
function createAotTransformers(builder, options) {
    const getTypeChecker = () => builder.getProgram().getTypeChecker();
    const transformers = {
        before: [replaceBootstrap(getTypeChecker)],
        after: [],
    };
    const removeClassMetadata = !options.emitClassMetadata;
    const removeNgModuleScope = !options.emitNgModuleScope;
    if (removeClassMetadata || removeNgModuleScope) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transformers.before.push((0, remove_ivy_jit_support_calls_1.removeIvyJitSupportCalls)(removeClassMetadata, removeNgModuleScope, getTypeChecker));
    }
    return transformers;
}
exports.createAotTransformers = createAotTransformers;
function createJitTransformers(builder, compilerCli, options) {
    const getTypeChecker = () => builder.getProgram().getTypeChecker();
    return {
        before: [
            (0, replace_resources_1.replaceResources)(() => true, getTypeChecker, options.inlineStyleFileExtension),
            compilerCli.constructorParametersDownlevelTransform(builder.getProgram()),
        ],
    };
}
exports.createJitTransformers = createJitTransformers;
function mergeTransformers(first, second) {
    const result = {};
    if (first.before || second.before) {
        result.before = [...(first.before || []), ...(second.before || [])];
    }
    if (first.after || second.after) {
        result.after = [...(first.after || []), ...(second.after || [])];
    }
    if (first.afterDeclarations || second.afterDeclarations) {
        result.afterDeclarations = [
            ...(first.afterDeclarations || []),
            ...(second.afterDeclarations || []),
        ];
    }
    return result;
}
exports.mergeTransformers = mergeTransformers;
/**
 * The name of the Angular platform that should be replaced within
 * bootstrap call expressions to support AOT.
 */
const PLATFORM_BROWSER_DYNAMIC_NAME = 'platformBrowserDynamic';
function replaceBootstrap(getTypeChecker) {
    return (context) => {
        let bootstrapImport;
        let bootstrapNamespace;
        const replacedNodes = [];
        const nodeFactory = context.factory;
        const visitNode = (node) => {
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
                const target = node.expression;
                if (target.text === PLATFORM_BROWSER_DYNAMIC_NAME) {
                    if (!bootstrapNamespace) {
                        bootstrapNamespace = nodeFactory.createUniqueName('__NgCli_bootstrap_');
                        bootstrapImport = nodeFactory.createImportDeclaration(undefined, nodeFactory.createImportClause(false, undefined, nodeFactory.createNamespaceImport(bootstrapNamespace)), nodeFactory.createStringLiteral('@angular/platform-browser'));
                    }
                    replacedNodes.push(target);
                    return nodeFactory.updateCallExpression(node, nodeFactory.createPropertyAccessExpression(bootstrapNamespace, 'platformBrowser'), node.typeArguments, node.arguments);
                }
            }
            return ts.visitEachChild(node, visitNode, context);
        };
        return (sourceFile) => {
            if (!sourceFile.text.includes(PLATFORM_BROWSER_DYNAMIC_NAME)) {
                return sourceFile;
            }
            let updatedSourceFile = ts.visitEachChild(sourceFile, visitNode, context);
            if (bootstrapImport) {
                // Remove any unused platform browser dynamic imports
                const removals = (0, elide_imports_1.elideImports)(updatedSourceFile, replacedNodes, getTypeChecker, context.getCompilerOptions());
                if (removals.size > 0) {
                    updatedSourceFile = ts.visitEachChild(updatedSourceFile, (node) => (removals.has(node) ? undefined : node), context);
                }
                // Add new platform browser import
                return nodeFactory.updateSourceFile(updatedSourceFile, ts.setTextRange(nodeFactory.createNodeArray([bootstrapImport, ...updatedSourceFile.statements]), sourceFile.statements));
            }
            else {
                return updatedSourceFile;
            }
        };
    };
}
exports.replaceBootstrap = replaceBootstrap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL2l2eS90cmFuc2Zvcm1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFpQztBQUNqQyxpRUFBNkQ7QUFDN0QsK0ZBQXdGO0FBQ3hGLHlFQUFxRTtBQUVyRSxTQUFnQixxQkFBcUIsQ0FDbkMsT0FBMEIsRUFDMUIsT0FBcUU7SUFFckUsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25FLE1BQU0sWUFBWSxHQUEwQjtRQUMxQyxNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMxQyxLQUFLLEVBQUUsRUFBRTtLQUNWLENBQUM7SUFFRixNQUFNLG1CQUFtQixHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO0lBQ3ZELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7SUFDdkQsSUFBSSxtQkFBbUIsSUFBSSxtQkFBbUIsRUFBRTtRQUM5QyxvRUFBb0U7UUFDcEUsWUFBWSxDQUFDLE1BQU8sQ0FBQyxJQUFJLENBQ3ZCLElBQUEsdURBQXdCLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxDQUFDLENBQ25GLENBQUM7S0FDSDtJQUVELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFwQkQsc0RBb0JDO0FBRUQsU0FBZ0IscUJBQXFCLENBQ25DLE9BQTBCLEVBQzFCLFdBQW1ELEVBQ25ELE9BRUM7SUFFRCxNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsY0FBYyxFQUFFLENB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QUM7QUEzRUQsNENBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgZWxpZGVJbXBvcnRzIH0gZnJvbSAnLi4vdHJhbnNmb3JtZXJzL2VsaWRlX2ltcG9ydHMnO1xuaW1wb3J0IHsgcmVtb3ZlSXZ5Sml0U3VwcG9ydENhbGxzIH0gZnJvbSAnLi4vdHJhbnNmb3JtZXJzL3JlbW92ZS1pdnktaml0LXN1cHBvcnQtY2FsbHMnO1xuaW1wb3J0IHsgcmVwbGFjZVJlc291cmNlcyB9IGZyb20gJy4uL3RyYW5zZm9ybWVycy9yZXBsYWNlX3Jlc291cmNlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBb3RUcmFuc2Zvcm1lcnMoXG4gIGJ1aWxkZXI6IHRzLkJ1aWxkZXJQcm9ncmFtLFxuICBvcHRpb25zOiB7IGVtaXRDbGFzc01ldGFkYXRhPzogYm9vbGVhbjsgZW1pdE5nTW9kdWxlU2NvcGU/OiBib29sZWFuIH0sXG4pOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMge1xuICBjb25zdCBnZXRUeXBlQ2hlY2tlciA9ICgpID0+IGJ1aWxkZXIuZ2V0UHJvZ3JhbSgpLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHRyYW5zZm9ybWVyczogdHMuQ3VzdG9tVHJhbnNmb3JtZXJzID0ge1xuICAgIGJlZm9yZTogW3JlcGxhY2VCb290c3RyYXAoZ2V0VHlwZUNoZWNrZXIpXSxcbiAgICBhZnRlcjogW10sXG4gIH07XG5cbiAgY29uc3QgcmVtb3ZlQ2xhc3NNZXRhZGF0YSA9ICFvcHRpb25zLmVtaXRDbGFzc01ldGFkYXRhO1xuICBjb25zdCByZW1vdmVOZ01vZHVsZVNjb3BlID0gIW9wdGlvbnMuZW1pdE5nTW9kdWxlU2NvcGU7XG4gIGlmIChyZW1vdmVDbGFzc01ldGFkYXRhIHx8IHJlbW92ZU5nTW9kdWxlU2NvcGUpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgIHRyYW5zZm9ybWVycy5iZWZvcmUhLnB1c2goXG4gICAgICByZW1vdmVJdnlKaXRTdXBwb3J0Q2FsbHMocmVtb3ZlQ2xhc3NNZXRhZGF0YSwgcmVtb3ZlTmdNb2R1bGVTY29wZSwgZ2V0VHlwZUNoZWNrZXIpLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gdHJhbnNmb3JtZXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSml0VHJhbnNmb3JtZXJzKFxuICBidWlsZGVyOiB0cy5CdWlsZGVyUHJvZ3JhbSxcbiAgY29tcGlsZXJDbGk6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScpLFxuICBvcHRpb25zOiB7XG4gICAgaW5saW5lU3R5bGVGaWxlRXh0ZW5zaW9uPzogc3RyaW5nO1xuICB9LFxuKTogdHMuQ3VzdG9tVHJhbnNmb3JtZXJzIHtcbiAgY29uc3QgZ2V0VHlwZUNoZWNrZXIgPSAoKSA9PiBidWlsZGVyLmdldFByb2dyYW0oKS5nZXRUeXBlQ2hlY2tlcigpO1xuXG4gIHJldHVybiB7XG4gICAgYmVmb3JlOiBbXG4gICAgICByZXBsYWNlUmVzb3VyY2VzKCgpID0+IHRydWUsIGdldFR5cGVDaGVja2VyLCBvcHRpb25zLmlubGluZVN0eWxlRmlsZUV4dGVuc2lvbiksXG4gICAgICBjb21waWxlckNsaS5jb25zdHJ1Y3RvclBhcmFtZXRlcnNEb3dubGV2ZWxUcmFuc2Zvcm0oYnVpbGRlci5nZXRQcm9ncmFtKCkpLFxuICAgIF0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVRyYW5zZm9ybWVycyhcbiAgZmlyc3Q6IHRzLkN1c3RvbVRyYW5zZm9ybWVycyxcbiAgc2Vjb25kOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMsXG4pOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMge1xuICBjb25zdCByZXN1bHQ6IHRzLkN1c3RvbVRyYW5zZm9ybWVycyA9IHt9O1xuXG4gIGlmIChmaXJzdC5iZWZvcmUgfHwgc2Vjb25kLmJlZm9yZSkge1xuICAgIHJlc3VsdC5iZWZvcmUgPSBbLi4uKGZpcnN0LmJlZm9yZSB8fCBbXSksIC4uLihzZWNvbmQuYmVmb3JlIHx8IFtdKV07XG4gIH1cblxuICBpZiAoZmlyc3QuYWZ0ZXIgfHwgc2Vjb25kLmFmdGVyKSB7XG4gICAgcmVzdWx0LmFmdGVyID0gWy4uLihmaXJzdC5hZnRlciB8fCBbXSksIC4uLihzZWNvbmQuYWZ0ZXIgfHwgW10pXTtcbiAgfVxuXG4gIGlmIChmaXJzdC5hZnRlckRlY2xhcmF0aW9ucyB8fCBzZWNvbmQuYWZ0ZXJEZWNsYXJhdGlvbnMpIHtcbiAgICByZXN1bHQuYWZ0ZXJEZWNsYXJhdGlvbnMgPSBbXG4gICAgICAuLi4oZmlyc3QuYWZ0ZXJEZWNsYXJhdGlvbnMgfHwgW10pLFxuICAgICAgLi4uKHNlY29uZC5hZnRlckRlY2xhcmF0aW9ucyB8fCBbXSksXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIEFuZ3VsYXIgcGxhdGZvcm0gdGhhdCBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aGluXG4gKiBib290c3RyYXAgY2FsbCBleHByZXNzaW9ucyB0byBzdXBwb3J0IEFPVC5cbiAqL1xuY29uc3QgUExBVEZPUk1fQlJPV1NFUl9EWU5BTUlDX05BTUUgPSAncGxhdGZvcm1Ccm93c2VyRHluYW1pYyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlQm9vdHN0cmFwKFxuICBnZXRUeXBlQ2hlY2tlcjogKCkgPT4gdHMuVHlwZUNoZWNrZXIsXG4pOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4ge1xuICByZXR1cm4gKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCkgPT4ge1xuICAgIGxldCBib290c3RyYXBJbXBvcnQ6IHRzLkltcG9ydERlY2xhcmF0aW9uIHwgdW5kZWZpbmVkO1xuICAgIGxldCBib290c3RyYXBOYW1lc3BhY2U6IHRzLklkZW50aWZpZXIgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgcmVwbGFjZWROb2RlczogdHMuTm9kZVtdID0gW107XG4gICAgY29uc3Qgbm9kZUZhY3RvcnkgPSBjb250ZXh0LmZhY3Rvcnk7XG5cbiAgICBjb25zdCB2aXNpdE5vZGU6IHRzLlZpc2l0b3IgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gbm9kZS5leHByZXNzaW9uO1xuICAgICAgICBpZiAodGFyZ2V0LnRleHQgPT09IFBMQVRGT1JNX0JST1dTRVJfRFlOQU1JQ19OQU1FKSB7XG4gICAgICAgICAgaWYgKCFib290c3RyYXBOYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIGJvb3RzdHJhcE5hbWVzcGFjZSA9IG5vZGVGYWN0b3J5LmNyZWF0ZVVuaXF1ZU5hbWUoJ19fTmdDbGlfYm9vdHN0cmFwXycpO1xuICAgICAgICAgICAgYm9vdHN0cmFwSW1wb3J0ID0gbm9kZUZhY3RvcnkuY3JlYXRlSW1wb3J0RGVjbGFyYXRpb24oXG4gICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgbm9kZUZhY3RvcnkuY3JlYXRlSW1wb3J0Q2xhdXNlKFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBub2RlRmFjdG9yeS5jcmVhdGVOYW1lc3BhY2VJbXBvcnQoYm9vdHN0cmFwTmFtZXNwYWNlKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgbm9kZUZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbCgnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlcicpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVwbGFjZWROb2Rlcy5wdXNoKHRhcmdldCk7XG5cbiAgICAgICAgICByZXR1cm4gbm9kZUZhY3RvcnkudXBkYXRlQ2FsbEV4cHJlc3Npb24oXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbm9kZUZhY3RvcnkuY3JlYXRlUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGJvb3RzdHJhcE5hbWVzcGFjZSwgJ3BsYXRmb3JtQnJvd3NlcicpLFxuICAgICAgICAgICAgbm9kZS50eXBlQXJndW1lbnRzLFxuICAgICAgICAgICAgbm9kZS5hcmd1bWVudHMsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlLCBjb250ZXh0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSA9PiB7XG4gICAgICBpZiAoIXNvdXJjZUZpbGUudGV4dC5pbmNsdWRlcyhQTEFURk9STV9CUk9XU0VSX0RZTkFNSUNfTkFNRSkpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZUZpbGU7XG4gICAgICB9XG5cbiAgICAgIGxldCB1cGRhdGVkU291cmNlRmlsZSA9IHRzLnZpc2l0RWFjaENoaWxkKHNvdXJjZUZpbGUsIHZpc2l0Tm9kZSwgY29udGV4dCk7XG5cbiAgICAgIGlmIChib290c3RyYXBJbXBvcnQpIHtcbiAgICAgICAgLy8gUmVtb3ZlIGFueSB1bnVzZWQgcGxhdGZvcm0gYnJvd3NlciBkeW5hbWljIGltcG9ydHNcbiAgICAgICAgY29uc3QgcmVtb3ZhbHMgPSBlbGlkZUltcG9ydHMoXG4gICAgICAgICAgdXBkYXRlZFNvdXJjZUZpbGUsXG4gICAgICAgICAgcmVwbGFjZWROb2RlcyxcbiAgICAgICAgICBnZXRUeXBlQ2hlY2tlcixcbiAgICAgICAgICBjb250ZXh0LmdldENvbXBpbGVyT3B0aW9ucygpLFxuICAgICAgICApO1xuICAgICAgICBpZiAocmVtb3ZhbHMuc2l6ZSA+IDApIHtcbiAgICAgICAgICB1cGRhdGVkU291cmNlRmlsZSA9IHRzLnZpc2l0RWFjaENoaWxkKFxuICAgICAgICAgICAgdXBkYXRlZFNvdXJjZUZpbGUsXG4gICAgICAgICAgICAobm9kZSkgPT4gKHJlbW92YWxzLmhhcyhub2RlKSA/IHVuZGVmaW5lZCA6IG5vZGUpLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIG5ldyBwbGF0Zm9ybSBicm93c2VyIGltcG9ydFxuICAgICAgICByZXR1cm4gbm9kZUZhY3RvcnkudXBkYXRlU291cmNlRmlsZShcbiAgICAgICAgICB1cGRhdGVkU291cmNlRmlsZSxcbiAgICAgICAgICB0cy5zZXRUZXh0UmFuZ2UoXG4gICAgICAgICAgICBub2RlRmFjdG9yeS5jcmVhdGVOb2RlQXJyYXkoW2Jvb3RzdHJhcEltcG9ydCwgLi4udXBkYXRlZFNvdXJjZUZpbGUuc3RhdGVtZW50c10pLFxuICAgICAgICAgICAgc291cmNlRmlsZS5zdGF0ZW1lbnRzLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXBkYXRlZFNvdXJjZUZpbGU7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcbn1cbiJdfQ==