"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryInitializerTask = void 0;
const options_1 = require("./options");
class RepositoryInitializerTask {
    constructor(workingDirectory, commitOptions) {
        this.workingDirectory = workingDirectory;
        this.commitOptions = commitOptions;
    }
    toConfiguration() {
        return {
            name: options_1.RepositoryInitializerName,
            options: {
                commit: !!this.commitOptions,
                workingDirectory: this.workingDirectory,
                authorName: this.commitOptions && this.commitOptions.name,
                authorEmail: this.commitOptions && this.commitOptions.email,
                message: this.commitOptions && this.commitOptions.message,
            },
        };
    }
}
exports.RepositoryInitializerTask = RepositoryInitializerTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9yZXBvLWluaXQvaW5pdC10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUF3RjtBQVF4RixNQUFhLHlCQUF5QjtJQUVwQyxZQUFtQixnQkFBeUIsRUFBUyxhQUE2QjtRQUEvRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVM7UUFBUyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7SUFBRyxDQUFDO0lBRXRGLGVBQWU7UUFDYixPQUFPO1lBQ0wsSUFBSSxFQUFFLG1DQUF5QjtZQUMvQixPQUFPLEVBQUU7Z0JBQ1AsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYTtnQkFDNUIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDdkMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJO2dCQUN6RCxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUs7Z0JBQzNELE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTzthQUMxRDtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFoQkQsOERBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFRhc2tDb25maWd1cmF0aW9uLCBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJOYW1lLCBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWl0T3B0aW9ucyB7XG4gIG1lc3NhZ2U/OiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGVtYWlsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza1xuICBpbXBsZW1lbnRzIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yPFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB3b3JraW5nRGlyZWN0b3J5Pzogc3RyaW5nLCBwdWJsaWMgY29tbWl0T3B0aW9ucz86IENvbW1pdE9wdGlvbnMpIHt9XG5cbiAgdG9Db25maWd1cmF0aW9uKCk6IFRhc2tDb25maWd1cmF0aW9uPFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFJlcG9zaXRvcnlJbml0aWFsaXplck5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1pdDogISF0aGlzLmNvbW1pdE9wdGlvbnMsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgYXV0aG9yTmFtZTogdGhpcy5jb21taXRPcHRpb25zICYmIHRoaXMuY29tbWl0T3B0aW9ucy5uYW1lLFxuICAgICAgICBhdXRob3JFbWFpbDogdGhpcy5jb21taXRPcHRpb25zICYmIHRoaXMuY29tbWl0T3B0aW9ucy5lbWFpbCxcbiAgICAgICAgbWVzc2FnZTogdGhpcy5jb21taXRPcHRpb25zICYmIHRoaXMuY29tbWl0T3B0aW9ucy5tZXNzYWdlLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iXX0=