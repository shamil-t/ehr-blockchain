/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HashLocationStrategy, LOCATION_INITIALIZED, LocationStrategy, ViewportScroller } from '@angular/common';
import { APP_BOOTSTRAP_LISTENER, APP_INITIALIZER, ApplicationRef, ENVIRONMENT_INITIALIZER, EnvironmentInjector, inject, InjectFlags, InjectionToken, Injector, makeEnvironmentProviders, NgZone } from '@angular/core';
import { of, Subject } from 'rxjs';
import { INPUT_BINDER, RoutedComponentInputBinder } from './directives/router_outlet';
import { NavigationError, stringifyEvent } from './events';
import { NavigationTransitions } from './navigation_transition';
import { Router } from './router';
import { ROUTER_CONFIGURATION } from './router_config';
import { ROUTES } from './router_config_loader';
import { PreloadingStrategy, RouterPreloader } from './router_preloader';
import { ROUTER_SCROLLER, RouterScroller } from './router_scroller';
import { ActivatedRoute } from './router_state';
import { UrlSerializer } from './url_tree';
import { afterNextNavigation } from './utils/navigations';
/**
 * Sets up providers necessary to enable `Router` functionality for the application.
 * Allows to configure a set of routes as well as extra features that should be enabled.
 *
 * @usageNotes
 *
 * Basic example of how you can add a Router to your application:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent, {
 *   providers: [provideRouter(appRoutes)]
 * });
 * ```
 *
 * You can also enable optional features in the Router by adding functions from the `RouterFeatures`
 * type:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes,
 *         withDebugTracing(),
 *         withRouterConfig({paramsInheritanceStrategy: 'always'}))
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link RouterFeatures}
 *
 * @publicApi
 * @param routes A set of `Route`s to use for the application routing table.
 * @param features Optional features to configure additional router behaviors.
 * @returns A set of providers to setup a Router.
 */
export function provideRouter(routes, ...features) {
    return makeEnvironmentProviders([
        { provide: ROUTES, multi: true, useValue: routes },
        (typeof ngDevMode === 'undefined' || ngDevMode) ?
            { provide: ROUTER_IS_PROVIDED, useValue: true } :
            [],
        { provide: ActivatedRoute, useFactory: rootRoute, deps: [Router] },
        { provide: APP_BOOTSTRAP_LISTENER, multi: true, useFactory: getBootstrapListener },
        features.map(feature => feature.ɵproviders),
    ]);
}
export function rootRoute(router) {
    return router.routerState.root;
}
/**
 * Helper function to create an object that represents a Router feature.
 */
function routerFeature(kind, providers) {
    return { ɵkind: kind, ɵproviders: providers };
}
/**
 * An Injection token used to indicate whether `provideRouter` or `RouterModule.forRoot` was ever
 * called.
 */
export const ROUTER_IS_PROVIDED = new InjectionToken('', { providedIn: 'root', factory: () => false });
const routerIsProvidedDevModeCheck = {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useFactory() {
        return () => {
            if (!inject(ROUTER_IS_PROVIDED)) {
                console.warn('`provideRoutes` was called without `provideRouter` or `RouterModule.forRoot`. ' +
                    'This is likely a mistake.');
            }
        };
    }
};
/**
 * Registers a [DI provider](guide/glossary#provider) for a set of routes.
 * @param routes The route configuration to provide.
 *
 * @usageNotes
 *
 * ```
 * @NgModule({
 *   providers: [provideRoutes(ROUTES)]
 * })
 * class LazyLoadedChildModule {}
 * ```
 *
 * @deprecated If necessary, provide routes using the `ROUTES` `InjectionToken`.
 * @see {@link ROUTES}
 * @publicApi
 */
export function provideRoutes(routes) {
    return [
        { provide: ROUTES, multi: true, useValue: routes },
        (typeof ngDevMode === 'undefined' || ngDevMode) ? routerIsProvidedDevModeCheck : [],
    ];
}
/**
 * Enables customizable scrolling behavior for router navigations.
 *
 * @usageNotes
 *
 * Basic example of how you can enable scrolling feature:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withInMemoryScrolling())
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 * @see {@link ViewportScroller}
 *
 * @publicApi
 * @param options Set of configuration parameters to customize scrolling behavior, see
 *     `InMemoryScrollingOptions` for additional information.
 * @returns A set of providers for use with `provideRouter`.
 */
export function withInMemoryScrolling(options = {}) {
    const providers = [{
            provide: ROUTER_SCROLLER,
            useFactory: () => {
                const viewportScroller = inject(ViewportScroller);
                const zone = inject(NgZone);
                const transitions = inject(NavigationTransitions);
                const urlSerializer = inject(UrlSerializer);
                return new RouterScroller(urlSerializer, transitions, viewportScroller, zone, options);
            },
        }];
    return routerFeature(4 /* RouterFeatureKind.InMemoryScrollingFeature */, providers);
}
export function getBootstrapListener() {
    const injector = inject(Injector);
    return (bootstrappedComponentRef) => {
        const ref = injector.get(ApplicationRef);
        if (bootstrappedComponentRef !== ref.components[0]) {
            return;
        }
        const router = injector.get(Router);
        const bootstrapDone = injector.get(BOOTSTRAP_DONE);
        if (injector.get(INITIAL_NAVIGATION) === 1 /* InitialNavigation.EnabledNonBlocking */) {
            router.initialNavigation();
        }
        injector.get(ROUTER_PRELOADER, null, InjectFlags.Optional)?.setUpPreloading();
        injector.get(ROUTER_SCROLLER, null, InjectFlags.Optional)?.init();
        router.resetRootComponentType(ref.componentTypes[0]);
        if (!bootstrapDone.closed) {
            bootstrapDone.next();
            bootstrapDone.complete();
            bootstrapDone.unsubscribe();
        }
    };
}
/**
 * A subject used to indicate that the bootstrapping phase is done. When initial navigation is
 * `enabledBlocking`, the first navigation waits until bootstrapping is finished before continuing
 * to the activation phase.
 */
const BOOTSTRAP_DONE = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'bootstrap done indicator' : '', {
    factory: () => {
        return new Subject();
    }
});
const INITIAL_NAVIGATION = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'initial navigation' : '', { providedIn: 'root', factory: () => 1 /* InitialNavigation.EnabledNonBlocking */ });
/**
 * Configures initial navigation to start before the root component is created.
 *
 * The bootstrap is blocked until the initial navigation is complete. This value is required for
 * [server-side rendering](guide/universal) to work.
 *
 * @usageNotes
 *
 * Basic example of how you can enable this navigation behavior:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withEnabledBlockingInitialNavigation())
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 *
 * @publicApi
 * @returns A set of providers for use with `provideRouter`.
 */
export function withEnabledBlockingInitialNavigation() {
    const providers = [
        { provide: INITIAL_NAVIGATION, useValue: 0 /* InitialNavigation.EnabledBlocking */ },
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [Injector],
            useFactory: (injector) => {
                const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve());
                return () => {
                    return locationInitialized.then(() => {
                        return new Promise(resolve => {
                            const router = injector.get(Router);
                            const bootstrapDone = injector.get(BOOTSTRAP_DONE);
                            afterNextNavigation(router, () => {
                                // Unblock APP_INITIALIZER in case the initial navigation was canceled or errored
                                // without a redirect.
                                resolve(true);
                            });
                            injector.get(NavigationTransitions).afterPreactivation = () => {
                                // Unblock APP_INITIALIZER once we get to `afterPreactivation`. At this point, we
                                // assume activation will complete successfully (even though this is not
                                // guaranteed).
                                resolve(true);
                                return bootstrapDone.closed ? of(void 0) : bootstrapDone;
                            };
                            router.initialNavigation();
                        });
                    });
                };
            }
        },
    ];
    return routerFeature(2 /* RouterFeatureKind.EnabledBlockingInitialNavigationFeature */, providers);
}
/**
 * Disables initial navigation.
 *
 * Use if there is a reason to have more control over when the router starts its initial navigation
 * due to some complex initialization logic.
 *
 * @usageNotes
 *
 * Basic example of how you can disable initial navigation:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withDisabledInitialNavigation())
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 *
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withDisabledInitialNavigation() {
    const providers = [
        {
            provide: APP_INITIALIZER,
            multi: true,
            useFactory: () => {
                const router = inject(Router);
                return () => {
                    router.setUpLocationChangeListener();
                };
            }
        },
        { provide: INITIAL_NAVIGATION, useValue: 2 /* InitialNavigation.Disabled */ }
    ];
    return routerFeature(3 /* RouterFeatureKind.DisabledInitialNavigationFeature */, providers);
}
/**
 * Enables logging of all internal navigation events to the console.
 * Extra logging might be useful for debugging purposes to inspect Router event sequence.
 *
 * @usageNotes
 *
 * Basic example of how you can enable debug tracing:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withDebugTracing())
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 *
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withDebugTracing() {
    let providers = [];
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        providers = [{
                provide: ENVIRONMENT_INITIALIZER,
                multi: true,
                useFactory: () => {
                    const router = inject(Router);
                    return () => router.events.subscribe((e) => {
                        // tslint:disable:no-console
                        console.group?.(`Router Event: ${e.constructor.name}`);
                        console.log(stringifyEvent(e));
                        console.log(e);
                        console.groupEnd?.();
                        // tslint:enable:no-console
                    });
                }
            }];
    }
    else {
        providers = [];
    }
    return routerFeature(1 /* RouterFeatureKind.DebugTracingFeature */, providers);
}
const ROUTER_PRELOADER = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'router preloader' : '');
/**
 * Allows to configure a preloading strategy to use. The strategy is configured by providing a
 * reference to a class that implements a `PreloadingStrategy`.
 *
 * @usageNotes
 *
 * Basic example of how you can configure preloading:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withPreloading(PreloadAllModules))
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 *
 * @param preloadingStrategy A reference to a class that implements a `PreloadingStrategy` that
 *     should be used.
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withPreloading(preloadingStrategy) {
    const providers = [
        { provide: ROUTER_PRELOADER, useExisting: RouterPreloader },
        { provide: PreloadingStrategy, useExisting: preloadingStrategy },
    ];
    return routerFeature(0 /* RouterFeatureKind.PreloadingFeature */, providers);
}
/**
 * Allows to provide extra parameters to configure Router.
 *
 * @usageNotes
 *
 * Basic example of how you can provide extra configuration options:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withRouterConfig({
 *          onSameUrlNavigation: 'reload'
 *       }))
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 *
 * @param options A set of parameters to configure Router, see `RouterConfigOptions` for
 *     additional information.
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withRouterConfig(options) {
    const providers = [
        { provide: ROUTER_CONFIGURATION, useValue: options },
    ];
    return routerFeature(5 /* RouterFeatureKind.RouterConfigurationFeature */, providers);
}
/**
 * Provides the location strategy that uses the URL fragment instead of the history API.
 *
 * @usageNotes
 *
 * Basic example of how you can use the hash location option:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withHashLocation())
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link provideRouter}
 * @see {@link HashLocationStrategy}
 *
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withHashLocation() {
    const providers = [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
    ];
    return routerFeature(5 /* RouterFeatureKind.RouterConfigurationFeature */, providers);
}
/**
 * Subscribes to the Router's navigation events and calls the given function when a
 * `NavigationError` happens.
 *
 * This function is run inside application's [injection context](guide/dependency-injection-context)
 * so you can use the [`inject`](api/core/inject) function.
 *
 * @usageNotes
 *
 * Basic example of how you can use the error handler option:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withNavigationErrorHandler((e: NavigationError) =>
 * inject(MyErrorTracker).trackError(e)))
 *     ]
 *   }
 * );
 * ```
 *
 * @see {@link NavigationError}
 * @see {@link core/inject}
 * @see {@link runInInjectionContext}
 *
 * @returns A set of providers for use with `provideRouter`.
 *
 * @publicApi
 */
export function withNavigationErrorHandler(fn) {
    const providers = [{
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useValue: () => {
                const injector = inject(EnvironmentInjector);
                inject(Router).events.subscribe((e) => {
                    if (e instanceof NavigationError) {
                        injector.runInContext(() => fn(e));
                    }
                });
            }
        }];
    return routerFeature(7 /* RouterFeatureKind.NavigationErrorHandlerFeature */, providers);
}
/**
 * Enables binding information from the `Router` state directly to the inputs of the component in
 * `Route` configurations.
 *
 * @usageNotes
 *
 * Basic example of how you can enable the feature:
 * ```
 * const appRoutes: Routes = [];
 * bootstrapApplication(AppComponent,
 *   {
 *     providers: [
 *       provideRouter(appRoutes, withComponentInputBinding())
 *     ]
 *   }
 * );
 * ```
 *
 * @returns A set of providers for use with `provideRouter`.
 */
export function withComponentInputBinding() {
    const providers = [
        RoutedComponentInputBinder,
        { provide: INPUT_BINDER, useExisting: RoutedComponentInputBinder },
    ];
    return routerFeature(8 /* RouterFeatureKind.ComponentInputBindingFeature */, providers);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZV9yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9yb3V0ZXIvc3JjL3Byb3ZpZGVfcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQy9HLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUEyQix1QkFBdUIsRUFBRSxtQkFBbUIsRUFBd0IsTUFBTSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLE1BQU0sRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDcFIsT0FBTyxFQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFFakMsT0FBTyxFQUFDLFlBQVksRUFBRSwwQkFBMEIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BGLE9BQU8sRUFBUSxlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWhFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxFQUEyQixvQkFBb0IsRUFBc0IsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxhQUFh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Q2hDLEtBQUssRUFBRSxJQUFJO1lBQ1gsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDYixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDcEMsSUFBSSxDQUFDLFlBQVksZUFBZSxFQUFFO3dCQUNoQyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNwQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFDLENBQUM7SUFDSCxPQUFPLGFBQWEsMERBQWtELFNBQVMsQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFhRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsTUFBTSxTQUFTLEdBQUc7UUFDaEIsMEJBQTBCO1FBQzFCLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUM7S0FDakUsQ0FBQztJQUVGLE9BQU8sYUFBYSx5REFBaUQsU0FBUyxDQUFDLENBQUM7QUFDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhc2hMb2NhdGlvblN0cmF0ZWd5LCBMT0NBVElPTl9JTklUSUFMSVpFRCwgTG9jYXRpb25TdHJhdGVneSwgVmlld3BvcnRTY3JvbGxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7QVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgQVBQX0lOSVRJQUxJWkVSLCBBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50LCBDb21wb25lbnRSZWYsIEVOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudEluamVjdG9yLCBFbnZpcm9ubWVudFByb3ZpZGVycywgaW5qZWN0LCBJbmplY3RGbGFncywgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yLCBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMsIE5nWm9uZSwgUHJvdmlkZXIsIFR5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtvZiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7SU5QVVRfQklOREVSLCBSb3V0ZWRDb21wb25lbnRJbnB1dEJpbmRlcn0gZnJvbSAnLi9kaXJlY3RpdmVzL3JvdXRlcl9vdXRsZXQnO1xuaW1wb3J0IHtFdmVudCwgTmF2aWdhdGlvbkVycm9yLCBzdHJpbmdpZnlFdmVudH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IHtSb3V0ZXN9IGZyb20gJy4vbW9kZWxzJztcbmltcG9ydCB7TmF2aWdhdGlvblRyYW5zaXRpb25zfSBmcm9tICcuL25hdmlnYXRpb25fdHJhbnNpdGlvbic7XG5pbXBvcnQge1JvdXRlcn0gZnJvbSAnLi9yb3V0ZXInO1xuaW1wb3J0IHtJbk1lbW9yeVNjcm9sbGluZ09wdGlvbnMsIFJPVVRFUl9DT05GSUdVUkFUSU9OLCBSb3V0ZXJDb25maWdPcHRpb25zfSBmcm9tICcuL3JvdXRlcl9jb25maWcnO1xuaW1wb3J0IHtST1VURVN9IGZyb20gJy4vcm91dGVyX2NvbmZpZ19sb2FkZXInO1xuaW1wb3J0IHtQcmVsb2FkaW5nU3RyYXRlZ3ksIFJvdXRlclByZWxvYWRlcn0gZnJvbSAnLi9yb3V0ZXJfcHJlbG9hZGVyJztcbmltcG9ydCB7Uk9VVEVSX1NDUk9MTEVSLCBSb3V0ZXJTY3JvbGxlcn0gZnJvbSAnLi9yb3V0ZXJfc2Nyb2xsZXInO1xuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZX0gZnJvbSAnLi9yb3V0ZXJfc3RhdGUnO1xuaW1wb3J0IHtVcmxTZXJpYWxpemVyfSBmcm9tICcuL3VybF90cmVlJztcbmltcG9ydCB7YWZ0ZXJOZXh0TmF2aWdhdGlvbn0gZnJvbSAnLi91dGlscy9uYXZpZ2F0aW9ucyc7XG5cblxuLyoqXG4gKiBTZXRzIHVwIHByb3ZpZGVycyBuZWNlc3NhcnkgdG8gZW5hYmxlIGBSb3V0ZXJgIGZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEFsbG93cyB0byBjb25maWd1cmUgYSBzZXQgb2Ygcm91dGVzIGFzIHdlbGwgYXMgZXh0cmEgZmVhdHVyZXMgdGhhdCBzaG91bGQgYmUgZW5hYmxlZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEJhc2ljIGV4YW1wbGUgb2YgaG93IHlvdSBjYW4gYWRkIGEgUm91dGVyIHRvIHlvdXIgYXBwbGljYXRpb246XG4gKiBgYGBcbiAqIGNvbnN0IGFwcFJvdXRlczogUm91dGVzID0gW107XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihBcHBDb21wb25lbnQsIHtcbiAqICAgcHJvdmlkZXJzOiBbcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMpXVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gZW5hYmxlIG9wdGlvbmFsIGZlYXR1cmVzIGluIHRoZSBSb3V0ZXIgYnkgYWRkaW5nIGZ1bmN0aW9ucyBmcm9tIHRoZSBgUm91dGVyRmVhdHVyZXNgXG4gKiB0eXBlOlxuICogYGBgXG4gKiBjb25zdCBhcHBSb3V0ZXM6IFJvdXRlcyA9IFtdO1xuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwQ29tcG9uZW50LFxuICogICB7XG4gKiAgICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgICBwcm92aWRlUm91dGVyKGFwcFJvdXRlcyxcbiAqICAgICAgICAgd2l0aERlYnVnVHJhY2luZygpLFxuICogICAgICAgICB3aXRoUm91dGVyQ29uZmlnKHtwYXJhbXNJbmhlcml0YW5jZVN0cmF0ZWd5OiAnYWx3YXlzJ30pKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIFJvdXRlckZlYXR1cmVzfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBwYXJhbSByb3V0ZXMgQSBzZXQgb2YgYFJvdXRlYHMgdG8gdXNlIGZvciB0aGUgYXBwbGljYXRpb24gcm91dGluZyB0YWJsZS5cbiAqIEBwYXJhbSBmZWF0dXJlcyBPcHRpb25hbCBmZWF0dXJlcyB0byBjb25maWd1cmUgYWRkaXRpb25hbCByb3V0ZXIgYmVoYXZpb3JzLlxuICogQHJldHVybnMgQSBzZXQgb2YgcHJvdmlkZXJzIHRvIHNldHVwIGEgUm91dGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVJvdXRlcihyb3V0ZXM6IFJvdXRlcywgLi4uZmVhdHVyZXM6IFJvdXRlckZlYXR1cmVzW10pOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBST1VURVMsIG11bHRpOiB0cnVlLCB1c2VWYWx1ZTogcm91dGVzfSxcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/XG4gICAgICAgIHtwcm92aWRlOiBST1VURVJfSVNfUFJPVklERUQsIHVzZVZhbHVlOiB0cnVlfSA6XG4gICAgICAgIFtdLFxuICAgIHtwcm92aWRlOiBBY3RpdmF0ZWRSb3V0ZSwgdXNlRmFjdG9yeTogcm9vdFJvdXRlLCBkZXBzOiBbUm91dGVyXX0sXG4gICAge3Byb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsIG11bHRpOiB0cnVlLCB1c2VGYWN0b3J5OiBnZXRCb290c3RyYXBMaXN0ZW5lcn0sXG4gICAgZmVhdHVyZXMubWFwKGZlYXR1cmUgPT4gZmVhdHVyZS7JtXByb3ZpZGVycyksXG4gIF0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm9vdFJvdXRlKHJvdXRlcjogUm91dGVyKTogQWN0aXZhdGVkUm91dGUge1xuICByZXR1cm4gcm91dGVyLnJvdXRlclN0YXRlLnJvb3Q7XG59XG5cbi8qKlxuICogSGVscGVyIHR5cGUgdG8gcmVwcmVzZW50IGEgUm91dGVyIGZlYXR1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlckZlYXR1cmU8RmVhdHVyZUtpbmQgZXh0ZW5kcyBSb3V0ZXJGZWF0dXJlS2luZD4ge1xuICDJtWtpbmQ6IEZlYXR1cmVLaW5kO1xuICDJtXByb3ZpZGVyczogUHJvdmlkZXJbXTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBSb3V0ZXIgZmVhdHVyZS5cbiAqL1xuZnVuY3Rpb24gcm91dGVyRmVhdHVyZTxGZWF0dXJlS2luZCBleHRlbmRzIFJvdXRlckZlYXR1cmVLaW5kPihcbiAgICBraW5kOiBGZWF0dXJlS2luZCwgcHJvdmlkZXJzOiBQcm92aWRlcltdKTogUm91dGVyRmVhdHVyZTxGZWF0dXJlS2luZD4ge1xuICByZXR1cm4ge8m1a2luZDoga2luZCwgybVwcm92aWRlcnM6IHByb3ZpZGVyc307XG59XG5cblxuLyoqXG4gKiBBbiBJbmplY3Rpb24gdG9rZW4gdXNlZCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBwcm92aWRlUm91dGVyYCBvciBgUm91dGVyTW9kdWxlLmZvclJvb3RgIHdhcyBldmVyXG4gKiBjYWxsZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBST1VURVJfSVNfUFJPVklERUQgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPignJywge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gZmFsc2V9KTtcblxuY29uc3Qgcm91dGVySXNQcm92aWRlZERldk1vZGVDaGVjayA9IHtcbiAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gIG11bHRpOiB0cnVlLFxuICB1c2VGYWN0b3J5KCkge1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoIWluamVjdChST1VURVJfSVNfUFJPVklERUQpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICdgcHJvdmlkZVJvdXRlc2Agd2FzIGNhbGxlZCB3aXRob3V0IGBwcm92aWRlUm91dGVyYCBvciBgUm91dGVyTW9kdWxlLmZvclJvb3RgLiAnICtcbiAgICAgICAgICAgICdUaGlzIGlzIGxpa2VseSBhIG1pc3Rha2UuJyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBbREkgcHJvdmlkZXJdKGd1aWRlL2dsb3NzYXJ5I3Byb3ZpZGVyKSBmb3IgYSBzZXQgb2Ygcm91dGVzLlxuICogQHBhcmFtIHJvdXRlcyBUaGUgcm91dGUgY29uZmlndXJhdGlvbiB0byBwcm92aWRlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogYGBgXG4gKiBATmdNb2R1bGUoe1xuICogICBwcm92aWRlcnM6IFtwcm92aWRlUm91dGVzKFJPVVRFUyldXG4gKiB9KVxuICogY2xhc3MgTGF6eUxvYWRlZENoaWxkTW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBJZiBuZWNlc3NhcnksIHByb3ZpZGUgcm91dGVzIHVzaW5nIHRoZSBgUk9VVEVTYCBgSW5qZWN0aW9uVG9rZW5gLlxuICogQHNlZSB7QGxpbmsgUk9VVEVTfVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVJvdXRlcyhyb3V0ZXM6IFJvdXRlcyk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtwcm92aWRlOiBST1VURVMsIG11bHRpOiB0cnVlLCB1c2VWYWx1ZTogcm91dGVzfSxcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/IHJvdXRlcklzUHJvdmlkZWREZXZNb2RlQ2hlY2sgOiBbXSxcbiAgXTtcbn1cblxuLyoqXG4gKiBBIHR5cGUgYWxpYXMgZm9yIHByb3ZpZGVycyByZXR1cm5lZCBieSBgd2l0aEluTWVtb3J5U2Nyb2xsaW5nYCBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBzZWUge0BsaW5rIHdpdGhJbk1lbW9yeVNjcm9sbGluZ31cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBJbk1lbW9yeVNjcm9sbGluZ0ZlYXR1cmUgPSBSb3V0ZXJGZWF0dXJlPFJvdXRlckZlYXR1cmVLaW5kLkluTWVtb3J5U2Nyb2xsaW5nRmVhdHVyZT47XG5cbi8qKlxuICogRW5hYmxlcyBjdXN0b21pemFibGUgc2Nyb2xsaW5nIGJlaGF2aW9yIGZvciByb3V0ZXIgbmF2aWdhdGlvbnMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBCYXNpYyBleGFtcGxlIG9mIGhvdyB5b3UgY2FuIGVuYWJsZSBzY3JvbGxpbmcgZmVhdHVyZTpcbiAqIGBgYFxuICogY29uc3QgYXBwUm91dGVzOiBSb3V0ZXMgPSBbXTtcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCxcbiAqICAge1xuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMsIHdpdGhJbk1lbW9yeVNjcm9sbGluZygpKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKiBAc2VlIHtAbGluayBWaWV3cG9ydFNjcm9sbGVyfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBwYXJhbSBvcHRpb25zIFNldCBvZiBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgdG8gY3VzdG9taXplIHNjcm9sbGluZyBiZWhhdmlvciwgc2VlXG4gKiAgICAgYEluTWVtb3J5U2Nyb2xsaW5nT3B0aW9uc2AgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gKiBAcmV0dXJucyBBIHNldCBvZiBwcm92aWRlcnMgZm9yIHVzZSB3aXRoIGBwcm92aWRlUm91dGVyYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhJbk1lbW9yeVNjcm9sbGluZyhvcHRpb25zOiBJbk1lbW9yeVNjcm9sbGluZ09wdGlvbnMgPSB7fSk6XG4gICAgSW5NZW1vcnlTY3JvbGxpbmdGZWF0dXJlIHtcbiAgY29uc3QgcHJvdmlkZXJzID0gW3tcbiAgICBwcm92aWRlOiBST1VURVJfU0NST0xMRVIsXG4gICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgY29uc3Qgdmlld3BvcnRTY3JvbGxlciA9IGluamVjdChWaWV3cG9ydFNjcm9sbGVyKTtcbiAgICAgIGNvbnN0IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgICAgIGNvbnN0IHRyYW5zaXRpb25zID0gaW5qZWN0KE5hdmlnYXRpb25UcmFuc2l0aW9ucyk7XG4gICAgICBjb25zdCB1cmxTZXJpYWxpemVyID0gaW5qZWN0KFVybFNlcmlhbGl6ZXIpO1xuICAgICAgcmV0dXJuIG5ldyBSb3V0ZXJTY3JvbGxlcih1cmxTZXJpYWxpemVyLCB0cmFuc2l0aW9ucywgdmlld3BvcnRTY3JvbGxlciwgem9uZSwgb3B0aW9ucyk7XG4gICAgfSxcbiAgfV07XG4gIHJldHVybiByb3V0ZXJGZWF0dXJlKFJvdXRlckZlYXR1cmVLaW5kLkluTWVtb3J5U2Nyb2xsaW5nRmVhdHVyZSwgcHJvdmlkZXJzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJvb3RzdHJhcExpc3RlbmVyKCkge1xuICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gIHJldHVybiAoYm9vdHN0cmFwcGVkQ29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8dW5rbm93bj4pID0+IHtcbiAgICBjb25zdCByZWYgPSBpbmplY3Rvci5nZXQoQXBwbGljYXRpb25SZWYpO1xuXG4gICAgaWYgKGJvb3RzdHJhcHBlZENvbXBvbmVudFJlZiAhPT0gcmVmLmNvbXBvbmVudHNbMF0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb3V0ZXIgPSBpbmplY3Rvci5nZXQoUm91dGVyKTtcbiAgICBjb25zdCBib290c3RyYXBEb25lID0gaW5qZWN0b3IuZ2V0KEJPT1RTVFJBUF9ET05FKTtcblxuICAgIGlmIChpbmplY3Rvci5nZXQoSU5JVElBTF9OQVZJR0FUSU9OKSA9PT0gSW5pdGlhbE5hdmlnYXRpb24uRW5hYmxlZE5vbkJsb2NraW5nKSB7XG4gICAgICByb3V0ZXIuaW5pdGlhbE5hdmlnYXRpb24oKTtcbiAgICB9XG5cbiAgICBpbmplY3Rvci5nZXQoUk9VVEVSX1BSRUxPQURFUiwgbnVsbCwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpPy5zZXRVcFByZWxvYWRpbmcoKTtcbiAgICBpbmplY3Rvci5nZXQoUk9VVEVSX1NDUk9MTEVSLCBudWxsLCBJbmplY3RGbGFncy5PcHRpb25hbCk/LmluaXQoKTtcbiAgICByb3V0ZXIucmVzZXRSb290Q29tcG9uZW50VHlwZShyZWYuY29tcG9uZW50VHlwZXNbMF0pO1xuICAgIGlmICghYm9vdHN0cmFwRG9uZS5jbG9zZWQpIHtcbiAgICAgIGJvb3RzdHJhcERvbmUubmV4dCgpO1xuICAgICAgYm9vdHN0cmFwRG9uZS5jb21wbGV0ZSgpO1xuICAgICAgYm9vdHN0cmFwRG9uZS51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBBIHN1YmplY3QgdXNlZCB0byBpbmRpY2F0ZSB0aGF0IHRoZSBib290c3RyYXBwaW5nIHBoYXNlIGlzIGRvbmUuIFdoZW4gaW5pdGlhbCBuYXZpZ2F0aW9uIGlzXG4gKiBgZW5hYmxlZEJsb2NraW5nYCwgdGhlIGZpcnN0IG5hdmlnYXRpb24gd2FpdHMgdW50aWwgYm9vdHN0cmFwcGluZyBpcyBmaW5pc2hlZCBiZWZvcmUgY29udGludWluZ1xuICogdG8gdGhlIGFjdGl2YXRpb24gcGhhc2UuXG4gKi9cbmNvbnN0IEJPT1RTVFJBUF9ET05FID0gbmV3IEluamVjdGlvblRva2VuPFN1YmplY3Q8dm9pZD4+KFxuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8gJ2Jvb3RzdHJhcCBkb25lIGluZGljYXRvcicgOiAnJywge1xuICAgICAgZmFjdG9yeTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuLyoqXG4gKiBUaGlzIGFuZCB0aGUgSU5JVElBTF9OQVZJR0FUSU9OIHRva2VuIGFyZSB1c2VkIGludGVybmFsbHkgb25seS4gVGhlIHB1YmxpYyBBUEkgc2lkZSBvZiB0aGlzIGlzXG4gKiBjb25maWd1cmVkIHRocm91Z2ggdGhlIGBFeHRyYU9wdGlvbnNgLlxuICpcbiAqIFdoZW4gc2V0IHRvIGBFbmFibGVkQmxvY2tpbmdgLCB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIHN0YXJ0cyBiZWZvcmUgdGhlIHJvb3RcbiAqIGNvbXBvbmVudCBpcyBjcmVhdGVkLiBUaGUgYm9vdHN0cmFwIGlzIGJsb2NrZWQgdW50aWwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBjb21wbGV0ZS4gVGhpc1xuICogdmFsdWUgaXMgcmVxdWlyZWQgZm9yIFtzZXJ2ZXItc2lkZSByZW5kZXJpbmddKGd1aWRlL3VuaXZlcnNhbCkgdG8gd29yay5cbiAqXG4gKiBXaGVuIHNldCB0byBgRW5hYmxlZE5vbkJsb2NraW5nYCwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBzdGFydHMgYWZ0ZXIgdGhlIHJvb3QgY29tcG9uZW50IGhhcyBiZWVuXG4gKiBjcmVhdGVkLiBUaGUgYm9vdHN0cmFwIGlzIG5vdCBibG9ja2VkIG9uIHRoZSBjb21wbGV0aW9uIG9mIHRoZSBpbml0aWFsIG5hdmlnYXRpb24uXG4gKlxuICogV2hlbiBzZXQgdG8gYERpc2FibGVkYCwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBub3QgcGVyZm9ybWVkLiBUaGUgbG9jYXRpb24gbGlzdGVuZXIgaXMgc2V0IHVwXG4gKiBiZWZvcmUgdGhlIHJvb3QgY29tcG9uZW50IGdldHMgY3JlYXRlZC4gVXNlIGlmIHRoZXJlIGlzIGEgcmVhc29uIHRvIGhhdmUgbW9yZSBjb250cm9sIG92ZXIgd2hlblxuICogdGhlIHJvdXRlciBzdGFydHMgaXRzIGluaXRpYWwgbmF2aWdhdGlvbiBkdWUgdG8gc29tZSBjb21wbGV4IGluaXRpYWxpemF0aW9uIGxvZ2ljLlxuICpcbiAqIEBzZWUge0BsaW5rIEV4dHJhT3B0aW9uc31cbiAqL1xuY29uc3QgZW51bSBJbml0aWFsTmF2aWdhdGlvbiB7XG4gIEVuYWJsZWRCbG9ja2luZyxcbiAgRW5hYmxlZE5vbkJsb2NraW5nLFxuICBEaXNhYmxlZCxcbn1cblxuY29uc3QgSU5JVElBTF9OQVZJR0FUSU9OID0gbmV3IEluamVjdGlvblRva2VuPEluaXRpYWxOYXZpZ2F0aW9uPihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdpbml0aWFsIG5hdmlnYXRpb24nIDogJycsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gSW5pdGlhbE5hdmlnYXRpb24uRW5hYmxlZE5vbkJsb2NraW5nfSk7XG5cbi8qKlxuICogQSB0eXBlIGFsaWFzIGZvciBwcm92aWRlcnMgcmV0dXJuZWQgYnkgYHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbmAgZm9yIHVzZSB3aXRoXG4gKiBgcHJvdmlkZVJvdXRlcmAuXG4gKlxuICogQHNlZSB7QGxpbmsgd2l0aEVuYWJsZWRCbG9ja2luZ0luaXRpYWxOYXZpZ2F0aW9ufVxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIEVuYWJsZWRCbG9ja2luZ0luaXRpYWxOYXZpZ2F0aW9uRmVhdHVyZSA9XG4gICAgUm91dGVyRmVhdHVyZTxSb3V0ZXJGZWF0dXJlS2luZC5FbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbkZlYXR1cmU+O1xuXG4vKipcbiAqIEEgdHlwZSBhbGlhcyBmb3IgcHJvdmlkZXJzIHJldHVybmVkIGJ5IGB3aXRoRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb25gIG9yXG4gKiBgd2l0aERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb25gIGZ1bmN0aW9ucyBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBzZWUge0BsaW5rIHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbn1cbiAqIEBzZWUge0BsaW5rIHdpdGhEaXNhYmxlZEluaXRpYWxOYXZpZ2F0aW9ufVxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxOYXZpZ2F0aW9uRmVhdHVyZSA9XG4gICAgRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlfERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlO1xuXG4vKipcbiAqIENvbmZpZ3VyZXMgaW5pdGlhbCBuYXZpZ2F0aW9uIHRvIHN0YXJ0IGJlZm9yZSB0aGUgcm9vdCBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAqXG4gKiBUaGUgYm9vdHN0cmFwIGlzIGJsb2NrZWQgdW50aWwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBjb21wbGV0ZS4gVGhpcyB2YWx1ZSBpcyByZXF1aXJlZCBmb3JcbiAqIFtzZXJ2ZXItc2lkZSByZW5kZXJpbmddKGd1aWRlL3VuaXZlcnNhbCkgdG8gd29yay5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEJhc2ljIGV4YW1wbGUgb2YgaG93IHlvdSBjYW4gZW5hYmxlIHRoaXMgbmF2aWdhdGlvbiBiZWhhdmlvcjpcbiAqIGBgYFxuICogY29uc3QgYXBwUm91dGVzOiBSb3V0ZXMgPSBbXTtcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCxcbiAqICAge1xuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMsIHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbigpKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICogQHJldHVybnMgQSBzZXQgb2YgcHJvdmlkZXJzIGZvciB1c2Ugd2l0aCBgcHJvdmlkZVJvdXRlcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb24oKTogRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlIHtcbiAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgIHtwcm92aWRlOiBJTklUSUFMX05BVklHQVRJT04sIHVzZVZhbHVlOiBJbml0aWFsTmF2aWdhdGlvbi5FbmFibGVkQmxvY2tpbmd9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgZGVwczogW0luamVjdG9yXSxcbiAgICAgIHVzZUZhY3Rvcnk6IChpbmplY3RvcjogSW5qZWN0b3IpID0+IHtcbiAgICAgICAgY29uc3QgbG9jYXRpb25Jbml0aWFsaXplZDogUHJvbWlzZTxhbnk+ID1cbiAgICAgICAgICAgIGluamVjdG9yLmdldChMT0NBVElPTl9JTklUSUFMSVpFRCwgUHJvbWlzZS5yZXNvbHZlKCkpO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGxvY2F0aW9uSW5pdGlhbGl6ZWQudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJvdXRlciA9IGluamVjdG9yLmdldChSb3V0ZXIpO1xuICAgICAgICAgICAgICBjb25zdCBib290c3RyYXBEb25lID0gaW5qZWN0b3IuZ2V0KEJPT1RTVFJBUF9ET05FKTtcbiAgICAgICAgICAgICAgYWZ0ZXJOZXh0TmF2aWdhdGlvbihyb3V0ZXIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBVbmJsb2NrIEFQUF9JTklUSUFMSVpFUiBpbiBjYXNlIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gd2FzIGNhbmNlbGVkIG9yIGVycm9yZWRcbiAgICAgICAgICAgICAgICAvLyB3aXRob3V0IGEgcmVkaXJlY3QuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgaW5qZWN0b3IuZ2V0KE5hdmlnYXRpb25UcmFuc2l0aW9ucykuYWZ0ZXJQcmVhY3RpdmF0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFVuYmxvY2sgQVBQX0lOSVRJQUxJWkVSIG9uY2Ugd2UgZ2V0IHRvIGBhZnRlclByZWFjdGl2YXRpb25gLiBBdCB0aGlzIHBvaW50LCB3ZVxuICAgICAgICAgICAgICAgIC8vIGFzc3VtZSBhY3RpdmF0aW9uIHdpbGwgY29tcGxldGUgc3VjY2Vzc2Z1bGx5IChldmVuIHRob3VnaCB0aGlzIGlzIG5vdFxuICAgICAgICAgICAgICAgIC8vIGd1YXJhbnRlZWQpLlxuICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb3RzdHJhcERvbmUuY2xvc2VkID8gb2Yodm9pZCAwKSA6IGJvb3RzdHJhcERvbmU7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJvdXRlci5pbml0aWFsTmF2aWdhdGlvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgXTtcbiAgcmV0dXJuIHJvdXRlckZlYXR1cmUoUm91dGVyRmVhdHVyZUtpbmQuRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlLCBwcm92aWRlcnMpO1xufVxuXG4vKipcbiAqIEEgdHlwZSBhbGlhcyBmb3IgcHJvdmlkZXJzIHJldHVybmVkIGJ5IGB3aXRoRGlzYWJsZWRJbml0aWFsTmF2aWdhdGlvbmAgZm9yIHVzZSB3aXRoXG4gKiBgcHJvdmlkZVJvdXRlcmAuXG4gKlxuICogQHNlZSB7QGxpbmsgd2l0aERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb259XG4gKiBAc2VlIHtAbGluayBwcm92aWRlUm91dGVyfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgRGlzYWJsZWRJbml0aWFsTmF2aWdhdGlvbkZlYXR1cmUgPVxuICAgIFJvdXRlckZlYXR1cmU8Um91dGVyRmVhdHVyZUtpbmQuRGlzYWJsZWRJbml0aWFsTmF2aWdhdGlvbkZlYXR1cmU+O1xuXG4vKipcbiAqIERpc2FibGVzIGluaXRpYWwgbmF2aWdhdGlvbi5cbiAqXG4gKiBVc2UgaWYgdGhlcmUgaXMgYSByZWFzb24gdG8gaGF2ZSBtb3JlIGNvbnRyb2wgb3ZlciB3aGVuIHRoZSByb3V0ZXIgc3RhcnRzIGl0cyBpbml0aWFsIG5hdmlnYXRpb25cbiAqIGR1ZSB0byBzb21lIGNvbXBsZXggaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBCYXNpYyBleGFtcGxlIG9mIGhvdyB5b3UgY2FuIGRpc2FibGUgaW5pdGlhbCBuYXZpZ2F0aW9uOlxuICogYGBgXG4gKiBjb25zdCBhcHBSb3V0ZXM6IFJvdXRlcyA9IFtdO1xuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwQ29tcG9uZW50LFxuICogICB7XG4gKiAgICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgICBwcm92aWRlUm91dGVyKGFwcFJvdXRlcywgd2l0aERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb24oKSlcbiAqICAgICBdXG4gKiAgIH1cbiAqICk7XG4gKiBgYGBcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlUm91dGVyfVxuICpcbiAqIEByZXR1cm5zIEEgc2V0IG9mIHByb3ZpZGVycyBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhEaXNhYmxlZEluaXRpYWxOYXZpZ2F0aW9uKCk6IERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlIHtcbiAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCByb3V0ZXIgPSBpbmplY3QoUm91dGVyKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICByb3V0ZXIuc2V0VXBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKCk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICB7cHJvdmlkZTogSU5JVElBTF9OQVZJR0FUSU9OLCB1c2VWYWx1ZTogSW5pdGlhbE5hdmlnYXRpb24uRGlzYWJsZWR9XG4gIF07XG4gIHJldHVybiByb3V0ZXJGZWF0dXJlKFJvdXRlckZlYXR1cmVLaW5kLkRpc2FibGVkSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlLCBwcm92aWRlcnMpO1xufVxuXG4vKipcbiAqIEEgdHlwZSBhbGlhcyBmb3IgcHJvdmlkZXJzIHJldHVybmVkIGJ5IGB3aXRoRGVidWdUcmFjaW5nYCBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBzZWUge0BsaW5rIHdpdGhEZWJ1Z1RyYWNpbmd9XG4gKiBAc2VlIHtAbGluayBwcm92aWRlUm91dGVyfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgRGVidWdUcmFjaW5nRmVhdHVyZSA9IFJvdXRlckZlYXR1cmU8Um91dGVyRmVhdHVyZUtpbmQuRGVidWdUcmFjaW5nRmVhdHVyZT47XG5cbi8qKlxuICogRW5hYmxlcyBsb2dnaW5nIG9mIGFsbCBpbnRlcm5hbCBuYXZpZ2F0aW9uIGV2ZW50cyB0byB0aGUgY29uc29sZS5cbiAqIEV4dHJhIGxvZ2dpbmcgbWlnaHQgYmUgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMgdG8gaW5zcGVjdCBSb3V0ZXIgZXZlbnQgc2VxdWVuY2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBCYXNpYyBleGFtcGxlIG9mIGhvdyB5b3UgY2FuIGVuYWJsZSBkZWJ1ZyB0cmFjaW5nOlxuICogYGBgXG4gKiBjb25zdCBhcHBSb3V0ZXM6IFJvdXRlcyA9IFtdO1xuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwQ29tcG9uZW50LFxuICogICB7XG4gKiAgICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgICBwcm92aWRlUm91dGVyKGFwcFJvdXRlcywgd2l0aERlYnVnVHJhY2luZygpKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHJldHVybnMgQSBzZXQgb2YgcHJvdmlkZXJzIGZvciB1c2Ugd2l0aCBgcHJvdmlkZVJvdXRlcmAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aERlYnVnVHJhY2luZygpOiBEZWJ1Z1RyYWNpbmdGZWF0dXJlIHtcbiAgbGV0IHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgcHJvdmlkZXJzID0gW3tcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJvdXRlciA9IGluamVjdChSb3V0ZXIpO1xuICAgICAgICByZXR1cm4gKCkgPT4gcm91dGVyLmV2ZW50cy5zdWJzY3JpYmUoKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGU6bm8tY29uc29sZVxuICAgICAgICAgIGNvbnNvbGUuZ3JvdXA/LihgUm91dGVyIEV2ZW50OiAkeyg8YW55PmUuY29uc3RydWN0b3IpLm5hbWV9YCk7XG4gICAgICAgICAgY29uc29sZS5sb2coc3RyaW5naWZ5RXZlbnQoZSkpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQ/LigpO1xuICAgICAgICAgIC8vIHRzbGludDplbmFibGU6bm8tY29uc29sZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XTtcbiAgfSBlbHNlIHtcbiAgICBwcm92aWRlcnMgPSBbXTtcbiAgfVxuICByZXR1cm4gcm91dGVyRmVhdHVyZShSb3V0ZXJGZWF0dXJlS2luZC5EZWJ1Z1RyYWNpbmdGZWF0dXJlLCBwcm92aWRlcnMpO1xufVxuXG5jb25zdCBST1VURVJfUFJFTE9BREVSID0gbmV3IEluamVjdGlvblRva2VuPFJvdXRlclByZWxvYWRlcj4oXG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyAncm91dGVyIHByZWxvYWRlcicgOiAnJyk7XG5cbi8qKlxuICogQSB0eXBlIGFsaWFzIHRoYXQgcmVwcmVzZW50cyBhIGZlYXR1cmUgd2hpY2ggZW5hYmxlcyBwcmVsb2FkaW5nIGluIFJvdXRlci5cbiAqIFRoZSB0eXBlIGlzIHVzZWQgdG8gZGVzY3JpYmUgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgYHdpdGhQcmVsb2FkaW5nYCBmdW5jdGlvbi5cbiAqXG4gKiBAc2VlIHtAbGluayB3aXRoUHJlbG9hZGluZ31cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBQcmVsb2FkaW5nRmVhdHVyZSA9IFJvdXRlckZlYXR1cmU8Um91dGVyRmVhdHVyZUtpbmQuUHJlbG9hZGluZ0ZlYXR1cmU+O1xuXG4vKipcbiAqIEFsbG93cyB0byBjb25maWd1cmUgYSBwcmVsb2FkaW5nIHN0cmF0ZWd5IHRvIHVzZS4gVGhlIHN0cmF0ZWd5IGlzIGNvbmZpZ3VyZWQgYnkgcHJvdmlkaW5nIGFcbiAqIHJlZmVyZW5jZSB0byBhIGNsYXNzIHRoYXQgaW1wbGVtZW50cyBhIGBQcmVsb2FkaW5nU3RyYXRlZ3lgLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogQmFzaWMgZXhhbXBsZSBvZiBob3cgeW91IGNhbiBjb25maWd1cmUgcHJlbG9hZGluZzpcbiAqIGBgYFxuICogY29uc3QgYXBwUm91dGVzOiBSb3V0ZXMgPSBbXTtcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCxcbiAqICAge1xuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMsIHdpdGhQcmVsb2FkaW5nKFByZWxvYWRBbGxNb2R1bGVzKSlcbiAqICAgICBdXG4gKiAgIH1cbiAqICk7XG4gKiBgYGBcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlUm91dGVyfVxuICpcbiAqIEBwYXJhbSBwcmVsb2FkaW5nU3RyYXRlZ3kgQSByZWZlcmVuY2UgdG8gYSBjbGFzcyB0aGF0IGltcGxlbWVudHMgYSBgUHJlbG9hZGluZ1N0cmF0ZWd5YCB0aGF0XG4gKiAgICAgc2hvdWxkIGJlIHVzZWQuXG4gKiBAcmV0dXJucyBBIHNldCBvZiBwcm92aWRlcnMgZm9yIHVzZSB3aXRoIGBwcm92aWRlUm91dGVyYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoUHJlbG9hZGluZyhwcmVsb2FkaW5nU3RyYXRlZ3k6IFR5cGU8UHJlbG9hZGluZ1N0cmF0ZWd5Pik6IFByZWxvYWRpbmdGZWF0dXJlIHtcbiAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgIHtwcm92aWRlOiBST1VURVJfUFJFTE9BREVSLCB1c2VFeGlzdGluZzogUm91dGVyUHJlbG9hZGVyfSxcbiAgICB7cHJvdmlkZTogUHJlbG9hZGluZ1N0cmF0ZWd5LCB1c2VFeGlzdGluZzogcHJlbG9hZGluZ1N0cmF0ZWd5fSxcbiAgXTtcbiAgcmV0dXJuIHJvdXRlckZlYXR1cmUoUm91dGVyRmVhdHVyZUtpbmQuUHJlbG9hZGluZ0ZlYXR1cmUsIHByb3ZpZGVycyk7XG59XG5cbi8qKlxuICogQSB0eXBlIGFsaWFzIGZvciBwcm92aWRlcnMgcmV0dXJuZWQgYnkgYHdpdGhSb3V0ZXJDb25maWdgIGZvciB1c2Ugd2l0aCBgcHJvdmlkZVJvdXRlcmAuXG4gKlxuICogQHNlZSB7QGxpbmsgd2l0aFJvdXRlckNvbmZpZ31cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBSb3V0ZXJDb25maWd1cmF0aW9uRmVhdHVyZSA9XG4gICAgUm91dGVyRmVhdHVyZTxSb3V0ZXJGZWF0dXJlS2luZC5Sb3V0ZXJDb25maWd1cmF0aW9uRmVhdHVyZT47XG5cbi8qKlxuICogQWxsb3dzIHRvIHByb3ZpZGUgZXh0cmEgcGFyYW1ldGVycyB0byBjb25maWd1cmUgUm91dGVyLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogQmFzaWMgZXhhbXBsZSBvZiBob3cgeW91IGNhbiBwcm92aWRlIGV4dHJhIGNvbmZpZ3VyYXRpb24gb3B0aW9uczpcbiAqIGBgYFxuICogY29uc3QgYXBwUm91dGVzOiBSb3V0ZXMgPSBbXTtcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCxcbiAqICAge1xuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMsIHdpdGhSb3V0ZXJDb25maWcoe1xuICogICAgICAgICAgb25TYW1lVXJsTmF2aWdhdGlvbjogJ3JlbG9hZCdcbiAqICAgICAgIH0pKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHBhcmFtIG9wdGlvbnMgQSBzZXQgb2YgcGFyYW1ldGVycyB0byBjb25maWd1cmUgUm91dGVyLCBzZWUgYFJvdXRlckNvbmZpZ09wdGlvbnNgIGZvclxuICogICAgIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gKiBAcmV0dXJucyBBIHNldCBvZiBwcm92aWRlcnMgZm9yIHVzZSB3aXRoIGBwcm92aWRlUm91dGVyYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoUm91dGVyQ29uZmlnKG9wdGlvbnM6IFJvdXRlckNvbmZpZ09wdGlvbnMpOiBSb3V0ZXJDb25maWd1cmF0aW9uRmVhdHVyZSB7XG4gIGNvbnN0IHByb3ZpZGVycyA9IFtcbiAgICB7cHJvdmlkZTogUk9VVEVSX0NPTkZJR1VSQVRJT04sIHVzZVZhbHVlOiBvcHRpb25zfSxcbiAgXTtcbiAgcmV0dXJuIHJvdXRlckZlYXR1cmUoUm91dGVyRmVhdHVyZUtpbmQuUm91dGVyQ29uZmlndXJhdGlvbkZlYXR1cmUsIHByb3ZpZGVycyk7XG59XG5cbi8qKlxuICogQSB0eXBlIGFsaWFzIGZvciBwcm92aWRlcnMgcmV0dXJuZWQgYnkgYHdpdGhIYXNoTG9jYXRpb25gIGZvciB1c2Ugd2l0aCBgcHJvdmlkZVJvdXRlcmAuXG4gKlxuICogQHNlZSB7QGxpbmsgd2l0aEhhc2hMb2NhdGlvbn1cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBSb3V0ZXJIYXNoTG9jYXRpb25GZWF0dXJlID0gUm91dGVyRmVhdHVyZTxSb3V0ZXJGZWF0dXJlS2luZC5Sb3V0ZXJIYXNoTG9jYXRpb25GZWF0dXJlPjtcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgbG9jYXRpb24gc3RyYXRlZ3kgdGhhdCB1c2VzIHRoZSBVUkwgZnJhZ21lbnQgaW5zdGVhZCBvZiB0aGUgaGlzdG9yeSBBUEkuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBCYXNpYyBleGFtcGxlIG9mIGhvdyB5b3UgY2FuIHVzZSB0aGUgaGFzaCBsb2NhdGlvbiBvcHRpb246XG4gKiBgYGBcbiAqIGNvbnN0IGFwcFJvdXRlczogUm91dGVzID0gW107XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihBcHBDb21wb25lbnQsXG4gKiAgIHtcbiAqICAgICBwcm92aWRlcnM6IFtcbiAqICAgICAgIHByb3ZpZGVSb3V0ZXIoYXBwUm91dGVzLCB3aXRoSGFzaExvY2F0aW9uKCkpXG4gKiAgICAgXVxuICogICB9XG4gKiApO1xuICogYGBgXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqIEBzZWUge0BsaW5rIEhhc2hMb2NhdGlvblN0cmF0ZWd5fVxuICpcbiAqIEByZXR1cm5zIEEgc2V0IG9mIHByb3ZpZGVycyBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhIYXNoTG9jYXRpb24oKTogUm91dGVyQ29uZmlndXJhdGlvbkZlYXR1cmUge1xuICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAge3Byb3ZpZGU6IExvY2F0aW9uU3RyYXRlZ3ksIHVzZUNsYXNzOiBIYXNoTG9jYXRpb25TdHJhdGVneX0sXG4gIF07XG4gIHJldHVybiByb3V0ZXJGZWF0dXJlKFJvdXRlckZlYXR1cmVLaW5kLlJvdXRlckNvbmZpZ3VyYXRpb25GZWF0dXJlLCBwcm92aWRlcnMpO1xufVxuXG4vKipcbiAqIEEgdHlwZSBhbGlhcyBmb3IgcHJvdmlkZXJzIHJldHVybmVkIGJ5IGB3aXRoTmF2aWdhdGlvbkVycm9ySGFuZGxlcmAgZm9yIHVzZSB3aXRoIGBwcm92aWRlUm91dGVyYC5cbiAqXG4gKiBAc2VlIHtAbGluayB3aXRoTmF2aWdhdGlvbkVycm9ySGFuZGxlcn1cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVSb3V0ZXJ9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBOYXZpZ2F0aW9uRXJyb3JIYW5kbGVyRmVhdHVyZSA9XG4gICAgUm91dGVyRmVhdHVyZTxSb3V0ZXJGZWF0dXJlS2luZC5OYXZpZ2F0aW9uRXJyb3JIYW5kbGVyRmVhdHVyZT47XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgUm91dGVyJ3MgbmF2aWdhdGlvbiBldmVudHMgYW5kIGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiB3aGVuIGFcbiAqIGBOYXZpZ2F0aW9uRXJyb3JgIGhhcHBlbnMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBydW4gaW5zaWRlIGFwcGxpY2F0aW9uJ3MgW2luamVjdGlvbiBjb250ZXh0XShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbi1jb250ZXh0KVxuICogc28geW91IGNhbiB1c2UgdGhlIFtgaW5qZWN0YF0oYXBpL2NvcmUvaW5qZWN0KSBmdW5jdGlvbi5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEJhc2ljIGV4YW1wbGUgb2YgaG93IHlvdSBjYW4gdXNlIHRoZSBlcnJvciBoYW5kbGVyIG9wdGlvbjpcbiAqIGBgYFxuICogY29uc3QgYXBwUm91dGVzOiBSb3V0ZXMgPSBbXTtcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCxcbiAqICAge1xuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgcHJvdmlkZVJvdXRlcihhcHBSb3V0ZXMsIHdpdGhOYXZpZ2F0aW9uRXJyb3JIYW5kbGVyKChlOiBOYXZpZ2F0aW9uRXJyb3IpID0+XG4gKiBpbmplY3QoTXlFcnJvclRyYWNrZXIpLnRyYWNrRXJyb3IoZSkpKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIE5hdmlnYXRpb25FcnJvcn1cbiAqIEBzZWUge0BsaW5rIGNvcmUvaW5qZWN0fVxuICogQHNlZSB7QGxpbmsgcnVuSW5JbmplY3Rpb25Db250ZXh0fVxuICpcbiAqIEByZXR1cm5zIEEgc2V0IG9mIHByb3ZpZGVycyBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhOYXZpZ2F0aW9uRXJyb3JIYW5kbGVyKGZuOiAoZXJyb3I6IE5hdmlnYXRpb25FcnJvcikgPT4gdm9pZCk6XG4gICAgTmF2aWdhdGlvbkVycm9ySGFuZGxlckZlYXR1cmUge1xuICBjb25zdCBwcm92aWRlcnMgPSBbe1xuICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgIG11bHRpOiB0cnVlLFxuICAgIHVzZVZhbHVlOiAoKSA9PiB7XG4gICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChFbnZpcm9ubWVudEluamVjdG9yKTtcbiAgICAgIGluamVjdChSb3V0ZXIpLmV2ZW50cy5zdWJzY3JpYmUoKGUpID0+IHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBOYXZpZ2F0aW9uRXJyb3IpIHtcbiAgICAgICAgICBpbmplY3Rvci5ydW5JbkNvbnRleHQoKCkgPT4gZm4oZSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1dO1xuICByZXR1cm4gcm91dGVyRmVhdHVyZShSb3V0ZXJGZWF0dXJlS2luZC5OYXZpZ2F0aW9uRXJyb3JIYW5kbGVyRmVhdHVyZSwgcHJvdmlkZXJzKTtcbn1cblxuLyoqXG4gKiBBIHR5cGUgYWxpYXMgZm9yIHByb3ZpZGVycyByZXR1cm5lZCBieSBgd2l0aENvbXBvbmVudElucHV0QmluZGluZ2AgZm9yIHVzZSB3aXRoIGBwcm92aWRlUm91dGVyYC5cbiAqXG4gKiBAc2VlIHtAbGluayB3aXRoQ29tcG9uZW50SW5wdXRCaW5kaW5nfVxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBvbmVudElucHV0QmluZGluZ0ZlYXR1cmUgPVxuICAgIFJvdXRlckZlYXR1cmU8Um91dGVyRmVhdHVyZUtpbmQuQ29tcG9uZW50SW5wdXRCaW5kaW5nRmVhdHVyZT47XG5cbi8qKlxuICogRW5hYmxlcyBiaW5kaW5nIGluZm9ybWF0aW9uIGZyb20gdGhlIGBSb3V0ZXJgIHN0YXRlIGRpcmVjdGx5IHRvIHRoZSBpbnB1dHMgb2YgdGhlIGNvbXBvbmVudCBpblxuICogYFJvdXRlYCBjb25maWd1cmF0aW9ucy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEJhc2ljIGV4YW1wbGUgb2YgaG93IHlvdSBjYW4gZW5hYmxlIHRoZSBmZWF0dXJlOlxuICogYGBgXG4gKiBjb25zdCBhcHBSb3V0ZXM6IFJvdXRlcyA9IFtdO1xuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwQ29tcG9uZW50LFxuICogICB7XG4gKiAgICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgICBwcm92aWRlUm91dGVyKGFwcFJvdXRlcywgd2l0aENvbXBvbmVudElucHV0QmluZGluZygpKVxuICogICAgIF1cbiAqICAgfVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEByZXR1cm5zIEEgc2V0IG9mIHByb3ZpZGVycyBmb3IgdXNlIHdpdGggYHByb3ZpZGVSb3V0ZXJgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aENvbXBvbmVudElucHV0QmluZGluZygpOiBDb21wb25lbnRJbnB1dEJpbmRpbmdGZWF0dXJlIHtcbiAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgIFJvdXRlZENvbXBvbmVudElucHV0QmluZGVyLFxuICAgIHtwcm92aWRlOiBJTlBVVF9CSU5ERVIsIHVzZUV4aXN0aW5nOiBSb3V0ZWRDb21wb25lbnRJbnB1dEJpbmRlcn0sXG4gIF07XG5cbiAgcmV0dXJuIHJvdXRlckZlYXR1cmUoUm91dGVyRmVhdHVyZUtpbmQuQ29tcG9uZW50SW5wdXRCaW5kaW5nRmVhdHVyZSwgcHJvdmlkZXJzKTtcbn1cblxuLyoqXG4gKiBBIHR5cGUgYWxpYXMgdGhhdCByZXByZXNlbnRzIGFsbCBSb3V0ZXIgZmVhdHVyZXMgYXZhaWxhYmxlIGZvciB1c2Ugd2l0aCBgcHJvdmlkZVJvdXRlcmAuXG4gKiBGZWF0dXJlcyBjYW4gYmUgZW5hYmxlZCBieSBhZGRpbmcgc3BlY2lhbCBmdW5jdGlvbnMgdG8gdGhlIGBwcm92aWRlUm91dGVyYCBjYWxsLlxuICogU2VlIGRvY3VtZW50YXRpb24gZm9yIGVhY2ggc3ltYm9sIHRvIGZpbmQgY29ycmVzcG9uZGluZyBmdW5jdGlvbiBuYW1lLiBTZWUgYWxzbyBgcHJvdmlkZVJvdXRlcmBcbiAqIGRvY3VtZW50YXRpb24gb24gaG93IHRvIHVzZSB0aG9zZSBmdW5jdGlvbnMuXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFJvdXRlckZlYXR1cmVzID1cbiAgICBQcmVsb2FkaW5nRmVhdHVyZXxEZWJ1Z1RyYWNpbmdGZWF0dXJlfEluaXRpYWxOYXZpZ2F0aW9uRmVhdHVyZXxJbk1lbW9yeVNjcm9sbGluZ0ZlYXR1cmV8XG4gICAgUm91dGVyQ29uZmlndXJhdGlvbkZlYXR1cmV8TmF2aWdhdGlvbkVycm9ySGFuZGxlckZlYXR1cmV8Q29tcG9uZW50SW5wdXRCaW5kaW5nRmVhdHVyZTtcblxuLyoqXG4gKiBUaGUgbGlzdCBvZiBmZWF0dXJlcyBhcyBhbiBlbnVtIHRvIHVuaXF1ZWx5IHR5cGUgZWFjaCBmZWF0dXJlLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBSb3V0ZXJGZWF0dXJlS2luZCB7XG4gIFByZWxvYWRpbmdGZWF0dXJlLFxuICBEZWJ1Z1RyYWNpbmdGZWF0dXJlLFxuICBFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbkZlYXR1cmUsXG4gIERpc2FibGVkSW5pdGlhbE5hdmlnYXRpb25GZWF0dXJlLFxuICBJbk1lbW9yeVNjcm9sbGluZ0ZlYXR1cmUsXG4gIFJvdXRlckNvbmZpZ3VyYXRpb25GZWF0dXJlLFxuICBSb3V0ZXJIYXNoTG9jYXRpb25GZWF0dXJlLFxuICBOYXZpZ2F0aW9uRXJyb3JIYW5kbGVyRmVhdHVyZSxcbiAgQ29tcG9uZW50SW5wdXRCaW5kaW5nRmVhdHVyZSxcbn1cbiJdfQ==