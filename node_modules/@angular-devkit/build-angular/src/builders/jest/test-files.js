"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTestFiles = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
/**
 * Finds all test files in the project.
 *
 * @param options The builder options describing where to find tests.
 * @param workspaceRoot The path to the root directory of the workspace.
 * @param glob A promisified implementation of the `glob` module. Only intended for
 *     testing purposes.
 * @returns A set of all test files in the project.
 */
async function findTestFiles(options, workspaceRoot, glob = fast_glob_1.default) {
    const globOptions = {
        cwd: workspaceRoot,
        ignore: ['node_modules/**'].concat(options.exclude),
        braceExpansion: false,
        extglob: false, // Disable "extglob" patterns.
    };
    const included = await Promise.all(options.include.map((pattern) => glob(pattern, globOptions)));
    // Flatten and deduplicate any files found in multiple include patterns.
    return new Set(included.flat());
}
exports.findTestFiles = findTestFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1maWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2plc3QvdGVzdC1maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwwREFBNkQ7QUFHN0Q7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUNqQyxPQUEyQixFQUMzQixhQUFxQixFQUNyQixPQUF3QixtQkFBUTtJQUVoQyxNQUFNLFdBQVcsR0FBZ0I7UUFDL0IsR0FBRyxFQUFFLGFBQWE7UUFDbEIsTUFBTSxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNuRCxjQUFjLEVBQUUsS0FBSztRQUNyQixPQUFPLEVBQUUsS0FBSyxFQUFFLDhCQUE4QjtLQUMvQyxDQUFDO0lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRyx3RUFBd0U7SUFDeEUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBaEJELHNDQWdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgZmFzdEdsb2IsIHsgT3B0aW9ucyBhcyBHbG9iT3B0aW9ucyB9IGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgeyBKZXN0QnVpbGRlck9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG4vKipcbiAqIEZpbmRzIGFsbCB0ZXN0IGZpbGVzIGluIHRoZSBwcm9qZWN0LlxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBidWlsZGVyIG9wdGlvbnMgZGVzY3JpYmluZyB3aGVyZSB0byBmaW5kIHRlc3RzLlxuICogQHBhcmFtIHdvcmtzcGFjZVJvb3QgVGhlIHBhdGggdG8gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoZSB3b3Jrc3BhY2UuXG4gKiBAcGFyYW0gZ2xvYiBBIHByb21pc2lmaWVkIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgZ2xvYmAgbW9kdWxlLiBPbmx5IGludGVuZGVkIGZvclxuICogICAgIHRlc3RpbmcgcHVycG9zZXMuXG4gKiBAcmV0dXJucyBBIHNldCBvZiBhbGwgdGVzdCBmaWxlcyBpbiB0aGUgcHJvamVjdC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbmRUZXN0RmlsZXMoXG4gIG9wdGlvbnM6IEplc3RCdWlsZGVyT3B0aW9ucyxcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICBnbG9iOiB0eXBlb2YgZmFzdEdsb2IgPSBmYXN0R2xvYixcbik6IFByb21pc2U8U2V0PHN0cmluZz4+IHtcbiAgY29uc3QgZ2xvYk9wdGlvbnM6IEdsb2JPcHRpb25zID0ge1xuICAgIGN3ZDogd29ya3NwYWNlUm9vdCxcbiAgICBpZ25vcmU6IFsnbm9kZV9tb2R1bGVzLyoqJ10uY29uY2F0KG9wdGlvbnMuZXhjbHVkZSksXG4gICAgYnJhY2VFeHBhbnNpb246IGZhbHNlLCAvLyBEbyBub3QgZXhwYW5kIGBhe2IsY31gIHRvIGBhYixhY2AuXG4gICAgZXh0Z2xvYjogZmFsc2UsIC8vIERpc2FibGUgXCJleHRnbG9iXCIgcGF0dGVybnMuXG4gIH07XG5cbiAgY29uc3QgaW5jbHVkZWQgPSBhd2FpdCBQcm9taXNlLmFsbChvcHRpb25zLmluY2x1ZGUubWFwKChwYXR0ZXJuKSA9PiBnbG9iKHBhdHRlcm4sIGdsb2JPcHRpb25zKSkpO1xuXG4gIC8vIEZsYXR0ZW4gYW5kIGRlZHVwbGljYXRlIGFueSBmaWxlcyBmb3VuZCBpbiBtdWx0aXBsZSBpbmNsdWRlIHBhdHRlcm5zLlxuICByZXR1cm4gbmV3IFNldChpbmNsdWRlZC5mbGF0KCkpO1xufVxuIl19