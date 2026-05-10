"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeModuleJobRegistry = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
class NodeModuleJobRegistry {
    _resolve(name) {
        try {
            return require.resolve(name);
        }
        catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                return null;
            }
            throw e;
        }
    }
    /**
     * Get a job description for a named job.
     *
     * @param name The name of the job.
     * @returns A description, or null if the job is not registered.
     */
    get(name) {
        const [moduleName, exportName] = name.split(/#/, 2);
        const resolvedPath = this._resolve(moduleName);
        if (!resolvedPath) {
            return (0, rxjs_1.of)(null);
        }
        const pkg = require(resolvedPath);
        const handler = pkg[exportName || 'default'];
        if (!handler) {
            return (0, rxjs_1.of)(null);
        }
        function _getValue(...fields) {
            return fields.find((x) => core_1.schema.isJsonSchema(x)) || true;
        }
        const argument = _getValue(pkg.argument, handler.argument);
        const input = _getValue(pkg.input, handler.input);
        const output = _getValue(pkg.output, handler.output);
        const channels = _getValue(pkg.channels, handler.channels);
        return (0, rxjs_1.of)(Object.assign(handler.bind(undefined), {
            jobDescription: {
                argument,
                input,
                output,
                channels,
            },
        }));
    }
}
exports.NodeModuleJobRegistry = NodeModuleJobRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiam9iLXJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYXJjaGl0ZWN0L25vZGUvam9icy9qb2ItcmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsK0NBQXlEO0FBQ3pELCtCQUFzQztBQUV0QyxNQUFhLHFCQUFxQjtJQU10QixRQUFRLENBQUMsSUFBWTtRQUM3QixJQUFJO1lBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzlCO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFLLENBQTJCLENBQUMsSUFBSSxLQUFLLGtCQUFrQixFQUFFO2dCQUM1RCxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsTUFBTSxDQUFDLENBQUM7U0FDVDtJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEdBQUcsQ0FDRCxJQUFrQjtRQUVsQixNQUFNLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXBELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixPQUFPLElBQUEsU0FBRSxFQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pCO1FBRUQsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE9BQU8sSUFBQSxTQUFFLEVBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7UUFFRCxTQUFTLFNBQVMsQ0FBQyxHQUFHLE1BQWlCO1lBQ3JDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUM1RCxDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTNELE9BQU8sSUFBQSxTQUFFLEVBQ1AsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3JDLGNBQWMsRUFBRTtnQkFDZCxRQUFRO2dCQUNSLEtBQUs7Z0JBQ0wsTUFBTTtnQkFDTixRQUFRO2FBQ1Q7U0FDRixDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTNERCxzREEyREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgam9icyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgSnNvblZhbHVlLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiB9IGZyb20gJ3J4anMnO1xuXG5leHBvcnQgY2xhc3MgTm9kZU1vZHVsZUpvYlJlZ2lzdHJ5PFxuICBNaW5pbXVtQXJndW1lbnRWYWx1ZVQgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gIE1pbmltdW1JbnB1dFZhbHVlVCBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbiAgTWluaW11bU91dHB1dFZhbHVlVCBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbj4gaW1wbGVtZW50cyBqb2JzLlJlZ2lzdHJ5PE1pbmltdW1Bcmd1bWVudFZhbHVlVCwgTWluaW11bUlucHV0VmFsdWVULCBNaW5pbXVtT3V0cHV0VmFsdWVUPlxue1xuICBwcm90ZWN0ZWQgX3Jlc29sdmUobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUobmFtZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKChlIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgam9iIGRlc2NyaXB0aW9uIGZvciBhIG5hbWVkIGpvYi5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGpvYi5cbiAgICogQHJldHVybnMgQSBkZXNjcmlwdGlvbiwgb3IgbnVsbCBpZiB0aGUgam9iIGlzIG5vdCByZWdpc3RlcmVkLlxuICAgKi9cbiAgZ2V0PEEgZXh0ZW5kcyBNaW5pbXVtQXJndW1lbnRWYWx1ZVQsIEkgZXh0ZW5kcyBNaW5pbXVtSW5wdXRWYWx1ZVQsIE8gZXh0ZW5kcyBNaW5pbXVtT3V0cHV0VmFsdWVUPihcbiAgICBuYW1lOiBqb2JzLkpvYk5hbWUsXG4gICk6IE9ic2VydmFibGU8am9icy5Kb2JIYW5kbGVyPEEsIEksIE8+IHwgbnVsbD4ge1xuICAgIGNvbnN0IFttb2R1bGVOYW1lLCBleHBvcnROYW1lXSA9IG5hbWUuc3BsaXQoLyMvLCAyKTtcblxuICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuX3Jlc29sdmUobW9kdWxlTmFtZSk7XG4gICAgaWYgKCFyZXNvbHZlZFBhdGgpIHtcbiAgICAgIHJldHVybiBvZihudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBwa2cgPSByZXF1aXJlKHJlc29sdmVkUGF0aCk7XG4gICAgY29uc3QgaGFuZGxlciA9IHBrZ1tleHBvcnROYW1lIHx8ICdkZWZhdWx0J107XG4gICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gb2YobnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2dldFZhbHVlKC4uLmZpZWxkczogdW5rbm93bltdKSB7XG4gICAgICByZXR1cm4gZmllbGRzLmZpbmQoKHgpID0+IHNjaGVtYS5pc0pzb25TY2hlbWEoeCkpIHx8IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgYXJndW1lbnQgPSBfZ2V0VmFsdWUocGtnLmFyZ3VtZW50LCBoYW5kbGVyLmFyZ3VtZW50KTtcbiAgICBjb25zdCBpbnB1dCA9IF9nZXRWYWx1ZShwa2cuaW5wdXQsIGhhbmRsZXIuaW5wdXQpO1xuICAgIGNvbnN0IG91dHB1dCA9IF9nZXRWYWx1ZShwa2cub3V0cHV0LCBoYW5kbGVyLm91dHB1dCk7XG4gICAgY29uc3QgY2hhbm5lbHMgPSBfZ2V0VmFsdWUocGtnLmNoYW5uZWxzLCBoYW5kbGVyLmNoYW5uZWxzKTtcblxuICAgIHJldHVybiBvZihcbiAgICAgIE9iamVjdC5hc3NpZ24oaGFuZGxlci5iaW5kKHVuZGVmaW5lZCksIHtcbiAgICAgICAgam9iRGVzY3JpcHRpb246IHtcbiAgICAgICAgICBhcmd1bWVudCxcbiAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgY2hhbm5lbHMsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApO1xuICB9XG59XG4iXX0=