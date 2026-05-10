/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../di/forward_ref';
import { isClassProvider, isTypeProvider } from '../di/provider_collection';
import { providerToFactory } from '../di/r3_injector';
import { assertDefined } from '../util/assert';
import { emitProviderConfiguredEvent, runInInjectorProfilerContext } from './debug/injector_profiler';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode, NodeInjector } from './di';
import { ɵɵdirectiveInject } from './instructions/all';
import { NodeInjectorFactory } from './interfaces/injector';
import { isComponentDef } from './interfaces/type_checks';
import { TVIEW } from './interfaces/view';
import { getCurrentTNode, getLView, getTView } from './state';
/**
 * Resolves the providers which are defined in the DirectiveDef.
 *
 * When inserting the tokens and the factories in their respective arrays, we can assume that
 * this method is called first for the component (if any), and then for other directives on the same
 * node.
 * As a consequence,the providers are always processed in that order:
 * 1) The view providers of the component
 * 2) The providers of the component
 * 3) The providers of the other directives
 * This matches the structure of the injectables arrays of a view (for each node).
 * So the tokens and the factories can be pushed at the end of the arrays, except
 * in one case for multi providers.
 *
 * @param def the directive definition
 * @param providers: Array of `providers`.
 * @param viewProviders: Array of `viewProviders`.
 */
export function providersResolver(def, providers, viewProviders) {
    const tView = getTView();
    if (tView.firstCreatePass) {
        const isComponent = isComponentDef(def);
        // The list of view providers is processed first, and the flags are updated
        resolveProvider(viewProviders, tView.data, tView.blueprint, isComponent, true);
        // Then, the list of providers is processed, and the flags are updated
        resolveProvider(providers, tView.data, tView.blueprint, isComponent, false);
    }
}
/**
 * Resolves a provider and publishes it to the DI system.
 */
function resolveProvider(provider, tInjectables, lInjectablesBlueprint, isComponent, isViewProvider) {
    provider = resolveForwardRef(provider);
    if (Array.isArray(provider)) {
        // Recursively call `resolveProvider`
        // Recursion is OK in this case because this code will not be in hot-path once we implement
        // cloning of the initial state.
        for (let i = 0; i < provider.length; i++) {
            resolveProvider(provider[i], tInjectables, lInjectablesBlueprint, isComponent, isViewProvider);
        }
    }
    else {
        const tView = getTView();
        const lView = getLView();
        const tNode = getCurrentTNode();
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        const providerFactory = providerToFactory(provider);
        if (ngDevMode) {
            const injector = new NodeInjector(tNode, lView);
            runInInjectorProfilerContext(injector, token, () => {
                emitProviderConfiguredEvent(provider, isViewProvider);
            });
        }
        const beginIndex = tNode.providerIndexes & 1048575 /* TNodeProviderIndexes.ProvidersStartIndexMask */;
        const endIndex = tNode.directiveStart;
        const cptViewProvidersCount = tNode.providerIndexes >> 20 /* TNodeProviderIndexes.CptViewProvidersCountShift */;
        if (isTypeProvider(provider) || !provider.multi) {
            // Single provider case: the factory is created and pushed immediately
            const factory = new NodeInjectorFactory(providerFactory, isViewProvider, ɵɵdirectiveInject);
            const existingFactoryIndex = indexOf(token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount, endIndex);
            if (existingFactoryIndex === -1) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, token);
                registerDestroyHooksIfSupported(tView, provider, tInjectables.length);
                tInjectables.push(token);
                tNode.directiveStart++;
                tNode.directiveEnd++;
                if (isViewProvider) {
                    tNode.providerIndexes += 1048576 /* TNodeProviderIndexes.CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                lView.push(factory);
            }
            else {
                lInjectablesBlueprint[existingFactoryIndex] = factory;
                lView[existingFactoryIndex] = factory;
            }
        }
        else {
            // Multi provider case:
            // We create a multi factory which is going to aggregate all the values.
            // Since the output of such a factory depends on content or view injection,
            // we create two of them, which are linked together.
            //
            // The first one (for view providers) is always in the first block of the injectables array,
            // and the second one (for providers) is always in the second block.
            // This is important because view providers have higher priority. When a multi token
            // is being looked up, the view providers should be found first.
            // Note that it is not possible to have a multi factory in the third block (directive block).
            //
            // The algorithm to process multi providers is as follows:
            // 1) If the multi provider comes from the `viewProviders` of the component:
            //   a) If the special view providers factory doesn't exist, it is created and pushed.
            //   b) Else, the multi provider is added to the existing multi factory.
            // 2) If the multi provider comes from the `providers` of the component or of another
            // directive:
            //   a) If the multi factory doesn't exist, it is created and provider pushed into it.
            //      It is also linked to the multi factory for view providers, if it exists.
            //   b) Else, the multi provider is added to the existing multi factory.
            const existingProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex + cptViewProvidersCount, endIndex);
            const existingViewProvidersFactoryIndex = indexOf(token, tInjectables, beginIndex, beginIndex + cptViewProvidersCount);
            const doesProvidersFactoryExist = existingProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingProvidersFactoryIndex];
            const doesViewProvidersFactoryExist = existingViewProvidersFactoryIndex >= 0 &&
                lInjectablesBlueprint[existingViewProvidersFactoryIndex];
            if (isViewProvider && !doesViewProvidersFactoryExist ||
                !isViewProvider && !doesProvidersFactoryExist) {
                // Cases 1.a and 2.a
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, token);
                const factory = multiFactory(isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver, lInjectablesBlueprint.length, isViewProvider, isComponent, providerFactory);
                if (!isViewProvider && doesViewProvidersFactoryExist) {
                    lInjectablesBlueprint[existingViewProvidersFactoryIndex].providerFactory = factory;
                }
                registerDestroyHooksIfSupported(tView, provider, tInjectables.length, 0);
                tInjectables.push(token);
                tNode.directiveStart++;
                tNode.directiveEnd++;
                if (isViewProvider) {
                    tNode.providerIndexes += 1048576 /* TNodeProviderIndexes.CptViewProvidersCountShifter */;
                }
                lInjectablesBlueprint.push(factory);
                lView.push(factory);
            }
            else {
                // Cases 1.b and 2.b
                const indexInFactory = multiFactoryAdd(lInjectablesBlueprint[isViewProvider ? existingViewProvidersFactoryIndex :
                    existingProvidersFactoryIndex], providerFactory, !isViewProvider && isComponent);
                registerDestroyHooksIfSupported(tView, provider, existingProvidersFactoryIndex > -1 ? existingProvidersFactoryIndex :
                    existingViewProvidersFactoryIndex, indexInFactory);
            }
            if (!isViewProvider && isComponent && doesViewProvidersFactoryExist) {
                lInjectablesBlueprint[existingViewProvidersFactoryIndex].componentProviders++;
            }
        }
    }
}
/**
 * Registers the `ngOnDestroy` hook of a provider, if the provider supports destroy hooks.
 * @param tView `TView` in which to register the hook.
 * @param provider Provider whose hook should be registered.
 * @param contextIndex Index under which to find the context for the hook when it's being invoked.
 * @param indexInFactory Only required for `multi` providers. Index of the provider in the multi
 * provider factory.
 */
function registerDestroyHooksIfSupported(tView, provider, contextIndex, indexInFactory) {
    const providerIsTypeProvider = isTypeProvider(provider);
    const providerIsClassProvider = isClassProvider(provider);
    if (providerIsTypeProvider || providerIsClassProvider) {
        // Resolve forward references as `useClass` can hold a forward reference.
        const classToken = providerIsClassProvider ? resolveForwardRef(provider.useClass) : provider;
        const prototype = classToken.prototype;
        const ngOnDestroy = prototype.ngOnDestroy;
        if (ngOnDestroy) {
            const hooks = tView.destroyHooks || (tView.destroyHooks = []);
            if (!providerIsTypeProvider && provider.multi) {
                ngDevMode &&
                    assertDefined(indexInFactory, 'indexInFactory when registering multi factory destroy hook');
                const existingCallbacksIndex = hooks.indexOf(contextIndex);
                if (existingCallbacksIndex === -1) {
                    hooks.push(contextIndex, [indexInFactory, ngOnDestroy]);
                }
                else {
                    hooks[existingCallbacksIndex + 1].push(indexInFactory, ngOnDestroy);
                }
            }
            else {
                hooks.push(contextIndex, ngOnDestroy);
            }
        }
    }
}
/**
 * Add a factory in a multi factory.
 * @returns Index at which the factory was inserted.
 */
function multiFactoryAdd(multiFactory, factory, isComponentProvider) {
    if (isComponentProvider) {
        multiFactory.componentProviders++;
    }
    return multiFactory.multi.push(factory) - 1;
}
/**
 * Returns the index of item in the array, but only in the begin to end range.
 */
function indexOf(item, arr, begin, end) {
    for (let i = begin; i < end; i++) {
        if (arr[i] === item)
            return i;
    }
    return -1;
}
/**
 * Use this with `multi` `providers`.
 */
function multiProvidersFactoryResolver(_, tData, lData, tNode) {
    return multiResolve(this.multi, []);
}
/**
 * Use this with `multi` `viewProviders`.
 *
 * This factory knows how to concatenate itself with the existing `multi` `providers`.
 */
function multiViewProvidersFactoryResolver(_, tData, lView, tNode) {
    const factories = this.multi;
    let result;
    if (this.providerFactory) {
        const componentCount = this.providerFactory.componentProviders;
        const multiProviders = getNodeInjectable(lView, lView[TVIEW], this.providerFactory.index, tNode);
        // Copy the section of the array which contains `multi` `providers` from the component
        result = multiProviders.slice(0, componentCount);
        // Insert the `viewProvider` instances.
        multiResolve(factories, result);
        // Copy the section of the array which contains `multi` `providers` from other directives
        for (let i = componentCount; i < multiProviders.length; i++) {
            result.push(multiProviders[i]);
        }
    }
    else {
        result = [];
        // Insert the `viewProvider` instances.
        multiResolve(factories, result);
    }
    return result;
}
/**
 * Maps an array of factories into an array of values.
 */
function multiResolve(factories, result) {
    for (let i = 0; i < factories.length; i++) {
        const factory = factories[i];
        result.push(factory());
    }
    return result;
}
/**
 * Creates a multi factory.
 */
function multiFactory(factoryFn, index, isViewProvider, isComponent, f) {
    const factory = new NodeInjectorFactory(factoryFn, isViewProvider, ɵɵdirectiveInject);
    factory.multi = [];
    factory.index = index;
    factory.componentProviders = 0;
    multiFactoryAdd(factory, f, isComponent && !isViewProvider);
    return factory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlfc2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpX3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBELE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFpQixNQUFNLDJCQUEyQixDQUFDO0FBQzFGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUMsMkJBQTJCLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUUsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3pHLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXJELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RCxPQUFPLEVBQWdDLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzlFLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUk1RDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLEdBQW9CLEVBQUUsU0FBcUIsRUFBRSxhQUF5QjtJQUN4RSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFD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QUM7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0tBQ3hCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxZQUFZLENBQ2pCLFNBRXFDLEVBQ3JDLEtBQWEsRUFBRSxjQUF1QixFQUFFLFdBQW9CLEVBQzVELENBQVk7SUFDZCxNQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RixPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNuQixPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN0QixPQUFPLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFdBQVcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIFByb3ZpZGVyfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtpc0NsYXNzUHJvdmlkZXIsIGlzVHlwZVByb3ZpZGVyLCBTaW5nbGVQcm92aWRlcn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge3Byb3ZpZGVyVG9GYWN0b3J5fSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtlbWl0UHJvdmlkZXJDb25maWd1cmVkRXZlbnQsIHJ1bkluSW5qZWN0b3JQcm9maWxlckNvbnRleHR9IGZyb20gJy4vZGVidWcvaW5qZWN0b3JfcHJvZmlsZXInO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUsIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge8m1ybVkaXJlY3RpdmVJbmplY3R9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0Rlc3Ryb3lIb29rRGF0YSwgTFZpZXcsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgZ2V0VFZpZXd9IGZyb20gJy4vc3RhdGUnO1xuXG5cblxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgcHJvdmlkZXJzIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRoZSBEaXJlY3RpdmVEZWYuXG4gKlxuICogV2hlbiBpbnNlcnRpbmcgdGhlIHRva2VucyBhbmQgdGhlIGZhY3RvcmllcyBpbiB0aGVpciByZXNwZWN0aXZlIGFycmF5cywgd2UgY2FuIGFzc3VtZSB0aGF0XG4gKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgZmlyc3QgZm9yIHRoZSBjb21wb25lbnQgKGlmIGFueSksIGFuZCB0aGVuIGZvciBvdGhlciBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lXG4gKiBub2RlLlxuICogQXMgYSBjb25zZXF1ZW5jZSx0aGUgcHJvdmlkZXJzIGFyZSBhbHdheXMgcHJvY2Vzc2VkIGluIHRoYXQgb3JkZXI6XG4gKiAxKSBUaGUgdmlldyBwcm92aWRlcnMgb2YgdGhlIGNvbXBvbmVudFxuICogMikgVGhlIHByb3ZpZGVycyBvZiB0aGUgY29tcG9uZW50XG4gKiAzKSBUaGUgcHJvdmlkZXJzIG9mIHRoZSBvdGhlciBkaXJlY3RpdmVzXG4gKiBUaGlzIG1hdGNoZXMgdGhlIHN0cnVjdHVyZSBvZiB0aGUgaW5qZWN0YWJsZXMgYXJyYXlzIG9mIGEgdmlldyAoZm9yIGVhY2ggbm9kZSkuXG4gKiBTbyB0aGUgdG9rZW5zIGFuZCB0aGUgZmFjdG9yaWVzIGNhbiBiZSBwdXNoZWQgYXQgdGhlIGVuZCBvZiB0aGUgYXJyYXlzLCBleGNlcHRcbiAqIGluIG9uZSBjYXNlIGZvciBtdWx0aSBwcm92aWRlcnMuXG4gKlxuICogQHBhcmFtIGRlZiB0aGUgZGlyZWN0aXZlIGRlZmluaXRpb25cbiAqIEBwYXJhbSBwcm92aWRlcnM6IEFycmF5IG9mIGBwcm92aWRlcnNgLlxuICogQHBhcmFtIHZpZXdQcm92aWRlcnM6IEFycmF5IG9mIGB2aWV3UHJvdmlkZXJzYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVyc1Jlc29sdmVyPFQ+KFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBwcm92aWRlcnM6IFByb3ZpZGVyW10sIHZpZXdQcm92aWRlcnM6IFByb3ZpZGVyW10pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudERlZihkZWYpO1xuXG4gICAgLy8gVGhlIGxpc3Qgb2YgdmlldyBwcm92aWRlcnMgaXMgcHJvY2Vzc2VkIGZpcnN0LCBhbmQgdGhlIGZsYWdzIGFyZSB1cGRhdGVkXG4gICAgcmVzb2x2ZVByb3ZpZGVyKHZpZXdQcm92aWRlcnMsIHRWaWV3LmRhdGEsIHRWaWV3LmJsdWVwcmludCwgaXNDb21wb25lbnQsIHRydWUpO1xuXG4gICAgLy8gVGhlbiwgdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGlzIHByb2Nlc3NlZCwgYW5kIHRoZSBmbGFncyBhcmUgdXBkYXRlZFxuICAgIHJlc29sdmVQcm92aWRlcihwcm92aWRlcnMsIHRWaWV3LmRhdGEsIHRWaWV3LmJsdWVwcmludCwgaXNDb21wb25lbnQsIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlc29sdmVzIGEgcHJvdmlkZXIgYW5kIHB1Ymxpc2hlcyBpdCB0byB0aGUgREkgc3lzdGVtLlxuICovXG5mdW5jdGlvbiByZXNvbHZlUHJvdmlkZXIoXG4gICAgcHJvdmlkZXI6IFByb3ZpZGVyLCB0SW5qZWN0YWJsZXM6IFREYXRhLCBsSW5qZWN0YWJsZXNCbHVlcHJpbnQ6IE5vZGVJbmplY3RvckZhY3RvcnlbXSxcbiAgICBpc0NvbXBvbmVudDogYm9vbGVhbiwgaXNWaWV3UHJvdmlkZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gIGlmIChBcnJheS5pc0FycmF5KHByb3ZpZGVyKSkge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNhbGwgYHJlc29sdmVQcm92aWRlcmBcbiAgICAvLyBSZWN1cnNpb24gaXMgT0sgaW4gdGhpcyBjYXNlIGJlY2F1c2UgdGhpcyBjb2RlIHdpbGwgbm90IGJlIGluIGhvdC1wYXRoIG9uY2Ugd2UgaW1wbGVtZW50XG4gICAgLy8gY2xvbmluZyBvZiB0aGUgaW5pdGlhbCBzdGF0ZS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXNvbHZlUHJvdmlkZXIoXG4gICAgICAgICAgcHJvdmlkZXJbaV0sIHRJbmplY3RhYmxlcywgbEluamVjdGFibGVzQmx1ZXByaW50LCBpc0NvbXBvbmVudCwgaXNWaWV3UHJvdmlkZXIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICAgIGxldCB0b2tlbjogYW55ID0gaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcblxuICAgIGNvbnN0IHByb3ZpZGVyRmFjdG9yeSA9IHByb3ZpZGVyVG9GYWN0b3J5KHByb3ZpZGVyKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBjb25zdCBpbmplY3RvciA9XG4gICAgICAgICAgbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgcnVuSW5JbmplY3RvclByb2ZpbGVyQ29udGV4dChpbmplY3RvciwgdG9rZW4sICgpID0+IHtcbiAgICAgICAgZW1pdFByb3ZpZGVyQ29uZmlndXJlZEV2ZW50KHByb3ZpZGVyIGFzIFNpbmdsZVByb3ZpZGVyLCBpc1ZpZXdQcm92aWRlcik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBiZWdpbkluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gICAgY29uc3QgZW5kSW5kZXggPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG5cbiAgICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8ICFwcm92aWRlci5tdWx0aSkge1xuICAgICAgLy8gU2luZ2xlIHByb3ZpZGVyIGNhc2U6IHRoZSBmYWN0b3J5IGlzIGNyZWF0ZWQgYW5kIHB1c2hlZCBpbW1lZGlhdGVseVxuICAgICAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KHByb3ZpZGVyRmFjdG9yeSwgaXNWaWV3UHJvdmlkZXIsIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICAgICAgY29uc3QgZXhpc3RpbmdGYWN0b3J5SW5kZXggPSBpbmRleE9mKFxuICAgICAgICAgIHRva2VuLCB0SW5qZWN0YWJsZXMsIGlzVmlld1Byb3ZpZGVyID8gYmVnaW5JbmRleCA6IGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsXG4gICAgICAgICAgZW5kSW5kZXgpO1xuICAgICAgaWYgKGV4aXN0aW5nRmFjdG9yeUluZGV4ID09PSAtMSkge1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KSxcbiAgICAgICAgICAgIHRWaWV3LCB0b2tlbik7XG4gICAgICAgIHJlZ2lzdGVyRGVzdHJveUhvb2tzSWZTdXBwb3J0ZWQodFZpZXcsIHByb3ZpZGVyLCB0SW5qZWN0YWJsZXMubGVuZ3RoKTtcbiAgICAgICAgdEluamVjdGFibGVzLnB1c2godG9rZW4pO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVTdGFydCsrO1xuICAgICAgICB0Tm9kZS5kaXJlY3RpdmVFbmQrKztcbiAgICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyKSB7XG4gICAgICAgICAgdE5vZGUucHJvdmlkZXJJbmRleGVzICs9IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50LnB1c2goZmFjdG9yeSk7XG4gICAgICAgIGxWaWV3LnB1c2goZmFjdG9yeSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgICAgbFZpZXdbZXhpc3RpbmdGYWN0b3J5SW5kZXhdID0gZmFjdG9yeTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVsdGkgcHJvdmlkZXIgY2FzZTpcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIG11bHRpIGZhY3Rvcnkgd2hpY2ggaXMgZ29pbmcgdG8gYWdncmVnYXRlIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgLy8gU2luY2UgdGhlIG91dHB1dCBvZiBzdWNoIGEgZmFjdG9yeSBkZXBlbmRzIG9uIGNvbnRlbnQgb3IgdmlldyBpbmplY3Rpb24sXG4gICAgICAvLyB3ZSBjcmVhdGUgdHdvIG9mIHRoZW0sIHdoaWNoIGFyZSBsaW5rZWQgdG9nZXRoZXIuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIGZpcnN0IG9uZSAoZm9yIHZpZXcgcHJvdmlkZXJzKSBpcyBhbHdheXMgaW4gdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBpbmplY3RhYmxlcyBhcnJheSxcbiAgICAgIC8vIGFuZCB0aGUgc2Vjb25kIG9uZSAoZm9yIHByb3ZpZGVycykgaXMgYWx3YXlzIGluIHRoZSBzZWNvbmQgYmxvY2suXG4gICAgICAvLyBUaGlzIGlzIGltcG9ydGFudCBiZWNhdXNlIHZpZXcgcHJvdmlkZXJzIGhhdmUgaGlnaGVyIHByaW9yaXR5LiBXaGVuIGEgbXVsdGkgdG9rZW5cbiAgICAgIC8vIGlzIGJlaW5nIGxvb2tlZCB1cCwgdGhlIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBmb3VuZCBmaXJzdC5cbiAgICAgIC8vIE5vdGUgdGhhdCBpdCBpcyBub3QgcG9zc2libGUgdG8gaGF2ZSBhIG11bHRpIGZhY3RvcnkgaW4gdGhlIHRoaXJkIGJsb2NrIChkaXJlY3RpdmUgYmxvY2spLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBhbGdvcml0aG0gdG8gcHJvY2VzcyBtdWx0aSBwcm92aWRlcnMgaXMgYXMgZm9sbG93czpcbiAgICAgIC8vIDEpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgdmlld1Byb3ZpZGVyc2Agb2YgdGhlIGNvbXBvbmVudDpcbiAgICAgIC8vICAgYSkgSWYgdGhlIHNwZWNpYWwgdmlldyBwcm92aWRlcnMgZmFjdG9yeSBkb2Vzbid0IGV4aXN0LCBpdCBpcyBjcmVhdGVkIGFuZCBwdXNoZWQuXG4gICAgICAvLyAgIGIpIEVsc2UsIHRoZSBtdWx0aSBwcm92aWRlciBpcyBhZGRlZCB0byB0aGUgZXhpc3RpbmcgbXVsdGkgZmFjdG9yeS5cbiAgICAgIC8vIDIpIElmIHRoZSBtdWx0aSBwcm92aWRlciBjb21lcyBmcm9tIHRoZSBgcHJvdmlkZXJzYCBvZiB0aGUgY29tcG9uZW50IG9yIG9mIGFub3RoZXJcbiAgICAgIC8vIGRpcmVjdGl2ZTpcbiAgICAgIC8vICAgYSkgSWYgdGhlIG11bHRpIGZhY3RvcnkgZG9lc24ndCBleGlzdCwgaXQgaXMgY3JlYXRlZCBhbmQgcHJvdmlkZXIgcHVzaGVkIGludG8gaXQuXG4gICAgICAvLyAgICAgIEl0IGlzIGFsc28gbGlua2VkIHRvIHRoZSBtdWx0aSBmYWN0b3J5IGZvciB2aWV3IHByb3ZpZGVycywgaWYgaXQgZXhpc3RzLlxuICAgICAgLy8gICBiKSBFbHNlLCB0aGUgbXVsdGkgcHJvdmlkZXIgaXMgYWRkZWQgdG8gdGhlIGV4aXN0aW5nIG11bHRpIGZhY3RvcnkuXG5cbiAgICAgIGNvbnN0IGV4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4ID1cbiAgICAgICAgICBpbmRleE9mKHRva2VuLCB0SW5qZWN0YWJsZXMsIGJlZ2luSW5kZXggKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQsIGVuZEluZGV4KTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA9XG4gICAgICAgICAgaW5kZXhPZih0b2tlbiwgdEluamVjdGFibGVzLCBiZWdpbkluZGV4LCBiZWdpbkluZGV4ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50KTtcbiAgICAgIGNvbnN0IGRvZXNQcm92aWRlcnNGYWN0b3J5RXhpc3QgPSBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+PSAwICYmXG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nUHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcbiAgICAgIGNvbnN0IGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0ID0gZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4ID49IDAgJiZcbiAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnRbZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4XTtcblxuICAgICAgaWYgKGlzVmlld1Byb3ZpZGVyICYmICFkb2VzVmlld1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCB8fFxuICAgICAgICAgICFpc1ZpZXdQcm92aWRlciAmJiAhZG9lc1Byb3ZpZGVyc0ZhY3RvcnlFeGlzdCkge1xuICAgICAgICAvLyBDYXNlcyAxLmEgYW5kIDIuYVxuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KSxcbiAgICAgICAgICAgIHRWaWV3LCB0b2tlbik7XG4gICAgICAgIGNvbnN0IGZhY3RvcnkgPSBtdWx0aUZhY3RvcnkoXG4gICAgICAgICAgICBpc1ZpZXdQcm92aWRlciA/IG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlciA6IG11bHRpUHJvdmlkZXJzRmFjdG9yeVJlc29sdmVyLFxuICAgICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50Lmxlbmd0aCwgaXNWaWV3UHJvdmlkZXIsIGlzQ29tcG9uZW50LCBwcm92aWRlckZhY3RvcnkpO1xuICAgICAgICBpZiAoIWlzVmlld1Byb3ZpZGVyICYmIGRvZXNWaWV3UHJvdmlkZXJzRmFjdG9yeUV4aXN0KSB7XG4gICAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0ucHJvdmlkZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuICAgICAgICByZWdpc3RlckRlc3Ryb3lIb29rc0lmU3VwcG9ydGVkKHRWaWV3LCBwcm92aWRlciwgdEluamVjdGFibGVzLmxlbmd0aCwgMCk7XG4gICAgICAgIHRJbmplY3RhYmxlcy5wdXNoKHRva2VuKTtcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3RhcnQrKztcbiAgICAgICAgdE5vZGUuZGlyZWN0aXZlRW5kKys7XG4gICAgICAgIGlmIChpc1ZpZXdQcm92aWRlcikge1xuICAgICAgICAgIHROb2RlLnByb3ZpZGVySW5kZXhlcyArPSBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyO1xuICAgICAgICB9XG4gICAgICAgIGxJbmplY3RhYmxlc0JsdWVwcmludC5wdXNoKGZhY3RvcnkpO1xuICAgICAgICBsVmlldy5wdXNoKGZhY3RvcnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2FzZXMgMS5iIGFuZCAyLmJcbiAgICAgICAgY29uc3QgaW5kZXhJbkZhY3RvcnkgPSBtdWx0aUZhY3RvcnlBZGQoXG4gICAgICAgICAgICBsSW5qZWN0YWJsZXNCbHVlcHJpbnQhXG4gICAgICAgICAgICAgICAgW2lzVmlld1Byb3ZpZGVyID8gZXhpc3RpbmdWaWV3UHJvdmlkZXJzRmFjdG9yeUluZGV4IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0sXG4gICAgICAgICAgICBwcm92aWRlckZhY3RvcnksICFpc1ZpZXdQcm92aWRlciAmJiBpc0NvbXBvbmVudCk7XG4gICAgICAgIHJlZ2lzdGVyRGVzdHJveUhvb2tzSWZTdXBwb3J0ZWQoXG4gICAgICAgICAgICB0VmlldywgcHJvdmlkZXIsXG4gICAgICAgICAgICBleGlzdGluZ1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCA+IC0xID8gZXhpc3RpbmdQcm92aWRlcnNGYWN0b3J5SW5kZXggOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleCxcbiAgICAgICAgICAgIGluZGV4SW5GYWN0b3J5KTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNWaWV3UHJvdmlkZXIgJiYgaXNDb21wb25lbnQgJiYgZG9lc1ZpZXdQcm92aWRlcnNGYWN0b3J5RXhpc3QpIHtcbiAgICAgICAgbEluamVjdGFibGVzQmx1ZXByaW50W2V4aXN0aW5nVmlld1Byb3ZpZGVyc0ZhY3RvcnlJbmRleF0uY29tcG9uZW50UHJvdmlkZXJzISsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgYG5nT25EZXN0cm95YCBob29rIG9mIGEgcHJvdmlkZXIsIGlmIHRoZSBwcm92aWRlciBzdXBwb3J0cyBkZXN0cm95IGhvb2tzLlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgaW4gd2hpY2ggdG8gcmVnaXN0ZXIgdGhlIGhvb2suXG4gKiBAcGFyYW0gcHJvdmlkZXIgUHJvdmlkZXIgd2hvc2UgaG9vayBzaG91bGQgYmUgcmVnaXN0ZXJlZC5cbiAqIEBwYXJhbSBjb250ZXh0SW5kZXggSW5kZXggdW5kZXIgd2hpY2ggdG8gZmluZCB0aGUgY29udGV4dCBmb3IgdGhlIGhvb2sgd2hlbiBpdCdzIGJlaW5nIGludm9rZWQuXG4gKiBAcGFyYW0gaW5kZXhJbkZhY3RvcnkgT25seSByZXF1aXJlZCBmb3IgYG11bHRpYCBwcm92aWRlcnMuIEluZGV4IG9mIHRoZSBwcm92aWRlciBpbiB0aGUgbXVsdGlcbiAqIHByb3ZpZGVyIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVzdHJveUhvb2tzSWZTdXBwb3J0ZWQoXG4gICAgdFZpZXc6IFRWaWV3LCBwcm92aWRlcjogRXhjbHVkZTxQcm92aWRlciwgYW55W10+LCBjb250ZXh0SW5kZXg6IG51bWJlcixcbiAgICBpbmRleEluRmFjdG9yeT86IG51bWJlcikge1xuICBjb25zdCBwcm92aWRlcklzVHlwZVByb3ZpZGVyID0gaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpO1xuICBjb25zdCBwcm92aWRlcklzQ2xhc3NQcm92aWRlciA9IGlzQ2xhc3NQcm92aWRlcihwcm92aWRlcik7XG5cbiAgaWYgKHByb3ZpZGVySXNUeXBlUHJvdmlkZXIgfHwgcHJvdmlkZXJJc0NsYXNzUHJvdmlkZXIpIHtcbiAgICAvLyBSZXNvbHZlIGZvcndhcmQgcmVmZXJlbmNlcyBhcyBgdXNlQ2xhc3NgIGNhbiBob2xkIGEgZm9yd2FyZCByZWZlcmVuY2UuXG4gICAgY29uc3QgY2xhc3NUb2tlbiA9IHByb3ZpZGVySXNDbGFzc1Byb3ZpZGVyID8gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlQ2xhc3MpIDogcHJvdmlkZXI7XG4gICAgY29uc3QgcHJvdG90eXBlID0gY2xhc3NUb2tlbi5wcm90b3R5cGU7XG4gICAgY29uc3QgbmdPbkRlc3Ryb3kgPSBwcm90b3R5cGUubmdPbkRlc3Ryb3k7XG5cbiAgICBpZiAobmdPbkRlc3Ryb3kpIHtcbiAgICAgIGNvbnN0IGhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzIHx8ICh0Vmlldy5kZXN0cm95SG9va3MgPSBbXSk7XG5cbiAgICAgIGlmICghcHJvdmlkZXJJc1R5cGVQcm92aWRlciAmJiAoKHByb3ZpZGVyIGFzIENsYXNzUHJvdmlkZXIpKS5tdWx0aSkge1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgaW5kZXhJbkZhY3RvcnksICdpbmRleEluRmFjdG9yeSB3aGVuIHJlZ2lzdGVyaW5nIG11bHRpIGZhY3RvcnkgZGVzdHJveSBob29rJyk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nQ2FsbGJhY2tzSW5kZXggPSBob29rcy5pbmRleE9mKGNvbnRleHRJbmRleCk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nQ2FsbGJhY2tzSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgaG9va3MucHVzaChjb250ZXh0SW5kZXgsIFtpbmRleEluRmFjdG9yeSwgbmdPbkRlc3Ryb3ldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAoaG9va3NbZXhpc3RpbmdDYWxsYmFja3NJbmRleCArIDFdIGFzIERlc3Ryb3lIb29rRGF0YSkucHVzaChpbmRleEluRmFjdG9yeSEsIG5nT25EZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaG9va3MucHVzaChjb250ZXh0SW5kZXgsIG5nT25EZXN0cm95KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgYSBmYWN0b3J5IGluIGEgbXVsdGkgZmFjdG9yeS5cbiAqIEByZXR1cm5zIEluZGV4IGF0IHdoaWNoIHRoZSBmYWN0b3J5IHdhcyBpbnNlcnRlZC5cbiAqL1xuZnVuY3Rpb24gbXVsdGlGYWN0b3J5QWRkKFxuICAgIG11bHRpRmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSwgZmFjdG9yeTogKCkgPT4gYW55LCBpc0NvbXBvbmVudFByb3ZpZGVyOiBib29sZWFuKTogbnVtYmVyIHtcbiAgaWYgKGlzQ29tcG9uZW50UHJvdmlkZXIpIHtcbiAgICBtdWx0aUZhY3RvcnkuY29tcG9uZW50UHJvdmlkZXJzISsrO1xuICB9XG4gIHJldHVybiBtdWx0aUZhY3RvcnkubXVsdGkhLnB1c2goZmFjdG9yeSkgLSAxO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIGl0ZW0gaW4gdGhlIGFycmF5LCBidXQgb25seSBpbiB0aGUgYmVnaW4gdG8gZW5kIHJhbmdlLlxuICovXG5mdW5jdGlvbiBpbmRleE9mKGl0ZW06IGFueSwgYXJyOiBhbnlbXSwgYmVnaW46IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGJlZ2luOyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYXJyW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogVXNlIHRoaXMgd2l0aCBgbXVsdGlgIGBwcm92aWRlcnNgLlxuICovXG5mdW5jdGlvbiBtdWx0aVByb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiB1bmRlZmluZWQsIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LFxuICAgIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpOiBhbnlbXSB7XG4gIHJldHVybiBtdWx0aVJlc29sdmUodGhpcy5tdWx0aSEsIFtdKTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB3aXRoIGBtdWx0aWAgYHZpZXdQcm92aWRlcnNgLlxuICpcbiAqIFRoaXMgZmFjdG9yeSBrbm93cyBob3cgdG8gY29uY2F0ZW5hdGUgaXRzZWxmIHdpdGggdGhlIGV4aXN0aW5nIGBtdWx0aWAgYHByb3ZpZGVyc2AuXG4gKi9cbmZ1bmN0aW9uIG11bHRpVmlld1Byb3ZpZGVyc0ZhY3RvcnlSZXNvbHZlcihcbiAgICB0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiB1bmRlZmluZWQsIHREYXRhOiBURGF0YSwgbFZpZXc6IExWaWV3LFxuICAgIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpOiBhbnlbXSB7XG4gIGNvbnN0IGZhY3RvcmllcyA9IHRoaXMubXVsdGkhO1xuICBsZXQgcmVzdWx0OiBhbnlbXTtcbiAgaWYgKHRoaXMucHJvdmlkZXJGYWN0b3J5KSB7XG4gICAgY29uc3QgY29tcG9uZW50Q291bnQgPSB0aGlzLnByb3ZpZGVyRmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMhO1xuICAgIGNvbnN0IG11bHRpUHJvdmlkZXJzID1cbiAgICAgICAgZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIGxWaWV3W1RWSUVXXSwgdGhpcy5wcm92aWRlckZhY3RvcnkhLmluZGV4ISwgdE5vZGUpO1xuICAgIC8vIENvcHkgdGhlIHNlY3Rpb24gb2YgdGhlIGFycmF5IHdoaWNoIGNvbnRhaW5zIGBtdWx0aWAgYHByb3ZpZGVyc2AgZnJvbSB0aGUgY29tcG9uZW50XG4gICAgcmVzdWx0ID0gbXVsdGlQcm92aWRlcnMuc2xpY2UoMCwgY29tcG9uZW50Q291bnQpO1xuICAgIC8vIEluc2VydCB0aGUgYHZpZXdQcm92aWRlcmAgaW5zdGFuY2VzLlxuICAgIG11bHRpUmVzb2x2ZShmYWN0b3JpZXMsIHJlc3VsdCk7XG4gICAgLy8gQ29weSB0aGUgc2VjdGlvbiBvZiB0aGUgYXJyYXkgd2hpY2ggY29udGFpbnMgYG11bHRpYCBgcHJvdmlkZXJzYCBmcm9tIG90aGVyIGRpcmVjdGl2ZXNcbiAgICBmb3IgKGxldCBpID0gY29tcG9uZW50Q291bnQ7IGkgPCBtdWx0aVByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2gobXVsdGlQcm92aWRlcnNbaV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgPSBbXTtcbiAgICAvLyBJbnNlcnQgdGhlIGB2aWV3UHJvdmlkZXJgIGluc3RhbmNlcy5cbiAgICBtdWx0aVJlc29sdmUoZmFjdG9yaWVzLCByZXN1bHQpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogTWFwcyBhbiBhcnJheSBvZiBmYWN0b3JpZXMgaW50byBhbiBhcnJheSBvZiB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIG11bHRpUmVzb2x2ZShmYWN0b3JpZXM6IEFycmF5PCgpID0+IGFueT4sIHJlc3VsdDogYW55W10pOiBhbnlbXSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjdG9yaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IGZhY3Rvcmllc1tpXSEgYXMgKCkgPT4gbnVsbDtcbiAgICByZXN1bHQucHVzaChmYWN0b3J5KCkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG11bHRpIGZhY3RvcnkuXG4gKi9cbmZ1bmN0aW9uIG11bHRpRmFjdG9yeShcbiAgICBmYWN0b3J5Rm46IChcbiAgICAgICAgdGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogdW5kZWZpbmVkLCB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlldyxcbiAgICAgICAgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkgPT4gYW55LFxuICAgIGluZGV4OiBudW1iZXIsIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuLCBpc0NvbXBvbmVudDogYm9vbGVhbixcbiAgICBmOiAoKSA9PiBhbnkpOiBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgY29uc3QgZmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGZhY3RvcnlGbiwgaXNWaWV3UHJvdmlkZXIsIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICBmYWN0b3J5Lm11bHRpID0gW107XG4gIGZhY3RvcnkuaW5kZXggPSBpbmRleDtcbiAgZmFjdG9yeS5jb21wb25lbnRQcm92aWRlcnMgPSAwO1xuICBtdWx0aUZhY3RvcnlBZGQoZmFjdG9yeSwgZiwgaXNDb21wb25lbnQgJiYgIWlzVmlld1Byb3ZpZGVyKTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG4iXX0=