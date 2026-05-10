/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { GenericKeyFn } from '../../../../constant_pool';
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
export function phasePureFunctionExtraction(job) {
    for (const view of job.units) {
        for (const op of view.ops()) {
            ir.visitExpressionsInOp(op, expr => {
                if (!(expr instanceof ir.PureFunctionExpr) || expr.body === null) {
                    return;
                }
                const constantDef = new PureFunctionConstant(expr.args.length);
                expr.fn = job.pool.getSharedConstant(constantDef, expr.body);
                expr.body = null;
            });
        }
    }
}
class PureFunctionConstant extends GenericKeyFn {
    constructor(numArgs) {
        super();
        this.numArgs = numArgs;
    }
    keyOf(expr) {
        if (expr instanceof ir.PureFunctionParameterExpr) {
            return `param(${expr.index})`;
        }
        else {
            return super.keyOf(expr);
        }
    }
    toSharedConstantDeclaration(declName, keyExpr) {
        const fnParams = [];
        for (let idx = 0; idx < this.numArgs; idx++) {
            fnParams.push(new o.FnParam('_p' + idx));
        }
        // We will never visit `ir.PureFunctionParameterExpr`s that don't belong to us, because this
        // transform runs inside another visitor which will visit nested pure functions before this one.
        const returnExpr = ir.transformExpressionsInExpression(keyExpr, expr => {
            if (!(expr instanceof ir.PureFunctionParameterExpr)) {
                return expr;
            }
            return o.variable('_p' + expr.index);
        }, ir.VisitorContextFlag.None);
        return new o.DeclareFunctionStmt(declName, fnParams, [new o.ReturnStatement(returnExpr)]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbl9leHRyYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvcHVyZV9mdW5jdGlvbl9leHRyYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQTJCLE1BQU0sMkJBQTJCLENBQUM7QUFDakYsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUkvQixNQUFNLFVBQVUsMkJBQTJCLENBQUMsR0FBbUI7SUFDN0QsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO1FBQzVCLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQzNCLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtvQkFDaEUsT0FBTztpQkFDUjtnQkFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQy9ELElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztTQUNKO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxvQkFBcUIsU0FBUSxZQUFZO0lBQzdDLFlBQW9CLE9BQWU7UUFDakMsS0FBSyxFQUFFLENBQUM7UUFEVSxZQUFPLEdBQVAsT0FBTyxDQUFRO0lBRW5DLENBQUM7SUFFUSxLQUFLLENBQUMsSUFBa0I7UUFDL0IsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDLHlCQUF5QixFQUFFO1lBQ2hELE9BQU8sU0FBUyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUM7U0FDL0I7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQjtJQUNILENBQUM7SUFFRCwyQkFBMkIsQ0FBQyxRQUFnQixFQUFFLE9BQXFCO1FBQ2pFLE1BQU0sUUFBUSxHQUFnQixFQUFFLENBQUM7UUFDakMsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDM0MsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFFRCw0RkFBNEY7UUFDNUYsZ0dBQWdHO1FBQ2hHLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDckUsSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFO2dCQUNuRCxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvQixPQUFPLElBQUksQ0FBQyxDQUFDLG1CQUFtQixDQUM1QixRQUFRLEVBQ1IsUUFBUSxFQUNSLENBQUMsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQ3RDLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtHZW5lcmljS2V5Rm4sIFNoYXJlZENvbnN0YW50RGVmaW5pdGlvbn0gZnJvbSAnLi4vLi4vLi4vLi4vY29uc3RhbnRfcG9vbCc7XG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcblxuaW1wb3J0IHR5cGUge0NvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZVB1cmVGdW5jdGlvbkV4dHJhY3Rpb24oam9iOiBDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHZpZXcgb2Ygam9iLnVuaXRzKSB7XG4gICAgZm9yIChjb25zdCBvcCBvZiB2aWV3Lm9wcygpKSB7XG4gICAgICBpci52aXNpdEV4cHJlc3Npb25zSW5PcChvcCwgZXhwciA9PiB7XG4gICAgICAgIGlmICghKGV4cHIgaW5zdGFuY2VvZiBpci5QdXJlRnVuY3Rpb25FeHByKSB8fCBleHByLmJvZHkgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb25zdGFudERlZiA9IG5ldyBQdXJlRnVuY3Rpb25Db25zdGFudChleHByLmFyZ3MubGVuZ3RoKTtcbiAgICAgICAgZXhwci5mbiA9IGpvYi5wb29sLmdldFNoYXJlZENvbnN0YW50KGNvbnN0YW50RGVmLCBleHByLmJvZHkpO1xuICAgICAgICBleHByLmJvZHkgPSBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFB1cmVGdW5jdGlvbkNvbnN0YW50IGV4dGVuZHMgR2VuZXJpY0tleUZuIGltcGxlbWVudHMgU2hhcmVkQ29uc3RhbnREZWZpbml0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBudW1BcmdzOiBudW1iZXIpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUga2V5T2YoZXhwcjogby5FeHByZXNzaW9uKTogc3RyaW5nIHtcbiAgICBpZiAoZXhwciBpbnN0YW5jZW9mIGlyLlB1cmVGdW5jdGlvblBhcmFtZXRlckV4cHIpIHtcbiAgICAgIHJldHVybiBgcGFyYW0oJHtleHByLmluZGV4fSlgO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIua2V5T2YoZXhwcik7XG4gICAgfVxuICB9XG5cbiAgdG9TaGFyZWRDb25zdGFudERlY2xhcmF0aW9uKGRlY2xOYW1lOiBzdHJpbmcsIGtleUV4cHI6IG8uRXhwcmVzc2lvbik6IG8uU3RhdGVtZW50IHtcbiAgICBjb25zdCBmblBhcmFtczogby5GblBhcmFtW10gPSBbXTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLm51bUFyZ3M7IGlkeCsrKSB7XG4gICAgICBmblBhcmFtcy5wdXNoKG5ldyBvLkZuUGFyYW0oJ19wJyArIGlkeCkpO1xuICAgIH1cblxuICAgIC8vIFdlIHdpbGwgbmV2ZXIgdmlzaXQgYGlyLlB1cmVGdW5jdGlvblBhcmFtZXRlckV4cHJgcyB0aGF0IGRvbid0IGJlbG9uZyB0byB1cywgYmVjYXVzZSB0aGlzXG4gICAgLy8gdHJhbnNmb3JtIHJ1bnMgaW5zaWRlIGFub3RoZXIgdmlzaXRvciB3aGljaCB3aWxsIHZpc2l0IG5lc3RlZCBwdXJlIGZ1bmN0aW9ucyBiZWZvcmUgdGhpcyBvbmUuXG4gICAgY29uc3QgcmV0dXJuRXhwciA9IGlyLnRyYW5zZm9ybUV4cHJlc3Npb25zSW5FeHByZXNzaW9uKGtleUV4cHIsIGV4cHIgPT4ge1xuICAgICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIGlyLlB1cmVGdW5jdGlvblBhcmFtZXRlckV4cHIpKSB7XG4gICAgICAgIHJldHVybiBleHByO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gby52YXJpYWJsZSgnX3AnICsgZXhwci5pbmRleCk7XG4gICAgfSwgaXIuVmlzaXRvckNvbnRleHRGbGFnLk5vbmUpO1xuXG4gICAgcmV0dXJuIG5ldyBvLkRlY2xhcmVGdW5jdGlvblN0bXQoXG4gICAgICAgIGRlY2xOYW1lLFxuICAgICAgICBmblBhcmFtcyxcbiAgICAgICAgW25ldyBvLlJldHVyblN0YXRlbWVudChyZXR1cm5FeHByKV0sXG4gICAgKTtcbiAgfVxufVxuIl19