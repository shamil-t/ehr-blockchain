"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathFormat = void 0;
const core_1 = require("@angular-devkit/core");
exports.pathFormat = {
    name: 'path',
    formatter: {
        async: false,
        validate: (path) => {
            // Check path is normalized already.
            return path === (0, core_1.normalize)(path);
            // TODO: check if path is valid (is that just checking if it's normalized?)
            // TODO: check path is from root of schematics even if passed absolute
            // TODO: error out if path is outside of host
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL2Zvcm1hdHMvcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBeUQ7QUFFNUMsUUFBQSxVQUFVLEdBQXdCO0lBQzdDLElBQUksRUFBRSxNQUFNO0lBQ1osU0FBUyxFQUFFO1FBQ1QsS0FBSyxFQUFFLEtBQUs7UUFDWixRQUFRLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUN6QixvQ0FBb0M7WUFDcEMsT0FBTyxJQUFJLEtBQUssSUFBQSxnQkFBUyxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLDJFQUEyRTtZQUMzRSxzRUFBc0U7WUFDdEUsNkNBQTZDO1FBQy9DLENBQUM7S0FDRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbm9ybWFsaXplLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5cbmV4cG9ydCBjb25zdCBwYXRoRm9ybWF0OiBzY2hlbWEuU2NoZW1hRm9ybWF0ID0ge1xuICBuYW1lOiAncGF0aCcsXG4gIGZvcm1hdHRlcjoge1xuICAgIGFzeW5jOiBmYWxzZSxcbiAgICB2YWxpZGF0ZTogKHBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgLy8gQ2hlY2sgcGF0aCBpcyBub3JtYWxpemVkIGFscmVhZHkuXG4gICAgICByZXR1cm4gcGF0aCA9PT0gbm9ybWFsaXplKHBhdGgpO1xuICAgICAgLy8gVE9ETzogY2hlY2sgaWYgcGF0aCBpcyB2YWxpZCAoaXMgdGhhdCBqdXN0IGNoZWNraW5nIGlmIGl0J3Mgbm9ybWFsaXplZD8pXG4gICAgICAvLyBUT0RPOiBjaGVjayBwYXRoIGlzIGZyb20gcm9vdCBvZiBzY2hlbWF0aWNzIGV2ZW4gaWYgcGFzc2VkIGFic29sdXRlXG4gICAgICAvLyBUT0RPOiBlcnJvciBvdXQgaWYgcGF0aCBpcyBvdXRzaWRlIG9mIGhvc3RcbiAgICB9LFxuICB9LFxufTtcbiJdfQ==