/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
/**
 * Most of the use of `document` in Angular is from within the DI system so it is possible to simply
 * inject the `DOCUMENT` token and are done.
 *
 * Ivy is special because it does not rely upon the DI and must get hold of the document some other
 * way.
 *
 * The solution is to define `getDocument()` and `setDocument()` top-level functions for ivy.
 * Wherever ivy needs the global document, it calls `getDocument()` instead.
 *
 * When running ivy outside of a browser environment, it is necessary to call `setDocument()` to
 * tell ivy what the global `document` is.
 *
 * Angular does this for us in each of the standard platforms (`Browser` and `Server`)
 * by calling `setDocument()` when providing the `DOCUMENT` token.
 */
let DOCUMENT = undefined;
/**
 * Tell ivy what the `document` is for this platform.
 *
 * It is only necessary to call this if the current platform is not a browser.
 *
 * @param document The object representing the global `document` in this environment.
 */
export function setDocument(document) {
    DOCUMENT = document;
}
/**
 * Access the object that represents the `document` for this platform.
 *
 * Ivy calls this whenever it needs to access the `document` object.
 * For example to create the renderer or to do sanitization.
 */
export function getDocument() {
    if (DOCUMENT !== undefined) {
        return DOCUMENT;
    }
    else if (typeof document !== 'undefined') {
        return document;
    }
    throw new RuntimeError(210 /* RuntimeErrorCode.MISSING_DOCUMENT */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `The document object is not available in this context. Make sure the DOCUMENT injection token is provided.`);
    // No "document" can be found. This should only happen if we are running ivy outside Angular and
    // the current platform is not a browser. Since this is not a supported scenario at the moment
    // this should not happen in Angular apps.
    // Once we support running ivy outside of Angular we will need to publish `setDocument()` as a
    // public API.
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFFNUQ7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsSUFBSSxRQUFRLEdBQXVCLFNBQVMsQ0FBQztBQUU3Qzs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQTRCO0lBQ3RELFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDdEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLFdBQVc7SUFDekIsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1FBQzFCLE9BQU8sUUFBUSxDQUFDO0tBQ2pCO1NBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7UUFDMUMsT0FBTyxRQUFRLENBQUM7S0FDakI7SUFFRCxNQUFNLElBQUksWUFBWSw4Q0FFbEIsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDO1FBQzNDLDJHQUEyRyxDQUFDLENBQUM7SUFFckgsZ0dBQWdHO0lBQ2hHLDhGQUE4RjtJQUM5RiwwQ0FBMEM7SUFDMUMsOEZBQThGO0lBQzlGLGNBQWM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcblxuLyoqXG4gKiBNb3N0IG9mIHRoZSB1c2Ugb2YgYGRvY3VtZW50YCBpbiBBbmd1bGFyIGlzIGZyb20gd2l0aGluIHRoZSBESSBzeXN0ZW0gc28gaXQgaXMgcG9zc2libGUgdG8gc2ltcGx5XG4gKiBpbmplY3QgdGhlIGBET0NVTUVOVGAgdG9rZW4gYW5kIGFyZSBkb25lLlxuICpcbiAqIEl2eSBpcyBzcGVjaWFsIGJlY2F1c2UgaXQgZG9lcyBub3QgcmVseSB1cG9uIHRoZSBESSBhbmQgbXVzdCBnZXQgaG9sZCBvZiB0aGUgZG9jdW1lbnQgc29tZSBvdGhlclxuICogd2F5LlxuICpcbiAqIFRoZSBzb2x1dGlvbiBpcyB0byBkZWZpbmUgYGdldERvY3VtZW50KClgIGFuZCBgc2V0RG9jdW1lbnQoKWAgdG9wLWxldmVsIGZ1bmN0aW9ucyBmb3IgaXZ5LlxuICogV2hlcmV2ZXIgaXZ5IG5lZWRzIHRoZSBnbG9iYWwgZG9jdW1lbnQsIGl0IGNhbGxzIGBnZXREb2N1bWVudCgpYCBpbnN0ZWFkLlxuICpcbiAqIFdoZW4gcnVubmluZyBpdnkgb3V0c2lkZSBvZiBhIGJyb3dzZXIgZW52aXJvbm1lbnQsIGl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIGBzZXREb2N1bWVudCgpYCB0b1xuICogdGVsbCBpdnkgd2hhdCB0aGUgZ2xvYmFsIGBkb2N1bWVudGAgaXMuXG4gKlxuICogQW5ndWxhciBkb2VzIHRoaXMgZm9yIHVzIGluIGVhY2ggb2YgdGhlIHN0YW5kYXJkIHBsYXRmb3JtcyAoYEJyb3dzZXJgIGFuZCBgU2VydmVyYClcbiAqIGJ5IGNhbGxpbmcgYHNldERvY3VtZW50KClgIHdoZW4gcHJvdmlkaW5nIHRoZSBgRE9DVU1FTlRgIHRva2VuLlxuICovXG5sZXQgRE9DVU1FTlQ6IERvY3VtZW50fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBUZWxsIGl2eSB3aGF0IHRoZSBgZG9jdW1lbnRgIGlzIGZvciB0aGlzIHBsYXRmb3JtLlxuICpcbiAqIEl0IGlzIG9ubHkgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBpZiB0aGUgY3VycmVudCBwbGF0Zm9ybSBpcyBub3QgYSBicm93c2VyLlxuICpcbiAqIEBwYXJhbSBkb2N1bWVudCBUaGUgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgZ2xvYmFsIGBkb2N1bWVudGAgaW4gdGhpcyBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldERvY3VtZW50KGRvY3VtZW50OiBEb2N1bWVudHx1bmRlZmluZWQpOiB2b2lkIHtcbiAgRE9DVU1FTlQgPSBkb2N1bWVudDtcbn1cblxuLyoqXG4gKiBBY2Nlc3MgdGhlIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGBkb2N1bWVudGAgZm9yIHRoaXMgcGxhdGZvcm0uXG4gKlxuICogSXZ5IGNhbGxzIHRoaXMgd2hlbmV2ZXIgaXQgbmVlZHMgdG8gYWNjZXNzIHRoZSBgZG9jdW1lbnRgIG9iamVjdC5cbiAqIEZvciBleGFtcGxlIHRvIGNyZWF0ZSB0aGUgcmVuZGVyZXIgb3IgdG8gZG8gc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICBpZiAoRE9DVU1FTlQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBET0NVTUVOVDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19ET0NVTUVOVCxcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgYFRoZSBkb2N1bWVudCBvYmplY3QgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGNvbnRleHQuIE1ha2Ugc3VyZSB0aGUgRE9DVU1FTlQgaW5qZWN0aW9uIHRva2VuIGlzIHByb3ZpZGVkLmApO1xuXG4gIC8vIE5vIFwiZG9jdW1lbnRcIiBjYW4gYmUgZm91bmQuIFRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGlmIHdlIGFyZSBydW5uaW5nIGl2eSBvdXRzaWRlIEFuZ3VsYXIgYW5kXG4gIC8vIHRoZSBjdXJyZW50IHBsYXRmb3JtIGlzIG5vdCBhIGJyb3dzZXIuIFNpbmNlIHRoaXMgaXMgbm90IGEgc3VwcG9ydGVkIHNjZW5hcmlvIGF0IHRoZSBtb21lbnRcbiAgLy8gdGhpcyBzaG91bGQgbm90IGhhcHBlbiBpbiBBbmd1bGFyIGFwcHMuXG4gIC8vIE9uY2Ugd2Ugc3VwcG9ydCBydW5uaW5nIGl2eSBvdXRzaWRlIG9mIEFuZ3VsYXIgd2Ugd2lsbCBuZWVkIHRvIHB1Ymxpc2ggYHNldERvY3VtZW50KClgIGFzIGFcbiAgLy8gcHVibGljIEFQSS5cbn1cbiJdfQ==