"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = void 0;
/** Naive priority queue; not intended for large datasets */
class PriorityQueue {
    constructor(_comparator) {
        this._comparator = _comparator;
        this._items = new Array();
    }
    clear() {
        this._items = new Array();
    }
    push(item) {
        const index = this._items.findIndex((existing) => this._comparator(item, existing) <= 0);
        if (index === -1) {
            this._items.push(item);
        }
        else {
            this._items.splice(index, 0, item);
        }
    }
    pop() {
        if (this._items.length === 0) {
            return undefined;
        }
        return this._items.splice(0, 1)[0];
    }
    peek() {
        if (this._items.length === 0) {
            return undefined;
        }
        return this._items[0];
    }
    get size() {
        return this._items.length;
    }
    toArray() {
        return this._items.slice();
    }
}
exports.PriorityQueue = PriorityQueue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHktcXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy91dGlscy9wcmlvcml0eS1xdWV1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCw0REFBNEQ7QUFDNUQsTUFBYSxhQUFhO0lBR3hCLFlBQW9CLFdBQW1DO1FBQW5DLGdCQUFXLEdBQVgsV0FBVyxDQUF3QjtRQUYvQyxXQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUssQ0FBQztJQUUwQixDQUFDO0lBRTNELEtBQUs7UUFDSCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksS0FBSyxFQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFPO1FBQ1YsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXpGLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hCO2FBQU07WUFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3BDO0lBQ0gsQ0FBQztJQUVELEdBQUc7UUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM1QixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDNUIsQ0FBQztJQUVELE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBMUNELHNDQTBDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogTmFpdmUgcHJpb3JpdHkgcXVldWU7IG5vdCBpbnRlbmRlZCBmb3IgbGFyZ2UgZGF0YXNldHMgKi9cbmV4cG9ydCBjbGFzcyBQcmlvcml0eVF1ZXVlPFQ+IHtcbiAgcHJpdmF0ZSBfaXRlbXMgPSBuZXcgQXJyYXk8VD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb21wYXJhdG9yOiAoeDogVCwgeTogVCkgPT4gbnVtYmVyKSB7fVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX2l0ZW1zID0gbmV3IEFycmF5PFQ+KCk7XG4gIH1cblxuICBwdXNoKGl0ZW06IFQpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX2l0ZW1zLmZpbmRJbmRleCgoZXhpc3RpbmcpID0+IHRoaXMuX2NvbXBhcmF0b3IoaXRlbSwgZXhpc3RpbmcpIDw9IDApO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5faXRlbXMucHVzaChpdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5faXRlbXMuc3BsaWNlKGluZGV4LCAwLCBpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwb3AoKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuX2l0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5faXRlbXMuc3BsaWNlKDAsIDEpWzBdO1xuICB9XG5cbiAgcGVlaygpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5faXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9pdGVtc1swXTtcbiAgfVxuXG4gIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zLmxlbmd0aDtcbiAgfVxuXG4gIHRvQXJyYXkoKTogQXJyYXk8VD4ge1xuICAgIHJldHVybiB0aGlzLl9pdGVtcy5zbGljZSgpO1xuICB9XG59XG4iXX0=