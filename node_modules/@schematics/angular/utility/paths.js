"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativePathToWorkspaceRoot = void 0;
const core_1 = require("@angular-devkit/core");
function relativePathToWorkspaceRoot(projectRoot) {
    const normalizedPath = (0, core_1.split)((0, core_1.normalize)(projectRoot || ''));
    if (normalizedPath.length === 0 || !normalizedPath[0]) {
        return '.';
    }
    else {
        return normalizedPath.map(() => '..').join('/');
    }
}
exports.relativePathToWorkspaceRoot = relativePathToWorkspaceRoot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9wYXRocy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBd0Q7QUFFeEQsU0FBZ0IsMkJBQTJCLENBQUMsV0FBK0I7SUFDekUsTUFBTSxjQUFjLEdBQUcsSUFBQSxZQUFLLEVBQUMsSUFBQSxnQkFBUyxFQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDckQsT0FBTyxHQUFHLENBQUM7S0FDWjtTQUFNO1FBQ0wsT0FBTyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqRDtBQUNILENBQUM7QUFSRCxrRUFRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBub3JtYWxpemUsIHNwbGl0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290KHByb2plY3RSb290OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkUGF0aCA9IHNwbGl0KG5vcm1hbGl6ZShwcm9qZWN0Um9vdCB8fCAnJykpO1xuXG4gIGlmIChub3JtYWxpemVkUGF0aC5sZW5ndGggPT09IDAgfHwgIW5vcm1hbGl6ZWRQYXRoWzBdKSB7XG4gICAgcmV0dXJuICcuJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbm9ybWFsaXplZFBhdGgubWFwKCgpID0+ICcuLicpLmpvaW4oJy8nKTtcbiAgfVxufVxuIl19