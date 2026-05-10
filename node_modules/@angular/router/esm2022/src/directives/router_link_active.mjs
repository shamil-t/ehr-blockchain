/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, ContentChildren, Directive, ElementRef, EventEmitter, Input, Optional, Output, QueryList, Renderer2 } from '@angular/core';
import { from, of } from 'rxjs';
import { mergeAll } from 'rxjs/operators';
import { NavigationEnd } from '../events';
import { Router } from '../router';
import { RouterLink } from './router_link';
import * as i0 from "@angular/core";
import * as i1 from "../router";
import * as i2 from "./router_link";
/**
 *
 * @description
 *
 * Tracks whether the linked route of an element is currently active, and allows you
 * to specify one or more CSS classes to add to the element when the linked route
 * is active.
 *
 * Use this directive to create a visual distinction for elements associated with an active route.
 * For example, the following code highlights the word "Bob" when the router
 * activates the associated route:
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="active-link">Bob</a>
 * ```
 *
 * Whenever the URL is either '/user' or '/user/bob', the "active-link" class is
 * added to the anchor tag. If the URL changes, the class is removed.
 *
 * You can set more than one class using a space-separated string or an array.
 * For example:
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="class1 class2">Bob</a>
 * <a routerLink="/user/bob" [routerLinkActive]="['class1', 'class2']">Bob</a>
 * ```
 *
 * To add the classes only when the URL matches the link exactly, add the option `exact: true`:
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:
 * true}">Bob</a>
 * ```
 *
 * To directly check the `isActive` status of the link, assign the `RouterLinkActive`
 * instance to a template variable.
 * For example, the following checks the status without assigning any CSS classes:
 *
 * ```
 * <a routerLink="/user/bob" routerLinkActive #rla="routerLinkActive">
 *   Bob {{ rla.isActive ? '(already open)' : ''}}
 * </a>
 * ```
 *
 * You can apply the `RouterLinkActive` directive to an ancestor of linked elements.
 * For example, the following sets the active-link class on the `<div>`  parent tag
 * when the URL is either '/user/jim' or '/user/bob'.
 *
 * ```
 * <div routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
 *   <a routerLink="/user/jim">Jim</a>
 *   <a routerLink="/user/bob">Bob</a>
 * </div>
 * ```
 *
 * The `RouterLinkActive` directive can also be used to set the aria-current attribute
 * to provide an alternative distinction for active elements to visually impaired users.
 *
 * For example, the following code adds the 'active' class to the Home Page link when it is
 * indeed active and in such case also sets its aria-current attribute to 'page':
 *
 * ```
 * <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page">Home Page</a>
 * ```
 *
 * @ngModule RouterModule
 *
 * @publicApi
 */
export class RouterLinkActive {
    get isActive() {
        return this._isActive;
    }
    constructor(router, element, renderer, cdr, link) {
        this.router = router;
        this.element = element;
        this.renderer = renderer;
        this.cdr = cdr;
        this.link = link;
        this.classes = [];
        this._isActive = false;
        /**
         * Options to configure how to determine if the router link is active.
         *
         * These options are passed to the `Router.isActive()` function.
         *
         * @see {@link Router#isActive}
         */
        this.routerLinkActiveOptions = { exact: false };
        /**
         *
         * You can use the output `isActiveChange` to get notified each time the link becomes
         * active or inactive.
         *
         * Emits:
         * true  -> Route is active
         * false -> Route is inactive
         *
         * ```
         * <a
         *  routerLink="/user/bob"
         *  routerLinkActive="active-link"
         *  (isActiveChange)="this.onRouterLinkActive($event)">Bob</a>
         * ```
         */
        this.isActiveChange = new EventEmitter();
        this.routerEventsSubscription = router.events.subscribe((s) => {
            if (s instanceof NavigationEnd) {
                this.update();
            }
        });
    }
    /** @nodoc */
    ngAfterContentInit() {
        // `of(null)` is used to force subscribe body to execute once immediately (like `startWith`).
        of(this.links.changes, of(null)).pipe(mergeAll()).subscribe(_ => {
            this.update();
            this.subscribeToEachLinkOnChanges();
        });
    }
    subscribeToEachLinkOnChanges() {
        this.linkInputChangesSubscription?.unsubscribe();
        const allLinkChanges = [...this.links.toArray(), this.link]
            .filter((link) => !!link)
            .map(link => link.onChanges);
        this.linkInputChangesSubscription = from(allLinkChanges).pipe(mergeAll()).subscribe(link => {
            if (this._isActive !== this.isLinkActive(this.router)(link)) {
                this.update();
            }
        });
    }
    set routerLinkActive(data) {
        const classes = Array.isArray(data) ? data : data.split(' ');
        this.classes = classes.filter(c => !!c);
    }
    /** @nodoc */
    ngOnChanges(changes) {
        this.update();
    }
    /** @nodoc */
    ngOnDestroy() {
        this.routerEventsSubscription.unsubscribe();
        this.linkInputChangesSubscription?.unsubscribe();
    }
    update() {
        if (!this.links || !this.router.navigated)
            return;
        queueMicrotask(() => {
            const hasActiveLinks = this.hasActiveLinks();
            if (this._isActive !== hasActiveLinks) {
                this._isActive = hasActiveLinks;
                this.cdr.markForCheck();
                this.classes.forEach((c) => {
                    if (hasActiveLinks) {
                        this.renderer.addClass(this.element.nativeElement, c);
                    }
                    else {
                        this.renderer.removeClass(this.element.nativeElement, c);
                    }
                });
                if (hasActiveLinks && this.ariaCurrentWhenActive !== undefined) {
                    this.renderer.setAttribute(this.element.nativeElement, 'aria-current', this.ariaCurrentWhenActive.toString());
                }
                else {
                    this.renderer.removeAttribute(this.element.nativeElement, 'aria-current');
                }
                // Emit on isActiveChange after classes are updated
                this.isActiveChange.emit(hasActiveLinks);
            }
        });
    }
    isLinkActive(router) {
        const options = isActiveMatchOptions(this.routerLinkActiveOptions) ?
            this.routerLinkActiveOptions :
            // While the types should disallow `undefined` here, it's possible without strict inputs
            (this.routerLinkActiveOptions.exact || false);
        return (link) => link.urlTree ? router.isActive(link.urlTree, options) : false;
    }
    hasActiveLinks() {
        const isActiveCheckFn = this.isLinkActive(this.router);
        return this.link && isActiveCheckFn(this.link) || this.links.some(isActiveCheckFn);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterLinkActive, deps: [{ token: i1.Router }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.ChangeDetectorRef }, { token: i2.RouterLink, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: RouterLinkActive, isStandalone: true, selector: "[routerLinkActive]", inputs: { routerLinkActiveOptions: "routerLinkActiveOptions", ariaCurrentWhenActive: "ariaCurrentWhenActive", routerLinkActive: "routerLinkActive" }, outputs: { isActiveChange: "isActiveChange" }, queries: [{ propertyName: "links", predicate: RouterLink, descendants: true }], exportAs: ["routerLinkActive"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterLinkActive, decorators: [{
            type: Directive,
            args: [{
                    selector: '[routerLinkActive]',
                    exportAs: 'routerLinkActive',
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i1.Router }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.ChangeDetectorRef }, { type: i2.RouterLink, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { links: [{
                type: ContentChildren,
                args: [RouterLink, { descendants: true }]
            }], routerLinkActiveOptions: [{
                type: Input
            }], ariaCurrentWhenActive: [{
                type: Input
            }], isActiveChange: [{
                type: Output
            }], routerLinkActive: [{
                type: Input
            }] } });
/**
 * Use instead of `'paths' in options` to be compatible with property renaming
 */
function isActiveMatchOptions(options) {
    return !!options.paths;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX2xpbmtfYWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9kaXJlY3RpdmVzL3JvdXRlcl9saW5rX2FjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQW1CLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQXdCLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBZ0IsTUFBTSxlQUFlLENBQUM7QUFDNU0sT0FBTyxFQUFDLElBQUksRUFBRSxFQUFFLEVBQWUsTUFBTSxNQUFNLENBQUM7QUFDNUMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXhDLE9BQU8sRUFBUSxhQUFhLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUdqQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7O0FBR3pDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9FRztBQU1ILE1BQU0sT0FBTyxnQkFBZ0I7SUFRM0IsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUF1Q0QsWUFDWSxNQUFjLEVBQVUsT0FBbUIsRUFBVSxRQUFtQixFQUMvRCxHQUFzQixFQUFzQixJQUFpQjtRQUR0RSxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQVc7UUFDL0QsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFBc0IsU0FBSSxHQUFKLElBQUksQ0FBYTtRQWhEMUUsWUFB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UUFDbEQsT0FBTyxDQUFDLElBQWdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzdGLENBQUM7SUFFTyxjQUFjO1FBQ3BCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7eUhBdklVLGdCQUFnQjs2R0FBaEIsZ0JBQWdCLHlTQUNWLFVBQVU7O3NHQURoQixnQkFBZ0I7a0JBTDVCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCOzswQkFvRCtDLFFBQVE7NENBbERKLEtBQUs7c0JBQXRELGVBQWU7dUJBQUMsVUFBVSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQztnQkFrQnZDLHVCQUF1QjtzQkFBL0IsS0FBSztnQkFVRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBa0JhLGNBQWM7c0JBQWhDLE1BQU07Z0JBa0NILGdCQUFnQjtzQkFEbkIsS0FBSzs7QUEwRFI7O0dBRUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLE9BQ29CO0lBQ2hELE9BQU8sQ0FBQyxDQUFFLE9BQWdDLENBQUMsS0FBSyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBZnRlckNvbnRlbnRJbml0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29udGVudENoaWxkcmVuLCBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBPcHRpb25hbCwgT3V0cHV0LCBRdWVyeUxpc3QsIFJlbmRlcmVyMiwgU2ltcGxlQ2hhbmdlc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2Zyb20sIG9mLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttZXJnZUFsbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0V2ZW50LCBOYXZpZ2F0aW9uRW5kfSBmcm9tICcuLi9ldmVudHMnO1xuaW1wb3J0IHtSb3V0ZXJ9IGZyb20gJy4uL3JvdXRlcic7XG5pbXBvcnQge0lzQWN0aXZlTWF0Y2hPcHRpb25zfSBmcm9tICcuLi91cmxfdHJlZSc7XG5cbmltcG9ydCB7Um91dGVyTGlua30gZnJvbSAnLi9yb3V0ZXJfbGluayc7XG5cblxuLyoqXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogVHJhY2tzIHdoZXRoZXIgdGhlIGxpbmtlZCByb3V0ZSBvZiBhbiBlbGVtZW50IGlzIGN1cnJlbnRseSBhY3RpdmUsIGFuZCBhbGxvd3MgeW91XG4gKiB0byBzcGVjaWZ5IG9uZSBvciBtb3JlIENTUyBjbGFzc2VzIHRvIGFkZCB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSBsaW5rZWQgcm91dGVcbiAqIGlzIGFjdGl2ZS5cbiAqXG4gKiBVc2UgdGhpcyBkaXJlY3RpdmUgdG8gY3JlYXRlIGEgdmlzdWFsIGRpc3RpbmN0aW9uIGZvciBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYW4gYWN0aXZlIHJvdXRlLlxuICogRm9yIGV4YW1wbGUsIHRoZSBmb2xsb3dpbmcgY29kZSBoaWdobGlnaHRzIHRoZSB3b3JkIFwiQm9iXCIgd2hlbiB0aGUgcm91dGVyXG4gKiBhY3RpdmF0ZXMgdGhlIGFzc29jaWF0ZWQgcm91dGU6XG4gKlxuICogYGBgXG4gKiA8YSByb3V0ZXJMaW5rPVwiL3VzZXIvYm9iXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCI+Qm9iPC9hPlxuICogYGBgXG4gKlxuICogV2hlbmV2ZXIgdGhlIFVSTCBpcyBlaXRoZXIgJy91c2VyJyBvciAnL3VzZXIvYm9iJywgdGhlIFwiYWN0aXZlLWxpbmtcIiBjbGFzcyBpc1xuICogYWRkZWQgdG8gdGhlIGFuY2hvciB0YWcuIElmIHRoZSBVUkwgY2hhbmdlcywgdGhlIGNsYXNzIGlzIHJlbW92ZWQuXG4gKlxuICogWW91IGNhbiBzZXQgbW9yZSB0aGFuIG9uZSBjbGFzcyB1c2luZyBhIHNwYWNlLXNlcGFyYXRlZCBzdHJpbmcgb3IgYW4gYXJyYXkuXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIDxhIHJvdXRlckxpbms9XCIvdXNlci9ib2JcIiByb3V0ZXJMaW5rQWN0aXZlPVwiY2xhc3MxIGNsYXNzMlwiPkJvYjwvYT5cbiAqIDxhIHJvdXRlckxpbms9XCIvdXNlci9ib2JcIiBbcm91dGVyTGlua0FjdGl2ZV09XCJbJ2NsYXNzMScsICdjbGFzczInXVwiPkJvYjwvYT5cbiAqIGBgYFxuICpcbiAqIFRvIGFkZCB0aGUgY2xhc3NlcyBvbmx5IHdoZW4gdGhlIFVSTCBtYXRjaGVzIHRoZSBsaW5rIGV4YWN0bHksIGFkZCB0aGUgb3B0aW9uIGBleGFjdDogdHJ1ZWA6XG4gKlxuICogYGBgXG4gKiA8YSByb3V0ZXJMaW5rPVwiL3VzZXIvYm9iXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgW3JvdXRlckxpbmtBY3RpdmVPcHRpb25zXT1cIntleGFjdDpcbiAqIHRydWV9XCI+Qm9iPC9hPlxuICogYGBgXG4gKlxuICogVG8gZGlyZWN0bHkgY2hlY2sgdGhlIGBpc0FjdGl2ZWAgc3RhdHVzIG9mIHRoZSBsaW5rLCBhc3NpZ24gdGhlIGBSb3V0ZXJMaW5rQWN0aXZlYFxuICogaW5zdGFuY2UgdG8gYSB0ZW1wbGF0ZSB2YXJpYWJsZS5cbiAqIEZvciBleGFtcGxlLCB0aGUgZm9sbG93aW5nIGNoZWNrcyB0aGUgc3RhdHVzIHdpdGhvdXQgYXNzaWduaW5nIGFueSBDU1MgY2xhc3NlczpcbiAqXG4gKiBgYGBcbiAqIDxhIHJvdXRlckxpbms9XCIvdXNlci9ib2JcIiByb3V0ZXJMaW5rQWN0aXZlICNybGE9XCJyb3V0ZXJMaW5rQWN0aXZlXCI+XG4gKiAgIEJvYiB7eyBybGEuaXNBY3RpdmUgPyAnKGFscmVhZHkgb3BlbiknIDogJyd9fVxuICogPC9hPlxuICogYGBgXG4gKlxuICogWW91IGNhbiBhcHBseSB0aGUgYFJvdXRlckxpbmtBY3RpdmVgIGRpcmVjdGl2ZSB0byBhbiBhbmNlc3RvciBvZiBsaW5rZWQgZWxlbWVudHMuXG4gKiBGb3IgZXhhbXBsZSwgdGhlIGZvbGxvd2luZyBzZXRzIHRoZSBhY3RpdmUtbGluayBjbGFzcyBvbiB0aGUgYDxkaXY+YCAgcGFyZW50IHRhZ1xuICogd2hlbiB0aGUgVVJMIGlzIGVpdGhlciAnL3VzZXIvamltJyBvciAnL3VzZXIvYm9iJy5cbiAqXG4gKiBgYGBcbiAqIDxkaXYgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCIgW3JvdXRlckxpbmtBY3RpdmVPcHRpb25zXT1cIntleGFjdDogdHJ1ZX1cIj5cbiAqICAgPGEgcm91dGVyTGluaz1cIi91c2VyL2ppbVwiPkppbTwvYT5cbiAqICAgPGEgcm91dGVyTGluaz1cIi91c2VyL2JvYlwiPkJvYjwvYT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogVGhlIGBSb3V0ZXJMaW5rQWN0aXZlYCBkaXJlY3RpdmUgY2FuIGFsc28gYmUgdXNlZCB0byBzZXQgdGhlIGFyaWEtY3VycmVudCBhdHRyaWJ1dGVcbiAqIHRvIHByb3ZpZGUgYW4gYWx0ZXJuYXRpdmUgZGlzdGluY3Rpb24gZm9yIGFjdGl2ZSBlbGVtZW50cyB0byB2aXN1YWxseSBpbXBhaXJlZCB1c2Vycy5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgdGhlIGZvbGxvd2luZyBjb2RlIGFkZHMgdGhlICdhY3RpdmUnIGNsYXNzIHRvIHRoZSBIb21lIFBhZ2UgbGluayB3aGVuIGl0IGlzXG4gKiBpbmRlZWQgYWN0aXZlIGFuZCBpbiBzdWNoIGNhc2UgYWxzbyBzZXRzIGl0cyBhcmlhLWN1cnJlbnQgYXR0cmlidXRlIHRvICdwYWdlJzpcbiAqXG4gKiBgYGBcbiAqIDxhIHJvdXRlckxpbms9XCIvXCIgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZVwiIGFyaWFDdXJyZW50V2hlbkFjdGl2ZT1cInBhZ2VcIj5Ib21lIFBhZ2U8L2E+XG4gKiBgYGBcbiAqXG4gKiBAbmdNb2R1bGUgUm91dGVyTW9kdWxlXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbcm91dGVyTGlua0FjdGl2ZV0nLFxuICBleHBvcnRBczogJ3JvdXRlckxpbmtBY3RpdmUnLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBSb3V0ZXJMaW5rQWN0aXZlIGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIEFmdGVyQ29udGVudEluaXQge1xuICBAQ29udGVudENoaWxkcmVuKFJvdXRlckxpbmssIHtkZXNjZW5kYW50czogdHJ1ZX0pIGxpbmtzITogUXVlcnlMaXN0PFJvdXRlckxpbms+O1xuXG4gIHByaXZhdGUgY2xhc3Nlczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSByb3V0ZXJFdmVudHNTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgcHJpdmF0ZSBsaW5rSW5wdXRDaGFuZ2VzU3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIF9pc0FjdGl2ZSA9IGZhbHNlO1xuXG4gIGdldCBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNBY3RpdmU7XG4gIH1cblxuICAvKipcbiAgICogT3B0aW9ucyB0byBjb25maWd1cmUgaG93IHRvIGRldGVybWluZSBpZiB0aGUgcm91dGVyIGxpbmsgaXMgYWN0aXZlLlxuICAgKlxuICAgKiBUaGVzZSBvcHRpb25zIGFyZSBwYXNzZWQgdG8gdGhlIGBSb3V0ZXIuaXNBY3RpdmUoKWAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIFJvdXRlciNpc0FjdGl2ZX1cbiAgICovXG4gIEBJbnB1dCgpIHJvdXRlckxpbmtBY3RpdmVPcHRpb25zOiB7ZXhhY3Q6IGJvb2xlYW59fElzQWN0aXZlTWF0Y2hPcHRpb25zID0ge2V4YWN0OiBmYWxzZX07XG5cblxuICAvKipcbiAgICogQXJpYS1jdXJyZW50IGF0dHJpYnV0ZSB0byBhcHBseSB3aGVuIHRoZSByb3V0ZXIgbGluayBpcyBhY3RpdmUuXG4gICAqXG4gICAqIFBvc3NpYmxlIHZhbHVlczogYCdwYWdlJ2AgfCBgJ3N0ZXAnYCB8IGAnbG9jYXRpb24nYCB8IGAnZGF0ZSdgIHwgYCd0aW1lJ2AgfCBgdHJ1ZWAgfCBgZmFsc2VgLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BY2Nlc3NpYmlsaXR5L0FSSUEvQXR0cmlidXRlcy9hcmlhLWN1cnJlbnR9XG4gICAqL1xuICBASW5wdXQoKSBhcmlhQ3VycmVudFdoZW5BY3RpdmU/OiAncGFnZSd8J3N0ZXAnfCdsb2NhdGlvbid8J2RhdGUnfCd0aW1lJ3x0cnVlfGZhbHNlO1xuXG4gIC8qKlxuICAgKlxuICAgKiBZb3UgY2FuIHVzZSB0aGUgb3V0cHV0IGBpc0FjdGl2ZUNoYW5nZWAgdG8gZ2V0IG5vdGlmaWVkIGVhY2ggdGltZSB0aGUgbGluayBiZWNvbWVzXG4gICAqIGFjdGl2ZSBvciBpbmFjdGl2ZS5cbiAgICpcbiAgICogRW1pdHM6XG4gICAqIHRydWUgIC0+IFJvdXRlIGlzIGFjdGl2ZVxuICAgKiBmYWxzZSAtPiBSb3V0ZSBpcyBpbmFjdGl2ZVxuICAgKlxuICAgKiBgYGBcbiAgICogPGFcbiAgICogIHJvdXRlckxpbms9XCIvdXNlci9ib2JcIlxuICAgKiAgcm91dGVyTGlua0FjdGl2ZT1cImFjdGl2ZS1saW5rXCJcbiAgICogIChpc0FjdGl2ZUNoYW5nZSk9XCJ0aGlzLm9uUm91dGVyTGlua0FjdGl2ZSgkZXZlbnQpXCI+Qm9iPC9hPlxuICAgKiBgYGBcbiAgICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBpc0FjdGl2ZUNoYW5nZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByb3V0ZXI6IFJvdXRlciwgcHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmLCBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IGNkcjogQ2hhbmdlRGV0ZWN0b3JSZWYsIEBPcHRpb25hbCgpIHByaXZhdGUgbGluaz86IFJvdXRlckxpbmspIHtcbiAgICB0aGlzLnJvdXRlckV2ZW50c1N1YnNjcmlwdGlvbiA9IHJvdXRlci5ldmVudHMuc3Vic2NyaWJlKChzOiBFdmVudCkgPT4ge1xuICAgICAgaWYgKHMgaW5zdGFuY2VvZiBOYXZpZ2F0aW9uRW5kKSB7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpOiB2b2lkIHtcbiAgICAvLyBgb2YobnVsbClgIGlzIHVzZWQgdG8gZm9yY2Ugc3Vic2NyaWJlIGJvZHkgdG8gZXhlY3V0ZSBvbmNlIGltbWVkaWF0ZWx5IChsaWtlIGBzdGFydFdpdGhgKS5cbiAgICBvZih0aGlzLmxpbmtzLmNoYW5nZXMsIG9mKG51bGwpKS5waXBlKG1lcmdlQWxsKCkpLnN1YnNjcmliZShfID0+IHtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICB0aGlzLnN1YnNjcmliZVRvRWFjaExpbmtPbkNoYW5nZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc3Vic2NyaWJlVG9FYWNoTGlua09uQ2hhbmdlcygpIHtcbiAgICB0aGlzLmxpbmtJbnB1dENoYW5nZXNTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgY29uc3QgYWxsTGlua0NoYW5nZXMgPSBbLi4udGhpcy5saW5rcy50b0FycmF5KCksIHRoaXMubGlua11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChsaW5rKTogbGluayBpcyBSb3V0ZXJMaW5rID0+ICEhbGluaylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKGxpbmsgPT4gbGluay5vbkNoYW5nZXMpO1xuICAgIHRoaXMubGlua0lucHV0Q2hhbmdlc1N1YnNjcmlwdGlvbiA9IGZyb20oYWxsTGlua0NoYW5nZXMpLnBpcGUobWVyZ2VBbGwoKSkuc3Vic2NyaWJlKGxpbmsgPT4ge1xuICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlICE9PSB0aGlzLmlzTGlua0FjdGl2ZSh0aGlzLnJvdXRlcikobGluaykpIHtcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIEBJbnB1dCgpXG4gIHNldCByb3V0ZXJMaW5rQWN0aXZlKGRhdGE6IHN0cmluZ1tdfHN0cmluZykge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IGRhdGEuc3BsaXQoJyAnKTtcbiAgICB0aGlzLmNsYXNzZXMgPSBjbGFzc2VzLmZpbHRlcihjID0+ICEhYyk7XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIC8qKiBAbm9kb2MgKi9cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5yb3V0ZXJFdmVudHNTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmxpbmtJbnB1dENoYW5nZXNTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMubGlua3MgfHwgIXRoaXMucm91dGVyLm5hdmlnYXRlZCkgcmV0dXJuO1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgIGNvbnN0IGhhc0FjdGl2ZUxpbmtzID0gdGhpcy5oYXNBY3RpdmVMaW5rcygpO1xuICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlICE9PSBoYXNBY3RpdmVMaW5rcykge1xuICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGhhc0FjdGl2ZUxpbmtzO1xuICAgICAgICB0aGlzLmNkci5tYXJrRm9yQ2hlY2soKTtcbiAgICAgICAgdGhpcy5jbGFzc2VzLmZvckVhY2goKGMpID0+IHtcbiAgICAgICAgICBpZiAoaGFzQWN0aXZlTGlua3MpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCBjKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaGFzQWN0aXZlTGlua3MgJiYgdGhpcy5hcmlhQ3VycmVudFdoZW5BY3RpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudCwgJ2FyaWEtY3VycmVudCcsIHRoaXMuYXJpYUN1cnJlbnRXaGVuQWN0aXZlLnRvU3RyaW5nKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50LCAnYXJpYS1jdXJyZW50Jyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbWl0IG9uIGlzQWN0aXZlQ2hhbmdlIGFmdGVyIGNsYXNzZXMgYXJlIHVwZGF0ZWRcbiAgICAgICAgdGhpcy5pc0FjdGl2ZUNoYW5nZS5lbWl0KGhhc0FjdGl2ZUxpbmtzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaXNMaW5rQWN0aXZlKHJvdXRlcjogUm91dGVyKTogKGxpbms6IFJvdXRlckxpbmspID0+IGJvb2xlYW4ge1xuICAgIGNvbnN0IG9wdGlvbnM6IGJvb2xlYW58SXNBY3RpdmVNYXRjaE9wdGlvbnMgPVxuICAgICAgICBpc0FjdGl2ZU1hdGNoT3B0aW9ucyh0aGlzLnJvdXRlckxpbmtBY3RpdmVPcHRpb25zKSA/XG4gICAgICAgIHRoaXMucm91dGVyTGlua0FjdGl2ZU9wdGlvbnMgOlxuICAgICAgICAvLyBXaGlsZSB0aGUgdHlwZXMgc2hvdWxkIGRpc2FsbG93IGB1bmRlZmluZWRgIGhlcmUsIGl0J3MgcG9zc2libGUgd2l0aG91dCBzdHJpY3QgaW5wdXRzXG4gICAgICAgICh0aGlzLnJvdXRlckxpbmtBY3RpdmVPcHRpb25zLmV4YWN0IHx8IGZhbHNlKTtcbiAgICByZXR1cm4gKGxpbms6IFJvdXRlckxpbmspID0+IGxpbmsudXJsVHJlZSA/IHJvdXRlci5pc0FjdGl2ZShsaW5rLnVybFRyZWUsIG9wdGlvbnMpIDogZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGhhc0FjdGl2ZUxpbmtzKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlzQWN0aXZlQ2hlY2tGbiA9IHRoaXMuaXNMaW5rQWN0aXZlKHRoaXMucm91dGVyKTtcbiAgICByZXR1cm4gdGhpcy5saW5rICYmIGlzQWN0aXZlQ2hlY2tGbih0aGlzLmxpbmspIHx8IHRoaXMubGlua3Muc29tZShpc0FjdGl2ZUNoZWNrRm4pO1xuICB9XG59XG5cbi8qKlxuICogVXNlIGluc3RlYWQgb2YgYCdwYXRocycgaW4gb3B0aW9uc2AgdG8gYmUgY29tcGF0aWJsZSB3aXRoIHByb3BlcnR5IHJlbmFtaW5nXG4gKi9cbmZ1bmN0aW9uIGlzQWN0aXZlTWF0Y2hPcHRpb25zKG9wdGlvbnM6IHtleGFjdDogYm9vbGVhbn18XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJc0FjdGl2ZU1hdGNoT3B0aW9ucyk6IG9wdGlvbnMgaXMgSXNBY3RpdmVNYXRjaE9wdGlvbnMge1xuICByZXR1cm4gISEob3B0aW9ucyBhcyBJc0FjdGl2ZU1hdGNoT3B0aW9ucykucGF0aHM7XG59XG4iXX0=