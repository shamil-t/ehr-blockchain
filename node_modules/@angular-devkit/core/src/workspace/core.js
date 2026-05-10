"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeWorkspace = exports.readWorkspace = exports._test_removeWorkspaceFile = exports._test_addWorkspaceFile = exports.WorkspaceFormat = void 0;
const virtual_fs_1 = require("../virtual-fs");
const reader_1 = require("./json/reader");
const writer_1 = require("./json/writer");
const formatLookup = new WeakMap();
/**
 * Supported workspace formats
 */
var WorkspaceFormat;
(function (WorkspaceFormat) {
    WorkspaceFormat[WorkspaceFormat["JSON"] = 0] = "JSON";
})(WorkspaceFormat || (exports.WorkspaceFormat = WorkspaceFormat = {}));
/**
 * @private
 */
function _test_addWorkspaceFile(name, format) {
    workspaceFiles[name] = format;
}
exports._test_addWorkspaceFile = _test_addWorkspaceFile;
/**
 * @private
 */
function _test_removeWorkspaceFile(name) {
    delete workspaceFiles[name];
}
exports._test_removeWorkspaceFile = _test_removeWorkspaceFile;
// NOTE: future additions could also perform content analysis to determine format/version
const workspaceFiles = {
    'angular.json': WorkspaceFormat.JSON,
    '.angular.json': WorkspaceFormat.JSON,
};
/**
 * Reads and constructs a `WorkspaceDefinition`.  If the function is provided with a path to a
 * directory instead of a file, a search of the directory's files will commence to attempt to
 * locate a known workspace file.  Currently the following are considered known workspace files:
 * - `angular.json`
 * - `.angular.json`
 *
 * @param path The path to either a workspace file or a directory containing a workspace file.
 * @param host The `WorkspaceHost` to use to access the file and directory data.
 * @param format An optional `WorkspaceFormat` value. Used if the path specifies a non-standard
 * file name that would prevent automatically discovering the format.
 *
 *
 * @return An `Promise` of the read result object with the `WorkspaceDefinition` contained within
 * the `workspace` property.
 */
async function readWorkspace(path, host, format) {
    if (await host.isDirectory(path)) {
        // TODO: Warn if multiple found (requires diagnostics support)
        const directory = (0, virtual_fs_1.normalize)(path);
        let found = false;
        for (const [name, nameFormat] of Object.entries(workspaceFiles)) {
            if (format !== undefined && format !== nameFormat) {
                continue;
            }
            const potential = (0, virtual_fs_1.getSystemPath)((0, virtual_fs_1.join)(directory, name));
            if (await host.isFile(potential)) {
                path = potential;
                format = nameFormat;
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error('Unable to locate a workspace file for workspace path. Are you missing an `angular.json`' +
                ' or `.angular.json` file?');
        }
    }
    else if (format === undefined) {
        const filename = (0, virtual_fs_1.basename)((0, virtual_fs_1.normalize)(path));
        if (filename in workspaceFiles) {
            format = workspaceFiles[filename];
        }
    }
    if (format === undefined) {
        throw new Error('Unable to determine format for workspace path.');
    }
    let workspace;
    switch (format) {
        case WorkspaceFormat.JSON:
            workspace = await (0, reader_1.readJsonWorkspace)(path, host);
            break;
        default:
            throw new Error('Unsupported workspace format.');
    }
    formatLookup.set(workspace, WorkspaceFormat.JSON);
    return { workspace };
}
exports.readWorkspace = readWorkspace;
/**
 * Writes a `WorkspaceDefinition` to the underlying storage via the provided `WorkspaceHost`.
 * If the `WorkspaceDefinition` was created via the `readWorkspace` function, metadata will be
 * used to determine the path and format of the Workspace.  In all other cases, the `path` and
 * `format` options must be specified as they would be otherwise unknown.
 *
 * @param workspace The `WorkspaceDefinition` that will be written.
 * @param host The `WorkspaceHost` to use to access/write the file and directory data.
 * @param path The path to a file location for the output. Required if `readWorkspace` was not
 * used to create the `WorkspaceDefinition`.  Optional otherwise; will override the
 * `WorkspaceDefinition` metadata if provided.
 * @param format The `WorkspaceFormat` to use for output. Required if `readWorkspace` was not
 * used to create the `WorkspaceDefinition`.  Optional otherwise; will override the
 * `WorkspaceDefinition` metadata if provided.
 *
 *
 * @return An `Promise` of type `void`.
 */
async function writeWorkspace(workspace, host, path, format) {
    if (format === undefined) {
        format = formatLookup.get(workspace);
        if (format === undefined) {
            throw new Error('A format is required for custom workspace objects.');
        }
    }
    switch (format) {
        case WorkspaceFormat.JSON:
            return (0, writer_1.writeJsonWorkspace)(workspace, host, path);
        default:
            throw new Error('Unsupported workspace format.');
    }
}
exports.writeWorkspace = writeWorkspace;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3dvcmtzcGFjZS9jb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDhDQUF5RTtBQUd6RSwwQ0FBa0Q7QUFDbEQsMENBQW1EO0FBRW5ELE1BQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUF3QyxDQUFDO0FBRXpFOztHQUVHO0FBQ0gsSUFBWSxlQUVYO0FBRkQsV0FBWSxlQUFlO0lBQ3pCLHFEQUFJLENBQUE7QUFDTixDQUFDLEVBRlcsZUFBZSwrQkFBZixlQUFlLFFBRTFCO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixzQkFBc0IsQ0FBQyxJQUFZLEVBQUUsTUFBdUI7SUFDMUUsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUNoQyxDQUFDO0FBRkQsd0RBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLHlCQUF5QixDQUFDLElBQVk7SUFDcEQsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUZELDhEQUVDO0FBRUQseUZBQXlGO0FBQ3pGLE1BQU0sY0FBYyxHQUFvQztJQUN0RCxjQUFjLEVBQUUsZUFBZSxDQUFDLElBQUk7SUFDcEMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJO0NBQ3RDLENBQUM7QUFFRjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUNqQyxJQUFZLEVBQ1osSUFBbUIsRUFDbkIsTUFBd0I7SUFHeEIsSUFBSSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDaEMsOERBQThEO1FBQzlELE1BQU0sU0FBUyxHQUFHLElBQUEsc0JBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbEIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDL0QsSUFBSSxNQUFNLEtBQUssU0FBUyxJQUFJLE1BQU0sS0FBSyxVQUFVLEVBQUU7Z0JBQ2pELFNBQVM7YUFDVjtZQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsMEJBQWEsRUFBQyxJQUFBLGlCQUFJLEVBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkQsSUFBSSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksR0FBRyxTQUFTLENBQUM7Z0JBQ2pCLE1BQU0sR0FBRyxVQUFVLENBQUM7Z0JBQ3BCLEtBQUssR0FBRyxJQUFJLENBQUM7Z0JBQ2IsTUFBTTthQUNQO1NBQ0Y7UUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FDYix5RkFBeUY7Z0JBQ3ZGLDJCQUEyQixDQUM5QixDQUFDO1NBQ0g7S0FDRjtTQUFNLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUMvQixNQUFNLFFBQVEsR0FBRyxJQUFBLHFCQUFRLEVBQUMsSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxRQUFRLElBQUksY0FBYyxFQUFFO1lBQzlCLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbkM7S0FDRjtJQUVELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFJLFNBQVMsQ0FBQztJQUNkLFFBQVEsTUFBTSxFQUFFO1FBQ2QsS0FBSyxlQUFlLENBQUMsSUFBSTtZQUN2QixTQUFTLEdBQUcsTUFBTSxJQUFBLDBCQUFpQixFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNO1FBQ1I7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7S0FDcEQ7SUFFRCxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBQ3ZCLENBQUM7QUFwREQsc0NBb0RDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0ksS0FBSyxVQUFVLGNBQWMsQ0FDbEMsU0FBOEIsRUFDOUIsSUFBbUIsRUFDbkIsSUFBYSxFQUNiLE1BQXdCO0lBRXhCLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUN4QixNQUFNLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1NBQ3ZFO0tBQ0Y7SUFFRCxRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssZUFBZSxDQUFDLElBQUk7WUFDdkIsT0FBTyxJQUFBLDJCQUFrQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQ7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7S0FDcEQ7QUFDSCxDQUFDO0FBbkJELHdDQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBiYXNlbmFtZSwgZ2V0U3lzdGVtUGF0aCwgam9pbiwgbm9ybWFsaXplIH0gZnJvbSAnLi4vdmlydHVhbC1mcyc7XG5pbXBvcnQgeyBXb3Jrc3BhY2VEZWZpbml0aW9uIH0gZnJvbSAnLi9kZWZpbml0aW9ucyc7XG5pbXBvcnQgeyBXb3Jrc3BhY2VIb3N0IH0gZnJvbSAnLi9ob3N0JztcbmltcG9ydCB7IHJlYWRKc29uV29ya3NwYWNlIH0gZnJvbSAnLi9qc29uL3JlYWRlcic7XG5pbXBvcnQgeyB3cml0ZUpzb25Xb3Jrc3BhY2UgfSBmcm9tICcuL2pzb24vd3JpdGVyJztcblxuY29uc3QgZm9ybWF0TG9va3VwID0gbmV3IFdlYWtNYXA8V29ya3NwYWNlRGVmaW5pdGlvbiwgV29ya3NwYWNlRm9ybWF0PigpO1xuXG4vKipcbiAqIFN1cHBvcnRlZCB3b3Jrc3BhY2UgZm9ybWF0c1xuICovXG5leHBvcnQgZW51bSBXb3Jrc3BhY2VGb3JtYXQge1xuICBKU09OLFxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfdGVzdF9hZGRXb3Jrc3BhY2VGaWxlKG5hbWU6IHN0cmluZywgZm9ybWF0OiBXb3Jrc3BhY2VGb3JtYXQpOiB2b2lkIHtcbiAgd29ya3NwYWNlRmlsZXNbbmFtZV0gPSBmb3JtYXQ7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF90ZXN0X3JlbW92ZVdvcmtzcGFjZUZpbGUobmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGRlbGV0ZSB3b3Jrc3BhY2VGaWxlc1tuYW1lXTtcbn1cblxuLy8gTk9URTogZnV0dXJlIGFkZGl0aW9ucyBjb3VsZCBhbHNvIHBlcmZvcm0gY29udGVudCBhbmFseXNpcyB0byBkZXRlcm1pbmUgZm9ybWF0L3ZlcnNpb25cbmNvbnN0IHdvcmtzcGFjZUZpbGVzOiBSZWNvcmQ8c3RyaW5nLCBXb3Jrc3BhY2VGb3JtYXQ+ID0ge1xuICAnYW5ndWxhci5qc29uJzogV29ya3NwYWNlRm9ybWF0LkpTT04sXG4gICcuYW5ndWxhci5qc29uJzogV29ya3NwYWNlRm9ybWF0LkpTT04sXG59O1xuXG4vKipcbiAqIFJlYWRzIGFuZCBjb25zdHJ1Y3RzIGEgYFdvcmtzcGFjZURlZmluaXRpb25gLiAgSWYgdGhlIGZ1bmN0aW9uIGlzIHByb3ZpZGVkIHdpdGggYSBwYXRoIHRvIGFcbiAqIGRpcmVjdG9yeSBpbnN0ZWFkIG9mIGEgZmlsZSwgYSBzZWFyY2ggb2YgdGhlIGRpcmVjdG9yeSdzIGZpbGVzIHdpbGwgY29tbWVuY2UgdG8gYXR0ZW1wdCB0b1xuICogbG9jYXRlIGEga25vd24gd29ya3NwYWNlIGZpbGUuICBDdXJyZW50bHkgdGhlIGZvbGxvd2luZyBhcmUgY29uc2lkZXJlZCBrbm93biB3b3Jrc3BhY2UgZmlsZXM6XG4gKiAtIGBhbmd1bGFyLmpzb25gXG4gKiAtIGAuYW5ndWxhci5qc29uYFxuICpcbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGVpdGhlciBhIHdvcmtzcGFjZSBmaWxlIG9yIGEgZGlyZWN0b3J5IGNvbnRhaW5pbmcgYSB3b3Jrc3BhY2UgZmlsZS5cbiAqIEBwYXJhbSBob3N0IFRoZSBgV29ya3NwYWNlSG9zdGAgdG8gdXNlIHRvIGFjY2VzcyB0aGUgZmlsZSBhbmQgZGlyZWN0b3J5IGRhdGEuXG4gKiBAcGFyYW0gZm9ybWF0IEFuIG9wdGlvbmFsIGBXb3Jrc3BhY2VGb3JtYXRgIHZhbHVlLiBVc2VkIGlmIHRoZSBwYXRoIHNwZWNpZmllcyBhIG5vbi1zdGFuZGFyZFxuICogZmlsZSBuYW1lIHRoYXQgd291bGQgcHJldmVudCBhdXRvbWF0aWNhbGx5IGRpc2NvdmVyaW5nIHRoZSBmb3JtYXQuXG4gKlxuICpcbiAqIEByZXR1cm4gQW4gYFByb21pc2VgIG9mIHRoZSByZWFkIHJlc3VsdCBvYmplY3Qgd2l0aCB0aGUgYFdvcmtzcGFjZURlZmluaXRpb25gIGNvbnRhaW5lZCB3aXRoaW5cbiAqIHRoZSBgd29ya3NwYWNlYCBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRXb3Jrc3BhY2UoXG4gIHBhdGg6IHN0cmluZyxcbiAgaG9zdDogV29ya3NwYWNlSG9zdCxcbiAgZm9ybWF0PzogV29ya3NwYWNlRm9ybWF0LFxuICAvLyByZXR1cm4gdHlwZSB3aWxsIGV2ZW50dWFsbHkgaGF2ZSBhIGBkaWFnbm9zdGljc2AgcHJvcGVydHkgYXMgd2VsbFxuKTogUHJvbWlzZTx7IHdvcmtzcGFjZTogV29ya3NwYWNlRGVmaW5pdGlvbiB9PiB7XG4gIGlmIChhd2FpdCBob3N0LmlzRGlyZWN0b3J5KHBhdGgpKSB7XG4gICAgLy8gVE9ETzogV2FybiBpZiBtdWx0aXBsZSBmb3VuZCAocmVxdWlyZXMgZGlhZ25vc3RpY3Mgc3VwcG9ydClcbiAgICBjb25zdCBkaXJlY3RvcnkgPSBub3JtYWxpemUocGF0aCk7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbmFtZUZvcm1hdF0gb2YgT2JqZWN0LmVudHJpZXMod29ya3NwYWNlRmlsZXMpKSB7XG4gICAgICBpZiAoZm9ybWF0ICE9PSB1bmRlZmluZWQgJiYgZm9ybWF0ICE9PSBuYW1lRm9ybWF0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwb3RlbnRpYWwgPSBnZXRTeXN0ZW1QYXRoKGpvaW4oZGlyZWN0b3J5LCBuYW1lKSk7XG4gICAgICBpZiAoYXdhaXQgaG9zdC5pc0ZpbGUocG90ZW50aWFsKSkge1xuICAgICAgICBwYXRoID0gcG90ZW50aWFsO1xuICAgICAgICBmb3JtYXQgPSBuYW1lRm9ybWF0O1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdVbmFibGUgdG8gbG9jYXRlIGEgd29ya3NwYWNlIGZpbGUgZm9yIHdvcmtzcGFjZSBwYXRoLiBBcmUgeW91IG1pc3NpbmcgYW4gYGFuZ3VsYXIuanNvbmAnICtcbiAgICAgICAgICAnIG9yIGAuYW5ndWxhci5qc29uYCBmaWxlPycsXG4gICAgICApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGZpbGVuYW1lID0gYmFzZW5hbWUobm9ybWFsaXplKHBhdGgpKTtcbiAgICBpZiAoZmlsZW5hbWUgaW4gd29ya3NwYWNlRmlsZXMpIHtcbiAgICAgIGZvcm1hdCA9IHdvcmtzcGFjZUZpbGVzW2ZpbGVuYW1lXTtcbiAgICB9XG4gIH1cblxuICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZXRlcm1pbmUgZm9ybWF0IGZvciB3b3Jrc3BhY2UgcGF0aC4nKTtcbiAgfVxuXG4gIGxldCB3b3Jrc3BhY2U7XG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgY2FzZSBXb3Jrc3BhY2VGb3JtYXQuSlNPTjpcbiAgICAgIHdvcmtzcGFjZSA9IGF3YWl0IHJlYWRKc29uV29ya3NwYWNlKHBhdGgsIGhvc3QpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgd29ya3NwYWNlIGZvcm1hdC4nKTtcbiAgfVxuXG4gIGZvcm1hdExvb2t1cC5zZXQod29ya3NwYWNlLCBXb3Jrc3BhY2VGb3JtYXQuSlNPTik7XG5cbiAgcmV0dXJuIHsgd29ya3NwYWNlIH07XG59XG5cbi8qKlxuICogV3JpdGVzIGEgYFdvcmtzcGFjZURlZmluaXRpb25gIHRvIHRoZSB1bmRlcmx5aW5nIHN0b3JhZ2UgdmlhIHRoZSBwcm92aWRlZCBgV29ya3NwYWNlSG9zdGAuXG4gKiBJZiB0aGUgYFdvcmtzcGFjZURlZmluaXRpb25gIHdhcyBjcmVhdGVkIHZpYSB0aGUgYHJlYWRXb3Jrc3BhY2VgIGZ1bmN0aW9uLCBtZXRhZGF0YSB3aWxsIGJlXG4gKiB1c2VkIHRvIGRldGVybWluZSB0aGUgcGF0aCBhbmQgZm9ybWF0IG9mIHRoZSBXb3Jrc3BhY2UuICBJbiBhbGwgb3RoZXIgY2FzZXMsIHRoZSBgcGF0aGAgYW5kXG4gKiBgZm9ybWF0YCBvcHRpb25zIG11c3QgYmUgc3BlY2lmaWVkIGFzIHRoZXkgd291bGQgYmUgb3RoZXJ3aXNlIHVua25vd24uXG4gKlxuICogQHBhcmFtIHdvcmtzcGFjZSBUaGUgYFdvcmtzcGFjZURlZmluaXRpb25gIHRoYXQgd2lsbCBiZSB3cml0dGVuLlxuICogQHBhcmFtIGhvc3QgVGhlIGBXb3Jrc3BhY2VIb3N0YCB0byB1c2UgdG8gYWNjZXNzL3dyaXRlIHRoZSBmaWxlIGFuZCBkaXJlY3RvcnkgZGF0YS5cbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGEgZmlsZSBsb2NhdGlvbiBmb3IgdGhlIG91dHB1dC4gUmVxdWlyZWQgaWYgYHJlYWRXb3Jrc3BhY2VgIHdhcyBub3RcbiAqIHVzZWQgdG8gY3JlYXRlIHRoZSBgV29ya3NwYWNlRGVmaW5pdGlvbmAuICBPcHRpb25hbCBvdGhlcndpc2U7IHdpbGwgb3ZlcnJpZGUgdGhlXG4gKiBgV29ya3NwYWNlRGVmaW5pdGlvbmAgbWV0YWRhdGEgaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0gZm9ybWF0IFRoZSBgV29ya3NwYWNlRm9ybWF0YCB0byB1c2UgZm9yIG91dHB1dC4gUmVxdWlyZWQgaWYgYHJlYWRXb3Jrc3BhY2VgIHdhcyBub3RcbiAqIHVzZWQgdG8gY3JlYXRlIHRoZSBgV29ya3NwYWNlRGVmaW5pdGlvbmAuICBPcHRpb25hbCBvdGhlcndpc2U7IHdpbGwgb3ZlcnJpZGUgdGhlXG4gKiBgV29ya3NwYWNlRGVmaW5pdGlvbmAgbWV0YWRhdGEgaWYgcHJvdmlkZWQuXG4gKlxuICpcbiAqIEByZXR1cm4gQW4gYFByb21pc2VgIG9mIHR5cGUgYHZvaWRgLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVXb3Jrc3BhY2UoXG4gIHdvcmtzcGFjZTogV29ya3NwYWNlRGVmaW5pdGlvbixcbiAgaG9zdDogV29ya3NwYWNlSG9zdCxcbiAgcGF0aD86IHN0cmluZyxcbiAgZm9ybWF0PzogV29ya3NwYWNlRm9ybWF0LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGZvcm1hdCA9IGZvcm1hdExvb2t1cC5nZXQod29ya3NwYWNlKTtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSBmb3JtYXQgaXMgcmVxdWlyZWQgZm9yIGN1c3RvbSB3b3Jrc3BhY2Ugb2JqZWN0cy4nKTtcbiAgICB9XG4gIH1cblxuICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgIGNhc2UgV29ya3NwYWNlRm9ybWF0LkpTT046XG4gICAgICByZXR1cm4gd3JpdGVKc29uV29ya3NwYWNlKHdvcmtzcGFjZSwgaG9zdCwgcGF0aCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgd29ya3NwYWNlIGZvcm1hdC4nKTtcbiAgfVxufVxuIl19