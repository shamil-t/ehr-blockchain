/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler, inject, Injectable, InjectionToken, NgModuleFactory } from '@angular/core';
import { ConnectableObservable, from, of, Subject } from 'rxjs';
import { finalize, map, mergeMap, refCount, tap } from 'rxjs/operators';
import { wrapIntoObservable } from './utils/collection';
import { assertStandalone, standardizeConfig, validateConfig } from './utils/config';
import * as i0 from "@angular/core";
/**
 * The [DI token](guide/glossary/#di-token) for a router configuration.
 *
 * `ROUTES` is a low level API for router configuration via dependency injection.
 *
 * We recommend that in almost all cases to use higher level APIs such as `RouterModule.forRoot()`,
 * `provideRouter`, or `Router.resetConfig()`.
 *
 * @publicApi
 */
export const ROUTES = new InjectionToken('ROUTES');
export class RouterConfigLoader {
    constructor() {
        this.componentLoaders = new WeakMap();
        this.childrenLoaders = new WeakMap();
        this.compiler = inject(Compiler);
    }
    loadComponent(route) {
        if (this.componentLoaders.get(route)) {
            return this.componentLoaders.get(route);
        }
        else if (route._loadedComponent) {
            return of(route._loadedComponent);
        }
        if (this.onLoadStartListener) {
            this.onLoadStartListener(route);
        }
        const loadRunner = wrapIntoObservable(route.loadComponent())
            .pipe(map(maybeUnwrapDefaultExport), tap(component => {
            if (this.onLoadEndListener) {
                this.onLoadEndListener(route);
            }
            (typeof ngDevMode === 'undefined' || ngDevMode) &&
                assertStandalone(route.path ?? '', component);
            route._loadedComponent = component;
        }), finalize(() => {
            this.componentLoaders.delete(route);
        }));
        // Use custom ConnectableObservable as share in runners pipe increasing the bundle size too much
        const loader = new ConnectableObservable(loadRunner, () => new Subject()).pipe(refCount());
        this.componentLoaders.set(route, loader);
        return loader;
    }
    loadChildren(parentInjector, route) {
        if (this.childrenLoaders.get(route)) {
            return this.childrenLoaders.get(route);
        }
        else if (route._loadedRoutes) {
            return of({ routes: route._loadedRoutes, injector: route._loadedInjector });
        }
        if (this.onLoadStartListener) {
            this.onLoadStartListener(route);
        }
        const moduleFactoryOrRoutes$ = loadChildren(route, this.compiler, parentInjector, this.onLoadEndListener);
        const loadRunner = moduleFactoryOrRoutes$.pipe(finalize(() => {
            this.childrenLoaders.delete(route);
        }));
        // Use custom ConnectableObservable as share in runners pipe increasing the bundle size too much
        const loader = new ConnectableObservable(loadRunner, () => new Subject())
            .pipe(refCount());
        this.childrenLoaders.set(route, loader);
        return loader;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterConfigLoader, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterConfigLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterConfigLoader, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
/**
 * Executes a `route.loadChildren` callback and converts the result to an array of child routes and
 * an injector if that callback returned a module.
 *
 * This function is used for the route discovery during prerendering
 * in @angular-devkit/build-angular. If there are any updates to the contract here, it will require
 * an update to the extractor.
 */
export function loadChildren(route, compiler, parentInjector, onLoadEndListener) {
    return wrapIntoObservable(route.loadChildren())
        .pipe(map(maybeUnwrapDefaultExport), mergeMap((t) => {
        if (t instanceof NgModuleFactory || Array.isArray(t)) {
            return of(t);
        }
        else {
            return from(compiler.compileModuleAsync(t));
        }
    }), map((factoryOrRoutes) => {
        if (onLoadEndListener) {
            onLoadEndListener(route);
        }
        // This injector comes from the `NgModuleRef` when lazy loading an `NgModule`. There is
        // no injector associated with lazy loading a `Route` array.
        let injector;
        let rawRoutes;
        let requireStandaloneComponents = false;
        if (Array.isArray(factoryOrRoutes)) {
            rawRoutes = factoryOrRoutes;
            requireStandaloneComponents = true;
        }
        else {
            injector = factoryOrRoutes.create(parentInjector).injector;
            // When loading a module that doesn't provide `RouterModule.forChild()` preloader
            // will get stuck in an infinite loop. The child module's Injector will look to
            // its parent `Injector` when it doesn't find any ROUTES so it will return routes
            // for it's parent module instead.
            rawRoutes = injector.get(ROUTES, [], { optional: true, self: true }).flat();
        }
        const routes = rawRoutes.map(standardizeConfig);
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
            validateConfig(routes, route.path, requireStandaloneComponents);
        return { routes, injector };
    }));
}
function isWrappedDefaultExport(value) {
    // We use `in` here with a string key `'default'`, because we expect `DefaultExport` objects to be
    // dynamically imported ES modules with a spec-mandated `default` key. Thus we don't expect that
    // `default` will be a renamed property.
    return value && typeof value === 'object' && 'default' in value;
}
function maybeUnwrapDefaultExport(input) {
    // As per `isWrappedDefaultExport`, the `default` key here is generated by the browser and not
    // subject to property renaming, so we reference it with bracket access.
    return isWrappedDefaultExport(input) ? input['default'] : input;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX2NvbmZpZ19sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9yb3V0ZXIvc3JjL3JvdXRlcl9jb25maWdfbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQXVCLE1BQU0sRUFBRSxVQUFVLEVBQWUsY0FBYyxFQUFZLGVBQWUsRUFBTyxNQUFNLGVBQWUsQ0FBQztBQUM5SSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsSUFBSSxFQUFjLEVBQUUsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDMUUsT0FBTyxFQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd0RSxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBSW5GOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBWSxRQUFRLENBQUMsQ0FBQztBQUs5RCxNQUFNLE9BQU8sa0JBQWtCO0lBRC9CO1FBRVUscUJBQWdCLEdBQUcsSUFBSSxPQUFPLEVBQTBCLENBQUM7UUFDekQsb0JBQWUsR0FBRyxJQUFJLE9BQU8sRUFBeUMsQ0FBQztRQUc5RCxhQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBeUQ5QztJQXZEQyxhQUFhLENBQUMsS0FBWTtRQUN4QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDcEMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBRSxDQUFDO1NBQzFD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SSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDM0U7UUFDRCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDaEQsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDO1lBQzNDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQ0wsQ0FBQztBQUNSLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFJLEtBQXlCO0lBQzFELGtHQUFrRztJQUNsRyxnR0FBZ0c7SUFDaEcsd0NBQXdDO0lBQ3hDLE9BQU8sS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxTQUFTLElBQUksS0FBSyxDQUFDO0FBQ2xFLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFJLEtBQXlCO0lBQzVELDhGQUE4RjtJQUM5Rix3RUFBd0U7SUFDeEUsT0FBTyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBpbGVyLCBFbnZpcm9ubWVudEluamVjdG9yLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdEZsYWdzLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIE5nTW9kdWxlRmFjdG9yeSwgVHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nvbm5lY3RhYmxlT2JzZXJ2YWJsZSwgZnJvbSwgT2JzZXJ2YWJsZSwgb2YsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaW5hbGl6ZSwgbWFwLCBtZXJnZU1hcCwgcmVmQ291bnQsIHRhcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0RlZmF1bHRFeHBvcnQsIExvYWRDaGlsZHJlbiwgTG9hZENoaWxkcmVuQ2FsbGJhY2ssIExvYWRlZFJvdXRlckNvbmZpZywgUm91dGUsIFJvdXRlc30gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHt3cmFwSW50b09ic2VydmFibGV9IGZyb20gJy4vdXRpbHMvY29sbGVjdGlvbic7XG5pbXBvcnQge2Fzc2VydFN0YW5kYWxvbmUsIHN0YW5kYXJkaXplQ29uZmlnLCB2YWxpZGF0ZUNvbmZpZ30gZnJvbSAnLi91dGlscy9jb25maWcnO1xuXG5cblxuLyoqXG4gKiBUaGUgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeS8jZGktdG9rZW4pIGZvciBhIHJvdXRlciBjb25maWd1cmF0aW9uLlxuICpcbiAqIGBST1VURVNgIGlzIGEgbG93IGxldmVsIEFQSSBmb3Igcm91dGVyIGNvbmZpZ3VyYXRpb24gdmlhIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICpcbiAqIFdlIHJlY29tbWVuZCB0aGF0IGluIGFsbW9zdCBhbGwgY2FzZXMgdG8gdXNlIGhpZ2hlciBsZXZlbCBBUElzIHN1Y2ggYXMgYFJvdXRlck1vZHVsZS5mb3JSb290KClgLFxuICogYHByb3ZpZGVSb3V0ZXJgLCBvciBgUm91dGVyLnJlc2V0Q29uZmlnKClgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFJPVVRFUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb3V0ZVtdW10+KCdST1VURVMnKTtcblxudHlwZSBDb21wb25lbnRMb2FkZXIgPSBPYnNlcnZhYmxlPFR5cGU8dW5rbm93bj4+O1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBSb3V0ZXJDb25maWdMb2FkZXIge1xuICBwcml2YXRlIGNvbXBvbmVudExvYWRlcnMgPSBuZXcgV2Vha01hcDxSb3V0ZSwgQ29tcG9uZW50TG9hZGVyPigpO1xuICBwcml2YXRlIGNoaWxkcmVuTG9hZGVycyA9IG5ldyBXZWFrTWFwPFJvdXRlLCBPYnNlcnZhYmxlPExvYWRlZFJvdXRlckNvbmZpZz4+KCk7XG4gIG9uTG9hZFN0YXJ0TGlzdGVuZXI/OiAocjogUm91dGUpID0+IHZvaWQ7XG4gIG9uTG9hZEVuZExpc3RlbmVyPzogKHI6IFJvdXRlKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbXBpbGVyID0gaW5qZWN0KENvbXBpbGVyKTtcblxuICBsb2FkQ29tcG9uZW50KHJvdXRlOiBSb3V0ZSk6IE9ic2VydmFibGU8VHlwZTx1bmtub3duPj4ge1xuICAgIGlmICh0aGlzLmNvbXBvbmVudExvYWRlcnMuZ2V0KHJvdXRlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50TG9hZGVycy5nZXQocm91dGUpITtcbiAgICB9IGVsc2UgaWYgKHJvdXRlLl9sb2FkZWRDb21wb25lbnQpIHtcbiAgICAgIHJldHVybiBvZihyb3V0ZS5fbG9hZGVkQ29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkxvYWRTdGFydExpc3RlbmVyKSB7XG4gICAgICB0aGlzLm9uTG9hZFN0YXJ0TGlzdGVuZXIocm91dGUpO1xuICAgIH1cbiAgICBjb25zdCBsb2FkUnVubmVyID0gd3JhcEludG9PYnNlcnZhYmxlKHJvdXRlLmxvYWRDb21wb25lbnQhKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAobWF5YmVVbndyYXBEZWZhdWx0RXhwb3J0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uTG9hZEVuZExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Mb2FkRW5kTGlzdGVuZXIocm91dGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnRTdGFuZGFsb25lKHJvdXRlLnBhdGggPz8gJycsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZS5fbG9hZGVkQ29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmFsaXplKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50TG9hZGVycy5kZWxldGUocm91dGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAvLyBVc2UgY3VzdG9tIENvbm5lY3RhYmxlT2JzZXJ2YWJsZSBhcyBzaGFyZSBpbiBydW5uZXJzIHBpcGUgaW5jcmVhc2luZyB0aGUgYnVuZGxlIHNpemUgdG9vIG11Y2hcbiAgICBjb25zdCBsb2FkZXIgPVxuICAgICAgICBuZXcgQ29ubmVjdGFibGVPYnNlcnZhYmxlKGxvYWRSdW5uZXIsICgpID0+IG5ldyBTdWJqZWN0PFR5cGU8dW5rbm93bj4+KCkpLnBpcGUocmVmQ291bnQoKSk7XG4gICAgdGhpcy5jb21wb25lbnRMb2FkZXJzLnNldChyb3V0ZSwgbG9hZGVyKTtcbiAgICByZXR1cm4gbG9hZGVyO1xuICB9XG5cbiAgbG9hZENoaWxkcmVuKHBhcmVudEluamVjdG9yOiBJbmplY3Rvciwgcm91dGU6IFJvdXRlKTogT2JzZXJ2YWJsZTxMb2FkZWRSb3V0ZXJDb25maWc+IHtcbiAgICBpZiAodGhpcy5jaGlsZHJlbkxvYWRlcnMuZ2V0KHJvdXRlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW5Mb2FkZXJzLmdldChyb3V0ZSkhO1xuICAgIH0gZWxzZSBpZiAocm91dGUuX2xvYWRlZFJvdXRlcykge1xuICAgICAgcmV0dXJuIG9mKHtyb3V0ZXM6IHJvdXRlLl9sb2FkZWRSb3V0ZXMsIGluamVjdG9yOiByb3V0ZS5fbG9hZGVkSW5qZWN0b3J9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkxvYWRTdGFydExpc3RlbmVyKSB7XG4gICAgICB0aGlzLm9uTG9hZFN0YXJ0TGlzdGVuZXIocm91dGUpO1xuICAgIH1cbiAgICBjb25zdCBtb2R1bGVGYWN0b3J5T3JSb3V0ZXMkID1cbiAgICAgICAgbG9hZENoaWxkcmVuKHJvdXRlLCB0aGlzLmNvbXBpbGVyLCBwYXJlbnRJbmplY3RvciwgdGhpcy5vbkxvYWRFbmRMaXN0ZW5lcik7XG4gICAgY29uc3QgbG9hZFJ1bm5lciA9IG1vZHVsZUZhY3RvcnlPclJvdXRlcyQucGlwZShcbiAgICAgICAgZmluYWxpemUoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW5Mb2FkZXJzLmRlbGV0ZShyb3V0ZSk7XG4gICAgICAgIH0pLFxuICAgICk7XG4gICAgLy8gVXNlIGN1c3RvbSBDb25uZWN0YWJsZU9ic2VydmFibGUgYXMgc2hhcmUgaW4gcnVubmVycyBwaXBlIGluY3JlYXNpbmcgdGhlIGJ1bmRsZSBzaXplIHRvbyBtdWNoXG4gICAgY29uc3QgbG9hZGVyID0gbmV3IENvbm5lY3RhYmxlT2JzZXJ2YWJsZShsb2FkUnVubmVyLCAoKSA9PiBuZXcgU3ViamVjdDxMb2FkZWRSb3V0ZXJDb25maWc+KCkpXG4gICAgICAgICAgICAgICAgICAgICAgIC5waXBlKHJlZkNvdW50KCkpO1xuICAgIHRoaXMuY2hpbGRyZW5Mb2FkZXJzLnNldChyb3V0ZSwgbG9hZGVyKTtcbiAgICByZXR1cm4gbG9hZGVyO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBgcm91dGUubG9hZENoaWxkcmVuYCBjYWxsYmFjayBhbmQgY29udmVydHMgdGhlIHJlc3VsdCB0byBhbiBhcnJheSBvZiBjaGlsZCByb3V0ZXMgYW5kXG4gKiBhbiBpbmplY3RvciBpZiB0aGF0IGNhbGxiYWNrIHJldHVybmVkIGEgbW9kdWxlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBmb3IgdGhlIHJvdXRlIGRpc2NvdmVyeSBkdXJpbmcgcHJlcmVuZGVyaW5nXG4gKiBpbiBAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci4gSWYgdGhlcmUgYXJlIGFueSB1cGRhdGVzIHRvIHRoZSBjb250cmFjdCBoZXJlLCBpdCB3aWxsIHJlcXVpcmVcbiAqIGFuIHVwZGF0ZSB0byB0aGUgZXh0cmFjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENoaWxkcmVuKFxuICAgIHJvdXRlOiBSb3V0ZSwgY29tcGlsZXI6IENvbXBpbGVyLCBwYXJlbnRJbmplY3RvcjogSW5qZWN0b3IsXG4gICAgb25Mb2FkRW5kTGlzdGVuZXI/OiAocjogUm91dGUpID0+IHZvaWQpOiBPYnNlcnZhYmxlPExvYWRlZFJvdXRlckNvbmZpZz4ge1xuICByZXR1cm4gd3JhcEludG9PYnNlcnZhYmxlKHJvdXRlLmxvYWRDaGlsZHJlbiEoKSlcbiAgICAgIC5waXBlKFxuICAgICAgICAgIG1hcChtYXliZVVud3JhcERlZmF1bHRFeHBvcnQpLFxuICAgICAgICAgIG1lcmdlTWFwKCh0KSA9PiB7XG4gICAgICAgICAgICBpZiAodCBpbnN0YW5jZW9mIE5nTW9kdWxlRmFjdG9yeSB8fCBBcnJheS5pc0FycmF5KHQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBvZih0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBmcm9tKGNvbXBpbGVyLmNvbXBpbGVNb2R1bGVBc3luYyh0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICAgICAgbWFwKChmYWN0b3J5T3JSb3V0ZXM6IE5nTW9kdWxlRmFjdG9yeTxhbnk+fFJvdXRlcykgPT4ge1xuICAgICAgICAgICAgaWYgKG9uTG9hZEVuZExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgIG9uTG9hZEVuZExpc3RlbmVyKHJvdXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRoaXMgaW5qZWN0b3IgY29tZXMgZnJvbSB0aGUgYE5nTW9kdWxlUmVmYCB3aGVuIGxhenkgbG9hZGluZyBhbiBgTmdNb2R1bGVgLiBUaGVyZSBpc1xuICAgICAgICAgICAgLy8gbm8gaW5qZWN0b3IgYXNzb2NpYXRlZCB3aXRoIGxhenkgbG9hZGluZyBhIGBSb3V0ZWAgYXJyYXkuXG4gICAgICAgICAgICBsZXQgaW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3J8dW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHJhd1JvdXRlczogUm91dGVbXTtcbiAgICAgICAgICAgIGxldCByZXF1aXJlU3RhbmRhbG9uZUNvbXBvbmVudHMgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZhY3RvcnlPclJvdXRlcykpIHtcbiAgICAgICAgICAgICAgcmF3Um91dGVzID0gZmFjdG9yeU9yUm91dGVzO1xuICAgICAgICAgICAgICByZXF1aXJlU3RhbmRhbG9uZUNvbXBvbmVudHMgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaW5qZWN0b3IgPSBmYWN0b3J5T3JSb3V0ZXMuY3JlYXRlKHBhcmVudEluamVjdG9yKS5pbmplY3RvcjtcbiAgICAgICAgICAgICAgLy8gV2hlbiBsb2FkaW5nIGEgbW9kdWxlIHRoYXQgZG9lc24ndCBwcm92aWRlIGBSb3V0ZXJNb2R1bGUuZm9yQ2hpbGQoKWAgcHJlbG9hZGVyXG4gICAgICAgICAgICAgIC8vIHdpbGwgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3AuIFRoZSBjaGlsZCBtb2R1bGUncyBJbmplY3RvciB3aWxsIGxvb2sgdG9cbiAgICAgICAgICAgICAgLy8gaXRzIHBhcmVudCBgSW5qZWN0b3JgIHdoZW4gaXQgZG9lc24ndCBmaW5kIGFueSBST1VURVMgc28gaXQgd2lsbCByZXR1cm4gcm91dGVzXG4gICAgICAgICAgICAgIC8vIGZvciBpdCdzIHBhcmVudCBtb2R1bGUgaW5zdGVhZC5cbiAgICAgICAgICAgICAgcmF3Um91dGVzID0gaW5qZWN0b3IuZ2V0KFJPVVRFUywgW10sIHtvcHRpb25hbDogdHJ1ZSwgc2VsZjogdHJ1ZX0pLmZsYXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJvdXRlcyA9IHJhd1JvdXRlcy5tYXAoc3RhbmRhcmRpemVDb25maWcpO1xuICAgICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZUNvbmZpZyhyb3V0ZXMsIHJvdXRlLnBhdGgsIHJlcXVpcmVTdGFuZGFsb25lQ29tcG9uZW50cyk7XG4gICAgICAgICAgICByZXR1cm4ge3JvdXRlcywgaW5qZWN0b3J9O1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcbn1cblxuZnVuY3Rpb24gaXNXcmFwcGVkRGVmYXVsdEV4cG9ydDxUPih2YWx1ZTogVHxEZWZhdWx0RXhwb3J0PFQ+KTogdmFsdWUgaXMgRGVmYXVsdEV4cG9ydDxUPiB7XG4gIC8vIFdlIHVzZSBgaW5gIGhlcmUgd2l0aCBhIHN0cmluZyBrZXkgYCdkZWZhdWx0J2AsIGJlY2F1c2Ugd2UgZXhwZWN0IGBEZWZhdWx0RXhwb3J0YCBvYmplY3RzIHRvIGJlXG4gIC8vIGR5bmFtaWNhbGx5IGltcG9ydGVkIEVTIG1vZHVsZXMgd2l0aCBhIHNwZWMtbWFuZGF0ZWQgYGRlZmF1bHRgIGtleS4gVGh1cyB3ZSBkb24ndCBleHBlY3QgdGhhdFxuICAvLyBgZGVmYXVsdGAgd2lsbCBiZSBhIHJlbmFtZWQgcHJvcGVydHkuXG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICdkZWZhdWx0JyBpbiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBEZWZhdWx0RXhwb3J0PFQ+KGlucHV0OiBUfERlZmF1bHRFeHBvcnQ8VD4pOiBUIHtcbiAgLy8gQXMgcGVyIGBpc1dyYXBwZWREZWZhdWx0RXhwb3J0YCwgdGhlIGBkZWZhdWx0YCBrZXkgaGVyZSBpcyBnZW5lcmF0ZWQgYnkgdGhlIGJyb3dzZXIgYW5kIG5vdFxuICAvLyBzdWJqZWN0IHRvIHByb3BlcnR5IHJlbmFtaW5nLCBzbyB3ZSByZWZlcmVuY2UgaXQgd2l0aCBicmFja2V0IGFjY2Vzcy5cbiAgcmV0dXJuIGlzV3JhcHBlZERlZmF1bHRFeHBvcnQoaW5wdXQpID8gaW5wdXRbJ2RlZmF1bHQnXSA6IGlucHV0O1xufVxuIl19