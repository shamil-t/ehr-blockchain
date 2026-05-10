/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input, IterableDiffers, TemplateRef, ViewContainerRef, ɵRuntimeError as RuntimeError } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @publicApi
 */
export class NgForOfContext {
    constructor($implicit, ngForOf, index, count) {
        this.$implicit = $implicit;
        this.ngForOf = ngForOf;
        this.index = index;
        this.count = count;
    }
    get first() {
        return this.index === 0;
    }
    get last() {
        return this.index === this.count - 1;
    }
    get even() {
        return this.index % 2 === 0;
    }
    get odd() {
        return !this.even;
    }
}
/**
 * A [structural directive](guide/structural-directives) that renders
 * a template for each item in a collection.
 * The directive is placed on an element, which becomes the parent
 * of the cloned templates.
 *
 * The `ngForOf` directive is generally used in the
 * [shorthand form](guide/structural-directives#asterisk) `*ngFor`.
 * In this form, the template to be rendered for each iteration is the content
 * of an anchor element containing the directive.
 *
 * The following example shows the shorthand syntax with some options,
 * contained in an `<li>` element.
 *
 * ```
 * <li *ngFor="let item of items; index as i; trackBy: trackByFn">...</li>
 * ```
 *
 * The shorthand form expands into a long form that uses the `ngForOf` selector
 * on an `<ng-template>` element.
 * The content of the `<ng-template>` element is the `<li>` element that held the
 * short-form directive.
 *
 * Here is the expanded version of the short-form example.
 *
 * ```
 * <ng-template ngFor let-item [ngForOf]="items" let-i="index" [ngForTrackBy]="trackByFn">
 *   <li>...</li>
 * </ng-template>
 * ```
 *
 * Angular automatically expands the shorthand syntax as it compiles the template.
 * The context for each embedded view is logically merged to the current component
 * context according to its lexical position.
 *
 * When using the shorthand syntax, Angular allows only [one structural directive
 * on an element](guide/structural-directives#one-per-element).
 * If you want to iterate conditionally, for example,
 * put the `*ngIf` on a container element that wraps the `*ngFor` element.
 * For further discussion, see
 * [Structural Directives](guide/structural-directives#one-per-element).
 *
 * @usageNotes
 *
 * ### Local variables
 *
 * `NgForOf` provides exported values that can be aliased to local variables.
 * For example:
 *
 *  ```
 * <li *ngFor="let user of users; index as i; first as isFirst">
 *    {{i}}/{{users.length}}. {{user}} <span *ngIf="isFirst">default</span>
 * </li>
 * ```
 *
 * The following exported values can be aliased to local variables:
 *
 * - `$implicit: T`: The value of the individual items in the iterable (`ngForOf`).
 * - `ngForOf: NgIterable<T>`: The value of the iterable expression. Useful when the expression is
 * more complex then a property access, for example when using the async pipe (`userStreams |
 * async`).
 * - `index: number`: The index of the current item in the iterable.
 * - `count: number`: The length of the iterable.
 * - `first: boolean`: True when the item is the first item in the iterable.
 * - `last: boolean`: True when the item is the last item in the iterable.
 * - `even: boolean`: True when the item has an even index in the iterable.
 * - `odd: boolean`: True when the item has an odd index in the iterable.
 *
 * ### Change propagation
 *
 * When the contents of the iterator changes, `NgForOf` makes the corresponding changes to the DOM:
 *
 * * When an item is added, a new instance of the template is added to the DOM.
 * * When an item is removed, its template instance is removed from the DOM.
 * * When items are reordered, their respective templates are reordered in the DOM.
 *
 * Angular uses object identity to track insertions and deletions within the iterator and reproduce
 * those changes in the DOM. This has important implications for animations and any stateful
 * controls that are present, such as `<input>` elements that accept user input. Inserted rows can
 * be animated in, deleted rows can be animated out, and unchanged rows retain any unsaved state
 * such as user input.
 * For more on animations, see [Transitions and Triggers](guide/transition-and-triggers).
 *
 * The identities of elements in the iterator can change while the data does not.
 * This can happen, for example, if the iterator is produced from an RPC to the server, and that
 * RPC is re-run. Even if the data hasn't changed, the second response produces objects with
 * different identities, and Angular must tear down the entire DOM and rebuild it (as if all old
 * elements were deleted and all new elements inserted).
 *
 * To avoid this expensive operation, you can customize the default tracking algorithm.
 * by supplying the `trackBy` option to `NgForOf`.
 * `trackBy` takes a function that has two arguments: `index` and `item`.
 * If `trackBy` is given, Angular tracks changes by the return value of the function.
 *
 * @see [Structural Directives](guide/structural-directives)
 * @ngModule CommonModule
 * @publicApi
 */
export class NgForOf {
    /**
     * The value of the iterable expression, which can be used as a
     * [template input variable](guide/structural-directives#shorthand).
     */
    set ngForOf(ngForOf) {
        this._ngForOf = ngForOf;
        this._ngForOfDirty = true;
    }
    /**
     * Specifies a custom `TrackByFunction` to compute the identity of items in an iterable.
     *
     * If a custom `TrackByFunction` is not provided, `NgForOf` will use the item's [object
     * identity](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
     * as the key.
     *
     * `NgForOf` uses the computed key to associate items in an iterable with DOM elements
     * it produces for these items.
     *
     * A custom `TrackByFunction` is useful to provide good user experience in cases when items in an
     * iterable rendered using `NgForOf` have a natural identifier (for example, custom ID or a
     * primary key), and this iterable could be updated with new object instances that still
     * represent the same underlying entity (for example, when data is re-fetched from the server,
     * and the iterable is recreated and re-rendered, but most of the data is still the same).
     *
     * @see {@link TrackByFunction}
     */
    set ngForTrackBy(fn) {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && fn != null && typeof fn !== 'function') {
            console.warn(`trackBy must be a function, but received ${JSON.stringify(fn)}. ` +
                `See https://angular.io/api/common/NgForOf#change-propagation for more information.`);
        }
        this._trackByFn = fn;
    }
    get ngForTrackBy() {
        return this._trackByFn;
    }
    constructor(_viewContainer, _template, _differs) {
        this._viewContainer = _viewContainer;
        this._template = _template;
        this._differs = _differs;
        this._ngForOf = null;
        this._ngForOfDirty = true;
        this._differ = null;
    }
    /**
     * A reference to the template that is stamped out for each item in the iterable.
     * @see [template reference variable](guide/template-reference-variables)
     */
    set ngForTemplate(value) {
        // TODO(TS2.1): make TemplateRef<Partial<NgForRowOf<T>>> once we move to TS v2.1
        // The current type is too restrictive; a template that just uses index, for example,
        // should be acceptable.
        if (value) {
            this._template = value;
        }
    }
    /**
     * Applies the changes when needed.
     * @nodoc
     */
    ngDoCheck() {
        if (this._ngForOfDirty) {
            this._ngForOfDirty = false;
            // React on ngForOf changes only once all inputs have been initialized
            const value = this._ngForOf;
            if (!this._differ && value) {
                if (typeof ngDevMode === 'undefined' || ngDevMode) {
                    try {
                        // CAUTION: this logic is duplicated for production mode below, as the try-catch
                        // is only present in development builds.
                        this._differ = this._differs.find(value).create(this.ngForTrackBy);
                    }
                    catch {
                        let errorMessage = `Cannot find a differ supporting object '${value}' of type '` +
                            `${getTypeName(value)}'. NgFor only supports binding to Iterables, such as Arrays.`;
                        if (typeof value === 'object') {
                            errorMessage += ' Did you mean to use the keyvalue pipe?';
                        }
                        throw new RuntimeError(-2200 /* RuntimeErrorCode.NG_FOR_MISSING_DIFFER */, errorMessage);
                    }
                }
                else {
                    // CAUTION: this logic is duplicated for development mode above, as the try-catch
                    // is only present in development builds.
                    this._differ = this._differs.find(value).create(this.ngForTrackBy);
                }
            }
        }
        if (this._differ) {
            const changes = this._differ.diff(this._ngForOf);
            if (changes)
                this._applyChanges(changes);
        }
    }
    _applyChanges(changes) {
        const viewContainer = this._viewContainer;
        changes.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
            if (item.previousIndex == null) {
                // NgForOf is never "null" or "undefined" here because the differ detected
                // that a new item needs to be inserted from the iterable. This implies that
                // there is an iterable value for "_ngForOf".
                viewContainer.createEmbeddedView(this._template, new NgForOfContext(item.item, this._ngForOf, -1, -1), currentIndex === null ? undefined : currentIndex);
            }
            else if (currentIndex == null) {
                viewContainer.remove(adjustedPreviousIndex === null ? undefined : adjustedPreviousIndex);
            }
            else if (adjustedPreviousIndex !== null) {
                const view = viewContainer.get(adjustedPreviousIndex);
                viewContainer.move(view, currentIndex);
                applyViewChange(view, item);
            }
        });
        for (let i = 0, ilen = viewContainer.length; i < ilen; i++) {
            const viewRef = viewContainer.get(i);
            const context = viewRef.context;
            context.index = i;
            context.count = ilen;
            context.ngForOf = this._ngForOf;
        }
        changes.forEachIdentityChange((record) => {
            const viewRef = viewContainer.get(record.currentIndex);
            applyViewChange(viewRef, record);
        });
    }
    /**
     * Asserts the correct type of the context for the template that `NgForOf` will render.
     *
     * The presence of this method is a signal to the Ivy template type-check compiler that the
     * `NgForOf` structural directive renders its template with a specific context type.
     */
    static ngTemplateContextGuard(dir, ctx) {
        return true;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgForOf, deps: [{ token: i0.ViewContainerRef }, { token: i0.TemplateRef }, { token: i0.IterableDiffers }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: NgForOf, isStandalone: true, selector: "[ngFor][ngForOf]", inputs: { ngForOf: "ngForOf", ngForTrackBy: "ngForTrackBy", ngForTemplate: "ngForTemplate" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgForOf, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngFor][ngForOf]',
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i0.ViewContainerRef }, { type: i0.TemplateRef }, { type: i0.IterableDiffers }]; }, propDecorators: { ngForOf: [{
                type: Input
            }], ngForTrackBy: [{
                type: Input
            }], ngForTemplate: [{
                type: Input
            }] } });
// Also export the `NgForOf` class as `NgFor` to improve the DX for
// cases when the directive is used as standalone, so the class name
// matches the CSS selector (*ngFor).
export { NgForOf as NgFor };
function applyViewChange(view, record) {
    view.context.$implicit = record.item;
}
function getTypeName(type) {
    return type['name'] || typeof type;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZm9yX29mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tbW9uL3NyYy9kaXJlY3RpdmVzL25nX2Zvcl9vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUE0QixLQUFLLEVBQXlELGVBQWUsRUFBYyxXQUFXLEVBQW1CLGdCQUFnQixFQUFFLGFBQWEsSUFBSSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBSzVPOztHQUVHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUFDekIsWUFBbUIsU0FBWSxFQUFTLE9BQVUsRUFBUyxLQUFhLEVBQVMsS0FBYTtRQUEzRSxjQUFTLEdBQVQsU0FBUyxDQUFHO1FBQVMsWUFBTyxHQUFQLE9BQU8sQ0FBRztRQUFTLFVBQUssR0FBTCxLQUFLLENBQVE7UUFBUyxVQUFLLEdBQUwsS0FBSyxDQUFRO0lBQUcsQ0FBQztJQUVsRyxJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLEdBQUc7UUFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWlHRztBQUtILE1BQU0sT0FBTyxPQUFPO0lBQ2xCOzs7T0FHRztJ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ZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRG9DaGVjaywgRW1iZWRkZWRWaWV3UmVmLCBJbnB1dCwgSXRlcmFibGVDaGFuZ2VSZWNvcmQsIEl0ZXJhYmxlQ2hhbmdlcywgSXRlcmFibGVEaWZmZXIsIEl0ZXJhYmxlRGlmZmVycywgTmdJdGVyYWJsZSwgVGVtcGxhdGVSZWYsIFRyYWNrQnlGdW5jdGlvbiwgVmlld0NvbnRhaW5lclJlZiwgybVSdW50aW1lRXJyb3IgYXMgUnVudGltZUVycm9yfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuXG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdGb3JPZkNvbnRleHQ8VCwgVSBleHRlbmRzIE5nSXRlcmFibGU8VD4gPSBOZ0l0ZXJhYmxlPFQ+PiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyAkaW1wbGljaXQ6IFQsIHB1YmxpYyBuZ0Zvck9mOiBVLCBwdWJsaWMgaW5kZXg6IG51bWJlciwgcHVibGljIGNvdW50OiBudW1iZXIpIHt9XG5cbiAgZ2V0IGZpcnN0KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmluZGV4ID09PSAwO1xuICB9XG5cbiAgZ2V0IGxhc3QoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5kZXggPT09IHRoaXMuY291bnQgLSAxO1xuICB9XG5cbiAgZ2V0IGV2ZW4oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5kZXggJSAyID09PSAwO1xuICB9XG5cbiAgZ2V0IG9kZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuZXZlbjtcbiAgfVxufVxuXG4vKipcbiAqIEEgW3N0cnVjdHVyYWwgZGlyZWN0aXZlXShndWlkZS9zdHJ1Y3R1cmFsLWRpcmVjdGl2ZXMpIHRoYXQgcmVuZGVyc1xuICogYSB0ZW1wbGF0ZSBmb3IgZWFjaCBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAqIFRoZSBkaXJlY3RpdmUgaXMgcGxhY2VkIG9uIGFuIGVsZW1lbnQsIHdoaWNoIGJlY29tZXMgdGhlIHBhcmVudFxuICogb2YgdGhlIGNsb25lZCB0ZW1wbGF0ZXMuXG4gKlxuICogVGhlIGBuZ0Zvck9mYCBkaXJlY3RpdmUgaXMgZ2VuZXJhbGx5IHVzZWQgaW4gdGhlXG4gKiBbc2hvcnRoYW5kIGZvcm1dKGd1aWRlL3N0cnVjdHVyYWwtZGlyZWN0aXZlcyNhc3RlcmlzaykgYCpuZ0ZvcmAuXG4gKiBJbiB0aGlzIGZvcm0sIHRoZSB0ZW1wbGF0ZSB0byBiZSByZW5kZXJlZCBmb3IgZWFjaCBpdGVyYXRpb24gaXMgdGhlIGNvbnRlbnRcbiAqIG9mIGFuIGFuY2hvciBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIGRpcmVjdGl2ZS5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgdGhlIHNob3J0aGFuZCBzeW50YXggd2l0aCBzb21lIG9wdGlvbnMsXG4gKiBjb250YWluZWQgaW4gYW4gYDxsaT5gIGVsZW1lbnQuXG4gKlxuICogYGBgXG4gKiA8bGkgKm5nRm9yPVwibGV0IGl0ZW0gb2YgaXRlbXM7IGluZGV4IGFzIGk7IHRyYWNrQnk6IHRyYWNrQnlGblwiPi4uLjwvbGk+XG4gKiBgYGBcbiAqXG4gKiBUaGUgc2hvcnRoYW5kIGZvcm0gZXhwYW5kcyBpbnRvIGEgbG9uZyBmb3JtIHRoYXQgdXNlcyB0aGUgYG5nRm9yT2ZgIHNlbGVjdG9yXG4gKiBvbiBhbiBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudC5cbiAqIFRoZSBjb250ZW50IG9mIHRoZSBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCBpcyB0aGUgYDxsaT5gIGVsZW1lbnQgdGhhdCBoZWxkIHRoZVxuICogc2hvcnQtZm9ybSBkaXJlY3RpdmUuXG4gKlxuICogSGVyZSBpcyB0aGUgZXhwYW5kZWQgdmVyc2lvbiBvZiB0aGUgc2hvcnQtZm9ybSBleGFtcGxlLlxuICpcbiAqIGBgYFxuICogPG5nLXRlbXBsYXRlIG5nRm9yIGxldC1pdGVtIFtuZ0Zvck9mXT1cIml0ZW1zXCIgbGV0LWk9XCJpbmRleFwiIFtuZ0ZvclRyYWNrQnldPVwidHJhY2tCeUZuXCI+XG4gKiAgIDxsaT4uLi48L2xpPlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqIGBgYFxuICpcbiAqIEFuZ3VsYXIgYXV0b21hdGljYWxseSBleHBhbmRzIHRoZSBzaG9ydGhhbmQgc3ludGF4IGFzIGl0IGNvbXBpbGVzIHRoZSB0ZW1wbGF0ZS5cbiAqIFRoZSBjb250ZXh0IGZvciBlYWNoIGVtYmVkZGVkIHZpZXcgaXMgbG9naWNhbGx5IG1lcmdlZCB0byB0aGUgY3VycmVudCBjb21wb25lbnRcbiAqIGNvbnRleHQgYWNjb3JkaW5nIHRvIGl0cyBsZXhpY2FsIHBvc2l0aW9uLlxuICpcbiAqIFdoZW4gdXNpbmcgdGhlIHNob3J0aGFuZCBzeW50YXgsIEFuZ3VsYXIgYWxsb3dzIG9ubHkgW29uZSBzdHJ1Y3R1cmFsIGRpcmVjdGl2ZVxuICogb24gYW4gZWxlbWVudF0oZ3VpZGUvc3RydWN0dXJhbC1kaXJlY3RpdmVzI29uZS1wZXItZWxlbWVudCkuXG4gKiBJZiB5b3Ugd2FudCB0byBpdGVyYXRlIGNvbmRpdGlvbmFsbHksIGZvciBleGFtcGxlLFxuICogcHV0IHRoZSBgKm5nSWZgIG9uIGEgY29udGFpbmVyIGVsZW1lbnQgdGhhdCB3cmFwcyB0aGUgYCpuZ0ZvcmAgZWxlbWVudC5cbiAqIEZvciBmdXJ0aGVyIGRpc2N1c3Npb24sIHNlZVxuICogW1N0cnVjdHVyYWwgRGlyZWN0aXZlc10oZ3VpZGUvc3RydWN0dXJhbC1kaXJlY3RpdmVzI29uZS1wZXItZWxlbWVudCkuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgTG9jYWwgdmFyaWFibGVzXG4gKlxuICogYE5nRm9yT2ZgIHByb3ZpZGVzIGV4cG9ydGVkIHZhbHVlcyB0aGF0IGNhbiBiZSBhbGlhc2VkIHRvIGxvY2FsIHZhcmlhYmxlcy5cbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICBgYGBcbiAqIDxsaSAqbmdGb3I9XCJsZXQgdXNlciBvZiB1c2VyczsgaW5kZXggYXMgaTsgZmlyc3QgYXMgaXNGaXJzdFwiPlxuICogICAge3tpfX0ve3t1c2Vycy5sZW5ndGh9fS4ge3t1c2VyfX0gPHNwYW4gKm5nSWY9XCJpc0ZpcnN0XCI+ZGVmYXVsdDwvc3Bhbj5cbiAqIDwvbGk+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4cG9ydGVkIHZhbHVlcyBjYW4gYmUgYWxpYXNlZCB0byBsb2NhbCB2YXJpYWJsZXM6XG4gKlxuICogLSBgJGltcGxpY2l0OiBUYDogVGhlIHZhbHVlIG9mIHRoZSBpbmRpdmlkdWFsIGl0ZW1zIGluIHRoZSBpdGVyYWJsZSAoYG5nRm9yT2ZgKS5cbiAqIC0gYG5nRm9yT2Y6IE5nSXRlcmFibGU8VD5gOiBUaGUgdmFsdWUgb2YgdGhlIGl0ZXJhYmxlIGV4cHJlc3Npb24uIFVzZWZ1bCB3aGVuIHRoZSBleHByZXNzaW9uIGlzXG4gKiBtb3JlIGNvbXBsZXggdGhlbiBhIHByb3BlcnR5IGFjY2VzcywgZm9yIGV4YW1wbGUgd2hlbiB1c2luZyB0aGUgYXN5bmMgcGlwZSAoYHVzZXJTdHJlYW1zIHxcbiAqIGFzeW5jYCkuXG4gKiAtIGBpbmRleDogbnVtYmVyYDogVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGl0ZW0gaW4gdGhlIGl0ZXJhYmxlLlxuICogLSBgY291bnQ6IG51bWJlcmA6IFRoZSBsZW5ndGggb2YgdGhlIGl0ZXJhYmxlLlxuICogLSBgZmlyc3Q6IGJvb2xlYW5gOiBUcnVlIHdoZW4gdGhlIGl0ZW0gaXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIGl0ZXJhYmxlLlxuICogLSBgbGFzdDogYm9vbGVhbmA6IFRydWUgd2hlbiB0aGUgaXRlbSBpcyB0aGUgbGFzdCBpdGVtIGluIHRoZSBpdGVyYWJsZS5cbiAqIC0gYGV2ZW46IGJvb2xlYW5gOiBUcnVlIHdoZW4gdGhlIGl0ZW0gaGFzIGFuIGV2ZW4gaW5kZXggaW4gdGhlIGl0ZXJhYmxlLlxuICogLSBgb2RkOiBib29sZWFuYDogVHJ1ZSB3aGVuIHRoZSBpdGVtIGhhcyBhbiBvZGQgaW5kZXggaW4gdGhlIGl0ZXJhYmxlLlxuICpcbiAqICMjIyBDaGFuZ2UgcHJvcGFnYXRpb25cbiAqXG4gKiBXaGVuIHRoZSBjb250ZW50cyBvZiB0aGUgaXRlcmF0b3IgY2hhbmdlcywgYE5nRm9yT2ZgIG1ha2VzIHRoZSBjb3JyZXNwb25kaW5nIGNoYW5nZXMgdG8gdGhlIERPTTpcbiAqXG4gKiAqIFdoZW4gYW4gaXRlbSBpcyBhZGRlZCwgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHRlbXBsYXRlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gKiAqIFdoZW4gYW4gaXRlbSBpcyByZW1vdmVkLCBpdHMgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gKiAqIFdoZW4gaXRlbXMgYXJlIHJlb3JkZXJlZCwgdGhlaXIgcmVzcGVjdGl2ZSB0ZW1wbGF0ZXMgYXJlIHJlb3JkZXJlZCBpbiB0aGUgRE9NLlxuICpcbiAqIEFuZ3VsYXIgdXNlcyBvYmplY3QgaWRlbnRpdHkgdG8gdHJhY2sgaW5zZXJ0aW9ucyBhbmQgZGVsZXRpb25zIHdpdGhpbiB0aGUgaXRlcmF0b3IgYW5kIHJlcHJvZHVjZVxuICogdGhvc2UgY2hhbmdlcyBpbiB0aGUgRE9NLiBUaGlzIGhhcyBpbXBvcnRhbnQgaW1wbGljYXRpb25zIGZvciBhbmltYXRpb25zIGFuZCBhbnkgc3RhdGVmdWxcbiAqIGNvbnRyb2xzIHRoYXQgYXJlIHByZXNlbnQsIHN1Y2ggYXMgYDxpbnB1dD5gIGVsZW1lbnRzIHRoYXQgYWNjZXB0IHVzZXIgaW5wdXQuIEluc2VydGVkIHJvd3MgY2FuXG4gKiBiZSBhbmltYXRlZCBpbiwgZGVsZXRlZCByb3dzIGNhbiBiZSBhbmltYXRlZCBvdXQsIGFuZCB1bmNoYW5nZWQgcm93cyByZXRhaW4gYW55IHVuc2F2ZWQgc3RhdGVcbiAqIHN1Y2ggYXMgdXNlciBpbnB1dC5cbiAqIEZvciBtb3JlIG9uIGFuaW1hdGlvbnMsIHNlZSBbVHJhbnNpdGlvbnMgYW5kIFRyaWdnZXJzXShndWlkZS90cmFuc2l0aW9uLWFuZC10cmlnZ2VycykuXG4gKlxuICogVGhlIGlkZW50aXRpZXMgb2YgZWxlbWVudHMgaW4gdGhlIGl0ZXJhdG9yIGNhbiBjaGFuZ2Ugd2hpbGUgdGhlIGRhdGEgZG9lcyBub3QuXG4gKiBUaGlzIGNhbiBoYXBwZW4sIGZvciBleGFtcGxlLCBpZiB0aGUgaXRlcmF0b3IgaXMgcHJvZHVjZWQgZnJvbSBhbiBSUEMgdG8gdGhlIHNlcnZlciwgYW5kIHRoYXRcbiAqIFJQQyBpcyByZS1ydW4uIEV2ZW4gaWYgdGhlIGRhdGEgaGFzbid0IGNoYW5nZWQsIHRoZSBzZWNvbmQgcmVzcG9uc2UgcHJvZHVjZXMgb2JqZWN0cyB3aXRoXG4gKiBkaWZmZXJlbnQgaWRlbnRpdGllcywgYW5kIEFuZ3VsYXIgbXVzdCB0ZWFyIGRvd24gdGhlIGVudGlyZSBET00gYW5kIHJlYnVpbGQgaXQgKGFzIGlmIGFsbCBvbGRcbiAqIGVsZW1lbnRzIHdlcmUgZGVsZXRlZCBhbmQgYWxsIG5ldyBlbGVtZW50cyBpbnNlcnRlZCkuXG4gKlxuICogVG8gYXZvaWQgdGhpcyBleHBlbnNpdmUgb3BlcmF0aW9uLCB5b3UgY2FuIGN1c3RvbWl6ZSB0aGUgZGVmYXVsdCB0cmFja2luZyBhbGdvcml0aG0uXG4gKiBieSBzdXBwbHlpbmcgdGhlIGB0cmFja0J5YCBvcHRpb24gdG8gYE5nRm9yT2ZgLlxuICogYHRyYWNrQnlgIHRha2VzIGEgZnVuY3Rpb24gdGhhdCBoYXMgdHdvIGFyZ3VtZW50czogYGluZGV4YCBhbmQgYGl0ZW1gLlxuICogSWYgYHRyYWNrQnlgIGlzIGdpdmVuLCBBbmd1bGFyIHRyYWNrcyBjaGFuZ2VzIGJ5IHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uLlxuICpcbiAqIEBzZWUgW1N0cnVjdHVyYWwgRGlyZWN0aXZlc10oZ3VpZGUvc3RydWN0dXJhbC1kaXJlY3RpdmVzKVxuICogQG5nTW9kdWxlIENvbW1vbk1vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbbmdGb3JdW25nRm9yT2ZdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTmdGb3JPZjxULCBVIGV4dGVuZHMgTmdJdGVyYWJsZTxUPiA9IE5nSXRlcmFibGU8VD4+IGltcGxlbWVudHMgRG9DaGVjayB7XG4gIC8qKlxuICAgKiBUaGUgdmFsdWUgb2YgdGhlIGl0ZXJhYmxlIGV4cHJlc3Npb24sIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGFcbiAgICogW3RlbXBsYXRlIGlucHV0IHZhcmlhYmxlXShndWlkZS9zdHJ1Y3R1cmFsLWRpcmVjdGl2ZXMjc2hvcnRoYW5kKS5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBuZ0Zvck9mKG5nRm9yT2Y6IFUmTmdJdGVyYWJsZTxUPnx1bmRlZmluZWR8bnVsbCkge1xuICAgIHRoaXMuX25nRm9yT2YgPSBuZ0Zvck9mO1xuICAgIHRoaXMuX25nRm9yT2ZEaXJ0eSA9IHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIFNwZWNpZmllcyBhIGN1c3RvbSBgVHJhY2tCeUZ1bmN0aW9uYCB0byBjb21wdXRlIHRoZSBpZGVudGl0eSBvZiBpdGVtcyBpbiBhbiBpdGVyYWJsZS5cbiAgICpcbiAgICogSWYgYSBjdXN0b20gYFRyYWNrQnlGdW5jdGlvbmAgaXMgbm90IHByb3ZpZGVkLCBgTmdGb3JPZmAgd2lsbCB1c2UgdGhlIGl0ZW0ncyBbb2JqZWN0XG4gICAqIGlkZW50aXR5XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvaXMpXG4gICAqIGFzIHRoZSBrZXkuXG4gICAqXG4gICAqIGBOZ0Zvck9mYCB1c2VzIHRoZSBjb21wdXRlZCBrZXkgdG8gYXNzb2NpYXRlIGl0ZW1zIGluIGFuIGl0ZXJhYmxlIHdpdGggRE9NIGVsZW1lbnRzXG4gICAqIGl0IHByb2R1Y2VzIGZvciB0aGVzZSBpdGVtcy5cbiAgICpcbiAgICogQSBjdXN0b20gYFRyYWNrQnlGdW5jdGlvbmAgaXMgdXNlZnVsIHRvIHByb3ZpZGUgZ29vZCB1c2VyIGV4cGVyaWVuY2UgaW4gY2FzZXMgd2hlbiBpdGVtcyBpbiBhblxuICAgKiBpdGVyYWJsZSByZW5kZXJlZCB1c2luZyBgTmdGb3JPZmAgaGF2ZSBhIG5hdHVyYWwgaWRlbnRpZmllciAoZm9yIGV4YW1wbGUsIGN1c3RvbSBJRCBvciBhXG4gICAqIHByaW1hcnkga2V5KSwgYW5kIHRoaXMgaXRlcmFibGUgY291bGQgYmUgdXBkYXRlZCB3aXRoIG5ldyBvYmplY3QgaW5zdGFuY2VzIHRoYXQgc3RpbGxcbiAgICogcmVwcmVzZW50IHRoZSBzYW1lIHVuZGVybHlpbmcgZW50aXR5IChmb3IgZXhhbXBsZSwgd2hlbiBkYXRhIGlzIHJlLWZldGNoZWQgZnJvbSB0aGUgc2VydmVyLFxuICAgKiBhbmQgdGhlIGl0ZXJhYmxlIGlzIHJlY3JlYXRlZCBhbmQgcmUtcmVuZGVyZWQsIGJ1dCBtb3N0IG9mIHRoZSBkYXRhIGlzIHN0aWxsIHRoZSBzYW1lKS5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgVHJhY2tCeUZ1bmN0aW9ufVxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IG5nRm9yVHJhY2tCeShmbjogVHJhY2tCeUZ1bmN0aW9uPFQ+KSB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGZuICE9IG51bGwgJiYgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgYHRyYWNrQnkgbXVzdCBiZSBhIGZ1bmN0aW9uLCBidXQgcmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShmbil9LiBgICtcbiAgICAgICAgICBgU2VlIGh0dHBzOi8vYW5ndWxhci5pby9hcGkvY29tbW9uL05nRm9yT2YjY2hhbmdlLXByb3BhZ2F0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLmApO1xuICAgIH1cbiAgICB0aGlzLl90cmFja0J5Rm4gPSBmbjtcbiAgfVxuXG4gIGdldCBuZ0ZvclRyYWNrQnkoKTogVHJhY2tCeUZ1bmN0aW9uPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdHJhY2tCeUZuO1xuICB9XG5cbiAgcHJpdmF0ZSBfbmdGb3JPZjogVXx1bmRlZmluZWR8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX25nRm9yT2ZEaXJ0eTogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8VD58bnVsbCA9IG51bGw7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnXG4gIC8vIHdhaXRpbmcgZm9yIG1pY3Jvc29mdC90eXBlc2NyaXB0IzQzNjYyIHRvIGFsbG93IHRoZSByZXR1cm4gdHlwZSBgVHJhY2tCeUZ1bmN0aW9ufHVuZGVmaW5lZGAgZm9yXG4gIC8vIHRoZSBnZXR0ZXJcbiAgcHJpdmF0ZSBfdHJhY2tCeUZuITogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxOZ0Zvck9mQ29udGV4dDxULCBVPj4sIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycykge31cblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIHRoYXQgaXMgc3RhbXBlZCBvdXQgZm9yIGVhY2ggaXRlbSBpbiB0aGUgaXRlcmFibGUuXG4gICAqIEBzZWUgW3RlbXBsYXRlIHJlZmVyZW5jZSB2YXJpYWJsZV0oZ3VpZGUvdGVtcGxhdGUtcmVmZXJlbmNlLXZhcmlhYmxlcylcbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBuZ0ZvclRlbXBsYXRlKHZhbHVlOiBUZW1wbGF0ZVJlZjxOZ0Zvck9mQ29udGV4dDxULCBVPj4pIHtcbiAgICAvLyBUT0RPKFRTMi4xKTogbWFrZSBUZW1wbGF0ZVJlZjxQYXJ0aWFsPE5nRm9yUm93T2Y8VD4+PiBvbmNlIHdlIG1vdmUgdG8gVFMgdjIuMVxuICAgIC8vIFRoZSBjdXJyZW50IHR5cGUgaXMgdG9vIHJlc3RyaWN0aXZlOyBhIHRlbXBsYXRlIHRoYXQganVzdCB1c2VzIGluZGV4LCBmb3IgZXhhbXBsZSxcbiAgICAvLyBzaG91bGQgYmUgYWNjZXB0YWJsZS5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX3RlbXBsYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdGhlIGNoYW5nZXMgd2hlbiBuZWVkZWQuXG4gICAqIEBub2RvY1xuICAgKi9cbiAgbmdEb0NoZWNrKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9uZ0Zvck9mRGlydHkpIHtcbiAgICAgIHRoaXMuX25nRm9yT2ZEaXJ0eSA9IGZhbHNlO1xuICAgICAgLy8gUmVhY3Qgb24gbmdGb3JPZiBjaGFuZ2VzIG9ubHkgb25jZSBhbGwgaW5wdXRzIGhhdmUgYmVlbiBpbml0aWFsaXplZFxuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9uZ0Zvck9mO1xuICAgICAgaWYgKCF0aGlzLl9kaWZmZXIgJiYgdmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDQVVUSU9OOiB0aGlzIGxvZ2ljIGlzIGR1cGxpY2F0ZWQgZm9yIHByb2R1Y3Rpb24gbW9kZSBiZWxvdywgYXMgdGhlIHRyeS1jYXRjaFxuICAgICAgICAgICAgLy8gaXMgb25seSBwcmVzZW50IGluIGRldmVsb3BtZW50IGJ1aWxkcy5cbiAgICAgICAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZCh2YWx1ZSkuY3JlYXRlKHRoaXMubmdGb3JUcmFja0J5KTtcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBgQ2Fubm90IGZpbmQgYSBkaWZmZXIgc3VwcG9ydGluZyBvYmplY3QgJyR7dmFsdWV9JyBvZiB0eXBlICdgICtcbiAgICAgICAgICAgICAgICBgJHtnZXRUeXBlTmFtZSh2YWx1ZSl9Jy4gTmdGb3Igb25seSBzdXBwb3J0cyBiaW5kaW5nIHRvIEl0ZXJhYmxlcywgc3VjaCBhcyBBcnJheXMuYDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSAnIERpZCB5b3UgbWVhbiB0byB1c2UgdGhlIGtleXZhbHVlIHBpcGU/JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5OR19GT1JfTUlTU0lOR19ESUZGRVIsIGVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENBVVRJT046IHRoaXMgbG9naWMgaXMgZHVwbGljYXRlZCBmb3IgZGV2ZWxvcG1lbnQgbW9kZSBhYm92ZSwgYXMgdGhlIHRyeS1jYXRjaFxuICAgICAgICAgIC8vIGlzIG9ubHkgcHJlc2VudCBpbiBkZXZlbG9wbWVudCBidWlsZHMuXG4gICAgICAgICAgdGhpcy5fZGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKHZhbHVlKS5jcmVhdGUodGhpcy5uZ0ZvclRyYWNrQnkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLl9kaWZmZXIpIHtcbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9uZ0Zvck9mKTtcbiAgICAgIGlmIChjaGFuZ2VzKSB0aGlzLl9hcHBseUNoYW5nZXMoY2hhbmdlcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlDaGFuZ2VzKGNoYW5nZXM6IEl0ZXJhYmxlQ2hhbmdlczxUPikge1xuICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSB0aGlzLl92aWV3Q29udGFpbmVyO1xuICAgIGNoYW5nZXMuZm9yRWFjaE9wZXJhdGlvbihcbiAgICAgICAgKGl0ZW06IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LCBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlcnxudWxsLFxuICAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXJ8bnVsbCkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLnByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gTmdGb3JPZiBpcyBuZXZlciBcIm51bGxcIiBvciBcInVuZGVmaW5lZFwiIGhlcmUgYmVjYXVzZSB0aGUgZGlmZmVyIGRldGVjdGVkXG4gICAgICAgICAgICAvLyB0aGF0IGEgbmV3IGl0ZW0gbmVlZHMgdG8gYmUgaW5zZXJ0ZWQgZnJvbSB0aGUgaXRlcmFibGUuIFRoaXMgaW1wbGllcyB0aGF0XG4gICAgICAgICAgICAvLyB0aGVyZSBpcyBhbiBpdGVyYWJsZSB2YWx1ZSBmb3IgXCJfbmdGb3JPZlwiLlxuICAgICAgICAgICAgdmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcGxhdGUsIG5ldyBOZ0Zvck9mQ29udGV4dDxULCBVPihpdGVtLml0ZW0sIHRoaXMuX25nRm9yT2YhLCAtMSwgLTEpLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IGN1cnJlbnRJbmRleCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgICAgdmlld0NvbnRhaW5lci5yZW1vdmUoXG4gICAgICAgICAgICAgICAgYWRqdXN0ZWRQcmV2aW91c0luZGV4ID09PSBudWxsID8gdW5kZWZpbmVkIDogYWRqdXN0ZWRQcmV2aW91c0luZGV4KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFkanVzdGVkUHJldmlvdXNJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9IHZpZXdDb250YWluZXIuZ2V0KGFkanVzdGVkUHJldmlvdXNJbmRleCkhO1xuICAgICAgICAgICAgdmlld0NvbnRhaW5lci5tb3ZlKHZpZXcsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgICAgICBhcHBseVZpZXdDaGFuZ2UodmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8TmdGb3JPZkNvbnRleHQ8VCwgVT4+LCBpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsZW4gPSB2aWV3Q29udGFpbmVyLmxlbmd0aDsgaSA8IGlsZW47IGkrKykge1xuICAgICAgY29uc3Qgdmlld1JlZiA9IDxFbWJlZGRlZFZpZXdSZWY8TmdGb3JPZkNvbnRleHQ8VCwgVT4+PnZpZXdDb250YWluZXIuZ2V0KGkpO1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdSZWYuY29udGV4dDtcbiAgICAgIGNvbnRleHQuaW5kZXggPSBpO1xuICAgICAgY29udGV4dC5jb3VudCA9IGlsZW47XG4gICAgICBjb250ZXh0Lm5nRm9yT2YgPSB0aGlzLl9uZ0Zvck9mITtcbiAgICB9XG5cbiAgICBjaGFuZ2VzLmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHZpZXdSZWYgPSA8RW1iZWRkZWRWaWV3UmVmPE5nRm9yT2ZDb250ZXh0PFQsIFU+Pj52aWV3Q29udGFpbmVyLmdldChyZWNvcmQuY3VycmVudEluZGV4KTtcbiAgICAgIGFwcGx5Vmlld0NoYW5nZSh2aWV3UmVmLCByZWNvcmQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhlIGNvcnJlY3QgdHlwZSBvZiB0aGUgY29udGV4dCBmb3IgdGhlIHRlbXBsYXRlIHRoYXQgYE5nRm9yT2ZgIHdpbGwgcmVuZGVyLlxuICAgKlxuICAgKiBUaGUgcHJlc2VuY2Ugb2YgdGhpcyBtZXRob2QgaXMgYSBzaWduYWwgdG8gdGhlIEl2eSB0ZW1wbGF0ZSB0eXBlLWNoZWNrIGNvbXBpbGVyIHRoYXQgdGhlXG4gICAqIGBOZ0Zvck9mYCBzdHJ1Y3R1cmFsIGRpcmVjdGl2ZSByZW5kZXJzIGl0cyB0ZW1wbGF0ZSB3aXRoIGEgc3BlY2lmaWMgY29udGV4dCB0eXBlLlxuICAgKi9cbiAgc3RhdGljIG5nVGVtcGxhdGVDb250ZXh0R3VhcmQ8VCwgVSBleHRlbmRzIE5nSXRlcmFibGU8VD4+KGRpcjogTmdGb3JPZjxULCBVPiwgY3R4OiBhbnkpOlxuICAgICAgY3R4IGlzIE5nRm9yT2ZDb250ZXh0PFQsIFU+IHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vLyBBbHNvIGV4cG9ydCB0aGUgYE5nRm9yT2ZgIGNsYXNzIGFzIGBOZ0ZvcmAgdG8gaW1wcm92ZSB0aGUgRFggZm9yXG4vLyBjYXNlcyB3aGVuIHRoZSBkaXJlY3RpdmUgaXMgdXNlZCBhcyBzdGFuZGFsb25lLCBzbyB0aGUgY2xhc3MgbmFtZVxuLy8gbWF0Y2hlcyB0aGUgQ1NTIHNlbGVjdG9yICgqbmdGb3IpLlxuZXhwb3J0IHtOZ0Zvck9mIGFzIE5nRm9yfTtcblxuZnVuY3Rpb24gYXBwbHlWaWV3Q2hhbmdlPFQ+KFxuICAgIHZpZXc6IEVtYmVkZGVkVmlld1JlZjxOZ0Zvck9mQ29udGV4dDxUPj4sIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4pIHtcbiAgdmlldy5jb250ZXh0LiRpbXBsaWNpdCA9IHJlY29yZC5pdGVtO1xufVxuXG5mdW5jdGlvbiBnZXRUeXBlTmFtZSh0eXBlOiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZVsnbmFtZSddIHx8IHR5cGVvZiB0eXBlO1xufVxuIl19