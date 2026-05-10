/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
/**
 * Generate `ir.AdvanceOp`s in between `ir.UpdateOp`s that ensure the runtime's implicit slot
 * context will be advanced correctly.
 */
export function phaseGenerateAdvance(cpl) {
    for (const [_, view] of cpl.views) {
        // First build a map of all of the declarations in the view that have assigned slots.
        const slotMap = new Map();
        for (const op of view.create) {
            if (!ir.hasConsumesSlotTrait(op)) {
                continue;
            }
            else if (op.slot === null) {
                throw new Error(`AssertionError: expected slots to have been allocated before generating advance() calls`);
            }
            slotMap.set(op.xref, op.slot);
        }
        // Next, step through the update operations and generate `ir.AdvanceOp`s as required to ensure
        // the runtime's implicit slot counter will be set to the correct slot before executing each
        // update operation which depends on it.
        //
        // To do that, we track what the runtime's slot counter will be through the update operations.
        let slotContext = 0;
        for (const op of view.update) {
            if (!ir.hasDependsOnSlotContextTrait(op)) {
                // `op` doesn't depend on the slot counter, so it can be skipped.
                continue;
            }
            else if (!slotMap.has(op.target)) {
                // We expect ops that _do_ depend on the slot counter to point at declarations that exist in
                // the `slotMap`.
                throw new Error(`AssertionError: reference to unknown slot for var ${op.target}`);
            }
            const slot = slotMap.get(op.target);
            // Does the slot counter need to be adjusted?
            if (slotContext !== slot) {
                // If so, generate an `ir.AdvanceOp` to advance the counter.
                const delta = slot - slotContext;
                if (delta < 0) {
                    throw new Error(`AssertionError: slot counter should never need to move backwards`);
                }
                ir.OpList.insertBefore(ir.createAdvanceOp(delta, op.sourceSpan), op);
                slotContext = slot;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVfYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL2dlbmVyYXRlX2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFHL0I7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEdBQTRCO0lBQy9ELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO1FBQ2pDLHFGQUFxRjtRQUNyRixNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUM3QyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDaEMsU0FBUzthQUNWO2lCQUFNLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQ1gseUZBQXlGLENBQUMsQ0FBQzthQUNoRztZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDL0I7UUFFRCw4RkFBOEY7UUFDOUYsNEZBQTRGO1FBQzVGLHdDQUF3QztRQUN4QyxFQUFFO1FBQ0YsOEZBQThGO1FBQzlGLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztRQUNwQixLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDeEMsaUVBQWlFO2dCQUNqRSxTQUFTO2FBQ1Y7aUJBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNsQyw0RkFBNEY7Z0JBQzVGLGlCQUFpQjtnQkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7YUFDbkY7WUFFRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUUsQ0FBQztZQUVyQyw2Q0FBNkM7WUFDN0MsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO2dCQUN4Qiw0REFBNEQ7Z0JBQzVELE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxXQUFXLENBQUM7Z0JBQ2pDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtvQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7aUJBQ3JGO2dCQUVELEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUNsQixFQUFFLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRyxFQUFxQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RixXQUFXLEdBQUcsSUFBSSxDQUFDO2FBQ3BCO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHtDb21wb25lbnRDb21waWxhdGlvbkpvYn0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG4vKipcbiAqIEdlbmVyYXRlIGBpci5BZHZhbmNlT3BgcyBpbiBiZXR3ZWVuIGBpci5VcGRhdGVPcGBzIHRoYXQgZW5zdXJlIHRoZSBydW50aW1lJ3MgaW1wbGljaXQgc2xvdFxuICogY29udGV4dCB3aWxsIGJlIGFkdmFuY2VkIGNvcnJlY3RseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlR2VuZXJhdGVBZHZhbmNlKGNwbDogQ29tcG9uZW50Q29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbXywgdmlld10gb2YgY3BsLnZpZXdzKSB7XG4gICAgLy8gRmlyc3QgYnVpbGQgYSBtYXAgb2YgYWxsIG9mIHRoZSBkZWNsYXJhdGlvbnMgaW4gdGhlIHZpZXcgdGhhdCBoYXZlIGFzc2lnbmVkIHNsb3RzLlxuICAgIGNvbnN0IHNsb3RNYXAgPSBuZXcgTWFwPGlyLlhyZWZJZCwgbnVtYmVyPigpO1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5jcmVhdGUpIHtcbiAgICAgIGlmICghaXIuaGFzQ29uc3VtZXNTbG90VHJhaXQob3ApKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmIChvcC5zbG90ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBBc3NlcnRpb25FcnJvcjogZXhwZWN0ZWQgc2xvdHMgdG8gaGF2ZSBiZWVuIGFsbG9jYXRlZCBiZWZvcmUgZ2VuZXJhdGluZyBhZHZhbmNlKCkgY2FsbHNgKTtcbiAgICAgIH1cblxuICAgICAgc2xvdE1hcC5zZXQob3AueHJlZiwgb3Auc2xvdCk7XG4gICAgfVxuXG4gICAgLy8gTmV4dCwgc3RlcCB0aHJvdWdoIHRoZSB1cGRhdGUgb3BlcmF0aW9ucyBhbmQgZ2VuZXJhdGUgYGlyLkFkdmFuY2VPcGBzIGFzIHJlcXVpcmVkIHRvIGVuc3VyZVxuICAgIC8vIHRoZSBydW50aW1lJ3MgaW1wbGljaXQgc2xvdCBjb3VudGVyIHdpbGwgYmUgc2V0IHRvIHRoZSBjb3JyZWN0IHNsb3QgYmVmb3JlIGV4ZWN1dGluZyBlYWNoXG4gICAgLy8gdXBkYXRlIG9wZXJhdGlvbiB3aGljaCBkZXBlbmRzIG9uIGl0LlxuICAgIC8vXG4gICAgLy8gVG8gZG8gdGhhdCwgd2UgdHJhY2sgd2hhdCB0aGUgcnVudGltZSdzIHNsb3QgY291bnRlciB3aWxsIGJlIHRocm91Z2ggdGhlIHVwZGF0ZSBvcGVyYXRpb25zLlxuICAgIGxldCBzbG90Q29udGV4dCA9IDA7XG4gICAgZm9yIChjb25zdCBvcCBvZiB2aWV3LnVwZGF0ZSkge1xuICAgICAgaWYgKCFpci5oYXNEZXBlbmRzT25TbG90Q29udGV4dFRyYWl0KG9wKSkge1xuICAgICAgICAvLyBgb3BgIGRvZXNuJ3QgZGVwZW5kIG9uIHRoZSBzbG90IGNvdW50ZXIsIHNvIGl0IGNhbiBiZSBza2lwcGVkLlxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAoIXNsb3RNYXAuaGFzKG9wLnRhcmdldCkpIHtcbiAgICAgICAgLy8gV2UgZXhwZWN0IG9wcyB0aGF0IF9kb18gZGVwZW5kIG9uIHRoZSBzbG90IGNvdW50ZXIgdG8gcG9pbnQgYXQgZGVjbGFyYXRpb25zIHRoYXQgZXhpc3QgaW5cbiAgICAgICAgLy8gdGhlIGBzbG90TWFwYC5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogcmVmZXJlbmNlIHRvIHVua25vd24gc2xvdCBmb3IgdmFyICR7b3AudGFyZ2V0fWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzbG90ID0gc2xvdE1hcC5nZXQob3AudGFyZ2V0KSE7XG5cbiAgICAgIC8vIERvZXMgdGhlIHNsb3QgY291bnRlciBuZWVkIHRvIGJlIGFkanVzdGVkP1xuICAgICAgaWYgKHNsb3RDb250ZXh0ICE9PSBzbG90KSB7XG4gICAgICAgIC8vIElmIHNvLCBnZW5lcmF0ZSBhbiBgaXIuQWR2YW5jZU9wYCB0byBhZHZhbmNlIHRoZSBjb3VudGVyLlxuICAgICAgICBjb25zdCBkZWx0YSA9IHNsb3QgLSBzbG90Q29udGV4dDtcbiAgICAgICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IHNsb3QgY291bnRlciBzaG91bGQgbmV2ZXIgbmVlZCB0byBtb3ZlIGJhY2t3YXJkc2ApO1xuICAgICAgICB9XG5cbiAgICAgICAgaXIuT3BMaXN0Lmluc2VydEJlZm9yZTxpci5VcGRhdGVPcD4oXG4gICAgICAgICAgICBpci5jcmVhdGVBZHZhbmNlT3AoZGVsdGEsIChvcCBhcyBpci5EZXBlbmRzT25TbG90Q29udGV4dE9wVHJhaXQpLnNvdXJjZVNwYW4pLCBvcCk7XG4gICAgICAgIHNsb3RDb250ZXh0ID0gc2xvdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==