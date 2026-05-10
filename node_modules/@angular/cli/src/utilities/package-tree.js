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
exports.getProjectDependencies = exports.findPackageJson = exports.readPackageJson = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
const resolve = __importStar(require("resolve"));
function getAllDependencies(pkg) {
    return new Set([
        ...Object.entries(pkg.dependencies || []),
        ...Object.entries(pkg.devDependencies || []),
        ...Object.entries(pkg.peerDependencies || []),
        ...Object.entries(pkg.optionalDependencies || []),
    ]);
}
async function readPackageJson(packageJsonPath) {
    try {
        return JSON.parse((await fs.promises.readFile(packageJsonPath)).toString());
    }
    catch {
        return undefined;
    }
}
exports.readPackageJson = readPackageJson;
function findPackageJson(workspaceDir, packageName) {
    try {
        // avoid require.resolve here, see: https://github.com/angular/angular-cli/pull/18610#issuecomment-681980185
        const packageJsonPath = resolve.sync(`${packageName}/package.json`, { basedir: workspaceDir });
        return packageJsonPath;
    }
    catch {
        return undefined;
    }
}
exports.findPackageJson = findPackageJson;
async function getProjectDependencies(dir) {
    const pkg = await readPackageJson((0, path_1.join)(dir, 'package.json'));
    if (!pkg) {
        throw new Error('Could not find package.json');
    }
    const results = new Map();
    for (const [name, version] of getAllDependencies(pkg)) {
        const packageJsonPath = findPackageJson(dir, name);
        if (!packageJsonPath) {
            continue;
        }
        results.set(name, {
            name,
            version,
            path: (0, path_1.dirname)(packageJsonPath),
            package: await readPackageJson(packageJsonPath),
        });
    }
    return results;
}
exports.getProjectDependencies = getProjectDependencies;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS10cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy9wYWNrYWdlLXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsK0JBQXFDO0FBQ3JDLGlEQUFtQztBQWtCbkMsU0FBUyxrQkFBa0IsQ0FBQyxHQUFnQjtJQUMxQyxPQUFPLElBQUksR0FBRyxDQUFDO1FBQ2IsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO1FBQ3pDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQztRQUM1QyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztRQUM3QyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEVBQUUsQ0FBQztLQUNsRCxDQUFDLENBQUM7QUFDTCxDQUFDO0FBU00sS0FBSyxVQUFVLGVBQWUsQ0FBQyxlQUF1QjtJQUMzRCxJQUFJO1FBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDN0U7SUFBQyxNQUFNO1FBQ04sT0FBTyxTQUFTLENBQUM7S0FDbEI7QUFDSCxDQUFDO0FBTkQsMENBTUM7QUFFRCxTQUFnQixlQUFlLENBQUMsWUFBb0IsRUFBRSxXQUFtQjtJQUN2RSxJQUFJO1FBQ0YsNEdBQTRHO1FBQzVHLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXLGVBQWUsRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRS9GLE9BQU8sZUFBZSxDQUFDO0tBQ3hCO0lBQUMsTUFBTTtRQUNOLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQVRELDBDQVNDO0FBRU0sS0FBSyxVQUFVLHNCQUFzQixDQUFDLEdBQVc7SUFDdEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxlQUFlLENBQUMsSUFBQSxXQUFJLEVBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDN0QsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUNoRDtJQUVELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO0lBQ25ELEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyRCxNQUFNLGVBQWUsR0FBRyxlQUFlLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDcEIsU0FBUztTQUNWO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7WUFDaEIsSUFBSTtZQUNKLE9BQU87WUFDUCxJQUFJLEVBQUUsSUFBQSxjQUFPLEVBQUMsZUFBZSxDQUFDO1lBQzlCLE9BQU8sRUFBRSxNQUFNLGVBQWUsQ0FBQyxlQUFlLENBQUM7U0FDaEQsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBdEJELHdEQXNCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyByZXNvbHZlIGZyb20gJ3Jlc29sdmUnO1xuaW1wb3J0IHsgTmdBZGRTYXZlRGVwZW5kZW5jeSB9IGZyb20gJy4vcGFja2FnZS1tZXRhZGF0YSc7XG5cbmludGVyZmFjZSBQYWNrYWdlSnNvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBkZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBkZXZEZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwZWVyRGVwZW5kZW5jaWVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgb3B0aW9uYWxEZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAnbmctdXBkYXRlJz86IHtcbiAgICBtaWdyYXRpb25zPzogc3RyaW5nO1xuICB9O1xuICAnbmctYWRkJz86IHtcbiAgICBzYXZlPzogTmdBZGRTYXZlRGVwZW5kZW5jeTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0QWxsRGVwZW5kZW5jaWVzKHBrZzogUGFja2FnZUpzb24pOiBTZXQ8W3N0cmluZywgc3RyaW5nXT4ge1xuICByZXR1cm4gbmV3IFNldChbXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGtnLmRlcGVuZGVuY2llcyB8fCBbXSksXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGtnLmRldkRlcGVuZGVuY2llcyB8fCBbXSksXG4gICAgLi4uT2JqZWN0LmVudHJpZXMocGtnLnBlZXJEZXBlbmRlbmNpZXMgfHwgW10pLFxuICAgIC4uLk9iamVjdC5lbnRyaWVzKHBrZy5vcHRpb25hbERlcGVuZGVuY2llcyB8fCBbXSksXG4gIF0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhY2thZ2VUcmVlTm9kZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBwYXRoOiBzdHJpbmc7XG4gIHBhY2thZ2U6IFBhY2thZ2VKc29uIHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFBhY2thZ2VKc29uKHBhY2thZ2VKc29uUGF0aDogc3RyaW5nKTogUHJvbWlzZTxQYWNrYWdlSnNvbiB8IHVuZGVmaW5lZD4ge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKChhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShwYWNrYWdlSnNvblBhdGgpKS50b1N0cmluZygpKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhY2thZ2VKc29uKHdvcmtzcGFjZURpcjogc3RyaW5nLCBwYWNrYWdlTmFtZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgdHJ5IHtcbiAgICAvLyBhdm9pZCByZXF1aXJlLnJlc29sdmUgaGVyZSwgc2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9wdWxsLzE4NjEwI2lzc3VlY29tbWVudC02ODE5ODAxODVcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSByZXNvbHZlLnN5bmMoYCR7cGFja2FnZU5hbWV9L3BhY2thZ2UuanNvbmAsIHsgYmFzZWRpcjogd29ya3NwYWNlRGlyIH0pO1xuXG4gICAgcmV0dXJuIHBhY2thZ2VKc29uUGF0aDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJvamVjdERlcGVuZGVuY2llcyhkaXI6IHN0cmluZyk6IFByb21pc2U8TWFwPHN0cmluZywgUGFja2FnZVRyZWVOb2RlPj4ge1xuICBjb25zdCBwa2cgPSBhd2FpdCByZWFkUGFja2FnZUpzb24oam9pbihkaXIsICdwYWNrYWdlLmpzb24nKSk7XG4gIGlmICghcGtnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBwYWNrYWdlLmpzb24nKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdHMgPSBuZXcgTWFwPHN0cmluZywgUGFja2FnZVRyZWVOb2RlPigpO1xuICBmb3IgKGNvbnN0IFtuYW1lLCB2ZXJzaW9uXSBvZiBnZXRBbGxEZXBlbmRlbmNpZXMocGtnKSkge1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IGZpbmRQYWNrYWdlSnNvbihkaXIsIG5hbWUpO1xuICAgIGlmICghcGFja2FnZUpzb25QYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXN1bHRzLnNldChuYW1lLCB7XG4gICAgICBuYW1lLFxuICAgICAgdmVyc2lvbixcbiAgICAgIHBhdGg6IGRpcm5hbWUocGFja2FnZUpzb25QYXRoKSxcbiAgICAgIHBhY2thZ2U6IGF3YWl0IHJlYWRQYWNrYWdlSnNvbihwYWNrYWdlSnNvblBhdGgpLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG4iXX0=