"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyFileEntry = exports.SimpleFileEntry = void 0;
class SimpleFileEntry {
    constructor(_path, _content) {
        this._path = _path;
        this._content = _content;
    }
    get path() {
        return this._path;
    }
    get content() {
        return this._content;
    }
}
exports.SimpleFileEntry = SimpleFileEntry;
class LazyFileEntry {
    constructor(_path, _load) {
        this._path = _path;
        this._load = _load;
        this._content = null;
    }
    get path() {
        return this._path;
    }
    get content() {
        return this._content || (this._content = this._load(this._path));
    }
}
exports.LazyFileEntry = LazyFileEntry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL2VudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUtILE1BQWEsZUFBZTtJQUMxQixZQUFvQixLQUFXLEVBQVUsUUFBZ0I7UUFBckMsVUFBSyxHQUFMLEtBQUssQ0FBTTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQVE7SUFBRyxDQUFDO0lBRTdELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBQ0QsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQVRELDBDQVNDO0FBRUQsTUFBYSxhQUFhO0lBR3hCLFlBQW9CLEtBQVcsRUFBVSxLQUE4QjtRQUFuRCxVQUFLLEdBQUwsS0FBSyxDQUFNO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBeUI7UUFGL0QsYUFBUSxHQUFrQixJQUFJLENBQUM7SUFFbUMsQ0FBQztJQUUzRSxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUNELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFYRCxzQ0FXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQYXRoIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgRmlsZUVudHJ5IH0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRmlsZUVudHJ5IGltcGxlbWVudHMgRmlsZUVudHJ5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGF0aDogUGF0aCwgcHJpdmF0ZSBfY29udGVudDogQnVmZmVyKSB7fVxuXG4gIGdldCBwYXRoKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICB9XG4gIGdldCBjb250ZW50KCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZW50O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMYXp5RmlsZUVudHJ5IGltcGxlbWVudHMgRmlsZUVudHJ5IHtcbiAgcHJpdmF0ZSBfY29udGVudDogQnVmZmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGF0aDogUGF0aCwgcHJpdmF0ZSBfbG9hZDogKHBhdGg/OiBQYXRoKSA9PiBCdWZmZXIpIHt9XG5cbiAgZ2V0IHBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gIH1cbiAgZ2V0IGNvbnRlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnQgfHwgKHRoaXMuX2NvbnRlbnQgPSB0aGlzLl9sb2FkKHRoaXMuX3BhdGgpKTtcbiAgfVxufVxuIl19