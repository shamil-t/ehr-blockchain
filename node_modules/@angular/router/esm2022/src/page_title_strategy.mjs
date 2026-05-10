/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PRIMARY_OUTLET, RouteTitleKey } from './shared';
import * as i0 from "@angular/core";
import * as i1 from "@angular/platform-browser";
/**
 * Provides a strategy for setting the page title after a router navigation.
 *
 * The built-in implementation traverses the router state snapshot and finds the deepest primary
 * outlet with `title` property. Given the `Routes` below, navigating to
 * `/base/child(popup:aux)` would result in the document title being set to "child".
 * ```
 * [
 *   {path: 'base', title: 'base', children: [
 *     {path: 'child', title: 'child'},
 *   ],
 *   {path: 'aux', outlet: 'popup', title: 'popupTitle'}
 * ]
 * ```
 *
 * This class can be used as a base class for custom title strategies. That is, you can create your
 * own class that extends the `TitleStrategy`. Note that in the above example, the `title`
 * from the named outlet is never used. However, a custom strategy might be implemented to
 * incorporate titles in named outlets.
 *
 * @publicApi
 * @see [Page title guide](guide/router#setting-the-page-title)
 */
export class TitleStrategy {
    /**
     * @returns The `title` of the deepest primary route.
     */
    buildTitle(snapshot) {
        let pageTitle;
        let route = snapshot.root;
        while (route !== undefined) {
            pageTitle = this.getResolvedTitleForRoute(route) ?? pageTitle;
            route = route.children.find(child => child.outlet === PRIMARY_OUTLET);
        }
        return pageTitle;
    }
    /**
     * Given an `ActivatedRouteSnapshot`, returns the final value of the
     * `Route.title` property, which can either be a static string or a resolved value.
     */
    getResolvedTitleForRoute(snapshot) {
        return snapshot.data[RouteTitleKey];
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: TitleStrategy, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: TitleStrategy, providedIn: 'root', useFactory: () => inject(DefaultTitleStrategy) }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: TitleStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root', useFactory: () => inject(DefaultTitleStrategy) }]
        }] });
/**
 * The default `TitleStrategy` used by the router that updates the title using the `Title` service.
 */
export class DefaultTitleStrategy extends TitleStrategy {
    constructor(title) {
        super();
        this.title = title;
    }
    /**
     * Sets the title of the browser to the given value.
     *
     * @param title The `pageTitle` from the deepest primary route.
     */
    updateTitle(snapshot) {
        const title = this.buildTitle(snapshot);
        if (title !== undefined) {
            this.title.setTitle(title);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultTitleStrategy, deps: [{ token: i1.Title }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultTitleStrategy, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: DefaultTitleStrategy, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Title }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZV90aXRsZV9zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvcGFnZV90aXRsZV9zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFHaEQsT0FBTyxFQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7OztBQUV2RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE1BQU0sT0FBZ0IsYUFBYTtJQUlqQzs7T0FFRztJQUNILFVBQVUsQ0FBQyxRQUE2QjtRQUN0QyxJQUFJLFNBQTJCLENBQUM7UUFDaEMsSUFBSSxLQUFLLEdBQXFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDNUQsT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQzFCLFNBQVMsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDO1lBQzlELEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssY0FBYyxDQUFDLENBQUM7U0FDdkU7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsd0JBQXdCLENBQUMsUUFBZ0M7UUFDdkQsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7eUhBdkJtQixhQUFhOzZIQUFiLGFBQWEsY0FEVixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDOztzR0FDekQsYUFBYTtrQkFEbEMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFDOztBQTJCaEY7O0dBRUc7QUFFSCxNQUFNLE9BQU8sb0JBQXFCLFNBQVEsYUFBYTtJQUNyRCxZQUFxQixLQUFZO1FBQy9CLEtBQUssRUFBRSxDQUFDO1FBRFcsVUFBSyxHQUFMLEtBQUssQ0FBTztJQUVqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNNLFdBQVcsQ0FBQyxRQUE2QjtRQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7eUhBZlUsb0JBQW9COzZIQUFwQixvQkFBb0IsY0FEUixNQUFNOztzR0FDbEIsb0JBQW9CO2tCQURoQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1RpdGxlfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcblxuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBSb3V0ZXJTdGF0ZVNuYXBzaG90fSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge1BSSU1BUllfT1VUTEVULCBSb3V0ZVRpdGxlS2V5fSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogUHJvdmlkZXMgYSBzdHJhdGVneSBmb3Igc2V0dGluZyB0aGUgcGFnZSB0aXRsZSBhZnRlciBhIHJvdXRlciBuYXZpZ2F0aW9uLlxuICpcbiAqIFRoZSBidWlsdC1pbiBpbXBsZW1lbnRhdGlvbiB0cmF2ZXJzZXMgdGhlIHJvdXRlciBzdGF0ZSBzbmFwc2hvdCBhbmQgZmluZHMgdGhlIGRlZXBlc3QgcHJpbWFyeVxuICogb3V0bGV0IHdpdGggYHRpdGxlYCBwcm9wZXJ0eS4gR2l2ZW4gdGhlIGBSb3V0ZXNgIGJlbG93LCBuYXZpZ2F0aW5nIHRvXG4gKiBgL2Jhc2UvY2hpbGQocG9wdXA6YXV4KWAgd291bGQgcmVzdWx0IGluIHRoZSBkb2N1bWVudCB0aXRsZSBiZWluZyBzZXQgdG8gXCJjaGlsZFwiLlxuICogYGBgXG4gKiBbXG4gKiAgIHtwYXRoOiAnYmFzZScsIHRpdGxlOiAnYmFzZScsIGNoaWxkcmVuOiBbXG4gKiAgICAge3BhdGg6ICdjaGlsZCcsIHRpdGxlOiAnY2hpbGQnfSxcbiAqICAgXSxcbiAqICAge3BhdGg6ICdhdXgnLCBvdXRsZXQ6ICdwb3B1cCcsIHRpdGxlOiAncG9wdXBUaXRsZSd9XG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBUaGlzIGNsYXNzIGNhbiBiZSB1c2VkIGFzIGEgYmFzZSBjbGFzcyBmb3IgY3VzdG9tIHRpdGxlIHN0cmF0ZWdpZXMuIFRoYXQgaXMsIHlvdSBjYW4gY3JlYXRlIHlvdXJcbiAqIG93biBjbGFzcyB0aGF0IGV4dGVuZHMgdGhlIGBUaXRsZVN0cmF0ZWd5YC4gTm90ZSB0aGF0IGluIHRoZSBhYm92ZSBleGFtcGxlLCB0aGUgYHRpdGxlYFxuICogZnJvbSB0aGUgbmFtZWQgb3V0bGV0IGlzIG5ldmVyIHVzZWQuIEhvd2V2ZXIsIGEgY3VzdG9tIHN0cmF0ZWd5IG1pZ2h0IGJlIGltcGxlbWVudGVkIHRvXG4gKiBpbmNvcnBvcmF0ZSB0aXRsZXMgaW4gbmFtZWQgb3V0bGV0cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAc2VlIFtQYWdlIHRpdGxlIGd1aWRlXShndWlkZS9yb3V0ZXIjc2V0dGluZy10aGUtcGFnZS10aXRsZSlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290JywgdXNlRmFjdG9yeTogKCkgPT4gaW5qZWN0KERlZmF1bHRUaXRsZVN0cmF0ZWd5KX0pXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVGl0bGVTdHJhdGVneSB7XG4gIC8qKiBQZXJmb3JtcyB0aGUgYXBwbGljYXRpb24gdGl0bGUgdXBkYXRlLiAqL1xuICBhYnN0cmFjdCB1cGRhdGVUaXRsZShzbmFwc2hvdDogUm91dGVyU3RhdGVTbmFwc2hvdCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBgdGl0bGVgIG9mIHRoZSBkZWVwZXN0IHByaW1hcnkgcm91dGUuXG4gICAqL1xuICBidWlsZFRpdGxlKHNuYXBzaG90OiBSb3V0ZXJTdGF0ZVNuYXBzaG90KTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgbGV0IHBhZ2VUaXRsZTogc3RyaW5nfHVuZGVmaW5lZDtcbiAgICBsZXQgcm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3R8dW5kZWZpbmVkID0gc25hcHNob3Qucm9vdDtcbiAgICB3aGlsZSAocm91dGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFnZVRpdGxlID0gdGhpcy5nZXRSZXNvbHZlZFRpdGxlRm9yUm91dGUocm91dGUpID8/IHBhZ2VUaXRsZTtcbiAgICAgIHJvdXRlID0gcm91dGUuY2hpbGRyZW4uZmluZChjaGlsZCA9PiBjaGlsZC5vdXRsZXQgPT09IFBSSU1BUllfT1VUTEVUKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhbiBgQWN0aXZhdGVkUm91dGVTbmFwc2hvdGAsIHJldHVybnMgdGhlIGZpbmFsIHZhbHVlIG9mIHRoZVxuICAgKiBgUm91dGUudGl0bGVgIHByb3BlcnR5LCB3aGljaCBjYW4gZWl0aGVyIGJlIGEgc3RhdGljIHN0cmluZyBvciBhIHJlc29sdmVkIHZhbHVlLlxuICAgKi9cbiAgZ2V0UmVzb2x2ZWRUaXRsZUZvclJvdXRlKHNuYXBzaG90OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KSB7XG4gICAgcmV0dXJuIHNuYXBzaG90LmRhdGFbUm91dGVUaXRsZUtleV07XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBgVGl0bGVTdHJhdGVneWAgdXNlZCBieSB0aGUgcm91dGVyIHRoYXQgdXBkYXRlcyB0aGUgdGl0bGUgdXNpbmcgdGhlIGBUaXRsZWAgc2VydmljZS5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRGVmYXVsdFRpdGxlU3RyYXRlZ3kgZXh0ZW5kcyBUaXRsZVN0cmF0ZWd5IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgdGl0bGU6IFRpdGxlKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0aXRsZSBvZiB0aGUgYnJvd3NlciB0byB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqXG4gICAqIEBwYXJhbSB0aXRsZSBUaGUgYHBhZ2VUaXRsZWAgZnJvbSB0aGUgZGVlcGVzdCBwcmltYXJ5IHJvdXRlLlxuICAgKi9cbiAgb3ZlcnJpZGUgdXBkYXRlVGl0bGUoc25hcHNob3Q6IFJvdXRlclN0YXRlU25hcHNob3QpOiB2b2lkIHtcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMuYnVpbGRUaXRsZShzbmFwc2hvdCk7XG4gICAgaWYgKHRpdGxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMudGl0bGUuc2V0VGl0bGUodGl0bGUpO1xuICAgIH1cbiAgfVxufVxuIl19