/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, Input, IterableDiffers, KeyValueDiffers, Renderer2, ɵstringify as stringify } from '@angular/core';
import * as i0 from "@angular/core";
const WS_REGEXP = /\s+/;
const EMPTY_ARRAY = [];
/**
 * @ngModule CommonModule
 *
 * @usageNotes
 * ```
 *     <some-element [ngClass]="'first second'">...</some-element>
 *
 *     <some-element [ngClass]="['first', 'second']">...</some-element>
 *
 *     <some-element [ngClass]="{'first': true, 'second': true, 'third': false}">...</some-element>
 *
 *     <some-element [ngClass]="stringExp|arrayExp|objExp">...</some-element>
 *
 *     <some-element [ngClass]="{'class1 class2 class3' : true}">...</some-element>
 * ```
 *
 * @description
 *
 * Adds and removes CSS classes on an HTML element.
 *
 * The CSS classes are updated as follows, depending on the type of the expression evaluation:
 * - `string` - the CSS classes listed in the string (space delimited) are added,
 * - `Array` - the CSS classes declared as Array elements are added,
 * - `Object` - keys are CSS classes that get added when the expression given in the value
 *              evaluates to a truthy value, otherwise they are removed.
 *
 * @publicApi
 */
export class NgClass {
    constructor(
    // leaving references to differs in place since flex layout is extending NgClass...
    _iterableDiffers, _keyValueDiffers, _ngEl, _renderer) {
        this._iterableDiffers = _iterableDiffers;
        this._keyValueDiffers = _keyValueDiffers;
        this._ngEl = _ngEl;
        this._renderer = _renderer;
        this.initialClasses = EMPTY_ARRAY;
        this.stateMap = new Map();
    }
    set klass(value) {
        this.initialClasses = value != null ? value.trim().split(WS_REGEXP) : EMPTY_ARRAY;
    }
    set ngClass(value) {
        this.rawClass = typeof value === 'string' ? value.trim().split(WS_REGEXP) : value;
    }
    /*
    The NgClass directive uses the custom change detection algorithm for its inputs. The custom
    algorithm is necessary since inputs are represented as complex object or arrays that need to be
    deeply-compared.
  
    This algorithm is perf-sensitive since NgClass is used very frequently and its poor performance
    might negatively impact runtime performance of the entire change detection cycle. The design of
    this algorithm is making sure that:
    - there is no unnecessary DOM manipulation (CSS classes are added / removed from the DOM only when
    needed), even if references to bound objects change;
    - there is no memory allocation if nothing changes (even relatively modest memory allocation
    during the change detection cycle can result in GC pauses for some of the CD cycles).
  
    The algorithm works by iterating over the set of bound classes, staring with [class] binding and
    then going over [ngClass] binding. For each CSS class name:
    - check if it was seen before (this information is tracked in the state map) and if its value
    changed;
    - mark it as "touched" - names that are not marked are not present in the latest set of binding
    and we can remove such class name from the internal data structures;
  
    After iteration over all the CSS class names we've got data structure with all the information
    necessary to synchronize changes to the DOM - it is enough to iterate over the state map, flush
    changes to the DOM and reset internal data structures so those are ready for the next change
    detection cycle.
     */
    ngDoCheck() {
        // classes from the [class] binding
        for (const klass of this.initialClasses) {
            this._updateState(klass, true);
        }
        // classes from the [ngClass] binding
        const rawClass = this.rawClass;
        if (Array.isArray(rawClass) || rawClass instanceof Set) {
            for (const klass of rawClass) {
                this._updateState(klass, true);
            }
        }
        else if (rawClass != null) {
            for (const klass of Object.keys(rawClass)) {
                this._updateState(klass, Boolean(rawClass[klass]));
            }
        }
        this._applyStateDiff();
    }
    _updateState(klass, nextEnabled) {
        const state = this.stateMap.get(klass);
        if (state !== undefined) {
            if (state.enabled !== nextEnabled) {
                state.changed = true;
                state.enabled = nextEnabled;
            }
            state.touched = true;
        }
        else {
            this.stateMap.set(klass, { enabled: nextEnabled, changed: true, touched: true });
        }
    }
    _applyStateDiff() {
        for (const stateEntry of this.stateMap) {
            const klass = stateEntry[0];
            const state = stateEntry[1];
            if (state.changed) {
                this._toggleClass(klass, state.enabled);
                state.changed = false;
            }
            else if (!state.touched) {
                // A class that was previously active got removed from the new collection of classes -
                // remove from the DOM as well.
                if (state.enabled) {
                    this._toggleClass(klass, false);
                }
                this.stateMap.delete(klass);
            }
            state.touched = false;
        }
    }
    _toggleClass(klass, enabled) {
        if (ngDevMode) {
            if (typeof klass !== 'string') {
                throw new Error(`NgClass can only toggle CSS classes expressed as strings, got ${stringify(klass)}`);
            }
        }
        klass = klass.trim();
        if (klass.length > 0) {
            klass.split(WS_REGEXP).forEach(klass => {
                if (enabled) {
                    this._renderer.addClass(this._ngEl.nativeElement, klass);
                }
                else {
                    this._renderer.removeClass(this._ngEl.nativeElement, klass);
                }
            });
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgClass, deps: [{ token: i0.IterableDiffers }, { token: i0.KeyValueDiffers }, { token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: NgClass, isStandalone: true, selector: "[ngClass]", inputs: { klass: ["class", "klass"], ngClass: "ngClass" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgClass, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngClass]',
                    standalone: true,
                }]
        }], ctorParameters: function () { return [{ type: i0.IterableDiffers }, { type: i0.KeyValueDiffers }, { type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { klass: [{
                type: Input,
                args: ['class']
            }], ngClass: [{
                type: Input,
                args: ['ngClass']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vc3JjL2RpcmVjdGl2ZXMvbmdfY2xhc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFNBQVMsRUFBVyxVQUFVLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBSTFJLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQztBQUV4QixNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7QUFrQmpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EyQkc7QUFLSCxNQUFNLE9BQU8sT0FBTztJQU1sQjtJQUNJLG1GQUFtRjtJQUMzRSxnQkFBaUMsRUFBVSxnQkFBaUMsRUFDNUUsS0FBaUIsRUFBVSxTQUFvQjtRQUQvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlCO1FBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtRQUM1RSxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVztRQVJuRCxtQkFBYyxHQUFHLFdBQVcsQ0FBQztRQUc3QixhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7SUFLVSxDQUFDO0lBRS9ELElBQ0ksS0FBSyxDQUFDLEtBQWE7UUFDckIsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7SUFDcEYsQ0FBQztJQUVELElBQ0ksT0FBTyxDQUFDLEtBQXdFO1FBQ2xGLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FB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QUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzFGO1NBQ0Y7UUFDRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDcEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3JDLElBQUksT0FBTyxFQUFFO29CQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxRDtxQkFBTTtvQkFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDN0Q7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQzt5SEF0SFUsT0FBTzs2R0FBUCxPQUFPOztzR0FBUCxPQUFPO2tCQUpuQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxXQUFXO29CQUNyQixVQUFVLEVBQUUsSUFBSTtpQkFDakI7cUxBYUssS0FBSztzQkFEUixLQUFLO3VCQUFDLE9BQU87Z0JBTVYsT0FBTztzQkFEVixLQUFLO3VCQUFDLFNBQVMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7RGlyZWN0aXZlLCBEb0NoZWNrLCBFbGVtZW50UmVmLCBJbnB1dCwgSXRlcmFibGVEaWZmZXJzLCBLZXlWYWx1ZURpZmZlcnMsIFJlbmRlcmVyMiwgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxudHlwZSBOZ0NsYXNzU3VwcG9ydGVkVHlwZXMgPSBzdHJpbmdbXXxTZXQ8c3RyaW5nPnx7W2tsYXNzOiBzdHJpbmddOiBhbnl9fG51bGx8dW5kZWZpbmVkO1xuXG5jb25zdCBXU19SRUdFWFAgPSAvXFxzKy87XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBzdHJpbmdbXSA9IFtdO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgaW50ZXJuYWwgb2JqZWN0IHVzZWQgdG8gdHJhY2sgc3RhdGUgb2YgZWFjaCBDU1MgY2xhc3MuIFRoZXJlIGFyZSAzIGRpZmZlcmVudCAoYm9vbGVhbilcbiAqIGZsYWdzIHRoYXQsIGNvbWJpbmVkIHRvZ2V0aGVyLCBpbmRpY2F0ZSBzdGF0ZSBvZiBhIGdpdmVuIENTUyBjbGFzczpcbiAqIC0gZW5hYmxlZDogaW5kaWNhdGVzIGlmIGEgY2xhc3Mgc2hvdWxkIGJlIHByZXNlbnQgaW4gdGhlIERPTSAodHJ1ZSkgb3Igbm90IChmYWxzZSk7XG4gKiAtIGNoYW5nZWQ6IHRyYWNrcyBpZiBhIGNsYXNzIHdhcyB0b2dnbGVkIChhZGRlZCBvciByZW1vdmVkKSBkdXJpbmcgdGhlIGN1c3RvbSBkaXJ0eS1jaGVja2luZ1xuICogcHJvY2VzczsgY2hhbmdlZCBjbGFzc2VzIG11c3QgYmUgc3luY2hyb25pemVkIHdpdGggdGhlIERPTTtcbiAqIC0gdG91Y2hlZDogdHJhY2tzIGlmIGEgY2xhc3MgaXMgcHJlc2VudCBpbiB0aGUgY3VycmVudCBvYmplY3QgYm91bmQgdG8gdGhlIGNsYXNzIC8gbmdDbGFzcyBpbnB1dDtcbiAqIGNsYXNzZXMgdGhhdCBhcmUgbm90IHByZXNlbnQgYW55IG1vcmUgY2FuIGJlIHJlbW92ZWQgZnJvbSB0aGUgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzO1xuICovXG5pbnRlcmZhY2UgQ3NzQ2xhc3NTdGF0ZSB7XG4gIC8vIFBFUkY6IGNvdWxkIHVzZSBhIGJpdCBtYXNrIHRvIHJlcHJlc2VudCBzdGF0ZSBhcyBhbGwgZmllbGRzIGFyZSBib29sZWFuIGZsYWdzXG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGNoYW5nZWQ6IGJvb2xlYW47XG4gIHRvdWNoZWQ6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQG5nTW9kdWxlIENvbW1vbk1vZHVsZVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGBcbiAqICAgICA8c29tZS1lbGVtZW50IFtuZ0NsYXNzXT1cIidmaXJzdCBzZWNvbmQnXCI+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKlxuICogICAgIDxzb21lLWVsZW1lbnQgW25nQ2xhc3NdPVwiWydmaXJzdCcsICdzZWNvbmQnXVwiPi4uLjwvc29tZS1lbGVtZW50PlxuICpcbiAqICAgICA8c29tZS1lbGVtZW50IFtuZ0NsYXNzXT1cInsnZmlyc3QnOiB0cnVlLCAnc2Vjb25kJzogdHJ1ZSwgJ3RoaXJkJzogZmFsc2V9XCI+Li4uPC9zb21lLWVsZW1lbnQ+XG4gKlxuICogICAgIDxzb21lLWVsZW1lbnQgW25nQ2xhc3NdPVwic3RyaW5nRXhwfGFycmF5RXhwfG9iakV4cFwiPi4uLjwvc29tZS1lbGVtZW50PlxuICpcbiAqICAgICA8c29tZS1lbGVtZW50IFtuZ0NsYXNzXT1cInsnY2xhc3MxIGNsYXNzMiBjbGFzczMnIDogdHJ1ZX1cIj4uLi48L3NvbWUtZWxlbWVudD5cbiAqIGBgYFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEFkZHMgYW5kIHJlbW92ZXMgQ1NTIGNsYXNzZXMgb24gYW4gSFRNTCBlbGVtZW50LlxuICpcbiAqIFRoZSBDU1MgY2xhc3NlcyBhcmUgdXBkYXRlZCBhcyBmb2xsb3dzLCBkZXBlbmRpbmcgb24gdGhlIHR5cGUgb2YgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGlvbjpcbiAqIC0gYHN0cmluZ2AgLSB0aGUgQ1NTIGNsYXNzZXMgbGlzdGVkIGluIHRoZSBzdHJpbmcgKHNwYWNlIGRlbGltaXRlZCkgYXJlIGFkZGVkLFxuICogLSBgQXJyYXlgIC0gdGhlIENTUyBjbGFzc2VzIGRlY2xhcmVkIGFzIEFycmF5IGVsZW1lbnRzIGFyZSBhZGRlZCxcbiAqIC0gYE9iamVjdGAgLSBrZXlzIGFyZSBDU1MgY2xhc3NlcyB0aGF0IGdldCBhZGRlZCB3aGVuIHRoZSBleHByZXNzaW9uIGdpdmVuIGluIHRoZSB2YWx1ZVxuICogICAgICAgICAgICAgIGV2YWx1YXRlcyB0byBhIHRydXRoeSB2YWx1ZSwgb3RoZXJ3aXNlIHRoZXkgYXJlIHJlbW92ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbbmdDbGFzc10nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBOZ0NsYXNzIGltcGxlbWVudHMgRG9DaGVjayB7XG4gIHByaXZhdGUgaW5pdGlhbENsYXNzZXMgPSBFTVBUWV9BUlJBWTtcbiAgcHJpdmF0ZSByYXdDbGFzczogTmdDbGFzc1N1cHBvcnRlZFR5cGVzO1xuXG4gIHByaXZhdGUgc3RhdGVNYXAgPSBuZXcgTWFwPHN0cmluZywgQ3NzQ2xhc3NTdGF0ZT4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8vIGxlYXZpbmcgcmVmZXJlbmNlcyB0byBkaWZmZXJzIGluIHBsYWNlIHNpbmNlIGZsZXggbGF5b3V0IGlzIGV4dGVuZGluZyBOZ0NsYXNzLi4uXG4gICAgICBwcml2YXRlIF9pdGVyYWJsZURpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycywgcHJpdmF0ZSBfa2V5VmFsdWVEaWZmZXJzOiBLZXlWYWx1ZURpZmZlcnMsXG4gICAgICBwcml2YXRlIF9uZ0VsOiBFbGVtZW50UmVmLCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIyKSB7fVxuXG4gIEBJbnB1dCgnY2xhc3MnKVxuICBzZXQga2xhc3ModmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuaW5pdGlhbENsYXNzZXMgPSB2YWx1ZSAhPSBudWxsID8gdmFsdWUudHJpbSgpLnNwbGl0KFdTX1JFR0VYUCkgOiBFTVBUWV9BUlJBWTtcbiAgfVxuXG4gIEBJbnB1dCgnbmdDbGFzcycpXG4gIHNldCBuZ0NsYXNzKHZhbHVlOiBzdHJpbmd8c3RyaW5nW118U2V0PHN0cmluZz58e1trbGFzczogc3RyaW5nXTogYW55fXxudWxsfHVuZGVmaW5lZCkge1xuICAgIHRoaXMucmF3Q2xhc3MgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUudHJpbSgpLnNwbGl0KFdTX1JFR0VYUCkgOiB2YWx1ZTtcbiAgfVxuXG4gIC8qXG4gIFRoZSBOZ0NsYXNzIGRpcmVjdGl2ZSB1c2VzIHRoZSBjdXN0b20gY2hhbmdlIGRldGVjdGlvbiBhbGdvcml0aG0gZm9yIGl0cyBpbnB1dHMuIFRoZSBjdXN0b21cbiAgYWxnb3JpdGhtIGlzIG5lY2Vzc2FyeSBzaW5jZSBpbnB1dHMgYXJlIHJlcHJlc2VudGVkIGFzIGNvbXBsZXggb2JqZWN0IG9yIGFycmF5cyB0aGF0IG5lZWQgdG8gYmVcbiAgZGVlcGx5LWNvbXBhcmVkLlxuXG4gIFRoaXMgYWxnb3JpdGhtIGlzIHBlcmYtc2Vuc2l0aXZlIHNpbmNlIE5nQ2xhc3MgaXMgdXNlZCB2ZXJ5IGZyZXF1ZW50bHkgYW5kIGl0cyBwb29yIHBlcmZvcm1hbmNlXG4gIG1pZ2h0IG5lZ2F0aXZlbHkgaW1wYWN0IHJ1bnRpbWUgcGVyZm9ybWFuY2Ugb2YgdGhlIGVudGlyZSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLiBUaGUgZGVzaWduIG9mXG4gIHRoaXMgYWxnb3JpdGhtIGlzIG1ha2luZyBzdXJlIHRoYXQ6XG4gIC0gdGhlcmUgaXMgbm8gdW5uZWNlc3NhcnkgRE9NIG1hbmlwdWxhdGlvbiAoQ1NTIGNsYXNzZXMgYXJlIGFkZGVkIC8gcmVtb3ZlZCBmcm9tIHRoZSBET00gb25seSB3aGVuXG4gIG5lZWRlZCksIGV2ZW4gaWYgcmVmZXJlbmNlcyB0byBib3VuZCBvYmplY3RzIGNoYW5nZTtcbiAgLSB0aGVyZSBpcyBubyBtZW1vcnkgYWxsb2NhdGlvbiBpZiBub3RoaW5nIGNoYW5nZXMgKGV2ZW4gcmVsYXRpdmVseSBtb2Rlc3QgbWVtb3J5IGFsbG9jYXRpb25cbiAgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIGNhbiByZXN1bHQgaW4gR0MgcGF1c2VzIGZvciBzb21lIG9mIHRoZSBDRCBjeWNsZXMpLlxuXG4gIFRoZSBhbGdvcml0aG0gd29ya3MgYnkgaXRlcmF0aW5nIG92ZXIgdGhlIHNldCBvZiBib3VuZCBjbGFzc2VzLCBzdGFyaW5nIHdpdGggW2NsYXNzXSBiaW5kaW5nIGFuZFxuICB0aGVuIGdvaW5nIG92ZXIgW25nQ2xhc3NdIGJpbmRpbmcuIEZvciBlYWNoIENTUyBjbGFzcyBuYW1lOlxuICAtIGNoZWNrIGlmIGl0IHdhcyBzZWVuIGJlZm9yZSAodGhpcyBpbmZvcm1hdGlvbiBpcyB0cmFja2VkIGluIHRoZSBzdGF0ZSBtYXApIGFuZCBpZiBpdHMgdmFsdWVcbiAgY2hhbmdlZDtcbiAgLSBtYXJrIGl0IGFzIFwidG91Y2hlZFwiIC0gbmFtZXMgdGhhdCBhcmUgbm90IG1hcmtlZCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIGxhdGVzdCBzZXQgb2YgYmluZGluZ1xuICBhbmQgd2UgY2FuIHJlbW92ZSBzdWNoIGNsYXNzIG5hbWUgZnJvbSB0aGUgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzO1xuXG4gIEFmdGVyIGl0ZXJhdGlvbiBvdmVyIGFsbCB0aGUgQ1NTIGNsYXNzIG5hbWVzIHdlJ3ZlIGdvdCBkYXRhIHN0cnVjdHVyZSB3aXRoIGFsbCB0aGUgaW5mb3JtYXRpb25cbiAgbmVjZXNzYXJ5IHRvIHN5bmNocm9uaXplIGNoYW5nZXMgdG8gdGhlIERPTSAtIGl0IGlzIGVub3VnaCB0byBpdGVyYXRlIG92ZXIgdGhlIHN0YXRlIG1hcCwgZmx1c2hcbiAgY2hhbmdlcyB0byB0aGUgRE9NIGFuZCByZXNldCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgc28gdGhvc2UgYXJlIHJlYWR5IGZvciB0aGUgbmV4dCBjaGFuZ2VcbiAgZGV0ZWN0aW9uIGN5Y2xlLlxuICAgKi9cbiAgbmdEb0NoZWNrKCk6IHZvaWQge1xuICAgIC8vIGNsYXNzZXMgZnJvbSB0aGUgW2NsYXNzXSBiaW5kaW5nXG4gICAgZm9yIChjb25zdCBrbGFzcyBvZiB0aGlzLmluaXRpYWxDbGFzc2VzKSB7XG4gICAgICB0aGlzLl91cGRhdGVTdGF0ZShrbGFzcywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gY2xhc3NlcyBmcm9tIHRoZSBbbmdDbGFzc10gYmluZGluZ1xuICAgIGNvbnN0IHJhd0NsYXNzID0gdGhpcy5yYXdDbGFzcztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShyYXdDbGFzcykgfHwgcmF3Q2xhc3MgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgIGZvciAoY29uc3Qga2xhc3Mgb2YgcmF3Q2xhc3MpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoa2xhc3MsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocmF3Q2xhc3MgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBrbGFzcyBvZiBPYmplY3Qua2V5cyhyYXdDbGFzcykpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoa2xhc3MsIEJvb2xlYW4ocmF3Q2xhc3Nba2xhc3NdKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fYXBwbHlTdGF0ZURpZmYoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZVN0YXRlKGtsYXNzOiBzdHJpbmcsIG5leHRFbmFibGVkOiBib29sZWFuKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlTWFwLmdldChrbGFzcyk7XG4gICAgaWYgKHN0YXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChzdGF0ZS5lbmFibGVkICE9PSBuZXh0RW5hYmxlZCkge1xuICAgICAgICBzdGF0ZS5jaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgc3RhdGUuZW5hYmxlZCA9IG5leHRFbmFibGVkO1xuICAgICAgfVxuICAgICAgc3RhdGUudG91Y2hlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGVNYXAuc2V0KGtsYXNzLCB7ZW5hYmxlZDogbmV4dEVuYWJsZWQsIGNoYW5nZWQ6IHRydWUsIHRvdWNoZWQ6IHRydWV9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hcHBseVN0YXRlRGlmZigpIHtcbiAgICBmb3IgKGNvbnN0IHN0YXRlRW50cnkgb2YgdGhpcy5zdGF0ZU1hcCkge1xuICAgICAgY29uc3Qga2xhc3MgPSBzdGF0ZUVudHJ5WzBdO1xuICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0ZUVudHJ5WzFdO1xuXG4gICAgICBpZiAoc3RhdGUuY2hhbmdlZCkge1xuICAgICAgICB0aGlzLl90b2dnbGVDbGFzcyhrbGFzcywgc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHN0YXRlLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoIXN0YXRlLnRvdWNoZWQpIHtcbiAgICAgICAgLy8gQSBjbGFzcyB0aGF0IHdhcyBwcmV2aW91c2x5IGFjdGl2ZSBnb3QgcmVtb3ZlZCBmcm9tIHRoZSBuZXcgY29sbGVjdGlvbiBvZiBjbGFzc2VzIC1cbiAgICAgICAgLy8gcmVtb3ZlIGZyb20gdGhlIERPTSBhcyB3ZWxsLlxuICAgICAgICBpZiAoc3RhdGUuZW5hYmxlZCkge1xuICAgICAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGtsYXNzLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZU1hcC5kZWxldGUoa2xhc3MpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3Moa2xhc3M6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0eXBlb2Yga2xhc3MgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBOZ0NsYXNzIGNhbiBvbmx5IHRvZ2dsZSBDU1MgY2xhc3NlcyBleHByZXNzZWQgYXMgc3RyaW5ncywgZ290ICR7c3RyaW5naWZ5KGtsYXNzKX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAga2xhc3MgPSBrbGFzcy50cmltKCk7XG4gICAgaWYgKGtsYXNzLmxlbmd0aCA+IDApIHtcbiAgICAgIGtsYXNzLnNwbGl0KFdTX1JFR0VYUCkuZm9yRWFjaChrbGFzcyA9PiB7XG4gICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5fbmdFbC5uYXRpdmVFbGVtZW50LCBrbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIucmVtb3ZlQ2xhc3ModGhpcy5fbmdFbC5uYXRpdmVFbGVtZW50LCBrbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIl19