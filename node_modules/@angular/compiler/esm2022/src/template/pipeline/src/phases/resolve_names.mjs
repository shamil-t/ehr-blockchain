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
 * Resolves lexical references in views (`ir.LexicalReadExpr`) to either a target variable or to
 * property reads on the top-level component context.
 *
 * Also matches `ir.RestoreViewExpr` expressions with the variables of their corresponding saved
 * views.
 */
export function phaseResolveNames(cpl) {
    for (const unit of cpl.units) {
        processLexicalScope(unit, unit.create, null);
        processLexicalScope(unit, unit.update, null);
    }
}
function processLexicalScope(unit, ops, savedView) {
    // Maps names defined in the lexical scope of this template to the `ir.XrefId`s of the variable
    // declarations which represent those values.
    //
    // Since variables are generated in each view for the entire lexical scope (including any
    // identifiers from parent templates) only local variables need be considered here.
    const scope = new Map();
    // First, step through the operations list and:
    // 1) build up the `scope` mapping
    // 2) recurse into any listener functions
    for (const op of ops) {
        switch (op.kind) {
            case ir.OpKind.Variable:
                switch (op.variable.kind) {
                    case ir.SemanticVariableKind.Identifier:
                        // This variable represents some kind of identifier which can be used in the template.
                        if (scope.has(op.variable.identifier)) {
                            continue;
                        }
                        scope.set(op.variable.identifier, op.xref);
                        break;
                    case ir.SemanticVariableKind.SavedView:
                        // This variable represents a snapshot of the current view context, and can be used to
                        // restore that context within listener functions.
                        savedView = {
                            view: op.variable.view,
                            variable: op.xref,
                        };
                        break;
                }
                break;
            case ir.OpKind.Listener:
                // Listener functions have separate variable declarations, so process them as a separate
                // lexical scope.
                processLexicalScope(unit, op.handlerOps, savedView);
                break;
        }
    }
    // Next, use the `scope` mapping to match `ir.LexicalReadExpr` with defined names in the lexical
    // scope. Also, look for `ir.RestoreViewExpr`s and match them with the snapshotted view context
    // variable.
    for (const op of ops) {
        if (op.kind == ir.OpKind.Listener) {
            // Listeners were already processed above with their own scopes.
            continue;
        }
        ir.transformExpressionsInOp(op, (expr, flags) => {
            if (expr instanceof ir.LexicalReadExpr) {
                // `expr` is a read of a name within the lexical scope of this view.
                // Either that name is defined within the current view, or it represents a property from the
                // main component context.
                if (scope.has(expr.name)) {
                    // This was a defined variable in the current scope.
                    return new ir.ReadVariableExpr(scope.get(expr.name));
                }
                else {
                    // Reading from the component context.
                    return new o.ReadPropExpr(new ir.ContextExpr(unit.job.root.xref), expr.name);
                }
            }
            else if (expr instanceof ir.RestoreViewExpr && typeof expr.view === 'number') {
                // `ir.RestoreViewExpr` happens in listener functions and restores a saved view from the
                // parent creation list. We expect to find that we captured the `savedView` previously, and
                // that it matches the expected view to be restored.
                if (savedView === null || savedView.view !== expr.view) {
                    throw new Error(`AssertionError: no saved view ${expr.view} from view ${unit.xref}`);
                }
                expr.view = new ir.ReadVariableExpr(savedView.variable);
                return expr;
            }
            else {
                return expr;
            }
        }, ir.VisitorContextFlag.None);
    }
    for (const op of ops) {
        ir.visitExpressionsInOp(op, expr => {
            if (expr instanceof ir.LexicalReadExpr) {
                throw new Error(`AssertionError: no lexical reads should remain, but found read of ${expr.name}`);
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZV9uYW1lcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL3Jlc29sdmVfbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUcvQjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsR0FBbUI7SUFDbkQsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO1FBQzVCLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdDLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlDO0FBQ0gsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQ3hCLElBQXFCLEVBQUUsR0FBa0QsRUFDekUsU0FBeUI7SUFDM0IsK0ZBQStGO0lBQy9GLDZDQUE2QztJQUM3QyxFQUFFO0lBQ0YseUZBQXlGO0lBQ3pGLG1GQUFtRjtJQUNuRixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztJQUUzQywrQ0FBK0M7SUFDL0Msa0NBQWtDO0lBQ2xDLHlDQUF5QztJQUN6QyxLQUFLLE1BQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUNwQixRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDZixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUTtnQkFDckIsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtvQkFDeEIsS0FBSyxFQUFFLENBQUMsb0JBQW9CLENBQUMsVUFBVTt3QkFDckMs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Q1gscUVBQXFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICcuLi8uLi8uLi8uLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi8uLi9pcic7XG5pbXBvcnQge0NvbXBpbGF0aW9uSm9iLCBDb21waWxhdGlvblVuaXQsIFZpZXdDb21waWxhdGlvblVuaXR9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuLyoqXG4gKiBSZXNvbHZlcyBsZXhpY2FsIHJlZmVyZW5jZXMgaW4gdmlld3MgKGBpci5MZXhpY2FsUmVhZEV4cHJgKSB0byBlaXRoZXIgYSB0YXJnZXQgdmFyaWFibGUgb3IgdG9cbiAqIHByb3BlcnR5IHJlYWRzIG9uIHRoZSB0b3AtbGV2ZWwgY29tcG9uZW50IGNvbnRleHQuXG4gKlxuICogQWxzbyBtYXRjaGVzIGBpci5SZXN0b3JlVmlld0V4cHJgIGV4cHJlc3Npb25zIHdpdGggdGhlIHZhcmlhYmxlcyBvZiB0aGVpciBjb3JyZXNwb25kaW5nIHNhdmVkXG4gKiB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlUmVzb2x2ZU5hbWVzKGNwbDogQ29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB1bml0IG9mIGNwbC51bml0cykge1xuICAgIHByb2Nlc3NMZXhpY2FsU2NvcGUodW5pdCwgdW5pdC5jcmVhdGUsIG51bGwpO1xuICAgIHByb2Nlc3NMZXhpY2FsU2NvcGUodW5pdCwgdW5pdC51cGRhdGUsIG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NMZXhpY2FsU2NvcGUoXG4gICAgdW5pdDogQ29tcGlsYXRpb25Vbml0LCBvcHM6IGlyLk9wTGlzdDxpci5DcmVhdGVPcD58aXIuT3BMaXN0PGlyLlVwZGF0ZU9wPixcbiAgICBzYXZlZFZpZXc6IFNhdmVkVmlld3xudWxsKTogdm9pZCB7XG4gIC8vIE1hcHMgbmFtZXMgZGVmaW5lZCBpbiB0aGUgbGV4aWNhbCBzY29wZSBvZiB0aGlzIHRlbXBsYXRlIHRvIHRoZSBgaXIuWHJlZklkYHMgb2YgdGhlIHZhcmlhYmxlXG4gIC8vIGRlY2xhcmF0aW9ucyB3aGljaCByZXByZXNlbnQgdGhvc2UgdmFsdWVzLlxuICAvL1xuICAvLyBTaW5jZSB2YXJpYWJsZXMgYXJlIGdlbmVyYXRlZCBpbiBlYWNoIHZpZXcgZm9yIHRoZSBlbnRpcmUgbGV4aWNhbCBzY29wZSAoaW5jbHVkaW5nIGFueVxuICAvLyBpZGVudGlmaWVycyBmcm9tIHBhcmVudCB0ZW1wbGF0ZXMpIG9ubHkgbG9jYWwgdmFyaWFibGVzIG5lZWQgYmUgY29uc2lkZXJlZCBoZXJlLlxuICBjb25zdCBzY29wZSA9IG5ldyBNYXA8c3RyaW5nLCBpci5YcmVmSWQ+KCk7XG5cbiAgLy8gRmlyc3QsIHN0ZXAgdGhyb3VnaCB0aGUgb3BlcmF0aW9ucyBsaXN0IGFuZDpcbiAgLy8gMSkgYnVpbGQgdXAgdGhlIGBzY29wZWAgbWFwcGluZ1xuICAvLyAyKSByZWN1cnNlIGludG8gYW55IGxpc3RlbmVyIGZ1bmN0aW9uc1xuICBmb3IgKGNvbnN0IG9wIG9mIG9wcykge1xuICAgIHN3aXRjaCAob3Aua2luZCkge1xuICAgICAgY2FzZSBpci5PcEtpbmQuVmFyaWFibGU6XG4gICAgICAgIHN3aXRjaCAob3AudmFyaWFibGUua2luZCkge1xuICAgICAgICAgIGNhc2UgaXIuU2VtYW50aWNWYXJpYWJsZUtpbmQuSWRlbnRpZmllcjpcbiAgICAgICAgICAgIC8vIFRoaXMgdmFyaWFibGUgcmVwcmVzZW50cyBzb21lIGtpbmQgb2YgaWRlbnRpZmllciB3aGljaCBjYW4gYmUgdXNlZCBpbiB0aGUgdGVtcGxhdGUuXG4gICAgICAgICAgICBpZiAoc2NvcGUuaGFzKG9wLnZhcmlhYmxlLmlkZW50aWZpZXIpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NvcGUuc2V0KG9wLnZhcmlhYmxlLmlkZW50aWZpZXIsIG9wLnhyZWYpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBpci5TZW1hbnRpY1ZhcmlhYmxlS2luZC5TYXZlZFZpZXc6XG4gICAgICAgICAgICAvLyBUaGlzIHZhcmlhYmxlIHJlcHJlc2VudHMgYSBzbmFwc2hvdCBvZiB0aGUgY3VycmVudCB2aWV3IGNvbnRleHQsIGFuZCBjYW4gYmUgdXNlZCB0b1xuICAgICAgICAgICAgLy8gcmVzdG9yZSB0aGF0IGNvbnRleHQgd2l0aGluIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgICAgICAgIHNhdmVkVmlldyA9IHtcbiAgICAgICAgICAgICAgdmlldzogb3AudmFyaWFibGUudmlldyxcbiAgICAgICAgICAgICAgdmFyaWFibGU6IG9wLnhyZWYsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGlyLk9wS2luZC5MaXN0ZW5lcjpcbiAgICAgICAgLy8gTGlzdGVuZXIgZnVuY3Rpb25zIGhhdmUgc2VwYXJhdGUgdmFyaWFibGUgZGVjbGFyYXRpb25zLCBzbyBwcm9jZXNzIHRoZW0gYXMgYSBzZXBhcmF0ZVxuICAgICAgICAvLyBsZXhpY2FsIHNjb3BlLlxuICAgICAgICBwcm9jZXNzTGV4aWNhbFNjb3BlKHVuaXQsIG9wLmhhbmRsZXJPcHMsIHNhdmVkVmlldyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5leHQsIHVzZSB0aGUgYHNjb3BlYCBtYXBwaW5nIHRvIG1hdGNoIGBpci5MZXhpY2FsUmVhZEV4cHJgIHdpdGggZGVmaW5lZCBuYW1lcyBpbiB0aGUgbGV4aWNhbFxuICAvLyBzY29wZS4gQWxzbywgbG9vayBmb3IgYGlyLlJlc3RvcmVWaWV3RXhwcmBzIGFuZCBtYXRjaCB0aGVtIHdpdGggdGhlIHNuYXBzaG90dGVkIHZpZXcgY29udGV4dFxuICAvLyB2YXJpYWJsZS5cbiAgZm9yIChjb25zdCBvcCBvZiBvcHMpIHtcbiAgICBpZiAob3Aua2luZCA9PSBpci5PcEtpbmQuTGlzdGVuZXIpIHtcbiAgICAgIC8vIExpc3RlbmVycyB3ZXJlIGFscmVhZHkgcHJvY2Vzc2VkIGFib3ZlIHdpdGggdGhlaXIgb3duIHNjb3Blcy5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpci50cmFuc2Zvcm1FeHByZXNzaW9uc0luT3Aob3AsIChleHByLCBmbGFncykgPT4ge1xuICAgICAgaWYgKGV4cHIgaW5zdGFuY2VvZiBpci5MZXhpY2FsUmVhZEV4cHIpIHtcbiAgICAgICAgLy8gYGV4cHJgIGlzIGEgcmVhZCBvZiBhIG5hbWUgd2l0aGluIHRoZSBsZXhpY2FsIHNjb3BlIG9mIHRoaXMgdmlldy5cbiAgICAgICAgLy8gRWl0aGVyIHRoYXQgbmFtZSBpcyBkZWZpbmVkIHdpdGhpbiB0aGUgY3VycmVudCB2aWV3LCBvciBpdCByZXByZXNlbnRzIGEgcHJvcGVydHkgZnJvbSB0aGVcbiAgICAgICAgLy8gbWFpbiBjb21wb25lbnQgY29udGV4dC5cbiAgICAgICAgaWYgKHNjb3BlLmhhcyhleHByLm5hbWUpKSB7XG4gICAgICAgICAgLy8gVGhpcyB3YXMgYSBkZWZpbmVkIHZhcmlhYmxlIGluIHRoZSBjdXJyZW50IHNjb3BlLlxuICAgICAgICAgIHJldHVybiBuZXcgaXIuUmVhZFZhcmlhYmxlRXhwcihzY29wZS5nZXQoZXhwci5uYW1lKSEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFJlYWRpbmcgZnJvbSB0aGUgY29tcG9uZW50IGNvbnRleHQuXG4gICAgICAgICAgcmV0dXJuIG5ldyBvLlJlYWRQcm9wRXhwcihuZXcgaXIuQ29udGV4dEV4cHIodW5pdC5qb2Iucm9vdC54cmVmKSwgZXhwci5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChleHByIGluc3RhbmNlb2YgaXIuUmVzdG9yZVZpZXdFeHByICYmIHR5cGVvZiBleHByLnZpZXcgPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIGBpci5SZXN0b3JlVmlld0V4cHJgIGhhcHBlbnMgaW4gbGlzdGVuZXIgZnVuY3Rpb25zIGFuZCByZXN0b3JlcyBhIHNhdmVkIHZpZXcgZnJvbSB0aGVcbiAgICAgICAgLy8gcGFyZW50IGNyZWF0aW9uIGxpc3QuIFdlIGV4cGVjdCB0byBmaW5kIHRoYXQgd2UgY2FwdHVyZWQgdGhlIGBzYXZlZFZpZXdgIHByZXZpb3VzbHksIGFuZFxuICAgICAgICAvLyB0aGF0IGl0IG1hdGNoZXMgdGhlIGV4cGVjdGVkIHZpZXcgdG8gYmUgcmVzdG9yZWQuXG4gICAgICAgIGlmIChzYXZlZFZpZXcgPT09IG51bGwgfHwgc2F2ZWRWaWV3LnZpZXcgIT09IGV4cHIudmlldykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IG5vIHNhdmVkIHZpZXcgJHtleHByLnZpZXd9IGZyb20gdmlldyAke3VuaXQueHJlZn1gKTtcbiAgICAgICAgfVxuICAgICAgICBleHByLnZpZXcgPSBuZXcgaXIuUmVhZFZhcmlhYmxlRXhwcihzYXZlZFZpZXcudmFyaWFibGUpO1xuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBleHByO1xuICAgICAgfVxuICAgIH0sIGlyLlZpc2l0b3JDb250ZXh0RmxhZy5Ob25lKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgaXIudmlzaXRFeHByZXNzaW9uc0luT3Aob3AsIGV4cHIgPT4ge1xuICAgICAgaWYgKGV4cHIgaW5zdGFuY2VvZiBpci5MZXhpY2FsUmVhZEV4cHIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEFzc2VydGlvbkVycm9yOiBubyBsZXhpY2FsIHJlYWRzIHNob3VsZCByZW1haW4sIGJ1dCBmb3VuZCByZWFkIG9mICR7ZXhwci5uYW1lfWApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSW5mb3JtYXRpb24gYWJvdXQgYSBgU2F2ZWRWaWV3YCB2YXJpYWJsZS5cbiAqL1xuaW50ZXJmYWNlIFNhdmVkVmlldyB7XG4gIC8qKlxuICAgKiBUaGUgdmlldyBgaXIuWHJlZklkYCB3aGljaCB3YXMgc2F2ZWQgaW50byB0aGlzIHZhcmlhYmxlLlxuICAgKi9cbiAgdmlldzogaXIuWHJlZklkO1xuXG4gIC8qKlxuICAgKiBUaGUgYGlyLlhyZWZJZGAgb2YgdGhlIHZhcmlhYmxlIGludG8gd2hpY2ggdGhlIHZpZXcgd2FzIHNhdmVkLlxuICAgKi9cbiAgdmFyaWFibGU6IGlyLlhyZWZJZDtcbn1cbiJdfQ==