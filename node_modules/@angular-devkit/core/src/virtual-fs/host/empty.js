"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empty = void 0;
const rxjs_1 = require("rxjs");
const exception_1 = require("../../exception");
class Empty {
    constructor() {
        this.capabilities = {
            synchronous: true,
        };
    }
    read(path) {
        return (0, rxjs_1.throwError)(new exception_1.FileDoesNotExistException(path));
    }
    list(path) {
        return (0, rxjs_1.of)([]);
    }
    exists(path) {
        return (0, rxjs_1.of)(false);
    }
    isDirectory(path) {
        return (0, rxjs_1.of)(false);
    }
    isFile(path) {
        return (0, rxjs_1.of)(false);
    }
    stat(path) {
        // We support stat() but have no file.
        return (0, rxjs_1.of)(null);
    }
}
exports.Empty = Empty;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy92aXJ0dWFsLWZzL2hvc3QvZW1wdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQWtEO0FBQ2xELCtDQUE0RDtBQUk1RCxNQUFhLEtBQUs7SUFBbEI7UUFDVyxpQkFBWSxHQUFxQjtZQUN4QyxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDO0lBMEJKLENBQUM7SUF4QkMsSUFBSSxDQUFDLElBQVU7UUFDYixPQUFPLElBQUEsaUJBQVUsRUFBQyxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFBLFNBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLElBQVU7UUFDZixPQUFPLElBQUEsU0FBRSxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBVTtRQUNwQixPQUFPLElBQUEsU0FBRSxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLE9BQU8sSUFBQSxTQUFFLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2Isc0NBQXNDO1FBQ3RDLE9BQU8sSUFBQSxTQUFFLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsQ0FBQztDQUNGO0FBN0JELHNCQTZCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXRoLCBQYXRoRnJhZ21lbnQgfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7IEZpbGVCdWZmZXIsIEhvc3RDYXBhYmlsaXRpZXMsIFJlYWRvbmx5SG9zdCwgU3RhdHMgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBjbGFzcyBFbXB0eSBpbXBsZW1lbnRzIFJlYWRvbmx5SG9zdCB7XG4gIHJlYWRvbmx5IGNhcGFiaWxpdGllczogSG9zdENhcGFiaWxpdGllcyA9IHtcbiAgICBzeW5jaHJvbm91czogdHJ1ZSxcbiAgfTtcblxuICByZWFkKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPEZpbGVCdWZmZXI+IHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKSk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFBhdGhGcmFnbWVudFtdPiB7XG4gICAgcmV0dXJuIG9mKFtdKTtcbiAgfVxuXG4gIGV4aXN0cyhwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIG9mKGZhbHNlKTtcbiAgfVxuXG4gIGlzRGlyZWN0b3J5KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gb2YoZmFsc2UpO1xuICB9XG5cbiAgaXNGaWxlKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gb2YoZmFsc2UpO1xuICB9XG5cbiAgc3RhdChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxTdGF0czx7fT4gfCBudWxsPiB7XG4gICAgLy8gV2Ugc3VwcG9ydCBzdGF0KCkgYnV0IGhhdmUgbm8gZmlsZS5cbiAgICByZXR1cm4gb2YobnVsbCk7XG4gIH1cbn1cbiJdfQ==