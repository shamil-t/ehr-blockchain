/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
export function phaseSaveRestoreView(cpl) {
    for (const view of cpl.views.values()) {
        view.create.prepend([
            ir.createVariableOp(view.job.allocateXrefId(), {
                kind: ir.SemanticVariableKind.SavedView,
                name: null,
                view: view.xref,
            }, new ir.GetCurrentViewExpr()),
        ]);
        for (const op of view.create) {
            if (op.kind !== ir.OpKind.Listener) {
                continue;
            }
            // Embedded views always need the save/restore view operation.
            let needsRestoreView = view !== cpl.root;
            if (!needsRestoreView) {
                for (const handlerOp of op.handlerOps) {
                    ir.visitExpressionsInOp(handlerOp, expr => {
                        if (expr instanceof ir.ReferenceExpr) {
                            // Listeners that reference() a local ref need the save/restore view operation.
                            needsRestoreView = true;
                        }
                    });
                }
            }
            if (needsRestoreView) {
                addSaveRestoreViewOperationToListener(view, op);
            }
        }
    }
}
function addSaveRestoreViewOperationToListener(view, op) {
    op.handlerOps.prepend([
        ir.createVariableOp(view.job.allocateXrefId(), {
            kind: ir.SemanticVariableKind.Context,
            name: null,
            view: view.xref,
        }, new ir.RestoreViewExpr(view.xref)),
    ]);
    // The "restore view" operation in listeners requires a call to `resetView` to reset the
    // context prior to returning from the listener operation. Find any `return` statements in
    // the listener body and wrap them in a call to reset the view.
    for (const handlerOp of op.handlerOps) {
        if (handlerOp.kind === ir.OpKind.Statement &&
            handlerOp.statement instanceof o.ReturnStatement) {
            handlerOp.statement.value = new ir.ResetViewExpr(handlerOp.statement.value);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZV9yZXN0b3JlX3ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9zYXZlX3Jlc3RvcmVfdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLCtCQUErQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9CLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxHQUE0QjtJQUMvRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDbEIsRUFBRSxDQUFDLGdCQUFnQixDQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLEVBQUU7Z0JBQ3pCLElBQUksRUFBRSxFQUFFLENBQUMsb0JBQW9CLENBQUMsU0FBUztnQkFDdkMsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2FBQ2hCLEVBQ0QsSUFBSSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztTQUNqQyxDQUFDLENBQUM7UUFFSCxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2dCQUNsQyxTQUFTO2FBQ1Y7WUFFRCw4REFBOEQ7WUFDOUQsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQztZQUV6QyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3JCLEtBQUssTUFBTSxTQUFTLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRTtvQkFDckMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRTt3QkFDeEMsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDLGFBQWEsRUFBRTs0QkFDcEMsK0VBQStFOzRCQUMvRSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7eUJBQ3pCO29CQUNILENBQUMsQ0FBQyxDQUFDO2lCQUNKO2FBQ0Y7WUFFRCxJQUFJLGdCQUFnQixFQUFFO2dCQUNwQixxQ0FBcUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDakQ7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMscUNBQXFDLENBQUMsSUFBeUIsRUFBRSxFQUFpQjtJQUN6RixFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztRQUNwQixFQUFFLENBQUMsZ0JBQWdCLENBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsRUFBRTtZQUN6QixJQUFJLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixDQUFDLE9BQU87WUFDckMsSUFBSSxFQUFFLElBQUk7WUFDVixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZDLENBQUMsQ0FBQztJQUVILHdGQUF3RjtJQUN4RiwwRkFBMEY7SUFDMUYsK0RBQStEO0lBQy9ELEtBQUssTUFBTSxTQUFTLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUNyQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTO1lBQ3RDLFNBQVMsQ0FBQyxTQUFTLFlBQVksQ0FBQyxDQUFDLGVBQWUsRUFBRTtZQUNwRCxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM3RTtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB0eXBlIHtDb21wb25lbnRDb21waWxhdGlvbkpvYiwgVmlld0NvbXBpbGF0aW9uVW5pdH0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VTYXZlUmVzdG9yZVZpZXcoY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHZpZXcgb2YgY3BsLnZpZXdzLnZhbHVlcygpKSB7XG4gICAgdmlldy5jcmVhdGUucHJlcGVuZChbXG4gICAgICBpci5jcmVhdGVWYXJpYWJsZU9wPGlyLkNyZWF0ZU9wPihcbiAgICAgICAgICB2aWV3LmpvYi5hbGxvY2F0ZVhyZWZJZCgpLCB7XG4gICAgICAgICAgICBraW5kOiBpci5TZW1hbnRpY1ZhcmlhYmxlS2luZC5TYXZlZFZpZXcsXG4gICAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgICAgdmlldzogdmlldy54cmVmLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbmV3IGlyLkdldEN1cnJlbnRWaWV3RXhwcigpKSxcbiAgICBdKTtcblxuICAgIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5jcmVhdGUpIHtcbiAgICAgIGlmIChvcC5raW5kICE9PSBpci5PcEtpbmQuTGlzdGVuZXIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEVtYmVkZGVkIHZpZXdzIGFsd2F5cyBuZWVkIHRoZSBzYXZlL3Jlc3RvcmUgdmlldyBvcGVyYXRpb24uXG4gICAgICBsZXQgbmVlZHNSZXN0b3JlVmlldyA9IHZpZXcgIT09IGNwbC5yb290O1xuXG4gICAgICBpZiAoIW5lZWRzUmVzdG9yZVZpZXcpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyT3Agb2Ygb3AuaGFuZGxlck9wcykge1xuICAgICAgICAgIGlyLnZpc2l0RXhwcmVzc2lvbnNJbk9wKGhhbmRsZXJPcCwgZXhwciA9PiB7XG4gICAgICAgICAgICBpZiAoZXhwciBpbnN0YW5jZW9mIGlyLlJlZmVyZW5jZUV4cHIpIHtcbiAgICAgICAgICAgICAgLy8gTGlzdGVuZXJzIHRoYXQgcmVmZXJlbmNlKCkgYSBsb2NhbCByZWYgbmVlZCB0aGUgc2F2ZS9yZXN0b3JlIHZpZXcgb3BlcmF0aW9uLlxuICAgICAgICAgICAgICBuZWVkc1Jlc3RvcmVWaWV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobmVlZHNSZXN0b3JlVmlldykge1xuICAgICAgICBhZGRTYXZlUmVzdG9yZVZpZXdPcGVyYXRpb25Ub0xpc3RlbmVyKHZpZXcsIG9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkU2F2ZVJlc3RvcmVWaWV3T3BlcmF0aW9uVG9MaXN0ZW5lcih2aWV3OiBWaWV3Q29tcGlsYXRpb25Vbml0LCBvcDogaXIuTGlzdGVuZXJPcCkge1xuICBvcC5oYW5kbGVyT3BzLnByZXBlbmQoW1xuICAgIGlyLmNyZWF0ZVZhcmlhYmxlT3A8aXIuVXBkYXRlT3A+KFxuICAgICAgICB2aWV3LmpvYi5hbGxvY2F0ZVhyZWZJZCgpLCB7XG4gICAgICAgICAga2luZDogaXIuU2VtYW50aWNWYXJpYWJsZUtpbmQuQ29udGV4dCxcbiAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgIHZpZXc6IHZpZXcueHJlZixcbiAgICAgICAgfSxcbiAgICAgICAgbmV3IGlyLlJlc3RvcmVWaWV3RXhwcih2aWV3LnhyZWYpKSxcbiAgXSk7XG5cbiAgLy8gVGhlIFwicmVzdG9yZSB2aWV3XCIgb3BlcmF0aW9uIGluIGxpc3RlbmVycyByZXF1aXJlcyBhIGNhbGwgdG8gYHJlc2V0Vmlld2AgdG8gcmVzZXQgdGhlXG4gIC8vIGNvbnRleHQgcHJpb3IgdG8gcmV0dXJuaW5nIGZyb20gdGhlIGxpc3RlbmVyIG9wZXJhdGlvbi4gRmluZCBhbnkgYHJldHVybmAgc3RhdGVtZW50cyBpblxuICAvLyB0aGUgbGlzdGVuZXIgYm9keSBhbmQgd3JhcCB0aGVtIGluIGEgY2FsbCB0byByZXNldCB0aGUgdmlldy5cbiAgZm9yIChjb25zdCBoYW5kbGVyT3Agb2Ygb3AuaGFuZGxlck9wcykge1xuICAgIGlmIChoYW5kbGVyT3Aua2luZCA9PT0gaXIuT3BLaW5kLlN0YXRlbWVudCAmJlxuICAgICAgICBoYW5kbGVyT3Auc3RhdGVtZW50IGluc3RhbmNlb2Ygby5SZXR1cm5TdGF0ZW1lbnQpIHtcbiAgICAgIGhhbmRsZXJPcC5zdGF0ZW1lbnQudmFsdWUgPSBuZXcgaXIuUmVzZXRWaWV3RXhwcihoYW5kbGVyT3Auc3RhdGVtZW50LnZhbHVlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==