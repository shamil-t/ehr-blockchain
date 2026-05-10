/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable, InjectionToken } from '@angular/core';
import { getDOM } from '../dom_adapter';
import { DOCUMENT } from '../dom_tokens';
import * as i0 from "@angular/core";
/**
 * This class should not be used directly by an application developer. Instead, use
 * {@link Location}.
 *
 * `PlatformLocation` encapsulates all calls to DOM APIs, which allows the Router to be
 * platform-agnostic.
 * This means that we can have different implementation of `PlatformLocation` for the different
 * platforms that Angular supports. For example, `@angular/platform-browser` provides an
 * implementation specific to the browser environment, while `@angular/platform-server` provides
 * one suitable for use with server-side rendering.
 *
 * The `PlatformLocation` class is used directly by all implementations of {@link LocationStrategy}
 * when they need to interact with the DOM APIs like pushState, popState, etc.
 *
 * {@link LocationStrategy} in turn is used by the {@link Location} service which is used directly
 * by the {@link Router} in order to navigate between routes. Since all interactions between {@link
 * Router} /
 * {@link Location} / {@link LocationStrategy} and DOM APIs flow through the `PlatformLocation`
 * class, they are all platform-agnostic.
 *
 * @publicApi
 */
export class PlatformLocation {
    historyGo(relativePosition) {
        throw new Error('Not implemented');
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: PlatformLocation, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: PlatformLocation, providedIn: 'platform', useFactory: () => inject(BrowserPlatformLocation) }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: PlatformLocation, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'platform', useFactory: () => inject(BrowserPlatformLocation) }]
        }] });
/**
 * @description
 * Indicates when a location is initialized.
 *
 * @publicApi
 */
export const LOCATION_INITIALIZED = new InjectionToken('Location Initialized');
/**
 * `PlatformLocation` encapsulates all of the direct calls to platform APIs.
 * This class should not be used directly by an application developer. Instead, use
 * {@link Location}.
 *
 * @publicApi
 */
export class BrowserPlatformLocation extends PlatformLocation {
    constructor() {
        super();
        this._doc = inject(DOCUMENT);
        this._location = window.location;
        this._history = window.history;
    }
    getBaseHrefFromDOM() {
        return getDOM().getBaseHref(this._doc);
    }
    onPopState(fn) {
        const window = getDOM().getGlobalEventTarget(this._doc, 'window');
        window.addEventListener('popstate', fn, false);
        return () => window.removeEventListener('popstate', fn);
    }
    onHashChange(fn) {
        const window = getDOM().getGlobalEventTarget(this._doc, 'window');
        window.addEventListener('hashchange', fn, false);
        return () => window.removeEventListener('hashchange', fn);
    }
    get href() {
        return this._location.href;
    }
    get protocol() {
        return this._location.protocol;
    }
    get hostname() {
        return this._location.hostname;
    }
    get port() {
        return this._location.port;
    }
    get pathname() {
        return this._location.pathname;
    }
    get search() {
        return this._location.search;
    }
    get hash() {
        return this._location.hash;
    }
    set pathname(newPath) {
        this._location.pathname = newPath;
    }
    pushState(state, title, url) {
        this._history.pushState(state, title, url);
    }
    replaceState(state, title, url) {
        this._history.replaceState(state, title, url);
    }
    forward() {
        this._history.forward();
    }
    back() {
        this._history.back();
    }
    historyGo(relativePosition = 0) {
        this._history.go(relativePosition);
    }
    getState() {
        return this._history.state;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: BrowserPlatformLocation, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: BrowserPlatformLocation, providedIn: 'platform', useFactory: () => new BrowserPlatformLocation() }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: BrowserPlatformLocation, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'platform',
                    useFactory: () => new BrowserPlatformLocation(),
                }]
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm1fbG9jYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2xvY2F0aW9uL3BsYXRmb3JtX2xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVqRSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFFdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUVILE1BQU0sT0FBZ0IsZ0JBQWdCO0lBNEJwQyxTQUFTLENBQUUsZ0JBQXdCO1FBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNyQyxDQUFDO3lIQTlCbUIsZ0JBQWdCOzZIQUFoQixnQkFBZ0IsY0FEYixVQUFVLGNBQWMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDOztzR0FDaEUsZ0JBQWdCO2tCQURyQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLEVBQUM7O0FBa0N2Rjs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLElBQUksY0FBYyxDQUFlLHNCQUFzQixDQUFDLENBQUM7QUFzQjdGOzs7Ozs7R0FNRztBQUtILE1BQU0sT0FBTyx1QkFBd0IsU0FBUSxnQkFBZ0I7SUFLM0Q7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUhGLFNBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFJOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2pD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QyxVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxVQUFVO29CQUN0QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsNkJBQTZCO2lCQUNoRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge2dldERPTX0gZnJvbSAnLi4vZG9tX2FkYXB0ZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnLi4vZG9tX3Rva2Vucyc7XG5cbi8qKlxuICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHkgYnkgYW4gYXBwbGljYXRpb24gZGV2ZWxvcGVyLiBJbnN0ZWFkLCB1c2VcbiAqIHtAbGluayBMb2NhdGlvbn0uXG4gKlxuICogYFBsYXRmb3JtTG9jYXRpb25gIGVuY2Fwc3VsYXRlcyBhbGwgY2FsbHMgdG8gRE9NIEFQSXMsIHdoaWNoIGFsbG93cyB0aGUgUm91dGVyIHRvIGJlXG4gKiBwbGF0Zm9ybS1hZ25vc3RpYy5cbiAqIFRoaXMgbWVhbnMgdGhhdCB3ZSBjYW4gaGF2ZSBkaWZmZXJlbnQgaW1wbGVtZW50YXRpb24gb2YgYFBsYXRmb3JtTG9jYXRpb25gIGZvciB0aGUgZGlmZmVyZW50XG4gKiBwbGF0Zm9ybXMgdGhhdCBBbmd1bGFyIHN1cHBvcnRzLiBGb3IgZXhhbXBsZSwgYEBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJgIHByb3ZpZGVzIGFuXG4gKiBpbXBsZW1lbnRhdGlvbiBzcGVjaWZpYyB0byB0aGUgYnJvd3NlciBlbnZpcm9ubWVudCwgd2hpbGUgYEBhbmd1bGFyL3BsYXRmb3JtLXNlcnZlcmAgcHJvdmlkZXNcbiAqIG9uZSBzdWl0YWJsZSBmb3IgdXNlIHdpdGggc2VydmVyLXNpZGUgcmVuZGVyaW5nLlxuICpcbiAqIFRoZSBgUGxhdGZvcm1Mb2NhdGlvbmAgY2xhc3MgaXMgdXNlZCBkaXJlY3RseSBieSBhbGwgaW1wbGVtZW50YXRpb25zIG9mIHtAbGluayBMb2NhdGlvblN0cmF0ZWd5fVxuICogd2hlbiB0aGV5IG5lZWQgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgRE9NIEFQSXMgbGlrZSBwdXNoU3RhdGUsIHBvcFN0YXRlLCBldGMuXG4gKlxuICoge0BsaW5rIExvY2F0aW9uU3RyYXRlZ3l9IGluIHR1cm4gaXMgdXNlZCBieSB0aGUge0BsaW5rIExvY2F0aW9ufSBzZXJ2aWNlIHdoaWNoIGlzIHVzZWQgZGlyZWN0bHlcbiAqIGJ5IHRoZSB7QGxpbmsgUm91dGVyfSBpbiBvcmRlciB0byBuYXZpZ2F0ZSBiZXR3ZWVuIHJvdXRlcy4gU2luY2UgYWxsIGludGVyYWN0aW9ucyBiZXR3ZWVuIHtAbGlua1xuICogUm91dGVyfSAvXG4gKiB7QGxpbmsgTG9jYXRpb259IC8ge0BsaW5rIExvY2F0aW9uU3RyYXRlZ3l9IGFuZCBET00gQVBJcyBmbG93IHRocm91Z2ggdGhlIGBQbGF0Zm9ybUxvY2F0aW9uYFxuICogY2xhc3MsIHRoZXkgYXJlIGFsbCBwbGF0Zm9ybS1hZ25vc3RpYy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncGxhdGZvcm0nLCB1c2VGYWN0b3J5OiAoKSA9PiBpbmplY3QoQnJvd3NlclBsYXRmb3JtTG9jYXRpb24pfSlcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQbGF0Zm9ybUxvY2F0aW9uIHtcbiAgYWJzdHJhY3QgZ2V0QmFzZUhyZWZGcm9tRE9NKCk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0U3RhdGUoKTogdW5rbm93bjtcbiAgLyoqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGV4ZWN1dGVkLCByZW1vdmVzIHRoZSBgcG9wc3RhdGVgIGV2ZW50IGhhbmRsZXIuXG4gICAqL1xuICBhYnN0cmFjdCBvblBvcFN0YXRlKGZuOiBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKTogVm9pZEZ1bmN0aW9uO1xuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gZXhlY3V0ZWQsIHJlbW92ZXMgdGhlIGBoYXNoY2hhbmdlYCBldmVudCBoYW5kbGVyLlxuICAgKi9cbiAgYWJzdHJhY3Qgb25IYXNoQ2hhbmdlKGZuOiBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKTogVm9pZEZ1bmN0aW9uO1xuXG4gIGFic3RyYWN0IGdldCBocmVmKCk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0IHByb3RvY29sKCk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0IGhvc3RuYW1lKCk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0IHBvcnQoKTogc3RyaW5nO1xuICBhYnN0cmFjdCBnZXQgcGF0aG5hbWUoKTogc3RyaW5nO1xuICBhYnN0cmFjdCBnZXQgc2VhcmNoKCk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0IGhhc2goKTogc3RyaW5nO1xuXG4gIGFic3RyYWN0IHJlcGxhY2VTdGF0ZShzdGF0ZTogYW55LCB0aXRsZTogc3RyaW5nLCB1cmw6IHN0cmluZyk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgcHVzaFN0YXRlKHN0YXRlOiBhbnksIHRpdGxlOiBzdHJpbmcsIHVybDogc3RyaW5nKTogdm9pZDtcblxuICBhYnN0cmFjdCBmb3J3YXJkKCk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgYmFjaygpOiB2b2lkO1xuXG4gIGhpc3RvcnlHbz8ocmVsYXRpdmVQb3NpdGlvbjogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogSW5kaWNhdGVzIHdoZW4gYSBsb2NhdGlvbiBpcyBpbml0aWFsaXplZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBMT0NBVElPTl9JTklUSUFMSVpFRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxQcm9taXNlPGFueT4+KCdMb2NhdGlvbiBJbml0aWFsaXplZCcpO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQSBzZXJpYWxpemFibGUgdmVyc2lvbiBvZiB0aGUgZXZlbnQgZnJvbSBgb25Qb3BTdGF0ZWAgb3IgYG9uSGFzaENoYW5nZWBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9jYXRpb25DaGFuZ2VFdmVudCB7XG4gIHR5cGU6IHN0cmluZztcbiAgc3RhdGU6IGFueTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9jYXRpb25DaGFuZ2VMaXN0ZW5lciB7XG4gIChldmVudDogTG9jYXRpb25DaGFuZ2VFdmVudCk6IGFueTtcbn1cblxuXG5cbi8qKlxuICogYFBsYXRmb3JtTG9jYXRpb25gIGVuY2Fwc3VsYXRlcyBhbGwgb2YgdGhlIGRpcmVjdCBjYWxscyB0byBwbGF0Zm9ybSBBUElzLlxuICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHkgYnkgYW4gYXBwbGljYXRpb24gZGV2ZWxvcGVyLiBJbnN0ZWFkLCB1c2VcbiAqIHtAbGluayBMb2NhdGlvbn0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdwbGF0Zm9ybScsXG4gIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBCcm93c2VyUGxhdGZvcm1Mb2NhdGlvbigpLFxufSlcbmV4cG9ydCBjbGFzcyBCcm93c2VyUGxhdGZvcm1Mb2NhdGlvbiBleHRlbmRzIFBsYXRmb3JtTG9jYXRpb24ge1xuICBwcml2YXRlIF9sb2NhdGlvbjogTG9jYXRpb247XG4gIHByaXZhdGUgX2hpc3Rvcnk6IEhpc3Rvcnk7XG4gIHByaXZhdGUgX2RvYyA9IGluamVjdChET0NVTUVOVCk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICB0aGlzLl9oaXN0b3J5ID0gd2luZG93Lmhpc3Rvcnk7XG4gIH1cblxuICBvdmVycmlkZSBnZXRCYXNlSHJlZkZyb21ET00oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gZ2V0RE9NKCkuZ2V0QmFzZUhyZWYodGhpcy5fZG9jKSE7XG4gIH1cblxuICBvdmVycmlkZSBvblBvcFN0YXRlKGZuOiBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBjb25zdCB3aW5kb3cgPSBnZXRET00oKS5nZXRHbG9iYWxFdmVudFRhcmdldCh0aGlzLl9kb2MsICd3aW5kb3cnKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBmbiwgZmFsc2UpO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBmbik7XG4gIH1cblxuICBvdmVycmlkZSBvbkhhc2hDaGFuZ2UoZm46IExvY2F0aW9uQ2hhbmdlTGlzdGVuZXIpOiBWb2lkRnVuY3Rpb24ge1xuICAgIGNvbnN0IHdpbmRvdyA9IGdldERPTSgpLmdldEdsb2JhbEV2ZW50VGFyZ2V0KHRoaXMuX2RvYywgJ3dpbmRvdycpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgZm4sIGZhbHNlKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBmbik7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaHJlZigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9sb2NhdGlvbi5ocmVmO1xuICB9XG4gIG92ZXJyaWRlIGdldCBwcm90b2NvbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9sb2NhdGlvbi5wcm90b2NvbDtcbiAgfVxuICBvdmVycmlkZSBnZXQgaG9zdG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYXRpb24uaG9zdG5hbWU7XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0IHBvcnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYXRpb24ucG9ydDtcbiAgfVxuICBvdmVycmlkZSBnZXQgcGF0aG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYXRpb24ucGF0aG5hbWU7XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0IHNlYXJjaCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9sb2NhdGlvbi5zZWFyY2g7XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0IGhhc2goKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYXRpb24uaGFzaDtcbiAgfVxuICBvdmVycmlkZSBzZXQgcGF0aG5hbWUobmV3UGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5fbG9jYXRpb24ucGF0aG5hbWUgPSBuZXdQYXRoO1xuICB9XG5cbiAgb3ZlcnJpZGUgcHVzaFN0YXRlKHN0YXRlOiBhbnksIHRpdGxlOiBzdHJpbmcsIHVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5faGlzdG9yeS5wdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVwbGFjZVN0YXRlKHN0YXRlOiBhbnksIHRpdGxlOiBzdHJpbmcsIHVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5faGlzdG9yeS5yZXBsYWNlU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZm9yd2FyZCgpOiB2b2lkIHtcbiAgICB0aGlzLl9oaXN0b3J5LmZvcndhcmQoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGJhY2soKTogdm9pZCB7XG4gICAgdGhpcy5faGlzdG9yeS5iYWNrKCk7XG4gIH1cblxuICBvdmVycmlkZSBoaXN0b3J5R28ocmVsYXRpdmVQb3NpdGlvbjogbnVtYmVyID0gMCk6IHZvaWQge1xuICAgIHRoaXMuX2hpc3RvcnkuZ28ocmVsYXRpdmVQb3NpdGlvbik7XG4gIH1cblxuICBvdmVycmlkZSBnZXRTdGF0ZSgpOiB1bmtub3duIHtcbiAgICByZXR1cm4gdGhpcy5faGlzdG9yeS5zdGF0ZTtcbiAgfVxufVxuIl19