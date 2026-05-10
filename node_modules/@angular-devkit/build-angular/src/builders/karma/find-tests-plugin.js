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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindTestsPlugin = void 0;
const assert_1 = __importDefault(require("assert"));
const fast_glob_1 = __importStar(require("fast-glob"));
const fs_1 = require("fs");
const mini_css_extract_plugin_1 = require("mini-css-extract-plugin");
const path_1 = require("path");
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-find-tests-plugin';
class FindTestsPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { include = ['**/*.spec.ts'], exclude = [], projectSourceRoot, workspaceRoot, } = this.options;
        const webpackOptions = compiler.options;
        const entry = typeof webpackOptions.entry === 'function' ? webpackOptions.entry() : webpackOptions.entry;
        let originalImport;
        // Add tests files are part of the entry-point.
        webpackOptions.entry = async () => {
            const specFiles = await findTests(include, exclude, workspaceRoot, projectSourceRoot);
            const entrypoints = await entry;
            const entrypoint = entrypoints['main'];
            if (!entrypoint.import) {
                throw new Error(`Cannot find 'main' entrypoint.`);
            }
            if (specFiles.length) {
                originalImport ?? (originalImport = entrypoint.import);
                entrypoint.import = [...originalImport, ...specFiles];
            }
            else {
                (0, assert_1.default)(this.compilation, 'Compilation cannot be undefined.');
                this.compilation
                    .getLogger(mini_css_extract_plugin_1.pluginName)
                    .error(`Specified patterns: "${include.join(', ')}" did not match any spec files.`);
            }
            return entrypoints;
        };
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            this.compilation = compilation;
            compilation.contextDependencies.add(projectSourceRoot);
        });
    }
}
exports.FindTestsPlugin = FindTestsPlugin;
// go through all patterns and find unique list of files
async function findTests(include, exclude, workspaceRoot, projectSourceRoot) {
    const matchingTestsPromises = include.map((pattern) => findMatchingTests(pattern, exclude, workspaceRoot, projectSourceRoot));
    const files = await Promise.all(matchingTestsPromises);
    // Unique file names
    return [...new Set(files.flat())];
}
const normalizePath = (path) => path.replace(/\\/g, '/');
const removeLeadingSlash = (pattern) => {
    if (pattern.charAt(0) === '/') {
        return pattern.substring(1);
    }
    return pattern;
};
const removeRelativeRoot = (path, root) => {
    if (path.startsWith(root)) {
        return path.substring(root.length);
    }
    return path;
};
async function findMatchingTests(pattern, ignore, workspaceRoot, projectSourceRoot) {
    // normalize pattern, glob lib only accepts forward slashes
    let normalizedPattern = normalizePath(pattern);
    normalizedPattern = removeLeadingSlash(normalizedPattern);
    const relativeProjectRoot = normalizePath((0, path_1.relative)(workspaceRoot, projectSourceRoot) + '/');
    // remove relativeProjectRoot to support relative paths from root
    // such paths are easy to get when running scripts via IDEs
    normalizedPattern = removeRelativeRoot(normalizedPattern, relativeProjectRoot);
    // special logic when pattern does not look like a glob
    if (!(0, fast_glob_1.isDynamicPattern)(normalizedPattern)) {
        if (await isDirectory((0, path_1.join)(projectSourceRoot, normalizedPattern))) {
            normalizedPattern = `${normalizedPattern}/**/*.spec.@(ts|tsx)`;
        }
        else {
            // see if matching spec file exists
            const fileExt = (0, path_1.extname)(normalizedPattern);
            // Replace extension to `.spec.ext`. Example: `src/app/app.component.ts`-> `src/app/app.component.spec.ts`
            const potentialSpec = (0, path_1.join)(projectSourceRoot, (0, path_1.dirname)(normalizedPattern), `${(0, path_1.basename)(normalizedPattern, fileExt)}.spec${fileExt}`);
            if (await exists(potentialSpec)) {
                return [potentialSpec];
            }
        }
    }
    // normalize the patterns in the ignore list
    const normalizedIgnorePatternList = ignore.map((pattern) => removeRelativeRoot(removeLeadingSlash(normalizePath(pattern)), relativeProjectRoot));
    return (0, fast_glob_1.default)(normalizedPattern, {
        cwd: projectSourceRoot,
        absolute: true,
        ignore: ['**/node_modules/**', ...normalizedIgnorePatternList],
    });
}
async function isDirectory(path) {
    try {
        const stats = await fs_1.promises.stat(path);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
}
async function exists(path) {
    try {
        await fs_1.promises.access(path, fs_1.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC10ZXN0cy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9rYXJtYS9maW5kLXRlc3RzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILG9EQUE0QjtBQUM1Qix1REFBbUQ7QUFDbkQsMkJBQXlEO0FBQ3pELHFFQUFxRDtBQUNyRCwrQkFBa0U7QUFHbEU7O0dBRUc7QUFDSCxNQUFNLFdBQVcsR0FBRywyQkFBMkIsQ0FBQztBQVNoRCxNQUFhLGVBQWU7SUFHMUIsWUFBb0IsT0FBK0I7UUFBL0IsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7SUFBRyxDQUFDO0lBRXZELEtBQUssQ0FBQyxRQUFrQjtRQUN0QixNQUFNLEVBQ0osT0FBTyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQzFCLE9BQU8sR0FBRyxFQUFFLEVBQ1osaUJBQWlCLEVBQ2pCLGFBQWEsR0FDZCxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDakIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUN4QyxNQUFNLEtBQUssR0FDVCxPQUFPLGNBQWMsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFFN0YsSUFBSSxjQUFvQyxDQUFDO1FBRXpDLCtDQUErQztRQUMvQyxjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ2hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDdEYsTUFBTSxXQUFXLEdB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RSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsMkJBQTJCLENBQUM7S0FDL0QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxXQUFXLENBQUMsSUFBYztJQUN2QyxJQUFJO1FBQ0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxhQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxDLE9BQU8sS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQzVCO0lBQUMsTUFBTTtRQUNOLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLE1BQU0sQ0FBQyxJQUFjO0lBQ2xDLElBQUk7UUFDRixNQUFNLGFBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0QyxPQUFPLElBQUksQ0FBQztLQUNiO0lBQUMsTUFBTTtRQUNOLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBnbG9iLCB7IGlzRHluYW1pY1BhdHRlcm4gfSBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IHsgUGF0aExpa2UsIGNvbnN0YW50cywgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBwbHVnaW5OYW1lIH0gZnJvbSAnbWluaS1jc3MtZXh0cmFjdC1wbHVnaW4nO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHlwZSB7IENvbXBpbGF0aW9uLCBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBwbHVnaW4gcHJvdmlkZWQgdG8gV2VicGFjayB3aGVuIHRhcHBpbmcgV2VicGFjayBjb21waWxlciBob29rcy5cbiAqL1xuY29uc3QgUExVR0lOX05BTUUgPSAnYW5ndWxhci1maW5kLXRlc3RzLXBsdWdpbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmluZFRlc3RzUGx1Z2luT3B0aW9ucyB7XG4gIGluY2x1ZGU/OiBzdHJpbmdbXTtcbiAgZXhjbHVkZT86IHN0cmluZ1tdO1xuICB3b3Jrc3BhY2VSb290OiBzdHJpbmc7XG4gIHByb2plY3RTb3VyY2VSb290OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBGaW5kVGVzdHNQbHVnaW4ge1xuICBwcml2YXRlIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IEZpbmRUZXN0c1BsdWdpbk9wdGlvbnMpIHt9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKTogdm9pZCB7XG4gICAgY29uc3Qge1xuICAgICAgaW5jbHVkZSA9IFsnKiovKi5zcGVjLnRzJ10sXG4gICAgICBleGNsdWRlID0gW10sXG4gICAgICBwcm9qZWN0U291cmNlUm9vdCxcbiAgICAgIHdvcmtzcGFjZVJvb3QsXG4gICAgfSA9IHRoaXMub3B0aW9ucztcbiAgICBjb25zdCB3ZWJwYWNrT3B0aW9ucyA9IGNvbXBpbGVyLm9wdGlvbnM7XG4gICAgY29uc3QgZW50cnkgPVxuICAgICAgdHlwZW9mIHdlYnBhY2tPcHRpb25zLmVudHJ5ID09PSAnZnVuY3Rpb24nID8gd2VicGFja09wdGlvbnMuZW50cnkoKSA6IHdlYnBhY2tPcHRpb25zLmVudHJ5O1xuXG4gICAgbGV0IG9yaWdpbmFsSW1wb3J0OiBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcblxuICAgIC8vIEFkZCB0ZXN0cyBmaWxlcyBhcmUgcGFydCBvZiB0aGUgZW50cnktcG9pbnQuXG4gICAgd2VicGFja09wdGlvbnMuZW50cnkgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzcGVjRmlsZXMgPSBhd2FpdCBmaW5kVGVzdHMoaW5jbHVkZSwgZXhjbHVkZSwgd29ya3NwYWNlUm9vdCwgcHJvamVjdFNvdXJjZVJvb3QpO1xuICAgICAgY29uc3QgZW50cnlwb2ludHMgPSBhd2FpdCBlbnRyeTtcbiAgICAgIGNvbnN0IGVudHJ5cG9pbnQgPSBlbnRyeXBvaW50c1snbWFpbiddO1xuICAgICAgaWYgKCFlbnRyeXBvaW50LmltcG9ydCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kICdtYWluJyBlbnRyeXBvaW50LmApO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3BlY0ZpbGVzLmxlbmd0aCkge1xuICAgICAgICBvcmlnaW5hbEltcG9ydCA/Pz0gZW50cnlwb2ludC5pbXBvcnQ7XG4gICAgICAgIGVudHJ5cG9pbnQuaW1wb3J0ID0gWy4uLm9yaWdpbmFsSW1wb3J0LCAuLi5zcGVjRmlsZXNdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXJ0KHRoaXMuY29tcGlsYXRpb24sICdDb21waWxhdGlvbiBjYW5ub3QgYmUgdW5kZWZpbmVkLicpO1xuICAgICAgICB0aGlzLmNvbXBpbGF0aW9uXG4gICAgICAgICAgLmdldExvZ2dlcihwbHVnaW5OYW1lKVxuICAgICAgICAgIC5lcnJvcihgU3BlY2lmaWVkIHBhdHRlcm5zOiBcIiR7aW5jbHVkZS5qb2luKCcsICcpfVwiIGRpZCBub3QgbWF0Y2ggYW55IHNwZWMgZmlsZXMuYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlbnRyeXBvaW50cztcbiAgICB9O1xuXG4gICAgY29tcGlsZXIuaG9va3MudGhpc0NvbXBpbGF0aW9uLnRhcChQTFVHSU5fTkFNRSwgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICB0aGlzLmNvbXBpbGF0aW9uID0gY29tcGlsYXRpb247XG4gICAgICBjb21waWxhdGlvbi5jb250ZXh0RGVwZW5kZW5jaWVzLmFkZChwcm9qZWN0U291cmNlUm9vdCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLy8gZ28gdGhyb3VnaCBhbGwgcGF0dGVybnMgYW5kIGZpbmQgdW5pcXVlIGxpc3Qgb2YgZmlsZXNcbmFzeW5jIGZ1bmN0aW9uIGZpbmRUZXN0cyhcbiAgaW5jbHVkZTogc3RyaW5nW10sXG4gIGV4Y2x1ZGU6IHN0cmluZ1tdLFxuICB3b3Jrc3BhY2VSb290OiBzdHJpbmcsXG4gIHByb2plY3RTb3VyY2VSb290OiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IG1hdGNoaW5nVGVzdHNQcm9taXNlcyA9IGluY2x1ZGUubWFwKChwYXR0ZXJuKSA9PlxuICAgIGZpbmRNYXRjaGluZ1Rlc3RzKHBhdHRlcm4sIGV4Y2x1ZGUsIHdvcmtzcGFjZVJvb3QsIHByb2plY3RTb3VyY2VSb290KSxcbiAgKTtcbiAgY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChtYXRjaGluZ1Rlc3RzUHJvbWlzZXMpO1xuXG4gIC8vIFVuaXF1ZSBmaWxlIG5hbWVzXG4gIHJldHVybiBbLi4ubmV3IFNldChmaWxlcy5mbGF0KCkpXTtcbn1cblxuY29uc3Qgbm9ybWFsaXplUGF0aCA9IChwYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4gcGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG5cbmNvbnN0IHJlbW92ZUxlYWRpbmdTbGFzaCA9IChwYXR0ZXJuOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBpZiAocGF0dGVybi5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgIHJldHVybiBwYXR0ZXJuLnN1YnN0cmluZygxKTtcbiAgfVxuXG4gIHJldHVybiBwYXR0ZXJuO1xufTtcblxuY29uc3QgcmVtb3ZlUmVsYXRpdmVSb290ID0gKHBhdGg6IHN0cmluZywgcm9vdDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKHBhdGguc3RhcnRzV2l0aChyb290KSkge1xuICAgIHJldHVybiBwYXRoLnN1YnN0cmluZyhyb290Lmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRNYXRjaGluZ1Rlc3RzKFxuICBwYXR0ZXJuOiBzdHJpbmcsXG4gIGlnbm9yZTogc3RyaW5nW10sXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgcHJvamVjdFNvdXJjZVJvb3Q6IHN0cmluZyxcbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgLy8gbm9ybWFsaXplIHBhdHRlcm4sIGdsb2IgbGliIG9ubHkgYWNjZXB0cyBmb3J3YXJkIHNsYXNoZXNcbiAgbGV0IG5vcm1hbGl6ZWRQYXR0ZXJuID0gbm9ybWFsaXplUGF0aChwYXR0ZXJuKTtcbiAgbm9ybWFsaXplZFBhdHRlcm4gPSByZW1vdmVMZWFkaW5nU2xhc2gobm9ybWFsaXplZFBhdHRlcm4pO1xuXG4gIGNvbnN0IHJlbGF0aXZlUHJvamVjdFJvb3QgPSBub3JtYWxpemVQYXRoKHJlbGF0aXZlKHdvcmtzcGFjZVJvb3QsIHByb2plY3RTb3VyY2VSb290KSArICcvJyk7XG5cbiAgLy8gcmVtb3ZlIHJlbGF0aXZlUHJvamVjdFJvb3QgdG8gc3VwcG9ydCByZWxhdGl2ZSBwYXRocyBmcm9tIHJvb3RcbiAgLy8gc3VjaCBwYXRocyBhcmUgZWFzeSB0byBnZXQgd2hlbiBydW5uaW5nIHNjcmlwdHMgdmlhIElERXNcbiAgbm9ybWFsaXplZFBhdHRlcm4gPSByZW1vdmVSZWxhdGl2ZVJvb3Qobm9ybWFsaXplZFBhdHRlcm4sIHJlbGF0aXZlUHJvamVjdFJvb3QpO1xuXG4gIC8vIHNwZWNpYWwgbG9naWMgd2hlbiBwYXR0ZXJuIGRvZXMgbm90IGxvb2sgbGlrZSBhIGdsb2JcbiAgaWYgKCFpc0R5bmFtaWNQYXR0ZXJuKG5vcm1hbGl6ZWRQYXR0ZXJuKSkge1xuICAgIGlmIChhd2FpdCBpc0RpcmVjdG9yeShqb2luKHByb2plY3RTb3VyY2VSb290LCBub3JtYWxpemVkUGF0dGVybikpKSB7XG4gICAgICBub3JtYWxpemVkUGF0dGVybiA9IGAke25vcm1hbGl6ZWRQYXR0ZXJufS8qKi8qLnNwZWMuQCh0c3x0c3gpYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2VlIGlmIG1hdGNoaW5nIHNwZWMgZmlsZSBleGlzdHNcbiAgICAgIGNvbnN0IGZpbGVFeHQgPSBleHRuYW1lKG5vcm1hbGl6ZWRQYXR0ZXJuKTtcbiAgICAgIC8vIFJlcGxhY2UgZXh0ZW5zaW9uIHRvIGAuc3BlYy5leHRgLiBFeGFtcGxlOiBgc3JjL2FwcC9hcHAuY29tcG9uZW50LnRzYC0+IGBzcmMvYXBwL2FwcC5jb21wb25lbnQuc3BlYy50c2BcbiAgICAgIGNvbnN0IHBvdGVudGlhbFNwZWMgPSBqb2luKFxuICAgICAgICBwcm9qZWN0U291cmNlUm9vdCxcbiAgICAgICAgZGlybmFtZShub3JtYWxpemVkUGF0dGVybiksXG4gICAgICAgIGAke2Jhc2VuYW1lKG5vcm1hbGl6ZWRQYXR0ZXJuLCBmaWxlRXh0KX0uc3BlYyR7ZmlsZUV4dH1gLFxuICAgICAgKTtcblxuICAgICAgaWYgKGF3YWl0IGV4aXN0cyhwb3RlbnRpYWxTcGVjKSkge1xuICAgICAgICByZXR1cm4gW3BvdGVudGlhbFNwZWNdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIG5vcm1hbGl6ZSB0aGUgcGF0dGVybnMgaW4gdGhlIGlnbm9yZSBsaXN0XG4gIGNvbnN0IG5vcm1hbGl6ZWRJZ25vcmVQYXR0ZXJuTGlzdCA9IGlnbm9yZS5tYXAoKHBhdHRlcm46IHN0cmluZykgPT5cbiAgICByZW1vdmVSZWxhdGl2ZVJvb3QocmVtb3ZlTGVhZGluZ1NsYXNoKG5vcm1hbGl6ZVBhdGgocGF0dGVybikpLCByZWxhdGl2ZVByb2plY3RSb290KSxcbiAgKTtcblxuICByZXR1cm4gZ2xvYihub3JtYWxpemVkUGF0dGVybiwge1xuICAgIGN3ZDogcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgYWJzb2x1dGU6IHRydWUsXG4gICAgaWdub3JlOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsIC4uLm5vcm1hbGl6ZWRJZ25vcmVQYXR0ZXJuTGlzdF0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0RpcmVjdG9yeShwYXRoOiBQYXRoTGlrZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChwYXRoKTtcblxuICAgIHJldHVybiBzdGF0cy5pc0RpcmVjdG9yeSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhpc3RzKHBhdGg6IFBhdGhMaWtlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuYWNjZXNzKHBhdGgsIGNvbnN0YW50cy5GX09LKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==