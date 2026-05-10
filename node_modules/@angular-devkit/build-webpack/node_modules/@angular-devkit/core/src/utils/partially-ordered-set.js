"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartiallyOrderedSet = exports.CircularDependencyFoundException = exports.DependencyNotFoundException = void 0;
const exception_1 = require("../exception");
class DependencyNotFoundException extends exception_1.BaseException {
    constructor() {
        super('One of the dependencies is not part of the set.');
    }
}
exports.DependencyNotFoundException = DependencyNotFoundException;
class CircularDependencyFoundException extends exception_1.BaseException {
    constructor() {
        super('Circular dependencies found.');
    }
}
exports.CircularDependencyFoundException = CircularDependencyFoundException;
class PartiallyOrderedSet {
    constructor() {
        this._items = new Map();
    }
    _checkCircularDependencies(item, deps) {
        if (deps.has(item)) {
            throw new CircularDependencyFoundException();
        }
        deps.forEach((dep) => this._checkCircularDependencies(item, this._items.get(dep) || new Set()));
    }
    clear() {
        this._items.clear();
    }
    has(item) {
        return this._items.has(item);
    }
    get size() {
        return this._items.size;
    }
    forEach(callbackfn, thisArg) {
        for (const x of this) {
            callbackfn.call(thisArg, x, x, this);
        }
    }
    /**
     * Returns an iterable of [v,v] pairs for every value `v` in the set.
     */
    *entries() {
        for (const item of this) {
            yield [item, item];
        }
    }
    /**
     * Despite its name, returns an iterable of the values in the set,
     */
    keys() {
        return this.values();
    }
    /**
     * Returns an iterable of values in the set.
     */
    values() {
        return this[Symbol.iterator]();
    }
    add(item, deps = new Set()) {
        if (Array.isArray(deps)) {
            deps = new Set(deps);
        }
        // Verify item is not already in the set.
        if (this._items.has(item)) {
            const itemDeps = this._items.get(item) || new Set();
            // If the dependency list is equal, just return, otherwise remove and keep going.
            let equal = true;
            for (const dep of deps) {
                if (!itemDeps.has(dep)) {
                    equal = false;
                    break;
                }
            }
            if (equal) {
                for (const dep of itemDeps) {
                    if (!deps.has(dep)) {
                        equal = false;
                        break;
                    }
                }
            }
            if (equal) {
                return this;
            }
            else {
                this._items.delete(item);
            }
        }
        // Verify all dependencies are part of the Set.
        for (const dep of deps) {
            if (!this._items.has(dep)) {
                throw new DependencyNotFoundException();
            }
        }
        // Verify there's no dependency cycle.
        this._checkCircularDependencies(item, deps);
        this._items.set(item, new Set(deps));
        return this;
    }
    delete(item) {
        if (!this._items.has(item)) {
            return false;
        }
        // Remove it from all dependencies if force == true.
        this._items.forEach((value) => value.delete(item));
        return this._items.delete(item);
    }
    *[Symbol.iterator]() {
        const copy = new Map(this._items);
        for (const [key, value] of copy.entries()) {
            copy.set(key, new Set(value));
        }
        while (copy.size > 0) {
            const run = [];
            // Take the first item without dependencies.
            for (const [item, deps] of copy.entries()) {
                if (deps.size == 0) {
                    run.push(item);
                }
            }
            for (const item of run) {
                copy.forEach((s) => s.delete(item));
                copy.delete(item);
                yield item;
            }
            if (run.length == 0) {
                // uh oh...
                throw new CircularDependencyFoundException();
            }
        }
    }
    get [Symbol.toStringTag]() {
        return 'Set';
    }
}
exports.PartiallyOrderedSet = PartiallyOrderedSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbGx5LW9yZGVyZWQtc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdXRpbHMvcGFydGlhbGx5LW9yZGVyZWQtc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDRDQUE2QztBQUU3QyxNQUFhLDJCQUE0QixTQUFRLHlCQUFhO0lBQzVEO1FBQ0UsS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7SUFDM0QsQ0FBQztDQUNGO0FBSkQsa0VBSUM7QUFDRCxNQUFhLGdDQUFpQyxTQUFRLHlCQUFhO0lBQ2pFO1FBQ0UsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBSkQsNEVBSUM7QUFFRCxNQUFhLG1CQUFtQjtJQUFoQztRQUNVLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO0lBOEl4QyxDQUFDO0lBNUlXLDBCQUEwQixDQUFDLElBQU8sRUFBRSxJQUFZO1FBQ3hELElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNsQixNQUFNLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztTQUM5QztRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDRCxHQUFHLENBQUMsSUFBTztRQUNULE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFD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O1FBQ3RCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQUNGO0FBL0lELGtEQStJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uJztcblxuZXhwb3J0IGNsYXNzIERlcGVuZGVuY3lOb3RGb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignT25lIG9mIHRoZSBkZXBlbmRlbmNpZXMgaXMgbm90IHBhcnQgb2YgdGhlIHNldC4nKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENpcmN1bGFyRGVwZW5kZW5jeUZvdW5kRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCdDaXJjdWxhciBkZXBlbmRlbmNpZXMgZm91bmQuJyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnRpYWxseU9yZGVyZWRTZXQ8VD4gaW1wbGVtZW50cyBTZXQ8VD4ge1xuICBwcml2YXRlIF9pdGVtcyA9IG5ldyBNYXA8VCwgU2V0PFQ+PigpO1xuXG4gIHByb3RlY3RlZCBfY2hlY2tDaXJjdWxhckRlcGVuZGVuY2llcyhpdGVtOiBULCBkZXBzOiBTZXQ8VD4pIHtcbiAgICBpZiAoZGVwcy5oYXMoaXRlbSkpIHtcbiAgICAgIHRocm93IG5ldyBDaXJjdWxhckRlcGVuZGVuY3lGb3VuZEV4Y2VwdGlvbigpO1xuICAgIH1cblxuICAgIGRlcHMuZm9yRWFjaCgoZGVwKSA9PiB0aGlzLl9jaGVja0NpcmN1bGFyRGVwZW5kZW5jaWVzKGl0ZW0sIHRoaXMuX2l0ZW1zLmdldChkZXApIHx8IG5ldyBTZXQoKSkpO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5faXRlbXMuY2xlYXIoKTtcbiAgfVxuICBoYXMoaXRlbTogVCkge1xuICAgIHJldHVybiB0aGlzLl9pdGVtcy5oYXMoaXRlbSk7XG4gIH1cbiAgZ2V0IHNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zLnNpemU7XG4gIH1cbiAgZm9yRWFjaChcbiAgICBjYWxsYmFja2ZuOiAodmFsdWU6IFQsIHZhbHVlMjogVCwgc2V0OiBQYXJ0aWFsbHlPcmRlcmVkU2V0PFQ+KSA9PiB2b2lkLFxuICAgIHRoaXNBcmc/OiBhbnksIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHggb2YgdGhpcykge1xuICAgICAgY2FsbGJhY2tmbi5jYWxsKHRoaXNBcmcsIHgsIHgsIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGl0ZXJhYmxlIG9mIFt2LHZdIHBhaXJzIGZvciBldmVyeSB2YWx1ZSBgdmAgaW4gdGhlIHNldC5cbiAgICovXG4gICplbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W1QsIFRdPiB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMpIHtcbiAgICAgIHlpZWxkIFtpdGVtLCBpdGVtXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzcGl0ZSBpdHMgbmFtZSwgcmV0dXJucyBhbiBpdGVyYWJsZSBvZiB0aGUgdmFsdWVzIGluIHRoZSBzZXQsXG4gICAqL1xuICBrZXlzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VD4ge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gaXRlcmFibGUgb2YgdmFsdWVzIGluIHRoZSBzZXQuXG4gICAqL1xuICB2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxUPiB7XG4gICAgcmV0dXJuIHRoaXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cbiAgYWRkKGl0ZW06IFQsIGRlcHM6IFNldDxUPiB8IFRbXSA9IG5ldyBTZXQoKSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGRlcHMpKSB7XG4gICAgICBkZXBzID0gbmV3IFNldChkZXBzKTtcbiAgICB9XG5cbiAgICAvLyBWZXJpZnkgaXRlbSBpcyBub3QgYWxyZWFkeSBpbiB0aGUgc2V0LlxuICAgIGlmICh0aGlzLl9pdGVtcy5oYXMoaXRlbSkpIHtcbiAgICAgIGNvbnN0IGl0ZW1EZXBzID0gdGhpcy5faXRlbXMuZ2V0KGl0ZW0pIHx8IG5ldyBTZXQ8VD4oKTtcblxuICAgICAgLy8gSWYgdGhlIGRlcGVuZGVuY3kgbGlzdCBpcyBlcXVhbCwganVzdCByZXR1cm4sIG90aGVyd2lzZSByZW1vdmUgYW5kIGtlZXAgZ29pbmcuXG4gICAgICBsZXQgZXF1YWwgPSB0cnVlO1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgZGVwcykge1xuICAgICAgICBpZiAoIWl0ZW1EZXBzLmhhcyhkZXApKSB7XG4gICAgICAgICAgZXF1YWwgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVxdWFsKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGVwIG9mIGl0ZW1EZXBzKSB7XG4gICAgICAgICAgaWYgKCFkZXBzLmhhcyhkZXApKSB7XG4gICAgICAgICAgICBlcXVhbCA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChlcXVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2l0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBWZXJpZnkgYWxsIGRlcGVuZGVuY2llcyBhcmUgcGFydCBvZiB0aGUgU2V0LlxuICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcbiAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKGRlcCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IERlcGVuZGVuY3lOb3RGb3VuZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZlcmlmeSB0aGVyZSdzIG5vIGRlcGVuZGVuY3kgY3ljbGUuXG4gICAgdGhpcy5fY2hlY2tDaXJjdWxhckRlcGVuZGVuY2llcyhpdGVtLCBkZXBzKTtcblxuICAgIHRoaXMuX2l0ZW1zLnNldChpdGVtLCBuZXcgU2V0KGRlcHMpKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVsZXRlKGl0ZW06IFQpIHtcbiAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhpdGVtKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBpdCBmcm9tIGFsbCBkZXBlbmRlbmNpZXMgaWYgZm9yY2UgPT0gdHJ1ZS5cbiAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKCh2YWx1ZSkgPT4gdmFsdWUuZGVsZXRlKGl0ZW0pKTtcblxuICAgIHJldHVybiB0aGlzLl9pdGVtcy5kZWxldGUoaXRlbSk7XG4gIH1cblxuICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgY29uc3QgY29weTogTWFwPFQsIFNldDxUPj4gPSBuZXcgTWFwKHRoaXMuX2l0ZW1zKTtcblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGNvcHkuZW50cmllcygpKSB7XG4gICAgICBjb3B5LnNldChrZXksIG5ldyBTZXQodmFsdWUpKTtcbiAgICB9XG5cbiAgICB3aGlsZSAoY29weS5zaXplID4gMCkge1xuICAgICAgY29uc3QgcnVuOiBUW10gPSBbXTtcbiAgICAgIC8vIFRha2UgdGhlIGZpcnN0IGl0ZW0gd2l0aG91dCBkZXBlbmRlbmNpZXMuXG4gICAgICBmb3IgKGNvbnN0IFtpdGVtLCBkZXBzXSBvZiBjb3B5LmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoZGVwcy5zaXplID09IDApIHtcbiAgICAgICAgICBydW4ucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcnVuKSB7XG4gICAgICAgIGNvcHkuZm9yRWFjaCgocykgPT4gcy5kZWxldGUoaXRlbSkpO1xuICAgICAgICBjb3B5LmRlbGV0ZShpdGVtKTtcbiAgICAgICAgeWllbGQgaXRlbTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJ1bi5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyB1aCBvaC4uLlxuICAgICAgICB0aHJvdyBuZXcgQ2lyY3VsYXJEZXBlbmRlbmN5Rm91bmRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKTogJ1NldCcge1xuICAgIHJldHVybiAnU2V0JztcbiAgfVxufVxuIl19