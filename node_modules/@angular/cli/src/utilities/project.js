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
exports.findWorkspaceFile = void 0;
const core_1 = require("@angular-devkit/core");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const find_up_1 = require("./find-up");
function findWorkspaceFile(currentDirectory = process.cwd()) {
    const possibleConfigFiles = ['angular.json', '.angular.json'];
    const configFilePath = (0, find_up_1.findUp)(possibleConfigFiles, currentDirectory);
    if (configFilePath === null) {
        return null;
    }
    const possibleDir = path.dirname(configFilePath);
    const homedir = os.homedir();
    if ((0, core_1.normalize)(possibleDir) === (0, core_1.normalize)(homedir)) {
        const packageJsonPath = path.join(possibleDir, 'package.json');
        try {
            const packageJsonText = fs.readFileSync(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonText);
            if (!containsCliDep(packageJson)) {
                // No CLI dependency
                return null;
            }
        }
        catch {
            // No or invalid package.json
            return null;
        }
    }
    return configFilePath;
}
exports.findWorkspaceFile = findWorkspaceFile;
function containsCliDep(obj) {
    const pkgName = '@angular/cli';
    if (!obj) {
        return false;
    }
    return !!(obj.dependencies?.[pkgName] || obj.devDependencies?.[pkgName]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy91dGlsaXRpZXMvcHJvamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFpRDtBQUNqRCx1Q0FBeUI7QUFDekIsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3Qix1Q0FBbUM7QUFFbkMsU0FBZ0IsaUJBQWlCLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRTtJQUNoRSxNQUFNLG1CQUFtQixHQUFHLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzlELE1BQU0sY0FBYyxHQUFHLElBQUEsZ0JBQU0sRUFBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3JFLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUVqRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsSUFBSSxJQUFBLGdCQUFTLEVBQUMsV0FBVyxDQUFDLEtBQUssSUFBQSxnQkFBUyxFQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ2pELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRS9ELElBQUk7WUFDRixNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ2hDLG9CQUFvQjtnQkFDcEIsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBQUMsTUFBTTtZQUNOLDZCQUE2QjtZQUM3QixPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFFRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBM0JELDhDQTJCQztBQUVELFNBQVMsY0FBYyxDQUFDLEdBR3ZCO0lBQ0MsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDO0lBQy9CLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDUixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDM0UsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmluZFVwIH0gZnJvbSAnLi9maW5kLXVwJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRXb3Jrc3BhY2VGaWxlKGN1cnJlbnREaXJlY3RvcnkgPSBwcm9jZXNzLmN3ZCgpKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHBvc3NpYmxlQ29uZmlnRmlsZXMgPSBbJ2FuZ3VsYXIuanNvbicsICcuYW5ndWxhci5qc29uJ107XG4gIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gZmluZFVwKHBvc3NpYmxlQ29uZmlnRmlsZXMsIGN1cnJlbnREaXJlY3RvcnkpO1xuICBpZiAoY29uZmlnRmlsZVBhdGggPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBvc3NpYmxlRGlyID0gcGF0aC5kaXJuYW1lKGNvbmZpZ0ZpbGVQYXRoKTtcblxuICBjb25zdCBob21lZGlyID0gb3MuaG9tZWRpcigpO1xuICBpZiAobm9ybWFsaXplKHBvc3NpYmxlRGlyKSA9PT0gbm9ybWFsaXplKGhvbWVkaXIpKSB7XG4gICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKHBvc3NpYmxlRGlyLCAncGFja2FnZS5qc29uJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFja2FnZUpzb25UZXh0ID0gZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VKc29uUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZUpzb25UZXh0KTtcbiAgICAgIGlmICghY29udGFpbnNDbGlEZXAocGFja2FnZUpzb24pKSB7XG4gICAgICAgIC8vIE5vIENMSSBkZXBlbmRlbmN5XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gTm8gb3IgaW52YWxpZCBwYWNrYWdlLmpzb25cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb25maWdGaWxlUGF0aDtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNDbGlEZXAob2JqPzoge1xuICBkZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBkZXZEZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufSk6IGJvb2xlYW4ge1xuICBjb25zdCBwa2dOYW1lID0gJ0Bhbmd1bGFyL2NsaSc7XG4gIGlmICghb2JqKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuICEhKG9iai5kZXBlbmRlbmNpZXM/Lltwa2dOYW1lXSB8fCBvYmouZGV2RGVwZW5kZW5jaWVzPy5bcGtnTmFtZV0pO1xufVxuIl19