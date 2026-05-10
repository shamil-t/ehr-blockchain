/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
const REPLACEMENTS = new Map([
    [ir.OpKind.ElementEnd, [ir.OpKind.ElementStart, ir.OpKind.Element]],
    [ir.OpKind.ContainerEnd, [ir.OpKind.ContainerStart, ir.OpKind.Container]],
]);
/**
 * Replace sequences of mergable elements (e.g. `ElementStart` and `ElementEnd`) with a consolidated
 * element (e.g. `Element`).
 */
export function phaseEmptyElements(cpl) {
    for (const [_, view] of cpl.views) {
        for (const op of view.create) {
            const opReplacements = REPLACEMENTS.get(op.kind);
            if (opReplacements === undefined) {
                continue;
            }
            const [startKind, mergedKind] = opReplacements;
            if (op.prev !== null && op.prev.kind === startKind) {
                // Transmute the start instruction to the merged version. This is safe as they're designed
                // to be identical apart from the `kind`.
                op.prev.kind = mergedKind;
                // Remove the end instruction.
                ir.OpList.remove(op);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlfZWxlbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL3BoYXNlcy9lbXB0eV9lbGVtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUcvQixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBb0M7SUFDOUQsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDMUUsQ0FBQyxDQUFDO0FBRUg7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEdBQTRCO0lBQzdELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO1FBQ2pDLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUM1QixNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRCxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7Z0JBQ2hDLFNBQVM7YUFDVjtZQUNELE1BQU0sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLEdBQUcsY0FBYyxDQUFDO1lBQy9DLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUNsRCwwRkFBMEY7Z0JBQzFGLHlDQUF5QztnQkFDeEMsRUFBRSxDQUFDLElBQTJCLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztnQkFFbEQsOEJBQThCO2dCQUM5QixFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBYyxFQUFFLENBQUMsQ0FBQzthQUNuQztTQUNGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uLy4uL2lyJztcbmltcG9ydCB7Q29tcG9uZW50Q29tcGlsYXRpb25Kb2J9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuY29uc3QgUkVQTEFDRU1FTlRTID0gbmV3IE1hcDxpci5PcEtpbmQsIFtpci5PcEtpbmQsIGlyLk9wS2luZF0+KFtcbiAgW2lyLk9wS2luZC5FbGVtZW50RW5kLCBbaXIuT3BLaW5kLkVsZW1lbnRTdGFydCwgaXIuT3BLaW5kLkVsZW1lbnRdXSxcbiAgW2lyLk9wS2luZC5Db250YWluZXJFbmQsIFtpci5PcEtpbmQuQ29udGFpbmVyU3RhcnQsIGlyLk9wS2luZC5Db250YWluZXJdXSxcbl0pO1xuXG4vKipcbiAqIFJlcGxhY2Ugc2VxdWVuY2VzIG9mIG1lcmdhYmxlIGVsZW1lbnRzIChlLmcuIGBFbGVtZW50U3RhcnRgIGFuZCBgRWxlbWVudEVuZGApIHdpdGggYSBjb25zb2xpZGF0ZWRcbiAqIGVsZW1lbnQgKGUuZy4gYEVsZW1lbnRgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlRW1wdHlFbGVtZW50cyhjcGw6IENvbXBvbmVudENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW18sIHZpZXddIG9mIGNwbC52aWV3cykge1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygdmlldy5jcmVhdGUpIHtcbiAgICAgIGNvbnN0IG9wUmVwbGFjZW1lbnRzID0gUkVQTEFDRU1FTlRTLmdldChvcC5raW5kKTtcbiAgICAgIGlmIChvcFJlcGxhY2VtZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgW3N0YXJ0S2luZCwgbWVyZ2VkS2luZF0gPSBvcFJlcGxhY2VtZW50cztcbiAgICAgIGlmIChvcC5wcmV2ICE9PSBudWxsICYmIG9wLnByZXYua2luZCA9PT0gc3RhcnRLaW5kKSB7XG4gICAgICAgIC8vIFRyYW5zbXV0ZSB0aGUgc3RhcnQgaW5zdHJ1Y3Rpb24gdG8gdGhlIG1lcmdlZCB2ZXJzaW9uLiBUaGlzIGlzIHNhZmUgYXMgdGhleSdyZSBkZXNpZ25lZFxuICAgICAgICAvLyB0byBiZSBpZGVudGljYWwgYXBhcnQgZnJvbSB0aGUgYGtpbmRgLlxuICAgICAgICAob3AucHJldiBhcyBpci5PcDxpci5DcmVhdGVPcD4pLmtpbmQgPSBtZXJnZWRLaW5kO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgZW5kIGluc3RydWN0aW9uLlxuICAgICAgICBpci5PcExpc3QucmVtb3ZlPGlyLkNyZWF0ZU9wPihvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=