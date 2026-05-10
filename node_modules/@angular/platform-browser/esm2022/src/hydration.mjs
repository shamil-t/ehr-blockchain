/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵwithHttpTransferCache as withHttpTransferCache } from '@angular/common/http';
import { ENVIRONMENT_INITIALIZER, inject, makeEnvironmentProviders, NgZone, ɵConsole as Console, ɵformatRuntimeError as formatRuntimeError, ɵwithDomHydration as withDomHydration } from '@angular/core';
/**
 * Helper function to create an object that represents a Hydration feature.
 */
function hydrationFeature(kind, providers = []) {
    return { ɵkind: kind, ɵproviders: providers };
}
/**
 * Disables DOM nodes reuse during hydration. Effectively makes
 * Angular re-render an application from scratch on the client.
 *
 * When this option is enabled, make sure that the initial navigation
 * option is configured for the Router as `enabledBlocking` by using the
 * `withEnabledBlockingInitialNavigation` in the `provideRouter` call:
 *
 * ```
 * bootstrapApplication(RootComponent, {
 *   providers: [
 *     provideRouter(
 *       // ... other features ...
 *       withEnabledBlockingInitialNavigation()
 *     ),
 *     provideClientHydration(withNoDomReuse())
 *   ]
 * });
 * ```
 *
 * This would ensure that the application is rerendered after all async
 * operations in the Router (such as lazy-loading of components,
 * waiting for async guards and resolvers) are completed to avoid
 * clearing the DOM on the client too soon, thus causing content flicker.
 *
 * @see {@link provideRouter}
 * @see {@link withEnabledBlockingInitialNavigation}
 *
 * @publicApi
 * @developerPreview
 */
export function withNoDomReuse() {
    // This feature has no providers and acts as a flag that turns off
    // non-destructive hydration (which otherwise is turned on by default).
    return hydrationFeature(0 /* HydrationFeatureKind.NoDomReuseFeature */);
}
/**
 * Disables HTTP transfer cache. Effectively causes HTTP requests to be performed twice: once on the
 * server and other one on the browser.
 *
 * @publicApi
 * @developerPreview
 */
export function withNoHttpTransferCache() {
    // This feature has no providers and acts as a flag that turns off
    // HTTP transfer cache (which otherwise is turned on by default).
    return hydrationFeature(1 /* HydrationFeatureKind.NoHttpTransferCache */);
}
/**
 * Returns an `ENVIRONMENT_INITIALIZER` token setup with a function
 * that verifies whether compatible ZoneJS was used in an application
 * and logs a warning in a console if it's not the case.
 */
function provideZoneJsCompatibilityDetector() {
    return [{
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const ngZone = inject(NgZone);
                // Checking `ngZone instanceof NgZone` would be insufficient here,
                // because custom implementations might use NgZone as a base class.
                if (ngZone.constructor !== NgZone) {
                    const console = inject(Console);
                    const message = formatRuntimeError(-5000 /* RuntimeErrorCode.UNSUPPORTED_ZONEJS_INSTANCE */, 'Angular detected that hydration was enabled for an application ' +
                        'that uses a custom or a noop Zone.js implementation. ' +
                        'This is not yet a fully supported configuration.');
                    // tslint:disable-next-line:no-console
                    console.warn(message);
                }
            },
            multi: true,
        }];
}
/**
 * Sets up providers necessary to enable hydration functionality for the application.
 *
 * By default, the function enables the recommended set of features for the optimal
 * performance for most of the applications. You can enable/disable features by
 * passing special functions (from the `HydrationFeatures` set) as arguments to the
 * `provideClientHydration` function. It includes the following features:
 *
 * * Reconciling DOM hydration. Learn more about it [here](guide/hydration).
 * * [`HttpClient`](api/common/http/HttpClient) response caching while running on the server and
 * transferring this cache to the client to avoid extra HTTP requests. Learn more about data caching
 * [here](/guide/universal#caching-data-when-using-httpclient).
 *
 * These functions functions will allow you to disable some of the default features:
 * * {@link withNoDomReuse} to disable DOM nodes reuse during hydration
 * * {@link withNoHttpTransferCache} to disable HTTP transfer cache
 *
 *
 * @usageNotes
 *
 * Basic example of how you can enable hydration in your application when
 * `bootstrapApplication` function is used:
 * ```
 * bootstrapApplication(AppComponent, {
 *   providers: [provideClientHydration()]
 * });
 * ```
 *
 * Alternatively if you are using NgModules, you would add `provideClientHydration`
 * to your root app module's provider list.
 * ```
 * @NgModule({
 *   declarations: [RootCmp],
 *   bootstrap: [RootCmp],
 *   providers: [provideClientHydration()],
 * })
 * export class AppModule {}
 * ```
 *
 * @see {@link withNoDomReuse}
 * @see {@link withNoHttpTransferCache}
 *
 * @param features Optional features to configure additional router behaviors.
 * @returns A set of providers to enable hydration.
 *
 * @publicApi
 * @developerPreview
 */
export function provideClientHydration(...features) {
    const providers = [];
    const featuresKind = new Set();
    for (const { ɵproviders, ɵkind } of features) {
        featuresKind.add(ɵkind);
        if (ɵproviders.length) {
            providers.push(ɵproviders);
        }
    }
    return makeEnvironmentProviders([
        (typeof ngDevMode !== 'undefined' && ngDevMode) ? provideZoneJsCompatibilityDetector() : [],
        (featuresKind.has(0 /* HydrationFeatureKind.NoDomReuseFeature */) ? [] : withDomHydration()),
        (featuresKind.has(1 /* HydrationFeatureKind.NoHttpTransferCache */) ? [] : withHttpTransferCache()),
        providers,
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHlkcmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci9zcmMvaHlkcmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxzQkFBc0IsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JGLE9BQU8sRUFBQyx1QkFBdUIsRUFBd0IsTUFBTSxFQUFFLHdCQUF3QixFQUFFLE1BQU0sRUFBWSxRQUFRLElBQUksT0FBTyxFQUFFLG1CQUFtQixJQUFJLGtCQUFrQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBMkJ2Tzs7R0FFRztBQUNILFNBQVMsZ0JBQWdCLENBQ3JCLElBQWlCLEVBQUUsWUFBd0IsRUFBRTtJQUMvQyxPQUFPLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E4Qkc7QUFDSCxNQUFNLFVBQVUsY0FBYztJQUM1QixrRUFBa0U7SUFDbEUsdUVBQXVFO0lBQ3ZFLE9BQU8sZ0JBQWdCLGdEQUF3QyxDQUFDO0FBQ2xFLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsdUJBQXVCO0lBRXJDLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsT0FBTyxnQkFBZ0Isa0RBQTBDLENBQUM7QUFDcEUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGtDQUFrQztJQUN6QyxPQUFPLENBQUM7WUFDTixPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixrRUFBa0U7Z0JBQ2xFLG1FQUFtRTtnQkFDbkUsSUFBSSxNQUFNLENBQUMsV0FBVyxLQUFLLE1BQU0sRUFBRTtvQkFDakMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNoQyxNQUFNLE9BQU8sR0FBRyxrQkFBa0IsMkRBRTlCLGlFQUFpRTt3QkFDN0QsdURBQXVEO3dCQUN2RCxrREFBa0QsQ0FBQyxDQUFDO29CQUM1RCxzQ0FBc0M7b0JBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3ZCO1lBQ0gsQ0FBQztZQUNELEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQStDRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUFHLFFBQWtEO0lBRTFGLE1BQU0sU0FBUyxHQUFlLEVBQUUsQ0FBQztJQUNqQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztJQUVyRCxLQUFLLE1BQU0sRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFDLElBQUksUUFBUSxFQUFFO1FBQzFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFO1lBQ3JCLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDNUI7S0FDRjtJQUNELE9BQU8sd0JBQXdCLENBQUM7UUFDOUIsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDM0YsQ0FBQyxZQUFZLENBQUMsR0FBRyxnREFBd0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3BGLENBQUMsWUFBWSxDQUFDLEdBQUcsa0RBQTBDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUMzRixTQUFTO0tBQ1YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge8m1d2l0aEh0dHBUcmFuc2ZlckNhY2hlIGFzIHdpdGhIdHRwVHJhbnNmZXJDYWNoZX0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgRW52aXJvbm1lbnRQcm92aWRlcnMsIGluamVjdCwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLCBOZ1pvbmUsIFByb3ZpZGVyLCDJtUNvbnNvbGUgYXMgQ29uc29sZSwgybVmb3JtYXRSdW50aW1lRXJyb3IgYXMgZm9ybWF0UnVudGltZUVycm9yLCDJtXdpdGhEb21IeWRyYXRpb24gYXMgd2l0aERvbUh5ZHJhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi9lcnJvcnMnO1xuXG4vKipcbiAqIFRoZSBsaXN0IG9mIGZlYXR1cmVzIGFzIGFuIGVudW0gdG8gdW5pcXVlbHkgdHlwZSBlYWNoIGBIeWRyYXRpb25GZWF0dXJlYC5cbiAqIEBzZWUge0BsaW5rIEh5ZHJhdGlvbkZlYXR1cmV9XG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSHlkcmF0aW9uRmVhdHVyZUtpbmQge1xuICBOb0RvbVJldXNlRmVhdHVyZSxcbiAgTm9IdHRwVHJhbnNmZXJDYWNoZVxufVxuXG4vKipcbiAqIEhlbHBlciB0eXBlIHRvIHJlcHJlc2VudCBhIEh5ZHJhdGlvbiBmZWF0dXJlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSHlkcmF0aW9uRmVhdHVyZTxGZWF0dXJlS2luZCBleHRlbmRzIEh5ZHJhdGlvbkZlYXR1cmVLaW5kPiB7XG4gIMm1a2luZDogRmVhdHVyZUtpbmQ7XG4gIMm1cHJvdmlkZXJzOiBQcm92aWRlcltdO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIEh5ZHJhdGlvbiBmZWF0dXJlLlxuICovXG5mdW5jdGlvbiBoeWRyYXRpb25GZWF0dXJlPEZlYXR1cmVLaW5kIGV4dGVuZHMgSHlkcmF0aW9uRmVhdHVyZUtpbmQ+KFxuICAgIGtpbmQ6IEZlYXR1cmVLaW5kLCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXSk6IEh5ZHJhdGlvbkZlYXR1cmU8RmVhdHVyZUtpbmQ+IHtcbiAgcmV0dXJuIHvJtWtpbmQ6IGtpbmQsIMm1cHJvdmlkZXJzOiBwcm92aWRlcnN9O1xufVxuXG4vKipcbiAqIERpc2FibGVzIERPTSBub2RlcyByZXVzZSBkdXJpbmcgaHlkcmF0aW9uLiBFZmZlY3RpdmVseSBtYWtlc1xuICogQW5ndWxhciByZS1yZW5kZXIgYW4gYXBwbGljYXRpb24gZnJvbSBzY3JhdGNoIG9uIHRoZSBjbGllbnQuXG4gKlxuICogV2hlbiB0aGlzIG9wdGlvbiBpcyBlbmFibGVkLCBtYWtlIHN1cmUgdGhhdCB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uXG4gKiBvcHRpb24gaXMgY29uZmlndXJlZCBmb3IgdGhlIFJvdXRlciBhcyBgZW5hYmxlZEJsb2NraW5nYCBieSB1c2luZyB0aGVcbiAqIGB3aXRoRW5hYmxlZEJsb2NraW5nSW5pdGlhbE5hdmlnYXRpb25gIGluIHRoZSBgcHJvdmlkZVJvdXRlcmAgY2FsbDpcbiAqXG4gKiBgYGBcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKFJvb3RDb21wb25lbnQsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgcHJvdmlkZVJvdXRlcihcbiAqICAgICAgIC8vIC4uLiBvdGhlciBmZWF0dXJlcyAuLi5cbiAqICAgICAgIHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbigpXG4gKiAgICAgKSxcbiAqICAgICBwcm92aWRlQ2xpZW50SHlkcmF0aW9uKHdpdGhOb0RvbVJldXNlKCkpXG4gKiAgIF1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogVGhpcyB3b3VsZCBlbnN1cmUgdGhhdCB0aGUgYXBwbGljYXRpb24gaXMgcmVyZW5kZXJlZCBhZnRlciBhbGwgYXN5bmNcbiAqIG9wZXJhdGlvbnMgaW4gdGhlIFJvdXRlciAoc3VjaCBhcyBsYXp5LWxvYWRpbmcgb2YgY29tcG9uZW50cyxcbiAqIHdhaXRpbmcgZm9yIGFzeW5jIGd1YXJkcyBhbmQgcmVzb2x2ZXJzKSBhcmUgY29tcGxldGVkIHRvIGF2b2lkXG4gKiBjbGVhcmluZyB0aGUgRE9NIG9uIHRoZSBjbGllbnQgdG9vIHNvb24sIHRodXMgY2F1c2luZyBjb250ZW50IGZsaWNrZXIuXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVJvdXRlcn1cbiAqIEBzZWUge0BsaW5rIHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbn1cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aE5vRG9tUmV1c2UoKTogSHlkcmF0aW9uRmVhdHVyZTxIeWRyYXRpb25GZWF0dXJlS2luZC5Ob0RvbVJldXNlRmVhdHVyZT4ge1xuICAvLyBUaGlzIGZlYXR1cmUgaGFzIG5vIHByb3ZpZGVycyBhbmQgYWN0cyBhcyBhIGZsYWcgdGhhdCB0dXJucyBvZmZcbiAgLy8gbm9uLWRlc3RydWN0aXZlIGh5ZHJhdGlvbiAod2hpY2ggb3RoZXJ3aXNlIGlzIHR1cm5lZCBvbiBieSBkZWZhdWx0KS5cbiAgcmV0dXJuIGh5ZHJhdGlvbkZlYXR1cmUoSHlkcmF0aW9uRmVhdHVyZUtpbmQuTm9Eb21SZXVzZUZlYXR1cmUpO1xufVxuXG4vKipcbiAqIERpc2FibGVzIEhUVFAgdHJhbnNmZXIgY2FjaGUuIEVmZmVjdGl2ZWx5IGNhdXNlcyBIVFRQIHJlcXVlc3RzIHRvIGJlIHBlcmZvcm1lZCB0d2ljZTogb25jZSBvbiB0aGVcbiAqIHNlcnZlciBhbmQgb3RoZXIgb25lIG9uIHRoZSBicm93c2VyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoTm9IdHRwVHJhbnNmZXJDYWNoZSgpOlxuICAgIEh5ZHJhdGlvbkZlYXR1cmU8SHlkcmF0aW9uRmVhdHVyZUtpbmQuTm9IdHRwVHJhbnNmZXJDYWNoZT4ge1xuICAvLyBUaGlzIGZlYXR1cmUgaGFzIG5vIHByb3ZpZGVycyBhbmQgYWN0cyBhcyBhIGZsYWcgdGhhdCB0dXJucyBvZmZcbiAgLy8gSFRUUCB0cmFuc2ZlciBjYWNoZSAod2hpY2ggb3RoZXJ3aXNlIGlzIHR1cm5lZCBvbiBieSBkZWZhdWx0KS5cbiAgcmV0dXJuIGh5ZHJhdGlvbkZlYXR1cmUoSHlkcmF0aW9uRmVhdHVyZUtpbmQuTm9IdHRwVHJhbnNmZXJDYWNoZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBgRU5WSVJPTk1FTlRfSU5JVElBTElaRVJgIHRva2VuIHNldHVwIHdpdGggYSBmdW5jdGlvblxuICogdGhhdCB2ZXJpZmllcyB3aGV0aGVyIGNvbXBhdGlibGUgWm9uZUpTIHdhcyB1c2VkIGluIGFuIGFwcGxpY2F0aW9uXG4gKiBhbmQgbG9ncyBhIHdhcm5pbmcgaW4gYSBjb25zb2xlIGlmIGl0J3Mgbm90IHRoZSBjYXNlLlxuICovXG5mdW5jdGlvbiBwcm92aWRlWm9uZUpzQ29tcGF0aWJpbGl0eURldGVjdG9yKCk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW3tcbiAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgY29uc3Qgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gICAgICAvLyBDaGVja2luZyBgbmdab25lIGluc3RhbmNlb2YgTmdab25lYCB3b3VsZCBiZSBpbnN1ZmZpY2llbnQgaGVyZSxcbiAgICAgIC8vIGJlY2F1c2UgY3VzdG9tIGltcGxlbWVudGF0aW9ucyBtaWdodCB1c2UgTmdab25lIGFzIGEgYmFzZSBjbGFzcy5cbiAgICAgIGlmIChuZ1pvbmUuY29uc3RydWN0b3IgIT09IE5nWm9uZSkge1xuICAgICAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0KENvbnNvbGUpO1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5VTlNVUFBPUlRFRF9aT05FSlNfSU5TVEFOQ0UsXG4gICAgICAgICAgICAnQW5ndWxhciBkZXRlY3RlZCB0aGF0IGh5ZHJhdGlvbiB3YXMgZW5hYmxlZCBmb3IgYW4gYXBwbGljYXRpb24gJyArXG4gICAgICAgICAgICAgICAgJ3RoYXQgdXNlcyBhIGN1c3RvbSBvciBhIG5vb3AgWm9uZS5qcyBpbXBsZW1lbnRhdGlvbi4gJyArXG4gICAgICAgICAgICAgICAgJ1RoaXMgaXMgbm90IHlldCBhIGZ1bGx5IHN1cHBvcnRlZCBjb25maWd1cmF0aW9uLicpO1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBtdWx0aTogdHJ1ZSxcbiAgfV07XG59XG5cbi8qKlxuICogU2V0cyB1cCBwcm92aWRlcnMgbmVjZXNzYXJ5IHRvIGVuYWJsZSBoeWRyYXRpb24gZnVuY3Rpb25hbGl0eSBmb3IgdGhlIGFwcGxpY2F0aW9uLlxuICpcbiAqIEJ5IGRlZmF1bHQsIHRoZSBmdW5jdGlvbiBlbmFibGVzIHRoZSByZWNvbW1lbmRlZCBzZXQgb2YgZmVhdHVyZXMgZm9yIHRoZSBvcHRpbWFsXG4gKiBwZXJmb3JtYW5jZSBmb3IgbW9zdCBvZiB0aGUgYXBwbGljYXRpb25zLiBZb3UgY2FuIGVuYWJsZS9kaXNhYmxlIGZlYXR1cmVzIGJ5XG4gKiBwYXNzaW5nIHNwZWNpYWwgZnVuY3Rpb25zIChmcm9tIHRoZSBgSHlkcmF0aW9uRmVhdHVyZXNgIHNldCkgYXMgYXJndW1lbnRzIHRvIHRoZVxuICogYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIGZ1bmN0aW9uLiBJdCBpbmNsdWRlcyB0aGUgZm9sbG93aW5nIGZlYXR1cmVzOlxuICpcbiAqICogUmVjb25jaWxpbmcgRE9NIGh5ZHJhdGlvbi4gTGVhcm4gbW9yZSBhYm91dCBpdCBbaGVyZV0oZ3VpZGUvaHlkcmF0aW9uKS5cbiAqICogW2BIdHRwQ2xpZW50YF0oYXBpL2NvbW1vbi9odHRwL0h0dHBDbGllbnQpIHJlc3BvbnNlIGNhY2hpbmcgd2hpbGUgcnVubmluZyBvbiB0aGUgc2VydmVyIGFuZFxuICogdHJhbnNmZXJyaW5nIHRoaXMgY2FjaGUgdG8gdGhlIGNsaWVudCB0byBhdm9pZCBleHRyYSBIVFRQIHJlcXVlc3RzLiBMZWFybiBtb3JlIGFib3V0IGRhdGEgY2FjaGluZ1xuICogW2hlcmVdKC9ndWlkZS91bml2ZXJzYWwjY2FjaGluZy1kYXRhLXdoZW4tdXNpbmctaHR0cGNsaWVudCkuXG4gKlxuICogVGhlc2UgZnVuY3Rpb25zIGZ1bmN0aW9ucyB3aWxsIGFsbG93IHlvdSB0byBkaXNhYmxlIHNvbWUgb2YgdGhlIGRlZmF1bHQgZmVhdHVyZXM6XG4gKiAqIHtAbGluayB3aXRoTm9Eb21SZXVzZX0gdG8gZGlzYWJsZSBET00gbm9kZXMgcmV1c2UgZHVyaW5nIGh5ZHJhdGlvblxuICogKiB7QGxpbmsgd2l0aE5vSHR0cFRyYW5zZmVyQ2FjaGV9IHRvIGRpc2FibGUgSFRUUCB0cmFuc2ZlciBjYWNoZVxuICpcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIEJhc2ljIGV4YW1wbGUgb2YgaG93IHlvdSBjYW4gZW5hYmxlIGh5ZHJhdGlvbiBpbiB5b3VyIGFwcGxpY2F0aW9uIHdoZW5cbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAgZnVuY3Rpb24gaXMgdXNlZDpcbiAqIGBgYFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwQ29tcG9uZW50LCB7XG4gKiAgIHByb3ZpZGVyczogW3Byb3ZpZGVDbGllbnRIeWRyYXRpb24oKV1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogQWx0ZXJuYXRpdmVseSBpZiB5b3UgYXJlIHVzaW5nIE5nTW9kdWxlcywgeW91IHdvdWxkIGFkZCBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbmBcbiAqIHRvIHlvdXIgcm9vdCBhcHAgbW9kdWxlJ3MgcHJvdmlkZXIgbGlzdC5cbiAqIGBgYFxuICogQE5nTW9kdWxlKHtcbiAqICAgZGVjbGFyYXRpb25zOiBbUm9vdENtcF0sXG4gKiAgIGJvb3RzdHJhcDogW1Jvb3RDbXBdLFxuICogICBwcm92aWRlcnM6IFtwcm92aWRlQ2xpZW50SHlkcmF0aW9uKCldLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBzZWUge0BsaW5rIHdpdGhOb0RvbVJldXNlfVxuICogQHNlZSB7QGxpbmsgd2l0aE5vSHR0cFRyYW5zZmVyQ2FjaGV9XG4gKlxuICogQHBhcmFtIGZlYXR1cmVzIE9wdGlvbmFsIGZlYXR1cmVzIHRvIGNvbmZpZ3VyZSBhZGRpdGlvbmFsIHJvdXRlciBiZWhhdmlvcnMuXG4gKiBAcmV0dXJucyBBIHNldCBvZiBwcm92aWRlcnMgdG8gZW5hYmxlIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUNsaWVudEh5ZHJhdGlvbiguLi5mZWF0dXJlczogSHlkcmF0aW9uRmVhdHVyZTxIeWRyYXRpb25GZWF0dXJlS2luZD5bXSk6XG4gICAgRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgY29uc3QgZmVhdHVyZXNLaW5kID0gbmV3IFNldDxIeWRyYXRpb25GZWF0dXJlS2luZD4oKTtcblxuICBmb3IgKGNvbnN0IHvJtXByb3ZpZGVycywgybVraW5kfSBvZiBmZWF0dXJlcykge1xuICAgIGZlYXR1cmVzS2luZC5hZGQoybVraW5kKTtcblxuICAgIGlmICjJtXByb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKMm1cHJvdmlkZXJzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkgPyBwcm92aWRlWm9uZUpzQ29tcGF0aWJpbGl0eURldGVjdG9yKCkgOiBbXSxcbiAgICAoZmVhdHVyZXNLaW5kLmhhcyhIeWRyYXRpb25GZWF0dXJlS2luZC5Ob0RvbVJldXNlRmVhdHVyZSkgPyBbXSA6IHdpdGhEb21IeWRyYXRpb24oKSksXG4gICAgKGZlYXR1cmVzS2luZC5oYXMoSHlkcmF0aW9uRmVhdHVyZUtpbmQuTm9IdHRwVHJhbnNmZXJDYWNoZSkgPyBbXSA6IHdpdGhIdHRwVHJhbnNmZXJDYWNoZSgpKSxcbiAgICBwcm92aWRlcnMsXG4gIF0pO1xufVxuIl19