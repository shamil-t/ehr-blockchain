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
 * Merges logically sequential `NextContextExpr` operations.
 *
 * `NextContextExpr` can be referenced repeatedly, "popping" the runtime's context stack each time.
 * When two such expressions appear back-to-back, it's possible to merge them together into a single
 * `NextContextExpr` that steps multiple contexts. This merging is possible if all conditions are
 * met:
 *
 *   * The result of the `NextContextExpr` that's folded into the subsequent one is not stored (that
 *     is, the call is purely side-effectful).
 *   * No operations in between them uses the implicit context.
 */
export function phaseMergeNextContext(cpl) {
    for (const view of cpl.views.values()) {
        for (const op of view.create) {
            if (op.kind === ir.OpKind.Listener) {
                mergeNextContextsInOps(op.handlerOps);
            }
        }
        mergeNextContextsInOps(view.update);
    }
}
function mergeNextContextsInOps(ops) {
    for (const op of ops) {
        // Look for a candidate operation to maybe merge.
        if (op.kind !== ir.OpKind.Statement || !(op.statement instanceof o.ExpressionStatement) ||
            !(op.statement.expr instanceof ir.NextContextExpr)) {
            continue;
        }
        const mergeSteps = op.statement.expr.steps;
        // Try to merge this `ir.NextContextExpr`.
        let tryToMerge = true;
        for (let candidate = op.next; candidate.kind !== ir.OpKind.ListEnd && tryToMerge; candidate = candidate.next) {
            ir.visitExpressionsInOp(candidate, (expr, flags) => {
                if (!ir.isIrExpression(expr)) {
                    return expr;
                }
                if (!tryToMerge) {
                    // Either we've already merged, or failed to merge.
                    return;
                }
                if (flags & ir.VisitorContextFlag.InChildOperation) {
                    // We cannot merge into child operations.
                    return;
                }
                switch (expr.kind) {
                    case ir.ExpressionKind.NextContext:
                        // Merge the previous `ir.NextContextExpr` into this one.
                        expr.steps += mergeSteps;
                        ir.OpList.remove(op);
                        tryToMerge = false;
                        break;
                    case ir.ExpressionKind.GetCurrentView:
                    case ir.ExpressionKind.Reference:
                        // Can't merge past a dependency on the context.
                        tryToMerge = false;
                        break;
                }
            });
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV4dF9jb250ZXh0X21lcmdpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9uZXh0X2NvbnRleHRfbWVyZ2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLCtCQUErQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBSS9COzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEdBQTRCO0lBQ2hFLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNyQyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2dCQUNsQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdkM7U0FDRjtRQUNELHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLEdBQTJCO0lBQ3pELEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxFQUFFO1FBQ3BCLGlEQUFpRDtRQUNqRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLFlBQVksQ0FBQyxDQUFDLG1CQUFtQixDQUFDO1lBQ25GLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDdEQsU0FBUztTQUNWO1FBRUQsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRTNDLDBDQUEwQztRQUMxQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdEIsS0FBSyxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksVUFBVSxFQUM1RSxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUssRUFBRTtZQUNoQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqRCxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDNUIsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDZixtREFBbUQ7b0JBQ25ELE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFO29CQUNsRCx5Q0FBeUM7b0JBQ3pDLE9BQU87aUJBQ1I7Z0JBRUQsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNqQixLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsV0FBVzt3QkFDaEMseURBQXlEO3dCQUN6RCxJQUFJLENBQUMsS0FBSyxJQUFJLFVBQVUsQ0FBQzt3QkFDekIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBaUIsQ0FBQyxDQUFDO3dCQUNwQyxVQUFVLEdBQUcsS0FBSyxDQUFDO3dCQUNuQixNQUFNO29CQUNSLEtBQUssRUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7b0JBQ3RDLEtBQUssRUFBRSxDQUFDLGNBQWMsQ0FBQyxTQUFTO3dCQUM5QixnREFBZ0Q7d0JBQ2hELFVBQVUsR0FBRyxLQUFLLENBQUM7d0JBQ25CLE1BQU07aUJBQ1Q7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuXG5pbXBvcnQgdHlwZSB7Q29tcG9uZW50Q29tcGlsYXRpb25Kb2J9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuLyoqXG4gKiBNZXJnZXMgbG9naWNhbGx5IHNlcXVlbnRpYWwgYE5leHRDb250ZXh0RXhwcmAgb3BlcmF0aW9ucy5cbiAqXG4gKiBgTmV4dENvbnRleHRFeHByYCBjYW4gYmUgcmVmZXJlbmNlZCByZXBlYXRlZGx5LCBcInBvcHBpbmdcIiB0aGUgcnVudGltZSdzIGNvbnRleHQgc3RhY2sgZWFjaCB0aW1lLlxuICogV2hlbiB0d28gc3VjaCBleHByZXNzaW9ucyBhcHBlYXIgYmFjay10by1iYWNrLCBpdCdzIHBvc3NpYmxlIHRvIG1lcmdlIHRoZW0gdG9nZXRoZXIgaW50byBhIHNpbmdsZVxuICogYE5leHRDb250ZXh0RXhwcmAgdGhhdCBzdGVwcyBtdWx0aXBsZSBjb250ZXh0cy4gVGhpcyBtZXJnaW5nIGlzIHBvc3NpYmxlIGlmIGFsbCBjb25kaXRpb25zIGFyZVxuICogbWV0OlxuICpcbiAqICAgKiBUaGUgcmVzdWx0IG9mIHRoZSBgTmV4dENvbnRleHRFeHByYCB0aGF0J3MgZm9sZGVkIGludG8gdGhlIHN1YnNlcXVlbnQgb25lIGlzIG5vdCBzdG9yZWQgKHRoYXRcbiAqICAgICBpcywgdGhlIGNhbGwgaXMgcHVyZWx5IHNpZGUtZWZmZWN0ZnVsKS5cbiAqICAgKiBObyBvcGVyYXRpb25zIGluIGJldHdlZW4gdGhlbSB1c2VzIHRoZSBpbXBsaWNpdCBjb250ZXh0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VNZXJnZU5leHRDb250ZXh0KGNwbDogQ29tcG9uZW50Q29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB2aWV3IG9mIGNwbC52aWV3cy52YWx1ZXMoKSkge1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5jcmVhdGUpIHtcbiAgICAgIGlmIChvcC5raW5kID09PSBpci5PcEtpbmQuTGlzdGVuZXIpIHtcbiAgICAgICAgbWVyZ2VOZXh0Q29udGV4dHNJbk9wcyhvcC5oYW5kbGVyT3BzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWVyZ2VOZXh0Q29udGV4dHNJbk9wcyh2aWV3LnVwZGF0ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VOZXh0Q29udGV4dHNJbk9wcyhvcHM6IGlyLk9wTGlzdDxpci5VcGRhdGVPcD4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBvcCBvZiBvcHMpIHtcbiAgICAvLyBMb29rIGZvciBhIGNhbmRpZGF0ZSBvcGVyYXRpb24gdG8gbWF5YmUgbWVyZ2UuXG4gICAgaWYgKG9wLmtpbmQgIT09IGlyLk9wS2luZC5TdGF0ZW1lbnQgfHwgIShvcC5zdGF0ZW1lbnQgaW5zdGFuY2VvZiBvLkV4cHJlc3Npb25TdGF0ZW1lbnQpIHx8XG4gICAgICAgICEob3Auc3RhdGVtZW50LmV4cHIgaW5zdGFuY2VvZiBpci5OZXh0Q29udGV4dEV4cHIpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXJnZVN0ZXBzID0gb3Auc3RhdGVtZW50LmV4cHIuc3RlcHM7XG5cbiAgICAvLyBUcnkgdG8gbWVyZ2UgdGhpcyBgaXIuTmV4dENvbnRleHRFeHByYC5cbiAgICBsZXQgdHJ5VG9NZXJnZSA9IHRydWU7XG4gICAgZm9yIChsZXQgY2FuZGlkYXRlID0gb3AubmV4dCE7IGNhbmRpZGF0ZS5raW5kICE9PSBpci5PcEtpbmQuTGlzdEVuZCAmJiB0cnlUb01lcmdlO1xuICAgICAgICAgY2FuZGlkYXRlID0gY2FuZGlkYXRlLm5leHQhKSB7XG4gICAgICBpci52aXNpdEV4cHJlc3Npb25zSW5PcChjYW5kaWRhdGUsIChleHByLCBmbGFncykgPT4ge1xuICAgICAgICBpZiAoIWlyLmlzSXJFeHByZXNzaW9uKGV4cHIpKSB7XG4gICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRyeVRvTWVyZ2UpIHtcbiAgICAgICAgICAvLyBFaXRoZXIgd2UndmUgYWxyZWFkeSBtZXJnZWQsIG9yIGZhaWxlZCB0byBtZXJnZS5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmxhZ3MgJiBpci5WaXNpdG9yQ29udGV4dEZsYWcuSW5DaGlsZE9wZXJhdGlvbikge1xuICAgICAgICAgIC8vIFdlIGNhbm5vdCBtZXJnZSBpbnRvIGNoaWxkIG9wZXJhdGlvbnMuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChleHByLmtpbmQpIHtcbiAgICAgICAgICBjYXNlIGlyLkV4cHJlc3Npb25LaW5kLk5leHRDb250ZXh0OlxuICAgICAgICAgICAgLy8gTWVyZ2UgdGhlIHByZXZpb3VzIGBpci5OZXh0Q29udGV4dEV4cHJgIGludG8gdGhpcyBvbmUuXG4gICAgICAgICAgICBleHByLnN0ZXBzICs9IG1lcmdlU3RlcHM7XG4gICAgICAgICAgICBpci5PcExpc3QucmVtb3ZlKG9wIGFzIGlyLlVwZGF0ZU9wKTtcbiAgICAgICAgICAgIHRyeVRvTWVyZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgaXIuRXhwcmVzc2lvbktpbmQuR2V0Q3VycmVudFZpZXc6XG4gICAgICAgICAgY2FzZSBpci5FeHByZXNzaW9uS2luZC5SZWZlcmVuY2U6XG4gICAgICAgICAgICAvLyBDYW4ndCBtZXJnZSBwYXN0IGEgZGVwZW5kZW5jeSBvbiB0aGUgY29udGV4dC5cbiAgICAgICAgICAgIHRyeVRvTWVyZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==