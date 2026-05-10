"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonPointer = exports.joinJsonPointer = exports.buildJsonPointer = void 0;
function buildJsonPointer(fragments) {
    return ('/' +
        fragments
            .map((f) => {
            return f.replace(/~/g, '~0').replace(/\//g, '~1');
        })
            .join('/'));
}
exports.buildJsonPointer = buildJsonPointer;
function joinJsonPointer(root, ...others) {
    if (root == '/') {
        return buildJsonPointer(others);
    }
    return (root + buildJsonPointer(others));
}
exports.joinJsonPointer = joinJsonPointer;
function parseJsonPointer(pointer) {
    if (pointer === '') {
        return [];
    }
    if (pointer.charAt(0) !== '/') {
        throw new Error('Relative pointer: ' + pointer);
    }
    return pointer
        .substring(1)
        .split(/\//)
        .map((str) => str.replace(/~1/g, '/').replace(/~0/g, '~'));
}
exports.parseJsonPointer = parseJsonPointer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9pbnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2pzb24vc2NoZW1hL3BvaW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUgsU0FBZ0IsZ0JBQWdCLENBQUMsU0FBbUI7SUFDbEQsT0FBTyxDQUFDLEdBQUc7UUFDVCxTQUFTO2FBQ04sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDVCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFnQixDQUFDO0FBQ2pDLENBQUM7QUFQRCw0Q0FPQztBQUNELFNBQWdCLGVBQWUsQ0FBQyxJQUFpQixFQUFFLEdBQUcsTUFBZ0I7SUFDcEUsSUFBSSxJQUFJLElBQUksR0FBRyxFQUFFO1FBQ2YsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNqQztJQUVELE9BQU8sQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQWdCLENBQUM7QUFDMUQsQ0FBQztBQU5ELDBDQU1DO0FBQ0QsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBb0I7SUFDbkQsSUFBSSxPQUFPLEtBQUssRUFBRSxFQUFFO1FBQ2xCLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1FBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLENBQUM7S0FDakQ7SUFFRCxPQUFPLE9BQU87U0FDWCxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQ1osS0FBSyxDQUFDLElBQUksQ0FBQztTQUNYLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFaRCw0Q0FZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBKc29uUG9pbnRlciB9IGZyb20gJy4vaW50ZXJmYWNlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkSnNvblBvaW50ZXIoZnJhZ21lbnRzOiBzdHJpbmdbXSk6IEpzb25Qb2ludGVyIHtcbiAgcmV0dXJuICgnLycgK1xuICAgIGZyYWdtZW50c1xuICAgICAgLm1hcCgoZikgPT4ge1xuICAgICAgICByZXR1cm4gZi5yZXBsYWNlKC9+L2csICd+MCcpLnJlcGxhY2UoL1xcLy9nLCAnfjEnKTtcbiAgICAgIH0pXG4gICAgICAuam9pbignLycpKSBhcyBKc29uUG9pbnRlcjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBqb2luSnNvblBvaW50ZXIocm9vdDogSnNvblBvaW50ZXIsIC4uLm90aGVyczogc3RyaW5nW10pOiBKc29uUG9pbnRlciB7XG4gIGlmIChyb290ID09ICcvJykge1xuICAgIHJldHVybiBidWlsZEpzb25Qb2ludGVyKG90aGVycyk7XG4gIH1cblxuICByZXR1cm4gKHJvb3QgKyBidWlsZEpzb25Qb2ludGVyKG90aGVycykpIGFzIEpzb25Qb2ludGVyO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSnNvblBvaW50ZXIocG9pbnRlcjogSnNvblBvaW50ZXIpOiBzdHJpbmdbXSB7XG4gIGlmIChwb2ludGVyID09PSAnJykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAocG9pbnRlci5jaGFyQXQoMCkgIT09ICcvJykge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVsYXRpdmUgcG9pbnRlcjogJyArIHBvaW50ZXIpO1xuICB9XG5cbiAgcmV0dXJuIHBvaW50ZXJcbiAgICAuc3Vic3RyaW5nKDEpXG4gICAgLnNwbGl0KC9cXC8vKVxuICAgIC5tYXAoKHN0cikgPT4gc3RyLnJlcGxhY2UoL34xL2csICcvJykucmVwbGFjZSgvfjAvZywgJ34nKSk7XG59XG4iXX0=