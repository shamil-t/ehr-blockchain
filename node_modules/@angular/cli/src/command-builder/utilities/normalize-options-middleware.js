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
exports.normalizeOptionsMiddleware = void 0;
const yargs = __importStar(require("yargs"));
/**
 * A Yargs middleware that normalizes non Array options when the argument has been provided multiple times.
 *
 * By default, when an option is non array and it is provided multiple times in the command line, yargs
 * will not override it's value but instead it will be changed to an array unless `duplicate-arguments-array` is disabled.
 * But this option also have an effect on real array options which isn't desired.
 *
 * See: https://github.com/yargs/yargs-parser/pull/163#issuecomment-516566614
 */
function normalizeOptionsMiddleware(args) {
    // `getOptions` is not included in the types even though it's public API.
    // https://github.com/yargs/yargs/issues/2098
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { array } = yargs.getOptions();
    const arrayOptions = new Set(array);
    for (const [key, value] of Object.entries(args)) {
        if (key !== '_' && Array.isArray(value) && !arrayOptions.has(key)) {
            const newValue = value.pop();
            // eslint-disable-next-line no-console
            console.warn(`Option '${key}' has been specified multiple times. The value '${newValue}' will be used.`);
            args[key] = newValue;
        }
    }
}
exports.normalizeOptionsMiddleware = normalizeOptionsMiddleware;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLW9wdGlvbnMtbWlkZGxld2FyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy9jb21tYW5kLWJ1aWxkZXIvdXRpbGl0aWVzL25vcm1hbGl6ZS1vcHRpb25zLW1pZGRsZXdhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw2Q0FBK0I7QUFFL0I7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFnQiwwQkFBMEIsQ0FBQyxJQUFxQjtJQUM5RCx5RUFBeUU7SUFDekUsNkNBQTZDO0lBQzdDLDhEQUE4RDtJQUM5RCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUksS0FBYSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzlDLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQy9DLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNqRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDN0Isc0NBQXNDO1lBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQ1YsV0FBVyxHQUFHLG1EQUFtRCxRQUFRLGlCQUFpQixDQUMzRixDQUFDO1lBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQztTQUN0QjtLQUNGO0FBQ0gsQ0FBQztBQWpCRCxnRUFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgeWFyZ3MgZnJvbSAneWFyZ3MnO1xuXG4vKipcbiAqIEEgWWFyZ3MgbWlkZGxld2FyZSB0aGF0IG5vcm1hbGl6ZXMgbm9uIEFycmF5IG9wdGlvbnMgd2hlbiB0aGUgYXJndW1lbnQgaGFzIGJlZW4gcHJvdmlkZWQgbXVsdGlwbGUgdGltZXMuXG4gKlxuICogQnkgZGVmYXVsdCwgd2hlbiBhbiBvcHRpb24gaXMgbm9uIGFycmF5IGFuZCBpdCBpcyBwcm92aWRlZCBtdWx0aXBsZSB0aW1lcyBpbiB0aGUgY29tbWFuZCBsaW5lLCB5YXJnc1xuICogd2lsbCBub3Qgb3ZlcnJpZGUgaXQncyB2YWx1ZSBidXQgaW5zdGVhZCBpdCB3aWxsIGJlIGNoYW5nZWQgdG8gYW4gYXJyYXkgdW5sZXNzIGBkdXBsaWNhdGUtYXJndW1lbnRzLWFycmF5YCBpcyBkaXNhYmxlZC5cbiAqIEJ1dCB0aGlzIG9wdGlvbiBhbHNvIGhhdmUgYW4gZWZmZWN0IG9uIHJlYWwgYXJyYXkgb3B0aW9ucyB3aGljaCBpc24ndCBkZXNpcmVkLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3lhcmdzL3lhcmdzLXBhcnNlci9wdWxsLzE2MyNpc3N1ZWNvbW1lbnQtNTE2NTY2NjE0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcHRpb25zTWlkZGxld2FyZShhcmdzOiB5YXJncy5Bcmd1bWVudHMpOiB2b2lkIHtcbiAgLy8gYGdldE9wdGlvbnNgIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgdHlwZXMgZXZlbiB0aG91Z2ggaXQncyBwdWJsaWMgQVBJLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20veWFyZ3MveWFyZ3MvaXNzdWVzLzIwOThcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgY29uc3QgeyBhcnJheSB9ID0gKHlhcmdzIGFzIGFueSkuZ2V0T3B0aW9ucygpO1xuICBjb25zdCBhcnJheU9wdGlvbnMgPSBuZXcgU2V0KGFycmF5KTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhhcmdzKSkge1xuICAgIGlmIChrZXkgIT09ICdfJyAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAhYXJyYXlPcHRpb25zLmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IHZhbHVlLnBvcCgpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYE9wdGlvbiAnJHtrZXl9JyBoYXMgYmVlbiBzcGVjaWZpZWQgbXVsdGlwbGUgdGltZXMuIFRoZSB2YWx1ZSAnJHtuZXdWYWx1ZX0nIHdpbGwgYmUgdXNlZC5gLFxuICAgICAgKTtcbiAgICAgIGFyZ3Nba2V5XSA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgfVxufVxuIl19