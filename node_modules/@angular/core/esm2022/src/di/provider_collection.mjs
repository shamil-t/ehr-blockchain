/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { getComponentDef } from '../render3/definition';
import { getFactoryDef } from '../render3/definition_factory';
import { throwCyclicDependencyError, throwInvalidProviderError } from '../render3/errors_di';
import { stringifyForError } from '../render3/util/stringify_utils';
import { deepForEach } from '../util/array_utils';
import { EMPTY_ARRAY } from '../util/empty';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { ɵɵinject as inject } from './injector_compatibility';
import { getInjectorDef } from './interface/defs';
import { isEnvironmentProviders } from './interface/provider';
import { INJECTOR_DEF_TYPES } from './internal_tokens';
/**
 * Wrap an array of `Provider`s into `EnvironmentProviders`, preventing them from being accidentally
 * referenced in `@Component` in a component injector.
 */
export function makeEnvironmentProviders(providers) {
    return {
        ɵproviders: providers,
    };
}
/**
 * Collects providers from all NgModules and standalone components, including transitively imported
 * ones.
 *
 * Providers extracted via `importProvidersFrom` are only usable in an application injector or
 * another environment injector (such as a route injector). They should not be used in component
 * providers.
 *
 * More information about standalone components can be found in [this
 * guide](guide/standalone-components).
 *
 * @usageNotes
 * The results of the `importProvidersFrom` call can be used in the `bootstrapApplication` call:
 *
 * ```typescript
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     importProvidersFrom(NgModuleOne, NgModuleTwo)
 *   ]
 * });
 * ```
 *
 * You can also use the `importProvidersFrom` results in the `providers` field of a route, when a
 * standalone component is used:
 *
 * ```typescript
 * export const ROUTES: Route[] = [
 *   {
 *     path: 'foo',
 *     providers: [
 *       importProvidersFrom(NgModuleOne, NgModuleTwo)
 *     ],
 *     component: YourStandaloneComponent
 *   }
 * ];
 * ```
 *
 * @returns Collected providers from the specified list of types.
 * @publicApi
 */
export function importProvidersFrom(...sources) {
    return {
        ɵproviders: internalImportProvidersFrom(true, sources),
        ɵfromNgModule: true,
    };
}
export function internalImportProvidersFrom(checkForStandaloneCmp, ...sources) {
    const providersOut = [];
    const dedup = new Set(); // already seen types
    let injectorTypesWithProviders;
    const collectProviders = (provider) => {
        providersOut.push(provider);
    };
    deepForEach(sources, source => {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && checkForStandaloneCmp) {
            const cmpDef = getComponentDef(source);
            if (cmpDef?.standalone) {
                throw new RuntimeError(800 /* RuntimeErrorCode.IMPORT_PROVIDERS_FROM_STANDALONE */, `Importing providers supports NgModule or ModuleWithProviders but got a standalone component "${stringifyForError(source)}"`);
            }
        }
        // Narrow `source` to access the internal type analogue for `ModuleWithProviders`.
        const internalSource = source;
        if (walkProviderTree(internalSource, collectProviders, [], dedup)) {
            injectorTypesWithProviders ||= [];
            injectorTypesWithProviders.push(internalSource);
        }
    });
    // Collect all providers from `ModuleWithProviders` types.
    if (injectorTypesWithProviders !== undefined) {
        processInjectorTypesWithProviders(injectorTypesWithProviders, collectProviders);
    }
    return providersOut;
}
/**
 * Collects all providers from the list of `ModuleWithProviders` and appends them to the provided
 * array.
 */
function processInjectorTypesWithProviders(typesWithProviders, visitor) {
    for (let i = 0; i < typesWithProviders.length; i++) {
        const { ngModule, providers } = typesWithProviders[i];
        deepForEachProvider(providers, provider => {
            ngDevMode && validateProvider(provider, providers || EMPTY_ARRAY, ngModule);
            visitor(provider, ngModule);
        });
    }
}
/**
 * The logic visits an `InjectorType`, an `InjectorTypeWithProviders`, or a standalone
 * `ComponentType`, and all of its transitive providers and collects providers.
 *
 * If an `InjectorTypeWithProviders` that declares providers besides the type is specified,
 * the function will return "true" to indicate that the providers of the type definition need
 * to be processed. This allows us to process providers of injector types after all imports of
 * an injector definition are processed. (following View Engine semantics: see FW-1349)
 */
export function walkProviderTree(container, visitor, parents, dedup) {
    container = resolveForwardRef(container);
    if (!container)
        return false;
    // The actual type which had the definition. Usually `container`, but may be an unwrapped type
    // from `InjectorTypeWithProviders`.
    let defType = null;
    let injDef = getInjectorDef(container);
    const cmpDef = !injDef && getComponentDef(container);
    if (!injDef && !cmpDef) {
        // `container` is not an injector type or a component type. It might be:
        //  * An `InjectorTypeWithProviders` that wraps an injector type.
        //  * A standalone directive or pipe that got pulled in from a standalone component's
        //    dependencies.
        // Try to unwrap it as an `InjectorTypeWithProviders` first.
        const ngModule = container.ngModule;
        injDef = getInjectorDef(ngModule);
        if (injDef) {
            defType = ngModule;
        }
        else {
            // Not a component or injector type, so ignore it.
            return false;
        }
    }
    else if (cmpDef && !cmpDef.standalone) {
        return false;
    }
    else {
        defType = container;
    }
    // Check for circular dependencies.
    if (ngDevMode && parents.indexOf(defType) !== -1) {
        const defName = stringify(defType);
        const path = parents.map(stringify);
        throwCyclicDependencyError(defName, path);
    }
    // Check for multiple imports of the same module
    const isDuplicate = dedup.has(defType);
    if (cmpDef) {
        if (isDuplicate) {
            // This component definition has already been processed.
            return false;
        }
        dedup.add(defType);
        if (cmpDef.dependencies) {
            const deps = typeof cmpDef.dependencies === 'function' ? cmpDef.dependencies() : cmpDef.dependencies;
            for (const dep of deps) {
                walkProviderTree(dep, visitor, parents, dedup);
            }
        }
    }
    else if (injDef) {
        // First, include providers from any imports.
        if (injDef.imports != null && !isDuplicate) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            ngDevMode && parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedup.add(defType);
            let importTypesWithProviders;
            try {
                deepForEach(injDef.imports, imported => {
                    if (walkProviderTree(imported, visitor, parents, dedup)) {
                        importTypesWithProviders ||= [];
                        // If the processed import is an injector type with providers, we store it in the
                        // list of import types with providers, so that we can process those afterwards.
                        importTypesWithProviders.push(imported);
                    }
                });
            }
            finally {
                // Remove it from the parents set when finished.
                ngDevMode && parents.pop();
            }
            // Imports which are declared with providers (TypeWithProviders) need to be processed
            // after all imported modules are processed. This is similar to how View Engine
            // processes/merges module imports in the metadata resolver. See: FW-1349.
            if (importTypesWithProviders !== undefined) {
                processInjectorTypesWithProviders(importTypesWithProviders, visitor);
            }
        }
        if (!isDuplicate) {
            // Track the InjectorType and add a provider for it.
            // It's important that this is done after the def's imports.
            const factory = getFactoryDef(defType) || (() => new defType());
            // Append extra providers to make more info available for consumers (to retrieve an injector
            // type), as well as internally (to calculate an injection scope correctly and eagerly
            // instantiate a `defType` when an injector is created).
            // Provider to create `defType` using its factory.
            visitor({ provide: defType, useFactory: factory, deps: EMPTY_ARRAY }, defType);
            // Make this `defType` available to an internal logic that calculates injector scope.
            visitor({ provide: INJECTOR_DEF_TYPES, useValue: defType, multi: true }, defType);
            // Provider to eagerly instantiate `defType` via `INJECTOR_INITIALIZER`.
            visitor({ provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(defType), multi: true }, defType);
        }
        // Next, include providers listed on the definition itself.
        const defProviders = injDef.providers;
        if (defProviders != null && !isDuplicate) {
            const injectorType = container;
            deepForEachProvider(defProviders, provider => {
                ngDevMode && validateProvider(provider, defProviders, injectorType);
                visitor(provider, injectorType);
            });
        }
    }
    else {
        // Should not happen, but just in case.
        return false;
    }
    return (defType !== container &&
        container.providers !== undefined);
}
function validateProvider(provider, providers, containerType) {
    if (isTypeProvider(provider) || isValueProvider(provider) || isFactoryProvider(provider) ||
        isExistingProvider(provider)) {
        return;
    }
    // Here we expect the provider to be a `useClass` provider (by elimination).
    const classRef = resolveForwardRef(provider && (provider.useClass || provider.provide));
    if (!classRef) {
        throwInvalidProviderError(containerType, providers, provider);
    }
}
function deepForEachProvider(providers, fn) {
    for (let provider of providers) {
        if (isEnvironmentProviders(provider)) {
            provider = provider.ɵproviders;
        }
        if (Array.isArray(provider)) {
            deepForEachProvider(provider, fn);
        }
        else {
            fn(provider);
        }
    }
}
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
export function isValueProvider(value) {
    return value !== null && typeof value == 'object' && USE_VALUE in value;
}
export function isExistingProvider(value) {
    return !!(value && value.useExisting);
}
export function isFactoryProvider(value) {
    return !!(value && value.useFactory);
}
export function isTypeProvider(value) {
    return typeof value === 'function';
}
export function isClassProvider(value) {
    return !!value.useClass;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJfY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxQyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLElBQUksTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBMEMsTUFBTSxrQkFBa0IsQ0FBQztBQUN6RixPQUFPLEVBQXVKLHNCQUFzQixFQUFrRixNQUFNLHNCQUFzQixDQUFDO0FBQ25TLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXJEOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUE0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LFFBQVEsRUFBRSxzQkFBc0IsRUFBQyxDQUFDLENBQUM7QUFFL0YsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUM7QUFDMUUsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxLQUFxQjtJQUN0RCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBcUI7SUFDckQsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUssS0FBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFxQjtJQUNsRCxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLENBQUMsQ0FBRSxLQUE2QyxDQUFDLFFBQVEsQ0FBQztBQUNuRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uX2ZhY3RvcnknO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy9lcnJvcnNfZGknO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2RlZXBGb3JFYWNofSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUn0gZnJvbSAnLi9pbml0aWFsaXplcl90b2tlbic7XG5pbXBvcnQge8m1ybVpbmplY3QgYXMgaW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZiwgSW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRW52aXJvbm1lbnRQcm92aWRlcnMsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgSW1wb3J0ZWROZ01vZHVsZVByb3ZpZGVycywgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycywgaXNFbnZpcm9ubWVudFByb3ZpZGVycywgTW9kdWxlV2l0aFByb3ZpZGVycywgUHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJTkpFQ1RPUl9ERUZfVFlQRVN9IGZyb20gJy4vaW50ZXJuYWxfdG9rZW5zJztcblxuLyoqXG4gKiBXcmFwIGFuIGFycmF5IG9mIGBQcm92aWRlcmBzIGludG8gYEVudmlyb25tZW50UHJvdmlkZXJzYCwgcHJldmVudGluZyB0aGVtIGZyb20gYmVpbmcgYWNjaWRlbnRhbGx5XG4gKiByZWZlcmVuY2VkIGluIGBAQ29tcG9uZW50YCBpbiBhIGNvbXBvbmVudCBpbmplY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhwcm92aWRlcnM6IChQcm92aWRlcnxFbnZpcm9ubWVudFByb3ZpZGVycylbXSk6XG4gICAgRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4ge1xuICAgIMm1cHJvdmlkZXJzOiBwcm92aWRlcnMsXG4gIH0gYXMgdW5rbm93biBhcyBFbnZpcm9ubWVudFByb3ZpZGVycztcbn1cblxuLyoqXG4gKiBBIHNvdXJjZSBvZiBwcm92aWRlcnMgZm9yIHRoZSBgaW1wb3J0UHJvdmlkZXJzRnJvbWAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBJbXBvcnRQcm92aWRlcnNTb3VyY2UgPVxuICAgIFR5cGU8dW5rbm93bj58TW9kdWxlV2l0aFByb3ZpZGVyczx1bmtub3duPnxBcnJheTxJbXBvcnRQcm92aWRlcnNTb3VyY2U+O1xuXG50eXBlIFdhbGtQcm92aWRlclRyZWVWaXNpdG9yID1cbiAgICAocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBjb250YWluZXI6IFR5cGU8dW5rbm93bj58SW5qZWN0b3JUeXBlPHVua25vd24+KSA9PiB2b2lkO1xuXG4vKipcbiAqIENvbGxlY3RzIHByb3ZpZGVycyBmcm9tIGFsbCBOZ01vZHVsZXMgYW5kIHN0YW5kYWxvbmUgY29tcG9uZW50cywgaW5jbHVkaW5nIHRyYW5zaXRpdmVseSBpbXBvcnRlZFxuICogb25lcy5cbiAqXG4gKiBQcm92aWRlcnMgZXh0cmFjdGVkIHZpYSBgaW1wb3J0UHJvdmlkZXJzRnJvbWAgYXJlIG9ubHkgdXNhYmxlIGluIGFuIGFwcGxpY2F0aW9uIGluamVjdG9yIG9yXG4gKiBhbm90aGVyIGVudmlyb25tZW50IGluamVjdG9yIChzdWNoIGFzIGEgcm91dGUgaW5qZWN0b3IpLiBUaGV5IHNob3VsZCBub3QgYmUgdXNlZCBpbiBjb21wb25lbnRcbiAqIHByb3ZpZGVycy5cbiAqXG4gKiBNb3JlIGluZm9ybWF0aW9uIGFib3V0IHN0YW5kYWxvbmUgY29tcG9uZW50cyBjYW4gYmUgZm91bmQgaW4gW3RoaXNcbiAqIGd1aWRlXShndWlkZS9zdGFuZGFsb25lLWNvbXBvbmVudHMpLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBUaGUgcmVzdWx0cyBvZiB0aGUgYGltcG9ydFByb3ZpZGVyc0Zyb21gIGNhbGwgY2FuIGJlIHVzZWQgaW4gdGhlIGBib290c3RyYXBBcHBsaWNhdGlvbmAgY2FsbDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBhd2FpdCBib290c3RyYXBBcHBsaWNhdGlvbihSb290Q29tcG9uZW50LCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIGltcG9ydFByb3ZpZGVyc0Zyb20oTmdNb2R1bGVPbmUsIE5nTW9kdWxlVHdvKVxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIFlvdSBjYW4gYWxzbyB1c2UgdGhlIGBpbXBvcnRQcm92aWRlcnNGcm9tYCByZXN1bHRzIGluIHRoZSBgcHJvdmlkZXJzYCBmaWVsZCBvZiBhIHJvdXRlLCB3aGVuIGFcbiAqIHN0YW5kYWxvbmUgY29tcG9uZW50IGlzIHVzZWQ6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZXhwb3J0IGNvbnN0IFJPVVRFUzogUm91dGVbXSA9IFtcbiAqICAge1xuICogICAgIHBhdGg6ICdmb28nLFxuICogICAgIHByb3ZpZGVyczogW1xuICogICAgICAgaW1wb3J0UHJvdmlkZXJzRnJvbShOZ01vZHVsZU9uZSwgTmdNb2R1bGVUd28pXG4gKiAgICAgXSxcbiAqICAgICBjb21wb25lbnQ6IFlvdXJTdGFuZGFsb25lQ29tcG9uZW50XG4gKiAgIH1cbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBAcmV0dXJucyBDb2xsZWN0ZWQgcHJvdmlkZXJzIGZyb20gdGhlIHNwZWNpZmllZCBsaXN0IG9mIHR5cGVzLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW1wb3J0UHJvdmlkZXJzRnJvbSguLi5zb3VyY2VzOiBJbXBvcnRQcm92aWRlcnNTb3VyY2VbXSk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIHtcbiAgICDJtXByb3ZpZGVyczogaW50ZXJuYWxJbXBvcnRQcm92aWRlcnNGcm9tKHRydWUsIHNvdXJjZXMpLFxuICAgIMm1ZnJvbU5nTW9kdWxlOiB0cnVlLFxuICB9IGFzIEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEltcG9ydFByb3ZpZGVyc0Zyb20oXG4gICAgY2hlY2tGb3JTdGFuZGFsb25lQ21wOiBib29sZWFuLCAuLi5zb3VyY2VzOiBJbXBvcnRQcm92aWRlcnNTb3VyY2VbXSk6IFByb3ZpZGVyW10ge1xuICBjb25zdCBwcm92aWRlcnNPdXQ6IFNpbmdsZVByb3ZpZGVyW10gPSBbXTtcbiAgY29uc3QgZGVkdXAgPSBuZXcgU2V0PFR5cGU8dW5rbm93bj4+KCk7ICAvLyBhbHJlYWR5IHNlZW4gdHlwZXNcbiAgbGV0IGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzOiBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+W118dW5kZWZpbmVkO1xuXG4gIGNvbnN0IGNvbGxlY3RQcm92aWRlcnM6IFdhbGtQcm92aWRlclRyZWVWaXNpdG9yID0gKHByb3ZpZGVyKSA9PiB7XG4gICAgcHJvdmlkZXJzT3V0LnB1c2gocHJvdmlkZXIpO1xuICB9O1xuXG4gIGRlZXBGb3JFYWNoKHNvdXJjZXMsIHNvdXJjZSA9PiB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGNoZWNrRm9yU3RhbmRhbG9uZUNtcCkge1xuICAgICAgY29uc3QgY21wRGVmID0gZ2V0Q29tcG9uZW50RGVmKHNvdXJjZSk7XG4gICAgICBpZiAoY21wRGVmPy5zdGFuZGFsb25lKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklNUE9SVF9QUk9WSURFUlNfRlJPTV9TVEFOREFMT05FLFxuICAgICAgICAgICAgYEltcG9ydGluZyBwcm92aWRlcnMgc3VwcG9ydHMgTmdNb2R1bGUgb3IgTW9kdWxlV2l0aFByb3ZpZGVycyBidXQgZ290IGEgc3RhbmRhbG9uZSBjb21wb25lbnQgXCIke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeUZvckVycm9yKHNvdXJjZSl9XCJgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOYXJyb3cgYHNvdXJjZWAgdG8gYWNjZXNzIHRoZSBpbnRlcm5hbCB0eXBlIGFuYWxvZ3VlIGZvciBgTW9kdWxlV2l0aFByb3ZpZGVyc2AuXG4gICAgY29uc3QgaW50ZXJuYWxTb3VyY2UgPSBzb3VyY2UgYXMgVHlwZTx1bmtub3duPnwgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPjtcbiAgICBpZiAod2Fsa1Byb3ZpZGVyVHJlZShpbnRlcm5hbFNvdXJjZSwgY29sbGVjdFByb3ZpZGVycywgW10sIGRlZHVwKSkge1xuICAgICAgaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMgfHw9IFtdO1xuICAgICAgaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMucHVzaChpbnRlcm5hbFNvdXJjZSk7XG4gICAgfVxuICB9KTtcbiAgLy8gQ29sbGVjdCBhbGwgcHJvdmlkZXJzIGZyb20gYE1vZHVsZVdpdGhQcm92aWRlcnNgIHR5cGVzLlxuICBpZiAoaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIHByb2Nlc3NJbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyhpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycywgY29sbGVjdFByb3ZpZGVycyk7XG4gIH1cblxuICByZXR1cm4gcHJvdmlkZXJzT3V0O1xufVxuXG4vKipcbiAqIENvbGxlY3RzIGFsbCBwcm92aWRlcnMgZnJvbSB0aGUgbGlzdCBvZiBgTW9kdWxlV2l0aFByb3ZpZGVyc2AgYW5kIGFwcGVuZHMgdGhlbSB0byB0aGUgcHJvdmlkZWRcbiAqIGFycmF5LlxuICovXG5mdW5jdGlvbiBwcm9jZXNzSW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMoXG4gICAgdHlwZXNXaXRoUHJvdmlkZXJzOiBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+W10sXG4gICAgdmlzaXRvcjogV2Fsa1Byb3ZpZGVyVHJlZVZpc2l0b3IpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlc1dpdGhQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB7bmdNb2R1bGUsIHByb3ZpZGVyc30gPSB0eXBlc1dpdGhQcm92aWRlcnNbaV07XG4gICAgZGVlcEZvckVhY2hQcm92aWRlcihwcm92aWRlcnMhIGFzIEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LCBwcm92aWRlciA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVQcm92aWRlcihwcm92aWRlciwgcHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLCBuZ01vZHVsZSk7XG4gICAgICB2aXNpdG9yKHByb3ZpZGVyLCBuZ01vZHVsZSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbmV4cG9ydCB0eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyfFZhbHVlUHJvdmlkZXJ8Q2xhc3NQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgIEV4aXN0aW5nUHJvdmlkZXJ8RmFjdG9yeVByb3ZpZGVyfFN0YXRpY0NsYXNzUHJvdmlkZXI7XG5cbi8qKlxuICogVGhlIGxvZ2ljIHZpc2l0cyBhbiBgSW5qZWN0b3JUeXBlYCwgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgLCBvciBhIHN0YW5kYWxvbmVcbiAqIGBDb21wb25lbnRUeXBlYCwgYW5kIGFsbCBvZiBpdHMgdHJhbnNpdGl2ZSBwcm92aWRlcnMgYW5kIGNvbGxlY3RzIHByb3ZpZGVycy5cbiAqXG4gKiBJZiBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCBkZWNsYXJlcyBwcm92aWRlcnMgYmVzaWRlcyB0aGUgdHlwZSBpcyBzcGVjaWZpZWQsXG4gKiB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gXCJ0cnVlXCIgdG8gaW5kaWNhdGUgdGhhdCB0aGUgcHJvdmlkZXJzIG9mIHRoZSB0eXBlIGRlZmluaXRpb24gbmVlZFxuICogdG8gYmUgcHJvY2Vzc2VkLiBUaGlzIGFsbG93cyB1cyB0byBwcm9jZXNzIHByb3ZpZGVycyBvZiBpbmplY3RvciB0eXBlcyBhZnRlciBhbGwgaW1wb3J0cyBvZlxuICogYW4gaW5qZWN0b3IgZGVmaW5pdGlvbiBhcmUgcHJvY2Vzc2VkLiAoZm9sbG93aW5nIFZpZXcgRW5naW5lIHNlbWFudGljczogc2VlIEZXLTEzNDkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YWxrUHJvdmlkZXJUcmVlKFxuICAgIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+LCB2aXNpdG9yOiBXYWxrUHJvdmlkZXJUcmVlVmlzaXRvcixcbiAgICBwYXJlbnRzOiBUeXBlPHVua25vd24+W10sXG4gICAgZGVkdXA6IFNldDxUeXBlPHVua25vd24+Pik6IGNvbnRhaW5lciBpcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+IHtcbiAgY29udGFpbmVyID0gcmVzb2x2ZUZvcndhcmRSZWYoY29udGFpbmVyKTtcbiAgaWYgKCFjb250YWluZXIpIHJldHVybiBmYWxzZTtcblxuICAvLyBUaGUgYWN0dWFsIHR5cGUgd2hpY2ggaGFkIHRoZSBkZWZpbml0aW9uLiBVc3VhbGx5IGBjb250YWluZXJgLCBidXQgbWF5IGJlIGFuIHVud3JhcHBlZCB0eXBlXG4gIC8vIGZyb20gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgLlxuICBsZXQgZGVmVHlwZTogVHlwZTx1bmtub3duPnxudWxsID0gbnVsbDtcblxuICBsZXQgaW5qRGVmID0gZ2V0SW5qZWN0b3JEZWYoY29udGFpbmVyKTtcbiAgY29uc3QgY21wRGVmID0gIWluakRlZiAmJiBnZXRDb21wb25lbnREZWYoY29udGFpbmVyKTtcbiAgaWYgKCFpbmpEZWYgJiYgIWNtcERlZikge1xuICAgIC8vIGBjb250YWluZXJgIGlzIG5vdCBhbiBpbmplY3RvciB0eXBlIG9yIGEgY29tcG9uZW50IHR5cGUuIEl0IG1pZ2h0IGJlOlxuICAgIC8vICAqIEFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCB0aGF0IHdyYXBzIGFuIGluamVjdG9yIHR5cGUuXG4gICAgLy8gICogQSBzdGFuZGFsb25lIGRpcmVjdGl2ZSBvciBwaXBlIHRoYXQgZ290IHB1bGxlZCBpbiBmcm9tIGEgc3RhbmRhbG9uZSBjb21wb25lbnQnc1xuICAgIC8vICAgIGRlcGVuZGVuY2llcy5cbiAgICAvLyBUcnkgdG8gdW53cmFwIGl0IGFzIGFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCBmaXJzdC5cbiAgICBjb25zdCBuZ01vZHVsZTogVHlwZTx1bmtub3duPnx1bmRlZmluZWQgPVxuICAgICAgICAoY29udGFpbmVyIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGUgYXMgVHlwZTx1bmtub3duPnwgdW5kZWZpbmVkO1xuICAgIGluakRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICBpZiAoaW5qRGVmKSB7XG4gICAgICBkZWZUeXBlID0gbmdNb2R1bGUhO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgYSBjb21wb25lbnQgb3IgaW5qZWN0b3IgdHlwZSwgc28gaWdub3JlIGl0LlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChjbXBEZWYgJiYgIWNtcERlZi5zdGFuZGFsb25lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIGRlZlR5cGUgPSBjb250YWluZXIgYXMgVHlwZTx1bmtub3duPjtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG4gIGlmIChuZ0Rldk1vZGUgJiYgcGFyZW50cy5pbmRleE9mKGRlZlR5cGUpICE9PSAtMSkge1xuICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgY29uc3QgcGF0aCA9IHBhcmVudHMubWFwKHN0cmluZ2lmeSk7XG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmTmFtZSwgcGF0aCk7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cC5oYXMoZGVmVHlwZSk7XG5cbiAgaWYgKGNtcERlZikge1xuICAgIGlmIChpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gVGhpcyBjb21wb25lbnQgZGVmaW5pdGlvbiBoYXMgYWxyZWFkeSBiZWVuIHByb2Nlc3NlZC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZGVkdXAuYWRkKGRlZlR5cGUpO1xuXG4gICAgaWYgKGNtcERlZi5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGNvbnN0IGRlcHMgPVxuICAgICAgICAgIHR5cGVvZiBjbXBEZWYuZGVwZW5kZW5jaWVzID09PSAnZnVuY3Rpb24nID8gY21wRGVmLmRlcGVuZGVuY2llcygpIDogY21wRGVmLmRlcGVuZGVuY2llcztcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcbiAgICAgICAgd2Fsa1Byb3ZpZGVyVHJlZShkZXAsIHZpc2l0b3IsIHBhcmVudHMsIGRlZHVwKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5qRGVmKSB7XG4gICAgLy8gRmlyc3QsIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW55IGltcG9ydHMuXG4gICAgaWYgKGluakRlZi5pbXBvcnRzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwLmFkZChkZWZUeXBlKTtcblxuICAgICAgbGV0IGltcG9ydFR5cGVzV2l0aFByb3ZpZGVyczogKEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PltdKXx1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChpbmpEZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4ge1xuICAgICAgICAgIGlmICh3YWxrUHJvdmlkZXJUcmVlKGltcG9ydGVkLCB2aXNpdG9yLCBwYXJlbnRzLCBkZWR1cCkpIHtcbiAgICAgICAgICAgIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyB8fD0gW107XG4gICAgICAgICAgICAvLyBJZiB0aGUgcHJvY2Vzc2VkIGltcG9ydCBpcyBhbiBpbmplY3RvciB0eXBlIHdpdGggcHJvdmlkZXJzLCB3ZSBzdG9yZSBpdCBpbiB0aGVcbiAgICAgICAgICAgIC8vIGxpc3Qgb2YgaW1wb3J0IHR5cGVzIHdpdGggcHJvdmlkZXJzLCBzbyB0aGF0IHdlIGNhbiBwcm9jZXNzIHRob3NlIGFmdGVyd2FyZHMuXG4gICAgICAgICAgICBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMucHVzaChpbXBvcnRlZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIC8vIFJlbW92ZSBpdCBmcm9tIHRoZSBwYXJlbnRzIHNldCB3aGVuIGZpbmlzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW1wb3J0cyB3aGljaCBhcmUgZGVjbGFyZWQgd2l0aCBwcm92aWRlcnMgKFR5cGVXaXRoUHJvdmlkZXJzKSBuZWVkIHRvIGJlIHByb2Nlc3NlZFxuICAgICAgLy8gYWZ0ZXIgYWxsIGltcG9ydGVkIG1vZHVsZXMgYXJlIHByb2Nlc3NlZC4gVGhpcyBpcyBzaW1pbGFyIHRvIGhvdyBWaWV3IEVuZ2luZVxuICAgICAgLy8gcHJvY2Vzc2VzL21lcmdlcyBtb2R1bGUgaW1wb3J0cyBpbiB0aGUgbWV0YWRhdGEgcmVzb2x2ZXIuIFNlZTogRlctMTM0OS5cbiAgICAgIGlmIChpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9jZXNzSW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLCB2aXNpdG9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBUcmFjayB0aGUgSW5qZWN0b3JUeXBlIGFuZCBhZGQgYSBwcm92aWRlciBmb3IgaXQuXG4gICAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHRoaXMgaXMgZG9uZSBhZnRlciB0aGUgZGVmJ3MgaW1wb3J0cy5cbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmKGRlZlR5cGUpIHx8ICgoKSA9PiBuZXcgZGVmVHlwZSEoKSk7XG5cbiAgICAgIC8vIEFwcGVuZCBleHRyYSBwcm92aWRlcnMgdG8gbWFrZSBtb3JlIGluZm8gYXZhaWxhYmxlIGZvciBjb25zdW1lcnMgKHRvIHJldHJpZXZlIGFuIGluamVjdG9yXG4gICAgICAvLyB0eXBlKSwgYXMgd2VsbCBhcyBpbnRlcm5hbGx5ICh0byBjYWxjdWxhdGUgYW4gaW5qZWN0aW9uIHNjb3BlIGNvcnJlY3RseSBhbmQgZWFnZXJseVxuICAgICAgLy8gaW5zdGFudGlhdGUgYSBgZGVmVHlwZWAgd2hlbiBhbiBpbmplY3RvciBpcyBjcmVhdGVkKS5cblxuICAgICAgLy8gUHJvdmlkZXIgdG8gY3JlYXRlIGBkZWZUeXBlYCB1c2luZyBpdHMgZmFjdG9yeS5cbiAgICAgIHZpc2l0b3Ioe3Byb3ZpZGU6IGRlZlR5cGUsIHVzZUZhY3Rvcnk6IGZhY3RvcnksIGRlcHM6IEVNUFRZX0FSUkFZfSwgZGVmVHlwZSk7XG5cbiAgICAgIC8vIE1ha2UgdGhpcyBgZGVmVHlwZWAgYXZhaWxhYmxlIHRvIGFuIGludGVybmFsIGxvZ2ljIHRoYXQgY2FsY3VsYXRlcyBpbmplY3RvciBzY29wZS5cbiAgICAgIHZpc2l0b3Ioe3Byb3ZpZGU6IElOSkVDVE9SX0RFRl9UWVBFUywgdXNlVmFsdWU6IGRlZlR5cGUsIG11bHRpOiB0cnVlfSwgZGVmVHlwZSk7XG5cbiAgICAgIC8vIFByb3ZpZGVyIHRvIGVhZ2VybHkgaW5zdGFudGlhdGUgYGRlZlR5cGVgIHZpYSBgSU5KRUNUT1JfSU5JVElBTElaRVJgLlxuICAgICAgdmlzaXRvcihcbiAgICAgICAgICB7cHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIHVzZVZhbHVlOiAoKSA9PiBpbmplY3QoZGVmVHlwZSEpLCBtdWx0aTogdHJ1ZX0sXG4gICAgICAgICAgZGVmVHlwZSk7XG4gICAgfVxuXG4gICAgLy8gTmV4dCwgaW5jbHVkZSBwcm92aWRlcnMgbGlzdGVkIG9uIHRoZSBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICBjb25zdCBkZWZQcm92aWRlcnMgPSBpbmpEZWYucHJvdmlkZXJzIGFzIEFycmF5PFNpbmdsZVByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+O1xuICAgIGlmIChkZWZQcm92aWRlcnMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIGNvbnN0IGluamVjdG9yVHlwZSA9IGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGU8YW55PjtcbiAgICAgIGRlZXBGb3JFYWNoUHJvdmlkZXIoZGVmUHJvdmlkZXJzLCBwcm92aWRlciA9PiB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVByb3ZpZGVyKHByb3ZpZGVyIGFzIFNpbmdsZVByb3ZpZGVyLCBkZWZQcm92aWRlcnMsIGluamVjdG9yVHlwZSk7XG4gICAgICAgIHZpc2l0b3IocHJvdmlkZXIsIGluamVjdG9yVHlwZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4sIGJ1dCBqdXN0IGluIGNhc2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICAgIGRlZlR5cGUgIT09IGNvbnRhaW5lciAmJlxuICAgICAgKGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm92aWRlcihcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIHByb3ZpZGVyczogQXJyYXk8U2luZ2xlUHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICAgY29udGFpbmVyVHlwZTogVHlwZTx1bmtub3duPik6IHZvaWQge1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikgfHwgaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICBpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSGVyZSB3ZSBleHBlY3QgdGhlIHByb3ZpZGVyIHRvIGJlIGEgYHVzZUNsYXNzYCBwcm92aWRlciAoYnkgZWxpbWluYXRpb24pLlxuICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgcHJvdmlkZXIgJiYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSkpO1xuICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcihjb250YWluZXJUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWVwRm9yRWFjaFByb3ZpZGVyKFxuICAgIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICAgZm46IChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlciA9IHByb3ZpZGVyLsm1cHJvdmlkZXJzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAgIGRlZXBGb3JFYWNoUHJvdmlkZXIocHJvdmlkZXIsIGZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm4ocHJvdmlkZXIpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFeGlzdGluZ1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEV4aXN0aW5nUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRmFjdG9yeVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEZhY3RvcnlQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFR5cGVQcm92aWRlciB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NsYXNzUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3M7XG59XG4iXX0=