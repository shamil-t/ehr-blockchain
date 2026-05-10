/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
/**
 * Generate a preamble sequence for each view creation block and listener function which declares
 * any variables that be referenced in other operations in the block.
 *
 * Variables generated include:
 *   * a saved view context to be used to restore the current view in event listeners.
 *   * the context of the restored view within event listener handlers.
 *   * context variables from the current view as well as all parent views (including the root
 *     context if needed).
 *   * local references from elements within the current view and any lexical parents.
 *
 * Variables are generated here unconditionally, and may optimized away in future operations if it
 * turns out their values (and any side effects) are unused.
 */
export function phaseGenerateVariables(cpl) {
    recursivelyProcessView(cpl.root, /* there is no parent scope for the root view */ null);
}
/**
 * Process the given `ViewCompilation` and generate preambles for it and any listeners that it
 * declares.
 *
 * @param `parentScope` a scope extracted from the parent view which captures any variables which
 *     should be inherited by this view. `null` if the current view is the root view.
 */
function recursivelyProcessView(view, parentScope) {
    // Extract a `Scope` from this view.
    const scope = getScopeForView(view, parentScope);
    for (const op of view.create) {
        switch (op.kind) {
            case ir.OpKind.Template:
                // Descend into child embedded views.
                recursivelyProcessView(view.job.views.get(op.xref), scope);
                break;
            case ir.OpKind.Listener:
                // Prepend variables to listener handler functions.
                op.handlerOps.prepend(generateVariablesInScopeForView(view, scope));
                break;
        }
    }
    // Prepend the declarations for all available variables in scope to the `update` block.
    const preambleOps = generateVariablesInScopeForView(view, scope);
    view.update.prepend(preambleOps);
}
/**
 * Process a view and generate a `Scope` representing the variables available for reference within
 * that view.
 */
function getScopeForView(view, parent) {
    const scope = {
        view: view.xref,
        viewContextVariable: {
            kind: ir.SemanticVariableKind.Context,
            name: null,
            view: view.xref,
        },
        contextVariables: new Map(),
        references: [],
        parent,
    };
    for (const identifier of view.contextVariables.keys()) {
        scope.contextVariables.set(identifier, {
            kind: ir.SemanticVariableKind.Identifier,
            name: null,
            identifier,
        });
    }
    for (const op of view.create) {
        switch (op.kind) {
            case ir.OpKind.Element:
            case ir.OpKind.ElementStart:
            case ir.OpKind.Template:
                if (!Array.isArray(op.localRefs)) {
                    throw new Error(`AssertionError: expected localRefs to be an array`);
                }
                // Record available local references from this element.
                for (let offset = 0; offset < op.localRefs.length; offset++) {
                    scope.references.push({
                        name: op.localRefs[offset].name,
                        targetId: op.xref,
                        offset,
                        variable: {
                            kind: ir.SemanticVariableKind.Identifier,
                            name: null,
                            identifier: op.localRefs[offset].name,
                        },
                    });
                }
                break;
        }
    }
    return scope;
}
/**
 * Generate declarations for all variables that are in scope for a given view.
 *
 * This is a recursive process, as views inherit variables available from their parent view, which
 * itself may have inherited variables, etc.
 */
function generateVariablesInScopeForView(view, scope) {
    const newOps = [];
    if (scope.view !== view.xref) {
        // Before generating variables for a parent view, we need to switch to the context of the parent
        // view with a `nextContext` expression. This context switching operation itself declares a
        // variable, because the context of the view may be referenced directly.
        newOps.push(ir.createVariableOp(view.job.allocateXrefId(), scope.viewContextVariable, new ir.NextContextExpr()));
    }
    // Add variables for all context variables available in this scope's view.
    for (const [name, value] of view.job.views.get(scope.view).contextVariables) {
        newOps.push(ir.createVariableOp(view.job.allocateXrefId(), scope.contextVariables.get(name), new o.ReadPropExpr(new ir.ContextExpr(scope.view), value)));
    }
    // Add variables for all local references declared for elements in this scope.
    for (const ref of scope.references) {
        newOps.push(ir.createVariableOp(view.job.allocateXrefId(), ref.variable, new ir.ReferenceExpr(ref.targetId, ref.offset)));
    }
    if (scope.parent !== null) {
        // Recursively add variables from the parent scope.
        newOps.push(...generateVariablesInScopeForView(view, scope.parent));
    }
    return newOps;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVfdmFyaWFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvZ2VuZXJhdGVfdmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxDQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbkQsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFJL0I7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUE0QjtJQUNqRSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGdEQUFnRCxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFGLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLHNCQUFzQixDQUFDLElBQXlCLEVBQUUsV0FBdUI7SUFDaEYsb0NBQW9DO0lBQ3BDLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFakQsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQzVCLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNmLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRO2dCQUNyQixxQ0FBcUM7Z0JBQ3JDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVELE1BQU07WUFDUixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUTtnQkFDckIsbURBQW1EO2dCQUNuRCxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENB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Q0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUMsZ0JBQWdCLEVBQUU7UUFDNUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsRUFDNUQsSUFBSSxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pFO0lBRUQsOEVBQThFO0lBQzlFLEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtRQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0Y7SUFFRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFO1FBQ3pCLG1EQUFtRDtRQUNuRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsK0JBQStCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ3JFO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcblxuaW1wb3J0IHR5cGUge0NvbXBvbmVudENvbXBpbGF0aW9uSm9iLCBWaWV3Q29tcGlsYXRpb25Vbml0fSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbi8qKlxuICogR2VuZXJhdGUgYSBwcmVhbWJsZSBzZXF1ZW5jZSBmb3IgZWFjaCB2aWV3IGNyZWF0aW9uIGJsb2NrIGFuZCBsaXN0ZW5lciBmdW5jdGlvbiB3aGljaCBkZWNsYXJlc1xuICogYW55IHZhcmlhYmxlcyB0aGF0IGJlIHJlZmVyZW5jZWQgaW4gb3RoZXIgb3BlcmF0aW9ucyBpbiB0aGUgYmxvY2suXG4gKlxuICogVmFyaWFibGVzIGdlbmVyYXRlZCBpbmNsdWRlOlxuICogICAqIGEgc2F2ZWQgdmlldyBjb250ZXh0IHRvIGJlIHVzZWQgdG8gcmVzdG9yZSB0aGUgY3VycmVudCB2aWV3IGluIGV2ZW50IGxpc3RlbmVycy5cbiAqICAgKiB0aGUgY29udGV4dCBvZiB0aGUgcmVzdG9yZWQgdmlldyB3aXRoaW4gZXZlbnQgbGlzdGVuZXIgaGFuZGxlcnMuXG4gKiAgICogY29udGV4dCB2YXJpYWJsZXMgZnJvbSB0aGUgY3VycmVudCB2aWV3IGFzIHdlbGwgYXMgYWxsIHBhcmVudCB2aWV3cyAoaW5jbHVkaW5nIHRoZSByb290XG4gKiAgICAgY29udGV4dCBpZiBuZWVkZWQpLlxuICogICAqIGxvY2FsIHJlZmVyZW5jZXMgZnJvbSBlbGVtZW50cyB3aXRoaW4gdGhlIGN1cnJlbnQgdmlldyBhbmQgYW55IGxleGljYWwgcGFyZW50cy5cbiAqXG4gKiBWYXJpYWJsZXMgYXJlIGdlbmVyYXRlZCBoZXJlIHVuY29uZGl0aW9uYWxseSwgYW5kIG1heSBvcHRpbWl6ZWQgYXdheSBpbiBmdXR1cmUgb3BlcmF0aW9ucyBpZiBpdFxuICogdHVybnMgb3V0IHRoZWlyIHZhbHVlcyAoYW5kIGFueSBzaWRlIGVmZmVjdHMpIGFyZSB1bnVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZUdlbmVyYXRlVmFyaWFibGVzKGNwbDogQ29tcG9uZW50Q29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgcmVjdXJzaXZlbHlQcm9jZXNzVmlldyhjcGwucm9vdCwgLyogdGhlcmUgaXMgbm8gcGFyZW50IHNjb3BlIGZvciB0aGUgcm9vdCB2aWV3ICovIG51bGwpO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIGdpdmVuIGBWaWV3Q29tcGlsYXRpb25gIGFuZCBnZW5lcmF0ZSBwcmVhbWJsZXMgZm9yIGl0IGFuZCBhbnkgbGlzdGVuZXJzIHRoYXQgaXRcbiAqIGRlY2xhcmVzLlxuICpcbiAqIEBwYXJhbSBgcGFyZW50U2NvcGVgIGEgc2NvcGUgZXh0cmFjdGVkIGZyb20gdGhlIHBhcmVudCB2aWV3IHdoaWNoIGNhcHR1cmVzIGFueSB2YXJpYWJsZXMgd2hpY2hcbiAqICAgICBzaG91bGQgYmUgaW5oZXJpdGVkIGJ5IHRoaXMgdmlldy4gYG51bGxgIGlmIHRoZSBjdXJyZW50IHZpZXcgaXMgdGhlIHJvb3Qgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVjdXJzaXZlbHlQcm9jZXNzVmlldyh2aWV3OiBWaWV3Q29tcGlsYXRpb25Vbml0LCBwYXJlbnRTY29wZTogU2NvcGV8bnVsbCk6IHZvaWQge1xuICAvLyBFeHRyYWN0IGEgYFNjb3BlYCBmcm9tIHRoaXMgdmlldy5cbiAgY29uc3Qgc2NvcGUgPSBnZXRTY29wZUZvclZpZXcodmlldywgcGFyZW50U2NvcGUpO1xuXG4gIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5jcmVhdGUpIHtcbiAgICBzd2l0Y2ggKG9wLmtpbmQpIHtcbiAgICAgIGNhc2UgaXIuT3BLaW5kLlRlbXBsYXRlOlxuICAgICAgICAvLyBEZXNjZW5kIGludG8gY2hpbGQgZW1iZWRkZWQgdmlld3MuXG4gICAgICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1ZpZXcodmlldy5qb2Iudmlld3MuZ2V0KG9wLnhyZWYpISwgc2NvcGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgaXIuT3BLaW5kLkxpc3RlbmVyOlxuICAgICAgICAvLyBQcmVwZW5kIHZhcmlhYmxlcyB0byBsaXN0ZW5lciBoYW5kbGVyIGZ1bmN0aW9ucy5cbiAgICAgICAgb3AuaGFuZGxlck9wcy5wcmVwZW5kKGdlbmVyYXRlVmFyaWFibGVzSW5TY29wZUZvclZpZXcodmlldywgc2NvcGUpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gUHJlcGVuZCB0aGUgZGVjbGFyYXRpb25zIGZvciBhbGwgYXZhaWxhYmxlIHZhcmlhYmxlcyBpbiBzY29wZSB0byB0aGUgYHVwZGF0ZWAgYmxvY2suXG4gIGNvbnN0IHByZWFtYmxlT3BzID0gZ2VuZXJhdGVWYXJpYWJsZXNJblNjb3BlRm9yVmlldyh2aWV3LCBzY29wZSk7XG4gIHZpZXcudXBkYXRlLnByZXBlbmQocHJlYW1ibGVPcHMpO1xufVxuXG4vKipcbiAqIExleGljYWwgc2NvcGUgb2YgYSB2aWV3LCBpbmNsdWRpbmcgYSByZWZlcmVuY2UgdG8gaXRzIHBhcmVudCB2aWV3J3Mgc2NvcGUsIGlmIGFueS5cbiAqL1xuaW50ZXJmYWNlIFNjb3BlIHtcbiAgLyoqXG4gICAqIGBYcmVmSWRgIG9mIHRoZSB2aWV3IHRvIHdoaWNoIHRoaXMgc2NvcGUgY29ycmVzcG9uZHMuXG4gICAqL1xuICB2aWV3OiBpci5YcmVmSWQ7XG5cbiAgdmlld0NvbnRleHRWYXJpYWJsZTogaXIuU2VtYW50aWNWYXJpYWJsZTtcblxuICBjb250ZXh0VmFyaWFibGVzOiBNYXA8c3RyaW5nLCBpci5TZW1hbnRpY1ZhcmlhYmxlPjtcblxuICAvKipcbiAgICogTG9jYWwgcmVmZXJlbmNlcyBjb2xsZWN0ZWQgZnJvbSBlbGVtZW50cyB3aXRoaW4gdGhlIHZpZXcuXG4gICAqL1xuICByZWZlcmVuY2VzOiBSZWZlcmVuY2VbXTtcblxuICAvKipcbiAgICogYFNjb3BlYCBvZiB0aGUgcGFyZW50IHZpZXcsIGlmIGFueS5cbiAgICovXG4gIHBhcmVudDogU2NvcGV8bnVsbDtcbn1cblxuLyoqXG4gKiBJbmZvcm1hdGlvbiBuZWVkZWQgYWJvdXQgYSBsb2NhbCByZWZlcmVuY2UgY29sbGVjdGVkIGZyb20gYW4gZWxlbWVudCB3aXRoaW4gYSB2aWV3LlxuICovXG5pbnRlcmZhY2UgUmVmZXJlbmNlIHtcbiAgLyoqXG4gICAqIE5hbWUgZ2l2ZW4gdG8gdGhlIGxvY2FsIHJlZmVyZW5jZSB2YXJpYWJsZSB3aXRoaW4gdGhlIHRlbXBsYXRlLlxuICAgKlxuICAgKiBUaGlzIGlzIG5vdCB0aGUgbmFtZSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB2YXJpYWJsZSBkZWNsYXJhdGlvbiBpbiB0aGUgZ2VuZXJhdGVkXG4gICAqIHRlbXBsYXRlIGNvZGUuXG4gICAqL1xuICBuYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIGBYcmVmSWRgIG9mIHRoZSBlbGVtZW50LWxpa2Ugbm9kZSB3aGljaCB0aGlzIHJlZmVyZW5jZSB0YXJnZXRzLlxuICAgKlxuICAgKiBUaGUgcmVmZXJlbmNlIG1heSBiZSBlaXRoZXIgdG8gdGhlIGVsZW1lbnQgKG9yIHRlbXBsYXRlKSBpdHNlbGYsIG9yIHRvIGEgZGlyZWN0aXZlIG9uIGl0LlxuICAgKi9cbiAgdGFyZ2V0SWQ6IGlyLlhyZWZJZDtcblxuICAvKipcbiAgICogQSBnZW5lcmF0ZWQgb2Zmc2V0IG9mIHRoaXMgcmVmZXJlbmNlIGFtb25nIGFsbCB0aGUgcmVmZXJlbmNlcyBvbiBhIHNwZWNpZmljIGVsZW1lbnQuXG4gICAqL1xuICBvZmZzZXQ6IG51bWJlcjtcblxuICB2YXJpYWJsZTogaXIuU2VtYW50aWNWYXJpYWJsZTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIGEgdmlldyBhbmQgZ2VuZXJhdGUgYSBgU2NvcGVgIHJlcHJlc2VudGluZyB0aGUgdmFyaWFibGVzIGF2YWlsYWJsZSBmb3IgcmVmZXJlbmNlIHdpdGhpblxuICogdGhhdCB2aWV3LlxuICovXG5mdW5jdGlvbiBnZXRTY29wZUZvclZpZXcodmlldzogVmlld0NvbXBpbGF0aW9uVW5pdCwgcGFyZW50OiBTY29wZXxudWxsKTogU2NvcGUge1xuICBjb25zdCBzY29wZTogU2NvcGUgPSB7XG4gICAgdmlldzogdmlldy54cmVmLFxuICAgIHZpZXdDb250ZXh0VmFyaWFibGU6IHtcbiAgICAgIGtpbmQ6IGlyLlNlbWFudGljVmFyaWFibGVLaW5kLkNvbnRleHQsXG4gICAgICBuYW1lOiBudWxsLFxuICAgICAgdmlldzogdmlldy54cmVmLFxuICAgIH0sXG4gICAgY29udGV4dFZhcmlhYmxlczogbmV3IE1hcDxzdHJpbmcsIGlyLlNlbWFudGljVmFyaWFibGU+KCksXG4gICAgcmVmZXJlbmNlczogW10sXG4gICAgcGFyZW50LFxuICB9O1xuXG4gIGZvciAoY29uc3QgaWRlbnRpZmllciBvZiB2aWV3LmNvbnRleHRWYXJpYWJsZXMua2V5cygpKSB7XG4gICAgc2NvcGUuY29udGV4dFZhcmlhYmxlcy5zZXQoaWRlbnRpZmllciwge1xuICAgICAga2luZDogaXIuU2VtYW50aWNWYXJpYWJsZUtpbmQuSWRlbnRpZmllcixcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICBpZGVudGlmaWVyLFxuICAgIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBvcCBvZiB2aWV3LmNyZWF0ZSkge1xuICAgIHN3aXRjaCAob3Aua2luZCkge1xuICAgICAgY2FzZSBpci5PcEtpbmQuRWxlbWVudDpcbiAgICAgIGNhc2UgaXIuT3BLaW5kLkVsZW1lbnRTdGFydDpcbiAgICAgIGNhc2UgaXIuT3BLaW5kLlRlbXBsYXRlOlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3AubG9jYWxSZWZzKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IGV4cGVjdGVkIGxvY2FsUmVmcyB0byBiZSBhbiBhcnJheWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVjb3JkIGF2YWlsYWJsZSBsb2NhbCByZWZlcmVuY2VzIGZyb20gdGhpcyBlbGVtZW50LlxuICAgICAgICBmb3IgKGxldCBvZmZzZXQgPSAwOyBvZmZzZXQgPCBvcC5sb2NhbFJlZnMubGVuZ3RoOyBvZmZzZXQrKykge1xuICAgICAgICAgIHNjb3BlLnJlZmVyZW5jZXMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiBvcC5sb2NhbFJlZnNbb2Zmc2V0XS5uYW1lLFxuICAgICAgICAgICAgdGFyZ2V0SWQ6IG9wLnhyZWYsXG4gICAgICAgICAgICBvZmZzZXQsXG4gICAgICAgICAgICB2YXJpYWJsZToge1xuICAgICAgICAgICAgICBraW5kOiBpci5TZW1hbnRpY1ZhcmlhYmxlS2luZC5JZGVudGlmaWVyLFxuICAgICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgICBpZGVudGlmaWVyOiBvcC5sb2NhbFJlZnNbb2Zmc2V0XS5uYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc2NvcGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgZGVjbGFyYXRpb25zIGZvciBhbGwgdmFyaWFibGVzIHRoYXQgYXJlIGluIHNjb3BlIGZvciBhIGdpdmVuIHZpZXcuXG4gKlxuICogVGhpcyBpcyBhIHJlY3Vyc2l2ZSBwcm9jZXNzLCBhcyB2aWV3cyBpbmhlcml0IHZhcmlhYmxlcyBhdmFpbGFibGUgZnJvbSB0aGVpciBwYXJlbnQgdmlldywgd2hpY2hcbiAqIGl0c2VsZiBtYXkgaGF2ZSBpbmhlcml0ZWQgdmFyaWFibGVzLCBldGMuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlVmFyaWFibGVzSW5TY29wZUZvclZpZXcoXG4gICAgdmlldzogVmlld0NvbXBpbGF0aW9uVW5pdCwgc2NvcGU6IFNjb3BlKTogaXIuVmFyaWFibGVPcDxpci5VcGRhdGVPcD5bXSB7XG4gIGNvbnN0IG5ld09wczogaXIuVmFyaWFibGVPcDxpci5VcGRhdGVPcD5bXSA9IFtdO1xuXG4gIGlmIChzY29wZS52aWV3ICE9PSB2aWV3LnhyZWYpIHtcbiAgICAvLyBCZWZvcmUgZ2VuZXJhdGluZyB2YXJpYWJsZXMgZm9yIGEgcGFyZW50IHZpZXcsIHdlIG5lZWQgdG8gc3dpdGNoIHRvIHRoZSBjb250ZXh0IG9mIHRoZSBwYXJlbnRcbiAgICAvLyB2aWV3IHdpdGggYSBgbmV4dENvbnRleHRgIGV4cHJlc3Npb24uIFRoaXMgY29udGV4dCBzd2l0Y2hpbmcgb3BlcmF0aW9uIGl0c2VsZiBkZWNsYXJlcyBhXG4gICAgLy8gdmFyaWFibGUsIGJlY2F1c2UgdGhlIGNvbnRleHQgb2YgdGhlIHZpZXcgbWF5IGJlIHJlZmVyZW5jZWQgZGlyZWN0bHkuXG4gICAgbmV3T3BzLnB1c2goaXIuY3JlYXRlVmFyaWFibGVPcChcbiAgICAgICAgdmlldy5qb2IuYWxsb2NhdGVYcmVmSWQoKSwgc2NvcGUudmlld0NvbnRleHRWYXJpYWJsZSwgbmV3IGlyLk5leHRDb250ZXh0RXhwcigpKSk7XG4gIH1cblxuICAvLyBBZGQgdmFyaWFibGVzIGZvciBhbGwgY29udGV4dCB2YXJpYWJsZXMgYXZhaWxhYmxlIGluIHRoaXMgc2NvcGUncyB2aWV3LlxuICBmb3IgKGNvbnN0IFtuYW1lLCB2YWx1ZV0gb2Ygdmlldy5qb2Iudmlld3MuZ2V0KHNjb3BlLnZpZXcpIS5jb250ZXh0VmFyaWFibGVzKSB7XG4gICAgbmV3T3BzLnB1c2goaXIuY3JlYXRlVmFyaWFibGVPcChcbiAgICAgICAgdmlldy5qb2IuYWxsb2NhdGVYcmVmSWQoKSwgc2NvcGUuY29udGV4dFZhcmlhYmxlcy5nZXQobmFtZSkhLFxuICAgICAgICBuZXcgby5SZWFkUHJvcEV4cHIobmV3IGlyLkNvbnRleHRFeHByKHNjb3BlLnZpZXcpLCB2YWx1ZSkpKTtcbiAgfVxuXG4gIC8vIEFkZCB2YXJpYWJsZXMgZm9yIGFsbCBsb2NhbCByZWZlcmVuY2VzIGRlY2xhcmVkIGZvciBlbGVtZW50cyBpbiB0aGlzIHNjb3BlLlxuICBmb3IgKGNvbnN0IHJlZiBvZiBzY29wZS5yZWZlcmVuY2VzKSB7XG4gICAgbmV3T3BzLnB1c2goaXIuY3JlYXRlVmFyaWFibGVPcChcbiAgICAgICAgdmlldy5qb2IuYWxsb2NhdGVYcmVmSWQoKSwgcmVmLnZhcmlhYmxlLCBuZXcgaXIuUmVmZXJlbmNlRXhwcihyZWYudGFyZ2V0SWQsIHJlZi5vZmZzZXQpKSk7XG4gIH1cblxuICBpZiAoc2NvcGUucGFyZW50ICE9PSBudWxsKSB7XG4gICAgLy8gUmVjdXJzaXZlbHkgYWRkIHZhcmlhYmxlcyBmcm9tIHRoZSBwYXJlbnQgc2NvcGUuXG4gICAgbmV3T3BzLnB1c2goLi4uZ2VuZXJhdGVWYXJpYWJsZXNJblNjb3BlRm9yVmlldyh2aWV3LCBzY29wZS5wYXJlbnQpKTtcbiAgfVxuICByZXR1cm4gbmV3T3BzO1xufVxuIl19