"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function default_1(options) {
    if (!options.directory) {
        // If scoped project (i.e. "@foo/bar"), convert directory to "foo/bar".
        options.directory = options.name.startsWith('@') ? options.name.slice(1) : options.name;
    }
    const workspaceOptions = {
        name: options.name,
        version: options.version,
        newProjectRoot: options.newProjectRoot,
        minimal: options.minimal,
        strict: options.strict,
        packageManager: options.packageManager,
    };
    const applicationOptions = {
        projectRoot: '',
        name: options.name,
        inlineStyle: options.inlineStyle,
        inlineTemplate: options.inlineTemplate,
        prefix: options.prefix,
        viewEncapsulation: options.viewEncapsulation,
        routing: options.routing,
        style: options.style,
        skipTests: options.skipTests,
        skipPackageJson: false,
        // always 'skipInstall' here, so that we do it after the move
        skipInstall: true,
        strict: options.strict,
        minimal: options.minimal,
        standalone: options.standalone,
    };
    return (0, schematics_1.chain)([
        (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.empty)(), [
            (0, schematics_1.schematic)('workspace', workspaceOptions),
            options.createApplication ? (0, schematics_1.schematic)('application', applicationOptions) : schematics_1.noop,
            (0, schematics_1.move)(options.directory),
        ])),
        (_host, context) => {
            let packageTask;
            if (!options.skipInstall) {
                packageTask = context.addTask(new tasks_1.NodePackageInstallTask({
                    workingDirectory: options.directory,
                    packageManager: options.packageManager,
                }));
                if (options.linkCli) {
                    packageTask = context.addTask(new tasks_1.NodePackageLinkTask('@angular/cli', options.directory), [packageTask]);
                }
            }
            if (!options.skipGit) {
                const commit = typeof options.commit == 'object' ? options.commit : options.commit ? {} : false;
                context.addTask(new tasks_1.RepositoryInitializerTask(options.directory, commit), packageTask ? [packageTask] : []);
            }
        },
    ]);
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvbmctbmV3L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBV29DO0FBQ3BDLDREQUkwQztBQUsxQyxtQkFBeUIsT0FBcUI7SUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDdEIsdUVBQXVFO1FBQ3ZFLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0tBQ3pGO0lBRUQsTUFBTSxnQkFBZ0IsR0FBcUI7UUFDekMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztRQUN4QixjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7UUFDdEMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1FBQ3hCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7S0FDdkMsQ0FBQztJQUNGLE1BQU0sa0JBQWtCLEdBQXVCO1FBQzdDLFdBQVcsRUFBRSxFQUFFO1FBQ2YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztRQUNoQyxjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7UUFDdEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1FBQ3RCLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxpQkFBaUI7UUFDNUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1FBQ3hCLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztRQUNwQixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7UUFDNUIsZUFBZSxFQUFFLEtBQUs7UUFDdEIsNkRBQTZEO1FBQzdELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDeEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO0tBQy9CLENBQUM7SUFFRixPQUFPLElBQUEsa0JBQUssRUFBQztRQUNYLElBQUEsc0JBQVMsRUFDUCxJQUFBLGtCQUFLLEVBQUMsSUFBQSxrQkFBSyxHQUFFLEVBQUU7WUFDYixJQUFBLHNCQUFTLEVBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDO1lBQ3hDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBQSxzQkFBUyxFQUFDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBSTtZQUMvRSxJQUFBLGlCQUFJLEVBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUN4QixDQUFDLENBQ0g7UUFDRCxDQUFDLEtBQVcsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDekMsSUFBSSxXQUFXLENBQUM7WUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQ3hCLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUMzQixJQUFJLDhCQUFzQixDQUFDO29CQUN6QixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsU0FBUztvQkFDbkMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO2lCQUN2QyxDQUFDLENBQ0gsQ0FBQztnQkFDRixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7b0JBQ25CLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUMzQixJQUFJLDJCQUFtQixDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQzFELENBQUMsV0FBVyxDQUFDLENBQ2QsQ0FBQztpQkFDSDthQUNGO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLE1BQU0sTUFBTSxHQUNWLE9BQU8sT0FBTyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUVuRixPQUFPLENBQUMsT0FBTyxDQUNiLElBQUksaUNBQXlCLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFDeEQsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQ2pDLENBQUM7YUFDSDtRQUNILENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBbkVELDRCQW1FQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBSdWxlLFxuICBTY2hlbWF0aWNDb250ZXh0LFxuICBUcmVlLFxuICBhcHBseSxcbiAgY2hhaW4sXG4gIGVtcHR5LFxuICBtZXJnZVdpdGgsXG4gIG1vdmUsXG4gIG5vb3AsXG4gIHNjaGVtYXRpYyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtcbiAgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayxcbiAgTm9kZVBhY2thZ2VMaW5rVGFzayxcbiAgUmVwb3NpdG9yeUluaXRpYWxpemVyVGFzayxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEFwcGxpY2F0aW9uT3B0aW9ucyB9IGZyb20gJy4uL2FwcGxpY2F0aW9uL3NjaGVtYSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgV29ya3NwYWNlT3B0aW9ucyB9IGZyb20gJy4uL3dvcmtzcGFjZS9zY2hlbWEnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIE5nTmV3T3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IE5nTmV3T3B0aW9ucyk6IFJ1bGUge1xuICBpZiAoIW9wdGlvbnMuZGlyZWN0b3J5KSB7XG4gICAgLy8gSWYgc2NvcGVkIHByb2plY3QgKGkuZS4gXCJAZm9vL2JhclwiKSwgY29udmVydCBkaXJlY3RvcnkgdG8gXCJmb28vYmFyXCIuXG4gICAgb3B0aW9ucy5kaXJlY3RvcnkgPSBvcHRpb25zLm5hbWUuc3RhcnRzV2l0aCgnQCcpID8gb3B0aW9ucy5uYW1lLnNsaWNlKDEpIDogb3B0aW9ucy5uYW1lO1xuICB9XG5cbiAgY29uc3Qgd29ya3NwYWNlT3B0aW9uczogV29ya3NwYWNlT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgdmVyc2lvbjogb3B0aW9ucy52ZXJzaW9uLFxuICAgIG5ld1Byb2plY3RSb290OiBvcHRpb25zLm5ld1Byb2plY3RSb290LFxuICAgIG1pbmltYWw6IG9wdGlvbnMubWluaW1hbCxcbiAgICBzdHJpY3Q6IG9wdGlvbnMuc3RyaWN0LFxuICAgIHBhY2thZ2VNYW5hZ2VyOiBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyLFxuICB9O1xuICBjb25zdCBhcHBsaWNhdGlvbk9wdGlvbnM6IEFwcGxpY2F0aW9uT3B0aW9ucyA9IHtcbiAgICBwcm9qZWN0Um9vdDogJycsXG4gICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgIGlubGluZVN0eWxlOiBvcHRpb25zLmlubGluZVN0eWxlLFxuICAgIGlubGluZVRlbXBsYXRlOiBvcHRpb25zLmlubGluZVRlbXBsYXRlLFxuICAgIHByZWZpeDogb3B0aW9ucy5wcmVmaXgsXG4gICAgdmlld0VuY2Fwc3VsYXRpb246IG9wdGlvbnMudmlld0VuY2Fwc3VsYXRpb24sXG4gICAgcm91dGluZzogb3B0aW9ucy5yb3V0aW5nLFxuICAgIHN0eWxlOiBvcHRpb25zLnN0eWxlLFxuICAgIHNraXBUZXN0czogb3B0aW9ucy5za2lwVGVzdHMsXG4gICAgc2tpcFBhY2thZ2VKc29uOiBmYWxzZSxcbiAgICAvLyBhbHdheXMgJ3NraXBJbnN0YWxsJyBoZXJlLCBzbyB0aGF0IHdlIGRvIGl0IGFmdGVyIHRoZSBtb3ZlXG4gICAgc2tpcEluc3RhbGw6IHRydWUsXG4gICAgc3RyaWN0OiBvcHRpb25zLnN0cmljdCxcbiAgICBtaW5pbWFsOiBvcHRpb25zLm1pbmltYWwsXG4gICAgc3RhbmRhbG9uZTogb3B0aW9ucy5zdGFuZGFsb25lLFxuICB9O1xuXG4gIHJldHVybiBjaGFpbihbXG4gICAgbWVyZ2VXaXRoKFxuICAgICAgYXBwbHkoZW1wdHkoKSwgW1xuICAgICAgICBzY2hlbWF0aWMoJ3dvcmtzcGFjZScsIHdvcmtzcGFjZU9wdGlvbnMpLFxuICAgICAgICBvcHRpb25zLmNyZWF0ZUFwcGxpY2F0aW9uID8gc2NoZW1hdGljKCdhcHBsaWNhdGlvbicsIGFwcGxpY2F0aW9uT3B0aW9ucykgOiBub29wLFxuICAgICAgICBtb3ZlKG9wdGlvbnMuZGlyZWN0b3J5KSxcbiAgICAgIF0pLFxuICAgICksXG4gICAgKF9ob3N0OiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgICBsZXQgcGFja2FnZVRhc2s7XG4gICAgICBpZiAoIW9wdGlvbnMuc2tpcEluc3RhbGwpIHtcbiAgICAgICAgcGFja2FnZVRhc2sgPSBjb250ZXh0LmFkZFRhc2soXG4gICAgICAgICAgbmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe1xuICAgICAgICAgICAgd29ya2luZ0RpcmVjdG9yeTogb3B0aW9ucy5kaXJlY3RvcnksXG4gICAgICAgICAgICBwYWNrYWdlTWFuYWdlcjogb3B0aW9ucy5wYWNrYWdlTWFuYWdlcixcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKG9wdGlvbnMubGlua0NsaSkge1xuICAgICAgICAgIHBhY2thZ2VUYXNrID0gY29udGV4dC5hZGRUYXNrKFxuICAgICAgICAgICAgbmV3IE5vZGVQYWNrYWdlTGlua1Rhc2soJ0Bhbmd1bGFyL2NsaScsIG9wdGlvbnMuZGlyZWN0b3J5KSxcbiAgICAgICAgICAgIFtwYWNrYWdlVGFza10sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFvcHRpb25zLnNraXBHaXQpIHtcbiAgICAgICAgY29uc3QgY29tbWl0ID1cbiAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5jb21taXQgPT0gJ29iamVjdCcgPyBvcHRpb25zLmNvbW1pdCA6IG9wdGlvbnMuY29tbWl0ID8ge30gOiBmYWxzZTtcblxuICAgICAgICBjb250ZXh0LmFkZFRhc2soXG4gICAgICAgICAgbmV3IFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2sob3B0aW9ucy5kaXJlY3RvcnksIGNvbW1pdCksXG4gICAgICAgICAgcGFja2FnZVRhc2sgPyBbcGFja2FnZVRhc2tdIDogW10sXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSxcbiAgXSk7XG59XG4iXX0=