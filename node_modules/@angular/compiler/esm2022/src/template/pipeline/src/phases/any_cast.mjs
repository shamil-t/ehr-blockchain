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
 * Find any function calls to `$any`, excluding `this.$any`, and delete them.
 */
export function phaseFindAnyCasts(cpl) {
    for (const [_, view] of cpl.views) {
        for (const op of view.ops()) {
            ir.transformExpressionsInOp(op, removeAnys, ir.VisitorContextFlag.None);
        }
    }
}
function removeAnys(e) {
    if (e instanceof o.InvokeFunctionExpr && e.fn instanceof ir.LexicalReadExpr &&
        e.fn.name === '$any') {
        if (e.args.length !== 1) {
            throw new Error('The $any builtin function expects exactly one argument.');
        }
        return e.args[0];
    }
    return e;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW55X2Nhc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9hbnlfY2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLCtCQUErQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9COztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEdBQTRCO0lBQzVELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO1FBQ2pDLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQzNCLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6RTtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLENBQWU7SUFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLGtCQUFrQixJQUFJLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLGVBQWU7UUFDdkUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQ3hCLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztTQUM1RTtRQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB7Q29tcG9uZW50Q29tcGlsYXRpb25Kb2J9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuLyoqXG4gKiBGaW5kIGFueSBmdW5jdGlvbiBjYWxscyB0byBgJGFueWAsIGV4Y2x1ZGluZyBgdGhpcy4kYW55YCwgYW5kIGRlbGV0ZSB0aGVtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VGaW5kQW55Q2FzdHMoY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IFtfLCB2aWV3XSBvZiBjcGwudmlld3MpIHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcub3BzKCkpIHtcbiAgICAgIGlyLnRyYW5zZm9ybUV4cHJlc3Npb25zSW5PcChvcCwgcmVtb3ZlQW55cywgaXIuVmlzaXRvckNvbnRleHRGbGFnLk5vbmUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVBbnlzKGU6IG8uRXhwcmVzc2lvbik6IG8uRXhwcmVzc2lvbiB7XG4gIGlmIChlIGluc3RhbmNlb2Ygby5JbnZva2VGdW5jdGlvbkV4cHIgJiYgZS5mbiBpbnN0YW5jZW9mIGlyLkxleGljYWxSZWFkRXhwciAmJlxuICAgICAgZS5mbi5uYW1lID09PSAnJGFueScpIHtcbiAgICBpZiAoZS5hcmdzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgJGFueSBidWlsdGluIGZ1bmN0aW9uIGV4cGVjdHMgZXhhY3RseSBvbmUgYXJndW1lbnQuJyk7XG4gICAgfVxuICAgIHJldHVybiBlLmFyZ3NbMF07XG4gIH1cbiAgcmV0dXJuIGU7XG59XG4iXX0=