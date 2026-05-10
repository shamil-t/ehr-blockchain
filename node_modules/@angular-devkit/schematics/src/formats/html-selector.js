"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlSelectorFormat = void 0;
// As per https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
// * Without mandatory `-` as the application prefix will generally cover its inclusion
// * And an allowance for upper alpha characters
// NOTE: This should eventually be broken out into two formats: full and partial (allows for prefix)
const unicodeRanges = [
    [0xc0, 0xd6],
    [0xd8, 0xf6],
    [0xf8, 0x37d],
    [0x37f, 0x1fff],
    [0x200c, 0x200d],
    [0x203f, 0x2040],
    [0x2070, 0x218f],
    [0x2c00, 0x2fef],
    [0x3001, 0xd7ff],
    [0xf900, 0xfdcf],
    [0xfdf0, 0xfffd],
    [0x10000, 0xeffff],
];
function isValidElementName(name) {
    let regex = '^[a-zA-Z][';
    regex += '-.0-9_a-zA-Z\\u{B7}';
    for (const range of unicodeRanges) {
        regex += `\\u{${range[0].toString(16)}}-\\u{${range[1].toString(16)}}`;
    }
    regex += ']*$';
    return new RegExp(regex, 'u').test(name);
}
exports.htmlSelectorFormat = {
    name: 'html-selector',
    formatter: {
        async: false,
        validate: (name) => typeof name === 'string' && isValidElementName(name),
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1zZWxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL2Zvcm1hdHMvaHRtbC1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSCwrRkFBK0Y7QUFDL0YsdUZBQXVGO0FBQ3ZGLGdEQUFnRDtBQUVoRCxvR0FBb0c7QUFFcEcsTUFBTSxhQUFhLEdBQUc7SUFDcEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ1osQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ1osQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO0lBQ2IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO0lBQ2YsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0lBQ2hCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztJQUNoQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7SUFDaEIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0lBQ2hCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztJQUNoQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7SUFDaEIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0lBQ2hCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztDQUNuQixDQUFDO0FBRUYsU0FBUyxrQkFBa0IsQ0FBQyxJQUFZO0lBQ3RDLElBQUksS0FBSyxHQUFHLFlBQVksQ0FBQztJQUV6QixLQUFLLElBQUkscUJBQXFCLENBQUM7SUFFL0IsS0FBSyxNQUFNLEtBQUssSUFBSSxhQUFhLEVBQUU7UUFDakMsS0FBSyxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7S0FDeEU7SUFFRCxLQUFLLElBQUksS0FBSyxDQUFDO0lBRWYsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFWSxRQUFBLGtCQUFrQixHQUF3QjtJQUNyRCxJQUFJLEVBQUUsZUFBZTtJQUNyQixTQUFTLEVBQUU7UUFDVCxLQUFLLEVBQUUsS0FBSztRQUNaLFFBQVEsRUFBRSxDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQztLQUNsRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgc2NoZW1hIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuXG4vLyBBcyBwZXIgaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvY3VzdG9tLWVsZW1lbnRzLmh0bWwjdmFsaWQtY3VzdG9tLWVsZW1lbnQtbmFtZVxuLy8gKiBXaXRob3V0IG1hbmRhdG9yeSBgLWAgYXMgdGhlIGFwcGxpY2F0aW9uIHByZWZpeCB3aWxsIGdlbmVyYWxseSBjb3ZlciBpdHMgaW5jbHVzaW9uXG4vLyAqIEFuZCBhbiBhbGxvd2FuY2UgZm9yIHVwcGVyIGFscGhhIGNoYXJhY3RlcnNcblxuLy8gTk9URTogVGhpcyBzaG91bGQgZXZlbnR1YWxseSBiZSBicm9rZW4gb3V0IGludG8gdHdvIGZvcm1hdHM6IGZ1bGwgYW5kIHBhcnRpYWwgKGFsbG93cyBmb3IgcHJlZml4KVxuXG5jb25zdCB1bmljb2RlUmFuZ2VzID0gW1xuICBbMHhjMCwgMHhkNl0sXG4gIFsweGQ4LCAweGY2XSxcbiAgWzB4ZjgsIDB4MzdkXSxcbiAgWzB4MzdmLCAweDFmZmZdLFxuICBbMHgyMDBjLCAweDIwMGRdLFxuICBbMHgyMDNmLCAweDIwNDBdLFxuICBbMHgyMDcwLCAweDIxOGZdLFxuICBbMHgyYzAwLCAweDJmZWZdLFxuICBbMHgzMDAxLCAweGQ3ZmZdLFxuICBbMHhmOTAwLCAweGZkY2ZdLFxuICBbMHhmZGYwLCAweGZmZmRdLFxuICBbMHgxMDAwMCwgMHhlZmZmZl0sXG5dO1xuXG5mdW5jdGlvbiBpc1ZhbGlkRWxlbWVudE5hbWUobmFtZTogc3RyaW5nKSB7XG4gIGxldCByZWdleCA9ICdeW2EtekEtWl1bJztcblxuICByZWdleCArPSAnLS4wLTlfYS16QS1aXFxcXHV7Qjd9JztcblxuICBmb3IgKGNvbnN0IHJhbmdlIG9mIHVuaWNvZGVSYW5nZXMpIHtcbiAgICByZWdleCArPSBgXFxcXHV7JHtyYW5nZVswXS50b1N0cmluZygxNil9fS1cXFxcdXske3JhbmdlWzFdLnRvU3RyaW5nKDE2KX19YDtcbiAgfVxuXG4gIHJlZ2V4ICs9ICddKiQnO1xuXG4gIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LCAndScpLnRlc3QobmFtZSk7XG59XG5cbmV4cG9ydCBjb25zdCBodG1sU2VsZWN0b3JGb3JtYXQ6IHNjaGVtYS5TY2hlbWFGb3JtYXQgPSB7XG4gIG5hbWU6ICdodG1sLXNlbGVjdG9yJyxcbiAgZm9ybWF0dGVyOiB7XG4gICAgYXN5bmM6IGZhbHNlLFxuICAgIHZhbGlkYXRlOiAobmFtZTogdW5rbm93bikgPT4gdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnICYmIGlzVmFsaWRFbGVtZW50TmFtZShuYW1lKSxcbiAgfSxcbn07XG4iXX0=