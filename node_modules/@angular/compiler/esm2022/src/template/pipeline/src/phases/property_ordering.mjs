/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
function kindTest(kind) {
    return (op) => op.kind === kind;
}
/**
 * Defines the groups based on `OpKind` that ops will be divided into. Ops will be collected into
 * groups, then optionally transformed, before recombining the groups in the order defined here.
 */
const ORDERING = [
    { test: kindTest(ir.OpKind.StyleMap), transform: keepLast },
    { test: kindTest(ir.OpKind.ClassMap), transform: keepLast },
    { test: kindTest(ir.OpKind.StyleProp) },
    { test: kindTest(ir.OpKind.ClassProp) },
    {
        test: (op) => (op.kind === ir.OpKind.Property || op.kind === ir.OpKind.HostProperty) &&
            op.expression instanceof ir.Interpolation
    },
    {
        test: (op) => (op.kind === ir.OpKind.Property || op.kind === ir.OpKind.HostProperty) &&
            !(op.expression instanceof ir.Interpolation)
    },
    { test: kindTest(ir.OpKind.Attribute) },
];
/**
 * The set of all op kinds we handle in the reordering phase.
 */
const handledOpKinds = new Set([
    ir.OpKind.StyleMap,
    ir.OpKind.ClassMap,
    ir.OpKind.StyleProp,
    ir.OpKind.ClassProp,
    ir.OpKind.Property,
    ir.OpKind.HostProperty,
    ir.OpKind.Attribute,
]);
/**
 * Reorders property and attribute ops according to the following ordering:
 * 1. styleMap & styleMapInterpolate (drops all but the last op in the group)
 * 2. classMap & classMapInterpolate (drops all but the last op in the group)
 * 3. styleProp & stylePropInterpolate (ordering preserved within group)
 * 4. classProp (ordering preserved within group)
 * 5. propertyInterpolate (ordering preserved within group)
 * 6. property (ordering preserved within group)
 * 7. attribute & attributeInterpolate (ordering preserve within group)
 */
export function phasePropertyOrdering(cpl) {
    for (const unit of cpl.units) {
        let opsToOrder = [];
        for (const op of unit.update) {
            if (handledOpKinds.has(op.kind)) {
                // Pull out ops that need o be ordered.
                opsToOrder.push(op);
                ir.OpList.remove(op);
            }
            else {
                // When we encounter an op that shouldn't be reordered, put the ones we've pulled so far
                // back in the correct order.
                for (const orderedOp of reorder(opsToOrder)) {
                    ir.OpList.insertBefore(orderedOp, op);
                }
                opsToOrder = [];
            }
        }
        // If we still have ops pulled at the end, put them back in the correct order.
        for (const orderedOp of reorder(opsToOrder)) {
            unit.update.push(orderedOp);
        }
    }
}
/**
 * Reorders the given list of ops according to the ordering defined by `ORDERING`.
 */
function reorder(ops) {
    // Break the ops list into groups based on OpKind.
    const groups = Array.from(ORDERING, () => new Array());
    for (const op of ops) {
        const groupIndex = ORDERING.findIndex(o => o.test(op));
        groups[groupIndex].push(op);
    }
    // Reassemble the groups into a single list, in the correct order.
    return groups.flatMap((group, i) => {
        const transform = ORDERING[i].transform;
        return transform ? transform(group) : group;
    });
}
/**
 * Keeps only the last op in a list of ops.
 */
function keepLast(ops) {
    return ops.slice(ops.length - 1);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfb3JkZXJpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9wcm9wZXJ0eV9vcmRlcmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUcvQixTQUFTLFFBQVEsQ0FBQyxJQUFlO0lBQy9CLE9BQU8sQ0FBQyxFQUFlLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO0FBQy9DLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFFBQVEsR0FJVjtJQUNFLEVBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUM7SUFDekQsRUFBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBQztJQUN6RCxFQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBQztJQUNyQyxFQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBQztJQUNyQztRQUNFLElBQUksRUFBRSxDQUFDLEVBQWUsRUFBRSxFQUFFLENBQ3RCLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3RFLEVBQUUsQ0FBQyxVQUFVLFlBQVksRUFBRSxDQUFDLGFBQWE7S0FDOUM7SUFDRDtRQUNFLElBQUks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QUVEOztHQUVHO0FBQ0gsU0FBUyxRQUFRLENBQUksR0FBYTtJQUNoQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB0eXBlIHtDb21waWxhdGlvbkpvYn0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG5mdW5jdGlvbiBraW5kVGVzdChraW5kOiBpci5PcEtpbmQpOiAob3A6IGlyLlVwZGF0ZU9wKSA9PiBib29sZWFuIHtcbiAgcmV0dXJuIChvcDogaXIuVXBkYXRlT3ApID0+IG9wLmtpbmQgPT09IGtpbmQ7XG59XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgZ3JvdXBzIGJhc2VkIG9uIGBPcEtpbmRgIHRoYXQgb3BzIHdpbGwgYmUgZGl2aWRlZCBpbnRvLiBPcHMgd2lsbCBiZSBjb2xsZWN0ZWQgaW50b1xuICogZ3JvdXBzLCB0aGVuIG9wdGlvbmFsbHkgdHJhbnNmb3JtZWQsIGJlZm9yZSByZWNvbWJpbmluZyB0aGUgZ3JvdXBzIGluIHRoZSBvcmRlciBkZWZpbmVkIGhlcmUuXG4gKi9cbmNvbnN0IE9SREVSSU5HOiB7XG4gIHRlc3Q6IChvcDogaXIuVXBkYXRlT3ApID0+IGJvb2xlYW4sXG4gIHRyYW5zZm9ybT86IChvcHM6IEFycmF5PGlyLlVwZGF0ZU9wPikgPT4gQXJyYXk8aXIuVXBkYXRlT3A+XG59W10gPVxuICAgIFtcbiAgICAgIHt0ZXN0OiBraW5kVGVzdChpci5PcEtpbmQuU3R5bGVNYXApLCB0cmFuc2Zvcm06IGtlZXBMYXN0fSxcbiAgICAgIHt0ZXN0OiBraW5kVGVzdChpci5PcEtpbmQuQ2xhc3NNYXApLCB0cmFuc2Zvcm06IGtlZXBMYXN0fSxcbiAgICAgIHt0ZXN0OiBraW5kVGVzdChpci5PcEtpbmQuU3R5bGVQcm9wKX0sXG4gICAgICB7dGVzdDoga2luZFRlc3QoaXIuT3BLaW5kLkNsYXNzUHJvcCl9LFxuICAgICAge1xuICAgICAgICB0ZXN0OiAob3A6IGlyLlVwZGF0ZU9wKSA9PlxuICAgICAgICAgICAgKG9wLmtpbmQgPT09IGlyLk9wS2luZC5Qcm9wZXJ0eSB8fCBvcC5raW5kID09PSBpci5PcEtpbmQuSG9zdFByb3BlcnR5KSAmJlxuICAgICAgICAgICAgb3AuZXhwcmVzc2lvbiBpbnN0YW5jZW9mIGlyLkludGVycG9sYXRpb25cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRlc3Q6IChvcDogaXIuVXBkYXRlT3ApID0+XG4gICAgICAgICAgICAob3Aua2luZCA9PT0gaXIuT3BLaW5kLlByb3BlcnR5IHx8IG9wLmtpbmQgPT09IGlyLk9wS2luZC5Ib3N0UHJvcGVydHkpICYmXG4gICAgICAgICAgICAhKG9wLmV4cHJlc3Npb24gaW5zdGFuY2VvZiBpci5JbnRlcnBvbGF0aW9uKVxuICAgICAgfSxcbiAgICAgIHt0ZXN0OiBraW5kVGVzdChpci5PcEtpbmQuQXR0cmlidXRlKX0sXG4gICAgXTtcblxuLyoqXG4gKiBUaGUgc2V0IG9mIGFsbCBvcCBraW5kcyB3ZSBoYW5kbGUgaW4gdGhlIHJlb3JkZXJpbmcgcGhhc2UuXG4gKi9cbmNvbnN0IGhhbmRsZWRPcEtpbmRzID0gbmV3IFNldChbXG4gIGlyLk9wS2luZC5TdHlsZU1hcCxcbiAgaXIuT3BLaW5kLkNsYXNzTWFwLFxuICBpci5PcEtpbmQuU3R5bGVQcm9wLFxuICBpci5PcEtpbmQuQ2xhc3NQcm9wLFxuICBpci5PcEtpbmQuUHJvcGVydHksXG4gIGlyLk9wS2luZC5Ib3N0UHJvcGVydHksXG4gIGlyLk9wS2luZC5BdHRyaWJ1dGUsXG5dKTtcblxuLyoqXG4gKiBSZW9yZGVycyBwcm9wZXJ0eSBhbmQgYXR0cmlidXRlIG9wcyBhY2NvcmRpbmcgdG8gdGhlIGZvbGxvd2luZyBvcmRlcmluZzpcbiAqIDEuIHN0eWxlTWFwICYgc3R5bGVNYXBJbnRlcnBvbGF0ZSAoZHJvcHMgYWxsIGJ1dCB0aGUgbGFzdCBvcCBpbiB0aGUgZ3JvdXApXG4gKiAyLiBjbGFzc01hcCAmIGNsYXNzTWFwSW50ZXJwb2xhdGUgKGRyb3BzIGFsbCBidXQgdGhlIGxhc3Qgb3AgaW4gdGhlIGdyb3VwKVxuICogMy4gc3R5bGVQcm9wICYgc3R5bGVQcm9wSW50ZXJwb2xhdGUgKG9yZGVyaW5nIHByZXNlcnZlZCB3aXRoaW4gZ3JvdXApXG4gKiA0LiBjbGFzc1Byb3AgKG9yZGVyaW5nIHByZXNlcnZlZCB3aXRoaW4gZ3JvdXApXG4gKiA1LiBwcm9wZXJ0eUludGVycG9sYXRlIChvcmRlcmluZyBwcmVzZXJ2ZWQgd2l0aGluIGdyb3VwKVxuICogNi4gcHJvcGVydHkgKG9yZGVyaW5nIHByZXNlcnZlZCB3aXRoaW4gZ3JvdXApXG4gKiA3LiBhdHRyaWJ1dGUgJiBhdHRyaWJ1dGVJbnRlcnBvbGF0ZSAob3JkZXJpbmcgcHJlc2VydmUgd2l0aGluIGdyb3VwKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VQcm9wZXJ0eU9yZGVyaW5nKGNwbDogQ29tcGlsYXRpb25Kb2IpIHtcbiAgZm9yIChjb25zdCB1bml0IG9mIGNwbC51bml0cykge1xuICAgIGxldCBvcHNUb09yZGVyID0gW107XG4gICAgZm9yIChjb25zdCBvcCBvZiB1bml0LnVwZGF0ZSkge1xuICAgICAgaWYgKGhhbmRsZWRPcEtpbmRzLmhhcyhvcC5raW5kKSkge1xuICAgICAgICAvLyBQdWxsIG91dCBvcHMgdGhhdCBuZWVkIG8gYmUgb3JkZXJlZC5cbiAgICAgICAgb3BzVG9PcmRlci5wdXNoKG9wKTtcbiAgICAgICAgaXIuT3BMaXN0LnJlbW92ZShvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXaGVuIHdlIGVuY291bnRlciBhbiBvcCB0aGF0IHNob3VsZG4ndCBiZSByZW9yZGVyZWQsIHB1dCB0aGUgb25lcyB3ZSd2ZSBwdWxsZWQgc28gZmFyXG4gICAgICAgIC8vIGJhY2sgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAgICAgIGZvciAoY29uc3Qgb3JkZXJlZE9wIG9mIHJlb3JkZXIob3BzVG9PcmRlcikpIHtcbiAgICAgICAgICBpci5PcExpc3QuaW5zZXJ0QmVmb3JlKG9yZGVyZWRPcCwgb3ApO1xuICAgICAgICB9XG4gICAgICAgIG9wc1RvT3JkZXIgPSBbXTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgd2Ugc3RpbGwgaGF2ZSBvcHMgcHVsbGVkIGF0IHRoZSBlbmQsIHB1dCB0aGVtIGJhY2sgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAgZm9yIChjb25zdCBvcmRlcmVkT3Agb2YgcmVvcmRlcihvcHNUb09yZGVyKSkge1xuICAgICAgdW5pdC51cGRhdGUucHVzaChvcmRlcmVkT3ApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlb3JkZXJzIHRoZSBnaXZlbiBsaXN0IG9mIG9wcyBhY2NvcmRpbmcgdG8gdGhlIG9yZGVyaW5nIGRlZmluZWQgYnkgYE9SREVSSU5HYC5cbiAqL1xuZnVuY3Rpb24gcmVvcmRlcihvcHM6IEFycmF5PGlyLlVwZGF0ZU9wPik6IEFycmF5PGlyLlVwZGF0ZU9wPiB7XG4gIC8vIEJyZWFrIHRoZSBvcHMgbGlzdCBpbnRvIGdyb3VwcyBiYXNlZCBvbiBPcEtpbmQuXG4gIGNvbnN0IGdyb3VwcyA9IEFycmF5LmZyb20oT1JERVJJTkcsICgpID0+IG5ldyBBcnJheTxpci5VcGRhdGVPcD4oKSk7XG4gIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgY29uc3QgZ3JvdXBJbmRleCA9IE9SREVSSU5HLmZpbmRJbmRleChvID0+IG8udGVzdChvcCkpO1xuICAgIGdyb3Vwc1tncm91cEluZGV4XS5wdXNoKG9wKTtcbiAgfVxuICAvLyBSZWFzc2VtYmxlIHRoZSBncm91cHMgaW50byBhIHNpbmdsZSBsaXN0LCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgcmV0dXJuIGdyb3Vwcy5mbGF0TWFwKChncm91cCwgaSkgPT4ge1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IE9SREVSSU5HW2ldLnRyYW5zZm9ybTtcbiAgICByZXR1cm4gdHJhbnNmb3JtID8gdHJhbnNmb3JtKGdyb3VwKSA6IGdyb3VwO1xuICB9KTtcbn1cblxuLyoqXG4gKiBLZWVwcyBvbmx5IHRoZSBsYXN0IG9wIGluIGEgbGlzdCBvZiBvcHMuXG4gKi9cbmZ1bmN0aW9uIGtlZXBMYXN0PFQ+KG9wczogQXJyYXk8VD4pIHtcbiAgcmV0dXJuIG9wcy5zbGljZShvcHMubGVuZ3RoIC0gMSk7XG59XG4iXX0=