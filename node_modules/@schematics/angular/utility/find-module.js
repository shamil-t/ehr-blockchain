"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRelativePath = exports.findModule = exports.findModuleFromOptions = exports.ROUTING_MODULE_EXT = exports.MODULE_EXT = void 0;
const core_1 = require("@angular-devkit/core");
exports.MODULE_EXT = '.module.ts';
exports.ROUTING_MODULE_EXT = '-routing.module.ts';
/**
 * Find the module referred by a set of options passed to the schematics.
 */
function findModuleFromOptions(host, options) {
    if (options.standalone || options.skipImport) {
        return undefined;
    }
    const moduleExt = options.moduleExt || exports.MODULE_EXT;
    const routingModuleExt = options.routingModuleExt || exports.ROUTING_MODULE_EXT;
    if (!options.module) {
        const pathToCheck = (options.path || '') + '/' + options.name;
        return (0, core_1.normalize)(findModule(host, pathToCheck, moduleExt, routingModuleExt));
    }
    else {
        const modulePath = (0, core_1.normalize)(`/${options.path}/${options.module}`);
        const componentPath = (0, core_1.normalize)(`/${options.path}/${options.name}`);
        const moduleBaseName = (0, core_1.normalize)(modulePath).split('/').pop();
        const candidateSet = new Set([(0, core_1.normalize)(options.path || '/')]);
        for (let dir = modulePath; dir != core_1.NormalizedRoot; dir = (0, core_1.dirname)(dir)) {
            candidateSet.add(dir);
        }
        for (let dir = componentPath; dir != core_1.NormalizedRoot; dir = (0, core_1.dirname)(dir)) {
            candidateSet.add(dir);
        }
        const candidatesDirs = [...candidateSet].sort((a, b) => b.length - a.length);
        for (const c of candidatesDirs) {
            const candidateFiles = ['', `${moduleBaseName}.ts`, `${moduleBaseName}${moduleExt}`].map((x) => (0, core_1.join)(c, x));
            for (const sc of candidateFiles) {
                if (host.exists(sc)) {
                    return (0, core_1.normalize)(sc);
                }
            }
        }
        throw new Error(`Specified module '${options.module}' does not exist.\n` +
            `Looked in the following directories:\n    ${candidatesDirs.join('\n    ')}`);
    }
}
exports.findModuleFromOptions = findModuleFromOptions;
/**
 * Function to find the "closest" module to a generated file's path.
 */
function findModule(host, generateDir, moduleExt = exports.MODULE_EXT, routingModuleExt = exports.ROUTING_MODULE_EXT) {
    let dir = host.getDir('/' + generateDir);
    let foundRoutingModule = false;
    while (dir) {
        const allMatches = dir.subfiles.filter((p) => p.endsWith(moduleExt));
        const filteredMatches = allMatches.filter((p) => !p.endsWith(routingModuleExt));
        foundRoutingModule = foundRoutingModule || allMatches.length !== filteredMatches.length;
        if (filteredMatches.length == 1) {
            return (0, core_1.join)(dir.path, filteredMatches[0]);
        }
        else if (filteredMatches.length > 1) {
            throw new Error(`More than one module matches. Use the '--skip-import' option to skip importing ` +
                'the component into the closest module or use the module option to specify a module.');
        }
        dir = dir.parent;
    }
    const errorMsg = foundRoutingModule
        ? 'Could not find a non Routing NgModule.' +
            `\nModules with suffix '${routingModuleExt}' are strictly reserved for routing.` +
            `\nUse the '--skip-import' option to skip importing in NgModule.`
        : `Could not find an NgModule. Use the '--skip-import' option to skip importing in NgModule.`;
    throw new Error(errorMsg);
}
exports.findModule = findModule;
/**
 * Build a relative path from one file path to another file path.
 */
function buildRelativePath(from, to) {
    from = (0, core_1.normalize)(from);
    to = (0, core_1.normalize)(to);
    // Convert to arrays.
    const fromParts = from.split('/');
    const toParts = to.split('/');
    // Remove file names (preserving destination)
    fromParts.pop();
    const toFileName = toParts.pop();
    const relativePath = (0, core_1.relative)((0, core_1.normalize)(fromParts.join('/') || '/'), (0, core_1.normalize)(toParts.join('/') || '/'));
    let pathPrefix = '';
    // Set the path prefix for same dir or child dir, parent dir starts with `..`
    if (!relativePath) {
        pathPrefix = '.';
    }
    else if (!relativePath.startsWith('.')) {
        pathPrefix = `./`;
    }
    if (pathPrefix && !pathPrefix.endsWith('/')) {
        pathPrefix += '/';
    }
    return pathPrefix + (relativePath ? relativePath + '/' : '') + toFileName;
}
exports.buildRelativePath = buildRelativePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9maW5kLW1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBZ0c7QUFjbkYsUUFBQSxVQUFVLEdBQUcsWUFBWSxDQUFDO0FBQzFCLFFBQUEsa0JBQWtCLEdBQUcsb0JBQW9CLENBQUM7QUFFdkQ7O0dBRUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxJQUFVLEVBQUUsT0FBc0I7SUFDdEUsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7UUFDNUMsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLGtCQUFVLENBQUM7SUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLElBQUksMEJBQWtCLENBQUM7SUFFeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDbkIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBRTlELE9BQU8sSUFBQSxnQkFBUyxFQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7S0FDOUU7U0FBTTtRQUNMLE1BQU0sVUFBVSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBQSxnQkFBUyxFQUFDLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMs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RyxDQUFDO0tBQ2xCO1NBQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDeEMsVUFBVSxHQUFHLElBQUksQ0FBQztLQUNuQjtJQUNELElBQUksVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMzQyxVQUFVLElBQUksR0FBRyxDQUFDO0tBQ25CO0lBRUQsT0FBTyxVQUFVLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztBQUM1RSxDQUFDO0FBN0JELDhDQTZCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBOb3JtYWxpemVkUm9vdCwgUGF0aCwgZGlybmFtZSwgam9pbiwgbm9ybWFsaXplLCByZWxhdGl2ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IERpckVudHJ5LCBUcmVlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1vZHVsZU9wdGlvbnMge1xuICBtb2R1bGU/OiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZmxhdD86IGJvb2xlYW47XG4gIHBhdGg/OiBzdHJpbmc7XG4gIHNraXBJbXBvcnQ/OiBib29sZWFuO1xuICBtb2R1bGVFeHQ/OiBzdHJpbmc7XG4gIHJvdXRpbmdNb2R1bGVFeHQ/OiBzdHJpbmc7XG4gIHN0YW5kYWxvbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgTU9EVUxFX0VYVCA9ICcubW9kdWxlLnRzJztcbmV4cG9ydCBjb25zdCBST1VUSU5HX01PRFVMRV9FWFQgPSAnLXJvdXRpbmcubW9kdWxlLnRzJztcblxuLyoqXG4gKiBGaW5kIHRoZSBtb2R1bGUgcmVmZXJyZWQgYnkgYSBzZXQgb2Ygb3B0aW9ucyBwYXNzZWQgdG8gdGhlIHNjaGVtYXRpY3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTW9kdWxlRnJvbU9wdGlvbnMoaG9zdDogVHJlZSwgb3B0aW9uczogTW9kdWxlT3B0aW9ucyk6IFBhdGggfCB1bmRlZmluZWQge1xuICBpZiAob3B0aW9ucy5zdGFuZGFsb25lIHx8IG9wdGlvbnMuc2tpcEltcG9ydCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2R1bGVFeHQgPSBvcHRpb25zLm1vZHVsZUV4dCB8fCBNT0RVTEVfRVhUO1xuICBjb25zdCByb3V0aW5nTW9kdWxlRXh0ID0gb3B0aW9ucy5yb3V0aW5nTW9kdWxlRXh0IHx8IFJPVVRJTkdfTU9EVUxFX0VYVDtcblxuICBpZiAoIW9wdGlvbnMubW9kdWxlKSB7XG4gICAgY29uc3QgcGF0aFRvQ2hlY2sgPSAob3B0aW9ucy5wYXRoIHx8ICcnKSArICcvJyArIG9wdGlvbnMubmFtZTtcblxuICAgIHJldHVybiBub3JtYWxpemUoZmluZE1vZHVsZShob3N0LCBwYXRoVG9DaGVjaywgbW9kdWxlRXh0LCByb3V0aW5nTW9kdWxlRXh0KSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IG5vcm1hbGl6ZShgLyR7b3B0aW9ucy5wYXRofS8ke29wdGlvbnMubW9kdWxlfWApO1xuICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBub3JtYWxpemUoYC8ke29wdGlvbnMucGF0aH0vJHtvcHRpb25zLm5hbWV9YCk7XG4gICAgY29uc3QgbW9kdWxlQmFzZU5hbWUgPSBub3JtYWxpemUobW9kdWxlUGF0aCkuc3BsaXQoJy8nKS5wb3AoKTtcblxuICAgIGNvbnN0IGNhbmRpZGF0ZVNldCA9IG5ldyBTZXQ8UGF0aD4oW25vcm1hbGl6ZShvcHRpb25zLnBhdGggfHwgJy8nKV0pO1xuXG4gICAgZm9yIChsZXQgZGlyID0gbW9kdWxlUGF0aDsgZGlyICE9IE5vcm1hbGl6ZWRSb290OyBkaXIgPSBkaXJuYW1lKGRpcikpIHtcbiAgICAgIGNhbmRpZGF0ZVNldC5hZGQoZGlyKTtcbiAgICB9XG4gICAgZm9yIChsZXQgZGlyID0gY29tcG9uZW50UGF0aDsgZGlyICE9IE5vcm1hbGl6ZWRSb290OyBkaXIgPSBkaXJuYW1lKGRpcikpIHtcbiAgICAgIGNhbmRpZGF0ZVNldC5hZGQoZGlyKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGVzRGlycyA9IFsuLi5jYW5kaWRhdGVTZXRdLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpO1xuICAgIGZvciAoY29uc3QgYyBvZiBjYW5kaWRhdGVzRGlycykge1xuICAgICAgY29uc3QgY2FuZGlkYXRlRmlsZXMgPSBbJycsIGAke21vZHVsZUJhc2VOYW1lfS50c2AsIGAke21vZHVsZUJhc2VOYW1lfSR7bW9kdWxlRXh0fWBdLm1hcChcbiAgICAgICAgKHgpID0+IGpvaW4oYywgeCksXG4gICAgICApO1xuXG4gICAgICBmb3IgKGNvbnN0IHNjIG9mIGNhbmRpZGF0ZUZpbGVzKSB7XG4gICAgICAgIGlmIChob3N0LmV4aXN0cyhzYykpIHtcbiAgICAgICAgICByZXR1cm4gbm9ybWFsaXplKHNjKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBTcGVjaWZpZWQgbW9kdWxlICcke29wdGlvbnMubW9kdWxlfScgZG9lcyBub3QgZXhpc3QuXFxuYCArXG4gICAgICAgIGBMb29rZWQgaW4gdGhlIGZvbGxvd2luZyBkaXJlY3RvcmllczpcXG4gICAgJHtjYW5kaWRhdGVzRGlycy5qb2luKCdcXG4gICAgJyl9YCxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gZmluZCB0aGUgXCJjbG9zZXN0XCIgbW9kdWxlIHRvIGEgZ2VuZXJhdGVkIGZpbGUncyBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE1vZHVsZShcbiAgaG9zdDogVHJlZSxcbiAgZ2VuZXJhdGVEaXI6IHN0cmluZyxcbiAgbW9kdWxlRXh0ID0gTU9EVUxFX0VYVCxcbiAgcm91dGluZ01vZHVsZUV4dCA9IFJPVVRJTkdfTU9EVUxFX0VYVCxcbik6IFBhdGgge1xuICBsZXQgZGlyOiBEaXJFbnRyeSB8IG51bGwgPSBob3N0LmdldERpcignLycgKyBnZW5lcmF0ZURpcik7XG4gIGxldCBmb3VuZFJvdXRpbmdNb2R1bGUgPSBmYWxzZTtcblxuICB3aGlsZSAoZGlyKSB7XG4gICAgY29uc3QgYWxsTWF0Y2hlcyA9IGRpci5zdWJmaWxlcy5maWx0ZXIoKHApID0+IHAuZW5kc1dpdGgobW9kdWxlRXh0KSk7XG4gICAgY29uc3QgZmlsdGVyZWRNYXRjaGVzID0gYWxsTWF0Y2hlcy5maWx0ZXIoKHApID0+ICFwLmVuZHNXaXRoKHJvdXRpbmdNb2R1bGVFeHQpKTtcblxuICAgIGZvdW5kUm91dGluZ01vZHVsZSA9IGZvdW5kUm91dGluZ01vZHVsZSB8fCBhbGxNYXRjaGVzLmxlbmd0aCAhPT0gZmlsdGVyZWRNYXRjaGVzLmxlbmd0aDtcblxuICAgIGlmIChmaWx0ZXJlZE1hdGNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHJldHVybiBqb2luKGRpci5wYXRoLCBmaWx0ZXJlZE1hdGNoZXNbMF0pO1xuICAgIH0gZWxzZSBpZiAoZmlsdGVyZWRNYXRjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE1vcmUgdGhhbiBvbmUgbW9kdWxlIG1hdGNoZXMuIFVzZSB0aGUgJy0tc2tpcC1pbXBvcnQnIG9wdGlvbiB0byBza2lwIGltcG9ydGluZyBgICtcbiAgICAgICAgICAndGhlIGNvbXBvbmVudCBpbnRvIHRoZSBjbG9zZXN0IG1vZHVsZSBvciB1c2UgdGhlIG1vZHVsZSBvcHRpb24gdG8gc3BlY2lmeSBhIG1vZHVsZS4nLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBkaXIgPSBkaXIucGFyZW50O1xuICB9XG5cbiAgY29uc3QgZXJyb3JNc2cgPSBmb3VuZFJvdXRpbmdNb2R1bGVcbiAgICA/ICdDb3VsZCBub3QgZmluZCBhIG5vbiBSb3V0aW5nIE5nTW9kdWxlLicgK1xuICAgICAgYFxcbk1vZHVsZXMgd2l0aCBzdWZmaXggJyR7cm91dGluZ01vZHVsZUV4dH0nIGFyZSBzdHJpY3RseSByZXNlcnZlZCBmb3Igcm91dGluZy5gICtcbiAgICAgIGBcXG5Vc2UgdGhlICctLXNraXAtaW1wb3J0JyBvcHRpb24gdG8gc2tpcCBpbXBvcnRpbmcgaW4gTmdNb2R1bGUuYFxuICAgIDogYENvdWxkIG5vdCBmaW5kIGFuIE5nTW9kdWxlLiBVc2UgdGhlICctLXNraXAtaW1wb3J0JyBvcHRpb24gdG8gc2tpcCBpbXBvcnRpbmcgaW4gTmdNb2R1bGUuYDtcblxuICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNc2cpO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgcmVsYXRpdmUgcGF0aCBmcm9tIG9uZSBmaWxlIHBhdGggdG8gYW5vdGhlciBmaWxlIHBhdGguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFJlbGF0aXZlUGF0aChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICBmcm9tID0gbm9ybWFsaXplKGZyb20pO1xuICB0byA9IG5vcm1hbGl6ZSh0byk7XG5cbiAgLy8gQ29udmVydCB0byBhcnJheXMuXG4gIGNvbnN0IGZyb21QYXJ0cyA9IGZyb20uc3BsaXQoJy8nKTtcbiAgY29uc3QgdG9QYXJ0cyA9IHRvLnNwbGl0KCcvJyk7XG5cbiAgLy8gUmVtb3ZlIGZpbGUgbmFtZXMgKHByZXNlcnZpbmcgZGVzdGluYXRpb24pXG4gIGZyb21QYXJ0cy5wb3AoKTtcbiAgY29uc3QgdG9GaWxlTmFtZSA9IHRvUGFydHMucG9wKCk7XG5cbiAgY29uc3QgcmVsYXRpdmVQYXRoID0gcmVsYXRpdmUoXG4gICAgbm9ybWFsaXplKGZyb21QYXJ0cy5qb2luKCcvJykgfHwgJy8nKSxcbiAgICBub3JtYWxpemUodG9QYXJ0cy5qb2luKCcvJykgfHwgJy8nKSxcbiAgKTtcbiAgbGV0IHBhdGhQcmVmaXggPSAnJztcblxuICAvLyBTZXQgdGhlIHBhdGggcHJlZml4IGZvciBzYW1lIGRpciBvciBjaGlsZCBkaXIsIHBhcmVudCBkaXIgc3RhcnRzIHdpdGggYC4uYFxuICBpZiAoIXJlbGF0aXZlUGF0aCkge1xuICAgIHBhdGhQcmVmaXggPSAnLic7XG4gIH0gZWxzZSBpZiAoIXJlbGF0aXZlUGF0aC5zdGFydHNXaXRoKCcuJykpIHtcbiAgICBwYXRoUHJlZml4ID0gYC4vYDtcbiAgfVxuICBpZiAocGF0aFByZWZpeCAmJiAhcGF0aFByZWZpeC5lbmRzV2l0aCgnLycpKSB7XG4gICAgcGF0aFByZWZpeCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gcGF0aFByZWZpeCArIChyZWxhdGl2ZVBhdGggPyByZWxhdGl2ZVBhdGggKyAnLycgOiAnJykgKyB0b0ZpbGVOYW1lO1xufVxuIl19