/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
const CONTAINER_TAG = 'ng-container';
/**
 * Replace an `Element` or `ElementStart` whose tag is `ng-container` with a specific op.
 */
export function phaseNgContainer(cpl) {
    for (const [_, view] of cpl.views) {
        const updatedElementXrefs = new Set();
        for (const op of view.create) {
            if (op.kind === ir.OpKind.ElementStart && op.tag === CONTAINER_TAG) {
                // Transmute the `ElementStart` instruction to `ContainerStart`.
                op.kind = ir.OpKind.ContainerStart;
                updatedElementXrefs.add(op.xref);
            }
            if (op.kind === ir.OpKind.ElementEnd && updatedElementXrefs.has(op.xref)) {
                // This `ElementEnd` is associated with an `ElementStart` we already transmuted.
                op.kind = ir.OpKind.ContainerEnd;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvbmdfY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9CLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQztBQUVyQzs7R0FFRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxHQUE0QjtJQUMzRCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7UUFDakQsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLGFBQWEsRUFBRTtnQkFDbEUsZ0VBQWdFO2dCQUMvRCxFQUF5QixDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztnQkFDM0QsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQztZQUVELElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN4RSxnRkFBZ0Y7Z0JBQy9FLEVBQXlCLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO2FBQzFEO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHtDb21wb25lbnRDb21waWxhdGlvbkpvYn0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG5jb25zdCBDT05UQUlORVJfVEFHID0gJ25nLWNvbnRhaW5lcic7XG5cbi8qKlxuICogUmVwbGFjZSBhbiBgRWxlbWVudGAgb3IgYEVsZW1lbnRTdGFydGAgd2hvc2UgdGFnIGlzIGBuZy1jb250YWluZXJgIHdpdGggYSBzcGVjaWZpYyBvcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlTmdDb250YWluZXIoY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IFtfLCB2aWV3XSBvZiBjcGwudmlld3MpIHtcbiAgICBjb25zdCB1cGRhdGVkRWxlbWVudFhyZWZzID0gbmV3IFNldDxpci5YcmVmSWQ+KCk7XG4gICAgZm9yIChjb25zdCBvcCBvZiB2aWV3LmNyZWF0ZSkge1xuICAgICAgaWYgKG9wLmtpbmQgPT09IGlyLk9wS2luZC5FbGVtZW50U3RhcnQgJiYgb3AudGFnID09PSBDT05UQUlORVJfVEFHKSB7XG4gICAgICAgIC8vIFRyYW5zbXV0ZSB0aGUgYEVsZW1lbnRTdGFydGAgaW5zdHJ1Y3Rpb24gdG8gYENvbnRhaW5lclN0YXJ0YC5cbiAgICAgICAgKG9wIGFzIGlyLk9wPGlyLkNyZWF0ZU9wPikua2luZCA9IGlyLk9wS2luZC5Db250YWluZXJTdGFydDtcbiAgICAgICAgdXBkYXRlZEVsZW1lbnRYcmVmcy5hZGQob3AueHJlZik7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcC5raW5kID09PSBpci5PcEtpbmQuRWxlbWVudEVuZCAmJiB1cGRhdGVkRWxlbWVudFhyZWZzLmhhcyhvcC54cmVmKSkge1xuICAgICAgICAvLyBUaGlzIGBFbGVtZW50RW5kYCBpcyBhc3NvY2lhdGVkIHdpdGggYW4gYEVsZW1lbnRTdGFydGAgd2UgYWxyZWFkeSB0cmFuc211dGVkLlxuICAgICAgICAob3AgYXMgaXIuT3A8aXIuQ3JlYXRlT3A+KS5raW5kID0gaXIuT3BLaW5kLkNvbnRhaW5lckVuZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==