"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemPath = exports.asPosixPath = exports.asWindowsPath = exports.path = exports.noCacheNormalize = exports.normalize = exports.resetNormalizeCache = exports.fragment = exports.resolve = exports.relative = exports.isAbsolute = exports.join = exports.dirname = exports.basename = exports.extname = exports.split = exports.NormalizedRoot = exports.NormalizedSep = exports.PathCannotBeFragmentException = exports.PathMustBeAbsoluteException = exports.InvalidPathException = void 0;
const exception_1 = require("../exception");
class InvalidPathException extends exception_1.BaseException {
    constructor(path) {
        super(`Path ${JSON.stringify(path)} is invalid.`);
    }
}
exports.InvalidPathException = InvalidPathException;
class PathMustBeAbsoluteException extends exception_1.BaseException {
    constructor(path) {
        super(`Path ${JSON.stringify(path)} must be absolute.`);
    }
}
exports.PathMustBeAbsoluteException = PathMustBeAbsoluteException;
class PathCannotBeFragmentException extends exception_1.BaseException {
    constructor(path) {
        super(`Path ${JSON.stringify(path)} cannot be made a fragment.`);
    }
}
exports.PathCannotBeFragmentException = PathCannotBeFragmentException;
/**
 * The Separator for normalized path.
 * @type {Path}
 */
exports.NormalizedSep = '/';
/**
 * The root of a normalized path.
 * @type {Path}
 */
exports.NormalizedRoot = exports.NormalizedSep;
/**
 * Split a path into multiple path fragments. Each fragments except the last one will end with
 * a path separator.
 * @param {Path} path The path to split.
 * @returns {Path[]} An array of path fragments.
 */
function split(path) {
    const fragments = path.split(exports.NormalizedSep).map((x) => fragment(x));
    if (fragments[fragments.length - 1].length === 0) {
        fragments.pop();
    }
    return fragments;
}
exports.split = split;
/**
 *
 */
function extname(path) {
    const base = basename(path);
    const i = base.lastIndexOf('.');
    if (i < 1) {
        return '';
    }
    else {
        return base.slice(i);
    }
}
exports.extname = extname;
/**
 * Return the basename of the path, as a Path. See path.basename
 */
function basename(path) {
    const i = path.lastIndexOf(exports.NormalizedSep);
    if (i == -1) {
        return fragment(path);
    }
    else {
        return fragment(path.slice(path.lastIndexOf(exports.NormalizedSep) + 1));
    }
}
exports.basename = basename;
/**
 * Return the dirname of the path, as a Path. See path.dirname
 */
function dirname(path) {
    const index = path.lastIndexOf(exports.NormalizedSep);
    if (index === -1) {
        return '';
    }
    const endIndex = index === 0 ? 1 : index; // case of file under root: '/file'
    return normalize(path.slice(0, endIndex));
}
exports.dirname = dirname;
/**
 * Join multiple paths together, and normalize the result. Accepts strings that will be
 * normalized as well (but the original must be a path).
 */
function join(p1, ...others) {
    if (others.length > 0) {
        return normalize((p1 ? p1 + exports.NormalizedSep : '') + others.join(exports.NormalizedSep));
    }
    else {
        return p1;
    }
}
exports.join = join;
/**
 * Returns true if a path is absolute.
 */
function isAbsolute(p) {
    return p.startsWith(exports.NormalizedSep);
}
exports.isAbsolute = isAbsolute;
/**
 * Returns a path such that `join(from, relative(from, to)) == to`.
 * Both paths must be absolute, otherwise it does not make much sense.
 */
function relative(from, to) {
    if (!isAbsolute(from)) {
        throw new PathMustBeAbsoluteException(from);
    }
    if (!isAbsolute(to)) {
        throw new PathMustBeAbsoluteException(to);
    }
    let p;
    if (from == to) {
        p = '';
    }
    else {
        const splitFrom = split(from);
        const splitTo = split(to);
        while (splitFrom.length > 0 && splitTo.length > 0 && splitFrom[0] == splitTo[0]) {
            splitFrom.shift();
            splitTo.shift();
        }
        if (splitFrom.length == 0) {
            p = splitTo.join(exports.NormalizedSep);
        }
        else {
            p = splitFrom
                .map(() => '..')
                .concat(splitTo)
                .join(exports.NormalizedSep);
        }
    }
    return normalize(p);
}
exports.relative = relative;
/**
 * Returns a Path that is the resolution of p2, from p1. If p2 is absolute, it will return p2,
 * otherwise will join both p1 and p2.
 */
function resolve(p1, p2) {
    if (isAbsolute(p2)) {
        return p2;
    }
    else {
        return join(p1, p2);
    }
}
exports.resolve = resolve;
function fragment(path) {
    if (path.indexOf(exports.NormalizedSep) != -1) {
        throw new PathCannotBeFragmentException(path);
    }
    return path;
}
exports.fragment = fragment;
/**
 * normalize() cache to reduce computation. For now this grows and we never flush it, but in the
 * future we might want to add a few cache flush to prevent this from growing too large.
 */
let normalizedCache = new Map();
/**
 * Reset the cache. This is only useful for testing.
 * @private
 */
function resetNormalizeCache() {
    normalizedCache = new Map();
}
exports.resetNormalizeCache = resetNormalizeCache;
/**
 * Normalize a string into a Path. This is the only mean to get a Path type from a string that
 * represents a system path. This method cache the results as real world paths tend to be
 * duplicated often.
 * Normalization includes:
 *   - Windows backslashes `\\` are replaced with `/`.
 *   - Windows drivers are replaced with `/X/`, where X is the drive letter.
 *   - Absolute paths starts with `/`.
 *   - Multiple `/` are replaced by a single one.
 *   - Path segments `.` are removed.
 *   - Path segments `..` are resolved.
 *   - If a path is absolute, having a `..` at the start is invalid (and will throw).
 * @param path The path to be normalized.
 */
function normalize(path) {
    let maybePath = normalizedCache.get(path);
    if (!maybePath) {
        maybePath = noCacheNormalize(path);
        normalizedCache.set(path, maybePath);
    }
    return maybePath;
}
exports.normalize = normalize;
/**
 * The no cache version of the normalize() function. Used for benchmarking and testing.
 */
function noCacheNormalize(path) {
    if (path == '' || path == '.') {
        return '';
    }
    else if (path == exports.NormalizedRoot) {
        return exports.NormalizedRoot;
    }
    // Match absolute windows path.
    const original = path;
    if (path.match(/^[A-Z]:[/\\]/i)) {
        path = '\\' + path[0] + '\\' + path.slice(3);
    }
    // We convert Windows paths as well here.
    const p = path.split(/[/\\]/g);
    let relative = false;
    let i = 1;
    // Special case the first one.
    if (p[0] != '') {
        p.unshift('.');
        relative = true;
    }
    while (i < p.length) {
        if (p[i] == '.') {
            p.splice(i, 1);
        }
        else if (p[i] == '..') {
            if (i < 2 && !relative) {
                throw new InvalidPathException(original);
            }
            else if (i >= 2 && p[i - 1] != '..') {
                p.splice(i - 1, 2);
                i--;
            }
            else {
                i++;
            }
        }
        else if (p[i] == '') {
            p.splice(i, 1);
        }
        else {
            i++;
        }
    }
    if (p.length == 1) {
        return p[0] == '' ? exports.NormalizedSep : '';
    }
    else {
        if (p[0] == '.') {
            p.shift();
        }
        return p.join(exports.NormalizedSep);
    }
}
exports.noCacheNormalize = noCacheNormalize;
const path = (strings, ...values) => {
    return normalize(String.raw(strings, ...values));
};
exports.path = path;
function asWindowsPath(path) {
    const drive = path.match(/^\/(\w)(?:\/(.*))?$/);
    if (drive) {
        const subPath = drive[2] ? drive[2].replace(/\//g, '\\') : '';
        return `${drive[1]}:\\${subPath}`;
    }
    return path.replace(/\//g, '\\');
}
exports.asWindowsPath = asWindowsPath;
function asPosixPath(path) {
    return path;
}
exports.asPosixPath = asPosixPath;
function getSystemPath(path) {
    if (process.platform.startsWith('win32')) {
        return asWindowsPath(path);
    }
    else {
        return asPosixPath(path);
    }
}
exports.getSystemPath = getSystemPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3ZpcnR1YWwtZnMvcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCw0Q0FBNkM7QUFHN0MsTUFBYSxvQkFBcUIsU0FBUSx5QkFBYTtJQUNyRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBSkQsb0RBSUM7QUFDRCxNQUFhLDJCQUE0QixTQUFRLHlCQUFhO0lBQzVELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQzFELENBQUM7Q0FDRjtBQUpELGtFQUlDO0FBQ0QsTUFBYSw2QkFBOEIsU0FBUSx5QkFBYTtJQUM5RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCxzRUFJQztBQWdCRDs7O0dBR0c7QUFDVSxRQUFBLGFBQWEsR0FBRyxHQUFXLENBQUM7QUFFekM7OztHQUdHO0FBQ1UsUUFBQSxjQUFjLEdBQUcscUJBQWEsQ0FBQztBQUU1Qzs7Ozs7R0FLRztBQUNILFNBQWdCLEtBQUssQ0FBQyxJQUFVO0lBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEUsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFD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QUM7S0FDMUI7QUFDSCxDQUFDO0FBTkQsc0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBUZW1wbGF0ZVRhZyB9IGZyb20gJy4uL3V0aWxzL2xpdGVyYWxzJztcblxuZXhwb3J0IGNsYXNzIEludmFsaWRQYXRoRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBQYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGlzIGludmFsaWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBQYXRoTXVzdEJlQWJzb2x1dGVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFBhdGggJHtKU09OLnN0cmluZ2lmeShwYXRoKX0gbXVzdCBiZSBhYnNvbHV0ZS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIFBhdGhDYW5ub3RCZUZyYWdtZW50RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBQYXRoICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9IGNhbm5vdCBiZSBtYWRlIGEgZnJhZ21lbnQuYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIFBhdGggcmVjb2duaXplZCBieSBtb3N0IG1ldGhvZHMgaW4gdGhlIERldktpdC5cbiAqL1xuZXhwb3J0IHR5cGUgUGF0aCA9IHN0cmluZyAmIHtcbiAgX19QUklWQVRFX0RFVktJVF9QQVRIOiB2b2lkO1xufTtcblxuLyoqXG4gKiBBIFBhdGggZnJhZ21lbnQgKGZpbGUgb3IgZGlyZWN0b3J5IG5hbWUpIHJlY29nbml6ZWQgYnkgbW9zdCBtZXRob2RzIGluIHRoZSBEZXZLaXQuXG4gKi9cbmV4cG9ydCB0eXBlIFBhdGhGcmFnbWVudCA9IFBhdGggJiB7XG4gIF9fUFJJVkFURV9ERVZLSVRfUEFUSF9GUkFHTUVOVDogdm9pZDtcbn07XG5cbi8qKlxuICogVGhlIFNlcGFyYXRvciBmb3Igbm9ybWFsaXplZCBwYXRoLlxuICogQHR5cGUge1BhdGh9XG4gKi9cbmV4cG9ydCBjb25zdCBOb3JtYWxpemVkU2VwID0gJy8nIGFzIFBhdGg7XG5cbi8qKlxuICogVGhlIHJvb3Qgb2YgYSBub3JtYWxpemVkIHBhdGguXG4gKiBAdHlwZSB7UGF0aH1cbiAqL1xuZXhwb3J0IGNvbnN0IE5vcm1hbGl6ZWRSb290ID0gTm9ybWFsaXplZFNlcDtcblxuLyoqXG4gKiBTcGxpdCBhIHBhdGggaW50byBtdWx0aXBsZSBwYXRoIGZyYWdtZW50cy4gRWFjaCBmcmFnbWVudHMgZXhjZXB0IHRoZSBsYXN0IG9uZSB3aWxsIGVuZCB3aXRoXG4gKiBhIHBhdGggc2VwYXJhdG9yLlxuICogQHBhcmFtIHtQYXRofSBwYXRoIFRoZSBwYXRoIHRvIHNwbGl0LlxuICogQHJldHVybnMge1BhdGhbXX0gQW4gYXJyYXkgb2YgcGF0aCBmcmFnbWVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdChwYXRoOiBQYXRoKTogUGF0aEZyYWdtZW50W10ge1xuICBjb25zdCBmcmFnbWVudHMgPSBwYXRoLnNwbGl0KE5vcm1hbGl6ZWRTZXApLm1hcCgoeCkgPT4gZnJhZ21lbnQoeCkpO1xuICBpZiAoZnJhZ21lbnRzW2ZyYWdtZW50cy5sZW5ndGggLSAxXS5sZW5ndGggPT09IDApIHtcbiAgICBmcmFnbWVudHMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnRzO1xufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRuYW1lKHBhdGg6IFBhdGgpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlID0gYmFzZW5hbWUocGF0aCk7XG4gIGNvbnN0IGkgPSBiYXNlLmxhc3RJbmRleE9mKCcuJyk7XG4gIGlmIChpIDwgMSkge1xuICAgIHJldHVybiAnJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZS5zbGljZShpKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgYmFzZW5hbWUgb2YgdGhlIHBhdGgsIGFzIGEgUGF0aC4gU2VlIHBhdGguYmFzZW5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IFBhdGgpOiBQYXRoRnJhZ21lbnQge1xuICBjb25zdCBpID0gcGF0aC5sYXN0SW5kZXhPZihOb3JtYWxpemVkU2VwKTtcbiAgaWYgKGkgPT0gLTEpIHtcbiAgICByZXR1cm4gZnJhZ21lbnQocGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZyYWdtZW50KHBhdGguc2xpY2UocGF0aC5sYXN0SW5kZXhPZihOb3JtYWxpemVkU2VwKSArIDEpKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZGlybmFtZSBvZiB0aGUgcGF0aCwgYXMgYSBQYXRoLiBTZWUgcGF0aC5kaXJuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lKHBhdGg6IFBhdGgpOiBQYXRoIHtcbiAgY29uc3QgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKE5vcm1hbGl6ZWRTZXApO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuICcnIGFzIFBhdGg7XG4gIH1cblxuICBjb25zdCBlbmRJbmRleCA9IGluZGV4ID09PSAwID8gMSA6IGluZGV4OyAvLyBjYXNlIG9mIGZpbGUgdW5kZXIgcm9vdDogJy9maWxlJ1xuXG4gIHJldHVybiBub3JtYWxpemUocGF0aC5zbGljZSgwLCBlbmRJbmRleCkpO1xufVxuXG4vKipcbiAqIEpvaW4gbXVsdGlwbGUgcGF0aHMgdG9nZXRoZXIsIGFuZCBub3JtYWxpemUgdGhlIHJlc3VsdC4gQWNjZXB0cyBzdHJpbmdzIHRoYXQgd2lsbCBiZVxuICogbm9ybWFsaXplZCBhcyB3ZWxsIChidXQgdGhlIG9yaWdpbmFsIG11c3QgYmUgYSBwYXRoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ocDE6IFBhdGgsIC4uLm90aGVyczogc3RyaW5nW10pOiBQYXRoIHtcbiAgaWYgKG90aGVycy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZSgocDEgPyBwMSArIE5vcm1hbGl6ZWRTZXAgOiAnJykgKyBvdGhlcnMuam9pbihOb3JtYWxpemVkU2VwKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHAxO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGEgcGF0aCBpcyBhYnNvbHV0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQWJzb2x1dGUocDogUGF0aCkge1xuICByZXR1cm4gcC5zdGFydHNXaXRoKE5vcm1hbGl6ZWRTZXApO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBwYXRoIHN1Y2ggdGhhdCBgam9pbihmcm9tLCByZWxhdGl2ZShmcm9tLCB0bykpID09IHRvYC5cbiAqIEJvdGggcGF0aHMgbXVzdCBiZSBhYnNvbHV0ZSwgb3RoZXJ3aXNlIGl0IGRvZXMgbm90IG1ha2UgbXVjaCBzZW5zZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlKGZyb206IFBhdGgsIHRvOiBQYXRoKTogUGF0aCB7XG4gIGlmICghaXNBYnNvbHV0ZShmcm9tKSkge1xuICAgIHRocm93IG5ldyBQYXRoTXVzdEJlQWJzb2x1dGVFeGNlcHRpb24oZnJvbSk7XG4gIH1cbiAgaWYgKCFpc0Fic29sdXRlKHRvKSkge1xuICAgIHRocm93IG5ldyBQYXRoTXVzdEJlQWJzb2x1dGVFeGNlcHRpb24odG8pO1xuICB9XG5cbiAgbGV0IHA6IHN0cmluZztcblxuICBpZiAoZnJvbSA9PSB0bykge1xuICAgIHAgPSAnJztcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzcGxpdEZyb20gPSBzcGxpdChmcm9tKTtcbiAgICBjb25zdCBzcGxpdFRvID0gc3BsaXQodG8pO1xuXG4gICAgd2hpbGUgKHNwbGl0RnJvbS5sZW5ndGggPiAwICYmIHNwbGl0VG8ubGVuZ3RoID4gMCAmJiBzcGxpdEZyb21bMF0gPT0gc3BsaXRUb1swXSkge1xuICAgICAgc3BsaXRGcm9tLnNoaWZ0KCk7XG4gICAgICBzcGxpdFRvLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgaWYgKHNwbGl0RnJvbS5sZW5ndGggPT0gMCkge1xuICAgICAgcCA9IHNwbGl0VG8uam9pbihOb3JtYWxpemVkU2VwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcCA9IHNwbGl0RnJvbVxuICAgICAgICAubWFwKCgpID0+ICcuLicpXG4gICAgICAgIC5jb25jYXQoc3BsaXRUbylcbiAgICAgICAgLmpvaW4oTm9ybWFsaXplZFNlcCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZShwKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgUGF0aCB0aGF0IGlzIHRoZSByZXNvbHV0aW9uIG9mIHAyLCBmcm9tIHAxLiBJZiBwMiBpcyBhYnNvbHV0ZSwgaXQgd2lsbCByZXR1cm4gcDIsXG4gKiBvdGhlcndpc2Ugd2lsbCBqb2luIGJvdGggcDEgYW5kIHAyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZShwMTogUGF0aCwgcDI6IFBhdGgpIHtcbiAgaWYgKGlzQWJzb2x1dGUocDIpKSB7XG4gICAgcmV0dXJuIHAyO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBqb2luKHAxLCBwMik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyYWdtZW50KHBhdGg6IHN0cmluZyk6IFBhdGhGcmFnbWVudCB7XG4gIGlmIChwYXRoLmluZGV4T2YoTm9ybWFsaXplZFNlcCkgIT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgUGF0aENhbm5vdEJlRnJhZ21lbnRFeGNlcHRpb24ocGF0aCk7XG4gIH1cblxuICByZXR1cm4gcGF0aCBhcyBQYXRoRnJhZ21lbnQ7XG59XG5cbi8qKlxuICogbm9ybWFsaXplKCkgY2FjaGUgdG8gcmVkdWNlIGNvbXB1dGF0aW9uLiBGb3Igbm93IHRoaXMgZ3Jvd3MgYW5kIHdlIG5ldmVyIGZsdXNoIGl0LCBidXQgaW4gdGhlXG4gKiBmdXR1cmUgd2UgbWlnaHQgd2FudCB0byBhZGQgYSBmZXcgY2FjaGUgZmx1c2ggdG8gcHJldmVudCB0aGlzIGZyb20gZ3Jvd2luZyB0b28gbGFyZ2UuXG4gKi9cbmxldCBub3JtYWxpemVkQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUGF0aD4oKTtcblxuLyoqXG4gKiBSZXNldCB0aGUgY2FjaGUuIFRoaXMgaXMgb25seSB1c2VmdWwgZm9yIHRlc3RpbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXROb3JtYWxpemVDYWNoZSgpIHtcbiAgbm9ybWFsaXplZENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFBhdGg+KCk7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgc3RyaW5nIGludG8gYSBQYXRoLiBUaGlzIGlzIHRoZSBvbmx5IG1lYW4gdG8gZ2V0IGEgUGF0aCB0eXBlIGZyb20gYSBzdHJpbmcgdGhhdFxuICogcmVwcmVzZW50cyBhIHN5c3RlbSBwYXRoLiBUaGlzIG1ldGhvZCBjYWNoZSB0aGUgcmVzdWx0cyBhcyByZWFsIHdvcmxkIHBhdGhzIHRlbmQgdG8gYmVcbiAqIGR1cGxpY2F0ZWQgb2Z0ZW4uXG4gKiBOb3JtYWxpemF0aW9uIGluY2x1ZGVzOlxuICogICAtIFdpbmRvd3MgYmFja3NsYXNoZXMgYFxcXFxgIGFyZSByZXBsYWNlZCB3aXRoIGAvYC5cbiAqICAgLSBXaW5kb3dzIGRyaXZlcnMgYXJlIHJlcGxhY2VkIHdpdGggYC9YL2AsIHdoZXJlIFggaXMgdGhlIGRyaXZlIGxldHRlci5cbiAqICAgLSBBYnNvbHV0ZSBwYXRocyBzdGFydHMgd2l0aCBgL2AuXG4gKiAgIC0gTXVsdGlwbGUgYC9gIGFyZSByZXBsYWNlZCBieSBhIHNpbmdsZSBvbmUuXG4gKiAgIC0gUGF0aCBzZWdtZW50cyBgLmAgYXJlIHJlbW92ZWQuXG4gKiAgIC0gUGF0aCBzZWdtZW50cyBgLi5gIGFyZSByZXNvbHZlZC5cbiAqICAgLSBJZiBhIHBhdGggaXMgYWJzb2x1dGUsIGhhdmluZyBhIGAuLmAgYXQgdGhlIHN0YXJ0IGlzIGludmFsaWQgKGFuZCB3aWxsIHRocm93KS5cbiAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIHRvIGJlIG5vcm1hbGl6ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gIGxldCBtYXliZVBhdGggPSBub3JtYWxpemVkQ2FjaGUuZ2V0KHBhdGgpO1xuICBpZiAoIW1heWJlUGF0aCkge1xuICAgIG1heWJlUGF0aCA9IG5vQ2FjaGVOb3JtYWxpemUocGF0aCk7XG4gICAgbm9ybWFsaXplZENhY2hlLnNldChwYXRoLCBtYXliZVBhdGgpO1xuICB9XG5cbiAgcmV0dXJuIG1heWJlUGF0aDtcbn1cblxuLyoqXG4gKiBUaGUgbm8gY2FjaGUgdmVyc2lvbiBvZiB0aGUgbm9ybWFsaXplKCkgZnVuY3Rpb24uIFVzZWQgZm9yIGJlbmNobWFya2luZyBhbmQgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vQ2FjaGVOb3JtYWxpemUocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gIGlmIChwYXRoID09ICcnIHx8IHBhdGggPT0gJy4nKSB7XG4gICAgcmV0dXJuICcnIGFzIFBhdGg7XG4gIH0gZWxzZSBpZiAocGF0aCA9PSBOb3JtYWxpemVkUm9vdCkge1xuICAgIHJldHVybiBOb3JtYWxpemVkUm9vdDtcbiAgfVxuXG4gIC8vIE1hdGNoIGFic29sdXRlIHdpbmRvd3MgcGF0aC5cbiAgY29uc3Qgb3JpZ2luYWwgPSBwYXRoO1xuICBpZiAocGF0aC5tYXRjaCgvXltBLVpdOlsvXFxcXF0vaSkpIHtcbiAgICBwYXRoID0gJ1xcXFwnICsgcGF0aFswXSArICdcXFxcJyArIHBhdGguc2xpY2UoMyk7XG4gIH1cblxuICAvLyBXZSBjb252ZXJ0IFdpbmRvd3MgcGF0aHMgYXMgd2VsbCBoZXJlLlxuICBjb25zdCBwID0gcGF0aC5zcGxpdCgvWy9cXFxcXS9nKTtcbiAgbGV0IHJlbGF0aXZlID0gZmFsc2U7XG4gIGxldCBpID0gMTtcblxuICAvLyBTcGVjaWFsIGNhc2UgdGhlIGZpcnN0IG9uZS5cbiAgaWYgKHBbMF0gIT0gJycpIHtcbiAgICBwLnVuc2hpZnQoJy4nKTtcbiAgICByZWxhdGl2ZSA9IHRydWU7XG4gIH1cblxuICB3aGlsZSAoaSA8IHAubGVuZ3RoKSB7XG4gICAgaWYgKHBbaV0gPT0gJy4nKSB7XG4gICAgICBwLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKHBbaV0gPT0gJy4uJykge1xuICAgICAgaWYgKGkgPCAyICYmICFyZWxhdGl2ZSkge1xuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGhFeGNlcHRpb24ob3JpZ2luYWwpO1xuICAgICAgfSBlbHNlIGlmIChpID49IDIgJiYgcFtpIC0gMV0gIT0gJy4uJykge1xuICAgICAgICBwLnNwbGljZShpIC0gMSwgMik7XG4gICAgICAgIGktLTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBbaV0gPT0gJycpIHtcbiAgICAgIHAuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgaWYgKHAubGVuZ3RoID09IDEpIHtcbiAgICByZXR1cm4gcFswXSA9PSAnJyA/IE5vcm1hbGl6ZWRTZXAgOiAoJycgYXMgUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHBbMF0gPT0gJy4nKSB7XG4gICAgICBwLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHAuam9pbihOb3JtYWxpemVkU2VwKSBhcyBQYXRoO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBwYXRoOiBUZW1wbGF0ZVRhZzxQYXRoPiA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IHtcbiAgcmV0dXJuIG5vcm1hbGl6ZShTdHJpbmcucmF3KHN0cmluZ3MsIC4uLnZhbHVlcykpO1xufTtcblxuLy8gUGxhdGZvcm0tc3BlY2lmaWMgcGF0aHMuXG5leHBvcnQgdHlwZSBXaW5kb3dzUGF0aCA9IHN0cmluZyAmIHtcbiAgX19QUklWQVRFX0RFVktJVF9XSU5ET1dTX1BBVEg6IHZvaWQ7XG59O1xuZXhwb3J0IHR5cGUgUG9zaXhQYXRoID0gc3RyaW5nICYge1xuICBfX1BSSVZBVEVfREVWS0lUX1BPU0lYX1BBVEg6IHZvaWQ7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYXNXaW5kb3dzUGF0aChwYXRoOiBQYXRoKTogV2luZG93c1BhdGgge1xuICBjb25zdCBkcml2ZSA9IHBhdGgubWF0Y2goL15cXC8oXFx3KSg/OlxcLyguKikpPyQvKTtcbiAgaWYgKGRyaXZlKSB7XG4gICAgY29uc3Qgc3ViUGF0aCA9IGRyaXZlWzJdID8gZHJpdmVbMl0ucmVwbGFjZSgvXFwvL2csICdcXFxcJykgOiAnJztcblxuICAgIHJldHVybiBgJHtkcml2ZVsxXX06XFxcXCR7c3ViUGF0aH1gIGFzIFdpbmRvd3NQYXRoO1xuICB9XG5cbiAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFwvL2csICdcXFxcJykgYXMgV2luZG93c1BhdGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1Bvc2l4UGF0aChwYXRoOiBQYXRoKTogUG9zaXhQYXRoIHtcbiAgcmV0dXJuIHBhdGggYXMgc3RyaW5nIGFzIFBvc2l4UGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5c3RlbVBhdGgocGF0aDogUGF0aCk6IHN0cmluZyB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtLnN0YXJ0c1dpdGgoJ3dpbjMyJykpIHtcbiAgICByZXR1cm4gYXNXaW5kb3dzUGF0aChwYXRoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYXNQb3NpeFBhdGgocGF0aCk7XG4gIH1cbn1cbiJdfQ==