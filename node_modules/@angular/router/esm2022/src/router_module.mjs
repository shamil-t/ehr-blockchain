/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HashLocationStrategy, Location, LocationStrategy, PathLocationStrategy, ViewportScroller } from '@angular/common';
import { APP_BOOTSTRAP_LISTENER, inject, Inject, InjectionToken, NgModule, NgProbeToken, NgZone, Optional, SkipSelf, ɵRuntimeError as RuntimeError } from '@angular/core';
import { EmptyOutletComponent } from './components/empty_outlet';
import { RouterLink } from './directives/router_link';
import { RouterLinkActive } from './directives/router_link_active';
import { RouterOutlet } from './directives/router_outlet';
import { NavigationTransitions } from './navigation_transition';
import { getBootstrapListener, rootRoute, ROUTER_IS_PROVIDED, withComponentInputBinding, withDebugTracing, withDisabledInitialNavigation, withEnabledBlockingInitialNavigation, withPreloading } from './provide_router';
import { Router } from './router';
import { ROUTER_CONFIGURATION } from './router_config';
import { RouterConfigLoader, ROUTES } from './router_config_loader';
import { ChildrenOutletContexts } from './router_outlet_context';
import { ROUTER_SCROLLER, RouterScroller } from './router_scroller';
import { ActivatedRoute } from './router_state';
import { DefaultUrlSerializer, UrlSerializer } from './url_tree';
import * as i0 from "@angular/core";
/**
 * The directives defined in the `RouterModule`.
 */
const ROUTER_DIRECTIVES = [RouterOutlet, RouterLink, RouterLinkActive, EmptyOutletComponent];
/**
 * @docsNotRequired
 */
export const ROUTER_FORROOT_GUARD = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'router duplicate forRoot guard' :
    'ROUTER_FORROOT_GUARD');
// TODO(atscott): All of these except `ActivatedRoute` are `providedIn: 'root'`. They are only kept
// here to avoid a breaking change whereby the provider order matters based on where the
// `RouterModule`/`RouterTestingModule` is imported. These can/should be removed as a "breaking"
// change in a major version.
export const ROUTER_PROVIDERS = [
    Location,
    { provide: UrlSerializer, useClass: DefaultUrlSerializer },
    Router,
    ChildrenOutletContexts,
    { provide: ActivatedRoute, useFactory: rootRoute, deps: [Router] },
    RouterConfigLoader,
    // Only used to warn when `provideRoutes` is used without `RouterModule` or `provideRouter`. Can
    // be removed when `provideRoutes` is removed.
    (typeof ngDevMode === 'undefined' || ngDevMode) ? { provide: ROUTER_IS_PROVIDED, useValue: true } :
        [],
];
export function routerNgProbeToken() {
    return new NgProbeToken('Router', Router);
}
/**
 * @description
 *
 * Adds directives and providers for in-app navigation among views defined in an application.
 * Use the Angular `Router` service to declaratively specify application states and manage state
 * transitions.
 *
 * You can import this NgModule multiple times, once for each lazy-loaded bundle.
 * However, only one `Router` service can be active.
 * To ensure this, there are two ways to register routes when importing this module:
 *
 * * The `forRoot()` method creates an `NgModule` that contains all the directives, the given
 * routes, and the `Router` service itself.
 * * The `forChild()` method creates an `NgModule` that contains all the directives and the given
 * routes, but does not include the `Router` service.
 *
 * @see [Routing and Navigation guide](guide/router) for an
 * overview of how the `Router` service should be used.
 *
 * @publicApi
 */
export class RouterModule {
    constructor(guard) { }
    /**
     * Creates and configures a module with all the router providers and directives.
     * Optionally sets up an application listener to perform an initial navigation.
     *
     * When registering the NgModule at the root, import as follows:
     *
     * ```
     * @NgModule({
     *   imports: [RouterModule.forRoot(ROUTES)]
     * })
     * class MyNgModule {}
     * ```
     *
     * @param routes An array of `Route` objects that define the navigation paths for the application.
     * @param config An `ExtraOptions` configuration object that controls how navigation is performed.
     * @return The new `NgModule`.
     *
     */
    static forRoot(routes, config) {
        return {
            ngModule: RouterModule,
            providers: [
                ROUTER_PROVIDERS,
                (typeof ngDevMode === 'undefined' || ngDevMode) ?
                    (config?.enableTracing ? withDebugTracing().ɵproviders : []) :
                    [],
                { provide: ROUTES, multi: true, useValue: routes },
                {
                    provide: ROUTER_FORROOT_GUARD,
                    useFactory: provideForRootGuard,
                    deps: [[Router, new Optional(), new SkipSelf()]]
                },
                { provide: ROUTER_CONFIGURATION, useValue: config ? config : {} },
                config?.useHash ? provideHashLocationStrategy() : providePathLocationStrategy(),
                provideRouterScroller(),
                config?.preloadingStrategy ? withPreloading(config.preloadingStrategy).ɵproviders : [],
                { provide: NgProbeToken, multi: true, useFactory: routerNgProbeToken },
                config?.initialNavigation ? provideInitialNavigation(config) : [],
                config?.bindToComponentInputs ? withComponentInputBinding().ɵproviders : [],
                provideRouterInitializer(),
            ],
        };
    }
    /**
     * Creates a module with all the router directives and a provider registering routes,
     * without creating a new Router service.
     * When registering for submodules and lazy-loaded submodules, create the NgModule as follows:
     *
     * ```
     * @NgModule({
     *   imports: [RouterModule.forChild(ROUTES)]
     * })
     * class MyNgModule {}
     * ```
     *
     * @param routes An array of `Route` objects that define the navigation paths for the submodule.
     * @return The new NgModule.
     *
     */
    static forChild(routes) {
        return {
            ngModule: RouterModule,
            providers: [{ provide: ROUTES, multi: true, useValue: routes }],
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterModule, deps: [{ token: ROUTER_FORROOT_GUARD, optional: true }], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.2.12", ngImport: i0, type: RouterModule, imports: [RouterOutlet, RouterLink, RouterLinkActive, EmptyOutletComponent], exports: [RouterOutlet, RouterLink, RouterLinkActive, EmptyOutletComponent] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: ROUTER_DIRECTIVES,
                    exports: ROUTER_DIRECTIVES,
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ROUTER_FORROOT_GUARD]
                }] }]; } });
/**
 * For internal use by `RouterModule` only. Note that this differs from `withInMemoryRouterScroller`
 * because it reads from the `ExtraOptions` which should not be used in the standalone world.
 */
export function provideRouterScroller() {
    return {
        provide: ROUTER_SCROLLER,
        useFactory: () => {
            const viewportScroller = inject(ViewportScroller);
            const zone = inject(NgZone);
            const config = inject(ROUTER_CONFIGURATION);
            const transitions = inject(NavigationTransitions);
            const urlSerializer = inject(UrlSerializer);
            if (config.scrollOffset) {
                viewportScroller.setOffset(config.scrollOffset);
            }
            return new RouterScroller(urlSerializer, transitions, viewportScroller, zone, config);
        },
    };
}
// Note: For internal use only with `RouterModule`. Standalone setup via `provideRouter` should
// provide hash location directly via `{provide: LocationStrategy, useClass: HashLocationStrategy}`.
function provideHashLocationStrategy() {
    return { provide: LocationStrategy, useClass: HashLocationStrategy };
}
// Note: For internal use only with `RouterModule`. Standalone setup via `provideRouter` does not
// need this at all because `PathLocationStrategy` is the default factory for `LocationStrategy`.
function providePathLocationStrategy() {
    return { provide: LocationStrategy, useClass: PathLocationStrategy };
}
export function provideForRootGuard(router) {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && router) {
        throw new RuntimeError(4007 /* RuntimeErrorCode.FOR_ROOT_CALLED_TWICE */, `The Router was provided more than once. This can happen if 'forRoot' is used outside of the root injector.` +
            ` Lazy loaded modules should use RouterModule.forChild() instead.`);
    }
    return 'guarded';
}
// Note: For internal use only with `RouterModule`. Standalone router setup with `provideRouter`
// users call `withXInitialNavigation` directly.
function provideInitialNavigation(config) {
    return [
        config.initialNavigation === 'disabled' ? withDisabledInitialNavigation().ɵproviders : [],
        config.initialNavigation === 'enabledBlocking' ?
            withEnabledBlockingInitialNavigation().ɵproviders :
            [],
    ];
}
// TODO(atscott): This should not be in the public API
/**
 * A [DI token](guide/glossary/#di-token) for the router initializer that
 * is called after the app is bootstrapped.
 *
 * @publicApi
 */
export const ROUTER_INITIALIZER = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'Router Initializer' : '');
function provideRouterInitializer() {
    return [
        // ROUTER_INITIALIZER token should be removed. It's public API but shouldn't be. We can just
        // have `getBootstrapListener` directly attached to APP_BOOTSTRAP_LISTENER.
        { provide: ROUTER_INITIALIZER, useFactory: getBootstrapListener },
        { provide: APP_BOOTSTRAP_LISTENER, multi: true, useExisting: ROUTER_INITIALIZER },
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX21vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvcm91dGVyX21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekgsT0FBTyxFQUFDLHNCQUFzQixFQUFnQixNQUFNLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBdUIsUUFBUSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFZLFFBQVEsRUFBRSxhQUFhLElBQUksWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXJOLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFHeEQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDOUQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSw2QkFBNkIsRUFBRSxvQ0FBb0MsRUFBRSxjQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN2TixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sRUFBZSxvQkFBb0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsRSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsYUFBYSxFQUFDLE1BQU0sWUFBWSxDQUFDOztBQUcvRDs7R0FFRztBQUNILE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFFN0Y7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLGNBQWMsQ0FDbEQsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDbEMsc0JBQXNCLENBQUMsQ0FBQztBQUU5RSxtR0FBbUc7QUFDbkcsd0ZBQXdGO0FBQ3hGLGdHQUFnRztBQUNoRyw2QkFBNkI7QUFDN0IsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQWU7SUFDMUMsUUFBUTtJQUNSLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUM7SUFDeEQsTUFBTTtJQUNOLHNCQUFzQjtJQUN0QixFQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBQztJQUNoRSxrQkFBa0I7SUFDbEIsZ0dBQWdHO0lBQ2hHLDhDQUE4QztJQUM5QyxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDL0MsRUFBRTtDQUNyRCxDQUFDO0FBRUYsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxPQUFPLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBS0gsTUFBTSxPQUFPLFlBQVk7SUFDdkIsWUFBc0QsS0FBVSxJQUFHLENBQUM7SUFFcEU7Ozs7Ozs7Ozs7Ozs7Ozs7O09BaUJHO0lBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFjLEVBQUUsTUFBcUI7UUFDbEQsT0FBTztZQUNMLFFBQVEsRUFBRSxZQUFZO1lBQ3RCLFNBQVMsRUFBRTtnQkFDVCxnQkFBZ0I7Z0JBQ2hCLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzlELEVBQUU7Z0JBQ04sRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBQztnQkFDaEQ7b0JBQ0UsT0FBTyxFQUFFLG9CQUFvQjtvQkFDN0IsVUFBVSxFQUFFLG1CQUFtQjtvQkFDL0IsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ2pEO2dCQUNELEVBQUMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFDO2dCQUMvRCxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsRUFBRTtnQkFDL0UscUJBQXFCLEVBQUU7Z0JBQ3ZCLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEYsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFDO2dCQUNwRSxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqRSxNQUFNLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMzRSx3QkFBd0IsRUFBRTthQUMzQjtTQUNGLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFjO1FBQzVCLE9BQU87WUFDTCxRQUFRLEVBQUUsWUFBWTtZQUN0QixTQUFTLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFDLENBQUM7U0FDOUQsQ0FBQztJQUNKLENBQUM7eUhBcEVVLFlBQVksa0JBQ1Msb0JBQW9COzBIQUR6QyxZQUFZLFlBdkRFLFlBQVksRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLGFBQWhFLFlBQVksRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9COzBIQXVEOUUsWUFBWTs7c0dBQVosWUFBWTtrQkFKeEIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUUsaUJBQWlCO29CQUMxQixPQUFPLEVBQUUsaUJBQWlCO2lCQUMzQjs7MEJBRWMsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxvQkFBb0I7O0FBc0V0RDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLE9BQU87UUFDTCxPQUFPLEVBQUUsZUFBZTtRQUN4QixVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsTUFBTSxNQUFNLEdBQWlCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzFELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1QyxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7Z0JBQ3ZCLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDakQ7WUFDRCxPQUFPLElBQUksY0FBYyxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hGLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELCtGQUErRjtBQUMvRixvR0FBb0c7QUFDcEcsU0FBUywyQkFBMkI7SUFDbEMsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRUQsaUdBQWlHO0FBQ2pHLGlHQUFpRztBQUNqRyxTQUFTLDJCQUEyQjtJQUNsQyxPQUFPLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYztJQUNoRCxJQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLE1BQU0sRUFBRTtRQUM3RCxNQUFNLElBQUksWUFBWSxvREFFbEIsNEdBQTRHO1lBQ3hHLGtFQUFrRSxDQUFDLENBQUM7S0FDN0U7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQsZ0dBQWdHO0FBQ2hHLGdEQUFnRDtBQUNoRCxTQUFTLHdCQUF3QixDQUFDLE1BQStDO0lBQy9FLE9BQU87UUFDTCxNQUFNLENBQUMsaUJBQWlCLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN6RixNQUFNLENBQUMsaUJBQWlCLEtBQUssaUJBQWlCLENBQUMsQ0FBQztZQUM1QyxvQ0FBb0MsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELEVBQUU7S0FDUCxDQUFDO0FBQ0osQ0FBQztBQUVELHNEQUFzRDtBQUN0RDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUFHLElBQUksY0FBYyxDQUNoRCxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRWpGLFNBQVMsd0JBQXdCO0lBQy9CLE9BQU87UUFDTCw0RkFBNEY7UUFDNUYsMkVBQTJFO1FBQzNFLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxvQkFBb0IsRUFBQztRQUMvRCxFQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBQztLQUNoRixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhc2hMb2NhdGlvblN0cmF0ZWd5LCBMb2NhdGlvbiwgTG9jYXRpb25TdHJhdGVneSwgUGF0aExvY2F0aW9uU3RyYXRlZ3ksIFZpZXdwb3J0U2Nyb2xsZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIENvbXBvbmVudFJlZiwgaW5qZWN0LCBJbmplY3QsIEluamVjdGlvblRva2VuLCBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSwgTmdQcm9iZVRva2VuLCBOZ1pvbmUsIE9wdGlvbmFsLCBQcm92aWRlciwgU2tpcFNlbGYsIMm1UnVudGltZUVycm9yIGFzIFJ1bnRpbWVFcnJvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7RW1wdHlPdXRsZXRDb21wb25lbnR9IGZyb20gJy4vY29tcG9uZW50cy9lbXB0eV9vdXRsZXQnO1xuaW1wb3J0IHtSb3V0ZXJMaW5rfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX2xpbmsnO1xuaW1wb3J0IHtSb3V0ZXJMaW5rQWN0aXZlfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX2xpbmtfYWN0aXZlJztcbmltcG9ydCB7Um91dGVyT3V0bGV0fSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX291dGxldCc7XG5pbXBvcnQge1J1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7Um91dGVzfSBmcm9tICcuL21vZGVscyc7XG5pbXBvcnQge05hdmlnYXRpb25UcmFuc2l0aW9uc30gZnJvbSAnLi9uYXZpZ2F0aW9uX3RyYW5zaXRpb24nO1xuaW1wb3J0IHtnZXRCb290c3RyYXBMaXN0ZW5lciwgcm9vdFJvdXRlLCBST1VURVJfSVNfUFJPVklERUQsIHdpdGhDb21wb25lbnRJbnB1dEJpbmRpbmcsIHdpdGhEZWJ1Z1RyYWNpbmcsIHdpdGhEaXNhYmxlZEluaXRpYWxOYXZpZ2F0aW9uLCB3aXRoRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb24sIHdpdGhQcmVsb2FkaW5nfSBmcm9tICcuL3Byb3ZpZGVfcm91dGVyJztcbmltcG9ydCB7Um91dGVyfSBmcm9tICcuL3JvdXRlcic7XG5pbXBvcnQge0V4dHJhT3B0aW9ucywgUk9VVEVSX0NPTkZJR1VSQVRJT059IGZyb20gJy4vcm91dGVyX2NvbmZpZyc7XG5pbXBvcnQge1JvdXRlckNvbmZpZ0xvYWRlciwgUk9VVEVTfSBmcm9tICcuL3JvdXRlcl9jb25maWdfbG9hZGVyJztcbmltcG9ydCB7Q2hpbGRyZW5PdXRsZXRDb250ZXh0c30gZnJvbSAnLi9yb3V0ZXJfb3V0bGV0X2NvbnRleHQnO1xuaW1wb3J0IHtST1VURVJfU0NST0xMRVIsIFJvdXRlclNjcm9sbGVyfSBmcm9tICcuL3JvdXRlcl9zY3JvbGxlcic7XG5pbXBvcnQge0FjdGl2YXRlZFJvdXRlfSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge0RlZmF1bHRVcmxTZXJpYWxpemVyLCBVcmxTZXJpYWxpemVyfSBmcm9tICcuL3VybF90cmVlJztcblxuXG4vKipcbiAqIFRoZSBkaXJlY3RpdmVzIGRlZmluZWQgaW4gdGhlIGBSb3V0ZXJNb2R1bGVgLlxuICovXG5jb25zdCBST1VURVJfRElSRUNUSVZFUyA9IFtSb3V0ZXJPdXRsZXQsIFJvdXRlckxpbmssIFJvdXRlckxpbmtBY3RpdmUsIEVtcHR5T3V0bGV0Q29tcG9uZW50XTtcblxuLyoqXG4gKiBAZG9jc05vdFJlcXVpcmVkXG4gKi9cbmV4cG9ydCBjb25zdCBST1VURVJfRk9SUk9PVF9HVUFSRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjx2b2lkPihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdyb3V0ZXIgZHVwbGljYXRlIGZvclJvb3QgZ3VhcmQnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdST1VURVJfRk9SUk9PVF9HVUFSRCcpO1xuXG4vLyBUT0RPKGF0c2NvdHQpOiBBbGwgb2YgdGhlc2UgZXhjZXB0IGBBY3RpdmF0ZWRSb3V0ZWAgYXJlIGBwcm92aWRlZEluOiAncm9vdCdgLiBUaGV5IGFyZSBvbmx5IGtlcHRcbi8vIGhlcmUgdG8gYXZvaWQgYSBicmVha2luZyBjaGFuZ2Ugd2hlcmVieSB0aGUgcHJvdmlkZXIgb3JkZXIgbWF0dGVycyBiYXNlZCBvbiB3aGVyZSB0aGVcbi8vIGBSb3V0ZXJNb2R1bGVgL2BSb3V0ZXJUZXN0aW5nTW9kdWxlYCBpcyBpbXBvcnRlZC4gVGhlc2UgY2FuL3Nob3VsZCBiZSByZW1vdmVkIGFzIGEgXCJicmVha2luZ1wiXG4vLyBjaGFuZ2UgaW4gYSBtYWpvciB2ZXJzaW9uLlxuZXhwb3J0IGNvbnN0IFJPVVRFUl9QUk9WSURFUlM6IFByb3ZpZGVyW10gPSBbXG4gIExvY2F0aW9uLFxuICB7cHJvdmlkZTogVXJsU2VyaWFsaXplciwgdXNlQ2xhc3M6IERlZmF1bHRVcmxTZXJpYWxpemVyfSxcbiAgUm91dGVyLFxuICBDaGlsZHJlbk91dGxldENvbnRleHRzLFxuICB7cHJvdmlkZTogQWN0aXZhdGVkUm91dGUsIHVzZUZhY3Rvcnk6IHJvb3RSb3V0ZSwgZGVwczogW1JvdXRlcl19LFxuICBSb3V0ZXJDb25maWdMb2FkZXIsXG4gIC8vIE9ubHkgdXNlZCB0byB3YXJuIHdoZW4gYHByb3ZpZGVSb3V0ZXNgIGlzIHVzZWQgd2l0aG91dCBgUm91dGVyTW9kdWxlYCBvciBgcHJvdmlkZVJvdXRlcmAuIENhblxuICAvLyBiZSByZW1vdmVkIHdoZW4gYHByb3ZpZGVSb3V0ZXNgIGlzIHJlbW92ZWQuXG4gICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8ge3Byb3ZpZGU6IFJPVVRFUl9JU19QUk9WSURFRCwgdXNlVmFsdWU6IHRydWV9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSxcbl07XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXJOZ1Byb2JlVG9rZW4oKSB7XG4gIHJldHVybiBuZXcgTmdQcm9iZVRva2VuKCdSb3V0ZXInLCBSb3V0ZXIpO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEFkZHMgZGlyZWN0aXZlcyBhbmQgcHJvdmlkZXJzIGZvciBpbi1hcHAgbmF2aWdhdGlvbiBhbW9uZyB2aWV3cyBkZWZpbmVkIGluIGFuIGFwcGxpY2F0aW9uLlxuICogVXNlIHRoZSBBbmd1bGFyIGBSb3V0ZXJgIHNlcnZpY2UgdG8gZGVjbGFyYXRpdmVseSBzcGVjaWZ5IGFwcGxpY2F0aW9uIHN0YXRlcyBhbmQgbWFuYWdlIHN0YXRlXG4gKiB0cmFuc2l0aW9ucy5cbiAqXG4gKiBZb3UgY2FuIGltcG9ydCB0aGlzIE5nTW9kdWxlIG11bHRpcGxlIHRpbWVzLCBvbmNlIGZvciBlYWNoIGxhenktbG9hZGVkIGJ1bmRsZS5cbiAqIEhvd2V2ZXIsIG9ubHkgb25lIGBSb3V0ZXJgIHNlcnZpY2UgY2FuIGJlIGFjdGl2ZS5cbiAqIFRvIGVuc3VyZSB0aGlzLCB0aGVyZSBhcmUgdHdvIHdheXMgdG8gcmVnaXN0ZXIgcm91dGVzIHdoZW4gaW1wb3J0aW5nIHRoaXMgbW9kdWxlOlxuICpcbiAqICogVGhlIGBmb3JSb290KClgIG1ldGhvZCBjcmVhdGVzIGFuIGBOZ01vZHVsZWAgdGhhdCBjb250YWlucyBhbGwgdGhlIGRpcmVjdGl2ZXMsIHRoZSBnaXZlblxuICogcm91dGVzLCBhbmQgdGhlIGBSb3V0ZXJgIHNlcnZpY2UgaXRzZWxmLlxuICogKiBUaGUgYGZvckNoaWxkKClgIG1ldGhvZCBjcmVhdGVzIGFuIGBOZ01vZHVsZWAgdGhhdCBjb250YWlucyBhbGwgdGhlIGRpcmVjdGl2ZXMgYW5kIHRoZSBnaXZlblxuICogcm91dGVzLCBidXQgZG9lcyBub3QgaW5jbHVkZSB0aGUgYFJvdXRlcmAgc2VydmljZS5cbiAqXG4gKiBAc2VlIFtSb3V0aW5nIGFuZCBOYXZpZ2F0aW9uIGd1aWRlXShndWlkZS9yb3V0ZXIpIGZvciBhblxuICogb3ZlcnZpZXcgb2YgaG93IHRoZSBgUm91dGVyYCBzZXJ2aWNlIHNob3VsZCBiZSB1c2VkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogUk9VVEVSX0RJUkVDVElWRVMsXG4gIGV4cG9ydHM6IFJPVVRFUl9ESVJFQ1RJVkVTLFxufSlcbmV4cG9ydCBjbGFzcyBSb3V0ZXJNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KFJPVVRFUl9GT1JST09UX0dVQVJEKSBndWFyZDogYW55KSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgbW9kdWxlIHdpdGggYWxsIHRoZSByb3V0ZXIgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzLlxuICAgKiBPcHRpb25hbGx5IHNldHMgdXAgYW4gYXBwbGljYXRpb24gbGlzdGVuZXIgdG8gcGVyZm9ybSBhbiBpbml0aWFsIG5hdmlnYXRpb24uXG4gICAqXG4gICAqIFdoZW4gcmVnaXN0ZXJpbmcgdGhlIE5nTW9kdWxlIGF0IHRoZSByb290LCBpbXBvcnQgYXMgZm9sbG93czpcbiAgICpcbiAgICogYGBgXG4gICAqIEBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW1JvdXRlck1vZHVsZS5mb3JSb290KFJPVVRFUyldXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TmdNb2R1bGUge31cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSByb3V0ZXMgQW4gYXJyYXkgb2YgYFJvdXRlYCBvYmplY3RzIHRoYXQgZGVmaW5lIHRoZSBuYXZpZ2F0aW9uIHBhdGhzIGZvciB0aGUgYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSBjb25maWcgQW4gYEV4dHJhT3B0aW9uc2AgY29uZmlndXJhdGlvbiBvYmplY3QgdGhhdCBjb250cm9scyBob3cgbmF2aWdhdGlvbiBpcyBwZXJmb3JtZWQuXG4gICAqIEByZXR1cm4gVGhlIG5ldyBgTmdNb2R1bGVgLlxuICAgKlxuICAgKi9cbiAgc3RhdGljIGZvclJvb3Qocm91dGVzOiBSb3V0ZXMsIGNvbmZpZz86IEV4dHJhT3B0aW9ucyk6IE1vZHVsZVdpdGhQcm92aWRlcnM8Um91dGVyTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBSb3V0ZXJNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgUk9VVEVSX1BST1ZJREVSUyxcbiAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgP1xuICAgICAgICAgICAgKGNvbmZpZz8uZW5hYmxlVHJhY2luZyA/IHdpdGhEZWJ1Z1RyYWNpbmcoKS7JtXByb3ZpZGVycyA6IFtdKSA6XG4gICAgICAgICAgICBbXSxcbiAgICAgICAge3Byb3ZpZGU6IFJPVVRFUywgbXVsdGk6IHRydWUsIHVzZVZhbHVlOiByb3V0ZXN9LFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUk9VVEVSX0ZPUlJPT1RfR1VBUkQsXG4gICAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZUZvclJvb3RHdWFyZCxcbiAgICAgICAgICBkZXBzOiBbW1JvdXRlciwgbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpXV1cbiAgICAgICAgfSxcbiAgICAgICAge3Byb3ZpZGU6IFJPVVRFUl9DT05GSUdVUkFUSU9OLCB1c2VWYWx1ZTogY29uZmlnID8gY29uZmlnIDoge319LFxuICAgICAgICBjb25maWc/LnVzZUhhc2ggPyBwcm92aWRlSGFzaExvY2F0aW9uU3RyYXRlZ3koKSA6IHByb3ZpZGVQYXRoTG9jYXRpb25TdHJhdGVneSgpLFxuICAgICAgICBwcm92aWRlUm91dGVyU2Nyb2xsZXIoKSxcbiAgICAgICAgY29uZmlnPy5wcmVsb2FkaW5nU3RyYXRlZ3kgPyB3aXRoUHJlbG9hZGluZyhjb25maWcucHJlbG9hZGluZ1N0cmF0ZWd5KS7JtXByb3ZpZGVycyA6IFtdLFxuICAgICAgICB7cHJvdmlkZTogTmdQcm9iZVRva2VuLCBtdWx0aTogdHJ1ZSwgdXNlRmFjdG9yeTogcm91dGVyTmdQcm9iZVRva2VufSxcbiAgICAgICAgY29uZmlnPy5pbml0aWFsTmF2aWdhdGlvbiA/IHByb3ZpZGVJbml0aWFsTmF2aWdhdGlvbihjb25maWcpIDogW10sXG4gICAgICAgIGNvbmZpZz8uYmluZFRvQ29tcG9uZW50SW5wdXRzID8gd2l0aENvbXBvbmVudElucHV0QmluZGluZygpLsm1cHJvdmlkZXJzIDogW10sXG4gICAgICAgIHByb3ZpZGVSb3V0ZXJJbml0aWFsaXplcigpLFxuICAgICAgXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBtb2R1bGUgd2l0aCBhbGwgdGhlIHJvdXRlciBkaXJlY3RpdmVzIGFuZCBhIHByb3ZpZGVyIHJlZ2lzdGVyaW5nIHJvdXRlcyxcbiAgICogd2l0aG91dCBjcmVhdGluZyBhIG5ldyBSb3V0ZXIgc2VydmljZS5cbiAgICogV2hlbiByZWdpc3RlcmluZyBmb3Igc3VibW9kdWxlcyBhbmQgbGF6eS1sb2FkZWQgc3VibW9kdWxlcywgY3JlYXRlIHRoZSBOZ01vZHVsZSBhcyBmb2xsb3dzOlxuICAgKlxuICAgKiBgYGBcbiAgICogQE5nTW9kdWxlKHtcbiAgICogICBpbXBvcnRzOiBbUm91dGVyTW9kdWxlLmZvckNoaWxkKFJPVVRFUyldXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TmdNb2R1bGUge31cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSByb3V0ZXMgQW4gYXJyYXkgb2YgYFJvdXRlYCBvYmplY3RzIHRoYXQgZGVmaW5lIHRoZSBuYXZpZ2F0aW9uIHBhdGhzIGZvciB0aGUgc3VibW9kdWxlLlxuICAgKiBAcmV0dXJuIFRoZSBuZXcgTmdNb2R1bGUuXG4gICAqXG4gICAqL1xuICBzdGF0aWMgZm9yQ2hpbGQocm91dGVzOiBSb3V0ZXMpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPFJvdXRlck1vZHVsZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogUm91dGVyTW9kdWxlLFxuICAgICAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IFJPVVRFUywgbXVsdGk6IHRydWUsIHVzZVZhbHVlOiByb3V0ZXN9XSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogRm9yIGludGVybmFsIHVzZSBieSBgUm91dGVyTW9kdWxlYCBvbmx5LiBOb3RlIHRoYXQgdGhpcyBkaWZmZXJzIGZyb20gYHdpdGhJbk1lbW9yeVJvdXRlclNjcm9sbGVyYFxuICogYmVjYXVzZSBpdCByZWFkcyBmcm9tIHRoZSBgRXh0cmFPcHRpb25zYCB3aGljaCBzaG91bGQgbm90IGJlIHVzZWQgaW4gdGhlIHN0YW5kYWxvbmUgd29ybGQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlUm91dGVyU2Nyb2xsZXIoKTogUHJvdmlkZXIge1xuICByZXR1cm4ge1xuICAgIHByb3ZpZGU6IFJPVVRFUl9TQ1JPTExFUixcbiAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCB2aWV3cG9ydFNjcm9sbGVyID0gaW5qZWN0KFZpZXdwb3J0U2Nyb2xsZXIpO1xuICAgICAgY29uc3Qgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICAgICAgY29uc3QgY29uZmlnOiBFeHRyYU9wdGlvbnMgPSBpbmplY3QoUk9VVEVSX0NPTkZJR1VSQVRJT04pO1xuICAgICAgY29uc3QgdHJhbnNpdGlvbnMgPSBpbmplY3QoTmF2aWdhdGlvblRyYW5zaXRpb25zKTtcbiAgICAgIGNvbnN0IHVybFNlcmlhbGl6ZXIgPSBpbmplY3QoVXJsU2VyaWFsaXplcik7XG4gICAgICBpZiAoY29uZmlnLnNjcm9sbE9mZnNldCkge1xuICAgICAgICB2aWV3cG9ydFNjcm9sbGVyLnNldE9mZnNldChjb25maWcuc2Nyb2xsT2Zmc2V0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUm91dGVyU2Nyb2xsZXIodXJsU2VyaWFsaXplciwgdHJhbnNpdGlvbnMsIHZpZXdwb3J0U2Nyb2xsZXIsIHpvbmUsIGNvbmZpZyk7XG4gICAgfSxcbiAgfTtcbn1cblxuLy8gTm90ZTogRm9yIGludGVybmFsIHVzZSBvbmx5IHdpdGggYFJvdXRlck1vZHVsZWAuIFN0YW5kYWxvbmUgc2V0dXAgdmlhIGBwcm92aWRlUm91dGVyYCBzaG91bGRcbi8vIHByb3ZpZGUgaGFzaCBsb2NhdGlvbiBkaXJlY3RseSB2aWEgYHtwcm92aWRlOiBMb2NhdGlvblN0cmF0ZWd5LCB1c2VDbGFzczogSGFzaExvY2F0aW9uU3RyYXRlZ3l9YC5cbmZ1bmN0aW9uIHByb3ZpZGVIYXNoTG9jYXRpb25TdHJhdGVneSgpOiBQcm92aWRlciB7XG4gIHJldHVybiB7cHJvdmlkZTogTG9jYXRpb25TdHJhdGVneSwgdXNlQ2xhc3M6IEhhc2hMb2NhdGlvblN0cmF0ZWd5fTtcbn1cblxuLy8gTm90ZTogRm9yIGludGVybmFsIHVzZSBvbmx5IHdpdGggYFJvdXRlck1vZHVsZWAuIFN0YW5kYWxvbmUgc2V0dXAgdmlhIGBwcm92aWRlUm91dGVyYCBkb2VzIG5vdFxuLy8gbmVlZCB0aGlzIGF0IGFsbCBiZWNhdXNlIGBQYXRoTG9jYXRpb25TdHJhdGVneWAgaXMgdGhlIGRlZmF1bHQgZmFjdG9yeSBmb3IgYExvY2F0aW9uU3RyYXRlZ3lgLlxuZnVuY3Rpb24gcHJvdmlkZVBhdGhMb2NhdGlvblN0cmF0ZWd5KCk6IFByb3ZpZGVyIHtcbiAgcmV0dXJuIHtwcm92aWRlOiBMb2NhdGlvblN0cmF0ZWd5LCB1c2VDbGFzczogUGF0aExvY2F0aW9uU3RyYXRlZ3l9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUZvclJvb3RHdWFyZChyb3V0ZXI6IFJvdXRlcik6IGFueSB7XG4gIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiByb3V0ZXIpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkZPUl9ST09UX0NBTExFRF9UV0lDRSxcbiAgICAgICAgYFRoZSBSb3V0ZXIgd2FzIHByb3ZpZGVkIG1vcmUgdGhhbiBvbmNlLiBUaGlzIGNhbiBoYXBwZW4gaWYgJ2ZvclJvb3QnIGlzIHVzZWQgb3V0c2lkZSBvZiB0aGUgcm9vdCBpbmplY3Rvci5gICtcbiAgICAgICAgICAgIGAgTGF6eSBsb2FkZWQgbW9kdWxlcyBzaG91bGQgdXNlIFJvdXRlck1vZHVsZS5mb3JDaGlsZCgpIGluc3RlYWQuYCk7XG4gIH1cbiAgcmV0dXJuICdndWFyZGVkJztcbn1cblxuLy8gTm90ZTogRm9yIGludGVybmFsIHVzZSBvbmx5IHdpdGggYFJvdXRlck1vZHVsZWAuIFN0YW5kYWxvbmUgcm91dGVyIHNldHVwIHdpdGggYHByb3ZpZGVSb3V0ZXJgXG4vLyB1c2VycyBjYWxsIGB3aXRoWEluaXRpYWxOYXZpZ2F0aW9uYCBkaXJlY3RseS5cbmZ1bmN0aW9uIHByb3ZpZGVJbml0aWFsTmF2aWdhdGlvbihjb25maWc6IFBpY2s8RXh0cmFPcHRpb25zLCAnaW5pdGlhbE5hdmlnYXRpb24nPik6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIGNvbmZpZy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gJ2Rpc2FibGVkJyA/IHdpdGhEaXNhYmxlZEluaXRpYWxOYXZpZ2F0aW9uKCkuybVwcm92aWRlcnMgOiBbXSxcbiAgICBjb25maWcuaW5pdGlhbE5hdmlnYXRpb24gPT09ICdlbmFibGVkQmxvY2tpbmcnID9cbiAgICAgICAgd2l0aEVuYWJsZWRCbG9ja2luZ0luaXRpYWxOYXZpZ2F0aW9uKCkuybVwcm92aWRlcnMgOlxuICAgICAgICBbXSxcbiAgXTtcbn1cblxuLy8gVE9ETyhhdHNjb3R0KTogVGhpcyBzaG91bGQgbm90IGJlIGluIHRoZSBwdWJsaWMgQVBJXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeS8jZGktdG9rZW4pIGZvciB0aGUgcm91dGVyIGluaXRpYWxpemVyIHRoYXRcbiAqIGlzIGNhbGxlZCBhZnRlciB0aGUgYXBwIGlzIGJvb3RzdHJhcHBlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBST1VURVJfSU5JVElBTElaRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkPihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdSb3V0ZXIgSW5pdGlhbGl6ZXInIDogJycpO1xuXG5mdW5jdGlvbiBwcm92aWRlUm91dGVySW5pdGlhbGl6ZXIoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAgLy8gUk9VVEVSX0lOSVRJQUxJWkVSIHRva2VuIHNob3VsZCBiZSByZW1vdmVkLiBJdCdzIHB1YmxpYyBBUEkgYnV0IHNob3VsZG4ndCBiZS4gV2UgY2FuIGp1c3RcbiAgICAvLyBoYXZlIGBnZXRCb290c3RyYXBMaXN0ZW5lcmAgZGlyZWN0bHkgYXR0YWNoZWQgdG8gQVBQX0JPT1RTVFJBUF9MSVNURU5FUi5cbiAgICB7cHJvdmlkZTogUk9VVEVSX0lOSVRJQUxJWkVSLCB1c2VGYWN0b3J5OiBnZXRCb290c3RyYXBMaXN0ZW5lcn0sXG4gICAge3Byb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsIG11bHRpOiB0cnVlLCB1c2VFeGlzdGluZzogUk9VVEVSX0lOSVRJQUxJWkVSfSxcbiAgXTtcbn1cbiJdfQ==