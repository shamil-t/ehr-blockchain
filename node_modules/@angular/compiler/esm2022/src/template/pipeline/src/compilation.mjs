/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../ir';
/**
 * A compilation unit is compiled into a template function.
 * Some example units are views and host bindings.
 */
export class CompilationUnit {
    constructor(xref) {
        this.xref = xref;
        /**
         * List of creation operations for this view.
         *
         * Creation operations may internally contain other operations, including update operations.
         */
        this.create = new ir.OpList();
        /**
         * List of update operations for this view.
         */
        this.update = new ir.OpList();
        /**
         * Name of the function which will be generated for this unit.
         *
         * May be `null` if not yet determined.
         */
        this.fnName = null;
        /**
         * Number of variable slots used within this view, or `null` if variables have not yet been
         * counted.
         */
        this.vars = null;
    }
    /**
     * Iterate over all `ir.Op`s within this view.
     *
     * Some operations may have child operations, which this iterator will visit.
     */
    *ops() {
        for (const op of this.create) {
            yield op;
            if (op.kind === ir.OpKind.Listener) {
                for (const listenerOp of op.handlerOps) {
                    yield listenerOp;
                }
            }
        }
        for (const op of this.update) {
            yield op;
        }
    }
}
export class HostBindingCompilationJob extends CompilationUnit {
    // TODO: Perhaps we should accept a reference to the enclosing component, and get the name from
    // there?
    constructor(componentName, pool, compatibility) {
        super(0);
        this.componentName = componentName;
        this.pool = pool;
        this.compatibility = compatibility;
        this.fnSuffix = 'HostBindings';
        this.units = [this];
        this.nextXrefId = 1;
    }
    get job() {
        return this;
    }
    get root() {
        return this;
    }
    allocateXrefId() {
        return this.nextXrefId++;
    }
}
/**
 * Compilation-in-progress of a whole component's template, including the main template and any
 * embedded views or host bindings.
 */
export class ComponentCompilationJob {
    get units() {
        return this.views.values();
    }
    constructor(componentName, pool, compatibility) {
        this.componentName = componentName;
        this.pool = pool;
        this.compatibility = compatibility;
        this.fnSuffix = 'Template';
        /**
         * Tracks the next `ir.XrefId` which can be assigned as template structures are ingested.
         */
        this.nextXrefId = 0;
        /**
         * Map of view IDs to `ViewCompilation`s.
         */
        this.views = new Map();
        /**
         * Constant expressions used by operations within this component's compilation.
         *
         * This will eventually become the `consts` array in the component definition.
         */
        this.consts = [];
        // Allocate the root view.
        const root = new ViewCompilationUnit(this, this.allocateXrefId(), null);
        this.views.set(root.xref, root);
        this.root = root;
    }
    /**
     * Add a `ViewCompilation` for a new embedded view to this compilation.
     */
    allocateView(parent) {
        const view = new ViewCompilationUnit(this, this.allocateXrefId(), parent);
        this.views.set(view.xref, view);
        return view;
    }
    /**
     * Generate a new unique `ir.XrefId` in this job.
     */
    allocateXrefId() {
        return this.nextXrefId++;
    }
    /**
     * Add a constant `o.Expression` to the compilation and return its index in the `consts` array.
     */
    addConst(newConst) {
        for (let idx = 0; idx < this.consts.length; idx++) {
            if (this.consts[idx].isEquivalent(newConst)) {
                return idx;
            }
        }
        const idx = this.consts.length;
        this.consts.push(newConst);
        return idx;
    }
}
/**
 * Compilation-in-progress of an individual view within a template.
 */
export class ViewCompilationUnit extends CompilationUnit {
    constructor(job, xref, parent) {
        super(xref);
        this.job = job;
        this.parent = parent;
        /**
         * Map of declared variables available within this view to the property on the context object
         * which they alias.
         */
        this.contextVariables = new Map();
        /**
         * Number of declaration slots used within this view, or `null` if slots have not yet been
         * allocated.
         */
        this.decls = null;
    }
    get compatibility() {
        return this.job.compatibility;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvc3JjL2NvbXBpbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE9BQU8sS0FBSyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRTVCOzs7R0FHRztBQUNILE1BQU0sT0FBZ0IsZUFBZTtJQWNuQyxZQUFxQixJQUFlO1FBQWYsU0FBSSxHQUFKLElBQUksQ0FBVztRQWJwQzs7OztXQUlHO1FBQ00sV0FBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBZSxDQUFDO1FBRS9DOztXQUVHO1FBQ00sV0FBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBZSxDQUFDO1FBd0IvQzs7OztXQUlHO1FBQ0gsV0FBTSxHQUFnQixJQUFJLENBQUM7UUFFM0I7OztXQUdHO1FBQ0gsU0FBSSxHQUFnQixJQUFJLENBQUM7SUFoQ2MsQ0FBQztJQUV4Qzs7OztPQUlHO0lBQ0gsQ0FBRSxHQUFHO1FBQ0gsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2dCQUNsQyxLQUFLLE1BQU0sVUFBVSxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUU7b0JBQ3RDLE1BQU0sVUFBVSxDQUFDO2lCQUNsQjthQUNGO1NBQ0Y7UUFDRCxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsTUFBTSxFQUFFLENBQUM7U0FDVjtJQUNILENBQUM7Q0FjRjtBQWdDRCxNQUFNLE9BQU8seUJBQTBCLFNBQVEsZUFBZTtJQVU1RCwrRkFBK0Y7SUFDL0YsU0FBUztJQUNULFlB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QU0sR0FBTixNQUFNLENBQWdCO1FBSTNGOzs7V0FHRztRQUNNLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBRXREOzs7V0FHRztRQUNILFVBQUssR0FBZ0IsSUFBSSxDQUFDO0lBWjFCLENBQUM7SUFjRCxJQUFJLGFBQWE7UUFDZixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDO0lBQ2hDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN0YW50UG9vbH0gZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRfcG9vbCc7XG5pbXBvcnQgKiBhcyBvIGZyb20gJy4uLy4uLy4uL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCAqIGFzIGlyIGZyb20gJy4uL2lyJztcblxuLyoqXG4gKiBBIGNvbXBpbGF0aW9uIHVuaXQgaXMgY29tcGlsZWQgaW50byBhIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICogU29tZSBleGFtcGxlIHVuaXRzIGFyZSB2aWV3cyBhbmQgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBpbGF0aW9uVW5pdCB7XG4gIC8qKlxuICAgKiBMaXN0IG9mIGNyZWF0aW9uIG9wZXJhdGlvbnMgZm9yIHRoaXMgdmlldy5cbiAgICpcbiAgICogQ3JlYXRpb24gb3BlcmF0aW9ucyBtYXkgaW50ZXJuYWxseSBjb250YWluIG90aGVyIG9wZXJhdGlvbnMsIGluY2x1ZGluZyB1cGRhdGUgb3BlcmF0aW9ucy5cbiAgICovXG4gIHJlYWRvbmx5IGNyZWF0ZSA9IG5ldyBpci5PcExpc3Q8aXIuQ3JlYXRlT3A+KCk7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgdXBkYXRlIG9wZXJhdGlvbnMgZm9yIHRoaXMgdmlldy5cbiAgICovXG4gIHJlYWRvbmx5IHVwZGF0ZSA9IG5ldyBpci5PcExpc3Q8aXIuVXBkYXRlT3A+KCk7XG4gIGFic3RyYWN0IHJlYWRvbmx5IGpvYjogQ29tcGlsYXRpb25Kb2I7XG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgeHJlZjogaXIuWHJlZklkKSB7fVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGBpci5PcGBzIHdpdGhpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFNvbWUgb3BlcmF0aW9ucyBtYXkgaGF2ZSBjaGlsZCBvcGVyYXRpb25zLCB3aGljaCB0aGlzIGl0ZXJhdG9yIHdpbGwgdmlzaXQuXG4gICAqL1xuICAqIG9wcygpOiBHZW5lcmF0b3I8aXIuQ3JlYXRlT3B8aXIuVXBkYXRlT3A+IHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHRoaXMuY3JlYXRlKSB7XG4gICAgICB5aWVsZCBvcDtcbiAgICAgIGlmIChvcC5raW5kID09PSBpci5PcEtpbmQuTGlzdGVuZXIpIHtcbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lck9wIG9mIG9wLmhhbmRsZXJPcHMpIHtcbiAgICAgICAgICB5aWVsZCBsaXN0ZW5lck9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qgb3Agb2YgdGhpcy51cGRhdGUpIHtcbiAgICAgIHlpZWxkIG9wO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoZSBmdW5jdGlvbiB3aGljaCB3aWxsIGJlIGdlbmVyYXRlZCBmb3IgdGhpcyB1bml0LlxuICAgKlxuICAgKiBNYXkgYmUgYG51bGxgIGlmIG5vdCB5ZXQgZGV0ZXJtaW5lZC5cbiAgICovXG4gIGZuTmFtZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmFyaWFibGUgc2xvdHMgdXNlZCB3aXRoaW4gdGhpcyB2aWV3LCBvciBgbnVsbGAgaWYgdmFyaWFibGVzIGhhdmUgbm90IHlldCBiZWVuXG4gICAqIGNvdW50ZWQuXG4gICAqL1xuICB2YXJzOiBudW1iZXJ8bnVsbCA9IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGlsYXRpb25Kb2Ige1xuICBnZXQgdW5pdHMoKTogSXRlcmFibGU8Q29tcGlsYXRpb25Vbml0PjtcblxuICBnZXQgZm5TdWZmaXgoKTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGNvbXBpbGUgaW4gY29tcGF0aWJpbGl0eSBtb2RlLCB0byBpbWl0YXRlIHRoZSBvdXRwdXQgb2YgYFRlbXBsYXRlRGVmaW5pdGlvbkJ1aWxkZXJgLlxuICAgKi9cbiAgY29tcGF0aWJpbGl0eTogaXIuQ29tcGF0aWJpbGl0eU1vZGU7XG5cbiAgY29tcG9uZW50TmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBjb21waWxhdGlvbiB1bml0LCBzdWNoIGFzIHRoZSBjb21wb25lbnQncyB0ZW1wbGF0ZSwgb3IgdGhlIGhvc3QgYmluZGluZydzIGNvbXBpbGF0aW9uXG4gICAqIHVuaXQuXG4gICAqL1xuICByb290OiBDb21waWxhdGlvblVuaXQ7XG5cbiAgLyoqXG4gICAqIFRoZSBjb25zdGFudCBwb29sIGZvciB0aGUgam9iLCB3aGljaCB3aWxsIGJlIHRyYW5zZm9ybWVkIGludG8gYSBjb25zdGFudCBhcnJheSBvbiB0aGUgZW1pdHRlZFxuICAgKiBmdW5jdGlvbi5cbiAgICovXG4gIHBvb2w6IENvbnN0YW50UG9vbDtcblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBuZXcgdW5pcXVlIGBpci5YcmVmSWRgIGluIHRoaXMgam9iLlxuICAgKi9cbiAgYWxsb2NhdGVYcmVmSWQoKTogaXIuWHJlZklkO1xufVxuXG5leHBvcnQgY2xhc3MgSG9zdEJpbmRpbmdDb21waWxhdGlvbkpvYiBleHRlbmRzIENvbXBpbGF0aW9uVW5pdCBpbXBsZW1lbnRzIENvbXBpbGF0aW9uSm9iIHtcbiAgcmVhZG9ubHkgZm5TdWZmaXggPSAnSG9zdEJpbmRpbmdzJztcblxuICByZWFkb25seSB1bml0cyA9IFt0aGlzXTtcblxuICAvKipcbiAgICogVHJhY2tzIHRoZSBuZXh0IGBpci5YcmVmSWRgIHdoaWNoIGNhbiBiZSBhc3NpZ25lZCBhcyB0ZW1wbGF0ZSBzdHJ1Y3R1cmVzIGFyZSBpbmdlc3RlZC5cbiAgICovXG4gIHByaXZhdGUgbmV4dFhyZWZJZDogaXIuWHJlZklkO1xuXG4gIC8vIFRPRE86IFBlcmhhcHMgd2Ugc2hvdWxkIGFjY2VwdCBhIHJlZmVyZW5jZSB0byB0aGUgZW5jbG9zaW5nIGNvbXBvbmVudCwgYW5kIGdldCB0aGUgbmFtZSBmcm9tXG4gIC8vIHRoZXJlP1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHJlYWRvbmx5IGNvbXBvbmVudE5hbWU6IHN0cmluZywgcmVhZG9ubHkgcG9vbDogQ29uc3RhbnRQb29sLFxuICAgICAgcmVhZG9ubHkgY29tcGF0aWJpbGl0eTogaXIuQ29tcGF0aWJpbGl0eU1vZGUpIHtcbiAgICBzdXBlcigwIGFzIGlyLlhyZWZJZCk7XG4gICAgdGhpcy5uZXh0WHJlZklkID0gMSBhcyBpci5YcmVmSWQ7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgam9iKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhbGxvY2F0ZVhyZWZJZCgpOiBpci5YcmVmSWQge1xuICAgIHJldHVybiB0aGlzLm5leHRYcmVmSWQrKyBhcyBpci5YcmVmSWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxhdGlvbi1pbi1wcm9ncmVzcyBvZiBhIHdob2xlIGNvbXBvbmVudCdzIHRlbXBsYXRlLCBpbmNsdWRpbmcgdGhlIG1haW4gdGVtcGxhdGUgYW5kIGFueVxuICogZW1iZWRkZWQgdmlld3Mgb3IgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudENvbXBpbGF0aW9uSm9iIGltcGxlbWVudHMgQ29tcGlsYXRpb25Kb2Ige1xuICByZWFkb25seSBmblN1ZmZpeCA9ICdUZW1wbGF0ZSc7XG5cbiAgLyoqXG4gICAqIFRyYWNrcyB0aGUgbmV4dCBgaXIuWHJlZklkYCB3aGljaCBjYW4gYmUgYXNzaWduZWQgYXMgdGVtcGxhdGUgc3RydWN0dXJlcyBhcmUgaW5nZXN0ZWQuXG4gICAqL1xuICBwcml2YXRlIG5leHRYcmVmSWQ6IGlyLlhyZWZJZCA9IDAgYXMgaXIuWHJlZklkO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgdmlldyBJRHMgdG8gYFZpZXdDb21waWxhdGlvbmBzLlxuICAgKi9cbiAgcmVhZG9ubHkgdmlld3MgPSBuZXcgTWFwPGlyLlhyZWZJZCwgVmlld0NvbXBpbGF0aW9uVW5pdD4oKTtcblxuICBnZXQgdW5pdHMoKTogSXRlcmFibGU8Vmlld0NvbXBpbGF0aW9uVW5pdD4ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzLnZhbHVlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0YW50IGV4cHJlc3Npb25zIHVzZWQgYnkgb3BlcmF0aW9ucyB3aXRoaW4gdGhpcyBjb21wb25lbnQncyBjb21waWxhdGlvbi5cbiAgICpcbiAgICogVGhpcyB3aWxsIGV2ZW50dWFsbHkgYmVjb21lIHRoZSBgY29uc3RzYCBhcnJheSBpbiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqL1xuICByZWFkb25seSBjb25zdHM6IG8uRXhwcmVzc2lvbltdID0gW107XG5cbiAgLyoqXG4gICAqIFRoZSByb290IHZpZXcsIHJlcHJlc2VudGluZyB0aGUgY29tcG9uZW50J3MgdGVtcGxhdGUuXG4gICAqL1xuICByZWFkb25seSByb290OiBWaWV3Q29tcGlsYXRpb25Vbml0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgY29tcG9uZW50TmFtZTogc3RyaW5nLCByZWFkb25seSBwb29sOiBDb25zdGFudFBvb2wsXG4gICAgICByZWFkb25seSBjb21wYXRpYmlsaXR5OiBpci5Db21wYXRpYmlsaXR5TW9kZSkge1xuICAgIC8vIEFsbG9jYXRlIHRoZSByb290IHZpZXcuXG4gICAgY29uc3Qgcm9vdCA9IG5ldyBWaWV3Q29tcGlsYXRpb25Vbml0KHRoaXMsIHRoaXMuYWxsb2NhdGVYcmVmSWQoKSwgbnVsbCk7XG4gICAgdGhpcy52aWV3cy5zZXQocm9vdC54cmVmLCByb290KTtcbiAgICB0aGlzLnJvb3QgPSByb290O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGBWaWV3Q29tcGlsYXRpb25gIGZvciBhIG5ldyBlbWJlZGRlZCB2aWV3IHRvIHRoaXMgY29tcGlsYXRpb24uXG4gICAqL1xuICBhbGxvY2F0ZVZpZXcocGFyZW50OiBpci5YcmVmSWQpOiBWaWV3Q29tcGlsYXRpb25Vbml0IHtcbiAgICBjb25zdCB2aWV3ID0gbmV3IFZpZXdDb21waWxhdGlvblVuaXQodGhpcywgdGhpcy5hbGxvY2F0ZVhyZWZJZCgpLCBwYXJlbnQpO1xuICAgIHRoaXMudmlld3Muc2V0KHZpZXcueHJlZiwgdmlldyk7XG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBuZXcgdW5pcXVlIGBpci5YcmVmSWRgIGluIHRoaXMgam9iLlxuICAgKi9cbiAgYWxsb2NhdGVYcmVmSWQoKTogaXIuWHJlZklkIHtcbiAgICByZXR1cm4gdGhpcy5uZXh0WHJlZklkKysgYXMgaXIuWHJlZklkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGNvbnN0YW50IGBvLkV4cHJlc3Npb25gIHRvIHRoZSBjb21waWxhdGlvbiBhbmQgcmV0dXJuIGl0cyBpbmRleCBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gICAqL1xuICBhZGRDb25zdChuZXdDb25zdDogby5FeHByZXNzaW9uKTogaXIuQ29uc3RJbmRleCB7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5jb25zdHMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgaWYgKHRoaXMuY29uc3RzW2lkeF0uaXNFcXVpdmFsZW50KG5ld0NvbnN0KSkge1xuICAgICAgICByZXR1cm4gaWR4IGFzIGlyLkNvbnN0SW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGlkeCA9IHRoaXMuY29uc3RzLmxlbmd0aDtcbiAgICB0aGlzLmNvbnN0cy5wdXNoKG5ld0NvbnN0KTtcbiAgICByZXR1cm4gaWR4IGFzIGlyLkNvbnN0SW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxhdGlvbi1pbi1wcm9ncmVzcyBvZiBhbiBpbmRpdmlkdWFsIHZpZXcgd2l0aGluIGEgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBWaWV3Q29tcGlsYXRpb25Vbml0IGV4dGVuZHMgQ29tcGlsYXRpb25Vbml0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSBqb2I6IENvbXBvbmVudENvbXBpbGF0aW9uSm9iLCB4cmVmOiBpci5YcmVmSWQsIHJlYWRvbmx5IHBhcmVudDogaXIuWHJlZklkfG51bGwpIHtcbiAgICBzdXBlcih4cmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgb2YgZGVjbGFyZWQgdmFyaWFibGVzIGF2YWlsYWJsZSB3aXRoaW4gdGhpcyB2aWV3IHRvIHRoZSBwcm9wZXJ0eSBvbiB0aGUgY29udGV4dCBvYmplY3RcbiAgICogd2hpY2ggdGhleSBhbGlhcy5cbiAgICovXG4gIHJlYWRvbmx5IGNvbnRleHRWYXJpYWJsZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgZGVjbGFyYXRpb24gc2xvdHMgdXNlZCB3aXRoaW4gdGhpcyB2aWV3LCBvciBgbnVsbGAgaWYgc2xvdHMgaGF2ZSBub3QgeWV0IGJlZW5cbiAgICogYWxsb2NhdGVkLlxuICAgKi9cbiAgZGVjbHM6IG51bWJlcnxudWxsID0gbnVsbDtcblxuICBnZXQgY29tcGF0aWJpbGl0eSgpOiBpci5Db21wYXRpYmlsaXR5TW9kZSB7XG4gICAgcmV0dXJuIHRoaXMuam9iLmNvbXBhdGliaWxpdHk7XG4gIH1cbn1cbiJdfQ==