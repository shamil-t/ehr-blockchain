/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
/**
 * Looks up an element in the given map by xref ID.
 */
function lookupElement(elements, xref) {
    const el = elements.get(xref);
    if (el === undefined) {
        throw new Error('All attributes should have an element-like target.');
    }
    return el;
}
/**
 * When a container is marked with `ngNonBindable`, the non-bindable characteristic also applies to
 * all descendants of that container. Therefore, we must emit `disableBindings` and `enableBindings`
 * instructions for every such container.
 */
export function phaseNonbindable(job) {
    const elements = new Map();
    for (const view of job.units) {
        for (const op of view.create) {
            if (!ir.isElementOrContainerOp(op)) {
                continue;
            }
            elements.set(op.xref, op);
        }
    }
    for (const [_, view] of job.views) {
        for (const op of view.create) {
            if ((op.kind === ir.OpKind.ElementStart || op.kind === ir.OpKind.ContainerStart) &&
                op.nonBindable) {
                ir.OpList.insertAfter(ir.createDisableBindingsOp(op.xref), op);
            }
            if ((op.kind === ir.OpKind.ElementEnd || op.kind === ir.OpKind.ContainerEnd) &&
                lookupElement(elements, op.xref).nonBindable) {
                ir.OpList.insertBefore(ir.createEnableBindingsOp(op.xref), op);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uYmluZGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9ub25iaW5kYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUcvQjs7R0FFRztBQUNILFNBQVMsYUFBYSxDQUNsQixRQUFrRCxFQUFFLElBQWU7SUFDckUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixJQUFJLEVBQUUsS0FBSyxTQUFTLEVBQUU7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxHQUE0QjtJQUMzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztJQUNoRSxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLElBQUksQ0FBQyxFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2xDLFNBQVM7YUFDVjtZQUNELFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUMzQjtLQUNGO0lBRUQsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDakMsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7Z0JBQzVFLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xCLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDN0U7WUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUN4RSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hELEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFjLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDN0U7U0FDRjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB0eXBlIHtDb21wb25lbnRDb21waWxhdGlvbkpvYn0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG4vKipcbiAqIExvb2tzIHVwIGFuIGVsZW1lbnQgaW4gdGhlIGdpdmVuIG1hcCBieSB4cmVmIElELlxuICovXG5mdW5jdGlvbiBsb29rdXBFbGVtZW50KFxuICAgIGVsZW1lbnRzOiBNYXA8aXIuWHJlZklkLCBpci5FbGVtZW50T3JDb250YWluZXJPcHM+LCB4cmVmOiBpci5YcmVmSWQpOiBpci5FbGVtZW50T3JDb250YWluZXJPcHMge1xuICBjb25zdCBlbCA9IGVsZW1lbnRzLmdldCh4cmVmKTtcbiAgaWYgKGVsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBhdHRyaWJ1dGVzIHNob3VsZCBoYXZlIGFuIGVsZW1lbnQtbGlrZSB0YXJnZXQuJyk7XG4gIH1cbiAgcmV0dXJuIGVsO1xufVxuXG4vKipcbiAqIFdoZW4gYSBjb250YWluZXIgaXMgbWFya2VkIHdpdGggYG5nTm9uQmluZGFibGVgLCB0aGUgbm9uLWJpbmRhYmxlIGNoYXJhY3RlcmlzdGljIGFsc28gYXBwbGllcyB0b1xuICogYWxsIGRlc2NlbmRhbnRzIG9mIHRoYXQgY29udGFpbmVyLiBUaGVyZWZvcmUsIHdlIG11c3QgZW1pdCBgZGlzYWJsZUJpbmRpbmdzYCBhbmQgYGVuYWJsZUJpbmRpbmdzYFxuICogaW5zdHJ1Y3Rpb25zIGZvciBldmVyeSBzdWNoIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlTm9uYmluZGFibGUoam9iOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBjb25zdCBlbGVtZW50cyA9IG5ldyBNYXA8aXIuWHJlZklkLCBpci5FbGVtZW50T3JDb250YWluZXJPcHM+KCk7XG4gIGZvciAoY29uc3QgdmlldyBvZiBqb2IudW5pdHMpIHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcuY3JlYXRlKSB7XG4gICAgICBpZiAoIWlyLmlzRWxlbWVudE9yQ29udGFpbmVyT3Aob3ApKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZWxlbWVudHMuc2V0KG9wLnhyZWYsIG9wKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtfLCB2aWV3XSBvZiBqb2Iudmlld3MpIHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcuY3JlYXRlKSB7XG4gICAgICBpZiAoKG9wLmtpbmQgPT09IGlyLk9wS2luZC5FbGVtZW50U3RhcnQgfHwgb3Aua2luZCA9PT0gaXIuT3BLaW5kLkNvbnRhaW5lclN0YXJ0KSAmJlxuICAgICAgICAgIG9wLm5vbkJpbmRhYmxlKSB7XG4gICAgICAgIGlyLk9wTGlzdC5pbnNlcnRBZnRlcjxpci5DcmVhdGVPcD4oaXIuY3JlYXRlRGlzYWJsZUJpbmRpbmdzT3Aob3AueHJlZiksIG9wKTtcbiAgICAgIH1cbiAgICAgIGlmICgob3Aua2luZCA9PT0gaXIuT3BLaW5kLkVsZW1lbnRFbmQgfHwgb3Aua2luZCA9PT0gaXIuT3BLaW5kLkNvbnRhaW5lckVuZCkgJiZcbiAgICAgICAgICBsb29rdXBFbGVtZW50KGVsZW1lbnRzLCBvcC54cmVmKS5ub25CaW5kYWJsZSkge1xuICAgICAgICBpci5PcExpc3QuaW5zZXJ0QmVmb3JlPGlyLkNyZWF0ZU9wPihpci5jcmVhdGVFbmFibGVCaW5kaW5nc09wKG9wLnhyZWYpLCBvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=