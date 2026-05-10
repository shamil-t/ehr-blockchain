/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { booleanAttribute, ChangeDetectorRef, Directive, EventEmitter, forwardRef, Host, Inject, Input, Optional, Output, Self } from '@angular/core';
import { FormControl } from '../model/form_control';
import { NG_ASYNC_VALIDATORS, NG_VALIDATORS } from '../validators';
import { AbstractFormGroupDirective } from './abstract_form_group_directive';
import { ControlContainer } from './control_container';
import { NG_VALUE_ACCESSOR } from './control_value_accessor';
import { NgControl } from './ng_control';
import { NgForm } from './ng_form';
import { NgModelGroup } from './ng_model_group';
import { CALL_SET_DISABLED_STATE, controlPath, isPropertyUpdated, selectValueAccessor, setUpControl } from './shared';
import { formGroupNameException, missingNameException, modelParentException } from './template_driven_errors';
import * as i0 from "@angular/core";
import * as i1 from "./control_container";
const formControlBinding = {
    provide: NgControl,
    useExisting: forwardRef(() => NgModel)
};
/**
 * `ngModel` forces an additional change detection run when its inputs change:
 * E.g.:
 * ```
 * <div>{{myModel.valid}}</div>
 * <input [(ngModel)]="myValue" #myModel="ngModel">
 * ```
 * I.e. `ngModel` can export itself on the element and then be used in the template.
 * Normally, this would result in expressions before the `input` that use the exported directive
 * to have an old value as they have been
 * dirty checked before. As this is a very common case for `ngModel`, we added this second change
 * detection run.
 *
 * Notes:
 * - this is just one extra run no matter how many `ngModel`s have been changed.
 * - this is a general problem when using `exportAs` for directives!
 */
const resolvedPromise = (() => Promise.resolve())();
/**
 * @description
 * Creates a `FormControl` instance from a [domain
 * model](https://en.wikipedia.org/wiki/Domain_model) and binds it to a form control element.
 *
 * The `FormControl` instance tracks the value, user interaction, and
 * validation status of the control and keeps the view synced with the model. If used
 * within a parent form, the directive also registers itself with the form as a child
 * control.
 *
 * This directive is used by itself or as part of a larger form. Use the
 * `ngModel` selector to activate it.
 *
 * It accepts a domain model as an optional `Input`. If you have a one-way binding
 * to `ngModel` with `[]` syntax, changing the domain model's value in the component
 * class sets the value in the view. If you have a two-way binding with `[()]` syntax
 * (also known as 'banana-in-a-box syntax'), the value in the UI always syncs back to
 * the domain model in your class.
 *
 * To inspect the properties of the associated `FormControl` (like the validity state),
 * export the directive into a local template variable using `ngModel` as the key (ex:
 * `#myVar="ngModel"`). You can then access the control using the directive's `control` property.
 * However, the most commonly used properties (like `valid` and `dirty`) also exist on the control
 * for direct access. See a full list of properties directly available in
 * `AbstractControlDirective`.
 *
 * @see {@link RadioControlValueAccessor}
 * @see {@link SelectControlValueAccessor}
 *
 * @usageNotes
 *
 * ### Using ngModel on a standalone control
 *
 * The following examples show a simple standalone control using `ngModel`:
 *
 * {@example forms/ts/simpleNgModel/simple_ng_model_example.ts region='Component'}
 *
 * When using the `ngModel` within `<form>` tags, you'll also need to supply a `name` attribute
 * so that the control can be registered with the parent form under that name.
 *
 * In the context of a parent form, it's often unnecessary to include one-way or two-way binding,
 * as the parent form syncs the value for you. You access its properties by exporting it into a
 * local template variable using `ngForm` such as (`#f="ngForm"`). Use the variable where
 * needed on form submission.
 *
 * If you do need to populate initial values into your form, using a one-way binding for
 * `ngModel` tends to be sufficient as long as you use the exported form's value rather
 * than the domain model's value on submit.
 *
 * ### Using ngModel within a form
 *
 * The following example shows controls using `ngModel` within a form:
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * ### Using a standalone ngModel within a group
 *
 * The following example shows you how to use a standalone ngModel control
 * within a form. This controls the display of the form, but doesn't contain form data.
 *
 * ```html
 * <form>
 *   <input name="login" ngModel placeholder="Login">
 *   <input type="checkbox" ngModel [ngModelOptions]="{standalone: true}"> Show more options?
 * </form>
 * <!-- form value: {login: ''} -->
 * ```
 *
 * ### Setting the ngModel `name` attribute through options
 *
 * The following example shows you an alternate way to set the name attribute. Here,
 * an attribute identified as name is used within a custom form control component. To still be able
 * to specify the NgModel's name, you must specify it using the `ngModelOptions` input instead.
 *
 * ```html
 * <form>
 *   <my-custom-form-control name="Nancy" ngModel [ngModelOptions]="{name: 'user'}">
 *   </my-custom-form-control>
 * </form>
 * <!-- form value: {user: ''} -->
 * ```
 *
 * @ngModule FormsModule
 * @publicApi
 */
export class NgModel extends NgControl {
    constructor(parent, validators, asyncValidators, valueAccessors, _changeDetectorRef, callSetDisabledState) {
        super();
        this._changeDetectorRef = _changeDetectorRef;
        this.callSetDisabledState = callSetDisabledState;
        this.control = new FormControl();
        /** @internal */
        this._registered = false;
        /**
         * @description
         * Tracks the name bound to the directive. If a parent form exists, it
         * uses this name as a key to retrieve this control's value.
         */
        this.name = '';
        /**
         * @description
         * Event emitter for producing the `ngModelChange` event after
         * the view model updates.
         */
        this.update = new EventEmitter();
        this._parent = parent;
        this._setValidators(validators);
        this._setAsyncValidators(asyncValidators);
        this.valueAccessor = selectValueAccessor(this, valueAccessors);
    }
    /** @nodoc */
    ngOnChanges(changes) {
        this._checkForErrors();
        if (!this._registered || 'name' in changes) {
            if (this._registered) {
                this._checkName();
                if (this.formDirective) {
                    // We can't call `formDirective.removeControl(this)`, because the `name` has already been
                    // changed. We also can't reset the name temporarily since the logic in `removeControl`
                    // is inside a promise and it won't run immediately. We work around it by giving it an
                    // object with the same shape instead.
                    const oldName = changes['name'].previousValue;
                    this.formDirective.removeControl({ name: oldName, path: this._getPath(oldName) });
                }
            }
            this._setUpControl();
        }
        if ('isDisabled' in changes) {
            this._updateDisabled(changes);
        }
        if (isPropertyUpdated(changes, this.viewModel)) {
            this._updateValue(this.model);
            this.viewModel = this.model;
        }
    }
    /** @nodoc */
    ngOnDestroy() {
        this.formDirective && this.formDirective.removeControl(this);
    }
    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    get path() {
        return this._getPath(this.name);
    }
    /**
     * @description
     * The top-level directive for this control if present, otherwise null.
     */
    get formDirective() {
        return this._parent ? this._parent.formDirective : null;
    }
    /**
     * @description
     * Sets the new value for the view model and emits an `ngModelChange` event.
     *
     * @param newValue The new value emitted by `ngModelChange`.
     */
    viewToModelUpdate(newValue) {
        this.viewModel = newValue;
        this.update.emit(newValue);
    }
    _setUpControl() {
        this._setUpdateStrategy();
        this._isStandalone() ? this._setUpStandalone() : this.formDirective.addControl(this);
        this._registered = true;
    }
    _setUpdateStrategy() {
        if (this.options && this.options.updateOn != null) {
            this.control._updateOn = this.options.updateOn;
        }
    }
    _isStandalone() {
        return !this._parent || !!(this.options && this.options.standalone);
    }
    _setUpStandalone() {
        setUpControl(this.control, this, this.callSetDisabledState);
        this.control.updateValueAndValidity({ emitEvent: false });
    }
    _checkForErrors() {
        if (!this._isStandalone()) {
            this._checkParentType();
        }
        this._checkName();
    }
    _checkParentType() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (!(this._parent instanceof NgModelGroup) &&
                this._parent instanceof AbstractFormGroupDirective) {
                throw formGroupNameException();
            }
            else if (!(this._parent instanceof NgModelGroup) && !(this._parent instanceof NgForm)) {
                throw modelParentException();
            }
        }
    }
    _checkName() {
        if (this.options && this.options.name)
            this.name = this.options.name;
        if (!this._isStandalone() && !this.name && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw missingNameException();
        }
    }
    _updateValue(value) {
        resolvedPromise.then(() => {
            this.control.setValue(value, { emitViewToModelChange: false });
            this._changeDetectorRef?.markForCheck();
        });
    }
    _updateDisabled(changes) {
        const disabledValue = changes['isDisabled'].currentValue;
        // checking for 0 to avoid breaking change
        const isDisabled = disabledValue !== 0 && booleanAttribute(disabledValue);
        resolvedPromise.then(() => {
            if (isDisabled && !this.control.disabled) {
                this.control.disable();
            }
            else if (!isDisabled && this.control.disabled) {
                this.control.enable();
            }
            this._changeDetectorRef?.markForCheck();
        });
    }
    _getPath(controlName) {
        return this._parent ? controlPath(controlName, this._parent) : [controlName];
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgModel, deps: [{ token: i1.ControlContainer, host: true, optional: true }, { token: NG_VALIDATORS, optional: true, self: true }, { token: NG_ASYNC_VALIDATORS, optional: true, self: true }, { token: NG_VALUE_ACCESSOR, optional: true, self: true }, { token: ChangeDetectorRef, optional: true }, { token: CALL_SET_DISABLED_STATE, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.12", type: NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: { name: "name", isDisabled: ["disabled", "isDisabled"], model: ["ngModel", "model"], options: ["ngModelOptions", "options"] }, outputs: { update: "ngModelChange" }, providers: [formControlBinding], exportAs: ["ngModel"], usesInheritance: true, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: NgModel, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngModel]:not([formControlName]):not([formControl])',
                    providers: [formControlBinding],
                    exportAs: 'ngModel'
                }]
        }], ctorParameters: function () { return [{ type: i1.ControlContainer, decorators: [{
                    type: Optional
                }, {
                    type: Host
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Self
                }, {
                    type: Inject,
                    args: [NG_VALIDATORS]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Self
                }, {
                    type: Inject,
                    args: [NG_ASYNC_VALIDATORS]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Self
                }, {
                    type: Inject,
                    args: [NG_VALUE_ACCESSOR]
                }] }, { type: i0.ChangeDetectorRef, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ChangeDetectorRef]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CALL_SET_DISABLED_STATE]
                }] }]; }, propDecorators: { name: [{
                type: Input
            }], isDisabled: [{
                type: Input,
                args: ['disabled']
            }], model: [{
                type: Input,
                args: ['ngModel']
            }], options: [{
                type: Input,
                args: ['ngModelOptions']
            }], update: [{
                type: Output,
                args: ['ngModelChange']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvZGlyZWN0aXZlcy9uZ19tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQXdCLFFBQVEsRUFBRSxNQUFNLEVBQVksSUFBSSxFQUFnQixNQUFNLGVBQWUsQ0FBQztBQUduTSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVqRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMzRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQXVCLGlCQUFpQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDakYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUEwQixZQUFZLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUksT0FBTyxFQUFDLHNCQUFzQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7OztBQUc1RyxNQUFNLGtCQUFrQixHQUFhO0lBQ25DLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FB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MEJBQUksSUFBSTs7MEJBQUksTUFBTTsyQkFBQyxhQUFhOzswQkFDeEMsUUFBUTs7MEJBQUksSUFBSTs7MEJBQUksTUFBTTsyQkFBQyxtQkFBbUI7OzBCQUU5QyxRQUFROzswQkFBSSxJQUFJOzswQkFBSSxNQUFNOzJCQUFDLGlCQUFpQjs7MEJBQzVDLFFBQVE7OzBCQUFJLE1BQU07MkJBQUMsaUJBQWlCOzswQkFDcEMsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyx1QkFBdUI7NENBaEQ3QixJQUFJO3NCQUFyQixLQUFLO2dCQU9hLFVBQVU7c0JBQTVCLEtBQUs7dUJBQUMsVUFBVTtnQkFNQyxLQUFLO3NCQUF0QixLQUFLO3VCQUFDLFNBQVM7Z0JBbUJTLE9BQU87c0JBQS9CLEtBQUs7dUJBQUMsZ0JBQWdCO2dCQU9FLE1BQU07c0JBQTlCLE1BQU07dUJBQUMsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Jvb2xlYW5BdHRyaWJ1dGUsIENoYW5nZURldGVjdG9yUmVmLCBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgZm9yd2FyZFJlZiwgSG9zdCwgSW5qZWN0LCBJbnB1dCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBPdXRwdXQsIFByb3ZpZGVyLCBTZWxmLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtGb3JtSG9va3N9IGZyb20gJy4uL21vZGVsL2Fic3RyYWN0X21vZGVsJztcbmltcG9ydCB7Rm9ybUNvbnRyb2x9IGZyb20gJy4uL21vZGVsL2Zvcm1fY29udHJvbCc7XG5pbXBvcnQge05HX0FTWU5DX1ZBTElEQVRPUlMsIE5HX1ZBTElEQVRPUlN9IGZyb20gJy4uL3ZhbGlkYXRvcnMnO1xuXG5pbXBvcnQge0Fic3RyYWN0Rm9ybUdyb3VwRGlyZWN0aXZlfSBmcm9tICcuL2Fic3RyYWN0X2Zvcm1fZ3JvdXBfZGlyZWN0aXZlJztcbmltcG9ydCB7Q29udHJvbENvbnRhaW5lcn0gZnJvbSAnLi9jb250cm9sX2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbnRyb2xWYWx1ZUFjY2Vzc29yLCBOR19WQUxVRV9BQ0NFU1NPUn0gZnJvbSAnLi9jb250cm9sX3ZhbHVlX2FjY2Vzc29yJztcbmltcG9ydCB7TmdDb250cm9sfSBmcm9tICcuL25nX2NvbnRyb2wnO1xuaW1wb3J0IHtOZ0Zvcm19IGZyb20gJy4vbmdfZm9ybSc7XG5pbXBvcnQge05nTW9kZWxHcm91cH0gZnJvbSAnLi9uZ19tb2RlbF9ncm91cCc7XG5pbXBvcnQge0NBTExfU0VUX0RJU0FCTEVEX1NUQVRFLCBjb250cm9sUGF0aCwgaXNQcm9wZXJ0eVVwZGF0ZWQsIHNlbGVjdFZhbHVlQWNjZXNzb3IsIFNldERpc2FibGVkU3RhdGVPcHRpb24sIHNldFVwQ29udHJvbH0gZnJvbSAnLi9zaGFyZWQnO1xuaW1wb3J0IHtmb3JtR3JvdXBOYW1lRXhjZXB0aW9uLCBtaXNzaW5nTmFtZUV4Y2VwdGlvbiwgbW9kZWxQYXJlbnRFeGNlcHRpb259IGZyb20gJy4vdGVtcGxhdGVfZHJpdmVuX2Vycm9ycyc7XG5pbXBvcnQge0FzeW5jVmFsaWRhdG9yLCBBc3luY1ZhbGlkYXRvckZuLCBWYWxpZGF0b3IsIFZhbGlkYXRvckZufSBmcm9tICcuL3ZhbGlkYXRvcnMnO1xuXG5jb25zdCBmb3JtQ29udHJvbEJpbmRpbmc6IFByb3ZpZGVyID0ge1xuICBwcm92aWRlOiBOZ0NvbnRyb2wsXG4gIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IE5nTW9kZWwpXG59O1xuXG4vKipcbiAqIGBuZ01vZGVsYCBmb3JjZXMgYW4gYWRkaXRpb25hbCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biB3aGVuIGl0cyBpbnB1dHMgY2hhbmdlOlxuICogRS5nLjpcbiAqIGBgYFxuICogPGRpdj57e215TW9kZWwudmFsaWR9fTwvZGl2PlxuICogPGlucHV0IFsobmdNb2RlbCldPVwibXlWYWx1ZVwiICNteU1vZGVsPVwibmdNb2RlbFwiPlxuICogYGBgXG4gKiBJLmUuIGBuZ01vZGVsYCBjYW4gZXhwb3J0IGl0c2VsZiBvbiB0aGUgZWxlbWVudCBhbmQgdGhlbiBiZSB1c2VkIGluIHRoZSB0ZW1wbGF0ZS5cbiAqIE5vcm1hbGx5LCB0aGlzIHdvdWxkIHJlc3VsdCBpbiBleHByZXNzaW9ucyBiZWZvcmUgdGhlIGBpbnB1dGAgdGhhdCB1c2UgdGhlIGV4cG9ydGVkIGRpcmVjdGl2ZVxuICogdG8gaGF2ZSBhbiBvbGQgdmFsdWUgYXMgdGhleSBoYXZlIGJlZW5cbiAqIGRpcnR5IGNoZWNrZWQgYmVmb3JlLiBBcyB0aGlzIGlzIGEgdmVyeSBjb21tb24gY2FzZSBmb3IgYG5nTW9kZWxgLCB3ZSBhZGRlZCB0aGlzIHNlY29uZCBjaGFuZ2VcbiAqIGRldGVjdGlvbiBydW4uXG4gKlxuICogTm90ZXM6XG4gKiAtIHRoaXMgaXMganVzdCBvbmUgZXh0cmEgcnVuIG5vIG1hdHRlciBob3cgbWFueSBgbmdNb2RlbGBzIGhhdmUgYmVlbiBjaGFuZ2VkLlxuICogLSB0aGlzIGlzIGEgZ2VuZXJhbCBwcm9ibGVtIHdoZW4gdXNpbmcgYGV4cG9ydEFzYCBmb3IgZGlyZWN0aXZlcyFcbiAqL1xuY29uc3QgcmVzb2x2ZWRQcm9taXNlID0gKCgpID0+IFByb21pc2UucmVzb2x2ZSgpKSgpO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIGBGb3JtQ29udHJvbGAgaW5zdGFuY2UgZnJvbSBhIFtkb21haW5cbiAqIG1vZGVsXShodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Eb21haW5fbW9kZWwpIGFuZCBiaW5kcyBpdCB0byBhIGZvcm0gY29udHJvbCBlbGVtZW50LlxuICpcbiAqIFRoZSBgRm9ybUNvbnRyb2xgIGluc3RhbmNlIHRyYWNrcyB0aGUgdmFsdWUsIHVzZXIgaW50ZXJhY3Rpb24sIGFuZFxuICogdmFsaWRhdGlvbiBzdGF0dXMgb2YgdGhlIGNvbnRyb2wgYW5kIGtlZXBzIHRoZSB2aWV3IHN5bmNlZCB3aXRoIHRoZSBtb2RlbC4gSWYgdXNlZFxuICogd2l0aGluIGEgcGFyZW50IGZvcm0sIHRoZSBkaXJlY3RpdmUgYWxzbyByZWdpc3RlcnMgaXRzZWxmIHdpdGggdGhlIGZvcm0gYXMgYSBjaGlsZFxuICogY29udHJvbC5cbiAqXG4gKiBUaGlzIGRpcmVjdGl2ZSBpcyB1c2VkIGJ5IGl0c2VsZiBvciBhcyBwYXJ0IG9mIGEgbGFyZ2VyIGZvcm0uIFVzZSB0aGVcbiAqIGBuZ01vZGVsYCBzZWxlY3RvciB0byBhY3RpdmF0ZSBpdC5cbiAqXG4gKiBJdCBhY2NlcHRzIGEgZG9tYWluIG1vZGVsIGFzIGFuIG9wdGlvbmFsIGBJbnB1dGAuIElmIHlvdSBoYXZlIGEgb25lLXdheSBiaW5kaW5nXG4gKiB0byBgbmdNb2RlbGAgd2l0aCBgW11gIHN5bnRheCwgY2hhbmdpbmcgdGhlIGRvbWFpbiBtb2RlbCdzIHZhbHVlIGluIHRoZSBjb21wb25lbnRcbiAqIGNsYXNzIHNldHMgdGhlIHZhbHVlIGluIHRoZSB2aWV3LiBJZiB5b3UgaGF2ZSBhIHR3by13YXkgYmluZGluZyB3aXRoIGBbKCldYCBzeW50YXhcbiAqIChhbHNvIGtub3duIGFzICdiYW5hbmEtaW4tYS1ib3ggc3ludGF4JyksIHRoZSB2YWx1ZSBpbiB0aGUgVUkgYWx3YXlzIHN5bmNzIGJhY2sgdG9cbiAqIHRoZSBkb21haW4gbW9kZWwgaW4geW91ciBjbGFzcy5cbiAqXG4gKiBUbyBpbnNwZWN0IHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBhc3NvY2lhdGVkIGBGb3JtQ29udHJvbGAgKGxpa2UgdGhlIHZhbGlkaXR5IHN0YXRlKSxcbiAqIGV4cG9ydCB0aGUgZGlyZWN0aXZlIGludG8gYSBsb2NhbCB0ZW1wbGF0ZSB2YXJpYWJsZSB1c2luZyBgbmdNb2RlbGAgYXMgdGhlIGtleSAoZXg6XG4gKiBgI215VmFyPVwibmdNb2RlbFwiYCkuIFlvdSBjYW4gdGhlbiBhY2Nlc3MgdGhlIGNvbnRyb2wgdXNpbmcgdGhlIGRpcmVjdGl2ZSdzIGBjb250cm9sYCBwcm9wZXJ0eS5cbiAqIEhvd2V2ZXIsIHRoZSBtb3N0IGNvbW1vbmx5IHVzZWQgcHJvcGVydGllcyAobGlrZSBgdmFsaWRgIGFuZCBgZGlydHlgKSBhbHNvIGV4aXN0IG9uIHRoZSBjb250cm9sXG4gKiBmb3IgZGlyZWN0IGFjY2Vzcy4gU2VlIGEgZnVsbCBsaXN0IG9mIHByb3BlcnRpZXMgZGlyZWN0bHkgYXZhaWxhYmxlIGluXG4gKiBgQWJzdHJhY3RDb250cm9sRGlyZWN0aXZlYC5cbiAqXG4gKiBAc2VlIHtAbGluayBSYWRpb0NvbnRyb2xWYWx1ZUFjY2Vzc29yfVxuICogQHNlZSB7QGxpbmsgU2VsZWN0Q29udHJvbFZhbHVlQWNjZXNzb3J9XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgVXNpbmcgbmdNb2RlbCBvbiBhIHN0YW5kYWxvbmUgY29udHJvbFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZXMgc2hvdyBhIHNpbXBsZSBzdGFuZGFsb25lIGNvbnRyb2wgdXNpbmcgYG5nTW9kZWxgOlxuICpcbiAqIHtAZXhhbXBsZSBmb3Jtcy90cy9zaW1wbGVOZ01vZGVsL3NpbXBsZV9uZ19tb2RlbF9leGFtcGxlLnRzIHJlZ2lvbj0nQ29tcG9uZW50J31cbiAqXG4gKiBXaGVuIHVzaW5nIHRoZSBgbmdNb2RlbGAgd2l0aGluIGA8Zm9ybT5gIHRhZ3MsIHlvdSdsbCBhbHNvIG5lZWQgdG8gc3VwcGx5IGEgYG5hbWVgIGF0dHJpYnV0ZVxuICogc28gdGhhdCB0aGUgY29udHJvbCBjYW4gYmUgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwYXJlbnQgZm9ybSB1bmRlciB0aGF0IG5hbWUuXG4gKlxuICogSW4gdGhlIGNvbnRleHQgb2YgYSBwYXJlbnQgZm9ybSwgaXQncyBvZnRlbiB1bm5lY2Vzc2FyeSB0byBpbmNsdWRlIG9uZS13YXkgb3IgdHdvLXdheSBiaW5kaW5nLFxuICogYXMgdGhlIHBhcmVudCBmb3JtIHN5bmNzIHRoZSB2YWx1ZSBmb3IgeW91LiBZb3UgYWNjZXNzIGl0cyBwcm9wZXJ0aWVzIGJ5IGV4cG9ydGluZyBpdCBpbnRvIGFcbiAqIGxvY2FsIHRlbXBsYXRlIHZhcmlhYmxlIHVzaW5nIGBuZ0Zvcm1gIHN1Y2ggYXMgKGAjZj1cIm5nRm9ybVwiYCkuIFVzZSB0aGUgdmFyaWFibGUgd2hlcmVcbiAqIG5lZWRlZCBvbiBmb3JtIHN1Ym1pc3Npb24uXG4gKlxuICogSWYgeW91IGRvIG5lZWQgdG8gcG9wdWxhdGUgaW5pdGlhbCB2YWx1ZXMgaW50byB5b3VyIGZvcm0sIHVzaW5nIGEgb25lLXdheSBiaW5kaW5nIGZvclxuICogYG5nTW9kZWxgIHRlbmRzIHRvIGJlIHN1ZmZpY2llbnQgYXMgbG9uZyBhcyB5b3UgdXNlIHRoZSBleHBvcnRlZCBmb3JtJ3MgdmFsdWUgcmF0aGVyXG4gKiB0aGFuIHRoZSBkb21haW4gbW9kZWwncyB2YWx1ZSBvbiBzdWJtaXQuXG4gKlxuICogIyMjIFVzaW5nIG5nTW9kZWwgd2l0aGluIGEgZm9ybVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzaG93cyBjb250cm9scyB1c2luZyBgbmdNb2RlbGAgd2l0aGluIGEgZm9ybTpcbiAqXG4gKiB7QGV4YW1wbGUgZm9ybXMvdHMvc2ltcGxlRm9ybS9zaW1wbGVfZm9ybV9leGFtcGxlLnRzIHJlZ2lvbj0nQ29tcG9uZW50J31cbiAqXG4gKiAjIyMgVXNpbmcgYSBzdGFuZGFsb25lIG5nTW9kZWwgd2l0aGluIGEgZ3JvdXBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgeW91IGhvdyB0byB1c2UgYSBzdGFuZGFsb25lIG5nTW9kZWwgY29udHJvbFxuICogd2l0aGluIGEgZm9ybS4gVGhpcyBjb250cm9scyB0aGUgZGlzcGxheSBvZiB0aGUgZm9ybSwgYnV0IGRvZXNuJ3QgY29udGFpbiBmb3JtIGRhdGEuXG4gKlxuICogYGBgaHRtbFxuICogPGZvcm0+XG4gKiAgIDxpbnB1dCBuYW1lPVwibG9naW5cIiBuZ01vZGVsIHBsYWNlaG9sZGVyPVwiTG9naW5cIj5cbiAqICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5nTW9kZWwgW25nTW9kZWxPcHRpb25zXT1cIntzdGFuZGFsb25lOiB0cnVlfVwiPiBTaG93IG1vcmUgb3B0aW9ucz9cbiAqIDwvZm9ybT5cbiAqIDwhLS0gZm9ybSB2YWx1ZToge2xvZ2luOiAnJ30gLS0+XG4gKiBgYGBcbiAqXG4gKiAjIyMgU2V0dGluZyB0aGUgbmdNb2RlbCBgbmFtZWAgYXR0cmlidXRlIHRocm91Z2ggb3B0aW9uc1xuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzaG93cyB5b3UgYW4gYWx0ZXJuYXRlIHdheSB0byBzZXQgdGhlIG5hbWUgYXR0cmlidXRlLiBIZXJlLFxuICogYW4gYXR0cmlidXRlIGlkZW50aWZpZWQgYXMgbmFtZSBpcyB1c2VkIHdpdGhpbiBhIGN1c3RvbSBmb3JtIGNvbnRyb2wgY29tcG9uZW50LiBUbyBzdGlsbCBiZSBhYmxlXG4gKiB0byBzcGVjaWZ5IHRoZSBOZ01vZGVsJ3MgbmFtZSwgeW91IG11c3Qgc3BlY2lmeSBpdCB1c2luZyB0aGUgYG5nTW9kZWxPcHRpb25zYCBpbnB1dCBpbnN0ZWFkLlxuICpcbiAqIGBgYGh0bWxcbiAqIDxmb3JtPlxuICogICA8bXktY3VzdG9tLWZvcm0tY29udHJvbCBuYW1lPVwiTmFuY3lcIiBuZ01vZGVsIFtuZ01vZGVsT3B0aW9uc109XCJ7bmFtZTogJ3VzZXInfVwiPlxuICogICA8L215LWN1c3RvbS1mb3JtLWNvbnRyb2w+XG4gKiA8L2Zvcm0+XG4gKiA8IS0tIGZvcm0gdmFsdWU6IHt1c2VyOiAnJ30gLS0+XG4gKiBgYGBcbiAqXG4gKiBAbmdNb2R1bGUgRm9ybXNNb2R1bGVcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW25nTW9kZWxdOm5vdChbZm9ybUNvbnRyb2xOYW1lXSk6bm90KFtmb3JtQ29udHJvbF0pJyxcbiAgcHJvdmlkZXJzOiBbZm9ybUNvbnRyb2xCaW5kaW5nXSxcbiAgZXhwb3J0QXM6ICduZ01vZGVsJ1xufSlcbmV4cG9ydCBjbGFzcyBOZ01vZGVsIGV4dGVuZHMgTmdDb250cm9sIGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuICBwdWJsaWMgb3ZlcnJpZGUgcmVhZG9ubHkgY29udHJvbDogRm9ybUNvbnRyb2wgPSBuZXcgRm9ybUNvbnRyb2woKTtcblxuICAvLyBBdCBydW50aW1lIHdlIGNvZXJjZSBhcmJpdHJhcnkgdmFsdWVzIGFzc2lnbmVkIHRvIHRoZSBcImRpc2FibGVkXCIgaW5wdXQgdG8gYSBcImJvb2xlYW5cIi5cbiAgLy8gVGhpcyBpcyBub3QgcmVmbGVjdGVkIGluIHRoZSB0eXBlIG9mIHRoZSBwcm9wZXJ0eSBiZWNhdXNlIG91dHNpZGUgb2YgdGVtcGxhdGVzLCBjb25zdW1lcnNcbiAgLy8gc2hvdWxkIG9ubHkgZGVhbCB3aXRoIGJvb2xlYW5zLiBJbiB0ZW1wbGF0ZXMsIGEgc3RyaW5nIGlzIGFsbG93ZWQgZm9yIGNvbnZlbmllbmNlIGFuZCB0b1xuICAvLyBtYXRjaCB0aGUgbmF0aXZlIFwiZGlzYWJsZWQgYXR0cmlidXRlXCIgc2VtYW50aWNzIHdoaWNoIGNhbiBiZSBvYnNlcnZlZCBvbiBpbnB1dCBlbGVtZW50cy5cbiAgLy8gVGhpcyBzdGF0aWMgbWVtYmVyIHRlbGxzIHRoZSBjb21waWxlciB0aGF0IHZhbHVlcyBvZiB0eXBlIFwic3RyaW5nXCIgY2FuIGFsc28gYmUgYXNzaWduZWRcbiAgLy8gdG8gdGhlIGlucHV0IGluIGEgdGVtcGxhdGUuXG4gIC8qKiBAbm9kb2MgKi9cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2lzRGlzYWJsZWQ6IGJvb2xlYW58c3RyaW5nO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3JlZ2lzdGVyZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSW50ZXJuYWwgcmVmZXJlbmNlIHRvIHRoZSB2aWV3IG1vZGVsIHZhbHVlLlxuICAgKiBAbm9kb2NcbiAgICovXG4gIHZpZXdNb2RlbDogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVHJhY2tzIHRoZSBuYW1lIGJvdW5kIHRvIHRoZSBkaXJlY3RpdmUuIElmIGEgcGFyZW50IGZvcm0gZXhpc3RzLCBpdFxuICAgKiB1c2VzIHRoaXMgbmFtZSBhcyBhIGtleSB0byByZXRyaWV2ZSB0aGlzIGNvbnRyb2wncyB2YWx1ZS5cbiAgICovXG4gIEBJbnB1dCgpIG92ZXJyaWRlIG5hbWU6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVHJhY2tzIHdoZXRoZXIgdGhlIGNvbnRyb2wgaXMgZGlzYWJsZWQuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgQElucHV0KCdkaXNhYmxlZCcpIGlzRGlzYWJsZWQhOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVHJhY2tzIHRoZSB2YWx1ZSBib3VuZCB0byB0aGlzIGRpcmVjdGl2ZS5cbiAgICovXG4gIEBJbnB1dCgnbmdNb2RlbCcpIG1vZGVsOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUcmFja3MgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhpcyBgbmdNb2RlbGAgaW5zdGFuY2UuXG4gICAqXG4gICAqICoqbmFtZSoqOiBBbiBhbHRlcm5hdGl2ZSB0byBzZXR0aW5nIHRoZSBuYW1lIGF0dHJpYnV0ZSBvbiB0aGUgZm9ybSBjb250cm9sIGVsZW1lbnQuIFNlZVxuICAgKiB0aGUgW2V4YW1wbGVdKGFwaS9mb3Jtcy9OZ01vZGVsI3VzaW5nLW5nbW9kZWwtb24tYS1zdGFuZGFsb25lLWNvbnRyb2wpIGZvciB1c2luZyBgTmdNb2RlbGBcbiAgICogYXMgYSBzdGFuZGFsb25lIGNvbnRyb2wuXG4gICAqXG4gICAqICoqc3RhbmRhbG9uZSoqOiBXaGVuIHNldCB0byB0cnVlLCB0aGUgYG5nTW9kZWxgIHdpbGwgbm90IHJlZ2lzdGVyIGl0c2VsZiB3aXRoIGl0cyBwYXJlbnQgZm9ybSxcbiAgICogYW5kIGFjdHMgYXMgaWYgaXQncyBub3QgaW4gdGhlIGZvcm0uIERlZmF1bHRzIHRvIGZhbHNlLiBJZiBubyBwYXJlbnQgZm9ybSBleGlzdHMsIHRoaXMgb3B0aW9uXG4gICAqIGhhcyBubyBlZmZlY3QuXG4gICAqXG4gICAqICoqdXBkYXRlT24qKjogRGVmaW5lcyB0aGUgZXZlbnQgdXBvbiB3aGljaCB0aGUgZm9ybSBjb250cm9sIHZhbHVlIGFuZCB2YWxpZGl0eSB1cGRhdGUuXG4gICAqIERlZmF1bHRzIHRvICdjaGFuZ2UnLiBQb3NzaWJsZSB2YWx1ZXM6IGAnY2hhbmdlJ2AgfCBgJ2JsdXInYCB8IGAnc3VibWl0J2AuXG4gICAqXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgQElucHV0KCduZ01vZGVsT3B0aW9ucycpIG9wdGlvbnMhOiB7bmFtZT86IHN0cmluZywgc3RhbmRhbG9uZT86IGJvb2xlYW4sIHVwZGF0ZU9uPzogRm9ybUhvb2tzfTtcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIEV2ZW50IGVtaXR0ZXIgZm9yIHByb2R1Y2luZyB0aGUgYG5nTW9kZWxDaGFuZ2VgIGV2ZW50IGFmdGVyXG4gICAqIHRoZSB2aWV3IG1vZGVsIHVwZGF0ZXMuXG4gICAqL1xuICBAT3V0cHV0KCduZ01vZGVsQ2hhbmdlJykgdXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQE9wdGlvbmFsKCkgQEhvc3QoKSBwYXJlbnQ6IENvbnRyb2xDb250YWluZXIsXG4gICAgICBAT3B0aW9uYWwoKSBAU2VsZigpIEBJbmplY3QoTkdfVkFMSURBVE9SUykgdmFsaWRhdG9yczogKFZhbGlkYXRvcnxWYWxpZGF0b3JGbilbXSxcbiAgICAgIEBPcHRpb25hbCgpIEBTZWxmKCkgQEluamVjdChOR19BU1lOQ19WQUxJREFUT1JTKSBhc3luY1ZhbGlkYXRvcnM6XG4gICAgICAgICAgKEFzeW5jVmFsaWRhdG9yfEFzeW5jVmFsaWRhdG9yRm4pW10sXG4gICAgICBAT3B0aW9uYWwoKSBAU2VsZigpIEBJbmplY3QoTkdfVkFMVUVfQUNDRVNTT1IpIHZhbHVlQWNjZXNzb3JzOiBDb250cm9sVmFsdWVBY2Nlc3NvcltdLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChDaGFuZ2VEZXRlY3RvclJlZikgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY/OiBDaGFuZ2VEZXRlY3RvclJlZnxudWxsLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChDQUxMX1NFVF9ESVNBQkxFRF9TVEFURSkgcHJpdmF0ZSBjYWxsU2V0RGlzYWJsZWRTdGF0ZT86XG4gICAgICAgICAgU2V0RGlzYWJsZWRTdGF0ZU9wdGlvbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX3NldFZhbGlkYXRvcnModmFsaWRhdG9ycyk7XG4gICAgdGhpcy5fc2V0QXN5bmNWYWxpZGF0b3JzKGFzeW5jVmFsaWRhdG9ycyk7XG4gICAgdGhpcy52YWx1ZUFjY2Vzc29yID0gc2VsZWN0VmFsdWVBY2Nlc3Nvcih0aGlzLCB2YWx1ZUFjY2Vzc29ycyk7XG4gIH1cblxuICAvKiogQG5vZG9jICovXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICB0aGlzLl9jaGVja0ZvckVycm9ycygpO1xuICAgIGlmICghdGhpcy5fcmVnaXN0ZXJlZCB8fCAnbmFtZScgaW4gY2hhbmdlcykge1xuICAgICAgaWYgKHRoaXMuX3JlZ2lzdGVyZWQpIHtcbiAgICAgICAgdGhpcy5fY2hlY2tOYW1lKCk7XG4gICAgICAgIGlmICh0aGlzLmZvcm1EaXJlY3RpdmUpIHtcbiAgICAgICAgICAvLyBXZSBjYW4ndCBjYWxsIGBmb3JtRGlyZWN0aXZlLnJlbW92ZUNvbnRyb2wodGhpcylgLCBiZWNhdXNlIHRoZSBgbmFtZWAgaGFzIGFscmVhZHkgYmVlblxuICAgICAgICAgIC8vIGNoYW5nZWQuIFdlIGFsc28gY2FuJ3QgcmVzZXQgdGhlIG5hbWUgdGVtcG9yYXJpbHkgc2luY2UgdGhlIGxvZ2ljIGluIGByZW1vdmVDb250cm9sYFxuICAgICAgICAgIC8vIGlzIGluc2lkZSBhIHByb21pc2UgYW5kIGl0IHdvbid0IHJ1biBpbW1lZGlhdGVseS4gV2Ugd29yayBhcm91bmQgaXQgYnkgZ2l2aW5nIGl0IGFuXG4gICAgICAgICAgLy8gb2JqZWN0IHdpdGggdGhlIHNhbWUgc2hhcGUgaW5zdGVhZC5cbiAgICAgICAgICBjb25zdCBvbGROYW1lID0gY2hhbmdlc1snbmFtZSddLnByZXZpb3VzVmFsdWU7XG4gICAgICAgICAgdGhpcy5mb3JtRGlyZWN0aXZlLnJlbW92ZUNvbnRyb2woe25hbWU6IG9sZE5hbWUsIHBhdGg6IHRoaXMuX2dldFBhdGgob2xkTmFtZSl9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fc2V0VXBDb250cm9sKCk7XG4gICAgfVxuICAgIGlmICgnaXNEaXNhYmxlZCcgaW4gY2hhbmdlcykge1xuICAgICAgdGhpcy5fdXBkYXRlRGlzYWJsZWQoY2hhbmdlcyk7XG4gICAgfVxuXG4gICAgaWYgKGlzUHJvcGVydHlVcGRhdGVkKGNoYW5nZXMsIHRoaXMudmlld01vZGVsKSkge1xuICAgICAgdGhpcy5fdXBkYXRlVmFsdWUodGhpcy5tb2RlbCk7XG4gICAgICB0aGlzLnZpZXdNb2RlbCA9IHRoaXMubW9kZWw7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2RvYyAqL1xuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmZvcm1EaXJlY3RpdmUgJiYgdGhpcy5mb3JtRGlyZWN0aXZlLnJlbW92ZUNvbnRyb2wodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJldHVybnMgYW4gYXJyYXkgdGhhdCByZXByZXNlbnRzIHRoZSBwYXRoIGZyb20gdGhlIHRvcC1sZXZlbCBmb3JtIHRvIHRoaXMgY29udHJvbC5cbiAgICogRWFjaCBpbmRleCBpcyB0aGUgc3RyaW5nIG5hbWUgb2YgdGhlIGNvbnRyb2wgb24gdGhhdCBsZXZlbC5cbiAgICovXG4gIG92ZXJyaWRlIGdldCBwYXRoKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0UGF0aCh0aGlzLm5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBUaGUgdG9wLWxldmVsIGRpcmVjdGl2ZSBmb3IgdGhpcyBjb250cm9sIGlmIHByZXNlbnQsIG90aGVyd2lzZSBudWxsLlxuICAgKi9cbiAgZ2V0IGZvcm1EaXJlY3RpdmUoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50ID8gdGhpcy5fcGFyZW50LmZvcm1EaXJlY3RpdmUgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTZXRzIHRoZSBuZXcgdmFsdWUgZm9yIHRoZSB2aWV3IG1vZGVsIGFuZCBlbWl0cyBhbiBgbmdNb2RlbENoYW5nZWAgZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IHZhbHVlIGVtaXR0ZWQgYnkgYG5nTW9kZWxDaGFuZ2VgLlxuICAgKi9cbiAgb3ZlcnJpZGUgdmlld1RvTW9kZWxVcGRhdGUobmV3VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3VmFsdWU7XG4gICAgdGhpcy51cGRhdGUuZW1pdChuZXdWYWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIF9zZXRVcENvbnRyb2woKTogdm9pZCB7XG4gICAgdGhpcy5fc2V0VXBkYXRlU3RyYXRlZ3koKTtcbiAgICB0aGlzLl9pc1N0YW5kYWxvbmUoKSA/IHRoaXMuX3NldFVwU3RhbmRhbG9uZSgpIDogdGhpcy5mb3JtRGlyZWN0aXZlLmFkZENvbnRyb2wodGhpcyk7XG4gICAgdGhpcy5fcmVnaXN0ZXJlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9zZXRVcGRhdGVTdHJhdGVneSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy51cGRhdGVPbiAhPSBudWxsKSB7XG4gICAgICB0aGlzLmNvbnRyb2wuX3VwZGF0ZU9uID0gdGhpcy5vcHRpb25zLnVwZGF0ZU9uO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2lzU3RhbmRhbG9uZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMuX3BhcmVudCB8fCAhISh0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLnN0YW5kYWxvbmUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0VXBTdGFuZGFsb25lKCk6IHZvaWQge1xuICAgIHNldFVwQ29udHJvbCh0aGlzLmNvbnRyb2wsIHRoaXMsIHRoaXMuY2FsbFNldERpc2FibGVkU3RhdGUpO1xuICAgIHRoaXMuY29udHJvbC51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KHtlbWl0RXZlbnQ6IGZhbHNlfSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGVja0ZvckVycm9ycygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzU3RhbmRhbG9uZSgpKSB7XG4gICAgICB0aGlzLl9jaGVja1BhcmVudFR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5fY2hlY2tOYW1lKCk7XG4gIH1cblxuICBwcml2YXRlIF9jaGVja1BhcmVudFR5cGUoKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKCEodGhpcy5fcGFyZW50IGluc3RhbmNlb2YgTmdNb2RlbEdyb3VwKSAmJlxuICAgICAgICAgIHRoaXMuX3BhcmVudCBpbnN0YW5jZW9mIEFic3RyYWN0Rm9ybUdyb3VwRGlyZWN0aXZlKSB7XG4gICAgICAgIHRocm93IGZvcm1Hcm91cE5hbWVFeGNlcHRpb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoISh0aGlzLl9wYXJlbnQgaW5zdGFuY2VvZiBOZ01vZGVsR3JvdXApICYmICEodGhpcy5fcGFyZW50IGluc3RhbmNlb2YgTmdGb3JtKSkge1xuICAgICAgICB0aHJvdyBtb2RlbFBhcmVudEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NoZWNrTmFtZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5uYW1lKSB0aGlzLm5hbWUgPSB0aGlzLm9wdGlvbnMubmFtZTtcblxuICAgIGlmICghdGhpcy5faXNTdGFuZGFsb25lKCkgJiYgIXRoaXMubmFtZSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgbWlzc2luZ05hbWVFeGNlcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVWYWx1ZSh2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgcmVzb2x2ZWRQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5jb250cm9sLnNldFZhbHVlKHZhbHVlLCB7ZW1pdFZpZXdUb01vZGVsQ2hhbmdlOiBmYWxzZX0pO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWY/Lm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlRGlzYWJsZWQoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGNvbnN0IGRpc2FibGVkVmFsdWUgPSBjaGFuZ2VzWydpc0Rpc2FibGVkJ10uY3VycmVudFZhbHVlO1xuICAgIC8vIGNoZWNraW5nIGZvciAwIHRvIGF2b2lkIGJyZWFraW5nIGNoYW5nZVxuICAgIGNvbnN0IGlzRGlzYWJsZWQgPSBkaXNhYmxlZFZhbHVlICE9PSAwICYmIGJvb2xlYW5BdHRyaWJ1dGUoZGlzYWJsZWRWYWx1ZSk7XG5cbiAgICByZXNvbHZlZFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICBpZiAoaXNEaXNhYmxlZCAmJiAhdGhpcy5jb250cm9sLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuY29udHJvbC5kaXNhYmxlKCk7XG4gICAgICB9IGVsc2UgaWYgKCFpc0Rpc2FibGVkICYmIHRoaXMuY29udHJvbC5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLmNvbnRyb2wuZW5hYmxlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmPy5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFBhdGgoY29udHJvbE5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50ID8gY29udHJvbFBhdGgoY29udHJvbE5hbWUsIHRoaXMuX3BhcmVudCkgOiBbY29udHJvbE5hbWVdO1xuICB9XG59XG4iXX0=