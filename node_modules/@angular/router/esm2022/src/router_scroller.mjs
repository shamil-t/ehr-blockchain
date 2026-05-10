/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewportScroller } from '@angular/common';
import { Injectable, InjectionToken, NgZone } from '@angular/core';
import { NavigationEnd, NavigationSkipped, NavigationStart, Scroll } from './events';
import { NavigationTransitions } from './navigation_transition';
import { UrlSerializer } from './url_tree';
import * as i0 from "@angular/core";
import * as i1 from "./url_tree";
import * as i2 from "./navigation_transition";
import * as i3 from "@angular/common";
export const ROUTER_SCROLLER = new InjectionToken('');
export class RouterScroller {
    /** @nodoc */
    constructor(urlSerializer, transitions, viewportScroller, zone, options = {}) {
        this.urlSerializer = urlSerializer;
        this.transitions = transitions;
        this.viewportScroller = viewportScroller;
        this.zone = zone;
        this.options = options;
        this.lastId = 0;
        this.lastSource = 'imperative';
        this.restoredId = 0;
        this.store = {};
        // Default both options to 'disabled'
        options.scrollPositionRestoration = options.scrollPositionRestoration || 'disabled';
        options.anchorScrolling = options.anchorScrolling || 'disabled';
    }
    init() {
        // we want to disable the automatic scrolling because having two places
        // responsible for scrolling results race conditions, especially given
        // that browser don't implement this behavior consistently
        if (this.options.scrollPositionRestoration !== 'disabled') {
            this.viewportScroller.setHistoryScrollRestoration('manual');
        }
        this.routerEventsSubscription = this.createScrollEvents();
        this.scrollEventsSubscription = this.consumeScrollEvents();
    }
    createScrollEvents() {
        return this.transitions.events.subscribe(e => {
            if (e instanceof NavigationStart) {
                // store the scroll position of the current stable navigations.
                this.store[this.lastId] = this.viewportScroller.getScrollPosition();
                this.lastSource = e.navigationTrigger;
                this.restoredId = e.restoredState ? e.restoredState.navigationId : 0;
            }
            else if (e instanceof NavigationEnd) {
                this.lastId = e.id;
                this.scheduleScrollEvent(e, this.urlSerializer.parse(e.urlAfterRedirects).fragment);
            }
            else if (e instanceof NavigationSkipped &&
                e.code === 0 /* NavigationSkippedCode.IgnoredSameUrlNavigation */) {
                this.lastSource = undefined;
                this.restoredId = 0;
                this.scheduleScrollEvent(e, this.urlSerializer.parse(e.url).fragment);
            }
        });
    }
    consumeScrollEvents() {
        return this.transitions.events.subscribe(e => {
            if (!(e instanceof Scroll))
                return;
            // a popstate event. The pop state event will always ignore anchor scrolling.
            if (e.position) {
                if (this.options.scrollPositionRestoration === 'top') {
                    this.viewportScroller.scrollToPosition([0, 0]);
                }
                else if (this.options.scrollPositionRestoration === 'enabled') {
                    this.viewportScroller.scrollToPosition(e.position);
                }
                // imperative navigation "forward"
            }
            else {
                if (e.anchor && this.options.anchorScrolling === 'enabled') {
                    this.viewportScroller.scrollToAnchor(e.anchor);
                }
                else if (this.options.scrollPositionRestoration !== 'disabled') {
                    this.viewportScroller.scrollToPosition([0, 0]);
                }
            }
        });
    }
    scheduleScrollEvent(routerEvent, anchor) {
        this.zone.runOutsideAngular(() => {
            // The scroll event needs to be delayed until after change detection. Otherwise, we may
            // attempt to restore the scroll position before the router outlet has fully rendered the
            // component by executing its update block of the template function.
            setTimeout(() => {
                this.zone.run(() => {
                    this.transitions.events.next(new Scroll(routerEvent, this.lastSource === 'popstate' ? this.store[this.restoredId] : null, anchor));
                });
            }, 0);
        });
    }
    /** @nodoc */
    ngOnDestroy() {
        this.routerEventsSubscription?.unsubscribe();
        this.scrollEventsSubscription?.unsubscribe();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterScroller, deps: "invalid", target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterScroller }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterScroller, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.UrlSerializer }, { type: i2.NavigationTransitions }, { type: i3.ViewportScroller }, { type: i0.NgZone }, { type: undefined }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX3Njcm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9yb3V0ZXJfc2Nyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDakQsT0FBTyxFQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBRzVFLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQXlCLGVBQWUsRUFBRSxNQUFNLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUcsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQzs7Ozs7QUFFekMsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFpQixFQUFFLENBQUMsQ0FBQztBQUd0RSxNQUFNLE9BQU8sY0FBYztJQVN6QixhQUFhO0lBQ2IsWUFDYSxhQUE0QixFQUFVLFdBQWtDLEVBQ2pFLGdCQUFrQyxFQUFtQixJQUFZLEVBQ3pFLFVBR0osRUFBRTtRQUxHLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQXVCO1FBQ2pFLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFBbUIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUN6RSxZQUFPLEdBQVAsT0FBTyxDQUdUO1FBWkYsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUNYLGVBQVUsR0FBbUQsWUFBWSxDQUFDO1FBQzFFLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFDZixVQUFLLEdBQXNDLEVBQUUsQ0FBQztRQVVwRCxxQ0FBcUM7UUFDckMsT0FBTyxDQUFDLHlCQUF5QixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsSUFBSSxV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LENBQUM7aUJBQ2hEO3FCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsS0FBSyxVQUFVLEVBQUU7b0JBQ2hFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNoRDthQUNGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sbUJBQW1CLENBQUMsV0FBNEMsRUFBRSxNQUFtQjtRQUUzRixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtZQUMvQix1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLG9FQUFvRTtZQUNwRSxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtvQkFDakIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUNuQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQ2hGLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxhQUFhO0lBQ2IsV0FBVztRQUNULElBQUksQ0FBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDL0MsQ0FBQzt5SEE5RlUsY0FBYzs2SEFBZCxjQUFjOztzR0FBZCxjQUFjO2tCQUQxQixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Vmlld3BvcnRTY3JvbGxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7VW5zdWJzY3JpYmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge05hdmlnYXRpb25FbmQsIE5hdmlnYXRpb25Ta2lwcGVkLCBOYXZpZ2F0aW9uU2tpcHBlZENvZGUsIE5hdmlnYXRpb25TdGFydCwgU2Nyb2xsfSBmcm9tICcuL2V2ZW50cyc7XG5pbXBvcnQge05hdmlnYXRpb25UcmFuc2l0aW9uc30gZnJvbSAnLi9uYXZpZ2F0aW9uX3RyYW5zaXRpb24nO1xuaW1wb3J0IHtVcmxTZXJpYWxpemVyfSBmcm9tICcuL3VybF90cmVlJztcblxuZXhwb3J0IGNvbnN0IFJPVVRFUl9TQ1JPTExFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb3V0ZXJTY3JvbGxlcj4oJycpO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgUm91dGVyU2Nyb2xsZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIHJvdXRlckV2ZW50c1N1YnNjcmlwdGlvbj86IFVuc3Vic2NyaWJhYmxlO1xuICBwcml2YXRlIHNjcm9sbEV2ZW50c1N1YnNjcmlwdGlvbj86IFVuc3Vic2NyaWJhYmxlO1xuXG4gIHByaXZhdGUgbGFzdElkID0gMDtcbiAgcHJpdmF0ZSBsYXN0U291cmNlOiAnaW1wZXJhdGl2ZSd8J3BvcHN0YXRlJ3wnaGFzaGNoYW5nZSd8dW5kZWZpbmVkID0gJ2ltcGVyYXRpdmUnO1xuICBwcml2YXRlIHJlc3RvcmVkSWQgPSAwO1xuICBwcml2YXRlIHN0b3JlOiB7W2tleTogc3RyaW5nXTogW251bWJlciwgbnVtYmVyXX0gPSB7fTtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgdXJsU2VyaWFsaXplcjogVXJsU2VyaWFsaXplciwgcHJpdmF0ZSB0cmFuc2l0aW9uczogTmF2aWdhdGlvblRyYW5zaXRpb25zLFxuICAgICAgcHVibGljIHJlYWRvbmx5IHZpZXdwb3J0U2Nyb2xsZXI6IFZpZXdwb3J0U2Nyb2xsZXIsIHByaXZhdGUgcmVhZG9ubHkgem9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBvcHRpb25zOiB7XG4gICAgICAgIHNjcm9sbFBvc2l0aW9uUmVzdG9yYXRpb24/OiAnZGlzYWJsZWQnfCdlbmFibGVkJ3wndG9wJyxcbiAgICAgICAgYW5jaG9yU2Nyb2xsaW5nPzogJ2Rpc2FibGVkJ3wnZW5hYmxlZCdcbiAgICAgIH0gPSB7fSkge1xuICAgIC8vIERlZmF1bHQgYm90aCBvcHRpb25zIHRvICdkaXNhYmxlZCdcbiAgICBvcHRpb25zLnNjcm9sbFBvc2l0aW9uUmVzdG9yYXRpb24gPSBvcHRpb25zLnNjcm9sbFBvc2l0aW9uUmVzdG9yYXRpb24gfHwgJ2Rpc2FibGVkJztcbiAgICBvcHRpb25zLmFuY2hvclNjcm9sbGluZyA9IG9wdGlvbnMuYW5jaG9yU2Nyb2xsaW5nIHx8ICdkaXNhYmxlZCc7XG4gIH1cblxuICBpbml0KCk6IHZvaWQge1xuICAgIC8vIHdlIHdhbnQgdG8gZGlzYWJsZSB0aGUgYXV0b21hdGljIHNjcm9sbGluZyBiZWNhdXNlIGhhdmluZyB0d28gcGxhY2VzXG4gICAgLy8gcmVzcG9uc2libGUgZm9yIHNjcm9sbGluZyByZXN1bHRzIHJhY2UgY29uZGl0aW9ucywgZXNwZWNpYWxseSBnaXZlblxuICAgIC8vIHRoYXQgYnJvd3NlciBkb24ndCBpbXBsZW1lbnQgdGhpcyBiZWhhdmlvciBjb25zaXN0ZW50bHlcbiAgICBpZiAodGhpcy5vcHRpb25zLnNjcm9sbFBvc2l0aW9uUmVzdG9yYXRpb24gIT09ICdkaXNhYmxlZCcpIHtcbiAgICAgIHRoaXMudmlld3BvcnRTY3JvbGxlci5zZXRIaXN0b3J5U2Nyb2xsUmVzdG9yYXRpb24oJ21hbnVhbCcpO1xuICAgIH1cbiAgICB0aGlzLnJvdXRlckV2ZW50c1N1YnNjcmlwdGlvbiA9IHRoaXMuY3JlYXRlU2Nyb2xsRXZlbnRzKCk7XG4gICAgdGhpcy5zY3JvbGxFdmVudHNTdWJzY3JpcHRpb24gPSB0aGlzLmNvbnN1bWVTY3JvbGxFdmVudHMoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2Nyb2xsRXZlbnRzKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zaXRpb25zLmV2ZW50cy5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE5hdmlnYXRpb25TdGFydCkge1xuICAgICAgICAvLyBzdG9yZSB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBjdXJyZW50IHN0YWJsZSBuYXZpZ2F0aW9ucy5cbiAgICAgICAgdGhpcy5zdG9yZVt0aGlzLmxhc3RJZF0gPSB0aGlzLnZpZXdwb3J0U2Nyb2xsZXIuZ2V0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5sYXN0U291cmNlID0gZS5uYXZpZ2F0aW9uVHJpZ2dlcjtcbiAgICAgICAgdGhpcy5yZXN0b3JlZElkID0gZS5yZXN0b3JlZFN0YXRlID8gZS5yZXN0b3JlZFN0YXRlLm5hdmlnYXRpb25JZCA6IDA7XG4gICAgICB9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBOYXZpZ2F0aW9uRW5kKSB7XG4gICAgICAgIHRoaXMubGFzdElkID0gZS5pZDtcbiAgICAgICAgdGhpcy5zY2hlZHVsZVNjcm9sbEV2ZW50KGUsIHRoaXMudXJsU2VyaWFsaXplci5wYXJzZShlLnVybEFmdGVyUmVkaXJlY3RzKS5mcmFnbWVudCk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGUgaW5zdGFuY2VvZiBOYXZpZ2F0aW9uU2tpcHBlZCAmJlxuICAgICAgICAgIGUuY29kZSA9PT0gTmF2aWdhdGlvblNraXBwZWRDb2RlLklnbm9yZWRTYW1lVXJsTmF2aWdhdGlvbikge1xuICAgICAgICB0aGlzLmxhc3RTb3VyY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMucmVzdG9yZWRJZCA9IDA7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVTY3JvbGxFdmVudChlLCB0aGlzLnVybFNlcmlhbGl6ZXIucGFyc2UoZS51cmwpLmZyYWdtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3VtZVNjcm9sbEV2ZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2l0aW9ucy5ldmVudHMuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIFNjcm9sbCkpIHJldHVybjtcbiAgICAgIC8vIGEgcG9wc3RhdGUgZXZlbnQuIFRoZSBwb3Agc3RhdGUgZXZlbnQgd2lsbCBhbHdheXMgaWdub3JlIGFuY2hvciBzY3JvbGxpbmcuXG4gICAgICBpZiAoZS5wb3NpdGlvbikge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNjcm9sbFBvc2l0aW9uUmVzdG9yYXRpb24gPT09ICd0b3AnKSB7XG4gICAgICAgICAgdGhpcy52aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvUG9zaXRpb24oWzAsIDBdKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2Nyb2xsUG9zaXRpb25SZXN0b3JhdGlvbiA9PT0gJ2VuYWJsZWQnKSB7XG4gICAgICAgICAgdGhpcy52aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvUG9zaXRpb24oZS5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW1wZXJhdGl2ZSBuYXZpZ2F0aW9uIFwiZm9yd2FyZFwiXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZS5hbmNob3IgJiYgdGhpcy5vcHRpb25zLmFuY2hvclNjcm9sbGluZyA9PT0gJ2VuYWJsZWQnKSB7XG4gICAgICAgICAgdGhpcy52aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvQW5jaG9yKGUuYW5jaG9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2Nyb2xsUG9zaXRpb25SZXN0b3JhdGlvbiAhPT0gJ2Rpc2FibGVkJykge1xuICAgICAgICAgIHRoaXMudmlld3BvcnRTY3JvbGxlci5zY3JvbGxUb1Bvc2l0aW9uKFswLCAwXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVTY3JvbGxFdmVudChyb3V0ZXJFdmVudDogTmF2aWdhdGlvbkVuZHxOYXZpZ2F0aW9uU2tpcHBlZCwgYW5jaG9yOiBzdHJpbmd8bnVsbCk6XG4gICAgICB2b2lkIHtcbiAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgLy8gVGhlIHNjcm9sbCBldmVudCBuZWVkcyB0byBiZSBkZWxheWVkIHVudGlsIGFmdGVyIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgd2UgbWF5XG4gICAgICAvLyBhdHRlbXB0IHRvIHJlc3RvcmUgdGhlIHNjcm9sbCBwb3NpdGlvbiBiZWZvcmUgdGhlIHJvdXRlciBvdXRsZXQgaGFzIGZ1bGx5IHJlbmRlcmVkIHRoZVxuICAgICAgLy8gY29tcG9uZW50IGJ5IGV4ZWN1dGluZyBpdHMgdXBkYXRlIGJsb2NrIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRyYW5zaXRpb25zLmV2ZW50cy5uZXh0KG5ldyBTY3JvbGwoXG4gICAgICAgICAgICAgIHJvdXRlckV2ZW50LCB0aGlzLmxhc3RTb3VyY2UgPT09ICdwb3BzdGF0ZScgPyB0aGlzLnN0b3JlW3RoaXMucmVzdG9yZWRJZF0gOiBudWxsLFxuICAgICAgICAgICAgICBhbmNob3IpKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAbm9kb2MgKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5yb3V0ZXJFdmVudHNTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5zY3JvbGxFdmVudHNTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cbiJdfQ==