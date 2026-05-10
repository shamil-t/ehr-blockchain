/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SecurityContext } from '../../../../core';
import { isIframeSecuritySensitiveAttr } from '../../../../schema/dom_security_schema';
import * as ir from '../../ir';
import { getElementsByXrefId } from '../util/elements';
/**
 * Mapping of security contexts to sanitizer function for that context.
 */
const sanitizers = new Map([
    [SecurityContext.HTML, ir.SanitizerFn.Html], [SecurityContext.SCRIPT, ir.SanitizerFn.Script],
    [SecurityContext.STYLE, ir.SanitizerFn.Style], [SecurityContext.URL, ir.SanitizerFn.Url],
    [SecurityContext.RESOURCE_URL, ir.SanitizerFn.ResourceUrl]
]);
/**
 * Resolves sanitization functions for ops that need them.
 */
export function phaseResolveSanitizers(cpl) {
    for (const [_, view] of cpl.views) {
        const elements = getElementsByXrefId(view);
        let sanitizerFn;
        for (const op of view.update) {
            switch (op.kind) {
                case ir.OpKind.Property:
                case ir.OpKind.Attribute:
                    sanitizerFn = sanitizers.get(op.securityContext) || null;
                    op.sanitizer = sanitizerFn ? new ir.SanitizerExpr(sanitizerFn) : null;
                    // If there was no sanitization function found based on the security context of an
                    // attribute/property, check whether this attribute/property is one of the
                    // security-sensitive <iframe> attributes (and that the current element is actually an
                    // <iframe>).
                    if (op.sanitizer === null) {
                        const ownerOp = elements.get(op.target);
                        if (ownerOp === undefined) {
                            throw Error('Property should have an element-like owner');
                        }
                        if (isIframeElement(ownerOp) && isIframeSecuritySensitiveAttr(op.name)) {
                            op.sanitizer = new ir.SanitizerExpr(ir.SanitizerFn.IframeAttribute);
                        }
                    }
                    break;
            }
        }
    }
}
/**
 * Checks whether the given op represents an iframe element.
 */
function isIframeElement(op) {
    return (op.kind === ir.OpKind.Element || op.kind === ir.OpKind.ElementStart) &&
        op.tag.toLowerCase() === 'iframe';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZV9zYW5pdGl6ZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvcmVzb2x2ZV9zYW5pdGl6ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsNkJBQTZCLEVBQUMsTUFBTSx3Q0FBd0MsQ0FBQztBQUNyRixPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUUvQixPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUVyRDs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUF1QztJQUMvRCxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDNUYsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO0lBQ3hGLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQztDQUMzRCxDQUFDLENBQUM7QUFFSDs7R0FFRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUE0QjtJQUNqRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxJQUFJLFdBQWdDLENBQUM7UUFDckMsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRTtnQkFDZixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUN4QixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUztvQkFDdEIsV0FBVyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQztvQkFDekQsRUFBRSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN0RSxrRkFBa0Y7b0JBQ2xGLDBFQUEwRTtvQkFDMUUsc0ZBQXNGO29CQUN0RixhQUFhO29CQUNiLElBQUksRUFBRSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7d0JBQ3pCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN4QyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7NEJBQ3pCLE1BQU0sS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7eUJBQzNEO3dCQUNELElBQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLDZCQUE2QixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs0QkFDdEUsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQzt5QkFDckU7cUJBQ0Y7b0JBQ0QsTUFBTTthQUNUO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsZUFBZSxDQUFDLEVBQTRCO0lBQ25ELE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDeEUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxRQUFRLENBQUM7QUFDeEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi4vLi4vLi4vLi4vY29yZSc7XG5pbXBvcnQge2lzSWZyYW1lU2VjdXJpdHlTZW5zaXRpdmVBdHRyfSBmcm9tICcuLi8uLi8uLi8uLi9zY2hlbWEvZG9tX3NlY3VyaXR5X3NjaGVtYSc7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi8uLi9pcic7XG5pbXBvcnQge0NvbXBvbmVudENvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5pbXBvcnQge2dldEVsZW1lbnRzQnlYcmVmSWR9IGZyb20gJy4uL3V0aWwvZWxlbWVudHMnO1xuXG4vKipcbiAqIE1hcHBpbmcgb2Ygc2VjdXJpdHkgY29udGV4dHMgdG8gc2FuaXRpemVyIGZ1bmN0aW9uIGZvciB0aGF0IGNvbnRleHQuXG4gKi9cbmNvbnN0IHNhbml0aXplcnMgPSBuZXcgTWFwPFNlY3VyaXR5Q29udGV4dCwgaXIuU2FuaXRpemVyRm58bnVsbD4oW1xuICBbU2VjdXJpdHlDb250ZXh0LkhUTUwsIGlyLlNhbml0aXplckZuLkh0bWxdLCBbU2VjdXJpdHlDb250ZXh0LlNDUklQVCwgaXIuU2FuaXRpemVyRm4uU2NyaXB0XSxcbiAgW1NlY3VyaXR5Q29udGV4dC5TVFlMRSwgaXIuU2FuaXRpemVyRm4uU3R5bGVdLCBbU2VjdXJpdHlDb250ZXh0LlVSTCwgaXIuU2FuaXRpemVyRm4uVXJsXSxcbiAgW1NlY3VyaXR5Q29udGV4dC5SRVNPVVJDRV9VUkwsIGlyLlNhbml0aXplckZuLlJlc291cmNlVXJsXVxuXSk7XG5cbi8qKlxuICogUmVzb2x2ZXMgc2FuaXRpemF0aW9uIGZ1bmN0aW9ucyBmb3Igb3BzIHRoYXQgbmVlZCB0aGVtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VSZXNvbHZlU2FuaXRpemVycyhjcGw6IENvbXBvbmVudENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW18sIHZpZXddIG9mIGNwbC52aWV3cykge1xuICAgIGNvbnN0IGVsZW1lbnRzID0gZ2V0RWxlbWVudHNCeVhyZWZJZCh2aWV3KTtcbiAgICBsZXQgc2FuaXRpemVyRm46IGlyLlNhbml0aXplckZufG51bGw7XG4gICAgZm9yIChjb25zdCBvcCBvZiB2aWV3LnVwZGF0ZSkge1xuICAgICAgc3dpdGNoIChvcC5raW5kKSB7XG4gICAgICAgIGNhc2UgaXIuT3BLaW5kLlByb3BlcnR5OlxuICAgICAgICBjYXNlIGlyLk9wS2luZC5BdHRyaWJ1dGU6XG4gICAgICAgICAgc2FuaXRpemVyRm4gPSBzYW5pdGl6ZXJzLmdldChvcC5zZWN1cml0eUNvbnRleHQpIHx8IG51bGw7XG4gICAgICAgICAgb3Auc2FuaXRpemVyID0gc2FuaXRpemVyRm4gPyBuZXcgaXIuU2FuaXRpemVyRXhwcihzYW5pdGl6ZXJGbikgOiBudWxsO1xuICAgICAgICAgIC8vIElmIHRoZXJlIHdhcyBubyBzYW5pdGl6YXRpb24gZnVuY3Rpb24gZm91bmQgYmFzZWQgb24gdGhlIHNlY3VyaXR5IGNvbnRleHQgb2YgYW5cbiAgICAgICAgICAvLyBhdHRyaWJ1dGUvcHJvcGVydHksIGNoZWNrIHdoZXRoZXIgdGhpcyBhdHRyaWJ1dGUvcHJvcGVydHkgaXMgb25lIG9mIHRoZVxuICAgICAgICAgIC8vIHNlY3VyaXR5LXNlbnNpdGl2ZSA8aWZyYW1lPiBhdHRyaWJ1dGVzIChhbmQgdGhhdCB0aGUgY3VycmVudCBlbGVtZW50IGlzIGFjdHVhbGx5IGFuXG4gICAgICAgICAgLy8gPGlmcmFtZT4pLlxuICAgICAgICAgIGlmIChvcC5zYW5pdGl6ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IG93bmVyT3AgPSBlbGVtZW50cy5nZXQob3AudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmIChvd25lck9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1Byb3BlcnR5IHNob3VsZCBoYXZlIGFuIGVsZW1lbnQtbGlrZSBvd25lcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzSWZyYW1lRWxlbWVudChvd25lck9wKSAmJiBpc0lmcmFtZVNlY3VyaXR5U2Vuc2l0aXZlQXR0cihvcC5uYW1lKSkge1xuICAgICAgICAgICAgICBvcC5zYW5pdGl6ZXIgPSBuZXcgaXIuU2FuaXRpemVyRXhwcihpci5TYW5pdGl6ZXJGbi5JZnJhbWVBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gb3AgcmVwcmVzZW50cyBhbiBpZnJhbWUgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gaXNJZnJhbWVFbGVtZW50KG9wOiBpci5FbGVtZW50T3JDb250YWluZXJPcHMpOiBib29sZWFuIHtcbiAgcmV0dXJuIChvcC5raW5kID09PSBpci5PcEtpbmQuRWxlbWVudCB8fCBvcC5raW5kID09PSBpci5PcEtpbmQuRWxlbWVudFN0YXJ0KSAmJlxuICAgICAgb3AudGFnLnRvTG93ZXJDYXNlKCkgPT09ICdpZnJhbWUnO1xufVxuIl19