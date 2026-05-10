/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createNgModule, Directive, Injector, Input, NgModuleFactory, NgModuleRef, Type, ViewContainerRef } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Instantiates a {@link Component} type and inserts its Host View into the current View.
 * `NgComponentOutlet` provides a declarative approach for dynamic component creation.
 *
 * `NgComponentOutlet` requires a component type, if a falsy value is set the view will clear and
 * any existing component will be destroyed.
 *
 * @usageNotes
 *
 * ### Fine tune control
 *
 * You can control the component creation process by using the following optional attributes:
 *
 * * `ngComponentOutletInputs`: Optional component inputs object, which will be bind to the
 * component.
 *
 * * `ngComponentOutletInjector`: Optional custom {@link Injector} that will be used as parent for
 * the Component. Defaults to the injector of the current view container.
 *
 * * `ngComponentOutletContent`: Optional list of projectable nodes to insert into the content
 * section of the component, if it exists.
 *
 * * `ngComponentOutletNgModule`: Optional NgModule class reference to allow loading another
 * module dynamically, then loading a component from that module.
 *
 * * `ngComponentOutletNgModuleFactory`: Deprecated config option that allows providing optional
 * NgModule factory to allow loading another module dynamically, then loading a component from that
 * module. Use `ngComponentOutletNgModule` instead.
 *
 * ### Syntax
 *
 * Simple
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression"></ng-container>
 * ```
 *
 * With inputs
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression;
 *                                   inputs: inputsExpression;">
 * </ng-container>
 * ```
 *
 * Customized injector/content
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression;
 *                                   injector: injectorExpression;
 *                                   content: contentNodesExpression;">
 * </ng-container>
 * ```
 *
 * Customized NgModule reference
 * ```
 * <ng-container *ngComponentOutlet="componentTypeExpression;
 *                                   ngModule: ngModuleClass;">
 * </ng-container>
 * ```
 *
 * ### A simple example
 *
 * {@example common/ngComponentOutlet/ts/module.ts region='SimpleExample'}
 *
 * A more complete example with additional options:
 *
 * {@example common/ngComponentOutlet/ts/module.ts region='CompleteExample'}
 *
 * @publicApi
 * @ngModule CommonModule
 */
export class NgComponentOutlet {
    constructor(_viewContainerRef) {
        this._viewContainerRef = _viewContainerRef;
        this.ngComponentOutlet = null;
        /**
         * A helper data structure that allows us to track inputs that were part of the
         * ngComponentOutletInputs expression. Tracking inputs is necessary for proper removal of ones
         * that are no longer referenced.
         */
        this._inputsUsed = new Map();
    }
    _needToReCreateNgModuleInstance(changes) {
        // Note: square brackets property accessor is safe for Closure compiler optimizations (the
        // `changes` argument of the `ngOnChanges` lifecycle hook retains the names of the fields that
        // were changed).
        return changes['ngComponentOutletNgModule'] !== undefined ||
            changes['ngComponentOutletNgModuleFactory'] !== undefined;
    }
    _needToReCreateComponentInstance(changes) {
        // Note: square brackets property accessor is safe for Closure compiler optimizations (the
        // `changes` argument of the `ngOnChanges` lifecycle hook retains the names of the fields that
        // were changed).
        return changes['ngComponentOutlet'] !== undefined ||
            changes['ngComponentOutletContent'] !== undefined ||
            changes['ngComponentOutletInjector'] !== undefined ||
            this._needToReCreateNgModuleInstance(changes);
    }
    /** @nodoc */
    ngOnChanges(changes) {
        if (this._needToReCreateComponentInstance(changes)) {
            this._viewContainerRef.clear();
            this._inputsUsed.clear();
            this._componentRef = undefined;
            if (this.ngComponentOutlet) {
                const injector = this.ngComponentOutletInjector || this._viewContainerRef.parentInjector;
                if (this._needToReCreateNgModuleInstance(changes)) {
                    this._moduleRef?.destroy();
                    if (this.ngComponentOutletNgModule) {
                        this._moduleRef =
                            createNgModule(this.ngComponentOutletNgModule, getParentInjector(injector));
                    }
                    else if (this.ngComponentOutletNgModuleFactory) {
                        this._moduleRef =
                            this.ngComponentOutletNgModuleFactory.create(getParentInjector(injector));
                    }
                    else {
                        this._moduleRef = undefined;
                    }
                }
                this._componentRef = this._viewContainerRef.createComponent(this.ngComponentOutlet, {
                    injector,
                    ngModuleRef: this._moduleRef,
                    projectableNodes: this.ngComponentOutletContent,
                });
            }
        }
    }
    /** @nodoc */
    ngDoCheck() {
        if (this._componentRef) {
            if (this.ngComponentOutletInputs) {
                for (const inputName of Object.keys(this.ngComponentOutletInputs)) {
                    this._inputsUsed.set(inputName, true);
                }
            }
            this._applyInputStateDiff(this._componentRef);
        }
    }
    /** @nodoc */
    ngOnDestroy() {
        this._moduleRef?.destroy();
    }
    _applyInputStateDiff(componentRef) {
        for (const [inputName, touched] of this._inputsUsed) {
            if (!touched) {
                // The input that was previously active no longer exists and needs to be set to undefined.
                componentRef.setInput(inputName, undefined);
                this._inputsUsed.delete(inputName);
            }
            else {
                // Since touched is true, it can be asserted that the inputs object is not empty.
                componentRef.setInput(inputName, this.ngComponentOutletInputs[inputName]);
                this._inputsUsed.set(inputName, false);
            }
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgComponentOutlet, deps: [{ token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: NgComponentOutlet, isStandalone: true, selector: "[ngComponentOutlet]", inputs: { ngComponentOutlet: "ngComponentOutlet", ngComponentOutletInputs: "ngComponentOutletInputs", ngComponentOutletInjector: "ngComponentOutletInjector", ngComponentOutletContent: "ngComponentOutletContent", ngComponentOutletNgModule: "ngComponentOutletNgModule", ngComponentOutletNgModuleFactory: "ngComponentOutletNgModuleFactory" }, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgComponentOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngComponentOutlet]',
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }]; }, propDecorators: { ngComponentOutlet: [{
                type: Input
            }], ngComponentOutletInputs: [{
                type: Input
            }], ngComponentOutletInjector: [{
                type: Input
            }], ngComponentOutletContent: [{
                type: Input
            }], ngComponentOutletNgModule: [{
                type: Input
            }], ngComponentOutletNgModuleFactory: [{
                type: Input
            }] } });
// Helper function that returns an Injector instance of a parent NgModule.
function getParentInjector(injector) {
    const parentNgModule = injector.get(NgModuleRef);
    return parentNgModule.injector;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY29tcG9uZW50X291dGxldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9zcmMvZGlyZWN0aXZlcy9uZ19jb21wb25lbnRfb3V0bGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBZSxjQUFjLEVBQUUsU0FBUyxFQUFXLFFBQVEsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBdUMsSUFBSSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUUzTDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FvRUc7QUFLSCxNQUFNLE9BQU8saUJBQWlCO0lBdUI1QixZQUFvQixpQkFBbUM7UUFBbkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQXRCOUMsc0JBQWlCLEdBQW1CLElBQUksQ0FBQztRQWVsRDs7OztXQUlHO1FBQ0ssZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztJQUVTLENBQUM7SUFFbkQsK0JBQStCLENBQUMsT0FBc0I7UUFDNUQsMEZBQTBGO1FBQzFGLDhGQUE4RjtRQUM5RixpQkFBaUI7UUFDakIsT0FBTyxPQUFPLENBQUMsMkJBQTJCLENBQUMsS0FBSyxTQUFTO1lBQ3JELE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLFNBQVMsQ0FBQztJQUNoRSxDQUFDO0lBRU8sZ0NBQWdDLENBQUMsT0FBc0I7UUFDN0QsMEZBQTBGO1FBQzFGLDhGQUE4RjtRQUM5RixpQkFBaUI7UUFDakIsT0FBTyxPQUFPLENBQUMsbUJBQW1CLENBQUMsS0FBSyxTQUFTO1lBQzdDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLFNBQVM7WUFDakQsT0FBTyxDQUFDLDJCQUEyQixDQUFDLEtBQUssU0FBUztZQUNsRCxJQUFJLENB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bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHFCQUFxQjtvQkFDL0IsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO3VHQUVVLGlCQUFpQjtzQkFBekIsS0FBSztnQkFFRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBQ0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUNHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBSUcsZ0NBQWdDO3NCQUF4QyxLQUFLOztBQWtHUiwwRUFBMEU7QUFDMUUsU0FBUyxpQkFBaUIsQ0FBQyxRQUFrQjtJQUMzQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELE9BQU8sY0FBYyxDQUFDLFFBQVEsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50UmVmLCBjcmVhdGVOZ01vZHVsZSwgRGlyZWN0aXZlLCBEb0NoZWNrLCBJbmplY3RvciwgSW5wdXQsIE5nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWYsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBTaW1wbGVDaGFuZ2VzLCBUeXBlLCBWaWV3Q29udGFpbmVyUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYSB7QGxpbmsgQ29tcG9uZW50fSB0eXBlIGFuZCBpbnNlcnRzIGl0cyBIb3N0IFZpZXcgaW50byB0aGUgY3VycmVudCBWaWV3LlxuICogYE5nQ29tcG9uZW50T3V0bGV0YCBwcm92aWRlcyBhIGRlY2xhcmF0aXZlIGFwcHJvYWNoIGZvciBkeW5hbWljIGNvbXBvbmVudCBjcmVhdGlvbi5cbiAqXG4gKiBgTmdDb21wb25lbnRPdXRsZXRgIHJlcXVpcmVzIGEgY29tcG9uZW50IHR5cGUsIGlmIGEgZmFsc3kgdmFsdWUgaXMgc2V0IHRoZSB2aWV3IHdpbGwgY2xlYXIgYW5kXG4gKiBhbnkgZXhpc3RpbmcgY29tcG9uZW50IHdpbGwgYmUgZGVzdHJveWVkLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIEZpbmUgdHVuZSBjb250cm9sXG4gKlxuICogWW91IGNhbiBjb250cm9sIHRoZSBjb21wb25lbnQgY3JlYXRpb24gcHJvY2VzcyBieSB1c2luZyB0aGUgZm9sbG93aW5nIG9wdGlvbmFsIGF0dHJpYnV0ZXM6XG4gKlxuICogKiBgbmdDb21wb25lbnRPdXRsZXRJbnB1dHNgOiBPcHRpb25hbCBjb21wb25lbnQgaW5wdXRzIG9iamVjdCwgd2hpY2ggd2lsbCBiZSBiaW5kIHRvIHRoZVxuICogY29tcG9uZW50LlxuICpcbiAqICogYG5nQ29tcG9uZW50T3V0bGV0SW5qZWN0b3JgOiBPcHRpb25hbCBjdXN0b20ge0BsaW5rIEluamVjdG9yfSB0aGF0IHdpbGwgYmUgdXNlZCBhcyBwYXJlbnQgZm9yXG4gKiB0aGUgQ29tcG9uZW50LiBEZWZhdWx0cyB0byB0aGUgaW5qZWN0b3Igb2YgdGhlIGN1cnJlbnQgdmlldyBjb250YWluZXIuXG4gKlxuICogKiBgbmdDb21wb25lbnRPdXRsZXRDb250ZW50YDogT3B0aW9uYWwgbGlzdCBvZiBwcm9qZWN0YWJsZSBub2RlcyB0byBpbnNlcnQgaW50byB0aGUgY29udGVudFxuICogc2VjdGlvbiBvZiB0aGUgY29tcG9uZW50LCBpZiBpdCBleGlzdHMuXG4gKlxuICogKiBgbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZWA6IE9wdGlvbmFsIE5nTW9kdWxlIGNsYXNzIHJlZmVyZW5jZSB0byBhbGxvdyBsb2FkaW5nIGFub3RoZXJcbiAqIG1vZHVsZSBkeW5hbWljYWxseSwgdGhlbiBsb2FkaW5nIGEgY29tcG9uZW50IGZyb20gdGhhdCBtb2R1bGUuXG4gKlxuICogKiBgbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZUZhY3RvcnlgOiBEZXByZWNhdGVkIGNvbmZpZyBvcHRpb24gdGhhdCBhbGxvd3MgcHJvdmlkaW5nIG9wdGlvbmFsXG4gKiBOZ01vZHVsZSBmYWN0b3J5IHRvIGFsbG93IGxvYWRpbmcgYW5vdGhlciBtb2R1bGUgZHluYW1pY2FsbHksIHRoZW4gbG9hZGluZyBhIGNvbXBvbmVudCBmcm9tIHRoYXRcbiAqIG1vZHVsZS4gVXNlIGBuZ0NvbXBvbmVudE91dGxldE5nTW9kdWxlYCBpbnN0ZWFkLlxuICpcbiAqICMjIyBTeW50YXhcbiAqXG4gKiBTaW1wbGVcbiAqIGBgYFxuICogPG5nLWNvbnRhaW5lciAqbmdDb21wb25lbnRPdXRsZXQ9XCJjb21wb25lbnRUeXBlRXhwcmVzc2lvblwiPjwvbmctY29udGFpbmVyPlxuICogYGBgXG4gKlxuICogV2l0aCBpbnB1dHNcbiAqIGBgYFxuICogPG5nLWNvbnRhaW5lciAqbmdDb21wb25lbnRPdXRsZXQ9XCJjb21wb25lbnRUeXBlRXhwcmVzc2lvbjtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHM6IGlucHV0c0V4cHJlc3Npb247XCI+XG4gKiA8L25nLWNvbnRhaW5lcj5cbiAqIGBgYFxuICpcbiAqIEN1c3RvbWl6ZWQgaW5qZWN0b3IvY29udGVudFxuICogYGBgXG4gKiA8bmctY29udGFpbmVyICpuZ0NvbXBvbmVudE91dGxldD1cImNvbXBvbmVudFR5cGVFeHByZXNzaW9uO1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9yOiBpbmplY3RvckV4cHJlc3Npb247XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogY29udGVudE5vZGVzRXhwcmVzc2lvbjtcIj5cbiAqIDwvbmctY29udGFpbmVyPlxuICogYGBgXG4gKlxuICogQ3VzdG9taXplZCBOZ01vZHVsZSByZWZlcmVuY2VcbiAqIGBgYFxuICogPG5nLWNvbnRhaW5lciAqbmdDb21wb25lbnRPdXRsZXQ9XCJjb21wb25lbnRUeXBlRXhwcmVzc2lvbjtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZ01vZHVsZTogbmdNb2R1bGVDbGFzcztcIj5cbiAqIDwvbmctY29udGFpbmVyPlxuICogYGBgXG4gKlxuICogIyMjIEEgc2ltcGxlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29tbW9uL25nQ29tcG9uZW50T3V0bGV0L3RzL21vZHVsZS50cyByZWdpb249J1NpbXBsZUV4YW1wbGUnfVxuICpcbiAqIEEgbW9yZSBjb21wbGV0ZSBleGFtcGxlIHdpdGggYWRkaXRpb25hbCBvcHRpb25zOlxuICpcbiAqIHtAZXhhbXBsZSBjb21tb24vbmdDb21wb25lbnRPdXRsZXQvdHMvbW9kdWxlLnRzIHJlZ2lvbj0nQ29tcGxldGVFeGFtcGxlJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tuZ0NvbXBvbmVudE91dGxldF0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBOZ0NvbXBvbmVudE91dGxldCBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgRG9DaGVjaywgT25EZXN0cm95IHtcbiAgQElucHV0KCkgbmdDb21wb25lbnRPdXRsZXQ6IFR5cGU8YW55PnxudWxsID0gbnVsbDtcblxuICBASW5wdXQoKSBuZ0NvbXBvbmVudE91dGxldElucHV0cz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBASW5wdXQoKSBuZ0NvbXBvbmVudE91dGxldEluamVjdG9yPzogSW5qZWN0b3I7XG4gIEBJbnB1dCgpIG5nQ29tcG9uZW50T3V0bGV0Q29udGVudD86IGFueVtdW107XG5cbiAgQElucHV0KCkgbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZT86IFR5cGU8YW55PjtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgaW5wdXQgaXMgZGVwcmVjYXRlZCwgdXNlIGBuZ0NvbXBvbmVudE91dGxldE5nTW9kdWxlYCBpbnN0ZWFkLlxuICAgKi9cbiAgQElucHV0KCkgbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZUZhY3Rvcnk/OiBOZ01vZHVsZUZhY3Rvcnk8YW55PjtcblxuICBwcml2YXRlIF9jb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+fHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfbW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQSBoZWxwZXIgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBhbGxvd3MgdXMgdG8gdHJhY2sgaW5wdXRzIHRoYXQgd2VyZSBwYXJ0IG9mIHRoZVxuICAgKiBuZ0NvbXBvbmVudE91dGxldElucHV0cyBleHByZXNzaW9uLiBUcmFja2luZyBpbnB1dHMgaXMgbmVjZXNzYXJ5IGZvciBwcm9wZXIgcmVtb3ZhbCBvZiBvbmVzXG4gICAqIHRoYXQgYXJlIG5vIGxvbmdlciByZWZlcmVuY2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5wdXRzVXNlZCA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFuPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHt9XG5cbiAgcHJpdmF0ZSBfbmVlZFRvUmVDcmVhdGVOZ01vZHVsZUluc3RhbmNlKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiBib29sZWFuIHtcbiAgICAvLyBOb3RlOiBzcXVhcmUgYnJhY2tldHMgcHJvcGVydHkgYWNjZXNzb3IgaXMgc2FmZSBmb3IgQ2xvc3VyZSBjb21waWxlciBvcHRpbWl6YXRpb25zICh0aGVcbiAgICAvLyBgY2hhbmdlc2AgYXJndW1lbnQgb2YgdGhlIGBuZ09uQ2hhbmdlc2AgbGlmZWN5Y2xlIGhvb2sgcmV0YWlucyB0aGUgbmFtZXMgb2YgdGhlIGZpZWxkcyB0aGF0XG4gICAgLy8gd2VyZSBjaGFuZ2VkKS5cbiAgICByZXR1cm4gY2hhbmdlc1snbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZSddICE9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgY2hhbmdlc1snbmdDb21wb25lbnRPdXRsZXROZ01vZHVsZUZhY3RvcnknXSAhPT0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfbmVlZFRvUmVDcmVhdGVDb21wb25lbnRJbnN0YW5jZShjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogYm9vbGVhbiB7XG4gICAgLy8gTm90ZTogc3F1YXJlIGJyYWNrZXRzIHByb3BlcnR5IGFjY2Vzc29yIGlzIHNhZmUgZm9yIENsb3N1cmUgY29tcGlsZXIgb3B0aW1pemF0aW9ucyAodGhlXG4gICAgLy8gYGNoYW5nZXNgIGFyZ3VtZW50IG9mIHRoZSBgbmdPbkNoYW5nZXNgIGxpZmVjeWNsZSBob29rIHJldGFpbnMgdGhlIG5hbWVzIG9mIHRoZSBmaWVsZHMgdGhhdFxuICAgIC8vIHdlcmUgY2hhbmdlZCkuXG4gICAgcmV0dXJuIGNoYW5nZXNbJ25nQ29tcG9uZW50T3V0bGV0J10gIT09IHVuZGVmaW5lZCB8fFxuICAgICAgICBjaGFuZ2VzWyduZ0NvbXBvbmVudE91dGxldENvbnRlbnQnXSAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIGNoYW5nZXNbJ25nQ29tcG9uZW50T3V0bGV0SW5qZWN0b3InXSAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIHRoaXMuX25lZWRUb1JlQ3JlYXRlTmdNb2R1bGVJbnN0YW5jZShjaGFuZ2VzKTtcbiAgfVxuXG4gIC8qKiBAbm9kb2MgKi9cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGlmICh0aGlzLl9uZWVkVG9SZUNyZWF0ZUNvbXBvbmVudEluc3RhbmNlKGNoYW5nZXMpKSB7XG4gICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNsZWFyKCk7XG4gICAgICB0aGlzLl9pbnB1dHNVc2VkLmNsZWFyKCk7XG4gICAgICB0aGlzLl9jb21wb25lbnRSZWYgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGlmICh0aGlzLm5nQ29tcG9uZW50T3V0bGV0KSB7XG4gICAgICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5uZ0NvbXBvbmVudE91dGxldEluamVjdG9yIHx8IHRoaXMuX3ZpZXdDb250YWluZXJSZWYucGFyZW50SW5qZWN0b3I7XG5cbiAgICAgICAgaWYgKHRoaXMuX25lZWRUb1JlQ3JlYXRlTmdNb2R1bGVJbnN0YW5jZShjaGFuZ2VzKSkge1xuICAgICAgICAgIHRoaXMuX21vZHVsZVJlZj8uZGVzdHJveSgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMubmdDb21wb25lbnRPdXRsZXROZ01vZHVsZSkge1xuICAgICAgICAgICAgdGhpcy5fbW9kdWxlUmVmID1cbiAgICAgICAgICAgICAgICBjcmVhdGVOZ01vZHVsZSh0aGlzLm5nQ29tcG9uZW50T3V0bGV0TmdNb2R1bGUsIGdldFBhcmVudEluamVjdG9yKGluamVjdG9yKSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm5nQ29tcG9uZW50T3V0bGV0TmdNb2R1bGVGYWN0b3J5KSB7XG4gICAgICAgICAgICB0aGlzLl9tb2R1bGVSZWYgPVxuICAgICAgICAgICAgICAgIHRoaXMubmdDb21wb25lbnRPdXRsZXROZ01vZHVsZUZhY3RvcnkuY3JlYXRlKGdldFBhcmVudEluamVjdG9yKGluamVjdG9yKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21vZHVsZVJlZiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb21wb25lbnRSZWYgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudCh0aGlzLm5nQ29tcG9uZW50T3V0bGV0LCB7XG4gICAgICAgICAgaW5qZWN0b3IsXG4gICAgICAgICAgbmdNb2R1bGVSZWY6IHRoaXMuX21vZHVsZVJlZixcbiAgICAgICAgICBwcm9qZWN0YWJsZU5vZGVzOiB0aGlzLm5nQ29tcG9uZW50T3V0bGV0Q29udGVudCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2RvYyAqL1xuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX2NvbXBvbmVudFJlZikge1xuICAgICAgaWYgKHRoaXMubmdDb21wb25lbnRPdXRsZXRJbnB1dHMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpbnB1dE5hbWUgb2YgT2JqZWN0LmtleXModGhpcy5uZ0NvbXBvbmVudE91dGxldElucHV0cykpIHtcbiAgICAgICAgICB0aGlzLl9pbnB1dHNVc2VkLnNldChpbnB1dE5hbWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2FwcGx5SW5wdXRTdGF0ZURpZmYodGhpcy5fY29tcG9uZW50UmVmKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX21vZHVsZVJlZj8uZGVzdHJveSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlJbnB1dFN0YXRlRGlmZihjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjx1bmtub3duPikge1xuICAgIGZvciAoY29uc3QgW2lucHV0TmFtZSwgdG91Y2hlZF0gb2YgdGhpcy5faW5wdXRzVXNlZCkge1xuICAgICAgaWYgKCF0b3VjaGVkKSB7XG4gICAgICAgIC8vIFRoZSBpbnB1dCB0aGF0IHdhcyBwcmV2aW91c2x5IGFjdGl2ZSBubyBsb25nZXIgZXhpc3RzIGFuZCBuZWVkcyB0byBiZSBzZXQgdG8gdW5kZWZpbmVkLlxuICAgICAgICBjb21wb25lbnRSZWYuc2V0SW5wdXQoaW5wdXROYW1lLCB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLl9pbnB1dHNVc2VkLmRlbGV0ZShpbnB1dE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2luY2UgdG91Y2hlZCBpcyB0cnVlLCBpdCBjYW4gYmUgYXNzZXJ0ZWQgdGhhdCB0aGUgaW5wdXRzIG9iamVjdCBpcyBub3QgZW1wdHkuXG4gICAgICAgIGNvbXBvbmVudFJlZi5zZXRJbnB1dChpbnB1dE5hbWUsIHRoaXMubmdDb21wb25lbnRPdXRsZXRJbnB1dHMhW2lucHV0TmFtZV0pO1xuICAgICAgICB0aGlzLl9pbnB1dHNVc2VkLnNldChpbnB1dE5hbWUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBJbmplY3RvciBpbnN0YW5jZSBvZiBhIHBhcmVudCBOZ01vZHVsZS5cbmZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3Rvcik6IEluamVjdG9yIHtcbiAgY29uc3QgcGFyZW50TmdNb2R1bGUgPSBpbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICByZXR1cm4gcGFyZW50TmdNb2R1bGUuaW5qZWN0b3I7XG59XG4iXX0=