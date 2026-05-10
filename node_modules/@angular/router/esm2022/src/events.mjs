/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export const IMPERATIVE_NAVIGATION = 'imperative';
/**
 * Base for events the router goes through, as opposed to events tied to a specific
 * route. Fired one time for any given navigation.
 *
 * The following code shows how a class subscribes to router events.
 *
 * ```ts
 * import {Event, RouterEvent, Router} from '@angular/router';
 *
 * class MyService {
 *   constructor(public router: Router) {
 *     router.events.pipe(
 *        filter((e: Event | RouterEvent): e is RouterEvent => e instanceof RouterEvent)
 *     ).subscribe((e: RouterEvent) => {
 *       // Do something
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link Event}
 * @see [Router events summary](guide/router-reference#router-events)
 * @publicApi
 */
export class RouterEvent {
    constructor(
    /** A unique ID that the router assigns to every router navigation. */
    id, 
    /** The URL that is the destination for this navigation. */
    url) {
        this.id = id;
        this.url = url;
    }
}
/**
 * An event triggered when a navigation starts.
 *
 * @publicApi
 */
export class NavigationStart extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    navigationTrigger = 'imperative', 
    /** @docsNotRequired */
    restoredState = null) {
        super(id, url);
        this.type = 0 /* EventType.NavigationStart */;
        this.navigationTrigger = navigationTrigger;
        this.restoredState = restoredState;
    }
    /** @docsNotRequired */
    toString() {
        return `NavigationStart(id: ${this.id}, url: '${this.url}')`;
    }
}
/**
 * An event triggered when a navigation ends successfully.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationCancel}
 * @see {@link NavigationError}
 *
 * @publicApi
 */
export class NavigationEnd extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.type = 1 /* EventType.NavigationEnd */;
    }
    /** @docsNotRequired */
    toString() {
        return `NavigationEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}')`;
    }
}
/**
 * An event triggered when a navigation is canceled, directly or indirectly.
 * This can happen for several reasons including when a route guard
 * returns `false` or initiates a redirect by returning a `UrlTree`.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationEnd}
 * @see {@link NavigationError}
 *
 * @publicApi
 */
export class NavigationCancel extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /**
     * A description of why the navigation was cancelled. For debug purposes only. Use `code`
     * instead for a stable cancellation reason that can be used in production.
     */
    reason, 
    /**
     * A code to indicate why the navigation was canceled. This cancellation code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    code) {
        super(id, url);
        this.reason = reason;
        this.code = code;
        this.type = 2 /* EventType.NavigationCancel */;
    }
    /** @docsNotRequired */
    toString() {
        return `NavigationCancel(id: ${this.id}, url: '${this.url}')`;
    }
}
/**
 * An event triggered when a navigation is skipped.
 * This can happen for a couple reasons including onSameUrlHandling
 * is set to `ignore` and the navigation URL is not different than the
 * current state.
 *
 * @publicApi
 */
export class NavigationSkipped extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /**
     * A description of why the navigation was skipped. For debug purposes only. Use `code`
     * instead for a stable skipped reason that can be used in production.
     */
    reason, 
    /**
     * A code to indicate why the navigation was skipped. This code is stable for
     * the reason and can be relied on whereas the `reason` string could change and should not be
     * used in production.
     */
    code) {
        super(id, url);
        this.reason = reason;
        this.code = code;
        this.type = 16 /* EventType.NavigationSkipped */;
    }
}
/**
 * An event triggered when a navigation fails due to an unexpected error.
 *
 * @see {@link NavigationStart}
 * @see {@link NavigationEnd}
 * @see {@link NavigationCancel}
 *
 * @publicApi
 */
export class NavigationError extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    error, 
    /**
     * The target of the navigation when the error occurred.
     *
     * Note that this can be `undefined` because an error could have occurred before the
     * `RouterStateSnapshot` was created for the navigation.
     */
    target) {
        super(id, url);
        this.error = error;
        this.target = target;
        this.type = 3 /* EventType.NavigationError */;
    }
    /** @docsNotRequired */
    toString() {
        return `NavigationError(id: ${this.id}, url: '${this.url}', error: ${this.error})`;
    }
}
/**
 * An event triggered when routes are recognized.
 *
 * @publicApi
 */
export class RoutesRecognized extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects, 
    /** @docsNotRequired */
    state) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.state = state;
        this.type = 4 /* EventType.RoutesRecognized */;
    }
    /** @docsNotRequired */
    toString() {
        return `RoutesRecognized(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
    }
}
/**
 * An event triggered at the start of the Guard phase of routing.
 *
 * @see {@link GuardsCheckEnd}
 *
 * @publicApi
 */
export class GuardsCheckStart extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects, 
    /** @docsNotRequired */
    state) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.state = state;
        this.type = 7 /* EventType.GuardsCheckStart */;
    }
    toString() {
        return `GuardsCheckStart(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
    }
}
/**
 * An event triggered at the end of the Guard phase of routing.
 *
 * @see {@link GuardsCheckStart}
 *
 * @publicApi
 */
export class GuardsCheckEnd extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects, 
    /** @docsNotRequired */
    state, 
    /** @docsNotRequired */
    shouldActivate) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.state = state;
        this.shouldActivate = shouldActivate;
        this.type = 8 /* EventType.GuardsCheckEnd */;
    }
    toString() {
        return `GuardsCheckEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state}, shouldActivate: ${this.shouldActivate})`;
    }
}
/**
 * An event triggered at the start of the Resolve phase of routing.
 *
 * Runs in the "resolve" phase whether or not there is anything to resolve.
 * In future, may change to only run when there are things to be resolved.
 *
 * @see {@link ResolveEnd}
 *
 * @publicApi
 */
export class ResolveStart extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects, 
    /** @docsNotRequired */
    state) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.state = state;
        this.type = 5 /* EventType.ResolveStart */;
    }
    toString() {
        return `ResolveStart(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
    }
}
/**
 * An event triggered at the end of the Resolve phase of routing.
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
export class ResolveEnd extends RouterEvent {
    constructor(
    /** @docsNotRequired */
    id, 
    /** @docsNotRequired */
    url, 
    /** @docsNotRequired */
    urlAfterRedirects, 
    /** @docsNotRequired */
    state) {
        super(id, url);
        this.urlAfterRedirects = urlAfterRedirects;
        this.state = state;
        this.type = 6 /* EventType.ResolveEnd */;
    }
    toString() {
        return `ResolveEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
    }
}
/**
 * An event triggered before lazy loading a route configuration.
 *
 * @see {@link RouteConfigLoadEnd}
 *
 * @publicApi
 */
export class RouteConfigLoadStart {
    constructor(
    /** @docsNotRequired */
    route) {
        this.route = route;
        this.type = 9 /* EventType.RouteConfigLoadStart */;
    }
    toString() {
        return `RouteConfigLoadStart(path: ${this.route.path})`;
    }
}
/**
 * An event triggered when a route has been lazy loaded.
 *
 * @see {@link RouteConfigLoadStart}
 *
 * @publicApi
 */
export class RouteConfigLoadEnd {
    constructor(
    /** @docsNotRequired */
    route) {
        this.route = route;
        this.type = 10 /* EventType.RouteConfigLoadEnd */;
    }
    toString() {
        return `RouteConfigLoadEnd(path: ${this.route.path})`;
    }
}
/**
 * An event triggered at the start of the child-activation
 * part of the Resolve phase of routing.
 * @see {@link ChildActivationEnd}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
export class ChildActivationStart {
    constructor(
    /** @docsNotRequired */
    snapshot) {
        this.snapshot = snapshot;
        this.type = 11 /* EventType.ChildActivationStart */;
    }
    toString() {
        const path = this.snapshot.routeConfig && this.snapshot.routeConfig.path || '';
        return `ChildActivationStart(path: '${path}')`;
    }
}
/**
 * An event triggered at the end of the child-activation part
 * of the Resolve phase of routing.
 * @see {@link ChildActivationStart}
 * @see {@link ResolveStart}
 * @publicApi
 */
export class ChildActivationEnd {
    constructor(
    /** @docsNotRequired */
    snapshot) {
        this.snapshot = snapshot;
        this.type = 12 /* EventType.ChildActivationEnd */;
    }
    toString() {
        const path = this.snapshot.routeConfig && this.snapshot.routeConfig.path || '';
        return `ChildActivationEnd(path: '${path}')`;
    }
}
/**
 * An event triggered at the start of the activation part
 * of the Resolve phase of routing.
 * @see {@link ActivationEnd}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
export class ActivationStart {
    constructor(
    /** @docsNotRequired */
    snapshot) {
        this.snapshot = snapshot;
        this.type = 13 /* EventType.ActivationStart */;
    }
    toString() {
        const path = this.snapshot.routeConfig && this.snapshot.routeConfig.path || '';
        return `ActivationStart(path: '${path}')`;
    }
}
/**
 * An event triggered at the end of the activation part
 * of the Resolve phase of routing.
 * @see {@link ActivationStart}
 * @see {@link ResolveStart}
 *
 * @publicApi
 */
export class ActivationEnd {
    constructor(
    /** @docsNotRequired */
    snapshot) {
        this.snapshot = snapshot;
        this.type = 14 /* EventType.ActivationEnd */;
    }
    toString() {
        const path = this.snapshot.routeConfig && this.snapshot.routeConfig.path || '';
        return `ActivationEnd(path: '${path}')`;
    }
}
/**
 * An event triggered by scrolling.
 *
 * @publicApi
 */
export class Scroll {
    constructor(
    /** @docsNotRequired */
    routerEvent, 
    /** @docsNotRequired */
    position, 
    /** @docsNotRequired */
    anchor) {
        this.routerEvent = routerEvent;
        this.position = position;
        this.anchor = anchor;
        this.type = 15 /* EventType.Scroll */;
    }
    toString() {
        const pos = this.position ? `${this.position[0]}, ${this.position[1]}` : null;
        return `Scroll(anchor: '${this.anchor}', position: '${pos}')`;
    }
}
export class BeforeActivateRoutes {
}
export class RedirectRequest {
    constructor(url) {
        this.url = url;
    }
}
export function stringifyEvent(routerEvent) {
    switch (routerEvent.type) {
        case 14 /* EventType.ActivationEnd */:
            return `ActivationEnd(path: '${routerEvent.snapshot.routeConfig?.path || ''}')`;
        case 13 /* EventType.ActivationStart */:
            return `ActivationStart(path: '${routerEvent.snapshot.routeConfig?.path || ''}')`;
        case 12 /* EventType.ChildActivationEnd */:
            return `ChildActivationEnd(path: '${routerEvent.snapshot.routeConfig?.path || ''}')`;
        case 11 /* EventType.ChildActivationStart */:
            return `ChildActivationStart(path: '${routerEvent.snapshot.routeConfig?.path || ''}')`;
        case 8 /* EventType.GuardsCheckEnd */:
            return `GuardsCheckEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state}, shouldActivate: ${routerEvent.shouldActivate})`;
        case 7 /* EventType.GuardsCheckStart */:
            return `GuardsCheckStart(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
        case 2 /* EventType.NavigationCancel */:
            return `NavigationCancel(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
        case 16 /* EventType.NavigationSkipped */:
            return `NavigationSkipped(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
        case 1 /* EventType.NavigationEnd */:
            return `NavigationEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}')`;
        case 3 /* EventType.NavigationError */:
            return `NavigationError(id: ${routerEvent.id}, url: '${routerEvent.url}', error: ${routerEvent.error})`;
        case 0 /* EventType.NavigationStart */:
            return `NavigationStart(id: ${routerEvent.id}, url: '${routerEvent.url}')`;
        case 6 /* EventType.ResolveEnd */:
            return `ResolveEnd(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
        case 5 /* EventType.ResolveStart */:
            return `ResolveStart(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
        case 10 /* EventType.RouteConfigLoadEnd */:
            return `RouteConfigLoadEnd(path: ${routerEvent.route.path})`;
        case 9 /* EventType.RouteConfigLoadStart */:
            return `RouteConfigLoadStart(path: ${routerEvent.route.path})`;
        case 4 /* EventType.RoutesRecognized */:
            return `RoutesRecognized(id: ${routerEvent.id}, url: '${routerEvent.url}', urlAfterRedirects: '${routerEvent.urlAfterRedirects}', state: ${routerEvent.state})`;
        case 15 /* EventType.Scroll */:
            const pos = routerEvent.position ? `${routerEvent.position[0]}, ${routerEvent.position[1]}` : null;
            return `Scroll(anchor: '${routerEvent.anchor}', position: '${pos}')`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9ldmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBZ0JILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLFlBQVksQ0FBQztBQTJCbEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUFDdEI7SUFDSSxzRUFBc0U7SUFDL0QsRUFBVTtJQUNqQiwyREFBMkQ7SUFDcEQsR0FBVztRQUZYLE9BQUUsR0FBRixFQUFFLENBQVE7UUFFVixRQUFHLEdBQUgsR0FBRyxDQUFRO0lBQUcsQ0FBQztDQUMzQjtBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxXQUFXO0lBZ0M5QztJQUNJLHVCQUF1QjtJQUN2QixFQUFVO0lBQ1YsdUJBQXVCO0lBQ3ZCLEdBQVc7SUFDWCx1QkFBdUI7SUFDdkIsb0JBQXVDLFlBQVk7SUFDbkQsdUJBQXVCO0lBQ3ZCLGdCQUErRCxJQUFJO1FBQ3JFLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUF4Q1IsU0FBSSxxQ0FBNkI7UUF5Q3hDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztRQUMzQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRUQsdUJBQXVCO0lBQ2QsUUFBUTtRQUNmLE9BQU8sdUJBQXVCLElBQUksQ0FBQyxFQUFFLFdBQVcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQy9ELENBQUM7Q0FDRjtBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxPQUFPLGFBQWMsU0FBUSxXQUFXO0lBRzVDO0lBQ0ksdUJBQXVCO0lBQ3ZCLEVBQVU7SUFDVix1QkFBdUI7SUFDdkIsR0FBVztJQUNYLHVCQUF1QjtJQUNoQixpQkFBeUI7UUFDbEMs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R29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSb3V0ZX0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBSb3V0ZXJTdGF0ZVNuYXBzaG90fSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge1VybFRyZWV9IGZyb20gJy4vdXJsX3RyZWUnO1xuXG4vKipcbiAqIElkZW50aWZpZXMgdGhlIGNhbGwgb3IgZXZlbnQgdGhhdCB0cmlnZ2VyZWQgYSBuYXZpZ2F0aW9uLlxuICpcbiAqICogJ2ltcGVyYXRpdmUnOiBUcmlnZ2VyZWQgYnkgYHJvdXRlci5uYXZpZ2F0ZUJ5VXJsKClgIG9yIGByb3V0ZXIubmF2aWdhdGUoKWAuXG4gKiAqICdwb3BzdGF0ZScgOiBUcmlnZ2VyZWQgYnkgYSBgcG9wc3RhdGVgIGV2ZW50LlxuICogKiAnaGFzaGNoYW5nZSctOiBUcmlnZ2VyZWQgYnkgYSBgaGFzaGNoYW5nZWAgZXZlbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBOYXZpZ2F0aW9uVHJpZ2dlciA9ICdpbXBlcmF0aXZlJ3wncG9wc3RhdGUnfCdoYXNoY2hhbmdlJztcbmV4cG9ydCBjb25zdCBJTVBFUkFUSVZFX05BVklHQVRJT04gPSAnaW1wZXJhdGl2ZSc7XG5cbi8qKlxuICogSWRlbnRpZmllcyB0aGUgdHlwZSBvZiBhIHJvdXRlciBldmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEV2ZW50VHlwZSB7XG4gIE5hdmlnYXRpb25TdGFydCxcbiAgTmF2aWdhdGlvbkVuZCxcbiAgTmF2aWdhdGlvbkNhbmNlbCxcbiAgTmF2aWdhdGlvbkVycm9yLFxuICBSb3V0ZXNSZWNvZ25pemVkLFxuICBSZXNvbHZlU3RhcnQsXG4gIFJlc29sdmVFbmQsXG4gIEd1YXJkc0NoZWNrU3RhcnQsXG4gIEd1YXJkc0NoZWNrRW5kLFxuICBSb3V0ZUNvbmZpZ0xvYWRTdGFydCxcbiAgUm91dGVDb25maWdMb2FkRW5kLFxuICBDaGlsZEFjdGl2YXRpb25TdGFydCxcbiAgQ2hpbGRBY3RpdmF0aW9uRW5kLFxuICBBY3RpdmF0aW9uU3RhcnQsXG4gIEFjdGl2YXRpb25FbmQsXG4gIFNjcm9sbCxcbiAgTmF2aWdhdGlvblNraXBwZWQsXG59XG5cbi8qKlxuICogQmFzZSBmb3IgZXZlbnRzIHRoZSByb3V0ZXIgZ29lcyB0aHJvdWdoLCBhcyBvcHBvc2VkIHRvIGV2ZW50cyB0aWVkIHRvIGEgc3BlY2lmaWNcbiAqIHJvdXRlLiBGaXJlZCBvbmUgdGltZSBmb3IgYW55IGdpdmVuIG5hdmlnYXRpb24uXG4gKlxuICogVGhlIGZvbGxvd2luZyBjb2RlIHNob3dzIGhvdyBhIGNsYXNzIHN1YnNjcmliZXMgdG8gcm91dGVyIGV2ZW50cy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtFdmVudCwgUm91dGVyRXZlbnQsIFJvdXRlcn0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbiAqXG4gKiBjbGFzcyBNeVNlcnZpY2Uge1xuICogICBjb25zdHJ1Y3RvcihwdWJsaWMgcm91dGVyOiBSb3V0ZXIpIHtcbiAqICAgICByb3V0ZXIuZXZlbnRzLnBpcGUoXG4gKiAgICAgICAgZmlsdGVyKChlOiBFdmVudCB8IFJvdXRlckV2ZW50KTogZSBpcyBSb3V0ZXJFdmVudCA9PiBlIGluc3RhbmNlb2YgUm91dGVyRXZlbnQpXG4gKiAgICAgKS5zdWJzY3JpYmUoKGU6IFJvdXRlckV2ZW50KSA9PiB7XG4gKiAgICAgICAvLyBEbyBzb21ldGhpbmdcbiAqICAgICB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHNlZSB7QGxpbmsgRXZlbnR9XG4gKiBAc2VlIFtSb3V0ZXIgZXZlbnRzIHN1bW1hcnldKGd1aWRlL3JvdXRlci1yZWZlcmVuY2Ujcm91dGVyLWV2ZW50cylcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRlckV2ZW50IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQSB1bmlxdWUgSUQgdGhhdCB0aGUgcm91dGVyIGFzc2lnbnMgdG8gZXZlcnkgcm91dGVyIG5hdmlnYXRpb24uICovXG4gICAgICBwdWJsaWMgaWQ6IG51bWJlcixcbiAgICAgIC8qKiBUaGUgVVJMIHRoYXQgaXMgdGhlIGRlc3RpbmF0aW9uIGZvciB0aGlzIG5hdmlnYXRpb24uICovXG4gICAgICBwdWJsaWMgdXJsOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gYSBuYXZpZ2F0aW9uIHN0YXJ0cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOYXZpZ2F0aW9uU3RhcnQgZXh0ZW5kcyBSb3V0ZXJFdmVudCB7XG4gIHJlYWRvbmx5IHR5cGUgPSBFdmVudFR5cGUuTmF2aWdhdGlvblN0YXJ0O1xuXG4gIC8qKlxuICAgKiBJZGVudGlmaWVzIHRoZSBjYWxsIG9yIGV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBuYXZpZ2F0aW9uLlxuICAgKiBBbiBgaW1wZXJhdGl2ZWAgdHJpZ2dlciBpcyBhIGNhbGwgdG8gYHJvdXRlci5uYXZpZ2F0ZUJ5VXJsKClgIG9yIGByb3V0ZXIubmF2aWdhdGUoKWAuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25FbmR9XG4gICAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25DYW5jZWx9XG4gICAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25FcnJvcn1cbiAgICovXG4gIG5hdmlnYXRpb25UcmlnZ2VyPzogTmF2aWdhdGlvblRyaWdnZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBuYXZpZ2F0aW9uIHN0YXRlIHRoYXQgd2FzIHByZXZpb3VzbHkgc3VwcGxpZWQgdG8gdGhlIGBwdXNoU3RhdGVgIGNhbGwsXG4gICAqIHdoZW4gdGhlIG5hdmlnYXRpb24gaXMgdHJpZ2dlcmVkIGJ5IGEgYHBvcHN0YXRlYCBldmVudC4gT3RoZXJ3aXNlIG51bGwuXG4gICAqXG4gICAqIFRoZSBzdGF0ZSBvYmplY3QgaXMgZGVmaW5lZCBieSBgTmF2aWdhdGlvbkV4dHJhc2AsIGFuZCBjb250YWlucyBhbnlcbiAgICogZGV2ZWxvcGVyLWRlZmluZWQgc3RhdGUgdmFsdWUsIGFzIHdlbGwgYXMgYSB1bmlxdWUgSUQgdGhhdFxuICAgKiB0aGUgcm91dGVyIGFzc2lnbnMgdG8gZXZlcnkgcm91dGVyIHRyYW5zaXRpb24vbmF2aWdhdGlvbi5cbiAgICpcbiAgICogRnJvbSB0aGUgcGVyc3BlY3RpdmUgb2YgdGhlIHJvdXRlciwgdGhlIHJvdXRlciBuZXZlciBcImdvZXMgYmFja1wiLlxuICAgKiBXaGVuIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGUgYmFjayBidXR0b24gaW4gdGhlIGJyb3dzZXIsXG4gICAqIGEgbmV3IG5hdmlnYXRpb24gSUQgaXMgY3JlYXRlZC5cbiAgICpcbiAgICogVXNlIHRoZSBJRCBpbiB0aGlzIHByZXZpb3VzLXN0YXRlIG9iamVjdCB0byBkaWZmZXJlbnRpYXRlIGJldHdlZW4gYSBuZXdseSBjcmVhdGVkXG4gICAqIHN0YXRlIGFuZCBvbmUgcmV0dXJuZWQgdG8gYnkgYSBgcG9wc3RhdGVgIGV2ZW50LCBzbyB0aGF0IHlvdSBjYW4gcmVzdG9yZSBzb21lXG4gICAqIHJlbWVtYmVyZWQgc3RhdGUsIHN1Y2ggYXMgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKlxuICAgKi9cbiAgcmVzdG9yZWRTdGF0ZT86IHtbazogc3RyaW5nXTogYW55LCBuYXZpZ2F0aW9uSWQ6IG51bWJlcn18bnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBpZDogbnVtYmVyLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHVybDogc3RyaW5nLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIG5hdmlnYXRpb25UcmlnZ2VyOiBOYXZpZ2F0aW9uVHJpZ2dlciA9ICdpbXBlcmF0aXZlJyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICByZXN0b3JlZFN0YXRlOiB7W2s6IHN0cmluZ106IGFueSwgbmF2aWdhdGlvbklkOiBudW1iZXJ9fG51bGwgPSBudWxsKSB7XG4gICAgc3VwZXIoaWQsIHVybCk7XG4gICAgdGhpcy5uYXZpZ2F0aW9uVHJpZ2dlciA9IG5hdmlnYXRpb25UcmlnZ2VyO1xuICAgIHRoaXMucmVzdG9yZWRTdGF0ZSA9IHJlc3RvcmVkU3RhdGU7XG4gIH1cblxuICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICBvdmVycmlkZSB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgTmF2aWdhdGlvblN0YXJ0KGlkOiAke3RoaXMuaWR9LCB1cmw6ICcke3RoaXMudXJsfScpYDtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIGEgbmF2aWdhdGlvbiBlbmRzIHN1Y2Nlc3NmdWxseS5cbiAqXG4gKiBAc2VlIHtAbGluayBOYXZpZ2F0aW9uU3RhcnR9XG4gKiBAc2VlIHtAbGluayBOYXZpZ2F0aW9uQ2FuY2VsfVxuICogQHNlZSB7QGxpbmsgTmF2aWdhdGlvbkVycm9yfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25FbmQgZXh0ZW5kcyBSb3V0ZXJFdmVudCB7XG4gIHJlYWRvbmx5IHR5cGUgPSBFdmVudFR5cGUuTmF2aWdhdGlvbkVuZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBpZDogbnVtYmVyLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHVybDogc3RyaW5nLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHB1YmxpYyB1cmxBZnRlclJlZGlyZWN0czogc3RyaW5nKSB7XG4gICAgc3VwZXIoaWQsIHVybCk7XG4gIH1cblxuICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICBvdmVycmlkZSB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgTmF2aWdhdGlvbkVuZChpZDogJHt0aGlzLmlkfSwgdXJsOiAnJHt0aGlzLnVybH0nLCB1cmxBZnRlclJlZGlyZWN0czogJyR7XG4gICAgICAgIHRoaXMudXJsQWZ0ZXJSZWRpcmVjdHN9JylgO1xuICB9XG59XG5cbi8qKlxuICogQSBjb2RlIGZvciB0aGUgYE5hdmlnYXRpb25DYW5jZWxgIGV2ZW50IG9mIHRoZSBgUm91dGVyYCB0byBpbmRpY2F0ZSB0aGVcbiAqIHJlYXNvbiBhIG5hdmlnYXRpb24gZmFpbGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTmF2aWdhdGlvbkNhbmNlbGxhdGlvbkNvZGUge1xuICAvKipcbiAgICogQSBuYXZpZ2F0aW9uIGZhaWxlZCBiZWNhdXNlIGEgZ3VhcmQgcmV0dXJuZWQgYSBgVXJsVHJlZWAgdG8gcmVkaXJlY3QuXG4gICAqL1xuICBSZWRpcmVjdCxcbiAgLyoqXG4gICAqIEEgbmF2aWdhdGlvbiBmYWlsZWQgYmVjYXVzZSBhIG1vcmUgcmVjZW50IG5hdmlnYXRpb24gc3RhcnRlZC5cbiAgICovXG4gIFN1cGVyc2VkZWRCeU5ld05hdmlnYXRpb24sXG4gIC8qKlxuICAgKiBBIG5hdmlnYXRpb24gZmFpbGVkIGJlY2F1c2Ugb25lIG9mIHRoZSByZXNvbHZlcnMgY29tcGxldGVkIHdpdGhvdXQgZW1pdHRpbmcgYSB2YWx1ZS5cbiAgICovXG4gIE5vRGF0YUZyb21SZXNvbHZlcixcbiAgLyoqXG4gICAqIEEgbmF2aWdhdGlvbiBmYWlsZWQgYmVjYXVzZSBhIGd1YXJkIHJldHVybmVkIGBmYWxzZWAuXG4gICAqL1xuICBHdWFyZFJlamVjdGVkLFxufVxuXG4vKipcbiAqIEEgY29kZSBmb3IgdGhlIGBOYXZpZ2F0aW9uU2tpcHBlZGAgZXZlbnQgb2YgdGhlIGBSb3V0ZXJgIHRvIGluZGljYXRlIHRoZVxuICogcmVhc29uIGEgbmF2aWdhdGlvbiB3YXMgc2tpcHBlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIE5hdmlnYXRpb25Ta2lwcGVkQ29kZSB7XG4gIC8qKlxuICAgKiBBIG5hdmlnYXRpb24gd2FzIHNraXBwZWQgYmVjYXVzZSB0aGUgbmF2aWdhdGlvbiBVUkwgd2FzIHRoZSBzYW1lIGFzIHRoZSBjdXJyZW50IFJvdXRlciBVUkwuXG4gICAqL1xuICBJZ25vcmVkU2FtZVVybE5hdmlnYXRpb24sXG4gIC8qKlxuICAgKiBBIG5hdmlnYXRpb24gd2FzIHNraXBwZWQgYmVjYXVzZSB0aGUgY29uZmlndXJlZCBgVXJsSGFuZGxpbmdTdHJhdGVneWAgcmV0dXJuIGBmYWxzZWAgZm9yIGJvdGhcbiAgICogdGhlIGN1cnJlbnQgUm91dGVyIFVSTCBhbmQgdGhlIHRhcmdldCBvZiB0aGUgbmF2aWdhdGlvbi5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgVXJsSGFuZGxpbmdTdHJhdGVneX1cbiAgICovXG4gIElnbm9yZWRCeVVybEhhbmRsaW5nU3RyYXRlZ3ksXG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gYSBuYXZpZ2F0aW9uIGlzIGNhbmNlbGVkLCBkaXJlY3RseSBvciBpbmRpcmVjdGx5LlxuICogVGhpcyBjYW4gaGFwcGVuIGZvciBzZXZlcmFsIHJlYXNvbnMgaW5jbHVkaW5nIHdoZW4gYSByb3V0ZSBndWFyZFxuICogcmV0dXJucyBgZmFsc2VgIG9yIGluaXRpYXRlcyBhIHJlZGlyZWN0IGJ5IHJldHVybmluZyBhIGBVcmxUcmVlYC5cbiAqXG4gKiBAc2VlIHtAbGluayBOYXZpZ2F0aW9uU3RhcnR9XG4gKiBAc2VlIHtAbGluayBOYXZpZ2F0aW9uRW5kfVxuICogQHNlZSB7QGxpbmsgTmF2aWdhdGlvbkVycm9yfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25DYW5jZWwgZXh0ZW5kcyBSb3V0ZXJFdmVudCB7XG4gIHJlYWRvbmx5IHR5cGUgPSBFdmVudFR5cGUuTmF2aWdhdGlvbkNhbmNlbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBpZDogbnVtYmVyLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHVybDogc3RyaW5nLFxuICAgICAgLyoqXG4gICAgICAgKiBBIGRlc2NyaXB0aW9uIG9mIHdoeSB0aGUgbmF2aWdhdGlvbiB3YXMgY2FuY2VsbGVkLiBGb3IgZGVidWcgcHVycG9zZXMgb25seS4gVXNlIGBjb2RlYFxuICAgICAgICogaW5zdGVhZCBmb3IgYSBzdGFibGUgY2FuY2VsbGF0aW9uIHJlYXNvbiB0aGF0IGNhbiBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyByZWFzb246IHN0cmluZyxcbiAgICAgIC8qKlxuICAgICAgICogQSBjb2RlIHRvIGluZGljYXRlIHdoeSB0aGUgbmF2aWdhdGlvbiB3YXMgY2FuY2VsZWQuIFRoaXMgY2FuY2VsbGF0aW9uIGNvZGUgaXMgc3RhYmxlIGZvclxuICAgICAgICogdGhlIHJlYXNvbiBhbmQgY2FuIGJlIHJlbGllZCBvbiB3aGVyZWFzIHRoZSBgcmVhc29uYCBzdHJpbmcgY291bGQgY2hhbmdlIGFuZCBzaG91bGQgbm90IGJlXG4gICAgICAgKiB1c2VkIGluIHByb2R1Y3Rpb24uXG4gICAgICAgKi9cbiAgICAgIHJlYWRvbmx5IGNvZGU/OiBOYXZpZ2F0aW9uQ2FuY2VsbGF0aW9uQ29kZSkge1xuICAgIHN1cGVyKGlkLCB1cmwpO1xuICB9XG5cbiAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgb3ZlcnJpZGUgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYE5hdmlnYXRpb25DYW5jZWwoaWQ6ICR7dGhpcy5pZH0sIHVybDogJyR7dGhpcy51cmx9JylgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gYSBuYXZpZ2F0aW9uIGlzIHNraXBwZWQuXG4gKiBUaGlzIGNhbiBoYXBwZW4gZm9yIGEgY291cGxlIHJlYXNvbnMgaW5jbHVkaW5nIG9uU2FtZVVybEhhbmRsaW5nXG4gKiBpcyBzZXQgdG8gYGlnbm9yZWAgYW5kIHRoZSBuYXZpZ2F0aW9uIFVSTCBpcyBub3QgZGlmZmVyZW50IHRoYW4gdGhlXG4gKiBjdXJyZW50IHN0YXRlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25Ta2lwcGVkIGV4dGVuZHMgUm91dGVyRXZlbnQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLk5hdmlnYXRpb25Ta2lwcGVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIGlkOiBudW1iZXIsXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgdXJsOiBzdHJpbmcsXG4gICAgICAvKipcbiAgICAgICAqIEEgZGVzY3JpcHRpb24gb2Ygd2h5IHRoZSBuYXZpZ2F0aW9uIHdhcyBza2lwcGVkLiBGb3IgZGVidWcgcHVycG9zZXMgb25seS4gVXNlIGBjb2RlYFxuICAgICAgICogaW5zdGVhZCBmb3IgYSBzdGFibGUgc2tpcHBlZCByZWFzb24gdGhhdCBjYW4gYmUgdXNlZCBpbiBwcm9kdWN0aW9uLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgcmVhc29uOiBzdHJpbmcsXG4gICAgICAvKipcbiAgICAgICAqIEEgY29kZSB0byBpbmRpY2F0ZSB3aHkgdGhlIG5hdmlnYXRpb24gd2FzIHNraXBwZWQuIFRoaXMgY29kZSBpcyBzdGFibGUgZm9yXG4gICAgICAgKiB0aGUgcmVhc29uIGFuZCBjYW4gYmUgcmVsaWVkIG9uIHdoZXJlYXMgdGhlIGByZWFzb25gIHN0cmluZyBjb3VsZCBjaGFuZ2UgYW5kIHNob3VsZCBub3QgYmVcbiAgICAgICAqIHVzZWQgaW4gcHJvZHVjdGlvbi5cbiAgICAgICAqL1xuICAgICAgcmVhZG9ubHkgY29kZT86IE5hdmlnYXRpb25Ta2lwcGVkQ29kZSkge1xuICAgIHN1cGVyKGlkLCB1cmwpO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gYSBuYXZpZ2F0aW9uIGZhaWxzIGR1ZSB0byBhbiB1bmV4cGVjdGVkIGVycm9yLlxuICpcbiAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25TdGFydH1cbiAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25FbmR9XG4gKiBAc2VlIHtAbGluayBOYXZpZ2F0aW9uQ2FuY2VsfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25FcnJvciBleHRlbmRzIFJvdXRlckV2ZW50IHtcbiAgcmVhZG9ubHkgdHlwZSA9IEV2ZW50VHlwZS5OYXZpZ2F0aW9uRXJyb3I7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgaWQ6IG51bWJlcixcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICB1cmw6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgZXJyb3I6IGFueSxcbiAgICAgIC8qKlxuICAgICAgICogVGhlIHRhcmdldCBvZiB0aGUgbmF2aWdhdGlvbiB3aGVuIHRoZSBlcnJvciBvY2N1cnJlZC5cbiAgICAgICAqXG4gICAgICAgKiBOb3RlIHRoYXQgdGhpcyBjYW4gYmUgYHVuZGVmaW5lZGAgYmVjYXVzZSBhbiBlcnJvciBjb3VsZCBoYXZlIG9jY3VycmVkIGJlZm9yZSB0aGVcbiAgICAgICAqIGBSb3V0ZXJTdGF0ZVNuYXBzaG90YCB3YXMgY3JlYXRlZCBmb3IgdGhlIG5hdmlnYXRpb24uXG4gICAgICAgKi9cbiAgICAgIHJlYWRvbmx5IHRhcmdldD86IFJvdXRlclN0YXRlU25hcHNob3QpIHtcbiAgICBzdXBlcihpZCwgdXJsKTtcbiAgfVxuXG4gIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBOYXZpZ2F0aW9uRXJyb3IoaWQ6ICR7dGhpcy5pZH0sIHVybDogJyR7dGhpcy51cmx9JywgZXJyb3I6ICR7dGhpcy5lcnJvcn0pYDtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIHJvdXRlcyBhcmUgcmVjb2duaXplZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXNSZWNvZ25pemVkIGV4dGVuZHMgUm91dGVyRXZlbnQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLlJvdXRlc1JlY29nbml6ZWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgaWQ6IG51bWJlcixcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICB1cmw6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgdXJsQWZ0ZXJSZWRpcmVjdHM6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpIHtcbiAgICBzdXBlcihpZCwgdXJsKTtcbiAgfVxuXG4gIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBSb3V0ZXNSZWNvZ25pemVkKGlkOiAke3RoaXMuaWR9LCB1cmw6ICcke3RoaXMudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtcbiAgICAgICAgdGhpcy51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHt0aGlzLnN0YXRlfSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBzdGFydCBvZiB0aGUgR3VhcmQgcGhhc2Ugb2Ygcm91dGluZy5cbiAqXG4gKiBAc2VlIHtAbGluayBHdWFyZHNDaGVja0VuZH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBHdWFyZHNDaGVja1N0YXJ0IGV4dGVuZHMgUm91dGVyRXZlbnQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLkd1YXJkc0NoZWNrU3RhcnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgaWQ6IG51bWJlcixcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICB1cmw6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgdXJsQWZ0ZXJSZWRpcmVjdHM6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpIHtcbiAgICBzdXBlcihpZCwgdXJsKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBHdWFyZHNDaGVja1N0YXJ0KGlkOiAke3RoaXMuaWR9LCB1cmw6ICcke3RoaXMudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtcbiAgICAgICAgdGhpcy51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHt0aGlzLnN0YXRlfSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBlbmQgb2YgdGhlIEd1YXJkIHBoYXNlIG9mIHJvdXRpbmcuXG4gKlxuICogQHNlZSB7QGxpbmsgR3VhcmRzQ2hlY2tTdGFydH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBHdWFyZHNDaGVja0VuZCBleHRlbmRzIFJvdXRlckV2ZW50IHtcbiAgcmVhZG9ubHkgdHlwZSA9IEV2ZW50VHlwZS5HdWFyZHNDaGVja0VuZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBpZDogbnVtYmVyLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHVybDogc3RyaW5nLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHB1YmxpYyB1cmxBZnRlclJlZGlyZWN0czogc3RyaW5nLFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHB1YmxpYyBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdCxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc2hvdWxkQWN0aXZhdGU6IGJvb2xlYW4pIHtcbiAgICBzdXBlcihpZCwgdXJsKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBHdWFyZHNDaGVja0VuZChpZDogJHt0aGlzLmlkfSwgdXJsOiAnJHt0aGlzLnVybH0nLCB1cmxBZnRlclJlZGlyZWN0czogJyR7XG4gICAgICAgIHRoaXMudXJsQWZ0ZXJSZWRpcmVjdHN9Jywgc3RhdGU6ICR7dGhpcy5zdGF0ZX0sIHNob3VsZEFjdGl2YXRlOiAke3RoaXMuc2hvdWxkQWN0aXZhdGV9KWA7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBSZXNvbHZlIHBoYXNlIG9mIHJvdXRpbmcuXG4gKlxuICogUnVucyBpbiB0aGUgXCJyZXNvbHZlXCIgcGhhc2Ugd2hldGhlciBvciBub3QgdGhlcmUgaXMgYW55dGhpbmcgdG8gcmVzb2x2ZS5cbiAqIEluIGZ1dHVyZSwgbWF5IGNoYW5nZSB0byBvbmx5IHJ1biB3aGVuIHRoZXJlIGFyZSB0aGluZ3MgdG8gYmUgcmVzb2x2ZWQuXG4gKlxuICogQHNlZSB7QGxpbmsgUmVzb2x2ZUVuZH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXNvbHZlU3RhcnQgZXh0ZW5kcyBSb3V0ZXJFdmVudCB7XG4gIHJlYWRvbmx5IHR5cGUgPSBFdmVudFR5cGUuUmVzb2x2ZVN0YXJ0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIGlkOiBudW1iZXIsXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgdXJsOiBzdHJpbmcsXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgcHVibGljIHVybEFmdGVyUmVkaXJlY3RzOiBzdHJpbmcsXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgcHVibGljIHN0YXRlOiBSb3V0ZXJTdGF0ZVNuYXBzaG90KSB7XG4gICAgc3VwZXIoaWQsIHVybCk7XG4gIH1cblxuICBvdmVycmlkZSB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgUmVzb2x2ZVN0YXJ0KGlkOiAke3RoaXMuaWR9LCB1cmw6ICcke3RoaXMudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtcbiAgICAgICAgdGhpcy51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHt0aGlzLnN0YXRlfSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBlbmQgb2YgdGhlIFJlc29sdmUgcGhhc2Ugb2Ygcm91dGluZy5cbiAqIEBzZWUge0BsaW5rIFJlc29sdmVTdGFydH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXNvbHZlRW5kIGV4dGVuZHMgUm91dGVyRXZlbnQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLlJlc29sdmVFbmQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgaWQ6IG51bWJlcixcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICB1cmw6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgdXJsQWZ0ZXJSZWRpcmVjdHM6IHN0cmluZyxcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpIHtcbiAgICBzdXBlcihpZCwgdXJsKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBSZXNvbHZlRW5kKGlkOiAke3RoaXMuaWR9LCB1cmw6ICcke3RoaXMudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtcbiAgICAgICAgdGhpcy51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHt0aGlzLnN0YXRlfSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGJlZm9yZSBsYXp5IGxvYWRpbmcgYSByb3V0ZSBjb25maWd1cmF0aW9uLlxuICpcbiAqIEBzZWUge0BsaW5rIFJvdXRlQ29uZmlnTG9hZEVuZH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZUNvbmZpZ0xvYWRTdGFydCB7XG4gIHJlYWRvbmx5IHR5cGUgPSBFdmVudFR5cGUuUm91dGVDb25maWdMb2FkU3RhcnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogQGRvY3NOb3RSZXF1aXJlZCAqL1xuICAgICAgcHVibGljIHJvdXRlOiBSb3V0ZSkge31cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFJvdXRlQ29uZmlnTG9hZFN0YXJ0KHBhdGg6ICR7dGhpcy5yb3V0ZS5wYXRofSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIHdoZW4gYSByb3V0ZSBoYXMgYmVlbiBsYXp5IGxvYWRlZC5cbiAqXG4gKiBAc2VlIHtAbGluayBSb3V0ZUNvbmZpZ0xvYWRTdGFydH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZUNvbmZpZ0xvYWRFbmQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLlJvdXRlQ29uZmlnTG9hZEVuZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgcm91dGU6IFJvdXRlKSB7fVxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBgUm91dGVDb25maWdMb2FkRW5kKHBhdGg6ICR7dGhpcy5yb3V0ZS5wYXRofSlgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBzdGFydCBvZiB0aGUgY2hpbGQtYWN0aXZhdGlvblxuICogcGFydCBvZiB0aGUgUmVzb2x2ZSBwaGFzZSBvZiByb3V0aW5nLlxuICogQHNlZSB7QGxpbmsgQ2hpbGRBY3RpdmF0aW9uRW5kfVxuICogQHNlZSB7QGxpbmsgUmVzb2x2ZVN0YXJ0fVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENoaWxkQWN0aXZhdGlvblN0YXJ0IHtcbiAgcmVhZG9ubHkgdHlwZSA9IEV2ZW50VHlwZS5DaGlsZEFjdGl2YXRpb25TdGFydDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc25hcHNob3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpIHt9XG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuc25hcHNob3Qucm91dGVDb25maWcgJiYgdGhpcy5zbmFwc2hvdC5yb3V0ZUNvbmZpZy5wYXRoIHx8ICcnO1xuICAgIHJldHVybiBgQ2hpbGRBY3RpdmF0aW9uU3RhcnQocGF0aDogJyR7cGF0aH0nKWA7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgYXQgdGhlIGVuZCBvZiB0aGUgY2hpbGQtYWN0aXZhdGlvbiBwYXJ0XG4gKiBvZiB0aGUgUmVzb2x2ZSBwaGFzZSBvZiByb3V0aW5nLlxuICogQHNlZSB7QGxpbmsgQ2hpbGRBY3RpdmF0aW9uU3RhcnR9XG4gKiBAc2VlIHtAbGluayBSZXNvbHZlU3RhcnR9XG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGlsZEFjdGl2YXRpb25FbmQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLkNoaWxkQWN0aXZhdGlvbkVuZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc25hcHNob3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpIHt9XG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuc25hcHNob3Qucm91dGVDb25maWcgJiYgdGhpcy5zbmFwc2hvdC5yb3V0ZUNvbmZpZy5wYXRoIHx8ICcnO1xuICAgIHJldHVybiBgQ2hpbGRBY3RpdmF0aW9uRW5kKHBhdGg6ICcke3BhdGh9JylgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBzdGFydCBvZiB0aGUgYWN0aXZhdGlvbiBwYXJ0XG4gKiBvZiB0aGUgUmVzb2x2ZSBwaGFzZSBvZiByb3V0aW5nLlxuICogQHNlZSB7QGxpbmsgQWN0aXZhdGlvbkVuZH1cbiAqIEBzZWUge0BsaW5rIFJlc29sdmVTdGFydH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBBY3RpdmF0aW9uU3RhcnQge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLkFjdGl2YXRpb25TdGFydDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICBwdWJsaWMgc25hcHNob3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpIHt9XG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuc25hcHNob3Qucm91dGVDb25maWcgJiYgdGhpcy5zbmFwc2hvdC5yb3V0ZUNvbmZpZy5wYXRoIHx8ICcnO1xuICAgIHJldHVybiBgQWN0aXZhdGlvblN0YXJ0KHBhdGg6ICcke3BhdGh9JylgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGF0IHRoZSBlbmQgb2YgdGhlIGFjdGl2YXRpb24gcGFydFxuICogb2YgdGhlIFJlc29sdmUgcGhhc2Ugb2Ygcm91dGluZy5cbiAqIEBzZWUge0BsaW5rIEFjdGl2YXRpb25TdGFydH1cbiAqIEBzZWUge0BsaW5rIFJlc29sdmVTdGFydH1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBBY3RpdmF0aW9uRW5kIHtcbiAgcmVhZG9ubHkgdHlwZSA9IEV2ZW50VHlwZS5BY3RpdmF0aW9uRW5kO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHB1YmxpYyBzbmFwc2hvdDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCkge31cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5zbmFwc2hvdC5yb3V0ZUNvbmZpZyAmJiB0aGlzLnNuYXBzaG90LnJvdXRlQ29uZmlnLnBhdGggfHwgJyc7XG4gICAgcmV0dXJuIGBBY3RpdmF0aW9uRW5kKHBhdGg6ICcke3BhdGh9JylgO1xuICB9XG59XG5cbi8qKlxuICogQW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHNjcm9sbGluZy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBTY3JvbGwge1xuICByZWFkb25seSB0eXBlID0gRXZlbnRUeXBlLlNjcm9sbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICByZWFkb25seSByb3V0ZXJFdmVudDogTmF2aWdhdGlvbkVuZHxOYXZpZ2F0aW9uU2tpcHBlZCxcblxuICAgICAgLyoqIEBkb2NzTm90UmVxdWlyZWQgKi9cbiAgICAgIHJlYWRvbmx5IHBvc2l0aW9uOiBbbnVtYmVyLCBudW1iZXJdfG51bGwsXG5cbiAgICAgIC8qKiBAZG9jc05vdFJlcXVpcmVkICovXG4gICAgICByZWFkb25seSBhbmNob3I6IHN0cmluZ3xudWxsKSB7fVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5wb3NpdGlvbiA/IGAke3RoaXMucG9zaXRpb25bMF19LCAke3RoaXMucG9zaXRpb25bMV19YCA6IG51bGw7XG4gICAgcmV0dXJuIGBTY3JvbGwoYW5jaG9yOiAnJHt0aGlzLmFuY2hvcn0nLCBwb3NpdGlvbjogJyR7cG9zfScpYDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmVmb3JlQWN0aXZhdGVSb3V0ZXMge31cbmV4cG9ydCBjbGFzcyBSZWRpcmVjdFJlcXVlc3Qge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSB1cmw6IFVybFRyZWUpIHt9XG59XG5leHBvcnQgdHlwZSBQcml2YXRlUm91dGVyRXZlbnRzID0gQmVmb3JlQWN0aXZhdGVSb3V0ZXN8UmVkaXJlY3RSZXF1ZXN0O1xuXG4vKipcbiAqIFJvdXRlciBldmVudHMgdGhhdCBhbGxvdyB5b3UgdG8gdHJhY2sgdGhlIGxpZmVjeWNsZSBvZiB0aGUgcm91dGVyLlxuICpcbiAqIFRoZSBldmVudHMgb2NjdXIgaW4gdGhlIGZvbGxvd2luZyBzZXF1ZW5jZTpcbiAqXG4gKiAqIFtOYXZpZ2F0aW9uU3RhcnRdKGFwaS9yb3V0ZXIvTmF2aWdhdGlvblN0YXJ0KTogTmF2aWdhdGlvbiBzdGFydHMuXG4gKiAqIFtSb3V0ZUNvbmZpZ0xvYWRTdGFydF0oYXBpL3JvdXRlci9Sb3V0ZUNvbmZpZ0xvYWRTdGFydCk6IEJlZm9yZVxuICogdGhlIHJvdXRlciBbbGF6eSBsb2Fkc10oL2d1aWRlL3JvdXRlciNsYXp5LWxvYWRpbmcpIGEgcm91dGUgY29uZmlndXJhdGlvbi5cbiAqICogW1JvdXRlQ29uZmlnTG9hZEVuZF0oYXBpL3JvdXRlci9Sb3V0ZUNvbmZpZ0xvYWRFbmQpOiBBZnRlciBhIHJvdXRlIGhhcyBiZWVuIGxhenkgbG9hZGVkLlxuICogKiBbUm91dGVzUmVjb2duaXplZF0oYXBpL3JvdXRlci9Sb3V0ZXNSZWNvZ25pemVkKTogV2hlbiB0aGUgcm91dGVyIHBhcnNlcyB0aGUgVVJMXG4gKiBhbmQgdGhlIHJvdXRlcyBhcmUgcmVjb2duaXplZC5cbiAqICogW0d1YXJkc0NoZWNrU3RhcnRdKGFwaS9yb3V0ZXIvR3VhcmRzQ2hlY2tTdGFydCk6IFdoZW4gdGhlIHJvdXRlciBiZWdpbnMgdGhlICpndWFyZHMqXG4gKiBwaGFzZSBvZiByb3V0aW5nLlxuICogKiBbQ2hpbGRBY3RpdmF0aW9uU3RhcnRdKGFwaS9yb3V0ZXIvQ2hpbGRBY3RpdmF0aW9uU3RhcnQpOiBXaGVuIHRoZSByb3V0ZXJcbiAqIGJlZ2lucyBhY3RpdmF0aW5nIGEgcm91dGUncyBjaGlsZHJlbi5cbiAqICogW0FjdGl2YXRpb25TdGFydF0oYXBpL3JvdXRlci9BY3RpdmF0aW9uU3RhcnQpOiBXaGVuIHRoZSByb3V0ZXIgYmVnaW5zIGFjdGl2YXRpbmcgYSByb3V0ZS5cbiAqICogW0d1YXJkc0NoZWNrRW5kXShhcGkvcm91dGVyL0d1YXJkc0NoZWNrRW5kKTogV2hlbiB0aGUgcm91dGVyIGZpbmlzaGVzIHRoZSAqZ3VhcmRzKlxuICogcGhhc2Ugb2Ygcm91dGluZyBzdWNjZXNzZnVsbHkuXG4gKiAqIFtSZXNvbHZlU3RhcnRdKGFwaS9yb3V0ZXIvUmVzb2x2ZVN0YXJ0KTogV2hlbiB0aGUgcm91dGVyIGJlZ2lucyB0aGUgKnJlc29sdmUqXG4gKiBwaGFzZSBvZiByb3V0aW5nLlxuICogKiBbUmVzb2x2ZUVuZF0oYXBpL3JvdXRlci9SZXNvbHZlRW5kKTogV2hlbiB0aGUgcm91dGVyIGZpbmlzaGVzIHRoZSAqcmVzb2x2ZSpcbiAqIHBoYXNlIG9mIHJvdXRpbmcgc3VjY2Vzc2Z1bGx5LlxuICogKiBbQ2hpbGRBY3RpdmF0aW9uRW5kXShhcGkvcm91dGVyL0NoaWxkQWN0aXZhdGlvbkVuZCk6IFdoZW4gdGhlIHJvdXRlciBmaW5pc2hlc1xuICogYWN0aXZhdGluZyBhIHJvdXRlJ3MgY2hpbGRyZW4uXG4gKiAqIFtBY3RpdmF0aW9uRW5kXShhcGkvcm91dGVyL0FjdGl2YXRpb25FbmQpOiBXaGVuIHRoZSByb3V0ZXIgZmluaXNoZXMgYWN0aXZhdGluZyBhIHJvdXRlLlxuICogKiBbTmF2aWdhdGlvbkVuZF0oYXBpL3JvdXRlci9OYXZpZ2F0aW9uRW5kKTogV2hlbiBuYXZpZ2F0aW9uIGVuZHMgc3VjY2Vzc2Z1bGx5LlxuICogKiBbTmF2aWdhdGlvbkNhbmNlbF0oYXBpL3JvdXRlci9OYXZpZ2F0aW9uQ2FuY2VsKTogV2hlbiBuYXZpZ2F0aW9uIGlzIGNhbmNlbGVkLlxuICogKiBbTmF2aWdhdGlvbkVycm9yXShhcGkvcm91dGVyL05hdmlnYXRpb25FcnJvcik6IFdoZW4gbmF2aWdhdGlvbiBmYWlsc1xuICogZHVlIHRvIGFuIHVuZXhwZWN0ZWQgZXJyb3IuXG4gKiAqIFtTY3JvbGxdKGFwaS9yb3V0ZXIvU2Nyb2xsKTogV2hlbiB0aGUgdXNlciBzY3JvbGxzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgRXZlbnQgPSBOYXZpZ2F0aW9uU3RhcnR8TmF2aWdhdGlvbkVuZHxOYXZpZ2F0aW9uQ2FuY2VsfE5hdmlnYXRpb25FcnJvcnxSb3V0ZXNSZWNvZ25pemVkfFxuICAgIEd1YXJkc0NoZWNrU3RhcnR8R3VhcmRzQ2hlY2tFbmR8Um91dGVDb25maWdMb2FkU3RhcnR8Um91dGVDb25maWdMb2FkRW5kfENoaWxkQWN0aXZhdGlvblN0YXJ0fFxuICAgIENoaWxkQWN0aXZhdGlvbkVuZHxBY3RpdmF0aW9uU3RhcnR8QWN0aXZhdGlvbkVuZHxTY3JvbGx8UmVzb2x2ZVN0YXJ0fFJlc29sdmVFbmR8XG4gICAgTmF2aWdhdGlvblNraXBwZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlFdmVudChyb3V0ZXJFdmVudDogRXZlbnQpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHJvdXRlckV2ZW50LnR5cGUpIHtcbiAgICBjYXNlIEV2ZW50VHlwZS5BY3RpdmF0aW9uRW5kOlxuICAgICAgcmV0dXJuIGBBY3RpdmF0aW9uRW5kKHBhdGg6ICcke3JvdXRlckV2ZW50LnNuYXBzaG90LnJvdXRlQ29uZmlnPy5wYXRoIHx8ICcnfScpYDtcbiAgICBjYXNlIEV2ZW50VHlwZS5BY3RpdmF0aW9uU3RhcnQ6XG4gICAgICByZXR1cm4gYEFjdGl2YXRpb25TdGFydChwYXRoOiAnJHtyb3V0ZXJFdmVudC5zbmFwc2hvdC5yb3V0ZUNvbmZpZz8ucGF0aCB8fCAnJ30nKWA7XG4gICAgY2FzZSBFdmVudFR5cGUuQ2hpbGRBY3RpdmF0aW9uRW5kOlxuICAgICAgcmV0dXJuIGBDaGlsZEFjdGl2YXRpb25FbmQocGF0aDogJyR7cm91dGVyRXZlbnQuc25hcHNob3Qucm91dGVDb25maWc/LnBhdGggfHwgJyd9JylgO1xuICAgIGNhc2UgRXZlbnRUeXBlLkNoaWxkQWN0aXZhdGlvblN0YXJ0OlxuICAgICAgcmV0dXJuIGBDaGlsZEFjdGl2YXRpb25TdGFydChwYXRoOiAnJHtyb3V0ZXJFdmVudC5zbmFwc2hvdC5yb3V0ZUNvbmZpZz8ucGF0aCB8fCAnJ30nKWA7XG4gICAgY2FzZSBFdmVudFR5cGUuR3VhcmRzQ2hlY2tFbmQ6XG4gICAgICByZXR1cm4gYEd1YXJkc0NoZWNrRW5kKGlkOiAke3JvdXRlckV2ZW50LmlkfSwgdXJsOiAnJHtcbiAgICAgICAgICByb3V0ZXJFdmVudC51cmx9JywgdXJsQWZ0ZXJSZWRpcmVjdHM6ICcke3JvdXRlckV2ZW50LnVybEFmdGVyUmVkaXJlY3RzfScsIHN0YXRlOiAke1xuICAgICAgICAgIHJvdXRlckV2ZW50LnN0YXRlfSwgc2hvdWxkQWN0aXZhdGU6ICR7cm91dGVyRXZlbnQuc2hvdWxkQWN0aXZhdGV9KWA7XG4gICAgY2FzZSBFdmVudFR5cGUuR3VhcmRzQ2hlY2tTdGFydDpcbiAgICAgIHJldHVybiBgR3VhcmRzQ2hlY2tTdGFydChpZDogJHtyb3V0ZXJFdmVudC5pZH0sIHVybDogJyR7XG4gICAgICAgICAgcm91dGVyRXZlbnQudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtyb3V0ZXJFdmVudC51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHtcbiAgICAgICAgICByb3V0ZXJFdmVudC5zdGF0ZX0pYDtcbiAgICBjYXNlIEV2ZW50VHlwZS5OYXZpZ2F0aW9uQ2FuY2VsOlxuICAgICAgcmV0dXJuIGBOYXZpZ2F0aW9uQ2FuY2VsKGlkOiAke3JvdXRlckV2ZW50LmlkfSwgdXJsOiAnJHtyb3V0ZXJFdmVudC51cmx9JylgO1xuICAgIGNhc2UgRXZlbnRUeXBlLk5hdmlnYXRpb25Ta2lwcGVkOlxuICAgICAgcmV0dXJuIGBOYXZpZ2F0aW9uU2tpcHBlZChpZDogJHtyb3V0ZXJFdmVudC5pZH0sIHVybDogJyR7cm91dGVyRXZlbnQudXJsfScpYDtcbiAgICBjYXNlIEV2ZW50VHlwZS5OYXZpZ2F0aW9uRW5kOlxuICAgICAgcmV0dXJuIGBOYXZpZ2F0aW9uRW5kKGlkOiAke3JvdXRlckV2ZW50LmlkfSwgdXJsOiAnJHtyb3V0ZXJFdmVudC51cmx9JywgdXJsQWZ0ZXJSZWRpcmVjdHM6ICcke1xuICAgICAgICAgIHJvdXRlckV2ZW50LnVybEFmdGVyUmVkaXJlY3RzfScpYDtcbiAgICBjYXNlIEV2ZW50VHlwZS5OYXZpZ2F0aW9uRXJyb3I6XG4gICAgICByZXR1cm4gYE5hdmlnYXRpb25FcnJvcihpZDogJHtyb3V0ZXJFdmVudC5pZH0sIHVybDogJyR7cm91dGVyRXZlbnQudXJsfScsIGVycm9yOiAke1xuICAgICAgICAgIHJvdXRlckV2ZW50LmVycm9yfSlgO1xuICAgIGNhc2UgRXZlbnRUeXBlLk5hdmlnYXRpb25TdGFydDpcbiAgICAgIHJldHVybiBgTmF2aWdhdGlvblN0YXJ0KGlkOiAke3JvdXRlckV2ZW50LmlkfSwgdXJsOiAnJHtyb3V0ZXJFdmVudC51cmx9JylgO1xuICAgIGNhc2UgRXZlbnRUeXBlLlJlc29sdmVFbmQ6XG4gICAgICByZXR1cm4gYFJlc29sdmVFbmQoaWQ6ICR7cm91dGVyRXZlbnQuaWR9LCB1cmw6ICcke3JvdXRlckV2ZW50LnVybH0nLCB1cmxBZnRlclJlZGlyZWN0czogJyR7XG4gICAgICAgICAgcm91dGVyRXZlbnQudXJsQWZ0ZXJSZWRpcmVjdHN9Jywgc3RhdGU6ICR7cm91dGVyRXZlbnQuc3RhdGV9KWA7XG4gICAgY2FzZSBFdmVudFR5cGUuUmVzb2x2ZVN0YXJ0OlxuICAgICAgcmV0dXJuIGBSZXNvbHZlU3RhcnQoaWQ6ICR7cm91dGVyRXZlbnQuaWR9LCB1cmw6ICcke3JvdXRlckV2ZW50LnVybH0nLCB1cmxBZnRlclJlZGlyZWN0czogJyR7XG4gICAgICAgICAgcm91dGVyRXZlbnQudXJsQWZ0ZXJSZWRpcmVjdHN9Jywgc3RhdGU6ICR7cm91dGVyRXZlbnQuc3RhdGV9KWA7XG4gICAgY2FzZSBFdmVudFR5cGUuUm91dGVDb25maWdMb2FkRW5kOlxuICAgICAgcmV0dXJuIGBSb3V0ZUNvbmZpZ0xvYWRFbmQocGF0aDogJHtyb3V0ZXJFdmVudC5yb3V0ZS5wYXRofSlgO1xuICAgIGNhc2UgRXZlbnRUeXBlLlJvdXRlQ29uZmlnTG9hZFN0YXJ0OlxuICAgICAgcmV0dXJuIGBSb3V0ZUNvbmZpZ0xvYWRTdGFydChwYXRoOiAke3JvdXRlckV2ZW50LnJvdXRlLnBhdGh9KWA7XG4gICAgY2FzZSBFdmVudFR5cGUuUm91dGVzUmVjb2duaXplZDpcbiAgICAgIHJldHVybiBgUm91dGVzUmVjb2duaXplZChpZDogJHtyb3V0ZXJFdmVudC5pZH0sIHVybDogJyR7XG4gICAgICAgICAgcm91dGVyRXZlbnQudXJsfScsIHVybEFmdGVyUmVkaXJlY3RzOiAnJHtyb3V0ZXJFdmVudC51cmxBZnRlclJlZGlyZWN0c30nLCBzdGF0ZTogJHtcbiAgICAgICAgICByb3V0ZXJFdmVudC5zdGF0ZX0pYDtcbiAgICBjYXNlIEV2ZW50VHlwZS5TY3JvbGw6XG4gICAgICBjb25zdCBwb3MgPVxuICAgICAgICAgIHJvdXRlckV2ZW50LnBvc2l0aW9uID8gYCR7cm91dGVyRXZlbnQucG9zaXRpb25bMF19LCAke3JvdXRlckV2ZW50LnBvc2l0aW9uWzFdfWAgOiBudWxsO1xuICAgICAgcmV0dXJuIGBTY3JvbGwoYW5jaG9yOiAnJHtyb3V0ZXJFdmVudC5hbmNob3J9JywgcG9zaXRpb246ICcke3Bvc30nKWA7XG4gIH1cbn1cbiJdfQ==