"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonWorkspaceMetadata = exports.JsonWorkspaceSymbol = void 0;
const jsonc_parser_1 = require("jsonc-parser");
exports.JsonWorkspaceSymbol = Symbol.for('@angular/core:workspace-json');
function escapeKey(key) {
    return key.replace('~', '~0').replace('/', '~1');
}
class JsonWorkspaceMetadata {
    constructor(filePath, ast, raw) {
        this.filePath = filePath;
        this.ast = ast;
        this.raw = raw;
        this.changes = new Map();
        this.hasLegacyTargetsName = true;
    }
    get hasChanges() {
        return this.changes.size > 0;
    }
    get changeCount() {
        return this.changes.size;
    }
    getNodeValueFromAst(path) {
        const node = (0, jsonc_parser_1.findNodeAtLocation)(this.ast, path);
        return node && (0, jsonc_parser_1.getNodeValue)(node);
    }
    findChangesForPath(path) {
        return this.changes.get(path);
    }
    addChange(jsonPath, value, type) {
        let currentPath = '';
        for (let index = 0; index < jsonPath.length - 1; index++) {
            currentPath = currentPath + '/' + escapeKey(jsonPath[index]);
            if (this.changes.has(currentPath)) {
                // Ignore changes on children as parent is updated.
                return;
            }
        }
        const pathKey = '/' + jsonPath.map((k) => escapeKey(k)).join('/');
        for (const key of this.changes.keys()) {
            if (key.startsWith(pathKey + '/')) {
                // changes on the same or child paths are redundant.
                this.changes.delete(key);
            }
        }
        this.changes.set(pathKey, { jsonPath, type, value });
    }
}
exports.JsonWorkspaceMetadata = JsonWorkspaceMetadata;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UvanNvbi9tZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBZ0Y7QUFJbkUsUUFBQSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFvQjlFLFNBQVMsU0FBUyxDQUFDLEdBQVc7SUFDNUIsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxNQUFhLHFCQUFxQjtJQUtoQyxZQUFxQixRQUFnQixFQUFtQixHQUFTLEVBQVcsR0FBVztRQUFsRSxhQUFRLEdBQVIsUUFBUSxDQUFRO1FBQW1CLFFBQUcsR0FBSCxHQUFHLENBQU07UUFBVyxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBSjlFLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBc0IsQ0FBQztRQUVqRCx5QkFBb0IsR0FBRyxJQUFJLENBQUM7SUFFOEQsQ0FBQztJQUUzRixJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUMzQixDQUFDO0lBRUQsbUJBQW1CLENBQUMsSUFBYztRQUNoQyxNQUFNLElBQUksR0FBRyxJQUFBLGlDQUFrQixFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFaEQsT0FBTyxJQUFJLElBQUksSUFBQSwyQkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxJQUFZO1FBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELFNBQVMsQ0FDUCxRQUFrQixFQUNsQixLQUFrQyxFQUNsQyxJQUFRO1FBRVIsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUN4RCxXQUFXLEdBQUcsV0FBVyxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDN0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDakMsbURBQW1EO2dCQUNuRCxPQUFPO2FBQ1I7U0FDRjtRQUVELE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEUsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3JDLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLEVBQUU7Z0JBQ2pDLG9EQUFvRDtnQkFDcEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDMUI7U0FDRjtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0Y7QUFqREQsc0RBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEpTT05QYXRoLCBOb2RlLCBmaW5kTm9kZUF0TG9jYXRpb24sIGdldE5vZGVWYWx1ZSB9IGZyb20gJ2pzb25jLXBhcnNlcic7XG5pbXBvcnQgeyBKc29uVmFsdWUgfSBmcm9tICcuLi8uLi9qc29uJztcbmltcG9ydCB7IFByb2plY3REZWZpbml0aW9uLCBUYXJnZXREZWZpbml0aW9uLCBXb3Jrc3BhY2VEZWZpbml0aW9uIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMnO1xuXG5leHBvcnQgY29uc3QgSnNvbldvcmtzcGFjZVN5bWJvbCA9IFN5bWJvbC5mb3IoJ0Bhbmd1bGFyL2NvcmU6d29ya3NwYWNlLWpzb24nKTtcblxuZXhwb3J0IGludGVyZmFjZSBKc29uV29ya3NwYWNlRGVmaW5pdGlvbiBleHRlbmRzIFdvcmtzcGFjZURlZmluaXRpb24ge1xuICBbSnNvbldvcmtzcGFjZVN5bWJvbF06IEpzb25Xb3Jrc3BhY2VNZXRhZGF0YTtcbn1cblxuaW50ZXJmYWNlIENoYW5nZVZhbHVlcyB7XG4gIGpzb246IEpzb25WYWx1ZTtcbiAgcHJvamVjdDogUHJvamVjdERlZmluaXRpb247XG4gIHRhcmdldDogVGFyZ2V0RGVmaW5pdGlvbjtcbiAgcHJvamVjdGNvbGxlY3Rpb246IEl0ZXJhYmxlPFtzdHJpbmcsIFByb2plY3REZWZpbml0aW9uXT47XG4gIHRhcmdldGNvbGxlY3Rpb246IEl0ZXJhYmxlPFtzdHJpbmcsIFRhcmdldERlZmluaXRpb25dPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBKc29uQ2hhbmdlIHtcbiAgdmFsdWU/OiB1bmtub3duO1xuICB0eXBlPzoga2V5b2YgQ2hhbmdlVmFsdWVzO1xuICBqc29uUGF0aDogc3RyaW5nW107XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUtleShrZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bWJlciB7XG4gIHJldHVybiBrZXkucmVwbGFjZSgnficsICd+MCcpLnJlcGxhY2UoJy8nLCAnfjEnKTtcbn1cblxuZXhwb3J0IGNsYXNzIEpzb25Xb3Jrc3BhY2VNZXRhZGF0YSB7XG4gIHJlYWRvbmx5IGNoYW5nZXMgPSBuZXcgTWFwPHN0cmluZywgSnNvbkNoYW5nZT4oKTtcblxuICBoYXNMZWdhY3lUYXJnZXRzTmFtZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZmlsZVBhdGg6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSBhc3Q6IE5vZGUsIHJlYWRvbmx5IHJhdzogc3RyaW5nKSB7fVxuXG4gIGdldCBoYXNDaGFuZ2VzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZXMuc2l6ZSA+IDA7XG4gIH1cblxuICBnZXQgY2hhbmdlQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VzLnNpemU7XG4gIH1cblxuICBnZXROb2RlVmFsdWVGcm9tQXN0KHBhdGg6IEpTT05QYXRoKTogdW5rbm93biB7XG4gICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQXRMb2NhdGlvbih0aGlzLmFzdCwgcGF0aCk7XG5cbiAgICByZXR1cm4gbm9kZSAmJiBnZXROb2RlVmFsdWUobm9kZSk7XG4gIH1cblxuICBmaW5kQ2hhbmdlc0ZvclBhdGgocGF0aDogc3RyaW5nKTogSnNvbkNoYW5nZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlcy5nZXQocGF0aCk7XG4gIH1cblxuICBhZGRDaGFuZ2U8VCBleHRlbmRzIGtleW9mIENoYW5nZVZhbHVlcyA9IGtleW9mIENoYW5nZVZhbHVlcz4oXG4gICAganNvblBhdGg6IHN0cmluZ1tdLFxuICAgIHZhbHVlOiBDaGFuZ2VWYWx1ZXNbVF0gfCB1bmRlZmluZWQsXG4gICAgdHlwZT86IFQsXG4gICk6IHZvaWQge1xuICAgIGxldCBjdXJyZW50UGF0aCA9ICcnO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBqc29uUGF0aC5sZW5ndGggLSAxOyBpbmRleCsrKSB7XG4gICAgICBjdXJyZW50UGF0aCA9IGN1cnJlbnRQYXRoICsgJy8nICsgZXNjYXBlS2V5KGpzb25QYXRoW2luZGV4XSk7XG4gICAgICBpZiAodGhpcy5jaGFuZ2VzLmhhcyhjdXJyZW50UGF0aCkpIHtcbiAgICAgICAgLy8gSWdub3JlIGNoYW5nZXMgb24gY2hpbGRyZW4gYXMgcGFyZW50IGlzIHVwZGF0ZWQuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwYXRoS2V5ID0gJy8nICsganNvblBhdGgubWFwKChrKSA9PiBlc2NhcGVLZXkoaykpLmpvaW4oJy8nKTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLmNoYW5nZXMua2V5cygpKSB7XG4gICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgocGF0aEtleSArICcvJykpIHtcbiAgICAgICAgLy8gY2hhbmdlcyBvbiB0aGUgc2FtZSBvciBjaGlsZCBwYXRocyBhcmUgcmVkdW5kYW50LlxuICAgICAgICB0aGlzLmNoYW5nZXMuZGVsZXRlKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jaGFuZ2VzLnNldChwYXRoS2V5LCB7IGpzb25QYXRoLCB0eXBlLCB2YWx1ZSB9KTtcbiAgfVxufVxuIl19