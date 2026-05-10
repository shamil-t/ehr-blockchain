"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHostTree = exports.HostCreateTree = exports.HostTree = exports.HostDirEntry = void 0;
const core_1 = require("@angular-devkit/core");
const jsonc_parser_1 = require("jsonc-parser");
const rxjs_1 = require("rxjs");
const util_1 = require("util");
const exception_1 = require("../exception/exception");
const delegate_1 = require("./delegate");
const entry_1 = require("./entry");
const interface_1 = require("./interface");
const recorder_1 = require("./recorder");
const scoped_1 = require("./scoped");
let _uniqueId = 0;
class HostDirEntry {
    constructor(parent, path, _host, _tree) {
        this.parent = parent;
        this.path = path;
        this._host = _host;
        this._tree = _tree;
    }
    get subdirs() {
        return this._host
            .list(this.path)
            .filter((fragment) => this._host.isDirectory((0, core_1.join)(this.path, fragment)));
    }
    get subfiles() {
        return this._host
            .list(this.path)
            .filter((fragment) => this._host.isFile((0, core_1.join)(this.path, fragment)));
    }
    dir(name) {
        return this._tree.getDir((0, core_1.join)(this.path, name));
    }
    file(name) {
        return this._tree.get((0, core_1.join)(this.path, name));
    }
    visit(visitor) {
        try {
            this.getSubfilesRecursively().forEach((file) => visitor(file.path, file));
        }
        catch (e) {
            if (e !== interface_1.FileVisitorCancelToken) {
                throw e;
            }
        }
    }
    getSubfilesRecursively() {
        function _recurse(entry) {
            return entry.subdirs.reduce((files, subdir) => [...files, ..._recurse(entry.dir(subdir))], entry.subfiles.map((subfile) => entry.file(subfile)));
        }
        return _recurse(this);
    }
}
exports.HostDirEntry = HostDirEntry;
class HostTree {
    [interface_1.TreeSymbol]() {
        return this;
    }
    static isHostTree(tree) {
        if (tree instanceof HostTree) {
            return true;
        }
        if (typeof tree === 'object' && typeof tree._ancestry === 'object') {
            return true;
        }
        return false;
    }
    constructor(_backend = new core_1.virtualFs.Empty()) {
        this._backend = _backend;
        this._id = --_uniqueId;
        this._ancestry = new Set();
        this._dirCache = new Map();
        this._record = new core_1.virtualFs.CordHost(new core_1.virtualFs.SafeReadonlyHost(_backend));
        this._recordSync = new core_1.virtualFs.SyncDelegateHost(this._record);
    }
    _normalizePath(path) {
        return (0, core_1.normalize)('/' + path);
    }
    _willCreate(path) {
        return this._record.willCreate(path);
    }
    _willOverwrite(path) {
        return this._record.willOverwrite(path);
    }
    _willDelete(path) {
        return this._record.willDelete(path);
    }
    _willRename(path) {
        return this._record.willRename(path);
    }
    branch() {
        const branchedTree = new HostTree(this._backend);
        branchedTree._record = this._record.clone();
        branchedTree._recordSync = new core_1.virtualFs.SyncDelegateHost(branchedTree._record);
        branchedTree._ancestry = new Set(this._ancestry).add(this._id);
        return branchedTree;
    }
    isAncestorOf(tree) {
        if (tree instanceof HostTree) {
            return tree._ancestry.has(this._id);
        }
        if (tree instanceof delegate_1.DelegateTree) {
            return this.isAncestorOf(tree._other);
        }
        if (tree instanceof scoped_1.ScopedTree) {
            return this.isAncestorOf(tree._base);
        }
        return false;
    }
    merge(other, strategy = interface_1.MergeStrategy.Default) {
        if (other === this) {
            // Merging with yourself? Tsk tsk. Nothing to do at least.
            return;
        }
        if (this.isAncestorOf(other)) {
            // Workaround for merging a branch back into one of its ancestors
            // More complete branch point tracking is required to avoid
            strategy |= interface_1.MergeStrategy.Overwrite;
        }
        const creationConflictAllowed = (strategy & interface_1.MergeStrategy.AllowCreationConflict) == interface_1.MergeStrategy.AllowCreationConflict;
        const overwriteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowOverwriteConflict) == interface_1.MergeStrategy.AllowOverwriteConflict;
        const deleteConflictAllowed = (strategy & interface_1.MergeStrategy.AllowDeleteConflict) == interface_1.MergeStrategy.AllowDeleteConflict;
        other.actions.forEach((action) => {
            switch (action.kind) {
                case 'c': {
                    const { path, content } = action;
                    if (this._willCreate(path) || this._willOverwrite(path) || this.exists(path)) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!creationConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                        this._record.overwrite(path, content).subscribe();
                    }
                    else {
                        this._record.create(path, content).subscribe();
                    }
                    return;
                }
                case 'o': {
                    const { path, content } = action;
                    if (this._willDelete(path) && !overwriteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    // Ignore if content is the same (considered the same change).
                    if (this._willOverwrite(path)) {
                        const existingContent = this.read(path);
                        if (existingContent && content.equals(existingContent)) {
                            // Identical outcome; no action required
                            return;
                        }
                        if (!overwriteConflictAllowed) {
                            throw new exception_1.MergeConflictException(path);
                        }
                    }
                    // We use write here as merge validation has already been done, and we want to let
                    // the CordHost do its job.
                    this._record.write(path, content).subscribe();
                    return;
                }
                case 'r': {
                    const { path, to } = action;
                    if (this._willDelete(path)) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    if (this._willRename(path)) {
                        if (this._record.willRenameTo(path, to)) {
                            // Identical outcome; no action required
                            return;
                        }
                        // No override possible for renaming.
                        throw new exception_1.MergeConflictException(path);
                    }
                    this.rename(path, to);
                    return;
                }
                case 'd': {
                    const { path } = action;
                    if (this._willDelete(path)) {
                        // TODO: This should technically check the content (e.g., hash on delete)
                        // Identical outcome; no action required
                        return;
                    }
                    if (!this.exists(path) && !deleteConflictAllowed) {
                        throw new exception_1.MergeConflictException(path);
                    }
                    this._recordSync.delete(path);
                    return;
                }
            }
        });
    }
    get root() {
        return this.getDir('/');
    }
    // Readonly.
    read(path) {
        const entry = this.get(path);
        return entry ? entry.content : null;
    }
    readText(path) {
        const data = this.read(path);
        if (data === null) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
        try {
            // With the `fatal` option enabled, invalid data will throw a TypeError
            return decoder.decode(data);
        }
        catch (e) {
            if (e instanceof TypeError) {
                throw new Error(`Failed to decode "${path}" as UTF-8 text.`);
            }
            throw e;
        }
    }
    readJson(path) {
        const content = this.readText(path);
        const errors = [];
        const result = (0, jsonc_parser_1.parse)(content, errors, { allowTrailingComma: true });
        // If there is a parse error throw with the error information
        if (errors[0]) {
            const { error, offset } = errors[0];
            throw new Error(`Failed to parse "${path}" as JSON. ${(0, jsonc_parser_1.printParseErrorCode)(error)} at offset: ${offset}.`);
        }
        return result;
    }
    exists(path) {
        return this._recordSync.isFile(this._normalizePath(path));
    }
    get(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isDirectory(p)) {
            throw new core_1.PathIsDirectoryException(p);
        }
        if (!this._recordSync.exists(p)) {
            return null;
        }
        return new entry_1.LazyFileEntry(p, () => Buffer.from(this._recordSync.read(p)));
    }
    getDir(path) {
        const p = this._normalizePath(path);
        if (this._recordSync.isFile(p)) {
            throw new core_1.PathIsFileException(p);
        }
        let maybeCache = this._dirCache.get(p);
        if (!maybeCache) {
            let parent = (0, core_1.dirname)(p);
            if (p === parent) {
                parent = null;
            }
            maybeCache = new HostDirEntry(parent && this.getDir(parent), p, this._recordSync, this);
            this._dirCache.set(p, maybeCache);
        }
        return maybeCache;
    }
    visit(visitor) {
        this.root.visit((path, entry) => {
            visitor(path, entry);
        });
    }
    // Change content of host files.
    overwrite(path, content) {
        const p = this._normalizePath(path);
        if (!this._recordSync.exists(p)) {
            throw new exception_1.FileDoesNotExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.overwrite(p, c).subscribe();
    }
    beginUpdate(path) {
        const entry = this.get(path);
        if (!entry) {
            throw new exception_1.FileDoesNotExistException(path);
        }
        return recorder_1.UpdateRecorderBase.createFromFileEntry(entry);
    }
    commitUpdate(record) {
        if (record instanceof recorder_1.UpdateRecorderBase) {
            const path = record.path;
            const entry = this.get(path);
            if (!entry) {
                throw new exception_1.ContentHasMutatedException(path);
            }
            else {
                const newContent = record.apply(entry.content);
                if (!newContent.equals(entry.content)) {
                    this.overwrite(path, newContent);
                }
            }
        }
        else {
            throw new exception_1.InvalidUpdateRecordException();
        }
    }
    // Structural methods.
    create(path, content) {
        const p = this._normalizePath(path);
        if (this._recordSync.exists(p)) {
            throw new exception_1.FileAlreadyExistException(p);
        }
        const c = typeof content == 'string' ? Buffer.from(content) : content;
        this._record.create(p, c).subscribe();
    }
    delete(path) {
        this._recordSync.delete(this._normalizePath(path));
    }
    rename(from, to) {
        this._recordSync.rename(this._normalizePath(from), this._normalizePath(to));
    }
    apply(action, strategy) {
        throw new exception_1.SchematicsException('Apply not implemented on host trees.');
    }
    *generateActions() {
        for (const record of this._record.records()) {
            switch (record.kind) {
                case 'create':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'c',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                    break;
                case 'overwrite':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'o',
                        path: record.path,
                        content: Buffer.from(record.content),
                    };
                    break;
                case 'rename':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'r',
                        path: record.from,
                        to: record.to,
                    };
                    break;
                case 'delete':
                    yield {
                        id: this._id,
                        parent: 0,
                        kind: 'd',
                        path: record.path,
                    };
                    break;
            }
        }
    }
    get actions() {
        // Create a list of all records until we hit our original backend. This is to support branches
        // that diverge from each others.
        return Array.from(this.generateActions());
    }
}
exports.HostTree = HostTree;
class HostCreateTree extends HostTree {
    constructor(host) {
        super();
        const tempHost = new HostTree(host);
        tempHost.visit((path) => {
            const content = tempHost.read(path);
            if (content) {
                this.create(path, content);
            }
        });
    }
}
exports.HostCreateTree = HostCreateTree;
class FilterHostTree extends HostTree {
    constructor(tree, filter = () => true) {
        const newBackend = new core_1.virtualFs.SimpleMemoryHost();
        // cast to allow access
        const originalBackend = tree._backend;
        const recurse = (base) => {
            return originalBackend.list(base).pipe((0, rxjs_1.mergeMap)((x) => x), (0, rxjs_1.map)((path) => (0, core_1.join)(base, path)), (0, rxjs_1.concatMap)((path) => {
                let isDirectory = false;
                originalBackend.isDirectory(path).subscribe((val) => (isDirectory = val));
                if (isDirectory) {
                    return recurse(path);
                }
                let isFile = false;
                originalBackend.isFile(path).subscribe((val) => (isFile = val));
                if (!isFile || !filter(path)) {
                    return rxjs_1.EMPTY;
                }
                let content = null;
                originalBackend.read(path).subscribe((val) => (content = val));
                if (!content) {
                    return rxjs_1.EMPTY;
                }
                return newBackend.write(path, content);
            }));
        };
        recurse((0, core_1.normalize)('/')).subscribe();
        super(newBackend);
        for (const action of tree.actions) {
            if (!filter(action.path)) {
                continue;
            }
            switch (action.kind) {
                case 'c':
                    this.create(action.path, action.content);
                    break;
                case 'd':
                    this.delete(action.path);
                    break;
                case 'o':
                    this.overwrite(action.path, action.content);
                    break;
                case 'r':
                    this.rename(action.path, action.to);
                    break;
            }
        }
    }
}
exports.FilterHostTree = FilterHostTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC10cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS9ob3N0LXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBVThCO0FBQzlCLCtDQUFvRjtBQUNwRiwrQkFBbUU7QUFDbkUsK0JBQW1DO0FBQ25DLHNEQU9nQztBQVFoQyx5Q0FBMEM7QUFDMUMsbUNBQXdDO0FBQ3hDLDJDQVVxQjtBQUNyQix5Q0FBZ0Q7QUFDaEQscUNBQXNDO0FBRXRDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUVsQixNQUFhLFlBQVk7SUFDdkIsWUFDVyxNQUF1QixFQUN2QixJQUFVLEVBQ1QsS0FBaUMsRUFDakMsS0FBVztRQUhaLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQ3ZCLFNBQUksR0FBSixJQUFJLENBQU07UUFDVCxVQUFLLEdBQUwsS0FBSyxDQUE0QjtRQUNqQyxVQUFLLEdBQUwsS0FBSyxDQUFNO0lBQ3BCLENBQUM7SUFFSixJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLO2FBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDZixNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxLQUFLO2FBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDZixNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUEsV0FBSSxF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QUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUM1QyxNQUFNO2dCQUNSLEtBQUssR0FBRztvQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwQyxNQUFNO2FBQ1Q7U0FDRjtJQUNILENBQUM7Q0FDRjtBQTNERCx3Q0EyREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgSnNvblZhbHVlLFxuICBQYXRoLFxuICBQYXRoRnJhZ21lbnQsXG4gIFBhdGhJc0RpcmVjdG9yeUV4Y2VwdGlvbixcbiAgUGF0aElzRmlsZUV4Y2VwdGlvbixcbiAgZGlybmFtZSxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICB2aXJ0dWFsRnMsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFBhcnNlRXJyb3IsIHBhcnNlIGFzIGpzb25jUGFyc2UsIHByaW50UGFyc2VFcnJvckNvZGUgfSBmcm9tICdqc29uYy1wYXJzZXInO1xuaW1wb3J0IHsgRU1QVFksIE9ic2VydmFibGUsIGNvbmNhdE1hcCwgbWFwLCBtZXJnZU1hcCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgVGV4dERlY29kZXIgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7XG4gIENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uLFxuICBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uLFxuICBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uLFxuICBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uLFxuICBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uLFxuICBTY2hlbWF0aWNzRXhjZXB0aW9uLFxufSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgQ3JlYXRlRmlsZUFjdGlvbixcbiAgRGVsZXRlRmlsZUFjdGlvbixcbiAgT3ZlcndyaXRlRmlsZUFjdGlvbixcbiAgUmVuYW1lRmlsZUFjdGlvbixcbn0gZnJvbSAnLi9hY3Rpb24nO1xuaW1wb3J0IHsgRGVsZWdhdGVUcmVlIH0gZnJvbSAnLi9kZWxlZ2F0ZSc7XG5pbXBvcnQgeyBMYXp5RmlsZUVudHJ5IH0gZnJvbSAnLi9lbnRyeSc7XG5pbXBvcnQge1xuICBEaXJFbnRyeSxcbiAgRmlsZUVudHJ5LFxuICBGaWxlUHJlZGljYXRlLFxuICBGaWxlVmlzaXRvcixcbiAgRmlsZVZpc2l0b3JDYW5jZWxUb2tlbixcbiAgTWVyZ2VTdHJhdGVneSxcbiAgVHJlZSxcbiAgVHJlZVN5bWJvbCxcbiAgVXBkYXRlUmVjb3JkZXIsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFVwZGF0ZVJlY29yZGVyQmFzZSB9IGZyb20gJy4vcmVjb3JkZXInO1xuaW1wb3J0IHsgU2NvcGVkVHJlZSB9IGZyb20gJy4vc2NvcGVkJztcblxubGV0IF91bmlxdWVJZCA9IDA7XG5cbmV4cG9ydCBjbGFzcyBIb3N0RGlyRW50cnkgaW1wbGVtZW50cyBEaXJFbnRyeSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IHBhcmVudDogRGlyRW50cnkgfCBudWxsLFxuICAgIHJlYWRvbmx5IHBhdGg6IFBhdGgsXG4gICAgcHJvdGVjdGVkIF9ob3N0OiB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdCxcbiAgICBwcm90ZWN0ZWQgX3RyZWU6IFRyZWUsXG4gICkge31cblxuICBnZXQgc3ViZGlycygpOiBQYXRoRnJhZ21lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3RcbiAgICAgIC5saXN0KHRoaXMucGF0aClcbiAgICAgIC5maWx0ZXIoKGZyYWdtZW50KSA9PiB0aGlzLl9ob3N0LmlzRGlyZWN0b3J5KGpvaW4odGhpcy5wYXRoLCBmcmFnbWVudCkpKTtcbiAgfVxuICBnZXQgc3ViZmlsZXMoKTogUGF0aEZyYWdtZW50W10ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0XG4gICAgICAubGlzdCh0aGlzLnBhdGgpXG4gICAgICAuZmlsdGVyKChmcmFnbWVudCkgPT4gdGhpcy5faG9zdC5pc0ZpbGUoam9pbih0aGlzLnBhdGgsIGZyYWdtZW50KSkpO1xuICB9XG5cbiAgZGlyKG5hbWU6IFBhdGhGcmFnbWVudCk6IERpckVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5nZXREaXIoam9pbih0aGlzLnBhdGgsIG5hbWUpKTtcbiAgfVxuICBmaWxlKG5hbWU6IFBhdGhGcmFnbWVudCk6IEZpbGVFbnRyeSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmdldChqb2luKHRoaXMucGF0aCwgbmFtZSkpO1xuICB9XG5cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5nZXRTdWJmaWxlc1JlY3Vyc2l2ZWx5KCkuZm9yRWFjaCgoZmlsZSkgPT4gdmlzaXRvcihmaWxlLnBhdGgsIGZpbGUpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSAhPT0gRmlsZVZpc2l0b3JDYW5jZWxUb2tlbikge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3ViZmlsZXNSZWN1cnNpdmVseSgpIHtcbiAgICBmdW5jdGlvbiBfcmVjdXJzZShlbnRyeTogRGlyRW50cnkpOiBGaWxlRW50cnlbXSB7XG4gICAgICByZXR1cm4gZW50cnkuc3ViZGlycy5yZWR1Y2UoXG4gICAgICAgIChmaWxlcywgc3ViZGlyKSA9PiBbLi4uZmlsZXMsIC4uLl9yZWN1cnNlKGVudHJ5LmRpcihzdWJkaXIpKV0sXG4gICAgICAgIGVudHJ5LnN1YmZpbGVzLm1hcCgoc3ViZmlsZSkgPT4gZW50cnkuZmlsZShzdWJmaWxlKSBhcyBGaWxlRW50cnkpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JlY3Vyc2UodGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEhvc3RUcmVlIGltcGxlbWVudHMgVHJlZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2lkID0gLS1fdW5pcXVlSWQ7XG4gIHByaXZhdGUgX3JlY29yZDogdmlydHVhbEZzLkNvcmRIb3N0O1xuICBwcml2YXRlIF9yZWNvcmRTeW5jOiB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdDtcbiAgcHJpdmF0ZSBfYW5jZXN0cnkgPSBuZXcgU2V0PG51bWJlcj4oKTtcblxuICBwcml2YXRlIF9kaXJDYWNoZSA9IG5ldyBNYXA8UGF0aCwgSG9zdERpckVudHJ5PigpO1xuXG4gIFtUcmVlU3ltYm9sXSgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0YXRpYyBpc0hvc3RUcmVlKHRyZWU6IFRyZWUpOiB0cmVlIGlzIEhvc3RUcmVlIHtcbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIEhvc3RUcmVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRyZWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiAodHJlZSBhcyBIb3N0VHJlZSkuX2FuY2VzdHJ5ID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9iYWNrZW5kOiB2aXJ0dWFsRnMuUmVhZG9ubHlIb3N0PHt9PiA9IG5ldyB2aXJ0dWFsRnMuRW1wdHkoKSkge1xuICAgIHRoaXMuX3JlY29yZCA9IG5ldyB2aXJ0dWFsRnMuQ29yZEhvc3QobmV3IHZpcnR1YWxGcy5TYWZlUmVhZG9ubHlIb3N0KF9iYWNrZW5kKSk7XG4gICAgdGhpcy5fcmVjb3JkU3luYyA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdCh0aGlzLl9yZWNvcmQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9ub3JtYWxpemVQYXRoKHBhdGg6IHN0cmluZyk6IFBhdGgge1xuICAgIHJldHVybiBub3JtYWxpemUoJy8nICsgcGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxDcmVhdGUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbENyZWF0ZShwYXRoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfd2lsbE92ZXJ3cml0ZShwYXRoOiBQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY29yZC53aWxsT3ZlcndyaXRlKHBhdGgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF93aWxsRGVsZXRlKHBhdGg6IFBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVjb3JkLndpbGxEZWxldGUocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3dpbGxSZW5hbWUocGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmQud2lsbFJlbmFtZShwYXRoKTtcbiAgfVxuXG4gIGJyYW5jaCgpOiBUcmVlIHtcbiAgICBjb25zdCBicmFuY2hlZFRyZWUgPSBuZXcgSG9zdFRyZWUodGhpcy5fYmFja2VuZCk7XG4gICAgYnJhbmNoZWRUcmVlLl9yZWNvcmQgPSB0aGlzLl9yZWNvcmQuY2xvbmUoKTtcbiAgICBicmFuY2hlZFRyZWUuX3JlY29yZFN5bmMgPSBuZXcgdmlydHVhbEZzLlN5bmNEZWxlZ2F0ZUhvc3QoYnJhbmNoZWRUcmVlLl9yZWNvcmQpO1xuICAgIGJyYW5jaGVkVHJlZS5fYW5jZXN0cnkgPSBuZXcgU2V0KHRoaXMuX2FuY2VzdHJ5KS5hZGQodGhpcy5faWQpO1xuXG4gICAgcmV0dXJuIGJyYW5jaGVkVHJlZTtcbiAgfVxuXG4gIHByaXZhdGUgaXNBbmNlc3Rvck9mKHRyZWU6IFRyZWUpOiBib29sZWFuIHtcbiAgICBpZiAodHJlZSBpbnN0YW5jZW9mIEhvc3RUcmVlKSB7XG4gICAgICByZXR1cm4gdHJlZS5fYW5jZXN0cnkuaGFzKHRoaXMuX2lkKTtcbiAgICB9XG4gICAgaWYgKHRyZWUgaW5zdGFuY2VvZiBEZWxlZ2F0ZVRyZWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzQW5jZXN0b3JPZigodHJlZSBhcyB1bmtub3duIGFzIHsgX290aGVyOiBUcmVlIH0pLl9vdGhlcik7XG4gICAgfVxuICAgIGlmICh0cmVlIGluc3RhbmNlb2YgU2NvcGVkVHJlZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaXNBbmNlc3Rvck9mKCh0cmVlIGFzIHVua25vd24gYXMgeyBfYmFzZTogVHJlZSB9KS5fYmFzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbWVyZ2Uob3RoZXI6IFRyZWUsIHN0cmF0ZWd5OiBNZXJnZVN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogdm9pZCB7XG4gICAgaWYgKG90aGVyID09PSB0aGlzKSB7XG4gICAgICAvLyBNZXJnaW5nIHdpdGggeW91cnNlbGY/IFRzayB0c2suIE5vdGhpbmcgdG8gZG8gYXQgbGVhc3QuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNBbmNlc3Rvck9mKG90aGVyKSkge1xuICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgbWVyZ2luZyBhIGJyYW5jaCBiYWNrIGludG8gb25lIG9mIGl0cyBhbmNlc3RvcnNcbiAgICAgIC8vIE1vcmUgY29tcGxldGUgYnJhbmNoIHBvaW50IHRyYWNraW5nIGlzIHJlcXVpcmVkIHRvIGF2b2lkXG4gICAgICBzdHJhdGVneSB8PSBNZXJnZVN0cmF0ZWd5Lk92ZXJ3cml0ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjcmVhdGlvbkNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93Q3JlYXRpb25Db25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd0NyZWF0aW9uQ29uZmxpY3Q7XG4gICAgY29uc3Qgb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkID1cbiAgICAgIChzdHJhdGVneSAmIE1lcmdlU3RyYXRlZ3kuQWxsb3dPdmVyd3JpdGVDb25mbGljdCkgPT0gTWVyZ2VTdHJhdGVneS5BbGxvd092ZXJ3cml0ZUNvbmZsaWN0O1xuICAgIGNvbnN0IGRlbGV0ZUNvbmZsaWN0QWxsb3dlZCA9XG4gICAgICAoc3RyYXRlZ3kgJiBNZXJnZVN0cmF0ZWd5LkFsbG93RGVsZXRlQ29uZmxpY3QpID09IE1lcmdlU3RyYXRlZ3kuQWxsb3dEZWxldGVDb25mbGljdDtcblxuICAgIG90aGVyLmFjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICAgIGNhc2UgJ2MnOiB7XG4gICAgICAgICAgY29uc3QgeyBwYXRoLCBjb250ZW50IH0gPSBhY3Rpb247XG5cbiAgICAgICAgICBpZiAodGhpcy5fd2lsbENyZWF0ZShwYXRoKSB8fCB0aGlzLl93aWxsT3ZlcndyaXRlKHBhdGgpIHx8IHRoaXMuZXhpc3RzKHBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbnRlbnQgPSB0aGlzLnJlYWQocGF0aCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdDb250ZW50ICYmIGNvbnRlbnQuZXF1YWxzKGV4aXN0aW5nQ29udGVudCkpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY3JlYXRpb25Db25mbGljdEFsbG93ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1lcmdlQ29uZmxpY3RFeGNlcHRpb24ocGF0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3JlY29yZC5vdmVyd3JpdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlY29yZC5jcmVhdGUocGF0aCwgY29udGVudCBhcyB7fSBhcyB2aXJ0dWFsRnMuRmlsZUJ1ZmZlcikuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnbyc6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGFjdGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5fd2lsbERlbGV0ZShwYXRoKSAmJiAhb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZ25vcmUgaWYgY29udGVudCBpcyB0aGUgc2FtZSAoY29uc2lkZXJlZCB0aGUgc2FtZSBjaGFuZ2UpLlxuICAgICAgICAgIGlmICh0aGlzLl93aWxsT3ZlcndyaXRlKHBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbnRlbnQgPSB0aGlzLnJlYWQocGF0aCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdDb250ZW50ICYmIGNvbnRlbnQuZXF1YWxzKGV4aXN0aW5nQ29udGVudCkpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghb3ZlcndyaXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBXZSB1c2Ugd3JpdGUgaGVyZSBhcyBtZXJnZSB2YWxpZGF0aW9uIGhhcyBhbHJlYWR5IGJlZW4gZG9uZSwgYW5kIHdlIHdhbnQgdG8gbGV0XG4gICAgICAgICAgLy8gdGhlIENvcmRIb3N0IGRvIGl0cyBqb2IuXG4gICAgICAgICAgdGhpcy5fcmVjb3JkLndyaXRlKHBhdGgsIGNvbnRlbnQgYXMge30gYXMgdmlydHVhbEZzLkZpbGVCdWZmZXIpLnN1YnNjcmliZSgpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAncic6IHtcbiAgICAgICAgICBjb25zdCB7IHBhdGgsIHRvIH0gPSBhY3Rpb247XG4gICAgICAgICAgaWYgKHRoaXMuX3dpbGxEZWxldGUocGF0aCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl93aWxsUmVuYW1lKHBhdGgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVjb3JkLndpbGxSZW5hbWVUbyhwYXRoLCB0bykpIHtcbiAgICAgICAgICAgICAgLy8gSWRlbnRpY2FsIG91dGNvbWU7IG5vIGFjdGlvbiByZXF1aXJlZFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vIG92ZXJyaWRlIHBvc3NpYmxlIGZvciByZW5hbWluZy5cbiAgICAgICAgICAgIHRocm93IG5ldyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uKHBhdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlbmFtZShwYXRoLCB0byk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdkJzoge1xuICAgICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gYWN0aW9uO1xuICAgICAgICAgIGlmICh0aGlzLl93aWxsRGVsZXRlKHBhdGgpKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCB0ZWNobmljYWxseSBjaGVjayB0aGUgY29udGVudCAoZS5nLiwgaGFzaCBvbiBkZWxldGUpXG4gICAgICAgICAgICAvLyBJZGVudGljYWwgb3V0Y29tZTsgbm8gYWN0aW9uIHJlcXVpcmVkXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmV4aXN0cyhwYXRoKSAmJiAhZGVsZXRlQ29uZmxpY3RBbGxvd2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWVyZ2VDb25mbGljdEV4Y2VwdGlvbihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9yZWNvcmRTeW5jLmRlbGV0ZShwYXRoKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0IHJvb3QoKTogRGlyRW50cnkge1xuICAgIHJldHVybiB0aGlzLmdldERpcignLycpO1xuICB9XG5cbiAgLy8gUmVhZG9ubHkuXG4gIHJlYWQocGF0aDogc3RyaW5nKTogQnVmZmVyIHwgbnVsbCB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcblxuICAgIHJldHVybiBlbnRyeSA/IGVudHJ5LmNvbnRlbnQgOiBudWxsO1xuICB9XG5cbiAgcmVhZFRleHQocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5yZWFkKHBhdGgpO1xuICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgZmF0YWw6IHRydWUgfSk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gV2l0aCB0aGUgYGZhdGFsYCBvcHRpb24gZW5hYmxlZCwgaW52YWxpZCBkYXRhIHdpbGwgdGhyb3cgYSBUeXBlRXJyb3JcbiAgICAgIHJldHVybiBkZWNvZGVyLmRlY29kZShkYXRhKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBkZWNvZGUgXCIke3BhdGh9XCIgYXMgVVRGLTggdGV4dC5gKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgcmVhZEpzb24ocGF0aDogc3RyaW5nKTogSnNvblZhbHVlIHtcbiAgICBjb25zdCBjb250ZW50ID0gdGhpcy5yZWFkVGV4dChwYXRoKTtcbiAgICBjb25zdCBlcnJvcnM6IFBhcnNlRXJyb3JbXSA9IFtdO1xuICAgIGNvbnN0IHJlc3VsdCA9IGpzb25jUGFyc2UoY29udGVudCwgZXJyb3JzLCB7IGFsbG93VHJhaWxpbmdDb21tYTogdHJ1ZSB9KTtcblxuICAgIC8vIElmIHRoZXJlIGlzIGEgcGFyc2UgZXJyb3IgdGhyb3cgd2l0aCB0aGUgZXJyb3IgaW5mb3JtYXRpb25cbiAgICBpZiAoZXJyb3JzWzBdKSB7XG4gICAgICBjb25zdCB7IGVycm9yLCBvZmZzZXQgfSA9IGVycm9yc1swXTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEZhaWxlZCB0byBwYXJzZSBcIiR7cGF0aH1cIiBhcyBKU09OLiAke3ByaW50UGFyc2VFcnJvckNvZGUoZXJyb3IpfSBhdCBvZmZzZXQ6ICR7b2Zmc2V0fS5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZXhpc3RzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9yZWNvcmRTeW5jLmlzRmlsZSh0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpKTtcbiAgfVxuXG4gIGdldChwYXRoOiBzdHJpbmcpOiBGaWxlRW50cnkgfCBudWxsIHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5pc0RpcmVjdG9yeShwKSkge1xuICAgICAgdGhyb3cgbmV3IFBhdGhJc0RpcmVjdG9yeUV4Y2VwdGlvbihwKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZWNvcmRTeW5jLmV4aXN0cyhwKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBMYXp5RmlsZUVudHJ5KHAsICgpID0+IEJ1ZmZlci5mcm9tKHRoaXMuX3JlY29yZFN5bmMucmVhZChwKSkpO1xuICB9XG5cbiAgZ2V0RGlyKHBhdGg6IHN0cmluZyk6IERpckVudHJ5IHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5pc0ZpbGUocCkpIHtcbiAgICAgIHRocm93IG5ldyBQYXRoSXNGaWxlRXhjZXB0aW9uKHApO1xuICAgIH1cblxuICAgIGxldCBtYXliZUNhY2hlID0gdGhpcy5fZGlyQ2FjaGUuZ2V0KHApO1xuICAgIGlmICghbWF5YmVDYWNoZSkge1xuICAgICAgbGV0IHBhcmVudDogUGF0aCB8IG51bGwgPSBkaXJuYW1lKHApO1xuICAgICAgaWYgKHAgPT09IHBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBtYXliZUNhY2hlID0gbmV3IEhvc3REaXJFbnRyeShwYXJlbnQgJiYgdGhpcy5nZXREaXIocGFyZW50KSwgcCwgdGhpcy5fcmVjb3JkU3luYywgdGhpcyk7XG4gICAgICB0aGlzLl9kaXJDYWNoZS5zZXQocCwgbWF5YmVDYWNoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heWJlQ2FjaGU7XG4gIH1cbiAgdmlzaXQodmlzaXRvcjogRmlsZVZpc2l0b3IpOiB2b2lkIHtcbiAgICB0aGlzLnJvb3QudmlzaXQoKHBhdGgsIGVudHJ5KSA9PiB7XG4gICAgICB2aXNpdG9yKHBhdGgsIGVudHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENoYW5nZSBjb250ZW50IG9mIGhvc3QgZmlsZXMuXG4gIG92ZXJ3cml0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9ub3JtYWxpemVQYXRoKHBhdGgpO1xuICAgIGlmICghdGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLm92ZXJ3cml0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gVXBkYXRlUmVjb3JkZXJCYXNlLmNyZWF0ZUZyb21GaWxlRW50cnkoZW50cnkpO1xuICB9XG4gIGNvbW1pdFVwZGF0ZShyZWNvcmQ6IFVwZGF0ZVJlY29yZGVyKTogdm9pZCB7XG4gICAgaWYgKHJlY29yZCBpbnN0YW5jZW9mIFVwZGF0ZVJlY29yZGVyQmFzZSkge1xuICAgICAgY29uc3QgcGF0aCA9IHJlY29yZC5wYXRoO1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmdldChwYXRoKTtcbiAgICAgIGlmICghZW50cnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRIYXNNdXRhdGVkRXhjZXB0aW9uKHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbmV3Q29udGVudCA9IHJlY29yZC5hcHBseShlbnRyeS5jb250ZW50KTtcbiAgICAgICAgaWYgKCFuZXdDb250ZW50LmVxdWFscyhlbnRyeS5jb250ZW50KSkge1xuICAgICAgICAgIHRoaXMub3ZlcndyaXRlKHBhdGgsIG5ld0NvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gU3RydWN0dXJhbCBtZXRob2RzLlxuICBjcmVhdGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKTtcbiAgICBpZiAodGhpcy5fcmVjb3JkU3luYy5leGlzdHMocCkpIHtcbiAgICAgIHRocm93IG5ldyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKHApO1xuICAgIH1cbiAgICBjb25zdCBjID0gdHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycgPyBCdWZmZXIuZnJvbShjb250ZW50KSA6IGNvbnRlbnQ7XG4gICAgdGhpcy5fcmVjb3JkLmNyZWF0ZShwLCBjIGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKS5zdWJzY3JpYmUoKTtcbiAgfVxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5fcmVjb3JkU3luYy5kZWxldGUodGhpcy5fbm9ybWFsaXplUGF0aChwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3JlY29yZFN5bmMucmVuYW1lKHRoaXMuX25vcm1hbGl6ZVBhdGgoZnJvbSksIHRoaXMuX25vcm1hbGl6ZVBhdGgodG8pKTtcbiAgfVxuXG4gIGFwcGx5KGFjdGlvbjogQWN0aW9uLCBzdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQXBwbHkgbm90IGltcGxlbWVudGVkIG9uIGhvc3QgdHJlZXMuJyk7XG4gIH1cblxuICBwcml2YXRlICpnZW5lcmF0ZUFjdGlvbnMoKTogSXRlcmFibGU8QWN0aW9uPiB7XG4gICAgZm9yIChjb25zdCByZWNvcmQgb2YgdGhpcy5fcmVjb3JkLnJlY29yZHMoKSkge1xuICAgICAgc3dpdGNoIChyZWNvcmQua2luZCkge1xuICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHBhcmVudDogMCxcbiAgICAgICAgICAgIGtpbmQ6ICdjJyxcbiAgICAgICAgICAgIHBhdGg6IHJlY29yZC5wYXRoLFxuICAgICAgICAgICAgY29udGVudDogQnVmZmVyLmZyb20ocmVjb3JkLmNvbnRlbnQpLFxuICAgICAgICAgIH0gYXMgQ3JlYXRlRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnb3ZlcndyaXRlJzpcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICBraW5kOiAnbycsXG4gICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKHJlY29yZC5jb250ZW50KSxcbiAgICAgICAgICB9IGFzIE92ZXJ3cml0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JlbmFtZSc6XG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX2lkLFxuICAgICAgICAgICAgcGFyZW50OiAwLFxuICAgICAgICAgICAga2luZDogJ3InLFxuICAgICAgICAgICAgcGF0aDogcmVjb3JkLmZyb20sXG4gICAgICAgICAgICB0bzogcmVjb3JkLnRvLFxuICAgICAgICAgIH0gYXMgUmVuYW1lRmlsZUFjdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWQsXG4gICAgICAgICAgICBwYXJlbnQ6IDAsXG4gICAgICAgICAgICBraW5kOiAnZCcsXG4gICAgICAgICAgICBwYXRoOiByZWNvcmQucGF0aCxcbiAgICAgICAgICB9IGFzIERlbGV0ZUZpbGVBY3Rpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIC8vIENyZWF0ZSBhIGxpc3Qgb2YgYWxsIHJlY29yZHMgdW50aWwgd2UgaGl0IG91ciBvcmlnaW5hbCBiYWNrZW5kLiBUaGlzIGlzIHRvIHN1cHBvcnQgYnJhbmNoZXNcbiAgICAvLyB0aGF0IGRpdmVyZ2UgZnJvbSBlYWNoIG90aGVycy5cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmdlbmVyYXRlQWN0aW9ucygpKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG9zdENyZWF0ZVRyZWUgZXh0ZW5kcyBIb3N0VHJlZSB7XG4gIGNvbnN0cnVjdG9yKGhvc3Q6IHZpcnR1YWxGcy5SZWFkb25seUhvc3QpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgdGVtcEhvc3QgPSBuZXcgSG9zdFRyZWUoaG9zdCk7XG4gICAgdGVtcEhvc3QudmlzaXQoKHBhdGgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0ZW1wSG9zdC5yZWFkKHBhdGgpO1xuICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbHRlckhvc3RUcmVlIGV4dGVuZHMgSG9zdFRyZWUge1xuICBjb25zdHJ1Y3Rvcih0cmVlOiBIb3N0VHJlZSwgZmlsdGVyOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+ID0gKCkgPT4gdHJ1ZSkge1xuICAgIGNvbnN0IG5ld0JhY2tlbmQgPSBuZXcgdmlydHVhbEZzLlNpbXBsZU1lbW9yeUhvc3QoKTtcbiAgICAvLyBjYXN0IHRvIGFsbG93IGFjY2Vzc1xuICAgIGNvbnN0IG9yaWdpbmFsQmFja2VuZCA9ICh0cmVlIGFzIEZpbHRlckhvc3RUcmVlKS5fYmFja2VuZDtcblxuICAgIGNvbnN0IHJlY3Vyc2U6IChiYXNlOiBQYXRoKSA9PiBPYnNlcnZhYmxlPHZvaWQ+ID0gKGJhc2UpID0+IHtcbiAgICAgIHJldHVybiBvcmlnaW5hbEJhY2tlbmQubGlzdChiYXNlKS5waXBlKFxuICAgICAgICBtZXJnZU1hcCgoeCkgPT4geCksXG4gICAgICAgIG1hcCgocGF0aCkgPT4gam9pbihiYXNlLCBwYXRoKSksXG4gICAgICAgIGNvbmNhdE1hcCgocGF0aCkgPT4ge1xuICAgICAgICAgIGxldCBpc0RpcmVjdG9yeSA9IGZhbHNlO1xuICAgICAgICAgIG9yaWdpbmFsQmFja2VuZC5pc0RpcmVjdG9yeShwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGlzRGlyZWN0b3J5ID0gdmFsKSk7XG4gICAgICAgICAgaWYgKGlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjdXJzZShwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgaXNGaWxlID0gZmFsc2U7XG4gICAgICAgICAgb3JpZ2luYWxCYWNrZW5kLmlzRmlsZShwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGlzRmlsZSA9IHZhbCkpO1xuICAgICAgICAgIGlmICghaXNGaWxlIHx8ICFmaWx0ZXIocGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgY29udGVudDogQXJyYXlCdWZmZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBvcmlnaW5hbEJhY2tlbmQucmVhZChwYXRoKS5zdWJzY3JpYmUoKHZhbCkgPT4gKGNvbnRlbnQgPSB2YWwpKTtcbiAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbmV3QmFja2VuZC53cml0ZShwYXRoLCBjb250ZW50IGFzIHt9IGFzIHZpcnR1YWxGcy5GaWxlQnVmZmVyKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH07XG5cbiAgICByZWN1cnNlKG5vcm1hbGl6ZSgnLycpKS5zdWJzY3JpYmUoKTtcblxuICAgIHN1cGVyKG5ld0JhY2tlbmQpO1xuXG4gICAgZm9yIChjb25zdCBhY3Rpb24gb2YgdHJlZS5hY3Rpb25zKSB7XG4gICAgICBpZiAoIWZpbHRlcihhY3Rpb24ucGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoYWN0aW9uLmtpbmQpIHtcbiAgICAgICAgY2FzZSAnYyc6XG4gICAgICAgICAgdGhpcy5jcmVhdGUoYWN0aW9uLnBhdGgsIGFjdGlvbi5jb250ZW50KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgdGhpcy5kZWxldGUoYWN0aW9uLnBhdGgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdvJzpcbiAgICAgICAgICB0aGlzLm92ZXJ3cml0ZShhY3Rpb24ucGF0aCwgYWN0aW9uLmNvbnRlbnQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgICB0aGlzLnJlbmFtZShhY3Rpb24ucGF0aCwgYWN0aW9uLnRvKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==