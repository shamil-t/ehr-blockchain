/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
import { varsUsedByIrExpression } from './var_counting';
export function phaseAlignPipeVariadicVarOffset(cpl) {
    for (const view of cpl.views.values()) {
        for (const op of view.update) {
            ir.visitExpressionsInOp(op, expr => {
                if (!(expr instanceof ir.PipeBindingVariadicExpr)) {
                    return expr;
                }
                if (!(expr.args instanceof ir.PureFunctionExpr)) {
                    return expr;
                }
                if (expr.varOffset === null || expr.args.varOffset === null) {
                    throw new Error(`Must run after variable counting`);
                }
                // The structure of this variadic pipe expression is:
                // PipeBindingVariadic(#, Y, PureFunction(X, ...ARGS))
                // Where X and Y are the slot offsets for the variables used by these operations, and Y > X.
                // In `TemplateDefinitionBuilder` the PipeBindingVariadic variable slots are allocated
                // before the PureFunction slots, which is unusually out-of-order.
                //
                // To maintain identical output for the tests in question, we adjust the variable offsets of
                // these two calls to emulate TDB's behavior. This is not perfect, because the ARGS of the
                // PureFunction call may also allocate slots which by TDB's ordering would come after X, and
                // we don't account for that. Still, this should be enough to pass the existing pipe tests.
                // Put the PipeBindingVariadic vars where the PureFunction vars were previously allocated.
                expr.varOffset = expr.args.varOffset;
                // Put the PureFunction vars following the PipeBindingVariadic vars.
                expr.args.varOffset = expr.varOffset + varsUsedByIrExpression(expr);
            });
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpZ25fcGlwZV92YXJpYWRpY192YXJfb2Zmc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvYWxpZ25fcGlwZV92YXJpYWRpY192YXJfb2Zmc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9CLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRELE1BQU0sVUFBVSwrQkFBK0IsQ0FBQyxHQUE0QjtJQUMxRSxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDckMsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRTtvQkFDakQsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtvQkFDL0MsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7b0JBQzNELE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztpQkFDckQ7Z0JBRUQscURBQXFEO2dCQUNyRCxzREFBc0Q7Z0JBQ3RELDRGQUE0RjtnQkFFNUYsc0ZBQXNGO2dCQUN0RixrRUFBa0U7Z0JBQ2xFLEVBQUU7Z0JBQ0YsNEZBQTRGO2dCQUM1RiwwRkFBMEY7Z0JBQzFGLDRGQUE0RjtnQkFDNUYsMkZBQTJGO2dCQUUzRiwwRkFBMEY7Z0JBQzFGLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBRXJDLG9FQUFvRTtnQkFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RSxDQUFDLENBQUMsQ0FBQztTQUNKO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcblxuaW1wb3J0IHR5cGUge0NvbXBvbmVudENvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5pbXBvcnQge3ZhcnNVc2VkQnlJckV4cHJlc3Npb259IGZyb20gJy4vdmFyX2NvdW50aW5nJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlQWxpZ25QaXBlVmFyaWFkaWNWYXJPZmZzZXQoY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHZpZXcgb2YgY3BsLnZpZXdzLnZhbHVlcygpKSB7XG4gICAgZm9yIChjb25zdCBvcCBvZiB2aWV3LnVwZGF0ZSkge1xuICAgICAgaXIudmlzaXRFeHByZXNzaW9uc0luT3Aob3AsIGV4cHIgPT4ge1xuICAgICAgICBpZiAoIShleHByIGluc3RhbmNlb2YgaXIuUGlwZUJpbmRpbmdWYXJpYWRpY0V4cHIpKSB7XG4gICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShleHByLmFyZ3MgaW5zdGFuY2VvZiBpci5QdXJlRnVuY3Rpb25FeHByKSkge1xuICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4cHIudmFyT2Zmc2V0ID09PSBudWxsIHx8IGV4cHIuYXJncy52YXJPZmZzZXQgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE11c3QgcnVuIGFmdGVyIHZhcmlhYmxlIGNvdW50aW5nYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgc3RydWN0dXJlIG9mIHRoaXMgdmFyaWFkaWMgcGlwZSBleHByZXNzaW9uIGlzOlxuICAgICAgICAvLyBQaXBlQmluZGluZ1ZhcmlhZGljKCMsIFksIFB1cmVGdW5jdGlvbihYLCAuLi5BUkdTKSlcbiAgICAgICAgLy8gV2hlcmUgWCBhbmQgWSBhcmUgdGhlIHNsb3Qgb2Zmc2V0cyBmb3IgdGhlIHZhcmlhYmxlcyB1c2VkIGJ5IHRoZXNlIG9wZXJhdGlvbnMsIGFuZCBZID4gWC5cblxuICAgICAgICAvLyBJbiBgVGVtcGxhdGVEZWZpbml0aW9uQnVpbGRlcmAgdGhlIFBpcGVCaW5kaW5nVmFyaWFkaWMgdmFyaWFibGUgc2xvdHMgYXJlIGFsbG9jYXRlZFxuICAgICAgICAvLyBiZWZvcmUgdGhlIFB1cmVGdW5jdGlvbiBzbG90cywgd2hpY2ggaXMgdW51c3VhbGx5IG91dC1vZi1vcmRlci5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVG8gbWFpbnRhaW4gaWRlbnRpY2FsIG91dHB1dCBmb3IgdGhlIHRlc3RzIGluIHF1ZXN0aW9uLCB3ZSBhZGp1c3QgdGhlIHZhcmlhYmxlIG9mZnNldHMgb2ZcbiAgICAgICAgLy8gdGhlc2UgdHdvIGNhbGxzIHRvIGVtdWxhdGUgVERCJ3MgYmVoYXZpb3IuIFRoaXMgaXMgbm90IHBlcmZlY3QsIGJlY2F1c2UgdGhlIEFSR1Mgb2YgdGhlXG4gICAgICAgIC8vIFB1cmVGdW5jdGlvbiBjYWxsIG1heSBhbHNvIGFsbG9jYXRlIHNsb3RzIHdoaWNoIGJ5IFREQidzIG9yZGVyaW5nIHdvdWxkIGNvbWUgYWZ0ZXIgWCwgYW5kXG4gICAgICAgIC8vIHdlIGRvbid0IGFjY291bnQgZm9yIHRoYXQuIFN0aWxsLCB0aGlzIHNob3VsZCBiZSBlbm91Z2ggdG8gcGFzcyB0aGUgZXhpc3RpbmcgcGlwZSB0ZXN0cy5cblxuICAgICAgICAvLyBQdXQgdGhlIFBpcGVCaW5kaW5nVmFyaWFkaWMgdmFycyB3aGVyZSB0aGUgUHVyZUZ1bmN0aW9uIHZhcnMgd2VyZSBwcmV2aW91c2x5IGFsbG9jYXRlZC5cbiAgICAgICAgZXhwci52YXJPZmZzZXQgPSBleHByLmFyZ3MudmFyT2Zmc2V0O1xuXG4gICAgICAgIC8vIFB1dCB0aGUgUHVyZUZ1bmN0aW9uIHZhcnMgZm9sbG93aW5nIHRoZSBQaXBlQmluZGluZ1ZhcmlhZGljIHZhcnMuXG4gICAgICAgIGV4cHIuYXJncy52YXJPZmZzZXQgPSBleHByLnZhck9mZnNldCArIHZhcnNVc2VkQnlJckV4cHJlc3Npb24oZXhwcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==