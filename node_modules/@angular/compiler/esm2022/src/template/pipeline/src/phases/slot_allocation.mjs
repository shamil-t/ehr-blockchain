/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
/**
 * Assign data slots for all operations which implement `ConsumesSlotOpTrait`, and propagate the
 * assigned data slots of those operations to any expressions which reference them via
 * `UsesSlotIndexTrait`.
 *
 * This phase is also responsible for counting the number of slots used for each view (its `decls`)
 * and propagating that number into the `Template` operations which declare embedded views.
 */
export function phaseSlotAllocation(cpl) {
    // Map of all declarations in all views within the component which require an assigned slot index.
    // This map needs to be global (across all views within the component) since it's possible to
    // reference a slot from one view from an expression within another (e.g. local references work
    // this way).
    const slotMap = new Map();
    // Process all views in the component and assign slot indexes.
    for (const [_, view] of cpl.views) {
        // Slot indices start at 0 for each view (and are not unique between views).
        let slotCount = 0;
        for (const op of view.create) {
            // Only consider declarations which consume data slots.
            if (!ir.hasConsumesSlotTrait(op)) {
                continue;
            }
            // Assign slots to this declaration starting at the current `slotCount`.
            op.slot = slotCount;
            // And track its assigned slot in the `slotMap`.
            slotMap.set(op.xref, op.slot);
            // Each declaration may use more than 1 slot, so increment `slotCount` to reserve the number
            // of slots required.
            slotCount += op.numSlotsUsed;
        }
        // Record the total number of slots used on the view itself. This will later be propagated into
        // `ir.TemplateOp`s which declare those views (except for the root view).
        view.decls = slotCount;
    }
    // After slot assignment, `slotMap` now contains slot assignments for every declaration in the
    // whole template, across all views. Next, look for expressions which implement
    // `UsesSlotIndexExprTrait` and propagate the assigned slot indexes into them.
    // Additionally, this second scan allows us to find `ir.TemplateOp`s which declare views and
    // propagate the number of slots used for each view into the operation which declares it.
    for (const [_, view] of cpl.views) {
        for (const op of view.ops()) {
            if (op.kind === ir.OpKind.Template) {
                // Record the number of slots used by the view this `ir.TemplateOp` declares in the
                // operation itself, so it can be emitted later.
                const childView = cpl.views.get(op.xref);
                op.decls = childView.decls;
            }
            if (ir.hasUsesSlotIndexTrait(op) && op.slot === null) {
                if (!slotMap.has(op.target)) {
                    // We do expect to find a slot allocated for everything which might be referenced.
                    throw new Error(`AssertionError: no slot allocated for ${ir.OpKind[op.kind]} target ${op.target}`);
                }
                op.slot = slotMap.get(op.target);
            }
            // Process all `ir.Expression`s within this view, and look for `usesSlotIndexExprTrait`.
            ir.visitExpressionsInOp(op, expr => {
                if (!ir.isIrExpression(expr)) {
                    return;
                }
                if (!ir.hasUsesSlotIndexTrait(expr) || expr.slot !== null) {
                    return;
                }
                // The `UsesSlotIndexExprTrait` indicates that this expression references something declared
                // in this component template by its slot index. Use the `target` `ir.XrefId` to find the
                // allocated slot for that declaration in `slotMap`.
                if (!slotMap.has(expr.target)) {
                    // We do expect to find a slot allocated for everything which might be referenced.
                    throw new Error(`AssertionError: no slot allocated for ${expr.constructor.name} target ${expr.target}`);
                }
                // Record the allocated slot on the expression.
                expr.slot = slotMap.get(expr.target);
            });
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xvdF9hbGxvY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvc2xvdF9hbGxvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRy9COzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsR0FBNEI7SUFDOUQsa0dBQWtHO0lBQ2xHLDZGQUE2RjtJQUM3RiwrRkFBK0Y7SUFDL0YsYUFBYTtJQUNiLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFxQixDQUFDO0lBRTdDLDhEQUE4RDtJQUM5RCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyw0RUFBNEU7UUFDNUUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUM1Qix1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDaEMsU0FBUzthQUNWO1lBRUQsd0VBQXdFO1lBQ3hFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO1lBRXBCLGdEQUFnRDtZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlCLDRGQUE0RjtZQUM1RixxQkFBcUI7WUFDckIsU0FBUyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7U0FDOUI7UUFFRCwrRkFBK0Y7UUFDL0YseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO0tBQ3hCO0lBRUQsOEZBQThGO0lBQzlGLCtFQUErRTtJQUMvRSw4RUFBOEU7SUFDOUUsNEZBQTRGO0lBQzVGLHlGQUF5RjtJQUN6RixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUNqQyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMzQixJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xDLG1GQUFtRjtnQkFDbkYsZ0RBQWdEO2dCQUNoRCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFFLENBQUM7Z0JBQzFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQzthQUM1QjtZQUVELElBQUksRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO2dCQUNwRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzNCLGtGQUFrRjtvQkFDbEYsTUFBTSxJQUFJLEtBQUssQ0FDWCx5Q0FBeUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7aUJBQ3hGO2dCQUVELEVBQUUsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFFLENBQUM7YUFDbkM7WUFFRCx3RkFBd0Y7WUFDeEYsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDakMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVCLE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtvQkFDekQsT0FBTztpQkFDUjtnQkFFRCw0RkFBNEY7Z0JBQzVGLHlGQUF5RjtnQkFDekYsb0RBQW9EO2dCQUVwRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzdCLGtGQUFrRjtvQkFDbEYsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFdBQzFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2lCQUNwQjtnQkFFRCwrQ0FBK0M7Z0JBQy9DLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7U0FDSjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi8uLi9pcic7XG5pbXBvcnQgdHlwZSB7Q29tcG9uZW50Q29tcGlsYXRpb25Kb2J9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuLyoqXG4gKiBBc3NpZ24gZGF0YSBzbG90cyBmb3IgYWxsIG9wZXJhdGlvbnMgd2hpY2ggaW1wbGVtZW50IGBDb25zdW1lc1Nsb3RPcFRyYWl0YCwgYW5kIHByb3BhZ2F0ZSB0aGVcbiAqIGFzc2lnbmVkIGRhdGEgc2xvdHMgb2YgdGhvc2Ugb3BlcmF0aW9ucyB0byBhbnkgZXhwcmVzc2lvbnMgd2hpY2ggcmVmZXJlbmNlIHRoZW0gdmlhXG4gKiBgVXNlc1Nsb3RJbmRleFRyYWl0YC5cbiAqXG4gKiBUaGlzIHBoYXNlIGlzIGFsc28gcmVzcG9uc2libGUgZm9yIGNvdW50aW5nIHRoZSBudW1iZXIgb2Ygc2xvdHMgdXNlZCBmb3IgZWFjaCB2aWV3IChpdHMgYGRlY2xzYClcbiAqIGFuZCBwcm9wYWdhdGluZyB0aGF0IG51bWJlciBpbnRvIHRoZSBgVGVtcGxhdGVgIG9wZXJhdGlvbnMgd2hpY2ggZGVjbGFyZSBlbWJlZGRlZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlU2xvdEFsbG9jYXRpb24oY3BsOiBDb21wb25lbnRDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICAvLyBNYXAgb2YgYWxsIGRlY2xhcmF0aW9ucyBpbiBhbGwgdmlld3Mgd2l0aGluIHRoZSBjb21wb25lbnQgd2hpY2ggcmVxdWlyZSBhbiBhc3NpZ25lZCBzbG90IGluZGV4LlxuICAvLyBUaGlzIG1hcCBuZWVkcyB0byBiZSBnbG9iYWwgKGFjcm9zcyBhbGwgdmlld3Mgd2l0aGluIHRoZSBjb21wb25lbnQpIHNpbmNlIGl0J3MgcG9zc2libGUgdG9cbiAgLy8gcmVmZXJlbmNlIGEgc2xvdCBmcm9tIG9uZSB2aWV3IGZyb20gYW4gZXhwcmVzc2lvbiB3aXRoaW4gYW5vdGhlciAoZS5nLiBsb2NhbCByZWZlcmVuY2VzIHdvcmtcbiAgLy8gdGhpcyB3YXkpLlxuICBjb25zdCBzbG90TWFwID0gbmV3IE1hcDxpci5YcmVmSWQsIG51bWJlcj4oKTtcblxuICAvLyBQcm9jZXNzIGFsbCB2aWV3cyBpbiB0aGUgY29tcG9uZW50IGFuZCBhc3NpZ24gc2xvdCBpbmRleGVzLlxuICBmb3IgKGNvbnN0IFtfLCB2aWV3XSBvZiBjcGwudmlld3MpIHtcbiAgICAvLyBTbG90IGluZGljZXMgc3RhcnQgYXQgMCBmb3IgZWFjaCB2aWV3IChhbmQgYXJlIG5vdCB1bmlxdWUgYmV0d2VlbiB2aWV3cykuXG4gICAgbGV0IHNsb3RDb3VudCA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcuY3JlYXRlKSB7XG4gICAgICAvLyBPbmx5IGNvbnNpZGVyIGRlY2xhcmF0aW9ucyB3aGljaCBjb25zdW1lIGRhdGEgc2xvdHMuXG4gICAgICBpZiAoIWlyLmhhc0NvbnN1bWVzU2xvdFRyYWl0KG9wKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQXNzaWduIHNsb3RzIHRvIHRoaXMgZGVjbGFyYXRpb24gc3RhcnRpbmcgYXQgdGhlIGN1cnJlbnQgYHNsb3RDb3VudGAuXG4gICAgICBvcC5zbG90ID0gc2xvdENvdW50O1xuXG4gICAgICAvLyBBbmQgdHJhY2sgaXRzIGFzc2lnbmVkIHNsb3QgaW4gdGhlIGBzbG90TWFwYC5cbiAgICAgIHNsb3RNYXAuc2V0KG9wLnhyZWYsIG9wLnNsb3QpO1xuXG4gICAgICAvLyBFYWNoIGRlY2xhcmF0aW9uIG1heSB1c2UgbW9yZSB0aGFuIDEgc2xvdCwgc28gaW5jcmVtZW50IGBzbG90Q291bnRgIHRvIHJlc2VydmUgdGhlIG51bWJlclxuICAgICAgLy8gb2Ygc2xvdHMgcmVxdWlyZWQuXG4gICAgICBzbG90Q291bnQgKz0gb3AubnVtU2xvdHNVc2VkO1xuICAgIH1cblxuICAgIC8vIFJlY29yZCB0aGUgdG90YWwgbnVtYmVyIG9mIHNsb3RzIHVzZWQgb24gdGhlIHZpZXcgaXRzZWxmLiBUaGlzIHdpbGwgbGF0ZXIgYmUgcHJvcGFnYXRlZCBpbnRvXG4gICAgLy8gYGlyLlRlbXBsYXRlT3BgcyB3aGljaCBkZWNsYXJlIHRob3NlIHZpZXdzIChleGNlcHQgZm9yIHRoZSByb290IHZpZXcpLlxuICAgIHZpZXcuZGVjbHMgPSBzbG90Q291bnQ7XG4gIH1cblxuICAvLyBBZnRlciBzbG90IGFzc2lnbm1lbnQsIGBzbG90TWFwYCBub3cgY29udGFpbnMgc2xvdCBhc3NpZ25tZW50cyBmb3IgZXZlcnkgZGVjbGFyYXRpb24gaW4gdGhlXG4gIC8vIHdob2xlIHRlbXBsYXRlLCBhY3Jvc3MgYWxsIHZpZXdzLiBOZXh0LCBsb29rIGZvciBleHByZXNzaW9ucyB3aGljaCBpbXBsZW1lbnRcbiAgLy8gYFVzZXNTbG90SW5kZXhFeHByVHJhaXRgIGFuZCBwcm9wYWdhdGUgdGhlIGFzc2lnbmVkIHNsb3QgaW5kZXhlcyBpbnRvIHRoZW0uXG4gIC8vIEFkZGl0aW9uYWxseSwgdGhpcyBzZWNvbmQgc2NhbiBhbGxvd3MgdXMgdG8gZmluZCBgaXIuVGVtcGxhdGVPcGBzIHdoaWNoIGRlY2xhcmUgdmlld3MgYW5kXG4gIC8vIHByb3BhZ2F0ZSB0aGUgbnVtYmVyIG9mIHNsb3RzIHVzZWQgZm9yIGVhY2ggdmlldyBpbnRvIHRoZSBvcGVyYXRpb24gd2hpY2ggZGVjbGFyZXMgaXQuXG4gIGZvciAoY29uc3QgW18sIHZpZXddIG9mIGNwbC52aWV3cykge1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5vcHMoKSkge1xuICAgICAgaWYgKG9wLmtpbmQgPT09IGlyLk9wS2luZC5UZW1wbGF0ZSkge1xuICAgICAgICAvLyBSZWNvcmQgdGhlIG51bWJlciBvZiBzbG90cyB1c2VkIGJ5IHRoZSB2aWV3IHRoaXMgYGlyLlRlbXBsYXRlT3BgIGRlY2xhcmVzIGluIHRoZVxuICAgICAgICAvLyBvcGVyYXRpb24gaXRzZWxmLCBzbyBpdCBjYW4gYmUgZW1pdHRlZCBsYXRlci5cbiAgICAgICAgY29uc3QgY2hpbGRWaWV3ID0gY3BsLnZpZXdzLmdldChvcC54cmVmKSE7XG4gICAgICAgIG9wLmRlY2xzID0gY2hpbGRWaWV3LmRlY2xzO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXIuaGFzVXNlc1Nsb3RJbmRleFRyYWl0KG9wKSAmJiBvcC5zbG90ID09PSBudWxsKSB7XG4gICAgICAgIGlmICghc2xvdE1hcC5oYXMob3AudGFyZ2V0KSkge1xuICAgICAgICAgIC8vIFdlIGRvIGV4cGVjdCB0byBmaW5kIGEgc2xvdCBhbGxvY2F0ZWQgZm9yIGV2ZXJ5dGhpbmcgd2hpY2ggbWlnaHQgYmUgcmVmZXJlbmNlZC5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBBc3NlcnRpb25FcnJvcjogbm8gc2xvdCBhbGxvY2F0ZWQgZm9yICR7aXIuT3BLaW5kW29wLmtpbmRdfSB0YXJnZXQgJHtvcC50YXJnZXR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBvcC5zbG90ID0gc2xvdE1hcC5nZXQob3AudGFyZ2V0KSE7XG4gICAgICB9XG5cbiAgICAgIC8vIFByb2Nlc3MgYWxsIGBpci5FeHByZXNzaW9uYHMgd2l0aGluIHRoaXMgdmlldywgYW5kIGxvb2sgZm9yIGB1c2VzU2xvdEluZGV4RXhwclRyYWl0YC5cbiAgICAgIGlyLnZpc2l0RXhwcmVzc2lvbnNJbk9wKG9wLCBleHByID0+IHtcbiAgICAgICAgaWYgKCFpci5pc0lyRXhwcmVzc2lvbihleHByKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXIuaGFzVXNlc1Nsb3RJbmRleFRyYWl0KGV4cHIpIHx8IGV4cHIuc2xvdCAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBgVXNlc1Nsb3RJbmRleEV4cHJUcmFpdGAgaW5kaWNhdGVzIHRoYXQgdGhpcyBleHByZXNzaW9uIHJlZmVyZW5jZXMgc29tZXRoaW5nIGRlY2xhcmVkXG4gICAgICAgIC8vIGluIHRoaXMgY29tcG9uZW50IHRlbXBsYXRlIGJ5IGl0cyBzbG90IGluZGV4LiBVc2UgdGhlIGB0YXJnZXRgIGBpci5YcmVmSWRgIHRvIGZpbmQgdGhlXG4gICAgICAgIC8vIGFsbG9jYXRlZCBzbG90IGZvciB0aGF0IGRlY2xhcmF0aW9uIGluIGBzbG90TWFwYC5cblxuICAgICAgICBpZiAoIXNsb3RNYXAuaGFzKGV4cHIudGFyZ2V0KSkge1xuICAgICAgICAgIC8vIFdlIGRvIGV4cGVjdCB0byBmaW5kIGEgc2xvdCBhbGxvY2F0ZWQgZm9yIGV2ZXJ5dGhpbmcgd2hpY2ggbWlnaHQgYmUgcmVmZXJlbmNlZC5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2VydGlvbkVycm9yOiBubyBzbG90IGFsbG9jYXRlZCBmb3IgJHtleHByLmNvbnN0cnVjdG9yLm5hbWV9IHRhcmdldCAke1xuICAgICAgICAgICAgICBleHByLnRhcmdldH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlY29yZCB0aGUgYWxsb2NhdGVkIHNsb3Qgb24gdGhlIGV4cHJlc3Npb24uXG4gICAgICAgIGV4cHIuc2xvdCA9IHNsb3RNYXAuZ2V0KGV4cHIudGFyZ2V0KSE7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==