/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CONTAINER_HEADER_OFFSET, DEHYDRATED_VIEWS } from '../render3/interfaces/container';
import { isLContainer, isLView } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW } from '../render3/interfaces/view';
import { nativeRemoveNode } from '../render3/node_manipulation';
import { EMPTY_ARRAY } from '../util/empty';
import { validateSiblingNodeExists } from './error_handling';
import { NUM_ROOT_NODES } from './interfaces';
import { getLNodeForHydration } from './utils';
/**
 * Removes all dehydrated views from a given LContainer:
 * both in internal data structure, as well as removing
 * corresponding DOM nodes that belong to that dehydrated view.
 */
export function removeDehydratedViews(lContainer) {
    const views = lContainer[DEHYDRATED_VIEWS] ?? [];
    const parentLView = lContainer[PARENT];
    const renderer = parentLView[RENDERER];
    for (const view of views) {
        removeDehydratedView(view, renderer);
        ngDevMode && ngDevMode.dehydratedViewsRemoved++;
    }
    // Reset the value to an empty array to indicate that no
    // further processing of dehydrated views is needed for
    // this view container (i.e. do not trigger the lookup process
    // once again in case a `ViewContainerRef` is created later).
    lContainer[DEHYDRATED_VIEWS] = EMPTY_ARRAY;
}
/**
 * Helper function to remove all nodes from a dehydrated view.
 */
function removeDehydratedView(dehydratedView, renderer) {
    let nodesRemoved = 0;
    let currentRNode = dehydratedView.firstChild;
    if (currentRNode) {
        const numNodes = dehydratedView.data[NUM_ROOT_NODES];
        while (nodesRemoved < numNodes) {
            ngDevMode && validateSiblingNodeExists(currentRNode);
            const nextSibling = currentRNode.nextSibling;
            nativeRemoveNode(renderer, currentRNode, false);
            currentRNode = nextSibling;
            nodesRemoved++;
        }
    }
}
/**
 * Walks over all views within this LContainer invokes dehydrated views
 * cleanup function for each one.
 */
function cleanupLContainer(lContainer) {
    removeDehydratedViews(lContainer);
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        cleanupLView(lContainer[i]);
    }
}
/**
 * Walks over `LContainer`s and components registered within
 * this LView and invokes dehydrated views cleanup function for each one.
 */
function cleanupLView(lView) {
    const tView = lView[TVIEW];
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        if (isLContainer(lView[i])) {
            const lContainer = lView[i];
            cleanupLContainer(lContainer);
        }
        else if (Array.isArray(lView[i])) {
            // This is a component, enter the `cleanupLView` recursively.
            cleanupLView(lView[i]);
        }
    }
}
/**
 * Walks over all views registered within the ApplicationRef and removes
 * all dehydrated views from all `LContainer`s along the way.
 */
export function cleanupDehydratedViews(appRef) {
    const viewRefs = appRef._views;
    for (const viewRef of viewRefs) {
        const lNode = getLNodeForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lNode !== null && lNode[HOST] !== null) {
            if (isLView(lNode)) {
                cleanupLView(lNode);
            }
            else {
                // Cleanup in the root component view
                const componentLView = lNode[HOST];
                cleanupLView(componentLView);
                // Cleanup in all views within this view container
                cleanupLContainer(lNode);
            }
            ngDevMode && ngDevMode.dehydratedViewsCleanupRuns++;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW51cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2h5ZHJhdGlvbi9jbGVhbnVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBR3RHLE9BQU8sRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDeEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQVMsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMvRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFDLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzNELE9BQU8sRUFBMEIsY0FBYyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU3Qzs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFVBQXNCO0lBQzFELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqRCxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLG9CQUFvQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNyQyxTQUFTLElBQUksU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUM7S0FDakQ7SUFDRCx3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Z2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIERFSFlEUkFURURfVklFV1MsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJlcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBQQVJFTlQsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtuYXRpdmVSZW1vdmVOb2RlfSBmcm9tICcuLi9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uL3V0aWwvZW1wdHknO1xuXG5pbXBvcnQge3ZhbGlkYXRlU2libGluZ05vZGVFeGlzdHN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkQ29udGFpbmVyVmlldywgTlVNX1JPT1RfTk9ERVN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldExOb2RlRm9ySHlkcmF0aW9ufSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBkZWh5ZHJhdGVkIHZpZXdzIGZyb20gYSBnaXZlbiBMQ29udGFpbmVyOlxuICogYm90aCBpbiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSwgYXMgd2VsbCBhcyByZW1vdmluZ1xuICogY29ycmVzcG9uZGluZyBET00gbm9kZXMgdGhhdCBiZWxvbmcgdG8gdGhhdCBkZWh5ZHJhdGVkIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWh5ZHJhdGVkVmlld3MobENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbREVIWURSQVRFRF9WSUVXU10gPz8gW107XG4gIGNvbnN0IHBhcmVudExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCByZW5kZXJlciA9IHBhcmVudExWaWV3W1JFTkRFUkVSXTtcbiAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgcmVtb3ZlRGVoeWRyYXRlZFZpZXcodmlldywgcmVuZGVyZXIpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZGVoeWRyYXRlZFZpZXdzUmVtb3ZlZCsrO1xuICB9XG4gIC8vIFJlc2V0IHRoZSB2YWx1ZSB0byBhbiBlbXB0eSBhcnJheSB0byBpbmRpY2F0ZSB0aGF0IG5vXG4gIC8vIGZ1cnRoZXIgcHJvY2Vzc2luZyBvZiBkZWh5ZHJhdGVkIHZpZXdzIGlzIG5lZWRlZCBmb3JcbiAgLy8gdGhpcyB2aWV3IGNvbnRhaW5lciAoaS5lLiBkbyBub3QgdHJpZ2dlciB0aGUgbG9va3VwIHByb2Nlc3NcbiAgLy8gb25jZSBhZ2FpbiBpbiBjYXNlIGEgYFZpZXdDb250YWluZXJSZWZgIGlzIGNyZWF0ZWQgbGF0ZXIpLlxuICBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdID0gRU1QVFlfQVJSQVk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHJlbW92ZSBhbGwgbm9kZXMgZnJvbSBhIGRlaHlkcmF0ZWQgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRGVoeWRyYXRlZFZpZXcoZGVoeWRyYXRlZFZpZXc6IERlaHlkcmF0ZWRDb250YWluZXJWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgbGV0IG5vZGVzUmVtb3ZlZCA9IDA7XG4gIGxldCBjdXJyZW50Uk5vZGUgPSBkZWh5ZHJhdGVkVmlldy5maXJzdENoaWxkO1xuICBpZiAoY3VycmVudFJOb2RlKSB7XG4gICAgY29uc3QgbnVtTm9kZXMgPSBkZWh5ZHJhdGVkVmlldy5kYXRhW05VTV9ST09UX05PREVTXTtcbiAgICB3aGlsZSAobm9kZXNSZW1vdmVkIDwgbnVtTm9kZXMpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVNpYmxpbmdOb2RlRXhpc3RzKGN1cnJlbnRSTm9kZSk7XG4gICAgICBjb25zdCBuZXh0U2libGluZzogUk5vZGUgPSBjdXJyZW50Uk5vZGUubmV4dFNpYmxpbmchO1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlciwgY3VycmVudFJOb2RlLCBmYWxzZSk7XG4gICAgICBjdXJyZW50Uk5vZGUgPSBuZXh0U2libGluZztcbiAgICAgIG5vZGVzUmVtb3ZlZCsrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdhbGtzIG92ZXIgYWxsIHZpZXdzIHdpdGhpbiB0aGlzIExDb250YWluZXIgaW52b2tlcyBkZWh5ZHJhdGVkIHZpZXdzXG4gKiBjbGVhbnVwIGZ1bmN0aW9uIGZvciBlYWNoIG9uZS5cbiAqL1xuZnVuY3Rpb24gY2xlYW51cExDb250YWluZXIobENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICByZW1vdmVEZWh5ZHJhdGVkVmlld3MobENvbnRhaW5lcik7XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjbGVhbnVwTFZpZXcobENvbnRhaW5lcltpXSBhcyBMVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBXYWxrcyBvdmVyIGBMQ29udGFpbmVyYHMgYW5kIGNvbXBvbmVudHMgcmVnaXN0ZXJlZCB3aXRoaW5cbiAqIHRoaXMgTFZpZXcgYW5kIGludm9rZXMgZGVoeWRyYXRlZCB2aWV3cyBjbGVhbnVwIGZ1bmN0aW9uIGZvciBlYWNoIG9uZS5cbiAqL1xuZnVuY3Rpb24gY2xlYW51cExWaWV3KGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpXTtcbiAgICAgIGNsZWFudXBMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGVudGVyIHRoZSBgY2xlYW51cExWaWV3YCByZWN1cnNpdmVseS5cbiAgICAgIGNsZWFudXBMVmlldyhsVmlld1tpXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV2Fsa3Mgb3ZlciBhbGwgdmlld3MgcmVnaXN0ZXJlZCB3aXRoaW4gdGhlIEFwcGxpY2F0aW9uUmVmIGFuZCByZW1vdmVzXG4gKiBhbGwgZGVoeWRyYXRlZCB2aWV3cyBmcm9tIGFsbCBgTENvbnRhaW5lcmBzIGFsb25nIHRoZSB3YXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwRGVoeWRyYXRlZFZpZXdzKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxOb2RlICE9PSBudWxsICYmIGxOb2RlW0hPU1RdICE9PSBudWxsKSB7XG4gICAgICBpZiAoaXNMVmlldyhsTm9kZSkpIHtcbiAgICAgICAgY2xlYW51cExWaWV3KGxOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENsZWFudXAgaW4gdGhlIHJvb3QgY29tcG9uZW50IHZpZXdcbiAgICAgICAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsTm9kZVtIT1NUXSBhcyBMVmlldzx1bmtub3duPjtcbiAgICAgICAgY2xlYW51cExWaWV3KGNvbXBvbmVudExWaWV3KTtcblxuICAgICAgICAvLyBDbGVhbnVwIGluIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyB2aWV3IGNvbnRhaW5lclxuICAgICAgICBjbGVhbnVwTENvbnRhaW5lcihsTm9kZSk7XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmRlaHlkcmF0ZWRWaWV3c0NsZWFudXBSdW5zKys7XG4gICAgfVxuICB9XG59XG4iXX0=