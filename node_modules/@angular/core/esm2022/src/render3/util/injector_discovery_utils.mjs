/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getInjectorDef } from '../../di/interface/defs';
import { NullInjector } from '../../di/null_injector';
import { walkProviderTree } from '../../di/provider_collection';
import { EnvironmentInjector, R3Injector } from '../../di/r3_injector';
import { NgModuleRef as viewEngine_NgModuleRef } from '../../linker/ng_module_factory';
import { deepForEach } from '../../util/array_utils';
import { throwError } from '../../util/assert';
import { getComponentDef } from '../definition';
import { getNodeInjectorLView, getNodeInjectorTNode, getParentInjectorLocation, NodeInjector } from '../di';
import { getFrameworkDIDebugData } from '../debug/framework_injector_profiler';
import { INJECTOR, TVIEW } from '../interfaces/view';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './injector_utils';
/**
 * Discovers the dependencies of an injectable instance. Provides DI information about each
 * dependency that the injectable was instantiated with, including where they were provided from.
 *
 * @param injector An injector instance
 * @param token a DI token that was constructed by the given injector instance
 * @returns an object that contains the created instance of token as well as all of the dependencies
 * that it was instantiated with OR undefined if the token was not created within the given
 * injector.
 */
export function getDependenciesFromInjectable(injector, token) {
    // First we check to see if the token given maps to an actual instance in the injector given.
    // We use `self: true` because we only want to look at the injector we were given.
    // We use `optional: true` because it's possible that the token we were given was never
    // constructed by the injector we were given.
    const instance = injector.get(token, null, { self: true, optional: true });
    if (instance === null) {
        throw new Error(`Unable to determine instance of ${token} in given injector`);
    }
    let diResolver = injector;
    if (injector instanceof NodeInjector) {
        diResolver = getNodeInjectorLView(injector);
    }
    const { resolverToTokenToDependencies } = getFrameworkDIDebugData();
    let dependencies = resolverToTokenToDependencies.get(diResolver)?.get?.(token) ?? [];
    const resolutionPath = getInjectorResolutionPath(injector);
    dependencies = dependencies.map(dep => {
        const flags = dep.flags;
        dep.flags = {
            optional: (8 /* InternalInjectFlags.Optional */ & flags) === 8 /* InternalInjectFlags.Optional */,
            host: (1 /* InternalInjectFlags.Host */ & flags) === 1 /* InternalInjectFlags.Host */,
            self: (2 /* InternalInjectFlags.Self */ & flags) === 2 /* InternalInjectFlags.Self */,
            skipSelf: (4 /* InternalInjectFlags.SkipSelf */ & flags) === 4 /* InternalInjectFlags.SkipSelf */,
        };
        for (let i = 0; i < resolutionPath.length; i++) {
            const injectorToCheck = resolutionPath[i];
            // if skipSelf is true we skip the first injector
            if (i === 0 && dep.flags.skipSelf) {
                continue;
            }
            // host only applies to NodeInjectors
            if (dep.flags.host && injectorToCheck instanceof EnvironmentInjector) {
                break;
            }
            const instance = injectorToCheck.get(dep.token, null, { self: true, optional: true });
            if (instance !== null) {
                // if host flag is true we double check that we can get the service from the first element
                // in the resolution path by using the host flag. This is done to make sure that we've found
                // the correct providing injector, and not a node injector that is connected to our path via
                // a router outlet.
                if (dep.flags.host) {
                    const firstInjector = resolutionPath[0];
                    const lookupFromFirstInjector = firstInjector.get(dep.token, null, { ...dep.flags, optional: true });
                    if (lookupFromFirstInjector !== null) {
                        dep.providedIn = injectorToCheck;
                    }
                    break;
                }
                dep.providedIn = injectorToCheck;
                break;
            }
            // if self is true we stop after the first injector
            if (i === 0 && dep.flags.self) {
                break;
            }
        }
        return dep;
    });
    return { instance, dependencies };
}
/**
 * Gets the class associated with an injector that contains a provider `imports` array in it's
 * definition
 *
 * For Module Injectors this returns the NgModule constructor.
 *
 * For Standalone injectors this returns the standalone component constructor.
 *
 * @param injector Injector an injector instance
 * @returns the constructor where the `imports` array that configures this injector is located
 */
function getProviderImportsContainer(injector) {
    const { standaloneInjectorToComponent } = getFrameworkDIDebugData();
    // standalone components configure providers through a component def, so we have to
    // use the standalone component associated with this injector if Injector represents
    // a standalone components EnvironmentInjector
    if (standaloneInjectorToComponent.has(injector)) {
        return standaloneInjectorToComponent.get(injector);
    }
    // Module injectors configure providers through their NgModule def, so we use the
    // injector to lookup its NgModuleRef and through that grab its instance
    const defTypeRef = injector.get(viewEngine_NgModuleRef, null, { self: true, optional: true });
    // If we can't find an associated imports container, return null.
    // This could be the case if this function is called with an R3Injector that does not represent
    // a standalone component or NgModule.
    if (defTypeRef === null) {
        return null;
    }
    // In standalone applications, the root environment injector created by bootstrapApplication
    // may have no associated "instance".
    if (defTypeRef.instance === null) {
        return null;
    }
    return defTypeRef.instance.constructor;
}
/**
 * Gets the providers configured on a NodeInjector
 *
 * @param injector A NodeInjector instance
 * @returns ProviderRecord[] an array of objects representing the providers configured on this
 *     injector
 */
function getNodeInjectorProviders(injector) {
    const diResolver = getNodeInjectorLView(injector);
    const { resolverToProviders } = getFrameworkDIDebugData();
    return resolverToProviders.get(diResolver) ?? [];
}
/**
 * Gets a mapping of providers configured on an injector to their import paths
 *
 * ModuleA -> imports ModuleB
 * ModuleB -> imports ModuleC
 * ModuleB -> provides MyServiceA
 * ModuleC -> provides MyServiceB
 *
 * getProviderImportPaths(ModuleA)
 * > Map(2) {
 *   MyServiceA => [ModuleA, ModuleB]
 *   MyServiceB => [ModuleA, ModuleB, ModuleC]
 *  }
 *
 * @param providerImportsContainer constructor of class that contains an `imports` array in it's
 *     definition
 * @returns A Map object that maps providers to an array of constructors representing it's import
 *     path
 *
 */
function getProviderImportPaths(providerImportsContainer) {
    const providerToPath = new Map();
    const visitedContainers = new Set();
    const visitor = walkProviderTreeToDiscoverImportPaths(providerToPath, visitedContainers);
    walkProviderTree(providerImportsContainer, visitor, [], new Set());
    return providerToPath;
}
/**
 *
 * Higher order function that returns a visitor for WalkProviderTree
 *
 * Takes in a Map and Set to keep track of the providers and containers
 * visited, so that we can discover the import paths of these providers
 * during the traversal.
 *
 * This visitor takes advantage of the fact that walkProviderTree performs a
 * postorder traversal of the provider tree for the passed in container. Because postorder
 * traversal recursively processes subtrees from leaf nodes until the traversal reaches the root,
 * we write a visitor that constructs provider import paths in reverse.
 *
 *
 * We use the visitedContainers set defined outside this visitor
 * because we want to run some logic only once for
 * each container in the tree. That logic can be described as:
 *
 *
 * 1. for each discovered_provider and discovered_path in the incomplete provider paths we've
 * already discovered
 * 2. get the first container in discovered_path
 * 3. if that first container is in the imports array of the container we're visiting
 *    Then the container we're visiting is also in the import path of discovered_provider, so we
 *    unshift discovered_path with the container we're currently visiting
 *
 *
 * Example Run:
 * ```
 *                 ┌──────────┐
 *                 │containerA│
 *      ┌─imports-─┤          ├──imports─┐
 *      │          │  provA   │          │
 *      │          │  provB   │          │
 *      │          └──────────┘          │
 *      │                                │
 *     ┌▼─────────┐             ┌────────▼─┐
 *     │containerB│             │containerC│
 *     │          │             │          │
 *     │  provD   │             │  provF   │
 *     │  provE   │             │  provG   │
 *     └──────────┘             └──────────┘
 * ```
 *
 * Each step of the traversal,
 *
 * ```
 * visitor(provD, containerB)
 * providerToPath === Map { provD => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provE, containerB)
 * providerToPath === Map { provD => [containerB], provE => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provF, containerC)
 * providerToPath === Map { provD => [containerB], provE => [containerB], provF => [containerC] }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provG, containerC)
 * providerToPath === Map {
 *   provD => [containerB], provE => [containerB], provF => [containerC], provG => [containerC]
 * }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provA, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 *
 * visitor(provB, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 *   provB => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 * ```
 *
 * @param providerToPath Map map of providers to paths that this function fills
 * @param visitedContainers Set a set to keep track of the containers we've already visited
 * @return function(provider SingleProvider, container: Type<unknown> | InjectorType<unknown>) =>
 *     void
 */
function walkProviderTreeToDiscoverImportPaths(providerToPath, visitedContainers) {
    return (provider, container) => {
        // If the provider is not already in the providerToPath map,
        // add an entry with the provider as the key and an array containing the current container as
        // the value
        if (!providerToPath.has(provider)) {
            providerToPath.set(provider, [container]);
        }
        // This block will run exactly once for each container in the import tree.
        // This is where we run the logic to check the imports array of the current
        // container to see if it's the next container in the path for our currently
        // discovered providers.
        if (!visitedContainers.has(container)) {
            // Iterate through the providers we've already seen
            for (const prov of providerToPath.keys()) {
                const existingImportPath = providerToPath.get(prov);
                let containerDef = getInjectorDef(container);
                if (!containerDef) {
                    const ngModule = container.ngModule;
                    containerDef = getInjectorDef(ngModule);
                }
                if (!containerDef) {
                    return;
                }
                const lastContainerAddedToPath = existingImportPath[0];
                let isNextStepInPath = false;
                deepForEach(containerDef.imports, (moduleImport) => {
                    if (isNextStepInPath) {
                        return;
                    }
                    isNextStepInPath = moduleImport.ngModule === lastContainerAddedToPath ||
                        moduleImport === lastContainerAddedToPath;
                    if (isNextStepInPath) {
                        providerToPath.get(prov)?.unshift(container);
                    }
                });
            }
        }
        visitedContainers.add(container);
    };
}
/**
 * Gets the providers configured on an EnvironmentInjector
 *
 * @param injector EnvironmentInjector
 * @returns an array of objects representing the providers of the given injector
 */
function getEnvironmentInjectorProviders(injector) {
    const providerRecords = getFrameworkDIDebugData().resolverToProviders.get(injector) ?? [];
    // platform injector has no provider imports container so can we skip trying to
    // find import paths
    if (isPlatformInjector(injector)) {
        return providerRecords;
    }
    const providerImportsContainer = getProviderImportsContainer(injector);
    if (providerImportsContainer === null) {
        // There is a special case where the bootstrapped component does not
        // import any NgModules. In this case the environment injector connected to
        // that component is the root injector, which does not have a provider imports
        // container (and thus no concept of module import paths). Therefore we simply
        // return the provider records as is.
        if (isRootInjector(injector)) {
            return providerRecords;
        }
        throwError('Could not determine where injector providers were configured.');
    }
    const providerToPath = getProviderImportPaths(providerImportsContainer);
    return providerRecords.map(providerRecord => {
        let importPath = providerToPath.get(providerRecord.provider) ?? [providerImportsContainer];
        const def = getComponentDef(providerImportsContainer);
        const isStandaloneComponent = !!def?.standalone;
        // We prepend the component constructor in the standalone case
        // because walkProviderTree does not visit this constructor during it's traversal
        if (isStandaloneComponent) {
            importPath = [providerImportsContainer, ...providerToPath.get(providerRecord.provider) ?? []];
        }
        return { ...providerRecord, importPath };
    });
}
function isPlatformInjector(injector) {
    return injector instanceof R3Injector && injector.scopes.has('platform');
}
function isRootInjector(injector) {
    return injector instanceof R3Injector && injector.scopes.has('root');
}
/**
 * Gets the providers configured on an injector.
 *
 * @param injector the injector to lookup the providers of
 * @returns ProviderRecord[] an array of objects representing the providers of the given injector
 */
export function getInjectorProviders(injector) {
    if (injector instanceof NodeInjector) {
        return getNodeInjectorProviders(injector);
    }
    else if (injector instanceof EnvironmentInjector) {
        return getEnvironmentInjectorProviders(injector);
    }
    throwError('getInjectorProviders only supports NodeInjector and EnvironmentInjector');
}
export function getInjectorResolutionPath(injector) {
    const resolutionPath = [injector];
    getInjectorResolutionPathHelper(injector, resolutionPath);
    return resolutionPath;
}
function getInjectorResolutionPathHelper(injector, resolutionPath) {
    const parent = getInjectorParent(injector);
    // if getInjectorParent can't find a parent, then we've either reached the end
    // of the path, or we need to move from the Element Injector tree to the
    // module injector tree using the first injector in our path as the connection point.
    if (parent === null) {
        if (injector instanceof NodeInjector) {
            const firstInjector = resolutionPath[0];
            if (firstInjector instanceof NodeInjector) {
                const moduleInjector = getModuleInjectorOfNodeInjector(firstInjector);
                if (moduleInjector === null) {
                    throwError('NodeInjector must have some connection to the module injector tree');
                }
                resolutionPath.push(moduleInjector);
                getInjectorResolutionPathHelper(moduleInjector, resolutionPath);
            }
            return resolutionPath;
        }
    }
    else {
        resolutionPath.push(parent);
        getInjectorResolutionPathHelper(parent, resolutionPath);
    }
    return resolutionPath;
}
/**
 * Gets the parent of an injector.
 *
 * This function is not able to make the jump from the Element Injector Tree to the Module
 * injector tree. This is because the "parent" (the next step in the reoslution path)
 * of a root NodeInjector is dependent on which NodeInjector ancestor initiated
 * the DI lookup. See getInjectorResolutionPath for a function that can make this jump.
 *
 * In the below diagram:
 * ```ts
 * getInjectorParent(NodeInjectorB)
 *  > NodeInjectorA
 * getInjectorParent(NodeInjectorA) // or getInjectorParent(getInjectorParent(NodeInjectorB))
 *  > null // cannot jump to ModuleInjector tree
 * ```
 *
 * ```
 *                ┌───────┐                ┌───────────────────┐
 *    ┌───────────┤ModuleA├───Injector────►│EnvironmentInjector│
 *    │           └───┬───┘                └───────────────────┘
 *    │               │
 *    │           bootstraps
 *    │               │
 *    │               │
 *    │          ┌────▼─────┐                 ┌─────────────┐
 * declares      │ComponentA├────Injector────►│NodeInjectorA│
 *    │          └────┬─────┘                 └─────▲───────┘
 *    │               │                             │
 *    │            renders                        parent
 *    │               │                             │
 *    │          ┌────▼─────┐                 ┌─────┴───────┐
 *    └─────────►│ComponentB├────Injector────►│NodeInjectorB│
 *               └──────────┘                 └─────────────┘
 *```
 *
 * @param injector an Injector to get the parent of
 * @returns Injector the parent of the given injector
 */
function getInjectorParent(injector) {
    if (injector instanceof R3Injector) {
        return injector.parent;
    }
    let tNode;
    let lView;
    if (injector instanceof NodeInjector) {
        tNode = getNodeInjectorTNode(injector);
        lView = getNodeInjectorLView(injector);
    }
    else if (injector instanceof NullInjector) {
        return null;
    }
    else {
        throwError('getInjectorParent only support injectors of type R3Injector, NodeInjector, NullInjector');
    }
    const parentLocation = getParentInjectorLocation(tNode, lView);
    if (hasParentInjector(parentLocation)) {
        const parentInjectorIndex = getParentInjectorIndex(parentLocation);
        const parentLView = getParentInjectorView(parentLocation, lView);
        const parentTView = parentLView[TVIEW];
        const parentTNode = parentTView.data[parentInjectorIndex + 8 /* NodeInjectorOffset.TNODE */];
        return new NodeInjector(parentTNode, parentLView);
    }
    else {
        const chainedInjector = lView[INJECTOR];
        // Case where chainedInjector.injector is an OutletInjector and chainedInjector.injector.parent
        // is a NodeInjector.
        // todo(aleksanderbodurri): ideally nothing in packages/core should deal
        // directly with router concerns. Refactor this so that we can make the jump from
        // NodeInjector -> OutletInjector -> NodeInjector
        // without explictly relying on types contracts from packages/router
        const injectorParent = chainedInjector.injector?.parent;
        if (injectorParent instanceof NodeInjector) {
            return injectorParent;
        }
    }
    return null;
}
/**
 * Gets the module injector of a NodeInjector.
 *
 * @param injector NodeInjector to get module injector of
 * @returns Injector representing module injector of the given NodeInjector
 */
function getModuleInjectorOfNodeInjector(injector) {
    let lView;
    if (injector instanceof NodeInjector) {
        lView = getNodeInjectorLView(injector);
    }
    else {
        throwError('getModuleInjectorOfNodeInjector must be called with a NodeInjector');
    }
    const chainedInjector = lView[INJECTOR];
    const moduleInjector = chainedInjector.parentInjector;
    if (!moduleInjector) {
        throwError('NodeInjector must have some connection to the module injector tree');
    }
    return moduleInjector;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2luamVjdG9yX2Rpc2NvdmVyeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsY0FBYyxFQUFlLE1BQU0seUJBQXlCLENBQUM7QUFFckUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BELE9BQU8sRUFBaUIsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFckUsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3JGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUseUJBQXlCLEVBQUUsWUFBWSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzFHLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBSTdFLE9BQU8sRUFBQyxRQUFRLEVBQVMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFbEc7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QixDQUN6QyxRQUFrQixFQUNsQixLQUFnQztJQUNsQyw2RkFBNkY7SUFDN0Ysa0ZB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O1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLG1DQUEyQixDQUFVLENBQUM7UUFDOUYsT0FBTyxJQUFJLFlBQVksQ0FDbkIsV0FBb0UsRUFBRSxXQUFXLENBQUMsQ0FBQztLQUN4RjtTQUFNO1FBQ0wsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBb0IsQ0FBQztRQUUzRCwrRkFBK0Y7UUFDL0YscUJBQXFCO1FBQ3JCLHdFQUF3RTtRQUN4RSxpRkFBaUY7UUFDakYsaURBQWlEO1FBQ2pELG9FQUFvRTtRQUNwRSxNQUFNLGNBQWMsR0FBSSxlQUFlLENBQUMsUUFBZ0IsRUFBRSxNQUFrQixDQUFDO1FBRTdFLElBQUksY0FBYyxZQUFZLFlBQVksRUFBRTtZQUMxQyxPQUFPLGNBQWMsQ0FBQztTQUN2QjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLCtCQUErQixDQUFDLFFBQXNCO0lBQzdELElBQUksS0FBcUIsQ0FBQztJQUMxQixJQUFJLFFBQVEsWUFBWSxZQUFZLEVBQUU7UUFDcEMsS0FBSyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3hDO1NBQU07UUFDTCxVQUFVLENBQUMsb0VBQW9FLENBQUMsQ0FBQztLQUNsRjtJQUVELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQW9CLENBQUM7SUFDM0QsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQztJQUN0RCxJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ25CLFVBQVUsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO0tBQ2xGO0lBRUQsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZiwgSW5qZWN0b3JUeXBlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbnRlcm5hbEluamVjdEZsYWdzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtOdWxsSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL251bGxfaW5qZWN0b3InO1xuaW1wb3J0IHtTaW5nbGVQcm92aWRlciwgd2Fsa1Byb3ZpZGVyVHJlZX0gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3IsIFIzSW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtkZWVwRm9yRWFjaH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge3Rocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB0eXBlIHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4uL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0b3JMVmlldywgZ2V0Tm9kZUluamVjdG9yVE5vZGUsIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24sIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRGcmFtZXdvcmtESURlYnVnRGF0YX0gZnJvbSAnLi4vZGVidWcvZnJhbWV3b3JrX2luamVjdG9yX3Byb2ZpbGVyJztcbmltcG9ydCB7SW5qZWN0ZWRTZXJ2aWNlLCBQcm92aWRlclJlY29yZH0gZnJvbSAnLi4vZGVidWcvaW5qZWN0b3JfcHJvZmlsZXInO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTFZpZXcsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfdXRpbHMnO1xuXG4vKipcbiAqIERpc2NvdmVycyB0aGUgZGVwZW5kZW5jaWVzIG9mIGFuIGluamVjdGFibGUgaW5zdGFuY2UuIFByb3ZpZGVzIERJIGluZm9ybWF0aW9uIGFib3V0IGVhY2hcbiAqIGRlcGVuZGVuY3kgdGhhdCB0aGUgaW5qZWN0YWJsZSB3YXMgaW5zdGFudGlhdGVkIHdpdGgsIGluY2x1ZGluZyB3aGVyZSB0aGV5IHdlcmUgcHJvdmlkZWQgZnJvbS5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgQW4gaW5qZWN0b3IgaW5zdGFuY2VcbiAqIEBwYXJhbSB0b2tlbiBhIERJIHRva2VuIHRoYXQgd2FzIGNvbnN0cnVjdGVkIGJ5IHRoZSBnaXZlbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIGNyZWF0ZWQgaW5zdGFuY2Ugb2YgdG9rZW4gYXMgd2VsbCBhcyBhbGwgb2YgdGhlIGRlcGVuZGVuY2llc1xuICogdGhhdCBpdCB3YXMgaW5zdGFudGlhdGVkIHdpdGggT1IgdW5kZWZpbmVkIGlmIHRoZSB0b2tlbiB3YXMgbm90IGNyZWF0ZWQgd2l0aGluIHRoZSBnaXZlblxuICogaW5qZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZXBlbmRlbmNpZXNGcm9tSW5qZWN0YWJsZTxUPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4pOiB7aW5zdGFuY2U6IFQ7IGRlcGVuZGVuY2llczogSW5qZWN0ZWRTZXJ2aWNlW119fHVuZGVmaW5lZCB7XG4gIC8vIEZpcnN0IHdlIGNoZWNrIHRvIHNlZSBpZiB0aGUgdG9rZW4gZ2l2ZW4gbWFwcyB0byBhbiBhY3R1YWwgaW5zdGFuY2UgaW4gdGhlIGluamVjdG9yIGdpdmVuLlxuICAvLyBXZSB1c2UgYHNlbGY6IHRydWVgIGJlY2F1c2Ugd2Ugb25seSB3YW50IHRvIGxvb2sgYXQgdGhlIGluamVjdG9yIHdlIHdlcmUgZ2l2ZW4uXG4gIC8vIFdlIHVzZSBgb3B0aW9uYWw6IHRydWVgIGJlY2F1c2UgaXQncyBwb3NzaWJsZSB0aGF0IHRoZSB0b2tlbiB3ZSB3ZXJlIGdpdmVuIHdhcyBuZXZlclxuICAvLyBjb25zdHJ1Y3RlZCBieSB0aGUgaW5qZWN0b3Igd2Ugd2VyZSBnaXZlbi5cbiAgY29uc3QgaW5zdGFuY2UgPSBpbmplY3Rvci5nZXQodG9rZW4sIG51bGwsIHtzZWxmOiB0cnVlLCBvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoaW5zdGFuY2UgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgaW5zdGFuY2Ugb2YgJHt0b2tlbn0gaW4gZ2l2ZW4gaW5qZWN0b3JgKTtcbiAgfVxuXG4gIGxldCBkaVJlc29sdmVyOiBJbmplY3RvcnxMVmlldyA9IGluamVjdG9yO1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICBkaVJlc29sdmVyID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVyVG9Ub2tlblRvRGVwZW5kZW5jaWVzfSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG5cbiAgbGV0IGRlcGVuZGVuY2llcyA9XG4gICAgICByZXNvbHZlclRvVG9rZW5Ub0RlcGVuZGVuY2llcy5nZXQoZGlSZXNvbHZlcik/LmdldD8uKHRva2VuIGFzIFR5cGU8dW5rbm93bj4pID8/IFtdO1xuXG4gIGNvbnN0IHJlc29sdXRpb25QYXRoID0gZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aChpbmplY3Rvcik7XG4gIGRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcy5tYXAoZGVwID0+IHtcbiAgICBjb25zdCBmbGFncyA9IGRlcC5mbGFncyBhcyBJbnRlcm5hbEluamVjdEZsYWdzO1xuICAgIGRlcC5mbGFncyA9IHtcbiAgICAgIG9wdGlvbmFsOiAoSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5PcHRpb25hbCxcbiAgICAgIGhvc3Q6IChJbnRlcm5hbEluamVjdEZsYWdzLkhvc3QgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuSG9zdCxcbiAgICAgIHNlbGY6IChJbnRlcm5hbEluamVjdEZsYWdzLlNlbGYgJiBmbGFncykgPT09IEludGVybmFsSW5qZWN0RmxhZ3MuU2VsZixcbiAgICAgIHNraXBTZWxmOiAoSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZiAmIGZsYWdzKSA9PT0gSW50ZXJuYWxJbmplY3RGbGFncy5Ta2lwU2VsZixcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNvbHV0aW9uUGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5qZWN0b3JUb0NoZWNrID0gcmVzb2x1dGlvblBhdGhbaV07XG5cbiAgICAgIC8vIGlmIHNraXBTZWxmIGlzIHRydWUgd2Ugc2tpcCB0aGUgZmlyc3QgaW5qZWN0b3JcbiAgICAgIGlmIChpID09PSAwICYmIGRlcC5mbGFncy5za2lwU2VsZikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gaG9zdCBvbmx5IGFwcGxpZXMgdG8gTm9kZUluamVjdG9yc1xuICAgICAgaWYgKGRlcC5mbGFncy5ob3N0ICYmIGluamVjdG9yVG9DaGVjayBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluc3RhbmNlID1cbiAgICAgICAgICBpbmplY3RvclRvQ2hlY2suZ2V0KGRlcC50b2tlbiBhcyBUeXBlPHVua25vd24+LCBudWxsLCB7c2VsZjogdHJ1ZSwgb3B0aW9uYWw6IHRydWV9KTtcblxuICAgICAgaWYgKGluc3RhbmNlICE9PSBudWxsKSB7XG4gICAgICAgIC8vIGlmIGhvc3QgZmxhZyBpcyB0cnVlIHdlIGRvdWJsZSBjaGVjayB0aGF0IHdlIGNhbiBnZXQgdGhlIHNlcnZpY2UgZnJvbSB0aGUgZmlyc3QgZWxlbWVudFxuICAgICAgICAvLyBpbiB0aGUgcmVzb2x1dGlvbiBwYXRoIGJ5IHVzaW5nIHRoZSBob3N0IGZsYWcuIFRoaXMgaXMgZG9uZSB0byBtYWtlIHN1cmUgdGhhdCB3ZSd2ZSBmb3VuZFxuICAgICAgICAvLyB0aGUgY29ycmVjdCBwcm92aWRpbmcgaW5qZWN0b3IsIGFuZCBub3QgYSBub2RlIGluamVjdG9yIHRoYXQgaXMgY29ubmVjdGVkIHRvIG91ciBwYXRoIHZpYVxuICAgICAgICAvLyBhIHJvdXRlciBvdXRsZXQuXG4gICAgICAgIGlmIChkZXAuZmxhZ3MuaG9zdCkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0SW5qZWN0b3IgPSByZXNvbHV0aW9uUGF0aFswXTtcbiAgICAgICAgICBjb25zdCBsb29rdXBGcm9tRmlyc3RJbmplY3RvciA9XG4gICAgICAgICAgICAgIGZpcnN0SW5qZWN0b3IuZ2V0KGRlcC50b2tlbiBhcyBUeXBlPHVua25vd24+LCBudWxsLCB7Li4uZGVwLmZsYWdzLCBvcHRpb25hbDogdHJ1ZX0pO1xuXG4gICAgICAgICAgaWYgKGxvb2t1cEZyb21GaXJzdEluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICAgICAgICBkZXAucHJvdmlkZWRJbiA9IGluamVjdG9yVG9DaGVjaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlcC5wcm92aWRlZEluID0gaW5qZWN0b3JUb0NoZWNrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gaWYgc2VsZiBpcyB0cnVlIHdlIHN0b3AgYWZ0ZXIgdGhlIGZpcnN0IGluamVjdG9yXG4gICAgICBpZiAoaSA9PT0gMCAmJiBkZXAuZmxhZ3Muc2VsZikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVwO1xuICB9KTtcblxuICByZXR1cm4ge2luc3RhbmNlLCBkZXBlbmRlbmNpZXN9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGNsYXNzIGFzc29jaWF0ZWQgd2l0aCBhbiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgcHJvdmlkZXIgYGltcG9ydHNgIGFycmF5IGluIGl0J3NcbiAqIGRlZmluaXRpb25cbiAqXG4gKiBGb3IgTW9kdWxlIEluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIE5nTW9kdWxlIGNvbnN0cnVjdG9yLlxuICpcbiAqIEZvciBTdGFuZGFsb25lIGluamVjdG9ycyB0aGlzIHJldHVybnMgdGhlIHN0YW5kYWxvbmUgY29tcG9uZW50IGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciBhbiBpbmplY3RvciBpbnN0YW5jZVxuICogQHJldHVybnMgdGhlIGNvbnN0cnVjdG9yIHdoZXJlIHRoZSBgaW1wb3J0c2AgYXJyYXkgdGhhdCBjb25maWd1cmVzIHRoaXMgaW5qZWN0b3IgaXMgbG9jYXRlZFxuICovXG5mdW5jdGlvbiBnZXRQcm92aWRlckltcG9ydHNDb250YWluZXIoaW5qZWN0b3I6IEluamVjdG9yKTogVHlwZTx1bmtub3duPnxudWxsIHtcbiAgY29uc3Qge3N0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50fSA9IGdldEZyYW1ld29ya0RJRGVidWdEYXRhKCk7XG5cbiAgLy8gc3RhbmRhbG9uZSBjb21wb25lbnRzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCBhIGNvbXBvbmVudCBkZWYsIHNvIHdlIGhhdmUgdG9cbiAgLy8gdXNlIHRoZSBzdGFuZGFsb25lIGNvbXBvbmVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBpbmplY3RvciBpZiBJbmplY3RvciByZXByZXNlbnRzXG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnRzIEVudmlyb25tZW50SW5qZWN0b3JcbiAgaWYgKHN0YW5kYWxvbmVJbmplY3RvclRvQ29tcG9uZW50LmhhcyhpbmplY3RvcikpIHtcbiAgICByZXR1cm4gc3RhbmRhbG9uZUluamVjdG9yVG9Db21wb25lbnQuZ2V0KGluamVjdG9yKSE7XG4gIH1cblxuICAvLyBNb2R1bGUgaW5qZWN0b3JzIGNvbmZpZ3VyZSBwcm92aWRlcnMgdGhyb3VnaCB0aGVpciBOZ01vZHVsZSBkZWYsIHNvIHdlIHVzZSB0aGVcbiAgLy8gaW5qZWN0b3IgdG8gbG9va3VwIGl0cyBOZ01vZHVsZVJlZiBhbmQgdGhyb3VnaCB0aGF0IGdyYWIgaXRzIGluc3RhbmNlXG4gIGNvbnN0IGRlZlR5cGVSZWYgPSBpbmplY3Rvci5nZXQodmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgbnVsbCwge3NlbGY6IHRydWUsIG9wdGlvbmFsOiB0cnVlfSkhO1xuXG4gIC8vIElmIHdlIGNhbid0IGZpbmQgYW4gYXNzb2NpYXRlZCBpbXBvcnRzIGNvbnRhaW5lciwgcmV0dXJuIG51bGwuXG4gIC8vIFRoaXMgY291bGQgYmUgdGhlIGNhc2UgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhbiBSM0luamVjdG9yIHRoYXQgZG9lcyBub3QgcmVwcmVzZW50XG4gIC8vIGEgc3RhbmRhbG9uZSBjb21wb25lbnQgb3IgTmdNb2R1bGUuXG4gIGlmIChkZWZUeXBlUmVmID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBJbiBzdGFuZGFsb25lIGFwcGxpY2F0aW9ucywgdGhlIHJvb3QgZW52aXJvbm1lbnQgaW5qZWN0b3IgY3JlYXRlZCBieSBib290c3RyYXBBcHBsaWNhdGlvblxuICAvLyBtYXkgaGF2ZSBubyBhc3NvY2lhdGVkIFwiaW5zdGFuY2VcIi5cbiAgaWYgKGRlZlR5cGVSZWYuaW5zdGFuY2UgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBkZWZUeXBlUmVmLmluc3RhbmNlLmNvbnN0cnVjdG9yO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHByb3ZpZGVycyBjb25maWd1cmVkIG9uIGEgTm9kZUluamVjdG9yXG4gKlxuICogQHBhcmFtIGluamVjdG9yIEEgTm9kZUluamVjdG9yIGluc3RhbmNlXG4gKiBAcmV0dXJucyBQcm92aWRlclJlY29yZFtdIGFuIGFycmF5IG9mIG9iamVjdHMgcmVwcmVzZW50aW5nIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiB0aGlzXG4gKiAgICAgaW5qZWN0b3JcbiAqL1xuZnVuY3Rpb24gZ2V0Tm9kZUluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yOiBOb2RlSW5qZWN0b3IpOiBQcm92aWRlclJlY29yZFtdIHtcbiAgY29uc3QgZGlSZXNvbHZlciA9IGdldE5vZGVJbmplY3RvckxWaWV3KGluamVjdG9yKTtcbiAgY29uc3Qge3Jlc29sdmVyVG9Qcm92aWRlcnN9ID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKTtcbiAgcmV0dXJuIHJlc29sdmVyVG9Qcm92aWRlcnMuZ2V0KGRpUmVzb2x2ZXIpID8/IFtdO1xufVxuXG4vKipcbiAqIEdldHMgYSBtYXBwaW5nIG9mIHByb3ZpZGVycyBjb25maWd1cmVkIG9uIGFuIGluamVjdG9yIHRvIHRoZWlyIGltcG9ydCBwYXRoc1xuICpcbiAqIE1vZHVsZUEgLT4gaW1wb3J0cyBNb2R1bGVCXG4gKiBNb2R1bGVCIC0+IGltcG9ydHMgTW9kdWxlQ1xuICogTW9kdWxlQiAtPiBwcm92aWRlcyBNeVNlcnZpY2VBXG4gKiBNb2R1bGVDIC0+IHByb3ZpZGVzIE15U2VydmljZUJcbiAqXG4gKiBnZXRQcm92aWRlckltcG9ydFBhdGhzKE1vZHVsZUEpXG4gKiA+IE1hcCgyKSB7XG4gKiAgIE15U2VydmljZUEgPT4gW01vZHVsZUEsIE1vZHVsZUJdXG4gKiAgIE15U2VydmljZUIgPT4gW01vZHVsZUEsIE1vZHVsZUIsIE1vZHVsZUNdXG4gKiAgfVxuICpcbiAqIEBwYXJhbSBwcm92aWRlckltcG9ydHNDb250YWluZXIgY29uc3RydWN0b3Igb2YgY2xhc3MgdGhhdCBjb250YWlucyBhbiBgaW1wb3J0c2AgYXJyYXkgaW4gaXQnc1xuICogICAgIGRlZmluaXRpb25cbiAqIEByZXR1cm5zIEEgTWFwIG9iamVjdCB0aGF0IG1hcHMgcHJvdmlkZXJzIHRvIGFuIGFycmF5IG9mIGNvbnN0cnVjdG9ycyByZXByZXNlbnRpbmcgaXQncyBpbXBvcnRcbiAqICAgICBwYXRoXG4gKlxuICovXG5mdW5jdGlvbiBnZXRQcm92aWRlckltcG9ydFBhdGhzKHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lcjogVHlwZTx1bmtub3duPik6XG4gICAgTWFwPFNpbmdsZVByb3ZpZGVyLCAoVHlwZTx1bmtub3duPnwgSW5qZWN0b3JUeXBlPHVua25vd24+KVtdPiB7XG4gIGNvbnN0IHByb3ZpZGVyVG9QYXRoID0gbmV3IE1hcDxTaW5nbGVQcm92aWRlciwgKFR5cGU8dW5rbm93bj58IEluamVjdG9yVHlwZTx1bmtub3duPilbXT4oKTtcbiAgY29uc3QgdmlzaXRlZENvbnRhaW5lcnMgPSBuZXcgU2V0PFR5cGU8dW5rbm93bj4+KCk7XG4gIGNvbnN0IHZpc2l0b3IgPSB3YWxrUHJvdmlkZXJUcmVlVG9EaXNjb3ZlckltcG9ydFBhdGhzKHByb3ZpZGVyVG9QYXRoLCB2aXNpdGVkQ29udGFpbmVycyk7XG5cbiAgd2Fsa1Byb3ZpZGVyVHJlZShwcm92aWRlckltcG9ydHNDb250YWluZXIsIHZpc2l0b3IsIFtdLCBuZXcgU2V0KCkpO1xuXG4gIHJldHVybiBwcm92aWRlclRvUGF0aDtcbn1cblxuLyoqXG4gKlxuICogSGlnaGVyIG9yZGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHZpc2l0b3IgZm9yIFdhbGtQcm92aWRlclRyZWVcbiAqXG4gKiBUYWtlcyBpbiBhIE1hcCBhbmQgU2V0IHRvIGtlZXAgdHJhY2sgb2YgdGhlIHByb3ZpZGVycyBhbmQgY29udGFpbmVyc1xuICogdmlzaXRlZCwgc28gdGhhdCB3ZSBjYW4gZGlzY292ZXIgdGhlIGltcG9ydCBwYXRocyBvZiB0aGVzZSBwcm92aWRlcnNcbiAqIGR1cmluZyB0aGUgdHJhdmVyc2FsLlxuICpcbiAqIFRoaXMgdmlzaXRvciB0YWtlcyBhZHZhbnRhZ2Ugb2YgdGhlIGZhY3QgdGhhdCB3YWxrUHJvdmlkZXJUcmVlIHBlcmZvcm1zIGFcbiAqIHBvc3RvcmRlciB0cmF2ZXJzYWwgb2YgdGhlIHByb3ZpZGVyIHRyZWUgZm9yIHRoZSBwYXNzZWQgaW4gY29udGFpbmVyLiBCZWNhdXNlIHBvc3RvcmRlclxuICogdHJhdmVyc2FsIHJlY3Vyc2l2ZWx5IHByb2Nlc3NlcyBzdWJ0cmVlcyBmcm9tIGxlYWYgbm9kZXMgdW50aWwgdGhlIHRyYXZlcnNhbCByZWFjaGVzIHRoZSByb290LFxuICogd2Ugd3JpdGUgYSB2aXNpdG9yIHRoYXQgY29uc3RydWN0cyBwcm92aWRlciBpbXBvcnQgcGF0aHMgaW4gcmV2ZXJzZS5cbiAqXG4gKlxuICogV2UgdXNlIHRoZSB2aXNpdGVkQ29udGFpbmVycyBzZXQgZGVmaW5lZCBvdXRzaWRlIHRoaXMgdmlzaXRvclxuICogYmVjYXVzZSB3ZSB3YW50IHRvIHJ1biBzb21lIGxvZ2ljIG9ubHkgb25jZSBmb3JcbiAqIGVhY2ggY29udGFpbmVyIGluIHRoZSB0cmVlLiBUaGF0IGxvZ2ljIGNhbiBiZSBkZXNjcmliZWQgYXM6XG4gKlxuICpcbiAqIDEuIGZvciBlYWNoIGRpc2NvdmVyZWRfcHJvdmlkZXIgYW5kIGRpc2NvdmVyZWRfcGF0aCBpbiB0aGUgaW5jb21wbGV0ZSBwcm92aWRlciBwYXRocyB3ZSd2ZVxuICogYWxyZWFkeSBkaXNjb3ZlcmVkXG4gKiAyLiBnZXQgdGhlIGZpcnN0IGNvbnRhaW5lciBpbiBkaXNjb3ZlcmVkX3BhdGhcbiAqIDMuIGlmIHRoYXQgZmlyc3QgY29udGFpbmVyIGlzIGluIHRoZSBpbXBvcnRzIGFycmF5IG9mIHRoZSBjb250YWluZXIgd2UncmUgdmlzaXRpbmdcbiAqICAgIFRoZW4gdGhlIGNvbnRhaW5lciB3ZSdyZSB2aXNpdGluZyBpcyBhbHNvIGluIHRoZSBpbXBvcnQgcGF0aCBvZiBkaXNjb3ZlcmVkX3Byb3ZpZGVyLCBzbyB3ZVxuICogICAgdW5zaGlmdCBkaXNjb3ZlcmVkX3BhdGggd2l0aCB0aGUgY29udGFpbmVyIHdlJ3JlIGN1cnJlbnRseSB2aXNpdGluZ1xuICpcbiAqXG4gKiBFeGFtcGxlIFJ1bjpcbiAqIGBgYFxuICogICAgICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkFxuICogICAgICAgICAgICAgICAgIOKUgmNvbnRhaW5lckHilIJcbiAqICAgICAg4pSM4pSAaW1wb3J0cy3ilIDilKQgICAgICAgICAg4pSc4pSA4pSAaW1wb3J0c+KUgOKUkFxuICogICAgICDilIIgICAgICAgICAg4pSCICBwcm92QSAgIOKUgiAgICAgICAgICDilIJcbiAqICAgICAg4pSCICAgICAgICAgIOKUgiAgcHJvdkIgICDilIIgICAgICAgICAg4pSCXG4gKiAgICAgIOKUgiAgICAgICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggICAgICAgICAg4pSCXG4gKiAgICAgIOKUgiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG4gKiAgICAg4pSM4pa84pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQICAgICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWvOKUgOKUkFxuICogICAgIOKUgmNvbnRhaW5lckLilIIgICAgICAgICAgICAg4pSCY29udGFpbmVyQ+KUglxuICogICAgIOKUgiAgICAgICAgICDilIIgICAgICAgICAgICAg4pSCICAgICAgICAgIOKUglxuICogICAgIOKUgiAgcHJvdkQgICDilIIgICAgICAgICAgICAg4pSCICBwcm92RiAgIOKUglxuICogICAgIOKUgiAgcHJvdkUgICDilIIgICAgICAgICAgICAg4pSCICBwcm92RyAgIOKUglxuICogICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcbiAqIGBgYFxuICpcbiAqIEVhY2ggc3RlcCBvZiB0aGUgdHJhdmVyc2FsLFxuICpcbiAqIGBgYFxuICogdmlzaXRvcihwcm92RCwgY29udGFpbmVyQilcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAgeyBwcm92RCA9PiBbY29udGFpbmVyQl0gfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIgfVxuICpcbiAqIHZpc2l0b3IocHJvdkUsIGNvbnRhaW5lckIpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHsgcHJvdkQgPT4gW2NvbnRhaW5lckJdLCBwcm92RSA9PiBbY29udGFpbmVyQl0gfVxuICogdmlzaXRlZENvbnRhaW5lcnMgPT09IFNldCB7IGNvbnRhaW5lckIgfVxuICpcbiAqIHZpc2l0b3IocHJvdkYsIGNvbnRhaW5lckMpXG4gKiBwcm92aWRlclRvUGF0aCA9PT0gTWFwIHsgcHJvdkQgPT4gW2NvbnRhaW5lckJdLCBwcm92RSA9PiBbY29udGFpbmVyQl0sIHByb3ZGID0+IFtjb250YWluZXJDXSB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQyB9XG4gKlxuICogdmlzaXRvcihwcm92RywgY29udGFpbmVyQylcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAge1xuICogICBwcm92RCA9PiBbY29udGFpbmVyQl0sIHByb3ZFID0+IFtjb250YWluZXJCXSwgcHJvdkYgPT4gW2NvbnRhaW5lckNdLCBwcm92RyA9PiBbY29udGFpbmVyQ11cbiAqIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCLCBjb250YWluZXJDIH1cbiAqXG4gKiB2aXNpdG9yKHByb3ZBLCBjb250YWluZXJBKVxuICogcHJvdmlkZXJUb1BhdGggPT09IE1hcCB7XG4gKiAgIHByb3ZEID0+IFtjb250YWluZXJBLCBjb250YWluZXJCXSxcbiAqICAgcHJvdkUgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckJdLFxuICogICBwcm92RiA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQ10sXG4gKiAgIHByb3ZHID0+IFtjb250YWluZXJBLCBjb250YWluZXJDXSxcbiAqICAgcHJvdkEgPT4gW2NvbnRhaW5lckFdXG4gKiB9XG4gKiB2aXNpdGVkQ29udGFpbmVycyA9PT0gU2V0IHsgY29udGFpbmVyQiwgY29udGFpbmVyQywgY29udGFpbmVyQSB9XG4gKlxuICogdmlzaXRvcihwcm92QiwgY29udGFpbmVyQSlcbiAqIHByb3ZpZGVyVG9QYXRoID09PSBNYXAge1xuICogICBwcm92RCA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQl0sXG4gKiAgIHByb3ZFID0+IFtjb250YWluZXJBLCBjb250YWluZXJCXSxcbiAqICAgcHJvdkYgPT4gW2NvbnRhaW5lckEsIGNvbnRhaW5lckNdLFxuICogICBwcm92RyA9PiBbY29udGFpbmVyQSwgY29udGFpbmVyQ10sXG4gKiAgIHByb3ZBID0+IFtjb250YWluZXJBXVxuICogICBwcm92QiA9PiBbY29udGFpbmVyQV1cbiAqIH1cbiAqIHZpc2l0ZWRDb250YWluZXJzID09PSBTZXQgeyBjb250YWluZXJCLCBjb250YWluZXJDLCBjb250YWluZXJBIH1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwcm92aWRlclRvUGF0aCBNYXAgbWFwIG9mIHByb3ZpZGVycyB0byBwYXRocyB0aGF0IHRoaXMgZnVuY3Rpb24gZmlsbHNcbiAqIEBwYXJhbSB2aXNpdGVkQ29udGFpbmVycyBTZXQgYSBzZXQgdG8ga2VlcCB0cmFjayBvZiB0aGUgY29udGFpbmVycyB3ZSd2ZSBhbHJlYWR5IHZpc2l0ZWRcbiAqIEByZXR1cm4gZnVuY3Rpb24ocHJvdmlkZXIgU2luZ2xlUHJvdmlkZXIsIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPiB8IEluamVjdG9yVHlwZTx1bmtub3duPikgPT5cbiAqICAgICB2b2lkXG4gKi9cbmZ1bmN0aW9uIHdhbGtQcm92aWRlclRyZWVUb0Rpc2NvdmVySW1wb3J0UGF0aHMoXG4gICAgcHJvdmlkZXJUb1BhdGg6IE1hcDxTaW5nbGVQcm92aWRlciwgKFR5cGU8dW5rbm93bj58IEluamVjdG9yVHlwZTx1bmtub3duPilbXT4sXG4gICAgdmlzaXRlZENvbnRhaW5lcnM6IFNldDxUeXBlPHVua25vd24+Pik6XG4gICAgKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgY29udGFpbmVyOiBUeXBlPHVua25vd24+fEluamVjdG9yVHlwZTx1bmtub3duPikgPT4gdm9pZCB7XG4gIHJldHVybiAocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBjb250YWluZXI6IFR5cGU8dW5rbm93bj58SW5qZWN0b3JUeXBlPHVua25vd24+KSA9PiB7XG4gICAgLy8gSWYgdGhlIHByb3ZpZGVyIGlzIG5vdCBhbHJlYWR5IGluIHRoZSBwcm92aWRlclRvUGF0aCBtYXAsXG4gICAgLy8gYWRkIGFuIGVudHJ5IHdpdGggdGhlIHByb3ZpZGVyIGFzIHRoZSBrZXkgYW5kIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgY29udGFpbmVyIGFzXG4gICAgLy8gdGhlIHZhbHVlXG4gICAgaWYgKCFwcm92aWRlclRvUGF0aC5oYXMocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlclRvUGF0aC5zZXQocHJvdmlkZXIsIFtjb250YWluZXJdKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGJsb2NrIHdpbGwgcnVuIGV4YWN0bHkgb25jZSBmb3IgZWFjaCBjb250YWluZXIgaW4gdGhlIGltcG9ydCB0cmVlLlxuICAgIC8vIFRoaXMgaXMgd2hlcmUgd2UgcnVuIHRoZSBsb2dpYyB0byBjaGVjayB0aGUgaW1wb3J0cyBhcnJheSBvZiB0aGUgY3VycmVudFxuICAgIC8vIGNvbnRhaW5lciB0byBzZWUgaWYgaXQncyB0aGUgbmV4dCBjb250YWluZXIgaW4gdGhlIHBhdGggZm9yIG91ciBjdXJyZW50bHlcbiAgICAvLyBkaXNjb3ZlcmVkIHByb3ZpZGVycy5cbiAgICBpZiAoIXZpc2l0ZWRDb250YWluZXJzLmhhcyhjb250YWluZXIpKSB7XG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIHByb3ZpZGVycyB3ZSd2ZSBhbHJlYWR5IHNlZW5cbiAgICAgIGZvciAoY29uc3QgcHJvdiBvZiBwcm92aWRlclRvUGF0aC5rZXlzKCkpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdJbXBvcnRQYXRoID0gcHJvdmlkZXJUb1BhdGguZ2V0KHByb3YpITtcblxuICAgICAgICBsZXQgY29udGFpbmVyRGVmID0gZ2V0SW5qZWN0b3JEZWYoY29udGFpbmVyKTtcbiAgICAgICAgaWYgKCFjb250YWluZXJEZWYpIHtcbiAgICAgICAgICBjb25zdCBuZ01vZHVsZTogVHlwZTx1bmtub3duPnx1bmRlZmluZWQgPVxuICAgICAgICAgICAgICAoY29udGFpbmVyIGFzIGFueSkubmdNb2R1bGUgYXMgVHlwZTx1bmtub3duPnwgdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnRhaW5lckRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29udGFpbmVyRGVmKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGFzdENvbnRhaW5lckFkZGVkVG9QYXRoID0gZXhpc3RpbmdJbXBvcnRQYXRoWzBdO1xuXG4gICAgICAgIGxldCBpc05leHRTdGVwSW5QYXRoID0gZmFsc2U7XG4gICAgICAgIGRlZXBGb3JFYWNoKGNvbnRhaW5lckRlZi5pbXBvcnRzLCAobW9kdWxlSW1wb3J0KSA9PiB7XG4gICAgICAgICAgaWYgKGlzTmV4dFN0ZXBJblBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpc05leHRTdGVwSW5QYXRoID0gKG1vZHVsZUltcG9ydCBhcyBhbnkpLm5nTW9kdWxlID09PSBsYXN0Q29udGFpbmVyQWRkZWRUb1BhdGggfHxcbiAgICAgICAgICAgICAgbW9kdWxlSW1wb3J0ID09PSBsYXN0Q29udGFpbmVyQWRkZWRUb1BhdGg7XG5cbiAgICAgICAgICBpZiAoaXNOZXh0U3RlcEluUGF0aCkge1xuICAgICAgICAgICAgcHJvdmlkZXJUb1BhdGguZ2V0KHByb3YpPy51bnNoaWZ0KGNvbnRhaW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2aXNpdGVkQ29udGFpbmVycy5hZGQoY29udGFpbmVyKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwcm92aWRlcnMgY29uZmlndXJlZCBvbiBhbiBFbnZpcm9ubWVudEluamVjdG9yXG4gKlxuICogQHBhcmFtIGluamVjdG9yIEVudmlyb25tZW50SW5qZWN0b3JcbiAqIEByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgcmVwcmVzZW50aW5nIHRoZSBwcm92aWRlcnMgb2YgdGhlIGdpdmVuIGluamVjdG9yXG4gKi9cbmZ1bmN0aW9uIGdldEVudmlyb25tZW50SW5qZWN0b3JQcm92aWRlcnMoaW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3IpOiBQcm92aWRlclJlY29yZFtdIHtcbiAgY29uc3QgcHJvdmlkZXJSZWNvcmRzID0gZ2V0RnJhbWV3b3JrRElEZWJ1Z0RhdGEoKS5yZXNvbHZlclRvUHJvdmlkZXJzLmdldChpbmplY3RvcikgPz8gW107XG5cbiAgLy8gcGxhdGZvcm0gaW5qZWN0b3IgaGFzIG5vIHByb3ZpZGVyIGltcG9ydHMgY29udGFpbmVyIHNvIGNhbiB3ZSBza2lwIHRyeWluZyB0b1xuICAvLyBmaW5kIGltcG9ydCBwYXRoc1xuICBpZiAoaXNQbGF0Zm9ybUluamVjdG9yKGluamVjdG9yKSkge1xuICAgIHJldHVybiBwcm92aWRlclJlY29yZHM7XG4gIH1cblxuICBjb25zdCBwcm92aWRlckltcG9ydHNDb250YWluZXIgPSBnZXRQcm92aWRlckltcG9ydHNDb250YWluZXIoaW5qZWN0b3IpO1xuICBpZiAocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyID09PSBudWxsKSB7XG4gICAgLy8gVGhlcmUgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlcmUgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQgZG9lcyBub3RcbiAgICAvLyBpbXBvcnQgYW55IE5nTW9kdWxlcy4gSW4gdGhpcyBjYXNlIHRoZSBlbnZpcm9ubWVudCBpbmplY3RvciBjb25uZWN0ZWQgdG9cbiAgICAvLyB0aGF0IGNvbXBvbmVudCBpcyB0aGUgcm9vdCBpbmplY3Rvciwgd2hpY2ggZG9lcyBub3QgaGF2ZSBhIHByb3ZpZGVyIGltcG9ydHNcbiAgICAvLyBjb250YWluZXIgKGFuZCB0aHVzIG5vIGNvbmNlcHQgb2YgbW9kdWxlIGltcG9ydCBwYXRocykuIFRoZXJlZm9yZSB3ZSBzaW1wbHlcbiAgICAvLyByZXR1cm4gdGhlIHByb3ZpZGVyIHJlY29yZHMgYXMgaXMuXG4gICAgaWYgKGlzUm9vdEluamVjdG9yKGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIHByb3ZpZGVyUmVjb3JkcztcbiAgICB9XG5cbiAgICB0aHJvd0Vycm9yKCdDb3VsZCBub3QgZGV0ZXJtaW5lIHdoZXJlIGluamVjdG9yIHByb3ZpZGVycyB3ZXJlIGNvbmZpZ3VyZWQuJyk7XG4gIH1cblxuICBjb25zdCBwcm92aWRlclRvUGF0aCA9IGdldFByb3ZpZGVySW1wb3J0UGF0aHMocHJvdmlkZXJJbXBvcnRzQ29udGFpbmVyKTtcblxuICByZXR1cm4gcHJvdmlkZXJSZWNvcmRzLm1hcChwcm92aWRlclJlY29yZCA9PiB7XG4gICAgbGV0IGltcG9ydFBhdGggPSBwcm92aWRlclRvUGF0aC5nZXQocHJvdmlkZXJSZWNvcmQucHJvdmlkZXIpID8/IFtwcm92aWRlckltcG9ydHNDb250YWluZXJdO1xuXG4gICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHByb3ZpZGVySW1wb3J0c0NvbnRhaW5lcik7XG4gICAgY29uc3QgaXNTdGFuZGFsb25lQ29tcG9uZW50ID0gISFkZWY/LnN0YW5kYWxvbmU7XG4gICAgLy8gV2UgcHJlcGVuZCB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yIGluIHRoZSBzdGFuZGFsb25lIGNhc2VcbiAgICAvLyBiZWNhdXNlIHdhbGtQcm92aWRlclRyZWUgZG9lcyBub3QgdmlzaXQgdGhpcyBjb25zdHJ1Y3RvciBkdXJpbmcgaXQncyB0cmF2ZXJzYWxcbiAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KSB7XG4gICAgICBpbXBvcnRQYXRoID0gW3Byb3ZpZGVySW1wb3J0c0NvbnRhaW5lciwgLi4ucHJvdmlkZXJUb1BhdGguZ2V0KHByb3ZpZGVyUmVjb3JkLnByb3ZpZGVyKSA/PyBbXV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsuLi5wcm92aWRlclJlY29yZCwgaW1wb3J0UGF0aH07XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpc1BsYXRmb3JtSW5qZWN0b3IoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIHJldHVybiBpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IgJiYgaW5qZWN0b3Iuc2NvcGVzLmhhcygncGxhdGZvcm0nKTtcbn1cblxuZnVuY3Rpb24gaXNSb290SW5qZWN0b3IoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIHJldHVybiBpbmplY3RvciBpbnN0YW5jZW9mIFIzSW5qZWN0b3IgJiYgaW5qZWN0b3Iuc2NvcGVzLmhhcygncm9vdCcpO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHByb3ZpZGVycyBjb25maWd1cmVkIG9uIGFuIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciB0aGUgaW5qZWN0b3IgdG8gbG9va3VwIHRoZSBwcm92aWRlcnMgb2ZcbiAqIEByZXR1cm5zIFByb3ZpZGVyUmVjb3JkW10gYW4gYXJyYXkgb2Ygb2JqZWN0cyByZXByZXNlbnRpbmcgdGhlIHByb3ZpZGVycyBvZiB0aGUgZ2l2ZW4gaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yOiBJbmplY3Rvcik6IFByb3ZpZGVyUmVjb3JkW10ge1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdG9yUHJvdmlkZXJzKGluamVjdG9yKTtcbiAgfSBlbHNlIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3IpIHtcbiAgICByZXR1cm4gZ2V0RW52aXJvbm1lbnRJbmplY3RvclByb3ZpZGVycyhpbmplY3RvciBhcyBFbnZpcm9ubWVudEluamVjdG9yKTtcbiAgfVxuXG4gIHRocm93RXJyb3IoJ2dldEluamVjdG9yUHJvdmlkZXJzIG9ubHkgc3VwcG9ydHMgTm9kZUluamVjdG9yIGFuZCBFbnZpcm9ubWVudEluamVjdG9yJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoKGluamVjdG9yOiBJbmplY3Rvcik6IEluamVjdG9yW10ge1xuICBjb25zdCByZXNvbHV0aW9uUGF0aDogSW5qZWN0b3JbXSA9IFtpbmplY3Rvcl07XG4gIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGhIZWxwZXIoaW5qZWN0b3IsIHJlc29sdXRpb25QYXRoKTtcbiAgcmV0dXJuIHJlc29sdXRpb25QYXRoO1xufVxuXG5mdW5jdGlvbiBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoSGVscGVyKFxuICAgIGluamVjdG9yOiBJbmplY3RvciwgcmVzb2x1dGlvblBhdGg6IEluamVjdG9yW10pOiBJbmplY3RvcltdIHtcbiAgY29uc3QgcGFyZW50ID0gZ2V0SW5qZWN0b3JQYXJlbnQoaW5qZWN0b3IpO1xuXG4gIC8vIGlmIGdldEluamVjdG9yUGFyZW50IGNhbid0IGZpbmQgYSBwYXJlbnQsIHRoZW4gd2UndmUgZWl0aGVyIHJlYWNoZWQgdGhlIGVuZFxuICAvLyBvZiB0aGUgcGF0aCwgb3Igd2UgbmVlZCB0byBtb3ZlIGZyb20gdGhlIEVsZW1lbnQgSW5qZWN0b3IgdHJlZSB0byB0aGVcbiAgLy8gbW9kdWxlIGluamVjdG9yIHRyZWUgdXNpbmcgdGhlIGZpcnN0IGluamVjdG9yIGluIG91ciBwYXRoIGFzIHRoZSBjb25uZWN0aW9uIHBvaW50LlxuICBpZiAocGFyZW50ID09PSBudWxsKSB7XG4gICAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgICBjb25zdCBmaXJzdEluamVjdG9yID0gcmVzb2x1dGlvblBhdGhbMF07XG4gICAgICBpZiAoZmlyc3RJbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgICAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGdldE1vZHVsZUluamVjdG9yT2ZOb2RlSW5qZWN0b3IoZmlyc3RJbmplY3Rvcik7XG4gICAgICAgIGlmIChtb2R1bGVJbmplY3RvciA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93RXJyb3IoJ05vZGVJbmplY3RvciBtdXN0IGhhdmUgc29tZSBjb25uZWN0aW9uIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x1dGlvblBhdGgucHVzaChtb2R1bGVJbmplY3Rvcik7XG4gICAgICAgIGdldEluamVjdG9yUmVzb2x1dGlvblBhdGhIZWxwZXIobW9kdWxlSW5qZWN0b3IsIHJlc29sdXRpb25QYXRoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc29sdXRpb25QYXRoO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXNvbHV0aW9uUGF0aC5wdXNoKHBhcmVudCk7XG4gICAgZ2V0SW5qZWN0b3JSZXNvbHV0aW9uUGF0aEhlbHBlcihwYXJlbnQsIHJlc29sdXRpb25QYXRoKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHV0aW9uUGF0aDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBwYXJlbnQgb2YgYW4gaW5qZWN0b3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBub3QgYWJsZSB0byBtYWtlIHRoZSBqdW1wIGZyb20gdGhlIEVsZW1lbnQgSW5qZWN0b3IgVHJlZSB0byB0aGUgTW9kdWxlXG4gKiBpbmplY3RvciB0cmVlLiBUaGlzIGlzIGJlY2F1c2UgdGhlIFwicGFyZW50XCIgKHRoZSBuZXh0IHN0ZXAgaW4gdGhlIHJlb3NsdXRpb24gcGF0aClcbiAqIG9mIGEgcm9vdCBOb2RlSW5qZWN0b3IgaXMgZGVwZW5kZW50IG9uIHdoaWNoIE5vZGVJbmplY3RvciBhbmNlc3RvciBpbml0aWF0ZWRcbiAqIHRoZSBESSBsb29rdXAuIFNlZSBnZXRJbmplY3RvclJlc29sdXRpb25QYXRoIGZvciBhIGZ1bmN0aW9uIHRoYXQgY2FuIG1ha2UgdGhpcyBqdW1wLlxuICpcbiAqIEluIHRoZSBiZWxvdyBkaWFncmFtOlxuICogYGBgdHNcbiAqIGdldEluamVjdG9yUGFyZW50KE5vZGVJbmplY3RvckIpXG4gKiAgPiBOb2RlSW5qZWN0b3JBXG4gKiBnZXRJbmplY3RvclBhcmVudChOb2RlSW5qZWN0b3JBKSAvLyBvciBnZXRJbmplY3RvclBhcmVudChnZXRJbmplY3RvclBhcmVudChOb2RlSW5qZWN0b3JCKSlcbiAqICA+IG51bGwgLy8gY2Fubm90IGp1bXAgdG8gTW9kdWxlSW5qZWN0b3IgdHJlZVxuICogYGBgXG4gKlxuICogYGBgXG4gKiAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilIDilIDilJAgICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG4gKiAgICDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKRNb2R1bGVB4pSc4pSA4pSA4pSASW5qZWN0b3LilIDilIDilIDilIDilrrilIJFbnZpcm9ubWVudEluamVjdG9y4pSCXG4gKiAgICDilIIgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUrOKUgOKUgOKUgOKUmCAgICAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgICBib290c3RyYXBzXG4gKiAgICDilIIgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUglxuICogICAg4pSCICAgICAgICAgIOKUjOKUgOKUgOKUgOKUgOKWvOKUgOKUgOKUgOKUgOKUgOKUkCAgICAgICAgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQXG4gKiBkZWNsYXJlcyAgICAgIOKUgkNvbXBvbmVudEHilJzilIDilIDilIDilIBJbmplY3RvcuKUgOKUgOKUgOKUgOKWuuKUgk5vZGVJbmplY3RvckHilIJcbiAqICAgIOKUgiAgICAgICAgICDilJTilIDilIDilIDilIDilKzilIDilIDilIDilIDilIDilJggICAgICAgICAgICAgICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKWsuKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmFxuICogICAg4pSCICAgICAgICAgICAgICAg4pSCICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIJcbiAqICAgIOKUgiAgICAgICAgICAgIHJlbmRlcnMgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRcbiAqICAgIOKUgiAgICAgICAgICAgICAgIOKUgiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCXG4gKiAgICDilIIgICAgICAgICAg4pSM4pSA4pSA4pSA4pSA4pa84pSA4pSA4pSA4pSA4pSA4pSQICAgICAgICAgICAgICAgICDilIzilIDilIDilIDilIDilIDilLTilIDilIDilIDilIDilIDilIDilIDilJBcbiAqICAgIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKWuuKUgkNvbXBvbmVudELilJzilIDilIDilIDilIBJbmplY3RvcuKUgOKUgOKUgOKUgOKWuuKUgk5vZGVJbmplY3RvckLilIJcbiAqICAgICAgICAgICAgICAg4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYICAgICAgICAgICAgICAgICDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJhcbiAqYGBgXG4gKlxuICogQHBhcmFtIGluamVjdG9yIGFuIEluamVjdG9yIHRvIGdldCB0aGUgcGFyZW50IG9mXG4gKiBAcmV0dXJucyBJbmplY3RvciB0aGUgcGFyZW50IG9mIHRoZSBnaXZlbiBpbmplY3RvclxuICovXG5mdW5jdGlvbiBnZXRJbmplY3RvclBhcmVudChpbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvcnxudWxsIHtcbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgUjNJbmplY3Rvcikge1xuICAgIHJldHVybiBpbmplY3Rvci5wYXJlbnQ7XG4gIH1cblxuICBsZXQgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgbGV0IGxWaWV3OiBMVmlldzx1bmtub3duPjtcbiAgaWYgKGluamVjdG9yIGluc3RhbmNlb2YgTm9kZUluamVjdG9yKSB7XG4gICAgdE5vZGUgPSBnZXROb2RlSW5qZWN0b3JUTm9kZShpbmplY3Rvcik7XG4gICAgbFZpZXcgPSBnZXROb2RlSW5qZWN0b3JMVmlldyhpbmplY3Rvcik7XG4gIH0gZWxzZSBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBOdWxsSW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKFxuICAgICAgICAnZ2V0SW5qZWN0b3JQYXJlbnQgb25seSBzdXBwb3J0IGluamVjdG9ycyBvZiB0eXBlIFIzSW5qZWN0b3IsIE5vZGVJbmplY3RvciwgTnVsbEluamVjdG9yJyk7XG4gIH1cblxuICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24oXG4gICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuXG4gIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2NhdGlvbikpIHtcbiAgICBjb25zdCBwYXJlbnRJbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgY29uc3QgcGFyZW50TFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICBjb25zdCBwYXJlbnRUVmlldyA9IHBhcmVudExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZSA9IHBhcmVudFRWaWV3LmRhdGFbcGFyZW50SW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVE5vZGU7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IoXG4gICAgICAgIHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBwYXJlbnRMVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY2hhaW5lZEluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdIGFzIENoYWluZWRJbmplY3RvcjtcblxuICAgIC8vIENhc2Ugd2hlcmUgY2hhaW5lZEluamVjdG9yLmluamVjdG9yIGlzIGFuIE91dGxldEluamVjdG9yIGFuZCBjaGFpbmVkSW5qZWN0b3IuaW5qZWN0b3IucGFyZW50XG4gICAgLy8gaXMgYSBOb2RlSW5qZWN0b3IuXG4gICAgLy8gdG9kbyhhbGVrc2FuZGVyYm9kdXJyaSk6IGlkZWFsbHkgbm90aGluZyBpbiBwYWNrYWdlcy9jb3JlIHNob3VsZCBkZWFsXG4gICAgLy8gZGlyZWN0bHkgd2l0aCByb3V0ZXIgY29uY2VybnMuIFJlZmFjdG9yIHRoaXMgc28gdGhhdCB3ZSBjYW4gbWFrZSB0aGUganVtcCBmcm9tXG4gICAgLy8gTm9kZUluamVjdG9yIC0+IE91dGxldEluamVjdG9yIC0+IE5vZGVJbmplY3RvclxuICAgIC8vIHdpdGhvdXQgZXhwbGljdGx5IHJlbHlpbmcgb24gdHlwZXMgY29udHJhY3RzIGZyb20gcGFja2FnZXMvcm91dGVyXG4gICAgY29uc3QgaW5qZWN0b3JQYXJlbnQgPSAoY2hhaW5lZEluamVjdG9yLmluamVjdG9yIGFzIGFueSk/LnBhcmVudCBhcyBJbmplY3RvcjtcblxuICAgIGlmIChpbmplY3RvclBhcmVudCBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgICAgcmV0dXJuIGluamVjdG9yUGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIG1vZHVsZSBpbmplY3RvciBvZiBhIE5vZGVJbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgTm9kZUluamVjdG9yIHRvIGdldCBtb2R1bGUgaW5qZWN0b3Igb2ZcbiAqIEByZXR1cm5zIEluamVjdG9yIHJlcHJlc2VudGluZyBtb2R1bGUgaW5qZWN0b3Igb2YgdGhlIGdpdmVuIE5vZGVJbmplY3RvclxuICovXG5mdW5jdGlvbiBnZXRNb2R1bGVJbmplY3Rvck9mTm9kZUluamVjdG9yKGluamVjdG9yOiBOb2RlSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gIGxldCBsVmlldzogTFZpZXc8dW5rbm93bj47XG4gIGlmIChpbmplY3RvciBpbnN0YW5jZW9mIE5vZGVJbmplY3Rvcikge1xuICAgIGxWaWV3ID0gZ2V0Tm9kZUluamVjdG9yTFZpZXcoaW5qZWN0b3IpO1xuICB9IGVsc2Uge1xuICAgIHRocm93RXJyb3IoJ2dldE1vZHVsZUluamVjdG9yT2ZOb2RlSW5qZWN0b3IgbXVzdCBiZSBjYWxsZWQgd2l0aCBhIE5vZGVJbmplY3RvcicpO1xuICB9XG5cbiAgY29uc3QgY2hhaW5lZEluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdIGFzIENoYWluZWRJbmplY3RvcjtcbiAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBjaGFpbmVkSW5qZWN0b3IucGFyZW50SW5qZWN0b3I7XG4gIGlmICghbW9kdWxlSW5qZWN0b3IpIHtcbiAgICB0aHJvd0Vycm9yKCdOb2RlSW5qZWN0b3IgbXVzdCBoYXZlIHNvbWUgY29ubmVjdGlvbiB0byB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUnKTtcbiAgfVxuXG4gIHJldHVybiBtb2R1bGVJbmplY3Rvcjtcbn1cbiJdfQ==