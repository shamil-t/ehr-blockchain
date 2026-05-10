"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeErrorToLogFile = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
let logPath;
/**
 * Writes an Error to a temporary log file.
 * If this method is called multiple times from the same process the same log file will be used.
 * @returns The path of the generated log file.
 */
function writeErrorToLogFile(error) {
    if (!logPath) {
        const tempDirectory = (0, fs_1.mkdtempSync)((0, fs_1.realpathSync)((0, os_1.tmpdir)()) + '/ng-');
        logPath = (0, path_1.normalize)(tempDirectory + '/angular-errors.log');
    }
    (0, fs_1.appendFileSync)(logPath, '[error] ' + (error.stack || error) + '\n\n');
    return logPath;
}
exports.writeErrorToLogFile = writeErrorToLogFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLWZpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvdXRpbGl0aWVzL2xvZy1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDJCQUErRDtBQUMvRCwyQkFBNEI7QUFDNUIsK0JBQWlDO0FBRWpDLElBQUksT0FBMkIsQ0FBQztBQUVoQzs7OztHQUlHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsS0FBWTtJQUM5QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osTUFBTSxhQUFhLEdBQUcsSUFBQSxnQkFBVyxFQUFDLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQU0sR0FBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDbkUsT0FBTyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxhQUFhLEdBQUcscUJBQXFCLENBQUMsQ0FBQztLQUM1RDtJQUVELElBQUEsbUJBQWMsRUFBQyxPQUFPLEVBQUUsVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUV0RSxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBVEQsa0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgYXBwZW5kRmlsZVN5bmMsIG1rZHRlbXBTeW5jLCByZWFscGF0aFN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyB0bXBkaXIgfSBmcm9tICdvcyc7XG5pbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tICdwYXRoJztcblxubGV0IGxvZ1BhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBXcml0ZXMgYW4gRXJyb3IgdG8gYSB0ZW1wb3JhcnkgbG9nIGZpbGUuXG4gKiBJZiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgZnJvbSB0aGUgc2FtZSBwcm9jZXNzIHRoZSBzYW1lIGxvZyBmaWxlIHdpbGwgYmUgdXNlZC5cbiAqIEByZXR1cm5zIFRoZSBwYXRoIG9mIHRoZSBnZW5lcmF0ZWQgbG9nIGZpbGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUVycm9yVG9Mb2dGaWxlKGVycm9yOiBFcnJvcik6IHN0cmluZyB7XG4gIGlmICghbG9nUGF0aCkge1xuICAgIGNvbnN0IHRlbXBEaXJlY3RvcnkgPSBta2R0ZW1wU3luYyhyZWFscGF0aFN5bmModG1wZGlyKCkpICsgJy9uZy0nKTtcbiAgICBsb2dQYXRoID0gbm9ybWFsaXplKHRlbXBEaXJlY3RvcnkgKyAnL2FuZ3VsYXItZXJyb3JzLmxvZycpO1xuICB9XG5cbiAgYXBwZW5kRmlsZVN5bmMobG9nUGF0aCwgJ1tlcnJvcl0gJyArIChlcnJvci5zdGFjayB8fCBlcnJvcikgKyAnXFxuXFxuJyk7XG5cbiAgcmV0dXJuIGxvZ1BhdGg7XG59XG4iXX0=