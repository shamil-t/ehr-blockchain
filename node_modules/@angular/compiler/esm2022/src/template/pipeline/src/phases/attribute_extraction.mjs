/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SecurityContext } from '../../../../core';
import * as o from '../../../../output/output_ast';
import { parse as parseStyle } from '../../../../render3/view/style_parser';
import * as ir from '../../ir';
import { getElementsByXrefId } from '../util/elements';
/**
 * Find all attribute and binding ops, and collect them into the ElementAttribute structures.
 * In cases where no instruction needs to be generated for the attribute or binding, it is removed.
 */
export function phaseAttributeExtraction(cpl) {
    for (const [_, view] of cpl.views) {
        populateElementAttributes(view);
    }
}
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
 * Populates the ElementAttributes map for the given view, and removes ops for any bindings that do
 * not need further processing.
 */
function populateElementAttributes(view) {
    const elements = getElementsByXrefId(view);
    for (const op of view.ops()) {
        let ownerOp;
        switch (op.kind) {
            case ir.OpKind.Attribute:
                extractAttributeOp(view, op, elements);
                break;
            case ir.OpKind.Property:
                if (op.isAnimationTrigger) {
                    continue; // Don't extract animation properties.
                }
                ownerOp = lookupElement(elements, op.target);
                ir.assertIsElementAttributes(ownerOp.attributes);
                ownerOp.attributes.add(op.isTemplate ? ir.BindingKind.Template : ir.BindingKind.Property, op.name, null);
                break;
            case ir.OpKind.StyleProp:
            case ir.OpKind.ClassProp:
                ownerOp = lookupElement(elements, op.target);
                ir.assertIsElementAttributes(ownerOp.attributes);
                // Empty StyleProperty and ClassName expressions are treated differently depending on
                // compatibility mode.
                if (view.compatibility === ir.CompatibilityMode.TemplateDefinitionBuilder &&
                    op.expression instanceof ir.EmptyExpr) {
                    // The old compiler treated empty style bindings as regular bindings for the purpose of
                    // directive matching. That behavior is incorrect, but we emulate it in compatibility
                    // mode.
                    ownerOp.attributes.add(ir.BindingKind.Property, op.name, null);
                }
                break;
            case ir.OpKind.Listener:
                if (op.isAnimationListener) {
                    continue; // Don't extract animation listeners.
                }
                ownerOp = lookupElement(elements, op.target);
                ir.assertIsElementAttributes(ownerOp.attributes);
                ownerOp.attributes.add(ir.BindingKind.Property, op.name, null);
                break;
        }
    }
}
function isStringLiteral(expr) {
    return expr instanceof o.LiteralExpr && typeof expr.value === 'string';
}
function extractAttributeOp(view, op, elements) {
    if (op.expression instanceof ir.Interpolation) {
        return;
    }
    const ownerOp = lookupElement(elements, op.target);
    ir.assertIsElementAttributes(ownerOp.attributes);
    if (op.name === 'style' && isStringLiteral(op.expression)) {
        // TemplateDefinitionBuilder did not extract style attributes that had a security context.
        if (view.compatibility === ir.CompatibilityMode.TemplateDefinitionBuilder &&
            op.securityContext !== SecurityContext.NONE) {
            return;
        }
        // Extract style attributes.
        const parsedStyles = parseStyle(op.expression.value);
        for (let i = 0; i < parsedStyles.length - 1; i += 2) {
            ownerOp.attributes.add(ir.BindingKind.StyleProperty, parsedStyles[i], o.literal(parsedStyles[i + 1]));
        }
        ir.OpList.remove(op);
    }
    else {
        // The old compiler only extracted string constants, so we emulate that behavior in
        // compaitiblity mode, otherwise we optimize more aggressively.
        let extractable = view.compatibility === ir.CompatibilityMode.TemplateDefinitionBuilder ?
            (op.expression instanceof o.LiteralExpr && typeof op.expression.value === 'string') :
            op.expression.isConstant();
        // We don't need to generate instructions for attributes that can be extracted as consts.
        if (extractable) {
            ownerOp.attributes.add(op.isTemplate ? ir.BindingKind.Template : ir.BindingKind.Attribute, op.name, op.expression);
            ir.OpList.remove(op);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlX2V4dHJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9hdHRyaWJ1dGVfZXh0cmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsS0FBSyxJQUFJLFVBQVUsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBQzFFLE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRS9CLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXJEOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxHQUE0QjtJQUNuRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNqQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsYUFBYSxDQUNsQixRQUFrRCxFQUFFLElBQWU7SUFDckUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixJQUFJLEVBQUUsS0FBSyxTQUFTLEVBQUU7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx5QkFBeUIsQ0FBQyxJQUF5QjtJQUMxRCxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUUz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QVUsQ0FBQyxHQUFHLENBQ2xCLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUMzRSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBaUIsQ0FBQyxDQUFDO1NBQ3JDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2VjdXJpdHlDb250ZXh0fSBmcm9tICcuLi8uLi8uLi8uLi9jb3JlJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVN0eWxlfSBmcm9tICcuLi8uLi8uLi8uLi9yZW5kZXIzL3ZpZXcvc3R5bGVfcGFyc2VyJztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB7Q29tcG9uZW50Q29tcGlsYXRpb25Kb2IsIFZpZXdDb21waWxhdGlvblVuaXR9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcbmltcG9ydCB7Z2V0RWxlbWVudHNCeVhyZWZJZH0gZnJvbSAnLi4vdXRpbC9lbGVtZW50cyc7XG5cbi8qKlxuICogRmluZCBhbGwgYXR0cmlidXRlIGFuZCBiaW5kaW5nIG9wcywgYW5kIGNvbGxlY3QgdGhlbSBpbnRvIHRoZSBFbGVtZW50QXR0cmlidXRlIHN0cnVjdHVyZXMuXG4gKiBJbiBjYXNlcyB3aGVyZSBubyBpbnN0cnVjdGlvbiBuZWVkcyB0byBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBhdHRyaWJ1dGUgb3IgYmluZGluZywgaXQgaXMgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlQXR0cmlidXRlRXh0cmFjdGlvbihjcGw6IENvbXBvbmVudENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW18sIHZpZXddIG9mIGNwbC52aWV3cykge1xuICAgIHBvcHVsYXRlRWxlbWVudEF0dHJpYnV0ZXModmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBMb29rcyB1cCBhbiBlbGVtZW50IGluIHRoZSBnaXZlbiBtYXAgYnkgeHJlZiBJRC5cbiAqL1xuZnVuY3Rpb24gbG9va3VwRWxlbWVudChcbiAgICBlbGVtZW50czogTWFwPGlyLlhyZWZJZCwgaXIuRWxlbWVudE9yQ29udGFpbmVyT3BzPiwgeHJlZjogaXIuWHJlZklkKTogaXIuRWxlbWVudE9yQ29udGFpbmVyT3BzIHtcbiAgY29uc3QgZWwgPSBlbGVtZW50cy5nZXQoeHJlZik7XG4gIGlmIChlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgYXR0cmlidXRlcyBzaG91bGQgaGF2ZSBhbiBlbGVtZW50LWxpa2UgdGFyZ2V0LicpO1xuICB9XG4gIHJldHVybiBlbDtcbn1cblxuLyoqXG4gKiBQb3B1bGF0ZXMgdGhlIEVsZW1lbnRBdHRyaWJ1dGVzIG1hcCBmb3IgdGhlIGdpdmVuIHZpZXcsIGFuZCByZW1vdmVzIG9wcyBmb3IgYW55IGJpbmRpbmdzIHRoYXQgZG9cbiAqIG5vdCBuZWVkIGZ1cnRoZXIgcHJvY2Vzc2luZy5cbiAqL1xuZnVuY3Rpb24gcG9wdWxhdGVFbGVtZW50QXR0cmlidXRlcyh2aWV3OiBWaWV3Q29tcGlsYXRpb25Vbml0KSB7XG4gIGNvbnN0IGVsZW1lbnRzID0gZ2V0RWxlbWVudHNCeVhyZWZJZCh2aWV3KTtcblxuICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcub3BzKCkpIHtcbiAgICBsZXQgb3duZXJPcDogUmV0dXJuVHlwZTx0eXBlb2YgbG9va3VwRWxlbWVudD47XG4gICAgc3dpdGNoIChvcC5raW5kKSB7XG4gICAgICBjYXNlIGlyLk9wS2luZC5BdHRyaWJ1dGU6XG4gICAgICAgIGV4dHJhY3RBdHRyaWJ1dGVPcCh2aWV3LCBvcCwgZWxlbWVudHMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgaXIuT3BLaW5kLlByb3BlcnR5OlxuICAgICAgICBpZiAob3AuaXNBbmltYXRpb25UcmlnZ2VyKSB7XG4gICAgICAgICAgY29udGludWU7ICAvLyBEb24ndCBleHRyYWN0IGFuaW1hdGlvbiBwcm9wZXJ0aWVzLlxuICAgICAgICB9XG5cbiAgICAgICAgb3duZXJPcCA9IGxvb2t1cEVsZW1lbnQoZWxlbWVudHMsIG9wLnRhcmdldCk7XG4gICAgICAgIGlyLmFzc2VydElzRWxlbWVudEF0dHJpYnV0ZXMob3duZXJPcC5hdHRyaWJ1dGVzKTtcblxuICAgICAgICBvd25lck9wLmF0dHJpYnV0ZXMuYWRkKFxuICAgICAgICAgICAgb3AuaXNUZW1wbGF0ZSA/IGlyLkJpbmRpbmdLaW5kLlRlbXBsYXRlIDogaXIuQmluZGluZ0tpbmQuUHJvcGVydHksIG9wLm5hbWUsIG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgaXIuT3BLaW5kLlN0eWxlUHJvcDpcbiAgICAgIGNhc2UgaXIuT3BLaW5kLkNsYXNzUHJvcDpcbiAgICAgICAgb3duZXJPcCA9IGxvb2t1cEVsZW1lbnQoZWxlbWVudHMsIG9wLnRhcmdldCk7XG4gICAgICAgIGlyLmFzc2VydElzRWxlbWVudEF0dHJpYnV0ZXMob3duZXJPcC5hdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBFbXB0eSBTdHlsZVByb3BlcnR5IGFuZCBDbGFzc05hbWUgZXhwcmVzc2lvbnMgYXJlIHRyZWF0ZWQgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uXG4gICAgICAgIC8vIGNvbXBhdGliaWxpdHkgbW9kZS5cbiAgICAgICAgaWYgKHZpZXcuY29tcGF0aWJpbGl0eSA9PT0gaXIuQ29tcGF0aWJpbGl0eU1vZGUuVGVtcGxhdGVEZWZpbml0aW9uQnVpbGRlciAmJlxuICAgICAgICAgICAgb3AuZXhwcmVzc2lvbiBpbnN0YW5jZW9mIGlyLkVtcHR5RXhwcikge1xuICAgICAgICAgIC8vIFRoZSBvbGQgY29tcGlsZXIgdHJlYXRlZCBlbXB0eSBzdHlsZSBiaW5kaW5ncyBhcyByZWd1bGFyIGJpbmRpbmdzIGZvciB0aGUgcHVycG9zZSBvZlxuICAgICAgICAgIC8vIGRpcmVjdGl2ZSBtYXRjaGluZy4gVGhhdCBiZWhhdmlvciBpcyBpbmNvcnJlY3QsIGJ1dCB3ZSBlbXVsYXRlIGl0IGluIGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAvLyBtb2RlLlxuICAgICAgICAgIG93bmVyT3AuYXR0cmlidXRlcy5hZGQoaXIuQmluZGluZ0tpbmQuUHJvcGVydHksIG9wLm5hbWUsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBpci5PcEtpbmQuTGlzdGVuZXI6XG4gICAgICAgIGlmIChvcC5pc0FuaW1hdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgICAgY29udGludWU7ICAvLyBEb24ndCBleHRyYWN0IGFuaW1hdGlvbiBsaXN0ZW5lcnMuXG4gICAgICAgIH1cbiAgICAgICAgb3duZXJPcCA9IGxvb2t1cEVsZW1lbnQoZWxlbWVudHMsIG9wLnRhcmdldCk7XG4gICAgICAgIGlyLmFzc2VydElzRWxlbWVudEF0dHJpYnV0ZXMob3duZXJPcC5hdHRyaWJ1dGVzKTtcblxuICAgICAgICBvd25lck9wLmF0dHJpYnV0ZXMuYWRkKGlyLkJpbmRpbmdLaW5kLlByb3BlcnR5LCBvcC5uYW1lLCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nTGl0ZXJhbChleHByOiBvLkV4cHJlc3Npb24pOiBleHByIGlzIG8uTGl0ZXJhbEV4cHIme3ZhbHVlOiBzdHJpbmd9IHtcbiAgcmV0dXJuIGV4cHIgaW5zdGFuY2VvZiBvLkxpdGVyYWxFeHByICYmIHR5cGVvZiBleHByLnZhbHVlID09PSAnc3RyaW5nJztcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEF0dHJpYnV0ZU9wKFxuICAgIHZpZXc6IFZpZXdDb21waWxhdGlvblVuaXQsIG9wOiBpci5BdHRyaWJ1dGVPcCxcbiAgICBlbGVtZW50czogTWFwPGlyLlhyZWZJZCwgaXIuRWxlbWVudE9yQ29udGFpbmVyT3BzPikge1xuICBpZiAob3AuZXhwcmVzc2lvbiBpbnN0YW5jZW9mIGlyLkludGVycG9sYXRpb24pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgb3duZXJPcCA9IGxvb2t1cEVsZW1lbnQoZWxlbWVudHMsIG9wLnRhcmdldCk7XG4gIGlyLmFzc2VydElzRWxlbWVudEF0dHJpYnV0ZXMob3duZXJPcC5hdHRyaWJ1dGVzKTtcblxuICBpZiAob3AubmFtZSA9PT0gJ3N0eWxlJyAmJiBpc1N0cmluZ0xpdGVyYWwob3AuZXhwcmVzc2lvbikpIHtcbiAgICAvLyBUZW1wbGF0ZURlZmluaXRpb25CdWlsZGVyIGRpZCBub3QgZXh0cmFjdCBzdHlsZSBhdHRyaWJ1dGVzIHRoYXQgaGFkIGEgc2VjdXJpdHkgY29udGV4dC5cbiAgICBpZiAodmlldy5jb21wYXRpYmlsaXR5ID09PSBpci5Db21wYXRpYmlsaXR5TW9kZS5UZW1wbGF0ZURlZmluaXRpb25CdWlsZGVyICYmXG4gICAgICAgIG9wLnNlY3VyaXR5Q29udGV4dCAhPT0gU2VjdXJpdHlDb250ZXh0Lk5PTkUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IHN0eWxlIGF0dHJpYnV0ZXMuXG4gICAgY29uc3QgcGFyc2VkU3R5bGVzID0gcGFyc2VTdHlsZShvcC5leHByZXNzaW9uLnZhbHVlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnNlZFN0eWxlcy5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIG93bmVyT3AuYXR0cmlidXRlcy5hZGQoXG4gICAgICAgICAgaXIuQmluZGluZ0tpbmQuU3R5bGVQcm9wZXJ0eSwgcGFyc2VkU3R5bGVzW2ldLCBvLmxpdGVyYWwocGFyc2VkU3R5bGVzW2kgKyAxXSkpO1xuICAgIH1cbiAgICBpci5PcExpc3QucmVtb3ZlKG9wIGFzIGlyLlVwZGF0ZU9wKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgb2xkIGNvbXBpbGVyIG9ubHkgZXh0cmFjdGVkIHN0cmluZyBjb25zdGFudHMsIHNvIHdlIGVtdWxhdGUgdGhhdCBiZWhhdmlvciBpblxuICAgIC8vIGNvbXBhaXRpYmxpdHkgbW9kZSwgb3RoZXJ3aXNlIHdlIG9wdGltaXplIG1vcmUgYWdncmVzc2l2ZWx5LlxuICAgIGxldCBleHRyYWN0YWJsZSA9IHZpZXcuY29tcGF0aWJpbGl0eSA9PT0gaXIuQ29tcGF0aWJpbGl0eU1vZGUuVGVtcGxhdGVEZWZpbml0aW9uQnVpbGRlciA/XG4gICAgICAgIChvcC5leHByZXNzaW9uIGluc3RhbmNlb2Ygby5MaXRlcmFsRXhwciAmJiB0eXBlb2Ygb3AuZXhwcmVzc2lvbi52YWx1ZSA9PT0gJ3N0cmluZycpIDpcbiAgICAgICAgb3AuZXhwcmVzc2lvbi5pc0NvbnN0YW50KCk7XG5cbiAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGdlbmVyYXRlIGluc3RydWN0aW9ucyBmb3IgYXR0cmlidXRlcyB0aGF0IGNhbiBiZSBleHRyYWN0ZWQgYXMgY29uc3RzLlxuICAgIGlmIChleHRyYWN0YWJsZSkge1xuICAgICAgb3duZXJPcC5hdHRyaWJ1dGVzLmFkZChcbiAgICAgICAgICBvcC5pc1RlbXBsYXRlID8gaXIuQmluZGluZ0tpbmQuVGVtcGxhdGUgOiBpci5CaW5kaW5nS2luZC5BdHRyaWJ1dGUsIG9wLm5hbWUsXG4gICAgICAgICAgb3AuZXhwcmVzc2lvbik7XG4gICAgICBpci5PcExpc3QucmVtb3ZlKG9wIGFzIGlyLlVwZGF0ZU9wKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==