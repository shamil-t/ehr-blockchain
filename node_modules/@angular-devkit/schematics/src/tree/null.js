"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullTree = exports.NullTreeDirEntry = exports.CannotCreateFileException = void 0;
const core_1 = require("@angular-devkit/core");
const exception_1 = require("../exception/exception");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
class CannotCreateFileException extends core_1.BaseException {
    constructor(path) {
        super(`Cannot create file "${path}".`);
    }
}
exports.CannotCreateFileException = CannotCreateFileException;
class NullTreeDirEntry {
    get parent() {
        return this.path == '/' ? null : new NullTreeDirEntry((0, core_1.dirname)(this.path));
    }
    constructor(path) {
        this.path = path;
        this.subdirs = [];
        this.subfiles = [];
    }
    dir(name) {
        return new NullTreeDirEntry((0, core_1.join)(this.path, name));
    }
    file(_name) {
        return null;
    }
    visit() { }
}
exports.NullTreeDirEntry = NullTreeDirEntry;
class NullTree {
    constructor() {
        this.root = new NullTreeDirEntry((0, core_1.normalize)('/'));
    }
    [interface_1.TreeSymbol]() {
        return this;
    }
    branch() {
        return new NullTree();
    }
    merge(_other, _strategy) { }
    // Simple readonly file system operations.
    exists(_path) {
        return false;
    }
    read(_path) {
        return null;
    }
    readText(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    readJson(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    get(_path) {
        return null;
    }
    getDir(path) {
        return new NullTreeDirEntry((0, core_1.normalize)('/' + path));
    }
    visit() { }
    // Change content of host files.
    beginUpdate(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    commitUpdate(record) {
        throw new exception_1.FileDoesNotExistException(record instanceof recorder_1.UpdateRecorderBase ? record.path : '<unknown>');
    }
    // Change structure of the host.
    copy(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    delete(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    create(path, _content) {
        throw new CannotCreateFileException(path);
    }
    rename(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    overwrite(path, _content) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    apply(_action, _strategy) { }
    get actions() {
        return [];
    }
}
exports.NullTree = NullTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3RyZWUvbnVsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FROEI7QUFDOUIsc0RBQW1FO0FBRW5FLDJDQUF3RjtBQUN4Rix5Q0FBZ0Q7QUFFaEQsTUFBYSx5QkFBMEIsU0FBUSxvQkFBYTtJQUMxRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQUpELDhEQUlDO0FBRUQsTUFBYSxnQkFBZ0I7SUFDM0IsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRCxZQUE0QixJQUFVO1FBQVYsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUU3QixZQUFPLEdBQW1CLEVBQUUsQ0FBQztRQUM3QixhQUFRLEdBQW1CLEVBQUUsQ0FBQztJQUhFLENBQUM7SUFLMUMsR0FBRyxDQUFDLElBQWtCO1FBQ3BCLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELElBQUksQ0FBQyxLQUFtQjtRQUN0QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLEtBQUksQ0FBQztDQUNYO0FBbEJELDRDQWtCQztBQUVELE1BQWEsUUFBUTtJQUFyQjtRQVVXLFNBQUksR0FBYSxJQUFJLGdCQUFnQixDQUFDLElBQUEsZ0JBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBc0RqRSxDQUFDO0lBL0RDLENBQUMsc0JBQVUsQ0FBQztRQUNWLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU07UUFDSixPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUNELEtBQUssQ0FBQyxNQUFZLEVBQUUsU0FBeUIsSUFBUyxDQUFDO0lBSXZELDBDQUEwQztJQUMxQyxNQUFNLENBQUMsS0FBYTtRQUNsQixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDRCxJQUFJLENBQUMsS0FBYTtRQUNoQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxRQUFRLENBQUMsSUFBWTtRQUNuQixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFFBQVEsQ0FBQyxJQUFZO1FBQ25CLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsR0FBRyxDQUFDLEtBQWE7UUFDZixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWTtRQUNqQixPQUFPLElBQUksZ0JBQWdCLENBQUMsSUFBQSxnQkFBUyxFQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFDRCxLQUFLLEtBQUksQ0FBQztJQUVWLGdDQUFnQztJQUNoQyxXQUFXLENBQUMsSUFBWTtRQUN0QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFlBQVksQ0FBQyxNQUFzQjtRQUNqQyxNQUFNLElBQUkscUNBQXlCLENBQ2pDLE1BQU0sWUFBWSw2QkFBa0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUNqRSxDQUFDO0lBQ0osQ0FBQztJQUVELGdDQUFnQztJQUNoQyxJQUFJLENBQUMsSUFBWSxFQUFFLEdBQVc7UUFDNUIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWTtRQUNqQixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFZLEVBQUUsUUFBeUI7UUFDNUMsTUFBTSxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWSxFQUFFLEdBQVc7UUFDOUIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxTQUFTLENBQUMsSUFBWSxFQUFFLFFBQXlCO1FBQy9DLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQWUsRUFBRSxTQUF5QixJQUFTLENBQUM7SUFDMUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUFoRUQsNEJBZ0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJhc2VFeGNlcHRpb24sXG4gIEpzb25WYWx1ZSxcbiAgUGF0aCxcbiAgUGF0aEZyYWdtZW50LFxuICBkaXJuYW1lLFxuICBqb2luLFxuICBub3JtYWxpemUsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEFjdGlvbiB9IGZyb20gJy4vYWN0aW9uJztcbmltcG9ydCB7IERpckVudHJ5LCBNZXJnZVN0cmF0ZWd5LCBUcmVlLCBUcmVlU3ltYm9sLCBVcGRhdGVSZWNvcmRlciB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFVwZGF0ZVJlY29yZGVyQmFzZSB9IGZyb20gJy4vcmVjb3JkZXInO1xuXG5leHBvcnQgY2xhc3MgQ2Fubm90Q3JlYXRlRmlsZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2Fubm90IGNyZWF0ZSBmaWxlIFwiJHtwYXRofVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdWxsVHJlZURpckVudHJ5IGltcGxlbWVudHMgRGlyRW50cnkge1xuICBnZXQgcGFyZW50KCk6IERpckVudHJ5IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMucGF0aCA9PSAnLycgPyBudWxsIDogbmV3IE51bGxUcmVlRGlyRW50cnkoZGlybmFtZSh0aGlzLnBhdGgpKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBwYXRoOiBQYXRoKSB7fVxuXG4gIHJlYWRvbmx5IHN1YmRpcnM6IFBhdGhGcmFnbWVudFtdID0gW107XG4gIHJlYWRvbmx5IHN1YmZpbGVzOiBQYXRoRnJhZ21lbnRbXSA9IFtdO1xuXG4gIGRpcihuYW1lOiBQYXRoRnJhZ21lbnQpOiBEaXJFbnRyeSB7XG4gICAgcmV0dXJuIG5ldyBOdWxsVHJlZURpckVudHJ5KGpvaW4odGhpcy5wYXRoLCBuYW1lKSk7XG4gIH1cbiAgZmlsZShfbmFtZTogUGF0aEZyYWdtZW50KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2aXNpdCgpIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBOdWxsVHJlZSBpbXBsZW1lbnRzIFRyZWUge1xuICBbVHJlZVN5bWJvbF0oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBicmFuY2goKTogVHJlZSB7XG4gICAgcmV0dXJuIG5ldyBOdWxsVHJlZSgpO1xuICB9XG4gIG1lcmdlKF9vdGhlcjogVHJlZSwgX3N0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IHZvaWQge31cblxuICByZWFkb25seSByb290OiBEaXJFbnRyeSA9IG5ldyBOdWxsVHJlZURpckVudHJ5KG5vcm1hbGl6ZSgnLycpKTtcblxuICAvLyBTaW1wbGUgcmVhZG9ubHkgZmlsZSBzeXN0ZW0gb3BlcmF0aW9ucy5cbiAgZXhpc3RzKF9wYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmVhZChfcGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmVhZFRleHQocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICByZWFkSnNvbihwYXRoOiBzdHJpbmcpOiBKc29uVmFsdWUge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIGdldChfcGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0RGlyKHBhdGg6IHN0cmluZykge1xuICAgIHJldHVybiBuZXcgTnVsbFRyZWVEaXJFbnRyeShub3JtYWxpemUoJy8nICsgcGF0aCkpO1xuICB9XG4gIHZpc2l0KCkge31cblxuICAvLyBDaGFuZ2UgY29udGVudCBvZiBob3N0IGZpbGVzLlxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgY29tbWl0VXBkYXRlKHJlY29yZDogVXBkYXRlUmVjb3JkZXIpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24oXG4gICAgICByZWNvcmQgaW5zdGFuY2VvZiBVcGRhdGVSZWNvcmRlckJhc2UgPyByZWNvcmQucGF0aCA6ICc8dW5rbm93bj4nLFxuICAgICk7XG4gIH1cblxuICAvLyBDaGFuZ2Ugc3RydWN0dXJlIG9mIHRoZSBob3N0LlxuICBjb3B5KHBhdGg6IHN0cmluZywgX3RvOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgZGVsZXRlKHBhdGg6IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBfY29udGVudDogQnVmZmVyIHwgc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBDYW5ub3RDcmVhdGVGaWxlRXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIHJlbmFtZShwYXRoOiBzdHJpbmcsIF90bzogc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIF9jb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cblxuICBhcHBseShfYWN0aW9uOiBBY3Rpb24sIF9zdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHt9XG4gIGdldCBhY3Rpb25zKCk6IEFjdGlvbltdIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cbiJdfQ==