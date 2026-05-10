"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const architect_base_command_module_1 = require("../../command-builder/architect-base-command-module");
const command_module_1 = require("../../command-builder/command-module");
class RunCommandModule extends architect_base_command_module_1.ArchitectBaseCommandModule {
    constructor() {
        super(...arguments);
        this.scope = command_module_1.CommandScope.In;
        this.command = 'run <target>';
        this.describe = 'Runs an Architect target with an optional custom builder configuration defined in your project.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
    async builder(argv) {
        const { jsonHelp, getYargsCompletions, help } = this.context.args.options;
        const localYargs = argv
            .positional('target', {
            describe: 'The Architect target to run provided in the following format `project:target[:configuration]`.',
            type: 'string',
            demandOption: true,
            // Show only in when using --help and auto completion because otherwise comma seperated configuration values will be invalid.
            // Also, hide choices from JSON help so that we don't display them in AIO.
            choices: (getYargsCompletions || help) && !jsonHelp ? this.getTargetChoices() : undefined,
        })
            .middleware((args) => {
            // TODO: remove in version 15.
            const { configuration, target } = args;
            if (typeof configuration === 'string' && target) {
                const targetWithConfig = target.split(':', 2);
                targetWithConfig.push(configuration);
                throw new command_module_1.CommandModuleError('Unknown argument: configuration.\n' +
                    `Provide the configuration as part of the target 'ng run ${targetWithConfig.join(':')}'.`);
            }
        }, true)
            .strict();
        const target = this.makeTargetSpecifier();
        if (!target) {
            return localYargs;
        }
        const schemaOptions = await this.getArchitectTargetOptions(target);
        return this.addSchemaOptionsToCommand(localYargs, schemaOptions);
    }
    async run(options) {
        const target = this.makeTargetSpecifier(options);
        const { target: _target, ...extraOptions } = options;
        if (!target) {
            throw new command_module_1.CommandModuleError('Cannot determine project or target.');
        }
        return this.runSingleTarget(target, extraOptions);
    }
    makeTargetSpecifier(options) {
        const architectTarget = options?.target ?? this.context.args.positional[1];
        if (!architectTarget) {
            return undefined;
        }
        const [project = '', target = '', configuration] = architectTarget.split(':');
        return {
            project,
            target,
            configuration,
        };
    }
    /** @returns a sorted list of target specifiers to be used for auto completion. */
    getTargetChoices() {
        if (!this.context.workspace) {
            return;
        }
        const targets = [];
        for (const [projectName, project] of this.context.workspace.projects) {
            for (const [targetName, target] of project.targets) {
                const currentTarget = `${projectName}:${targetName}`;
                targets.push(currentTarget);
                if (!target.configurations) {
                    continue;
                }
                for (const configName of Object.keys(target.configurations)) {
                    targets.push(`${currentTarget}:${configName}`);
                }
            }
        }
        return targets.sort();
    }
}
exports.default = RunCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL3J1bi9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFHSCwrQkFBNEI7QUFFNUIsdUdBQWlHO0FBQ2pHLHlFQU04QztBQU05QyxNQUFxQixnQkFDbkIsU0FBUSwwREFBMEM7SUFEcEQ7O1FBSVcsVUFBSyxHQUFHLDZCQUFZLENBQUMsRUFBRSxDQUFDO1FBRWpDLFlBQU8sR0FBRyxjQUFjLENBQUM7UUFDekIsYUFBUSxHQUNOLGlHQUFpRyxDQUFDO1FBQ3BHLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBNEYvRCxDQUFDO0lBMUZDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBVTtRQUN0QixNQUFNLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUUxRSxNQUFNLFVBQVUsR0FBeUIsSUFBSTthQUMxQyxVQUFVLENBQUMsUUFBUSxFQUFFO1lBQ3BCLFFBQVEsRUFDTixnR0FBZ0c7WUFDbEcsSUFBSSxFQUFFLFFBQVE7WUFDZCxZQUFZLEVBQUUsSUFBSTtZQUNsQiw2SEFBNkg7WUFDN0gsMEVBQTBFO1lBQzFFLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztTQUMxRixDQUFDO2FBQ0QsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkIsOEJBQThCO1lBQzlCLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFD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Q0FxR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgVGFyZ2V0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgQXJjaGl0ZWN0QmFzZUNvbW1hbmRNb2R1bGUgfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvYXJjaGl0ZWN0LWJhc2UtY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZUVycm9yLFxuICBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24sXG4gIENvbW1hbmRTY29wZSxcbiAgT3B0aW9ucyxcbiAgT3RoZXJPcHRpb25zLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkNvbW1hbmRBcmdzIHtcbiAgdGFyZ2V0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bkNvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBBcmNoaXRlY3RCYXNlQ29tbWFuZE1vZHVsZTxSdW5Db21tYW5kQXJncz5cbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb248UnVuQ29tbWFuZEFyZ3M+XG57XG4gIG92ZXJyaWRlIHNjb3BlID0gQ29tbWFuZFNjb3BlLkluO1xuXG4gIGNvbW1hbmQgPSAncnVuIDx0YXJnZXQ+JztcbiAgZGVzY3JpYmUgPVxuICAgICdSdW5zIGFuIEFyY2hpdGVjdCB0YXJnZXQgd2l0aCBhbiBvcHRpb25hbCBjdXN0b20gYnVpbGRlciBjb25maWd1cmF0aW9uIGRlZmluZWQgaW4geW91ciBwcm9qZWN0Lic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGggPSBqb2luKF9fZGlybmFtZSwgJ2xvbmctZGVzY3JpcHRpb24ubWQnKTtcblxuICBhc3luYyBidWlsZGVyKGFyZ3Y6IEFyZ3YpOiBQcm9taXNlPEFyZ3Y8UnVuQ29tbWFuZEFyZ3M+PiB7XG4gICAgY29uc3QgeyBqc29uSGVscCwgZ2V0WWFyZ3NDb21wbGV0aW9ucywgaGVscCB9ID0gdGhpcy5jb250ZXh0LmFyZ3Mub3B0aW9ucztcblxuICAgIGNvbnN0IGxvY2FsWWFyZ3M6IEFyZ3Y8UnVuQ29tbWFuZEFyZ3M+ID0gYXJndlxuICAgICAgLnBvc2l0aW9uYWwoJ3RhcmdldCcsIHtcbiAgICAgICAgZGVzY3JpYmU6XG4gICAgICAgICAgJ1RoZSBBcmNoaXRlY3QgdGFyZ2V0IHRvIHJ1biBwcm92aWRlZCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdCBgcHJvamVjdDp0YXJnZXRbOmNvbmZpZ3VyYXRpb25dYC4nLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVtYW5kT3B0aW9uOiB0cnVlLFxuICAgICAgICAvLyBTaG93IG9ubHkgaW4gd2hlbiB1c2luZyAtLWhlbHAgYW5kIGF1dG8gY29tcGxldGlvbiBiZWNhdXNlIG90aGVyd2lzZSBjb21tYSBzZXBlcmF0ZWQgY29uZmlndXJhdGlvbiB2YWx1ZXMgd2lsbCBiZSBpbnZhbGlkLlxuICAgICAgICAvLyBBbHNvLCBoaWRlIGNob2ljZXMgZnJvbSBKU09OIGhlbHAgc28gdGhhdCB3ZSBkb24ndCBkaXNwbGF5IHRoZW0gaW4gQUlPLlxuICAgICAgICBjaG9pY2VzOiAoZ2V0WWFyZ3NDb21wbGV0aW9ucyB8fCBoZWxwKSAmJiAhanNvbkhlbHAgPyB0aGlzLmdldFRhcmdldENob2ljZXMoKSA6IHVuZGVmaW5lZCxcbiAgICAgIH0pXG4gICAgICAubWlkZGxld2FyZSgoYXJncykgPT4ge1xuICAgICAgICAvLyBUT0RPOiByZW1vdmUgaW4gdmVyc2lvbiAxNS5cbiAgICAgICAgY29uc3QgeyBjb25maWd1cmF0aW9uLCB0YXJnZXQgfSA9IGFyZ3M7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlndXJhdGlvbiA9PT0gJ3N0cmluZycgJiYgdGFyZ2V0KSB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0V2l0aENvbmZpZyA9IHRhcmdldC5zcGxpdCgnOicsIDIpO1xuICAgICAgICAgIHRhcmdldFdpdGhDb25maWcucHVzaChjb25maWd1cmF0aW9uKTtcblxuICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoXG4gICAgICAgICAgICAnVW5rbm93biBhcmd1bWVudDogY29uZmlndXJhdGlvbi5cXG4nICtcbiAgICAgICAgICAgICAgYFByb3ZpZGUgdGhlIGNvbmZpZ3VyYXRpb24gYXMgcGFydCBvZiB0aGUgdGFyZ2V0ICduZyBydW4gJHt0YXJnZXRXaXRoQ29uZmlnLmpvaW4oXG4gICAgICAgICAgICAgICAgJzonLFxuICAgICAgICAgICAgICApfScuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LCB0cnVlKVxuICAgICAgLnN0cmljdCgpO1xuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5tYWtlVGFyZ2V0U3BlY2lmaWVyKCk7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHJldHVybiBsb2NhbFlhcmdzO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYU9wdGlvbnMgPSBhd2FpdCB0aGlzLmdldEFyY2hpdGVjdFRhcmdldE9wdGlvbnModGFyZ2V0KTtcblxuICAgIHJldHVybiB0aGlzLmFkZFNjaGVtYU9wdGlvbnNUb0NvbW1hbmQobG9jYWxZYXJncywgc2NoZW1hT3B0aW9ucyk7XG4gIH1cblxuICBhc3luYyBydW4ob3B0aW9uczogT3B0aW9uczxSdW5Db21tYW5kQXJncz4gJiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMubWFrZVRhcmdldFNwZWNpZmllcihvcHRpb25zKTtcbiAgICBjb25zdCB7IHRhcmdldDogX3RhcmdldCwgLi4uZXh0cmFPcHRpb25zIH0gPSBvcHRpb25zO1xuXG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoJ0Nhbm5vdCBkZXRlcm1pbmUgcHJvamVjdCBvciB0YXJnZXQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucnVuU2luZ2xlVGFyZ2V0KHRhcmdldCwgZXh0cmFPcHRpb25zKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBtYWtlVGFyZ2V0U3BlY2lmaWVyKG9wdGlvbnM/OiBPcHRpb25zPFJ1bkNvbW1hbmRBcmdzPik6IFRhcmdldCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgYXJjaGl0ZWN0VGFyZ2V0ID0gb3B0aW9ucz8udGFyZ2V0ID8/IHRoaXMuY29udGV4dC5hcmdzLnBvc2l0aW9uYWxbMV07XG4gICAgaWYgKCFhcmNoaXRlY3RUYXJnZXQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgW3Byb2plY3QgPSAnJywgdGFyZ2V0ID0gJycsIGNvbmZpZ3VyYXRpb25dID0gYXJjaGl0ZWN0VGFyZ2V0LnNwbGl0KCc6Jyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdCxcbiAgICAgIHRhcmdldCxcbiAgICAgIGNvbmZpZ3VyYXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBhIHNvcnRlZCBsaXN0IG9mIHRhcmdldCBzcGVjaWZpZXJzIHRvIGJlIHVzZWQgZm9yIGF1dG8gY29tcGxldGlvbi4gKi9cbiAgcHJpdmF0ZSBnZXRUYXJnZXRDaG9pY2VzKCk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuY29udGV4dC53b3Jrc3BhY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRzID0gW107XG4gICAgZm9yIChjb25zdCBbcHJvamVjdE5hbWUsIHByb2plY3RdIG9mIHRoaXMuY29udGV4dC53b3Jrc3BhY2UucHJvamVjdHMpIHtcbiAgICAgIGZvciAoY29uc3QgW3RhcmdldE5hbWUsIHRhcmdldF0gb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSBgJHtwcm9qZWN0TmFtZX06JHt0YXJnZXROYW1lfWA7XG4gICAgICAgIHRhcmdldHMucHVzaChjdXJyZW50VGFyZ2V0KTtcblxuICAgICAgICBpZiAoIXRhcmdldC5jb25maWd1cmF0aW9ucykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBjb25maWdOYW1lIG9mIE9iamVjdC5rZXlzKHRhcmdldC5jb25maWd1cmF0aW9ucykpIHtcbiAgICAgICAgICB0YXJnZXRzLnB1c2goYCR7Y3VycmVudFRhcmdldH06JHtjb25maWdOYW1lfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldHMuc29ydCgpO1xuICB9XG59XG4iXX0=