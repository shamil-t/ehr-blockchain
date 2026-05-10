"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicEngineHost = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const fs_1 = require("fs");
const jsonc_parser_1 = require("jsonc-parser");
const module_1 = require("module");
const path_1 = require("path");
const util_1 = require("util");
const vm_1 = require("vm");
const error_1 = require("../../utilities/error");
/**
 * Environment variable to control schematic package redirection
 */
const schematicRedirectVariable = process.env['NG_SCHEMATIC_REDIRECT']?.toLowerCase();
function shouldWrapSchematic(schematicFile, schematicEncapsulation) {
    // Check environment variable if present
    switch (schematicRedirectVariable) {
        case '0':
        case 'false':
        case 'off':
        case 'none':
            return false;
        case 'all':
            return true;
    }
    const normalizedSchematicFile = schematicFile.replace(/\\/g, '/');
    // Never wrap the internal update schematic when executed directly
    // It communicates with the update command via `global`
    // But we still want to redirect schematics located in `@angular/cli/node_modules`.
    if (normalizedSchematicFile.includes('node_modules/@angular/cli/') &&
        !normalizedSchematicFile.includes('node_modules/@angular/cli/node_modules/')) {
        return false;
    }
    // @angular/pwa uses dynamic imports which causes `[1]    2468039 segmentation fault` when wrapped.
    // We should remove this when make `importModuleDynamically` work.
    // See: https://nodejs.org/docs/latest-v14.x/api/vm.html
    if (normalizedSchematicFile.includes('@angular/pwa')) {
        return false;
    }
    // Check for first-party Angular schematic packages
    // Angular schematics are safe to use in the wrapped VM context
    if (/\/node_modules\/@(?:angular|schematics|nguniversal)\//.test(normalizedSchematicFile)) {
        return true;
    }
    // Otherwise use the value of the schematic collection's encapsulation option (current default of false)
    return schematicEncapsulation;
}
class SchematicEngineHost extends tools_1.NodeModulesEngineHost {
    _resolveReferenceString(refString, parentPath, collectionDescription) {
        const [path, name] = refString.split('#', 2);
        // Mimic behavior of ExportStringRef class used in default behavior
        const fullPath = path[0] === '.' ? (0, path_1.resolve)(parentPath ?? process.cwd(), path) : path;
        const referenceRequire = (0, module_1.createRequire)(__filename);
        const schematicFile = referenceRequire.resolve(fullPath, { paths: [parentPath] });
        if (shouldWrapSchematic(schematicFile, !!collectionDescription?.encapsulation)) {
            const schematicPath = (0, path_1.dirname)(schematicFile);
            const moduleCache = new Map();
            const factoryInitializer = wrap(schematicFile, schematicPath, moduleCache, name || 'default');
            const factory = factoryInitializer();
            if (!factory || typeof factory !== 'function') {
                return null;
            }
            return { ref: factory, path: schematicPath };
        }
        // All other schematics use default behavior
        return super._resolveReferenceString(refString, parentPath, collectionDescription);
    }
}
exports.SchematicEngineHost = SchematicEngineHost;
/**
 * Minimal shim modules for legacy deep imports of `@schematics/angular`
 */
const legacyModules = {
    '@schematics/angular/utility/config': {
        getWorkspace(host) {
            const path = '/.angular.json';
            const data = host.read(path);
            if (!data) {
                throw new schematics_1.SchematicsException(`Could not find (${path})`);
            }
            return (0, jsonc_parser_1.parse)(data.toString(), [], { allowTrailingComma: true });
        },
    },
    '@schematics/angular/utility/project': {
        buildDefaultPath(project) {
            const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
            return `${root}${project.projectType === 'application' ? 'app' : 'lib'}`;
        },
    },
};
/**
 * Wrap a JavaScript file in a VM context to allow specific Angular dependencies to be redirected.
 * This VM setup is ONLY intended to redirect dependencies.
 *
 * @param schematicFile A JavaScript schematic file path that should be wrapped.
 * @param schematicDirectory A directory that will be used as the location of the JavaScript file.
 * @param moduleCache A map to use for caching repeat module usage and proper `instanceof` support.
 * @param exportName An optional name of a specific export to return. Otherwise, return all exports.
 */
function wrap(schematicFile, schematicDirectory, moduleCache, exportName) {
    const hostRequire = (0, module_1.createRequire)(__filename);
    const schematicRequire = (0, module_1.createRequire)(schematicFile);
    const customRequire = function (id) {
        if (legacyModules[id]) {
            // Provide compatibility modules for older versions of @angular/cdk
            return legacyModules[id];
        }
        else if (id.startsWith('schematics:')) {
            // Schematics built-in modules use the `schematics` scheme (similar to the Node.js `node` scheme)
            const builtinId = id.slice(11);
            const builtinModule = loadBuiltinModule(builtinId);
            if (!builtinModule) {
                throw new Error(`Unknown schematics built-in module '${id}' requested from schematic '${schematicFile}'`);
            }
            return builtinModule;
        }
        else if (id.startsWith('@angular-devkit/') || id.startsWith('@schematics/')) {
            // Files should not redirect `@angular/core` and instead use the direct
            // dependency if available. This allows old major version migrations to continue to function
            // even though the latest major version may have breaking changes in `@angular/core`.
            if (id.startsWith('@angular-devkit/core')) {
                try {
                    return schematicRequire(id);
                }
                catch (e) {
                    (0, error_1.assertIsError)(e);
                    if (e.code !== 'MODULE_NOT_FOUND') {
                        throw e;
                    }
                }
            }
            // Resolve from inside the `@angular/cli` project
            return hostRequire(id);
        }
        else if (id.startsWith('.') || id.startsWith('@angular/cdk')) {
            // Wrap relative files inside the schematic collection
            // Also wrap `@angular/cdk`, it contains helper utilities that import core schematic packages
            // Resolve from the original file
            const modulePath = schematicRequire.resolve(id);
            // Use cached module if available
            const cachedModule = moduleCache.get(modulePath);
            if (cachedModule) {
                return cachedModule;
            }
            // Do not wrap vendored third-party packages or JSON files
            if (!/[/\\]node_modules[/\\]@schematics[/\\]angular[/\\]third_party[/\\]/.test(modulePath) &&
                !modulePath.endsWith('.json')) {
                // Wrap module and save in cache
                const wrappedModule = wrap(modulePath, (0, path_1.dirname)(modulePath), moduleCache)();
                moduleCache.set(modulePath, wrappedModule);
                return wrappedModule;
            }
        }
        // All others are required directly from the original file
        return schematicRequire(id);
    };
    // Setup a wrapper function to capture the module's exports
    const schematicCode = (0, fs_1.readFileSync)(schematicFile, 'utf8');
    // `module` is required due to @angular/localize ng-add being in UMD format
    const headerCode = '(function() {\nvar exports = {};\nvar module = { exports };\n';
    const footerCode = exportName
        ? `\nreturn module.exports['${exportName}'];});`
        : '\nreturn module.exports;});';
    const script = new vm_1.Script(headerCode + schematicCode + footerCode, {
        filename: schematicFile,
        lineOffset: 3,
    });
    const context = {
        __dirname: schematicDirectory,
        __filename: schematicFile,
        Buffer,
        // TextEncoder is used by the compiler to generate i18n message IDs. See:
        // https://github.com/angular/angular/blob/main/packages/compiler/src/i18n/digest.ts#L17
        // It is referenced globally, because it may be run either on the browser or the server.
        // Usually Node exposes it globally, but in order for it to work, our custom context
        // has to expose it too. Issue context: https://github.com/angular/angular/issues/48940.
        TextEncoder: util_1.TextEncoder,
        console,
        process,
        get global() {
            return this;
        },
        require: customRequire,
    };
    const exportsFactory = script.runInNewContext(context);
    return exportsFactory;
}
function loadBuiltinModule(id) {
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLWVuZ2luZS1ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvc2NoZW1hdGljLWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDJEQUFvRjtBQUNwRiw0REFBbUc7QUFDbkcsMkJBQWtDO0FBQ2xDLCtDQUFrRDtBQUNsRCxtQ0FBdUM7QUFDdkMsK0JBQXdDO0FBQ3hDLCtCQUFtQztBQUNuQywyQkFBNEI7QUFDNUIsaURBQXNEO0FBRXREOztHQUVHO0FBQ0gsTUFBTSx5QkFBeUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7QUFFdEYsU0FBUyxtQkFBbUIsQ0FBQyxhQUFxQixFQUFFLHNCQUErQjtJQUNqRix3Q0FBd0M7SUFDeEMsUUFBUSx5QkFBeUIsRUFBRTtRQUNqQyxLQUFLLEdBQUcsQ0FBQztRQUNULEtBQUssT0FBTyxDQUFDO1FBQ2IsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLE1BQU07WUFDVCxPQUFPLEtBQUssQ0FBQztRQUNmLEtBQUssS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFFRCxNQUFNLHVCQUF1QixHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xFLGtFQUFrRTtJQUNsRSx1REFBdUQ7SUFDdkQsbUZBQW1GO0lBQ25GLElBQ0UsdUJBQXVCLENBQUMsUUFBUSxDQUFDLDRCQUE0QixDQUFDO1FBQzlELENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLHlDQUF5QyxDQUFDLEVBQzVFO1FBQ0EsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELG1HQUFtRztJQUNuRyxrRUFBa0U7SUFDbEUsd0RBQXdE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R0FBRyxJQUFBLGlCQUFZLEVBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFELDJFQUEyRTtJQUMzRSxNQUFNLFVBQVUsR0FBRywrREFBK0QsQ0FBQztJQUNuRixNQUFNLFVBQVUsR0FBRyxVQUFVO1FBQzNCLENBQUMsQ0FBQyw0QkFBNEIsVUFBVSxRQUFRO1FBQ2hELENBQUMsQ0FBQyw2QkFBNkIsQ0FBQztJQUVsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQU0sQ0FBQyxVQUFVLEdBQUcsYUFBYSxHQUFHLFVBQVUsRUFBRTtRQUNqRSxRQUFRLEVBQUUsYUFBYTtRQUN2QixVQUFVLEVBQUUsQ0FBQztLQUNkLENBQUMsQ0FBQztJQUVILE1BQU0sT0FBTyxHQUFHO1FBQ2QsU0FBUyxFQUFFLGtCQUFrQjtRQUM3QixVQUFVLEVBQUUsYUFBYTtRQUN6QixNQUFNO1FBQ04seUVBQXlFO1FBQ3pFLHdGQUF3RjtRQUN4Rix3RkFBd0Y7UUFDeEYsb0ZBQW9GO1FBQ3BGLHdGQUF3RjtRQUN4RixXQUFXLEVBQVgsa0JBQVc7UUFDWCxPQUFPO1FBQ1AsT0FBTztRQUNQLElBQUksTUFBTTtZQUNSLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sRUFBRSxhQUFhO0tBQ3ZCLENBQUM7SUFFRixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXZELE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEVBQVU7SUFDbkMsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBSdWxlRmFjdG9yeSwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYywgTm9kZU1vZHVsZXNFbmdpbmVIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgcGFyc2UgYXMgcGFyc2VKc29uIH0gZnJvbSAnanNvbmMtcGFyc2VyJztcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xuaW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgVGV4dEVuY29kZXIgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7IFNjcmlwdCB9IGZyb20gJ3ZtJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvZXJyb3InO1xuXG4vKipcbiAqIEVudmlyb25tZW50IHZhcmlhYmxlIHRvIGNvbnRyb2wgc2NoZW1hdGljIHBhY2thZ2UgcmVkaXJlY3Rpb25cbiAqL1xuY29uc3Qgc2NoZW1hdGljUmVkaXJlY3RWYXJpYWJsZSA9IHByb2Nlc3MuZW52WydOR19TQ0hFTUFUSUNfUkVESVJFQ1QnXT8udG9Mb3dlckNhc2UoKTtcblxuZnVuY3Rpb24gc2hvdWxkV3JhcFNjaGVtYXRpYyhzY2hlbWF0aWNGaWxlOiBzdHJpbmcsIHNjaGVtYXRpY0VuY2Fwc3VsYXRpb246IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgLy8gQ2hlY2sgZW52aXJvbm1lbnQgdmFyaWFibGUgaWYgcHJlc2VudFxuICBzd2l0Y2ggKHNjaGVtYXRpY1JlZGlyZWN0VmFyaWFibGUpIHtcbiAgICBjYXNlICcwJzpcbiAgICBjYXNlICdmYWxzZSc6XG4gICAgY2FzZSAnb2ZmJzpcbiAgICBjYXNlICdub25lJzpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjYXNlICdhbGwnOlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkU2NoZW1hdGljRmlsZSA9IHNjaGVtYXRpY0ZpbGUucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAvLyBOZXZlciB3cmFwIHRoZSBpbnRlcm5hbCB1cGRhdGUgc2NoZW1hdGljIHdoZW4gZXhlY3V0ZWQgZGlyZWN0bHlcbiAgLy8gSXQgY29tbXVuaWNhdGVzIHdpdGggdGhlIHVwZGF0ZSBjb21tYW5kIHZpYSBgZ2xvYmFsYFxuICAvLyBCdXQgd2Ugc3RpbGwgd2FudCB0byByZWRpcmVjdCBzY2hlbWF0aWNzIGxvY2F0ZWQgaW4gYEBhbmd1bGFyL2NsaS9ub2RlX21vZHVsZXNgLlxuICBpZiAoXG4gICAgbm9ybWFsaXplZFNjaGVtYXRpY0ZpbGUuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9AYW5ndWxhci9jbGkvJykgJiZcbiAgICAhbm9ybWFsaXplZFNjaGVtYXRpY0ZpbGUuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9AYW5ndWxhci9jbGkvbm9kZV9tb2R1bGVzLycpXG4gICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEBhbmd1bGFyL3B3YSB1c2VzIGR5bmFtaWMgaW1wb3J0cyB3aGljaCBjYXVzZXMgYFsxXSAgICAyNDY4MDM5IHNlZ21lbnRhdGlvbiBmYXVsdGAgd2hlbiB3cmFwcGVkLlxuICAvLyBXZSBzaG91bGQgcmVtb3ZlIHRoaXMgd2hlbiBtYWtlIGBpbXBvcnRNb2R1bGVEeW5hbWljYWxseWAgd29yay5cbiAgLy8gU2VlOiBodHRwczovL25vZGVqcy5vcmcvZG9jcy9sYXRlc3QtdjE0LngvYXBpL3ZtLmh0bWxcbiAgaWYgKG5vcm1hbGl6ZWRTY2hlbWF0aWNGaWxlLmluY2x1ZGVzKCdAYW5ndWxhci9wd2EnKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBmaXJzdC1wYXJ0eSBBbmd1bGFyIHNjaGVtYXRpYyBwYWNrYWdlc1xuICAvLyBBbmd1bGFyIHNjaGVtYXRpY3MgYXJlIHNhZmUgdG8gdXNlIGluIHRoZSB3cmFwcGVkIFZNIGNvbnRleHRcbiAgaWYgKC9cXC9ub2RlX21vZHVsZXNcXC9AKD86YW5ndWxhcnxzY2hlbWF0aWNzfG5ndW5pdmVyc2FsKVxcLy8udGVzdChub3JtYWxpemVkU2NoZW1hdGljRmlsZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIE90aGVyd2lzZSB1c2UgdGhlIHZhbHVlIG9mIHRoZSBzY2hlbWF0aWMgY29sbGVjdGlvbidzIGVuY2Fwc3VsYXRpb24gb3B0aW9uIChjdXJyZW50IGRlZmF1bHQgb2YgZmFsc2UpXG4gIHJldHVybiBzY2hlbWF0aWNFbmNhcHN1bGF0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgU2NoZW1hdGljRW5naW5lSG9zdCBleHRlbmRzIE5vZGVNb2R1bGVzRW5naW5lSG9zdCB7XG4gIHByb3RlY3RlZCBvdmVycmlkZSBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhcbiAgICByZWZTdHJpbmc6IHN0cmluZyxcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbkRlc2NyaXB0aW9uPzogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApIHtcbiAgICBjb25zdCBbcGF0aCwgbmFtZV0gPSByZWZTdHJpbmcuc3BsaXQoJyMnLCAyKTtcbiAgICAvLyBNaW1pYyBiZWhhdmlvciBvZiBFeHBvcnRTdHJpbmdSZWYgY2xhc3MgdXNlZCBpbiBkZWZhdWx0IGJlaGF2aW9yXG4gICAgY29uc3QgZnVsbFBhdGggPSBwYXRoWzBdID09PSAnLicgPyByZXNvbHZlKHBhcmVudFBhdGggPz8gcHJvY2Vzcy5jd2QoKSwgcGF0aCkgOiBwYXRoO1xuXG4gICAgY29uc3QgcmVmZXJlbmNlUmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoX19maWxlbmFtZSk7XG4gICAgY29uc3Qgc2NoZW1hdGljRmlsZSA9IHJlZmVyZW5jZVJlcXVpcmUucmVzb2x2ZShmdWxsUGF0aCwgeyBwYXRoczogW3BhcmVudFBhdGhdIH0pO1xuXG4gICAgaWYgKHNob3VsZFdyYXBTY2hlbWF0aWMoc2NoZW1hdGljRmlsZSwgISFjb2xsZWN0aW9uRGVzY3JpcHRpb24/LmVuY2Fwc3VsYXRpb24pKSB7XG4gICAgICBjb25zdCBzY2hlbWF0aWNQYXRoID0gZGlybmFtZShzY2hlbWF0aWNGaWxlKTtcblxuICAgICAgY29uc3QgbW9kdWxlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgdW5rbm93bj4oKTtcbiAgICAgIGNvbnN0IGZhY3RvcnlJbml0aWFsaXplciA9IHdyYXAoXG4gICAgICAgIHNjaGVtYXRpY0ZpbGUsXG4gICAgICAgIHNjaGVtYXRpY1BhdGgsXG4gICAgICAgIG1vZHVsZUNhY2hlLFxuICAgICAgICBuYW1lIHx8ICdkZWZhdWx0JyxcbiAgICAgICkgYXMgKCkgPT4gUnVsZUZhY3Rvcnk8e30+O1xuXG4gICAgICBjb25zdCBmYWN0b3J5ID0gZmFjdG9yeUluaXRpYWxpemVyKCk7XG4gICAgICBpZiAoIWZhY3RvcnkgfHwgdHlwZW9mIGZhY3RvcnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IHJlZjogZmFjdG9yeSwgcGF0aDogc2NoZW1hdGljUGF0aCB9O1xuICAgIH1cblxuICAgIC8vIEFsbCBvdGhlciBzY2hlbWF0aWNzIHVzZSBkZWZhdWx0IGJlaGF2aW9yXG4gICAgcmV0dXJuIHN1cGVyLl9yZXNvbHZlUmVmZXJlbmNlU3RyaW5nKHJlZlN0cmluZywgcGFyZW50UGF0aCwgY29sbGVjdGlvbkRlc2NyaXB0aW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIE1pbmltYWwgc2hpbSBtb2R1bGVzIGZvciBsZWdhY3kgZGVlcCBpbXBvcnRzIG9mIGBAc2NoZW1hdGljcy9hbmd1bGFyYFxuICovXG5jb25zdCBsZWdhY3lNb2R1bGVzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9jb25maWcnOiB7XG4gICAgZ2V0V29ya3NwYWNlKGhvc3Q6IFRyZWUpIHtcbiAgICAgIGNvbnN0IHBhdGggPSAnLy5hbmd1bGFyLmpzb24nO1xuICAgICAgY29uc3QgZGF0YSA9IGhvc3QucmVhZChwYXRoKTtcbiAgICAgIGlmICghZGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IGZpbmQgKCR7cGF0aH0pYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJzZUpzb24oZGF0YS50b1N0cmluZygpLCBbXSwgeyBhbGxvd1RyYWlsaW5nQ29tbWE6IHRydWUgfSk7XG4gICAgfSxcbiAgfSxcbiAgJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9wcm9qZWN0Jzoge1xuICAgIGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdDogeyBzb3VyY2VSb290Pzogc3RyaW5nOyByb290OiBzdHJpbmc7IHByb2plY3RUeXBlOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gICAgICBjb25zdCByb290ID0gcHJvamVjdC5zb3VyY2VSb290ID8gYC8ke3Byb2plY3Quc291cmNlUm9vdH0vYCA6IGAvJHtwcm9qZWN0LnJvb3R9L3NyYy9gO1xuXG4gICAgICByZXR1cm4gYCR7cm9vdH0ke3Byb2plY3QucHJvamVjdFR5cGUgPT09ICdhcHBsaWNhdGlvbicgPyAnYXBwJyA6ICdsaWInfWA7XG4gICAgfSxcbiAgfSxcbn07XG5cbi8qKlxuICogV3JhcCBhIEphdmFTY3JpcHQgZmlsZSBpbiBhIFZNIGNvbnRleHQgdG8gYWxsb3cgc3BlY2lmaWMgQW5ndWxhciBkZXBlbmRlbmNpZXMgdG8gYmUgcmVkaXJlY3RlZC5cbiAqIFRoaXMgVk0gc2V0dXAgaXMgT05MWSBpbnRlbmRlZCB0byByZWRpcmVjdCBkZXBlbmRlbmNpZXMuXG4gKlxuICogQHBhcmFtIHNjaGVtYXRpY0ZpbGUgQSBKYXZhU2NyaXB0IHNjaGVtYXRpYyBmaWxlIHBhdGggdGhhdCBzaG91bGQgYmUgd3JhcHBlZC5cbiAqIEBwYXJhbSBzY2hlbWF0aWNEaXJlY3RvcnkgQSBkaXJlY3RvcnkgdGhhdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBKYXZhU2NyaXB0IGZpbGUuXG4gKiBAcGFyYW0gbW9kdWxlQ2FjaGUgQSBtYXAgdG8gdXNlIGZvciBjYWNoaW5nIHJlcGVhdCBtb2R1bGUgdXNhZ2UgYW5kIHByb3BlciBgaW5zdGFuY2VvZmAgc3VwcG9ydC5cbiAqIEBwYXJhbSBleHBvcnROYW1lIEFuIG9wdGlvbmFsIG5hbWUgb2YgYSBzcGVjaWZpYyBleHBvcnQgdG8gcmV0dXJuLiBPdGhlcndpc2UsIHJldHVybiBhbGwgZXhwb3J0cy5cbiAqL1xuZnVuY3Rpb24gd3JhcChcbiAgc2NoZW1hdGljRmlsZTogc3RyaW5nLFxuICBzY2hlbWF0aWNEaXJlY3Rvcnk6IHN0cmluZyxcbiAgbW9kdWxlQ2FjaGU6IE1hcDxzdHJpbmcsIHVua25vd24+LFxuICBleHBvcnROYW1lPzogc3RyaW5nLFxuKTogKCkgPT4gdW5rbm93biB7XG4gIGNvbnN0IGhvc3RSZXF1aXJlID0gY3JlYXRlUmVxdWlyZShfX2ZpbGVuYW1lKTtcbiAgY29uc3Qgc2NoZW1hdGljUmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoc2NoZW1hdGljRmlsZSk7XG5cbiAgY29uc3QgY3VzdG9tUmVxdWlyZSA9IGZ1bmN0aW9uIChpZDogc3RyaW5nKSB7XG4gICAgaWYgKGxlZ2FjeU1vZHVsZXNbaWRdKSB7XG4gICAgICAvLyBQcm92aWRlIGNvbXBhdGliaWxpdHkgbW9kdWxlcyBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQGFuZ3VsYXIvY2RrXG4gICAgICByZXR1cm4gbGVnYWN5TW9kdWxlc1tpZF07XG4gICAgfSBlbHNlIGlmIChpZC5zdGFydHNXaXRoKCdzY2hlbWF0aWNzOicpKSB7XG4gICAgICAvLyBTY2hlbWF0aWNzIGJ1aWx0LWluIG1vZHVsZXMgdXNlIHRoZSBgc2NoZW1hdGljc2Agc2NoZW1lIChzaW1pbGFyIHRvIHRoZSBOb2RlLmpzIGBub2RlYCBzY2hlbWUpXG4gICAgICBjb25zdCBidWlsdGluSWQgPSBpZC5zbGljZSgxMSk7XG4gICAgICBjb25zdCBidWlsdGluTW9kdWxlID0gbG9hZEJ1aWx0aW5Nb2R1bGUoYnVpbHRpbklkKTtcbiAgICAgIGlmICghYnVpbHRpbk1vZHVsZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFVua25vd24gc2NoZW1hdGljcyBidWlsdC1pbiBtb2R1bGUgJyR7aWR9JyByZXF1ZXN0ZWQgZnJvbSBzY2hlbWF0aWMgJyR7c2NoZW1hdGljRmlsZX0nYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJ1aWx0aW5Nb2R1bGU7XG4gICAgfSBlbHNlIGlmIChpZC5zdGFydHNXaXRoKCdAYW5ndWxhci1kZXZraXQvJykgfHwgaWQuc3RhcnRzV2l0aCgnQHNjaGVtYXRpY3MvJykpIHtcbiAgICAgIC8vIEZpbGVzIHNob3VsZCBub3QgcmVkaXJlY3QgYEBhbmd1bGFyL2NvcmVgIGFuZCBpbnN0ZWFkIHVzZSB0aGUgZGlyZWN0XG4gICAgICAvLyBkZXBlbmRlbmN5IGlmIGF2YWlsYWJsZS4gVGhpcyBhbGxvd3Mgb2xkIG1ham9yIHZlcnNpb24gbWlncmF0aW9ucyB0byBjb250aW51ZSB0byBmdW5jdGlvblxuICAgICAgLy8gZXZlbiB0aG91Z2ggdGhlIGxhdGVzdCBtYWpvciB2ZXJzaW9uIG1heSBoYXZlIGJyZWFraW5nIGNoYW5nZXMgaW4gYEBhbmd1bGFyL2NvcmVgLlxuICAgICAgaWYgKGlkLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJykpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gc2NoZW1hdGljUmVxdWlyZShpZCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICAgIGlmIChlLmNvZGUgIT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVzb2x2ZSBmcm9tIGluc2lkZSB0aGUgYEBhbmd1bGFyL2NsaWAgcHJvamVjdFxuICAgICAgcmV0dXJuIGhvc3RSZXF1aXJlKGlkKTtcbiAgICB9IGVsc2UgaWYgKGlkLnN0YXJ0c1dpdGgoJy4nKSB8fCBpZC5zdGFydHNXaXRoKCdAYW5ndWxhci9jZGsnKSkge1xuICAgICAgLy8gV3JhcCByZWxhdGl2ZSBmaWxlcyBpbnNpZGUgdGhlIHNjaGVtYXRpYyBjb2xsZWN0aW9uXG4gICAgICAvLyBBbHNvIHdyYXAgYEBhbmd1bGFyL2Nka2AsIGl0IGNvbnRhaW5zIGhlbHBlciB1dGlsaXRpZXMgdGhhdCBpbXBvcnQgY29yZSBzY2hlbWF0aWMgcGFja2FnZXNcblxuICAgICAgLy8gUmVzb2x2ZSBmcm9tIHRoZSBvcmlnaW5hbCBmaWxlXG4gICAgICBjb25zdCBtb2R1bGVQYXRoID0gc2NoZW1hdGljUmVxdWlyZS5yZXNvbHZlKGlkKTtcblxuICAgICAgLy8gVXNlIGNhY2hlZCBtb2R1bGUgaWYgYXZhaWxhYmxlXG4gICAgICBjb25zdCBjYWNoZWRNb2R1bGUgPSBtb2R1bGVDYWNoZS5nZXQobW9kdWxlUGF0aCk7XG4gICAgICBpZiAoY2FjaGVkTW9kdWxlKSB7XG4gICAgICAgIHJldHVybiBjYWNoZWRNb2R1bGU7XG4gICAgICB9XG5cbiAgICAgIC8vIERvIG5vdCB3cmFwIHZlbmRvcmVkIHRoaXJkLXBhcnR5IHBhY2thZ2VzIG9yIEpTT04gZmlsZXNcbiAgICAgIGlmIChcbiAgICAgICAgIS9bL1xcXFxdbm9kZV9tb2R1bGVzWy9cXFxcXUBzY2hlbWF0aWNzWy9cXFxcXWFuZ3VsYXJbL1xcXFxddGhpcmRfcGFydHlbL1xcXFxdLy50ZXN0KG1vZHVsZVBhdGgpICYmXG4gICAgICAgICFtb2R1bGVQYXRoLmVuZHNXaXRoKCcuanNvbicpXG4gICAgICApIHtcbiAgICAgICAgLy8gV3JhcCBtb2R1bGUgYW5kIHNhdmUgaW4gY2FjaGVcbiAgICAgICAgY29uc3Qgd3JhcHBlZE1vZHVsZSA9IHdyYXAobW9kdWxlUGF0aCwgZGlybmFtZShtb2R1bGVQYXRoKSwgbW9kdWxlQ2FjaGUpKCk7XG4gICAgICAgIG1vZHVsZUNhY2hlLnNldChtb2R1bGVQYXRoLCB3cmFwcGVkTW9kdWxlKTtcblxuICAgICAgICByZXR1cm4gd3JhcHBlZE1vZHVsZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbGwgb3RoZXJzIGFyZSByZXF1aXJlZCBkaXJlY3RseSBmcm9tIHRoZSBvcmlnaW5hbCBmaWxlXG4gICAgcmV0dXJuIHNjaGVtYXRpY1JlcXVpcmUoaWQpO1xuICB9O1xuXG4gIC8vIFNldHVwIGEgd3JhcHBlciBmdW5jdGlvbiB0byBjYXB0dXJlIHRoZSBtb2R1bGUncyBleHBvcnRzXG4gIGNvbnN0IHNjaGVtYXRpY0NvZGUgPSByZWFkRmlsZVN5bmMoc2NoZW1hdGljRmlsZSwgJ3V0ZjgnKTtcbiAgLy8gYG1vZHVsZWAgaXMgcmVxdWlyZWQgZHVlIHRvIEBhbmd1bGFyL2xvY2FsaXplIG5nLWFkZCBiZWluZyBpbiBVTUQgZm9ybWF0XG4gIGNvbnN0IGhlYWRlckNvZGUgPSAnKGZ1bmN0aW9uKCkge1xcbnZhciBleHBvcnRzID0ge307XFxudmFyIG1vZHVsZSA9IHsgZXhwb3J0cyB9O1xcbic7XG4gIGNvbnN0IGZvb3RlckNvZGUgPSBleHBvcnROYW1lXG4gICAgPyBgXFxucmV0dXJuIG1vZHVsZS5leHBvcnRzWycke2V4cG9ydE5hbWV9J107fSk7YFxuICAgIDogJ1xcbnJldHVybiBtb2R1bGUuZXhwb3J0czt9KTsnO1xuXG4gIGNvbnN0IHNjcmlwdCA9IG5ldyBTY3JpcHQoaGVhZGVyQ29kZSArIHNjaGVtYXRpY0NvZGUgKyBmb290ZXJDb2RlLCB7XG4gICAgZmlsZW5hbWU6IHNjaGVtYXRpY0ZpbGUsXG4gICAgbGluZU9mZnNldDogMyxcbiAgfSk7XG5cbiAgY29uc3QgY29udGV4dCA9IHtcbiAgICBfX2Rpcm5hbWU6IHNjaGVtYXRpY0RpcmVjdG9yeSxcbiAgICBfX2ZpbGVuYW1lOiBzY2hlbWF0aWNGaWxlLFxuICAgIEJ1ZmZlcixcbiAgICAvLyBUZXh0RW5jb2RlciBpcyB1c2VkIGJ5IHRoZSBjb21waWxlciB0byBnZW5lcmF0ZSBpMThuIG1lc3NhZ2UgSURzLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21haW4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2kxOG4vZGlnZXN0LnRzI0wxN1xuICAgIC8vIEl0IGlzIHJlZmVyZW5jZWQgZ2xvYmFsbHksIGJlY2F1c2UgaXQgbWF5IGJlIHJ1biBlaXRoZXIgb24gdGhlIGJyb3dzZXIgb3IgdGhlIHNlcnZlci5cbiAgICAvLyBVc3VhbGx5IE5vZGUgZXhwb3NlcyBpdCBnbG9iYWxseSwgYnV0IGluIG9yZGVyIGZvciBpdCB0byB3b3JrLCBvdXIgY3VzdG9tIGNvbnRleHRcbiAgICAvLyBoYXMgdG8gZXhwb3NlIGl0IHRvby4gSXNzdWUgY29udGV4dDogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvNDg5NDAuXG4gICAgVGV4dEVuY29kZXIsXG4gICAgY29uc29sZSxcbiAgICBwcm9jZXNzLFxuICAgIGdldCBnbG9iYWwoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlcXVpcmU6IGN1c3RvbVJlcXVpcmUsXG4gIH07XG5cbiAgY29uc3QgZXhwb3J0c0ZhY3RvcnkgPSBzY3JpcHQucnVuSW5OZXdDb250ZXh0KGNvbnRleHQpO1xuXG4gIHJldHVybiBleHBvcnRzRmFjdG9yeTtcbn1cblxuZnVuY3Rpb24gbG9hZEJ1aWx0aW5Nb2R1bGUoaWQ6IHN0cmluZyk6IHVua25vd24ge1xuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl19