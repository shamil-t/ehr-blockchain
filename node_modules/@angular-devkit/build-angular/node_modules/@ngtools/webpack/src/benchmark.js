"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeEnd = exports.time = void 0;
// Internal benchmark reporting flag.
// Use with CLI --no-progress flag for best results.
// This should be false for commited code.
const _benchmark = false;
/* eslint-disable no-console */
function time(label) {
    if (_benchmark) {
        console.time(label);
    }
}
exports.time = time;
function timeEnd(label) {
    if (_benchmark) {
        console.timeEnd(label);
    }
}
exports.timeEnd = timeEnd;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVuY2htYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9iZW5jaG1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgscUNBQXFDO0FBQ3JDLG9EQUFvRDtBQUNwRCwwQ0FBMEM7QUFDMUMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLCtCQUErQjtBQUMvQixTQUFnQixJQUFJLENBQUMsS0FBYTtJQUNoQyxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDckI7QUFDSCxDQUFDO0FBSkQsb0JBSUM7QUFFRCxTQUFnQixPQUFPLENBQUMsS0FBYTtJQUNuQyxJQUFJLFVBQVUsRUFBRTtRQUNkLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEI7QUFDSCxDQUFDO0FBSkQsMEJBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gSW50ZXJuYWwgYmVuY2htYXJrIHJlcG9ydGluZyBmbGFnLlxuLy8gVXNlIHdpdGggQ0xJIC0tbm8tcHJvZ3Jlc3MgZmxhZyBmb3IgYmVzdCByZXN1bHRzLlxuLy8gVGhpcyBzaG91bGQgYmUgZmFsc2UgZm9yIGNvbW1pdGVkIGNvZGUuXG5jb25zdCBfYmVuY2htYXJrID0gZmFsc2U7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5leHBvcnQgZnVuY3Rpb24gdGltZShsYWJlbDogc3RyaW5nKSB7XG4gIGlmIChfYmVuY2htYXJrKSB7XG4gICAgY29uc29sZS50aW1lKGxhYmVsKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZUVuZChsYWJlbDogc3RyaW5nKSB7XG4gIGlmIChfYmVuY2htYXJrKSB7XG4gICAgY29uc29sZS50aW1lRW5kKGxhYmVsKTtcbiAgfVxufVxuIl19