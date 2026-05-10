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
exports.FileSystemEngineHost = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const src_1 = require("../src");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
/**
 * A simple EngineHost that uses a root with one directory per collection inside of it. The
 * collection declaration follows the same rules as the regular FileSystemEngineHostBase.
 */
class FileSystemEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor(_root) {
        super();
        this._root = _root;
    }
    _resolveCollectionPath(name) {
        try {
            // Allow `${_root}/${name}.json` as a collection.
            const maybePath = require.resolve((0, path_1.join)(this._root, name + '.json'));
            if ((0, fs_1.existsSync)(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        try {
            // Allow `${_root}/${name}/collection.json.
            const maybePath = require.resolve((0, path_1.join)(this._root, name, 'collection.json'));
            if ((0, fs_1.existsSync)(maybePath)) {
                return maybePath;
            }
        }
        catch (error) { }
        throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
    }
    _resolveReferenceString(refString, parentPath) {
        // Use the same kind of export strings as NodeModule.
        const ref = new export_ref_1.ExportStringRef(refString, parentPath);
        if (!ref.ref) {
            return null;
        }
        return { ref: ref.ref, path: ref.module };
    }
    _transformCollectionDescription(name, desc) {
        if (!desc.schematics || typeof desc.schematics != 'object') {
            throw new file_system_engine_host_base_1.CollectionMissingSchematicsMapException(name);
        }
        return {
            ...desc,
            name,
        };
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new file_system_engine_host_base_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
    hasTaskExecutor(name) {
        if (super.hasTaskExecutor(name)) {
            return true;
        }
        try {
            const maybePath = require.resolve((0, path_1.join)(this._root, name));
            if ((0, fs_1.existsSync)(maybePath)) {
                return true;
            }
        }
        catch { }
        return false;
    }
    createTaskExecutor(name) {
        if (!super.hasTaskExecutor(name)) {
            try {
                const path = require.resolve((0, path_1.join)(this._root, name));
                // Default handling code is for old tasks that incorrectly export `default` with non-ESM module
                return (0, rxjs_1.from)(Promise.resolve(`${path}`).then(s => __importStar(require(s))).then((mod) => (mod.default?.default || mod.default)())).pipe((0, rxjs_1.catchError)(() => (0, rxjs_1.throwError)(new src_1.UnregisteredTaskException(name))));
            }
            catch { }
        }
        return super.createTaskExecutor(name);
    }
}
exports.FileSystemEngineHost = FileSystemEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL2ZpbGUtc3lzdGVtLWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkJBQWdDO0FBQ2hDLCtCQUE0QjtBQUM1QiwrQkFBZ0U7QUFDaEUsZ0NBQThFO0FBRTlFLDZDQUErQztBQUMvQyxpRkFLd0M7QUFFeEM7OztHQUdHO0FBQ0gsTUFBYSxvQkFBcUIsU0FBUSx1REFBd0I7SUFDaEUsWUFBc0IsS0FBYTtRQUNqQyxLQUFLLEVBQUUsQ0FBQztRQURZLFVBQUssR0FBTCxLQUFLLENBQVE7SUFFbkMsQ0FBQztJQUVTLHNCQUFzQixDQUFDLElBQVk7UUFDM0MsSUFBSTtZQUNGLGlEQUFpRDtZQUNqRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxJQUFBLGVBQVUsRUFBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsT0FBTyxTQUFTLENBQUM7YUFDbEI7U0FDRjtRQUFDLE9BQU8sS0FBSyxFQUFFLEdBQUU7UUFFbEIsSUFBSTtZQUNGLDJDQUEyQztZQUMzQyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLElBQUEsZUFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUUsR0FBRTtRQUVsQixNQUFNLElBQUksa0VBQW1DLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVTLHVCQUF1QixDQUFDLFNBQWlCLEVBQUUsVUFBa0I7UUFDckUscURBQXFEO1FBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksNEJBQWUsQ0FBa0IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFUywrQkFBK0IsQ0FDdkMsSUFBWSxFQUNaLElBQXVDO1FBRXZDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsSUFBSSxRQUFRLEVBQUU7WUFDMUQsTUFBTSxJQUFJLHNFQUF1QyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pEO1FBRUQsT0FBTztZQUNMLEdBQUcsSUFBSTtZQUNQLElBQUk7U0FDdUIsQ0FBQztJQUNoQyxDQUFDO0lBRVMsOEJBQThCLENBQ3RDLElBQVksRUFDWixXQUFxQyxFQUNyQyxJQUFzQztRQUV0QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3RELE1BQU0sSUFBSSw4REFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNqRDtRQUVELE9BQU8sSUFBK0IsQ0FBQztJQUN6QyxDQUFDO0lBRVEsZUFBZSxDQUFDLElBQVk7UUFDbkMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxJQUFBLGVBQVUsRUFBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBQUMsTUFBTSxHQUFFO1FBRVYsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRVEsa0JBQWtCLENBQUMsSUFBWTtRQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoQyxJQUFJO2dCQUNGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCwrRkFBK0Y7Z0JBQy9GLE9BQU8sSUFBQSxXQUFJLEVBQUMsbUJBQU8sSUFBSSx3Q0FBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDbkYsSUFBQSxpQkFBVSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsaUJBQVUsRUFBQyxJQUFJLCtCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDbEUsQ0FBQzthQUNIO1lBQUMsTUFBTSxHQUFFO1NBQ1g7UUFFRCxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUExRkQsb0RBMEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjYXRjaEVycm9yLCBmcm9tLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBSdWxlRmFjdG9yeSwgVGFza0V4ZWN1dG9yLCBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uIH0gZnJvbSAnLi4vc3JjJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYywgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2MgfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IEV4cG9ydFN0cmluZ1JlZiB9IGZyb20gJy4vZXhwb3J0LXJlZic7XG5pbXBvcnQge1xuICBDb2xsZWN0aW9uQ2Fubm90QmVSZXNvbHZlZEV4Y2VwdGlvbixcbiAgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uLFxuICBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2UsXG4gIFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24sXG59IGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QtYmFzZSc7XG5cbi8qKlxuICogQSBzaW1wbGUgRW5naW5lSG9zdCB0aGF0IHVzZXMgYSByb290IHdpdGggb25lIGRpcmVjdG9yeSBwZXIgY29sbGVjdGlvbiBpbnNpZGUgb2YgaXQuIFRoZVxuICogY29sbGVjdGlvbiBkZWNsYXJhdGlvbiBmb2xsb3dzIHRoZSBzYW1lIHJ1bGVzIGFzIHRoZSByZWd1bGFyIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVTeXN0ZW1FbmdpbmVIb3N0IGV4dGVuZHMgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9yb290OiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgLy8gQWxsb3cgYCR7X3Jvb3R9LyR7bmFtZX0uanNvbmAgYXMgYSBjb2xsZWN0aW9uLlxuICAgICAgY29uc3QgbWF5YmVQYXRoID0gcmVxdWlyZS5yZXNvbHZlKGpvaW4odGhpcy5fcm9vdCwgbmFtZSArICcuanNvbicpKTtcbiAgICAgIGlmIChleGlzdHNTeW5jKG1heWJlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIG1heWJlUGF0aDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge31cblxuICAgIHRyeSB7XG4gICAgICAvLyBBbGxvdyBgJHtfcm9vdH0vJHtuYW1lfS9jb2xsZWN0aW9uLmpzb24uXG4gICAgICBjb25zdCBtYXliZVBhdGggPSByZXF1aXJlLnJlc29sdmUoam9pbih0aGlzLl9yb290LCBuYW1lLCAnY29sbGVjdGlvbi5qc29uJykpO1xuICAgICAgaWYgKGV4aXN0c1N5bmMobWF5YmVQYXRoKSkge1xuICAgICAgICByZXR1cm4gbWF5YmVQYXRoO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuXG4gICAgdGhyb3cgbmV3IENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uKG5hbWUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHJlZlN0cmluZzogc3RyaW5nLCBwYXJlbnRQYXRoOiBzdHJpbmcpIHtcbiAgICAvLyBVc2UgdGhlIHNhbWUga2luZCBvZiBleHBvcnQgc3RyaW5ncyBhcyBOb2RlTW9kdWxlLlxuICAgIGNvbnN0IHJlZiA9IG5ldyBFeHBvcnRTdHJpbmdSZWY8UnVsZUZhY3Rvcnk8e30+PihyZWZTdHJpbmcsIHBhcmVudFBhdGgpO1xuICAgIGlmICghcmVmLnJlZikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcmVmOiByZWYucmVmLCBwYXRoOiByZWYubW9kdWxlIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgX3RyYW5zZm9ybUNvbGxlY3Rpb25EZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M+LFxuICApOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2Mge1xuICAgIGlmICghZGVzYy5zY2hlbWF0aWNzIHx8IHR5cGVvZiBkZXNjLnNjaGVtYXRpY3MgIT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmRlc2MsXG4gICAgICBuYW1lLFxuICAgIH0gYXMgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgX2NvbGxlY3Rpb246IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYyxcbiAgICBkZXNjOiBQYXJ0aWFsPEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjPixcbiAgKTogRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2Mge1xuICAgIGlmICghZGVzYy5mYWN0b3J5Rm4gfHwgIWRlc2MucGF0aCB8fCAhZGVzYy5kZXNjcmlwdGlvbikge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY01pc3NpbmdGaWVsZHNFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2MgYXMgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2M7XG4gIH1cblxuICBvdmVycmlkZSBoYXNUYXNrRXhlY3V0b3IobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHN1cGVyLmhhc1Rhc2tFeGVjdXRvcihuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1heWJlUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShqb2luKHRoaXMuX3Jvb3QsIG5hbWUpKTtcbiAgICAgIGlmIChleGlzdHNTeW5jKG1heWJlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8VGFza0V4ZWN1dG9yPiB7XG4gICAgaWYgKCFzdXBlci5oYXNUYXNrRXhlY3V0b3IobmFtZSkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlLnJlc29sdmUoam9pbih0aGlzLl9yb290LCBuYW1lKSk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCBoYW5kbGluZyBjb2RlIGlzIGZvciBvbGQgdGFza3MgdGhhdCBpbmNvcnJlY3RseSBleHBvcnQgYGRlZmF1bHRgIHdpdGggbm9uLUVTTSBtb2R1bGVcbiAgICAgICAgcmV0dXJuIGZyb20oaW1wb3J0KHBhdGgpLnRoZW4oKG1vZCkgPT4gKG1vZC5kZWZhdWx0Py5kZWZhdWx0IHx8IG1vZC5kZWZhdWx0KSgpKSkucGlwZShcbiAgICAgICAgICBjYXRjaEVycm9yKCgpID0+IHRocm93RXJyb3IobmV3IFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24obmFtZSkpKSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuY3JlYXRlVGFza0V4ZWN1dG9yKG5hbWUpO1xuICB9XG59XG4iXX0=