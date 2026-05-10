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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebpackSystem = void 0;
const ts = __importStar(require("typescript"));
const paths_1 = require("./paths");
function shouldNotWrite() {
    throw new Error('Webpack TypeScript System should not write.');
}
function createWebpackSystem(input, currentDirectory) {
    // Webpack's CachedInputFileSystem uses the default directory separator in the paths it uses
    // for keys to its cache. If the keys do not match then the file watcher will not purge outdated
    // files and cause stale data to be used in the next rebuild. TypeScript always uses a `/` (POSIX)
    // directory separator internally which is also supported with Windows system APIs. However,
    // if file operations are performed with the non-default directory separator, the Webpack cache
    // will contain a key that will not be purged. `externalizePath` ensures the paths are as expected.
    const system = {
        ...ts.sys,
        readFile(path) {
            let data;
            try {
                data = input.readFileSync((0, paths_1.externalizePath)(path));
            }
            catch {
                return undefined;
            }
            // Strip BOM if present
            let start = 0;
            if (data.length > 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
                start = 3;
            }
            return data.toString('utf8', start);
        },
        getFileSize(path) {
            try {
                return input.statSync((0, paths_1.externalizePath)(path)).size;
            }
            catch {
                return 0;
            }
        },
        fileExists(path) {
            try {
                return input.statSync((0, paths_1.externalizePath)(path)).isFile();
            }
            catch {
                return false;
            }
        },
        directoryExists(path) {
            try {
                return input.statSync((0, paths_1.externalizePath)(path)).isDirectory();
            }
            catch {
                return false;
            }
        },
        getModifiedTime(path) {
            try {
                return input.statSync((0, paths_1.externalizePath)(path)).mtime;
            }
            catch {
                return undefined;
            }
        },
        getCurrentDirectory() {
            return currentDirectory;
        },
        writeFile: shouldNotWrite,
        createDirectory: shouldNotWrite,
        deleteFile: shouldNotWrite,
        setModifiedTime: shouldNotWrite,
    };
    return system;
}
exports.createWebpackSystem = createWebpackSystem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9pdnkvc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQWlDO0FBRWpDLG1DQUEwQztBQVExQyxTQUFTLGNBQWM7SUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7QUFFRCxTQUFnQixtQkFBbUIsQ0FDakMsS0FBMEIsRUFDMUIsZ0JBQXdCO0lBRXhCLDRGQUE0RjtJQUM1RixnR0FBZ0c7SUFDaEcsa0dBQWtHO0lBQ2xHLDRGQUE0RjtJQUM1RiwrRkFBK0Y7SUFDL0YsbUdBQW1HO0lBQ25HLE1BQU0sTUFBTSxHQUFjO1FBQ3hCLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxRQUFRLENBQUMsSUFBWTtZQUNuQixJQUFJLElBQUksQ0FBQztZQUNULElBQUk7Z0JBQ0YsSUFBSSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbEQ7WUFBQyxNQUFNO2dCQUNOLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBRUQsdUJBQXVCO1lBQ3ZCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNkLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQy9FLEtBQUssR0FBRyxDQUFDLENBQUM7YUFDWDtZQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELFdBQVcsQ0FBQyxJQUFZO1lBQ3RCLElBQUk7Z0JBQ0YsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUNuRDtZQUFDLE1BQU07Z0JBQ04sT0FBTyxDQUFDLENBQUM7YUFDVjtRQUNILENBQUM7UUFDRCxVQUFVLENBQUMsSUFBWTtZQUNyQixJQUFJO2dCQUNGLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUN2RDtZQUFDLE1BQU07Z0JBQ04sT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUM7UUFDRCxlQUFlLENBQUMsSUFBWTtZQUMxQixJQUFJO2dCQUNGLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUM1RDtZQUFDLE1BQU07Z0JBQ04sT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUM7UUFDRCxlQUFlLENBQUMsSUFBWTtZQUMxQixJQUFJO2dCQUNGLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7YUFDcEQ7WUFBQyxNQUFNO2dCQUNOLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1FBQ0gsQ0FBQztRQUNELG1CQUFtQjtZQUNqQixPQUFPLGdCQUFnQixDQUFDO1FBQzFCLENBQUM7UUFDRCxTQUFTLEVBQUUsY0FBYztRQUN6QixlQUFlLEVBQUUsY0FBYztRQUMvQixVQUFVLEVBQUUsY0FBYztRQUMxQixlQUFlLEVBQUUsY0FBYztLQUNoQyxDQUFDO0lBRUYsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWxFRCxrREFrRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgZXh0ZXJuYWxpemVQYXRoIH0gZnJvbSAnLi9wYXRocyc7XG5cbmV4cG9ydCB0eXBlIElucHV0RmlsZVN5c3RlbSA9IENvbXBpbGVyWydpbnB1dEZpbGVTeXN0ZW0nXTtcbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXRGaWxlU3lzdGVtU3luYyBleHRlbmRzIElucHV0RmlsZVN5c3RlbSB7XG4gIHJlYWRGaWxlU3luYyhwYXRoOiBzdHJpbmcpOiBCdWZmZXI7XG4gIHN0YXRTeW5jKHBhdGg6IHN0cmluZyk6IHsgc2l6ZTogbnVtYmVyOyBtdGltZTogRGF0ZTsgaXNEaXJlY3RvcnkoKTogYm9vbGVhbjsgaXNGaWxlKCk6IGJvb2xlYW4gfTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkTm90V3JpdGUoKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2sgVHlwZVNjcmlwdCBTeXN0ZW0gc2hvdWxkIG5vdCB3cml0ZS4nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdlYnBhY2tTeXN0ZW0oXG4gIGlucHV0OiBJbnB1dEZpbGVTeXN0ZW1TeW5jLFxuICBjdXJyZW50RGlyZWN0b3J5OiBzdHJpbmcsXG4pOiB0cy5TeXN0ZW0ge1xuICAvLyBXZWJwYWNrJ3MgQ2FjaGVkSW5wdXRGaWxlU3lzdGVtIHVzZXMgdGhlIGRlZmF1bHQgZGlyZWN0b3J5IHNlcGFyYXRvciBpbiB0aGUgcGF0aHMgaXQgdXNlc1xuICAvLyBmb3Iga2V5cyB0byBpdHMgY2FjaGUuIElmIHRoZSBrZXlzIGRvIG5vdCBtYXRjaCB0aGVuIHRoZSBmaWxlIHdhdGNoZXIgd2lsbCBub3QgcHVyZ2Ugb3V0ZGF0ZWRcbiAgLy8gZmlsZXMgYW5kIGNhdXNlIHN0YWxlIGRhdGEgdG8gYmUgdXNlZCBpbiB0aGUgbmV4dCByZWJ1aWxkLiBUeXBlU2NyaXB0IGFsd2F5cyB1c2VzIGEgYC9gIChQT1NJWClcbiAgLy8gZGlyZWN0b3J5IHNlcGFyYXRvciBpbnRlcm5hbGx5IHdoaWNoIGlzIGFsc28gc3VwcG9ydGVkIHdpdGggV2luZG93cyBzeXN0ZW0gQVBJcy4gSG93ZXZlcixcbiAgLy8gaWYgZmlsZSBvcGVyYXRpb25zIGFyZSBwZXJmb3JtZWQgd2l0aCB0aGUgbm9uLWRlZmF1bHQgZGlyZWN0b3J5IHNlcGFyYXRvciwgdGhlIFdlYnBhY2sgY2FjaGVcbiAgLy8gd2lsbCBjb250YWluIGEga2V5IHRoYXQgd2lsbCBub3QgYmUgcHVyZ2VkLiBgZXh0ZXJuYWxpemVQYXRoYCBlbnN1cmVzIHRoZSBwYXRocyBhcmUgYXMgZXhwZWN0ZWQuXG4gIGNvbnN0IHN5c3RlbTogdHMuU3lzdGVtID0ge1xuICAgIC4uLnRzLnN5cyxcbiAgICByZWFkRmlsZShwYXRoOiBzdHJpbmcpIHtcbiAgICAgIGxldCBkYXRhO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IGlucHV0LnJlYWRGaWxlU3luYyhleHRlcm5hbGl6ZVBhdGgocGF0aCkpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0cmlwIEJPTSBpZiBwcmVzZW50XG4gICAgICBsZXQgc3RhcnQgPSAwO1xuICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMyAmJiBkYXRhWzBdID09PSAweGVmICYmIGRhdGFbMV0gPT09IDB4YmIgJiYgZGF0YVsyXSA9PT0gMHhiZikge1xuICAgICAgICBzdGFydCA9IDM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRhLnRvU3RyaW5nKCd1dGY4Jywgc3RhcnQpO1xuICAgIH0sXG4gICAgZ2V0RmlsZVNpemUocGF0aDogc3RyaW5nKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gaW5wdXQuc3RhdFN5bmMoZXh0ZXJuYWxpemVQYXRoKHBhdGgpKS5zaXplO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH0sXG4gICAgZmlsZUV4aXN0cyhwYXRoOiBzdHJpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5zdGF0U3luYyhleHRlcm5hbGl6ZVBhdGgocGF0aCkpLmlzRmlsZSgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGRpcmVjdG9yeUV4aXN0cyhwYXRoOiBzdHJpbmcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5zdGF0U3luYyhleHRlcm5hbGl6ZVBhdGgocGF0aCkpLmlzRGlyZWN0b3J5KCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG4gICAgZ2V0TW9kaWZpZWRUaW1lKHBhdGg6IHN0cmluZykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnN0YXRTeW5jKGV4dGVybmFsaXplUGF0aChwYXRoKSkubXRpbWU7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGdldEN1cnJlbnREaXJlY3RvcnkoKSB7XG4gICAgICByZXR1cm4gY3VycmVudERpcmVjdG9yeTtcbiAgICB9LFxuICAgIHdyaXRlRmlsZTogc2hvdWxkTm90V3JpdGUsXG4gICAgY3JlYXRlRGlyZWN0b3J5OiBzaG91bGROb3RXcml0ZSxcbiAgICBkZWxldGVGaWxlOiBzaG91bGROb3RXcml0ZSxcbiAgICBzZXRNb2RpZmllZFRpbWU6IHNob3VsZE5vdFdyaXRlLFxuICB9O1xuXG4gIHJldHVybiBzeXN0ZW07XG59XG4iXX0=