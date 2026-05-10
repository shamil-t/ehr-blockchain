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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _AngularCompilation_angularCompilerCliModule;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularCompilation = void 0;
const load_esm_1 = require("../../../../utils/load-esm");
const profiling_1 = require("../../profiling");
class AngularCompilation {
    static async loadCompilerCli() {
        var _b;
        // This uses a wrapped dynamic import to load `@angular/compiler-cli` which is ESM.
        // Once TypeScript provides support for retaining dynamic imports this workaround can be dropped.
        __classPrivateFieldSet(_b = AngularCompilation, _a, __classPrivateFieldGet(_b, _a, "f", _AngularCompilation_angularCompilerCliModule) ?? await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli'), "f", _AngularCompilation_angularCompilerCliModule);
        return __classPrivateFieldGet(AngularCompilation, _a, "f", _AngularCompilation_angularCompilerCliModule);
    }
    async loadConfiguration(tsconfig) {
        const { readConfiguration } = await AngularCompilation.loadCompilerCli();
        return (0, profiling_1.profileSync)('NG_READ_CONFIG', () => readConfiguration(tsconfig, {
            // Angular specific configuration defaults and overrides to ensure a functioning compilation.
            suppressOutputPathCheck: true,
            outDir: undefined,
            sourceMap: false,
            declaration: false,
            declarationMap: false,
            allowEmptyCodegenFiles: false,
            annotationsAs: 'decorators',
            enableResourceInlining: false,
            supportTestBed: false,
            supportJitMode: false,
        }));
    }
}
exports.AngularCompilation = AngularCompilation;
_a = AngularCompilation;
_AngularCompilation_angularCompilerCliModule = { value: void 0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1jb21waWxhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvYW5ndWxhci9jb21waWxhdGlvbi9hbmd1bGFyLWNvbXBpbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7OztBQUlILHlEQUEyRDtBQUMzRCwrQ0FBOEM7QUFTOUMsTUFBc0Isa0JBQWtCO0lBR3RDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZTs7UUFDMUIsbUZBQW1GO1FBQ25GLGlHQUFpRztRQUNqRyx5SUFBaUQsTUFBTSxJQUFBLHdCQUFhLEVBQ2xFLHVCQUF1QixDQUN4QixvREFBQSxDQUFDO1FBRUYsT0FBTyx1QkFBQSxrQkFBa0Isd0RBQTBCLENBQUM7SUFDdEQsQ0FBQztJQUVTLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFnQjtRQUNoRCxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxNQUFNLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXpFLE9BQU8sSUFBQSx1QkFBVyxFQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUN4QyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUU7WUFDMUIsNkZBQTZGO1lBQzdGLHVCQUF1QixFQUFFLElBQUk7WUFDN0IsTUFBTSxFQUFFLFNBQVM7WUFDakIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsY0FBYyxFQUFFLEtBQUs7WUFDckIsc0JBQXNCLEVBQUUsS0FBSztZQUM3QixhQUFhLEVBQUUsWUFBWTtZQUMzQixzQkFBc0IsRUFBRSxLQUFLO1lBQzdCLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLGNBQWMsRUFBRSxLQUFLO1NBQ3RCLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQWVGO0FBOUNELGdEQThDQzs7QUE3Q1EsZ0VBQXlCLENBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgbmcgZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB0eXBlIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgbG9hZEVzbU1vZHVsZSB9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL2xvYWQtZXNtJztcbmltcG9ydCB7IHByb2ZpbGVTeW5jIH0gZnJvbSAnLi4vLi4vcHJvZmlsaW5nJztcbmltcG9ydCB0eXBlIHsgQW5ndWxhckhvc3RPcHRpb25zIH0gZnJvbSAnLi4vYW5ndWxhci1ob3N0JztcblxuZXhwb3J0IGludGVyZmFjZSBFbWl0RmlsZVJlc3VsdCB7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIGNvbnRlbnRzOiBzdHJpbmc7XG4gIGRlcGVuZGVuY2llcz86IHJlYWRvbmx5IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQW5ndWxhckNvbXBpbGF0aW9uIHtcbiAgc3RhdGljICNhbmd1bGFyQ29tcGlsZXJDbGlNb2R1bGU/OiB0eXBlb2Ygbmc7XG5cbiAgc3RhdGljIGFzeW5jIGxvYWRDb21waWxlckNsaSgpOiBQcm9taXNlPHR5cGVvZiBuZz4ge1xuICAgIC8vIFRoaXMgdXNlcyBhIHdyYXBwZWQgZHluYW1pYyBpbXBvcnQgdG8gbG9hZCBgQGFuZ3VsYXIvY29tcGlsZXItY2xpYCB3aGljaCBpcyBFU00uXG4gICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIHJldGFpbmluZyBkeW5hbWljIGltcG9ydHMgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZSBkcm9wcGVkLlxuICAgIEFuZ3VsYXJDb21waWxhdGlvbi4jYW5ndWxhckNvbXBpbGVyQ2xpTW9kdWxlID8/PSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBuZz4oXG4gICAgICAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJyxcbiAgICApO1xuXG4gICAgcmV0dXJuIEFuZ3VsYXJDb21waWxhdGlvbi4jYW5ndWxhckNvbXBpbGVyQ2xpTW9kdWxlO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGxvYWRDb25maWd1cmF0aW9uKHRzY29uZmlnOiBzdHJpbmcpOiBQcm9taXNlPG5nLkNvbXBpbGVyT3B0aW9ucz4ge1xuICAgIGNvbnN0IHsgcmVhZENvbmZpZ3VyYXRpb24gfSA9IGF3YWl0IEFuZ3VsYXJDb21waWxhdGlvbi5sb2FkQ29tcGlsZXJDbGkoKTtcblxuICAgIHJldHVybiBwcm9maWxlU3luYygnTkdfUkVBRF9DT05GSUcnLCAoKSA9PlxuICAgICAgcmVhZENvbmZpZ3VyYXRpb24odHNjb25maWcsIHtcbiAgICAgICAgLy8gQW5ndWxhciBzcGVjaWZpYyBjb25maWd1cmF0aW9uIGRlZmF1bHRzIGFuZCBvdmVycmlkZXMgdG8gZW5zdXJlIGEgZnVuY3Rpb25pbmcgY29tcGlsYXRpb24uXG4gICAgICAgIHN1cHByZXNzT3V0cHV0UGF0aENoZWNrOiB0cnVlLFxuICAgICAgICBvdXREaXI6IHVuZGVmaW5lZCxcbiAgICAgICAgc291cmNlTWFwOiBmYWxzZSxcbiAgICAgICAgZGVjbGFyYXRpb246IGZhbHNlLFxuICAgICAgICBkZWNsYXJhdGlvbk1hcDogZmFsc2UsXG4gICAgICAgIGFsbG93RW1wdHlDb2RlZ2VuRmlsZXM6IGZhbHNlLFxuICAgICAgICBhbm5vdGF0aW9uc0FzOiAnZGVjb3JhdG9ycycsXG4gICAgICAgIGVuYWJsZVJlc291cmNlSW5saW5pbmc6IGZhbHNlLFxuICAgICAgICBzdXBwb3J0VGVzdEJlZDogZmFsc2UsXG4gICAgICAgIHN1cHBvcnRKaXRNb2RlOiBmYWxzZSxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBhYnN0cmFjdCBpbml0aWFsaXplKFxuICAgIHRzY29uZmlnOiBzdHJpbmcsXG4gICAgaG9zdE9wdGlvbnM6IEFuZ3VsYXJIb3N0T3B0aW9ucyxcbiAgICBjb21waWxlck9wdGlvbnNUcmFuc2Zvcm1lcj86IChjb21waWxlck9wdGlvbnM6IG5nLkNvbXBpbGVyT3B0aW9ucykgPT4gbmcuQ29tcGlsZXJPcHRpb25zLFxuICApOiBQcm9taXNlPHtcbiAgICBhZmZlY3RlZEZpbGVzOiBSZWFkb25seVNldDx0cy5Tb3VyY2VGaWxlPjtcbiAgICBjb21waWxlck9wdGlvbnM6IG5nLkNvbXBpbGVyT3B0aW9ucztcbiAgICByZWZlcmVuY2VkRmlsZXM6IHJlYWRvbmx5IHN0cmluZ1tdO1xuICB9PjtcblxuICBhYnN0cmFjdCBjb2xsZWN0RGlhZ25vc3RpY3MoKTogSXRlcmFibGU8dHMuRGlhZ25vc3RpYz47XG5cbiAgYWJzdHJhY3QgZW1pdEFmZmVjdGVkRmlsZXMoKTogSXRlcmFibGU8RW1pdEZpbGVSZXN1bHQ+O1xufVxuIl19