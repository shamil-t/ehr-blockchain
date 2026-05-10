/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertLessThan } from '../util/assert';
import { ɵɵdefineInjectable } from './interface/defs';
/**
 * Creates a token that can be used in a DI Provider.
 *
 * Use an `InjectionToken` whenever the type you are injecting is not reified (does not have a
 * runtime representation) such as when injecting an interface, callable type, array or
 * parameterized type.
 *
 * `InjectionToken` is parameterized on `T` which is the type of object which will be returned by
 * the `Injector`. This provides an additional level of type safety.
 *
 * <div class="alert is-helpful">
 *
 * **Important Note**: Ensure that you use the same instance of the `InjectionToken` in both the
 * provider and the injection call. Creating a new instance of `InjectionToken` in different places,
 * even with the same description, will be treated as different tokens by Angular's DI system,
 * leading to a `NullInjectorError`.
 *
 * </div>
 *
 * <code-example format="typescript" language="typescript" path="injection-token/src/main.ts"
 * region="InjectionToken"></code-example>
 *
 * When creating an `InjectionToken`, you can optionally specify a factory function which returns
 * (possibly by creating) a default value of the parameterized type `T`. This sets up the
 * `InjectionToken` using this factory as a provider as if it was defined explicitly in the
 * application's root injector. If the factory function, which takes zero arguments, needs to inject
 * dependencies, it can do so using the [`inject`](api/core/inject) function.
 * As you can see in the Tree-shakable InjectionToken example below.
 *
 * Additionally, if a `factory` is specified you can also specify the `providedIn` option, which
 * overrides the above behavior and marks the token as belonging to a particular `@NgModule` (note:
 * this option is now deprecated). As mentioned above, `'root'` is the default value for
 * `providedIn`.
 *
 * The `providedIn: NgModule` and `providedIn: 'any'` options are deprecated.
 *
 * @usageNotes
 * ### Basic Examples
 *
 * ### Plain InjectionToken
 *
 * {@example core/di/ts/injector_spec.ts region='InjectionToken'}
 *
 * ### Tree-shakable InjectionToken
 *
 * {@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 * @publicApi
 */
export class InjectionToken {
    /**
     * @param _desc   Description for the token,
     *                used only for debugging purposes,
     *                it should but does not need to be unique
     * @param options Options for the token's usage, as described above
     */
    constructor(_desc, options) {
        this._desc = _desc;
        /** @internal */
        this.ngMetadataName = 'InjectionToken';
        this.ɵprov = undefined;
        if (typeof options == 'number') {
            (typeof ngDevMode === 'undefined' || ngDevMode) &&
                assertLessThan(options, 0, 'Only negative numbers are supported here');
            // This is a special hack to assign __NG_ELEMENT_ID__ to this instance.
            // See `InjectorMarkers`
            this.__NG_ELEMENT_ID__ = options;
        }
        else if (options !== undefined) {
            this.ɵprov = ɵɵdefineInjectable({
                token: this,
                providedIn: options.providedIn || 'root',
                factory: options.factory,
            });
        }
    }
    /**
     * @internal
     */
    get multi() {
        return this;
    }
    toString() {
        return `InjectionToken ${this._desc}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0aW9uX3Rva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGkvaW5qZWN0aW9uX3Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUVwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBZ0RHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUFNekI7Ozs7O09BS0c7SUFDSCxZQUFzQixLQUFhLEVBQUUsT0FFcEM7UUFGcUIsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQVhuQyxnQkFBZ0I7UUFDUCxtQkFBYyxHQUFHLGdCQUFnQixDQUFDO1FBYXpDLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBQ3ZCLElBQUksT0FBTyxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzlCLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQztnQkFDM0MsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsMENBQTBDLENBQUMsQ0FBQztZQUMzRSx1RUFBdUU7WUFDdkUsd0JBQXdCO1lBQ3ZCLElBQVksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUM7U0FDM0M7YUFBTSxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsQ0FBQztnQkFDOUIsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLElBQUksTUFBTTtnQkFDeEMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2FBQ3pCLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxLQUFLO1FBQ1AsT0FBTyxJQUFnQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxrQkFBa0IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7YXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHvJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgaW4gYSBESSBQcm92aWRlci5cbiAqXG4gKiBVc2UgYW4gYEluamVjdGlvblRva2VuYCB3aGVuZXZlciB0aGUgdHlwZSB5b3UgYXJlIGluamVjdGluZyBpcyBub3QgcmVpZmllZCAoZG9lcyBub3QgaGF2ZSBhXG4gKiBydW50aW1lIHJlcHJlc2VudGF0aW9uKSBzdWNoIGFzIHdoZW4gaW5qZWN0aW5nIGFuIGludGVyZmFjZSwgY2FsbGFibGUgdHlwZSwgYXJyYXkgb3JcbiAqIHBhcmFtZXRlcml6ZWQgdHlwZS5cbiAqXG4gKiBgSW5qZWN0aW9uVG9rZW5gIGlzIHBhcmFtZXRlcml6ZWQgb24gYFRgIHdoaWNoIGlzIHRoZSB0eXBlIG9mIG9iamVjdCB3aGljaCB3aWxsIGJlIHJldHVybmVkIGJ5XG4gKiB0aGUgYEluamVjdG9yYC4gVGhpcyBwcm92aWRlcyBhbiBhZGRpdGlvbmFsIGxldmVsIG9mIHR5cGUgc2FmZXR5LlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1oZWxwZnVsXCI+XG4gKlxuICogKipJbXBvcnRhbnQgTm90ZSoqOiBFbnN1cmUgdGhhdCB5b3UgdXNlIHRoZSBzYW1lIGluc3RhbmNlIG9mIHRoZSBgSW5qZWN0aW9uVG9rZW5gIGluIGJvdGggdGhlXG4gKiBwcm92aWRlciBhbmQgdGhlIGluamVjdGlvbiBjYWxsLiBDcmVhdGluZyBhIG5ldyBpbnN0YW5jZSBvZiBgSW5qZWN0aW9uVG9rZW5gIGluIGRpZmZlcmVudCBwbGFjZXMsXG4gKiBldmVuIHdpdGggdGhlIHNhbWUgZGVzY3JpcHRpb24sIHdpbGwgYmUgdHJlYXRlZCBhcyBkaWZmZXJlbnQgdG9rZW5zIGJ5IEFuZ3VsYXIncyBESSBzeXN0ZW0sXG4gKiBsZWFkaW5nIHRvIGEgYE51bGxJbmplY3RvckVycm9yYC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiA8Y29kZS1leGFtcGxlIGZvcm1hdD1cInR5cGVzY3JpcHRcIiBsYW5ndWFnZT1cInR5cGVzY3JpcHRcIiBwYXRoPVwiaW5qZWN0aW9uLXRva2VuL3NyYy9tYWluLnRzXCJcbiAqIHJlZ2lvbj1cIkluamVjdGlvblRva2VuXCI+PC9jb2RlLWV4YW1wbGU+XG4gKlxuICogV2hlbiBjcmVhdGluZyBhbiBgSW5qZWN0aW9uVG9rZW5gLCB5b3UgY2FuIG9wdGlvbmFsbHkgc3BlY2lmeSBhIGZhY3RvcnkgZnVuY3Rpb24gd2hpY2ggcmV0dXJuc1xuICogKHBvc3NpYmx5IGJ5IGNyZWF0aW5nKSBhIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHBhcmFtZXRlcml6ZWQgdHlwZSBgVGAuIFRoaXMgc2V0cyB1cCB0aGVcbiAqIGBJbmplY3Rpb25Ub2tlbmAgdXNpbmcgdGhpcyBmYWN0b3J5IGFzIGEgcHJvdmlkZXIgYXMgaWYgaXQgd2FzIGRlZmluZWQgZXhwbGljaXRseSBpbiB0aGVcbiAqIGFwcGxpY2F0aW9uJ3Mgcm9vdCBpbmplY3Rvci4gSWYgdGhlIGZhY3RvcnkgZnVuY3Rpb24sIHdoaWNoIHRha2VzIHplcm8gYXJndW1lbnRzLCBuZWVkcyB0byBpbmplY3RcbiAqIGRlcGVuZGVuY2llcywgaXQgY2FuIGRvIHNvIHVzaW5nIHRoZSBbYGluamVjdGBdKGFwaS9jb3JlL2luamVjdCkgZnVuY3Rpb24uXG4gKiBBcyB5b3UgY2FuIHNlZSBpbiB0aGUgVHJlZS1zaGFrYWJsZSBJbmplY3Rpb25Ub2tlbiBleGFtcGxlIGJlbG93LlxuICpcbiAqIEFkZGl0aW9uYWxseSwgaWYgYSBgZmFjdG9yeWAgaXMgc3BlY2lmaWVkIHlvdSBjYW4gYWxzbyBzcGVjaWZ5IHRoZSBgcHJvdmlkZWRJbmAgb3B0aW9uLCB3aGljaFxuICogb3ZlcnJpZGVzIHRoZSBhYm92ZSBiZWhhdmlvciBhbmQgbWFya3MgdGhlIHRva2VuIGFzIGJlbG9uZ2luZyB0byBhIHBhcnRpY3VsYXIgYEBOZ01vZHVsZWAgKG5vdGU6XG4gKiB0aGlzIG9wdGlvbiBpcyBub3cgZGVwcmVjYXRlZCkuIEFzIG1lbnRpb25lZCBhYm92ZSwgYCdyb290J2AgaXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yXG4gKiBgcHJvdmlkZWRJbmAuXG4gKlxuICogVGhlIGBwcm92aWRlZEluOiBOZ01vZHVsZWAgYW5kIGBwcm92aWRlZEluOiAnYW55J2Agb3B0aW9ucyBhcmUgZGVwcmVjYXRlZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEJhc2ljIEV4YW1wbGVzXG4gKlxuICogIyMjIFBsYWluIEluamVjdGlvblRva2VuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdGlvblRva2VuJ31cbiAqXG4gKiAjIyMgVHJlZS1zaGFrYWJsZSBJbmplY3Rpb25Ub2tlblxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdTaGFrYWJsZUluamVjdGlvblRva2VuJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3Rpb25Ub2tlbjxUPiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcmVhZG9ubHkgbmdNZXRhZGF0YU5hbWUgPSAnSW5qZWN0aW9uVG9rZW4nO1xuXG4gIHJlYWRvbmx5IMm1cHJvdjogdW5rbm93bjtcblxuICAvKipcbiAgICogQHBhcmFtIF9kZXNjICAgRGVzY3JpcHRpb24gZm9yIHRoZSB0b2tlbixcbiAgICogICAgICAgICAgICAgICAgdXNlZCBvbmx5IGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMsXG4gICAqICAgICAgICAgICAgICAgIGl0IHNob3VsZCBidXQgZG9lcyBub3QgbmVlZCB0byBiZSB1bmlxdWVcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHRva2VuJ3MgdXNhZ2UsIGFzIGRlc2NyaWJlZCBhYm92ZVxuICAgKi9cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9kZXNjOiBzdHJpbmcsIG9wdGlvbnM/OiB7XG4gICAgcHJvdmlkZWRJbj86IFR5cGU8YW55Pnwncm9vdCd8J3BsYXRmb3JtJ3wnYW55J3xudWxsLCBmYWN0b3J5OiAoKSA9PiBUXG4gIH0pIHtcbiAgICB0aGlzLsm1cHJvdiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ251bWJlcicpIHtcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgYXNzZXJ0TGVzc1RoYW4ob3B0aW9ucywgMCwgJ09ubHkgbmVnYXRpdmUgbnVtYmVycyBhcmUgc3VwcG9ydGVkIGhlcmUnKTtcbiAgICAgIC8vIFRoaXMgaXMgYSBzcGVjaWFsIGhhY2sgdG8gYXNzaWduIF9fTkdfRUxFTUVOVF9JRF9fIHRvIHRoaXMgaW5zdGFuY2UuXG4gICAgICAvLyBTZWUgYEluamVjdG9yTWFya2Vyc2BcbiAgICAgICh0aGlzIGFzIGFueSkuX19OR19FTEVNRU5UX0lEX18gPSBvcHRpb25zO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLsm1cHJvdiA9IMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICAgICAgdG9rZW46IHRoaXMsXG4gICAgICAgIHByb3ZpZGVkSW46IG9wdGlvbnMucHJvdmlkZWRJbiB8fCAncm9vdCcsXG4gICAgICAgIGZhY3Rvcnk6IG9wdGlvbnMuZmFjdG9yeSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBtdWx0aSgpOiBJbmplY3Rpb25Ub2tlbjxBcnJheTxUPj4ge1xuICAgIHJldHVybiB0aGlzIGFzIEluamVjdGlvblRva2VuPEFycmF5PFQ+PjtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBJbmplY3Rpb25Ub2tlbiAke3RoaXMuX2Rlc2N9YDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdGFibGVEZWZUb2tlbjxUPiBleHRlbmRzIEluamVjdGlvblRva2VuPFQ+IHtcbiAgybVwcm92OiB1bmtub3duO1xufVxuIl19