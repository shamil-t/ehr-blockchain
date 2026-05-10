"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInfoCommandModule = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const path_1 = require("path");
const command_module_1 = require("../../../command-builder/command-module");
const environment_options_1 = require("../../../utilities/environment-options");
const utilities_1 = require("../utilities");
class CacheInfoCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'info';
        this.describe = 'Prints persistent disk cache configuration and statistics in the console.';
        this.scope = command_module_1.CommandScope.In;
    }
    builder(localYargs) {
        return localYargs.strict();
    }
    async run() {
        const { path, environment, enabled } = (0, utilities_1.getCacheConfig)(this.context.workspace);
        this.context.logger.info(core_1.tags.stripIndents `
      Enabled: ${enabled ? 'yes' : 'no'}
      Environment: ${environment}
      Path: ${path}
      Size on disk: ${await this.getSizeOfDirectory(path)}
      Effective status on current machine: ${this.effectiveEnabledStatus() ? 'enabled' : 'disabled'}
    `);
    }
    async getSizeOfDirectory(path) {
        const directoriesStack = [path];
        let size = 0;
        while (directoriesStack.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const dirPath = directoriesStack.pop();
            let entries = [];
            try {
                entries = await fs_1.promises.readdir(dirPath);
            }
            catch { }
            for (const entry of entries) {
                const entryPath = (0, path_1.join)(dirPath, entry);
                const stats = await fs_1.promises.stat(entryPath);
                if (stats.isDirectory()) {
                    directoriesStack.push(entryPath);
                }
                size += stats.size;
            }
        }
        return this.formatSize(size);
    }
    formatSize(size) {
        if (size <= 0) {
            return '0 bytes';
        }
        const abbreviations = ['bytes', 'kB', 'MB', 'GB'];
        const index = Math.floor(Math.log(size) / Math.log(1024));
        const roundedSize = size / Math.pow(1024, index);
        // bytes don't have a fraction
        const fractionDigits = index === 0 ? 0 : 2;
        return `${roundedSize.toFixed(fractionDigits)} ${abbreviations[index]}`;
    }
    effectiveEnabledStatus() {
        const { enabled, environment } = (0, utilities_1.getCacheConfig)(this.context.workspace);
        if (enabled) {
            switch (environment) {
                case 'ci':
                    return environment_options_1.isCI;
                case 'local':
                    return !environment_options_1.isCI;
            }
        }
        return enabled;
    }
}
exports.CacheInfoCommandModule = CacheInfoCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NhY2hlL2luZm8vY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUE0QztBQUM1QywyQkFBb0M7QUFDcEMsK0JBQTRCO0FBRTVCLDRFQUlpRDtBQUNqRCxnRkFBOEQ7QUFDOUQsNENBQThDO0FBRTlDLE1BQWEsc0JBQXVCLFNBQVEsOEJBQWE7SUFBekQ7O1FBQ0UsWUFBTyxHQUFHLE1BQU0sQ0FBQztRQUNqQixhQUFRLEdBQUcsMkVBQTJFLENBQUM7UUFFOUUsVUFBSyxHQUFHLDZCQUFZLENBQUMsRUFBRSxDQUFDO0lBMEVuQyxDQUFDO0lBeEVDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFBLDBCQUFjLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUU5RSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBSSxDQUFDLFlBQVksQ0FBQTtpQkFDN0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUk7cUJBQ2xCLFdBQVc7Y0FDbEIsSUFBSTtzQkFDSSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7NkNBQ1osSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVTtLQUM5RixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQVk7UUFDM0MsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUViLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxFQUFFO1lBQzlCLG9FQUFvRTtZQUNwRSxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUcsQ0FBQztZQUN4QyxJQUFJLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFFM0IsSUFBSTtnQkFDRixPQUFPLEdBQUcsTUFBTSxhQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3JDO1lBQUMsTUFBTSxHQUFFO1lBRVYsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUU7Z0JBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxhQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUV2QyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRTtvQkFDdkIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUNsQztnQkFFRCxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQzthQUNwQjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTyxVQUFVLENBQUMsSUFBWTtRQUM3QixJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7WUFDYixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakQsOEJBQThCO1FBQzlCLE1BQU0sY0FBYyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTNDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQzFFLENBQUM7SUFFTyxzQkFBc0I7UUFDNUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFBLDBCQUFjLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV4RSxJQUFJLE9BQU8sRUFBRTtZQUNYLFFBQVEsV0FBVyxFQUFFO2dCQUNuQixLQUFLLElBQUk7b0JBQ1AsT0FBTywwQkFBSSxDQUFDO2dCQUNkLEtBQUssT0FBTztvQkFDVixPQUFPLENBQUMsMEJBQUksQ0FBQzthQUNoQjtTQUNGO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBOUVELHdEQThFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZSxcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBDb21tYW5kU2NvcGUsXG59IGZyb20gJy4uLy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBpc0NJIH0gZnJvbSAnLi4vLi4vLi4vdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgZ2V0Q2FjaGVDb25maWcgfSBmcm9tICcuLi91dGlsaXRpZXMnO1xuXG5leHBvcnQgY2xhc3MgQ2FjaGVJbmZvQ29tbWFuZE1vZHVsZSBleHRlbmRzIENvbW1hbmRNb2R1bGUgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24ge1xuICBjb21tYW5kID0gJ2luZm8nO1xuICBkZXNjcmliZSA9ICdQcmludHMgcGVyc2lzdGVudCBkaXNrIGNhY2hlIGNvbmZpZ3VyYXRpb24gYW5kIHN0YXRpc3RpY3MgaW4gdGhlIGNvbnNvbGUuJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aD86IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgb3ZlcnJpZGUgc2NvcGUgPSBDb21tYW5kU2NvcGUuSW47XG5cbiAgYnVpbGRlcihsb2NhbFlhcmdzOiBBcmd2KTogQXJndiB7XG4gICAgcmV0dXJuIGxvY2FsWWFyZ3Muc3RyaWN0KCk7XG4gIH1cblxuICBhc3luYyBydW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwYXRoLCBlbnZpcm9ubWVudCwgZW5hYmxlZCB9ID0gZ2V0Q2FjaGVDb25maWcodGhpcy5jb250ZXh0LndvcmtzcGFjZSk7XG5cbiAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmluZm8odGFncy5zdHJpcEluZGVudHNgXG4gICAgICBFbmFibGVkOiAke2VuYWJsZWQgPyAneWVzJyA6ICdubyd9XG4gICAgICBFbnZpcm9ubWVudDogJHtlbnZpcm9ubWVudH1cbiAgICAgIFBhdGg6ICR7cGF0aH1cbiAgICAgIFNpemUgb24gZGlzazogJHthd2FpdCB0aGlzLmdldFNpemVPZkRpcmVjdG9yeShwYXRoKX1cbiAgICAgIEVmZmVjdGl2ZSBzdGF0dXMgb24gY3VycmVudCBtYWNoaW5lOiAke3RoaXMuZWZmZWN0aXZlRW5hYmxlZFN0YXR1cygpID8gJ2VuYWJsZWQnIDogJ2Rpc2FibGVkJ31cbiAgICBgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0U2l6ZU9mRGlyZWN0b3J5KHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGlyZWN0b3JpZXNTdGFjayA9IFtwYXRoXTtcbiAgICBsZXQgc2l6ZSA9IDA7XG5cbiAgICB3aGlsZSAoZGlyZWN0b3JpZXNTdGFjay5sZW5ndGgpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICBjb25zdCBkaXJQYXRoID0gZGlyZWN0b3JpZXNTdGFjay5wb3AoKSE7XG4gICAgICBsZXQgZW50cmllczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXIoZGlyUGF0aCk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBlbnRyeVBhdGggPSBqb2luKGRpclBhdGgsIGVudHJ5KTtcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KGVudHJ5UGF0aCk7XG5cbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBkaXJlY3Rvcmllc1N0YWNrLnB1c2goZW50cnlQYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNpemUgKz0gc3RhdHMuc2l6ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5mb3JtYXRTaXplKHNpemUpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRTaXplKHNpemU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgcmV0dXJuICcwIGJ5dGVzJztcbiAgICB9XG5cbiAgICBjb25zdCBhYmJyZXZpYXRpb25zID0gWydieXRlcycsICdrQicsICdNQicsICdHQiddO1xuICAgIGNvbnN0IGluZGV4ID0gTWF0aC5mbG9vcihNYXRoLmxvZyhzaXplKSAvIE1hdGgubG9nKDEwMjQpKTtcbiAgICBjb25zdCByb3VuZGVkU2l6ZSA9IHNpemUgLyBNYXRoLnBvdygxMDI0LCBpbmRleCk7XG4gICAgLy8gYnl0ZXMgZG9uJ3QgaGF2ZSBhIGZyYWN0aW9uXG4gICAgY29uc3QgZnJhY3Rpb25EaWdpdHMgPSBpbmRleCA9PT0gMCA/IDAgOiAyO1xuXG4gICAgcmV0dXJuIGAke3JvdW5kZWRTaXplLnRvRml4ZWQoZnJhY3Rpb25EaWdpdHMpfSAke2FiYnJldmlhdGlvbnNbaW5kZXhdfWA7XG4gIH1cblxuICBwcml2YXRlIGVmZmVjdGl2ZUVuYWJsZWRTdGF0dXMoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgeyBlbmFibGVkLCBlbnZpcm9ubWVudCB9ID0gZ2V0Q2FjaGVDb25maWcodGhpcy5jb250ZXh0LndvcmtzcGFjZSk7XG5cbiAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgc3dpdGNoIChlbnZpcm9ubWVudCkge1xuICAgICAgICBjYXNlICdjaSc6XG4gICAgICAgICAgcmV0dXJuIGlzQ0k7XG4gICAgICAgIGNhc2UgJ2xvY2FsJzpcbiAgICAgICAgICByZXR1cm4gIWlzQ0k7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVuYWJsZWQ7XG4gIH1cbn1cbiJdfQ==