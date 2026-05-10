"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStringRef = void 0;
const path_1 = require("path");
class ExportStringRef {
    constructor(ref, parentPath = process.cwd(), inner = true) {
        const [path, name] = ref.split('#', 2);
        this._module = path[0] == '.' ? (0, path_1.resolve)(parentPath, path) : path;
        this._module = require.resolve(this._module);
        this._path = (0, path_1.dirname)(this._module);
        if (inner) {
            this._ref = require(this._module)[name || 'default'];
        }
        else {
            this._ref = require(this._module);
        }
    }
    get ref() {
        return this._ref;
    }
    get module() {
        return this._module;
    }
    get path() {
        return this._path;
    }
}
exports.ExportStringRef = ExportStringRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvZXhwb3J0LXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBd0M7QUFFeEMsTUFBYSxlQUFlO0lBSzFCLFlBQVksR0FBVyxFQUFFLGFBQXFCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEdBQUcsSUFBSTtRQUN2RSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFPLEVBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDakUsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuQyxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUM7U0FDdEQ7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUM7SUFFRCxJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUNELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBQ0QsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQTNCRCwwQ0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY2xhc3MgRXhwb3J0U3RyaW5nUmVmPFQ+IHtcbiAgcHJpdmF0ZSBfcmVmPzogVDtcbiAgcHJpdmF0ZSBfbW9kdWxlOiBzdHJpbmc7XG4gIHByaXZhdGUgX3BhdGg6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihyZWY6IHN0cmluZywgcGFyZW50UGF0aDogc3RyaW5nID0gcHJvY2Vzcy5jd2QoKSwgaW5uZXIgPSB0cnVlKSB7XG4gICAgY29uc3QgW3BhdGgsIG5hbWVdID0gcmVmLnNwbGl0KCcjJywgMik7XG4gICAgdGhpcy5fbW9kdWxlID0gcGF0aFswXSA9PSAnLicgPyByZXNvbHZlKHBhcmVudFBhdGgsIHBhdGgpIDogcGF0aDtcbiAgICB0aGlzLl9tb2R1bGUgPSByZXF1aXJlLnJlc29sdmUodGhpcy5fbW9kdWxlKTtcbiAgICB0aGlzLl9wYXRoID0gZGlybmFtZSh0aGlzLl9tb2R1bGUpO1xuXG4gICAgaWYgKGlubmVyKSB7XG4gICAgICB0aGlzLl9yZWYgPSByZXF1aXJlKHRoaXMuX21vZHVsZSlbbmFtZSB8fCAnZGVmYXVsdCddO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZWYgPSByZXF1aXJlKHRoaXMuX21vZHVsZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IHJlZigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVmO1xuICB9XG4gIGdldCBtb2R1bGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vZHVsZTtcbiAgfVxuICBnZXQgcGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgfVxufVxuIl19