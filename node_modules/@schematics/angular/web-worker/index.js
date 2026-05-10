"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const parse_name_1 = require("../utility/parse-name");
const paths_1 = require("../utility/paths");
const workspace_1 = require("../utility/workspace");
function addSnippet(options) {
    return (host, context) => {
        context.logger.debug('Updating appmodule');
        if (options.path === undefined) {
            return;
        }
        const fileRegExp = new RegExp(`^${options.name}.*\\.ts`);
        const siblingModules = host
            .getDir(options.path)
            .subfiles // Find all files that start with the same name, are ts files,
            // and aren't spec or module files.
            .filter((f) => fileRegExp.test(f) && !/(module|spec)\.ts$/.test(f))
            // Sort alphabetically for consistency.
            .sort();
        if (siblingModules.length === 0) {
            // No module to add in.
            return;
        }
        const siblingModulePath = `${options.path}/${siblingModules[0]}`;
        const logMessage = 'console.log(`page got message: ${data}`);';
        const workerCreationSnippet = core_1.tags.stripIndent `
      if (typeof Worker !== 'undefined') {
        // Create a new
        const worker = new Worker(new URL('./${options.name}.worker', import.meta.url));
        worker.onmessage = ({ data }) => {
          ${logMessage}
        };
        worker.postMessage('hello');
      } else {
        // Web Workers are not supported in this environment.
        // You should add a fallback so that your program still executes correctly.
      }
    `;
        // Append the worker creation snippet.
        const originalContent = host.readText(siblingModulePath);
        host.overwrite(siblingModulePath, originalContent + '\n' + workerCreationSnippet);
        return host;
    };
}
function default_1(options) {
    return async (host) => {
        const workspace = await (0, workspace_1.getWorkspace)(host);
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option "project" is required.');
        }
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Invalid project name (${options.project})`);
        }
        const projectType = project.extensions['projectType'];
        if (projectType !== 'application') {
            throw new schematics_1.SchematicsException(`Web Worker requires a project type of "application".`);
        }
        if (options.path === undefined) {
            options.path = (0, workspace_1.buildDefaultPath)(project);
        }
        const parsedPath = (0, parse_name_1.parseName)(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        const templateSourceWorkerCode = (0, schematics_1.apply)((0, schematics_1.url)('./files/worker'), [
            (0, schematics_1.applyTemplates)({ ...options, ...schematics_1.strings }),
            (0, schematics_1.move)(parsedPath.path),
        ]);
        const root = project.root || '';
        const templateSourceWorkerConfig = (0, schematics_1.apply)((0, schematics_1.url)('./files/worker-tsconfig'), [
            (0, schematics_1.applyTemplates)({
                ...options,
                relativePathToWorkspaceRoot: (0, paths_1.relativePathToWorkspaceRoot)(root),
            }),
            (0, schematics_1.move)(root),
        ]);
        return (0, schematics_1.chain)([
            // Add project configuration.
            (0, workspace_1.updateWorkspace)((workspace) => {
                var _a, _b;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const project = workspace.projects.get(options.project);
                const buildTarget = project.targets.get('build');
                const testTarget = project.targets.get('test');
                if (!buildTarget) {
                    throw new Error(`Build target is not defined for this project.`);
                }
                const workerConfigPath = (0, core_1.join)((0, core_1.normalize)(root), 'tsconfig.worker.json');
                (_a = (buildTarget.options ?? (buildTarget.options = {}))).webWorkerTsConfig ?? (_a.webWorkerTsConfig = workerConfigPath);
                if (testTarget) {
                    (_b = (testTarget.options ?? (testTarget.options = {}))).webWorkerTsConfig ?? (_b.webWorkerTsConfig = workerConfigPath);
                }
            }),
            // Create the worker in a sibling module.
            options.snippet ? addSnippet(options) : (0, schematics_1.noop)(),
            // Add the worker.
            (0, schematics_1.mergeWith)(templateSourceWorkerCode),
            (0, schematics_1.mergeWith)(templateSourceWorkerConfig),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvd2ViLXdvcmtlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtDQUE2RDtBQUM3RCwyREFhb0M7QUFDcEMsc0RBQWtEO0FBQ2xELDRDQUErRDtBQUMvRCxvREFBdUY7QUFHdkYsU0FBUyxVQUFVLENBQUMsT0FBeUI7SUFDM0MsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUUzQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQzlCLE9BQU87U0FDUjtRQUVELE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUM7UUFDekQsTUFBTSxjQUFjLEdBQUcsSUFBSTthQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQzthQUNwQixRQUFRLENBQUMsOERBQThEO1lBQ3hFLG1DQUFtQzthQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsdUNBQXVDO2FBQ3RDLElBQUksRUFBRSxDQUFDO1FBRVYsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUMvQix1QkFBdUI7WUFDdkIsT0FBTztTQUNSO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDakUsTUFBTSxVQUFVLEdBQUcs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TyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztpQkFDbEU7Z0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFBLGdCQUFTLEVBQUMsSUFBSSxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDdkUsTUFBQSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEtBQW5CLFdBQVcsQ0FBQyxPQUFPLEdBQUssRUFBRSxFQUFDLEVBQUMsaUJBQWlCLFFBQWpCLGlCQUFpQixHQUFLLGdCQUFnQixFQUFDO2dCQUNwRSxJQUFJLFVBQVUsRUFBRTtvQkFDZCxNQUFBLENBQUMsVUFBVSxDQUFDLE9BQU8sS0FBbEIsVUFBVSxDQUFDLE9BQU8sR0FBSyxFQUFFLEVBQUMsRUFBQyxpQkFBaUIsUUFBakIsaUJBQWlCLEdBQUssZ0JBQWdCLEVBQUM7aUJBQ3BFO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YseUNBQXlDO1lBQ3pDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxpQkFBSSxHQUFFO1lBQzlDLGtCQUFrQjtZQUNsQixJQUFBLHNCQUFTLEVBQUMsd0JBQXdCLENBQUM7WUFDbkMsSUFBQSxzQkFBUyxFQUFDLDBCQUEwQixDQUFDO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUEvREQsNEJBK0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpvaW4sIG5vcm1hbGl6ZSwgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBhcHBseVRlbXBsYXRlcyxcbiAgY2hhaW4sXG4gIG1lcmdlV2l0aCxcbiAgbW92ZSxcbiAgbm9vcCxcbiAgc3RyaW5ncyxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBwYXJzZU5hbWUgfSBmcm9tICcuLi91dGlsaXR5L3BhcnNlLW5hbWUnO1xuaW1wb3J0IHsgcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290IH0gZnJvbSAnLi4vdXRpbGl0eS9wYXRocyc7XG5pbXBvcnQgeyBidWlsZERlZmF1bHRQYXRoLCBnZXRXb3Jrc3BhY2UsIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdHkvd29ya3NwYWNlJztcbmltcG9ydCB7IFNjaGVtYSBhcyBXZWJXb3JrZXJPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5mdW5jdGlvbiBhZGRTbmlwcGV0KG9wdGlvbnM6IFdlYldvcmtlck9wdGlvbnMpOiBSdWxlIHtcbiAgcmV0dXJuIChob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29udGV4dC5sb2dnZXIuZGVidWcoJ1VwZGF0aW5nIGFwcG1vZHVsZScpO1xuXG4gICAgaWYgKG9wdGlvbnMucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZVJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke29wdGlvbnMubmFtZX0uKlxcXFwudHNgKTtcbiAgICBjb25zdCBzaWJsaW5nTW9kdWxlcyA9IGhvc3RcbiAgICAgIC5nZXREaXIob3B0aW9ucy5wYXRoKVxuICAgICAgLnN1YmZpbGVzIC8vIEZpbmQgYWxsIGZpbGVzIHRoYXQgc3RhcnQgd2l0aCB0aGUgc2FtZSBuYW1lLCBhcmUgdHMgZmlsZXMsXG4gICAgICAvLyBhbmQgYXJlbid0IHNwZWMgb3IgbW9kdWxlIGZpbGVzLlxuICAgICAgLmZpbHRlcigoZikgPT4gZmlsZVJlZ0V4cC50ZXN0KGYpICYmICEvKG1vZHVsZXxzcGVjKVxcLnRzJC8udGVzdChmKSlcbiAgICAgIC8vIFNvcnQgYWxwaGFiZXRpY2FsbHkgZm9yIGNvbnNpc3RlbmN5LlxuICAgICAgLnNvcnQoKTtcblxuICAgIGlmIChzaWJsaW5nTW9kdWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIE5vIG1vZHVsZSB0byBhZGQgaW4uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2libGluZ01vZHVsZVBhdGggPSBgJHtvcHRpb25zLnBhdGh9LyR7c2libGluZ01vZHVsZXNbMF19YDtcbiAgICBjb25zdCBsb2dNZXNzYWdlID0gJ2NvbnNvbGUubG9nKGBwYWdlIGdvdCBtZXNzYWdlOiAke2RhdGF9YCk7JztcbiAgICBjb25zdCB3b3JrZXJDcmVhdGlvblNuaXBwZXQgPSB0YWdzLnN0cmlwSW5kZW50YFxuICAgICAgaWYgKHR5cGVvZiBXb3JrZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIG5ld1xuICAgICAgICBjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKG5ldyBVUkwoJy4vJHtvcHRpb25zLm5hbWV9LndvcmtlcicsIGltcG9ydC5tZXRhLnVybCkpO1xuICAgICAgICB3b3JrZXIub25tZXNzYWdlID0gKHsgZGF0YSB9KSA9PiB7XG4gICAgICAgICAgJHtsb2dNZXNzYWdlfVxuICAgICAgICB9O1xuICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoJ2hlbGxvJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZWIgV29ya2VycyBhcmUgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGVudmlyb25tZW50LlxuICAgICAgICAvLyBZb3Ugc2hvdWxkIGFkZCBhIGZhbGxiYWNrIHNvIHRoYXQgeW91ciBwcm9ncmFtIHN0aWxsIGV4ZWN1dGVzIGNvcnJlY3RseS5cbiAgICAgIH1cbiAgICBgO1xuXG4gICAgLy8gQXBwZW5kIHRoZSB3b3JrZXIgY3JlYXRpb24gc25pcHBldC5cbiAgICBjb25zdCBvcmlnaW5hbENvbnRlbnQgPSBob3N0LnJlYWRUZXh0KHNpYmxpbmdNb2R1bGVQYXRoKTtcbiAgICBob3N0Lm92ZXJ3cml0ZShzaWJsaW5nTW9kdWxlUGF0aCwgb3JpZ2luYWxDb250ZW50ICsgJ1xcbicgKyB3b3JrZXJDcmVhdGlvblNuaXBwZXQpO1xuXG4gICAgcmV0dXJuIGhvc3Q7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBXZWJXb3JrZXJPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZShob3N0KTtcblxuICAgIGlmICghb3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignT3B0aW9uIFwicHJvamVjdFwiIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCk7XG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgSW52YWxpZCBwcm9qZWN0IG5hbWUgKCR7b3B0aW9ucy5wcm9qZWN0fSlgKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9qZWN0VHlwZSA9IHByb2plY3QuZXh0ZW5zaW9uc1sncHJvamVjdFR5cGUnXTtcbiAgICBpZiAocHJvamVjdFR5cGUgIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBXZWIgV29ya2VyIHJlcXVpcmVzIGEgcHJvamVjdCB0eXBlIG9mIFwiYXBwbGljYXRpb25cIi5gKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMucGF0aCA9IGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdCk7XG4gICAgfVxuICAgIGNvbnN0IHBhcnNlZFBhdGggPSBwYXJzZU5hbWUob3B0aW9ucy5wYXRoLCBvcHRpb25zLm5hbWUpO1xuICAgIG9wdGlvbnMubmFtZSA9IHBhcnNlZFBhdGgubmFtZTtcbiAgICBvcHRpb25zLnBhdGggPSBwYXJzZWRQYXRoLnBhdGg7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZVdvcmtlckNvZGUgPSBhcHBseSh1cmwoJy4vZmlsZXMvd29ya2VyJyksIFtcbiAgICAgIGFwcGx5VGVtcGxhdGVzKHsgLi4ub3B0aW9ucywgLi4uc3RyaW5ncyB9KSxcbiAgICAgIG1vdmUocGFyc2VkUGF0aC5wYXRoKSxcbiAgICBdKTtcblxuICAgIGNvbnN0IHJvb3QgPSBwcm9qZWN0LnJvb3QgfHwgJyc7XG4gICAgY29uc3QgdGVtcGxhdGVTb3VyY2VXb3JrZXJDb25maWcgPSBhcHBseSh1cmwoJy4vZmlsZXMvd29ya2VyLXRzY29uZmlnJyksIFtcbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgcmVsYXRpdmVQYXRoVG9Xb3Jrc3BhY2VSb290OiByZWxhdGl2ZVBhdGhUb1dvcmtzcGFjZVJvb3Qocm9vdCksXG4gICAgICB9KSxcbiAgICAgIG1vdmUocm9vdCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgLy8gQWRkIHByb2plY3QgY29uZmlndXJhdGlvbi5cbiAgICAgIHVwZGF0ZVdvcmtzcGFjZSgod29ya3NwYWNlKSA9PiB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHMuZ2V0KG9wdGlvbnMucHJvamVjdCkhO1xuICAgICAgICBjb25zdCBidWlsZFRhcmdldCA9IHByb2plY3QudGFyZ2V0cy5nZXQoJ2J1aWxkJyk7XG4gICAgICAgIGNvbnN0IHRlc3RUYXJnZXQgPSBwcm9qZWN0LnRhcmdldHMuZ2V0KCd0ZXN0Jyk7XG4gICAgICAgIGlmICghYnVpbGRUYXJnZXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJ1aWxkIHRhcmdldCBpcyBub3QgZGVmaW5lZCBmb3IgdGhpcyBwcm9qZWN0LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd29ya2VyQ29uZmlnUGF0aCA9IGpvaW4obm9ybWFsaXplKHJvb3QpLCAndHNjb25maWcud29ya2VyLmpzb24nKTtcbiAgICAgICAgKGJ1aWxkVGFyZ2V0Lm9wdGlvbnMgPz89IHt9KS53ZWJXb3JrZXJUc0NvbmZpZyA/Pz0gd29ya2VyQ29uZmlnUGF0aDtcbiAgICAgICAgaWYgKHRlc3RUYXJnZXQpIHtcbiAgICAgICAgICAodGVzdFRhcmdldC5vcHRpb25zID8/PSB7fSkud2ViV29ya2VyVHNDb25maWcgPz89IHdvcmtlckNvbmZpZ1BhdGg7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgLy8gQ3JlYXRlIHRoZSB3b3JrZXIgaW4gYSBzaWJsaW5nIG1vZHVsZS5cbiAgICAgIG9wdGlvbnMuc25pcHBldCA/IGFkZFNuaXBwZXQob3B0aW9ucykgOiBub29wKCksXG4gICAgICAvLyBBZGQgdGhlIHdvcmtlci5cbiAgICAgIG1lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZVdvcmtlckNvZGUpLFxuICAgICAgbWVyZ2VXaXRoKHRlbXBsYXRlU291cmNlV29ya2VyQ29uZmlnKSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==