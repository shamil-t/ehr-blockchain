"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunSchematicTask = void 0;
const options_1 = require("./options");
class RunSchematicTask {
    constructor(c, s, o) {
        if (arguments.length == 2 || typeof s !== 'string') {
            o = s;
            s = c;
            c = null;
        }
        this._collection = c;
        this._schematic = s;
        this._options = o;
    }
    toConfiguration() {
        return {
            name: options_1.RunSchematicName,
            options: {
                collection: this._collection,
                name: this._schematic,
                options: this._options,
            },
        };
    }
}
exports.RunSchematicTask = RunSchematicTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvcnVuLXNjaGVtYXRpYy90YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFzRTtBQUV0RSxNQUFhLGdCQUFnQjtJQVEzQixZQUFZLENBQWdCLEVBQUUsQ0FBYSxFQUFFLENBQUs7UUFDaEQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDbEQsQ0FBQyxHQUFHLENBQU0sQ0FBQztZQUNYLENBQUMsR0FBRyxDQUFXLENBQUM7WUFDaEIsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNWO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFNLENBQUM7SUFDekIsQ0FBQztJQUVELGVBQWU7UUFDYixPQUFPO1lBQ0wsSUFBSSxFQUFFLDBCQUFnQjtZQUN0QixPQUFPLEVBQUU7Z0JBQ1AsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXO2dCQUM1QixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7Z0JBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUTthQUN2QjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE5QkQsNENBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBSdW5TY2hlbWF0aWNOYW1lLCBSdW5TY2hlbWF0aWNUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBSdW5TY2hlbWF0aWNUYXNrPFQ+IGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8UnVuU2NoZW1hdGljVGFza09wdGlvbnM8VD4+IHtcbiAgcHJvdGVjdGVkIF9jb2xsZWN0aW9uOiBzdHJpbmcgfCBudWxsO1xuICBwcm90ZWN0ZWQgX3NjaGVtYXRpYzogc3RyaW5nO1xuICBwcm90ZWN0ZWQgX29wdGlvbnM6IFQ7XG5cbiAgY29uc3RydWN0b3Ioczogc3RyaW5nLCBvOiBUKTtcbiAgY29uc3RydWN0b3IoYzogc3RyaW5nLCBzOiBzdHJpbmcsIG86IFQpO1xuXG4gIGNvbnN0cnVjdG9yKGM6IHN0cmluZyB8IG51bGwsIHM6IHN0cmluZyB8IFQsIG8/OiBUKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMiB8fCB0eXBlb2YgcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG8gPSBzIGFzIFQ7XG4gICAgICBzID0gYyBhcyBzdHJpbmc7XG4gICAgICBjID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9jb2xsZWN0aW9uID0gYztcbiAgICB0aGlzLl9zY2hlbWF0aWMgPSBzO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvIGFzIFQ7XG4gIH1cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248UnVuU2NoZW1hdGljVGFza09wdGlvbnM8VD4+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogUnVuU2NoZW1hdGljTmFtZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5fY29sbGVjdGlvbixcbiAgICAgICAgbmFtZTogdGhpcy5fc2NoZW1hdGljLFxuICAgICAgICBvcHRpb25zOiB0aGlzLl9vcHRpb25zLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iXX0=