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
const utility_1 = require("@schematics/angular/utility");
const path_1 = require("path");
const ENVIRONMENTS_DIRECTORY = 'environments';
const ENVIRONMENT_FILE_CONTENT = 'export const environment = {};\n';
function default_1(options) {
    return (0, utility_1.updateWorkspace)((workspace) => {
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Project name "${options.project}" doesn't not exist.`);
        }
        const type = project.extensions['projectType'];
        if (type !== 'application') {
            return log('error', 'Only application project types are support by this schematic.' + type
                ? ` Project "${options.project}" has a "projectType" of "${type}".`
                : ` Project "${options.project}" has no "projectType" defined.`);
        }
        const buildTarget = project.targets.get('build');
        if (!buildTarget) {
            return log('error', `No "build" target found for project "${options.project}".` +
                ' A "build" target is required to generate environment files.');
        }
        const serverTarget = project.targets.get('server');
        const sourceRoot = project.sourceRoot ?? path_1.posix.join(project.root, 'src');
        // The generator needs to be iterated prior to returning to ensure all workspace changes that occur
        // within the generator are present for `updateWorkspace` when it writes the workspace file.
        return (0, schematics_1.chain)([
            ...generateConfigurationEnvironments(buildTarget, serverTarget, sourceRoot, options.project),
        ]);
    });
}
exports.default = default_1;
function createIfMissing(path) {
    return (tree, context) => {
        if (tree.exists(path)) {
            context.logger.info(`Skipping creation of already existing environment file "${path}".`);
        }
        else {
            tree.create(path, ENVIRONMENT_FILE_CONTENT);
        }
    };
}
function log(type, text) {
    return (_, context) => context.logger[type](text);
}
function* generateConfigurationEnvironments(buildTarget, serverTarget, sourceRoot, projectName) {
    if (!buildTarget.builder.startsWith(utility_1.AngularBuilder.Browser)) {
        yield log('warn', `"build" target found for project "${projectName}" has a third-party builder "${buildTarget.builder}".` +
            ' The generated project options may not be compatible with this builder.');
    }
    if (serverTarget && !serverTarget.builder.startsWith(utility_1.AngularBuilder.Server)) {
        yield log('warn', `"server" target found for project "${projectName}" has a third-party builder "${buildTarget.builder}".` +
            ' The generated project options may not be compatible with this builder.');
    }
    // Create default environment file
    const defaultFilePath = path_1.posix.join(sourceRoot, ENVIRONMENTS_DIRECTORY, 'environment.ts');
    yield createIfMissing(defaultFilePath);
    const configurationEntries = [
        ...Object.entries(buildTarget.configurations ?? {}),
        ...Object.entries(serverTarget?.configurations ?? {}),
    ];
    const addedFiles = new Set();
    for (const [name, configurationOptions] of configurationEntries) {
        if (!configurationOptions) {
            // Invalid configuration
            continue;
        }
        // Default configuration will use the default environment file
        if (name === buildTarget.defaultConfiguration) {
            continue;
        }
        const configurationFilePath = path_1.posix.join(sourceRoot, ENVIRONMENTS_DIRECTORY, `environment.${name}.ts`);
        // Add file replacement option entry for the configuration environment file
        const replacements = (configurationOptions['fileReplacements'] ?? (configurationOptions['fileReplacements'] = []));
        const existing = replacements.find((value) => value.replace === defaultFilePath);
        if (existing) {
            if (existing.with === configurationFilePath) {
                yield log('info', `Skipping addition of already existing file replacements option for "${defaultFilePath}" to "${configurationFilePath}".`);
            }
            else {
                yield log('warn', `Configuration "${name}" has a file replacements option for "${defaultFilePath}" but with a different replacement.` +
                    ` Expected "${configurationFilePath}" but found "${existing.with}". This may result in unexpected build behavior.`);
            }
        }
        else {
            replacements.push({ replace: defaultFilePath, with: configurationFilePath });
        }
        // Create configuration specific environment file if not already added
        if (!addedFiles.has(configurationFilePath)) {
            addedFiles.add(configurationFilePath);
            yield createIfMissing(configurationFilePath);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvZW52aXJvbm1lbnRzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBQThFO0FBQzlFLHlEQUFnRztBQUNoRywrQkFBcUM7QUFHckMsTUFBTSxzQkFBc0IsR0FBRyxjQUFjLENBQUM7QUFDOUMsTUFBTSx3QkFBd0IsR0FBRyxrQ0FBa0MsQ0FBQztBQUVwRSxtQkFBeUIsT0FBMkI7SUFDbEQsT0FBTyxJQUFBLHlCQUFlLEVBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtRQUNuQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQyxpQkFBaUIsT0FBTyxDQUFDLE9BQU8sc0JBQXNCLENBQUMsQ0FBQztTQUN2RjtRQUVELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDL0MsSUFBSSxJQUFJLEtBQUssYUFBYSxFQUFFO1lBQzFCLE9BQU8sR0FBRyxDQUNSLE9BQU8sRUFDUCwrREFBK0QsR0FBRyxJQUFJO2dCQUNwRSxDQUFDLENBQUMsYUFBYSxPQUFPLENBQUMsT0FBTyw2QkFBNkIsSUFBSSxJQUFJO2dCQUNuRSxDQUFDLENBQUMsYUFBYSxPQUFPLENBQUMsT0FBTyxpQ0FBaUMsQ0FDbEUsQ0FBQztTQUNIO1FBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixPQUFPLEdBQUcsQ0FDUixPQUFPLEVBQ1Asd0NBQXdDLE9BQU8s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RUFDdEIsZUFBZSxJQUFJLEtBQUssQ0FDekIsQ0FBQztRQUVGLDJFQUEyRTtRQUMzRSxNQUFNLFlBQVksR0FBRyxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixNQUF2QyxvQkFBb0IsQ0FBQyxrQkFBa0IsSUFBTSxFQUFFLEVBR2xFLENBQUM7UUFDSixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLGVBQWUsQ0FBQyxDQUFDO1FBQ2pGLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLHFCQUFxQixFQUFFO2dCQUMzQyxNQUFNLEdBQUcsQ0FDUCxNQUFNLEVBQ04sdUVBQXVFLGVBQWUsU0FBUyxxQkFBcUIsSUFBSSxDQUN6SCxDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsTUFBTSxHQUFHLENBQ1AsTUFBTSxFQUNOLGtCQUFrQixJQUFJLHlDQUF5QyxlQUFlLHFDQUFxQztvQkFDakgsY0FBYyxxQkFBcUIsZ0JBQWdCLFFBQVEsQ0FBQyxJQUFJLGtEQUFrRCxDQUNySCxDQUFDO2FBQ0g7U0FDRjthQUFNO1lBQ0wsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztTQUM5RTtRQUVELHNFQUFzRTtRQUN0RSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO1lBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN0QyxNQUFNLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFJ1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIGNoYWluIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgQW5ndWxhckJ1aWxkZXIsIFRhcmdldERlZmluaXRpb24sIHVwZGF0ZVdvcmtzcGFjZSB9IGZyb20gJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eSc7XG5pbXBvcnQgeyBwb3NpeCBhcyBwYXRoIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgRW52aXJvbm1lbnRPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5jb25zdCBFTlZJUk9OTUVOVFNfRElSRUNUT1JZID0gJ2Vudmlyb25tZW50cyc7XG5jb25zdCBFTlZJUk9OTUVOVF9GSUxFX0NPTlRFTlQgPSAnZXhwb3J0IGNvbnN0IGVudmlyb25tZW50ID0ge307XFxuJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IEVudmlyb25tZW50T3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gdXBkYXRlV29ya3NwYWNlKCh3b3Jrc3BhY2UpID0+IHtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLnByb2plY3RzLmdldChvcHRpb25zLnByb2plY3QpO1xuICAgIGlmICghcHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYFByb2plY3QgbmFtZSBcIiR7b3B0aW9ucy5wcm9qZWN0fVwiIGRvZXNuJ3Qgbm90IGV4aXN0LmApO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGUgPSBwcm9qZWN0LmV4dGVuc2lvbnNbJ3Byb2plY3RUeXBlJ107XG4gICAgaWYgKHR5cGUgIT09ICdhcHBsaWNhdGlvbicpIHtcbiAgICAgIHJldHVybiBsb2coXG4gICAgICAgICdlcnJvcicsXG4gICAgICAgICdPbmx5IGFwcGxpY2F0aW9uIHByb2plY3QgdHlwZXMgYXJlIHN1cHBvcnQgYnkgdGhpcyBzY2hlbWF0aWMuJyArIHR5cGVcbiAgICAgICAgICA/IGAgUHJvamVjdCBcIiR7b3B0aW9ucy5wcm9qZWN0fVwiIGhhcyBhIFwicHJvamVjdFR5cGVcIiBvZiBcIiR7dHlwZX1cIi5gXG4gICAgICAgICAgOiBgIFByb2plY3QgXCIke29wdGlvbnMucHJvamVjdH1cIiBoYXMgbm8gXCJwcm9qZWN0VHlwZVwiIGRlZmluZWQuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRUYXJnZXQgPSBwcm9qZWN0LnRhcmdldHMuZ2V0KCdidWlsZCcpO1xuICAgIGlmICghYnVpbGRUYXJnZXQpIHtcbiAgICAgIHJldHVybiBsb2coXG4gICAgICAgICdlcnJvcicsXG4gICAgICAgIGBObyBcImJ1aWxkXCIgdGFyZ2V0IGZvdW5kIGZvciBwcm9qZWN0IFwiJHtvcHRpb25zLnByb2plY3R9XCIuYCArXG4gICAgICAgICAgJyBBIFwiYnVpbGRcIiB0YXJnZXQgaXMgcmVxdWlyZWQgdG8gZ2VuZXJhdGUgZW52aXJvbm1lbnQgZmlsZXMuJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VydmVyVGFyZ2V0ID0gcHJvamVjdC50YXJnZXRzLmdldCgnc2VydmVyJyk7XG5cbiAgICBjb25zdCBzb3VyY2VSb290ID0gcHJvamVjdC5zb3VyY2VSb290ID8/IHBhdGguam9pbihwcm9qZWN0LnJvb3QsICdzcmMnKTtcblxuICAgIC8vIFRoZSBnZW5lcmF0b3IgbmVlZHMgdG8gYmUgaXRlcmF0ZWQgcHJpb3IgdG8gcmV0dXJuaW5nIHRvIGVuc3VyZSBhbGwgd29ya3NwYWNlIGNoYW5nZXMgdGhhdCBvY2N1clxuICAgIC8vIHdpdGhpbiB0aGUgZ2VuZXJhdG9yIGFyZSBwcmVzZW50IGZvciBgdXBkYXRlV29ya3NwYWNlYCB3aGVuIGl0IHdyaXRlcyB0aGUgd29ya3NwYWNlIGZpbGUuXG4gICAgcmV0dXJuIGNoYWluKFtcbiAgICAgIC4uLmdlbmVyYXRlQ29uZmlndXJhdGlvbkVudmlyb25tZW50cyhidWlsZFRhcmdldCwgc2VydmVyVGFyZ2V0LCBzb3VyY2VSb290LCBvcHRpb25zLnByb2plY3QpLFxuICAgIF0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSWZNaXNzaW5nKHBhdGg6IHN0cmluZyk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUsIGNvbnRleHQpID0+IHtcbiAgICBpZiAodHJlZS5leGlzdHMocGF0aCkpIHtcbiAgICAgIGNvbnRleHQubG9nZ2VyLmluZm8oYFNraXBwaW5nIGNyZWF0aW9uIG9mIGFscmVhZHkgZXhpc3RpbmcgZW52aXJvbm1lbnQgZmlsZSBcIiR7cGF0aH1cIi5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJlZS5jcmVhdGUocGF0aCwgRU5WSVJPTk1FTlRfRklMRV9DT05URU5UKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGxvZyh0eXBlOiAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InLCB0ZXh0OiBzdHJpbmcpOiBSdWxlIHtcbiAgcmV0dXJuIChfLCBjb250ZXh0KSA9PiBjb250ZXh0LmxvZ2dlclt0eXBlXSh0ZXh0KTtcbn1cblxuZnVuY3Rpb24qIGdlbmVyYXRlQ29uZmlndXJhdGlvbkVudmlyb25tZW50cyhcbiAgYnVpbGRUYXJnZXQ6IFRhcmdldERlZmluaXRpb24sXG4gIHNlcnZlclRhcmdldDogVGFyZ2V0RGVmaW5pdGlvbiB8IHVuZGVmaW5lZCxcbiAgc291cmNlUm9vdDogc3RyaW5nLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuKTogSXRlcmFibGU8UnVsZT4ge1xuICBpZiAoIWJ1aWxkVGFyZ2V0LmJ1aWxkZXIuc3RhcnRzV2l0aChBbmd1bGFyQnVpbGRlci5Ccm93c2VyKSkge1xuICAgIHlpZWxkIGxvZyhcbiAgICAgICd3YXJuJyxcbiAgICAgIGBcImJ1aWxkXCIgdGFyZ2V0IGZvdW5kIGZvciBwcm9qZWN0IFwiJHtwcm9qZWN0TmFtZX1cIiBoYXMgYSB0aGlyZC1wYXJ0eSBidWlsZGVyIFwiJHtidWlsZFRhcmdldC5idWlsZGVyfVwiLmAgK1xuICAgICAgICAnIFRoZSBnZW5lcmF0ZWQgcHJvamVjdCBvcHRpb25zIG1heSBub3QgYmUgY29tcGF0aWJsZSB3aXRoIHRoaXMgYnVpbGRlci4nLFxuICAgICk7XG4gIH1cblxuICBpZiAoc2VydmVyVGFyZ2V0ICYmICFzZXJ2ZXJUYXJnZXQuYnVpbGRlci5zdGFydHNXaXRoKEFuZ3VsYXJCdWlsZGVyLlNlcnZlcikpIHtcbiAgICB5aWVsZCBsb2coXG4gICAgICAnd2FybicsXG4gICAgICBgXCJzZXJ2ZXJcIiB0YXJnZXQgZm91bmQgZm9yIHByb2plY3QgXCIke3Byb2plY3ROYW1lfVwiIGhhcyBhIHRoaXJkLXBhcnR5IGJ1aWxkZXIgXCIke2J1aWxkVGFyZ2V0LmJ1aWxkZXJ9XCIuYCArXG4gICAgICAgICcgVGhlIGdlbmVyYXRlZCBwcm9qZWN0IG9wdGlvbnMgbWF5IG5vdCBiZSBjb21wYXRpYmxlIHdpdGggdGhpcyBidWlsZGVyLicsXG4gICAgKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBkZWZhdWx0IGVudmlyb25tZW50IGZpbGVcbiAgY29uc3QgZGVmYXVsdEZpbGVQYXRoID0gcGF0aC5qb2luKHNvdXJjZVJvb3QsIEVOVklST05NRU5UU19ESVJFQ1RPUlksICdlbnZpcm9ubWVudC50cycpO1xuICB5aWVsZCBjcmVhdGVJZk1pc3NpbmcoZGVmYXVsdEZpbGVQYXRoKTtcblxuICBjb25zdCBjb25maWd1cmF0aW9uRW50cmllcyA9IFtcbiAgICAuLi5PYmplY3QuZW50cmllcyhidWlsZFRhcmdldC5jb25maWd1cmF0aW9ucyA/PyB7fSksXG4gICAgLi4uT2JqZWN0LmVudHJpZXMoc2VydmVyVGFyZ2V0Py5jb25maWd1cmF0aW9ucyA/PyB7fSksXG4gIF07XG5cbiAgY29uc3QgYWRkZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtuYW1lLCBjb25maWd1cmF0aW9uT3B0aW9uc10gb2YgY29uZmlndXJhdGlvbkVudHJpZXMpIHtcbiAgICBpZiAoIWNvbmZpZ3VyYXRpb25PcHRpb25zKSB7XG4gICAgICAvLyBJbnZhbGlkIGNvbmZpZ3VyYXRpb25cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHQgY29uZmlndXJhdGlvbiB3aWxsIHVzZSB0aGUgZGVmYXVsdCBlbnZpcm9ubWVudCBmaWxlXG4gICAgaWYgKG5hbWUgPT09IGJ1aWxkVGFyZ2V0LmRlZmF1bHRDb25maWd1cmF0aW9uKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWd1cmF0aW9uRmlsZVBhdGggPSBwYXRoLmpvaW4oXG4gICAgICBzb3VyY2VSb290LFxuICAgICAgRU5WSVJPTk1FTlRTX0RJUkVDVE9SWSxcbiAgICAgIGBlbnZpcm9ubWVudC4ke25hbWV9LnRzYCxcbiAgICApO1xuXG4gICAgLy8gQWRkIGZpbGUgcmVwbGFjZW1lbnQgb3B0aW9uIGVudHJ5IGZvciB0aGUgY29uZmlndXJhdGlvbiBlbnZpcm9ubWVudCBmaWxlXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gKGNvbmZpZ3VyYXRpb25PcHRpb25zWydmaWxlUmVwbGFjZW1lbnRzJ10gPz89IFtdKSBhcyB7XG4gICAgICByZXBsYWNlOiBzdHJpbmc7XG4gICAgICB3aXRoOiBzdHJpbmc7XG4gICAgfVtdO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gcmVwbGFjZW1lbnRzLmZpbmQoKHZhbHVlKSA9PiB2YWx1ZS5yZXBsYWNlID09PSBkZWZhdWx0RmlsZVBhdGgpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgaWYgKGV4aXN0aW5nLndpdGggPT09IGNvbmZpZ3VyYXRpb25GaWxlUGF0aCkge1xuICAgICAgICB5aWVsZCBsb2coXG4gICAgICAgICAgJ2luZm8nLFxuICAgICAgICAgIGBTa2lwcGluZyBhZGRpdGlvbiBvZiBhbHJlYWR5IGV4aXN0aW5nIGZpbGUgcmVwbGFjZW1lbnRzIG9wdGlvbiBmb3IgXCIke2RlZmF1bHRGaWxlUGF0aH1cIiB0byBcIiR7Y29uZmlndXJhdGlvbkZpbGVQYXRofVwiLmAsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB5aWVsZCBsb2coXG4gICAgICAgICAgJ3dhcm4nLFxuICAgICAgICAgIGBDb25maWd1cmF0aW9uIFwiJHtuYW1lfVwiIGhhcyBhIGZpbGUgcmVwbGFjZW1lbnRzIG9wdGlvbiBmb3IgXCIke2RlZmF1bHRGaWxlUGF0aH1cIiBidXQgd2l0aCBhIGRpZmZlcmVudCByZXBsYWNlbWVudC5gICtcbiAgICAgICAgICAgIGAgRXhwZWN0ZWQgXCIke2NvbmZpZ3VyYXRpb25GaWxlUGF0aH1cIiBidXQgZm91bmQgXCIke2V4aXN0aW5nLndpdGh9XCIuIFRoaXMgbWF5IHJlc3VsdCBpbiB1bmV4cGVjdGVkIGJ1aWxkIGJlaGF2aW9yLmAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcGxhY2VtZW50cy5wdXNoKHsgcmVwbGFjZTogZGVmYXVsdEZpbGVQYXRoLCB3aXRoOiBjb25maWd1cmF0aW9uRmlsZVBhdGggfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGNvbmZpZ3VyYXRpb24gc3BlY2lmaWMgZW52aXJvbm1lbnQgZmlsZSBpZiBub3QgYWxyZWFkeSBhZGRlZFxuICAgIGlmICghYWRkZWRGaWxlcy5oYXMoY29uZmlndXJhdGlvbkZpbGVQYXRoKSkge1xuICAgICAgYWRkZWRGaWxlcy5hZGQoY29uZmlndXJhdGlvbkZpbGVQYXRoKTtcbiAgICAgIHlpZWxkIGNyZWF0ZUlmTWlzc2luZyhjb25maWd1cmF0aW9uRmlsZVBhdGgpO1xuICAgIH1cbiAgfVxufVxuIl19