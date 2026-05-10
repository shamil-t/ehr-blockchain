"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodePackageInstallTask = void 0;
const options_1 = require("./options");
class NodePackageInstallTask {
    constructor(options) {
        this.quiet = true;
        this.hideOutput = true;
        this.allowScripts = false;
        if (typeof options === 'string') {
            this.workingDirectory = options;
        }
        else if (typeof options === 'object') {
            if (options.quiet != undefined) {
                this.quiet = options.quiet;
            }
            if (options.hideOutput != undefined) {
                this.hideOutput = options.hideOutput;
            }
            if (options.workingDirectory != undefined) {
                this.workingDirectory = options.workingDirectory;
            }
            if (options.packageManager != undefined) {
                this.packageManager = options.packageManager;
            }
            if (options.packageName != undefined) {
                this.packageName = options.packageName;
            }
            if (options.allowScripts !== undefined) {
                this.allowScripts = options.allowScripts;
            }
        }
    }
    toConfiguration() {
        return {
            name: options_1.NodePackageName,
            options: {
                command: 'install',
                quiet: this.quiet,
                hideOutput: this.hideOutput,
                workingDirectory: this.workingDirectory,
                packageManager: this.packageManager,
                packageName: this.packageName,
                allowScripts: this.allowScripts,
            },
        };
    }
}
exports.NodePackageInstallTask = NodePackageInstallTask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90YXNrcy9wYWNrYWdlLW1hbmFnZXIvaW5zdGFsbC10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHVDQUFvRTtBQVdwRSxNQUFhLHNCQUFzQjtJQVVqQyxZQUFZLE9BQWdEO1FBVDVELFVBQUssR0FBRyxJQUFJLENBQUM7UUFDYixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBUW5CLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQy9CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7U0FDakM7YUFBTSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUN0QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksU0FBUyxFQUFFO2dCQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDNUI7WUFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksU0FBUyxFQUFFO2dCQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7YUFDdEM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7YUFDbEQ7WUFDRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksU0FBUyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7YUFDOUM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksU0FBUyxFQUFFO2dCQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7YUFDeEM7WUFDRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFO2dCQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7YUFDMUM7U0FDRjtJQUNILENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLElBQUksRUFBRSx5QkFBZTtZQUNyQixPQUFPLEVBQUU7Z0JBQ1AsT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUMzQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO2dCQUN2QyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ25DLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO2FBQ2hDO1NBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWpERCx3REFpREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgVGFza0NvbmZpZ3VyYXRpb24sIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yIH0gZnJvbSAnLi4vLi4vc3JjJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlTmFtZSwgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmludGVyZmFjZSBOb2RlUGFja2FnZUluc3RhbGxUYXNrT3B0aW9ucyB7XG4gIHBhY2thZ2VNYW5hZ2VyPzogc3RyaW5nO1xuICBwYWNrYWdlTmFtZT86IHN0cmluZztcbiAgd29ya2luZ0RpcmVjdG9yeT86IHN0cmluZztcbiAgcXVpZXQ/OiBib29sZWFuO1xuICBoaWRlT3V0cHV0PzogYm9vbGVhbjtcbiAgYWxsb3dTY3JpcHRzPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2sgaW1wbGVtZW50cyBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxOb2RlUGFja2FnZVRhc2tPcHRpb25zPiB7XG4gIHF1aWV0ID0gdHJ1ZTtcbiAgaGlkZU91dHB1dCA9IHRydWU7XG4gIGFsbG93U2NyaXB0cyA9IGZhbHNlO1xuICB3b3JraW5nRGlyZWN0b3J5Pzogc3RyaW5nO1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iod29ya2luZ0RpcmVjdG9yeT86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2tPcHRpb25zKTtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IHN0cmluZyB8IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2tPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKG9wdGlvbnMucXVpZXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucXVpZXQgPSBvcHRpb25zLnF1aWV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuaGlkZU91dHB1dCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5oaWRlT3V0cHV0ID0gb3B0aW9ucy5oaWRlT3V0cHV0O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMud29ya2luZ0RpcmVjdG9yeSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nRGlyZWN0b3J5ID0gb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU1hbmFnZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU1hbmFnZXIgPSBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGFja2FnZU5hbWUgPSBvcHRpb25zLnBhY2thZ2VOYW1lO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuYWxsb3dTY3JpcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5hbGxvd1NjcmlwdHMgPSBvcHRpb25zLmFsbG93U2NyaXB0cztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0b0NvbmZpZ3VyYXRpb24oKTogVGFza0NvbmZpZ3VyYXRpb248Tm9kZVBhY2thZ2VUYXNrT3B0aW9ucz4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNvbW1hbmQ6ICdpbnN0YWxsJyxcbiAgICAgICAgcXVpZXQ6IHRoaXMucXVpZXQsXG4gICAgICAgIGhpZGVPdXRwdXQ6IHRoaXMuaGlkZU91dHB1dCxcbiAgICAgICAgd29ya2luZ0RpcmVjdG9yeTogdGhpcy53b3JraW5nRGlyZWN0b3J5LFxuICAgICAgICBwYWNrYWdlTWFuYWdlcjogdGhpcy5wYWNrYWdlTWFuYWdlcixcbiAgICAgICAgcGFja2FnZU5hbWU6IHRoaXMucGFja2FnZU5hbWUsXG4gICAgICAgIGFsbG93U2NyaXB0czogdGhpcy5hbGxvd1NjcmlwdHMsXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==