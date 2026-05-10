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
 * Provides a way to migrate AngularJS applications to Angular.
 *
 * @publicApi
 */
export class UrlHandlingStrategy {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: UrlHandlingStrategy, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: UrlHandlingStrategy, providedIn: 'root', useFactory: () => inject(DefaultUrlHandlingStrategy) }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: UrlHandlingStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root', useFactory: () => inject(DefaultUrlHandlingStrategy) }]
        }] });
/**
 * @publicApi
 */
export class DefaultUrlHandlingStrategy {
    shouldProcessUrl(url) {
        return true;
    }
    extract(url) {
        return url;
    }
    merge(newUrlPart, wholeUrl) {
        return newUrlPart;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultUrlHandlingStrategy, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultUrlHandlingStrategy, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultUrlHandlingStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsX2hhbmRsaW5nX3N0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy91cmxfaGFuZGxpbmdfc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBSWpEOzs7Ozs7R0FNRztBQUVILE1BQU0sT0FBZ0IsbUJBQW1CO3lIQUFuQixtQkFBbUI7NkhBQW5CLG1CQUFtQixjQURoQixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLDBCQUEwQixDQUFDOztzR0FDL0QsbUJBQW1CO2tCQUR4QyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLDBCQUEwQixDQUFDLEVBQUM7O0FBd0J0Rjs7R0FFRztBQUVILE1BQU0sT0FBTywwQkFBMEI7SUFDckMsZ0JBQWdCLENBQUMsR0FBWTtRQUMzQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLENBQUMsR0FBWTtRQUNsQixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFDRCxLQUFLLENBQUMsVUFBbUIsRUFBRSxRQUFpQjtRQUMxQyxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO3lIQVRVLDBCQUEwQjs2SEFBMUIsMEJBQTBCLGNBRGQsTUFBTTs7c0dBQ2xCLDBCQUEwQjtrQkFEdEMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1VybFRyZWV9IGZyb20gJy4vdXJsX3RyZWUnO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFByb3ZpZGVzIGEgd2F5IHRvIG1pZ3JhdGUgQW5ndWxhckpTIGFwcGxpY2F0aW9ucyB0byBBbmd1bGFyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290JywgdXNlRmFjdG9yeTogKCkgPT4gaW5qZWN0KERlZmF1bHRVcmxIYW5kbGluZ1N0cmF0ZWd5KX0pXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVXJsSGFuZGxpbmdTdHJhdGVneSB7XG4gIC8qKlxuICAgKiBUZWxscyB0aGUgcm91dGVyIGlmIHRoaXMgVVJMIHNob3VsZCBiZSBwcm9jZXNzZWQuXG4gICAqXG4gICAqIFdoZW4gaXQgcmV0dXJucyB0cnVlLCB0aGUgcm91dGVyIHdpbGwgZXhlY3V0ZSB0aGUgcmVndWxhciBuYXZpZ2F0aW9uLlxuICAgKiBXaGVuIGl0IHJldHVybnMgZmFsc2UsIHRoZSByb3V0ZXIgd2lsbCBzZXQgdGhlIHJvdXRlciBzdGF0ZSB0byBhbiBlbXB0eSBzdGF0ZS5cbiAgICogQXMgYSByZXN1bHQsIGFsbCB0aGUgYWN0aXZlIGNvbXBvbmVudHMgd2lsbCBiZSBkZXN0cm95ZWQuXG4gICAqXG4gICAqL1xuICBhYnN0cmFjdCBzaG91bGRQcm9jZXNzVXJsKHVybDogVXJsVHJlZSk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSBwYXJ0IG9mIHRoZSBVUkwgdGhhdCBzaG91bGQgYmUgaGFuZGxlZCBieSB0aGUgcm91dGVyLlxuICAgKiBUaGUgcmVzdCBvZiB0aGUgVVJMIHdpbGwgcmVtYWluIHVudG91Y2hlZC5cbiAgICovXG4gIGFic3RyYWN0IGV4dHJhY3QodXJsOiBVcmxUcmVlKTogVXJsVHJlZTtcblxuICAvKipcbiAgICogTWVyZ2VzIHRoZSBVUkwgZnJhZ21lbnQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgVVJMLlxuICAgKi9cbiAgYWJzdHJhY3QgbWVyZ2UobmV3VXJsUGFydDogVXJsVHJlZSwgcmF3VXJsOiBVcmxUcmVlKTogVXJsVHJlZTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERlZmF1bHRVcmxIYW5kbGluZ1N0cmF0ZWd5IGltcGxlbWVudHMgVXJsSGFuZGxpbmdTdHJhdGVneSB7XG4gIHNob3VsZFByb2Nlc3NVcmwodXJsOiBVcmxUcmVlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgZXh0cmFjdCh1cmw6IFVybFRyZWUpOiBVcmxUcmVlIHtcbiAgICByZXR1cm4gdXJsO1xuICB9XG4gIG1lcmdlKG5ld1VybFBhcnQ6IFVybFRyZWUsIHdob2xlVXJsOiBVcmxUcmVlKTogVXJsVHJlZSB7XG4gICAgcmV0dXJuIG5ld1VybFBhcnQ7XG4gIH1cbn1cbiJdfQ==