/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input, ViewContainerRef } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @ngModule CommonModule
 *
 * @description
 *
 * Inserts an embedded view from a prepared `TemplateRef`.
 *
 * You can attach a context object to the `EmbeddedViewRef` by setting `[ngTemplateOutletContext]`.
 * `[ngTemplateOutletContext]` should be an object, the object's keys will be available for binding
 * by the local template `let` declarations.
 *
 * @usageNotes
 * ```
 * <ng-container *ngTemplateOutlet="templateRefExp; context: contextExp"></ng-container>
 * ```
 *
 * Using the key `$implicit` in the context object will set its value as default.
 *
 * ### Example
 *
 * {@example common/ngTemplateOutlet/ts/module.ts region='NgTemplateOutlet'}
 *
 * @publicApi
 */
export class NgTemplateOutlet {
    constructor(_viewContainerRef) {
        this._viewContainerRef = _viewContainerRef;
        this._viewRef = null;
        /**
         * A context object to attach to the {@link EmbeddedViewRef}. This should be an
         * object, the object's keys will be available for binding by the local template `let`
         * declarations.
         * Using the key `$implicit` in the context object will set its value as default.
         */
        this.ngTemplateOutletContext = null;
        /**
         * A string defining the template reference and optionally the context object for the template.
         */
        this.ngTemplateOutlet = null;
        /** Injector to be used within the embedded view. */
        this.ngTemplateOutletInjector = null;
    }
    /** @nodoc */
    ngOnChanges(changes) {
        if (changes['ngTemplateOutlet'] || changes['ngTemplateOutletInjector']) {
            const viewContainerRef = this._viewContainerRef;
            if (this._viewRef) {
                viewContainerRef.remove(viewContainerRef.indexOf(this._viewRef));
            }
            if (this.ngTemplateOutlet) {
                const { ngTemplateOutlet: template, ngTemplateOutletContext: context, ngTemplateOutletInjector: injector, } = this;
                this._viewRef =
                    viewContainerRef.createEmbeddedView(template, context, injector ? { injector } : undefined);
            }
            else {
                this._viewRef = null;
            }
        }
        else if (this._viewRef && changes['ngTemplateOutletContext'] && this.ngTemplateOutletContext) {
            this._viewRef.context = this.ngTemplateOutletContext;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgTemplateOutlet, deps: [{ token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: NgTemplateOutlet, isStandalone: true, selector: "[ngTemplateOutlet]", inputs: { ngTemplateOutletContext: "ngTemplateOutletContext", ngTemplateOutlet: "ngTemplateOutlet", ngTemplateOutletInjector: "ngTemplateOutletInjector" }, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgTemplateOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngTemplateOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }]; }, propDecorators: { ngTemplateOutletContext: [{
                type: Input
            }], ngTemplateOutlet: [{
                type: Input
            }], ngTemplateOutletInjector: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfdGVtcGxhdGVfb3V0bGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9kaXJlY3RpdmVzL25nX3RlbXBsYXRlX291dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUE2QixLQUFLLEVBQXlDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUVuSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFLSCxNQUFNLE9BQU8sZ0JBQWdCO0lBbUIzQixZQUFvQixpQkFBbUM7UUFBbkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQWxCL0MsYUFBUSxHQUE0QixJQUFJLENBQUM7UUFFakQ7Ozs7O1dBS0c7UUFDYSw0QkFBdUIsR0FBVyxJQUFJLENBQUM7UUFFdkQ7O1dBRUc7UUFDYSxxQkFBZ0IsR0FBd0IsSUFBSSxDQUFDO1FBRTdELG9EQUFvRDtRQUNwQyw2QkFBd0IsR0FBa0IsSUFBSSxDQUFDO0lBRUwsQ0FBQztJQUUzRCxhQUFhO0lBQ2IsV0FBVyxDQUFDLE9BQXNCO1FBQ2hDLElBQUksT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksT0FBTyxDQUFDLDBCQUEwQixDQUFDLEVBQUU7WUFDdEUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFFaEQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNqQixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2xFO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3pCLE1BQU0sRUFDSixnQkFBZ0IsRUFBRSxRQUFRLEVBQzFCLHVCQUF1QixFQUFFLE9BQU8sRUFDaEMsd0JBQXdCLEVBQUUsUUFBUSxHQUNuQyxHQUFHLElBQUksQ0FBQztnQkFDVCxJQUFJLENBQUMsUUFBUTtvQkFDVCxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FDL0IsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBdUIsQ0FBQzthQUNyRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtTQUNGO2FBQU0sSUFDSCxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUN2RixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7U0FDdEQ7SUFDSCxDQUFDO3lIQTlDVSxnQkFBZ0I7NkdBQWhCLGdCQUFnQjs7c0dBQWhCLGdCQUFnQjtrQkFKNUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsb0JBQW9CO29CQUM5QixVQUFVLEVBQUUsSUFBSTtpQkFDakI7dUdBVWlCLHVCQUF1QjtzQkFBdEMsS0FBSztnQkFLVSxnQkFBZ0I7c0JBQS9CLEtBQUs7Z0JBR1Usd0JBQXdCO3NCQUF2QyxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBFbWJlZGRlZFZpZXdSZWYsIEluamVjdG9yLCBJbnB1dCwgT25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzLCBUZW1wbGF0ZVJlZiwgVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQG5nTW9kdWxlIENvbW1vbk1vZHVsZVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEluc2VydHMgYW4gZW1iZWRkZWQgdmlldyBmcm9tIGEgcHJlcGFyZWQgYFRlbXBsYXRlUmVmYC5cbiAqXG4gKiBZb3UgY2FuIGF0dGFjaCBhIGNvbnRleHQgb2JqZWN0IHRvIHRoZSBgRW1iZWRkZWRWaWV3UmVmYCBieSBzZXR0aW5nIGBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdYC5cbiAqIGBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdYCBzaG91bGQgYmUgYW4gb2JqZWN0LCB0aGUgb2JqZWN0J3Mga2V5cyB3aWxsIGJlIGF2YWlsYWJsZSBmb3IgYmluZGluZ1xuICogYnkgdGhlIGxvY2FsIHRlbXBsYXRlIGBsZXRgIGRlY2xhcmF0aW9ucy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgXG4gKiA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGVSZWZFeHA7IGNvbnRleHQ6IGNvbnRleHRFeHBcIj48L25nLWNvbnRhaW5lcj5cbiAqIGBgYFxuICpcbiAqIFVzaW5nIHRoZSBrZXkgYCRpbXBsaWNpdGAgaW4gdGhlIGNvbnRleHQgb2JqZWN0IHdpbGwgc2V0IGl0cyB2YWx1ZSBhcyBkZWZhdWx0LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvbW1vbi9uZ1RlbXBsYXRlT3V0bGV0L3RzL21vZHVsZS50cyByZWdpb249J05nVGVtcGxhdGVPdXRsZXQnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW25nVGVtcGxhdGVPdXRsZXRdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTmdUZW1wbGF0ZU91dGxldDxDID0gdW5rbm93bj4gaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBwcml2YXRlIF92aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8Qz58bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29udGV4dCBvYmplY3QgdG8gYXR0YWNoIHRvIHRoZSB7QGxpbmsgRW1iZWRkZWRWaWV3UmVmfS4gVGhpcyBzaG91bGQgYmUgYW5cbiAgICogb2JqZWN0LCB0aGUgb2JqZWN0J3Mga2V5cyB3aWxsIGJlIGF2YWlsYWJsZSBmb3IgYmluZGluZyBieSB0aGUgbG9jYWwgdGVtcGxhdGUgYGxldGBcbiAgICogZGVjbGFyYXRpb25zLlxuICAgKiBVc2luZyB0aGUga2V5IGAkaW1wbGljaXRgIGluIHRoZSBjb250ZXh0IG9iamVjdCB3aWxsIHNldCBpdHMgdmFsdWUgYXMgZGVmYXVsdC5cbiAgICovXG4gIEBJbnB1dCgpIHB1YmxpYyBuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dDogQ3xudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogQSBzdHJpbmcgZGVmaW5pbmcgdGhlIHRlbXBsYXRlIHJlZmVyZW5jZSBhbmQgb3B0aW9uYWxseSB0aGUgY29udGV4dCBvYmplY3QgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIEBJbnB1dCgpIHB1YmxpYyBuZ1RlbXBsYXRlT3V0bGV0OiBUZW1wbGF0ZVJlZjxDPnxudWxsID0gbnVsbDtcblxuICAvKiogSW5qZWN0b3IgdG8gYmUgdXNlZCB3aXRoaW4gdGhlIGVtYmVkZGVkIHZpZXcuICovXG4gIEBJbnB1dCgpIHB1YmxpYyBuZ1RlbXBsYXRlT3V0bGV0SW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHt9XG5cbiAgLyoqIEBub2RvYyAqL1xuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKGNoYW5nZXNbJ25nVGVtcGxhdGVPdXRsZXQnXSB8fCBjaGFuZ2VzWyduZ1RlbXBsYXRlT3V0bGV0SW5qZWN0b3InXSkge1xuICAgICAgY29uc3Qgdmlld0NvbnRhaW5lclJlZiA9IHRoaXMuX3ZpZXdDb250YWluZXJSZWY7XG5cbiAgICAgIGlmICh0aGlzLl92aWV3UmVmKSB7XG4gICAgICAgIHZpZXdDb250YWluZXJSZWYucmVtb3ZlKHZpZXdDb250YWluZXJSZWYuaW5kZXhPZih0aGlzLl92aWV3UmVmKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5nVGVtcGxhdGVPdXRsZXQpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIG5nVGVtcGxhdGVPdXRsZXQ6IHRlbXBsYXRlLFxuICAgICAgICAgIG5nVGVtcGxhdGVPdXRsZXRDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgIG5nVGVtcGxhdGVPdXRsZXRJbmplY3RvcjogaW5qZWN0b3IsXG4gICAgICAgIH0gPSB0aGlzO1xuICAgICAgICB0aGlzLl92aWV3UmVmID1cbiAgICAgICAgICAgIHZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlLCBjb250ZXh0LCBpbmplY3RvciA/IHtpbmplY3Rvcn0gOiB1bmRlZmluZWQpIGFzIEVtYmVkZGVkVmlld1JlZjxDPjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ZpZXdSZWYgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRoaXMuX3ZpZXdSZWYgJiYgY2hhbmdlc1snbmdUZW1wbGF0ZU91dGxldENvbnRleHQnXSAmJiB0aGlzLm5nVGVtcGxhdGVPdXRsZXRDb250ZXh0KSB7XG4gICAgICB0aGlzLl92aWV3UmVmLmNvbnRleHQgPSB0aGlzLm5nVGVtcGxhdGVPdXRsZXRDb250ZXh0O1xuICAgIH1cbiAgfVxufVxuIl19