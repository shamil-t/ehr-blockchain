/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { HttpBackend, HttpHandler } from './backend';
import { HttpClient } from './client';
import { FetchBackend } from './fetch';
import { HTTP_INTERCEPTOR_FNS, HttpInterceptorHandler, legacyInterceptorFnFactory } from './interceptor';
import { jsonpCallbackContext, JsonpCallbackContext, JsonpClientBackend, jsonpInterceptorFn } from './jsonp';
import { HttpXhrBackend } from './xhr';
import { HttpXsrfCookieExtractor, HttpXsrfTokenExtractor, XSRF_COOKIE_NAME, XSRF_ENABLED, XSRF_HEADER_NAME, xsrfInterceptorFn } from './xsrf';
/**
 * Identifies a particular kind of `HttpFeature`.
 *
 * @publicApi
 */
export var HttpFeatureKind;
(function (HttpFeatureKind) {
    HttpFeatureKind[HttpFeatureKind["Interceptors"] = 0] = "Interceptors";
    HttpFeatureKind[HttpFeatureKind["LegacyInterceptors"] = 1] = "LegacyInterceptors";
    HttpFeatureKind[HttpFeatureKind["CustomXsrfConfiguration"] = 2] = "CustomXsrfConfiguration";
    HttpFeatureKind[HttpFeatureKind["NoXsrfProtection"] = 3] = "NoXsrfProtection";
    HttpFeatureKind[HttpFeatureKind["JsonpSupport"] = 4] = "JsonpSupport";
    HttpFeatureKind[HttpFeatureKind["RequestsMadeViaParent"] = 5] = "RequestsMadeViaParent";
    HttpFeatureKind[HttpFeatureKind["Fetch"] = 6] = "Fetch";
})(HttpFeatureKind || (HttpFeatureKind = {}));
function makeHttpFeature(kind, providers) {
    return {
        ɵkind: kind,
        ɵproviders: providers,
    };
}
/**
 * Configures Angular's `HttpClient` service to be available for injection.
 *
 * By default, `HttpClient` will be configured for injection with its default options for XSRF
 * protection of outgoing requests. Additional configuration options can be provided by passing
 * feature functions to `provideHttpClient`. For example, HTTP interceptors can be added using the
 * `withInterceptors(...)` feature.
 *
 * @see {@link withInterceptors}
 * @see {@link withInterceptorsFromDi}
 * @see {@link withXsrfConfiguration}
 * @see {@link withNoXsrfProtection}
 * @see {@link withJsonpSupport}
 * @see {@link withRequestsMadeViaParent}
 * @see {@link withFetch}
 */
export function provideHttpClient(...features) {
    if (ngDevMode) {
        const featureKinds = new Set(features.map(f => f.ɵkind));
        if (featureKinds.has(HttpFeatureKind.NoXsrfProtection) &&
            featureKinds.has(HttpFeatureKind.CustomXsrfConfiguration)) {
            throw new Error(ngDevMode ?
                `Configuration error: found both withXsrfConfiguration() and withNoXsrfProtection() in the same call to provideHttpClient(), which is a contradiction.` :
                '');
        }
    }
    const providers = [
        HttpClient,
        HttpXhrBackend,
        HttpInterceptorHandler,
        { provide: HttpHandler, useExisting: HttpInterceptorHandler },
        { provide: HttpBackend, useExisting: HttpXhrBackend },
        {
            provide: HTTP_INTERCEPTOR_FNS,
            useValue: xsrfInterceptorFn,
            multi: true,
        },
        { provide: XSRF_ENABLED, useValue: true },
        { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfCookieExtractor },
    ];
    for (const feature of features) {
        providers.push(...feature.ɵproviders);
    }
    return makeEnvironmentProviders(providers);
}
/**
 * Adds one or more functional-style HTTP interceptors to the configuration of the `HttpClient`
 * instance.
 *
 * @see {@link HttpInterceptorFn}
 * @see {@link provideHttpClient}
 * @publicApi
 */
export function withInterceptors(interceptorFns) {
    return makeHttpFeature(HttpFeatureKind.Interceptors, interceptorFns.map(interceptorFn => {
        return {
            provide: HTTP_INTERCEPTOR_FNS,
            useValue: interceptorFn,
            multi: true,
        };
    }));
}
const LEGACY_INTERCEPTOR_FN = new InjectionToken('LEGACY_INTERCEPTOR_FN');
/**
 * Includes class-based interceptors configured using a multi-provider in the current injector into
 * the configured `HttpClient` instance.
 *
 * Prefer `withInterceptors` and functional interceptors instead, as support for DI-provided
 * interceptors may be phased out in a later release.
 *
 * @see {@link HttpInterceptor}
 * @see {@link HTTP_INTERCEPTORS}
 * @see {@link provideHttpClient}
 */
export function withInterceptorsFromDi() {
    // Note: the legacy interceptor function is provided here via an intermediate token
    // (`LEGACY_INTERCEPTOR_FN`), using a pattern which guarantees that if these providers are
    // included multiple times, all of the multi-provider entries will have the same instance of the
    // interceptor function. That way, the `HttpINterceptorHandler` will dedup them and legacy
    // interceptors will not run multiple times.
    return makeHttpFeature(HttpFeatureKind.LegacyInterceptors, [
        {
            provide: LEGACY_INTERCEPTOR_FN,
            useFactory: legacyInterceptorFnFactory,
        },
        {
            provide: HTTP_INTERCEPTOR_FNS,
            useExisting: LEGACY_INTERCEPTOR_FN,
            multi: true,
        }
    ]);
}
/**
 * Customizes the XSRF protection for the configuration of the current `HttpClient` instance.
 *
 * This feature is incompatible with the `withNoXsrfProtection` feature.
 *
 * @see {@link provideHttpClient}
 */
export function withXsrfConfiguration({ cookieName, headerName }) {
    const providers = [];
    if (cookieName !== undefined) {
        providers.push({ provide: XSRF_COOKIE_NAME, useValue: cookieName });
    }
    if (headerName !== undefined) {
        providers.push({ provide: XSRF_HEADER_NAME, useValue: headerName });
    }
    return makeHttpFeature(HttpFeatureKind.CustomXsrfConfiguration, providers);
}
/**
 * Disables XSRF protection in the configuration of the current `HttpClient` instance.
 *
 * This feature is incompatible with the `withXsrfConfiguration` feature.
 *
 * @see {@link provideHttpClient}
 */
export function withNoXsrfProtection() {
    return makeHttpFeature(HttpFeatureKind.NoXsrfProtection, [
        {
            provide: XSRF_ENABLED,
            useValue: false,
        },
    ]);
}
/**
 * Add JSONP support to the configuration of the current `HttpClient` instance.
 *
 * @see {@link provideHttpClient}
 */
export function withJsonpSupport() {
    return makeHttpFeature(HttpFeatureKind.JsonpSupport, [
        JsonpClientBackend,
        { provide: JsonpCallbackContext, useFactory: jsonpCallbackContext },
        { provide: HTTP_INTERCEPTOR_FNS, useValue: jsonpInterceptorFn, multi: true },
    ]);
}
/**
 * Configures the current `HttpClient` instance to make requests via the parent injector's
 * `HttpClient` instead of directly.
 *
 * By default, `provideHttpClient` configures `HttpClient` in its injector to be an independent
 * instance. For example, even if `HttpClient` is configured in the parent injector with
 * one or more interceptors, they will not intercept requests made via this instance.
 *
 * With this option enabled, once the request has passed through the current injector's
 * interceptors, it will be delegated to the parent injector's `HttpClient` chain instead of
 * dispatched directly, and interceptors in the parent configuration will be applied to the request.
 *
 * If there are several `HttpClient` instances in the injector hierarchy, it's possible for
 * `withRequestsMadeViaParent` to be used at multiple levels, which will cause the request to
 * "bubble up" until either reaching the root level or an `HttpClient` which was not configured with
 * this option.
 *
 * @see {@link provideHttpClient}
 * @developerPreview
 */
export function withRequestsMadeViaParent() {
    return makeHttpFeature(HttpFeatureKind.RequestsMadeViaParent, [
        {
            provide: HttpBackend,
            useFactory: () => {
                const handlerFromParent = inject(HttpHandler, { skipSelf: true, optional: true });
                if (ngDevMode && handlerFromParent === null) {
                    throw new Error('withRequestsMadeViaParent() can only be used when the parent injector also configures HttpClient');
                }
                return handlerFromParent;
            },
        },
    ]);
}
/**
 * Configures the current `HttpClient` instance to make requests using the fetch API.
 *
 * This `FetchBackend` requires the support of the Fetch API which is available on all evergreen
 * browsers and on NodeJS from v18 onward.
 *
 * Note: The Fetch API doesn't support progress report on uploads.
 *
 * @publicApi
 * @developerPreview
 */
export function withFetch() {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && typeof fetch !== 'function') {
        // TODO: Create a runtime error
        // TODO: Use ENVIRONMENT_INITIALIZER to contextualize the error message (browser or server)
        throw new Error('The `withFetch` feature of HttpClient requires the `fetch` API to be available. ' +
            'If you run the code in a Node environment, make sure you use Node v18.10 or later.');
    }
    return makeHttpFeature(HttpFeatureKind.Fetch, [
        FetchBackend,
        { provide: HttpBackend, useExisting: FetchBackend },
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vaHR0cC9zcmMvcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUF1QixNQUFNLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFXLE1BQU0sZUFBZSxDQUFDO0FBRS9HLE9BQU8sRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ25ELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNyQyxPQUFPLEVBQUMsb0JBQW9CLEVBQXFCLHNCQUFzQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFILE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMzRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3JDLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFNUk7Ozs7R0FJRztBQUNILE1BQU0sQ0FBTixJQUFZLGVBUVg7QUFSRCxXQUFZLGVBQWU7SUFDekIscUVBQVksQ0FBQTtJQUNaLGlGQUFrQixDQUFBO0lBQ2xCLDJGQUF1QixDQUFBO0lBQ3ZCLDZFQUFnQixDQUFBO0lBQ2hCLHFFQUFZLENBQUE7SUFDWix1RkFBcUIsQ0FBQTtJQUNyQix1REFBSyxDQUFBO0FBQ1AsQ0FBQyxFQVJXLGVBQWUsS0FBZixlQUFlLFFBUTFCO0FBWUQsU0FBUyxlQUFlLENBQ3BCLElBQVcsRUFBRSxTQUFxQjtJQUNwQyxP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aUJBQ3pHO2dCQUNELE9BQU8saUJBQWlCLENBQUM7WUFDM0IsQ0FBQztTQUNGO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUdEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsU0FBUztJQUN2QixJQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFVBQVUsRUFBRTtRQUNsRiwrQkFBK0I7UUFDL0IsMkZBQTJGO1FBQzNGLE1BQU0sSUFBSSxLQUFLLENBQ1gsa0ZBQWtGO1lBQ2xGLG9GQUFvRixDQUFDLENBQUM7S0FDM0Y7SUFFRCxPQUFPLGVBQWUsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFO1FBQzVDLFlBQVk7UUFDWixFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBQztLQUNsRCxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RW52aXJvbm1lbnRQcm92aWRlcnMsIGluamVjdCwgSW5qZWN0aW9uVG9rZW4sIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0h0dHBCYWNrZW5kLCBIdHRwSGFuZGxlcn0gZnJvbSAnLi9iYWNrZW5kJztcbmltcG9ydCB7SHR0cENsaWVudH0gZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IHtGZXRjaEJhY2tlbmR9IGZyb20gJy4vZmV0Y2gnO1xuaW1wb3J0IHtIVFRQX0lOVEVSQ0VQVE9SX0ZOUywgSHR0cEludGVyY2VwdG9yRm4sIEh0dHBJbnRlcmNlcHRvckhhbmRsZXIsIGxlZ2FjeUludGVyY2VwdG9yRm5GYWN0b3J5fSBmcm9tICcuL2ludGVyY2VwdG9yJztcbmltcG9ydCB7anNvbnBDYWxsYmFja0NvbnRleHQsIEpzb25wQ2FsbGJhY2tDb250ZXh0LCBKc29ucENsaWVudEJhY2tlbmQsIGpzb25wSW50ZXJjZXB0b3JGbn0gZnJvbSAnLi9qc29ucCc7XG5pbXBvcnQge0h0dHBYaHJCYWNrZW5kfSBmcm9tICcuL3hocic7XG5pbXBvcnQge0h0dHBYc3JmQ29va2llRXh0cmFjdG9yLCBIdHRwWHNyZlRva2VuRXh0cmFjdG9yLCBYU1JGX0NPT0tJRV9OQU1FLCBYU1JGX0VOQUJMRUQsIFhTUkZfSEVBREVSX05BTUUsIHhzcmZJbnRlcmNlcHRvckZufSBmcm9tICcuL3hzcmYnO1xuXG4vKipcbiAqIElkZW50aWZpZXMgYSBwYXJ0aWN1bGFyIGtpbmQgb2YgYEh0dHBGZWF0dXJlYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIEh0dHBGZWF0dXJlS2luZCB7XG4gIEludGVyY2VwdG9ycyxcbiAgTGVnYWN5SW50ZXJjZXB0b3JzLFxuICBDdXN0b21Yc3JmQ29uZmlndXJhdGlvbixcbiAgTm9Yc3JmUHJvdGVjdGlvbixcbiAgSnNvbnBTdXBwb3J0LFxuICBSZXF1ZXN0c01hZGVWaWFQYXJlbnQsXG4gIEZldGNoLFxufVxuXG4vKipcbiAqIEEgZmVhdHVyZSBmb3IgdXNlIHdoZW4gY29uZmlndXJpbmcgYHByb3ZpZGVIdHRwQ2xpZW50YC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSHR0cEZlYXR1cmU8S2luZFQgZXh0ZW5kcyBIdHRwRmVhdHVyZUtpbmQ+IHtcbiAgybVraW5kOiBLaW5kVDtcbiAgybVwcm92aWRlcnM6IFByb3ZpZGVyW107XG59XG5cbmZ1bmN0aW9uIG1ha2VIdHRwRmVhdHVyZTxLaW5kVCBleHRlbmRzIEh0dHBGZWF0dXJlS2luZD4oXG4gICAga2luZDogS2luZFQsIHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IEh0dHBGZWF0dXJlPEtpbmRUPiB7XG4gIHJldHVybiB7XG4gICAgybVraW5kOiBraW5kLFxuICAgIMm1cHJvdmlkZXJzOiBwcm92aWRlcnMsXG4gIH07XG59XG5cbi8qKlxuICogQ29uZmlndXJlcyBBbmd1bGFyJ3MgYEh0dHBDbGllbnRgIHNlcnZpY2UgdG8gYmUgYXZhaWxhYmxlIGZvciBpbmplY3Rpb24uXG4gKlxuICogQnkgZGVmYXVsdCwgYEh0dHBDbGllbnRgIHdpbGwgYmUgY29uZmlndXJlZCBmb3IgaW5qZWN0aW9uIHdpdGggaXRzIGRlZmF1bHQgb3B0aW9ucyBmb3IgWFNSRlxuICogcHJvdGVjdGlvbiBvZiBvdXRnb2luZyByZXF1ZXN0cy4gQWRkaXRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMgY2FuIGJlIHByb3ZpZGVkIGJ5IHBhc3NpbmdcbiAqIGZlYXR1cmUgZnVuY3Rpb25zIHRvIGBwcm92aWRlSHR0cENsaWVudGAuIEZvciBleGFtcGxlLCBIVFRQIGludGVyY2VwdG9ycyBjYW4gYmUgYWRkZWQgdXNpbmcgdGhlXG4gKiBgd2l0aEludGVyY2VwdG9ycyguLi4pYCBmZWF0dXJlLlxuICpcbiAqIEBzZWUge0BsaW5rIHdpdGhJbnRlcmNlcHRvcnN9XG4gKiBAc2VlIHtAbGluayB3aXRoSW50ZXJjZXB0b3JzRnJvbURpfVxuICogQHNlZSB7QGxpbmsgd2l0aFhzcmZDb25maWd1cmF0aW9ufVxuICogQHNlZSB7QGxpbmsgd2l0aE5vWHNyZlByb3RlY3Rpb259XG4gKiBAc2VlIHtAbGluayB3aXRoSnNvbnBTdXBwb3J0fVxuICogQHNlZSB7QGxpbmsgd2l0aFJlcXVlc3RzTWFkZVZpYVBhcmVudH1cbiAqIEBzZWUge0BsaW5rIHdpdGhGZXRjaH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVIdHRwQ2xpZW50KC4uLmZlYXR1cmVzOiBIdHRwRmVhdHVyZTxIdHRwRmVhdHVyZUtpbmQ+W10pOlxuICAgIEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGNvbnN0IGZlYXR1cmVLaW5kcyA9IG5ldyBTZXQoZmVhdHVyZXMubWFwKGYgPT4gZi7JtWtpbmQpKTtcbiAgICBpZiAoZmVhdHVyZUtpbmRzLmhhcyhIdHRwRmVhdHVyZUtpbmQuTm9Yc3JmUHJvdGVjdGlvbikgJiZcbiAgICAgICAgZmVhdHVyZUtpbmRzLmhhcyhIdHRwRmVhdHVyZUtpbmQuQ3VzdG9tWHNyZkNvbmZpZ3VyYXRpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgbmdEZXZNb2RlID9cbiAgICAgICAgICAgICAgYENvbmZpZ3VyYXRpb24gZXJyb3I6IGZvdW5kIGJvdGggd2l0aFhzcmZDb25maWd1cmF0aW9uKCkgYW5kIHdpdGhOb1hzcmZQcm90ZWN0aW9uKCkgaW4gdGhlIHNhbWUgY2FsbCB0byBwcm92aWRlSHR0cENsaWVudCgpLCB3aGljaCBpcyBhIGNvbnRyYWRpY3Rpb24uYCA6XG4gICAgICAgICAgICAgICcnKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXG4gICAgSHR0cENsaWVudCxcbiAgICBIdHRwWGhyQmFja2VuZCxcbiAgICBIdHRwSW50ZXJjZXB0b3JIYW5kbGVyLFxuICAgIHtwcm92aWRlOiBIdHRwSGFuZGxlciwgdXNlRXhpc3Rpbmc6IEh0dHBJbnRlcmNlcHRvckhhbmRsZXJ9LFxuICAgIHtwcm92aWRlOiBIdHRwQmFja2VuZCwgdXNlRXhpc3Rpbmc6IEh0dHBYaHJCYWNrZW5kfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBIVFRQX0lOVEVSQ0VQVE9SX0ZOUyxcbiAgICAgIHVzZVZhbHVlOiB4c3JmSW50ZXJjZXB0b3JGbixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge3Byb3ZpZGU6IFhTUkZfRU5BQkxFRCwgdXNlVmFsdWU6IHRydWV9LFxuICAgIHtwcm92aWRlOiBIdHRwWHNyZlRva2VuRXh0cmFjdG9yLCB1c2VDbGFzczogSHR0cFhzcmZDb29raWVFeHRyYWN0b3J9LFxuICBdO1xuXG4gIGZvciAoY29uc3QgZmVhdHVyZSBvZiBmZWF0dXJlcykge1xuICAgIHByb3ZpZGVycy5wdXNoKC4uLmZlYXR1cmUuybVwcm92aWRlcnMpO1xuICB9XG5cbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhwcm92aWRlcnMpO1xufVxuXG4vKipcbiAqIEFkZHMgb25lIG9yIG1vcmUgZnVuY3Rpb25hbC1zdHlsZSBIVFRQIGludGVyY2VwdG9ycyB0byB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgYEh0dHBDbGllbnRgXG4gKiBpbnN0YW5jZS5cbiAqXG4gKiBAc2VlIHtAbGluayBIdHRwSW50ZXJjZXB0b3JGbn1cbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVIdHRwQ2xpZW50fVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEludGVyY2VwdG9ycyhpbnRlcmNlcHRvckZuczogSHR0cEludGVyY2VwdG9yRm5bXSk6XG4gICAgSHR0cEZlYXR1cmU8SHR0cEZlYXR1cmVLaW5kLkludGVyY2VwdG9ycz4ge1xuICByZXR1cm4gbWFrZUh0dHBGZWF0dXJlKEh0dHBGZWF0dXJlS2luZC5JbnRlcmNlcHRvcnMsIGludGVyY2VwdG9yRm5zLm1hcChpbnRlcmNlcHRvckZuID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdmlkZTogSFRUUF9JTlRFUkNFUFRPUl9GTlMsXG4gICAgICB1c2VWYWx1ZTogaW50ZXJjZXB0b3JGbixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH07XG4gIH0pKTtcbn1cblxuY29uc3QgTEVHQUNZX0lOVEVSQ0VQVE9SX0ZOID0gbmV3IEluamVjdGlvblRva2VuPEh0dHBJbnRlcmNlcHRvckZuPignTEVHQUNZX0lOVEVSQ0VQVE9SX0ZOJyk7XG5cbi8qKlxuICogSW5jbHVkZXMgY2xhc3MtYmFzZWQgaW50ZXJjZXB0b3JzIGNvbmZpZ3VyZWQgdXNpbmcgYSBtdWx0aS1wcm92aWRlciBpbiB0aGUgY3VycmVudCBpbmplY3RvciBpbnRvXG4gKiB0aGUgY29uZmlndXJlZCBgSHR0cENsaWVudGAgaW5zdGFuY2UuXG4gKlxuICogUHJlZmVyIGB3aXRoSW50ZXJjZXB0b3JzYCBhbmQgZnVuY3Rpb25hbCBpbnRlcmNlcHRvcnMgaW5zdGVhZCwgYXMgc3VwcG9ydCBmb3IgREktcHJvdmlkZWRcbiAqIGludGVyY2VwdG9ycyBtYXkgYmUgcGhhc2VkIG91dCBpbiBhIGxhdGVyIHJlbGVhc2UuXG4gKlxuICogQHNlZSB7QGxpbmsgSHR0cEludGVyY2VwdG9yfVxuICogQHNlZSB7QGxpbmsgSFRUUF9JTlRFUkNFUFRPUlN9XG4gKiBAc2VlIHtAbGluayBwcm92aWRlSHR0cENsaWVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhJbnRlcmNlcHRvcnNGcm9tRGkoKTogSHR0cEZlYXR1cmU8SHR0cEZlYXR1cmVLaW5kLkxlZ2FjeUludGVyY2VwdG9ycz4ge1xuICAvLyBOb3RlOiB0aGUgbGVnYWN5IGludGVyY2VwdG9yIGZ1bmN0aW9uIGlzIHByb3ZpZGVkIGhlcmUgdmlhIGFuIGludGVybWVkaWF0ZSB0b2tlblxuICAvLyAoYExFR0FDWV9JTlRFUkNFUFRPUl9GTmApLCB1c2luZyBhIHBhdHRlcm4gd2hpY2ggZ3VhcmFudGVlcyB0aGF0IGlmIHRoZXNlIHByb3ZpZGVycyBhcmVcbiAgLy8gaW5jbHVkZWQgbXVsdGlwbGUgdGltZXMsIGFsbCBvZiB0aGUgbXVsdGktcHJvdmlkZXIgZW50cmllcyB3aWxsIGhhdmUgdGhlIHNhbWUgaW5zdGFuY2Ugb2YgdGhlXG4gIC8vIGludGVyY2VwdG9yIGZ1bmN0aW9uLiBUaGF0IHdheSwgdGhlIGBIdHRwSU50ZXJjZXB0b3JIYW5kbGVyYCB3aWxsIGRlZHVwIHRoZW0gYW5kIGxlZ2FjeVxuICAvLyBpbnRlcmNlcHRvcnMgd2lsbCBub3QgcnVuIG11bHRpcGxlIHRpbWVzLlxuICByZXR1cm4gbWFrZUh0dHBGZWF0dXJlKEh0dHBGZWF0dXJlS2luZC5MZWdhY3lJbnRlcmNlcHRvcnMsIFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBMRUdBQ1lfSU5URVJDRVBUT1JfRk4sXG4gICAgICB1c2VGYWN0b3J5OiBsZWdhY3lJbnRlcmNlcHRvckZuRmFjdG9yeSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEhUVFBfSU5URVJDRVBUT1JfRk5TLFxuICAgICAgdXNlRXhpc3Rpbmc6IExFR0FDWV9JTlRFUkNFUFRPUl9GTixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXSk7XG59XG5cbi8qKlxuICogQ3VzdG9taXplcyB0aGUgWFNSRiBwcm90ZWN0aW9uIGZvciB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgY3VycmVudCBgSHR0cENsaWVudGAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmZWF0dXJlIGlzIGluY29tcGF0aWJsZSB3aXRoIHRoZSBgd2l0aE5vWHNyZlByb3RlY3Rpb25gIGZlYXR1cmUuXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZUh0dHBDbGllbnR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoWHNyZkNvbmZpZ3VyYXRpb24oXG4gICAge2Nvb2tpZU5hbWUsIGhlYWRlck5hbWV9OiB7Y29va2llTmFtZT86IHN0cmluZywgaGVhZGVyTmFtZT86IHN0cmluZ30pOlxuICAgIEh0dHBGZWF0dXJlPEh0dHBGZWF0dXJlS2luZC5DdXN0b21Yc3JmQ29uZmlndXJhdGlvbj4ge1xuICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgaWYgKGNvb2tpZU5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHByb3ZpZGVycy5wdXNoKHtwcm92aWRlOiBYU1JGX0NPT0tJRV9OQU1FLCB1c2VWYWx1ZTogY29va2llTmFtZX0pO1xuICB9XG4gIGlmIChoZWFkZXJOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICBwcm92aWRlcnMucHVzaCh7cHJvdmlkZTogWFNSRl9IRUFERVJfTkFNRSwgdXNlVmFsdWU6IGhlYWRlck5hbWV9KTtcbiAgfVxuXG4gIHJldHVybiBtYWtlSHR0cEZlYXR1cmUoSHR0cEZlYXR1cmVLaW5kLkN1c3RvbVhzcmZDb25maWd1cmF0aW9uLCBwcm92aWRlcnMpO1xufVxuXG4vKipcbiAqIERpc2FibGVzIFhTUkYgcHJvdGVjdGlvbiBpbiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgY3VycmVudCBgSHR0cENsaWVudGAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBmZWF0dXJlIGlzIGluY29tcGF0aWJsZSB3aXRoIHRoZSBgd2l0aFhzcmZDb25maWd1cmF0aW9uYCBmZWF0dXJlLlxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVIdHRwQ2xpZW50fVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aE5vWHNyZlByb3RlY3Rpb24oKTogSHR0cEZlYXR1cmU8SHR0cEZlYXR1cmVLaW5kLk5vWHNyZlByb3RlY3Rpb24+IHtcbiAgcmV0dXJuIG1ha2VIdHRwRmVhdHVyZShIdHRwRmVhdHVyZUtpbmQuTm9Yc3JmUHJvdGVjdGlvbiwgW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IFhTUkZfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiBmYWxzZSxcbiAgICB9LFxuICBdKTtcbn1cblxuLyoqXG4gKiBBZGQgSlNPTlAgc3VwcG9ydCB0byB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgY3VycmVudCBgSHR0cENsaWVudGAgaW5zdGFuY2UuXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZUh0dHBDbGllbnR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoSnNvbnBTdXBwb3J0KCk6IEh0dHBGZWF0dXJlPEh0dHBGZWF0dXJlS2luZC5Kc29ucFN1cHBvcnQ+IHtcbiAgcmV0dXJuIG1ha2VIdHRwRmVhdHVyZShIdHRwRmVhdHVyZUtpbmQuSnNvbnBTdXBwb3J0LCBbXG4gICAgSnNvbnBDbGllbnRCYWNrZW5kLFxuICAgIHtwcm92aWRlOiBKc29ucENhbGxiYWNrQ29udGV4dCwgdXNlRmFjdG9yeToganNvbnBDYWxsYmFja0NvbnRleHR9LFxuICAgIHtwcm92aWRlOiBIVFRQX0lOVEVSQ0VQVE9SX0ZOUywgdXNlVmFsdWU6IGpzb25wSW50ZXJjZXB0b3JGbiwgbXVsdGk6IHRydWV9LFxuICBdKTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBjdXJyZW50IGBIdHRwQ2xpZW50YCBpbnN0YW5jZSB0byBtYWtlIHJlcXVlc3RzIHZpYSB0aGUgcGFyZW50IGluamVjdG9yJ3NcbiAqIGBIdHRwQ2xpZW50YCBpbnN0ZWFkIG9mIGRpcmVjdGx5LlxuICpcbiAqIEJ5IGRlZmF1bHQsIGBwcm92aWRlSHR0cENsaWVudGAgY29uZmlndXJlcyBgSHR0cENsaWVudGAgaW4gaXRzIGluamVjdG9yIHRvIGJlIGFuIGluZGVwZW5kZW50XG4gKiBpbnN0YW5jZS4gRm9yIGV4YW1wbGUsIGV2ZW4gaWYgYEh0dHBDbGllbnRgIGlzIGNvbmZpZ3VyZWQgaW4gdGhlIHBhcmVudCBpbmplY3RvciB3aXRoXG4gKiBvbmUgb3IgbW9yZSBpbnRlcmNlcHRvcnMsIHRoZXkgd2lsbCBub3QgaW50ZXJjZXB0IHJlcXVlc3RzIG1hZGUgdmlhIHRoaXMgaW5zdGFuY2UuXG4gKlxuICogV2l0aCB0aGlzIG9wdGlvbiBlbmFibGVkLCBvbmNlIHRoZSByZXF1ZXN0IGhhcyBwYXNzZWQgdGhyb3VnaCB0aGUgY3VycmVudCBpbmplY3RvcidzXG4gKiBpbnRlcmNlcHRvcnMsIGl0IHdpbGwgYmUgZGVsZWdhdGVkIHRvIHRoZSBwYXJlbnQgaW5qZWN0b3IncyBgSHR0cENsaWVudGAgY2hhaW4gaW5zdGVhZCBvZlxuICogZGlzcGF0Y2hlZCBkaXJlY3RseSwgYW5kIGludGVyY2VwdG9ycyBpbiB0aGUgcGFyZW50IGNvbmZpZ3VyYXRpb24gd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSByZXF1ZXN0LlxuICpcbiAqIElmIHRoZXJlIGFyZSBzZXZlcmFsIGBIdHRwQ2xpZW50YCBpbnN0YW5jZXMgaW4gdGhlIGluamVjdG9yIGhpZXJhcmNoeSwgaXQncyBwb3NzaWJsZSBmb3JcbiAqIGB3aXRoUmVxdWVzdHNNYWRlVmlhUGFyZW50YCB0byBiZSB1c2VkIGF0IG11bHRpcGxlIGxldmVscywgd2hpY2ggd2lsbCBjYXVzZSB0aGUgcmVxdWVzdCB0b1xuICogXCJidWJibGUgdXBcIiB1bnRpbCBlaXRoZXIgcmVhY2hpbmcgdGhlIHJvb3QgbGV2ZWwgb3IgYW4gYEh0dHBDbGllbnRgIHdoaWNoIHdhcyBub3QgY29uZmlndXJlZCB3aXRoXG4gKiB0aGlzIG9wdGlvbi5cbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlSHR0cENsaWVudH1cbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoUmVxdWVzdHNNYWRlVmlhUGFyZW50KCk6IEh0dHBGZWF0dXJlPEh0dHBGZWF0dXJlS2luZC5SZXF1ZXN0c01hZGVWaWFQYXJlbnQ+IHtcbiAgcmV0dXJuIG1ha2VIdHRwRmVhdHVyZShIdHRwRmVhdHVyZUtpbmQuUmVxdWVzdHNNYWRlVmlhUGFyZW50LCBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSHR0cEJhY2tlbmQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJGcm9tUGFyZW50ID0gaW5qZWN0KEh0dHBIYW5kbGVyLCB7c2tpcFNlbGY6IHRydWUsIG9wdGlvbmFsOiB0cnVlfSk7XG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgaGFuZGxlckZyb21QYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICd3aXRoUmVxdWVzdHNNYWRlVmlhUGFyZW50KCkgY2FuIG9ubHkgYmUgdXNlZCB3aGVuIHRoZSBwYXJlbnQgaW5qZWN0b3IgYWxzbyBjb25maWd1cmVzIEh0dHBDbGllbnQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGFuZGxlckZyb21QYXJlbnQ7XG4gICAgICB9LFxuICAgIH0sXG4gIF0pO1xufVxuXG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgY3VycmVudCBgSHR0cENsaWVudGAgaW5zdGFuY2UgdG8gbWFrZSByZXF1ZXN0cyB1c2luZyB0aGUgZmV0Y2ggQVBJLlxuICpcbiAqIFRoaXMgYEZldGNoQmFja2VuZGAgcmVxdWlyZXMgdGhlIHN1cHBvcnQgb2YgdGhlIEZldGNoIEFQSSB3aGljaCBpcyBhdmFpbGFibGUgb24gYWxsIGV2ZXJncmVlblxuICogYnJvd3NlcnMgYW5kIG9uIE5vZGVKUyBmcm9tIHYxOCBvbndhcmQuXG4gKlxuICogTm90ZTogVGhlIEZldGNoIEFQSSBkb2Vzbid0IHN1cHBvcnQgcHJvZ3Jlc3MgcmVwb3J0IG9uIHVwbG9hZHMuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhGZXRjaCgpOiBIdHRwRmVhdHVyZTxIdHRwRmVhdHVyZUtpbmQuRmV0Y2g+IHtcbiAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHR5cGVvZiBmZXRjaCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFRPRE86IENyZWF0ZSBhIHJ1bnRpbWUgZXJyb3JcbiAgICAvLyBUT0RPOiBVc2UgRU5WSVJPTk1FTlRfSU5JVElBTElaRVIgdG8gY29udGV4dHVhbGl6ZSB0aGUgZXJyb3IgbWVzc2FnZSAoYnJvd3NlciBvciBzZXJ2ZXIpXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVGhlIGB3aXRoRmV0Y2hgIGZlYXR1cmUgb2YgSHR0cENsaWVudCByZXF1aXJlcyB0aGUgYGZldGNoYCBBUEkgdG8gYmUgYXZhaWxhYmxlLiAnICtcbiAgICAgICAgJ0lmIHlvdSBydW4gdGhlIGNvZGUgaW4gYSBOb2RlIGVudmlyb25tZW50LCBtYWtlIHN1cmUgeW91IHVzZSBOb2RlIHYxOC4xMCBvciBsYXRlci4nKTtcbiAgfVxuXG4gIHJldHVybiBtYWtlSHR0cEZlYXR1cmUoSHR0cEZlYXR1cmVLaW5kLkZldGNoLCBbXG4gICAgRmV0Y2hCYWNrZW5kLFxuICAgIHtwcm92aWRlOiBIdHRwQmFja2VuZCwgdXNlRXhpc3Rpbmc6IEZldGNoQmFja2VuZH0sXG4gIF0pO1xufVxuIl19