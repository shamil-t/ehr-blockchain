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
exports.addDependency = exports.InstallBehavior = exports.ExistingBehavior = exports.DependencyType = exports.AngularBuilder = exports.writeWorkspace = exports.updateWorkspace = exports.readWorkspace = void 0;
// Workspace related rules and types
var workspace_1 = require("./workspace");
Object.defineProperty(exports, "readWorkspace", { enumerable: true, get: function () { return workspace_1.getWorkspace; } });
Object.defineProperty(exports, "updateWorkspace", { enumerable: true, get: function () { return workspace_1.updateWorkspace; } });
Object.defineProperty(exports, "writeWorkspace", { enumerable: true, get: function () { return workspace_1.writeWorkspace; } });
var workspace_models_1 = require("./workspace-models");
Object.defineProperty(exports, "AngularBuilder", { enumerable: true, get: function () { return workspace_models_1.Builders; } });
__exportStar(require("./standalone"), exports);
// Package dependency related rules and types
var dependency_1 = require("./dependency");
Object.defineProperty(exports, "DependencyType", { enumerable: true, get: function () { return dependency_1.DependencyType; } });
Object.defineProperty(exports, "ExistingBehavior", { enumerable: true, get: function () { return dependency_1.ExistingBehavior; } });
Object.defineProperty(exports, "InstallBehavior", { enumerable: true, get: function () { return dependency_1.InstallBehavior; } });
Object.defineProperty(exports, "addDependency", { enumerable: true, get: function () { return dependency_1.addDependency; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVILG9DQUFvQztBQUNwQyx5Q0FPcUI7QUFIbkIsMEdBQUEsWUFBWSxPQUFpQjtBQUM3Qiw0R0FBQSxlQUFlLE9BQUE7QUFDZiwyR0FBQSxjQUFjLE9BQUE7QUFFaEIsdURBQWdFO0FBQXZELGtIQUFBLFFBQVEsT0FBa0I7QUFDbkMsK0NBQTZCO0FBRTdCLDZDQUE2QztBQUM3QywyQ0FBZ0c7QUFBdkYsNEdBQUEsY0FBYyxPQUFBO0FBQUUsOEdBQUEsZ0JBQWdCLE9BQUE7QUFBRSw2R0FBQSxlQUFlLE9BQUE7QUFBRSwyR0FBQSxhQUFhLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV29ya3NwYWNlIHJlbGF0ZWQgcnVsZXMgYW5kIHR5cGVzXG5leHBvcnQge1xuICBQcm9qZWN0RGVmaW5pdGlvbixcbiAgVGFyZ2V0RGVmaW5pdGlvbixcbiAgV29ya3NwYWNlRGVmaW5pdGlvbixcbiAgZ2V0V29ya3NwYWNlIGFzIHJlYWRXb3Jrc3BhY2UsXG4gIHVwZGF0ZVdvcmtzcGFjZSxcbiAgd3JpdGVXb3Jrc3BhY2UsXG59IGZyb20gJy4vd29ya3NwYWNlJztcbmV4cG9ydCB7IEJ1aWxkZXJzIGFzIEFuZ3VsYXJCdWlsZGVyIH0gZnJvbSAnLi93b3Jrc3BhY2UtbW9kZWxzJztcbmV4cG9ydCAqIGZyb20gJy4vc3RhbmRhbG9uZSc7XG5cbi8vIFBhY2thZ2UgZGVwZW5kZW5jeSByZWxhdGVkIHJ1bGVzIGFuZCB0eXBlc1xuZXhwb3J0IHsgRGVwZW5kZW5jeVR5cGUsIEV4aXN0aW5nQmVoYXZpb3IsIEluc3RhbGxCZWhhdmlvciwgYWRkRGVwZW5kZW5jeSB9IGZyb20gJy4vZGVwZW5kZW5jeSc7XG4iXX0=