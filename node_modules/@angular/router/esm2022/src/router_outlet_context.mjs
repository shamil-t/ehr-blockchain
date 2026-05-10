/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Store contextual information about a `RouterOutlet`
 *
 * @publicApi
 */
export class OutletContext {
    constructor() {
        this.outlet = null;
        this.route = null;
        this.injector = null;
        this.children = new ChildrenOutletContexts();
        this.attachRef = null;
    }
}
/**
 * Store contextual information about the children (= nested) `RouterOutlet`
 *
 * @publicApi
 */
export class ChildrenOutletContexts {
    constructor() {
        // contexts for child outlets, by name.
        this.contexts = new Map();
    }
    /** Called when a `RouterOutlet` directive is instantiated */
    onChildOutletCreated(childName, outlet) {
        const context = this.getOrCreateContext(childName);
        context.outlet = outlet;
        this.contexts.set(childName, context);
    }
    /**
     * Called when a `RouterOutlet` directive is destroyed.
     * We need to keep the context as the outlet could be destroyed inside a NgIf and might be
     * re-created later.
     */
    onChildOutletDestroyed(childName) {
        const context = this.getContext(childName);
        if (context) {
            context.outlet = null;
            context.attachRef = null;
        }
    }
    /**
     * Called when the corresponding route is deactivated during navigation.
     * Because the component get destroyed, all children outlet are destroyed.
     */
    onOutletDeactivated() {
        const contexts = this.contexts;
        this.contexts = new Map();
        return contexts;
    }
    onOutletReAttached(contexts) {
        this.contexts = contexts;
    }
    getOrCreateContext(childName) {
        let context = this.getContext(childName);
        if (!context) {
            context = new OutletContext();
            this.contexts.set(childName, context);
        }
        return context;
    }
    getContext(childName) {
        return this.contexts.get(childName) || null;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ChildrenOutletContexts, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ChildrenOutletContexts, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ChildrenOutletContexts, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX291dGxldF9jb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9yb3V0ZXJfb3V0bGV0X2NvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFvQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBTTVFOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUExQjtRQUNFLFdBQU0sR0FBOEIsSUFBSSxDQUFDO1FBQ3pDLFVBQUssR0FBd0IsSUFBSSxDQUFDO1FBQ2xDLGFBQVEsR0FBNkIsSUFBSSxDQUFDO1FBQzFDLGFBQVEsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7UUFDeEMsY0FBUyxHQUEyQixJQUFJLENBQUM7SUFDM0MsQ0FBQztDQUFBO0FBRUQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxzQkFBc0I7SUFEbkM7UUFFRSx1Q0FBdUM7UUFDL0IsYUFBUSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO0tBa0RyRDtJQWhEQyw2REFBNkQ7SUFDN0Qsb0JBQW9CLENBQUMsU0FBaUIsRUFBRSxNQUE0QjtRQUNsRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsc0JBQXNCLENBQUMsU0FBaUI7UUFDdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzQyxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILG1CQUFtQjtRQUNqQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxQixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsa0JBQWtCLENBQUMsUUFBb0M7UUFDckQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDM0IsQ0FBQztJQUVELGtCQUFrQixDQUFDLFNBQWlCO1FBQ2xDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFekMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE9BQU8sR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN2QztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxVQUFVLENBQUMsU0FBaUI7UUFDMUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDOUMsQ0FBQzt5SEFuRFUsc0JBQXNCOzZIQUF0QixzQkFBc0IsY0FEVixNQUFNOztzR0FDbEIsc0JBQXNCO2tCQURsQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudFJlZiwgRW52aXJvbm1lbnRJbmplY3RvciwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Um91dGVyT3V0bGV0Q29udHJhY3R9IGZyb20gJy4vZGlyZWN0aXZlcy9yb3V0ZXJfb3V0bGV0JztcbmltcG9ydCB7QWN0aXZhdGVkUm91dGV9IGZyb20gJy4vcm91dGVyX3N0YXRlJztcblxuXG4vKipcbiAqIFN0b3JlIGNvbnRleHR1YWwgaW5mb3JtYXRpb24gYWJvdXQgYSBgUm91dGVyT3V0bGV0YFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE91dGxldENvbnRleHQge1xuICBvdXRsZXQ6IFJvdXRlck91dGxldENvbnRyYWN0fG51bGwgPSBudWxsO1xuICByb3V0ZTogQWN0aXZhdGVkUm91dGV8bnVsbCA9IG51bGw7XG4gIGluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yfG51bGwgPSBudWxsO1xuICBjaGlsZHJlbiA9IG5ldyBDaGlsZHJlbk91dGxldENvbnRleHRzKCk7XG4gIGF0dGFjaFJlZjogQ29tcG9uZW50UmVmPGFueT58bnVsbCA9IG51bGw7XG59XG5cbi8qKlxuICogU3RvcmUgY29udGV4dHVhbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY2hpbGRyZW4gKD0gbmVzdGVkKSBgUm91dGVyT3V0bGV0YFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ2hpbGRyZW5PdXRsZXRDb250ZXh0cyB7XG4gIC8vIGNvbnRleHRzIGZvciBjaGlsZCBvdXRsZXRzLCBieSBuYW1lLlxuICBwcml2YXRlIGNvbnRleHRzID0gbmV3IE1hcDxzdHJpbmcsIE91dGxldENvbnRleHQ+KCk7XG5cbiAgLyoqIENhbGxlZCB3aGVuIGEgYFJvdXRlck91dGxldGAgZGlyZWN0aXZlIGlzIGluc3RhbnRpYXRlZCAqL1xuICBvbkNoaWxkT3V0bGV0Q3JlYXRlZChjaGlsZE5hbWU6IHN0cmluZywgb3V0bGV0OiBSb3V0ZXJPdXRsZXRDb250cmFjdCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmdldE9yQ3JlYXRlQ29udGV4dChjaGlsZE5hbWUpO1xuICAgIGNvbnRleHQub3V0bGV0ID0gb3V0bGV0O1xuICAgIHRoaXMuY29udGV4dHMuc2V0KGNoaWxkTmFtZSwgY29udGV4dCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gYSBgUm91dGVyT3V0bGV0YCBkaXJlY3RpdmUgaXMgZGVzdHJveWVkLlxuICAgKiBXZSBuZWVkIHRvIGtlZXAgdGhlIGNvbnRleHQgYXMgdGhlIG91dGxldCBjb3VsZCBiZSBkZXN0cm95ZWQgaW5zaWRlIGEgTmdJZiBhbmQgbWlnaHQgYmVcbiAgICogcmUtY3JlYXRlZCBsYXRlci5cbiAgICovXG4gIG9uQ2hpbGRPdXRsZXREZXN0cm95ZWQoY2hpbGROYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5nZXRDb250ZXh0KGNoaWxkTmFtZSk7XG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIGNvbnRleHQub3V0bGV0ID0gbnVsbDtcbiAgICAgIGNvbnRleHQuYXR0YWNoUmVmID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgcm91dGUgaXMgZGVhY3RpdmF0ZWQgZHVyaW5nIG5hdmlnYXRpb24uXG4gICAqIEJlY2F1c2UgdGhlIGNvbXBvbmVudCBnZXQgZGVzdHJveWVkLCBhbGwgY2hpbGRyZW4gb3V0bGV0IGFyZSBkZXN0cm95ZWQuXG4gICAqL1xuICBvbk91dGxldERlYWN0aXZhdGVkKCk6IE1hcDxzdHJpbmcsIE91dGxldENvbnRleHQ+IHtcbiAgICBjb25zdCBjb250ZXh0cyA9IHRoaXMuY29udGV4dHM7XG4gICAgdGhpcy5jb250ZXh0cyA9IG5ldyBNYXAoKTtcbiAgICByZXR1cm4gY29udGV4dHM7XG4gIH1cblxuICBvbk91dGxldFJlQXR0YWNoZWQoY29udGV4dHM6IE1hcDxzdHJpbmcsIE91dGxldENvbnRleHQ+KSB7XG4gICAgdGhpcy5jb250ZXh0cyA9IGNvbnRleHRzO1xuICB9XG5cbiAgZ2V0T3JDcmVhdGVDb250ZXh0KGNoaWxkTmFtZTogc3RyaW5nKTogT3V0bGV0Q29udGV4dCB7XG4gICAgbGV0IGNvbnRleHQgPSB0aGlzLmdldENvbnRleHQoY2hpbGROYW1lKTtcblxuICAgIGlmICghY29udGV4dCkge1xuICAgICAgY29udGV4dCA9IG5ldyBPdXRsZXRDb250ZXh0KCk7XG4gICAgICB0aGlzLmNvbnRleHRzLnNldChjaGlsZE5hbWUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBjb250ZXh0O1xuICB9XG5cbiAgZ2V0Q29udGV4dChjaGlsZE5hbWU6IHN0cmluZyk6IE91dGxldENvbnRleHR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuY29udGV4dHMuZ2V0KGNoaWxkTmFtZSkgfHwgbnVsbDtcbiAgfVxufVxuIl19