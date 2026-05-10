"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePackageLinkTask = void 0;
const options_1 = require("./options");
class NodePackageLinkTask {
    constructor(packageName, workingDirectory) {
        this.packageName = packageName;
        this.workingDirectory = workingDirectory;
        this.quiet = true;
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'link',
                quiet: this.quiet,
                workingDirectory: this.workingDirectory,
                packageName: this.packageName,
            },
        };
    }
}
exports.NodePackageLinkTask = NodePackageLinkTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9wYWNrYWdlLW1hbmFnZXIvbGluay10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFvRTtBQUVwRSxNQUFhLG1CQUFtQjtJQUc5QixZQUFtQixXQUFvQixFQUFTLGdCQUF5QjtRQUF0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUFTLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUztRQUZ6RSxVQUFLLEdBQUcsSUFBSSxDQUFDO0lBRStELENBQUM7SUFFN0UsZUFBZTtRQUNiLE9BQU87WUFDTCxJQUFJLEVBQUUseUJBQWU7WUFDckIsT0FBTyxFQUFFO2dCQUNQLE9BQU8sRUFBRSxNQUFNO2dCQUNmLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDdkMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO2FBQzlCO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWhCRCxrREFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgVGFza0NvbmZpZ3VyYXRpb24sIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlTmFtZSwgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZUxpbmtUYXNrIGltcGxlbWVudHMgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICBxdWlldCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHBhY2thZ2VOYW1lPzogc3RyaW5nLCBwdWJsaWMgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZykge31cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1hbmQ6ICdsaW5rJyxcbiAgICAgICAgcXVpZXQ6IHRoaXMucXVpZXQsXG4gICAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IHRoaXMud29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgcGFja2FnZU5hbWU6IHRoaXMucGFja2FnZU5hbWUsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==