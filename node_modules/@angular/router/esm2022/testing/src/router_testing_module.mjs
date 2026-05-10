/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Compiler, inject, Injector, NgModule } from '@angular/core';
import { ChildrenOutletContexts, NoPreloading, Router, ROUTER_CONFIGURATION, RouteReuseStrategy, RouterModule, ROUTES, TitleStrategy, UrlHandlingStrategy, UrlSerializer, withPreloading, ɵROUTER_PROVIDERS as ROUTER_PROVIDERS } from '@angular/router';
import * as i0 from "@angular/core";
function isUrlHandlingStrategy(opts) {
    // This property check is needed because UrlHandlingStrategy is an interface and doesn't exist at
    // runtime.
    return 'shouldProcessUrl' in opts;
}
function throwInvalidConfigError(parameter) {
    throw new Error(`Parameter ${parameter} does not match the one available in the injector. ` +
        '`setupTestingRouter` is meant to be used as a factory function with dependencies coming from DI.');
}
/**
 * Router setup factory function used for testing.
 *
 * @publicApi
 * @deprecated Use `provideRouter` or `RouterModule` instead.
 */
export function setupTestingRouter(urlSerializer, contexts, location, compiler, injector, routes, opts, urlHandlingStrategy, routeReuseStrategy, titleStrategy) {
    // Note: The checks below are to detect misconfigured providers and invalid uses of
    // `setupTestingRouter`. This function is not used internally (neither in router code or anywhere
    // in g3). It appears this function was exposed as publicApi by mistake and should not be used
    // externally either. However, if it is, the documented intent is to be used as a factory function
    // and parameter values should always match what's available in DI.
    if (urlSerializer !== inject(UrlSerializer)) {
        throwInvalidConfigError('urlSerializer');
    }
    if (contexts !== inject(ChildrenOutletContexts)) {
        throwInvalidConfigError('contexts');
    }
    if (location !== inject(Location)) {
        throwInvalidConfigError('location');
    }
    if (compiler !== inject(Compiler)) {
        throwInvalidConfigError('compiler');
    }
    if (injector !== inject(Injector)) {
        throwInvalidConfigError('injector');
    }
    if (routes !== inject(ROUTES)) {
        throwInvalidConfigError('routes');
    }
    if (opts) {
        // Handle deprecated argument ordering.
        if (isUrlHandlingStrategy(opts)) {
            if (opts !== inject(UrlHandlingStrategy)) {
                throwInvalidConfigError('opts (UrlHandlingStrategy)');
            }
        }
        else {
            if (opts !== inject(ROUTER_CONFIGURATION)) {
                throwInvalidConfigError('opts (ROUTER_CONFIGURATION)');
            }
        }
    }
    if (urlHandlingStrategy !== inject(UrlHandlingStrategy)) {
        throwInvalidConfigError('urlHandlingStrategy');
    }
    if (routeReuseStrategy !== inject(RouteReuseStrategy)) {
        throwInvalidConfigError('routeReuseStrategy');
    }
    if (titleStrategy !== inject(TitleStrategy)) {
        throwInvalidConfigError('titleStrategy');
    }
    return new Router();
}
/**
 * @description
 *
 * Sets up the router to be used for testing.
 *
 * The modules sets up the router to be used for testing.
 * It provides spy implementations of `Location` and `LocationStrategy`.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * beforeEach(() => {
 *   TestBed.configureTestingModule({
 *     imports: [
 *       RouterModule.forRoot(
 *         [{path: '', component: BlankCmp}, {path: 'simple', component: SimpleCmp}]
 *       )
 *     ]
 *   });
 * });
 * ```
 *
 * @publicApi
 */
export class RouterTestingModule {
    static withRoutes(routes, config) {
        return {
            ngModule: RouterTestingModule,
            providers: [
                { provide: ROUTES, multi: true, useValue: routes },
                { provide: ROUTER_CONFIGURATION, useValue: config ? config : {} },
            ]
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterTestingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.2.12", ngImport: i0, type: RouterTestingModule, exports: [RouterModule] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterTestingModule, providers: [
            ROUTER_PROVIDERS,
            provideLocationMocks(),
            withPreloading(NoPreloading).ɵproviders,
            { provide: ROUTES, multi: true, useValue: [] },
        ], imports: [RouterModule] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: RouterTestingModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [RouterModule],
                    providers: [
                        ROUTER_PROVIDERS,
                        provideLocationMocks(),
                        withPreloading(NoPreloading).ɵproviders,
                        { provide: ROUTES, multi: true, useValue: [] },
                    ]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX3Rlc3RpbmdfbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3Rlc3Rpbmcvc3JjL3JvdXRlcl90ZXN0aW5nX21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUF1QixRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEYsT0FBTyxFQUFDLHNCQUFzQixFQUFnQixZQUFZLEVBQVMsTUFBTSxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxNQUFNLEVBQVUsYUFBYSxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7QUFFcFIsU0FBUyxxQkFBcUIsQ0FBQyxJQUNtQjtJQUNoRCxpR0FBaUc7SUFDakcsV0FBVztJQUNYLE9BQU8sa0JBQWtCLElBQUksSUFBSSxDQUFDO0FBQ3BDLENBQUM7QUFFRCxTQUFTLHVCQUF1QixDQUFDLFNBQWlCO0lBQ2hELE1BQU0sSUFBSSxLQUFLLENBQ1gsYUFBYSxTQUFTLHFEQUFxRDtRQUMzRSxrR0FBa0csQ0FBQyxDQUFDO0FBQzFHLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsYUFBNEIsRUFBRSxRQUFnQyxFQUFFLFFBQWtCLEVBQ2xGLFFBQWtCLEVBQUUsUUFBa0IsRUFBRSxNQUFpQixFQUN6RCxJQUE0QyxFQUFFLG1CQUF5QyxFQUN2RixrQkFBdUMsRUFBRSxhQUE2QjtJQUN4RSxtRkFBbUY7SUFDbkYsaUdB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LFlBQVksQ0FBQyxDQUFDLFVBQVU7d0JBQ3ZDLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUM7cUJBQzdDO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TG9jYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge3Byb3ZpZGVMb2NhdGlvbk1vY2tzfSBmcm9tICdAYW5ndWxhci9jb21tb24vdGVzdGluZyc7XG5pbXBvcnQge0NvbXBpbGVyLCBpbmplY3QsIEluamVjdG9yLCBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0NoaWxkcmVuT3V0bGV0Q29udGV4dHMsIEV4dHJhT3B0aW9ucywgTm9QcmVsb2FkaW5nLCBSb3V0ZSwgUm91dGVyLCBST1VURVJfQ09ORklHVVJBVElPTiwgUm91dGVSZXVzZVN0cmF0ZWd5LCBSb3V0ZXJNb2R1bGUsIFJPVVRFUywgUm91dGVzLCBUaXRsZVN0cmF0ZWd5LCBVcmxIYW5kbGluZ1N0cmF0ZWd5LCBVcmxTZXJpYWxpemVyLCB3aXRoUHJlbG9hZGluZywgybVST1VURVJfUFJPVklERVJTIGFzIFJPVVRFUl9QUk9WSURFUlN9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5cbmZ1bmN0aW9uIGlzVXJsSGFuZGxpbmdTdHJhdGVneShvcHRzOiBFeHRyYU9wdGlvbnN8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVXJsSGFuZGxpbmdTdHJhdGVneSk6IG9wdHMgaXMgVXJsSGFuZGxpbmdTdHJhdGVneSB7XG4gIC8vIFRoaXMgcHJvcGVydHkgY2hlY2sgaXMgbmVlZGVkIGJlY2F1c2UgVXJsSGFuZGxpbmdTdHJhdGVneSBpcyBhbiBpbnRlcmZhY2UgYW5kIGRvZXNuJ3QgZXhpc3QgYXRcbiAgLy8gcnVudGltZS5cbiAgcmV0dXJuICdzaG91bGRQcm9jZXNzVXJsJyBpbiBvcHRzO1xufVxuXG5mdW5jdGlvbiB0aHJvd0ludmFsaWRDb25maWdFcnJvcihwYXJhbWV0ZXI6IHN0cmluZyk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFBhcmFtZXRlciAke3BhcmFtZXRlcn0gZG9lcyBub3QgbWF0Y2ggdGhlIG9uZSBhdmFpbGFibGUgaW4gdGhlIGluamVjdG9yLiBgICtcbiAgICAgICdgc2V0dXBUZXN0aW5nUm91dGVyYCBpcyBtZWFudCB0byBiZSB1c2VkIGFzIGEgZmFjdG9yeSBmdW5jdGlvbiB3aXRoIGRlcGVuZGVuY2llcyBjb21pbmcgZnJvbSBESS4nKTtcbn1cblxuLyoqXG4gKiBSb3V0ZXIgc2V0dXAgZmFjdG9yeSBmdW5jdGlvbiB1c2VkIGZvciB0ZXN0aW5nLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXByZWNhdGVkIFVzZSBgcHJvdmlkZVJvdXRlcmAgb3IgYFJvdXRlck1vZHVsZWAgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHVwVGVzdGluZ1JvdXRlcihcbiAgICB1cmxTZXJpYWxpemVyOiBVcmxTZXJpYWxpemVyLCBjb250ZXh0czogQ2hpbGRyZW5PdXRsZXRDb250ZXh0cywgbG9jYXRpb246IExvY2F0aW9uLFxuICAgIGNvbXBpbGVyOiBDb21waWxlciwgaW5qZWN0b3I6IEluamVjdG9yLCByb3V0ZXM6IFJvdXRlW11bXSxcbiAgICBvcHRzPzogRXh0cmFPcHRpb25zfFVybEhhbmRsaW5nU3RyYXRlZ3l8bnVsbCwgdXJsSGFuZGxpbmdTdHJhdGVneT86IFVybEhhbmRsaW5nU3RyYXRlZ3ksXG4gICAgcm91dGVSZXVzZVN0cmF0ZWd5PzogUm91dGVSZXVzZVN0cmF0ZWd5LCB0aXRsZVN0cmF0ZWd5PzogVGl0bGVTdHJhdGVneSkge1xuICAvLyBOb3RlOiBUaGUgY2hlY2tzIGJlbG93IGFyZSB0byBkZXRlY3QgbWlzY29uZmlndXJlZCBwcm92aWRlcnMgYW5kIGludmFsaWQgdXNlcyBvZlxuICAvLyBgc2V0dXBUZXN0aW5nUm91dGVyYC4gVGhpcyBmdW5jdGlvbiBpcyBub3QgdXNlZCBpbnRlcm5hbGx5IChuZWl0aGVyIGluIHJvdXRlciBjb2RlIG9yIGFueXdoZXJlXG4gIC8vIGluIGczKS4gSXQgYXBwZWFycyB0aGlzIGZ1bmN0aW9uIHdhcyBleHBvc2VkIGFzIHB1YmxpY0FwaSBieSBtaXN0YWtlIGFuZCBzaG91bGQgbm90IGJlIHVzZWRcbiAgLy8gZXh0ZXJuYWxseSBlaXRoZXIuIEhvd2V2ZXIsIGlmIGl0IGlzLCB0aGUgZG9jdW1lbnRlZCBpbnRlbnQgaXMgdG8gYmUgdXNlZCBhcyBhIGZhY3RvcnkgZnVuY3Rpb25cbiAgLy8gYW5kIHBhcmFtZXRlciB2YWx1ZXMgc2hvdWxkIGFsd2F5cyBtYXRjaCB3aGF0J3MgYXZhaWxhYmxlIGluIERJLlxuICBpZiAodXJsU2VyaWFsaXplciAhPT0gaW5qZWN0KFVybFNlcmlhbGl6ZXIpKSB7XG4gICAgdGhyb3dJbnZhbGlkQ29uZmlnRXJyb3IoJ3VybFNlcmlhbGl6ZXInKTtcbiAgfVxuICBpZiAoY29udGV4dHMgIT09IGluamVjdChDaGlsZHJlbk91dGxldENvbnRleHRzKSkge1xuICAgIHRocm93SW52YWxpZENvbmZpZ0Vycm9yKCdjb250ZXh0cycpO1xuICB9XG4gIGlmIChsb2NhdGlvbiAhPT0gaW5qZWN0KExvY2F0aW9uKSkge1xuICAgIHRocm93SW52YWxpZENvbmZpZ0Vycm9yKCdsb2NhdGlvbicpO1xuICB9XG4gIGlmIChjb21waWxlciAhPT0gaW5qZWN0KENvbXBpbGVyKSkge1xuICAgIHRocm93SW52YWxpZENvbmZpZ0Vycm9yKCdjb21waWxlcicpO1xuICB9XG4gIGlmIChpbmplY3RvciAhPT0gaW5qZWN0KEluamVjdG9yKSkge1xuICAgIHRocm93SW52YWxpZENvbmZpZ0Vycm9yKCdpbmplY3RvcicpO1xuICB9XG4gIGlmIChyb3V0ZXMgIT09IGluamVjdChST1VURVMpKSB7XG4gICAgdGhyb3dJbnZhbGlkQ29uZmlnRXJyb3IoJ3JvdXRlcycpO1xuICB9XG4gIGlmIChvcHRzKSB7XG4gICAgLy8gSGFuZGxlIGRlcHJlY2F0ZWQgYXJndW1lbnQgb3JkZXJpbmcuXG4gICAgaWYgKGlzVXJsSGFuZGxpbmdTdHJhdGVneShvcHRzKSkge1xuICAgICAgaWYgKG9wdHMgIT09IGluamVjdChVcmxIYW5kbGluZ1N0cmF0ZWd5KSkge1xuICAgICAgICB0aHJvd0ludmFsaWRDb25maWdFcnJvcignb3B0cyAoVXJsSGFuZGxpbmdTdHJhdGVneSknKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdHMgIT09IGluamVjdChST1VURVJfQ09ORklHVVJBVElPTikpIHtcbiAgICAgICAgdGhyb3dJbnZhbGlkQ29uZmlnRXJyb3IoJ29wdHMgKFJPVVRFUl9DT05GSUdVUkFUSU9OKScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh1cmxIYW5kbGluZ1N0cmF0ZWd5ICE9PSBpbmplY3QoVXJsSGFuZGxpbmdTdHJhdGVneSkpIHtcbiAgICB0aHJvd0ludmFsaWRDb25maWdFcnJvcigndXJsSGFuZGxpbmdTdHJhdGVneScpO1xuICB9XG5cbiAgaWYgKHJvdXRlUmV1c2VTdHJhdGVneSAhPT0gaW5qZWN0KFJvdXRlUmV1c2VTdHJhdGVneSkpIHtcbiAgICB0aHJvd0ludmFsaWRDb25maWdFcnJvcigncm91dGVSZXVzZVN0cmF0ZWd5Jyk7XG4gIH1cblxuICBpZiAodGl0bGVTdHJhdGVneSAhPT0gaW5qZWN0KFRpdGxlU3RyYXRlZ3kpKSB7XG4gICAgdGhyb3dJbnZhbGlkQ29uZmlnRXJyb3IoJ3RpdGxlU3RyYXRlZ3knKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUm91dGVyKCk7XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogU2V0cyB1cCB0aGUgcm91dGVyIHRvIGJlIHVzZWQgZm9yIHRlc3RpbmcuXG4gKlxuICogVGhlIG1vZHVsZXMgc2V0cyB1cCB0aGUgcm91dGVyIHRvIGJlIHVzZWQgZm9yIHRlc3RpbmcuXG4gKiBJdCBwcm92aWRlcyBzcHkgaW1wbGVtZW50YXRpb25zIG9mIGBMb2NhdGlvbmAgYW5kIGBMb2NhdGlvblN0cmF0ZWd5YC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGJlZm9yZUVhY2goKCkgPT4ge1xuICogICBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUoe1xuICogICAgIGltcG9ydHM6IFtcbiAqICAgICAgIFJvdXRlck1vZHVsZS5mb3JSb290KFxuICogICAgICAgICBbe3BhdGg6ICcnLCBjb21wb25lbnQ6IEJsYW5rQ21wfSwge3BhdGg6ICdzaW1wbGUnLCBjb21wb25lbnQ6IFNpbXBsZUNtcH1dXG4gKiAgICAgICApXG4gKiAgICAgXVxuICogICB9KTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBbUm91dGVyTW9kdWxlXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAgUk9VVEVSX1BST1ZJREVSUyxcbiAgICBwcm92aWRlTG9jYXRpb25Nb2NrcygpLFxuICAgIHdpdGhQcmVsb2FkaW5nKE5vUHJlbG9hZGluZykuybVwcm92aWRlcnMsXG4gICAge3Byb3ZpZGU6IFJPVVRFUywgbXVsdGk6IHRydWUsIHVzZVZhbHVlOiBbXX0sXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgUm91dGVyVGVzdGluZ01vZHVsZSB7XG4gIHN0YXRpYyB3aXRoUm91dGVzKHJvdXRlczogUm91dGVzLCBjb25maWc/OiBFeHRyYU9wdGlvbnMpOlxuICAgICAgTW9kdWxlV2l0aFByb3ZpZGVyczxSb3V0ZXJUZXN0aW5nTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBSb3V0ZXJUZXN0aW5nTW9kdWxlLFxuICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIHtwcm92aWRlOiBST1VURVMsIG11bHRpOiB0cnVlLCB1c2VWYWx1ZTogcm91dGVzfSxcbiAgICAgICAge3Byb3ZpZGU6IFJPVVRFUl9DT05GSUdVUkFUSU9OLCB1c2VWYWx1ZTogY29uZmlnID8gY29uZmlnIDoge319LFxuICAgICAgXVxuICAgIH07XG4gIH1cbn1cbiJdfQ==