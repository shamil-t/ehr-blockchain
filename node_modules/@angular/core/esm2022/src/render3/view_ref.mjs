/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { removeFromArray } from '../util/array_utils';
import { assertEqual } from '../util/assert';
import { collectNativeNodes } from './collect_native_nodes';
import { checkNoChangesInternal, detectChangesInternal } from './instructions/change_detection';
import { markViewDirty } from './instructions/mark_view_dirty';
import { CONTAINER_HEADER_OFFSET, VIEW_REFS } from './interfaces/container';
import { isLContainer } from './interfaces/type_checks';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
import { destroyLView, detachView, detachViewFromDOM } from './node_manipulation';
import { storeLViewOnDestroy } from './util/view_utils';
export class ViewRef {
    get rootNodes() {
        const lView = this._lView;
        const tView = lView[TVIEW];
        return collectNativeNodes(tView, lView, tView.firstChild, []);
    }
    constructor(
    /**
     * This represents `LView` associated with the component when ViewRef is a ChangeDetectorRef.
     *
     * When ViewRef is created for a dynamic component, this also represents the `LView` for the
     * component.
     *
     * For a "regular" ViewRef created for an embedded view, this is the `LView` for the embedded
     * view.
     *
     * @internal
     */
    _lView, 
    /**
     * This represents the `LView` associated with the point where `ChangeDetectorRef` was
     * requested.
     *
     * This may be different from `_lView` if the `_cdRefInjectingView` is an embedded view.
     */
    _cdRefInjectingView) {
        this._lView = _lView;
        this._cdRefInjectingView = _cdRefInjectingView;
        this._appRef = null;
        this._attachedToViewContainer = false;
    }
    get context() {
        return this._lView[CONTEXT];
    }
    set context(value) {
        this._lView[CONTEXT] = value;
    }
    get destroyed() {
        return (this._lView[FLAGS] & 256 /* LViewFlags.Destroyed */) === 256 /* LViewFlags.Destroyed */;
    }
    destroy() {
        if (this._appRef) {
            this._appRef.detachView(this);
        }
        else if (this._attachedToViewContainer) {
            const parent = this._lView[PARENT];
            if (isLContainer(parent)) {
                const viewRefs = parent[VIEW_REFS];
                const index = viewRefs ? viewRefs.indexOf(this) : -1;
                if (index > -1) {
                    ngDevMode &&
                        assertEqual(index, parent.indexOf(this._lView) - CONTAINER_HEADER_OFFSET, 'An attached view should be in the same position within its container as its ViewRef in the VIEW_REFS array.');
                    detachView(parent, index);
                    removeFromArray(viewRefs, index);
                }
            }
            this._attachedToViewContainer = false;
        }
        destroyLView(this._lView[TVIEW], this._lView);
    }
    onDestroy(callback) {
        storeLViewOnDestroy(this._lView, callback);
    }
    /**
     * Marks a view and all of its ancestors dirty.
     *
     * This can be used to ensure an {@link ChangeDetectionStrategy#OnPush} component is
     * checked when it needs to be re-rendered but the two normal triggers haven't marked it
     * dirty (i.e. inputs haven't changed and events haven't fired in the view).
     *
     * <!-- TODO: Add a link to a chapter on OnPush components -->
     *
     * @usageNotes
     * ### Example
     *
     * ```typescript
     * @Component({
     *   selector: 'app-root',
     *   template: `Number of ticks: {{numberOfTicks}}`
     *   changeDetection: ChangeDetectionStrategy.OnPush,
     * })
     * class AppComponent {
     *   numberOfTicks = 0;
     *
     *   constructor(private ref: ChangeDetectorRef) {
     *     setInterval(() => {
     *       this.numberOfTicks++;
     *       // the following is required, otherwise the view will not be updated
     *       this.ref.markForCheck();
     *     }, 1000);
     *   }
     * }
     * ```
     */
    markForCheck() {
        markViewDirty(this._cdRefInjectingView || this._lView);
    }
    /**
     * Detaches the view from the change detection tree.
     *
     * Detached views will not be checked during change detection runs until they are
     * re-attached, even if they are dirty. `detach` can be used in combination with
     * {@link ChangeDetectorRef#detectChanges} to implement local change
     * detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example defines a component with a large list of readonly data.
     * Imagine the data changes constantly, many times per second. For performance reasons,
     * we want to check and update the list every five seconds. We can do that by detaching
     * the component's change detector and doing a local check every five seconds.
     *
     * ```typescript
     * class DataProvider {
     *   // in a real application the returned data will be different every time
     *   get data() {
     *     return [1,2,3,4,5];
     *   }
     * }
     *
     * @Component({
     *   selector: 'giant-list',
     *   template: `
     *     <li *ngFor="let d of dataProvider.data">Data {{d}}</li>
     *   `,
     * })
     * class GiantList {
     *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {
     *     ref.detach();
     *     setInterval(() => {
     *       this.ref.detectChanges();
     *     }, 5000);
     *   }
     * }
     *
     * @Component({
     *   selector: 'app',
     *   providers: [DataProvider],
     *   template: `
     *     <giant-list><giant-list>
     *   `,
     * })
     * class App {
     * }
     * ```
     */
    detach() {
        this._lView[FLAGS] &= ~128 /* LViewFlags.Attached */;
    }
    /**
     * Re-attaches a view to the change detection tree.
     *
     * This can be used to re-attach views that were previously detached from the tree
     * using {@link ChangeDetectorRef#detach}. Views are attached to the tree by default.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example creates a component displaying `live` data. The component will detach
     * its change detector from the main change detector tree when the component's live property
     * is set to false.
     *
     * ```typescript
     * class DataProvider {
     *   data = 1;
     *
     *   constructor() {
     *     setInterval(() => {
     *       this.data = this.data * 2;
     *     }, 500);
     *   }
     * }
     *
     * @Component({
     *   selector: 'live-data',
     *   inputs: ['live'],
     *   template: 'Data: {{dataProvider.data}}'
     * })
     * class LiveData {
     *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {}
     *
     *   set live(value) {
     *     if (value) {
     *       this.ref.reattach();
     *     } else {
     *       this.ref.detach();
     *     }
     *   }
     * }
     *
     * @Component({
     *   selector: 'app-root',
     *   providers: [DataProvider],
     *   template: `
     *     Live Update: <input type="checkbox" [(ngModel)]="live">
     *     <live-data [live]="live"><live-data>
     *   `,
     * })
     * class AppComponent {
     *   live = true;
     * }
     * ```
     */
    reattach() {
        this._lView[FLAGS] |= 128 /* LViewFlags.Attached */;
    }
    /**
     * Checks the view and its children.
     *
     * This can also be used in combination with {@link ChangeDetectorRef#detach} to implement
     * local change detection checks.
     *
     * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
     * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
     *
     * @usageNotes
     * ### Example
     *
     * The following example defines a component with a large list of readonly data.
     * Imagine, the data changes constantly, many times per second. For performance reasons,
     * we want to check and update the list every five seconds.
     *
     * We can do that by detaching the component's change detector and doing a local change detection
     * check every five seconds.
     *
     * See {@link ChangeDetectorRef#detach} for more information.
     */
    detectChanges() {
        detectChangesInternal(this._lView[TVIEW], this._lView, this.context);
    }
    /**
     * Checks the change detector and its children, and throws if any changes are detected.
     *
     * This is used in development mode to verify that running change detection doesn't
     * introduce other changes.
     */
    checkNoChanges() {
        if (ngDevMode) {
            checkNoChangesInternal(this._lView[TVIEW], this._lView, this.context);
        }
    }
    attachToViewContainerRef() {
        if (this._appRef) {
            throw new RuntimeError(902 /* RuntimeErrorCode.VIEW_ALREADY_ATTACHED */, ngDevMode && 'This view is already attached directly to the ApplicationRef!');
        }
        this._attachedToViewContainer = true;
    }
    detachFromAppRef() {
        this._appRef = null;
        detachViewFromDOM(this._lView[TVIEW], this._lView);
    }
    attachToAppRef(appRef) {
        if (this._attachedToViewContainer) {
            throw new RuntimeError(902 /* RuntimeErrorCode.VIEW_ALREADY_ATTACHED */, ngDevMode && 'This view is already attached to a ViewContainer!');
        }
        this._appRef = appRef;
    }
}
/** @internal */
export class RootViewRef extends ViewRef {
    constructor(_view) {
        super(_view);
        this._view = _view;
    }
    detectChanges() {
        const lView = this._view;
        const tView = lView[TVIEW];
        const context = lView[CONTEXT];
        detectChangesInternal(tView, lView, context, false);
    }
    checkNoChanges() {
        if (ngDevMode) {
            const lView = this._view;
            const tView = lView[TVIEW];
            const context = lView[CONTEXT];
            checkNoChangesInternal(tView, lView, context, false);
        }
    }
    get context() {
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3ZpZXdfcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBRXpELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDOUYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzdELE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBUXRELE1BQU0sT0FBTyxPQUFPO0lBSWxCLElBQUksU0FBUztRQUNYLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDMUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFF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Q0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRVEsY0FBYztRQUNyQixJQUFJLFNBQVMsRUFBRTtZQUNiLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0RDtJQUNILENBQUM7SUFFRCxJQUFhLE9BQU87UUFDbEIsT0FBTyxJQUFLLENBQUM7SUFDZixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIEludGVybmFsVmlld1JlZiwgVmlld1JlZlRyYWNrZXJ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge3JlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzfSBmcm9tICcuL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Y2hlY2tOb0NoYW5nZXNJbnRlcm5hbCwgZGV0ZWN0Q2hhbmdlc0ludGVybmFsfSBmcm9tICcuL2luc3RydWN0aW9ucy9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIFZJRVdfUkVGU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Rlc3Ryb3lMVmlldywgZGV0YWNoVmlldywgZGV0YWNoVmlld0Zyb21ET019IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtzdG9yZUxWaWV3T25EZXN0cm95fSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuLy8gTmVlZGVkIGR1ZSB0byB0c2lja2xlIGRvd25sZXZlbGluZyB3aGVyZSBtdWx0aXBsZSBgaW1wbGVtZW50c2Agd2l0aCBjbGFzc2VzIGNyZWF0ZXNcbi8vIG11bHRpcGxlIEBleHRlbmRzIGluIENsb3N1cmUgYW5ub3RhdGlvbnMsIHdoaWNoIGlzIGlsbGVnYWwuIFRoaXMgd29ya2Fyb3VuZCBmaXhlc1xuLy8gdGhlIG11bHRpcGxlIEBleHRlbmRzIGJ5IG1ha2luZyB0aGUgYW5ub3RhdGlvbiBAaW1wbGVtZW50cyBpbnN0ZWFkXG5pbnRlcmZhY2UgQ2hhbmdlRGV0ZWN0b3JSZWZJbnRlcmZhY2UgZXh0ZW5kcyBDaGFuZ2VEZXRlY3RvclJlZiB7fVxuXG5leHBvcnQgY2xhc3MgVmlld1JlZjxUPiBpbXBsZW1lbnRzIEVtYmVkZGVkVmlld1JlZjxUPiwgSW50ZXJuYWxWaWV3UmVmLCBDaGFuZ2VEZXRlY3RvclJlZkludGVyZmFjZSB7XG4gIHByaXZhdGUgX2FwcFJlZjogVmlld1JlZlRyYWNrZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyID0gZmFsc2U7XG5cbiAgZ2V0IHJvb3ROb2RlcygpOiBhbnlbXSB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9sVmlldztcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICByZXR1cm4gY29sbGVjdE5hdGl2ZU5vZGVzKHRWaWV3LCBsVmlldywgdFZpZXcuZmlyc3RDaGlsZCwgW10pO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKipcbiAgICAgICAqIFRoaXMgcmVwcmVzZW50cyBgTFZpZXdgIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29tcG9uZW50IHdoZW4gVmlld1JlZiBpcyBhIENoYW5nZURldGVjdG9yUmVmLlxuICAgICAgICpcbiAgICAgICAqIFdoZW4gVmlld1JlZiBpcyBjcmVhdGVkIGZvciBhIGR5bmFtaWMgY29tcG9uZW50LCB0aGlzIGFsc28gcmVwcmVzZW50cyB0aGUgYExWaWV3YCBmb3IgdGhlXG4gICAgICAgKiBjb21wb25lbnQuXG4gICAgICAgKlxuICAgICAgICogRm9yIGEgXCJyZWd1bGFyXCIgVmlld1JlZiBjcmVhdGVkIGZvciBhbiBlbWJlZGRlZCB2aWV3LCB0aGlzIGlzIHRoZSBgTFZpZXdgIGZvciB0aGUgZW1iZWRkZWRcbiAgICAgICAqIHZpZXcuXG4gICAgICAgKlxuICAgICAgICogQGludGVybmFsXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBfbFZpZXc6IExWaWV3LFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoaXMgcmVwcmVzZW50cyB0aGUgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIHBvaW50IHdoZXJlIGBDaGFuZ2VEZXRlY3RvclJlZmAgd2FzXG4gICAgICAgKiByZXF1ZXN0ZWQuXG4gICAgICAgKlxuICAgICAgICogVGhpcyBtYXkgYmUgZGlmZmVyZW50IGZyb20gYF9sVmlld2AgaWYgdGhlIGBfY2RSZWZJbmplY3RpbmdWaWV3YCBpcyBhbiBlbWJlZGRlZCB2aWV3LlxuICAgICAgICovXG4gICAgICBwcml2YXRlIF9jZFJlZkluamVjdGluZ1ZpZXc/OiBMVmlldykge31cblxuICBnZXQgY29udGV4dCgpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5fbFZpZXdbQ09OVEVYVF0gYXMgdW5rbm93biBhcyBUO1xuICB9XG5cbiAgc2V0IGNvbnRleHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9sVmlld1tDT05URVhUXSA9IHZhbHVlIGFzIHVua25vd24gYXMge307XG4gIH1cblxuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fbFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2FwcFJlZikge1xuICAgICAgdGhpcy5fYXBwUmVmLmRldGFjaFZpZXcodGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9hdHRhY2hlZFRvVmlld0NvbnRhaW5lcikge1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fbFZpZXdbUEFSRU5UXTtcbiAgICAgIGlmIChpc0xDb250YWluZXIocGFyZW50KSkge1xuICAgICAgICBjb25zdCB2aWV3UmVmcyA9IHBhcmVudFtWSUVXX1JFRlNdIGFzIFZpZXdSZWY8dW5rbm93bj5bXSB8IG51bGw7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdmlld1JlZnMgPyB2aWV3UmVmcy5pbmRleE9mKHRoaXMpIDogLTE7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgaW5kZXgsIHBhcmVudC5pbmRleE9mKHRoaXMuX2xWaWV3KSAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULFxuICAgICAgICAgICAgICAgICAgJ0FuIGF0dGFjaGVkIHZpZXcgc2hvdWxkIGJlIGluIHRoZSBzYW1lIHBvc2l0aW9uIHdpdGhpbiBpdHMgY29udGFpbmVyIGFzIGl0cyBWaWV3UmVmIGluIHRoZSBWSUVXX1JFRlMgYXJyYXkuJyk7XG4gICAgICAgICAgZGV0YWNoVmlldyhwYXJlbnQsIGluZGV4KTtcbiAgICAgICAgICByZW1vdmVGcm9tQXJyYXkodmlld1JlZnMhLCBpbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyID0gZmFsc2U7XG4gICAgfVxuICAgIGRlc3Ryb3lMVmlldyh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pIHtcbiAgICBzdG9yZUxWaWV3T25EZXN0cm95KHRoaXMuX2xWaWV3LCBjYWxsYmFjayBhcyAoKSA9PiB2b2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHZpZXcgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGRpcnR5LlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGVuc3VyZSBhbiB7QGxpbmsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kjT25QdXNofSBjb21wb25lbnQgaXNcbiAgICogY2hlY2tlZCB3aGVuIGl0IG5lZWRzIHRvIGJlIHJlLXJlbmRlcmVkIGJ1dCB0aGUgdHdvIG5vcm1hbCB0cmlnZ2VycyBoYXZlbid0IG1hcmtlZCBpdFxuICAgKiBkaXJ0eSAoaS5lLiBpbnB1dHMgaGF2ZW4ndCBjaGFuZ2VkIGFuZCBldmVudHMgaGF2ZW4ndCBmaXJlZCBpbiB0aGUgdmlldykuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gT25QdXNoIGNvbXBvbmVudHMgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAtcm9vdCcsXG4gICAqICAgdGVtcGxhdGU6IGBOdW1iZXIgb2YgdGlja3M6IHt7bnVtYmVyT2ZUaWNrc319YFxuICAgKiAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICAgKiB9KVxuICAgKiBjbGFzcyBBcHBDb21wb25lbnQge1xuICAgKiAgIG51bWJlck9mVGlja3MgPSAwO1xuICAgKlxuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLm51bWJlck9mVGlja3MrKztcbiAgICogICAgICAgLy8gdGhlIGZvbGxvd2luZyBpcyByZXF1aXJlZCwgb3RoZXJ3aXNlIHRoZSB2aWV3IHdpbGwgbm90IGJlIHVwZGF0ZWRcbiAgICogICAgICAgdGhpcy5yZWYubWFya0ZvckNoZWNrKCk7XG4gICAqICAgICB9LCAxMDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBtYXJrRm9yQ2hlY2soKTogdm9pZCB7XG4gICAgbWFya1ZpZXdEaXJ0eSh0aGlzLl9jZFJlZkluamVjdGluZ1ZpZXcgfHwgdGhpcy5fbFZpZXcpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIHRoZSB2aWV3IGZyb20gdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS5cbiAgICpcbiAgICogRGV0YWNoZWQgdmlld3Mgd2lsbCBub3QgYmUgY2hlY2tlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBydW5zIHVudGlsIHRoZXkgYXJlXG4gICAqIHJlLWF0dGFjaGVkLCBldmVuIGlmIHRoZXkgYXJlIGRpcnR5LiBgZGV0YWNoYCBjYW4gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoXG4gICAqIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRlY3RDaGFuZ2VzfSB0byBpbXBsZW1lbnQgbG9jYWwgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBjaGVja3MuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byBhIGNoYXB0ZXIgb24gZGV0YWNoL3JlYXR0YWNoL2xvY2FsIGRpZ2VzdCAtLT5cbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaXZlIGRlbW8gb25jZSByZWYuZGV0ZWN0Q2hhbmdlcyBpcyBtZXJnZWQgaW50byBtYXN0ZXIgLS0+XG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgY29tcG9uZW50IHdpdGggYSBsYXJnZSBsaXN0IG9mIHJlYWRvbmx5IGRhdGEuXG4gICAqIEltYWdpbmUgdGhlIGRhdGEgY2hhbmdlcyBjb25zdGFudGx5LCBtYW55IHRpbWVzIHBlciBzZWNvbmQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLFxuICAgKiB3ZSB3YW50IHRvIGNoZWNrIGFuZCB1cGRhdGUgdGhlIGxpc3QgZXZlcnkgZml2ZSBzZWNvbmRzLiBXZSBjYW4gZG8gdGhhdCBieSBkZXRhY2hpbmdcbiAgICogdGhlIGNvbXBvbmVudCdzIGNoYW5nZSBkZXRlY3RvciBhbmQgZG9pbmcgYSBsb2NhbCBjaGVjayBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY2xhc3MgRGF0YVByb3ZpZGVyIHtcbiAgICogICAvLyBpbiBhIHJlYWwgYXBwbGljYXRpb24gdGhlIHJldHVybmVkIGRhdGEgd2lsbCBiZSBkaWZmZXJlbnQgZXZlcnkgdGltZVxuICAgKiAgIGdldCBkYXRhKCkge1xuICAgKiAgICAgcmV0dXJuIFsxLDIsMyw0LDVdO1xuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICBzZWxlY3RvcjogJ2dpYW50LWxpc3QnLFxuICAgKiAgIHRlbXBsYXRlOiBgXG4gICAqICAgICA8bGkgKm5nRm9yPVwibGV0IGQgb2YgZGF0YVByb3ZpZGVyLmRhdGFcIj5EYXRhIHt7ZH19PC9saT5cbiAgICogICBgLFxuICAgKiB9KVxuICAgKiBjbGFzcyBHaWFudExpc3Qge1xuICAgKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZiwgcHJpdmF0ZSBkYXRhUHJvdmlkZXI6IERhdGFQcm92aWRlcikge1xuICAgKiAgICAgcmVmLmRldGFjaCgpO1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAqICAgICB9LCA1MDAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdhcHAnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIDxnaWFudC1saXN0PjxnaWFudC1saXN0PlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcCB7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBkZXRhY2goKTogdm9pZCB7XG4gICAgdGhpcy5fbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlLWF0dGFjaGVzIGEgdmlldyB0byB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlLWF0dGFjaCB2aWV3cyB0aGF0IHdlcmUgcHJldmlvdXNseSBkZXRhY2hlZCBmcm9tIHRoZSB0cmVlXG4gICAqIHVzaW5nIHtAbGluayBDaGFuZ2VEZXRlY3RvclJlZiNkZXRhY2h9LiBWaWV3cyBhcmUgYXR0YWNoZWQgdG8gdGhlIHRyZWUgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIGEgY2hhcHRlciBvbiBkZXRhY2gvcmVhdHRhY2gvbG9jYWwgZGlnZXN0IC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgY3JlYXRlcyBhIGNvbXBvbmVudCBkaXNwbGF5aW5nIGBsaXZlYCBkYXRhLiBUaGUgY29tcG9uZW50IHdpbGwgZGV0YWNoXG4gICAqIGl0cyBjaGFuZ2UgZGV0ZWN0b3IgZnJvbSB0aGUgbWFpbiBjaGFuZ2UgZGV0ZWN0b3IgdHJlZSB3aGVuIHRoZSBjb21wb25lbnQncyBsaXZlIHByb3BlcnR5XG4gICAqIGlzIHNldCB0byBmYWxzZS5cbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBEYXRhUHJvdmlkZXIge1xuICAgKiAgIGRhdGEgPSAxO1xuICAgKlxuICAgKiAgIGNvbnN0cnVjdG9yKCkge1xuICAgKiAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgKiAgICAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEgKiAyO1xuICAgKiAgICAgfSwgNTAwKTtcbiAgICogICB9XG4gICAqIH1cbiAgICpcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgc2VsZWN0b3I6ICdsaXZlLWRhdGEnLFxuICAgKiAgIGlucHV0czogWydsaXZlJ10sXG4gICAqICAgdGVtcGxhdGU6ICdEYXRhOiB7e2RhdGFQcm92aWRlci5kYXRhfX0nXG4gICAqIH0pXG4gICAqIGNsYXNzIExpdmVEYXRhIHtcbiAgICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsIHByaXZhdGUgZGF0YVByb3ZpZGVyOiBEYXRhUHJvdmlkZXIpIHt9XG4gICAqXG4gICAqICAgc2V0IGxpdmUodmFsdWUpIHtcbiAgICogICAgIGlmICh2YWx1ZSkge1xuICAgKiAgICAgICB0aGlzLnJlZi5yZWF0dGFjaCgpO1xuICAgKiAgICAgfSBlbHNlIHtcbiAgICogICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7XG4gICAqICAgICB9XG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBDb21wb25lbnQoe1xuICAgKiAgIHNlbGVjdG9yOiAnYXBwLXJvb3QnLFxuICAgKiAgIHByb3ZpZGVyczogW0RhdGFQcm92aWRlcl0sXG4gICAqICAgdGVtcGxhdGU6IGBcbiAgICogICAgIExpdmUgVXBkYXRlOiA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgWyhuZ01vZGVsKV09XCJsaXZlXCI+XG4gICAqICAgICA8bGl2ZS1kYXRhIFtsaXZlXT1cImxpdmVcIj48bGl2ZS1kYXRhPlxuICAgKiAgIGAsXG4gICAqIH0pXG4gICAqIGNsYXNzIEFwcENvbXBvbmVudCB7XG4gICAqICAgbGl2ZSA9IHRydWU7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICByZWF0dGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl9sVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIHZpZXcgYW5kIGl0cyBjaGlsZHJlbi5cbiAgICpcbiAgICogVGhpcyBjYW4gYWxzbyBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGgge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaH0gdG8gaW1wbGVtZW50XG4gICAqIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb24gY2hlY2tzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gYSBjaGFwdGVyIG9uIGRldGFjaC9yZWF0dGFjaC9sb2NhbCBkaWdlc3QgLS0+XG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGl2ZSBkZW1vIG9uY2UgcmVmLmRldGVjdENoYW5nZXMgaXMgbWVyZ2VkIGludG8gbWFzdGVyIC0tPlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgZGVmaW5lcyBhIGNvbXBvbmVudCB3aXRoIGEgbGFyZ2UgbGlzdCBvZiByZWFkb25seSBkYXRhLlxuICAgKiBJbWFnaW5lLCB0aGUgZGF0YSBjaGFuZ2VzIGNvbnN0YW50bHksIG1hbnkgdGltZXMgcGVyIHNlY29uZC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsXG4gICAqIHdlIHdhbnQgdG8gY2hlY2sgYW5kIHVwZGF0ZSB0aGUgbGlzdCBldmVyeSBmaXZlIHNlY29uZHMuXG4gICAqXG4gICAqIFdlIGNhbiBkbyB0aGF0IGJ5IGRldGFjaGluZyB0aGUgY29tcG9uZW50J3MgY2hhbmdlIGRldGVjdG9yIGFuZCBkb2luZyBhIGxvY2FsIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogY2hlY2sgZXZlcnkgZml2ZSBzZWNvbmRzLlxuICAgKlxuICAgKiBTZWUge0BsaW5rIENoYW5nZURldGVjdG9yUmVmI2RldGFjaH0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKCk6IHZvaWQge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gICAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbCh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3LCB0aGlzLmNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gICAgfVxuICB9XG5cbiAgYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKCkge1xuICAgIGlmICh0aGlzLl9hcHBSZWYpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5WSUVXX0FMUkVBRFlfQVRUQUNIRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCBkaXJlY3RseSB0byB0aGUgQXBwbGljYXRpb25SZWYhJyk7XG4gICAgfVxuICAgIHRoaXMuX2F0dGFjaGVkVG9WaWV3Q29udGFpbmVyID0gdHJ1ZTtcbiAgfVxuXG4gIGRldGFjaEZyb21BcHBSZWYoKSB7XG4gICAgdGhpcy5fYXBwUmVmID0gbnVsbDtcbiAgICBkZXRhY2hWaWV3RnJvbURPTSh0aGlzLl9sVmlld1tUVklFV10sIHRoaXMuX2xWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFRvQXBwUmVmKGFwcFJlZjogVmlld1JlZlRyYWNrZXIpIHtcbiAgICBpZiAodGhpcy5fYXR0YWNoZWRUb1ZpZXdDb250YWluZXIpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5WSUVXX0FMUkVBRFlfQVRUQUNIRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIHRoaXMuX2FwcFJlZiA9IGFwcFJlZjtcbiAgfVxufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgY2xhc3MgUm9vdFZpZXdSZWY8VD4gZXh0ZW5kcyBWaWV3UmVmPFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIF92aWV3OiBMVmlldykge1xuICAgIHN1cGVyKF92aWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRldGVjdENoYW5nZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl92aWV3O1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tDT05URVhUXTtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodFZpZXcsIGxWaWV3LCBjb250ZXh0LCBmYWxzZSk7XG4gIH1cblxuICBvdmVycmlkZSBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBjb25zdCBsVmlldyA9IHRoaXMuX3ZpZXc7XG4gICAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tDT05URVhUXTtcbiAgICAgIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWwodFZpZXcsIGxWaWV3LCBjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGNvbnRleHQoKTogVCB7XG4gICAgcmV0dXJuIG51bGwhO1xuICB9XG59XG4iXX0=