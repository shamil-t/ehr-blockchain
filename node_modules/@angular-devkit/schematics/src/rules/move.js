"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.move = void 0;
const core_1 = require("@angular-devkit/core");
const base_1 = require("./base");
function move(from, to) {
    if (to === undefined) {
        to = from;
        from = '/';
    }
    const fromPath = (0, core_1.normalize)('/' + from);
    const toPath = (0, core_1.normalize)('/' + to);
    if (fromPath === toPath) {
        return base_1.noop;
    }
    return (tree) => {
        if (tree.exists(fromPath)) {
            // fromPath is a file
            tree.rename(fromPath, toPath);
        }
        else {
            // fromPath is a directory
            tree.getDir(fromPath).visit((path) => {
                tree.rename(path, (0, core_1.join)(toPath, path.slice(fromPath.length)));
            });
        }
        return tree;
    };
}
exports.move = move;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL21vdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXVEO0FBRXZELGlDQUE4QjtBQUU5QixTQUFnQixJQUFJLENBQUMsSUFBWSxFQUFFLEVBQVc7SUFDNUMsSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO1FBQ3BCLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDVixJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ1o7SUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFBLGdCQUFTLEVBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFbkMsSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFO1FBQ3ZCLE9BQU8sV0FBSSxDQUFDO0tBQ2I7SUFFRCxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDZCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQy9CO2FBQU07WUFDTCwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBMUJELG9CQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqb2luLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBSdWxlIH0gZnJvbSAnLi4vZW5naW5lL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBub29wIH0gZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1vdmUoZnJvbTogc3RyaW5nLCB0bz86IHN0cmluZyk6IFJ1bGUge1xuICBpZiAodG8gPT09IHVuZGVmaW5lZCkge1xuICAgIHRvID0gZnJvbTtcbiAgICBmcm9tID0gJy8nO1xuICB9XG5cbiAgY29uc3QgZnJvbVBhdGggPSBub3JtYWxpemUoJy8nICsgZnJvbSk7XG4gIGNvbnN0IHRvUGF0aCA9IG5vcm1hbGl6ZSgnLycgKyB0byk7XG5cbiAgaWYgKGZyb21QYXRoID09PSB0b1BhdGgpIHtcbiAgICByZXR1cm4gbm9vcDtcbiAgfVxuXG4gIHJldHVybiAodHJlZSkgPT4ge1xuICAgIGlmICh0cmVlLmV4aXN0cyhmcm9tUGF0aCkpIHtcbiAgICAgIC8vIGZyb21QYXRoIGlzIGEgZmlsZVxuICAgICAgdHJlZS5yZW5hbWUoZnJvbVBhdGgsIHRvUGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZyb21QYXRoIGlzIGEgZGlyZWN0b3J5XG4gICAgICB0cmVlLmdldERpcihmcm9tUGF0aCkudmlzaXQoKHBhdGgpID0+IHtcbiAgICAgICAgdHJlZS5yZW5hbWUocGF0aCwgam9pbih0b1BhdGgsIHBhdGguc2xpY2UoZnJvbVBhdGgubGVuZ3RoKSkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWU7XG4gIH07XG59XG4iXX0=