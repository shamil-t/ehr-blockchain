"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptionsWithSchema = exports.InvalidInputOptions = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class InvalidInputOptions extends core_1.schema.SchemaValidationException {
    constructor(options, errors) {
        super(errors, `Schematic input does not validate against the Schema: ${JSON.stringify(options)}\nErrors:\n`);
    }
}
exports.InvalidInputOptions = InvalidInputOptions;
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options, context) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = (0, core_1.deepCopy)(options);
        const withPrompts = context ? context.interactive : true;
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return (0, rxjs_1.from)(registry.compile(schematic.schemaJson)).pipe((0, operators_1.mergeMap)((validator) => validator(options, { withPrompts })), (0, operators_1.first)(), (0, operators_1.map)((result) => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return (0, rxjs_1.of)(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL3NjaGVtYS1vcHRpb24tdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUF3RDtBQUN4RCwrQkFBNEQ7QUFDNUQsOENBQXNEO0FBR3RELE1BQWEsbUJBQTRCLFNBQVEsYUFBTSxDQUFDLHlCQUF5QjtJQUMvRSxZQUFZLE9BQVUsRUFBRSxNQUFxQztRQUMzRCxLQUFLLENBQ0gsTUFBTSxFQUNOLHlEQUF5RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQzlGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFQRCxrREFPQztBQUVELG1DQUFtQztBQUNuQyxTQUFnQix5QkFBeUIsQ0FBQyxRQUErQjtJQUN2RSxPQUFPLENBQ0wsU0FBeUMsRUFDekMsT0FBVSxFQUNWLE9BQW9DLEVBQ3JCLEVBQUU7UUFDakIsK0VBQStFO1FBQy9FLE9BQU8sR0FBRyxJQUFBLGVBQVEsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUU1QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUV6RCxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtZQUM1QywrQkFBK0I7WUFDL0IsT0FBTyxJQUFBLFdBQUksRUFBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDdEQsSUFBQSxvQkFBUSxFQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUM1RCxJQUFBLGlCQUFLLEdBQUUsRUFDUCxJQUFBLGVBQUcsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUNuQixNQUFNLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7aUJBQzdEO2dCQUVELE9BQU8sT0FBTyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUNILENBQUM7U0FDSDtRQUVELE9BQU8sSUFBQSxTQUFZLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTVCRCw4REE0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgZGVlcENvcHksIHNjaGVtYSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20sIG9mIGFzIG9ic2VydmFibGVPZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlyc3QsIG1hcCwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkSW5wdXRPcHRpb25zPFQgPSB7fT4gZXh0ZW5kcyBzY2hlbWEuU2NoZW1hVmFsaWRhdGlvbkV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFQsIGVycm9yczogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10pIHtcbiAgICBzdXBlcihcbiAgICAgIGVycm9ycyxcbiAgICAgIGBTY2hlbWF0aWMgaW5wdXQgZG9lcyBub3QgdmFsaWRhdGUgYWdhaW5zdCB0aGUgU2NoZW1hOiAke0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfVxcbkVycm9yczpcXG5gLFxuICAgICk7XG4gIH1cbn1cblxuLy8gVGhpcyBjYW4gb25seSBiZSB1c2VkIGluIE5vZGVKUy5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnNXaXRoU2NoZW1hKHJlZ2lzdHJ5OiBzY2hlbWEuU2NoZW1hUmVnaXN0cnkpIHtcbiAgcmV0dXJuIDxUIGV4dGVuZHMge30gfCBudWxsPihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgICBvcHRpb25zOiBULFxuICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTxUPiA9PiB7XG4gICAgLy8gUHJldmVudCBhIHNjaGVtYXRpYyBmcm9tIGNoYW5naW5nIHRoZSBvcHRpb25zIG9iamVjdCBieSBtYWtpbmcgYSBjb3B5IG9mIGl0LlxuICAgIG9wdGlvbnMgPSBkZWVwQ29weShvcHRpb25zKTtcblxuICAgIGNvbnN0IHdpdGhQcm9tcHRzID0gY29udGV4dCA/IGNvbnRleHQuaW50ZXJhY3RpdmUgOiB0cnVlO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiBmcm9tKHJlZ2lzdHJ5LmNvbXBpbGUoc2NoZW1hdGljLnNjaGVtYUpzb24pKS5waXBlKFxuICAgICAgICBtZXJnZU1hcCgodmFsaWRhdG9yKSA9PiB2YWxpZGF0b3Iob3B0aW9ucywgeyB3aXRoUHJvbXB0cyB9KSksXG4gICAgICAgIGZpcnN0KCksXG4gICAgICAgIG1hcCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRJbnB1dE9wdGlvbnMob3B0aW9ucywgcmVzdWx0LmVycm9ycyB8fCBbXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG9wdGlvbnMpO1xuICB9O1xufVxuIl19