"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MemoryLoadResultCache_loadResults, _MemoryLoadResultCache_fileDependencies;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryLoadResultCache = exports.createCachedLoad = void 0;
const node_path_1 = require("node:path");
function createCachedLoad(cache, callback) {
    if (cache === undefined) {
        return callback;
    }
    return async (args) => {
        const loadCacheKey = `${args.namespace}:${args.path}`;
        let result = cache.get(loadCacheKey);
        if (result === undefined) {
            result = await callback(args);
            // Do not cache null or undefined or results with errors
            if (result && result.errors === undefined) {
                await cache.put(loadCacheKey, result);
            }
        }
        return result;
    };
}
exports.createCachedLoad = createCachedLoad;
class MemoryLoadResultCache {
    constructor() {
        _MemoryLoadResultCache_loadResults.set(this, new Map());
        _MemoryLoadResultCache_fileDependencies.set(this, new Map());
    }
    get(path) {
        return __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").get(path);
    }
    async put(path, result) {
        __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").set(path, result);
        if (result.watchFiles) {
            for (const watchFile of result.watchFiles) {
                // Normalize the watch file path to ensure OS consistent paths
                const normalizedWatchFile = (0, node_path_1.normalize)(watchFile);
                let affected = __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").get(normalizedWatchFile);
                if (affected === undefined) {
                    affected = new Set();
                    __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").set(normalizedWatchFile, affected);
                }
                affected.add(path);
            }
        }
    }
    invalidate(path) {
        const affected = __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").get(path);
        let found = false;
        if (affected) {
            affected.forEach((a) => (found || (found = __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").delete(a))));
            __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").delete(path);
        }
        found || (found = __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").delete(path));
        return found;
    }
}
exports.MemoryLoadResultCache = MemoryLoadResultCache;
_MemoryLoadResultCache_loadResults = new WeakMap(), _MemoryLoadResultCache_fileDependencies = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1yZXN1bHQtY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2xvYWQtcmVzdWx0LWNhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7OztBQUdILHlDQUFzQztBQU90QyxTQUFnQixnQkFBZ0IsQ0FDOUIsS0FBa0MsRUFDbEMsUUFBOEM7SUFFOUMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0lBRUQsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFDcEIsTUFBTSxZQUFZLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RCxJQUFJLE1BQU0sR0FBb0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV0RSxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDeEIsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlCLHdEQUF3RDtZQUN4RCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtnQkFDekMsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN2QztTQUNGO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXZCRCw0Q0F1QkM7QUFFRCxNQUFhLHFCQUFxQjtJQUFsQztRQUNFLDZDQUFlLElBQUksR0FBRyxFQUF3QixFQUFDO1FBQy9DLGtEQUFvQixJQUFJLEdBQUcsRUFBdUIsRUFBQztJQW1DckQsQ0FBQztJQWpDQyxHQUFHLENBQUMsSUFBWTtRQUNkLE9BQU8sdUJBQUEsSUFBSSwwQ0FBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFZLEVBQUUsTUFBb0I7UUFDMUMsdUJBQUEsSUFBSSwwQ0FBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ3JCLEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtnQkFDekMsOERBQThEO2dCQUM5RCxNQUFNLG1CQUFtQixHQUFHLElBQUEscUJBQVMsRUFBQyxTQUFTLENBQUMsQ0FBQztnQkFDakQsSUFBSSxRQUFRLEdBQUcsdUJBQUEsSUFBSSwrQ0FBa0IsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUMxQixRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDckIsdUJBQUEsSUFBSSwrQ0FBa0IsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQzNEO2dCQUNELFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEI7U0FDRjtJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsSUFBWTtRQUNyQixNQUFNLFFBQVEsR0FBRyx1QkFBQSxJQUFJLCtDQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7UUFFbEIsSUFBSSxRQUFRLEVBQUU7WUFDWixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBTCxLQUFLLEdBQUssdUJBQUEsSUFBSSwwQ0FBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7WUFDakUsdUJBQUEsSUFBSSwrQ0FBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckM7UUFFRCxLQUFLLEtBQUwsS0FBSyxHQUFLLHVCQUFBLElBQUksMENBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUM7UUFFekMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUFyQ0Qsc0RBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgT25Mb2FkUmVzdWx0LCBQbHVnaW5CdWlsZCB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnbm9kZTpwYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBMb2FkUmVzdWx0Q2FjaGUge1xuICBnZXQocGF0aDogc3RyaW5nKTogT25Mb2FkUmVzdWx0IHwgdW5kZWZpbmVkO1xuICBwdXQocGF0aDogc3RyaW5nLCByZXN1bHQ6IE9uTG9hZFJlc3VsdCk6IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDYWNoZWRMb2FkKFxuICBjYWNoZTogTG9hZFJlc3VsdENhY2hlIHwgdW5kZWZpbmVkLFxuICBjYWxsYmFjazogUGFyYW1ldGVyczxQbHVnaW5CdWlsZFsnb25Mb2FkJ10+WzFdLFxuKTogUGFyYW1ldGVyczxQbHVnaW5CdWlsZFsnb25Mb2FkJ10+WzFdIHtcbiAgaWYgKGNhY2hlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gY2FsbGJhY2s7XG4gIH1cblxuICByZXR1cm4gYXN5bmMgKGFyZ3MpID0+IHtcbiAgICBjb25zdCBsb2FkQ2FjaGVLZXkgPSBgJHthcmdzLm5hbWVzcGFjZX06JHthcmdzLnBhdGh9YDtcbiAgICBsZXQgcmVzdWx0OiBPbkxvYWRSZXN1bHQgfCBudWxsIHwgdW5kZWZpbmVkID0gY2FjaGUuZ2V0KGxvYWRDYWNoZUtleSk7XG5cbiAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IGNhbGxiYWNrKGFyZ3MpO1xuXG4gICAgICAvLyBEbyBub3QgY2FjaGUgbnVsbCBvciB1bmRlZmluZWQgb3IgcmVzdWx0cyB3aXRoIGVycm9yc1xuICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuZXJyb3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgY2FjaGUucHV0KGxvYWRDYWNoZUtleSwgcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5TG9hZFJlc3VsdENhY2hlIGltcGxlbWVudHMgTG9hZFJlc3VsdENhY2hlIHtcbiAgI2xvYWRSZXN1bHRzID0gbmV3IE1hcDxzdHJpbmcsIE9uTG9hZFJlc3VsdD4oKTtcbiAgI2ZpbGVEZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IE9uTG9hZFJlc3VsdCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2xvYWRSZXN1bHRzLmdldChwYXRoKTtcbiAgfVxuXG4gIGFzeW5jIHB1dChwYXRoOiBzdHJpbmcsIHJlc3VsdDogT25Mb2FkUmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy4jbG9hZFJlc3VsdHMuc2V0KHBhdGgsIHJlc3VsdCk7XG4gICAgaWYgKHJlc3VsdC53YXRjaEZpbGVzKSB7XG4gICAgICBmb3IgKGNvbnN0IHdhdGNoRmlsZSBvZiByZXN1bHQud2F0Y2hGaWxlcykge1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIHdhdGNoIGZpbGUgcGF0aCB0byBlbnN1cmUgT1MgY29uc2lzdGVudCBwYXRoc1xuICAgICAgICBjb25zdCBub3JtYWxpemVkV2F0Y2hGaWxlID0gbm9ybWFsaXplKHdhdGNoRmlsZSk7XG4gICAgICAgIGxldCBhZmZlY3RlZCA9IHRoaXMuI2ZpbGVEZXBlbmRlbmNpZXMuZ2V0KG5vcm1hbGl6ZWRXYXRjaEZpbGUpO1xuICAgICAgICBpZiAoYWZmZWN0ZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGFmZmVjdGVkID0gbmV3IFNldCgpO1xuICAgICAgICAgIHRoaXMuI2ZpbGVEZXBlbmRlbmNpZXMuc2V0KG5vcm1hbGl6ZWRXYXRjaEZpbGUsIGFmZmVjdGVkKTtcbiAgICAgICAgfVxuICAgICAgICBhZmZlY3RlZC5hZGQocGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW52YWxpZGF0ZShwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBhZmZlY3RlZCA9IHRoaXMuI2ZpbGVEZXBlbmRlbmNpZXMuZ2V0KHBhdGgpO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuXG4gICAgaWYgKGFmZmVjdGVkKSB7XG4gICAgICBhZmZlY3RlZC5mb3JFYWNoKChhKSA9PiAoZm91bmQgfHw9IHRoaXMuI2xvYWRSZXN1bHRzLmRlbGV0ZShhKSkpO1xuICAgICAgdGhpcy4jZmlsZURlcGVuZGVuY2llcy5kZWxldGUocGF0aCk7XG4gICAgfVxuXG4gICAgZm91bmQgfHw9IHRoaXMuI2xvYWRSZXN1bHRzLmRlbGV0ZShwYXRoKTtcblxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxufVxuIl19