/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, Pipe, untracked, ɵisPromise, ɵisSubscribable } from '@angular/core';
import { invalidPipeArgumentError } from './invalid_pipe_argument_error';
import * as i0 from "@angular/core";
class SubscribableStrategy {
    createSubscription(async, updateLatestValue) {
        // Subscription can be side-effectful, and we don't want any signal reads which happen in the
        // side effect of the subscription to be tracked by a component's template when that
        // subscription is triggered via the async pipe. So we wrap the subscription in `untracked` to
        // decouple from the current reactive context.
        //
        // `untracked` also prevents signal _writes_ which happen in the subscription side effect from
        // being treated as signal writes during the template evaluation (which throws errors).
        return untracked(() => async.subscribe({
            next: updateLatestValue,
            error: (e) => {
                throw e;
            }
        }));
    }
    dispose(subscription) {
        // See the comment in `createSubscription` above on the use of `untracked`.
        untracked(() => subscription.unsubscribe());
    }
}
class PromiseStrategy {
    createSubscription(async, updateLatestValue) {
        return async.then(updateLatestValue, e => {
            throw e;
        });
    }
    dispose(subscription) { }
}
const _promiseStrategy = new PromiseStrategy();
const _subscribableStrategy = new SubscribableStrategy();
/**
 * @ngModule CommonModule
 * @description
 *
 * Unwraps a value from an asynchronous primitive.
 *
 * The `async` pipe subscribes to an `Observable` or `Promise` and returns the latest value it has
 * emitted. When a new value is emitted, the `async` pipe marks the component to be checked for
 * changes. When the component gets destroyed, the `async` pipe unsubscribes automatically to avoid
 * potential memory leaks. When the reference of the expression changes, the `async` pipe
 * automatically unsubscribes from the old `Observable` or `Promise` and subscribes to the new one.
 *
 * @usageNotes
 *
 * ### Examples
 *
 * This example binds a `Promise` to the view. Clicking the `Resolve` button resolves the
 * promise.
 *
 * {@example common/pipes/ts/async_pipe.ts region='AsyncPipePromise'}
 *
 * It's also possible to use `async` with Observables. The example below binds the `time` Observable
 * to the view. The Observable continuously updates the view with the current time.
 *
 * {@example common/pipes/ts/async_pipe.ts region='AsyncPipeObservable'}
 *
 * @publicApi
 */
export class AsyncPipe {
    constructor(ref) {
        this._latestValue = null;
        this._subscription = null;
        this._obj = null;
        this._strategy = null;
        // Assign `ref` into `this._ref` manually instead of declaring `_ref` in the constructor
        // parameter list, as the type of `this._ref` includes `null` unlike the type of `ref`.
        this._ref = ref;
    }
    ngOnDestroy() {
        if (this._subscription) {
            this._dispose();
        }
        // Clear the `ChangeDetectorRef` and its association with the view data, to mitigate
        // potential memory leaks in Observables that could otherwise cause the view data to
        // be retained.
        // https://github.com/angular/angular/issues/17624
        this._ref = null;
    }
    transform(obj) {
        if (!this._obj) {
            if (obj) {
                this._subscribe(obj);
            }
            return this._latestValue;
        }
        if (obj !== this._obj) {
            this._dispose();
            return this.transform(obj);
        }
        return this._latestValue;
    }
    _subscribe(obj) {
        this._obj = obj;
        this._strategy = this._selectStrategy(obj);
        this._subscription = this._strategy.createSubscription(obj, (value) => this._updateLatestValue(obj, value));
    }
    _selectStrategy(obj) {
        if (ɵisPromise(obj)) {
            return _promiseStrategy;
        }
        if (ɵisSubscribable(obj)) {
            return _subscribableStrategy;
        }
        throw invalidPipeArgumentError(AsyncPipe, obj);
    }
    _dispose() {
        // Note: `dispose` is only called if a subscription has been initialized before, indicating
        // that `this._strategy` is also available.
        this._strategy.dispose(this._subscription);
        this._latestValue = null;
        this._subscription = null;
        this._obj = null;
    }
    _updateLatestValue(async, value) {
        if (async === this._obj) {
            this._latestValue = value;
            // Note: `this._ref` is only cleared in `ngOnDestroy` so is known to be available when a
            // value is being updated.
            this._ref.markForCheck();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AsyncPipe, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Pipe }); }
    static { this.ɵpipe = i0.ɵɵngDeclarePipe({ minVersion: "14.0.0", version: "16.2.12", ngImport: i0, type: AsyncPipe, isStandalone: true, name: "async", pure: false }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: AsyncPipe, decorators: [{
            type: Pipe,
            args: [{
                    name: 'async',
                    pure: false,
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9zcmMvcGlwZXMvYXN5bmNfcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQTJCLElBQUksRUFBaUIsU0FBUyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHdEksT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sK0JBQStCLENBQUM7O0FBUXZFLE1BQU0sb0JBQW9CO0lBQ3hCLGtCQUFrQixDQUFDLEtBQXdCLEVBQUUsaUJBQXNCO1FBQ2pFLDZGQUE2RjtRQUM3RixvRkFBb0Y7UUFDcEYsOEZBQThGO1FBQzlGLDhDQUE4QztRQUM5QyxFQUFFO1FBQ0YsOEZBQThGO1FBQzlGLHVGQUF1RjtRQUN2RixPQUFPLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ3JDLElBQUksRUFBRSxpQkFBaUI7WUFDdkIsS0FBSyxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQ2hCLE1BQU0sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztTQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU8sQ0FBQyxZQUE0QjtRQUNsQywyRUFBMkU7UUFDM0UsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQUVELE1BQU0sZUFBZTtJQUNuQixrQkFBa0IsQ0FBQyxLQUFtQixFQUFFLGlCQUFrQztRQUN4RSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDdkMsTUFBTSxDQUFDLENBQUM7UUFDVixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLENBQUMs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QkFBQztvQkFDSixJQUFJLEVBQUUsT0FBTztvQkFDYixJQUFJLEVBQUUsS0FBSztvQkFDWCxVQUFVLEVBQUUsSUFBSTtpQkFDakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgRXZlbnRFbWl0dGVyLCBPbkRlc3Ryb3ksIFBpcGUsIFBpcGVUcmFuc2Zvcm0sIHVudHJhY2tlZCwgybVpc1Byb21pc2UsIMm1aXNTdWJzY3JpYmFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJzY3JpYmFibGUsIFVuc3Vic2NyaWJhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtpbnZhbGlkUGlwZUFyZ3VtZW50RXJyb3J9IGZyb20gJy4vaW52YWxpZF9waXBlX2FyZ3VtZW50X2Vycm9yJztcblxuaW50ZXJmYWNlIFN1YnNjcmlwdGlvblN0cmF0ZWd5IHtcbiAgY3JlYXRlU3Vic2NyaXB0aW9uKGFzeW5jOiBTdWJzY3JpYmFibGU8YW55PnxQcm9taXNlPGFueT4sIHVwZGF0ZUxhdGVzdFZhbHVlOiBhbnkpOiBVbnN1YnNjcmliYWJsZVxuICAgICAgfFByb21pc2U8YW55PjtcbiAgZGlzcG9zZShzdWJzY3JpcHRpb246IFVuc3Vic2NyaWJhYmxlfFByb21pc2U8YW55Pik6IHZvaWQ7XG59XG5cbmNsYXNzIFN1YnNjcmliYWJsZVN0cmF0ZWd5IGltcGxlbWVudHMgU3Vic2NyaXB0aW9uU3RyYXRlZ3kge1xuICBjcmVhdGVTdWJzY3JpcHRpb24oYXN5bmM6IFN1YnNjcmliYWJsZTxhbnk+LCB1cGRhdGVMYXRlc3RWYWx1ZTogYW55KTogVW5zdWJzY3JpYmFibGUge1xuICAgIC8vIFN1YnNjcmlwdGlvbiBjYW4gYmUgc2lkZS1lZmZlY3RmdWwsIGFuZCB3ZSBkb24ndCB3YW50IGFueSBzaWduYWwgcmVhZHMgd2hpY2ggaGFwcGVuIGluIHRoZVxuICAgIC8vIHNpZGUgZWZmZWN0IG9mIHRoZSBzdWJzY3JpcHRpb24gdG8gYmUgdHJhY2tlZCBieSBhIGNvbXBvbmVudCdzIHRlbXBsYXRlIHdoZW4gdGhhdFxuICAgIC8vIHN1YnNjcmlwdGlvbiBpcyB0cmlnZ2VyZWQgdmlhIHRoZSBhc3luYyBwaXBlLiBTbyB3ZSB3cmFwIHRoZSBzdWJzY3JpcHRpb24gaW4gYHVudHJhY2tlZGAgdG9cbiAgICAvLyBkZWNvdXBsZSBmcm9tIHRoZSBjdXJyZW50IHJlYWN0aXZlIGNvbnRleHQuXG4gICAgLy9cbiAgICAvLyBgdW50cmFja2VkYCBhbHNvIHByZXZlbnRzIHNpZ25hbCBfd3JpdGVzXyB3aGljaCBoYXBwZW4gaW4gdGhlIHN1YnNjcmlwdGlvbiBzaWRlIGVmZmVjdCBmcm9tXG4gICAgLy8gYmVpbmcgdHJlYXRlZCBhcyBzaWduYWwgd3JpdGVzIGR1cmluZyB0aGUgdGVtcGxhdGUgZXZhbHVhdGlvbiAod2hpY2ggdGhyb3dzIGVycm9ycykuXG4gICAgcmV0dXJuIHVudHJhY2tlZCgoKSA9PiBhc3luYy5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogdXBkYXRlTGF0ZXN0VmFsdWUsXG4gICAgICBlcnJvcjogKGU6IGFueSkgPT4ge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH0pKTtcbiAgfVxuXG4gIGRpc3Bvc2Uoc3Vic2NyaXB0aW9uOiBVbnN1YnNjcmliYWJsZSk6IHZvaWQge1xuICAgIC8vIFNlZSB0aGUgY29tbWVudCBpbiBgY3JlYXRlU3Vic2NyaXB0aW9uYCBhYm92ZSBvbiB0aGUgdXNlIG9mIGB1bnRyYWNrZWRgLlxuICAgIHVudHJhY2tlZCgoKSA9PiBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKSk7XG4gIH1cbn1cblxuY2xhc3MgUHJvbWlzZVN0cmF0ZWd5IGltcGxlbWVudHMgU3Vic2NyaXB0aW9uU3RyYXRlZ3kge1xuICBjcmVhdGVTdWJzY3JpcHRpb24oYXN5bmM6IFByb21pc2U8YW55PiwgdXBkYXRlTGF0ZXN0VmFsdWU6ICh2OiBhbnkpID0+IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIGFzeW5jLnRoZW4odXBkYXRlTGF0ZXN0VmFsdWUsIGUgPT4ge1xuICAgICAgdGhyb3cgZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3Bvc2Uoc3Vic2NyaXB0aW9uOiBQcm9taXNlPGFueT4pOiB2b2lkIHt9XG59XG5cbmNvbnN0IF9wcm9taXNlU3RyYXRlZ3kgPSBuZXcgUHJvbWlzZVN0cmF0ZWd5KCk7XG5jb25zdCBfc3Vic2NyaWJhYmxlU3RyYXRlZ3kgPSBuZXcgU3Vic2NyaWJhYmxlU3RyYXRlZ3koKTtcblxuLyoqXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBVbndyYXBzIGEgdmFsdWUgZnJvbSBhbiBhc3luY2hyb25vdXMgcHJpbWl0aXZlLlxuICpcbiAqIFRoZSBgYXN5bmNgIHBpcGUgc3Vic2NyaWJlcyB0byBhbiBgT2JzZXJ2YWJsZWAgb3IgYFByb21pc2VgIGFuZCByZXR1cm5zIHRoZSBsYXRlc3QgdmFsdWUgaXQgaGFzXG4gKiBlbWl0dGVkLiBXaGVuIGEgbmV3IHZhbHVlIGlzIGVtaXR0ZWQsIHRoZSBgYXN5bmNgIHBpcGUgbWFya3MgdGhlIGNvbXBvbmVudCB0byBiZSBjaGVja2VkIGZvclxuICogY2hhbmdlcy4gV2hlbiB0aGUgY29tcG9uZW50IGdldHMgZGVzdHJveWVkLCB0aGUgYGFzeW5jYCBwaXBlIHVuc3Vic2NyaWJlcyBhdXRvbWF0aWNhbGx5IHRvIGF2b2lkXG4gKiBwb3RlbnRpYWwgbWVtb3J5IGxlYWtzLiBXaGVuIHRoZSByZWZlcmVuY2Ugb2YgdGhlIGV4cHJlc3Npb24gY2hhbmdlcywgdGhlIGBhc3luY2AgcGlwZVxuICogYXV0b21hdGljYWxseSB1bnN1YnNjcmliZXMgZnJvbSB0aGUgb2xkIGBPYnNlcnZhYmxlYCBvciBgUHJvbWlzZWAgYW5kIHN1YnNjcmliZXMgdG8gdGhlIG5ldyBvbmUuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBUaGlzIGV4YW1wbGUgYmluZHMgYSBgUHJvbWlzZWAgdG8gdGhlIHZpZXcuIENsaWNraW5nIHRoZSBgUmVzb2x2ZWAgYnV0dG9uIHJlc29sdmVzIHRoZVxuICogcHJvbWlzZS5cbiAqXG4gKiB7QGV4YW1wbGUgY29tbW9uL3BpcGVzL3RzL2FzeW5jX3BpcGUudHMgcmVnaW9uPSdBc3luY1BpcGVQcm9taXNlJ31cbiAqXG4gKiBJdCdzIGFsc28gcG9zc2libGUgdG8gdXNlIGBhc3luY2Agd2l0aCBPYnNlcnZhYmxlcy4gVGhlIGV4YW1wbGUgYmVsb3cgYmluZHMgdGhlIGB0aW1lYCBPYnNlcnZhYmxlXG4gKiB0byB0aGUgdmlldy4gVGhlIE9ic2VydmFibGUgY29udGludW91c2x5IHVwZGF0ZXMgdGhlIHZpZXcgd2l0aCB0aGUgY3VycmVudCB0aW1lLlxuICpcbiAqIHtAZXhhbXBsZSBjb21tb24vcGlwZXMvdHMvYXN5bmNfcGlwZS50cyByZWdpb249J0FzeW5jUGlwZU9ic2VydmFibGUnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQFBpcGUoe1xuICBuYW1lOiAnYXN5bmMnLFxuICBwdXJlOiBmYWxzZSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQXN5bmNQaXBlIGltcGxlbWVudHMgT25EZXN0cm95LCBQaXBlVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBfcmVmOiBDaGFuZ2VEZXRlY3RvclJlZnxudWxsO1xuICBwcml2YXRlIF9sYXRlc3RWYWx1ZTogYW55ID0gbnVsbDtcblxuICBwcml2YXRlIF9zdWJzY3JpcHRpb246IFVuc3Vic2NyaWJhYmxlfFByb21pc2U8YW55PnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfb2JqOiBTdWJzY3JpYmFibGU8YW55PnxQcm9taXNlPGFueT58RXZlbnRFbWl0dGVyPGFueT58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3N0cmF0ZWd5OiBTdWJzY3JpcHRpb25TdHJhdGVneXxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihyZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAgLy8gQXNzaWduIGByZWZgIGludG8gYHRoaXMuX3JlZmAgbWFudWFsbHkgaW5zdGVhZCBvZiBkZWNsYXJpbmcgYF9yZWZgIGluIHRoZSBjb25zdHJ1Y3RvclxuICAgIC8vIHBhcmFtZXRlciBsaXN0LCBhcyB0aGUgdHlwZSBvZiBgdGhpcy5fcmVmYCBpbmNsdWRlcyBgbnVsbGAgdW5saWtlIHRoZSB0eXBlIG9mIGByZWZgLlxuICAgIHRoaXMuX3JlZiA9IHJlZjtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2UoKTtcbiAgICB9XG4gICAgLy8gQ2xlYXIgdGhlIGBDaGFuZ2VEZXRlY3RvclJlZmAgYW5kIGl0cyBhc3NvY2lhdGlvbiB3aXRoIHRoZSB2aWV3IGRhdGEsIHRvIG1pdGlnYXRlXG4gICAgLy8gcG90ZW50aWFsIG1lbW9yeSBsZWFrcyBpbiBPYnNlcnZhYmxlcyB0aGF0IGNvdWxkIG90aGVyd2lzZSBjYXVzZSB0aGUgdmlldyBkYXRhIHRvXG4gICAgLy8gYmUgcmV0YWluZWQuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTc2MjRcbiAgICB0aGlzLl9yZWYgPSBudWxsO1xuICB9XG5cbiAgLy8gTk9URShAYmVubGVzaCk6IEJlY2F1c2UgT2JzZXJ2YWJsZSBoYXMgZGVwcmVjYXRlZCBhIGZldyBjYWxsIHBhdHRlcm5zIGZvciBgc3Vic2NyaWJlYCxcbiAgLy8gVHlwZVNjcmlwdCBoYXMgYSBoYXJkIHRpbWUgbWF0Y2hpbmcgT2JzZXJ2YWJsZSB0byBTdWJzY3JpYmFibGUsIGZvciBtb3JlIGluZm9ybWF0aW9uXG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQzNjQzXG5cbiAgdHJhbnNmb3JtPFQ+KG9iajogT2JzZXJ2YWJsZTxUPnxTdWJzY3JpYmFibGU8VD58UHJvbWlzZTxUPik6IFR8bnVsbDtcbiAgdHJhbnNmb3JtPFQ+KG9iajogbnVsbHx1bmRlZmluZWQpOiBudWxsO1xuICB0cmFuc2Zvcm08VD4ob2JqOiBPYnNlcnZhYmxlPFQ+fFN1YnNjcmliYWJsZTxUPnxQcm9taXNlPFQ+fG51bGx8dW5kZWZpbmVkKTogVHxudWxsO1xuICB0cmFuc2Zvcm08VD4ob2JqOiBPYnNlcnZhYmxlPFQ+fFN1YnNjcmliYWJsZTxUPnxQcm9taXNlPFQ+fG51bGx8dW5kZWZpbmVkKTogVHxudWxsIHtcbiAgICBpZiAoIXRoaXMuX29iaikge1xuICAgICAgaWYgKG9iaikge1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmUob2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9sYXRlc3RWYWx1ZTtcbiAgICB9XG5cbiAgICBpZiAob2JqICE9PSB0aGlzLl9vYmopIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2UoKTtcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybShvYmopO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9sYXRlc3RWYWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZShvYmo6IFN1YnNjcmliYWJsZTxhbnk+fFByb21pc2U8YW55PnxFdmVudEVtaXR0ZXI8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuX29iaiA9IG9iajtcbiAgICB0aGlzLl9zdHJhdGVneSA9IHRoaXMuX3NlbGVjdFN0cmF0ZWd5KG9iaik7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gdGhpcy5fc3RyYXRlZ3kuY3JlYXRlU3Vic2NyaXB0aW9uKFxuICAgICAgICBvYmosICh2YWx1ZTogT2JqZWN0KSA9PiB0aGlzLl91cGRhdGVMYXRlc3RWYWx1ZShvYmosIHZhbHVlKSk7XG4gIH1cblxuICBwcml2YXRlIF9zZWxlY3RTdHJhdGVneShvYmo6IFN1YnNjcmliYWJsZTxhbnk+fFByb21pc2U8YW55PnxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnRFbWl0dGVyPGFueT4pOiBTdWJzY3JpcHRpb25TdHJhdGVneSB7XG4gICAgaWYgKMm1aXNQcm9taXNlKG9iaikpIHtcbiAgICAgIHJldHVybiBfcHJvbWlzZVN0cmF0ZWd5O1xuICAgIH1cblxuICAgIGlmICjJtWlzU3Vic2NyaWJhYmxlKG9iaikpIHtcbiAgICAgIHJldHVybiBfc3Vic2NyaWJhYmxlU3RyYXRlZ3k7XG4gICAgfVxuXG4gICAgdGhyb3cgaW52YWxpZFBpcGVBcmd1bWVudEVycm9yKEFzeW5jUGlwZSwgb2JqKTtcbiAgfVxuXG4gIHByaXZhdGUgX2Rpc3Bvc2UoKTogdm9pZCB7XG4gICAgLy8gTm90ZTogYGRpc3Bvc2VgIGlzIG9ubHkgY2FsbGVkIGlmIGEgc3Vic2NyaXB0aW9uIGhhcyBiZWVuIGluaXRpYWxpemVkIGJlZm9yZSwgaW5kaWNhdGluZ1xuICAgIC8vIHRoYXQgYHRoaXMuX3N0cmF0ZWd5YCBpcyBhbHNvIGF2YWlsYWJsZS5cbiAgICB0aGlzLl9zdHJhdGVneSEuZGlzcG9zZSh0aGlzLl9zdWJzY3JpcHRpb24hKTtcbiAgICB0aGlzLl9sYXRlc3RWYWx1ZSA9IG51bGw7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9vYmogPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlTGF0ZXN0VmFsdWUoYXN5bmM6IGFueSwgdmFsdWU6IE9iamVjdCk6IHZvaWQge1xuICAgIGlmIChhc3luYyA9PT0gdGhpcy5fb2JqKSB7XG4gICAgICB0aGlzLl9sYXRlc3RWYWx1ZSA9IHZhbHVlO1xuICAgICAgLy8gTm90ZTogYHRoaXMuX3JlZmAgaXMgb25seSBjbGVhcmVkIGluIGBuZ09uRGVzdHJveWAgc28gaXMga25vd24gdG8gYmUgYXZhaWxhYmxlIHdoZW4gYVxuICAgICAgLy8gdmFsdWUgaXMgYmVpbmcgdXBkYXRlZC5cbiAgICAgIHRoaXMuX3JlZiEubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG59XG4iXX0=