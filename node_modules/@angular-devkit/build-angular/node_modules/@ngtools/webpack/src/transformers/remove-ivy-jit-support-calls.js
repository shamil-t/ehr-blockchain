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
exports.removeIvyJitSupportCalls = void 0;
const ts = __importStar(require("typescript"));
const elide_imports_1 = require("./elide_imports");
function removeIvyJitSupportCalls(classMetadata, ngModuleScope, getTypeChecker) {
    return (context) => {
        const removedNodes = [];
        const visitNode = (node) => {
            const innerStatement = ts.isExpressionStatement(node) && getIifeStatement(node);
            if (innerStatement) {
                if (ngModuleScope &&
                    ts.isBinaryExpression(innerStatement.expression) &&
                    isIvyPrivateCallExpression(innerStatement.expression.right, 'ɵɵsetNgModuleScope')) {
                    removedNodes.push(innerStatement);
                    return undefined;
                }
                if (classMetadata) {
                    const expression = ts.isBinaryExpression(innerStatement.expression)
                        ? innerStatement.expression.right
                        : innerStatement.expression;
                    if (isIvyPrivateCallExpression(expression, 'ɵsetClassMetadata')) {
                        removedNodes.push(innerStatement);
                        return undefined;
                    }
                }
            }
            return ts.visitEachChild(node, visitNode, context);
        };
        return (sourceFile) => {
            let updatedSourceFile = ts.visitEachChild(sourceFile, visitNode, context);
            if (removedNodes.length > 0) {
                // Remove any unused imports
                const importRemovals = (0, elide_imports_1.elideImports)(updatedSourceFile, removedNodes, getTypeChecker, context.getCompilerOptions());
                if (importRemovals.size > 0) {
                    updatedSourceFile = ts.visitEachChild(updatedSourceFile, function visitForRemoval(node) {
                        return importRemovals.has(node)
                            ? undefined
                            : ts.visitEachChild(node, visitForRemoval, context);
                    }, context);
                }
            }
            return updatedSourceFile;
        };
    };
}
exports.removeIvyJitSupportCalls = removeIvyJitSupportCalls;
// Each Ivy private call expression is inside an IIFE
function getIifeStatement(exprStmt) {
    const expression = exprStmt.expression;
    if (!expression || !ts.isCallExpression(expression) || expression.arguments.length !== 0) {
        return null;
    }
    const parenExpr = expression;
    if (!ts.isParenthesizedExpression(parenExpr.expression)) {
        return null;
    }
    const funExpr = parenExpr.expression.expression;
    if (!ts.isFunctionExpression(funExpr)) {
        return null;
    }
    const innerStmts = funExpr.body.statements;
    if (innerStmts.length !== 1) {
        return null;
    }
    const innerExprStmt = innerStmts[0];
    if (!ts.isExpressionStatement(innerExprStmt)) {
        return null;
    }
    return innerExprStmt;
}
function isIvyPrivateCallExpression(expression, name) {
    // Now we're in the IIFE and have the inner expression statement. We can check if it matches
    // a private Ivy call.
    if (!ts.isCallExpression(expression)) {
        return false;
    }
    const propAccExpr = expression.expression;
    if (!ts.isPropertyAccessExpression(propAccExpr)) {
        return false;
    }
    if (propAccExpr.name.text != name) {
        return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLWl2eS1qaXQtc3VwcG9ydC1jYWxscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL3JlbW92ZS1pdnktaml0LXN1cHBvcnQtY2FsbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBaUM7QUFDakMsbURBQStDO0FBRS9DLFNBQWdCLHdCQUF3QixDQUN0QyxhQUFzQixFQUN0QixhQUFzQixFQUN0QixjQUFvQztJQUVwQyxPQUFPLENBQUMsT0FBaUMsRUFBRSxFQUFFO1FBQzNDLE1BQU0sWUFBWSxHQUFjLEVBQUUsQ0FBQztRQUVuQyxNQUFNLFNBQVMsR0FBZSxDQUFDLElBQWEsRUFBRSxFQUFFO1lBQzlDLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRixJQUFJLGNBQWMsRUFBRTtnQkFDbEIsSUFDRSxhQUFhO29CQUNiLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO29CQUNoRCwwQkFBMEIsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxFQUNqRjtvQkFDQSxZQUFZLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUVsQyxPQUFPLFNBQVMsQ0FBQztpQkFDbEI7Z0JBRUQsSUFBSSxhQUFhLEVBQUU7b0JBQ2pCLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO3dCQUNqRSxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLO3dCQUNqQyxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FB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QUEwQixDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQy9DLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtRQUNqQyxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgZWxpZGVJbXBvcnRzIH0gZnJvbSAnLi9lbGlkZV9pbXBvcnRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUl2eUppdFN1cHBvcnRDYWxscyhcbiAgY2xhc3NNZXRhZGF0YTogYm9vbGVhbixcbiAgbmdNb2R1bGVTY29wZTogYm9vbGVhbixcbiAgZ2V0VHlwZUNoZWNrZXI6ICgpID0+IHRzLlR5cGVDaGVja2VyLFxuKTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+IHtcbiAgcmV0dXJuIChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpID0+IHtcbiAgICBjb25zdCByZW1vdmVkTm9kZXM6IHRzLk5vZGVbXSA9IFtdO1xuXG4gICAgY29uc3QgdmlzaXROb2RlOiB0cy5WaXNpdG9yID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIGNvbnN0IGlubmVyU3RhdGVtZW50ID0gdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpICYmIGdldElpZmVTdGF0ZW1lbnQobm9kZSk7XG4gICAgICBpZiAoaW5uZXJTdGF0ZW1lbnQpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG5nTW9kdWxlU2NvcGUgJiZcbiAgICAgICAgICB0cy5pc0JpbmFyeUV4cHJlc3Npb24oaW5uZXJTdGF0ZW1lbnQuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc0l2eVByaXZhdGVDYWxsRXhwcmVzc2lvbihpbm5lclN0YXRlbWVudC5leHByZXNzaW9uLnJpZ2h0LCAnybXJtXNldE5nTW9kdWxlU2NvcGUnKVxuICAgICAgICApIHtcbiAgICAgICAgICByZW1vdmVkTm9kZXMucHVzaChpbm5lclN0YXRlbWVudCk7XG5cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICAgICAgICBjb25zdCBleHByZXNzaW9uID0gdHMuaXNCaW5hcnlFeHByZXNzaW9uKGlubmVyU3RhdGVtZW50LmV4cHJlc3Npb24pXG4gICAgICAgICAgICA/IGlubmVyU3RhdGVtZW50LmV4cHJlc3Npb24ucmlnaHRcbiAgICAgICAgICAgIDogaW5uZXJTdGF0ZW1lbnQuZXhwcmVzc2lvbjtcbiAgICAgICAgICBpZiAoaXNJdnlQcml2YXRlQ2FsbEV4cHJlc3Npb24oZXhwcmVzc2lvbiwgJ8m1c2V0Q2xhc3NNZXRhZGF0YScpKSB7XG4gICAgICAgICAgICByZW1vdmVkTm9kZXMucHVzaChpbm5lclN0YXRlbWVudCk7XG5cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUsIGNvbnRleHQpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpID0+IHtcbiAgICAgIGxldCB1cGRhdGVkU291cmNlRmlsZSA9IHRzLnZpc2l0RWFjaENoaWxkKHNvdXJjZUZpbGUsIHZpc2l0Tm9kZSwgY29udGV4dCk7XG5cbiAgICAgIGlmIChyZW1vdmVkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBSZW1vdmUgYW55IHVudXNlZCBpbXBvcnRzXG4gICAgICAgIGNvbnN0IGltcG9ydFJlbW92YWxzID0gZWxpZGVJbXBvcnRzKFxuICAgICAgICAgIHVwZGF0ZWRTb3VyY2VGaWxlLFxuICAgICAgICAgIHJlbW92ZWROb2RlcyxcbiAgICAgICAgICBnZXRUeXBlQ2hlY2tlcixcbiAgICAgICAgICBjb250ZXh0LmdldENvbXBpbGVyT3B0aW9ucygpLFxuICAgICAgICApO1xuICAgICAgICBpZiAoaW1wb3J0UmVtb3ZhbHMuc2l6ZSA+IDApIHtcbiAgICAgICAgICB1cGRhdGVkU291cmNlRmlsZSA9IHRzLnZpc2l0RWFjaENoaWxkKFxuICAgICAgICAgICAgdXBkYXRlZFNvdXJjZUZpbGUsXG4gICAgICAgICAgICBmdW5jdGlvbiB2aXNpdEZvclJlbW92YWwobm9kZSk6IHRzLk5vZGUgfCB1bmRlZmluZWQge1xuICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0UmVtb3ZhbHMuaGFzKG5vZGUpXG4gICAgICAgICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA6IHRzLnZpc2l0RWFjaENoaWxkKG5vZGUsIHZpc2l0Rm9yUmVtb3ZhbCwgY29udGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1cGRhdGVkU291cmNlRmlsZTtcbiAgICB9O1xuICB9O1xufVxuXG4vLyBFYWNoIEl2eSBwcml2YXRlIGNhbGwgZXhwcmVzc2lvbiBpcyBpbnNpZGUgYW4gSUlGRVxuZnVuY3Rpb24gZ2V0SWlmZVN0YXRlbWVudChleHByU3RtdDogdHMuRXhwcmVzc2lvblN0YXRlbWVudCk6IG51bGwgfCB0cy5FeHByZXNzaW9uU3RhdGVtZW50IHtcbiAgY29uc3QgZXhwcmVzc2lvbiA9IGV4cHJTdG10LmV4cHJlc3Npb247XG4gIGlmICghZXhwcmVzc2lvbiB8fCAhdHMuaXNDYWxsRXhwcmVzc2lvbihleHByZXNzaW9uKSB8fCBleHByZXNzaW9uLmFyZ3VtZW50cy5sZW5ndGggIT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBhcmVuRXhwciA9IGV4cHJlc3Npb247XG4gIGlmICghdHMuaXNQYXJlbnRoZXNpemVkRXhwcmVzc2lvbihwYXJlbkV4cHIuZXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGZ1bkV4cHIgPSBwYXJlbkV4cHIuZXhwcmVzc2lvbi5leHByZXNzaW9uO1xuICBpZiAoIXRzLmlzRnVuY3Rpb25FeHByZXNzaW9uKGZ1bkV4cHIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBpbm5lclN0bXRzID0gZnVuRXhwci5ib2R5LnN0YXRlbWVudHM7XG4gIGlmIChpbm5lclN0bXRzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgaW5uZXJFeHByU3RtdCA9IGlubmVyU3RtdHNbMF07XG4gIGlmICghdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KGlubmVyRXhwclN0bXQpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gaW5uZXJFeHByU3RtdDtcbn1cblxuZnVuY3Rpb24gaXNJdnlQcml2YXRlQ2FsbEV4cHJlc3Npb24oZXhwcmVzc2lvbjogdHMuRXhwcmVzc2lvbiwgbmFtZTogc3RyaW5nKSB7XG4gIC8vIE5vdyB3ZSdyZSBpbiB0aGUgSUlGRSBhbmQgaGF2ZSB0aGUgaW5uZXIgZXhwcmVzc2lvbiBzdGF0ZW1lbnQuIFdlIGNhbiBjaGVjayBpZiBpdCBtYXRjaGVzXG4gIC8vIGEgcHJpdmF0ZSBJdnkgY2FsbC5cbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKGV4cHJlc3Npb24pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgcHJvcEFjY0V4cHIgPSBleHByZXNzaW9uLmV4cHJlc3Npb247XG4gIGlmICghdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24ocHJvcEFjY0V4cHIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHByb3BBY2NFeHByLm5hbWUudGV4dCAhPSBuYW1lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iXX0=