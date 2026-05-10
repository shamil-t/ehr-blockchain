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
exports.getKeywords = void 0;
const core_1 = require("@babel/core");
const helper_annotate_as_pure_1 = __importDefault(require("@babel/helper-annotate-as-pure"));
/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
function getKeywords() {
    return ['var'];
}
exports.getKeywords = getKeywords;
/**
 * A babel plugin factory function for adjusting TypeScript emitted enums.
 *
 * @returns A babel plugin object instance.
 */
function default_1() {
    return {
        visitor: {
            VariableDeclaration(path) {
                const { parentPath, node } = path;
                if (node.kind !== 'var' || node.declarations.length !== 1) {
                    return;
                }
                const declaration = path.get('declarations')[0];
                if (declaration.node.init) {
                    return;
                }
                const declarationId = declaration.node.id;
                if (!core_1.types.isIdentifier(declarationId)) {
                    return;
                }
                const hasExport = parentPath.isExportNamedDeclaration() || parentPath.isExportDefaultDeclaration();
                const origin = hasExport ? parentPath : path;
                const nextStatement = origin.getSibling(+origin.key + 1);
                if (!nextStatement.isExpressionStatement()) {
                    return;
                }
                const nextExpression = nextStatement.get('expression');
                if (!nextExpression.isCallExpression() || nextExpression.node.arguments.length !== 1) {
                    return;
                }
                const enumCallArgument = nextExpression.get('arguments')[0];
                if (!enumCallArgument.isLogicalExpression({ operator: '||' })) {
                    return;
                }
                const leftCallArgument = enumCallArgument.get('left');
                const rightCallArgument = enumCallArgument.get('right');
                // Check if identifiers match var declaration
                if (!leftCallArgument.isIdentifier() ||
                    !nextExpression.scope.bindingIdentifierEquals(leftCallArgument.node.name, declarationId) ||
                    !rightCallArgument.isAssignmentExpression()) {
                    return;
                }
                const enumCallee = nextExpression.get('callee');
                if (!enumCallee.isFunctionExpression() || enumCallee.node.params.length !== 1) {
                    return;
                }
                const parameterId = enumCallee.get('params')[0];
                if (!parameterId.isIdentifier()) {
                    return;
                }
                // Check if all enum member values are pure.
                // If not, leave as-is due to potential side efects
                let hasElements = false;
                for (const enumStatement of enumCallee.get('body').get('body')) {
                    if (!enumStatement.isExpressionStatement()) {
                        return;
                    }
                    const enumValueAssignment = enumStatement.get('expression');
                    if (!enumValueAssignment.isAssignmentExpression() ||
                        !enumValueAssignment.get('right').isPure()) {
                        return;
                    }
                    hasElements = true;
                }
                // If there are no enum elements then there is nothing to wrap
                if (!hasElements) {
                    return;
                }
                // Update right-side of initializer call argument to remove redundant assignment
                if (rightCallArgument.get('left').isIdentifier()) {
                    rightCallArgument.replaceWith(rightCallArgument.get('right'));
                }
                // Add a return statement to the enum initializer block
                enumCallee
                    .get('body')
                    .node.body.push(core_1.types.returnStatement(core_1.types.cloneNode(parameterId.node)));
                // Remove existing enum initializer
                const enumInitializer = nextExpression.node;
                nextExpression.remove();
                (0, helper_annotate_as_pure_1.default)(enumInitializer);
                // Add the wrapped enum initializer directly to the variable declaration
                declaration.get('init').replaceWith(enumInitializer);
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRqdXN0LXR5cGVzY3JpcHQtZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9iYWJlbC9wbHVnaW5zL2FkanVzdC10eXBlc2NyaXB0LWVudW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILHNDQUF5RDtBQUN6RCw2RkFBNEQ7QUFFNUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixXQUFXO0lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBRkQsa0NBRUM7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSxPQUFPO1FBQ0wsT0FBTyxFQUFFO1lBQ1AsbUJBQW1CLENBQUMsSUFBeUM7Z0JBQzNELE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDekQsT0FBTztpQkFDUjtnQkFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUN6QixPQUFPO2lCQUNSO2dCQUVELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsWUFBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRTtvQkFDdEMsT0FBTztpQkFDUjtnQkFFRCxNQUFNLFNBQVMsR0FDYixVQUFVLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxVQUFVLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFD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O2dCQUVELHVEQUF1RDtnQkFDdkQsVUFBVTtxQkFDUCxHQUFHLENBQUMsTUFBTSxDQUFDO3FCQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQUssQ0FBQyxlQUFlLENBQUMsWUFBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxtQ0FBbUM7Z0JBQ25DLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7Z0JBQzVDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFFeEIsSUFBQSxpQ0FBYyxFQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUVoQyx3RUFBd0U7Z0JBQ3hFLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7U0FDRjtLQUNGLENBQUM7QUFDSixDQUFDO0FBM0dELDRCQTJHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBOb2RlUGF0aCwgUGx1Z2luT2JqLCB0eXBlcyB9IGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCBhbm5vdGF0ZUFzUHVyZSBmcm9tICdAYmFiZWwvaGVscGVyLWFubm90YXRlLWFzLXB1cmUnO1xuXG4vKipcbiAqIFByb3ZpZGVzIG9uZSBvciBtb3JlIGtleXdvcmRzIHRoYXQgaWYgZm91bmQgd2l0aGluIHRoZSBjb250ZW50IG9mIGEgc291cmNlIGZpbGUgaW5kaWNhdGVcbiAqIHRoYXQgdGhpcyBwbHVnaW4gc2hvdWxkIGJlIHVzZWQgd2l0aCBhIHNvdXJjZSBmaWxlLlxuICpcbiAqIEByZXR1cm5zIEFuIGEgc3RyaW5nIGl0ZXJhYmxlIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUga2V5d29yZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXl3b3JkcygpOiBJdGVyYWJsZTxzdHJpbmc+IHtcbiAgcmV0dXJuIFsndmFyJ107XG59XG5cbi8qKlxuICogQSBiYWJlbCBwbHVnaW4gZmFjdG9yeSBmdW5jdGlvbiBmb3IgYWRqdXN0aW5nIFR5cGVTY3JpcHQgZW1pdHRlZCBlbnVtcy5cbiAqXG4gKiBAcmV0dXJucyBBIGJhYmVsIHBsdWdpbiBvYmplY3QgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpOiBQbHVnaW5PYmoge1xuICByZXR1cm4ge1xuICAgIHZpc2l0b3I6IHtcbiAgICAgIFZhcmlhYmxlRGVjbGFyYXRpb24ocGF0aDogTm9kZVBhdGg8dHlwZXMuVmFyaWFibGVEZWNsYXJhdGlvbj4pIHtcbiAgICAgICAgY29uc3QgeyBwYXJlbnRQYXRoLCBub2RlIH0gPSBwYXRoO1xuICAgICAgICBpZiAobm9kZS5raW5kICE9PSAndmFyJyB8fCBub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbiA9IHBhdGguZ2V0KCdkZWNsYXJhdGlvbnMnKVswXTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uLm5vZGUuaW5pdCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uSWQgPSBkZWNsYXJhdGlvbi5ub2RlLmlkO1xuICAgICAgICBpZiAoIXR5cGVzLmlzSWRlbnRpZmllcihkZWNsYXJhdGlvbklkKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc0V4cG9ydCA9XG4gICAgICAgICAgcGFyZW50UGF0aC5pc0V4cG9ydE5hbWVkRGVjbGFyYXRpb24oKSB8fCBwYXJlbnRQYXRoLmlzRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IGhhc0V4cG9ydCA/IHBhcmVudFBhdGggOiBwYXRoO1xuICAgICAgICBjb25zdCBuZXh0U3RhdGVtZW50ID0gb3JpZ2luLmdldFNpYmxpbmcoK29yaWdpbi5rZXkgKyAxKTtcbiAgICAgICAgaWYgKCFuZXh0U3RhdGVtZW50LmlzRXhwcmVzc2lvblN0YXRlbWVudCgpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV4dEV4cHJlc3Npb24gPSBuZXh0U3RhdGVtZW50LmdldCgnZXhwcmVzc2lvbicpO1xuICAgICAgICBpZiAoIW5leHRFeHByZXNzaW9uLmlzQ2FsbEV4cHJlc3Npb24oKSB8fCBuZXh0RXhwcmVzc2lvbi5ub2RlLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbnVtQ2FsbEFyZ3VtZW50ID0gbmV4dEV4cHJlc3Npb24uZ2V0KCdhcmd1bWVudHMnKVswXTtcbiAgICAgICAgaWYgKCFlbnVtQ2FsbEFyZ3VtZW50LmlzTG9naWNhbEV4cHJlc3Npb24oeyBvcGVyYXRvcjogJ3x8JyB9KSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlZnRDYWxsQXJndW1lbnQgPSBlbnVtQ2FsbEFyZ3VtZW50LmdldCgnbGVmdCcpO1xuICAgICAgICBjb25zdCByaWdodENhbGxBcmd1bWVudCA9IGVudW1DYWxsQXJndW1lbnQuZ2V0KCdyaWdodCcpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGlkZW50aWZpZXJzIG1hdGNoIHZhciBkZWNsYXJhdGlvblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWxlZnRDYWxsQXJndW1lbnQuaXNJZGVudGlmaWVyKCkgfHxcbiAgICAgICAgICAhbmV4dEV4cHJlc3Npb24uc2NvcGUuYmluZGluZ0lkZW50aWZpZXJFcXVhbHMoXG4gICAgICAgICAgICBsZWZ0Q2FsbEFyZ3VtZW50Lm5vZGUubmFtZSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uSWQsXG4gICAgICAgICAgKSB8fFxuICAgICAgICAgICFyaWdodENhbGxBcmd1bWVudC5pc0Fzc2lnbm1lbnRFeHByZXNzaW9uKClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW51bUNhbGxlZSA9IG5leHRFeHByZXNzaW9uLmdldCgnY2FsbGVlJyk7XG4gICAgICAgIGlmICghZW51bUNhbGxlZS5pc0Z1bmN0aW9uRXhwcmVzc2lvbigpIHx8IGVudW1DYWxsZWUubm9kZS5wYXJhbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyYW1ldGVySWQgPSBlbnVtQ2FsbGVlLmdldCgncGFyYW1zJylbMF07XG4gICAgICAgIGlmICghcGFyYW1ldGVySWQuaXNJZGVudGlmaWVyKCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiBhbGwgZW51bSBtZW1iZXIgdmFsdWVzIGFyZSBwdXJlLlxuICAgICAgICAvLyBJZiBub3QsIGxlYXZlIGFzLWlzIGR1ZSB0byBwb3RlbnRpYWwgc2lkZSBlZmVjdHNcbiAgICAgICAgbGV0IGhhc0VsZW1lbnRzID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3QgZW51bVN0YXRlbWVudCBvZiBlbnVtQ2FsbGVlLmdldCgnYm9keScpLmdldCgnYm9keScpKSB7XG4gICAgICAgICAgaWYgKCFlbnVtU3RhdGVtZW50LmlzRXhwcmVzc2lvblN0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZW51bVZhbHVlQXNzaWdubWVudCA9IGVudW1TdGF0ZW1lbnQuZ2V0KCdleHByZXNzaW9uJyk7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWVudW1WYWx1ZUFzc2lnbm1lbnQuaXNBc3NpZ25tZW50RXhwcmVzc2lvbigpIHx8XG4gICAgICAgICAgICAhZW51bVZhbHVlQXNzaWdubWVudC5nZXQoJ3JpZ2h0JykuaXNQdXJlKClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBoYXNFbGVtZW50cyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gZW51bSBlbGVtZW50cyB0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gd3JhcFxuICAgICAgICBpZiAoIWhhc0VsZW1lbnRzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHJpZ2h0LXNpZGUgb2YgaW5pdGlhbGl6ZXIgY2FsbCBhcmd1bWVudCB0byByZW1vdmUgcmVkdW5kYW50IGFzc2lnbm1lbnRcbiAgICAgICAgaWYgKHJpZ2h0Q2FsbEFyZ3VtZW50LmdldCgnbGVmdCcpLmlzSWRlbnRpZmllcigpKSB7XG4gICAgICAgICAgcmlnaHRDYWxsQXJndW1lbnQucmVwbGFjZVdpdGgocmlnaHRDYWxsQXJndW1lbnQuZ2V0KCdyaWdodCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhIHJldHVybiBzdGF0ZW1lbnQgdG8gdGhlIGVudW0gaW5pdGlhbGl6ZXIgYmxvY2tcbiAgICAgICAgZW51bUNhbGxlZVxuICAgICAgICAgIC5nZXQoJ2JvZHknKVxuICAgICAgICAgIC5ub2RlLmJvZHkucHVzaCh0eXBlcy5yZXR1cm5TdGF0ZW1lbnQodHlwZXMuY2xvbmVOb2RlKHBhcmFtZXRlcklkLm5vZGUpKSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIGVudW0gaW5pdGlhbGl6ZXJcbiAgICAgICAgY29uc3QgZW51bUluaXRpYWxpemVyID0gbmV4dEV4cHJlc3Npb24ubm9kZTtcbiAgICAgICAgbmV4dEV4cHJlc3Npb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgYW5ub3RhdGVBc1B1cmUoZW51bUluaXRpYWxpemVyKTtcblxuICAgICAgICAvLyBBZGQgdGhlIHdyYXBwZWQgZW51bSBpbml0aWFsaXplciBkaXJlY3RseSB0byB0aGUgdmFyaWFibGUgZGVjbGFyYXRpb25cbiAgICAgICAgZGVjbGFyYXRpb24uZ2V0KCdpbml0JykucmVwbGFjZVdpdGgoZW51bUluaXRpYWxpemVyKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==