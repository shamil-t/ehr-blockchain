/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '../directives/router_outlet';
import * as i0 from "@angular/core";
/**
 * This component is used internally within the router to be a placeholder when an empty
 * router-outlet is needed. For example, with a config such as:
 *
 * `{path: 'parent', outlet: 'nav', children: [...]}`
 *
 * In order to render, there needs to be a component on this config, which will default
 * to this `EmptyOutletComponent`.
 */
export class ɵEmptyOutletComponent {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ɵEmptyOutletComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.2.12", type: ɵEmptyOutletComponent, isStandalone: true, selector: "ng-component", ngImport: i0, template: `<router-outlet></router-outlet>`, isInline: true, dependencies: [{ kind: "directive", type: RouterOutlet, selector: "router-outlet", inputs: ["name"], outputs: ["activate", "deactivate", "attach", "detach"], exportAs: ["outlet"] }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ɵEmptyOutletComponent, decorators: [{
            type: Component,
            args: [{
                    template: `<router-outlet></router-outlet>`,
                    imports: [RouterOutlet],
                    standalone: true,
                }]
        }] });
export { ɵEmptyOutletComponent as EmptyOutletComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlfb3V0bGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9jb21wb25lbnRzL2VtcHR5X291dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXhDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQzs7QUFFekQ7Ozs7Ozs7O0dBUUc7QUFNSCxNQUFNLE9BQU8scUJBQXFCO3lIQUFyQixxQkFBcUI7NkdBQXJCLHFCQUFxQix3RUFKdEIsaUNBQWlDLDREQUNqQyxZQUFZOztzR0FHWCxxQkFBcUI7a0JBTGpDLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGlDQUFpQztvQkFDM0MsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDO29CQUN2QixVQUFVLEVBQUUsSUFBSTtpQkFDakI7O0FBSUQsT0FBTyxFQUFDLHFCQUFxQixJQUFJLG9CQUFvQixFQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1JvdXRlck91dGxldH0gZnJvbSAnLi4vZGlyZWN0aXZlcy9yb3V0ZXJfb3V0bGV0JztcblxuLyoqXG4gKiBUaGlzIGNvbXBvbmVudCBpcyB1c2VkIGludGVybmFsbHkgd2l0aGluIHRoZSByb3V0ZXIgdG8gYmUgYSBwbGFjZWhvbGRlciB3aGVuIGFuIGVtcHR5XG4gKiByb3V0ZXItb3V0bGV0IGlzIG5lZWRlZC4gRm9yIGV4YW1wbGUsIHdpdGggYSBjb25maWcgc3VjaCBhczpcbiAqXG4gKiBge3BhdGg6ICdwYXJlbnQnLCBvdXRsZXQ6ICduYXYnLCBjaGlsZHJlbjogWy4uLl19YFxuICpcbiAqIEluIG9yZGVyIHRvIHJlbmRlciwgdGhlcmUgbmVlZHMgdG8gYmUgYSBjb21wb25lbnQgb24gdGhpcyBjb25maWcsIHdoaWNoIHdpbGwgZGVmYXVsdFxuICogdG8gdGhpcyBgRW1wdHlPdXRsZXRDb21wb25lbnRgLlxuICovXG5AQ29tcG9uZW50KHtcbiAgdGVtcGxhdGU6IGA8cm91dGVyLW91dGxldD48L3JvdXRlci1vdXRsZXQ+YCxcbiAgaW1wb3J0czogW1JvdXRlck91dGxldF0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIMm1RW1wdHlPdXRsZXRDb21wb25lbnQge1xufVxuXG5leHBvcnQge8m1RW1wdHlPdXRsZXRDb21wb25lbnQgYXMgRW1wdHlPdXRsZXRDb21wb25lbnR9O1xuIl19