"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkspaceHost = void 0;
const rxjs_1 = require("rxjs");
const virtual_fs_1 = require("../virtual-fs");
function createWorkspaceHost(host) {
    const workspaceHost = {
        async readFile(path) {
            const data = await (0, rxjs_1.lastValueFrom)(host.read((0, virtual_fs_1.normalize)(path)));
            return virtual_fs_1.virtualFs.fileBufferToString(data);
        },
        async writeFile(path, data) {
            return (0, rxjs_1.lastValueFrom)(host.write((0, virtual_fs_1.normalize)(path), virtual_fs_1.virtualFs.stringToFileBuffer(data)));
        },
        async isDirectory(path) {
            try {
                return await (0, rxjs_1.lastValueFrom)(host.isDirectory((0, virtual_fs_1.normalize)(path)));
            }
            catch {
                // some hosts throw if path does not exist
                return false;
            }
        },
        async isFile(path) {
            try {
                return await (0, rxjs_1.lastValueFrom)(host.isFile((0, virtual_fs_1.normalize)(path)));
            }
            catch {
                // some hosts throw if path does not exist
                return false;
            }
        },
    };
    return workspaceHost;
}
exports.createWorkspaceHost = createWorkspaceHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZS9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUFxQztBQUNyQyw4Q0FBcUQ7QUFhckQsU0FBZ0IsbUJBQW1CLENBQUMsSUFBb0I7SUFDdEQsTUFBTSxhQUFhLEdBQWtCO1FBQ25DLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBWTtZQUN6QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsb0JBQWEsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsc0JBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0QsT0FBTyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQVksRUFBRSxJQUFZO1lBQ3hDLE9BQU8sSUFBQSxvQkFBYSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxFQUFFLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFDRCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQVk7WUFDNUIsSUFBSTtnQkFDRixPQUFPLE1BQU0sSUFBQSxvQkFBYSxFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvRDtZQUFDLE1BQU07Z0JBQ04sMENBQTBDO2dCQUMxQyxPQUFPLEtBQUssQ0FBQzthQUNkO1FBQ0gsQ0FBQztRQUNELEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtZQUN2QixJQUFJO2dCQUNGLE9BQU8sTUFBTSxJQUFBLG9CQUFhLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFBLHNCQUFTLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzFEO1lBQUMsTUFBTTtnQkFDTiwwQ0FBMEM7Z0JBQzFDLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7UUFDSCxDQUFDO0tBQ0YsQ0FBQztJQUVGLE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUE3QkQsa0RBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGxhc3RWYWx1ZUZyb20gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IG5vcm1hbGl6ZSwgdmlydHVhbEZzIH0gZnJvbSAnLi4vdmlydHVhbC1mcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV29ya3NwYWNlSG9zdCB7XG4gIHJlYWRGaWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPjtcbiAgd3JpdGVGaWxlKHBhdGg6IHN0cmluZywgZGF0YTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcblxuICBpc0RpcmVjdG9yeShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+O1xuICBpc0ZpbGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPjtcblxuICAvLyBQb3RlbnRpYWwgZnV0dXJlIGFkZGl0aW9uc1xuICAvLyByZWFkRGlyZWN0b3J5PyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdvcmtzcGFjZUhvc3QoaG9zdDogdmlydHVhbEZzLkhvc3QpOiBXb3Jrc3BhY2VIb3N0IHtcbiAgY29uc3Qgd29ya3NwYWNlSG9zdDogV29ya3NwYWNlSG9zdCA9IHtcbiAgICBhc3luYyByZWFkRmlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGxhc3RWYWx1ZUZyb20oaG9zdC5yZWFkKG5vcm1hbGl6ZShwYXRoKSkpO1xuXG4gICAgICByZXR1cm4gdmlydHVhbEZzLmZpbGVCdWZmZXJUb1N0cmluZyhkYXRhKTtcbiAgICB9LFxuICAgIGFzeW5jIHdyaXRlRmlsZShwYXRoOiBzdHJpbmcsIGRhdGE6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgcmV0dXJuIGxhc3RWYWx1ZUZyb20oaG9zdC53cml0ZShub3JtYWxpemUocGF0aCksIHZpcnR1YWxGcy5zdHJpbmdUb0ZpbGVCdWZmZXIoZGF0YSkpKTtcbiAgICB9LFxuICAgIGFzeW5jIGlzRGlyZWN0b3J5KHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGxhc3RWYWx1ZUZyb20oaG9zdC5pc0RpcmVjdG9yeShub3JtYWxpemUocGF0aCkpKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBzb21lIGhvc3RzIHRocm93IGlmIHBhdGggZG9lcyBub3QgZXhpc3RcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgaXNGaWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGxhc3RWYWx1ZUZyb20oaG9zdC5pc0ZpbGUobm9ybWFsaXplKHBhdGgpKSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gc29tZSBob3N0cyB0aHJvdyBpZiBwYXRoIGRvZXMgbm90IGV4aXN0XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiB3b3Jrc3BhY2VIb3N0O1xufVxuIl19