/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, ɵRuntimeError as RuntimeError } from '@angular/core';
import { asyncValidatorsDroppedWithOptsWarning, missingControlError, missingControlValueError, noControlsError } from '../directives/reactive_errors';
import { addValidators, composeAsyncValidators, composeValidators, hasValidator, removeValidators, toObservable } from '../validators';
/**
 * Reports that a control is valid, meaning that no errors exist in the input value.
 *
 * @see {@link status}
 */
export const VALID = 'VALID';
/**
 * Reports that a control is invalid, meaning that an error exists in the input value.
 *
 * @see {@link status}
 */
export const INVALID = 'INVALID';
/**
 * Reports that a control is pending, meaning that async validation is occurring and
 * errors are not yet available for the input value.
 *
 * @see {@link markAsPending}
 * @see {@link status}
 */
export const PENDING = 'PENDING';
/**
 * Reports that a control is disabled, meaning that the control is exempt from ancestor
 * calculations of validity or value.
 *
 * @see {@link markAsDisabled}
 * @see {@link status}
 */
export const DISABLED = 'DISABLED';
/**
 * Gets validators from either an options object or given validators.
 */
export function pickValidators(validatorOrOpts) {
    return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.validators : validatorOrOpts) || null;
}
/**
 * Creates validator function by combining provided validators.
 */
function coerceToValidator(validator) {
    return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
/**
 * Gets async validators from either an options object or given validators.
 */
export function pickAsyncValidators(asyncValidator, validatorOrOpts) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (isOptionsObj(validatorOrOpts) && asyncValidator) {
            console.warn(asyncValidatorsDroppedWithOptsWarning);
        }
    }
    return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.asyncValidators : asyncValidator) || null;
}
/**
 * Creates async validator function by combining provided async validators.
 */
function coerceToAsyncValidator(asyncValidator) {
    return Array.isArray(asyncValidator) ? composeAsyncValidators(asyncValidator) :
        asyncValidator || null;
}
export function isOptionsObj(validatorOrOpts) {
    return validatorOrOpts != null && !Array.isArray(validatorOrOpts) &&
        typeof validatorOrOpts === 'object';
}
export function assertControlPresent(parent, isGroup, key) {
    const controls = parent.controls;
    const collection = isGroup ? Object.keys(controls) : controls;
    if (!collection.length) {
        throw new RuntimeError(1000 /* RuntimeErrorCode.NO_CONTROLS */, (typeof ngDevMode === 'undefined' || ngDevMode) ? noControlsError(isGroup) : '');
    }
    if (!controls[key]) {
        throw new RuntimeError(1001 /* RuntimeErrorCode.MISSING_CONTROL */, (typeof ngDevMode === 'undefined' || ngDevMode) ? missingControlError(isGroup, key) : '');
    }
}
export function assertAllValuesPresent(control, isGroup, value) {
    control._forEachChild((_, key) => {
        if (value[key] === undefined) {
            throw new RuntimeError(1002 /* RuntimeErrorCode.MISSING_CONTROL_VALUE */, (typeof ngDevMode === 'undefined' || ngDevMode) ? missingControlValueError(isGroup, key) :
                '');
        }
    });
}
// clang-format on
/**
 * This is the base class for `FormControl`, `FormGroup`, and `FormArray`.
 *
 * It provides some of the shared behavior that all controls and groups of controls have, like
 * running validators, calculating status, and resetting state. It also defines the properties
 * that are shared between all sub-classes, like `value`, `valid`, and `dirty`. It shouldn't be
 * instantiated directly.
 *
 * The first type parameter TValue represents the value type of the control (`control.value`).
 * The optional type parameter TRawValue  represents the raw value type (`control.getRawValue()`).
 *
 * @see [Forms Guide](/guide/forms)
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 * @see [Dynamic Forms Guide](/guide/dynamic-form)
 *
 * @publicApi
 */
export class AbstractControl {
    /**
     * Initialize the AbstractControl instance.
     *
     * @param validators The function or array of functions that is used to determine the validity of
     *     this control synchronously.
     * @param asyncValidators The function or array of functions that is used to determine validity of
     *     this control asynchronously.
     */
    constructor(validators, asyncValidators) {
        /** @internal */
        this._pendingDirty = false;
        /**
         * Indicates that a control has its own pending asynchronous validation in progress.
         *
         * @internal
         */
        this._hasOwnPendingAsyncValidator = false;
        /** @internal */
        this._pendingTouched = false;
        /** @internal */
        this._onCollectionChange = () => { };
        this._parent = null;
        /**
         * A control is `pristine` if the user has not yet changed
         * the value in the UI.
         *
         * @returns True if the user has not yet changed the value in the UI; compare `dirty`.
         * Programmatic changes to a control's value do not mark it dirty.
         */
        this.pristine = true;
        /**
         * True if the control is marked as `touched`.
         *
         * A control is marked `touched` once the user has triggered
         * a `blur` event on it.
         */
        this.touched = false;
        /** @internal */
        this._onDisabledChange = [];
        this._assignValidators(validators);
        this._assignAsyncValidators(asyncValidators);
    }
    /**
     * Returns the function that is used to determine the validity of this control synchronously.
     * If multiple validators have been added, this will be a single composed function.
     * See `Validators.compose()` for additional information.
     */
    get validator() {
        return this._composedValidatorFn;
    }
    set validator(validatorFn) {
        this._rawValidators = this._composedValidatorFn = validatorFn;
    }
    /**
     * Returns the function that is used to determine the validity of this control asynchronously.
     * If multiple validators have been added, this will be a single composed function.
     * See `Validators.compose()` for additional information.
     */
    get asyncValidator() {
        return this._composedAsyncValidatorFn;
    }
    set asyncValidator(asyncValidatorFn) {
        this._rawAsyncValidators = this._composedAsyncValidatorFn = asyncValidatorFn;
    }
    /**
     * The parent control.
     */
    get parent() {
        return this._parent;
    }
    /**
     * A control is `valid` when its `status` is `VALID`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if the control has passed all of its validation tests,
     * false otherwise.
     */
    get valid() {
        return this.status === VALID;
    }
    /**
     * A control is `invalid` when its `status` is `INVALID`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if this control has failed one or more of its validation checks,
     * false otherwise.
     */
    get invalid() {
        return this.status === INVALID;
    }
    /**
     * A control is `pending` when its `status` is `PENDING`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if this control is in the process of conducting a validation check,
     * false otherwise.
     */
    get pending() {
        return this.status == PENDING;
    }
    /**
     * A control is `disabled` when its `status` is `DISABLED`.
     *
     * Disabled controls are exempt from validation checks and
     * are not included in the aggregate value of their ancestor
     * controls.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if the control is disabled, false otherwise.
     */
    get disabled() {
        return this.status === DISABLED;
    }
    /**
     * A control is `enabled` as long as its `status` is not `DISABLED`.
     *
     * @returns True if the control has any status other than 'DISABLED',
     * false if the status is 'DISABLED'.
     *
     * @see {@link AbstractControl.status}
     *
     */
    get enabled() {
        return this.status !== DISABLED;
    }
    /**
     * A control is `dirty` if the user has changed the value
     * in the UI.
     *
     * @returns True if the user has changed the value of this control in the UI; compare `pristine`.
     * Programmatic changes to a control's value do not mark it dirty.
     */
    get dirty() {
        return !this.pristine;
    }
    /**
     * True if the control has not been marked as touched
     *
     * A control is `untouched` if the user has not yet triggered
     * a `blur` event on it.
     */
    get untouched() {
        return !this.touched;
    }
    /**
     * Reports the update strategy of the `AbstractControl` (meaning
     * the event on which the control updates itself).
     * Possible values: `'change'` | `'blur'` | `'submit'`
     * Default value: `'change'`
     */
    get updateOn() {
        return this._updateOn ? this._updateOn : (this.parent ? this.parent.updateOn : 'change');
    }
    /**
     * Sets the synchronous validators that are active on this control.  Calling
     * this overwrites any existing synchronous validators.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * If you want to add a new validator without affecting existing ones, consider
     * using `addValidators()` method instead.
     */
    setValidators(validators) {
        this._assignValidators(validators);
    }
    /**
     * Sets the asynchronous validators that are active on this control. Calling this
     * overwrites any existing asynchronous validators.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * If you want to add a new validator without affecting existing ones, consider
     * using `addAsyncValidators()` method instead.
     */
    setAsyncValidators(validators) {
        this._assignAsyncValidators(validators);
    }
    /**
     * Add a synchronous validator or validators to this control, without affecting other validators.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * Adding a validator that already exists will have no effect. If duplicate validator functions
     * are present in the `validators` array, only the first instance would be added to a form
     * control.
     *
     * @param validators The new validator function or functions to add to this control.
     */
    addValidators(validators) {
        this.setValidators(addValidators(validators, this._rawValidators));
    }
    /**
     * Add an asynchronous validator or validators to this control, without affecting other
     * validators.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * Adding a validator that already exists will have no effect.
     *
     * @param validators The new asynchronous validator function or functions to add to this control.
     */
    addAsyncValidators(validators) {
        this.setAsyncValidators(addValidators(validators, this._rawAsyncValidators));
    }
    /**
     * Remove a synchronous validator from this control, without affecting other validators.
     * Validators are compared by function reference; you must pass a reference to the exact same
     * validator function as the one that was originally set. If a provided validator is not found,
     * it is ignored.
     *
     * @usageNotes
     *
     * ### Reference to a ValidatorFn
     *
     * ```
     * // Reference to the RequiredValidator
     * const ctrl = new FormControl<string | null>('', Validators.required);
     * ctrl.removeValidators(Validators.required);
     *
     * // Reference to anonymous function inside MinValidator
     * const minValidator = Validators.min(3);
     * const ctrl = new FormControl<string | null>('', minValidator);
     * expect(ctrl.hasValidator(minValidator)).toEqual(true)
     * expect(ctrl.hasValidator(Validators.min(3))).toEqual(false)
     *
     * ctrl.removeValidators(minValidator);
     * ```
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * @param validators The validator or validators to remove.
     */
    removeValidators(validators) {
        this.setValidators(removeValidators(validators, this._rawValidators));
    }
    /**
     * Remove an asynchronous validator from this control, without affecting other validators.
     * Validators are compared by function reference; you must pass a reference to the exact same
     * validator function as the one that was originally set. If a provided validator is not found, it
     * is ignored.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     * @param validators The asynchronous validator or validators to remove.
     */
    removeAsyncValidators(validators) {
        this.setAsyncValidators(removeValidators(validators, this._rawAsyncValidators));
    }
    /**
     * Check whether a synchronous validator function is present on this control. The provided
     * validator must be a reference to the exact same function that was provided.
     *
     * @usageNotes
     *
     * ### Reference to a ValidatorFn
     *
     * ```
     * // Reference to the RequiredValidator
     * const ctrl = new FormControl<number | null>(0, Validators.required);
     * expect(ctrl.hasValidator(Validators.required)).toEqual(true)
     *
     * // Reference to anonymous function inside MinValidator
     * const minValidator = Validators.min(3);
     * const ctrl = new FormControl<number | null>(0, minValidator);
     * expect(ctrl.hasValidator(minValidator)).toEqual(true)
     * expect(ctrl.hasValidator(Validators.min(3))).toEqual(false)
     * ```
     *
     * @param validator The validator to check for presence. Compared by function reference.
     * @returns Whether the provided validator was found on this control.
     */
    hasValidator(validator) {
        return hasValidator(this._rawValidators, validator);
    }
    /**
     * Check whether an asynchronous validator function is present on this control. The provided
     * validator must be a reference to the exact same function that was provided.
     *
     * @param validator The asynchronous validator to check for presence. Compared by function
     *     reference.
     * @returns Whether the provided asynchronous validator was found on this control.
     */
    hasAsyncValidator(validator) {
        return hasValidator(this._rawAsyncValidators, validator);
    }
    /**
     * Empties out the synchronous validator list.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     */
    clearValidators() {
        this.validator = null;
    }
    /**
     * Empties out the async validator list.
     *
     * When you add or remove a validator at run time, you must call
     * `updateValueAndValidity()` for the new validation to take effect.
     *
     */
    clearAsyncValidators() {
        this.asyncValidator = null;
    }
    /**
     * Marks the control as `touched`. A control is touched by focus and
     * blur events that do not change the value.
     *
     * @see {@link markAsUntouched()}
     * @see {@link markAsDirty()}
     * @see {@link markAsPristine()}
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsTouched(opts = {}) {
        this.touched = true;
        if (this._parent && !opts.onlySelf) {
            this._parent.markAsTouched(opts);
        }
    }
    /**
     * Marks the control and all its descendant controls as `touched`.
     * @see {@link markAsTouched()}
     */
    markAllAsTouched() {
        this.markAsTouched({ onlySelf: true });
        this._forEachChild((control) => control.markAllAsTouched());
    }
    /**
     * Marks the control as `untouched`.
     *
     * If the control has any children, also marks all children as `untouched`
     * and recalculates the `touched` status of all parent controls.
     *
     * @see {@link markAsTouched()}
     * @see {@link markAsDirty()}
     * @see {@link markAsPristine()}
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events after the marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsUntouched(opts = {}) {
        this.touched = false;
        this._pendingTouched = false;
        this._forEachChild((control) => {
            control.markAsUntouched({ onlySelf: true });
        });
        if (this._parent && !opts.onlySelf) {
            this._parent._updateTouched(opts);
        }
    }
    /**
     * Marks the control as `dirty`. A control becomes dirty when
     * the control's value is changed through the UI; compare `markAsTouched`.
     *
     * @see {@link markAsTouched()}
     * @see {@link markAsUntouched()}
     * @see {@link markAsPristine()}
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsDirty(opts = {}) {
        this.pristine = false;
        if (this._parent && !opts.onlySelf) {
            this._parent.markAsDirty(opts);
        }
    }
    /**
     * Marks the control as `pristine`.
     *
     * If the control has any children, marks all children as `pristine`,
     * and recalculates the `pristine` status of all parent
     * controls.
     *
     * @see {@link markAsTouched()}
     * @see {@link markAsUntouched()}
     * @see {@link markAsDirty()}
     *
     * @param opts Configuration options that determine how the control emits events after
     * marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsPristine(opts = {}) {
        this.pristine = true;
        this._pendingDirty = false;
        this._forEachChild((control) => {
            control.markAsPristine({ onlySelf: true });
        });
        if (this._parent && !opts.onlySelf) {
            this._parent._updatePristine(opts);
        }
    }
    /**
     * Marks the control as `pending`.
     *
     * A control is pending while the control performs async validation.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configuration options that determine how the control propagates changes and
     * emits events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     * * `emitEvent`: When true or not supplied (the default), the `statusChanges`
     * observable emits an event with the latest status the control is marked pending.
     * When false, no events are emitted.
     *
     */
    markAsPending(opts = {}) {
        this.status = PENDING;
        if (opts.emitEvent !== false) {
            this.statusChanges.emit(this.status);
        }
        if (this._parent && !opts.onlySelf) {
            this._parent.markAsPending(opts);
        }
    }
    /**
     * Disables the control. This means the control is exempt from validation checks and
     * excluded from the aggregate value of any parent. Its status is `DISABLED`.
     *
     * If the control has children, all children are also disabled.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configuration options that determine how the control propagates
     * changes and emits events after the control is disabled.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is disabled.
     * When false, no events are emitted.
     */
    disable(opts = {}) {
        // If parent has been marked artificially dirty we don't want to re-calculate the
        // parent's dirtiness based on the children.
        const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
        this.status = DISABLED;
        this.errors = null;
        this._forEachChild((control) => {
            control.disable({ ...opts, onlySelf: true });
        });
        this._updateValue();
        if (opts.emitEvent !== false) {
            this.valueChanges.emit(this.value);
            this.statusChanges.emit(this.status);
        }
        this._updateAncestors({ ...opts, skipPristineCheck });
        this._onDisabledChange.forEach((changeFn) => changeFn(true));
    }
    /**
     * Enables the control. This means the control is included in validation checks and
     * the aggregate value of its parent. Its status recalculates based on its value and
     * its validators.
     *
     * By default, if the control has children, all children are enabled.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configure options that control how the control propagates changes and
     * emits events when marked as untouched
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is enabled.
     * When false, no events are emitted.
     */
    enable(opts = {}) {
        // If parent has been marked artificially dirty we don't want to re-calculate the
        // parent's dirtiness based on the children.
        const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
        this.status = VALID;
        this._forEachChild((control) => {
            control.enable({ ...opts, onlySelf: true });
        });
        this.updateValueAndValidity({ onlySelf: true, emitEvent: opts.emitEvent });
        this._updateAncestors({ ...opts, skipPristineCheck });
        this._onDisabledChange.forEach((changeFn) => changeFn(false));
    }
    _updateAncestors(opts) {
        if (this._parent && !opts.onlySelf) {
            this._parent.updateValueAndValidity(opts);
            if (!opts.skipPristineCheck) {
                this._parent._updatePristine();
            }
            this._parent._updateTouched();
        }
    }
    /**
     * Sets the parent of the control
     *
     * @param parent The new parent.
     */
    setParent(parent) {
        this._parent = parent;
    }
    /**
     * The raw value of this control. For most control implementations, the raw value will include
     * disabled children.
     */
    getRawValue() {
        return this.value;
    }
    /**
     * Recalculates the value and validation status of the control.
     *
     * By default, it also updates the value and validity of its ancestors.
     *
     * @param opts Configuration options determine how the control propagates changes and emits events
     * after updates and validity checks are applied.
     * * `onlySelf`: When true, only update this control. When false or not supplied,
     * update all direct ancestors. Default is false.
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is updated.
     * When false, no events are emitted.
     */
    updateValueAndValidity(opts = {}) {
        this._setInitialStatus();
        this._updateValue();
        if (this.enabled) {
            this._cancelExistingSubscription();
            this.errors = this._runValidator();
            this.status = this._calculateStatus();
            if (this.status === VALID || this.status === PENDING) {
                this._runAsyncValidator(opts.emitEvent);
            }
        }
        if (opts.emitEvent !== false) {
            this.valueChanges.emit(this.value);
            this.statusChanges.emit(this.status);
        }
        if (this._parent && !opts.onlySelf) {
            this._parent.updateValueAndValidity(opts);
        }
    }
    /** @internal */
    _updateTreeValidity(opts = { emitEvent: true }) {
        this._forEachChild((ctrl) => ctrl._updateTreeValidity(opts));
        this.updateValueAndValidity({ onlySelf: true, emitEvent: opts.emitEvent });
    }
    _setInitialStatus() {
        this.status = this._allControlsDisabled() ? DISABLED : VALID;
    }
    _runValidator() {
        return this.validator ? this.validator(this) : null;
    }
    _runAsyncValidator(emitEvent) {
        if (this.asyncValidator) {
            this.status = PENDING;
            this._hasOwnPendingAsyncValidator = true;
            const obs = toObservable(this.asyncValidator(this));
            this._asyncValidationSubscription = obs.subscribe((errors) => {
                this._hasOwnPendingAsyncValidator = false;
                // This will trigger the recalculation of the validation status, which depends on
                // the state of the asynchronous validation (whether it is in progress or not). So, it is
                // necessary that we have updated the `_hasOwnPendingAsyncValidator` boolean flag first.
                this.setErrors(errors, { emitEvent });
            });
        }
    }
    _cancelExistingSubscription() {
        if (this._asyncValidationSubscription) {
            this._asyncValidationSubscription.unsubscribe();
            this._hasOwnPendingAsyncValidator = false;
        }
    }
    /**
     * Sets errors on a form control when running validations manually, rather than automatically.
     *
     * Calling `setErrors` also updates the validity of the parent control.
     *
     * @param opts Configuration options that determine how the control propagates
     * changes and emits events after the control errors are set.
     * * `emitEvent`: When true or not supplied (the default), the `statusChanges`
     * observable emits an event after the errors are set.
     *
     * @usageNotes
     *
     * ### Manually set the errors for a control
     *
     * ```
     * const login = new FormControl('someLogin');
     * login.setErrors({
     *   notUnique: true
     * });
     *
     * expect(login.valid).toEqual(false);
     * expect(login.errors).toEqual({ notUnique: true });
     *
     * login.setValue('someOtherLogin');
     *
     * expect(login.valid).toEqual(true);
     * ```
     */
    setErrors(errors, opts = {}) {
        this.errors = errors;
        this._updateControlsErrors(opts.emitEvent !== false);
    }
    /**
     * Retrieves a child control given the control's name or path.
     *
     * @param path A dot-delimited string or array of string/number values that define the path to the
     * control. If a string is provided, passing it as a string literal will result in improved type
     * information. Likewise, if an array is provided, passing it `as const` will cause improved type
     * information to be available.
     *
     * @usageNotes
     * ### Retrieve a nested control
     *
     * For example, to get a `name` control nested within a `person` sub-group:
     *
     * * `this.form.get('person.name');`
     *
     * -OR-
     *
     * * `this.form.get(['person', 'name'] as const);` // `as const` gives improved typings
     *
     * ### Retrieve a control in a FormArray
     *
     * When accessing an element inside a FormArray, you can use an element index.
     * For example, to get a `price` control from the first element in an `items` array you can use:
     *
     * * `this.form.get('items.0.price');`
     *
     * -OR-
     *
     * * `this.form.get(['items', 0, 'price']);`
     */
    get(path) {
        let currPath = path;
        if (currPath == null)
            return null;
        if (!Array.isArray(currPath))
            currPath = currPath.split('.');
        if (currPath.length === 0)
            return null;
        return currPath.reduce((control, name) => control && control._find(name), this);
    }
    /**
     * @description
     * Reports error data for the control with the given path.
     *
     * @param errorCode The code of the error to check
     * @param path A list of control names that designates how to move from the current control
     * to the control that should be queried for errors.
     *
     * @usageNotes
     * For example, for the following `FormGroup`:
     *
     * ```
     * form = new FormGroup({
     *   address: new FormGroup({ street: new FormControl() })
     * });
     * ```
     *
     * The path to the 'street' control from the root form would be 'address' -> 'street'.
     *
     * It can be provided to this method in one of two formats:
     *
     * 1. An array of string control names, e.g. `['address', 'street']`
     * 1. A period-delimited list of control names in one string, e.g. `'address.street'`
     *
     * @returns error data for that particular error. If the control or error is not present,
     * null is returned.
     */
    getError(errorCode, path) {
        const control = path ? this.get(path) : this;
        return control && control.errors ? control.errors[errorCode] : null;
    }
    /**
     * @description
     * Reports whether the control with the given path has the error specified.
     *
     * @param errorCode The code of the error to check
     * @param path A list of control names that designates how to move from the current control
     * to the control that should be queried for errors.
     *
     * @usageNotes
     * For example, for the following `FormGroup`:
     *
     * ```
     * form = new FormGroup({
     *   address: new FormGroup({ street: new FormControl() })
     * });
     * ```
     *
     * The path to the 'street' control from the root form would be 'address' -> 'street'.
     *
     * It can be provided to this method in one of two formats:
     *
     * 1. An array of string control names, e.g. `['address', 'street']`
     * 1. A period-delimited list of control names in one string, e.g. `'address.street'`
     *
     * If no path is given, this method checks for the error on the current control.
     *
     * @returns whether the given error is present in the control at the given path.
     *
     * If the control is not present, false is returned.
     */
    hasError(errorCode, path) {
        return !!this.getError(errorCode, path);
    }
    /**
     * Retrieves the top-level ancestor of this control.
     */
    get root() {
        let x = this;
        while (x._parent) {
            x = x._parent;
        }
        return x;
    }
    /** @internal */
    _updateControlsErrors(emitEvent) {
        this.status = this._calculateStatus();
        if (emitEvent) {
            this.statusChanges.emit(this.status);
        }
        if (this._parent) {
            this._parent._updateControlsErrors(emitEvent);
        }
    }
    /** @internal */
    _initObservables() {
        this.valueChanges = new EventEmitter();
        this.statusChanges = new EventEmitter();
    }
    _calculateStatus() {
        if (this._allControlsDisabled())
            return DISABLED;
        if (this.errors)
            return INVALID;
        if (this._hasOwnPendingAsyncValidator || this._anyControlsHaveStatus(PENDING))
            return PENDING;
        if (this._anyControlsHaveStatus(INVALID))
            return INVALID;
        return VALID;
    }
    /** @internal */
    _anyControlsHaveStatus(status) {
        return this._anyControls((control) => control.status === status);
    }
    /** @internal */
    _anyControlsDirty() {
        return this._anyControls((control) => control.dirty);
    }
    /** @internal */
    _anyControlsTouched() {
        return this._anyControls((control) => control.touched);
    }
    /** @internal */
    _updatePristine(opts = {}) {
        this.pristine = !this._anyControlsDirty();
        if (this._parent && !opts.onlySelf) {
            this._parent._updatePristine(opts);
        }
    }
    /** @internal */
    _updateTouched(opts = {}) {
        this.touched = this._anyControlsTouched();
        if (this._parent && !opts.onlySelf) {
            this._parent._updateTouched(opts);
        }
    }
    /** @internal */
    _registerOnCollectionChange(fn) {
        this._onCollectionChange = fn;
    }
    /** @internal */
    _setUpdateStrategy(opts) {
        if (isOptionsObj(opts) && opts.updateOn != null) {
            this._updateOn = opts.updateOn;
        }
    }
    /**
     * Check to see if parent has been marked artificially dirty.
     *
     * @internal
     */
    _parentMarkedDirty(onlySelf) {
        const parentDirty = this._parent && this._parent.dirty;
        return !onlySelf && !!parentDirty && !this._parent._anyControlsDirty();
    }
    /** @internal */
    _find(name) {
        return null;
    }
    /**
     * Internal implementation of the `setValidators` method. Needs to be separated out into a
     * different method, because it is called in the constructor and it can break cases where
     * a control is extended.
     */
    _assignValidators(validators) {
        this._rawValidators = Array.isArray(validators) ? validators.slice() : validators;
        this._composedValidatorFn = coerceToValidator(this._rawValidators);
    }
    /**
     * Internal implementation of the `setAsyncValidators` method. Needs to be separated out into a
     * different method, because it is called in the constructor and it can break cases where
     * a control is extended.
     */
    _assignAsyncValidators(validators) {
        this._rawAsyncValidators = Array.isArray(validators) ? validators.slice() : validators;
        this._composedAsyncValidatorFn = coerceToAsyncValidator(this._rawAsyncValidators);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RfbW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9mb3Jtcy9zcmMvbW9kZWwvYWJzdHJhY3RfbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBRSxhQUFhLElBQUksWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRzFFLE9BQU8sRUFBQyxxQ0FBcUMsRUFBRSxtQkFBbUIsRUFBRSx3QkFBd0IsRUFBRSxlQUFlLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUlwSixPQUFPLEVBQUMsYUFBYSxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHckk7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUM7QUFFN0I7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFFakM7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUVqQzs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBbUJuQzs7R0FFRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsZUFDSTtJQUNqQyxPQUFPLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDaEcsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxTQUF5QztJQUNsRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFNBQVMs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O1FBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdkQsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQVEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQzFFLENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsS0FBSyxDQUFDLElBQW1CO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxpQkFBaUIsQ0FBQyxVQUEwQztRQUNsRSxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQ2xGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxzQkFBc0IsQ0FBQyxVQUFvRDtRQUNqRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDdkYsSUFBSSxDQUFDLHlCQUF5QixHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgybVSdW50aW1lRXJyb3IgYXMgUnVudGltZUVycm9yfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7YXN5bmNWYWxpZGF0b3JzRHJvcHBlZFdpdGhPcHRzV2FybmluZywgbWlzc2luZ0NvbnRyb2xFcnJvciwgbWlzc2luZ0NvbnRyb2xWYWx1ZUVycm9yLCBub0NvbnRyb2xzRXJyb3J9IGZyb20gJy4uL2RpcmVjdGl2ZXMvcmVhY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7QXN5bmNWYWxpZGF0b3JGbiwgVmFsaWRhdGlvbkVycm9ycywgVmFsaWRhdG9yRm59IGZyb20gJy4uL2RpcmVjdGl2ZXMvdmFsaWRhdG9ycyc7XG5pbXBvcnQge1J1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0Zvcm1BcnJheSwgRm9ybUdyb3VwfSBmcm9tICcuLi9mb3Jtcyc7XG5pbXBvcnQge2FkZFZhbGlkYXRvcnMsIGNvbXBvc2VBc3luY1ZhbGlkYXRvcnMsIGNvbXBvc2VWYWxpZGF0b3JzLCBoYXNWYWxpZGF0b3IsIHJlbW92ZVZhbGlkYXRvcnMsIHRvT2JzZXJ2YWJsZX0gZnJvbSAnLi4vdmFsaWRhdG9ycyc7XG5cblxuLyoqXG4gKiBSZXBvcnRzIHRoYXQgYSBjb250cm9sIGlzIHZhbGlkLCBtZWFuaW5nIHRoYXQgbm8gZXJyb3JzIGV4aXN0IGluIHRoZSBpbnB1dCB2YWx1ZS5cbiAqXG4gKiBAc2VlIHtAbGluayBzdGF0dXN9XG4gKi9cbmV4cG9ydCBjb25zdCBWQUxJRCA9ICdWQUxJRCc7XG5cbi8qKlxuICogUmVwb3J0cyB0aGF0IGEgY29udHJvbCBpcyBpbnZhbGlkLCBtZWFuaW5nIHRoYXQgYW4gZXJyb3IgZXhpc3RzIGluIHRoZSBpbnB1dCB2YWx1ZS5cbiAqXG4gKiBAc2VlIHtAbGluayBzdGF0dXN9XG4gKi9cbmV4cG9ydCBjb25zdCBJTlZBTElEID0gJ0lOVkFMSUQnO1xuXG4vKipcbiAqIFJlcG9ydHMgdGhhdCBhIGNvbnRyb2wgaXMgcGVuZGluZywgbWVhbmluZyB0aGF0IGFzeW5jIHZhbGlkYXRpb24gaXMgb2NjdXJyaW5nIGFuZFxuICogZXJyb3JzIGFyZSBub3QgeWV0IGF2YWlsYWJsZSBmb3IgdGhlIGlucHV0IHZhbHVlLlxuICpcbiAqIEBzZWUge0BsaW5rIG1hcmtBc1BlbmRpbmd9XG4gKiBAc2VlIHtAbGluayBzdGF0dXN9XG4gKi9cbmV4cG9ydCBjb25zdCBQRU5ESU5HID0gJ1BFTkRJTkcnO1xuXG4vKipcbiAqIFJlcG9ydHMgdGhhdCBhIGNvbnRyb2wgaXMgZGlzYWJsZWQsIG1lYW5pbmcgdGhhdCB0aGUgY29udHJvbCBpcyBleGVtcHQgZnJvbSBhbmNlc3RvclxuICogY2FsY3VsYXRpb25zIG9mIHZhbGlkaXR5IG9yIHZhbHVlLlxuICpcbiAqIEBzZWUge0BsaW5rIG1hcmtBc0Rpc2FibGVkfVxuICogQHNlZSB7QGxpbmsgc3RhdHVzfVxuICovXG5leHBvcnQgY29uc3QgRElTQUJMRUQgPSAnRElTQUJMRUQnO1xuXG4vKipcbiAqIEEgZm9ybSBjYW4gaGF2ZSBzZXZlcmFsIGRpZmZlcmVudCBzdGF0dXNlcy4gRWFjaFxuICogcG9zc2libGUgc3RhdHVzIGlzIHJldHVybmVkIGFzIGEgc3RyaW5nIGxpdGVyYWwuXG4gKlxuICogKiAqKlZBTElEKio6IFJlcG9ydHMgdGhhdCBhIGNvbnRyb2wgaXMgdmFsaWQsIG1lYW5pbmcgdGhhdCBubyBlcnJvcnMgZXhpc3QgaW4gdGhlIGlucHV0XG4gKiB2YWx1ZS5cbiAqICogKipJTlZBTElEKio6IFJlcG9ydHMgdGhhdCBhIGNvbnRyb2wgaXMgaW52YWxpZCwgbWVhbmluZyB0aGF0IGFuIGVycm9yIGV4aXN0cyBpbiB0aGUgaW5wdXRcbiAqIHZhbHVlLlxuICogKiAqKlBFTkRJTkcqKjogUmVwb3J0cyB0aGF0IGEgY29udHJvbCBpcyBwZW5kaW5nLCBtZWFuaW5nIHRoYXQgYXN5bmMgdmFsaWRhdGlvbiBpc1xuICogb2NjdXJyaW5nIGFuZCBlcnJvcnMgYXJlIG5vdCB5ZXQgYXZhaWxhYmxlIGZvciB0aGUgaW5wdXQgdmFsdWUuXG4gKiAqICoqRElTQUJMRUQqKjogUmVwb3J0cyB0aGF0IGEgY29udHJvbCBpc1xuICogZGlzYWJsZWQsIG1lYW5pbmcgdGhhdCB0aGUgY29udHJvbCBpcyBleGVtcHQgZnJvbSBhbmNlc3RvciBjYWxjdWxhdGlvbnMgb2YgdmFsaWRpdHkgb3IgdmFsdWUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBGb3JtQ29udHJvbFN0YXR1cyA9ICdWQUxJRCd8J0lOVkFMSUQnfCdQRU5ESU5HJ3wnRElTQUJMRUQnO1xuXG4vKipcbiAqIEdldHMgdmFsaWRhdG9ycyBmcm9tIGVpdGhlciBhbiBvcHRpb25zIG9iamVjdCBvciBnaXZlbiB2YWxpZGF0b3JzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGlja1ZhbGlkYXRvcnModmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxBYnN0cmFjdENvbnRyb2xPcHRpb25zfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwpOiBWYWxpZGF0b3JGbnxWYWxpZGF0b3JGbltdfG51bGwge1xuICByZXR1cm4gKGlzT3B0aW9uc09iaih2YWxpZGF0b3JPck9wdHMpID8gdmFsaWRhdG9yT3JPcHRzLnZhbGlkYXRvcnMgOiB2YWxpZGF0b3JPck9wdHMpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB2YWxpZGF0b3IgZnVuY3Rpb24gYnkgY29tYmluaW5nIHByb3ZpZGVkIHZhbGlkYXRvcnMuXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZVRvVmFsaWRhdG9yKHZhbGlkYXRvcjogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxudWxsKTogVmFsaWRhdG9yRm58bnVsbCB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbGlkYXRvcikgPyBjb21wb3NlVmFsaWRhdG9ycyh2YWxpZGF0b3IpIDogdmFsaWRhdG9yIHx8IG51bGw7XG59XG5cbi8qKlxuICogR2V0cyBhc3luYyB2YWxpZGF0b3JzIGZyb20gZWl0aGVyIGFuIG9wdGlvbnMgb2JqZWN0IG9yIGdpdmVuIHZhbGlkYXRvcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaWNrQXN5bmNWYWxpZGF0b3JzKFxuICAgIGFzeW5jVmFsaWRhdG9yPzogQXN5bmNWYWxpZGF0b3JGbnxBc3luY1ZhbGlkYXRvckZuW118bnVsbCxcbiAgICB2YWxpZGF0b3JPck9wdHM/OiBWYWxpZGF0b3JGbnxWYWxpZGF0b3JGbltdfEFic3RyYWN0Q29udHJvbE9wdGlvbnN8bnVsbCk6IEFzeW5jVmFsaWRhdG9yRm58XG4gICAgQXN5bmNWYWxpZGF0b3JGbltdfG51bGwge1xuICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgaWYgKGlzT3B0aW9uc09iaih2YWxpZGF0b3JPck9wdHMpICYmIGFzeW5jVmFsaWRhdG9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oYXN5bmNWYWxpZGF0b3JzRHJvcHBlZFdpdGhPcHRzV2FybmluZyk7XG4gICAgfVxuICB9XG4gIHJldHVybiAoaXNPcHRpb25zT2JqKHZhbGlkYXRvck9yT3B0cykgPyB2YWxpZGF0b3JPck9wdHMuYXN5bmNWYWxpZGF0b3JzIDogYXN5bmNWYWxpZGF0b3IpIHx8IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhc3luYyB2YWxpZGF0b3IgZnVuY3Rpb24gYnkgY29tYmluaW5nIHByb3ZpZGVkIGFzeW5jIHZhbGlkYXRvcnMuXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZVRvQXN5bmNWYWxpZGF0b3IoYXN5bmNWYWxpZGF0b3I/OiBBc3luY1ZhbGlkYXRvckZufEFzeW5jVmFsaWRhdG9yRm5bXXxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCk6IEFzeW5jVmFsaWRhdG9yRm58bnVsbCB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFzeW5jVmFsaWRhdG9yKSA/IGNvbXBvc2VBc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNWYWxpZGF0b3IgfHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgRm9ybUhvb2tzID0gJ2NoYW5nZSd8J2JsdXInfCdzdWJtaXQnO1xuXG4vKipcbiAqIEludGVyZmFjZSBmb3Igb3B0aW9ucyBwcm92aWRlZCB0byBhbiBgQWJzdHJhY3RDb250cm9sYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWJzdHJhY3RDb250cm9sT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIGxpc3Qgb2YgdmFsaWRhdG9ycyBhcHBsaWVkIHRvIGEgY29udHJvbC5cbiAgICovXG4gIHZhbGlkYXRvcnM/OiBWYWxpZGF0b3JGbnxWYWxpZGF0b3JGbltdfG51bGw7XG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVGhlIGxpc3Qgb2YgYXN5bmMgdmFsaWRhdG9ycyBhcHBsaWVkIHRvIGNvbnRyb2wuXG4gICAqL1xuICBhc3luY1ZhbGlkYXRvcnM/OiBBc3luY1ZhbGlkYXRvckZufEFzeW5jVmFsaWRhdG9yRm5bXXxudWxsO1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFRoZSBldmVudCBuYW1lIGZvciBjb250cm9sIHRvIHVwZGF0ZSB1cG9uLlxuICAgKi9cbiAgdXBkYXRlT24/OiAnY2hhbmdlJ3wnYmx1cid8J3N1Ym1pdCc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09wdGlvbnNPYmoodmFsaWRhdG9yT3JPcHRzPzogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxBYnN0cmFjdENvbnRyb2xPcHRpb25zfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsKTogdmFsaWRhdG9yT3JPcHRzIGlzIEFic3RyYWN0Q29udHJvbE9wdGlvbnMge1xuICByZXR1cm4gdmFsaWRhdG9yT3JPcHRzICE9IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsaWRhdG9yT3JPcHRzKSAmJlxuICAgICAgdHlwZW9mIHZhbGlkYXRvck9yT3B0cyA9PT0gJ29iamVjdCc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRDb250cm9sUHJlc2VudChwYXJlbnQ6IGFueSwgaXNHcm91cDogYm9vbGVhbiwga2V5OiBzdHJpbmd8bnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNvbnRyb2xzID0gcGFyZW50LmNvbnRyb2xzIGFzIHtba2V5OiBzdHJpbmd8bnVtYmVyXTogdW5rbm93bn07XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSBpc0dyb3VwID8gT2JqZWN0LmtleXMoY29udHJvbHMpIDogY29udHJvbHM7XG4gIGlmICghY29sbGVjdGlvbi5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk5PX0NPTlRST0xTLFxuICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/IG5vQ29udHJvbHNFcnJvcihpc0dyb3VwKSA6ICcnKTtcbiAgfVxuICBpZiAoIWNvbnRyb2xzW2tleV0pIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfQ09OVFJPTCxcbiAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyBtaXNzaW5nQ29udHJvbEVycm9yKGlzR3JvdXAsIGtleSkgOiAnJyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFsbFZhbHVlc1ByZXNlbnQoY29udHJvbDogYW55LCBpc0dyb3VwOiBib29sZWFuLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGNvbnRyb2wuX2ZvckVhY2hDaGlsZCgoXzogdW5rbm93biwga2V5OiBzdHJpbmd8bnVtYmVyKSA9PiB7XG4gICAgaWYgKHZhbHVlW2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfQ09OVFJPTF9WQUxVRSxcbiAgICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/IG1pc3NpbmdDb250cm9sVmFsdWVFcnJvcihpc0dyb3VwLCBrZXkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcnKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBJc0FueSBjaGVja3MgaWYgVCBpcyBgYW55YCwgYnkgY2hlY2tpbmcgYSBjb25kaXRpb24gdGhhdCBjb3VsZG4ndCBwb3NzaWJseSBiZSB0cnVlIG90aGVyd2lzZS5cbmV4cG9ydCB0eXBlIMm1SXNBbnk8VCwgWSwgTj4gPSAwIGV4dGVuZHMoMSZUKSA/IFkgOiBOO1xuXG4vKipcbiAqIGBUeXBlZE9yVW50eXBlZGAgYWxsb3dzIG9uZSBvZiB0d28gZGlmZmVyZW50IHR5cGVzIHRvIGJlIHNlbGVjdGVkLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgRm9ybXNcbiAqIGNsYXNzIGl0J3MgYXBwbGllZCB0byBpcyB0eXBlZCBvciBub3QuXG4gKlxuICogVGhpcyBpcyBmb3IgaW50ZXJuYWwgQW5ndWxhciB1c2FnZSB0byBzdXBwb3J0IHR5cGVkIGZvcm1zOyBkbyBub3QgZGlyZWN0bHkgdXNlIGl0LlxuICovXG5leHBvcnQgdHlwZSDJtVR5cGVkT3JVbnR5cGVkPFQsIFR5cGVkLCBVbnR5cGVkPiA9IMm1SXNBbnk8VCwgVW50eXBlZCwgVHlwZWQ+O1xuXG4vKipcbiAqIFZhbHVlIGdpdmVzIHRoZSB2YWx1ZSB0eXBlIGNvcnJlc3BvbmRpbmcgdG8gYSBjb250cm9sIHR5cGUuXG4gKlxuICogTm90ZSB0aGF0IHRoZSByZXN1bHRpbmcgdHlwZSB3aWxsIGZvbGxvdyB0aGUgc2FtZSBydWxlcyBhcyBgLnZhbHVlYCBvbiB5b3VyIGNvbnRyb2wsIGdyb3VwLCBvclxuICogYXJyYXksIGluY2x1ZGluZyBgdW5kZWZpbmVkYCBmb3IgZWFjaCBncm91cCBlbGVtZW50IHdoaWNoIG1pZ2h0IGJlIGRpc2FibGVkLlxuICpcbiAqIElmIHlvdSBhcmUgdHJ5aW5nIHRvIGV4dHJhY3QgYSB2YWx1ZSB0eXBlIGZvciBhIGRhdGEgbW9kZWwsIHlvdSBwcm9iYWJseSB3YW50IHtAbGluayBSYXdWYWx1ZX0sXG4gKiB3aGljaCB3aWxsIG5vdCBoYXZlIGB1bmRlZmluZWRgIGluIGdyb3VwIGtleXMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgYEZvcm1Db250cm9sYCB2YWx1ZSB0eXBlXG4gKlxuICogWW91IGNhbiBleHRyYWN0IHRoZSB2YWx1ZSB0eXBlIG9mIGEgc2luZ2xlIGNvbnRyb2w6XG4gKlxuICogYGBgdHNcbiAqIHR5cGUgTmFtZUNvbnRyb2wgPSBGb3JtQ29udHJvbDxzdHJpbmc+O1xuICogdHlwZSBOYW1lVmFsdWUgPSBWYWx1ZTxOYW1lQ29udHJvbD47XG4gKiBgYGBcbiAqXG4gKiBUaGUgcmVzdWx0aW5nIHR5cGUgaXMgYHN0cmluZ2AuXG4gKlxuICogIyMjIGBGb3JtR3JvdXBgIHZhbHVlIHR5cGVcbiAqXG4gKiBJbWFnaW5lIHlvdSBoYXZlIGFuIGludGVyZmFjZSBkZWZpbmluZyB0aGUgY29udHJvbHMgaW4geW91ciBncm91cC4gWW91IGNhbiBleHRyYWN0IHRoZSBzaGFwZSBvZlxuICogdGhlIHZhbHVlcyBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYHRzXG4gKiBpbnRlcmZhY2UgUGFydHlGb3JtQ29udHJvbHMge1xuICogICBhZGRyZXNzOiBGb3JtQ29udHJvbDxzdHJpbmc+O1xuICogfVxuICpcbiAqIC8vIFZhbHVlIG9wZXJhdGVzIG9uIGNvbnRyb2xzOyB0aGUgb2JqZWN0IG11c3QgYmUgd3JhcHBlZCBpbiBhIEZvcm1Hcm91cC5cbiAqIHR5cGUgUGFydHlGb3JtVmFsdWVzID0gVmFsdWU8Rm9ybUdyb3VwPFBhcnR5Rm9ybUNvbnRyb2xzPj47XG4gKiBgYGBcbiAqXG4gKiBUaGUgcmVzdWx0aW5nIHR5cGUgaXMgYHthZGRyZXNzOiBzdHJpbmd8dW5kZWZpbmVkfWAuXG4gKlxuICogIyMjIGBGb3JtQXJyYXlgIHZhbHVlIHR5cGVcbiAqXG4gKiBZb3UgY2FuIGV4dHJhY3QgdmFsdWVzIGZyb20gRm9ybUFycmF5cyBhcyB3ZWxsOlxuICpcbiAqIGBgYHRzXG4gKiB0eXBlIEd1ZXN0TmFtZXNDb250cm9scyA9IEZvcm1BcnJheTxGb3JtQ29udHJvbDxzdHJpbmc+PjtcbiAqXG4gKiB0eXBlIE5hbWVzVmFsdWVzID0gVmFsdWU8R3Vlc3ROYW1lc0NvbnRyb2xzPjtcbiAqIGBgYFxuICpcbiAqIFRoZSByZXN1bHRpbmcgdHlwZSBpcyBgc3RyaW5nW11gLlxuICpcbiAqICoqSW50ZXJuYWw6IG5vdCBmb3IgcHVibGljIHVzZS4qKlxuICovXG5leHBvcnQgdHlwZSDJtVZhbHVlPFQgZXh0ZW5kcyBBYnN0cmFjdENvbnRyb2x8dW5kZWZpbmVkPiA9XG4gICAgVCBleHRlbmRzIEFic3RyYWN0Q29udHJvbDxhbnksIGFueT4/IFRbJ3ZhbHVlJ10gOiBuZXZlcjtcblxuLyoqXG4gKiBSYXdWYWx1ZSBnaXZlcyB0aGUgcmF3IHZhbHVlIHR5cGUgY29ycmVzcG9uZGluZyB0byBhIGNvbnRyb2wgdHlwZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHJlc3VsdGluZyB0eXBlIHdpbGwgZm9sbG93IHRoZSBzYW1lIHJ1bGVzIGFzIGAuZ2V0UmF3VmFsdWUoKWAgb24geW91ciBjb250cm9sLFxuICogZ3JvdXAsIG9yIGFycmF5LiBUaGlzIG1lYW5zIHRoYXQgYWxsIGNvbnRyb2xzIGluc2lkZSBhIGdyb3VwIHdpbGwgYmUgcmVxdWlyZWQsIG5vdCBvcHRpb25hbCxcbiAqIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgZGlzYWJsZWQgc3RhdGUuXG4gKlxuICogWW91IG1heSBhbHNvIHdpc2ggdG8gdXNlIHtAbGluayDJtVZhbHVlfSwgd2hpY2ggd2lsbCBoYXZlIGB1bmRlZmluZWRgIGluIGdyb3VwIGtleXMgKHdoaWNoIGNhbiBiZVxuICogZGlzYWJsZWQpLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIGBGb3JtR3JvdXBgIHJhdyB2YWx1ZSB0eXBlXG4gKlxuICogSW1hZ2luZSB5b3UgaGF2ZSBhbiBpbnRlcmZhY2UgZGVmaW5pbmcgdGhlIGNvbnRyb2xzIGluIHlvdXIgZ3JvdXAuIFlvdSBjYW4gZXh0cmFjdCB0aGUgc2hhcGUgb2ZcbiAqIHRoZSByYXcgdmFsdWVzIGFzIGZvbGxvd3M6XG4gKlxuICogYGBgdHNcbiAqIGludGVyZmFjZSBQYXJ0eUZvcm1Db250cm9scyB7XG4gKiAgIGFkZHJlc3M6IEZvcm1Db250cm9sPHN0cmluZz47XG4gKiB9XG4gKlxuICogLy8gUmF3VmFsdWUgb3BlcmF0ZXMgb24gY29udHJvbHM7IHRoZSBvYmplY3QgbXVzdCBiZSB3cmFwcGVkIGluIGEgRm9ybUdyb3VwLlxuICogdHlwZSBQYXJ0eUZvcm1WYWx1ZXMgPSBSYXdWYWx1ZTxGb3JtR3JvdXA8UGFydHlGb3JtQ29udHJvbHM+PjtcbiAqIGBgYFxuICpcbiAqIFRoZSByZXN1bHRpbmcgdHlwZSBpcyBge2FkZHJlc3M6IHN0cmluZ31gLiAoTm90ZSB0aGUgYWJzZW5jZSBvZiBgdW5kZWZpbmVkYC4pXG4gKlxuICogICoqSW50ZXJuYWw6IG5vdCBmb3IgcHVibGljIHVzZS4qKlxuICovXG5leHBvcnQgdHlwZSDJtVJhd1ZhbHVlPFQgZXh0ZW5kcyBBYnN0cmFjdENvbnRyb2x8dW5kZWZpbmVkPiA9IFQgZXh0ZW5kcyBBYnN0cmFjdENvbnRyb2w8YW55LCBhbnk+P1xuICAgIChUWydzZXRWYWx1ZSddIGV4dGVuZHMoKHY6IGluZmVyIFIpID0+IHZvaWQpID8gUiA6IG5ldmVyKSA6XG4gICAgbmV2ZXI7XG5cbi8vIERpc2FibGUgY2xhbmctZm9ybWF0IHRvIHByb2R1Y2UgY2xlYXJlciBmb3JtYXR0aW5nIGZvciB0aGVzZSBtdWx0aWxpbmUgdHlwZXMuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5cbi8qKlxuICogVG9rZW5pemUgc3BsaXRzIGEgc3RyaW5nIGxpdGVyYWwgUyBieSBhIGRlbGltaXRlciBELlxuICovXG5leHBvcnQgdHlwZSDJtVRva2VuaXplPFMgZXh0ZW5kcyBzdHJpbmcsIEQgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgc3RyaW5nIGV4dGVuZHMgUyA/IHN0cmluZ1tdIDogLyogUyBtdXN0IGJlIGEgbGl0ZXJhbCAqL1xuICAgIFMgZXh0ZW5kcyBgJHtpbmZlciBUfSR7RH0ke2luZmVyIFV9YCA/IFtULCAuLi7JtVRva2VuaXplPFUsIEQ+XSA6XG4gICAgICBbU10gLyogQmFzZSBjYXNlICovXG4gIDtcblxuLyoqXG4gKiBDb2VyY2VTdHJBcnJUb051bUFyciBhY2NlcHRzIGFuIGFycmF5IG9mIHN0cmluZ3MsIGFuZCBjb252ZXJ0cyBhbnkgbnVtZXJpYyBzdHJpbmcgdG8gYSBudW1iZXIuXG4gKi9cbmV4cG9ydCB0eXBlIMm1Q29lcmNlU3RyQXJyVG9OdW1BcnI8Uz4gPVxuLy8gRXh0cmFjdCB0aGUgaGVhZCBvZiB0aGUgYXJyYXkuXG4gIFMgZXh0ZW5kcyBbaW5mZXIgSGVhZCwgLi4uaW5mZXIgVGFpbF0gP1xuICAgIC8vIFVzaW5nIGEgdGVtcGxhdGUgbGl0ZXJhbCB0eXBlLCBjb2VyY2UgdGhlIGhlYWQgdG8gYG51bWJlcmAgaWYgcG9zc2libGUuXG4gICAgLy8gVGhlbiwgcmVjdXJzZSBvbiB0aGUgdGFpbC5cbiAgICBIZWFkIGV4dGVuZHMgYCR7bnVtYmVyfWAgP1xuICAgICAgW251bWJlciwgLi4uybVDb2VyY2VTdHJBcnJUb051bUFycjxUYWlsPl0gOlxuICAgICAgW0hlYWQsIC4uLsm1Q29lcmNlU3RyQXJyVG9OdW1BcnI8VGFpbD5dIDpcbiAgICBbXTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0YWtlcyBhIHR5cGUgVCBhbmQgYW4gYXJyYXkgSywgYW5kIHJldHVybnMgdGhlIHR5cGUgb2YgVFtLWzBdXVtLWzFdXVtLWzJdXS4uLlxuICovXG5leHBvcnQgdHlwZSDJtU5hdmlnYXRlPFQsIEsgZXh0ZW5kcyhBcnJheTxzdHJpbmd8bnVtYmVyPik+ID1cbiAgVCBleHRlbmRzIG9iamVjdCA/IC8qIFQgbXVzdCBiZSBpbmRleGFibGUgKG9iamVjdCBvciBhcnJheSkgKi9cbiAgICAoSyBleHRlbmRzIFtpbmZlciBIZWFkLCAuLi5pbmZlciBUYWlsXSA/IC8qIFNwbGl0IEsgaW50byBoZWFkIGFuZCB0YWlsICovXG4gICAgICAoSGVhZCBleHRlbmRzIGtleW9mIFQgPyAvKiBoZWFkKEspIG11c3QgaW5kZXggVCAqL1xuICAgICAgICAoVGFpbCBleHRlbmRzKHN0cmluZ3xudW1iZXIpW10gPyAvKiB0YWlsKEspIG11c3QgYmUgYW4gYXJyYXkgKi9cbiAgICAgICAgICBbXSBleHRlbmRzIFRhaWwgPyBUW0hlYWRdIDogLyogYmFzZSBjYXNlOiBLIGNhbiBiZSBzcGxpdCwgYnV0IFRhaWwgaXMgZW1wdHkgKi9cbiAgICAgICAgICAgICjJtU5hdmlnYXRlPFRbSGVhZF0sIFRhaWw+KSAvKiBleHBsb3JlIFRbaGVhZChLKV0gYnkgdGFpbChLKSAqLyA6XG4gICAgICAgICAgYW55KSAvKiB0YWlsKEspIHdhcyBub3QgYW4gYXJyYXksIGdpdmUgdXAgKi8gOlxuICAgICAgICBuZXZlcikgLyogaGVhZChLKSBkb2VzIG5vdCBpbmRleCBULCBnaXZlIHVwICovIDpcbiAgICAgIGFueSkgLyogSyBjYW5ub3QgYmUgc3BsaXQsIGdpdmUgdXAgKi8gOlxuICAgIGFueSAvKiBUIGlzIG5vdCBpbmRleGFibGUsIGdpdmUgdXAgKi9cbiAgO1xuXG4vKipcbiAqIMm1V3JpdGVhYmxlIHJlbW92ZXMgcmVhZG9ubHkgZnJvbSBhbGwga2V5cy5cbiAqL1xuZXhwb3J0IHR5cGUgybVXcml0ZWFibGU8VD4gPSB7XG4gIC1yZWFkb25seVtQIGluIGtleW9mIFRdOiBUW1BdXG59O1xuXG4vKipcbiAqIEdldFByb3BlcnR5IHRha2VzIGEgdHlwZSBUIGFuZCBzb21lIHByb3BlcnR5IG5hbWVzIG9yIGluZGljZXMgSy5cbiAqIElmIEsgaXMgYSBkb3Qtc2VwYXJhdGVkIHN0cmluZywgaXQgaXMgdG9rZW5pemVkIGludG8gYW4gYXJyYXkgYmVmb3JlIHByb2NlZWRpbmcuXG4gKiBUaGVuLCB0aGUgdHlwZSBvZiB0aGUgbmVzdGVkIHByb3BlcnR5IGF0IEsgaXMgY29tcHV0ZWQ6IFRbS1swXV1bS1sxXV1bS1syXV0uLi5cbiAqIFRoaXMgd29ya3Mgd2l0aCBib3RoIG9iamVjdHMsIHdoaWNoIGFyZSBpbmRleGVkIGJ5IHByb3BlcnR5IG5hbWUsIGFuZCBhcnJheXMsIHdoaWNoIGFyZSBpbmRleGVkXG4gKiBudW1lcmljYWxseS5cbiAqXG4gKiBGb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG4gKi9cbmV4cG9ydCB0eXBlIMm1R2V0UHJvcGVydHk8VCwgSz4gPVxuICAgIC8vIEsgaXMgYSBzdHJpbmdcbiAgICBLIGV4dGVuZHMgc3RyaW5nID8gybVHZXRQcm9wZXJ0eTxULCDJtUNvZXJjZVN0ckFyclRvTnVtQXJyPMm1VG9rZW5pemU8SywgJy4nPj4+IDpcbiAgICAvLyBJcyBpdCBhbiBhcnJheVxuICAgIMm1V3JpdGVhYmxlPEs+IGV4dGVuZHMgQXJyYXk8c3RyaW5nfG51bWJlcj4gPyDJtU5hdmlnYXRlPFQsIMm1V3JpdGVhYmxlPEs+PiA6XG4gICAgLy8gRmFsbCB0aHJvdWdoIHBlcm1pc3NpdmVseSBpZiB3ZSBjYW4ndCBjYWxjdWxhdGUgdGhlIHR5cGUgb2YgSy5cbiAgICBhbnk7XG5cbi8vIGNsYW5nLWZvcm1hdCBvblxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIGBGb3JtQ29udHJvbGAsIGBGb3JtR3JvdXBgLCBhbmQgYEZvcm1BcnJheWAuXG4gKlxuICogSXQgcHJvdmlkZXMgc29tZSBvZiB0aGUgc2hhcmVkIGJlaGF2aW9yIHRoYXQgYWxsIGNvbnRyb2xzIGFuZCBncm91cHMgb2YgY29udHJvbHMgaGF2ZSwgbGlrZVxuICogcnVubmluZyB2YWxpZGF0b3JzLCBjYWxjdWxhdGluZyBzdGF0dXMsIGFuZCByZXNldHRpbmcgc3RhdGUuIEl0IGFsc28gZGVmaW5lcyB0aGUgcHJvcGVydGllc1xuICogdGhhdCBhcmUgc2hhcmVkIGJldHdlZW4gYWxsIHN1Yi1jbGFzc2VzLCBsaWtlIGB2YWx1ZWAsIGB2YWxpZGAsIGFuZCBgZGlydHlgLiBJdCBzaG91bGRuJ3QgYmVcbiAqIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAqXG4gKiBUaGUgZmlyc3QgdHlwZSBwYXJhbWV0ZXIgVFZhbHVlIHJlcHJlc2VudHMgdGhlIHZhbHVlIHR5cGUgb2YgdGhlIGNvbnRyb2wgKGBjb250cm9sLnZhbHVlYCkuXG4gKiBUaGUgb3B0aW9uYWwgdHlwZSBwYXJhbWV0ZXIgVFJhd1ZhbHVlICByZXByZXNlbnRzIHRoZSByYXcgdmFsdWUgdHlwZSAoYGNvbnRyb2wuZ2V0UmF3VmFsdWUoKWApLlxuICpcbiAqIEBzZWUgW0Zvcm1zIEd1aWRlXSgvZ3VpZGUvZm9ybXMpXG4gKiBAc2VlIFtSZWFjdGl2ZSBGb3JtcyBHdWlkZV0oL2d1aWRlL3JlYWN0aXZlLWZvcm1zKVxuICogQHNlZSBbRHluYW1pYyBGb3JtcyBHdWlkZV0oL2d1aWRlL2R5bmFtaWMtZm9ybSlcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdENvbnRyb2w8VFZhbHVlID0gYW55LCBUUmF3VmFsdWUgZXh0ZW5kcyBUVmFsdWUgPSBUVmFsdWU+IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcGVuZGluZ0RpcnR5ID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGF0IGEgY29udHJvbCBoYXMgaXRzIG93biBwZW5kaW5nIGFzeW5jaHJvbm91cyB2YWxpZGF0aW9uIGluIHByb2dyZXNzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9oYXNPd25QZW5kaW5nQXN5bmNWYWxpZGF0b3IgPSBmYWxzZTtcblxuICAvKiogQGludGVybmFsICovXG4gIF9wZW5kaW5nVG91Y2hlZCA9IGZhbHNlO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX29uQ29sbGVjdGlvbkNoYW5nZSA9ICgpID0+IHt9O1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VwZGF0ZU9uPzogRm9ybUhvb2tzO1xuXG4gIHByaXZhdGUgX3BhcmVudDogRm9ybUdyb3VwfEZvcm1BcnJheXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYXN5bmNWYWxpZGF0aW9uU3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5zIHRoZSByZXN1bHQgb2YgbWVyZ2luZyBzeW5jaHJvbm91cyB2YWxpZGF0b3JzIGludG8gYSBzaW5nbGUgdmFsaWRhdG9yIGZ1bmN0aW9uXG4gICAqIChjb21iaW5lZCB1c2luZyBgVmFsaWRhdG9ycy5jb21wb3NlYCkuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfY29tcG9zZWRWYWxpZGF0b3JGbiE6IFZhbGlkYXRvckZufG51bGw7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5zIHRoZSByZXN1bHQgb2YgbWVyZ2luZyBhc3luY2hyb25vdXMgdmFsaWRhdG9ycyBpbnRvIGEgc2luZ2xlIHZhbGlkYXRvciBmdW5jdGlvblxuICAgKiAoY29tYmluZWQgdXNpbmcgYFZhbGlkYXRvcnMuY29tcG9zZUFzeW5jYCkuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfY29tcG9zZWRBc3luY1ZhbGlkYXRvckZuITogQXN5bmNWYWxpZGF0b3JGbnxudWxsO1xuXG4gIC8qKlxuICAgKiBTeW5jaHJvbm91cyB2YWxpZGF0b3JzIGFzIHRoZXkgd2VyZSBwcm92aWRlZDpcbiAgICogIC0gaW4gYEFic3RyYWN0Q29udHJvbGAgY29uc3RydWN0b3JcbiAgICogIC0gYXMgYW4gYXJndW1lbnQgd2hpbGUgY2FsbGluZyBgc2V0VmFsaWRhdG9yc2AgZnVuY3Rpb25cbiAgICogIC0gd2hpbGUgY2FsbGluZyB0aGUgc2V0dGVyIG9uIHRoZSBgdmFsaWRhdG9yYCBmaWVsZCAoZS5nLiBgY29udHJvbC52YWxpZGF0b3IgPSB2YWxpZGF0b3JGbmApXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfcmF3VmFsaWRhdG9ycyE6IFZhbGlkYXRvckZufFZhbGlkYXRvckZuW118bnVsbDtcblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzIHZhbGlkYXRvcnMgYXMgdGhleSB3ZXJlIHByb3ZpZGVkOlxuICAgKiAgLSBpbiBgQWJzdHJhY3RDb250cm9sYCBjb25zdHJ1Y3RvclxuICAgKiAgLSBhcyBhbiBhcmd1bWVudCB3aGlsZSBjYWxsaW5nIGBzZXRBc3luY1ZhbGlkYXRvcnNgIGZ1bmN0aW9uXG4gICAqICAtIHdoaWxlIGNhbGxpbmcgdGhlIHNldHRlciBvbiB0aGUgYGFzeW5jVmFsaWRhdG9yYCBmaWVsZCAoZS5nLiBgY29udHJvbC5hc3luY1ZhbGlkYXRvciA9XG4gICAqIGFzeW5jVmFsaWRhdG9yRm5gKVxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX3Jhd0FzeW5jVmFsaWRhdG9ycyE6IEFzeW5jVmFsaWRhdG9yRm58QXN5bmNWYWxpZGF0b3JGbltdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBjb250cm9sLlxuICAgKlxuICAgKiAqIEZvciBhIGBGb3JtQ29udHJvbGAsIHRoZSBjdXJyZW50IHZhbHVlLlxuICAgKiAqIEZvciBhbiBlbmFibGVkIGBGb3JtR3JvdXBgLCB0aGUgdmFsdWVzIG9mIGVuYWJsZWQgY29udHJvbHMgYXMgYW4gb2JqZWN0XG4gICAqIHdpdGggYSBrZXktdmFsdWUgcGFpciBmb3IgZWFjaCBtZW1iZXIgb2YgdGhlIGdyb3VwLlxuICAgKiAqIEZvciBhIGRpc2FibGVkIGBGb3JtR3JvdXBgLCB0aGUgdmFsdWVzIG9mIGFsbCBjb250cm9scyBhcyBhbiBvYmplY3RcbiAgICogd2l0aCBhIGtleS12YWx1ZSBwYWlyIGZvciBlYWNoIG1lbWJlciBvZiB0aGUgZ3JvdXAuXG4gICAqICogRm9yIGEgYEZvcm1BcnJheWAsIHRoZSB2YWx1ZXMgb2YgZW5hYmxlZCBjb250cm9scyBhcyBhbiBhcnJheS5cbiAgICpcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSB2YWx1ZSE6IFRWYWx1ZTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgQWJzdHJhY3RDb250cm9sIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9ycyBUaGUgZnVuY3Rpb24gb3IgYXJyYXkgb2YgZnVuY3Rpb25zIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHZhbGlkaXR5IG9mXG4gICAqICAgICB0aGlzIGNvbnRyb2wgc3luY2hyb25vdXNseS5cbiAgICogQHBhcmFtIGFzeW5jVmFsaWRhdG9ycyBUaGUgZnVuY3Rpb24gb3IgYXJyYXkgb2YgZnVuY3Rpb25zIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgdmFsaWRpdHkgb2ZcbiAgICogICAgIHRoaXMgY29udHJvbCBhc3luY2hyb25vdXNseS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgdmFsaWRhdG9yczogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxudWxsLFxuICAgICAgYXN5bmNWYWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZufEFzeW5jVmFsaWRhdG9yRm5bXXxudWxsKSB7XG4gICAgdGhpcy5fYXNzaWduVmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcbiAgICB0aGlzLl9hc3NpZ25Bc3luY1ZhbGlkYXRvcnMoYXN5bmNWYWxpZGF0b3JzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSB2YWxpZGl0eSBvZiB0aGlzIGNvbnRyb2wgc3luY2hyb25vdXNseS5cbiAgICogSWYgbXVsdGlwbGUgdmFsaWRhdG9ycyBoYXZlIGJlZW4gYWRkZWQsIHRoaXMgd2lsbCBiZSBhIHNpbmdsZSBjb21wb3NlZCBmdW5jdGlvbi5cbiAgICogU2VlIGBWYWxpZGF0b3JzLmNvbXBvc2UoKWAgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gICAqL1xuICBnZXQgdmFsaWRhdG9yKCk6IFZhbGlkYXRvckZufG51bGwge1xuICAgIHJldHVybiB0aGlzLl9jb21wb3NlZFZhbGlkYXRvckZuO1xuICB9XG4gIHNldCB2YWxpZGF0b3IodmFsaWRhdG9yRm46IFZhbGlkYXRvckZufG51bGwpIHtcbiAgICB0aGlzLl9yYXdWYWxpZGF0b3JzID0gdGhpcy5fY29tcG9zZWRWYWxpZGF0b3JGbiA9IHZhbGlkYXRvckZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHZhbGlkaXR5IG9mIHRoaXMgY29udHJvbCBhc3luY2hyb25vdXNseS5cbiAgICogSWYgbXVsdGlwbGUgdmFsaWRhdG9ycyBoYXZlIGJlZW4gYWRkZWQsIHRoaXMgd2lsbCBiZSBhIHNpbmdsZSBjb21wb3NlZCBmdW5jdGlvbi5cbiAgICogU2VlIGBWYWxpZGF0b3JzLmNvbXBvc2UoKWAgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gICAqL1xuICBnZXQgYXN5bmNWYWxpZGF0b3IoKTogQXN5bmNWYWxpZGF0b3JGbnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9zZWRBc3luY1ZhbGlkYXRvckZuO1xuICB9XG4gIHNldCBhc3luY1ZhbGlkYXRvcihhc3luY1ZhbGlkYXRvckZuOiBBc3luY1ZhbGlkYXRvckZufG51bGwpIHtcbiAgICB0aGlzLl9yYXdBc3luY1ZhbGlkYXRvcnMgPSB0aGlzLl9jb21wb3NlZEFzeW5jVmFsaWRhdG9yRm4gPSBhc3luY1ZhbGlkYXRvckZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgY29udHJvbC5cbiAgICovXG4gIGdldCBwYXJlbnQoKTogRm9ybUdyb3VwfEZvcm1BcnJheXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSB2YWxpZGF0aW9uIHN0YXR1cyBvZiB0aGUgY29udHJvbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgRm9ybUNvbnRyb2xTdGF0dXN9XG4gICAqXG4gICAqIFRoZXNlIHN0YXR1cyB2YWx1ZXMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZSwgc28gYSBjb250cm9sIGNhbm5vdCBiZVxuICAgKiBib3RoIHZhbGlkIEFORCBpbnZhbGlkIG9yIGludmFsaWQgQU5EIGRpc2FibGVkLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1cyE6IEZvcm1Db250cm9sU3RhdHVzO1xuXG4gIC8qKlxuICAgKiBBIGNvbnRyb2wgaXMgYHZhbGlkYCB3aGVuIGl0cyBgc3RhdHVzYCBpcyBgVkFMSURgLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBBYnN0cmFjdENvbnRyb2wuc3RhdHVzfVxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBjb250cm9sIGhhcyBwYXNzZWQgYWxsIG9mIGl0cyB2YWxpZGF0aW9uIHRlc3RzLFxuICAgKiBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBnZXQgdmFsaWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzID09PSBWQUxJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbnRyb2wgaXMgYGludmFsaWRgIHdoZW4gaXRzIGBzdGF0dXNgIGlzIGBJTlZBTElEYC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sLnN0YXR1c31cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGNvbnRyb2wgaGFzIGZhaWxlZCBvbmUgb3IgbW9yZSBvZiBpdHMgdmFsaWRhdGlvbiBjaGVja3MsXG4gICAqIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGdldCBpbnZhbGlkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cyA9PT0gSU5WQUxJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbnRyb2wgaXMgYHBlbmRpbmdgIHdoZW4gaXRzIGBzdGF0dXNgIGlzIGBQRU5ESU5HYC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sLnN0YXR1c31cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGNvbnRyb2wgaXMgaW4gdGhlIHByb2Nlc3Mgb2YgY29uZHVjdGluZyBhIHZhbGlkYXRpb24gY2hlY2ssXG4gICAqIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGdldCBwZW5kaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cyA9PSBQRU5ESU5HO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY29udHJvbCBpcyBgZGlzYWJsZWRgIHdoZW4gaXRzIGBzdGF0dXNgIGlzIGBESVNBQkxFRGAuXG4gICAqXG4gICAqIERpc2FibGVkIGNvbnRyb2xzIGFyZSBleGVtcHQgZnJvbSB2YWxpZGF0aW9uIGNoZWNrcyBhbmRcbiAgICogYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgYWdncmVnYXRlIHZhbHVlIG9mIHRoZWlyIGFuY2VzdG9yXG4gICAqIGNvbnRyb2xzLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBBYnN0cmFjdENvbnRyb2wuc3RhdHVzfVxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBjb250cm9sIGlzIGRpc2FibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzID09PSBESVNBQkxFRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbnRyb2wgaXMgYGVuYWJsZWRgIGFzIGxvbmcgYXMgaXRzIGBzdGF0dXNgIGlzIG5vdCBgRElTQUJMRURgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBjb250cm9sIGhhcyBhbnkgc3RhdHVzIG90aGVyIHRoYW4gJ0RJU0FCTEVEJyxcbiAgICogZmFsc2UgaWYgdGhlIHN0YXR1cyBpcyAnRElTQUJMRUQnLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBBYnN0cmFjdENvbnRyb2wuc3RhdHVzfVxuICAgKlxuICAgKi9cbiAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzICE9PSBESVNBQkxFRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBvYmplY3QgY29udGFpbmluZyBhbnkgZXJyb3JzIGdlbmVyYXRlZCBieSBmYWlsaW5nIHZhbGlkYXRpb24sXG4gICAqIG9yIG51bGwgaWYgdGhlcmUgYXJlIG5vIGVycm9ycy5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBlcnJvcnMhOiBWYWxpZGF0aW9uRXJyb3JzfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29udHJvbCBpcyBgcHJpc3RpbmVgIGlmIHRoZSB1c2VyIGhhcyBub3QgeWV0IGNoYW5nZWRcbiAgICogdGhlIHZhbHVlIGluIHRoZSBVSS5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdXNlciBoYXMgbm90IHlldCBjaGFuZ2VkIHRoZSB2YWx1ZSBpbiB0aGUgVUk7IGNvbXBhcmUgYGRpcnR5YC5cbiAgICogUHJvZ3JhbW1hdGljIGNoYW5nZXMgdG8gYSBjb250cm9sJ3MgdmFsdWUgZG8gbm90IG1hcmsgaXQgZGlydHkuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpc3RpbmU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBBIGNvbnRyb2wgaXMgYGRpcnR5YCBpZiB0aGUgdXNlciBoYXMgY2hhbmdlZCB0aGUgdmFsdWVcbiAgICogaW4gdGhlIFVJLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB1c2VyIGhhcyBjaGFuZ2VkIHRoZSB2YWx1ZSBvZiB0aGlzIGNvbnRyb2wgaW4gdGhlIFVJOyBjb21wYXJlIGBwcmlzdGluZWAuXG4gICAqIFByb2dyYW1tYXRpYyBjaGFuZ2VzIHRvIGEgY29udHJvbCdzIHZhbHVlIGRvIG5vdCBtYXJrIGl0IGRpcnR5LlxuICAgKi9cbiAgZ2V0IGRpcnR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5wcmlzdGluZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcnVlIGlmIHRoZSBjb250cm9sIGlzIG1hcmtlZCBhcyBgdG91Y2hlZGAuXG4gICAqXG4gICAqIEEgY29udHJvbCBpcyBtYXJrZWQgYHRvdWNoZWRgIG9uY2UgdGhlIHVzZXIgaGFzIHRyaWdnZXJlZFxuICAgKiBhIGBibHVyYCBldmVudCBvbiBpdC5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSB0b3VjaGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRydWUgaWYgdGhlIGNvbnRyb2wgaGFzIG5vdCBiZWVuIG1hcmtlZCBhcyB0b3VjaGVkXG4gICAqXG4gICAqIEEgY29udHJvbCBpcyBgdW50b3VjaGVkYCBpZiB0aGUgdXNlciBoYXMgbm90IHlldCB0cmlnZ2VyZWRcbiAgICogYSBgYmx1cmAgZXZlbnQgb24gaXQuXG4gICAqL1xuICBnZXQgdW50b3VjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy50b3VjaGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbXVsdGljYXN0aW5nIG9ic2VydmFibGUgdGhhdCBlbWl0cyBhbiBldmVudCBldmVyeSB0aW1lIHRoZSB2YWx1ZSBvZiB0aGUgY29udHJvbCBjaGFuZ2VzLCBpblxuICAgKiB0aGUgVUkgb3IgcHJvZ3JhbW1hdGljYWxseS4gSXQgYWxzbyBlbWl0cyBhbiBldmVudCBlYWNoIHRpbWUgeW91IGNhbGwgZW5hYmxlKCkgb3IgZGlzYWJsZSgpXG4gICAqIHdpdGhvdXQgcGFzc2luZyBhbG9uZyB7ZW1pdEV2ZW50OiBmYWxzZX0gYXMgYSBmdW5jdGlvbiBhcmd1bWVudC5cbiAgICpcbiAgICogKipOb3RlKio6IHRoZSBlbWl0IGhhcHBlbnMgcmlnaHQgYWZ0ZXIgYSB2YWx1ZSBvZiB0aGlzIGNvbnRyb2wgaXMgdXBkYXRlZC4gVGhlIHZhbHVlIG9mIGFcbiAgICogcGFyZW50IGNvbnRyb2wgKGZvciBleGFtcGxlIGlmIHRoaXMgRm9ybUNvbnRyb2wgaXMgYSBwYXJ0IG9mIGEgRm9ybUdyb3VwKSBpcyB1cGRhdGVkIGxhdGVyLCBzb1xuICAgKiBhY2Nlc3NpbmcgYSB2YWx1ZSBvZiBhIHBhcmVudCBjb250cm9sICh1c2luZyB0aGUgYHZhbHVlYCBwcm9wZXJ0eSkgZnJvbSB0aGUgY2FsbGJhY2sgb2YgdGhpc1xuICAgKiBldmVudCBtaWdodCByZXN1bHQgaW4gZ2V0dGluZyBhIHZhbHVlIHRoYXQgaGFzIG5vdCBiZWVuIHVwZGF0ZWQgeWV0LiBTdWJzY3JpYmUgdG8gdGhlXG4gICAqIGB2YWx1ZUNoYW5nZXNgIGV2ZW50IG9mIHRoZSBwYXJlbnQgY29udHJvbCBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHZhbHVlQ2hhbmdlcyE6IE9ic2VydmFibGU8VFZhbHVlPjtcblxuICAvKipcbiAgICogQSBtdWx0aWNhc3Rpbmcgb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIGFuIGV2ZW50IGV2ZXJ5IHRpbWUgdGhlIHZhbGlkYXRpb24gYHN0YXR1c2Agb2YgdGhlIGNvbnRyb2xcbiAgICogcmVjYWxjdWxhdGVzLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBGb3JtQ29udHJvbFN0YXR1c31cbiAgICogQHNlZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sLnN0YXR1c31cbiAgICpcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDaGFuZ2VzITogT2JzZXJ2YWJsZTxGb3JtQ29udHJvbFN0YXR1cz47XG5cbiAgLyoqXG4gICAqIFJlcG9ydHMgdGhlIHVwZGF0ZSBzdHJhdGVneSBvZiB0aGUgYEFic3RyYWN0Q29udHJvbGAgKG1lYW5pbmdcbiAgICogdGhlIGV2ZW50IG9uIHdoaWNoIHRoZSBjb250cm9sIHVwZGF0ZXMgaXRzZWxmKS5cbiAgICogUG9zc2libGUgdmFsdWVzOiBgJ2NoYW5nZSdgIHwgYCdibHVyJ2AgfCBgJ3N1Ym1pdCdgXG4gICAqIERlZmF1bHQgdmFsdWU6IGAnY2hhbmdlJ2BcbiAgICovXG4gIGdldCB1cGRhdGVPbigpOiBGb3JtSG9va3Mge1xuICAgIHJldHVybiB0aGlzLl91cGRhdGVPbiA/IHRoaXMuX3VwZGF0ZU9uIDogKHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQudXBkYXRlT24gOiAnY2hhbmdlJyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc3luY2hyb25vdXMgdmFsaWRhdG9ycyB0aGF0IGFyZSBhY3RpdmUgb24gdGhpcyBjb250cm9sLiAgQ2FsbGluZ1xuICAgKiB0aGlzIG92ZXJ3cml0ZXMgYW55IGV4aXN0aW5nIHN5bmNocm9ub3VzIHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIFdoZW4geW91IGFkZCBvciByZW1vdmUgYSB2YWxpZGF0b3IgYXQgcnVuIHRpbWUsIHlvdSBtdXN0IGNhbGxcbiAgICogYHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKWAgZm9yIHRoZSBuZXcgdmFsaWRhdGlvbiB0byB0YWtlIGVmZmVjdC5cbiAgICpcbiAgICogSWYgeW91IHdhbnQgdG8gYWRkIGEgbmV3IHZhbGlkYXRvciB3aXRob3V0IGFmZmVjdGluZyBleGlzdGluZyBvbmVzLCBjb25zaWRlclxuICAgKiB1c2luZyBgYWRkVmFsaWRhdG9ycygpYCBtZXRob2QgaW5zdGVhZC5cbiAgICovXG4gIHNldFZhbGlkYXRvcnModmFsaWRhdG9yczogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzaWduVmFsaWRhdG9ycyh2YWxpZGF0b3JzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhc3luY2hyb25vdXMgdmFsaWRhdG9ycyB0aGF0IGFyZSBhY3RpdmUgb24gdGhpcyBjb250cm9sLiBDYWxsaW5nIHRoaXNcbiAgICogb3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcgYXN5bmNocm9ub3VzIHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIFdoZW4geW91IGFkZCBvciByZW1vdmUgYSB2YWxpZGF0b3IgYXQgcnVuIHRpbWUsIHlvdSBtdXN0IGNhbGxcbiAgICogYHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKWAgZm9yIHRoZSBuZXcgdmFsaWRhdGlvbiB0byB0YWtlIGVmZmVjdC5cbiAgICpcbiAgICogSWYgeW91IHdhbnQgdG8gYWRkIGEgbmV3IHZhbGlkYXRvciB3aXRob3V0IGFmZmVjdGluZyBleGlzdGluZyBvbmVzLCBjb25zaWRlclxuICAgKiB1c2luZyBgYWRkQXN5bmNWYWxpZGF0b3JzKClgIG1ldGhvZCBpbnN0ZWFkLlxuICAgKi9cbiAgc2V0QXN5bmNWYWxpZGF0b3JzKHZhbGlkYXRvcnM6IEFzeW5jVmFsaWRhdG9yRm58QXN5bmNWYWxpZGF0b3JGbltdfG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NpZ25Bc3luY1ZhbGlkYXRvcnModmFsaWRhdG9ycyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgc3luY2hyb25vdXMgdmFsaWRhdG9yIG9yIHZhbGlkYXRvcnMgdG8gdGhpcyBjb250cm9sLCB3aXRob3V0IGFmZmVjdGluZyBvdGhlciB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiBXaGVuIHlvdSBhZGQgb3IgcmVtb3ZlIGEgdmFsaWRhdG9yIGF0IHJ1biB0aW1lLCB5b3UgbXVzdCBjYWxsXG4gICAqIGB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KClgIGZvciB0aGUgbmV3IHZhbGlkYXRpb24gdG8gdGFrZSBlZmZlY3QuXG4gICAqXG4gICAqIEFkZGluZyBhIHZhbGlkYXRvciB0aGF0IGFscmVhZHkgZXhpc3RzIHdpbGwgaGF2ZSBubyBlZmZlY3QuIElmIGR1cGxpY2F0ZSB2YWxpZGF0b3IgZnVuY3Rpb25zXG4gICAqIGFyZSBwcmVzZW50IGluIHRoZSBgdmFsaWRhdG9yc2AgYXJyYXksIG9ubHkgdGhlIGZpcnN0IGluc3RhbmNlIHdvdWxkIGJlIGFkZGVkIHRvIGEgZm9ybVxuICAgKiBjb250cm9sLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9ycyBUaGUgbmV3IHZhbGlkYXRvciBmdW5jdGlvbiBvciBmdW5jdGlvbnMgdG8gYWRkIHRvIHRoaXMgY29udHJvbC5cbiAgICovXG4gIGFkZFZhbGlkYXRvcnModmFsaWRhdG9yczogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXSk6IHZvaWQge1xuICAgIHRoaXMuc2V0VmFsaWRhdG9ycyhhZGRWYWxpZGF0b3JzKHZhbGlkYXRvcnMsIHRoaXMuX3Jhd1ZhbGlkYXRvcnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gYXN5bmNocm9ub3VzIHZhbGlkYXRvciBvciB2YWxpZGF0b3JzIHRvIHRoaXMgY29udHJvbCwgd2l0aG91dCBhZmZlY3Rpbmcgb3RoZXJcbiAgICogdmFsaWRhdG9ycy5cbiAgICpcbiAgICogV2hlbiB5b3UgYWRkIG9yIHJlbW92ZSBhIHZhbGlkYXRvciBhdCBydW4gdGltZSwgeW91IG11c3QgY2FsbFxuICAgKiBgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpYCBmb3IgdGhlIG5ldyB2YWxpZGF0aW9uIHRvIHRha2UgZWZmZWN0LlxuICAgKlxuICAgKiBBZGRpbmcgYSB2YWxpZGF0b3IgdGhhdCBhbHJlYWR5IGV4aXN0cyB3aWxsIGhhdmUgbm8gZWZmZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9ycyBUaGUgbmV3IGFzeW5jaHJvbm91cyB2YWxpZGF0b3IgZnVuY3Rpb24gb3IgZnVuY3Rpb25zIHRvIGFkZCB0byB0aGlzIGNvbnRyb2wuXG4gICAqL1xuICBhZGRBc3luY1ZhbGlkYXRvcnModmFsaWRhdG9yczogQXN5bmNWYWxpZGF0b3JGbnxBc3luY1ZhbGlkYXRvckZuW10pOiB2b2lkIHtcbiAgICB0aGlzLnNldEFzeW5jVmFsaWRhdG9ycyhhZGRWYWxpZGF0b3JzKHZhbGlkYXRvcnMsIHRoaXMuX3Jhd0FzeW5jVmFsaWRhdG9ycykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHN5bmNocm9ub3VzIHZhbGlkYXRvciBmcm9tIHRoaXMgY29udHJvbCwgd2l0aG91dCBhZmZlY3Rpbmcgb3RoZXIgdmFsaWRhdG9ycy5cbiAgICogVmFsaWRhdG9ycyBhcmUgY29tcGFyZWQgYnkgZnVuY3Rpb24gcmVmZXJlbmNlOyB5b3UgbXVzdCBwYXNzIGEgcmVmZXJlbmNlIHRvIHRoZSBleGFjdCBzYW1lXG4gICAqIHZhbGlkYXRvciBmdW5jdGlvbiBhcyB0aGUgb25lIHRoYXQgd2FzIG9yaWdpbmFsbHkgc2V0LiBJZiBhIHByb3ZpZGVkIHZhbGlkYXRvciBpcyBub3QgZm91bmQsXG4gICAqIGl0IGlzIGlnbm9yZWQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqXG4gICAqICMjIyBSZWZlcmVuY2UgdG8gYSBWYWxpZGF0b3JGblxuICAgKlxuICAgKiBgYGBcbiAgICogLy8gUmVmZXJlbmNlIHRvIHRoZSBSZXF1aXJlZFZhbGlkYXRvclxuICAgKiBjb25zdCBjdHJsID0gbmV3IEZvcm1Db250cm9sPHN0cmluZyB8IG51bGw+KCcnLCBWYWxpZGF0b3JzLnJlcXVpcmVkKTtcbiAgICogY3RybC5yZW1vdmVWYWxpZGF0b3JzKFZhbGlkYXRvcnMucmVxdWlyZWQpO1xuICAgKlxuICAgKiAvLyBSZWZlcmVuY2UgdG8gYW5vbnltb3VzIGZ1bmN0aW9uIGluc2lkZSBNaW5WYWxpZGF0b3JcbiAgICogY29uc3QgbWluVmFsaWRhdG9yID0gVmFsaWRhdG9ycy5taW4oMyk7XG4gICAqIGNvbnN0IGN0cmwgPSBuZXcgRm9ybUNvbnRyb2w8c3RyaW5nIHwgbnVsbD4oJycsIG1pblZhbGlkYXRvcik7XG4gICAqIGV4cGVjdChjdHJsLmhhc1ZhbGlkYXRvcihtaW5WYWxpZGF0b3IpKS50b0VxdWFsKHRydWUpXG4gICAqIGV4cGVjdChjdHJsLmhhc1ZhbGlkYXRvcihWYWxpZGF0b3JzLm1pbigzKSkpLnRvRXF1YWwoZmFsc2UpXG4gICAqXG4gICAqIGN0cmwucmVtb3ZlVmFsaWRhdG9ycyhtaW5WYWxpZGF0b3IpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiB5b3UgYWRkIG9yIHJlbW92ZSBhIHZhbGlkYXRvciBhdCBydW4gdGltZSwgeW91IG11c3QgY2FsbFxuICAgKiBgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpYCBmb3IgdGhlIG5ldyB2YWxpZGF0aW9uIHRvIHRha2UgZWZmZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9ycyBUaGUgdmFsaWRhdG9yIG9yIHZhbGlkYXRvcnMgdG8gcmVtb3ZlLlxuICAgKi9cbiAgcmVtb3ZlVmFsaWRhdG9ycyh2YWxpZGF0b3JzOiBWYWxpZGF0b3JGbnxWYWxpZGF0b3JGbltdKTogdm9pZCB7XG4gICAgdGhpcy5zZXRWYWxpZGF0b3JzKHJlbW92ZVZhbGlkYXRvcnModmFsaWRhdG9ycywgdGhpcy5fcmF3VmFsaWRhdG9ycykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBhc3luY2hyb25vdXMgdmFsaWRhdG9yIGZyb20gdGhpcyBjb250cm9sLCB3aXRob3V0IGFmZmVjdGluZyBvdGhlciB2YWxpZGF0b3JzLlxuICAgKiBWYWxpZGF0b3JzIGFyZSBjb21wYXJlZCBieSBmdW5jdGlvbiByZWZlcmVuY2U7IHlvdSBtdXN0IHBhc3MgYSByZWZlcmVuY2UgdG8gdGhlIGV4YWN0IHNhbWVcbiAgICogdmFsaWRhdG9yIGZ1bmN0aW9uIGFzIHRoZSBvbmUgdGhhdCB3YXMgb3JpZ2luYWxseSBzZXQuIElmIGEgcHJvdmlkZWQgdmFsaWRhdG9yIGlzIG5vdCBmb3VuZCwgaXRcbiAgICogaXMgaWdub3JlZC5cbiAgICpcbiAgICogV2hlbiB5b3UgYWRkIG9yIHJlbW92ZSBhIHZhbGlkYXRvciBhdCBydW4gdGltZSwgeW91IG11c3QgY2FsbFxuICAgKiBgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpYCBmb3IgdGhlIG5ldyB2YWxpZGF0aW9uIHRvIHRha2UgZWZmZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9ycyBUaGUgYXN5bmNocm9ub3VzIHZhbGlkYXRvciBvciB2YWxpZGF0b3JzIHRvIHJlbW92ZS5cbiAgICovXG4gIHJlbW92ZUFzeW5jVmFsaWRhdG9ycyh2YWxpZGF0b3JzOiBBc3luY1ZhbGlkYXRvckZufEFzeW5jVmFsaWRhdG9yRm5bXSk6IHZvaWQge1xuICAgIHRoaXMuc2V0QXN5bmNWYWxpZGF0b3JzKHJlbW92ZVZhbGlkYXRvcnModmFsaWRhdG9ycywgdGhpcy5fcmF3QXN5bmNWYWxpZGF0b3JzKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciBhIHN5bmNocm9ub3VzIHZhbGlkYXRvciBmdW5jdGlvbiBpcyBwcmVzZW50IG9uIHRoaXMgY29udHJvbC4gVGhlIHByb3ZpZGVkXG4gICAqIHZhbGlkYXRvciBtdXN0IGJlIGEgcmVmZXJlbmNlIHRvIHRoZSBleGFjdCBzYW1lIGZ1bmN0aW9uIHRoYXQgd2FzIHByb3ZpZGVkLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKlxuICAgKiAjIyMgUmVmZXJlbmNlIHRvIGEgVmFsaWRhdG9yRm5cbiAgICpcbiAgICogYGBgXG4gICAqIC8vIFJlZmVyZW5jZSB0byB0aGUgUmVxdWlyZWRWYWxpZGF0b3JcbiAgICogY29uc3QgY3RybCA9IG5ldyBGb3JtQ29udHJvbDxudW1iZXIgfCBudWxsPigwLCBWYWxpZGF0b3JzLnJlcXVpcmVkKTtcbiAgICogZXhwZWN0KGN0cmwuaGFzVmFsaWRhdG9yKFZhbGlkYXRvcnMucmVxdWlyZWQpKS50b0VxdWFsKHRydWUpXG4gICAqXG4gICAqIC8vIFJlZmVyZW5jZSB0byBhbm9ueW1vdXMgZnVuY3Rpb24gaW5zaWRlIE1pblZhbGlkYXRvclxuICAgKiBjb25zdCBtaW5WYWxpZGF0b3IgPSBWYWxpZGF0b3JzLm1pbigzKTtcbiAgICogY29uc3QgY3RybCA9IG5ldyBGb3JtQ29udHJvbDxudW1iZXIgfCBudWxsPigwLCBtaW5WYWxpZGF0b3IpO1xuICAgKiBleHBlY3QoY3RybC5oYXNWYWxpZGF0b3IobWluVmFsaWRhdG9yKSkudG9FcXVhbCh0cnVlKVxuICAgKiBleHBlY3QoY3RybC5oYXNWYWxpZGF0b3IoVmFsaWRhdG9ycy5taW4oMykpKS50b0VxdWFsKGZhbHNlKVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHZhbGlkYXRvciBUaGUgdmFsaWRhdG9yIHRvIGNoZWNrIGZvciBwcmVzZW5jZS4gQ29tcGFyZWQgYnkgZnVuY3Rpb24gcmVmZXJlbmNlLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBwcm92aWRlZCB2YWxpZGF0b3Igd2FzIGZvdW5kIG9uIHRoaXMgY29udHJvbC5cbiAgICovXG4gIGhhc1ZhbGlkYXRvcih2YWxpZGF0b3I6IFZhbGlkYXRvckZuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGhhc1ZhbGlkYXRvcih0aGlzLl9yYXdWYWxpZGF0b3JzLCB2YWxpZGF0b3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgYW4gYXN5bmNocm9ub3VzIHZhbGlkYXRvciBmdW5jdGlvbiBpcyBwcmVzZW50IG9uIHRoaXMgY29udHJvbC4gVGhlIHByb3ZpZGVkXG4gICAqIHZhbGlkYXRvciBtdXN0IGJlIGEgcmVmZXJlbmNlIHRvIHRoZSBleGFjdCBzYW1lIGZ1bmN0aW9uIHRoYXQgd2FzIHByb3ZpZGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsaWRhdG9yIFRoZSBhc3luY2hyb25vdXMgdmFsaWRhdG9yIHRvIGNoZWNrIGZvciBwcmVzZW5jZS4gQ29tcGFyZWQgYnkgZnVuY3Rpb25cbiAgICogICAgIHJlZmVyZW5jZS5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgcHJvdmlkZWQgYXN5bmNocm9ub3VzIHZhbGlkYXRvciB3YXMgZm91bmQgb24gdGhpcyBjb250cm9sLlxuICAgKi9cbiAgaGFzQXN5bmNWYWxpZGF0b3IodmFsaWRhdG9yOiBBc3luY1ZhbGlkYXRvckZuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGhhc1ZhbGlkYXRvcih0aGlzLl9yYXdBc3luY1ZhbGlkYXRvcnMsIHZhbGlkYXRvcik7XG4gIH1cblxuICAvKipcbiAgICogRW1wdGllcyBvdXQgdGhlIHN5bmNocm9ub3VzIHZhbGlkYXRvciBsaXN0LlxuICAgKlxuICAgKiBXaGVuIHlvdSBhZGQgb3IgcmVtb3ZlIGEgdmFsaWRhdG9yIGF0IHJ1biB0aW1lLCB5b3UgbXVzdCBjYWxsXG4gICAqIGB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KClgIGZvciB0aGUgbmV3IHZhbGlkYXRpb24gdG8gdGFrZSBlZmZlY3QuXG4gICAqXG4gICAqL1xuICBjbGVhclZhbGlkYXRvcnMoKTogdm9pZCB7XG4gICAgdGhpcy52YWxpZGF0b3IgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtcHRpZXMgb3V0IHRoZSBhc3luYyB2YWxpZGF0b3IgbGlzdC5cbiAgICpcbiAgICogV2hlbiB5b3UgYWRkIG9yIHJlbW92ZSBhIHZhbGlkYXRvciBhdCBydW4gdGltZSwgeW91IG11c3QgY2FsbFxuICAgKiBgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpYCBmb3IgdGhlIG5ldyB2YWxpZGF0aW9uIHRvIHRha2UgZWZmZWN0LlxuICAgKlxuICAgKi9cbiAgY2xlYXJBc3luY1ZhbGlkYXRvcnMoKTogdm9pZCB7XG4gICAgdGhpcy5hc3luY1ZhbGlkYXRvciA9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIGNvbnRyb2wgYXMgYHRvdWNoZWRgLiBBIGNvbnRyb2wgaXMgdG91Y2hlZCBieSBmb2N1cyBhbmRcbiAgICogYmx1ciBldmVudHMgdGhhdCBkbyBub3QgY2hhbmdlIHRoZSB2YWx1ZS5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgbWFya0FzVW50b3VjaGVkKCl9XG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc0RpcnR5KCl9XG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc1ByaXN0aW5lKCl9XG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIENvbmZpZ3VyYXRpb24gb3B0aW9ucyB0aGF0IGRldGVybWluZSBob3cgdGhlIGNvbnRyb2wgcHJvcGFnYXRlcyBjaGFuZ2VzXG4gICAqIGFuZCBlbWl0cyBldmVudHMgYWZ0ZXIgbWFya2luZyBpcyBhcHBsaWVkLlxuICAgKiAqIGBvbmx5U2VsZmA6IFdoZW4gdHJ1ZSwgbWFyayBvbmx5IHRoaXMgY29udHJvbC4gV2hlbiBmYWxzZSBvciBub3Qgc3VwcGxpZWQsXG4gICAqIG1hcmtzIGFsbCBkaXJlY3QgYW5jZXN0b3JzLiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKi9cbiAgbWFya0FzVG91Y2hlZChvcHRzOiB7b25seVNlbGY/OiBib29sZWFufSA9IHt9KTogdm9pZCB7XG4gICAgKHRoaXMgYXMge3RvdWNoZWQ6IGJvb2xlYW59KS50b3VjaGVkID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9wYXJlbnQgJiYgIW9wdHMub25seVNlbGYpIHtcbiAgICAgIHRoaXMuX3BhcmVudC5tYXJrQXNUb3VjaGVkKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgY29udHJvbCBhbmQgYWxsIGl0cyBkZXNjZW5kYW50IGNvbnRyb2xzIGFzIGB0b3VjaGVkYC5cbiAgICogQHNlZSB7QGxpbmsgbWFya0FzVG91Y2hlZCgpfVxuICAgKi9cbiAgbWFya0FsbEFzVG91Y2hlZCgpOiB2b2lkIHtcbiAgICB0aGlzLm1hcmtBc1RvdWNoZWQoe29ubHlTZWxmOiB0cnVlfSk7XG5cbiAgICB0aGlzLl9mb3JFYWNoQ2hpbGQoKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4gY29udHJvbC5tYXJrQWxsQXNUb3VjaGVkKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSBjb250cm9sIGFzIGB1bnRvdWNoZWRgLlxuICAgKlxuICAgKiBJZiB0aGUgY29udHJvbCBoYXMgYW55IGNoaWxkcmVuLCBhbHNvIG1hcmtzIGFsbCBjaGlsZHJlbiBhcyBgdW50b3VjaGVkYFxuICAgKiBhbmQgcmVjYWxjdWxhdGVzIHRoZSBgdG91Y2hlZGAgc3RhdHVzIG9mIGFsbCBwYXJlbnQgY29udHJvbHMuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc1RvdWNoZWQoKX1cbiAgICogQHNlZSB7QGxpbmsgbWFya0FzRGlydHkoKX1cbiAgICogQHNlZSB7QGxpbmsgbWFya0FzUHJpc3RpbmUoKX1cbiAgICpcbiAgICogQHBhcmFtIG9wdHMgQ29uZmlndXJhdGlvbiBvcHRpb25zIHRoYXQgZGV0ZXJtaW5lIGhvdyB0aGUgY29udHJvbCBwcm9wYWdhdGVzIGNoYW5nZXNcbiAgICogYW5kIGVtaXRzIGV2ZW50cyBhZnRlciB0aGUgbWFya2luZyBpcyBhcHBsaWVkLlxuICAgKiAqIGBvbmx5U2VsZmA6IFdoZW4gdHJ1ZSwgbWFyayBvbmx5IHRoaXMgY29udHJvbC4gV2hlbiBmYWxzZSBvciBub3Qgc3VwcGxpZWQsXG4gICAqIG1hcmtzIGFsbCBkaXJlY3QgYW5jZXN0b3JzLiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKi9cbiAgbWFya0FzVW50b3VjaGVkKG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAodGhpcyBhcyB7dG91Y2hlZDogYm9vbGVhbn0pLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9wZW5kaW5nVG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5fZm9yRWFjaENoaWxkKChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpID0+IHtcbiAgICAgIGNvbnRyb2wubWFya0FzVW50b3VjaGVkKHtvbmx5U2VsZjogdHJ1ZX0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuX3BhcmVudCAmJiAhb3B0cy5vbmx5U2VsZikge1xuICAgICAgdGhpcy5fcGFyZW50Ll91cGRhdGVUb3VjaGVkKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgY29udHJvbCBhcyBgZGlydHlgLiBBIGNvbnRyb2wgYmVjb21lcyBkaXJ0eSB3aGVuXG4gICAqIHRoZSBjb250cm9sJ3MgdmFsdWUgaXMgY2hhbmdlZCB0aHJvdWdoIHRoZSBVSTsgY29tcGFyZSBgbWFya0FzVG91Y2hlZGAuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc1RvdWNoZWQoKX1cbiAgICogQHNlZSB7QGxpbmsgbWFya0FzVW50b3VjaGVkKCl9XG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc1ByaXN0aW5lKCl9XG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIENvbmZpZ3VyYXRpb24gb3B0aW9ucyB0aGF0IGRldGVybWluZSBob3cgdGhlIGNvbnRyb2wgcHJvcGFnYXRlcyBjaGFuZ2VzXG4gICAqIGFuZCBlbWl0cyBldmVudHMgYWZ0ZXIgbWFya2luZyBpcyBhcHBsaWVkLlxuICAgKiAqIGBvbmx5U2VsZmA6IFdoZW4gdHJ1ZSwgbWFyayBvbmx5IHRoaXMgY29udHJvbC4gV2hlbiBmYWxzZSBvciBub3Qgc3VwcGxpZWQsXG4gICAqIG1hcmtzIGFsbCBkaXJlY3QgYW5jZXN0b3JzLiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKi9cbiAgbWFya0FzRGlydHkob3B0czoge29ubHlTZWxmPzogYm9vbGVhbn0gPSB7fSk6IHZvaWQge1xuICAgICh0aGlzIGFzIHtwcmlzdGluZTogYm9vbGVhbn0pLnByaXN0aW5lID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fcGFyZW50ICYmICFvcHRzLm9ubHlTZWxmKSB7XG4gICAgICB0aGlzLl9wYXJlbnQubWFya0FzRGlydHkob3B0cyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtzIHRoZSBjb250cm9sIGFzIGBwcmlzdGluZWAuXG4gICAqXG4gICAqIElmIHRoZSBjb250cm9sIGhhcyBhbnkgY2hpbGRyZW4sIG1hcmtzIGFsbCBjaGlsZHJlbiBhcyBgcHJpc3RpbmVgLFxuICAgKiBhbmQgcmVjYWxjdWxhdGVzIHRoZSBgcHJpc3RpbmVgIHN0YXR1cyBvZiBhbGwgcGFyZW50XG4gICAqIGNvbnRyb2xzLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBtYXJrQXNUb3VjaGVkKCl9XG4gICAqIEBzZWUge0BsaW5rIG1hcmtBc1VudG91Y2hlZCgpfVxuICAgKiBAc2VlIHtAbGluayBtYXJrQXNEaXJ0eSgpfVxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBDb25maWd1cmF0aW9uIG9wdGlvbnMgdGhhdCBkZXRlcm1pbmUgaG93IHRoZSBjb250cm9sIGVtaXRzIGV2ZW50cyBhZnRlclxuICAgKiBtYXJraW5nIGlzIGFwcGxpZWQuXG4gICAqICogYG9ubHlTZWxmYDogV2hlbiB0cnVlLCBtYXJrIG9ubHkgdGhpcyBjb250cm9sLiBXaGVuIGZhbHNlIG9yIG5vdCBzdXBwbGllZCxcbiAgICogbWFya3MgYWxsIGRpcmVjdCBhbmNlc3RvcnMuIERlZmF1bHQgaXMgZmFsc2UuXG4gICAqL1xuICBtYXJrQXNQcmlzdGluZShvcHRzOiB7b25seVNlbGY/OiBib29sZWFufSA9IHt9KTogdm9pZCB7XG4gICAgKHRoaXMgYXMge3ByaXN0aW5lOiBib29sZWFufSkucHJpc3RpbmUgPSB0cnVlO1xuICAgIHRoaXMuX3BlbmRpbmdEaXJ0eSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fZm9yRWFjaENoaWxkKChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpID0+IHtcbiAgICAgIGNvbnRyb2wubWFya0FzUHJpc3RpbmUoe29ubHlTZWxmOiB0cnVlfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5fcGFyZW50ICYmICFvcHRzLm9ubHlTZWxmKSB7XG4gICAgICB0aGlzLl9wYXJlbnQuX3VwZGF0ZVByaXN0aW5lKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGUgY29udHJvbCBhcyBgcGVuZGluZ2AuXG4gICAqXG4gICAqIEEgY29udHJvbCBpcyBwZW5kaW5nIHdoaWxlIHRoZSBjb250cm9sIHBlcmZvcm1zIGFzeW5jIHZhbGlkYXRpb24uXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIEFic3RyYWN0Q29udHJvbC5zdGF0dXN9XG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIENvbmZpZ3VyYXRpb24gb3B0aW9ucyB0aGF0IGRldGVybWluZSBob3cgdGhlIGNvbnRyb2wgcHJvcGFnYXRlcyBjaGFuZ2VzIGFuZFxuICAgKiBlbWl0cyBldmVudHMgYWZ0ZXIgbWFya2luZyBpcyBhcHBsaWVkLlxuICAgKiAqIGBvbmx5U2VsZmA6IFdoZW4gdHJ1ZSwgbWFyayBvbmx5IHRoaXMgY29udHJvbC4gV2hlbiBmYWxzZSBvciBub3Qgc3VwcGxpZWQsXG4gICAqIG1hcmtzIGFsbCBkaXJlY3QgYW5jZXN0b3JzLiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKiAqIGBlbWl0RXZlbnRgOiBXaGVuIHRydWUgb3Igbm90IHN1cHBsaWVkICh0aGUgZGVmYXVsdCksIHRoZSBgc3RhdHVzQ2hhbmdlc2BcbiAgICogb2JzZXJ2YWJsZSBlbWl0cyBhbiBldmVudCB3aXRoIHRoZSBsYXRlc3Qgc3RhdHVzIHRoZSBjb250cm9sIGlzIG1hcmtlZCBwZW5kaW5nLlxuICAgKiBXaGVuIGZhbHNlLCBubyBldmVudHMgYXJlIGVtaXR0ZWQuXG4gICAqXG4gICAqL1xuICBtYXJrQXNQZW5kaW5nKG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW4sIGVtaXRFdmVudD86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAodGhpcyBhcyB7c3RhdHVzOiBGb3JtQ29udHJvbFN0YXR1c30pLnN0YXR1cyA9IFBFTkRJTkc7XG5cbiAgICBpZiAob3B0cy5lbWl0RXZlbnQgIT09IGZhbHNlKSB7XG4gICAgICAodGhpcy5zdGF0dXNDaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxGb3JtQ29udHJvbFN0YXR1cz4pLmVtaXQodGhpcy5zdGF0dXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYXJlbnQgJiYgIW9wdHMub25seVNlbGYpIHtcbiAgICAgIHRoaXMuX3BhcmVudC5tYXJrQXNQZW5kaW5nKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlcyB0aGUgY29udHJvbC4gVGhpcyBtZWFucyB0aGUgY29udHJvbCBpcyBleGVtcHQgZnJvbSB2YWxpZGF0aW9uIGNoZWNrcyBhbmRcbiAgICogZXhjbHVkZWQgZnJvbSB0aGUgYWdncmVnYXRlIHZhbHVlIG9mIGFueSBwYXJlbnQuIEl0cyBzdGF0dXMgaXMgYERJU0FCTEVEYC5cbiAgICpcbiAgICogSWYgdGhlIGNvbnRyb2wgaGFzIGNoaWxkcmVuLCBhbGwgY2hpbGRyZW4gYXJlIGFsc28gZGlzYWJsZWQuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIEFic3RyYWN0Q29udHJvbC5zdGF0dXN9XG4gICAqXG4gICAqIEBwYXJhbSBvcHRzIENvbmZpZ3VyYXRpb24gb3B0aW9ucyB0aGF0IGRldGVybWluZSBob3cgdGhlIGNvbnRyb2wgcHJvcGFnYXRlc1xuICAgKiBjaGFuZ2VzIGFuZCBlbWl0cyBldmVudHMgYWZ0ZXIgdGhlIGNvbnRyb2wgaXMgZGlzYWJsZWQuXG4gICAqICogYG9ubHlTZWxmYDogV2hlbiB0cnVlLCBtYXJrIG9ubHkgdGhpcyBjb250cm9sLiBXaGVuIGZhbHNlIG9yIG5vdCBzdXBwbGllZCxcbiAgICogbWFya3MgYWxsIGRpcmVjdCBhbmNlc3RvcnMuIERlZmF1bHQgaXMgZmFsc2UuXG4gICAqICogYGVtaXRFdmVudGA6IFdoZW4gdHJ1ZSBvciBub3Qgc3VwcGxpZWQgKHRoZSBkZWZhdWx0KSwgYm90aCB0aGUgYHN0YXR1c0NoYW5nZXNgIGFuZFxuICAgKiBgdmFsdWVDaGFuZ2VzYFxuICAgKiBvYnNlcnZhYmxlcyBlbWl0IGV2ZW50cyB3aXRoIHRoZSBsYXRlc3Qgc3RhdHVzIGFuZCB2YWx1ZSB3aGVuIHRoZSBjb250cm9sIGlzIGRpc2FibGVkLlxuICAgKiBXaGVuIGZhbHNlLCBubyBldmVudHMgYXJlIGVtaXR0ZWQuXG4gICAqL1xuICBkaXNhYmxlKG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW4sIGVtaXRFdmVudD86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAvLyBJZiBwYXJlbnQgaGFzIGJlZW4gbWFya2VkIGFydGlmaWNpYWxseSBkaXJ0eSB3ZSBkb24ndCB3YW50IHRvIHJlLWNhbGN1bGF0ZSB0aGVcbiAgICAvLyBwYXJlbnQncyBkaXJ0aW5lc3MgYmFzZWQgb24gdGhlIGNoaWxkcmVuLlxuICAgIGNvbnN0IHNraXBQcmlzdGluZUNoZWNrID0gdGhpcy5fcGFyZW50TWFya2VkRGlydHkob3B0cy5vbmx5U2VsZik7XG5cbiAgICAodGhpcyBhcyB7c3RhdHVzOiBGb3JtQ29udHJvbFN0YXR1c30pLnN0YXR1cyA9IERJU0FCTEVEO1xuICAgICh0aGlzIGFzIHtlcnJvcnM6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsfSkuZXJyb3JzID0gbnVsbDtcbiAgICB0aGlzLl9mb3JFYWNoQ2hpbGQoKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4ge1xuICAgICAgY29udHJvbC5kaXNhYmxlKHsuLi5vcHRzLCBvbmx5U2VsZjogdHJ1ZX0pO1xuICAgIH0pO1xuICAgIHRoaXMuX3VwZGF0ZVZhbHVlKCk7XG5cbiAgICBpZiAob3B0cy5lbWl0RXZlbnQgIT09IGZhbHNlKSB7XG4gICAgICAodGhpcy52YWx1ZUNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPFRWYWx1ZT4pLmVtaXQodGhpcy52YWx1ZSk7XG4gICAgICAodGhpcy5zdGF0dXNDaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxGb3JtQ29udHJvbFN0YXR1cz4pLmVtaXQodGhpcy5zdGF0dXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUFuY2VzdG9ycyh7Li4ub3B0cywgc2tpcFByaXN0aW5lQ2hlY2t9KTtcbiAgICB0aGlzLl9vbkRpc2FibGVkQ2hhbmdlLmZvckVhY2goKGNoYW5nZUZuKSA9PiBjaGFuZ2VGbih0cnVlKSk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgY29udHJvbC4gVGhpcyBtZWFucyB0aGUgY29udHJvbCBpcyBpbmNsdWRlZCBpbiB2YWxpZGF0aW9uIGNoZWNrcyBhbmRcbiAgICogdGhlIGFnZ3JlZ2F0ZSB2YWx1ZSBvZiBpdHMgcGFyZW50LiBJdHMgc3RhdHVzIHJlY2FsY3VsYXRlcyBiYXNlZCBvbiBpdHMgdmFsdWUgYW5kXG4gICAqIGl0cyB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBpZiB0aGUgY29udHJvbCBoYXMgY2hpbGRyZW4sIGFsbCBjaGlsZHJlbiBhcmUgZW5hYmxlZC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgQWJzdHJhY3RDb250cm9sLnN0YXR1c31cbiAgICpcbiAgICogQHBhcmFtIG9wdHMgQ29uZmlndXJlIG9wdGlvbnMgdGhhdCBjb250cm9sIGhvdyB0aGUgY29udHJvbCBwcm9wYWdhdGVzIGNoYW5nZXMgYW5kXG4gICAqIGVtaXRzIGV2ZW50cyB3aGVuIG1hcmtlZCBhcyB1bnRvdWNoZWRcbiAgICogKiBgb25seVNlbGZgOiBXaGVuIHRydWUsIG1hcmsgb25seSB0aGlzIGNvbnRyb2wuIFdoZW4gZmFsc2Ugb3Igbm90IHN1cHBsaWVkLFxuICAgKiBtYXJrcyBhbGwgZGlyZWN0IGFuY2VzdG9ycy4gRGVmYXVsdCBpcyBmYWxzZS5cbiAgICogKiBgZW1pdEV2ZW50YDogV2hlbiB0cnVlIG9yIG5vdCBzdXBwbGllZCAodGhlIGRlZmF1bHQpLCBib3RoIHRoZSBgc3RhdHVzQ2hhbmdlc2AgYW5kXG4gICAqIGB2YWx1ZUNoYW5nZXNgXG4gICAqIG9ic2VydmFibGVzIGVtaXQgZXZlbnRzIHdpdGggdGhlIGxhdGVzdCBzdGF0dXMgYW5kIHZhbHVlIHdoZW4gdGhlIGNvbnRyb2wgaXMgZW5hYmxlZC5cbiAgICogV2hlbiBmYWxzZSwgbm8gZXZlbnRzIGFyZSBlbWl0dGVkLlxuICAgKi9cbiAgZW5hYmxlKG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW4sIGVtaXRFdmVudD86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAvLyBJZiBwYXJlbnQgaGFzIGJlZW4gbWFya2VkIGFydGlmaWNpYWxseSBkaXJ0eSB3ZSBkb24ndCB3YW50IHRvIHJlLWNhbGN1bGF0ZSB0aGVcbiAgICAvLyBwYXJlbnQncyBkaXJ0aW5lc3MgYmFzZWQgb24gdGhlIGNoaWxkcmVuLlxuICAgIGNvbnN0IHNraXBQcmlzdGluZUNoZWNrID0gdGhpcy5fcGFyZW50TWFya2VkRGlydHkob3B0cy5vbmx5U2VsZik7XG5cbiAgICAodGhpcyBhcyB7c3RhdHVzOiBGb3JtQ29udHJvbFN0YXR1c30pLnN0YXR1cyA9IFZBTElEO1xuICAgIHRoaXMuX2ZvckVhY2hDaGlsZCgoY29udHJvbDogQWJzdHJhY3RDb250cm9sKSA9PiB7XG4gICAgICBjb250cm9sLmVuYWJsZSh7Li4ub3B0cywgb25seVNlbGY6IHRydWV9KTtcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoe29ubHlTZWxmOiB0cnVlLCBlbWl0RXZlbnQ6IG9wdHMuZW1pdEV2ZW50fSk7XG5cbiAgICB0aGlzLl91cGRhdGVBbmNlc3RvcnMoey4uLm9wdHMsIHNraXBQcmlzdGluZUNoZWNrfSk7XG4gICAgdGhpcy5fb25EaXNhYmxlZENoYW5nZS5mb3JFYWNoKChjaGFuZ2VGbikgPT4gY2hhbmdlRm4oZmFsc2UpKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZUFuY2VzdG9ycyhcbiAgICAgIG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW4sIGVtaXRFdmVudD86IGJvb2xlYW4sIHNraXBQcmlzdGluZUNoZWNrPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFyZW50ICYmICFvcHRzLm9ubHlTZWxmKSB7XG4gICAgICB0aGlzLl9wYXJlbnQudXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRzKTtcbiAgICAgIGlmICghb3B0cy5za2lwUHJpc3RpbmVDaGVjaykge1xuICAgICAgICB0aGlzLl9wYXJlbnQuX3VwZGF0ZVByaXN0aW5lKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9wYXJlbnQuX3VwZGF0ZVRvdWNoZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcGFyZW50IG9mIHRoZSBjb250cm9sXG4gICAqXG4gICAqIEBwYXJhbSBwYXJlbnQgVGhlIG5ldyBwYXJlbnQuXG4gICAqL1xuICBzZXRQYXJlbnQocGFyZW50OiBGb3JtR3JvdXB8Rm9ybUFycmF5fG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIGNvbnRyb2wuIEFic3RyYWN0IG1ldGhvZCAoaW1wbGVtZW50ZWQgaW4gc3ViLWNsYXNzZXMpLlxuICAgKi9cbiAgYWJzdHJhY3Qgc2V0VmFsdWUodmFsdWU6IFRSYXdWYWx1ZSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFBhdGNoZXMgdGhlIHZhbHVlIG9mIHRoZSBjb250cm9sLiBBYnN0cmFjdCBtZXRob2QgKGltcGxlbWVudGVkIGluIHN1Yi1jbGFzc2VzKS5cbiAgICovXG4gIGFic3RyYWN0IHBhdGNoVmFsdWUodmFsdWU6IFRWYWx1ZSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgY29udHJvbC4gQWJzdHJhY3QgbWV0aG9kIChpbXBsZW1lbnRlZCBpbiBzdWItY2xhc3NlcykuXG4gICAqL1xuICBhYnN0cmFjdCByZXNldCh2YWx1ZT86IFRWYWx1ZSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFRoZSByYXcgdmFsdWUgb2YgdGhpcyBjb250cm9sLiBGb3IgbW9zdCBjb250cm9sIGltcGxlbWVudGF0aW9ucywgdGhlIHJhdyB2YWx1ZSB3aWxsIGluY2x1ZGVcbiAgICogZGlzYWJsZWQgY2hpbGRyZW4uXG4gICAqL1xuICBnZXRSYXdWYWx1ZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY2FsY3VsYXRlcyB0aGUgdmFsdWUgYW5kIHZhbGlkYXRpb24gc3RhdHVzIG9mIHRoZSBjb250cm9sLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBpdCBhbHNvIHVwZGF0ZXMgdGhlIHZhbHVlIGFuZCB2YWxpZGl0eSBvZiBpdHMgYW5jZXN0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBDb25maWd1cmF0aW9uIG9wdGlvbnMgZGV0ZXJtaW5lIGhvdyB0aGUgY29udHJvbCBwcm9wYWdhdGVzIGNoYW5nZXMgYW5kIGVtaXRzIGV2ZW50c1xuICAgKiBhZnRlciB1cGRhdGVzIGFuZCB2YWxpZGl0eSBjaGVja3MgYXJlIGFwcGxpZWQuXG4gICAqICogYG9ubHlTZWxmYDogV2hlbiB0cnVlLCBvbmx5IHVwZGF0ZSB0aGlzIGNvbnRyb2wuIFdoZW4gZmFsc2Ugb3Igbm90IHN1cHBsaWVkLFxuICAgKiB1cGRhdGUgYWxsIGRpcmVjdCBhbmNlc3RvcnMuIERlZmF1bHQgaXMgZmFsc2UuXG4gICAqICogYGVtaXRFdmVudGA6IFdoZW4gdHJ1ZSBvciBub3Qgc3VwcGxpZWQgKHRoZSBkZWZhdWx0KSwgYm90aCB0aGUgYHN0YXR1c0NoYW5nZXNgIGFuZFxuICAgKiBgdmFsdWVDaGFuZ2VzYFxuICAgKiBvYnNlcnZhYmxlcyBlbWl0IGV2ZW50cyB3aXRoIHRoZSBsYXRlc3Qgc3RhdHVzIGFuZCB2YWx1ZSB3aGVuIHRoZSBjb250cm9sIGlzIHVwZGF0ZWQuXG4gICAqIFdoZW4gZmFsc2UsIG5vIGV2ZW50cyBhcmUgZW1pdHRlZC5cbiAgICovXG4gIHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0czoge29ubHlTZWxmPzogYm9vbGVhbiwgZW1pdEV2ZW50PzogYm9vbGVhbn0gPSB7fSk6IHZvaWQge1xuICAgIHRoaXMuX3NldEluaXRpYWxTdGF0dXMoKTtcbiAgICB0aGlzLl91cGRhdGVWYWx1ZSgpO1xuXG4gICAgaWYgKHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5fY2FuY2VsRXhpc3RpbmdTdWJzY3JpcHRpb24oKTtcbiAgICAgICh0aGlzIGFzIHtlcnJvcnM6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsfSkuZXJyb3JzID0gdGhpcy5fcnVuVmFsaWRhdG9yKCk7XG4gICAgICAodGhpcyBhcyB7c3RhdHVzOiBGb3JtQ29udHJvbFN0YXR1c30pLnN0YXR1cyA9IHRoaXMuX2NhbGN1bGF0ZVN0YXR1cygpO1xuXG4gICAgICBpZiAodGhpcy5zdGF0dXMgPT09IFZBTElEIHx8IHRoaXMuc3RhdHVzID09PSBQRU5ESU5HKSB7XG4gICAgICAgIHRoaXMuX3J1bkFzeW5jVmFsaWRhdG9yKG9wdHMuZW1pdEV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0cy5lbWl0RXZlbnQgIT09IGZhbHNlKSB7XG4gICAgICAodGhpcy52YWx1ZUNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPFRWYWx1ZT4pLmVtaXQodGhpcy52YWx1ZSk7XG4gICAgICAodGhpcy5zdGF0dXNDaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxGb3JtQ29udHJvbFN0YXR1cz4pLmVtaXQodGhpcy5zdGF0dXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYXJlbnQgJiYgIW9wdHMub25seVNlbGYpIHtcbiAgICAgIHRoaXMuX3BhcmVudC51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VwZGF0ZVRyZWVWYWxpZGl0eShvcHRzOiB7ZW1pdEV2ZW50PzogYm9vbGVhbn0gPSB7ZW1pdEV2ZW50OiB0cnVlfSk6IHZvaWQge1xuICAgIHRoaXMuX2ZvckVhY2hDaGlsZCgoY3RybDogQWJzdHJhY3RDb250cm9sKSA9PiBjdHJsLl91cGRhdGVUcmVlVmFsaWRpdHkob3B0cykpO1xuICAgIHRoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eSh7b25seVNlbGY6IHRydWUsIGVtaXRFdmVudDogb3B0cy5lbWl0RXZlbnR9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3NldEluaXRpYWxTdGF0dXMoKSB7XG4gICAgKHRoaXMgYXMge3N0YXR1czogRm9ybUNvbnRyb2xTdGF0dXN9KS5zdGF0dXMgPSB0aGlzLl9hbGxDb250cm9sc0Rpc2FibGVkKCkgPyBESVNBQkxFRCA6IFZBTElEO1xuICB9XG5cbiAgcHJpdmF0ZSBfcnVuVmFsaWRhdG9yKCk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yID8gdGhpcy52YWxpZGF0b3IodGhpcykgOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfcnVuQXN5bmNWYWxpZGF0b3IoZW1pdEV2ZW50PzogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmFzeW5jVmFsaWRhdG9yKSB7XG4gICAgICAodGhpcyBhcyB7c3RhdHVzOiBGb3JtQ29udHJvbFN0YXR1c30pLnN0YXR1cyA9IFBFTkRJTkc7XG4gICAgICB0aGlzLl9oYXNPd25QZW5kaW5nQXN5bmNWYWxpZGF0b3IgPSB0cnVlO1xuICAgICAgY29uc3Qgb2JzID0gdG9PYnNlcnZhYmxlKHRoaXMuYXN5bmNWYWxpZGF0b3IodGhpcykpO1xuICAgICAgdGhpcy5fYXN5bmNWYWxpZGF0aW9uU3Vic2NyaXB0aW9uID0gb2JzLnN1YnNjcmliZSgoZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5faGFzT3duUGVuZGluZ0FzeW5jVmFsaWRhdG9yID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgd2lsbCB0cmlnZ2VyIHRoZSByZWNhbGN1bGF0aW9uIG9mIHRoZSB2YWxpZGF0aW9uIHN0YXR1cywgd2hpY2ggZGVwZW5kcyBvblxuICAgICAgICAvLyB0aGUgc3RhdGUgb2YgdGhlIGFzeW5jaHJvbm91cyB2YWxpZGF0aW9uICh3aGV0aGVyIGl0IGlzIGluIHByb2dyZXNzIG9yIG5vdCkuIFNvLCBpdCBpc1xuICAgICAgICAvLyBuZWNlc3NhcnkgdGhhdCB3ZSBoYXZlIHVwZGF0ZWQgdGhlIGBfaGFzT3duUGVuZGluZ0FzeW5jVmFsaWRhdG9yYCBib29sZWFuIGZsYWcgZmlyc3QuXG4gICAgICAgIHRoaXMuc2V0RXJyb3JzKGVycm9ycywge2VtaXRFdmVudH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2FuY2VsRXhpc3RpbmdTdWJzY3JpcHRpb24oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2FzeW5jVmFsaWRhdGlvblN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fYXN5bmNWYWxpZGF0aW9uU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9oYXNPd25QZW5kaW5nQXN5bmNWYWxpZGF0b3IgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBlcnJvcnMgb24gYSBmb3JtIGNvbnRyb2wgd2hlbiBydW5uaW5nIHZhbGlkYXRpb25zIG1hbnVhbGx5LCByYXRoZXIgdGhhbiBhdXRvbWF0aWNhbGx5LlxuICAgKlxuICAgKiBDYWxsaW5nIGBzZXRFcnJvcnNgIGFsc28gdXBkYXRlcyB0aGUgdmFsaWRpdHkgb2YgdGhlIHBhcmVudCBjb250cm9sLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0cyBDb25maWd1cmF0aW9uIG9wdGlvbnMgdGhhdCBkZXRlcm1pbmUgaG93IHRoZSBjb250cm9sIHByb3BhZ2F0ZXNcbiAgICogY2hhbmdlcyBhbmQgZW1pdHMgZXZlbnRzIGFmdGVyIHRoZSBjb250cm9sIGVycm9ycyBhcmUgc2V0LlxuICAgKiAqIGBlbWl0RXZlbnRgOiBXaGVuIHRydWUgb3Igbm90IHN1cHBsaWVkICh0aGUgZGVmYXVsdCksIHRoZSBgc3RhdHVzQ2hhbmdlc2BcbiAgICogb2JzZXJ2YWJsZSBlbWl0cyBhbiBldmVudCBhZnRlciB0aGUgZXJyb3JzIGFyZSBzZXQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqXG4gICAqICMjIyBNYW51YWxseSBzZXQgdGhlIGVycm9ycyBmb3IgYSBjb250cm9sXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBsb2dpbiA9IG5ldyBGb3JtQ29udHJvbCgnc29tZUxvZ2luJyk7XG4gICAqIGxvZ2luLnNldEVycm9ycyh7XG4gICAqICAgbm90VW5pcXVlOiB0cnVlXG4gICAqIH0pO1xuICAgKlxuICAgKiBleHBlY3QobG9naW4udmFsaWQpLnRvRXF1YWwoZmFsc2UpO1xuICAgKiBleHBlY3QobG9naW4uZXJyb3JzKS50b0VxdWFsKHsgbm90VW5pcXVlOiB0cnVlIH0pO1xuICAgKlxuICAgKiBsb2dpbi5zZXRWYWx1ZSgnc29tZU90aGVyTG9naW4nKTtcbiAgICpcbiAgICogZXhwZWN0KGxvZ2luLnZhbGlkKS50b0VxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICovXG4gIHNldEVycm9ycyhlcnJvcnM6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCwgb3B0czoge2VtaXRFdmVudD86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAodGhpcyBhcyB7ZXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbH0pLmVycm9ycyA9IGVycm9ycztcbiAgICB0aGlzLl91cGRhdGVDb250cm9sc0Vycm9ycyhvcHRzLmVtaXRFdmVudCAhPT0gZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGNoaWxkIGNvbnRyb2wgZ2l2ZW4gdGhlIGNvbnRyb2wncyBuYW1lIG9yIHBhdGguXG4gICAqXG4gICAqIFRoaXMgc2lnbmF0dXJlIGZvciBnZXQgc3VwcG9ydHMgc3RyaW5ncyBhbmQgYGNvbnN0YCBhcnJheXMgKGAuZ2V0KFsnZm9vJywgJ2JhciddIGFzIGNvbnN0KWApLlxuICAgKi9cbiAgZ2V0PFAgZXh0ZW5kcyBzdHJpbmd8KHJlYWRvbmx5KHN0cmluZ3xudW1iZXIpW10pPihwYXRoOiBQKTpcbiAgICAgIEFic3RyYWN0Q29udHJvbDzJtUdldFByb3BlcnR5PFRSYXdWYWx1ZSwgUD4+fG51bGw7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGNoaWxkIGNvbnRyb2wgZ2l2ZW4gdGhlIGNvbnRyb2wncyBuYW1lIG9yIHBhdGguXG4gICAqXG4gICAqIFRoaXMgc2lnbmF0dXJlIGZvciBgZ2V0YCBzdXBwb3J0cyBub24tY29uc3QgKG11dGFibGUpIGFycmF5cy4gSW5mZXJyZWQgdHlwZVxuICAgKiBpbmZvcm1hdGlvbiB3aWxsIG5vdCBiZSBhcyByb2J1c3QsIHNvIHByZWZlciB0byBwYXNzIGEgYHJlYWRvbmx5YCBhcnJheSBpZiBwb3NzaWJsZS5cbiAgICovXG4gIGdldDxQIGV4dGVuZHMgc3RyaW5nfEFycmF5PHN0cmluZ3xudW1iZXI+PihwYXRoOiBQKTpcbiAgICAgIEFic3RyYWN0Q29udHJvbDzJtUdldFByb3BlcnR5PFRSYXdWYWx1ZSwgUD4+fG51bGw7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGNoaWxkIGNvbnRyb2wgZ2l2ZW4gdGhlIGNvbnRyb2wncyBuYW1lIG9yIHBhdGguXG4gICAqXG4gICAqIEBwYXJhbSBwYXRoIEEgZG90LWRlbGltaXRlZCBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5nL251bWJlciB2YWx1ZXMgdGhhdCBkZWZpbmUgdGhlIHBhdGggdG8gdGhlXG4gICAqIGNvbnRyb2wuIElmIGEgc3RyaW5nIGlzIHByb3ZpZGVkLCBwYXNzaW5nIGl0IGFzIGEgc3RyaW5nIGxpdGVyYWwgd2lsbCByZXN1bHQgaW4gaW1wcm92ZWQgdHlwZVxuICAgKiBpbmZvcm1hdGlvbi4gTGlrZXdpc2UsIGlmIGFuIGFycmF5IGlzIHByb3ZpZGVkLCBwYXNzaW5nIGl0IGBhcyBjb25zdGAgd2lsbCBjYXVzZSBpbXByb3ZlZCB0eXBlXG4gICAqIGluZm9ybWF0aW9uIHRvIGJlIGF2YWlsYWJsZS5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFJldHJpZXZlIGEgbmVzdGVkIGNvbnRyb2xcbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIHRvIGdldCBhIGBuYW1lYCBjb250cm9sIG5lc3RlZCB3aXRoaW4gYSBgcGVyc29uYCBzdWItZ3JvdXA6XG4gICAqXG4gICAqICogYHRoaXMuZm9ybS5nZXQoJ3BlcnNvbi5uYW1lJyk7YFxuICAgKlxuICAgKiAtT1ItXG4gICAqXG4gICAqICogYHRoaXMuZm9ybS5nZXQoWydwZXJzb24nLCAnbmFtZSddIGFzIGNvbnN0KTtgIC8vIGBhcyBjb25zdGAgZ2l2ZXMgaW1wcm92ZWQgdHlwaW5nc1xuICAgKlxuICAgKiAjIyMgUmV0cmlldmUgYSBjb250cm9sIGluIGEgRm9ybUFycmF5XG4gICAqXG4gICAqIFdoZW4gYWNjZXNzaW5nIGFuIGVsZW1lbnQgaW5zaWRlIGEgRm9ybUFycmF5LCB5b3UgY2FuIHVzZSBhbiBlbGVtZW50IGluZGV4LlxuICAgKiBGb3IgZXhhbXBsZSwgdG8gZ2V0IGEgYHByaWNlYCBjb250cm9sIGZyb20gdGhlIGZpcnN0IGVsZW1lbnQgaW4gYW4gYGl0ZW1zYCBhcnJheSB5b3UgY2FuIHVzZTpcbiAgICpcbiAgICogKiBgdGhpcy5mb3JtLmdldCgnaXRlbXMuMC5wcmljZScpO2BcbiAgICpcbiAgICogLU9SLVxuICAgKlxuICAgKiAqIGB0aGlzLmZvcm0uZ2V0KFsnaXRlbXMnLCAwLCAncHJpY2UnXSk7YFxuICAgKi9cbiAgZ2V0PFAgZXh0ZW5kcyBzdHJpbmd8KChzdHJpbmcgfCBudW1iZXIpW10pPihwYXRoOiBQKTpcbiAgICAgIEFic3RyYWN0Q29udHJvbDzJtUdldFByb3BlcnR5PFRSYXdWYWx1ZSwgUD4+fG51bGwge1xuICAgIGxldCBjdXJyUGF0aDogQXJyYXk8c3RyaW5nfG51bWJlcj58c3RyaW5nID0gcGF0aDtcbiAgICBpZiAoY3VyclBhdGggPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGN1cnJQYXRoKSkgY3VyclBhdGggPSBjdXJyUGF0aC5zcGxpdCgnLicpO1xuICAgIGlmIChjdXJyUGF0aC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBjdXJyUGF0aC5yZWR1Y2UoXG4gICAgICAgIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2x8bnVsbCwgbmFtZSkgPT4gY29udHJvbCAmJiBjb250cm9sLl9maW5kKG5hbWUpLCB0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogUmVwb3J0cyBlcnJvciBkYXRhIGZvciB0aGUgY29udHJvbCB3aXRoIHRoZSBnaXZlbiBwYXRoLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyb3JDb2RlIFRoZSBjb2RlIG9mIHRoZSBlcnJvciB0byBjaGVja1xuICAgKiBAcGFyYW0gcGF0aCBBIGxpc3Qgb2YgY29udHJvbCBuYW1lcyB0aGF0IGRlc2lnbmF0ZXMgaG93IHRvIG1vdmUgZnJvbSB0aGUgY3VycmVudCBjb250cm9sXG4gICAqIHRvIHRoZSBjb250cm9sIHRoYXQgc2hvdWxkIGJlIHF1ZXJpZWQgZm9yIGVycm9ycy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogRm9yIGV4YW1wbGUsIGZvciB0aGUgZm9sbG93aW5nIGBGb3JtR3JvdXBgOlxuICAgKlxuICAgKiBgYGBcbiAgICogZm9ybSA9IG5ldyBGb3JtR3JvdXAoe1xuICAgKiAgIGFkZHJlc3M6IG5ldyBGb3JtR3JvdXAoeyBzdHJlZXQ6IG5ldyBGb3JtQ29udHJvbCgpIH0pXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogVGhlIHBhdGggdG8gdGhlICdzdHJlZXQnIGNvbnRyb2wgZnJvbSB0aGUgcm9vdCBmb3JtIHdvdWxkIGJlICdhZGRyZXNzJyAtPiAnc3RyZWV0Jy5cbiAgICpcbiAgICogSXQgY2FuIGJlIHByb3ZpZGVkIHRvIHRoaXMgbWV0aG9kIGluIG9uZSBvZiB0d28gZm9ybWF0czpcbiAgICpcbiAgICogMS4gQW4gYXJyYXkgb2Ygc3RyaW5nIGNvbnRyb2wgbmFtZXMsIGUuZy4gYFsnYWRkcmVzcycsICdzdHJlZXQnXWBcbiAgICogMS4gQSBwZXJpb2QtZGVsaW1pdGVkIGxpc3Qgb2YgY29udHJvbCBuYW1lcyBpbiBvbmUgc3RyaW5nLCBlLmcuIGAnYWRkcmVzcy5zdHJlZXQnYFxuICAgKlxuICAgKiBAcmV0dXJucyBlcnJvciBkYXRhIGZvciB0aGF0IHBhcnRpY3VsYXIgZXJyb3IuIElmIHRoZSBjb250cm9sIG9yIGVycm9yIGlzIG5vdCBwcmVzZW50LFxuICAgKiBudWxsIGlzIHJldHVybmVkLlxuICAgKi9cbiAgZ2V0RXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiBBcnJheTxzdHJpbmd8bnVtYmVyPnxzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IGNvbnRyb2wgPSBwYXRoID8gdGhpcy5nZXQocGF0aCkgOiB0aGlzO1xuICAgIHJldHVybiBjb250cm9sICYmIGNvbnRyb2wuZXJyb3JzID8gY29udHJvbC5lcnJvcnNbZXJyb3JDb2RlXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJlcG9ydHMgd2hldGhlciB0aGUgY29udHJvbCB3aXRoIHRoZSBnaXZlbiBwYXRoIGhhcyB0aGUgZXJyb3Igc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXJyb3JDb2RlIFRoZSBjb2RlIG9mIHRoZSBlcnJvciB0byBjaGVja1xuICAgKiBAcGFyYW0gcGF0aCBBIGxpc3Qgb2YgY29udHJvbCBuYW1lcyB0aGF0IGRlc2lnbmF0ZXMgaG93IHRvIG1vdmUgZnJvbSB0aGUgY3VycmVudCBjb250cm9sXG4gICAqIHRvIHRoZSBjb250cm9sIHRoYXQgc2hvdWxkIGJlIHF1ZXJpZWQgZm9yIGVycm9ycy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogRm9yIGV4YW1wbGUsIGZvciB0aGUgZm9sbG93aW5nIGBGb3JtR3JvdXBgOlxuICAgKlxuICAgKiBgYGBcbiAgICogZm9ybSA9IG5ldyBGb3JtR3JvdXAoe1xuICAgKiAgIGFkZHJlc3M6IG5ldyBGb3JtR3JvdXAoeyBzdHJlZXQ6IG5ldyBGb3JtQ29udHJvbCgpIH0pXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogVGhlIHBhdGggdG8gdGhlICdzdHJlZXQnIGNvbnRyb2wgZnJvbSB0aGUgcm9vdCBmb3JtIHdvdWxkIGJlICdhZGRyZXNzJyAtPiAnc3RyZWV0Jy5cbiAgICpcbiAgICogSXQgY2FuIGJlIHByb3ZpZGVkIHRvIHRoaXMgbWV0aG9kIGluIG9uZSBvZiB0d28gZm9ybWF0czpcbiAgICpcbiAgICogMS4gQW4gYXJyYXkgb2Ygc3RyaW5nIGNvbnRyb2wgbmFtZXMsIGUuZy4gYFsnYWRkcmVzcycsICdzdHJlZXQnXWBcbiAgICogMS4gQSBwZXJpb2QtZGVsaW1pdGVkIGxpc3Qgb2YgY29udHJvbCBuYW1lcyBpbiBvbmUgc3RyaW5nLCBlLmcuIGAnYWRkcmVzcy5zdHJlZXQnYFxuICAgKlxuICAgKiBJZiBubyBwYXRoIGlzIGdpdmVuLCB0aGlzIG1ldGhvZCBjaGVja3MgZm9yIHRoZSBlcnJvciBvbiB0aGUgY3VycmVudCBjb250cm9sLlxuICAgKlxuICAgKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBlcnJvciBpcyBwcmVzZW50IGluIHRoZSBjb250cm9sIGF0IHRoZSBnaXZlbiBwYXRoLlxuICAgKlxuICAgKiBJZiB0aGUgY29udHJvbCBpcyBub3QgcHJlc2VudCwgZmFsc2UgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBoYXNFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aD86IEFycmF5PHN0cmluZ3xudW1iZXI+fHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZ2V0RXJyb3IoZXJyb3JDb2RlLCBwYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHRvcC1sZXZlbCBhbmNlc3RvciBvZiB0aGlzIGNvbnRyb2wuXG4gICAqL1xuICBnZXQgcm9vdCgpOiBBYnN0cmFjdENvbnRyb2wge1xuICAgIGxldCB4OiBBYnN0cmFjdENvbnRyb2wgPSB0aGlzO1xuXG4gICAgd2hpbGUgKHguX3BhcmVudCkge1xuICAgICAgeCA9IHguX3BhcmVudDtcbiAgICB9XG5cbiAgICByZXR1cm4geDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VwZGF0ZUNvbnRyb2xzRXJyb3JzKGVtaXRFdmVudDogYm9vbGVhbik6IHZvaWQge1xuICAgICh0aGlzIGFzIHtzdGF0dXM6IEZvcm1Db250cm9sU3RhdHVzfSkuc3RhdHVzID0gdGhpcy5fY2FsY3VsYXRlU3RhdHVzKCk7XG5cbiAgICBpZiAoZW1pdEV2ZW50KSB7XG4gICAgICAodGhpcy5zdGF0dXNDaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxGb3JtQ29udHJvbFN0YXR1cz4pLmVtaXQodGhpcy5zdGF0dXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHRoaXMuX3BhcmVudC5fdXBkYXRlQ29udHJvbHNFcnJvcnMoZW1pdEV2ZW50KTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9pbml0T2JzZXJ2YWJsZXMoKSB7XG4gICAgKHRoaXMgYXMge3ZhbHVlQ2hhbmdlczogT2JzZXJ2YWJsZTxUVmFsdWU+fSkudmFsdWVDaGFuZ2VzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICh0aGlzIGFzIHtzdGF0dXNDaGFuZ2VzOiBPYnNlcnZhYmxlPEZvcm1Db250cm9sU3RhdHVzPn0pLnN0YXR1c0NoYW5nZXMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVN0YXR1cygpOiBGb3JtQ29udHJvbFN0YXR1cyB7XG4gICAgaWYgKHRoaXMuX2FsbENvbnRyb2xzRGlzYWJsZWQoKSkgcmV0dXJuIERJU0FCTEVEO1xuICAgIGlmICh0aGlzLmVycm9ycykgcmV0dXJuIElOVkFMSUQ7XG4gICAgaWYgKHRoaXMuX2hhc093blBlbmRpbmdBc3luY1ZhbGlkYXRvciB8fCB0aGlzLl9hbnlDb250cm9sc0hhdmVTdGF0dXMoUEVORElORykpIHJldHVybiBQRU5ESU5HO1xuICAgIGlmICh0aGlzLl9hbnlDb250cm9sc0hhdmVTdGF0dXMoSU5WQUxJRCkpIHJldHVybiBJTlZBTElEO1xuICAgIHJldHVybiBWQUxJRDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgYWJzdHJhY3QgX3VwZGF0ZVZhbHVlKCk6IHZvaWQ7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBhYnN0cmFjdCBfZm9yRWFjaENoaWxkKGNiOiAoYzogQWJzdHJhY3RDb250cm9sKSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogQGludGVybmFsICovXG4gIGFic3RyYWN0IF9hbnlDb250cm9scyhjb25kaXRpb246IChjOiBBYnN0cmFjdENvbnRyb2wpID0+IGJvb2xlYW4pOiBib29sZWFuO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgYWJzdHJhY3QgX2FsbENvbnRyb2xzRGlzYWJsZWQoKTogYm9vbGVhbjtcblxuICAvKiogQGludGVybmFsICovXG4gIGFic3RyYWN0IF9zeW5jUGVuZGluZ0NvbnRyb2xzKCk6IGJvb2xlYW47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYW55Q29udHJvbHNIYXZlU3RhdHVzKHN0YXR1czogRm9ybUNvbnRyb2xTdGF0dXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYW55Q29udHJvbHMoKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4gY29udHJvbC5zdGF0dXMgPT09IHN0YXR1cyk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hbnlDb250cm9sc0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hbnlDb250cm9scygoY29udHJvbDogQWJzdHJhY3RDb250cm9sKSA9PiBjb250cm9sLmRpcnR5KTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FueUNvbnRyb2xzVG91Y2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYW55Q29udHJvbHMoKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCkgPT4gY29udHJvbC50b3VjaGVkKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VwZGF0ZVByaXN0aW5lKG9wdHM6IHtvbmx5U2VsZj86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICAodGhpcyBhcyB7cHJpc3RpbmU6IGJvb2xlYW59KS5wcmlzdGluZSA9ICF0aGlzLl9hbnlDb250cm9sc0RpcnR5KCk7XG5cbiAgICBpZiAodGhpcy5fcGFyZW50ICYmICFvcHRzLm9ubHlTZWxmKSB7XG4gICAgICB0aGlzLl9wYXJlbnQuX3VwZGF0ZVByaXN0aW5lKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VwZGF0ZVRvdWNoZWQob3B0czoge29ubHlTZWxmPzogYm9vbGVhbn0gPSB7fSk6IHZvaWQge1xuICAgICh0aGlzIGFzIHt0b3VjaGVkOiBib29sZWFufSkudG91Y2hlZCA9IHRoaXMuX2FueUNvbnRyb2xzVG91Y2hlZCgpO1xuXG4gICAgaWYgKHRoaXMuX3BhcmVudCAmJiAhb3B0cy5vbmx5U2VsZikge1xuICAgICAgdGhpcy5fcGFyZW50Ll91cGRhdGVUb3VjaGVkKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX29uRGlzYWJsZWRDaGFuZ2U6IEFycmF5PChpc0Rpc2FibGVkOiBib29sZWFuKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3JlZ2lzdGVyT25Db2xsZWN0aW9uQ2hhbmdlKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fb25Db2xsZWN0aW9uQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9zZXRVcGRhdGVTdHJhdGVneShvcHRzPzogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxBYnN0cmFjdENvbnRyb2xPcHRpb25zfG51bGwpOiB2b2lkIHtcbiAgICBpZiAoaXNPcHRpb25zT2JqKG9wdHMpICYmIG9wdHMudXBkYXRlT24gIT0gbnVsbCkge1xuICAgICAgdGhpcy5fdXBkYXRlT24gPSBvcHRzLnVwZGF0ZU9uITtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrIHRvIHNlZSBpZiBwYXJlbnQgaGFzIGJlZW4gbWFya2VkIGFydGlmaWNpYWxseSBkaXJ0eS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9wYXJlbnRNYXJrZWREaXJ0eShvbmx5U2VsZj86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBjb25zdCBwYXJlbnREaXJ0eSA9IHRoaXMuX3BhcmVudCAmJiB0aGlzLl9wYXJlbnQuZGlydHk7XG4gICAgcmV0dXJuICFvbmx5U2VsZiAmJiAhIXBhcmVudERpcnR5ICYmICF0aGlzLl9wYXJlbnQhLl9hbnlDb250cm9sc0RpcnR5KCk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9maW5kKG5hbWU6IHN0cmluZ3xudW1iZXIpOiBBYnN0cmFjdENvbnRyb2x8bnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBzZXRWYWxpZGF0b3JzYCBtZXRob2QuIE5lZWRzIHRvIGJlIHNlcGFyYXRlZCBvdXQgaW50byBhXG4gICAqIGRpZmZlcmVudCBtZXRob2QsIGJlY2F1c2UgaXQgaXMgY2FsbGVkIGluIHRoZSBjb25zdHJ1Y3RvciBhbmQgaXQgY2FuIGJyZWFrIGNhc2VzIHdoZXJlXG4gICAqIGEgY29udHJvbCBpcyBleHRlbmRlZC5cbiAgICovXG4gIHByaXZhdGUgX2Fzc2lnblZhbGlkYXRvcnModmFsaWRhdG9yczogVmFsaWRhdG9yRm58VmFsaWRhdG9yRm5bXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5fcmF3VmFsaWRhdG9ycyA9IEFycmF5LmlzQXJyYXkodmFsaWRhdG9ycykgPyB2YWxpZGF0b3JzLnNsaWNlKCkgOiB2YWxpZGF0b3JzO1xuICAgIHRoaXMuX2NvbXBvc2VkVmFsaWRhdG9yRm4gPSBjb2VyY2VUb1ZhbGlkYXRvcih0aGlzLl9yYXdWYWxpZGF0b3JzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHNldEFzeW5jVmFsaWRhdG9yc2AgbWV0aG9kLiBOZWVkcyB0byBiZSBzZXBhcmF0ZWQgb3V0IGludG8gYVxuICAgKiBkaWZmZXJlbnQgbWV0aG9kLCBiZWNhdXNlIGl0IGlzIGNhbGxlZCBpbiB0aGUgY29uc3RydWN0b3IgYW5kIGl0IGNhbiBicmVhayBjYXNlcyB3aGVyZVxuICAgKiBhIGNvbnRyb2wgaXMgZXh0ZW5kZWQuXG4gICAqL1xuICBwcml2YXRlIF9hc3NpZ25Bc3luY1ZhbGlkYXRvcnModmFsaWRhdG9yczogQXN5bmNWYWxpZGF0b3JGbnxBc3luY1ZhbGlkYXRvckZuW118bnVsbCk6IHZvaWQge1xuICAgIHRoaXMuX3Jhd0FzeW5jVmFsaWRhdG9ycyA9IEFycmF5LmlzQXJyYXkodmFsaWRhdG9ycykgPyB2YWxpZGF0b3JzLnNsaWNlKCkgOiB2YWxpZGF0b3JzO1xuICAgIHRoaXMuX2NvbXBvc2VkQXN5bmNWYWxpZGF0b3JGbiA9IGNvZXJjZVRvQXN5bmNWYWxpZGF0b3IodGhpcy5fcmF3QXN5bmNWYWxpZGF0b3JzKTtcbiAgfVxufVxuIl19