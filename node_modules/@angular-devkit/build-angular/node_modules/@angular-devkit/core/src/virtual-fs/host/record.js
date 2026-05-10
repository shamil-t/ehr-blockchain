"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CordHost = void 0;
const rxjs_1 = require("rxjs");
const exception_1 = require("../../exception");
const memory_1 = require("./memory");
/**
 * A Host that records changes to the underlying Host, while keeping a record of Create, Overwrite,
 * Rename and Delete of files.
 *
 * This is fully compatible with Host, but will keep a staging of every changes asked. That staging
 * follows the principle of the Tree (e.g. can create a file that already exists).
 *
 * Using `create()` and `overwrite()` will force those operations, but using `write` will add
 * the create/overwrite records IIF the files does/doesn't already exist.
 */
class CordHost extends memory_1.SimpleMemoryHost {
    constructor(_back) {
        super();
        this._back = _back;
        this._filesToCreate = new Set();
        this._filesToRename = new Map();
        this._filesToRenameRevert = new Map();
        this._filesToDelete = new Set();
        this._filesToOverwrite = new Set();
    }
    get backend() {
        return this._back;
    }
    get capabilities() {
        // Our own host is always Synchronous, but the backend might not be.
        return {
            synchronous: this._back.capabilities.synchronous,
        };
    }
    /**
     * Create a copy of this host, including all actions made.
     * @returns {CordHost} The carbon copy.
     */
    clone() {
        const dolly = new CordHost(this._back);
        dolly._cache = new Map(this._cache);
        dolly._filesToCreate = new Set(this._filesToCreate);
        dolly._filesToRename = new Map(this._filesToRename);
        dolly._filesToRenameRevert = new Map(this._filesToRenameRevert);
        dolly._filesToDelete = new Set(this._filesToDelete);
        dolly._filesToOverwrite = new Set(this._filesToOverwrite);
        return dolly;
    }
    /**
     * Commit the changes recorded to a Host. It is assumed that the host does have the same structure
     * as the host that was used for backend (could be the same host).
     * @param host The host to create/delete/rename/overwrite files to.
     * @param force Whether to skip existence checks when creating/overwriting. This is
     *   faster but might lead to incorrect states. Because Hosts natively don't support creation
     *   versus overwriting (it's only writing), we check for existence before completing a request.
     * @returns An observable that completes when done, or error if an error occured.
     */
    commit(host, force = false) {
        // Really commit everything to the actual host.
        return (0, rxjs_1.from)(this.records()).pipe((0, rxjs_1.concatMap)((record) => {
            switch (record.kind) {
                case 'delete':
                    return host.delete(record.path);
                case 'rename':
                    return host.rename(record.from, record.to);
                case 'create':
                    return host.exists(record.path).pipe((0, rxjs_1.switchMap)((exists) => {
                        if (exists && !force) {
                            return (0, rxjs_1.throwError)(new exception_1.FileAlreadyExistException(record.path));
                        }
                        else {
                            return host.write(record.path, record.content);
                        }
                    }));
                case 'overwrite':
                    return host.exists(record.path).pipe((0, rxjs_1.switchMap)((exists) => {
                        if (!exists && !force) {
                            return (0, rxjs_1.throwError)(new exception_1.FileDoesNotExistException(record.path));
                        }
                        else {
                            return host.write(record.path, record.content);
                        }
                    }));
            }
        }), (0, rxjs_1.reduce)(() => { }));
    }
    records() {
        return [
            ...[...this._filesToDelete.values()].map((path) => ({
                kind: 'delete',
                path,
            })),
            ...[...this._filesToRename.entries()].map(([from, to]) => ({
                kind: 'rename',
                from,
                to,
            })),
            ...[...this._filesToCreate.values()].map((path) => ({
                kind: 'create',
                path,
                content: this._read(path),
            })),
            ...[...this._filesToOverwrite.values()].map((path) => ({
                kind: 'overwrite',
                path,
                content: this._read(path),
            })),
        ];
    }
    /**
     * Specialized version of {@link CordHost#write} which forces the creation of a file whether it
     * exists or not.
     * @param {} path
     * @param {FileBuffer} content
     * @returns {Observable<void>}
     */
    create(path, content) {
        if (super._exists(path)) {
            throw new exception_1.FileAlreadyExistException(path);
        }
        if (this._filesToDelete.has(path)) {
            this._filesToDelete.delete(path);
            this._filesToOverwrite.add(path);
        }
        else {
            this._filesToCreate.add(path);
        }
        return super.write(path, content);
    }
    overwrite(path, content) {
        return this.isDirectory(path).pipe((0, rxjs_1.switchMap)((isDir) => {
            if (isDir) {
                return (0, rxjs_1.throwError)(new exception_1.PathIsDirectoryException(path));
            }
            return this.exists(path);
        }), (0, rxjs_1.switchMap)((exists) => {
            if (!exists) {
                return (0, rxjs_1.throwError)(new exception_1.FileDoesNotExistException(path));
            }
            if (!this._filesToCreate.has(path)) {
                this._filesToOverwrite.add(path);
            }
            return super.write(path, content);
        }));
    }
    write(path, content) {
        return this.exists(path).pipe((0, rxjs_1.switchMap)((exists) => {
            if (exists) {
                // It exists, but might be being renamed or deleted. In that case we want to create it.
                if (this.willRename(path) || this.willDelete(path)) {
                    return this.create(path, content);
                }
                else {
                    return this.overwrite(path, content);
                }
            }
            else {
                return this.create(path, content);
            }
        }));
    }
    read(path) {
        if (this._exists(path)) {
            return super.read(path);
        }
        return this._back.read(path);
    }
    delete(path) {
        if (this._exists(path)) {
            if (this._filesToCreate.has(path)) {
                this._filesToCreate.delete(path);
            }
            else if (this._filesToOverwrite.has(path)) {
                this._filesToOverwrite.delete(path);
                this._filesToDelete.add(path);
            }
            else {
                const maybeOrigin = this._filesToRenameRevert.get(path);
                if (maybeOrigin) {
                    this._filesToRenameRevert.delete(path);
                    this._filesToRename.delete(maybeOrigin);
                    this._filesToDelete.add(maybeOrigin);
                }
                else {
                    return (0, rxjs_1.throwError)(new exception_1.UnknownException(`This should never happen. Path: ${JSON.stringify(path)}.`));
                }
            }
            return super.delete(path);
        }
        else {
            return this._back.exists(path).pipe((0, rxjs_1.switchMap)((exists) => {
                if (exists) {
                    this._filesToDelete.add(path);
                    return (0, rxjs_1.of)();
                }
                else {
                    return (0, rxjs_1.throwError)(new exception_1.FileDoesNotExistException(path));
                }
            }));
        }
    }
    rename(from, to) {
        return (0, rxjs_1.concat)(this.exists(to), this.exists(from)).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.switchMap)(([existTo, existFrom]) => {
            if (!existFrom) {
                return (0, rxjs_1.throwError)(new exception_1.FileDoesNotExistException(from));
            }
            if (from === to) {
                return rxjs_1.EMPTY;
            }
            if (existTo) {
                return (0, rxjs_1.throwError)(new exception_1.FileAlreadyExistException(to));
            }
            // If we're renaming a file that's been created, shortcircuit to creating the `to` path.
            if (this._filesToCreate.has(from)) {
                this._filesToCreate.delete(from);
                this._filesToCreate.add(to);
                return super.rename(from, to);
            }
            if (this._filesToOverwrite.has(from)) {
                this._filesToOverwrite.delete(from);
                // Recursively call this function. This is so we don't repeat the bottom logic. This
                // if will be by-passed because we just deleted the `from` path from files to overwrite.
                return (0, rxjs_1.concat)(this.rename(from, to), new rxjs_1.Observable((x) => {
                    this._filesToOverwrite.add(to);
                    x.complete();
                }));
            }
            if (this._filesToDelete.has(to)) {
                this._filesToDelete.delete(to);
                this._filesToDelete.add(from);
                this._filesToOverwrite.add(to);
                // We need to delete the original and write the new one.
                return this.read(from).pipe((0, rxjs_1.map)((content) => this._write(to, content)));
            }
            const maybeTo1 = this._filesToRenameRevert.get(from);
            if (maybeTo1) {
                // We already renamed to this file (A => from), let's rename the former to the new
                // path (A => to).
                this._filesToRename.delete(maybeTo1);
                this._filesToRenameRevert.delete(from);
                from = maybeTo1;
            }
            this._filesToRename.set(from, to);
            this._filesToRenameRevert.set(to, from);
            // If the file is part of our data, just rename it internally.
            if (this._exists(from)) {
                return super.rename(from, to);
            }
            else {
                // Create a file with the same content.
                return this._back.read(from).pipe((0, rxjs_1.switchMap)((content) => super.write(to, content)));
            }
        }));
    }
    list(path) {
        return (0, rxjs_1.concat)(super.list(path), this._back.list(path)).pipe((0, rxjs_1.reduce)((list, curr) => {
            curr.forEach((elem) => list.add(elem));
            return list;
        }, new Set()), (0, rxjs_1.map)((set) => [...set]));
    }
    exists(path) {
        return this._exists(path)
            ? (0, rxjs_1.of)(true)
            : this.willDelete(path) || this.willRename(path)
                ? (0, rxjs_1.of)(false)
                : this._back.exists(path);
    }
    isDirectory(path) {
        return this._exists(path) ? super.isDirectory(path) : this._back.isDirectory(path);
    }
    isFile(path) {
        return this._exists(path)
            ? super.isFile(path)
            : this.willDelete(path) || this.willRename(path)
                ? (0, rxjs_1.of)(false)
                : this._back.isFile(path);
    }
    stat(path) {
        return this._exists(path)
            ? super.stat(path)
            : this.willDelete(path) || this.willRename(path)
                ? (0, rxjs_1.of)(null)
                : this._back.stat(path);
    }
    watch(path, options) {
        // Watching not supported.
        return null;
    }
    willCreate(path) {
        return this._filesToCreate.has(path);
    }
    willOverwrite(path) {
        return this._filesToOverwrite.has(path);
    }
    willDelete(path) {
        return this._filesToDelete.has(path);
    }
    willRename(path) {
        return this._filesToRename.has(path);
    }
    willRenameTo(path, to) {
        return this._filesToRename.get(path) === to;
    }
}
exports.CordHost = CordHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3JlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFZYztBQUNkLCtDQUt5QjtBQVV6QixxQ0FBNEM7QUF1QjVDOzs7Ozs7Ozs7R0FTRztBQUNILE1BQWEsUUFBUyxTQUFRLHlCQUFnQjtJQU81QyxZQUFzQixLQUFtQjtRQUN2QyxLQUFLLEVBQUUsQ0FBQztRQURZLFVBQUssR0FBTCxLQUFLLENBQWM7UUFOL0IsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBUSxDQUFDO1FBQ2pDLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztRQUN2Qyx5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO1FBQzdDLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVEsQ0FBQztRQUNqQyxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBUSxDQUFDO0lBSTlDLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQWEsWUFBWTtRQUN2QixvRUFBb0U7UUFDcEUsT0FBTztZQUNMLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXO1NBQ2pELENBQUM7SUFDSixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSztRQUNILE1BQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV2QyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRCxLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRCxLQUFLLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDaEUsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsS0FBSyxDQUFDLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRTFELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsTUFBTSxDQUFDLElBQVUsRUFBRSxLQUFLLEdBQUcsS0FBSztRQUM5QiwrQ0FBK0M7UUFDL0MsT0FBTyxJQUFBLFdBQWMsRUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQ3hDLElBQUEsZ0JBQVMsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ25CLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRTtnQkFDbkIsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLEtBQUssUUFBUTtvQkFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdDLEtBQUssUUFBUTtvQkFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDbEMsSUFBQSxnQkFBUyxFQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7d0JBQ25CLElBQUksTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFOzRCQUNwQixPQUFPLElBQUEsaUJBQVUsRUFBQyxJQUFJLHFDQUF5QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO3lCQUMvRDs2QkFBTTs0QkFDTCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQ2hEO29CQUNILENBQUMsQ0FBQyxDQUNILENBQUM7Z0JBQ0osS0FBSyxXQUFXO29CQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUNsQyxJQUFBLGdCQUFTLEVBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTt3QkFDbkIsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRTs0QkFDckIsT0FBTyxJQUFBLGlCQUFVLEVBQUMsSUFBSSxxQ0FBeUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt5QkFDL0Q7NkJBQU07NEJBQ0wsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3lCQUNoRDtvQkFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO2FBQ0w7UUFDSCxDQUFDLENBQUMsRUFDRixJQUFBLGFBQU0sRUFBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FDakIsQ0FBQztJQUNKLENBQUM7SUFFRCxPQUFPO1FBQ0wsT0FBTztZQUNMLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQ3RDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDUCxDQUFDO2dCQUNDLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUk7YUFDYyxDQUFBLENBQ3ZCO1lBQ0QsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FDdkMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQ2IsQ0FBQztnQkFDQyxJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJO2dCQUNKLEVBQUU7YUFDZ0IsQ0FBQSxDQUN2QjtZQUNELEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQ3RDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDUCxDQUFDO2dCQUNDLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUk7Z0JBQ0osT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQ1AsQ0FBQSxDQUN2QjtZQUNELEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FDekMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUNQLENBQUM7Z0JBQ0MsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUk7Z0JBQ0osT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQ1AsQ0FBQSxDQUN2QjtTQUNGLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLElBQVUsRUFBRSxPQUFtQjtRQUNwQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNDO1FBRUQsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xDO2FBQU07WUFDTCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMvQjtRQUVELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELFNBQVMsQ0FBQyxJQUFVLEVBQUUsT0FBbUI7UUFDdkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDaEMsSUFBQSxnQkFBUyxFQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDbEIsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsT0FBTyxJQUFBLGlCQUFVLEVBQUMsSUFBSSxvQ0FBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3ZEO1lBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxFQUNGLElBQUEsZ0JBQVMsRUFBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ25CLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ1gsT0FBTyxJQUFBLGlCQUFVLEVBQUMsSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3hEO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xDO1lBRUQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUVRLEtBQUssQ0FBQyxJQUFVLEVBQUUsT0FBbUI7UUFDNUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDM0IsSUFBQSxnQkFBUyxFQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbkIsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsdUZBQXVGO2dCQUN2RixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbEQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDbkM7cUJBQU07b0JBQ0wsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDdEM7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQ25DO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFUSxJQUFJLENBQUMsSUFBVTtRQUN0QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRVEsTUFBTSxDQUFDLElBQVU7UUFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xDO2lCQUFNLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDL0I7aUJBQU07Z0JBQ0wsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxXQUFXLEVBQUU7b0JBQ2YsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2lCQUN0QztxQkFBTTtvQkFDTCxPQUFPLElBQUEsaUJBQVUsRUFDZixJQUFJLDRCQUFnQixDQUFDLG1DQUFtQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FDakYsQ0FBQztpQkFDSDthQUNGO1lBRUQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNCO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDakMsSUFBQSxnQkFBUyxFQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ25CLElBQUksTUFBTSxFQUFFO29CQUNWLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUU5QixPQUFPLElBQUEsU0FBRSxHQUFRLENBQUM7aUJBQ25CO3FCQUFNO29CQUNMLE9BQU8sSUFBQSxpQkFBVSxFQUFDLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDeEQ7WUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBRVEsTUFBTSxDQUFDLElBQVUsRUFBRSxFQUFRO1FBQ2xDLE9BQU8sSUFBQSxhQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNwRCxJQUFBLGNBQU8sR0FBRSxFQUNULElBQUEsZ0JBQVMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUU7WUFDakMsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxPQUFPLElBQUEsaUJBQVUsRUFBQyxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDeEQ7WUFDRCxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7Z0JBQ2YsT0FBTyxZQUFLLENBQUM7YUFDZDtZQUVELElBQUksT0FBTyxFQUFFO2dCQUNYLE9BQU8sSUFBQSxpQkFBVSxFQUFDLElBQUkscUNBQXlCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN0RDtZQUVELHdGQUF3RjtZQUN4RixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTVCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7YUFDL0I7WUFDRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXBDLG9GQUFvRjtnQkFDcEYsd0ZBQXdGO2dCQUN4RixPQUFPLElBQUEsYUFBTSxFQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNyQixJQUFJLGlCQUFVLENBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDMUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDL0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUNILENBQUM7YUFDSDtZQUNELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFL0Isd0RBQXdEO2dCQUN4RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUEsVUFBRyxFQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDekU7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JELElBQUksUUFBUSxFQUFFO2dCQUNaLGtGQUFrRjtnQkFDbEYsa0JBQWtCO2dCQUNsQixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxHQUFHLFFBQVEsQ0FBQzthQUNqQjtZQUVELElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV4Qyw4REFBOEQ7WUFDOUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN0QixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQy9CO2lCQUFNO2dCQUNMLHVDQUF1QztnQkFDdkMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBQSxnQkFBUyxFQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckY7UUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUVRLElBQUksQ0FBQyxJQUFVO1FBQ3RCLE9BQU8sSUFBQSxhQUFNLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDekQsSUFBQSxhQUFNLEVBQUMsQ0FBQyxJQUF1QixFQUFFLElBQW9CLEVBQUUsRUFBRTtZQUN2RCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdkMsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQWdCLENBQUMsRUFDM0IsSUFBQSxVQUFHLEVBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUN2QixDQUFDO0lBQ0osQ0FBQztJQUVRLE1BQU0sQ0FBQyxJQUFVO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDdkIsQ0FBQyxDQUFDLElBQUEsU0FBRSxFQUFDLElBQUksQ0FBQztZQUNWLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNoRCxDQUFDLENBQUMsSUFBQSxTQUFFLEVBQUMsS0FBSyxDQUFDO2dCQUNYLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ1EsV0FBVyxDQUFDLElBQVU7UUFDN0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBQ1EsTUFBTSxDQUFDLElBQVU7UUFDeEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUN2QixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDcEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hELENBQUMsQ0FBQyxJQUFBLFNBQUUsRUFBQyxLQUFLLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFUSxJQUFJLENBQUMsSUFBVTtRQUN0QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNsQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQkFDaEQsQ0FBQyxDQUFDLElBQUEsU0FBRSxFQUFDLElBQUksQ0FBQztnQkFDVixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVRLEtBQUssQ0FBQyxJQUFVLEVBQUUsT0FBMEI7UUFDbkQsMEJBQTBCO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFVBQVUsQ0FBQyxJQUFVO1FBQ25CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUNELGFBQWEsQ0FBQyxJQUFVO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBQ0QsVUFBVSxDQUFDLElBQVU7UUFDbkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsVUFBVSxDQUFDLElBQVU7UUFDbkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsWUFBWSxDQUFDLElBQVUsRUFBRSxFQUFRO1FBQy9CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzlDLENBQUM7Q0FDRjtBQTVWRCw0QkE0VkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRU1QVFksXG4gIE9ic2VydmFibGUsXG4gIGNvbmNhdCxcbiAgY29uY2F0TWFwLFxuICBtYXAsXG4gIGZyb20gYXMgb2JzZXJ2YWJsZUZyb20sXG4gIG9mLFxuICByZWR1Y2UsXG4gIHN3aXRjaE1hcCxcbiAgdGhyb3dFcnJvcixcbiAgdG9BcnJheSxcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uLFxuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBQYXRoSXNEaXJlY3RvcnlFeGNlcHRpb24sXG4gIFVua25vd25FeGNlcHRpb24sXG59IGZyb20gJy4uLy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXRoLCBQYXRoRnJhZ21lbnQgfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7XG4gIEZpbGVCdWZmZXIsXG4gIEhvc3QsXG4gIEhvc3RDYXBhYmlsaXRpZXMsXG4gIEhvc3RXYXRjaE9wdGlvbnMsXG4gIFJlYWRvbmx5SG9zdCxcbiAgU3RhdHMsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFNpbXBsZU1lbW9yeUhvc3QgfSBmcm9tICcuL21lbW9yeSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29yZEhvc3RDcmVhdGUge1xuICBraW5kOiAnY3JlYXRlJztcbiAgcGF0aDogUGF0aDtcbiAgY29udGVudDogRmlsZUJ1ZmZlcjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgQ29yZEhvc3RPdmVyd3JpdGUge1xuICBraW5kOiAnb3ZlcndyaXRlJztcbiAgcGF0aDogUGF0aDtcbiAgY29udGVudDogRmlsZUJ1ZmZlcjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgQ29yZEhvc3RSZW5hbWUge1xuICBraW5kOiAncmVuYW1lJztcbiAgZnJvbTogUGF0aDtcbiAgdG86IFBhdGg7XG59XG5leHBvcnQgaW50ZXJmYWNlIENvcmRIb3N0RGVsZXRlIHtcbiAga2luZDogJ2RlbGV0ZSc7XG4gIHBhdGg6IFBhdGg7XG59XG5leHBvcnQgdHlwZSBDb3JkSG9zdFJlY29yZCA9IENvcmRIb3N0Q3JlYXRlIHwgQ29yZEhvc3RPdmVyd3JpdGUgfCBDb3JkSG9zdFJlbmFtZSB8IENvcmRIb3N0RGVsZXRlO1xuXG4vKipcbiAqIEEgSG9zdCB0aGF0IHJlY29yZHMgY2hhbmdlcyB0byB0aGUgdW5kZXJseWluZyBIb3N0LCB3aGlsZSBrZWVwaW5nIGEgcmVjb3JkIG9mIENyZWF0ZSwgT3ZlcndyaXRlLFxuICogUmVuYW1lIGFuZCBEZWxldGUgb2YgZmlsZXMuXG4gKlxuICogVGhpcyBpcyBmdWxseSBjb21wYXRpYmxlIHdpdGggSG9zdCwgYnV0IHdpbGwga2VlcCBhIHN0YWdpbmcgb2YgZXZlcnkgY2hhbmdlcyBhc2tlZC4gVGhhdCBzdGFnaW5nXG4gKiBmb2xsb3dzIHRoZSBwcmluY2lwbGUgb2YgdGhlIFRyZWUgKGUuZy4gY2FuIGNyZWF0ZSBhIGZpbGUgdGhhdCBhbHJlYWR5IGV4aXN0cykuXG4gKlxuICogVXNpbmcgYGNyZWF0ZSgpYCBhbmQgYG92ZXJ3cml0ZSgpYCB3aWxsIGZvcmNlIHRob3NlIG9wZXJhdGlvbnMsIGJ1dCB1c2luZyBgd3JpdGVgIHdpbGwgYWRkXG4gKiB0aGUgY3JlYXRlL292ZXJ3cml0ZSByZWNvcmRzIElJRiB0aGUgZmlsZXMgZG9lcy9kb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb3JkSG9zdCBleHRlbmRzIFNpbXBsZU1lbW9yeUhvc3Qge1xuICBwcm90ZWN0ZWQgX2ZpbGVzVG9DcmVhdGUgPSBuZXcgU2V0PFBhdGg+KCk7XG4gIHByb3RlY3RlZCBfZmlsZXNUb1JlbmFtZSA9IG5ldyBNYXA8UGF0aCwgUGF0aD4oKTtcbiAgcHJvdGVjdGVkIF9maWxlc1RvUmVuYW1lUmV2ZXJ0ID0gbmV3IE1hcDxQYXRoLCBQYXRoPigpO1xuICBwcm90ZWN0ZWQgX2ZpbGVzVG9EZWxldGUgPSBuZXcgU2V0PFBhdGg+KCk7XG4gIHByb3RlY3RlZCBfZmlsZXNUb092ZXJ3cml0ZSA9IG5ldyBTZXQ8UGF0aD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2JhY2s6IFJlYWRvbmx5SG9zdCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBnZXQgYmFja2VuZCgpOiBSZWFkb25seUhvc3Qge1xuICAgIHJldHVybiB0aGlzLl9iYWNrO1xuICB9XG4gIG92ZXJyaWRlIGdldCBjYXBhYmlsaXRpZXMoKTogSG9zdENhcGFiaWxpdGllcyB7XG4gICAgLy8gT3VyIG93biBob3N0IGlzIGFsd2F5cyBTeW5jaHJvbm91cywgYnV0IHRoZSBiYWNrZW5kIG1pZ2h0IG5vdCBiZS5cbiAgICByZXR1cm4ge1xuICAgICAgc3luY2hyb25vdXM6IHRoaXMuX2JhY2suY2FwYWJpbGl0aWVzLnN5bmNocm9ub3VzLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgY29weSBvZiB0aGlzIGhvc3QsIGluY2x1ZGluZyBhbGwgYWN0aW9ucyBtYWRlLlxuICAgKiBAcmV0dXJucyB7Q29yZEhvc3R9IFRoZSBjYXJib24gY29weS5cbiAgICovXG4gIGNsb25lKCk6IENvcmRIb3N0IHtcbiAgICBjb25zdCBkb2xseSA9IG5ldyBDb3JkSG9zdCh0aGlzLl9iYWNrKTtcblxuICAgIGRvbGx5Ll9jYWNoZSA9IG5ldyBNYXAodGhpcy5fY2FjaGUpO1xuICAgIGRvbGx5Ll9maWxlc1RvQ3JlYXRlID0gbmV3IFNldCh0aGlzLl9maWxlc1RvQ3JlYXRlKTtcbiAgICBkb2xseS5fZmlsZXNUb1JlbmFtZSA9IG5ldyBNYXAodGhpcy5fZmlsZXNUb1JlbmFtZSk7XG4gICAgZG9sbHkuX2ZpbGVzVG9SZW5hbWVSZXZlcnQgPSBuZXcgTWFwKHRoaXMuX2ZpbGVzVG9SZW5hbWVSZXZlcnQpO1xuICAgIGRvbGx5Ll9maWxlc1RvRGVsZXRlID0gbmV3IFNldCh0aGlzLl9maWxlc1RvRGVsZXRlKTtcbiAgICBkb2xseS5fZmlsZXNUb092ZXJ3cml0ZSA9IG5ldyBTZXQodGhpcy5fZmlsZXNUb092ZXJ3cml0ZSk7XG5cbiAgICByZXR1cm4gZG9sbHk7XG4gIH1cblxuICAvKipcbiAgICogQ29tbWl0IHRoZSBjaGFuZ2VzIHJlY29yZGVkIHRvIGEgSG9zdC4gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBob3N0IGRvZXMgaGF2ZSB0aGUgc2FtZSBzdHJ1Y3R1cmVcbiAgICogYXMgdGhlIGhvc3QgdGhhdCB3YXMgdXNlZCBmb3IgYmFja2VuZCAoY291bGQgYmUgdGhlIHNhbWUgaG9zdCkuXG4gICAqIEBwYXJhbSBob3N0IFRoZSBob3N0IHRvIGNyZWF0ZS9kZWxldGUvcmVuYW1lL292ZXJ3cml0ZSBmaWxlcyB0by5cbiAgICogQHBhcmFtIGZvcmNlIFdoZXRoZXIgdG8gc2tpcCBleGlzdGVuY2UgY2hlY2tzIHdoZW4gY3JlYXRpbmcvb3ZlcndyaXRpbmcuIFRoaXMgaXNcbiAgICogICBmYXN0ZXIgYnV0IG1pZ2h0IGxlYWQgdG8gaW5jb3JyZWN0IHN0YXRlcy4gQmVjYXVzZSBIb3N0cyBuYXRpdmVseSBkb24ndCBzdXBwb3J0IGNyZWF0aW9uXG4gICAqICAgdmVyc3VzIG92ZXJ3cml0aW5nIChpdCdzIG9ubHkgd3JpdGluZyksIHdlIGNoZWNrIGZvciBleGlzdGVuY2UgYmVmb3JlIGNvbXBsZXRpbmcgYSByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgY29tcGxldGVzIHdoZW4gZG9uZSwgb3IgZXJyb3IgaWYgYW4gZXJyb3Igb2NjdXJlZC5cbiAgICovXG4gIGNvbW1pdChob3N0OiBIb3N0LCBmb3JjZSA9IGZhbHNlKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgLy8gUmVhbGx5IGNvbW1pdCBldmVyeXRoaW5nIHRvIHRoZSBhY3R1YWwgaG9zdC5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZUZyb20odGhpcy5yZWNvcmRzKCkpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKHJlY29yZCkgPT4ge1xuICAgICAgICBzd2l0Y2ggKHJlY29yZC5raW5kKSB7XG4gICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgIHJldHVybiBob3N0LmRlbGV0ZShyZWNvcmQucGF0aCk7XG4gICAgICAgICAgY2FzZSAncmVuYW1lJzpcbiAgICAgICAgICAgIHJldHVybiBob3N0LnJlbmFtZShyZWNvcmQuZnJvbSwgcmVjb3JkLnRvKTtcbiAgICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgICAgcmV0dXJuIGhvc3QuZXhpc3RzKHJlY29yZC5wYXRoKS5waXBlKFxuICAgICAgICAgICAgICBzd2l0Y2hNYXAoKGV4aXN0cykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChleGlzdHMgJiYgIWZvcmNlKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihyZWNvcmQucGF0aCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gaG9zdC53cml0ZShyZWNvcmQucGF0aCwgcmVjb3JkLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGNhc2UgJ292ZXJ3cml0ZSc6XG4gICAgICAgICAgICByZXR1cm4gaG9zdC5leGlzdHMocmVjb3JkLnBhdGgpLnBpcGUoXG4gICAgICAgICAgICAgIHN3aXRjaE1hcCgoZXhpc3RzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdHMgJiYgIWZvcmNlKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihyZWNvcmQucGF0aCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gaG9zdC53cml0ZShyZWNvcmQucGF0aCwgcmVjb3JkLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIHJlZHVjZSgoKSA9PiB7fSksXG4gICAgKTtcbiAgfVxuXG4gIHJlY29yZHMoKTogQ29yZEhvc3RSZWNvcmRbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLlsuLi50aGlzLl9maWxlc1RvRGVsZXRlLnZhbHVlcygpXS5tYXAoXG4gICAgICAgIChwYXRoKSA9PlxuICAgICAgICAgICh7XG4gICAgICAgICAgICBraW5kOiAnZGVsZXRlJyxcbiAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgfSBhcyBDb3JkSG9zdFJlY29yZCksXG4gICAgICApLFxuICAgICAgLi4uWy4uLnRoaXMuX2ZpbGVzVG9SZW5hbWUuZW50cmllcygpXS5tYXAoXG4gICAgICAgIChbZnJvbSwgdG9dKSA9PlxuICAgICAgICAgICh7XG4gICAgICAgICAgICBraW5kOiAncmVuYW1lJyxcbiAgICAgICAgICAgIGZyb20sXG4gICAgICAgICAgICB0byxcbiAgICAgICAgICB9IGFzIENvcmRIb3N0UmVjb3JkKSxcbiAgICAgICksXG4gICAgICAuLi5bLi4udGhpcy5fZmlsZXNUb0NyZWF0ZS52YWx1ZXMoKV0ubWFwKFxuICAgICAgICAocGF0aCkgPT5cbiAgICAgICAgICAoe1xuICAgICAgICAgICAga2luZDogJ2NyZWF0ZScsXG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgY29udGVudDogdGhpcy5fcmVhZChwYXRoKSxcbiAgICAgICAgICB9IGFzIENvcmRIb3N0UmVjb3JkKSxcbiAgICAgICksXG4gICAgICAuLi5bLi4udGhpcy5fZmlsZXNUb092ZXJ3cml0ZS52YWx1ZXMoKV0ubWFwKFxuICAgICAgICAocGF0aCkgPT5cbiAgICAgICAgICAoe1xuICAgICAgICAgICAga2luZDogJ292ZXJ3cml0ZScsXG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgY29udGVudDogdGhpcy5fcmVhZChwYXRoKSxcbiAgICAgICAgICB9IGFzIENvcmRIb3N0UmVjb3JkKSxcbiAgICAgICksXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTcGVjaWFsaXplZCB2ZXJzaW9uIG9mIHtAbGluayBDb3JkSG9zdCN3cml0ZX0gd2hpY2ggZm9yY2VzIHRoZSBjcmVhdGlvbiBvZiBhIGZpbGUgd2hldGhlciBpdFxuICAgKiBleGlzdHMgb3Igbm90LlxuICAgKiBAcGFyYW0ge30gcGF0aFxuICAgKiBAcGFyYW0ge0ZpbGVCdWZmZXJ9IGNvbnRlbnRcbiAgICogQHJldHVybnMge09ic2VydmFibGU8dm9pZD59XG4gICAqL1xuICBjcmVhdGUocGF0aDogUGF0aCwgY29udGVudDogRmlsZUJ1ZmZlcik6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGlmIChzdXBlci5fZXhpc3RzKHBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZmlsZXNUb0RlbGV0ZS5oYXMocGF0aCkpIHtcbiAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuZGVsZXRlKHBhdGgpO1xuICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5hZGQocGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2ZpbGVzVG9DcmVhdGUuYWRkKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdXBlci53cml0ZShwYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIG92ZXJ3cml0ZShwYXRoOiBQYXRoLCBjb250ZW50OiBGaWxlQnVmZmVyKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuaXNEaXJlY3RvcnkocGF0aCkucGlwZShcbiAgICAgIHN3aXRjaE1hcCgoaXNEaXIpID0+IHtcbiAgICAgICAgaWYgKGlzRGlyKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFBhdGhJc0RpcmVjdG9yeUV4Y2VwdGlvbihwYXRoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5leGlzdHMocGF0aCk7XG4gICAgICB9KSxcbiAgICAgIHN3aXRjaE1hcCgoZXhpc3RzKSA9PiB7XG4gICAgICAgIGlmICghZXhpc3RzKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9maWxlc1RvQ3JlYXRlLmhhcyhwYXRoKSkge1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9PdmVyd3JpdGUuYWRkKHBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLndyaXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHdyaXRlKHBhdGg6IFBhdGgsIGNvbnRlbnQ6IEZpbGVCdWZmZXIpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5leGlzdHMocGF0aCkucGlwZShcbiAgICAgIHN3aXRjaE1hcCgoZXhpc3RzKSA9PiB7XG4gICAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgICAvLyBJdCBleGlzdHMsIGJ1dCBtaWdodCBiZSBiZWluZyByZW5hbWVkIG9yIGRlbGV0ZWQuIEluIHRoYXQgY2FzZSB3ZSB3YW50IHRvIGNyZWF0ZSBpdC5cbiAgICAgICAgICBpZiAodGhpcy53aWxsUmVuYW1lKHBhdGgpIHx8IHRoaXMud2lsbERlbGV0ZShwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vdmVyd3JpdGUocGF0aCwgY29udGVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlYWQocGF0aDogUGF0aCk6IE9ic2VydmFibGU8RmlsZUJ1ZmZlcj4ge1xuICAgIGlmICh0aGlzLl9leGlzdHMocGF0aCkpIHtcbiAgICAgIHJldHVybiBzdXBlci5yZWFkKHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9iYWNrLnJlYWQocGF0aCk7XG4gIH1cblxuICBvdmVycmlkZSBkZWxldGUocGF0aDogUGF0aCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9leGlzdHMocGF0aCkpIHtcbiAgICAgIGlmICh0aGlzLl9maWxlc1RvQ3JlYXRlLmhhcyhwYXRoKSkge1xuICAgICAgICB0aGlzLl9maWxlc1RvQ3JlYXRlLmRlbGV0ZShwYXRoKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5oYXMocGF0aCkpIHtcbiAgICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5kZWxldGUocGF0aCk7XG4gICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuYWRkKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWF5YmVPcmlnaW4gPSB0aGlzLl9maWxlc1RvUmVuYW1lUmV2ZXJ0LmdldChwYXRoKTtcbiAgICAgICAgaWYgKG1heWJlT3JpZ2luKSB7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5kZWxldGUocGF0aCk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZS5kZWxldGUobWF5YmVPcmlnaW4pO1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9EZWxldGUuYWRkKG1heWJlT3JpZ2luKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgICAgIG5ldyBVbmtub3duRXhjZXB0aW9uKGBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uIFBhdGg6ICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9LmApLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN1cGVyLmRlbGV0ZShwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2JhY2suZXhpc3RzKHBhdGgpLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcCgoZXhpc3RzKSA9PiB7XG4gICAgICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICAgICAgdGhpcy5fZmlsZXNUb0RlbGV0ZS5hZGQocGF0aCk7XG5cbiAgICAgICAgICAgIHJldHVybiBvZjx2b2lkPigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgcmVuYW1lKGZyb206IFBhdGgsIHRvOiBQYXRoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIGNvbmNhdCh0aGlzLmV4aXN0cyh0byksIHRoaXMuZXhpc3RzKGZyb20pKS5waXBlKFxuICAgICAgdG9BcnJheSgpLFxuICAgICAgc3dpdGNoTWFwKChbZXhpc3RUbywgZXhpc3RGcm9tXSkgPT4ge1xuICAgICAgICBpZiAoIWV4aXN0RnJvbSkge1xuICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKGZyb20pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnJvbSA9PT0gdG8pIHtcbiAgICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXhpc3RUbykge1xuICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKHRvKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSdyZSByZW5hbWluZyBhIGZpbGUgdGhhdCdzIGJlZW4gY3JlYXRlZCwgc2hvcnRjaXJjdWl0IHRvIGNyZWF0aW5nIHRoZSBgdG9gIHBhdGguXG4gICAgICAgIGlmICh0aGlzLl9maWxlc1RvQ3JlYXRlLmhhcyhmcm9tKSkge1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9DcmVhdGUuZGVsZXRlKGZyb20pO1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9DcmVhdGUuYWRkKHRvKTtcblxuICAgICAgICAgIHJldHVybiBzdXBlci5yZW5hbWUoZnJvbSwgdG8pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1RvT3ZlcndyaXRlLmhhcyhmcm9tKSkge1xuICAgICAgICAgIHRoaXMuX2ZpbGVzVG9PdmVyd3JpdGUuZGVsZXRlKGZyb20pO1xuXG4gICAgICAgICAgLy8gUmVjdXJzaXZlbHkgY2FsbCB0aGlzIGZ1bmN0aW9uLiBUaGlzIGlzIHNvIHdlIGRvbid0IHJlcGVhdCB0aGUgYm90dG9tIGxvZ2ljLiBUaGlzXG4gICAgICAgICAgLy8gaWYgd2lsbCBiZSBieS1wYXNzZWQgYmVjYXVzZSB3ZSBqdXN0IGRlbGV0ZWQgdGhlIGBmcm9tYCBwYXRoIGZyb20gZmlsZXMgdG8gb3ZlcndyaXRlLlxuICAgICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgICB0aGlzLnJlbmFtZShmcm9tLCB0byksXG4gICAgICAgICAgICBuZXcgT2JzZXJ2YWJsZTxuZXZlcj4oKHgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5hZGQodG8pO1xuICAgICAgICAgICAgICB4LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1RvRGVsZXRlLmhhcyh0bykpIHtcbiAgICAgICAgICB0aGlzLl9maWxlc1RvRGVsZXRlLmRlbGV0ZSh0byk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb0RlbGV0ZS5hZGQoZnJvbSk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5hZGQodG8pO1xuXG4gICAgICAgICAgLy8gV2UgbmVlZCB0byBkZWxldGUgdGhlIG9yaWdpbmFsIGFuZCB3cml0ZSB0aGUgbmV3IG9uZS5cbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkKGZyb20pLnBpcGUobWFwKChjb250ZW50KSA9PiB0aGlzLl93cml0ZSh0bywgY29udGVudCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heWJlVG8xID0gdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5nZXQoZnJvbSk7XG4gICAgICAgIGlmIChtYXliZVRvMSkge1xuICAgICAgICAgIC8vIFdlIGFscmVhZHkgcmVuYW1lZCB0byB0aGlzIGZpbGUgKEEgPT4gZnJvbSksIGxldCdzIHJlbmFtZSB0aGUgZm9ybWVyIHRvIHRoZSBuZXdcbiAgICAgICAgICAvLyBwYXRoIChBID0+IHRvKS5cbiAgICAgICAgICB0aGlzLl9maWxlc1RvUmVuYW1lLmRlbGV0ZShtYXliZVRvMSk7XG4gICAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZVJldmVydC5kZWxldGUoZnJvbSk7XG4gICAgICAgICAgZnJvbSA9IG1heWJlVG8xO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmlsZXNUb1JlbmFtZS5zZXQoZnJvbSwgdG8pO1xuICAgICAgICB0aGlzLl9maWxlc1RvUmVuYW1lUmV2ZXJ0LnNldCh0bywgZnJvbSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGZpbGUgaXMgcGFydCBvZiBvdXIgZGF0YSwganVzdCByZW5hbWUgaXQgaW50ZXJuYWxseS5cbiAgICAgICAgaWYgKHRoaXMuX2V4aXN0cyhmcm9tKSkge1xuICAgICAgICAgIHJldHVybiBzdXBlci5yZW5hbWUoZnJvbSwgdG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIGZpbGUgd2l0aCB0aGUgc2FtZSBjb250ZW50LlxuICAgICAgICAgIHJldHVybiB0aGlzLl9iYWNrLnJlYWQoZnJvbSkucGlwZShzd2l0Y2hNYXAoKGNvbnRlbnQpID0+IHN1cGVyLndyaXRlKHRvLCBjb250ZW50KSkpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgb3ZlcnJpZGUgbGlzdChwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxQYXRoRnJhZ21lbnRbXT4ge1xuICAgIHJldHVybiBjb25jYXQoc3VwZXIubGlzdChwYXRoKSwgdGhpcy5fYmFjay5saXN0KHBhdGgpKS5waXBlKFxuICAgICAgcmVkdWNlKChsaXN0OiBTZXQ8UGF0aEZyYWdtZW50PiwgY3VycjogUGF0aEZyYWdtZW50W10pID0+IHtcbiAgICAgICAgY3Vyci5mb3JFYWNoKChlbGVtKSA9PiBsaXN0LmFkZChlbGVtKSk7XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICB9LCBuZXcgU2V0PFBhdGhGcmFnbWVudD4oKSksXG4gICAgICBtYXAoKHNldCkgPT4gWy4uLnNldF0pLFxuICAgICk7XG4gIH1cblxuICBvdmVycmlkZSBleGlzdHMocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9leGlzdHMocGF0aClcbiAgICAgID8gb2YodHJ1ZSlcbiAgICAgIDogdGhpcy53aWxsRGVsZXRlKHBhdGgpIHx8IHRoaXMud2lsbFJlbmFtZShwYXRoKVxuICAgICAgPyBvZihmYWxzZSlcbiAgICAgIDogdGhpcy5fYmFjay5leGlzdHMocGF0aCk7XG4gIH1cbiAgb3ZlcnJpZGUgaXNEaXJlY3RvcnkocGF0aDogUGF0aCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9leGlzdHMocGF0aCkgPyBzdXBlci5pc0RpcmVjdG9yeShwYXRoKSA6IHRoaXMuX2JhY2suaXNEaXJlY3RvcnkocGF0aCk7XG4gIH1cbiAgb3ZlcnJpZGUgaXNGaWxlKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5fZXhpc3RzKHBhdGgpXG4gICAgICA/IHN1cGVyLmlzRmlsZShwYXRoKVxuICAgICAgOiB0aGlzLndpbGxEZWxldGUocGF0aCkgfHwgdGhpcy53aWxsUmVuYW1lKHBhdGgpXG4gICAgICA/IG9mKGZhbHNlKVxuICAgICAgOiB0aGlzLl9iYWNrLmlzRmlsZShwYXRoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHN0YXQocGF0aDogUGF0aCk6IE9ic2VydmFibGU8U3RhdHMgfCBudWxsPiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9leGlzdHMocGF0aClcbiAgICAgID8gc3VwZXIuc3RhdChwYXRoKVxuICAgICAgOiB0aGlzLndpbGxEZWxldGUocGF0aCkgfHwgdGhpcy53aWxsUmVuYW1lKHBhdGgpXG4gICAgICA/IG9mKG51bGwpXG4gICAgICA6IHRoaXMuX2JhY2suc3RhdChwYXRoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHdhdGNoKHBhdGg6IFBhdGgsIG9wdGlvbnM/OiBIb3N0V2F0Y2hPcHRpb25zKSB7XG4gICAgLy8gV2F0Y2hpbmcgbm90IHN1cHBvcnRlZC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHdpbGxDcmVhdGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9maWxlc1RvQ3JlYXRlLmhhcyhwYXRoKTtcbiAgfVxuICB3aWxsT3ZlcndyaXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZXNUb092ZXJ3cml0ZS5oYXMocGF0aCk7XG4gIH1cbiAgd2lsbERlbGV0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGVzVG9EZWxldGUuaGFzKHBhdGgpO1xuICB9XG4gIHdpbGxSZW5hbWUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9maWxlc1RvUmVuYW1lLmhhcyhwYXRoKTtcbiAgfVxuICB3aWxsUmVuYW1lVG8ocGF0aDogUGF0aCwgdG86IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZXNUb1JlbmFtZS5nZXQocGF0aCkgPT09IHRvO1xuICB9XG59XG4iXX0=