"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceFileCache = void 0;
class SourceFileCache extends Map {
    constructor() {
        super(...arguments);
        this.angularDiagnostics = new Map();
    }
    invalidate(file) {
        const sourceFile = this.get(file);
        if (sourceFile) {
            this.delete(file);
            this.angularDiagnostics.delete(sourceFile);
        }
    }
    updateAngularDiagnostics(sourceFile, diagnostics) {
        if (diagnostics.length > 0) {
            this.angularDiagnostics.set(sourceFile, diagnostics);
        }
        else {
            this.angularDiagnostics.delete(sourceFile);
        }
    }
    getAngularDiagnostics(sourceFile) {
        return this.angularDiagnostics.get(sourceFile);
    }
}
exports.SourceFileCache = SourceFileCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL2l2eS9jYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSCxNQUFhLGVBQWdCLFNBQVEsR0FBMEI7SUFBL0Q7O1FBQ21CLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUFrQyxDQUFDO0lBcUJsRixDQUFDO0lBbkJDLFVBQVUsQ0FBQyxJQUFZO1FBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDNUM7SUFDSCxDQUFDO0lBRUQsd0JBQXdCLENBQUMsVUFBeUIsRUFBRSxXQUE0QjtRQUM5RSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3REO2FBQU07WUFDTCxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVDO0lBQ0gsQ0FBQztJQUVELHFCQUFxQixDQUFDLFVBQXlCO1FBQzdDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0Y7QUF0QkQsMENBc0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5leHBvcnQgY2xhc3MgU291cmNlRmlsZUNhY2hlIGV4dGVuZHMgTWFwPHN0cmluZywgdHMuU291cmNlRmlsZT4ge1xuICBwcml2YXRlIHJlYWRvbmx5IGFuZ3VsYXJEaWFnbm9zdGljcyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgdHMuRGlhZ25vc3RpY1tdPigpO1xuXG4gIGludmFsaWRhdGUoZmlsZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHRoaXMuZ2V0KGZpbGUpO1xuICAgIGlmIChzb3VyY2VGaWxlKSB7XG4gICAgICB0aGlzLmRlbGV0ZShmaWxlKTtcbiAgICAgIHRoaXMuYW5ndWxhckRpYWdub3N0aWNzLmRlbGV0ZShzb3VyY2VGaWxlKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVBbmd1bGFyRGlhZ25vc3RpY3Moc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSk6IHZvaWQge1xuICAgIGlmIChkaWFnbm9zdGljcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmFuZ3VsYXJEaWFnbm9zdGljcy5zZXQoc291cmNlRmlsZSwgZGlhZ25vc3RpY3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFuZ3VsYXJEaWFnbm9zdGljcy5kZWxldGUoc291cmNlRmlsZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QW5ndWxhckRpYWdub3N0aWNzKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5EaWFnbm9zdGljW10gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmFuZ3VsYXJEaWFnbm9zdGljcy5nZXQoc291cmNlRmlsZSk7XG4gIH1cbn1cbiJdfQ==