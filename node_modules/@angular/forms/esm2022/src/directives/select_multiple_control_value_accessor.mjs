/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, forwardRef, Host, Input, Optional, Renderer2, ɵRuntimeError as RuntimeError } from '@angular/core';
import { BuiltInControlValueAccessor, NG_VALUE_ACCESSOR } from './control_value_accessor';
import * as i0 from "@angular/core";
const SELECT_MULTIPLE_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectMultipleControlValueAccessor),
    multi: true
};
function _buildValueString(id, value) {
    if (id == null)
        return `${value}`;
    if (typeof value === 'string')
        value = `'${value}'`;
    if (value && typeof value === 'object')
        value = 'Object';
    return `${id}: ${value}`.slice(0, 50);
}
function _extractId(valueString) {
    return valueString.split(':')[0];
}
/** Mock interface for HTMLCollection */
class HTMLCollection {
}
/**
 * @description
 * The `ControlValueAccessor` for writing multi-select control values and listening to multi-select
 * control changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @see {@link SelectControlValueAccessor}
 *
 * @usageNotes
 *
 * ### Using a multi-select control
 *
 * The follow example shows you how to use a multi-select control with a reactive form.
 *
 * ```ts
 * const countryControl = new FormControl();
 * ```
 *
 * ```
 * <select multiple name="countries" [formControl]="countryControl">
 *   <option *ngFor="let country of countries" [ngValue]="country">
 *     {{ country.name }}
 *   </option>
 * </select>
 * ```
 *
 * ### Customizing option selection
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * See the `SelectControlValueAccessor` for usage.
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export class SelectMultipleControlValueAccessor extends BuiltInControlValueAccessor {
    constructor() {
        super(...arguments);
        /** @internal */
        this._optionMap = new Map();
        /** @internal */
        this._idCounter = 0;
        this._compareWith = Object.is;
    }
    /**
     * @description
     * Tracks the option comparison algorithm for tracking identities when
     * checking for changes.
     */
    set compareWith(fn) {
        if (typeof fn !== 'function' && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw new RuntimeError(1201 /* RuntimeErrorCode.COMPAREWITH_NOT_A_FN */, `compareWith must be a function, but received ${JSON.stringify(fn)}`);
        }
        this._compareWith = fn;
    }
    /**
     * Sets the "value" property on one or of more of the select's options.
     * @nodoc
     */
    writeValue(value) {
        this.value = value;
        let optionSelectedStateSetter;
        if (Array.isArray(value)) {
            // convert values to ids
            const ids = value.map((v) => this._getOptionId(v));
            optionSelectedStateSetter = (opt, o) => {
                opt._setSelected(ids.indexOf(o.toString()) > -1);
            };
        }
        else {
            optionSelectedStateSetter = (opt, o) => {
                opt._setSelected(false);
            };
        }
        this._optionMap.forEach(optionSelectedStateSetter);
    }
    /**
     * Registers a function called when the control value changes
     * and writes an array of the selected options.
     * @nodoc
     */
    registerOnChange(fn) {
        this.onChange = (element) => {
            const selected = [];
            const selectedOptions = element.selectedOptions;
            if (selectedOptions !== undefined) {
                const options = selectedOptions;
                for (let i = 0; i < options.length; i++) {
                    const opt = options[i];
                    const val = this._getOptionValue(opt.value);
                    selected.push(val);
                }
            }
            // Degrade to use `options` when `selectedOptions` property is not available.
            // Note: the `selectedOptions` is available in all supported browsers, but the Domino lib
            // doesn't have it currently, see https://github.com/fgnass/domino/issues/177.
            else {
                const options = element.options;
                for (let i = 0; i < options.length; i++) {
                    const opt = options[i];
                    if (opt.selected) {
                        const val = this._getOptionValue(opt.value);
                        selected.push(val);
                    }
                }
            }
            this.value = selected;
            fn(selected);
        };
    }
    /** @internal */
    _registerOption(value) {
        const id = (this._idCounter++).toString();
        this._optionMap.set(id, value);
        return id;
    }
    /** @internal */
    _getOptionId(value) {
        for (const id of this._optionMap.keys()) {
            if (this._compareWith(this._optionMap.get(id)._value, value))
                return id;
        }
        return null;
    }
    /** @internal */
    _getOptionValue(valueString) {
        const id = _extractId(valueString);
        return this._optionMap.has(id) ? this._optionMap.get(id)._value : valueString;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: SelectMultipleControlValueAccessor, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: SelectMultipleControlValueAccessor, selector: "select[multiple][formControlName],select[multiple][formControl],select[multiple][ngModel]", inputs: { compareWith: "compareWith" }, host: { listeners: { "change": "onChange($event.target)", "blur": "onTouched()" } }, providers: [SELECT_MULTIPLE_VALUE_ACCESSOR], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: SelectMultipleControlValueAccessor, decorators: [{
            type: Directive,
            args: [{
                    selector: 'select[multiple][formControlName],select[multiple][formControl],select[multiple][ngModel]',
                    host: { '(change)': 'onChange($event.target)', '(blur)': 'onTouched()' },
                    providers: [SELECT_MULTIPLE_VALUE_ACCESSOR]
                }]
        }], propDecorators: { compareWith: [{
                type: Input
            }] } });
/**
 * @description
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * @see {@link SelectMultipleControlValueAccessor}
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export class ɵNgSelectMultipleOption {
    constructor(_element, _renderer, _select) {
        this._element = _element;
        this._renderer = _renderer;
        this._select = _select;
        if (this._select) {
            this.id = this._select._registerOption(this);
        }
    }
    /**
     * @description
     * Tracks the value bound to the option element. Unlike the value binding,
     * ngValue supports binding to objects.
     */
    set ngValue(value) {
        if (this._select == null)
            return;
        this._value = value;
        this._setElementValue(_buildValueString(this.id, value));
        this._select.writeValue(this._select.value);
    }
    /**
     * @description
     * Tracks simple string values bound to the option element.
     * For objects, use the `ngValue` input binding.
     */
    set value(value) {
        if (this._select) {
            this._value = value;
            this._setElementValue(_buildValueString(this.id, value));
            this._select.writeValue(this._select.value);
        }
        else {
            this._setElementValue(value);
        }
    }
    /** @internal */
    _setElementValue(value) {
        this._renderer.setProperty(this._element.nativeElement, 'value', value);
    }
    /** @internal */
    _setSelected(selected) {
        this._renderer.setProperty(this._element.nativeElement, 'selected', selected);
    }
    /** @nodoc */
    ngOnDestroy() {
        if (this._select) {
            this._select._optionMap.delete(this.id);
            this._select.writeValue(this._select.value);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ɵNgSelectMultipleOption, deps: [{ token: i0.ElementRef }, { token: i0.Renderer2 }, { token: SelectMultipleControlValueAccessor, host: true, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: ɵNgSelectMultipleOption, selector: "option", inputs: { ngValue: "ngValue", value: "value" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ɵNgSelectMultipleOption, decorators: [{
            type: Directive,
            args: [{ selector: 'option' }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.Renderer2 }, { type: SelectMultipleControlValueAccessor, decorators: [{
                    type: Optional
                }, {
                    type: Host
                }] }]; }, propDecorators: { ngValue: [{
                type: Input,
                args: ['ngValue']
            }], value: [{
                type: Input,
                args: ['value']
            }] } });
export { ɵNgSelectMultipleOption as NgSelectMultipleOption };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0X211bHRpcGxlX2NvbnRyb2xfdmFsdWVfYWNjZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZGlyZWN0aXZlcy9zZWxlY3RfbXVsdGlwbGVfY29udHJvbF92YWx1ZV9hY2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBYSxRQUFRLEVBQVksU0FBUyxFQUFFLGFBQWEsSUFBSSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFJdEosT0FBTyxFQUFDLDJCQUEyQixFQUF3QixpQkFBaUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDOztBQUU5RyxNQUFNLDhCQUE4QixHQUFhO0lBQy9DLE9BQU8sRUFBRSxpQkFBaUI7SUFDMUIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQ0FBa0MsQ0FBQztJQUNqRSxLQUFLLEVBQUUsSUFBSTtDQUNaLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEVBQVUsRUFBRSxLQUFVO0lBQy9DLElBQUksRUFBRSxJQUFJLElBQUk7UUFBRSxPQUFPLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQUUsS0FBSyxHQUFHLElBQUksS0FBSyxHQUFHLENBQUM7SUFDcEQsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUFFLEtBQUssR0FBRyxRQUFRLENBQUM7SUFDekQsT0FBTyxHQUFHLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxXQUFtQjtJQUNyQyxPQUFPLFdBQVcsQ0FBQyxLQUFLLENB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LFNBQVM7Z0JBY1osS0FBSztzQkFEUixLQUFLO3VCQUFDLE9BQU87O0FBOEJoQixPQUFPLEVBQUMsdUJBQXVCLElBQUksc0JBQXNCLEVBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgZm9yd2FyZFJlZiwgSG9zdCwgSW5wdXQsIE9uRGVzdHJveSwgT3B0aW9uYWwsIFByb3ZpZGVyLCBSZW5kZXJlcjIsIMm1UnVudGltZUVycm9yIGFzIFJ1bnRpbWVFcnJvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcblxuaW1wb3J0IHtCdWlsdEluQ29udHJvbFZhbHVlQWNjZXNzb3IsIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBOR19WQUxVRV9BQ0NFU1NPUn0gZnJvbSAnLi9jb250cm9sX3ZhbHVlX2FjY2Vzc29yJztcblxuY29uc3QgU0VMRUNUX01VTFRJUExFX1ZBTFVFX0FDQ0VTU09SOiBQcm92aWRlciA9IHtcbiAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG4gIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IFNlbGVjdE11bHRpcGxlQ29udHJvbFZhbHVlQWNjZXNzb3IpLFxuICBtdWx0aTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gX2J1aWxkVmFsdWVTdHJpbmcoaWQ6IHN0cmluZywgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGlmIChpZCA9PSBudWxsKSByZXR1cm4gYCR7dmFsdWV9YDtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHZhbHVlID0gYCcke3ZhbHVlfSdgO1xuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgdmFsdWUgPSAnT2JqZWN0JztcbiAgcmV0dXJuIGAke2lkfTogJHt2YWx1ZX1gLnNsaWNlKDAsIDUwKTtcbn1cblxuZnVuY3Rpb24gX2V4dHJhY3RJZCh2YWx1ZVN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlU3RyaW5nLnNwbGl0KCc6JylbMF07XG59XG5cbi8qKiBNb2NrIGludGVyZmFjZSBmb3IgSFRNTCBPcHRpb25zICovXG5pbnRlcmZhY2UgSFRNTE9wdGlvbiB7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIHNlbGVjdGVkOiBib29sZWFuO1xufVxuXG4vKiogTW9jayBpbnRlcmZhY2UgZm9yIEhUTUxDb2xsZWN0aW9uICovXG5hYnN0cmFjdCBjbGFzcyBIVE1MQ29sbGVjdGlvbiB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBsZW5ndGghOiBudW1iZXI7XG4gIGFic3RyYWN0IGl0ZW0oXzogbnVtYmVyKTogSFRNTE9wdGlvbjtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoZSBgQ29udHJvbFZhbHVlQWNjZXNzb3JgIGZvciB3cml0aW5nIG11bHRpLXNlbGVjdCBjb250cm9sIHZhbHVlcyBhbmQgbGlzdGVuaW5nIHRvIG11bHRpLXNlbGVjdFxuICogY29udHJvbCBjaGFuZ2VzLiBUaGUgdmFsdWUgYWNjZXNzb3IgaXMgdXNlZCBieSB0aGUgYEZvcm1Db250cm9sRGlyZWN0aXZlYCwgYEZvcm1Db250cm9sTmFtZWAsIGFuZFxuICogYE5nTW9kZWxgIGRpcmVjdGl2ZXMuXG4gKlxuICogQHNlZSB7QGxpbmsgU2VsZWN0Q29udHJvbFZhbHVlQWNjZXNzb3J9XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgVXNpbmcgYSBtdWx0aS1zZWxlY3QgY29udHJvbFxuICpcbiAqIFRoZSBmb2xsb3cgZXhhbXBsZSBzaG93cyB5b3UgaG93IHRvIHVzZSBhIG11bHRpLXNlbGVjdCBjb250cm9sIHdpdGggYSByZWFjdGl2ZSBmb3JtLlxuICpcbiAqIGBgYHRzXG4gKiBjb25zdCBjb3VudHJ5Q29udHJvbCA9IG5ldyBGb3JtQ29udHJvbCgpO1xuICogYGBgXG4gKlxuICogYGBgXG4gKiA8c2VsZWN0IG11bHRpcGxlIG5hbWU9XCJjb3VudHJpZXNcIiBbZm9ybUNvbnRyb2xdPVwiY291bnRyeUNvbnRyb2xcIj5cbiAqICAgPG9wdGlvbiAqbmdGb3I9XCJsZXQgY291bnRyeSBvZiBjb3VudHJpZXNcIiBbbmdWYWx1ZV09XCJjb3VudHJ5XCI+XG4gKiAgICAge3sgY291bnRyeS5uYW1lIH19XG4gKiAgIDwvb3B0aW9uPlxuICogPC9zZWxlY3Q+XG4gKiBgYGBcbiAqXG4gKiAjIyMgQ3VzdG9taXppbmcgb3B0aW9uIHNlbGVjdGlvblxuICpcbiAqIFRvIGN1c3RvbWl6ZSB0aGUgZGVmYXVsdCBvcHRpb24gY29tcGFyaXNvbiBhbGdvcml0aG0sIGA8c2VsZWN0PmAgc3VwcG9ydHMgYGNvbXBhcmVXaXRoYCBpbnB1dC5cbiAqIFNlZSB0aGUgYFNlbGVjdENvbnRyb2xWYWx1ZUFjY2Vzc29yYCBmb3IgdXNhZ2UuXG4gKlxuICogQG5nTW9kdWxlIFJlYWN0aXZlRm9ybXNNb2R1bGVcbiAqIEBuZ01vZHVsZSBGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6XG4gICAgICAnc2VsZWN0W211bHRpcGxlXVtmb3JtQ29udHJvbE5hbWVdLHNlbGVjdFttdWx0aXBsZV1bZm9ybUNvbnRyb2xdLHNlbGVjdFttdWx0aXBsZV1bbmdNb2RlbF0nLFxuICBob3N0OiB7JyhjaGFuZ2UpJzogJ29uQ2hhbmdlKCRldmVudC50YXJnZXQpJywgJyhibHVyKSc6ICdvblRvdWNoZWQoKSd9LFxuICBwcm92aWRlcnM6IFtTRUxFQ1RfTVVMVElQTEVfVkFMVUVfQUNDRVNTT1JdXG59KVxuZXhwb3J0IGNsYXNzIFNlbGVjdE11bHRpcGxlQ29udHJvbFZhbHVlQWNjZXNzb3IgZXh0ZW5kcyBCdWlsdEluQ29udHJvbFZhbHVlQWNjZXNzb3IgaW1wbGVtZW50c1xuICAgIENvbnRyb2xWYWx1ZUFjY2Vzc29yIHtcbiAgLyoqXG4gICAqIFRoZSBjdXJyZW50IHZhbHVlLlxuICAgKiBAbm9kb2NcbiAgICovXG4gIHZhbHVlOiBhbnk7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfb3B0aW9uTWFwOiBNYXA8c3RyaW5nLCDJtU5nU2VsZWN0TXVsdGlwbGVPcHRpb24+ID0gbmV3IE1hcDxzdHJpbmcsIMm1TmdTZWxlY3RNdWx0aXBsZU9wdGlvbj4oKTtcblxuICAvKiogQGludGVybmFsICovXG4gIF9pZENvdW50ZXI6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUcmFja3MgdGhlIG9wdGlvbiBjb21wYXJpc29uIGFsZ29yaXRobSBmb3IgdHJhY2tpbmcgaWRlbnRpdGllcyB3aGVuXG4gICAqIGNoZWNraW5nIGZvciBjaGFuZ2VzLlxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IGNvbXBhcmVXaXRoKGZuOiAobzE6IGFueSwgbzI6IGFueSkgPT4gYm9vbGVhbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5DT01QQVJFV0lUSF9OT1RfQV9GTixcbiAgICAgICAgICBgY29tcGFyZVdpdGggbXVzdCBiZSBhIGZ1bmN0aW9uLCBidXQgcmVjZWl2ZWQgJHtKU09OLnN0cmluZ2lmeShmbil9YCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbXBhcmVXaXRoID0gZm47XG4gIH1cblxuICBwcml2YXRlIF9jb21wYXJlV2l0aDogKG8xOiBhbnksIG8yOiBhbnkpID0+IGJvb2xlYW4gPSBPYmplY3QuaXM7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFwidmFsdWVcIiBwcm9wZXJ0eSBvbiBvbmUgb3Igb2YgbW9yZSBvZiB0aGUgc2VsZWN0J3Mgb3B0aW9ucy5cbiAgICogQG5vZG9jXG4gICAqL1xuICB3cml0ZVZhbHVlKHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgbGV0IG9wdGlvblNlbGVjdGVkU3RhdGVTZXR0ZXI6IChvcHQ6IMm1TmdTZWxlY3RNdWx0aXBsZU9wdGlvbiwgbzogYW55KSA9PiB2b2lkO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgLy8gY29udmVydCB2YWx1ZXMgdG8gaWRzXG4gICAgICBjb25zdCBpZHMgPSB2YWx1ZS5tYXAoKHYpID0+IHRoaXMuX2dldE9wdGlvbklkKHYpKTtcbiAgICAgIG9wdGlvblNlbGVjdGVkU3RhdGVTZXR0ZXIgPSAob3B0LCBvKSA9PiB7XG4gICAgICAgIG9wdC5fc2V0U2VsZWN0ZWQoaWRzLmluZGV4T2Yoby50b1N0cmluZygpKSA+IC0xKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvblNlbGVjdGVkU3RhdGVTZXR0ZXIgPSAob3B0LCBvKSA9PiB7XG4gICAgICAgIG9wdC5fc2V0U2VsZWN0ZWQoZmFsc2UpO1xuICAgICAgfTtcbiAgICB9XG4gICAgdGhpcy5fb3B0aW9uTWFwLmZvckVhY2gob3B0aW9uU2VsZWN0ZWRTdGF0ZVNldHRlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIGNvbnRyb2wgdmFsdWUgY2hhbmdlc1xuICAgKiBhbmQgd3JpdGVzIGFuIGFycmF5IG9mIHRoZSBzZWxlY3RlZCBvcHRpb25zLlxuICAgKiBAbm9kb2NcbiAgICovXG4gIG92ZXJyaWRlIHJlZ2lzdGVyT25DaGFuZ2UoZm46ICh2YWx1ZTogYW55KSA9PiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm9uQ2hhbmdlID0gKGVsZW1lbnQ6IEhUTUxTZWxlY3RFbGVtZW50KSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3RlZDogQXJyYXk8YW55PiA9IFtdO1xuICAgICAgY29uc3Qgc2VsZWN0ZWRPcHRpb25zID0gZWxlbWVudC5zZWxlY3RlZE9wdGlvbnM7XG4gICAgICBpZiAoc2VsZWN0ZWRPcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHNlbGVjdGVkT3B0aW9ucztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb3B0ID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICBjb25zdCB2YWwgPSB0aGlzLl9nZXRPcHRpb25WYWx1ZShvcHQudmFsdWUpO1xuICAgICAgICAgIHNlbGVjdGVkLnB1c2godmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRGVncmFkZSB0byB1c2UgYG9wdGlvbnNgIHdoZW4gYHNlbGVjdGVkT3B0aW9uc2AgcHJvcGVydHkgaXMgbm90IGF2YWlsYWJsZS5cbiAgICAgIC8vIE5vdGU6IHRoZSBgc2VsZWN0ZWRPcHRpb25zYCBpcyBhdmFpbGFibGUgaW4gYWxsIHN1cHBvcnRlZCBicm93c2VycywgYnV0IHRoZSBEb21pbm8gbGliXG4gICAgICAvLyBkb2Vzbid0IGhhdmUgaXQgY3VycmVudGx5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2ZnbmFzcy9kb21pbm8vaXNzdWVzLzE3Ny5cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gZWxlbWVudC5vcHRpb25zO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvcHQgPSBvcHRpb25zW2ldO1xuICAgICAgICAgIGlmIChvcHQuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRoaXMuX2dldE9wdGlvblZhbHVlKG9wdC52YWx1ZSk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKHZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnZhbHVlID0gc2VsZWN0ZWQ7XG4gICAgICBmbihzZWxlY3RlZCk7XG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3JlZ2lzdGVyT3B0aW9uKHZhbHVlOiDJtU5nU2VsZWN0TXVsdGlwbGVPcHRpb24pOiBzdHJpbmcge1xuICAgIGNvbnN0IGlkOiBzdHJpbmcgPSAodGhpcy5faWRDb3VudGVyKyspLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5fb3B0aW9uTWFwLnNldChpZCwgdmFsdWUpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2dldE9wdGlvbklkKHZhbHVlOiBhbnkpOiBzdHJpbmd8bnVsbCB7XG4gICAgZm9yIChjb25zdCBpZCBvZiB0aGlzLl9vcHRpb25NYXAua2V5cygpKSB7XG4gICAgICBpZiAodGhpcy5fY29tcGFyZVdpdGgodGhpcy5fb3B0aW9uTWFwLmdldChpZCkhLl92YWx1ZSwgdmFsdWUpKSByZXR1cm4gaWQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZ2V0T3B0aW9uVmFsdWUodmFsdWVTdHJpbmc6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3QgaWQ6IHN0cmluZyA9IF9leHRyYWN0SWQodmFsdWVTdHJpbmcpO1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25NYXAuaGFzKGlkKSA/IHRoaXMuX29wdGlvbk1hcC5nZXQoaWQpIS5fdmFsdWUgOiB2YWx1ZVN0cmluZztcbiAgfVxufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogTWFya3MgYDxvcHRpb24+YCBhcyBkeW5hbWljLCBzbyBBbmd1bGFyIGNhbiBiZSBub3RpZmllZCB3aGVuIG9wdGlvbnMgY2hhbmdlLlxuICpcbiAqIEBzZWUge0BsaW5rIFNlbGVjdE11bHRpcGxlQ29udHJvbFZhbHVlQWNjZXNzb3J9XG4gKlxuICogQG5nTW9kdWxlIFJlYWN0aXZlRm9ybXNNb2R1bGVcbiAqIEBuZ01vZHVsZSBGb3Jtc01vZHVsZVxuICogQHB1YmxpY0FwaVxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ29wdGlvbid9KVxuZXhwb3J0IGNsYXNzIMm1TmdTZWxlY3RNdWx0aXBsZU9wdGlvbiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBpZCE6IHN0cmluZztcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmFsdWU6IGFueTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2VsZW1lbnQ6IEVsZW1lbnRSZWYsIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICBAT3B0aW9uYWwoKSBASG9zdCgpIHByaXZhdGUgX3NlbGVjdDogU2VsZWN0TXVsdGlwbGVDb250cm9sVmFsdWVBY2Nlc3Nvcikge1xuICAgIGlmICh0aGlzLl9zZWxlY3QpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLl9zZWxlY3QuX3JlZ2lzdGVyT3B0aW9uKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVHJhY2tzIHRoZSB2YWx1ZSBib3VuZCB0byB0aGUgb3B0aW9uIGVsZW1lbnQuIFVubGlrZSB0aGUgdmFsdWUgYmluZGluZyxcbiAgICogbmdWYWx1ZSBzdXBwb3J0cyBiaW5kaW5nIHRvIG9iamVjdHMuXG4gICAqL1xuICBASW5wdXQoJ25nVmFsdWUnKVxuICBzZXQgbmdWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgaWYgKHRoaXMuX3NlbGVjdCA9PSBudWxsKSByZXR1cm47XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLl9zZXRFbGVtZW50VmFsdWUoX2J1aWxkVmFsdWVTdHJpbmcodGhpcy5pZCwgdmFsdWUpKTtcbiAgICB0aGlzLl9zZWxlY3Qud3JpdGVWYWx1ZSh0aGlzLl9zZWxlY3QudmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUcmFja3Mgc2ltcGxlIHN0cmluZyB2YWx1ZXMgYm91bmQgdG8gdGhlIG9wdGlvbiBlbGVtZW50LlxuICAgKiBGb3Igb2JqZWN0cywgdXNlIHRoZSBgbmdWYWx1ZWAgaW5wdXQgYmluZGluZy5cbiAgICovXG4gIEBJbnB1dCgndmFsdWUnKVxuICBzZXQgdmFsdWUodmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl9zZWxlY3QpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICB0aGlzLl9zZXRFbGVtZW50VmFsdWUoX2J1aWxkVmFsdWVTdHJpbmcodGhpcy5pZCwgdmFsdWUpKTtcbiAgICAgIHRoaXMuX3NlbGVjdC53cml0ZVZhbHVlKHRoaXMuX3NlbGVjdC52YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NldEVsZW1lbnRWYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfc2V0RWxlbWVudFZhbHVlKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLl9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQsICd2YWx1ZScsIHZhbHVlKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3NldFNlbGVjdGVkKHNlbGVjdGVkOiBib29sZWFuKSB7XG4gICAgdGhpcy5fcmVuZGVyZXIuc2V0UHJvcGVydHkodGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50LCAnc2VsZWN0ZWQnLCBzZWxlY3RlZCk7XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9zZWxlY3QpIHtcbiAgICAgIHRoaXMuX3NlbGVjdC5fb3B0aW9uTWFwLmRlbGV0ZSh0aGlzLmlkKTtcbiAgICAgIHRoaXMuX3NlbGVjdC53cml0ZVZhbHVlKHRoaXMuX3NlbGVjdC52YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7ybVOZ1NlbGVjdE11bHRpcGxlT3B0aW9uIGFzIE5nU2VsZWN0TXVsdGlwbGVPcHRpb259O1xuIl19