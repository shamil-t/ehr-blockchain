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
 * Any variable inside a listener with the name `$event` will be transformed into a output lexical
 * read immediately, and does not participate in any of the normal logic for handling variables.
 */
export function phaseResolveDollarEvent(cpl) {
    for (const [_, view] of cpl.views) {
        resolveDollarEvent(view, view.create);
        resolveDollarEvent(view, view.update);
    }
}
function resolveDollarEvent(view, ops) {
    for (const op of ops) {
        if (op.kind === ir.OpKind.Listener) {
            ir.transformExpressionsInOp(op, (expr) => {
                if (expr instanceof ir.LexicalReadExpr && expr.name === '$event') {
                    op.consumesDollarEvent = true;
                    return new o.ReadVarExpr(expr.name);
                }
                return expr;
            }, ir.VisitorContextFlag.InChildOperation);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZV9kb2xsYXJfZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9yZXNvbHZlX2RvbGxhcl9ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLCtCQUErQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9COzs7R0FHRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxHQUE0QjtJQUNsRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkM7QUFDSCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsSUFBeUIsRUFBRSxHQUFrRDtJQUMvRSxLQUFLLE1BQU0sRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUNwQixJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDbEMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN2QyxJQUFJLElBQUksWUFBWSxFQUFFLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO29CQUNoRSxFQUFFLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO29CQUM5QixPQUFPLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3JDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQzVDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHR5cGUge0NvbXBvbmVudENvbXBpbGF0aW9uSm9iLCBWaWV3Q29tcGlsYXRpb25Vbml0fSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbi8qKlxuICogQW55IHZhcmlhYmxlIGluc2lkZSBhIGxpc3RlbmVyIHdpdGggdGhlIG5hbWUgYCRldmVudGAgd2lsbCBiZSB0cmFuc2Zvcm1lZCBpbnRvIGEgb3V0cHV0IGxleGljYWxcbiAqIHJlYWQgaW1tZWRpYXRlbHksIGFuZCBkb2VzIG5vdCBwYXJ0aWNpcGF0ZSBpbiBhbnkgb2YgdGhlIG5vcm1hbCBsb2dpYyBmb3IgaGFuZGxpbmcgdmFyaWFibGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VSZXNvbHZlRG9sbGFyRXZlbnQoY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IFtfLCB2aWV3XSBvZiBjcGwudmlld3MpIHtcbiAgICByZXNvbHZlRG9sbGFyRXZlbnQodmlldywgdmlldy5jcmVhdGUpO1xuICAgIHJlc29sdmVEb2xsYXJFdmVudCh2aWV3LCB2aWV3LnVwZGF0ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZURvbGxhckV2ZW50KFxuICAgIHZpZXc6IFZpZXdDb21waWxhdGlvblVuaXQsIG9wczogaXIuT3BMaXN0PGlyLkNyZWF0ZU9wPnxpci5PcExpc3Q8aXIuVXBkYXRlT3A+KTogdm9pZCB7XG4gIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgaWYgKG9wLmtpbmQgPT09IGlyLk9wS2luZC5MaXN0ZW5lcikge1xuICAgICAgaXIudHJhbnNmb3JtRXhwcmVzc2lvbnNJbk9wKG9wLCAoZXhwcikgPT4ge1xuICAgICAgICBpZiAoZXhwciBpbnN0YW5jZW9mIGlyLkxleGljYWxSZWFkRXhwciAmJiBleHByLm5hbWUgPT09ICckZXZlbnQnKSB7XG4gICAgICAgICAgb3AuY29uc3VtZXNEb2xsYXJFdmVudCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIG5ldyBvLlJlYWRWYXJFeHByKGV4cHIubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICB9LCBpci5WaXNpdG9yQ29udGV4dEZsYWcuSW5DaGlsZE9wZXJhdGlvbik7XG4gICAgfVxuICB9XG59XG4iXX0=