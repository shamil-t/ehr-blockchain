/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext, Injector, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { ErrorHandler } from '../error_handler';
import { RuntimeError } from '../errors';
import { DestroyRef } from '../linker/destroy_ref';
import { assertGreaterThan } from '../util/assert';
import { NgZone } from '../zone';
import { isPlatformBrowser } from './util/misc_utils';
/**
 * Register a callback to be invoked each time the application
 * finishes rendering.
 *
 * Note that the callback will run
 * - in the order it was registered
 * - once per render
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 *
 * @usageNotes
 *
 * Use `afterRender` to read or write the DOM after each render.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<span #content>{{ ... }}</span>`,
 * })
 * export class MyComponent {
 *   @ViewChild('content') contentRef: ElementRef;
 *
 *   constructor() {
 *     afterRender(() => {
 *       console.log('content height: ' + this.contentRef.nativeElement.scrollHeight);
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender(callback, options) {
    !options && assertInInjectionContext(afterRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return { destroy() { } };
    }
    let destroy;
    const unregisterFn = injector.get(DestroyRef).onDestroy(() => destroy?.());
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const errorHandler = injector.get(ErrorHandler, null, { optional: true });
    const instance = new AfterRenderCallback(ngZone, errorHandler, callback);
    destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * Register a callback to be invoked the next time the application
 * finishes rendering.
 *
 * Note that the callback will run
 * - in the order it was registered
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 *
 * @usageNotes
 *
 * Use `afterNextRender` to read or write the DOM once,
 * for example to initialize a non-Angular library.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-chart-cmp',
 *   template: `<div #chart>{{ ... }}</div>`,
 * })
 * export class MyChartCmp {
 *   @ViewChild('chart') chartRef: ElementRef;
 *   chart: MyChart|null;
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.chart = new MyChart(this.chartRef.nativeElement);
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterNextRender(callback, options) {
    !options && assertInInjectionContext(afterNextRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return { destroy() { } };
    }
    let destroy;
    const unregisterFn = injector.get(DestroyRef).onDestroy(() => destroy?.());
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const errorHandler = injector.get(ErrorHandler, null, { optional: true });
    const instance = new AfterRenderCallback(ngZone, errorHandler, () => {
        destroy?.();
        callback();
    });
    destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(zone, errorHandler, callbackFn) {
        this.zone = zone;
        this.errorHandler = errorHandler;
        this.callbackFn = callbackFn;
    }
    invoke() {
        try {
            this.zone.runOutsideAngular(this.callbackFn);
        }
        catch (err) {
            this.errorHandler?.handleError(err);
        }
    }
}
/**
 * Core functionality for `afterRender` and `afterNextRender`. Kept separate from
 * `AfterRenderEventManager` for tree-shaking.
 */
class AfterRenderCallbackHandlerImpl {
    constructor() {
        this.executingCallbacks = false;
        this.callbacks = new Set();
        this.deferredCallbacks = new Set();
    }
    validateBegin() {
        if (this.executingCallbacks) {
            throw new RuntimeError(102 /* RuntimeErrorCode.RECURSIVE_APPLICATION_RENDER */, ngDevMode &&
                'A new render operation began before the previous operation ended. ' +
                    'Did you trigger change detection from afterRender or afterNextRender?');
        }
    }
    register(callback) {
        // If we're currently running callbacks, new callbacks should be deferred
        // until the next render operation.
        const target = this.executingCallbacks ? this.deferredCallbacks : this.callbacks;
        target.add(callback);
    }
    unregister(callback) {
        this.callbacks.delete(callback);
        this.deferredCallbacks.delete(callback);
    }
    execute() {
        this.executingCallbacks = true;
        for (const callback of this.callbacks) {
            callback.invoke();
        }
        this.executingCallbacks = false;
        for (const callback of this.deferredCallbacks) {
            this.callbacks.add(callback);
        }
        this.deferredCallbacks.clear();
    }
    destroy() {
        this.callbacks.clear();
        this.deferredCallbacks.clear();
    }
}
/**
 * Implements core timing for `afterRender` and `afterNextRender` events.
 * Delegates to an optional `AfterRenderCallbackHandler` for implementation.
 */
export class AfterRenderEventManager {
    constructor() {
        this.renderDepth = 0;
        /* @internal */
        this.handler = null;
    }
    /**
     * Mark the beginning of a render operation (i.e. CD cycle).
     * Throws if called while executing callbacks.
     */
    begin() {
        this.handler?.validateBegin();
        this.renderDepth++;
    }
    /**
     * Mark the end of a render operation. Callbacks will be
     * executed if there are no more pending operations.
     */
    end() {
        ngDevMode && assertGreaterThan(this.renderDepth, 0, 'renderDepth must be greater than 0');
        this.renderDepth--;
        if (this.renderDepth === 0) {
            this.handler?.execute();
        }
    }
    ngOnDestroy() {
        this.handler?.destroy();
        this.handler = null;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderEventManager,
        providedIn: 'root',
        factory: () => new AfterRenderEventManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBNEJwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdDRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsUUFBc0IsRUFBRSxPQUE0QjtJQUM5RSxDQUFDLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsRCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxFQUFDLE9BQU8sS0FBSSxDQUFDLEVBQUMsQ0FBQztLQUN2QjtJQUVELElBQUksT0FBK0IsQ0FBQztJQUNwQyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FB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SUFDdEIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogQSBjYWxsYmFjayB0aGF0IHJ1bnMgYWZ0ZXIgcmVuZGVyLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJSZWYge1xuICAvKipcbiAgICogU2h1dCBkb3duIHRoZSBjYWxsYmFjaywgcHJldmVudGluZyBpdCBmcm9tIGJlaW5nIGNhbGxlZCBhZ2Fpbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgZWFjaCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIHtkZXN0cm95KCkge319O1xuICB9XG5cbiAgbGV0IGRlc3Ryb3k6IFZvaWRGdW5jdGlvbnx1bmRlZmluZWQ7XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koKCkgPT4gZGVzdHJveT8uKCkpO1xuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKG5nWm9uZSwgZXJyb3JIYW5kbGVyLCBjYWxsYmFjayk7XG5cbiAgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyTmV4dFJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIG9uY2UsXG4gKiBmb3IgZXhhbXBsZSB0byBpbml0aWFsaXplIGEgbm9uLUFuZ3VsYXIgbGlicmFyeS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNoYXJ0LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiAjY2hhcnQ+e3sgLi4uIH19PC9kaXY+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDaGFydENtcCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NoYXJ0JykgY2hhcnRSZWY6IEVsZW1lbnRSZWY7XG4gKiAgIGNoYXJ0OiBNeUNoYXJ0fG51bGw7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlck5leHRSZW5kZXIoKCkgPT4ge1xuICogICAgICAgdGhpcy5jaGFydCA9IG5ldyBNeUNoYXJ0KHRoaXMuY2hhcnRSZWYubmF0aXZlRWxlbWVudCk7XG4gKiAgICAgfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlck5leHRSZW5kZXIoXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiB7ZGVzdHJveSgpIHt9fTtcbiAgfVxuXG4gIGxldCBkZXN0cm95OiBWb2lkRnVuY3Rpb258dW5kZWZpbmVkO1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KCgpID0+IGRlc3Ryb3k/LigpKTtcbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFjayhuZ1pvbmUsIGVycm9ySGFuZGxlciwgKCkgPT4ge1xuICAgIGRlc3Ryb3k/LigpO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuXG4gIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYSBmdW5jdGlvbiB0byBiZSB1c2VkIGFzIGFuIGFmdGVyIHJlbmRlciBjYWxsYmFjay5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsIHByaXZhdGUgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCxcbiAgICAgIHByaXZhdGUgY2FsbGJhY2tGbjogVm9pZEZ1bmN0aW9uKSB7fVxuXG4gIGludm9rZSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuY2FsbGJhY2tGbik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmVycm9ySGFuZGxlcj8uaGFuZGxlRXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGhhbmRsZXIgbG9naWMuXG4gKi9cbmludGVyZmFjZSBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGl0J3Mgc2FmZSBmb3IgYSByZW5kZXIgb3BlcmF0aW9uIHRvIGJlZ2luLFxuICAgKiB0aHJvd2luZyBpZiBub3QuIE5vdCBndWFyYW50ZWVkIHRvIGJlIGNhbGxlZCBpZiBhIHJlbmRlclxuICAgKiBvcGVyYXRpb24gaXMgc3RhcnRlZCBiZWZvcmUgaGFuZGxlciB3YXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHZhbGlkYXRlQmVnaW4oKTogdm9pZDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgY2FsbGJhY2suXG4gICAqL1xuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gZXhpc3RpbmcgY2FsbGJhY2suXG4gICAqL1xuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogRXhlY3V0ZSBjYWxsYmFja3MuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gYW55IG5lY2Vzc2FyeSBjbGVhbnVwLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIENvcmUgZnVuY3Rpb25hbGl0eSBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuIEtlcHQgc2VwYXJhdGUgZnJvbVxuICogYEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyYCBmb3IgdHJlZS1zaGFraW5nLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwgaW1wbGVtZW50cyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIHByaXZhdGUgZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG4gIHByaXZhdGUgY2FsbGJhY2tzID0gbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpO1xuICBwcml2YXRlIGRlZmVycmVkQ2FsbGJhY2tzID0gbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpO1xuXG4gIHZhbGlkYXRlQmVnaW4oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFTkRFUixcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgJ0EgbmV3IHJlbmRlciBvcGVyYXRpb24gYmVnYW4gYmVmb3JlIHRoZSBwcmV2aW91cyBvcGVyYXRpb24gZW5kZWQuICcgK1xuICAgICAgICAgICAgICAgICAgJ0RpZCB5b3UgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGZyb20gYWZ0ZXJSZW5kZXIgb3IgYWZ0ZXJOZXh0UmVuZGVyPycpO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgLy8gSWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgY2FsbGJhY2tzLCBuZXcgY2FsbGJhY2tzIHNob3VsZCBiZSBkZWZlcnJlZFxuICAgIC8vIHVudGlsIHRoZSBuZXh0IHJlbmRlciBvcGVyYXRpb24uXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPyB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzIDogdGhpcy5jYWxsYmFja3M7XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gIH1cblxuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5jYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICBjYWxsYmFjay5pbnZva2UoKTtcbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZENhbGxiYWNrcykge1xuICAgICAgdGhpcy5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5jbGVhcigpO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgY29yZSB0aW1pbmcgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGV2ZW50cy5cbiAqIERlbGVnYXRlcyB0byBhbiBvcHRpb25hbCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJgIGZvciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSByZW5kZXJEZXB0aCA9IDA7XG5cbiAgLyogQGludGVybmFsICovXG4gIGhhbmRsZXI6IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBNYXJrIHRoZSBiZWdpbm5pbmcgb2YgYSByZW5kZXIgb3BlcmF0aW9uIChpLmUuIENEIGN5Y2xlKS5cbiAgICogVGhyb3dzIGlmIGNhbGxlZCB3aGlsZSBleGVjdXRpbmcgY2FsbGJhY2tzLlxuICAgKi9cbiAgYmVnaW4oKSB7XG4gICAgdGhpcy5oYW5kbGVyPy52YWxpZGF0ZUJlZ2luKCk7XG4gICAgdGhpcy5yZW5kZXJEZXB0aCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIGVuZCBvZiBhIHJlbmRlciBvcGVyYXRpb24uIENhbGxiYWNrcyB3aWxsIGJlXG4gICAqIGV4ZWN1dGVkIGlmIHRoZXJlIGFyZSBubyBtb3JlIHBlbmRpbmcgb3BlcmF0aW9ucy5cbiAgICovXG4gIGVuZCgpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4odGhpcy5yZW5kZXJEZXB0aCwgMCwgJ3JlbmRlckRlcHRoIG11c3QgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgICB0aGlzLnJlbmRlckRlcHRoLS07XG5cbiAgICBpZiAodGhpcy5yZW5kZXJEZXB0aCA9PT0gMCkge1xuICAgICAgdGhpcy5oYW5kbGVyPy5leGVjdXRlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5oYW5kbGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=