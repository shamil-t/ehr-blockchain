/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di/injection_token';
import { getDocument } from './render3/interfaces/document';
/**
 * A [DI token](guide/glossary#di-token "DI token definition") representing a string ID, used
 * primarily for prefixing application attributes and CSS styles when
 * {@link ViewEncapsulation#Emulated} is being used.
 *
 * The token is needed in cases when multiple applications are bootstrapped on a page
 * (for example, using `bootstrapApplication` calls). In this case, ensure that those applications
 * have different `APP_ID` value setup. For example:
 *
 * ```
 * bootstrapApplication(ComponentA, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-a' },
 *     // ... other providers ...
 *   ]
 * });
 *
 * bootstrapApplication(ComponentB, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-b' },
 *     // ... other providers ...
 *   ]
 * });
 * ```
 *
 * By default, when there is only one application bootstrapped, you don't need to provide the
 * `APP_ID` token (the `ng` will be used as an app ID).
 *
 * @publicApi
 */
export const APP_ID = new InjectionToken('AppId', {
    providedIn: 'root',
    factory: () => DEFAULT_APP_ID,
});
/** Default value of the `APP_ID` token. */
const DEFAULT_APP_ID = 'ng';
/**
 * A function that is executed when a platform is initialized.
 * @publicApi
 */
export const PLATFORM_INITIALIZER = new InjectionToken('Platform Initializer');
/**
 * A token that indicates an opaque platform ID.
 * @publicApi
 */
export const PLATFORM_ID = new InjectionToken('Platform ID', {
    providedIn: 'platform',
    factory: () => 'unknown', // set a default platform name, when none set explicitly
});
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that indicates the root directory of
 * the application
 * @publicApi
 * @deprecated
 */
export const PACKAGE_ROOT_URL = new InjectionToken('Application Packages Root URL');
// We keep this token here, rather than the animations package, so that modules that only care
// about which animations module is loaded (e.g. the CDK) can retrieve it without having to
// include extra dependencies. See #44970 for more context.
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that indicates which animations
 * module has been loaded.
 * @publicApi
 */
export const ANIMATION_MODULE_TYPE = new InjectionToken('AnimationModuleType');
// TODO(crisbeto): link to CSP guide here.
/**
 * Token used to configure the [Content Security Policy](https://web.dev/strict-csp/) nonce that
 * Angular will apply when inserting inline styles. If not provided, Angular will look up its value
 * from the `ngCspNonce` attribute of the application root node.
 *
 * @publicApi
 */
export const CSP_NONCE = new InjectionToken('CSP nonce', {
    providedIn: 'root',
    factory: () => {
        // Ideally we wouldn't have to use `querySelector` here since we know that the nonce will be on
        // the root node, but because the token value is used in renderers, it has to be available
        // *very* early in the bootstrapping process. This should be a fairly shallow search, because
        // the app won't have been added to the DOM yet. Some approaches that were considered:
        // 1. Find the root node through `ApplicationRef.components[i].location` - normally this would
        // be enough for our purposes, but the token is injected very early so the `components` array
        // isn't populated yet.
        // 2. Find the root `LView` through the current `LView` - renderers are a prerequisite to
        // creating the `LView`. This means that no `LView` will have been entered when this factory is
        // invoked for the root component.
        // 3. Have the token factory return `() => string` which is invoked when a nonce is requested -
        // the slightly later execution does allow us to get an `LView` reference, but the fact that
        // it is a function means that it could be executed at *any* time (including immediately) which
        // may lead to weird bugs.
        // 4. Have the `ComponentFactory` read the attribute and provide it to the injector under the
        // hood - has the same problem as #1 and #2 in that the renderer is used to query for the root
        // node and the nonce value needs to be available when the renderer is created.
        return getDocument().body?.querySelector('[ngCspNonce]')?.getAttribute('ngCspNonce') || null;
    },
});
/**
 * Internal token to collect all SSR-related features enabled for this application.
 *
 * Note: the token is in `core` to let other packages register features (the `core`
 * package is imported in other packages).
 */
export const ENABLED_SSR_FEATURES = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'ENABLED_SSR_FEATURES' : '', {
    providedIn: 'root',
    factory: () => new Set(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFFMUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFTLE9BQU8sRUFBRTtJQUN4RCxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztDQUM5QixDQUFDLENBQUM7QUFFSCwyQ0FBMkM7QUFDM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTVCOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLElBQUksY0FBYyxDQUFvQixzQkFBc0IsQ0FBQyxDQUFDO0FBRWxHOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxJQUFJLGNBQWMsQ0FBUyxhQUFhLEVBQUU7SUFDbkUsVUFBVSxFQUFFLFVBQVU7SUFDdEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRyx3REFBd0Q7Q0FDcEYsQ0FBQyxDQUFDO0FBRUg7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBUywrQkFBK0IsQ0FBQyxDQUFDO0FBRTVGLDhGQUE4RjtBQUM5RiwyRkFBMkY7QUFDM0YsMkRBQTJEO0FBRTNEOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FDOUIsSUFBSSxjQUFjLENBQXVDLHFCQUFxQixDQUFDLENBQUM7QUFFcEYsMENBQTBDO0FBQzFDOzs7Ozs7R0FNRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxJQUFJLGNBQWMsQ0FBYyxXQUFXLEVBQUU7SUFDcEUsVUFBVSxFQUFFLE1BQU07SUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUNaLCtGQUErRjtRQUMvRiwwRkFBMEY7UUFDMUYsNkZBQTZGO1FBQzdGLHNGQUFzRjtRQUN0Riw4RkFBOEY7UUFDOUYsNkZBQTZGO1FBQzdGLHVCQUF1QjtRQUN2Qix5RkFBeUY7UUFDekYsK0ZBQStGO1FBQy9GLGtDQUFrQztRQUNsQywrRkFBK0Y7UUFDL0YsNEZBQTRGO1FBQzVGLCtGQUErRjtRQUMvRiwwQkFBMEI7UUFDMUIsNkZBQTZGO1FBQzdGLDhGQUE4RjtRQUM5RiwrRUFBK0U7UUFDL0UsT0FBTyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDL0YsQ0FBQztDQUNGLENBQUMsQ0FBQztBQUVIOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxjQUFjLENBQ2xELENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQzdFLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRTtDQUN6QixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQnO1xuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgcmVwcmVzZW50aW5nIGEgc3RyaW5nIElELCB1c2VkXG4gKiBwcmltYXJpbHkgZm9yIHByZWZpeGluZyBhcHBsaWNhdGlvbiBhdHRyaWJ1dGVzIGFuZCBDU1Mgc3R5bGVzIHdoZW5cbiAqIHtAbGluayBWaWV3RW5jYXBzdWxhdGlvbiNFbXVsYXRlZH0gaXMgYmVpbmcgdXNlZC5cbiAqXG4gKiBUaGUgdG9rZW4gaXMgbmVlZGVkIGluIGNhc2VzIHdoZW4gbXVsdGlwbGUgYXBwbGljYXRpb25zIGFyZSBib290c3RyYXBwZWQgb24gYSBwYWdlXG4gKiAoZm9yIGV4YW1wbGUsIHVzaW5nIGBib290c3RyYXBBcHBsaWNhdGlvbmAgY2FsbHMpLiBJbiB0aGlzIGNhc2UsIGVuc3VyZSB0aGF0IHRob3NlIGFwcGxpY2F0aW9uc1xuICogaGF2ZSBkaWZmZXJlbnQgYEFQUF9JRGAgdmFsdWUgc2V0dXAuIEZvciBleGFtcGxlOlxuICpcbiAqIGBgYFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQ29tcG9uZW50QSwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICB7IHByb3ZpZGU6IEFQUF9JRCwgdXNlVmFsdWU6ICdhcHAtYScgfSxcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICBdXG4gKiB9KTtcbiAqXG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihDb21wb25lbnRCLCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIHsgcHJvdmlkZTogQVBQX0lELCB1c2VWYWx1ZTogJ2FwcC1iJyB9LFxuICogICAgIC8vIC4uLiBvdGhlciBwcm92aWRlcnMgLi4uXG4gKiAgIF1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogQnkgZGVmYXVsdCwgd2hlbiB0aGVyZSBpcyBvbmx5IG9uZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQsIHlvdSBkb24ndCBuZWVkIHRvIHByb3ZpZGUgdGhlXG4gKiBgQVBQX0lEYCB0b2tlbiAodGhlIGBuZ2Agd2lsbCBiZSB1c2VkIGFzIGFuIGFwcCBJRCkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVBQX0lEID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZz4oJ0FwcElkJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IERFRkFVTFRfQVBQX0lELFxufSk7XG5cbi8qKiBEZWZhdWx0IHZhbHVlIG9mIHRoZSBgQVBQX0lEYCB0b2tlbi4gKi9cbmNvbnN0IERFRkFVTFRfQVBQX0lEID0gJ25nJztcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaXMgZXhlY3V0ZWQgd2hlbiBhIHBsYXRmb3JtIGlzIGluaXRpYWxpemVkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUExBVEZPUk1fSU5JVElBTElaRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48QXJyYXk8KCkgPT4gdm9pZD4+KCdQbGF0Zm9ybSBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgdG9rZW4gdGhhdCBpbmRpY2F0ZXMgYW4gb3BhcXVlIHBsYXRmb3JtIElELlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUExBVEZPUk1fSUQgPSBuZXcgSW5qZWN0aW9uVG9rZW48T2JqZWN0PignUGxhdGZvcm0gSUQnLCB7XG4gIHByb3ZpZGVkSW46ICdwbGF0Zm9ybScsXG4gIGZhY3Rvcnk6ICgpID0+ICd1bmtub3duJywgIC8vIHNldCBhIGRlZmF1bHQgcGxhdGZvcm0gbmFtZSwgd2hlbiBub25lIHNldCBleHBsaWNpdGx5XG59KTtcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgaW5kaWNhdGVzIHRoZSByb290IGRpcmVjdG9yeSBvZlxuICogdGhlIGFwcGxpY2F0aW9uXG4gKiBAcHVibGljQXBpXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9ST09UX1VSTCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBsaWNhdGlvbiBQYWNrYWdlcyBSb290IFVSTCcpO1xuXG4vLyBXZSBrZWVwIHRoaXMgdG9rZW4gaGVyZSwgcmF0aGVyIHRoYW4gdGhlIGFuaW1hdGlvbnMgcGFja2FnZSwgc28gdGhhdCBtb2R1bGVzIHRoYXQgb25seSBjYXJlXG4vLyBhYm91dCB3aGljaCBhbmltYXRpb25zIG1vZHVsZSBpcyBsb2FkZWQgKGUuZy4gdGhlIENESykgY2FuIHJldHJpZXZlIGl0IHdpdGhvdXQgaGF2aW5nIHRvXG4vLyBpbmNsdWRlIGV4dHJhIGRlcGVuZGVuY2llcy4gU2VlICM0NDk3MCBmb3IgbW9yZSBjb250ZXh0LlxuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCBpbmRpY2F0ZXMgd2hpY2ggYW5pbWF0aW9uc1xuICogbW9kdWxlIGhhcyBiZWVuIGxvYWRlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9NT0RVTEVfVFlQRSA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPCdOb29wQW5pbWF0aW9ucyd8J0Jyb3dzZXJBbmltYXRpb25zJz4oJ0FuaW1hdGlvbk1vZHVsZVR5cGUnKTtcblxuLy8gVE9ETyhjcmlzYmV0byk6IGxpbmsgdG8gQ1NQIGd1aWRlIGhlcmUuXG4vKipcbiAqIFRva2VuIHVzZWQgdG8gY29uZmlndXJlIHRoZSBbQ29udGVudCBTZWN1cml0eSBQb2xpY3ldKGh0dHBzOi8vd2ViLmRldi9zdHJpY3QtY3NwLykgbm9uY2UgdGhhdFxuICogQW5ndWxhciB3aWxsIGFwcGx5IHdoZW4gaW5zZXJ0aW5nIGlubGluZSBzdHlsZXMuIElmIG5vdCBwcm92aWRlZCwgQW5ndWxhciB3aWxsIGxvb2sgdXAgaXRzIHZhbHVlXG4gKiBmcm9tIHRoZSBgbmdDc3BOb25jZWAgYXR0cmlidXRlIG9mIHRoZSBhcHBsaWNhdGlvbiByb290IG5vZGUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQ1NQX05PTkNFID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZ3xudWxsPignQ1NQIG5vbmNlJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IHtcbiAgICAvLyBJZGVhbGx5IHdlIHdvdWxkbid0IGhhdmUgdG8gdXNlIGBxdWVyeVNlbGVjdG9yYCBoZXJlIHNpbmNlIHdlIGtub3cgdGhhdCB0aGUgbm9uY2Ugd2lsbCBiZSBvblxuICAgIC8vIHRoZSByb290IG5vZGUsIGJ1dCBiZWNhdXNlIHRoZSB0b2tlbiB2YWx1ZSBpcyB1c2VkIGluIHJlbmRlcmVycywgaXQgaGFzIHRvIGJlIGF2YWlsYWJsZVxuICAgIC8vICp2ZXJ5KiBlYXJseSBpbiB0aGUgYm9vdHN0cmFwcGluZyBwcm9jZXNzLiBUaGlzIHNob3VsZCBiZSBhIGZhaXJseSBzaGFsbG93IHNlYXJjaCwgYmVjYXVzZVxuICAgIC8vIHRoZSBhcHAgd29uJ3QgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBET00geWV0LiBTb21lIGFwcHJvYWNoZXMgdGhhdCB3ZXJlIGNvbnNpZGVyZWQ6XG4gICAgLy8gMS4gRmluZCB0aGUgcm9vdCBub2RlIHRocm91Z2ggYEFwcGxpY2F0aW9uUmVmLmNvbXBvbmVudHNbaV0ubG9jYXRpb25gIC0gbm9ybWFsbHkgdGhpcyB3b3VsZFxuICAgIC8vIGJlIGVub3VnaCBmb3Igb3VyIHB1cnBvc2VzLCBidXQgdGhlIHRva2VuIGlzIGluamVjdGVkIHZlcnkgZWFybHkgc28gdGhlIGBjb21wb25lbnRzYCBhcnJheVxuICAgIC8vIGlzbid0IHBvcHVsYXRlZCB5ZXQuXG4gICAgLy8gMi4gRmluZCB0aGUgcm9vdCBgTFZpZXdgIHRocm91Z2ggdGhlIGN1cnJlbnQgYExWaWV3YCAtIHJlbmRlcmVycyBhcmUgYSBwcmVyZXF1aXNpdGUgdG9cbiAgICAvLyBjcmVhdGluZyB0aGUgYExWaWV3YC4gVGhpcyBtZWFucyB0aGF0IG5vIGBMVmlld2Agd2lsbCBoYXZlIGJlZW4gZW50ZXJlZCB3aGVuIHRoaXMgZmFjdG9yeSBpc1xuICAgIC8vIGludm9rZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAgICAvLyAzLiBIYXZlIHRoZSB0b2tlbiBmYWN0b3J5IHJldHVybiBgKCkgPT4gc3RyaW5nYCB3aGljaCBpcyBpbnZva2VkIHdoZW4gYSBub25jZSBpcyByZXF1ZXN0ZWQgLVxuICAgIC8vIHRoZSBzbGlnaHRseSBsYXRlciBleGVjdXRpb24gZG9lcyBhbGxvdyB1cyB0byBnZXQgYW4gYExWaWV3YCByZWZlcmVuY2UsIGJ1dCB0aGUgZmFjdCB0aGF0XG4gICAgLy8gaXQgaXMgYSBmdW5jdGlvbiBtZWFucyB0aGF0IGl0IGNvdWxkIGJlIGV4ZWN1dGVkIGF0ICphbnkqIHRpbWUgKGluY2x1ZGluZyBpbW1lZGlhdGVseSkgd2hpY2hcbiAgICAvLyBtYXkgbGVhZCB0byB3ZWlyZCBidWdzLlxuICAgIC8vIDQuIEhhdmUgdGhlIGBDb21wb25lbnRGYWN0b3J5YCByZWFkIHRoZSBhdHRyaWJ1dGUgYW5kIHByb3ZpZGUgaXQgdG8gdGhlIGluamVjdG9yIHVuZGVyIHRoZVxuICAgIC8vIGhvb2QgLSBoYXMgdGhlIHNhbWUgcHJvYmxlbSBhcyAjMSBhbmQgIzIgaW4gdGhhdCB0aGUgcmVuZGVyZXIgaXMgdXNlZCB0byBxdWVyeSBmb3IgdGhlIHJvb3RcbiAgICAvLyBub2RlIGFuZCB0aGUgbm9uY2UgdmFsdWUgbmVlZHMgdG8gYmUgYXZhaWxhYmxlIHdoZW4gdGhlIHJlbmRlcmVyIGlzIGNyZWF0ZWQuXG4gICAgcmV0dXJuIGdldERvY3VtZW50KCkuYm9keT8ucXVlcnlTZWxlY3RvcignW25nQ3NwTm9uY2VdJyk/LmdldEF0dHJpYnV0ZSgnbmdDc3BOb25jZScpIHx8IG51bGw7XG4gIH0sXG59KTtcblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB0byBjb2xsZWN0IGFsbCBTU1ItcmVsYXRlZCBmZWF0dXJlcyBlbmFibGVkIGZvciB0aGlzIGFwcGxpY2F0aW9uLlxuICpcbiAqIE5vdGU6IHRoZSB0b2tlbiBpcyBpbiBgY29yZWAgdG8gbGV0IG90aGVyIHBhY2thZ2VzIHJlZ2lzdGVyIGZlYXR1cmVzICh0aGUgYGNvcmVgXG4gKiBwYWNrYWdlIGlzIGltcG9ydGVkIGluIG90aGVyIHBhY2thZ2VzKS5cbiAqL1xuZXhwb3J0IGNvbnN0IEVOQUJMRURfU1NSX0ZFQVRVUkVTID0gbmV3IEluamVjdGlvblRva2VuPFNldDxzdHJpbmc+PihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdFTkFCTEVEX1NTUl9GRUFUVVJFUycgOiAnJywge1xuICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNldCgpLFxuICAgIH0pO1xuIl19