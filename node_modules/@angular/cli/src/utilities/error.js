"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIsError = void 0;
const assert_1 = __importDefault(require("assert"));
function assertIsError(value) {
    const isError = value instanceof Error ||
        // The following is needing to identify errors coming from RxJs.
        (typeof value === 'object' && value && 'name' in value && 'message' in value);
    (0, assert_1.default)(isError, 'catch clause variable is not an Error instance');
}
exports.assertIsError = assertIsError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvdXRpbGl0aWVzL2Vycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILG9EQUE0QjtBQUU1QixTQUFnQixhQUFhLENBQUMsS0FBYztJQUMxQyxNQUFNLE9BQU8sR0FDWCxLQUFLLFlBQVksS0FBSztRQUN0QixnRUFBZ0U7UUFDaEUsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLE1BQU0sSUFBSSxLQUFLLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQyxDQUFDO0lBQ2hGLElBQUEsZ0JBQU0sRUFBQyxPQUFPLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztBQUNwRSxDQUFDO0FBTkQsc0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SXNFcnJvcih2YWx1ZTogdW5rbm93bik6IGFzc2VydHMgdmFsdWUgaXMgRXJyb3IgJiB7IGNvZGU/OiBzdHJpbmcgfSB7XG4gIGNvbnN0IGlzRXJyb3IgPVxuICAgIHZhbHVlIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICAvLyBUaGUgZm9sbG93aW5nIGlzIG5lZWRpbmcgdG8gaWRlbnRpZnkgZXJyb3JzIGNvbWluZyBmcm9tIFJ4SnMuXG4gICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgJ25hbWUnIGluIHZhbHVlICYmICdtZXNzYWdlJyBpbiB2YWx1ZSk7XG4gIGFzc2VydChpc0Vycm9yLCAnY2F0Y2ggY2xhdXNlIHZhcmlhYmxlIGlzIG5vdCBhbiBFcnJvciBpbnN0YW5jZScpO1xufVxuIl19