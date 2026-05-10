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
exports.externalizePath = exports.normalizePath = void 0;
const nodePath = __importStar(require("path"));
const normalizationCache = new Map();
function normalizePath(path) {
    let result = normalizationCache.get(path);
    if (result === undefined) {
        result = nodePath.win32.normalize(path).replace(/\\/g, nodePath.posix.sep);
        normalizationCache.set(path, result);
    }
    return result;
}
exports.normalizePath = normalizePath;
const externalizationCache = new Map();
function externalizeForWindows(path) {
    let result = externalizationCache.get(path);
    if (result === undefined) {
        result = nodePath.win32.normalize(path);
        externalizationCache.set(path, result);
    }
    return result;
}
exports.externalizePath = (() => {
    if (process.platform !== 'win32') {
        return (path) => path;
    }
    return externalizeForWindows;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL2l2eS9wYXRocy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFpQztBQUVqQyxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0FBRXJELFNBQWdCLGFBQWEsQ0FBQyxJQUFZO0lBQ3hDLElBQUksTUFBTSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUUxQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7UUFDeEIsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3RDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVRELHNDQVNDO0FBRUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztBQUV2RCxTQUFTLHFCQUFxQixDQUFDLElBQVk7SUFDekMsSUFBSSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTVDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUN4QixNQUFNLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN4QztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFWSxRQUFBLGVBQWUsR0FBRyxDQUFDLEdBQUcsRUFBRTtJQUNuQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1FBQ2hDLE9BQU8sQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztLQUMvQjtJQUVELE9BQU8scUJBQXFCLENBQUM7QUFDL0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBub2RlUGF0aCBmcm9tICdwYXRoJztcblxuY29uc3Qgbm9ybWFsaXphdGlvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IG5vcm1hbGl6YXRpb25DYWNoZS5nZXQocGF0aCk7XG5cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmVzdWx0ID0gbm9kZVBhdGgud2luMzIubm9ybWFsaXplKHBhdGgpLnJlcGxhY2UoL1xcXFwvZywgbm9kZVBhdGgucG9zaXguc2VwKTtcbiAgICBub3JtYWxpemF0aW9uQ2FjaGUuc2V0KHBhdGgsIHJlc3VsdCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBleHRlcm5hbGl6YXRpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbmZ1bmN0aW9uIGV4dGVybmFsaXplRm9yV2luZG93cyhwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcmVzdWx0ID0gZXh0ZXJuYWxpemF0aW9uQ2FjaGUuZ2V0KHBhdGgpO1xuXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IG5vZGVQYXRoLndpbjMyLm5vcm1hbGl6ZShwYXRoKTtcbiAgICBleHRlcm5hbGl6YXRpb25DYWNoZS5zZXQocGF0aCwgcmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBjb25zdCBleHRlcm5hbGl6ZVBhdGggPSAoKCkgPT4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykge1xuICAgIHJldHVybiAocGF0aDogc3RyaW5nKSA9PiBwYXRoO1xuICB9XG5cbiAgcmV0dXJuIGV4dGVybmFsaXplRm9yV2luZG93cztcbn0pKCk7XG4iXX0=