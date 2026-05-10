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
 * Find all assignments and usages of temporary variables, which are linked to each other with cross
 * references. Generate names for each cross-reference, and add a `DeclareVarStmt` to initialize
 * them at the beginning of the update block.
 *
 * TODO: Sometimes, it will be possible to reuse names across different subexpressions. For example,
 * in the double keyed read `a?.[f()]?.[f()]`, the two function calls have non-overlapping scopes.
 * Implement an algorithm for reuse.
 */
export function phaseTemporaryVariables(cpl) {
    for (const unit of cpl.units) {
        let opCount = 0;
        let generatedStatements = [];
        for (const op of unit.ops()) {
            // Identify the final time each temp var is read.
            const finalReads = new Map();
            ir.visitExpressionsInOp(op, expr => {
                if (expr instanceof ir.ReadTemporaryExpr) {
                    finalReads.set(expr.xref, expr);
                }
            });
            // Name the temp vars, accounting for the fact that a name can be reused after it has been
            // read for the final time.
            let count = 0;
            const assigned = new Set();
            const released = new Set();
            const defs = new Map();
            ir.visitExpressionsInOp(op, expr => {
                if (expr instanceof ir.AssignTemporaryExpr) {
                    if (!assigned.has(expr.xref)) {
                        assigned.add(expr.xref);
                        // TODO: Exactly replicate the naming scheme used by `TemplateDefinitionBuilder`.
                        // It seems to rely on an expression index instead of an op index.
                        defs.set(expr.xref, `tmp_${opCount}_${count++}`);
                    }
                    assignName(defs, expr);
                }
                else if (expr instanceof ir.ReadTemporaryExpr) {
                    if (finalReads.get(expr.xref) === expr) {
                        released.add(expr.xref);
                        count--;
                    }
                    assignName(defs, expr);
                }
            });
            // Add declarations for the temp vars.
            generatedStatements.push(...Array.from(new Set(defs.values()))
                .map(name => ir.createStatementOp(new o.DeclareVarStmt(name))));
            opCount++;
        }
        unit.update.prepend(generatedStatements);
    }
}
/**
 * Assigns a name to the temporary variable in the given temporary variable expression.
 */
function assignName(names, expr) {
    const name = names.get(expr.xref);
    if (name === undefined) {
        throw new Error(`Found xref with unassigned name: ${expr.xref}`);
    }
    expr.name = name;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcG9yYXJ5X3ZhcmlhYmxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL3RlbXBvcmFyeV92YXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUcvQjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxHQUFtQjtJQUN6RCxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUU7UUFDNUIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLElBQUksbUJBQW1CLEdBQXVDLEVBQUUsQ0FBQztRQUNqRSxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMzQixpREFBaUQ7WUFDakQsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFDOUQsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDakMsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDLGlCQUFpQixFQUFFO29CQUN4QyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ2pDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCwwRkFBMEY7WUFDMUYsMkJBQTJCO1lBQzNCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNkLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7WUFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWEsQ0FBQztZQUN0QyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztZQUMxQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLElBQUksWUFBWSxFQUFFLENBQUMsbUJBQW1CLEVBQUU7b0JBQzFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDNUIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3hCLGlGQUFpRjt3QkFDakYsa0VBQWtFO3dCQUNsRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxPQUFPLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3FCQUNsRDtvQkFDRCxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtxQkFBTSxJQUFJLElBQUksWUFBWSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7b0JBQy9DLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO3dCQUN0QyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDeEIsS0FBSyxFQUFFLENBQUM7cUJBQ1Q7b0JBQ0QsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDeEI7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILHNDQUFzQztZQUN0QyxtQkFBbUIsQ0FBQyxJQUFJLENBQ3BCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztpQkFDaEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFjLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztLQUMxQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsVUFBVSxDQUNmLEtBQTZCLEVBQUUsSUFBaUQ7SUFDbEYsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2xFO0lBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB7Q29tcGlsYXRpb25Kb2IsIENvbXBvbmVudENvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbi8qKlxuICogRmluZCBhbGwgYXNzaWdubWVudHMgYW5kIHVzYWdlcyBvZiB0ZW1wb3JhcnkgdmFyaWFibGVzLCB3aGljaCBhcmUgbGlua2VkIHRvIGVhY2ggb3RoZXIgd2l0aCBjcm9zc1xuICogcmVmZXJlbmNlcy4gR2VuZXJhdGUgbmFtZXMgZm9yIGVhY2ggY3Jvc3MtcmVmZXJlbmNlLCBhbmQgYWRkIGEgYERlY2xhcmVWYXJTdG10YCB0byBpbml0aWFsaXplXG4gKiB0aGVtIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHVwZGF0ZSBibG9jay5cbiAqXG4gKiBUT0RPOiBTb21ldGltZXMsIGl0IHdpbGwgYmUgcG9zc2libGUgdG8gcmV1c2UgbmFtZXMgYWNyb3NzIGRpZmZlcmVudCBzdWJleHByZXNzaW9ucy4gRm9yIGV4YW1wbGUsXG4gKiBpbiB0aGUgZG91YmxlIGtleWVkIHJlYWQgYGE/LltmKCldPy5bZigpXWAsIHRoZSB0d28gZnVuY3Rpb24gY2FsbHMgaGF2ZSBub24tb3ZlcmxhcHBpbmcgc2NvcGVzLlxuICogSW1wbGVtZW50IGFuIGFsZ29yaXRobSBmb3IgcmV1c2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZVRlbXBvcmFyeVZhcmlhYmxlcyhjcGw6IENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdW5pdCBvZiBjcGwudW5pdHMpIHtcbiAgICBsZXQgb3BDb3VudCA9IDA7XG4gICAgbGV0IGdlbmVyYXRlZFN0YXRlbWVudHM6IEFycmF5PGlyLlN0YXRlbWVudE9wPGlyLlVwZGF0ZU9wPj4gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHVuaXQub3BzKCkpIHtcbiAgICAgIC8vIElkZW50aWZ5IHRoZSBmaW5hbCB0aW1lIGVhY2ggdGVtcCB2YXIgaXMgcmVhZC5cbiAgICAgIGNvbnN0IGZpbmFsUmVhZHMgPSBuZXcgTWFwPGlyLlhyZWZJZCwgaXIuUmVhZFRlbXBvcmFyeUV4cHI+KCk7XG4gICAgICBpci52aXNpdEV4cHJlc3Npb25zSW5PcChvcCwgZXhwciA9PiB7XG4gICAgICAgIGlmIChleHByIGluc3RhbmNlb2YgaXIuUmVhZFRlbXBvcmFyeUV4cHIpIHtcbiAgICAgICAgICBmaW5hbFJlYWRzLnNldChleHByLnhyZWYsIGV4cHIpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gTmFtZSB0aGUgdGVtcCB2YXJzLCBhY2NvdW50aW5nIGZvciB0aGUgZmFjdCB0aGF0IGEgbmFtZSBjYW4gYmUgcmV1c2VkIGFmdGVyIGl0IGhhcyBiZWVuXG4gICAgICAvLyByZWFkIGZvciB0aGUgZmluYWwgdGltZS5cbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICBjb25zdCBhc3NpZ25lZCA9IG5ldyBTZXQ8aXIuWHJlZklkPigpO1xuICAgICAgY29uc3QgcmVsZWFzZWQgPSBuZXcgU2V0PGlyLlhyZWZJZD4oKTtcbiAgICAgIGNvbnN0IGRlZnMgPSBuZXcgTWFwPGlyLlhyZWZJZCwgc3RyaW5nPigpO1xuICAgICAgaXIudmlzaXRFeHByZXNzaW9uc0luT3Aob3AsIGV4cHIgPT4ge1xuICAgICAgICBpZiAoZXhwciBpbnN0YW5jZW9mIGlyLkFzc2lnblRlbXBvcmFyeUV4cHIpIHtcbiAgICAgICAgICBpZiAoIWFzc2lnbmVkLmhhcyhleHByLnhyZWYpKSB7XG4gICAgICAgICAgICBhc3NpZ25lZC5hZGQoZXhwci54cmVmKTtcbiAgICAgICAgICAgIC8vIFRPRE86IEV4YWN0bHkgcmVwbGljYXRlIHRoZSBuYW1pbmcgc2NoZW1lIHVzZWQgYnkgYFRlbXBsYXRlRGVmaW5pdGlvbkJ1aWxkZXJgLlxuICAgICAgICAgICAgLy8gSXQgc2VlbXMgdG8gcmVseSBvbiBhbiBleHByZXNzaW9uIGluZGV4IGluc3RlYWQgb2YgYW4gb3AgaW5kZXguXG4gICAgICAgICAgICBkZWZzLnNldChleHByLnhyZWYsIGB0bXBfJHtvcENvdW50fV8ke2NvdW50Kyt9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFzc2lnbk5hbWUoZGVmcywgZXhwcik7XG4gICAgICAgIH0gZWxzZSBpZiAoZXhwciBpbnN0YW5jZW9mIGlyLlJlYWRUZW1wb3JhcnlFeHByKSB7XG4gICAgICAgICAgaWYgKGZpbmFsUmVhZHMuZ2V0KGV4cHIueHJlZikgPT09IGV4cHIpIHtcbiAgICAgICAgICAgIHJlbGVhc2VkLmFkZChleHByLnhyZWYpO1xuICAgICAgICAgICAgY291bnQtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXNzaWduTmFtZShkZWZzLCBleHByKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFkZCBkZWNsYXJhdGlvbnMgZm9yIHRoZSB0ZW1wIHZhcnMuXG4gICAgICBnZW5lcmF0ZWRTdGF0ZW1lbnRzLnB1c2goXG4gICAgICAgICAgLi4uQXJyYXkuZnJvbShuZXcgU2V0KGRlZnMudmFsdWVzKCkpKVxuICAgICAgICAgICAgICAubWFwKG5hbWUgPT4gaXIuY3JlYXRlU3RhdGVtZW50T3A8aXIuVXBkYXRlT3A+KG5ldyBvLkRlY2xhcmVWYXJTdG10KG5hbWUpKSkpO1xuICAgICAgb3BDb3VudCsrO1xuICAgIH1cbiAgICB1bml0LnVwZGF0ZS5wcmVwZW5kKGdlbmVyYXRlZFN0YXRlbWVudHMpO1xuICB9XG59XG5cbi8qKlxuICogQXNzaWducyBhIG5hbWUgdG8gdGhlIHRlbXBvcmFyeSB2YXJpYWJsZSBpbiB0aGUgZ2l2ZW4gdGVtcG9yYXJ5IHZhcmlhYmxlIGV4cHJlc3Npb24uXG4gKi9cbmZ1bmN0aW9uIGFzc2lnbk5hbWUoXG4gICAgbmFtZXM6IE1hcDxpci5YcmVmSWQsIHN0cmluZz4sIGV4cHI6IGlyLkFzc2lnblRlbXBvcmFyeUV4cHJ8aXIuUmVhZFRlbXBvcmFyeUV4cHIpIHtcbiAgY29uc3QgbmFtZSA9IG5hbWVzLmdldChleHByLnhyZWYpO1xuICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGb3VuZCB4cmVmIHdpdGggdW5hc3NpZ25lZCBuYW1lOiAke2V4cHIueHJlZn1gKTtcbiAgfVxuICBleHByLm5hbWUgPSBuYW1lO1xufVxuIl19