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
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const ts = __importStar(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const ast_utils_1 = require("../utility/ast-utils");
const change_1 = require("../utility/change");
const find_module_1 = require("../utility/find-module");
const parse_name_1 = require("../utility/parse-name");
const validation_1 = require("../utility/validation");
const workspace_1 = require("../utility/workspace");
const schema_1 = require("./schema");
function buildRelativeModulePath(options, modulePath) {
    const importModulePath = (0, core_1.normalize)(`/${options.path}/` +
        (options.flat ? '' : schematics_1.strings.dasherize(options.name) + '/') +
        schematics_1.strings.dasherize(options.name) +
        '.module');
    return (0, find_module_1.buildRelativePath)(modulePath, importModulePath);
}
function addImportToNgModule(options) {
    return (host) => {
        if (!options.module) {
            return host;
        }
        const modulePath = options.module;
        const sourceText = host.readText(modulePath);
        const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
        const relativePath = buildRelativeModulePath(options, modulePath);
        const changes = (0, ast_utils_1.addImportToModule)(source, modulePath, schematics_1.strings.classify(`${options.name}Module`), relativePath);
        const recorder = host.beginUpdate(modulePath);
        for (const change of changes) {
            if (change instanceof change_1.InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
        return host;
    };
}
function addRouteDeclarationToNgModule(options, routingModulePath) {
    return (host) => {
        if (!options.route) {
            return host;
        }
        if (!options.module) {
            throw new Error('Module option required when creating a lazy loaded routing module.');
        }
        let path;
        if (routingModulePath) {
            path = routingModulePath;
        }
        else {
            path = options.module;
        }
        const sourceText = host.readText(path);
        const addDeclaration = (0, ast_utils_1.addRouteDeclarationToModule)(ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true), path, buildRoute(options, options.module));
        const recorder = host.beginUpdate(path);
        recorder.insertLeft(addDeclaration.pos, addDeclaration.toAdd);
        host.commitUpdate(recorder);
        return host;
    };
}
function getRoutingModulePath(host, modulePath) {
    const routingModulePath = modulePath.endsWith(find_module_1.ROUTING_MODULE_EXT)
        ? modulePath
        : modulePath.replace(find_module_1.MODULE_EXT, find_module_1.ROUTING_MODULE_EXT);
    return host.exists(routingModulePath) ? (0, core_1.normalize)(routingModulePath) : undefined;
}
function buildRoute(options, modulePath) {
    const relativeModulePath = buildRelativeModulePath(options, modulePath);
    const moduleName = `${schematics_1.strings.classify(options.name)}Module`;
    const loadChildren = `() => import('${relativeModulePath}').then(m => m.${moduleName})`;
    return `{ path: '${options.route}', loadChildren: ${loadChildren} }`;
}
function default_1(options) {
    return async (host) => {
        if (options.path === undefined) {
            options.path = await (0, workspace_1.createDefaultPath)(host, options.project);
        }
        if (options.module) {
            options.module = (0, find_module_1.findModuleFromOptions)(host, options);
        }
        let routingModulePath;
        const isLazyLoadedModuleGen = !!(options.route && options.module);
        if (isLazyLoadedModuleGen) {
            options.routingScope = schema_1.RoutingScope.Child;
            routingModulePath = getRoutingModulePath(host, options.module);
        }
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        (0, validation_1.validateClassName)(schematics_1.strings.classify(options.name));
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            options.routing || (isLazyLoadedModuleGen && routingModulePath)
                ? (0, schematics_1.noop)()
                : (0, schematics_1.filter)((path) => !path.endsWith('-routing.module.ts.template')),
            (0, schematics_1.applyTemplates)({
                ...schematics_1.strings,
                'if-flat': (s) => (options.flat ? '' : s),
                lazyRoute: isLazyLoadedModuleGen,
                lazyRouteWithoutRouteModule: isLazyLoadedModuleGen && !routingModulePath,
                lazyRouteWithRouteModule: isLazyLoadedModuleGen && !!routingModulePath,
                ...options,
            }),
            (0, schematics_1.move)(parsedPath.path),
        ]);
        const moduleDasherized = schematics_1.strings.dasherize(options.name);
        const modulePath = `${!options.flat ? moduleDasherized + '/' : ''}${moduleDasherized}.module.ts`;
        const componentOptions = {
            module: modulePath,
            flat: options.flat,
            name: options.name,
            path: options.path,
            project: options.project,
        };
        return (0, schematics_1.chain)([
            !isLazyLoadedModuleGen ? addImportToNgModule(options) : (0, schematics_1.noop)(),
            addRouteDeclarationToNgModule(options, routingModulePath),
            (0, schematics_1.mergeWith)(templateSource),
            isLazyLoadedModuleGen ? (0, schematics_1.schematic)('component', componentOptions) : (0, schematics_1.noop)(),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbW9kdWxlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBdUQ7QUFDdkQsMkRBYW9DO0FBRXBDLGtHQUFvRjtBQUNwRixvREFBc0Y7QUFDdEYsOENBQWlEO0FBQ2pELHdEQUtnQztBQUNoQyxzREFBa0Q7QUFDbEQsc0RBQTBEO0FBQzFELG9EQUF5RDtBQUN6RCxxQ0FBaUU7QUFFakUsU0FBUyx1QkFBdUIsQ0FBQyxPQUFzQixFQUFFLFVBQWtCO0lBQ3pFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxnQkFBUyxFQUNoQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUc7UUFDakIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDM0Qsb0JBQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMvQixTQUFTLENBQ1osQ0FBQztJQUVGLE9BQU8sSUFBQSwrQkFBaUIsRUFBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxPQUFzQjtJQUNqRCxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7UUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QyxNQUFN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RUFBRSxPQUFPLENBQUMsSUFBSTtZQUNsQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztTQUN6QixDQUFDO1FBRUYsT0FBTyxJQUFBLGtCQUFLLEVBQUM7WUFDWCxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFO1lBQzlELDZCQUE2QixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztZQUN6RCxJQUFBLHNCQUFTLEVBQUMsY0FBYyxDQUFDO1lBQ3pCLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFBLHNCQUFTLEVBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtTQUMxRSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBeERELDRCQXdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQYXRoLCBub3JtYWxpemUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBSdWxlLFxuICBUcmVlLFxuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGNoYWluLFxuICBmaWx0ZXIsXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgbm9vcCxcbiAgc2NoZW1hdGljLFxuICBzdHJpbmdzLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBDb21wb25lbnRPcHRpb25zIH0gZnJvbSAnLi4vY29tcG9uZW50L3NjaGVtYSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICcuLi90aGlyZF9wYXJ0eS9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2xpYi90eXBlc2NyaXB0JztcbmltcG9ydCB7IGFkZEltcG9ydFRvTW9kdWxlLCBhZGRSb3V0ZURlY2xhcmF0aW9uVG9Nb2R1bGUgfSBmcm9tICcuLi91dGlsaXR5L2FzdC11dGlscyc7XG5pbXBvcnQgeyBJbnNlcnRDaGFuZ2UgfSBmcm9tICcuLi91dGlsaXR5L2NoYW5nZSc7XG5pbXBvcnQge1xuICBNT0RVTEVfRVhULFxuICBST1VUSU5HX01PRFVMRV9FWFQsXG4gIGJ1aWxkUmVsYXRpdmVQYXRoLFxuICBmaW5kTW9kdWxlRnJvbU9wdGlvbnMsXG59IGZyb20gJy4uL3V0aWxpdHkvZmluZC1tb2R1bGUnO1xuaW1wb3J0IHsgcGFyc2VOYW1lIH0gZnJvbSAnLi4vdXRpbGl0eS9wYXJzZS1uYW1lJztcbmltcG9ydCB7IHZhbGlkYXRlQ2xhc3NOYW1lIH0gZnJvbSAnLi4vdXRpbGl0eS92YWxpZGF0aW9uJztcbmltcG9ydCB7IGNyZWF0ZURlZmF1bHRQYXRoIH0gZnJvbSAnLi4vdXRpbGl0eS93b3Jrc3BhY2UnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIE1vZHVsZU9wdGlvbnMsIFJvdXRpbmdTY29wZSB9IGZyb20gJy4vc2NoZW1hJztcblxuZnVuY3Rpb24gYnVpbGRSZWxhdGl2ZU1vZHVsZVBhdGgob3B0aW9uczogTW9kdWxlT3B0aW9ucywgbW9kdWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaW1wb3J0TW9kdWxlUGF0aCA9IG5vcm1hbGl6ZShcbiAgICBgLyR7b3B0aW9ucy5wYXRofS9gICtcbiAgICAgIChvcHRpb25zLmZsYXQgPyAnJyA6IHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSkgKyAnLycpICtcbiAgICAgIHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSkgK1xuICAgICAgJy5tb2R1bGUnLFxuICApO1xuXG4gIHJldHVybiBidWlsZFJlbGF0aXZlUGF0aChtb2R1bGVQYXRoLCBpbXBvcnRNb2R1bGVQYXRoKTtcbn1cblxuZnVuY3Rpb24gYWRkSW1wb3J0VG9OZ01vZHVsZShvcHRpb25zOiBNb2R1bGVPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGlmICghb3B0aW9ucy5tb2R1bGUpIHtcbiAgICAgIHJldHVybiBob3N0O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZVBhdGggPSBvcHRpb25zLm1vZHVsZTtcblxuICAgIGNvbnN0IHNvdXJjZVRleHQgPSBob3N0LnJlYWRUZXh0KG1vZHVsZVBhdGgpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgc291cmNlVGV4dCwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG5cbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBidWlsZFJlbGF0aXZlTW9kdWxlUGF0aChvcHRpb25zLCBtb2R1bGVQYXRoKTtcbiAgICBjb25zdCBjaGFuZ2VzID0gYWRkSW1wb3J0VG9Nb2R1bGUoXG4gICAgICBzb3VyY2UsXG4gICAgICBtb2R1bGVQYXRoLFxuICAgICAgc3RyaW5ncy5jbGFzc2lmeShgJHtvcHRpb25zLm5hbWV9TW9kdWxlYCksXG4gICAgICByZWxhdGl2ZVBhdGgsXG4gICAgKTtcblxuICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICBmb3IgKGNvbnN0IGNoYW5nZSBvZiBjaGFuZ2VzKSB7XG4gICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgSW5zZXJ0Q2hhbmdlKSB7XG4gICAgICAgIHJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaG9zdC5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGFkZFJvdXRlRGVjbGFyYXRpb25Ub05nTW9kdWxlKFxuICBvcHRpb25zOiBNb2R1bGVPcHRpb25zLFxuICByb3V0aW5nTW9kdWxlUGF0aDogUGF0aCB8IHVuZGVmaW5lZCxcbik6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBpZiAoIW9wdGlvbnMucm91dGUpIHtcbiAgICAgIHJldHVybiBob3N0O1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMubW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBvcHRpb24gcmVxdWlyZWQgd2hlbiBjcmVhdGluZyBhIGxhenkgbG9hZGVkIHJvdXRpbmcgbW9kdWxlLicpO1xuICAgIH1cblxuICAgIGxldCBwYXRoOiBzdHJpbmc7XG4gICAgaWYgKHJvdXRpbmdNb2R1bGVQYXRoKSB7XG4gICAgICBwYXRoID0gcm91dGluZ01vZHVsZVBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGggPSBvcHRpb25zLm1vZHVsZTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VUZXh0ID0gaG9zdC5yZWFkVGV4dChwYXRoKTtcblxuICAgIGNvbnN0IGFkZERlY2xhcmF0aW9uID0gYWRkUm91dGVEZWNsYXJhdGlvblRvTW9kdWxlKFxuICAgICAgdHMuY3JlYXRlU291cmNlRmlsZShwYXRoLCBzb3VyY2VUZXh0LCB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LCB0cnVlKSxcbiAgICAgIHBhdGgsXG4gICAgICBidWlsZFJvdXRlKG9wdGlvbnMsIG9wdGlvbnMubW9kdWxlKSxcbiAgICApIGFzIEluc2VydENoYW5nZTtcblxuICAgIGNvbnN0IHJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShwYXRoKTtcbiAgICByZWNvcmRlci5pbnNlcnRMZWZ0KGFkZERlY2xhcmF0aW9uLnBvcywgYWRkRGVjbGFyYXRpb24udG9BZGQpO1xuICAgIGhvc3QuY29tbWl0VXBkYXRlKHJlY29yZGVyKTtcblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRSb3V0aW5nTW9kdWxlUGF0aChob3N0OiBUcmVlLCBtb2R1bGVQYXRoOiBzdHJpbmcpOiBQYXRoIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgcm91dGluZ01vZHVsZVBhdGggPSBtb2R1bGVQYXRoLmVuZHNXaXRoKFJPVVRJTkdfTU9EVUxFX0VYVClcbiAgICA/IG1vZHVsZVBhdGhcbiAgICA6IG1vZHVsZVBhdGgucmVwbGFjZShNT0RVTEVfRVhULCBST1VUSU5HX01PRFVMRV9FWFQpO1xuXG4gIHJldHVybiBob3N0LmV4aXN0cyhyb3V0aW5nTW9kdWxlUGF0aCkgPyBub3JtYWxpemUocm91dGluZ01vZHVsZVBhdGgpIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBidWlsZFJvdXRlKG9wdGlvbnM6IE1vZHVsZU9wdGlvbnMsIG1vZHVsZVBhdGg6IHN0cmluZykge1xuICBjb25zdCByZWxhdGl2ZU1vZHVsZVBhdGggPSBidWlsZFJlbGF0aXZlTW9kdWxlUGF0aChvcHRpb25zLCBtb2R1bGVQYXRoKTtcbiAgY29uc3QgbW9kdWxlTmFtZSA9IGAke3N0cmluZ3MuY2xhc3NpZnkob3B0aW9ucy5uYW1lKX1Nb2R1bGVgO1xuICBjb25zdCBsb2FkQ2hpbGRyZW4gPSBgKCkgPT4gaW1wb3J0KCcke3JlbGF0aXZlTW9kdWxlUGF0aH0nKS50aGVuKG0gPT4gbS4ke21vZHVsZU5hbWV9KWA7XG5cbiAgcmV0dXJuIGB7IHBhdGg6ICcke29wdGlvbnMucm91dGV9JywgbG9hZENoaWxkcmVuOiAke2xvYWRDaGlsZHJlbn0gfWA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBNb2R1bGVPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGlmIChvcHRpb25zLnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgb3B0aW9ucy5wYXRoID0gYXdhaXQgY3JlYXRlRGVmYXVsdFBhdGgoaG9zdCwgb3B0aW9ucy5wcm9qZWN0IGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMubW9kdWxlKSB7XG4gICAgICBvcHRpb25zLm1vZHVsZSA9IGZpbmRNb2R1bGVGcm9tT3B0aW9ucyhob3N0LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBsZXQgcm91dGluZ01vZHVsZVBhdGg6IFBhdGggfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgaXNMYXp5TG9hZGVkTW9kdWxlR2VuID0gISEob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLm1vZHVsZSk7XG4gICAgaWYgKGlzTGF6eUxvYWRlZE1vZHVsZUdlbikge1xuICAgICAgb3B0aW9ucy5yb3V0aW5nU2NvcGUgPSBSb3V0aW5nU2NvcGUuQ2hpbGQ7XG4gICAgICByb3V0aW5nTW9kdWxlUGF0aCA9IGdldFJvdXRpbmdNb2R1bGVQYXRoKGhvc3QsIG9wdGlvbnMubW9kdWxlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlTmFtZShvcHRpb25zLnBhdGgsIG9wdGlvbnMubmFtZSk7XG4gICAgb3B0aW9ucy5uYW1lID0gcGFyc2VkUGF0aC5uYW1lO1xuICAgIG9wdGlvbnMucGF0aCA9IHBhcnNlZFBhdGgucGF0aDtcbiAgICB2YWxpZGF0ZUNsYXNzTmFtZShzdHJpbmdzLmNsYXNzaWZ5KG9wdGlvbnMubmFtZSkpO1xuXG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMnKSwgW1xuICAgICAgb3B0aW9ucy5yb3V0aW5nIHx8IChpc0xhenlMb2FkZWRNb2R1bGVHZW4gJiYgcm91dGluZ01vZHVsZVBhdGgpXG4gICAgICAgID8gbm9vcCgpXG4gICAgICAgIDogZmlsdGVyKChwYXRoKSA9PiAhcGF0aC5lbmRzV2l0aCgnLXJvdXRpbmcubW9kdWxlLnRzLnRlbXBsYXRlJykpLFxuICAgICAgYXBwbHlUZW1wbGF0ZXMoe1xuICAgICAgICAuLi5zdHJpbmdzLFxuICAgICAgICAnaWYtZmxhdCc6IChzOiBzdHJpbmcpID0+IChvcHRpb25zLmZsYXQgPyAnJyA6IHMpLFxuICAgICAgICBsYXp5Um91dGU6IGlzTGF6eUxvYWRlZE1vZHVsZUdlbixcbiAgICAgICAgbGF6eVJvdXRlV2l0aG91dFJvdXRlTW9kdWxlOiBpc0xhenlMb2FkZWRNb2R1bGVHZW4gJiYgIXJvdXRpbmdNb2R1bGVQYXRoLFxuICAgICAgICBsYXp5Um91dGVXaXRoUm91dGVNb2R1bGU6IGlzTGF6eUxvYWRlZE1vZHVsZUdlbiAmJiAhIXJvdXRpbmdNb2R1bGVQYXRoLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgfSksXG4gICAgICBtb3ZlKHBhcnNlZFBhdGgucGF0aCksXG4gICAgXSk7XG4gICAgY29uc3QgbW9kdWxlRGFzaGVyaXplZCA9IHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSk7XG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IGAke1xuICAgICAgIW9wdGlvbnMuZmxhdCA/IG1vZHVsZURhc2hlcml6ZWQgKyAnLycgOiAnJ1xuICAgIH0ke21vZHVsZURhc2hlcml6ZWR9Lm1vZHVsZS50c2A7XG5cbiAgICBjb25zdCBjb21wb25lbnRPcHRpb25zOiBDb21wb25lbnRPcHRpb25zID0ge1xuICAgICAgbW9kdWxlOiBtb2R1bGVQYXRoLFxuICAgICAgZmxhdDogb3B0aW9ucy5mbGF0LFxuICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgcHJvamVjdDogb3B0aW9ucy5wcm9qZWN0LFxuICAgIH07XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgIWlzTGF6eUxvYWRlZE1vZHVsZUdlbiA/IGFkZEltcG9ydFRvTmdNb2R1bGUob3B0aW9ucykgOiBub29wKCksXG4gICAgICBhZGRSb3V0ZURlY2xhcmF0aW9uVG9OZ01vZHVsZShvcHRpb25zLCByb3V0aW5nTW9kdWxlUGF0aCksXG4gICAgICBtZXJnZVdpdGgodGVtcGxhdGVTb3VyY2UpLFxuICAgICAgaXNMYXp5TG9hZGVkTW9kdWxlR2VuID8gc2NoZW1hdGljKCdjb21wb25lbnQnLCBjb21wb25lbnRPcHRpb25zKSA6IG5vb3AoKSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==