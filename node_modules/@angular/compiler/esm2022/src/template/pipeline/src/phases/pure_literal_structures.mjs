/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
export function phasePureLiteralStructures(job) {
    for (const view of job.units) {
        for (const op of view.update) {
            ir.transformExpressionsInOp(op, (expr, flags) => {
                if (flags & ir.VisitorContextFlag.InChildOperation) {
                    return expr;
                }
                if (expr instanceof o.LiteralArrayExpr) {
                    return transformLiteralArray(expr);
                }
                else if (expr instanceof o.LiteralMapExpr) {
                    return transformLiteralMap(expr);
                }
                return expr;
            }, ir.VisitorContextFlag.None);
        }
    }
}
function transformLiteralArray(expr) {
    const derivedEntries = [];
    const nonConstantArgs = [];
    for (const entry of expr.entries) {
        if (entry.isConstant()) {
            derivedEntries.push(entry);
        }
        else {
            const idx = nonConstantArgs.length;
            nonConstantArgs.push(entry);
            derivedEntries.push(new ir.PureFunctionParameterExpr(idx));
        }
    }
    return new ir.PureFunctionExpr(o.literalArr(derivedEntries), nonConstantArgs);
}
function transformLiteralMap(expr) {
    let derivedEntries = [];
    const nonConstantArgs = [];
    for (const entry of expr.entries) {
        if (entry.value.isConstant()) {
            derivedEntries.push(entry);
        }
        else {
            const idx = nonConstantArgs.length;
            nonConstantArgs.push(entry.value);
            derivedEntries.push(new o.LiteralMapEntry(entry.key, new ir.PureFunctionParameterExpr(idx), entry.quoted));
        }
    }
    return new ir.PureFunctionExpr(o.literalMap(derivedEntries), nonConstantArgs);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9saXRlcmFsX3N0cnVjdHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9wdXJlX2xpdGVyYWxfc3RydWN0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLCtCQUErQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9CLE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxHQUFtQjtJQUM1RCxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzlDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDbEQsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBRUQsSUFBSSxJQUFJLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixFQUFFO29CQUN0QyxPQUFPLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNwQztxQkFBTSxJQUFJLElBQUksWUFBWSxDQUFDLENBQUMsY0FBYyxFQUFFO29CQUMzQyxPQUFPLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNsQztnQkFFRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEM7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLElBQXdCO0lBQ3JELE1BQU0sY0FBYyxHQUFtQixFQUFFLENBQUM7SUFDMUMsTUFBTSxlQUFlLEdBQW1CLEVBQUUsQ0FBQztJQUMzQyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDdEIsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM1QjthQUFNO1lBQ0wsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztZQUNuQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVCLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM1RDtLQUNGO0lBQ0QsT0FBTyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQXNCO0lBQ2pELElBQUksY0FBYyxHQUF3QixFQUFFLENBQUM7SUFDN0MsTUFBTSxlQUFlLEdBQW1CLEVBQUUsQ0FBQztJQUMzQyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQzVCLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDNUI7YUFBTTtZQUNMLE1BQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7WUFDbkMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQ3JDLEtBQUssQ0FBQyxHQUFHLEVBQ1QsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLEVBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQ1gsQ0FBQyxDQUFDO1NBQ1I7S0FDRjtJQUNELE9BQU8sSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNoRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHR5cGUge0NvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZVB1cmVMaXRlcmFsU3RydWN0dXJlcyhqb2I6IENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdmlldyBvZiBqb2IudW5pdHMpIHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcudXBkYXRlKSB7XG4gICAgICBpci50cmFuc2Zvcm1FeHByZXNzaW9uc0luT3Aob3AsIChleHByLCBmbGFncykgPT4ge1xuICAgICAgICBpZiAoZmxhZ3MgJiBpci5WaXNpdG9yQ29udGV4dEZsYWcuSW5DaGlsZE9wZXJhdGlvbikge1xuICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4cHIgaW5zdGFuY2VvZiBvLkxpdGVyYWxBcnJheUV4cHIpIHtcbiAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtTGl0ZXJhbEFycmF5KGV4cHIpO1xuICAgICAgICB9IGVsc2UgaWYgKGV4cHIgaW5zdGFuY2VvZiBvLkxpdGVyYWxNYXBFeHByKSB7XG4gICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybUxpdGVyYWxNYXAoZXhwcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICAgIH0sIGlyLlZpc2l0b3JDb250ZXh0RmxhZy5Ob25lKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTGl0ZXJhbEFycmF5KGV4cHI6IG8uTGl0ZXJhbEFycmF5RXhwcik6IG8uRXhwcmVzc2lvbiB7XG4gIGNvbnN0IGRlcml2ZWRFbnRyaWVzOiBvLkV4cHJlc3Npb25bXSA9IFtdO1xuICBjb25zdCBub25Db25zdGFudEFyZ3M6IG8uRXhwcmVzc2lvbltdID0gW107XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZXhwci5lbnRyaWVzKSB7XG4gICAgaWYgKGVudHJ5LmlzQ29uc3RhbnQoKSkge1xuICAgICAgZGVyaXZlZEVudHJpZXMucHVzaChlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlkeCA9IG5vbkNvbnN0YW50QXJncy5sZW5ndGg7XG4gICAgICBub25Db25zdGFudEFyZ3MucHVzaChlbnRyeSk7XG4gICAgICBkZXJpdmVkRW50cmllcy5wdXNoKG5ldyBpci5QdXJlRnVuY3Rpb25QYXJhbWV0ZXJFeHByKGlkeCkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3IGlyLlB1cmVGdW5jdGlvbkV4cHIoby5saXRlcmFsQXJyKGRlcml2ZWRFbnRyaWVzKSwgbm9uQ29uc3RhbnRBcmdzKTtcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTGl0ZXJhbE1hcChleHByOiBvLkxpdGVyYWxNYXBFeHByKTogby5FeHByZXNzaW9uIHtcbiAgbGV0IGRlcml2ZWRFbnRyaWVzOiBvLkxpdGVyYWxNYXBFbnRyeVtdID0gW107XG4gIGNvbnN0IG5vbkNvbnN0YW50QXJnczogby5FeHByZXNzaW9uW10gPSBbXTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBleHByLmVudHJpZXMpIHtcbiAgICBpZiAoZW50cnkudmFsdWUuaXNDb25zdGFudCgpKSB7XG4gICAgICBkZXJpdmVkRW50cmllcy5wdXNoKGVudHJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaWR4ID0gbm9uQ29uc3RhbnRBcmdzLmxlbmd0aDtcbiAgICAgIG5vbkNvbnN0YW50QXJncy5wdXNoKGVudHJ5LnZhbHVlKTtcbiAgICAgIGRlcml2ZWRFbnRyaWVzLnB1c2gobmV3IG8uTGl0ZXJhbE1hcEVudHJ5KFxuICAgICAgICAgIGVudHJ5LmtleSxcbiAgICAgICAgICBuZXcgaXIuUHVyZUZ1bmN0aW9uUGFyYW1ldGVyRXhwcihpZHgpLFxuICAgICAgICAgIGVudHJ5LnF1b3RlZCxcbiAgICAgICAgICApKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ldyBpci5QdXJlRnVuY3Rpb25FeHByKG8ubGl0ZXJhbE1hcChkZXJpdmVkRW50cmllcyksIG5vbkNvbnN0YW50QXJncyk7XG59XG4iXX0=