"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSchematicTask = exports.RepositoryInitializerTask = exports.NodePackageLinkTask = exports.NodePackageInstallTask = void 0;
var install_task_1 = require("./package-manager/install-task");
Object.defineProperty(exports, "NodePackageInstallTask", { enumerable: true, get: function () { return install_task_1.NodePackageInstallTask; } });
var link_task_1 = require("./package-manager/link-task");
Object.defineProperty(exports, "NodePackageLinkTask", { enumerable: true, get: function () { return link_task_1.NodePackageLinkTask; } });
var init_task_1 = require("./repo-init/init-task");
Object.defineProperty(exports, "RepositoryInitializerTask", { enumerable: true, get: function () { return init_task_1.RepositoryInitializerTask; } });
var task_1 = require("./run-schematic/task");
Object.defineProperty(exports, "RunSchematicTask", { enumerable: true, get: function () { return task_1.RunSchematicTask; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtEQUF3RTtBQUEvRCxzSEFBQSxzQkFBc0IsT0FBQTtBQUMvQix5REFBa0U7QUFBekQsZ0hBQUEsbUJBQW1CLE9BQUE7QUFDNUIsbURBQWtFO0FBQXpELHNIQUFBLHlCQUF5QixPQUFBO0FBQ2xDLDZDQUF3RDtBQUEvQyx3R0FBQSxnQkFBZ0IsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgeyBOb2RlUGFja2FnZUluc3RhbGxUYXNrIH0gZnJvbSAnLi9wYWNrYWdlLW1hbmFnZXIvaW5zdGFsbC10YXNrJztcbmV4cG9ydCB7IE5vZGVQYWNrYWdlTGlua1Rhc2sgfSBmcm9tICcuL3BhY2thZ2UtbWFuYWdlci9saW5rLXRhc2snO1xuZXhwb3J0IHsgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFzayB9IGZyb20gJy4vcmVwby1pbml0L2luaXQtdGFzayc7XG5leHBvcnQgeyBSdW5TY2hlbWF0aWNUYXNrIH0gZnJvbSAnLi9ydW4tc2NoZW1hdGljL3Rhc2snO1xuIl19