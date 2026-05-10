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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeWorkspace = exports.readWorkspace = exports.WorkspaceFormat = exports.createWorkspaceHost = void 0;
__exportStar(require("./definitions"), exports);
var host_1 = require("./host");
Object.defineProperty(exports, "createWorkspaceHost", { enumerable: true, get: function () { return host_1.createWorkspaceHost; } });
var core_1 = require("./core");
Object.defineProperty(exports, "WorkspaceFormat", { enumerable: true, get: function () { return core_1.WorkspaceFormat; } });
Object.defineProperty(exports, "readWorkspace", { enumerable: true, get: function () { return core_1.readWorkspace; } });
Object.defineProperty(exports, "writeWorkspace", { enumerable: true, get: function () { return core_1.writeWorkspace; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxnREFBOEI7QUFDOUIsK0JBQTREO0FBQXBDLDJHQUFBLG1CQUFtQixPQUFBO0FBQzNDLCtCQUF3RTtBQUEvRCx1R0FBQSxlQUFlLE9BQUE7QUFBRSxxR0FBQSxhQUFhLE9BQUE7QUFBRSxzR0FBQSxjQUFjLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9kZWZpbml0aW9ucyc7XG5leHBvcnQgeyBXb3Jrc3BhY2VIb3N0LCBjcmVhdGVXb3Jrc3BhY2VIb3N0IH0gZnJvbSAnLi9ob3N0JztcbmV4cG9ydCB7IFdvcmtzcGFjZUZvcm1hdCwgcmVhZFdvcmtzcGFjZSwgd3JpdGVXb3Jrc3BhY2UgfSBmcm9tICcuL2NvcmUnO1xuIl19