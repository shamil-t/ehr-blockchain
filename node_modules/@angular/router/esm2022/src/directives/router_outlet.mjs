/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, Directive, EnvironmentInjector, EventEmitter, inject, Injectable, InjectionToken, Input, Output, reflectComponentType, ViewContainerRef, ɵRuntimeError as RuntimeError, } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ChildrenOutletContexts } from '../router_outlet_context';
import { ActivatedRoute } from '../router_state';
import { PRIMARY_OUTLET } from '../shared';
import * as i0 from "@angular/core";
/**
 * @description
 *
 * Acts as a placeholder that Angular dynamically fills based on the current router state.
 *
 * Each outlet can have a unique name, determined by the optional `name` attribute.
 * The name cannot be set or changed dynamically. If not set, default value is "primary".
 *
 * ```
 * <router-outlet></router-outlet>
 * <router-outlet name='left'></router-outlet>
 * <router-outlet name='right'></router-outlet>
 * ```
 *
 * Named outlets can be the targets of secondary routes.
 * The `Route` object for a secondary route has an `outlet` property to identify the target outlet:
 *
 * `{path: <base-path>, component: <component>, outlet: <target_outlet_name>}`
 *
 * Using named outlets and secondary routes, you can target multiple outlets in
 * the same `RouterLink` directive.
 *
 * The router keeps track of separate branches in a navigation tree for each named outlet and
 * generates a representation of that tree in the URL.
 * The URL for a secondary route uses the following syntax to specify both the primary and secondary
 * routes at the same time:
 *
 * `http://base-path/primary-route-path(outlet-name:route-path)`
 *
 * A router outlet emits an activate event when a new component is instantiated,
 * deactivate event when a component is destroyed.
 * An attached event emits when the `RouteReuseStrategy` instructs the outlet to reattach the
 * subtree, and the detached event emits when the `RouteReuseStrategy` instructs the outlet to
 * detach the subtree.
 *
 * ```
 * <router-outlet
 *   (activate)='onActivate($event)'
 *   (deactivate)='onDeactivate($event)'
 *   (attach)='onAttach($event)'
 *   (detach)='onDetach($event)'></router-outlet>
 * ```
 *
 * @see [Routing tutorial](guide/router-tutorial-toh#named-outlets "Example of a named
 * outlet and secondary route configuration").
 * @see {@link RouterLink}
 * @see {@link Route}
 * @ngModule RouterModule
 *
 * @publicApi
 */
export class RouterOutlet {
    constructor() {
        this.activated = null;
        this._activatedRoute = null;
        /**
         * The name of the outlet
         *
         * @see [named outlets](guide/router-tutorial-toh#displaying-multiple-routes-in-named-outlets)
         */
        this.name = PRIMARY_OUTLET;
        this.activateEvents = new EventEmitter();
        this.deactivateEvents = new EventEmitter();
        /**
         * Emits an attached component instance when the `RouteReuseStrategy` instructs to re-attach a
         * previously detached subtree.
         **/
        this.attachEvents = new EventEmitter();
        /**
         * Emits a detached component instance when the `RouteReuseStrategy` instructs to detach the
         * subtree.
         */
        this.detachEvents = new EventEmitter();
        this.parentContexts = inject(ChildrenOutletContexts);
        this.location = inject(ViewContainerRef);
        this.changeDetector = inject(ChangeDetectorRef);
        this.environmentInjector = inject(EnvironmentInjector);
        this.inputBinder = inject(INPUT_BINDER, { optional: true });
        /** @nodoc */
        this.supportsBindingToComponentInputs = true;
    }
    /** @internal */
    get activatedComponentRef() {
        return this.activated;
    }
    /** @nodoc */
    ngOnChanges(changes) {
        if (changes['name']) {
            const { firstChange, previousValue } = changes['name'];
            if (firstChange) {
                // The first change is handled by ngOnInit. Because ngOnChanges doesn't get called when no
                // input is set at all, we need to centrally handle the first change there.
                return;
            }
            // unregister with the old name
            if (this.isTrackedInParentContexts(previousValue)) {
                this.deactivate();
                this.parentContexts.onChildOutletDestroyed(previousValue);
            }
            // register the new name
            this.initializeOutletWithName();
        }
    }
    /** @nodoc */
    ngOnDestroy() {
        // Ensure that the registered outlet is this one before removing it on the context.
        if (this.isTrackedInParentContexts(this.name)) {
            this.parentContexts.onChildOutletDestroyed(this.name);
        }
        this.inputBinder?.unsubscribeFromRouteData(this);
    }
    isTrackedInParentContexts(outletName) {
        return this.parentContexts.getContext(outletName)?.outlet === this;
    }
    /** @nodoc */
    ngOnInit() {
        this.initializeOutletWithName();
    }
    initializeOutletWithName() {
        this.parentContexts.onChildOutletCreated(this.name, this);
        if (this.activated) {
            return;
        }
        // If the outlet was not instantiated at the time the route got activated we need to populate
        // the outlet when it is initialized (ie inside a NgIf)
        const context = this.parentContexts.getContext(this.name);
        if (context?.route) {
            if (context.attachRef) {
                // `attachRef` is populated when there is an existing component to mount
                this.attach(context.attachRef, context.route);
            }
            else {
                // otherwise the component defined in the configuration is created
                this.activateWith(context.route, context.injector);
            }
        }
    }
    get isActivated() {
        return !!this.activated;
    }
    /**
     * @returns The currently activated component instance.
     * @throws An error if the outlet is not activated.
     */
    get component() {
        if (!this.activated)
            throw new RuntimeError(4012 /* RuntimeErrorCode.OUTLET_NOT_ACTIVATED */, (typeof ngDevMode === 'undefined' || ngDevMode) && 'Outlet is not activated');
        return this.activated.instance;
    }
    get activatedRoute() {
        if (!this.activated)
            throw new RuntimeError(4012 /* RuntimeErrorCode.OUTLET_NOT_ACTIVATED */, (typeof ngDevMode === 'undefined' || ngDevMode) && 'Outlet is not activated');
        return this._activatedRoute;
    }
    get activatedRouteData() {
        if (this._activatedRoute) {
            return this._activatedRoute.snapshot.data;
        }
        return {};
    }
    /**
     * Called when the `RouteReuseStrategy` instructs to detach the subtree
     */
    detach() {
        if (!this.activated)
            throw new RuntimeError(4012 /* RuntimeErrorCode.OUTLET_NOT_ACTIVATED */, (typeof ngDevMode === 'undefined' || ngDevMode) && 'Outlet is not activated');
        this.location.detach();
        const cmp = this.activated;
        this.activated = null;
        this._activatedRoute = null;
        this.detachEvents.emit(cmp.instance);
        return cmp;
    }
    /**
     * Called when the `RouteReuseStrategy` instructs to re-attach a previously detached subtree
     */
    attach(ref, activatedRoute) {
        this.activated = ref;
        this._activatedRoute = activatedRoute;
        this.location.insert(ref.hostView);
        this.inputBinder?.bindActivatedRouteToOutletComponent(this);
        this.attachEvents.emit(ref.instance);
    }
    deactivate() {
        if (this.activated) {
            const c = this.component;
            this.activated.destroy();
            this.activated = null;
            this._activatedRoute = null;
            this.deactivateEvents.emit(c);
        }
    }
    activateWith(activatedRoute, environmentInjector) {
        if (this.isActivated) {
            throw new RuntimeError(4013 /* RuntimeErrorCode.OUTLET_ALREADY_ACTIVATED */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                'Cannot activate an already activated outlet');
        }
        this._activatedRoute = activatedRoute;
        const location = this.location;
        const snapshot = activatedRoute.snapshot;
        const component = snapshot.component;
        const childContexts = this.parentContexts.getOrCreateContext(this.name).children;
        const injector = new OutletInjector(activatedRoute, childContexts, location.injector);
        this.activated = location.createComponent(component, {
            index: location.length,
            injector,
            environmentInjector: environmentInjector ?? this.environmentInjector
        });
        // Calling `markForCheck` to make sure we will run the change detection when the
        // `RouterOutlet` is inside a `ChangeDetectionStrategy.OnPush` component.
        this.changeDetector.markForCheck();
        this.inputBinder?.bindActivatedRouteToOutletComponent(this);
        this.activateEvents.emit(this.activated.instance);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterOutlet, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: RouterOutlet, isStandalone: true, selector: "router-outlet", inputs: { name: "name" }, outputs: { activateEvents: "activate", deactivateEvents: "deactivate", attachEvents: "attach", detachEvents: "detach" }, exportAs: ["outlet"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: 'router-outlet',
                    exportAs: 'outlet',
                    standalone: true,
                }]
        }], propDecorators: { name: [{
                type: Input
            }], activateEvents: [{
                type: Output,
                args: ['activate']
            }], deactivateEvents: [{
                type: Output,
                args: ['deactivate']
            }], attachEvents: [{
                type: Output,
                args: ['attach']
            }], detachEvents: [{
                type: Output,
                args: ['detach']
            }] } });
class OutletInjector {
    constructor(route, childContexts, parent) {
        this.route = route;
        this.childContexts = childContexts;
        this.parent = parent;
    }
    get(token, notFoundValue) {
        if (token === ActivatedRoute) {
            return this.route;
        }
        if (token === ChildrenOutletContexts) {
            return this.childContexts;
        }
        return this.parent.get(token, notFoundValue);
    }
}
export const INPUT_BINDER = new InjectionToken('');
/**
 * Injectable used as a tree-shakable provider for opting in to binding router data to component
 * inputs.
 *
 * The RouterOutlet registers itself with this service when an `ActivatedRoute` is attached or
 * activated. When this happens, the service subscribes to the `ActivatedRoute` observables (params,
 * queryParams, data) and sets the inputs of the component using `ComponentRef.setInput`.
 * Importantly, when an input does not have an item in the route data with a matching key, this
 * input is set to `undefined`. If it were not done this way, the previous information would be
 * retained if the data got removed from the route (i.e. if a query parameter is removed).
 *
 * The `RouterOutlet` should unregister itself when destroyed via `unsubscribeFromRouteData` so that
 * the subscriptions are cleaned up.
 */
export class RoutedComponentInputBinder {
    constructor() {
        this.outletDataSubscriptions = new Map;
    }
    bindActivatedRouteToOutletComponent(outlet) {
        this.unsubscribeFromRouteData(outlet);
        this.subscribeToRouteData(outlet);
    }
    unsubscribeFromRouteData(outlet) {
        this.outletDataSubscriptions.get(outlet)?.unsubscribe();
        this.outletDataSubscriptions.delete(outlet);
    }
    subscribeToRouteData(outlet) {
        const { activatedRoute } = outlet;
        const dataSubscription = combineLatest([
            activatedRoute.queryParams,
            activatedRoute.params,
            activatedRoute.data,
        ])
            .pipe(switchMap(([queryParams, params, data], index) => {
            data = { ...queryParams, ...params, ...data };
            // Get the first result from the data subscription synchronously so it's available to
            // the component as soon as possible (and doesn't require a second change detection).
            if (index === 0) {
                return of(data);
            }
            // Promise.resolve is used to avoid synchronously writing the wrong data when
            // two of the Observables in the `combineLatest` stream emit one after
            // another.
            return Promise.resolve(data);
        }))
            .subscribe(data => {
            // Outlet may have been deactivated or changed names to be associated with a different
            // route
            if (!outlet.isActivated || !outlet.activatedComponentRef ||
                outlet.activatedRoute !== activatedRoute || activatedRoute.component === null) {
                this.unsubscribeFromRouteData(outlet);
                return;
            }
            const mirror = reflectComponentType(activatedRoute.component);
            if (!mirror) {
                this.unsubscribeFromRouteData(outlet);
                return;
            }
            for (const { templateName } of mirror.inputs) {
                outlet.activatedComponentRef.setInput(templateName, data[templateName]);
            }
        });
        this.outletDataSubscriptions.set(outlet, dataSubscription);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RoutedComponentInputBinder, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RoutedComponentInputBinder }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RoutedComponentInputBinder, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX291dGxldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvZGlyZWN0aXZlcy9yb3V0ZXJfb3V0bGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBZ0IsU0FBUyxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBWSxLQUFLLEVBQXFCLE1BQU0sRUFBRSxvQkFBb0IsRUFBaUIsZ0JBQWdCLEVBQUUsYUFBYSxJQUFJLFlBQVksR0FBRSxNQUFNLGVBQWUsQ0FBQztBQUNuUixPQUFPLEVBQUMsYUFBYSxFQUFFLEVBQUUsRUFBZSxNQUFNLE1BQU0sQ0FBQztBQUNyRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJekMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxXQUFXLENBQUM7O0FBZ0d6Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FrREc7QUFNSCxNQUFNLE9BQU8sWUFBWTtJQUx6QjtRQU1VLGNBQVMsR0FBMkIsSUFBSSxDQUFDO1FBS3pDLG9CQUFlLEdBQXdCLElBQUksQ0FBQztRQUNwRDs7OztXQUlHO1FBQ00sU0FBSSxHQUFHLGNBQWMsQ0FBQztRQUVYLG1CQUFjLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUN2QyxxQkFBZ0IsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ2pFOzs7WUFHSTtRQUNjLGlCQUFZLEdBQUcsSUFBSSxZQUFZLEVBQVcsQ0FBQztRQUM3RDs7O1dBR0c7UUFDZSxpQkFBWSxH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QUFFLGdCQUFnQixDQUFDLENBQUM7SUFDN0QsQ0FBQzt5SEF0RFUsMEJBQTBCOzZIQUExQiwwQkFBMEI7O3NHQUExQiwwQkFBMEI7a0JBRHRDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEaXJlY3RpdmUsIEVudmlyb25tZW50SW5qZWN0b3IsIEV2ZW50RW1pdHRlciwgaW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIElucHV0LCBPbkRlc3Ryb3ksIE9uSW5pdCwgT3V0cHV0LCByZWZsZWN0Q29tcG9uZW50VHlwZSwgU2ltcGxlQ2hhbmdlcywgVmlld0NvbnRhaW5lclJlZiwgybVSdW50aW1lRXJyb3IgYXMgUnVudGltZUVycm9yLH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2NvbWJpbmVMYXRlc3QsIG9mLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzd2l0Y2hNYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtEYXRhfSBmcm9tICcuLi9tb2RlbHMnO1xuaW1wb3J0IHtDaGlsZHJlbk91dGxldENvbnRleHRzfSBmcm9tICcuLi9yb3V0ZXJfb3V0bGV0X2NvbnRleHQnO1xuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZX0gZnJvbSAnLi4vcm91dGVyX3N0YXRlJztcbmltcG9ydCB7UFJJTUFSWV9PVVRMRVR9IGZyb20gJy4uL3NoYXJlZCc7XG5cblxuLyoqXG4gKiBBbiBpbnRlcmZhY2UgdGhhdCBkZWZpbmVzIHRoZSBjb250cmFjdCBmb3IgZGV2ZWxvcGluZyBhIGNvbXBvbmVudCBvdXRsZXQgZm9yIHRoZSBgUm91dGVyYC5cbiAqXG4gKiBBbiBvdXRsZXQgYWN0cyBhcyBhIHBsYWNlaG9sZGVyIHRoYXQgQW5ndWxhciBkeW5hbWljYWxseSBmaWxscyBiYXNlZCBvbiB0aGUgY3VycmVudCByb3V0ZXIgc3RhdGUuXG4gKlxuICogQSByb3V0ZXIgb3V0bGV0IHNob3VsZCByZWdpc3RlciBpdHNlbGYgd2l0aCB0aGUgYFJvdXRlcmAgdmlhXG4gKiBgQ2hpbGRyZW5PdXRsZXRDb250ZXh0cyNvbkNoaWxkT3V0bGV0Q3JlYXRlZGAgYW5kIHVucmVnaXN0ZXIgd2l0aFxuICogYENoaWxkcmVuT3V0bGV0Q29udGV4dHMjb25DaGlsZE91dGxldERlc3Ryb3llZGAuIFdoZW4gdGhlIGBSb3V0ZXJgIGlkZW50aWZpZXMgYSBtYXRjaGVkIGBSb3V0ZWAsXG4gKiBpdCBsb29rcyBmb3IgYSByZWdpc3RlcmVkIG91dGxldCBpbiB0aGUgYENoaWxkcmVuT3V0bGV0Q29udGV4dHNgIGFuZCBhY3RpdmF0ZXMgaXQuXG4gKlxuICogQHNlZSB7QGxpbmsgQ2hpbGRyZW5PdXRsZXRDb250ZXh0c31cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb3V0ZXJPdXRsZXRDb250cmFjdCB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBnaXZlbiBvdXRsZXQgaXMgYWN0aXZhdGVkLlxuICAgKlxuICAgKiBBbiBvdXRsZXQgaXMgY29uc2lkZXJlZCBcImFjdGl2YXRlZFwiIGlmIGl0IGhhcyBhbiBhY3RpdmUgY29tcG9uZW50LlxuICAgKi9cbiAgaXNBY3RpdmF0ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFRoZSBpbnN0YW5jZSBvZiB0aGUgYWN0aXZhdGVkIGNvbXBvbmVudCBvciBgbnVsbGAgaWYgdGhlIG91dGxldCBpcyBub3QgYWN0aXZhdGVkLiAqL1xuICBjb21wb25lbnQ6IE9iamVjdHxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgYERhdGFgIG9mIHRoZSBgQWN0aXZhdGVkUm91dGVgIHNuYXBzaG90LlxuICAgKi9cbiAgYWN0aXZhdGVkUm91dGVEYXRhOiBEYXRhO1xuXG4gIC8qKlxuICAgKiBUaGUgYEFjdGl2YXRlZFJvdXRlYCBmb3IgdGhlIG91dGxldCBvciBgbnVsbGAgaWYgdGhlIG91dGxldCBpcyBub3QgYWN0aXZhdGVkLlxuICAgKi9cbiAgYWN0aXZhdGVkUm91dGU6IEFjdGl2YXRlZFJvdXRlfG51bGw7XG5cbiAgLyoqXG4gICAqIENhbGxlZCBieSB0aGUgYFJvdXRlcmAgd2hlbiB0aGUgb3V0bGV0IHNob3VsZCBhY3RpdmF0ZSAoY3JlYXRlIGEgY29tcG9uZW50KS5cbiAgICovXG4gIGFjdGl2YXRlV2l0aChhY3RpdmF0ZWRSb3V0ZTogQWN0aXZhdGVkUm91dGUsIGVudmlyb25tZW50SW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3J8bnVsbCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEEgcmVxdWVzdCB0byBkZXN0cm95IHRoZSBjdXJyZW50bHkgYWN0aXZhdGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogV2hlbiBhIGBSb3V0ZVJldXNlU3RyYXRlZ3lgIGluZGljYXRlcyB0aGF0IGFuIGBBY3RpdmF0ZWRSb3V0ZWAgc2hvdWxkIGJlIHJlbW92ZWQgYnV0IHN0b3JlZCBmb3JcbiAgICogbGF0ZXIgcmUtdXNlIHJhdGhlciB0aGFuIGRlc3Ryb3llZCwgdGhlIGBSb3V0ZXJgIHdpbGwgY2FsbCBgZGV0YWNoYCBpbnN0ZWFkLlxuICAgKi9cbiAgZGVhY3RpdmF0ZSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgYFJvdXRlUmV1c2VTdHJhdGVneWAgaW5zdHJ1Y3RzIHRvIGRldGFjaCB0aGUgc3VidHJlZS5cbiAgICpcbiAgICogVGhpcyBpcyBzaW1pbGFyIHRvIGBkZWFjdGl2YXRlYCwgYnV0IHRoZSBhY3RpdmF0ZWQgY29tcG9uZW50IHNob3VsZCBfbm90XyBiZSBkZXN0cm95ZWQuXG4gICAqIEluc3RlYWQsIGl0IGlzIHJldHVybmVkIHNvIHRoYXQgaXQgY2FuIGJlIHJlYXR0YWNoZWQgbGF0ZXIgdmlhIHRoZSBgYXR0YWNoYCBtZXRob2QuXG4gICAqL1xuICBkZXRhY2goKTogQ29tcG9uZW50UmVmPHVua25vd24+O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgYFJvdXRlUmV1c2VTdHJhdGVneWAgaW5zdHJ1Y3RzIHRvIHJlLWF0dGFjaCBhIHByZXZpb3VzbHkgZGV0YWNoZWQgc3VidHJlZS5cbiAgICovXG4gIGF0dGFjaChyZWY6IENvbXBvbmVudFJlZjx1bmtub3duPiwgYWN0aXZhdGVkUm91dGU6IEFjdGl2YXRlZFJvdXRlKTogdm9pZDtcblxuICAvKipcbiAgICogRW1pdHMgYW4gYWN0aXZhdGUgZXZlbnQgd2hlbiBhIG5ldyBjb21wb25lbnQgaXMgaW5zdGFudGlhdGVkXG4gICAqKi9cbiAgYWN0aXZhdGVFdmVudHM/OiBFdmVudEVtaXR0ZXI8dW5rbm93bj47XG5cbiAgLyoqXG4gICAqIEVtaXRzIGEgZGVhY3RpdmF0ZSBldmVudCB3aGVuIGEgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICovXG4gIGRlYWN0aXZhdGVFdmVudHM/OiBFdmVudEVtaXR0ZXI8dW5rbm93bj47XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGF0dGFjaGVkIGNvbXBvbmVudCBpbnN0YW5jZSB3aGVuIHRoZSBgUm91dGVSZXVzZVN0cmF0ZWd5YCBpbnN0cnVjdHMgdG8gcmUtYXR0YWNoIGFcbiAgICogcHJldmlvdXNseSBkZXRhY2hlZCBzdWJ0cmVlLlxuICAgKiovXG4gIGF0dGFjaEV2ZW50cz86IEV2ZW50RW1pdHRlcjx1bmtub3duPjtcblxuICAvKipcbiAgICogRW1pdHMgYSBkZXRhY2hlZCBjb21wb25lbnQgaW5zdGFuY2Ugd2hlbiB0aGUgYFJvdXRlUmV1c2VTdHJhdGVneWAgaW5zdHJ1Y3RzIHRvIGRldGFjaCB0aGVcbiAgICogc3VidHJlZS5cbiAgICovXG4gIGRldGFjaEV2ZW50cz86IEV2ZW50RW1pdHRlcjx1bmtub3duPjtcblxuICAvKipcbiAgICogVXNlZCB0byBpbmRpY2F0ZSB0aGF0IHRoZSBvdXRsZXQgaXMgYWJsZSB0byBiaW5kIGRhdGEgZnJvbSB0aGUgYFJvdXRlcmAgdG8gdGhlIG91dGxldFxuICAgKiBjb21wb25lbnQncyBpbnB1dHMuXG4gICAqXG4gICAqIFdoZW4gdGhpcyBpcyBgdW5kZWZpbmVkYCBvciBgZmFsc2VgIGFuZCB0aGUgZGV2ZWxvcGVyIGhhcyBvcHRlZCBpbiB0byB0aGVcbiAgICogZmVhdHVyZSB1c2luZyBgd2l0aENvbXBvbmVudElucHV0QmluZGluZ2AsIGEgd2FybmluZyB3aWxsIGJlIGxvZ2dlZCBpbiBkZXYgbW9kZSBpZiB0aGlzIG91dGxldFxuICAgKiBpcyB1c2VkIGluIHRoZSBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHJlYWRvbmx5IHN1cHBvcnRzQmluZGluZ1RvQ29tcG9uZW50SW5wdXRzPzogdHJ1ZTtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBY3RzIGFzIGEgcGxhY2Vob2xkZXIgdGhhdCBBbmd1bGFyIGR5bmFtaWNhbGx5IGZpbGxzIGJhc2VkIG9uIHRoZSBjdXJyZW50IHJvdXRlciBzdGF0ZS5cbiAqXG4gKiBFYWNoIG91dGxldCBjYW4gaGF2ZSBhIHVuaXF1ZSBuYW1lLCBkZXRlcm1pbmVkIGJ5IHRoZSBvcHRpb25hbCBgbmFtZWAgYXR0cmlidXRlLlxuICogVGhlIG5hbWUgY2Fubm90IGJlIHNldCBvciBjaGFuZ2VkIGR5bmFtaWNhbGx5LiBJZiBub3Qgc2V0LCBkZWZhdWx0IHZhbHVlIGlzIFwicHJpbWFyeVwiLlxuICpcbiAqIGBgYFxuICogPHJvdXRlci1vdXRsZXQ+PC9yb3V0ZXItb3V0bGV0PlxuICogPHJvdXRlci1vdXRsZXQgbmFtZT0nbGVmdCc+PC9yb3V0ZXItb3V0bGV0PlxuICogPHJvdXRlci1vdXRsZXQgbmFtZT0ncmlnaHQnPjwvcm91dGVyLW91dGxldD5cbiAqIGBgYFxuICpcbiAqIE5hbWVkIG91dGxldHMgY2FuIGJlIHRoZSB0YXJnZXRzIG9mIHNlY29uZGFyeSByb3V0ZXMuXG4gKiBUaGUgYFJvdXRlYCBvYmplY3QgZm9yIGEgc2Vjb25kYXJ5IHJvdXRlIGhhcyBhbiBgb3V0bGV0YCBwcm9wZXJ0eSB0byBpZGVudGlmeSB0aGUgdGFyZ2V0IG91dGxldDpcbiAqXG4gKiBge3BhdGg6IDxiYXNlLXBhdGg+LCBjb21wb25lbnQ6IDxjb21wb25lbnQ+LCBvdXRsZXQ6IDx0YXJnZXRfb3V0bGV0X25hbWU+fWBcbiAqXG4gKiBVc2luZyBuYW1lZCBvdXRsZXRzIGFuZCBzZWNvbmRhcnkgcm91dGVzLCB5b3UgY2FuIHRhcmdldCBtdWx0aXBsZSBvdXRsZXRzIGluXG4gKiB0aGUgc2FtZSBgUm91dGVyTGlua2AgZGlyZWN0aXZlLlxuICpcbiAqIFRoZSByb3V0ZXIga2VlcHMgdHJhY2sgb2Ygc2VwYXJhdGUgYnJhbmNoZXMgaW4gYSBuYXZpZ2F0aW9uIHRyZWUgZm9yIGVhY2ggbmFtZWQgb3V0bGV0IGFuZFxuICogZ2VuZXJhdGVzIGEgcmVwcmVzZW50YXRpb24gb2YgdGhhdCB0cmVlIGluIHRoZSBVUkwuXG4gKiBUaGUgVVJMIGZvciBhIHNlY29uZGFyeSByb3V0ZSB1c2VzIHRoZSBmb2xsb3dpbmcgc3ludGF4IHRvIHNwZWNpZnkgYm90aCB0aGUgcHJpbWFyeSBhbmQgc2Vjb25kYXJ5XG4gKiByb3V0ZXMgYXQgdGhlIHNhbWUgdGltZTpcbiAqXG4gKiBgaHR0cDovL2Jhc2UtcGF0aC9wcmltYXJ5LXJvdXRlLXBhdGgob3V0bGV0LW5hbWU6cm91dGUtcGF0aClgXG4gKlxuICogQSByb3V0ZXIgb3V0bGV0IGVtaXRzIGFuIGFjdGl2YXRlIGV2ZW50IHdoZW4gYSBuZXcgY29tcG9uZW50IGlzIGluc3RhbnRpYXRlZCxcbiAqIGRlYWN0aXZhdGUgZXZlbnQgd2hlbiBhIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gKiBBbiBhdHRhY2hlZCBldmVudCBlbWl0cyB3aGVuIHRoZSBgUm91dGVSZXVzZVN0cmF0ZWd5YCBpbnN0cnVjdHMgdGhlIG91dGxldCB0byByZWF0dGFjaCB0aGVcbiAqIHN1YnRyZWUsIGFuZCB0aGUgZGV0YWNoZWQgZXZlbnQgZW1pdHMgd2hlbiB0aGUgYFJvdXRlUmV1c2VTdHJhdGVneWAgaW5zdHJ1Y3RzIHRoZSBvdXRsZXQgdG9cbiAqIGRldGFjaCB0aGUgc3VidHJlZS5cbiAqXG4gKiBgYGBcbiAqIDxyb3V0ZXItb3V0bGV0XG4gKiAgIChhY3RpdmF0ZSk9J29uQWN0aXZhdGUoJGV2ZW50KSdcbiAqICAgKGRlYWN0aXZhdGUpPSdvbkRlYWN0aXZhdGUoJGV2ZW50KSdcbiAqICAgKGF0dGFjaCk9J29uQXR0YWNoKCRldmVudCknXG4gKiAgIChkZXRhY2gpPSdvbkRldGFjaCgkZXZlbnQpJz48L3JvdXRlci1vdXRsZXQ+XG4gKiBgYGBcbiAqXG4gKiBAc2VlIFtSb3V0aW5nIHR1dG9yaWFsXShndWlkZS9yb3V0ZXItdHV0b3JpYWwtdG9oI25hbWVkLW91dGxldHMgXCJFeGFtcGxlIG9mIGEgbmFtZWRcbiAqIG91dGxldCBhbmQgc2Vjb25kYXJ5IHJvdXRlIGNvbmZpZ3VyYXRpb25cIikuXG4gKiBAc2VlIHtAbGluayBSb3V0ZXJMaW5rfVxuICogQHNlZSB7QGxpbmsgUm91dGV9XG4gKiBAbmdNb2R1bGUgUm91dGVyTW9kdWxlXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdyb3V0ZXItb3V0bGV0JyxcbiAgZXhwb3J0QXM6ICdvdXRsZXQnLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBSb3V0ZXJPdXRsZXQgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uSW5pdCwgUm91dGVyT3V0bGV0Q29udHJhY3Qge1xuICBwcml2YXRlIGFjdGl2YXRlZDogQ29tcG9uZW50UmVmPGFueT58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IGFjdGl2YXRlZENvbXBvbmVudFJlZigpOiBDb21wb25lbnRSZWY8YW55PnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZWQ7XG4gIH1cbiAgcHJpdmF0ZSBfYWN0aXZhdGVkUm91dGU6IEFjdGl2YXRlZFJvdXRlfG51bGwgPSBudWxsO1xuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIG91dGxldFxuICAgKlxuICAgKiBAc2VlIFtuYW1lZCBvdXRsZXRzXShndWlkZS9yb3V0ZXItdHV0b3JpYWwtdG9oI2Rpc3BsYXlpbmctbXVsdGlwbGUtcm91dGVzLWluLW5hbWVkLW91dGxldHMpXG4gICAqL1xuICBASW5wdXQoKSBuYW1lID0gUFJJTUFSWV9PVVRMRVQ7XG5cbiAgQE91dHB1dCgnYWN0aXZhdGUnKSBhY3RpdmF0ZUV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCdkZWFjdGl2YXRlJykgZGVhY3RpdmF0ZUV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICAvKipcbiAgICogRW1pdHMgYW4gYXR0YWNoZWQgY29tcG9uZW50IGluc3RhbmNlIHdoZW4gdGhlIGBSb3V0ZVJldXNlU3RyYXRlZ3lgIGluc3RydWN0cyB0byByZS1hdHRhY2ggYVxuICAgKiBwcmV2aW91c2x5IGRldGFjaGVkIHN1YnRyZWUuXG4gICAqKi9cbiAgQE91dHB1dCgnYXR0YWNoJykgYXR0YWNoRXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjx1bmtub3duPigpO1xuICAvKipcbiAgICogRW1pdHMgYSBkZXRhY2hlZCBjb21wb25lbnQgaW5zdGFuY2Ugd2hlbiB0aGUgYFJvdXRlUmV1c2VTdHJhdGVneWAgaW5zdHJ1Y3RzIHRvIGRldGFjaCB0aGVcbiAgICogc3VidHJlZS5cbiAgICovXG4gIEBPdXRwdXQoJ2RldGFjaCcpIGRldGFjaEV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXI8dW5rbm93bj4oKTtcblxuICBwcml2YXRlIHBhcmVudENvbnRleHRzID0gaW5qZWN0KENoaWxkcmVuT3V0bGV0Q29udGV4dHMpO1xuICBwcml2YXRlIGxvY2F0aW9uID0gaW5qZWN0KFZpZXdDb250YWluZXJSZWYpO1xuICBwcml2YXRlIGNoYW5nZURldGVjdG9yID0gaW5qZWN0KENoYW5nZURldGVjdG9yUmVmKTtcbiAgcHJpdmF0ZSBlbnZpcm9ubWVudEluamVjdG9yID0gaW5qZWN0KEVudmlyb25tZW50SW5qZWN0b3IpO1xuICBwcml2YXRlIGlucHV0QmluZGVyID0gaW5qZWN0KElOUFVUX0JJTkRFUiwge29wdGlvbmFsOiB0cnVlfSk7XG4gIC8qKiBAbm9kb2MgKi9cbiAgcmVhZG9ubHkgc3VwcG9ydHNCaW5kaW5nVG9Db21wb25lbnRJbnB1dHMgPSB0cnVlO1xuXG4gIC8qKiBAbm9kb2MgKi9cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGlmIChjaGFuZ2VzWyduYW1lJ10pIHtcbiAgICAgIGNvbnN0IHtmaXJzdENoYW5nZSwgcHJldmlvdXNWYWx1ZX0gPSBjaGFuZ2VzWyduYW1lJ107XG4gICAgICBpZiAoZmlyc3RDaGFuZ2UpIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IGNoYW5nZSBpcyBoYW5kbGVkIGJ5IG5nT25Jbml0LiBCZWNhdXNlIG5nT25DaGFuZ2VzIGRvZXNuJ3QgZ2V0IGNhbGxlZCB3aGVuIG5vXG4gICAgICAgIC8vIGlucHV0IGlzIHNldCBhdCBhbGwsIHdlIG5lZWQgdG8gY2VudHJhbGx5IGhhbmRsZSB0aGUgZmlyc3QgY2hhbmdlIHRoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIHVucmVnaXN0ZXIgd2l0aCB0aGUgb2xkIG5hbWVcbiAgICAgIGlmICh0aGlzLmlzVHJhY2tlZEluUGFyZW50Q29udGV4dHMocHJldmlvdXNWYWx1ZSkpIHtcbiAgICAgICAgdGhpcy5kZWFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMucGFyZW50Q29udGV4dHMub25DaGlsZE91dGxldERlc3Ryb3llZChwcmV2aW91c1ZhbHVlKTtcbiAgICAgIH1cbiAgICAgIC8vIHJlZ2lzdGVyIHRoZSBuZXcgbmFtZVxuICAgICAgdGhpcy5pbml0aWFsaXplT3V0bGV0V2l0aE5hbWUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSByZWdpc3RlcmVkIG91dGxldCBpcyB0aGlzIG9uZSBiZWZvcmUgcmVtb3ZpbmcgaXQgb24gdGhlIGNvbnRleHQuXG4gICAgaWYgKHRoaXMuaXNUcmFja2VkSW5QYXJlbnRDb250ZXh0cyh0aGlzLm5hbWUpKSB7XG4gICAgICB0aGlzLnBhcmVudENvbnRleHRzLm9uQ2hpbGRPdXRsZXREZXN0cm95ZWQodGhpcy5uYW1lKTtcbiAgICB9XG4gICAgdGhpcy5pbnB1dEJpbmRlcj8udW5zdWJzY3JpYmVGcm9tUm91dGVEYXRhKHRoaXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBpc1RyYWNrZWRJblBhcmVudENvbnRleHRzKG91dGxldE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLnBhcmVudENvbnRleHRzLmdldENvbnRleHQob3V0bGV0TmFtZSk/Lm91dGxldCA9PT0gdGhpcztcbiAgfVxuXG4gIC8qKiBAbm9kb2MgKi9cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5pbml0aWFsaXplT3V0bGV0V2l0aE5hbWUoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZU91dGxldFdpdGhOYW1lKCkge1xuICAgIHRoaXMucGFyZW50Q29udGV4dHMub25DaGlsZE91dGxldENyZWF0ZWQodGhpcy5uYW1lLCB0aGlzKTtcbiAgICBpZiAodGhpcy5hY3RpdmF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgb3V0bGV0IHdhcyBub3QgaW5zdGFudGlhdGVkIGF0IHRoZSB0aW1lIHRoZSByb3V0ZSBnb3QgYWN0aXZhdGVkIHdlIG5lZWQgdG8gcG9wdWxhdGVcbiAgICAvLyB0aGUgb3V0bGV0IHdoZW4gaXQgaXMgaW5pdGlhbGl6ZWQgKGllIGluc2lkZSBhIE5nSWYpXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMucGFyZW50Q29udGV4dHMuZ2V0Q29udGV4dCh0aGlzLm5hbWUpO1xuICAgIGlmIChjb250ZXh0Py5yb3V0ZSkge1xuICAgICAgaWYgKGNvbnRleHQuYXR0YWNoUmVmKSB7XG4gICAgICAgIC8vIGBhdHRhY2hSZWZgIGlzIHBvcHVsYXRlZCB3aGVuIHRoZXJlIGlzIGFuIGV4aXN0aW5nIGNvbXBvbmVudCB0byBtb3VudFxuICAgICAgICB0aGlzLmF0dGFjaChjb250ZXh0LmF0dGFjaFJlZiwgY29udGV4dC5yb3V0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvdGhlcndpc2UgdGhlIGNvbXBvbmVudCBkZWZpbmVkIGluIHRoZSBjb25maWd1cmF0aW9uIGlzIGNyZWF0ZWRcbiAgICAgICAgdGhpcy5hY3RpdmF0ZVdpdGgoY29udGV4dC5yb3V0ZSwgY29udGV4dC5pbmplY3Rvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGlzQWN0aXZhdGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYWN0aXZhdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50bHkgYWN0aXZhdGVkIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogQHRocm93cyBBbiBlcnJvciBpZiB0aGUgb3V0bGV0IGlzIG5vdCBhY3RpdmF0ZWQuXG4gICAqL1xuICBnZXQgY29tcG9uZW50KCk6IE9iamVjdCB7XG4gICAgaWYgKCF0aGlzLmFjdGl2YXRlZClcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5PVVRMRVRfTk9UX0FDVElWQVRFRCxcbiAgICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiAnT3V0bGV0IGlzIG5vdCBhY3RpdmF0ZWQnKTtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZWQuaW5zdGFuY2U7XG4gIH1cblxuICBnZXQgYWN0aXZhdGVkUm91dGUoKTogQWN0aXZhdGVkUm91dGUge1xuICAgIGlmICghdGhpcy5hY3RpdmF0ZWQpXG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuT1VUTEVUX05PVF9BQ1RJVkFURUQsXG4gICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgJ091dGxldCBpcyBub3QgYWN0aXZhdGVkJyk7XG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFJvdXRlIGFzIEFjdGl2YXRlZFJvdXRlO1xuICB9XG5cbiAgZ2V0IGFjdGl2YXRlZFJvdXRlRGF0YSgpOiBEYXRhIHtcbiAgICBpZiAodGhpcy5fYWN0aXZhdGVkUm91dGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hY3RpdmF0ZWRSb3V0ZS5zbmFwc2hvdC5kYXRhO1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGBSb3V0ZVJldXNlU3RyYXRlZ3lgIGluc3RydWN0cyB0byBkZXRhY2ggdGhlIHN1YnRyZWVcbiAgICovXG4gIGRldGFjaCgpOiBDb21wb25lbnRSZWY8YW55PiB7XG4gICAgaWYgKCF0aGlzLmFjdGl2YXRlZClcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5PVVRMRVRfTk9UX0FDVElWQVRFRCxcbiAgICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiAnT3V0bGV0IGlzIG5vdCBhY3RpdmF0ZWQnKTtcbiAgICB0aGlzLmxvY2F0aW9uLmRldGFjaCgpO1xuICAgIGNvbnN0IGNtcCA9IHRoaXMuYWN0aXZhdGVkO1xuICAgIHRoaXMuYWN0aXZhdGVkID0gbnVsbDtcbiAgICB0aGlzLl9hY3RpdmF0ZWRSb3V0ZSA9IG51bGw7XG4gICAgdGhpcy5kZXRhY2hFdmVudHMuZW1pdChjbXAuaW5zdGFuY2UpO1xuICAgIHJldHVybiBjbXA7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGBSb3V0ZVJldXNlU3RyYXRlZ3lgIGluc3RydWN0cyB0byByZS1hdHRhY2ggYSBwcmV2aW91c2x5IGRldGFjaGVkIHN1YnRyZWVcbiAgICovXG4gIGF0dGFjaChyZWY6IENvbXBvbmVudFJlZjxhbnk+LCBhY3RpdmF0ZWRSb3V0ZTogQWN0aXZhdGVkUm91dGUpIHtcbiAgICB0aGlzLmFjdGl2YXRlZCA9IHJlZjtcbiAgICB0aGlzLl9hY3RpdmF0ZWRSb3V0ZSA9IGFjdGl2YXRlZFJvdXRlO1xuICAgIHRoaXMubG9jYXRpb24uaW5zZXJ0KHJlZi5ob3N0Vmlldyk7XG4gICAgdGhpcy5pbnB1dEJpbmRlcj8uYmluZEFjdGl2YXRlZFJvdXRlVG9PdXRsZXRDb21wb25lbnQodGhpcyk7XG4gICAgdGhpcy5hdHRhY2hFdmVudHMuZW1pdChyZWYuaW5zdGFuY2UpO1xuICB9XG5cbiAgZGVhY3RpdmF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5hY3RpdmF0ZWQpIHtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLmNvbXBvbmVudDtcbiAgICAgIHRoaXMuYWN0aXZhdGVkLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuYWN0aXZhdGVkID0gbnVsbDtcbiAgICAgIHRoaXMuX2FjdGl2YXRlZFJvdXRlID0gbnVsbDtcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZUV2ZW50cy5lbWl0KGMpO1xuICAgIH1cbiAgfVxuXG4gIGFjdGl2YXRlV2l0aChhY3RpdmF0ZWRSb3V0ZTogQWN0aXZhdGVkUm91dGUsIGVudmlyb25tZW50SW5qZWN0b3I/OiBFbnZpcm9ubWVudEluamVjdG9yfG51bGwpIHtcbiAgICBpZiAodGhpcy5pc0FjdGl2YXRlZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk9VVExFVF9BTFJFQURZX0FDVElWQVRFRCxcbiAgICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgICAgICAgICAnQ2Fubm90IGFjdGl2YXRlIGFuIGFscmVhZHkgYWN0aXZhdGVkIG91dGxldCcpO1xuICAgIH1cbiAgICB0aGlzLl9hY3RpdmF0ZWRSb3V0ZSA9IGFjdGl2YXRlZFJvdXRlO1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5sb2NhdGlvbjtcbiAgICBjb25zdCBzbmFwc2hvdCA9IGFjdGl2YXRlZFJvdXRlLnNuYXBzaG90O1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IHNuYXBzaG90LmNvbXBvbmVudCE7XG4gICAgY29uc3QgY2hpbGRDb250ZXh0cyA9IHRoaXMucGFyZW50Q29udGV4dHMuZ2V0T3JDcmVhdGVDb250ZXh0KHRoaXMubmFtZSkuY2hpbGRyZW47XG4gICAgY29uc3QgaW5qZWN0b3IgPSBuZXcgT3V0bGV0SW5qZWN0b3IoYWN0aXZhdGVkUm91dGUsIGNoaWxkQ29udGV4dHMsIGxvY2F0aW9uLmluamVjdG9yKTtcblxuICAgIHRoaXMuYWN0aXZhdGVkID0gbG9jYXRpb24uY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCwge1xuICAgICAgaW5kZXg6IGxvY2F0aW9uLmxlbmd0aCxcbiAgICAgIGluamVjdG9yLFxuICAgICAgZW52aXJvbm1lbnRJbmplY3RvcjogZW52aXJvbm1lbnRJbmplY3RvciA/PyB0aGlzLmVudmlyb25tZW50SW5qZWN0b3JcbiAgICB9KTtcbiAgICAvLyBDYWxsaW5nIGBtYXJrRm9yQ2hlY2tgIHRvIG1ha2Ugc3VyZSB3ZSB3aWxsIHJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aGVuIHRoZVxuICAgIC8vIGBSb3V0ZXJPdXRsZXRgIGlzIGluc2lkZSBhIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hgIGNvbXBvbmVudC5cbiAgICB0aGlzLmNoYW5nZURldGVjdG9yLm1hcmtGb3JDaGVjaygpO1xuICAgIHRoaXMuaW5wdXRCaW5kZXI/LmJpbmRBY3RpdmF0ZWRSb3V0ZVRvT3V0bGV0Q29tcG9uZW50KHRoaXMpO1xuICAgIHRoaXMuYWN0aXZhdGVFdmVudHMuZW1pdCh0aGlzLmFjdGl2YXRlZC5pbnN0YW5jZSk7XG4gIH1cbn1cblxuY2xhc3MgT3V0bGV0SW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByb3V0ZTogQWN0aXZhdGVkUm91dGUsIHByaXZhdGUgY2hpbGRDb250ZXh0czogQ2hpbGRyZW5PdXRsZXRDb250ZXh0cyxcbiAgICAgIHByaXZhdGUgcGFyZW50OiBJbmplY3Rvcikge31cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSBBY3RpdmF0ZWRSb3V0ZSkge1xuICAgICAgcmV0dXJuIHRoaXMucm91dGU7XG4gICAgfVxuXG4gICAgaWYgKHRva2VuID09PSBDaGlsZHJlbk91dGxldENvbnRleHRzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZENvbnRleHRzO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBJTlBVVF9CSU5ERVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48Um91dGVkQ29tcG9uZW50SW5wdXRCaW5kZXI+KCcnKTtcblxuLyoqXG4gKiBJbmplY3RhYmxlIHVzZWQgYXMgYSB0cmVlLXNoYWthYmxlIHByb3ZpZGVyIGZvciBvcHRpbmcgaW4gdG8gYmluZGluZyByb3V0ZXIgZGF0YSB0byBjb21wb25lbnRcbiAqIGlucHV0cy5cbiAqXG4gKiBUaGUgUm91dGVyT3V0bGV0IHJlZ2lzdGVycyBpdHNlbGYgd2l0aCB0aGlzIHNlcnZpY2Ugd2hlbiBhbiBgQWN0aXZhdGVkUm91dGVgIGlzIGF0dGFjaGVkIG9yXG4gKiBhY3RpdmF0ZWQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgc2VydmljZSBzdWJzY3JpYmVzIHRvIHRoZSBgQWN0aXZhdGVkUm91dGVgIG9ic2VydmFibGVzIChwYXJhbXMsXG4gKiBxdWVyeVBhcmFtcywgZGF0YSkgYW5kIHNldHMgdGhlIGlucHV0cyBvZiB0aGUgY29tcG9uZW50IHVzaW5nIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgLlxuICogSW1wb3J0YW50bHksIHdoZW4gYW4gaW5wdXQgZG9lcyBub3QgaGF2ZSBhbiBpdGVtIGluIHRoZSByb3V0ZSBkYXRhIHdpdGggYSBtYXRjaGluZyBrZXksIHRoaXNcbiAqIGlucHV0IGlzIHNldCB0byBgdW5kZWZpbmVkYC4gSWYgaXQgd2VyZSBub3QgZG9uZSB0aGlzIHdheSwgdGhlIHByZXZpb3VzIGluZm9ybWF0aW9uIHdvdWxkIGJlXG4gKiByZXRhaW5lZCBpZiB0aGUgZGF0YSBnb3QgcmVtb3ZlZCBmcm9tIHRoZSByb3V0ZSAoaS5lLiBpZiBhIHF1ZXJ5IHBhcmFtZXRlciBpcyByZW1vdmVkKS5cbiAqXG4gKiBUaGUgYFJvdXRlck91dGxldGAgc2hvdWxkIHVucmVnaXN0ZXIgaXRzZWxmIHdoZW4gZGVzdHJveWVkIHZpYSBgdW5zdWJzY3JpYmVGcm9tUm91dGVEYXRhYCBzbyB0aGF0XG4gKiB0aGUgc3Vic2NyaXB0aW9ucyBhcmUgY2xlYW5lZCB1cC5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFJvdXRlZENvbXBvbmVudElucHV0QmluZGVyIHtcbiAgcHJpdmF0ZSBvdXRsZXREYXRhU3Vic2NyaXB0aW9ucyA9IG5ldyBNYXA8Um91dGVyT3V0bGV0LCBTdWJzY3JpcHRpb24+O1xuXG4gIGJpbmRBY3RpdmF0ZWRSb3V0ZVRvT3V0bGV0Q29tcG9uZW50KG91dGxldDogUm91dGVyT3V0bGV0KSB7XG4gICAgdGhpcy51bnN1YnNjcmliZUZyb21Sb3V0ZURhdGEob3V0bGV0KTtcbiAgICB0aGlzLnN1YnNjcmliZVRvUm91dGVEYXRhKG91dGxldCk7XG4gIH1cblxuICB1bnN1YnNjcmliZUZyb21Sb3V0ZURhdGEob3V0bGV0OiBSb3V0ZXJPdXRsZXQpIHtcbiAgICB0aGlzLm91dGxldERhdGFTdWJzY3JpcHRpb25zLmdldChvdXRsZXQpPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMub3V0bGV0RGF0YVN1YnNjcmlwdGlvbnMuZGVsZXRlKG91dGxldCk7XG4gIH1cblxuICBwcml2YXRlIHN1YnNjcmliZVRvUm91dGVEYXRhKG91dGxldDogUm91dGVyT3V0bGV0KSB7XG4gICAgY29uc3Qge2FjdGl2YXRlZFJvdXRlfSA9IG91dGxldDtcbiAgICBjb25zdCBkYXRhU3Vic2NyaXB0aW9uID1cbiAgICAgICAgY29tYmluZUxhdGVzdChbXG4gICAgICAgICAgYWN0aXZhdGVkUm91dGUucXVlcnlQYXJhbXMsXG4gICAgICAgICAgYWN0aXZhdGVkUm91dGUucGFyYW1zLFxuICAgICAgICAgIGFjdGl2YXRlZFJvdXRlLmRhdGEsXG4gICAgICAgIF0pXG4gICAgICAgICAgICAucGlwZShzd2l0Y2hNYXAoKFtxdWVyeVBhcmFtcywgcGFyYW1zLCBkYXRhXSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgZGF0YSA9IHsuLi5xdWVyeVBhcmFtcywgLi4ucGFyYW1zLCAuLi5kYXRhfTtcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCByZXN1bHQgZnJvbSB0aGUgZGF0YSBzdWJzY3JpcHRpb24gc3luY2hyb25vdXNseSBzbyBpdCdzIGF2YWlsYWJsZSB0b1xuICAgICAgICAgICAgICAvLyB0aGUgY29tcG9uZW50IGFzIHNvb24gYXMgcG9zc2libGUgKGFuZCBkb2Vzbid0IHJlcXVpcmUgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbikuXG4gICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvZihkYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBQcm9taXNlLnJlc29sdmUgaXMgdXNlZCB0byBhdm9pZCBzeW5jaHJvbm91c2x5IHdyaXRpbmcgdGhlIHdyb25nIGRhdGEgd2hlblxuICAgICAgICAgICAgICAvLyB0d28gb2YgdGhlIE9ic2VydmFibGVzIGluIHRoZSBgY29tYmluZUxhdGVzdGAgc3RyZWFtIGVtaXQgb25lIGFmdGVyXG4gICAgICAgICAgICAgIC8vIGFub3RoZXIuXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgICAgICAgIC8vIE91dGxldCBtYXkgaGF2ZSBiZWVuIGRlYWN0aXZhdGVkIG9yIGNoYW5nZWQgbmFtZXMgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIGEgZGlmZmVyZW50XG4gICAgICAgICAgICAgIC8vIHJvdXRlXG4gICAgICAgICAgICAgIGlmICghb3V0bGV0LmlzQWN0aXZhdGVkIHx8ICFvdXRsZXQuYWN0aXZhdGVkQ29tcG9uZW50UmVmIHx8XG4gICAgICAgICAgICAgICAgICBvdXRsZXQuYWN0aXZhdGVkUm91dGUgIT09IGFjdGl2YXRlZFJvdXRlIHx8IGFjdGl2YXRlZFJvdXRlLmNvbXBvbmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tUm91dGVEYXRhKG91dGxldCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgbWlycm9yID0gcmVmbGVjdENvbXBvbmVudFR5cGUoYWN0aXZhdGVkUm91dGUuY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgaWYgKCFtaXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlRnJvbVJvdXRlRGF0YShvdXRsZXQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qge3RlbXBsYXRlTmFtZX0gb2YgbWlycm9yLmlucHV0cykge1xuICAgICAgICAgICAgICAgIG91dGxldC5hY3RpdmF0ZWRDb21wb25lbnRSZWYuc2V0SW5wdXQodGVtcGxhdGVOYW1lLCBkYXRhW3RlbXBsYXRlTmFtZV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgIHRoaXMub3V0bGV0RGF0YVN1YnNjcmlwdGlvbnMuc2V0KG91dGxldCwgZGF0YVN1YnNjcmlwdGlvbik7XG4gIH1cbn1cbiJdfQ==