"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardFormats = exports.pathFormat = exports.htmlSelectorFormat = void 0;
const html_selector_1 = require("./html-selector");
const path_1 = require("./path");
var html_selector_2 = require("./html-selector");
Object.defineProperty(exports, "htmlSelectorFormat", { enumerable: true, get: function () { return html_selector_2.htmlSelectorFormat; } });
var path_2 = require("./path");
Object.defineProperty(exports, "pathFormat", { enumerable: true, get: function () { return path_2.pathFormat; } });
exports.standardFormats = [html_selector_1.htmlSelectorFormat, path_1.pathFormat];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9mb3JtYXRzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILG1EQUFxRDtBQUNyRCxpQ0FBb0M7QUFFcEMsaURBQXFEO0FBQTVDLG1IQUFBLGtCQUFrQixPQUFBO0FBQzNCLCtCQUFvQztBQUEzQixrR0FBQSxVQUFVLE9BQUE7QUFFTixRQUFBLGVBQWUsR0FBMEIsQ0FBQyxrQ0FBa0IsRUFBRSxpQkFBVSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgc2NoZW1hIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgaHRtbFNlbGVjdG9yRm9ybWF0IH0gZnJvbSAnLi9odG1sLXNlbGVjdG9yJztcbmltcG9ydCB7IHBhdGhGb3JtYXQgfSBmcm9tICcuL3BhdGgnO1xuXG5leHBvcnQgeyBodG1sU2VsZWN0b3JGb3JtYXQgfSBmcm9tICcuL2h0bWwtc2VsZWN0b3InO1xuZXhwb3J0IHsgcGF0aEZvcm1hdCB9IGZyb20gJy4vcGF0aCc7XG5cbmV4cG9ydCBjb25zdCBzdGFuZGFyZEZvcm1hdHM6IHNjaGVtYS5TY2hlbWFGb3JtYXRbXSA9IFtodG1sU2VsZWN0b3JGb3JtYXQsIHBhdGhGb3JtYXRdO1xuIl19