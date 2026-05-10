"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternMatchingHost = void 0;
const picomatch_1 = require("picomatch");
const resolver_1 = require("./resolver");
/**
 */
class PatternMatchingHost extends resolver_1.ResolverHost {
    constructor() {
        super(...arguments);
        this._patterns = new Map();
    }
    addPattern(pattern, replacementFn) {
        const patterns = Array.isArray(pattern) ? pattern : [pattern];
        for (const glob of patterns) {
            const { output } = (0, picomatch_1.parse)(glob);
            this._patterns.set(new RegExp(`^${output}$`), replacementFn);
        }
    }
    _resolve(path) {
        let newPath = path;
        this._patterns.forEach((fn, re) => {
            if (re.test(path)) {
                newPath = fn(newPath);
            }
        });
        return newPath;
    }
}
exports.PatternMatchingHost = PatternMatchingHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3ZpcnR1YWwtZnMvaG9zdC9wYXR0ZXJuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHlDQUErQztBQUUvQyx5Q0FBMEM7QUFJMUM7R0FDRztBQUNILE1BQWEsbUJBQWdELFNBQVEsdUJBQW9CO0lBQXpGOztRQUNZLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztJQW9CL0QsQ0FBQztJQWxCQyxVQUFVLENBQUMsT0FBMEIsRUFBRSxhQUFrQztRQUN2RSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUQsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7WUFDM0IsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsaUJBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDOUQ7SUFDSCxDQUFDO0lBRVMsUUFBUSxDQUFDLElBQVU7UUFDM0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ2hDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDakIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN2QjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBckJELGtEQXFCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZUdsb2IgfSBmcm9tICdwaWNvbWF0Y2gnO1xuaW1wb3J0IHsgUGF0aCB9IGZyb20gJy4uL3BhdGgnO1xuaW1wb3J0IHsgUmVzb2x2ZXJIb3N0IH0gZnJvbSAnLi9yZXNvbHZlcic7XG5cbmV4cG9ydCB0eXBlIFJlcGxhY2VtZW50RnVuY3Rpb24gPSAocGF0aDogUGF0aCkgPT4gUGF0aDtcblxuLyoqXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXR0ZXJuTWF0Y2hpbmdIb3N0PFN0YXRzVCBleHRlbmRzIG9iamVjdCA9IHt9PiBleHRlbmRzIFJlc29sdmVySG9zdDxTdGF0c1Q+IHtcbiAgcHJvdGVjdGVkIF9wYXR0ZXJucyA9IG5ldyBNYXA8UmVnRXhwLCBSZXBsYWNlbWVudEZ1bmN0aW9uPigpO1xuXG4gIGFkZFBhdHRlcm4ocGF0dGVybjogc3RyaW5nIHwgc3RyaW5nW10sIHJlcGxhY2VtZW50Rm46IFJlcGxhY2VtZW50RnVuY3Rpb24pIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IEFycmF5LmlzQXJyYXkocGF0dGVybikgPyBwYXR0ZXJuIDogW3BhdHRlcm5dO1xuICAgIGZvciAoY29uc3QgZ2xvYiBvZiBwYXR0ZXJucykge1xuICAgICAgY29uc3QgeyBvdXRwdXQgfSA9IHBhcnNlR2xvYihnbG9iKTtcbiAgICAgIHRoaXMuX3BhdHRlcm5zLnNldChuZXcgUmVnRXhwKGBeJHtvdXRwdXR9JGApLCByZXBsYWNlbWVudEZuKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgX3Jlc29sdmUocGF0aDogUGF0aCkge1xuICAgIGxldCBuZXdQYXRoID0gcGF0aDtcbiAgICB0aGlzLl9wYXR0ZXJucy5mb3JFYWNoKChmbiwgcmUpID0+IHtcbiAgICAgIGlmIChyZS50ZXN0KHBhdGgpKSB7XG4gICAgICAgIG5ld1BhdGggPSBmbihuZXdQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBuZXdQYXRoO1xuICB9XG59XG4iXX0=