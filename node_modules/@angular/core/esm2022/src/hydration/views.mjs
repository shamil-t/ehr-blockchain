/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DEHYDRATED_VIEWS } from '../render3/interfaces/container';
import { removeDehydratedViews } from './cleanup';
import { MULTIPLIER, NUM_ROOT_NODES, TEMPLATE_ID } from './interfaces';
import { siblingAfter } from './node_lookup_utils';
/**
 * Given a current DOM node and a serialized information about the views
 * in a container, walks over the DOM structure, collecting the list of
 * dehydrated views.
 */
export function locateDehydratedViewsInContainer(currentRNode, serializedViews) {
    const dehydratedViews = [];
    for (const serializedView of serializedViews) {
        // Repeats a view multiple times as needed, based on the serialized information
        // (for example, for *ngFor-produced views).
        for (let i = 0; i < (serializedView[MULTIPLIER] ?? 1); i++) {
            const view = {
                data: serializedView,
                firstChild: null,
            };
            if (serializedView[NUM_ROOT_NODES] > 0) {
                // Keep reference to the first node in this view,
                // so it can be accessed while invoking template instructions.
                view.firstChild = currentRNode;
                // Move over to the next node after this view, which can
                // either be a first node of the next view or an anchor comment
                // node after the last view in a container.
                currentRNode = siblingAfter(serializedView[NUM_ROOT_NODES], currentRNode);
            }
            dehydratedViews.push(view);
        }
    }
    return [currentRNode, dehydratedViews];
}
/**
 * Reference to a function that searches for a matching dehydrated views
 * stored on a given lContainer.
 * Returns `null` by default, when hydration is not enabled.
 */
let _findMatchingDehydratedViewImpl = (lContainer, template) => null;
/**
 * Retrieves the next dehydrated view from the LContainer and verifies that
 * it matches a given template id (from the TView that was used to create this
 * instance of a view). If the id doesn't match, that means that we are in an
 * unexpected state and can not complete the reconciliation process. Thus,
 * all dehydrated views from this LContainer are removed (including corresponding
 * DOM nodes) and the rendering is performed as if there were no dehydrated views
 * in this container.
 */
function findMatchingDehydratedViewImpl(lContainer, template) {
    const views = lContainer[DEHYDRATED_VIEWS];
    if (!template || views === null || views.length === 0) {
        return null;
    }
    const view = views[0];
    // Verify whether the first dehydrated view in the container matches
    // the template id passed to this function (that originated from a TView
    // that was used to create an instance of an embedded or component views.
    if (view.data[TEMPLATE_ID] === template) {
        // If the template id matches - extract the first view and return it.
        return views.shift();
    }
    else {
        // Otherwise, we are at the state when reconciliation can not be completed,
        // thus we remove all dehydrated views within this container (remove them
        // from internal data structures as well as delete associated elements from
        // the DOM tree).
        removeDehydratedViews(lContainer);
        return null;
    }
}
export function enableFindMatchingDehydratedViewImpl() {
    _findMatchingDehydratedViewImpl = findMatchingDehydratedViewImpl;
}
export function findMatchingDehydratedView(lContainer, template) {
    return _findMatchingDehydratedViewImpl(lContainer, template);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vdmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFHN0UsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hELE9BQU8sRUFBMEIsVUFBVSxFQUFFLGNBQWMsRUFBMkIsV0FBVyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3ZILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUdqRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGdDQUFnQyxDQUM1QyxZQUFtQixFQUNuQixlQUEwQztJQUM1QyxNQUFNLGVBQWUsR0FBOEIsRUFBRSxDQUFDO0lBQ3RELEtBQUssTUFBTSxjQUFjLElBQUksZUFBZSxFQUFFO1FBQzVDLCtFQUErRTtRQUMvRSw0Q0FBNEM7UUFDNUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFELE1BQU0sSUFBSSxHQUE0QjtnQkFDcEMsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFVBQVUsRUFBRSxJQUFJO2FBQ2pCLENBQUM7WUFDRixJQUFJLGNBQWMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RDLGlEQUFpRDtnQkFDakQsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQTJCLENBQUM7Z0JBRTlDLHdEQUF3RDtnQkFDeEQsK0RBQStEO2dCQUMvRCwyQ0FBMkM7Z0JBQzNDLFlBQVksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxFQUFFLFlBQVksQ0FBRSxDQUFDO2FBQzVFO1lBQ0QsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM1QjtLQUNGO0lBRUQsT0FBTyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILElBQUksK0JBQStCLEdBQy9CLENBQUMsVUFBc0IsRUFBRSxRQUFxQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFFNUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLDhCQUE4QixDQUNuQyxVQUFzQixFQUFFLFFBQXFCO0lBQy9DLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzNDLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNyRCxPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLG9FQUFvRTtJQUNwRSx3RUFBd0U7SUFDeEUseUVBQXlFO0lBQ3pFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxRQUFRLEVBQUU7UUFDdkMscUVBQXFFO1FBQ3JFLE9BQU8sS0FBSyxDQUFDLEtBQUssRUFBRyxDQUFDO0tBQ3ZCO1NBQU07UUFDTCwyRUFBMkU7UUFDM0UseUVBQXlFO1FBQ3pFLDJFQUEyRTtRQUMzRSxpQkFBaUI7UUFDakIscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsT0FBTyxJQUFJLENBQUM7S0FDYjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsb0NBQW9DO0lBQ2xELCtCQUErQixHQUFHLDhCQUE4QixDQUFDO0FBQ25FLENBQUM7QUFFRCxNQUFNLFVBQVUsMEJBQTBCLENBQ3RDLFVBQXNCLEVBQUUsUUFBcUI7SUFDL0MsT0FBTywrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDL0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RFSFlEUkFURURfVklFV1MsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5cbmltcG9ydCB7cmVtb3ZlRGVoeWRyYXRlZFZpZXdzfSBmcm9tICcuL2NsZWFudXAnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkQ29udGFpbmVyVmlldywgTVVMVElQTElFUiwgTlVNX1JPT1RfTk9ERVMsIFNlcmlhbGl6ZWRDb250YWluZXJWaWV3LCBURU1QTEFURV9JRH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7c2libGluZ0FmdGVyfSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcblxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCBET00gbm9kZSBhbmQgYSBzZXJpYWxpemVkIGluZm9ybWF0aW9uIGFib3V0IHRoZSB2aWV3c1xuICogaW4gYSBjb250YWluZXIsIHdhbGtzIG92ZXIgdGhlIERPTSBzdHJ1Y3R1cmUsIGNvbGxlY3RpbmcgdGhlIGxpc3Qgb2ZcbiAqIGRlaHlkcmF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihcbiAgICBjdXJyZW50Uk5vZGU6IFJOb2RlLFxuICAgIHNlcmlhbGl6ZWRWaWV3czogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSk6IFtSTm9kZSwgRGVoeWRyYXRlZENvbnRhaW5lclZpZXdbXV0ge1xuICBjb25zdCBkZWh5ZHJhdGVkVmlld3M6IERlaHlkcmF0ZWRDb250YWluZXJWaWV3W10gPSBbXTtcbiAgZm9yIChjb25zdCBzZXJpYWxpemVkVmlldyBvZiBzZXJpYWxpemVkVmlld3MpIHtcbiAgICAvLyBSZXBlYXRzIGEgdmlldyBtdWx0aXBsZSB0aW1lcyBhcyBuZWVkZWQsIGJhc2VkIG9uIHRoZSBzZXJpYWxpemVkIGluZm9ybWF0aW9uXG4gICAgLy8gKGZvciBleGFtcGxlLCBmb3IgKm5nRm9yLXByb2R1Y2VkIHZpZXdzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChzZXJpYWxpemVkVmlld1tNVUxUSVBMSUVSXSA/PyAxKTsgaSsrKSB7XG4gICAgICBjb25zdCB2aWV3OiBEZWh5ZHJhdGVkQ29udGFpbmVyVmlldyA9IHtcbiAgICAgICAgZGF0YTogc2VyaWFsaXplZFZpZXcsXG4gICAgICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgICB9O1xuICAgICAgaWYgKHNlcmlhbGl6ZWRWaWV3W05VTV9ST09UX05PREVTXSA+IDApIHtcbiAgICAgICAgLy8gS2VlcCByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IG5vZGUgaW4gdGhpcyB2aWV3LFxuICAgICAgICAvLyBzbyBpdCBjYW4gYmUgYWNjZXNzZWQgd2hpbGUgaW52b2tpbmcgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zLlxuICAgICAgICB2aWV3LmZpcnN0Q2hpbGQgPSBjdXJyZW50Uk5vZGUgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgLy8gTW92ZSBvdmVyIHRvIHRoZSBuZXh0IG5vZGUgYWZ0ZXIgdGhpcyB2aWV3LCB3aGljaCBjYW5cbiAgICAgICAgLy8gZWl0aGVyIGJlIGEgZmlyc3Qgbm9kZSBvZiB0aGUgbmV4dCB2aWV3IG9yIGFuIGFuY2hvciBjb21tZW50XG4gICAgICAgIC8vIG5vZGUgYWZ0ZXIgdGhlIGxhc3QgdmlldyBpbiBhIGNvbnRhaW5lci5cbiAgICAgICAgY3VycmVudFJOb2RlID0gc2libGluZ0FmdGVyKHNlcmlhbGl6ZWRWaWV3W05VTV9ST09UX05PREVTXSwgY3VycmVudFJOb2RlKSE7XG4gICAgICB9XG4gICAgICBkZWh5ZHJhdGVkVmlld3MucHVzaCh2aWV3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW2N1cnJlbnRSTm9kZSwgZGVoeWRyYXRlZFZpZXdzXTtcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhIG1hdGNoaW5nIGRlaHlkcmF0ZWQgdmlld3NcbiAqIHN0b3JlZCBvbiBhIGdpdmVuIGxDb250YWluZXIuXG4gKiBSZXR1cm5zIGBudWxsYCBieSBkZWZhdWx0LCB3aGVuIGh5ZHJhdGlvbiBpcyBub3QgZW5hYmxlZC5cbiAqL1xubGV0IF9maW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGw6IHR5cGVvZiBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGwgPVxuICAgIChsQ29udGFpbmVyOiBMQ29udGFpbmVyLCB0ZW1wbGF0ZTogc3RyaW5nfG51bGwpID0+IG51bGw7XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBuZXh0IGRlaHlkcmF0ZWQgdmlldyBmcm9tIHRoZSBMQ29udGFpbmVyIGFuZCB2ZXJpZmllcyB0aGF0XG4gKiBpdCBtYXRjaGVzIGEgZ2l2ZW4gdGVtcGxhdGUgaWQgKGZyb20gdGhlIFRWaWV3IHRoYXQgd2FzIHVzZWQgdG8gY3JlYXRlIHRoaXNcbiAqIGluc3RhbmNlIG9mIGEgdmlldykuIElmIHRoZSBpZCBkb2Vzbid0IG1hdGNoLCB0aGF0IG1lYW5zIHRoYXQgd2UgYXJlIGluIGFuXG4gKiB1bmV4cGVjdGVkIHN0YXRlIGFuZCBjYW4gbm90IGNvbXBsZXRlIHRoZSByZWNvbmNpbGlhdGlvbiBwcm9jZXNzLiBUaHVzLFxuICogYWxsIGRlaHlkcmF0ZWQgdmlld3MgZnJvbSB0aGlzIExDb250YWluZXIgYXJlIHJlbW92ZWQgKGluY2x1ZGluZyBjb3JyZXNwb25kaW5nXG4gKiBET00gbm9kZXMpIGFuZCB0aGUgcmVuZGVyaW5nIGlzIHBlcmZvcm1lZCBhcyBpZiB0aGVyZSB3ZXJlIG5vIGRlaHlkcmF0ZWQgdmlld3NcbiAqIGluIHRoaXMgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGwoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdGVtcGxhdGU6IHN0cmluZ3xudWxsKTogRGVoeWRyYXRlZENvbnRhaW5lclZpZXd8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXTtcbiAgaWYgKCF0ZW1wbGF0ZSB8fCB2aWV3cyA9PT0gbnVsbCB8fCB2aWV3cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCB2aWV3ID0gdmlld3NbMF07XG4gIC8vIFZlcmlmeSB3aGV0aGVyIHRoZSBmaXJzdCBkZWh5ZHJhdGVkIHZpZXcgaW4gdGhlIGNvbnRhaW5lciBtYXRjaGVzXG4gIC8vIHRoZSB0ZW1wbGF0ZSBpZCBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiAodGhhdCBvcmlnaW5hdGVkIGZyb20gYSBUVmlld1xuICAvLyB0aGF0IHdhcyB1c2VkIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhbiBlbWJlZGRlZCBvciBjb21wb25lbnQgdmlld3MuXG4gIGlmICh2aWV3LmRhdGFbVEVNUExBVEVfSURdID09PSB0ZW1wbGF0ZSkge1xuICAgIC8vIElmIHRoZSB0ZW1wbGF0ZSBpZCBtYXRjaGVzIC0gZXh0cmFjdCB0aGUgZmlyc3QgdmlldyBhbmQgcmV0dXJuIGl0LlxuICAgIHJldHVybiB2aWV3cy5zaGlmdCgpITtcbiAgfSBlbHNlIHtcbiAgICAvLyBPdGhlcndpc2UsIHdlIGFyZSBhdCB0aGUgc3RhdGUgd2hlbiByZWNvbmNpbGlhdGlvbiBjYW4gbm90IGJlIGNvbXBsZXRlZCxcbiAgICAvLyB0aHVzIHdlIHJlbW92ZSBhbGwgZGVoeWRyYXRlZCB2aWV3cyB3aXRoaW4gdGhpcyBjb250YWluZXIgKHJlbW92ZSB0aGVtXG4gICAgLy8gZnJvbSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgYXMgd2VsbCBhcyBkZWxldGUgYXNzb2NpYXRlZCBlbGVtZW50cyBmcm9tXG4gICAgLy8gdGhlIERPTSB0cmVlKS5cbiAgICByZW1vdmVEZWh5ZHJhdGVkVmlld3MobENvbnRhaW5lcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCgpIHtcbiAgX2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRlbXBsYXRlOiBzdHJpbmd8bnVsbCk6IERlaHlkcmF0ZWRDb250YWluZXJWaWV3fG51bGwge1xuICByZXR1cm4gX2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbChsQ29udGFpbmVyLCB0ZW1wbGF0ZSk7XG59XG4iXX0=