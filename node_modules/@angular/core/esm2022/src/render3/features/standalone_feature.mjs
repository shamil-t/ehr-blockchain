/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵɵinject as inject } from '../../di/injector_compatibility';
import { ɵɵdefineInjectable as defineInjectable } from '../../di/interface/defs';
import { internalImportProvidersFrom } from '../../di/provider_collection';
import { EnvironmentInjector } from '../../di/r3_injector';
import { createEnvironmentInjector } from '../ng_module_ref';
/**
 * A service used by the framework to create instances of standalone injectors. Those injectors are
 * created on demand in case of dynamic component instantiation and contain ambient providers
 * collected from the imports graph rooted at a given standalone component.
 */
class StandaloneService {
    constructor(_injector) {
        this._injector = _injector;
        this.cachedInjectors = new Map();
    }
    getOrCreateStandaloneInjector(componentDef) {
        if (!componentDef.standalone) {
            return null;
        }
        if (!this.cachedInjectors.has(componentDef)) {
            const providers = internalImportProvidersFrom(false, componentDef.type);
            const standaloneInjector = providers.length > 0 ?
                createEnvironmentInjector([providers], this._injector, `Standalone[${componentDef.type.name}]`) :
                null;
            this.cachedInjectors.set(componentDef, standaloneInjector);
        }
        return this.cachedInjectors.get(componentDef);
    }
    ngOnDestroy() {
        try {
            for (const injector of this.cachedInjectors.values()) {
                if (injector !== null) {
                    injector.destroy();
                }
            }
        }
        finally {
            this.cachedInjectors.clear();
        }
    }
    /** @nocollapse */
    static { this.ɵprov = defineInjectable({
        token: StandaloneService,
        providedIn: 'environment',
        factory: () => new StandaloneService(inject(EnvironmentInjector)),
    }); }
}
/**
 * A feature that acts as a setup code for the {@link StandaloneService}.
 *
 * The most important responsibility of this feature is to expose the "getStandaloneInjector"
 * function (an entry points to a standalone injector creation) on a component definition object. We
 * go through the features infrastructure to make sure that the standalone injector creation logic
 * is tree-shakable and not included in applications that don't use standalone components.
 *
 * @codeGenApi
 */
export function ɵɵStandaloneFeature(definition) {
    definition.getStandaloneInjector = (parentInjector) => {
        return parentInjector.get(StandaloneService).getOrCreateStandaloneInjector(definition);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZV9mZWF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9mZWF0dXJlcy9zdGFuZGFsb25lX2ZlYXR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLFFBQVEsSUFBSSxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNuRSxPQUFPLEVBQUMsa0JBQWtCLElBQUksZ0JBQWdCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMvRSxPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUd6RCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUzRDs7OztHQUlHO0FBQ0gsTUFBTSxpQkFBaUI7SUFHckIsWUFBb0IsU0FBOEI7UUFBOUIsY0FBUyxHQUFULFNBQVMsQ0FBcUI7UUFGbEQsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBbUQsQ0FBQztJQUV4QixDQUFDO0lBRXRELDZCQUE2QixDQUFDLFlBQW1DO1FBQy9ELElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFO1lBQzVCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDM0MsTUFBTSxTQUFTLEdBQUcsMkJBQTJCLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RSxNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLHlCQUF5QixDQUNyQixDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxDQUFDO1lBQ1QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUM7U0FDNUQ7UUFFRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSTtZQUNGLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDcEQsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO29CQUNyQixRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ3BCO2FBQ0Y7U0FDRjtnQkFBUztZQUNSLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDOUI7SUFDSCxDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixnQkFBZ0IsQ0FBQztRQUN4RCxLQUFLLEVBQUUsaUJBQWlCO1FBQ3hCLFVBQVUsRUFBRSxhQUFhO1FBQ3pCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQ2xFLENBQUMsQUFKVSxDQUlUOztBQUdMOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxVQUFpQztJQUNuRSxVQUFVLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxjQUFtQyxFQUFFLEVBQUU7UUFDekUsT0FBTyxjQUFjLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDekYsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHvJtcm1aW5qZWN0IGFzIGluamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge8m1ybVkZWZpbmVJbmplY3RhYmxlIGFzIGRlZmluZUluamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7aW50ZXJuYWxJbXBvcnRQcm92aWRlcnNGcm9tfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2NyZWF0ZUVudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uL25nX21vZHVsZV9yZWYnO1xuXG4vKipcbiAqIEEgc2VydmljZSB1c2VkIGJ5IHRoZSBmcmFtZXdvcmsgdG8gY3JlYXRlIGluc3RhbmNlcyBvZiBzdGFuZGFsb25lIGluamVjdG9ycy4gVGhvc2UgaW5qZWN0b3JzIGFyZVxuICogY3JlYXRlZCBvbiBkZW1hbmQgaW4gY2FzZSBvZiBkeW5hbWljIGNvbXBvbmVudCBpbnN0YW50aWF0aW9uIGFuZCBjb250YWluIGFtYmllbnQgcHJvdmlkZXJzXG4gKiBjb2xsZWN0ZWQgZnJvbSB0aGUgaW1wb3J0cyBncmFwaCByb290ZWQgYXQgYSBnaXZlbiBzdGFuZGFsb25lIGNvbXBvbmVudC5cbiAqL1xuY2xhc3MgU3RhbmRhbG9uZVNlcnZpY2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBjYWNoZWRJbmplY3RvcnMgPSBuZXcgTWFwPENvbXBvbmVudERlZjx1bmtub3duPiwgRW52aXJvbm1lbnRJbmplY3RvcnxudWxsPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2luamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yKSB7fVxuXG4gIGdldE9yQ3JlYXRlU3RhbmRhbG9uZUluamVjdG9yKGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPHVua25vd24+KTogRW52aXJvbm1lbnRJbmplY3RvcnxudWxsIHtcbiAgICBpZiAoIWNvbXBvbmVudERlZi5zdGFuZGFsb25lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY2FjaGVkSW5qZWN0b3JzLmhhcyhjb21wb25lbnREZWYpKSB7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBpbnRlcm5hbEltcG9ydFByb3ZpZGVyc0Zyb20oZmFsc2UsIGNvbXBvbmVudERlZi50eXBlKTtcbiAgICAgIGNvbnN0IHN0YW5kYWxvbmVJbmplY3RvciA9IHByb3ZpZGVycy5sZW5ndGggPiAwID9cbiAgICAgICAgICBjcmVhdGVFbnZpcm9ubWVudEluamVjdG9yKFxuICAgICAgICAgICAgICBbcHJvdmlkZXJzXSwgdGhpcy5faW5qZWN0b3IsIGBTdGFuZGFsb25lWyR7Y29tcG9uZW50RGVmLnR5cGUubmFtZX1dYCkgOlxuICAgICAgICAgIG51bGw7XG4gICAgICB0aGlzLmNhY2hlZEluamVjdG9ycy5zZXQoY29tcG9uZW50RGVmLCBzdGFuZGFsb25lSW5qZWN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNhY2hlZEluamVjdG9ycy5nZXQoY29tcG9uZW50RGVmKSE7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgZm9yIChjb25zdCBpbmplY3RvciBvZiB0aGlzLmNhY2hlZEluamVjdG9ycy52YWx1ZXMoKSkge1xuICAgICAgICBpZiAoaW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgICAgICBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jYWNoZWRJbmplY3RvcnMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IFN0YW5kYWxvbmVTZXJ2aWNlLFxuICAgIHByb3ZpZGVkSW46ICdlbnZpcm9ubWVudCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IFN0YW5kYWxvbmVTZXJ2aWNlKGluamVjdChFbnZpcm9ubWVudEluamVjdG9yKSksXG4gIH0pO1xufVxuXG4vKipcbiAqIEEgZmVhdHVyZSB0aGF0IGFjdHMgYXMgYSBzZXR1cCBjb2RlIGZvciB0aGUge0BsaW5rIFN0YW5kYWxvbmVTZXJ2aWNlfS5cbiAqXG4gKiBUaGUgbW9zdCBpbXBvcnRhbnQgcmVzcG9uc2liaWxpdHkgb2YgdGhpcyBmZWF0dXJlIGlzIHRvIGV4cG9zZSB0aGUgXCJnZXRTdGFuZGFsb25lSW5qZWN0b3JcIlxuICogZnVuY3Rpb24gKGFuIGVudHJ5IHBvaW50cyB0byBhIHN0YW5kYWxvbmUgaW5qZWN0b3IgY3JlYXRpb24pIG9uIGEgY29tcG9uZW50IGRlZmluaXRpb24gb2JqZWN0LiBXZVxuICogZ28gdGhyb3VnaCB0aGUgZmVhdHVyZXMgaW5mcmFzdHJ1Y3R1cmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHN0YW5kYWxvbmUgaW5qZWN0b3IgY3JlYXRpb24gbG9naWNcbiAqIGlzIHRyZWUtc2hha2FibGUgYW5kIG5vdCBpbmNsdWRlZCBpbiBhcHBsaWNhdGlvbnMgdGhhdCBkb24ndCB1c2Ugc3RhbmRhbG9uZSBjb21wb25lbnRzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1U3RhbmRhbG9uZUZlYXR1cmUoZGVmaW5pdGlvbjogQ29tcG9uZW50RGVmPHVua25vd24+KSB7XG4gIGRlZmluaXRpb24uZ2V0U3RhbmRhbG9uZUluamVjdG9yID0gKHBhcmVudEluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yKSA9PiB7XG4gICAgcmV0dXJuIHBhcmVudEluamVjdG9yLmdldChTdGFuZGFsb25lU2VydmljZSkuZ2V0T3JDcmVhdGVTdGFuZGFsb25lSW5qZWN0b3IoZGVmaW5pdGlvbik7XG4gIH07XG59XG4iXX0=