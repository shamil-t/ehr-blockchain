"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTTY = void 0;
function _isTruthy(value) {
    // Returns true if value is a string that is anything but 0 or false.
    return value !== undefined && value !== '0' && value.toUpperCase() !== 'FALSE';
}
function isTTY() {
    // If we force TTY, we always return true.
    const force = process.env['NG_FORCE_TTY'];
    if (force !== undefined) {
        return _isTruthy(force);
    }
    return !!process.stdout.isTTY && !_isTruthy(process.env['CI']);
}
exports.isTTY = isTTY;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy90dHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsU0FBUyxTQUFTLENBQUMsS0FBeUI7SUFDMUMscUVBQXFFO0lBQ3JFLE9BQU8sS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLENBQUM7QUFDakYsQ0FBQztBQUVELFNBQWdCLEtBQUs7SUFDbkIsMENBQTBDO0lBQzFDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDMUMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3pCO0lBRUQsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7QUFSRCxzQkFRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5mdW5jdGlvbiBfaXNUcnV0aHkodmFsdWU6IHVuZGVmaW5lZCB8IHN0cmluZyk6IGJvb2xlYW4ge1xuICAvLyBSZXR1cm5zIHRydWUgaWYgdmFsdWUgaXMgYSBzdHJpbmcgdGhhdCBpcyBhbnl0aGluZyBidXQgMCBvciBmYWxzZS5cbiAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09ICcwJyAmJiB2YWx1ZS50b1VwcGVyQ2FzZSgpICE9PSAnRkFMU0UnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUVFkoKTogYm9vbGVhbiB7XG4gIC8vIElmIHdlIGZvcmNlIFRUWSwgd2UgYWx3YXlzIHJldHVybiB0cnVlLlxuICBjb25zdCBmb3JjZSA9IHByb2Nlc3MuZW52WydOR19GT1JDRV9UVFknXTtcbiAgaWYgKGZvcmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gX2lzVHJ1dGh5KGZvcmNlKTtcbiAgfVxuXG4gIHJldHVybiAhIXByb2Nlc3Muc3Rkb3V0LmlzVFRZICYmICFfaXNUcnV0aHkocHJvY2Vzcy5lbnZbJ0NJJ10pO1xufVxuIl19