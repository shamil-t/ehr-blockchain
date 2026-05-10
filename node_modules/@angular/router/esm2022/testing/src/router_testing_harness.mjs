/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, Injectable, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, ɵafterNextNavigation as afterNextNavigation } from '@angular/router';
import * as i0 from "@angular/core";
export class RootFixtureService {
    createHarness() {
        if (this.harness) {
            throw new Error('Only one harness should be created per test.');
        }
        this.harness = new RouterTestingHarness(this.getRootFixture());
        return this.harness;
    }
    getRootFixture() {
        if (this.fixture !== undefined) {
            return this.fixture;
        }
        this.fixture = TestBed.createComponent(RootCmp);
        this.fixture.detectChanges();
        return this.fixture;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RootFixtureService, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RootFixtureService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RootFixtureService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
export class RootCmp {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RootCmp, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.2.12", type: RootCmp, isStandalone: true, selector: "ng-component", viewQueries: [{ propertyName: "outlet", first: true, predicate: RouterOutlet, descendants: true }], ngImport: i0, template: '<router-outlet></router-outlet>', isInline: true, dependencies: [{ kind: "directive", type: RouterOutlet, selector: "router-outlet", inputs: ["name"], outputs: ["activate", "deactivate", "attach", "detach"], exportAs: ["outlet"] }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RootCmp, decorators: [{
            type: Component,
            args: [{
                    standalone: true,
                    template: '<router-outlet></router-outlet>',
                    imports: [RouterOutlet],
                }]
        }], propDecorators: { outlet: [{
                type: ViewChild,
                args: [RouterOutlet]
            }] } });
/**
 * A testing harness for the `Router` to reduce the boilerplate needed to test routes and routed
 * components.
 *
 * @publicApi
 */
export class RouterTestingHarness {
    /**
     * Creates a `RouterTestingHarness` instance.
     *
     * The `RouterTestingHarness` also creates its own root component with a `RouterOutlet` for the
     * purposes of rendering route components.
     *
     * Throws an error if an instance has already been created.
     * Use of this harness also requires `destroyAfterEach: true` in the `ModuleTeardownOptions`
     *
     * @param initialUrl The target of navigation to trigger before returning the harness.
     */
    static async create(initialUrl) {
        const harness = TestBed.inject(RootFixtureService).createHarness();
        if (initialUrl !== undefined) {
            await harness.navigateByUrl(initialUrl);
        }
        return harness;
    }
    /** @internal */
    constructor(fixture) {
        this.fixture = fixture;
    }
    /** Instructs the root fixture to run change detection. */
    detectChanges() {
        this.fixture.detectChanges();
    }
    /** The `DebugElement` of the `RouterOutlet` component. `null` if the outlet is not activated. */
    get routeDebugElement() {
        const outlet = this.fixture.componentInstance.outlet;
        if (!outlet || !outlet.isActivated) {
            return null;
        }
        return this.fixture.debugElement.query(v => v.componentInstance === outlet.component);
    }
    /** The native element of the `RouterOutlet` component. `null` if the outlet is not activated. */
    get routeNativeElement() {
        return this.routeDebugElement?.nativeElement ?? null;
    }
    async navigateByUrl(url, requiredRoutedComponentType) {
        const router = TestBed.inject(Router);
        let resolveFn;
        const redirectTrackingPromise = new Promise(resolve => {
            resolveFn = resolve;
        });
        afterNextNavigation(TestBed.inject(Router), resolveFn);
        await router.navigateByUrl(url);
        await redirectTrackingPromise;
        this.fixture.detectChanges();
        const outlet = this.fixture.componentInstance.outlet;
        // The outlet might not be activated if the user is testing a navigation for a guard that
        // rejects
        if (outlet && outlet.isActivated && outlet.activatedRoute.component) {
            const activatedComponent = outlet.component;
            if (requiredRoutedComponentType !== undefined &&
                !(activatedComponent instanceof requiredRoutedComponentType)) {
                throw new Error(`Unexpected routed component type. Expected ${requiredRoutedComponentType.name} but got ${activatedComponent.constructor.name}`);
            }
            return activatedComponent;
        }
        else {
            if (requiredRoutedComponentType !== undefined) {
                throw new Error(`Unexpected routed component type. Expected ${requiredRoutedComponentType.name} but the navigation did not activate any component.`);
            }
            return null;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX3Rlc3RpbmdfaGFybmVzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci90ZXN0aW5nL3NyYy9yb3V0ZXJfdGVzdGluZ19oYXJuZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQWdCLFVBQVUsRUFBUSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDbkYsT0FBTyxFQUFtQixPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBQyxNQUFNLGlCQUFpQixDQUFDOztBQUdsRyxNQUFNLE9BQU8sa0JBQWtCO0lBSTdCLGFBQWE7UUFDWCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRU8sY0FBYztRQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO1lBQzlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO3lIQW5CVSxrQkFBa0I7NkhBQWxCLGtCQUFrQixjQUROLE1BQU07O3NHQUNsQixrQkFBa0I7a0JBRDlCLFVBQVU7bUJB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QUMsSUFBSSxZQUFZLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQ3hGO1lBQ0QsT0FBTyxrQkFBdUIsQ0FBQztTQUNoQzthQUFNO1lBQ0wsSUFBSSwyQkFBMkIsS0FBSyxTQUFTLEVBQUU7Z0JBQzdDLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQ1osMkJBQTJCLENBQUMsSUFBSSxxREFBcUQsQ0FBQyxDQUFDO2FBQzVGO1lBQ0QsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGVidWdFbGVtZW50LCBJbmplY3RhYmxlLCBUeXBlLCBWaWV3Q2hpbGR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlLCBUZXN0QmVkfSBmcm9tICdAYW5ndWxhci9jb3JlL3Rlc3RpbmcnO1xuaW1wb3J0IHtSb3V0ZXIsIFJvdXRlck91dGxldCwgybVhZnRlck5leHROYXZpZ2F0aW9uIGFzIGFmdGVyTmV4dE5hdmlnYXRpb259IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFJvb3RGaXh0dXJlU2VydmljZSB7XG4gIHByaXZhdGUgZml4dHVyZT86IENvbXBvbmVudEZpeHR1cmU8Um9vdENtcD47XG4gIHByaXZhdGUgaGFybmVzcz86IFJvdXRlclRlc3RpbmdIYXJuZXNzO1xuXG4gIGNyZWF0ZUhhcm5lc3MoKTogUm91dGVyVGVzdGluZ0hhcm5lc3Mge1xuICAgIGlmICh0aGlzLmhhcm5lc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBvbmUgaGFybmVzcyBzaG91bGQgYmUgY3JlYXRlZCBwZXIgdGVzdC4nKTtcbiAgICB9XG4gICAgdGhpcy5oYXJuZXNzID0gbmV3IFJvdXRlclRlc3RpbmdIYXJuZXNzKHRoaXMuZ2V0Um9vdEZpeHR1cmUoKSk7XG4gICAgcmV0dXJuIHRoaXMuaGFybmVzcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Um9vdEZpeHR1cmUoKTogQ29tcG9uZW50Rml4dHVyZTxSb290Q21wPiB7XG4gICAgaWYgKHRoaXMuZml4dHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5maXh0dXJlO1xuICAgIH1cbiAgICB0aGlzLmZpeHR1cmUgPSBUZXN0QmVkLmNyZWF0ZUNvbXBvbmVudChSb290Q21wKTtcbiAgICB0aGlzLmZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybiB0aGlzLmZpeHR1cmU7XG4gIH1cbn1cblxuQENvbXBvbmVudCh7XG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHRlbXBsYXRlOiAnPHJvdXRlci1vdXRsZXQ+PC9yb3V0ZXItb3V0bGV0PicsXG4gIGltcG9ydHM6IFtSb3V0ZXJPdXRsZXRdLFxufSlcbmV4cG9ydCBjbGFzcyBSb290Q21wIHtcbiAgQFZpZXdDaGlsZChSb3V0ZXJPdXRsZXQpIG91dGxldD86IFJvdXRlck91dGxldDtcbn1cblxuLyoqXG4gKiBBIHRlc3RpbmcgaGFybmVzcyBmb3IgdGhlIGBSb3V0ZXJgIHRvIHJlZHVjZSB0aGUgYm9pbGVycGxhdGUgbmVlZGVkIHRvIHRlc3Qgcm91dGVzIGFuZCByb3V0ZWRcbiAqIGNvbXBvbmVudHMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgUm91dGVyVGVzdGluZ0hhcm5lc3Mge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIGBSb3V0ZXJUZXN0aW5nSGFybmVzc2AgaW5zdGFuY2UuXG4gICAqXG4gICAqIFRoZSBgUm91dGVyVGVzdGluZ0hhcm5lc3NgIGFsc28gY3JlYXRlcyBpdHMgb3duIHJvb3QgY29tcG9uZW50IHdpdGggYSBgUm91dGVyT3V0bGV0YCBmb3IgdGhlXG4gICAqIHB1cnBvc2VzIG9mIHJlbmRlcmluZyByb3V0ZSBjb21wb25lbnRzLlxuICAgKlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgYW4gaW5zdGFuY2UgaGFzIGFscmVhZHkgYmVlbiBjcmVhdGVkLlxuICAgKiBVc2Ugb2YgdGhpcyBoYXJuZXNzIGFsc28gcmVxdWlyZXMgYGRlc3Ryb3lBZnRlckVhY2g6IHRydWVgIGluIHRoZSBgTW9kdWxlVGVhcmRvd25PcHRpb25zYFxuICAgKlxuICAgKiBAcGFyYW0gaW5pdGlhbFVybCBUaGUgdGFyZ2V0IG9mIG5hdmlnYXRpb24gdG8gdHJpZ2dlciBiZWZvcmUgcmV0dXJuaW5nIHRoZSBoYXJuZXNzLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZShpbml0aWFsVXJsPzogc3RyaW5nKTogUHJvbWlzZTxSb3V0ZXJUZXN0aW5nSGFybmVzcz4ge1xuICAgIGNvbnN0IGhhcm5lc3MgPSBUZXN0QmVkLmluamVjdChSb290Rml4dHVyZVNlcnZpY2UpLmNyZWF0ZUhhcm5lc3MoKTtcbiAgICBpZiAoaW5pdGlhbFVybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhd2FpdCBoYXJuZXNzLm5hdmlnYXRlQnlVcmwoaW5pdGlhbFVybCk7XG4gICAgfVxuICAgIHJldHVybiBoYXJuZXNzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpeHR1cmUgb2YgdGhlIHJvb3QgY29tcG9uZW50IG9mIHRoZSBSb3V0ZXJUZXN0aW5nSGFybmVzc1xuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihmaXh0dXJlOiBDb21wb25lbnRGaXh0dXJlPHVua25vd24+KSB7XG4gICAgdGhpcy5maXh0dXJlID0gZml4dHVyZTtcbiAgfVxuXG4gIC8qKiBJbnN0cnVjdHMgdGhlIHJvb3QgZml4dHVyZSB0byBydW4gY2hhbmdlIGRldGVjdGlvbi4gKi9cbiAgZGV0ZWN0Q2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLmZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKiBUaGUgYERlYnVnRWxlbWVudGAgb2YgdGhlIGBSb3V0ZXJPdXRsZXRgIGNvbXBvbmVudC4gYG51bGxgIGlmIHRoZSBvdXRsZXQgaXMgbm90IGFjdGl2YXRlZC4gKi9cbiAgZ2V0IHJvdXRlRGVidWdFbGVtZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBvdXRsZXQgPSAodGhpcy5maXh0dXJlLmNvbXBvbmVudEluc3RhbmNlIGFzIFJvb3RDbXApLm91dGxldDtcbiAgICBpZiAoIW91dGxldCB8fCAhb3V0bGV0LmlzQWN0aXZhdGVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZml4dHVyZS5kZWJ1Z0VsZW1lbnQucXVlcnkodiA9PiB2LmNvbXBvbmVudEluc3RhbmNlID09PSBvdXRsZXQuY29tcG9uZW50KTtcbiAgfVxuICAvKiogVGhlIG5hdGl2ZSBlbGVtZW50IG9mIHRoZSBgUm91dGVyT3V0bGV0YCBjb21wb25lbnQuIGBudWxsYCBpZiB0aGUgb3V0bGV0IGlzIG5vdCBhY3RpdmF0ZWQuICovXG4gIGdldCByb3V0ZU5hdGl2ZUVsZW1lbnQoKTogSFRNTEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMucm91dGVEZWJ1Z0VsZW1lbnQ/Lm5hdGl2ZUVsZW1lbnQgPz8gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBhIGBSb3V0ZXJgIG5hdmlnYXRpb24gYW5kIHdhaXRzIGZvciBpdCB0byBjb21wbGV0ZS5cbiAgICpcbiAgICogVGhlIHJvb3QgY29tcG9uZW50IHdpdGggYSBgUm91dGVyT3V0bGV0YCBjcmVhdGVkIGZvciB0aGUgaGFybmVzcyBpcyB1c2VkIHRvIHJlbmRlciBgUm91dGVgXG4gICAqIGNvbXBvbmVudHMuIFRoZSByb290IGNvbXBvbmVudCBpcyByZXVzZWQgd2l0aGluIHRoZSBzYW1lIHRlc3QgaW4gc3Vic2VxdWVudCBjYWxscyB0b1xuICAgKiBgbmF2aWdhdGVGb3JUZXN0YC5cbiAgICpcbiAgICogV2hlbiB0ZXN0aW5nIGBSb3V0ZXNgIHdpdGggYSBndWFyZHMgdGhhdCByZWplY3QgdGhlIG5hdmlnYXRpb24sIHRoZSBgUm91dGVyT3V0bGV0YCBtaWdodCBub3QgYmVcbiAgICogYWN0aXZhdGVkIGFuZCB0aGUgYGFjdGl2YXRlZENvbXBvbmVudGAgbWF5IGJlIGBudWxsYC5cbiAgICpcbiAgICoge0BleGFtcGxlIHJvdXRlci90ZXN0aW5nL3Rlc3Qvcm91dGVyX3Rlc3RpbmdfaGFybmVzc19leGFtcGxlcy5zcGVjLnRzIHJlZ2lvbj0nR3VhcmQnfVxuICAgKlxuICAgKiBAcGFyYW0gdXJsIFRoZSB0YXJnZXQgb2YgdGhlIG5hdmlnYXRpb24uIFBhc3NlZCB0byBgUm91dGVyLm5hdmlnYXRlQnlVcmxgLlxuICAgKiBAcmV0dXJucyBUaGUgYWN0aXZhdGVkIGNvbXBvbmVudCBpbnN0YW5jZSBvZiB0aGUgYFJvdXRlck91dGxldGAgYWZ0ZXIgbmF2aWdhdGlvbiBjb21wbGV0ZXNcbiAgICogICAgIChgbnVsbGAgaWYgdGhlIG91dGxldCBkb2VzIG5vdCBnZXQgYWN0aXZhdGVkKS5cbiAgICovXG4gIGFzeW5jIG5hdmlnYXRlQnlVcmwodXJsOiBzdHJpbmcpOiBQcm9taXNlPG51bGx8e30+O1xuICAvKipcbiAgICogVHJpZ2dlcnMgYSByb3V0ZXIgbmF2aWdhdGlvbiBhbmQgd2FpdHMgZm9yIGl0IHRvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBUaGUgcm9vdCBjb21wb25lbnQgd2l0aCBhIGBSb3V0ZXJPdXRsZXRgIGNyZWF0ZWQgZm9yIHRoZSBoYXJuZXNzIGlzIHVzZWQgdG8gcmVuZGVyIGBSb3V0ZWBcbiAgICogY29tcG9uZW50cy5cbiAgICpcbiAgICoge0BleGFtcGxlIHJvdXRlci90ZXN0aW5nL3Rlc3Qvcm91dGVyX3Rlc3RpbmdfaGFybmVzc19leGFtcGxlcy5zcGVjLnRzIHJlZ2lvbj0nUm91dGVkQ29tcG9uZW50J31cbiAgICpcbiAgICogVGhlIHJvb3QgY29tcG9uZW50IGlzIHJldXNlZCB3aXRoaW4gdGhlIHNhbWUgdGVzdCBpbiBzdWJzZXF1ZW50IGNhbGxzIHRvIGBuYXZpZ2F0ZUJ5VXJsYC5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiBhbHNvIG1ha2VzIGl0IGVhc2llciB0byB0ZXN0IGNvbXBvbmVudHMgdGhhdCBkZXBlbmQgb24gYEFjdGl2YXRlZFJvdXRlYCBkYXRhLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgcm91dGVyL3Rlc3RpbmcvdGVzdC9yb3V0ZXJfdGVzdGluZ19oYXJuZXNzX2V4YW1wbGVzLnNwZWMudHMgcmVnaW9uPSdBY3RpdmF0ZWRSb3V0ZSd9XG4gICAqXG4gICAqIEBwYXJhbSB1cmwgVGhlIHRhcmdldCBvZiB0aGUgbmF2aWdhdGlvbi4gUGFzc2VkIHRvIGBSb3V0ZXIubmF2aWdhdGVCeVVybGAuXG4gICAqIEBwYXJhbSByZXF1aXJlZFJvdXRlZENvbXBvbmVudFR5cGUgQWZ0ZXIgbmF2aWdhdGlvbiBjb21wbGV0ZXMsIHRoZSByZXF1aXJlZCB0eXBlIGZvciB0aGVcbiAgICogICAgIGFjdGl2YXRlZCBjb21wb25lbnQgb2YgdGhlIGBSb3V0ZXJPdXRsZXRgLiBJZiB0aGUgb3V0bGV0IGlzIG5vdCBhY3RpdmF0ZWQgb3IgYSBkaWZmZXJlbnRcbiAgICogICAgIGNvbXBvbmVudCBpcyBhY3RpdmF0ZWQsIHRoaXMgZnVuY3Rpb24gd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICogQHJldHVybnMgVGhlIGFjdGl2YXRlZCBjb21wb25lbnQgaW5zdGFuY2Ugb2YgdGhlIGBSb3V0ZXJPdXRsZXRgIGFmdGVyIG5hdmlnYXRpb24gY29tcGxldGVzLlxuICAgKi9cbiAgYXN5bmMgbmF2aWdhdGVCeVVybDxUPih1cmw6IHN0cmluZywgcmVxdWlyZWRSb3V0ZWRDb21wb25lbnRUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxUPjtcbiAgYXN5bmMgbmF2aWdhdGVCeVVybDxUPih1cmw6IHN0cmluZywgcmVxdWlyZWRSb3V0ZWRDb21wb25lbnRUeXBlPzogVHlwZTxUPik6IFByb21pc2U8VHxudWxsPiB7XG4gICAgY29uc3Qgcm91dGVyID0gVGVzdEJlZC5pbmplY3QoUm91dGVyKTtcbiAgICBsZXQgcmVzb2x2ZUZuITogKCkgPT4gdm9pZDtcbiAgICBjb25zdCByZWRpcmVjdFRyYWNraW5nUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuICAgICAgcmVzb2x2ZUZuID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgICBhZnRlck5leHROYXZpZ2F0aW9uKFRlc3RCZWQuaW5qZWN0KFJvdXRlciksIHJlc29sdmVGbik7XG4gICAgYXdhaXQgcm91dGVyLm5hdmlnYXRlQnlVcmwodXJsKTtcbiAgICBhd2FpdCByZWRpcmVjdFRyYWNraW5nUHJvbWlzZTtcbiAgICB0aGlzLmZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGNvbnN0IG91dGxldCA9ICh0aGlzLmZpeHR1cmUuY29tcG9uZW50SW5zdGFuY2UgYXMgUm9vdENtcCkub3V0bGV0O1xuICAgIC8vIFRoZSBvdXRsZXQgbWlnaHQgbm90IGJlIGFjdGl2YXRlZCBpZiB0aGUgdXNlciBpcyB0ZXN0aW5nIGEgbmF2aWdhdGlvbiBmb3IgYSBndWFyZCB0aGF0XG4gICAgLy8gcmVqZWN0c1xuICAgIGlmIChvdXRsZXQgJiYgb3V0bGV0LmlzQWN0aXZhdGVkICYmIG91dGxldC5hY3RpdmF0ZWRSb3V0ZS5jb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IGFjdGl2YXRlZENvbXBvbmVudCA9IG91dGxldC5jb21wb25lbnQ7XG4gICAgICBpZiAocmVxdWlyZWRSb3V0ZWRDb21wb25lbnRUeXBlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAhKGFjdGl2YXRlZENvbXBvbmVudCBpbnN0YW5jZW9mIHJlcXVpcmVkUm91dGVkQ29tcG9uZW50VHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHJvdXRlZCBjb21wb25lbnQgdHlwZS4gRXhwZWN0ZWQgJHtcbiAgICAgICAgICAgIHJlcXVpcmVkUm91dGVkQ29tcG9uZW50VHlwZS5uYW1lfSBidXQgZ290ICR7YWN0aXZhdGVkQ29tcG9uZW50LmNvbnN0cnVjdG9yLm5hbWV9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0aXZhdGVkQ29tcG9uZW50IGFzIFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChyZXF1aXJlZFJvdXRlZENvbXBvbmVudFR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgcm91dGVkIGNvbXBvbmVudCB0eXBlLiBFeHBlY3RlZCAke1xuICAgICAgICAgICAgcmVxdWlyZWRSb3V0ZWRDb21wb25lbnRUeXBlLm5hbWV9IGJ1dCB0aGUgbmF2aWdhdGlvbiBkaWQgbm90IGFjdGl2YXRlIGFueSBjb21wb25lbnQuYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==