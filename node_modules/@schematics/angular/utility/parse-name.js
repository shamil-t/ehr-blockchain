"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseName = void 0;
const core_1 = require("@angular-devkit/core");
function parseName(path, name) {
    const nameWithoutPath = (0, core_1.basename)((0, core_1.normalize)(name));
    const namePath = (0, core_1.dirname)((0, core_1.join)((0, core_1.normalize)(path), name));
    return {
        name: nameWithoutPath,
        path: (0, core_1.normalize)('/' + namePath),
    };
}
exports.parseName = parseName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3BhcnNlLW5hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQWdGO0FBT2hGLFNBQWdCLFNBQVMsQ0FBQyxJQUFZLEVBQUUsSUFBWTtJQUNsRCxNQUFNLGVBQWUsR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFBLGdCQUFTLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsRCxNQUFNLFFBQVEsR0FBRyxJQUFBLGNBQU8sRUFBQyxJQUFBLFdBQUksRUFBQyxJQUFBLGdCQUFTLEVBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUV0RCxPQUFPO1FBQ0wsSUFBSSxFQUFFLGVBQWU7UUFDckIsSUFBSSxFQUFFLElBQUEsZ0JBQVMsRUFBQyxHQUFHLEdBQUcsUUFBUSxDQUFDO0tBQ2hDLENBQUM7QUFDSixDQUFDO0FBUkQsOEJBUUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgUGF0aCwgYmFzZW5hbWUsIGRpcm5hbWUsIGpvaW4sIG5vcm1hbGl6ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcblxuZXhwb3J0IGludGVyZmFjZSBMb2NhdGlvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgcGF0aDogUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTmFtZShwYXRoOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IExvY2F0aW9uIHtcbiAgY29uc3QgbmFtZVdpdGhvdXRQYXRoID0gYmFzZW5hbWUobm9ybWFsaXplKG5hbWUpKTtcbiAgY29uc3QgbmFtZVBhdGggPSBkaXJuYW1lKGpvaW4obm9ybWFsaXplKHBhdGgpLCBuYW1lKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBuYW1lV2l0aG91dFBhdGgsXG4gICAgcGF0aDogbm9ybWFsaXplKCcvJyArIG5hbWVQYXRoKSxcbiAgfTtcbn1cbiJdfQ==