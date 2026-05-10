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
exports.validateOptionsWithSchema = exports.NodeModulesTestEngineHost = exports.NodePackageDoesNotSupportSchematics = exports.NodeModulesEngineHost = exports.FileSystemEngineHost = void 0;
__exportStar(require("./description"), exports);
__exportStar(require("./export-ref"), exports);
__exportStar(require("./file-system-engine-host-base"), exports);
__exportStar(require("./workflow/node-workflow"), exports);
var file_system_engine_host_1 = require("./file-system-engine-host");
Object.defineProperty(exports, "FileSystemEngineHost", { enumerable: true, get: function () { return file_system_engine_host_1.FileSystemEngineHost; } });
var node_module_engine_host_1 = require("./node-module-engine-host");
Object.defineProperty(exports, "NodeModulesEngineHost", { enumerable: true, get: function () { return node_module_engine_host_1.NodeModulesEngineHost; } });
Object.defineProperty(exports, "NodePackageDoesNotSupportSchematics", { enumerable: true, get: function () { return node_module_engine_host_1.NodePackageDoesNotSupportSchematics; } });
var node_modules_test_engine_host_1 = require("./node-modules-test-engine-host");
Object.defineProperty(exports, "NodeModulesTestEngineHost", { enumerable: true, get: function () { return node_modules_test_engine_host_1.NodeModulesTestEngineHost; } });
var schema_option_transform_1 = require("./schema-option-transform");
Object.defineProperty(exports, "validateOptionsWithSchema", { enumerable: true, get: function () { return schema_option_transform_1.validateOptionsWithSchema; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsZ0RBQThCO0FBQzlCLCtDQUE2QjtBQUM3QixpRUFBK0M7QUFFL0MsMkRBQXlDO0FBRXpDLHFFQUFpRTtBQUF4RCwrSEFBQSxvQkFBb0IsT0FBQTtBQUM3QixxRUFHbUM7QUFGakMsZ0lBQUEscUJBQXFCLE9BQUE7QUFDckIsOElBQUEsbUNBQW1DLE9BQUE7QUFFckMsaUZBQTRFO0FBQW5FLDBJQUFBLHlCQUF5QixPQUFBO0FBRWxDLHFFQUFzRTtBQUE3RCxvSUFBQSx5QkFBeUIsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgKiBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmV4cG9ydCAqIGZyb20gJy4vZXhwb3J0LXJlZic7XG5leHBvcnQgKiBmcm9tICcuL2ZpbGUtc3lzdGVtLWVuZ2luZS1ob3N0LWJhc2UnO1xuXG5leHBvcnQgKiBmcm9tICcuL3dvcmtmbG93L25vZGUtd29ya2Zsb3cnO1xuXG5leHBvcnQgeyBGaWxlU3lzdGVtRW5naW5lSG9zdCB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tZW5naW5lLWhvc3QnO1xuZXhwb3J0IHtcbiAgTm9kZU1vZHVsZXNFbmdpbmVIb3N0LFxuICBOb2RlUGFja2FnZURvZXNOb3RTdXBwb3J0U2NoZW1hdGljcyxcbn0gZnJvbSAnLi9ub2RlLW1vZHVsZS1lbmdpbmUtaG9zdCc7XG5leHBvcnQgeyBOb2RlTW9kdWxlc1Rlc3RFbmdpbmVIb3N0IH0gZnJvbSAnLi9ub2RlLW1vZHVsZXMtdGVzdC1lbmdpbmUtaG9zdCc7XG5cbmV4cG9ydCB7IHZhbGlkYXRlT3B0aW9uc1dpdGhTY2hlbWEgfSBmcm9tICcuL3NjaGVtYS1vcHRpb24tdHJhbnNmb3JtJztcbiJdfQ==