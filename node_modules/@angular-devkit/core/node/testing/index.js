"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempScopedNodeJsSyncHost = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const src_1 = require("../../src");
const host_1 = require("../host");
/**
 * A Sync Scoped Host that creates a temporary directory and scope to it.
 */
class TempScopedNodeJsSyncHost extends src_1.virtualFs.ScopedHost {
    constructor() {
        const root = (0, src_1.normalize)(path.join(os.tmpdir(), `devkit-host-${+Date.now()}-${process.pid}`));
        fs.mkdirSync((0, src_1.getSystemPath)(root));
        super(new host_1.NodeJsSyncHost(), root);
        this._root = root;
    }
    get files() {
        const sync = this.sync;
        function _visit(p) {
            return sync
                .list(p)
                .map((fragment) => (0, src_1.join)(p, fragment))
                .reduce((files, path) => {
                if (sync.isDirectory(path)) {
                    return files.concat(_visit(path));
                }
                else {
                    return files.concat(path);
                }
            }, []);
        }
        return _visit((0, src_1.normalize)('/'));
    }
    get root() {
        return this._root;
    }
    get sync() {
        if (!this._sync) {
            this._sync = new src_1.virtualFs.SyncDelegateHost(this);
        }
        return this._sync;
    }
}
exports.TempScopedNodeJsSyncHost = TempScopedNodeJsSyncHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL25vZGUvdGVzdGluZy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6Qix1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLG1DQUE0RTtBQUM1RSxrQ0FBeUM7QUFFekM7O0dBRUc7QUFDSCxNQUFhLHdCQUF5QixTQUFRLGVBQVMsQ0FBQyxVQUFvQjtJQUkxRTtRQUNFLE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RixFQUFFLENBQUMsU0FBUyxDQUFDLElBQUEsbUJBQWEsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRWxDLEtBQUssQ0FBQyxJQUFJLHFCQUFjLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRUQsSUFBSSxLQUFLO1FBQ1AsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixTQUFTLE1BQU0sQ0FBQyxDQUFPO1lBQ3JCLE9BQU8sSUFBSTtpQkFDUixJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNQLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBQSxVQUFJLEVBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNwQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ3RCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDMUIsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNuQztxQkFBTTtvQkFDTCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzNCO1lBQ0gsQ0FBQyxFQUFFLEVBQVksQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQyxJQUFBLGVBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGVBQVMsQ0FBQyxnQkFBZ0IsQ0FBVyxJQUFJLENBQUMsQ0FBQztTQUM3RDtRQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUF4Q0QsNERBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBQYXRoLCBnZXRTeXN0ZW1QYXRoLCBqb2luLCBub3JtYWxpemUsIHZpcnR1YWxGcyB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJy4uL2hvc3QnO1xuXG4vKipcbiAqIEEgU3luYyBTY29wZWQgSG9zdCB0aGF0IGNyZWF0ZXMgYSB0ZW1wb3JhcnkgZGlyZWN0b3J5IGFuZCBzY29wZSB0byBpdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBTY29wZWROb2RlSnNTeW5jSG9zdCBleHRlbmRzIHZpcnR1YWxGcy5TY29wZWRIb3N0PGZzLlN0YXRzPiB7XG4gIHByb3RlY3RlZCBfc3luYz86IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0PGZzLlN0YXRzPjtcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIF9yb290OiBQYXRoO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGNvbnN0IHJvb3QgPSBub3JtYWxpemUocGF0aC5qb2luKG9zLnRtcGRpcigpLCBgZGV2a2l0LWhvc3QtJHsrRGF0ZS5ub3coKX0tJHtwcm9jZXNzLnBpZH1gKSk7XG4gICAgZnMubWtkaXJTeW5jKGdldFN5c3RlbVBhdGgocm9vdCkpO1xuXG4gICAgc3VwZXIobmV3IE5vZGVKc1N5bmNIb3N0KCksIHJvb3QpO1xuICAgIHRoaXMuX3Jvb3QgPSByb290O1xuICB9XG5cbiAgZ2V0IGZpbGVzKCk6IFBhdGhbXSB7XG4gICAgY29uc3Qgc3luYyA9IHRoaXMuc3luYztcbiAgICBmdW5jdGlvbiBfdmlzaXQocDogUGF0aCk6IFBhdGhbXSB7XG4gICAgICByZXR1cm4gc3luY1xuICAgICAgICAubGlzdChwKVxuICAgICAgICAubWFwKChmcmFnbWVudCkgPT4gam9pbihwLCBmcmFnbWVudCkpXG4gICAgICAgIC5yZWR1Y2UoKGZpbGVzLCBwYXRoKSA9PiB7XG4gICAgICAgICAgaWYgKHN5bmMuaXNEaXJlY3RvcnkocGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlcy5jb25jYXQoX3Zpc2l0KHBhdGgpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGVzLmNvbmNhdChwYXRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIFtdIGFzIFBhdGhbXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF92aXNpdChub3JtYWxpemUoJy8nKSk7XG4gIH1cblxuICBnZXQgcm9vdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdDtcbiAgfVxuICBnZXQgc3luYygpIHtcbiAgICBpZiAoIXRoaXMuX3N5bmMpIHtcbiAgICAgIHRoaXMuX3N5bmMgPSBuZXcgdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3Q8ZnMuU3RhdHM+KHRoaXMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9zeW5jO1xuICB9XG59XG4iXX0=