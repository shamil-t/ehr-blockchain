/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @description
 *
 * Provides a way to customize when activated routes get reused.
 *
 * @publicApi
 */
export class RouteReuseStrategy {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouteReuseStrategy, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouteReuseStrategy, providedIn: 'root', useFactory: () => inject(DefaultRouteReuseStrategy) }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouteReuseStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root', useFactory: () => inject(DefaultRouteReuseStrategy) }]
        }] });
/**
 * @description
 *
 * This base route reuse strategy only reuses routes when the matched router configs are
 * identical. This prevents components from being destroyed and recreated
 * when just the route parameters, query parameters or fragment change
 * (that is, the existing component is _reused_).
 *
 * This strategy does not store any routes for later reuse.
 *
 * Angular uses this strategy by default.
 *
 *
 * It can be used as a base class for custom route reuse strategies, i.e. you can create your own
 * class that extends the `BaseRouteReuseStrategy` one.
 * @publicApi
 */
export class BaseRouteReuseStrategy {
    /**
     * Whether the given route should detach for later reuse.
     * Always returns false for `BaseRouteReuseStrategy`.
     * */
    shouldDetach(route) {
        return false;
    }
    /**
     * A no-op; the route is never stored since this strategy never detaches routes for later re-use.
     */
    store(route, detachedTree) { }
    /** Returns `false`, meaning the route (and its subtree) is never reattached */
    shouldAttach(route) {
        return false;
    }
    /** Returns `null` because this strategy does not store routes for later re-use. */
    retrieve(route) {
        return null;
    }
    /**
     * Determines if a route should be reused.
     * This strategy returns `true` when the future route config and current route config are
     * identical.
     */
    shouldReuseRoute(future, curr) {
        return future.routeConfig === curr.routeConfig;
    }
}
export class DefaultRouteReuseStrategy extends BaseRouteReuseStrategy {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultRouteReuseStrategy, deps: null, target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultRouteReuseStrategy, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultRouteReuseStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVfcmV1c2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9yb3V0ZXIvc3JjL3JvdXRlX3JldXNlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBZSxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQXlCL0Q7Ozs7OztHQU1HO0FBRUgsTUFBTSxPQUFnQixrQkFBa0I7eUhBQWxCLGtCQUFrQjs2SEFBbEIsa0JBQWtCLGNBRGYsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQzs7c0dBQzlELGtCQUFrQjtrQkFEdkMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxFQUFDOztBQXNCckY7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFNLE9BQWdCLHNCQUFzQjtJQUMxQzs7O1NBR0s7SUFDTCxZQUFZLENBQUMsS0FBNkI7UUFDeEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsS0FBNkIsRUFBRSxZQUFpQyxJQUFTLENBQUM7SUFFaEYsK0VBQStFO0lBQy9FLFlBQVksQ0FBQyxLQUE2QjtRQUN4QyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxtRkFBbUY7SUFDbkYsUUFBUSxDQUFDLEtBQTZCO1FBQ3BDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxnQkFBZ0IsQ0FBQyxNQUE4QixFQUFFLElBQTRCO1FBQzNFLE9BQU8sTUFBTSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQ2pELENBQUM7Q0FDRjtBQUdELE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxzQkFBc0I7eUhBQXhELHlCQUF5Qjs2SEFBekIseUJBQXlCLGNBRGIsTUFBTTs7c0dBQ2xCLHlCQUF5QjtrQkFEckMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnRSZWYsIGluamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7T3V0bGV0Q29udGV4dH0gZnJvbSAnLi9yb3V0ZXJfb3V0bGV0X2NvbnRleHQnO1xuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZSwgQWN0aXZhdGVkUm91dGVTbmFwc2hvdH0gZnJvbSAnLi9yb3V0ZXJfc3RhdGUnO1xuaW1wb3J0IHtUcmVlTm9kZX0gZnJvbSAnLi91dGlscy90cmVlJztcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBSZXByZXNlbnRzIHRoZSBkZXRhY2hlZCByb3V0ZSB0cmVlLlxuICpcbiAqIFRoaXMgaXMgYW4gb3BhcXVlIHZhbHVlIHRoZSByb3V0ZXIgd2lsbCBnaXZlIHRvIGEgY3VzdG9tIHJvdXRlIHJldXNlIHN0cmF0ZWd5XG4gKiB0byBzdG9yZSBhbmQgcmV0cmlldmUgbGF0ZXIgb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBEZXRhY2hlZFJvdXRlSGFuZGxlID0ge307XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCB0eXBlIERldGFjaGVkUm91dGVIYW5kbGVJbnRlcm5hbCA9IHtcbiAgY29udGV4dHM6IE1hcDxzdHJpbmcsIE91dGxldENvbnRleHQ+LFxuICBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+LFxuICByb3V0ZTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGU+LFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBQcm92aWRlcyBhIHdheSB0byBjdXN0b21pemUgd2hlbiBhY3RpdmF0ZWQgcm91dGVzIGdldCByZXVzZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnLCB1c2VGYWN0b3J5OiAoKSA9PiBpbmplY3QoRGVmYXVsdFJvdXRlUmV1c2VTdHJhdGVneSl9KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJvdXRlUmV1c2VTdHJhdGVneSB7XG4gIC8qKiBEZXRlcm1pbmVzIGlmIHRoaXMgcm91dGUgKGFuZCBpdHMgc3VidHJlZSkgc2hvdWxkIGJlIGRldGFjaGVkIHRvIGJlIHJldXNlZCBsYXRlciAqL1xuICBhYnN0cmFjdCBzaG91bGREZXRhY2gocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGRldGFjaGVkIHJvdXRlLlxuICAgKlxuICAgKiBTdG9yaW5nIGEgYG51bGxgIHZhbHVlIHNob3VsZCBlcmFzZSB0aGUgcHJldmlvdXNseSBzdG9yZWQgdmFsdWUuXG4gICAqL1xuICBhYnN0cmFjdCBzdG9yZShyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgaGFuZGxlOiBEZXRhY2hlZFJvdXRlSGFuZGxlfG51bGwpOiB2b2lkO1xuXG4gIC8qKiBEZXRlcm1pbmVzIGlmIHRoaXMgcm91dGUgKGFuZCBpdHMgc3VidHJlZSkgc2hvdWxkIGJlIHJlYXR0YWNoZWQgKi9cbiAgYWJzdHJhY3Qgc2hvdWxkQXR0YWNoKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbjtcblxuICAvKiogUmV0cmlldmVzIHRoZSBwcmV2aW91c2x5IHN0b3JlZCByb3V0ZSAqL1xuICBhYnN0cmFjdCByZXRyaWV2ZShyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IERldGFjaGVkUm91dGVIYW5kbGV8bnVsbDtcblxuICAvKiogRGV0ZXJtaW5lcyBpZiBhIHJvdXRlIHNob3VsZCBiZSByZXVzZWQgKi9cbiAgYWJzdHJhY3Qgc2hvdWxkUmV1c2VSb3V0ZShmdXR1cmU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIGN1cnI6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBib29sZWFuO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoaXMgYmFzZSByb3V0ZSByZXVzZSBzdHJhdGVneSBvbmx5IHJldXNlcyByb3V0ZXMgd2hlbiB0aGUgbWF0Y2hlZCByb3V0ZXIgY29uZmlncyBhcmVcbiAqIGlkZW50aWNhbC4gVGhpcyBwcmV2ZW50cyBjb21wb25lbnRzIGZyb20gYmVpbmcgZGVzdHJveWVkIGFuZCByZWNyZWF0ZWRcbiAqIHdoZW4ganVzdCB0aGUgcm91dGUgcGFyYW1ldGVycywgcXVlcnkgcGFyYW1ldGVycyBvciBmcmFnbWVudCBjaGFuZ2VcbiAqICh0aGF0IGlzLCB0aGUgZXhpc3RpbmcgY29tcG9uZW50IGlzIF9yZXVzZWRfKS5cbiAqXG4gKiBUaGlzIHN0cmF0ZWd5IGRvZXMgbm90IHN0b3JlIGFueSByb3V0ZXMgZm9yIGxhdGVyIHJldXNlLlxuICpcbiAqIEFuZ3VsYXIgdXNlcyB0aGlzIHN0cmF0ZWd5IGJ5IGRlZmF1bHQuXG4gKlxuICpcbiAqIEl0IGNhbiBiZSB1c2VkIGFzIGEgYmFzZSBjbGFzcyBmb3IgY3VzdG9tIHJvdXRlIHJldXNlIHN0cmF0ZWdpZXMsIGkuZS4geW91IGNhbiBjcmVhdGUgeW91ciBvd25cbiAqIGNsYXNzIHRoYXQgZXh0ZW5kcyB0aGUgYEJhc2VSb3V0ZVJldXNlU3RyYXRlZ3lgIG9uZS5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VSb3V0ZVJldXNlU3RyYXRlZ3kgaW1wbGVtZW50cyBSb3V0ZVJldXNlU3RyYXRlZ3kge1xuICAvKipcbiAgICogV2hldGhlciB0aGUgZ2l2ZW4gcm91dGUgc2hvdWxkIGRldGFjaCBmb3IgbGF0ZXIgcmV1c2UuXG4gICAqIEFsd2F5cyByZXR1cm5zIGZhbHNlIGZvciBgQmFzZVJvdXRlUmV1c2VTdHJhdGVneWAuXG4gICAqICovXG4gIHNob3VsZERldGFjaChyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG5vLW9wOyB0aGUgcm91dGUgaXMgbmV2ZXIgc3RvcmVkIHNpbmNlIHRoaXMgc3RyYXRlZ3kgbmV2ZXIgZGV0YWNoZXMgcm91dGVzIGZvciBsYXRlciByZS11c2UuXG4gICAqL1xuICBzdG9yZShyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgZGV0YWNoZWRUcmVlOiBEZXRhY2hlZFJvdXRlSGFuZGxlKTogdm9pZCB7fVxuXG4gIC8qKiBSZXR1cm5zIGBmYWxzZWAsIG1lYW5pbmcgdGhlIHJvdXRlIChhbmQgaXRzIHN1YnRyZWUpIGlzIG5ldmVyIHJlYXR0YWNoZWQgKi9cbiAgc2hvdWxkQXR0YWNoKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYG51bGxgIGJlY2F1c2UgdGhpcyBzdHJhdGVneSBkb2VzIG5vdCBzdG9yZSByb3V0ZXMgZm9yIGxhdGVyIHJlLXVzZS4gKi9cbiAgcmV0cmlldmUocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBEZXRhY2hlZFJvdXRlSGFuZGxlfG51bGwge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSByb3V0ZSBzaG91bGQgYmUgcmV1c2VkLlxuICAgKiBUaGlzIHN0cmF0ZWd5IHJldHVybnMgYHRydWVgIHdoZW4gdGhlIGZ1dHVyZSByb3V0ZSBjb25maWcgYW5kIGN1cnJlbnQgcm91dGUgY29uZmlnIGFyZVxuICAgKiBpZGVudGljYWwuXG4gICAqL1xuICBzaG91bGRSZXVzZVJvdXRlKGZ1dHVyZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgY3VycjogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmdXR1cmUucm91dGVDb25maWcgPT09IGN1cnIucm91dGVDb25maWc7XG4gIH1cbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRGVmYXVsdFJvdXRlUmV1c2VTdHJhdGVneSBleHRlbmRzIEJhc2VSb3V0ZVJldXNlU3RyYXRlZ3kge1xufVxuIl19