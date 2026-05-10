"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathIsFileException = exports.PathIsDirectoryException = exports.FileAlreadyExistException = exports.FileDoesNotExistException = exports.UnknownException = exports.BaseException = void 0;
class BaseException extends Error {
    constructor(message = '') {
        super(message);
    }
}
exports.BaseException = BaseException;
class UnknownException extends BaseException {
    constructor(message) {
        super(message);
    }
}
exports.UnknownException = UnknownException;
// Exceptions
class FileDoesNotExistException extends BaseException {
    constructor(path) {
        super(`Path "${path}" does not exist.`);
    }
}
exports.FileDoesNotExistException = FileDoesNotExistException;
class FileAlreadyExistException extends BaseException {
    constructor(path) {
        super(`Path "${path}" already exist.`);
    }
}
exports.FileAlreadyExistException = FileAlreadyExistException;
class PathIsDirectoryException extends BaseException {
    constructor(path) {
        super(`Path "${path}" is a directory.`);
    }
}
exports.PathIsDirectoryException = PathIsDirectoryException;
class PathIsFileException extends BaseException {
    constructor(path) {
        super(`Path "${path}" is a file.`);
    }
}
exports.PathIsFileException = PathIsFileException;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZXB0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvZXhjZXB0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILE1BQWEsYUFBYyxTQUFRLEtBQUs7SUFDdEMsWUFBWSxPQUFPLEdBQUcsRUFBRTtRQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBSkQsc0NBSUM7QUFFRCxNQUFhLGdCQUFpQixTQUFRLGFBQWE7SUFDakQsWUFBWSxPQUFlO1FBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUFKRCw0Q0FJQztBQUVELGFBQWE7QUFDYixNQUFhLHlCQUEwQixTQUFRLGFBQWE7SUFDMUQsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxTQUFTLElBQUksbUJBQW1CLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFKRCw4REFJQztBQUNELE1BQWEseUJBQTBCLFNBQVEsYUFBYTtJQUMxRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFNBQVMsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQUpELDhEQUlDO0FBQ0QsTUFBYSx3QkFBeUIsU0FBUSxhQUFhO0lBQ3pELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsU0FBUyxJQUFJLG1CQUFtQixDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBSkQsNERBSUM7QUFDRCxNQUFhLG1CQUFvQixTQUFRLGFBQWE7SUFDcEQsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUNGO0FBSkQsa0RBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGNsYXNzIEJhc2VFeGNlcHRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UgPSAnJykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbi8vIEV4Y2VwdGlvbnNcbmV4cG9ydCBjbGFzcyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBQYXRoIFwiJHtwYXRofVwiIGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGF0aCBcIiR7cGF0aH1cIiBhbHJlYWR5IGV4aXN0LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgUGF0aElzRGlyZWN0b3J5RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBQYXRoIFwiJHtwYXRofVwiIGlzIGEgZGlyZWN0b3J5LmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgUGF0aElzRmlsZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGF0aCBcIiR7cGF0aH1cIiBpcyBhIGZpbGUuYCk7XG4gIH1cbn1cbiJdfQ==