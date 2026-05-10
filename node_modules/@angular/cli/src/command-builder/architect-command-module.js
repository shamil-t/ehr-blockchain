"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectCommandModule = void 0;
const config_1 = require("../utilities/config");
const memoize_1 = require("../utilities/memoize");
const architect_base_command_module_1 = require("./architect-base-command-module");
const command_module_1 = require("./command-module");
class ArchitectCommandModule extends architect_base_command_module_1.ArchitectBaseCommandModule {
    async builder(argv) {
        const project = this.getArchitectProject();
        const { jsonHelp, getYargsCompletions, help } = this.context.args.options;
        const localYargs = argv
            .positional('project', {
            describe: 'The name of the project to build. Can be an application or a library.',
            type: 'string',
            // Hide choices from JSON help so that we don't display them in AIO.
            choices: jsonHelp ? undefined : this.getProjectChoices(),
        })
            .option('configuration', {
            describe: `One or more named builder configurations as a comma-separated ` +
                `list as specified in the "configurations" section in angular.json.\n` +
                `The builder uses the named configurations to run the given target.\n` +
                `For more information, see https://angular.io/guide/workspace-config#alternate-build-configurations.`,
            alias: 'c',
            type: 'string',
            // Show only in when using --help and auto completion because otherwise comma seperated configuration values will be invalid.
            // Also, hide choices from JSON help so that we don't display them in AIO.
            choices: (getYargsCompletions || help) && !jsonHelp && project
                ? this.getConfigurationChoices(project)
                : undefined,
        })
            .strict();
        if (!project) {
            return localYargs;
        }
        const target = this.getArchitectTarget();
        const schemaOptions = await this.getArchitectTargetOptions({
            project,
            target,
        });
        return this.addSchemaOptionsToCommand(localYargs, schemaOptions);
    }
    async run(options) {
        const target = this.getArchitectTarget();
        const { configuration = '', project, ...architectOptions } = options;
        if (!project) {
            // This runs each target sequentially.
            // Running them in parallel would jumble the log messages.
            let result = 0;
            const projectNames = this.getProjectNamesByTarget(target);
            if (!projectNames) {
                return this.onMissingTarget('Cannot determine project or target for command.');
            }
            for (const project of projectNames) {
                result |= await this.runSingleTarget({ configuration, target, project }, architectOptions);
            }
            return result;
        }
        else {
            return await this.runSingleTarget({ configuration, target, project }, architectOptions);
        }
    }
    getArchitectProject() {
        const { options, positional } = this.context.args;
        const [, projectName] = positional;
        if (projectName) {
            return projectName;
        }
        // Yargs allows positional args to be used as flags.
        if (typeof options['project'] === 'string') {
            return options['project'];
        }
        const target = this.getArchitectTarget();
        const projectFromTarget = this.getProjectNamesByTarget(target);
        return projectFromTarget?.length ? projectFromTarget[0] : undefined;
    }
    getProjectNamesByTarget(target) {
        const workspace = this.getWorkspaceOrThrow();
        const allProjectsForTargetName = [];
        for (const [name, project] of workspace.projects) {
            if (project.targets.has(target)) {
                allProjectsForTargetName.push(name);
            }
        }
        if (allProjectsForTargetName.length === 0) {
            return undefined;
        }
        if (this.multiTarget) {
            // For multi target commands, we always list all projects that have the target.
            return allProjectsForTargetName;
        }
        else {
            if (allProjectsForTargetName.length === 1) {
                return allProjectsForTargetName;
            }
            const maybeProject = (0, config_1.getProjectByCwd)(workspace);
            if (maybeProject) {
                return allProjectsForTargetName.includes(maybeProject) ? [maybeProject] : undefined;
            }
            const { getYargsCompletions, help } = this.context.args.options;
            if (!getYargsCompletions && !help) {
                // Only issue the below error when not in help / completion mode.
                throw new command_module_1.CommandModuleError('Cannot determine project for command.\n' +
                    'This is a multi-project workspace and more than one project supports this command. ' +
                    `Run "ng ${this.command}" to execute the command for a specific project or change the current ` +
                    'working directory to a project directory.\n\n' +
                    `Available projects are:\n${allProjectsForTargetName
                        .sort()
                        .map((p) => `- ${p}`)
                        .join('\n')}`);
            }
        }
        return undefined;
    }
    /** @returns a sorted list of project names to be used for auto completion. */
    getProjectChoices() {
        const { workspace } = this.context;
        return workspace ? [...workspace.projects.keys()].sort() : undefined;
    }
    /** @returns a sorted list of configuration names to be used for auto completion. */
    getConfigurationChoices(project) {
        const projectDefinition = this.context.workspace?.projects.get(project);
        if (!projectDefinition) {
            return undefined;
        }
        const target = this.getArchitectTarget();
        const configurations = projectDefinition.targets.get(target)?.configurations;
        return configurations ? Object.keys(configurations).sort() : undefined;
    }
}
exports.ArchitectCommandModule = ArchitectCommandModule;
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], ArchitectCommandModule.prototype, "getProjectNamesByTarget", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJjaGl0ZWN0LWNvbW1hbmQtbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmQtYnVpbGRlci9hcmNoaXRlY3QtY29tbWFuZC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBR0gsZ0RBQXNEO0FBQ3RELGtEQUErQztBQUMvQyxtRkFBNkU7QUFDN0UscURBSzBCO0FBTzFCLE1BQXNCLHNCQUNwQixTQUFRLDBEQUFnRDtJQUt4RCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVU7UUFDdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0MsTUFBTSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFMUUsTUFBTSxVQUFVLEdBQStCLElBQUk7YUFDaEQsVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUNyQixRQUFRLEVBQUUsdUVBQXVFO1lBQ2pGLElBQUksRUFBRSxRQUFRO1lBQ2Qsb0VBQW9FO1lBQ3BFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1NBQ3pELENBQUM7YUFDRCxNQUFNLENBQUMsZUFBZSxFQUFFO1lBQ3ZCLFFBQVEsRUFDTixnRUFBZ0U7Z0JBQ2hFLHNFQUFzRTtnQkFDdEUsc0VBQXNFO2dCQUN0RSxxR0FBcUc7WUFDdkcsS0FBSyxFQUFFLEdBQUc7WUFDVixJQUFJLEVBQUUsUUFBUTtZQUNkLDZIQUE2SDtZQUM3SCwwRUFBMEU7WUFDMUUsT0FBTyxFQUNMLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksT0FBTztn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QUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsb0ZBQW9GO0lBQzVFLHVCQUF1QixDQUFDLE9BQWU7UUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUN0QixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsY0FBYyxDQUFDO1FBRTdFLE9BQU8sY0FBYyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDekUsQ0FBQztDQUNGO0FBNUpELHdEQTRKQztBQWpFUztJQURQLGlCQUFPOzs7O3FFQTZDUCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgZ2V0UHJvamVjdEJ5Q3dkIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NvbmZpZyc7XG5pbXBvcnQgeyBtZW1vaXplIH0gZnJvbSAnLi4vdXRpbGl0aWVzL21lbW9pemUnO1xuaW1wb3J0IHsgQXJjaGl0ZWN0QmFzZUNvbW1hbmRNb2R1bGUgfSBmcm9tICcuL2FyY2hpdGVjdC1iYXNlLWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGVFcnJvcixcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBPcHRpb25zLFxuICBPdGhlck9wdGlvbnMsXG59IGZyb20gJy4vY29tbWFuZC1tb2R1bGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyY2hpdGVjdENvbW1hbmRBcmdzIHtcbiAgY29uZmlndXJhdGlvbj86IHN0cmluZztcbiAgcHJvamVjdD86IHN0cmluZztcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFyY2hpdGVjdENvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBBcmNoaXRlY3RCYXNlQ29tbWFuZE1vZHVsZTxBcmNoaXRlY3RDb21tYW5kQXJncz5cbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb248QXJjaGl0ZWN0Q29tbWFuZEFyZ3M+XG57XG4gIGFic3RyYWN0IHJlYWRvbmx5IG11bHRpVGFyZ2V0OiBib29sZWFuO1xuXG4gIGFzeW5jIGJ1aWxkZXIoYXJndjogQXJndik6IFByb21pc2U8QXJndjxBcmNoaXRlY3RDb21tYW5kQXJncz4+IHtcbiAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5nZXRBcmNoaXRlY3RQcm9qZWN0KCk7XG4gICAgY29uc3QgeyBqc29uSGVscCwgZ2V0WWFyZ3NDb21wbGV0aW9ucywgaGVscCB9ID0gdGhpcy5jb250ZXh0LmFyZ3Mub3B0aW9ucztcblxuICAgIGNvbnN0IGxvY2FsWWFyZ3M6IEFyZ3Y8QXJjaGl0ZWN0Q29tbWFuZEFyZ3M+ID0gYXJndlxuICAgICAgLnBvc2l0aW9uYWwoJ3Byb2plY3QnLCB7XG4gICAgICAgIGRlc2NyaWJlOiAnVGhlIG5hbWUgb2YgdGhlIHByb2plY3QgdG8gYnVpbGQuIENhbiBiZSBhbiBhcHBsaWNhdGlvbiBvciBhIGxpYnJhcnkuJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIC8vIEhpZGUgY2hvaWNlcyBmcm9tIEpTT04gaGVscCBzbyB0aGF0IHdlIGRvbid0IGRpc3BsYXkgdGhlbSBpbiBBSU8uXG4gICAgICAgIGNob2ljZXM6IGpzb25IZWxwID8gdW5kZWZpbmVkIDogdGhpcy5nZXRQcm9qZWN0Q2hvaWNlcygpLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ2NvbmZpZ3VyYXRpb24nLCB7XG4gICAgICAgIGRlc2NyaWJlOlxuICAgICAgICAgIGBPbmUgb3IgbW9yZSBuYW1lZCBidWlsZGVyIGNvbmZpZ3VyYXRpb25zIGFzIGEgY29tbWEtc2VwYXJhdGVkIGAgK1xuICAgICAgICAgIGBsaXN0IGFzIHNwZWNpZmllZCBpbiB0aGUgXCJjb25maWd1cmF0aW9uc1wiIHNlY3Rpb24gaW4gYW5ndWxhci5qc29uLlxcbmAgK1xuICAgICAgICAgIGBUaGUgYnVpbGRlciB1c2VzIHRoZSBuYW1lZCBjb25maWd1cmF0aW9ucyB0byBydW4gdGhlIGdpdmVuIHRhcmdldC5cXG5gICtcbiAgICAgICAgICBgRm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvd29ya3NwYWNlLWNvbmZpZyNhbHRlcm5hdGUtYnVpbGQtY29uZmlndXJhdGlvbnMuYCxcbiAgICAgICAgYWxpYXM6ICdjJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIC8vIFNob3cgb25seSBpbiB3aGVuIHVzaW5nIC0taGVscCBhbmQgYXV0byBjb21wbGV0aW9uIGJlY2F1c2Ugb3RoZXJ3aXNlIGNvbW1hIHNlcGVyYXRlZCBjb25maWd1cmF0aW9uIHZhbHVlcyB3aWxsIGJlIGludmFsaWQuXG4gICAgICAgIC8vIEFsc28sIGhpZGUgY2hvaWNlcyBmcm9tIEpTT04gaGVscCBzbyB0aGF0IHdlIGRvbid0IGRpc3BsYXkgdGhlbSBpbiBBSU8uXG4gICAgICAgIGNob2ljZXM6XG4gICAgICAgICAgKGdldFlhcmdzQ29tcGxldGlvbnMgfHwgaGVscCkgJiYgIWpzb25IZWxwICYmIHByb2plY3RcbiAgICAgICAgICAgID8gdGhpcy5nZXRDb25maWd1cmF0aW9uQ2hvaWNlcyhwcm9qZWN0KVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICB9KVxuICAgICAgLnN0cmljdCgpO1xuXG4gICAgaWYgKCFwcm9qZWN0KSB7XG4gICAgICByZXR1cm4gbG9jYWxZYXJncztcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmdldEFyY2hpdGVjdFRhcmdldCgpO1xuICAgIGNvbnN0IHNjaGVtYU9wdGlvbnMgPSBhd2FpdCB0aGlzLmdldEFyY2hpdGVjdFRhcmdldE9wdGlvbnMoe1xuICAgICAgcHJvamVjdCxcbiAgICAgIHRhcmdldCxcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLmFkZFNjaGVtYU9wdGlvbnNUb0NvbW1hbmQobG9jYWxZYXJncywgc2NoZW1hT3B0aW9ucyk7XG4gIH1cblxuICBhc3luYyBydW4ob3B0aW9uczogT3B0aW9uczxBcmNoaXRlY3RDb21tYW5kQXJncz4gJiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlciB8IHZvaWQ+IHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmdldEFyY2hpdGVjdFRhcmdldCgpO1xuXG4gICAgY29uc3QgeyBjb25maWd1cmF0aW9uID0gJycsIHByb2plY3QsIC4uLmFyY2hpdGVjdE9wdGlvbnMgfSA9IG9wdGlvbnM7XG5cbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIC8vIFRoaXMgcnVucyBlYWNoIHRhcmdldCBzZXF1ZW50aWFsbHkuXG4gICAgICAvLyBSdW5uaW5nIHRoZW0gaW4gcGFyYWxsZWwgd291bGQganVtYmxlIHRoZSBsb2cgbWVzc2FnZXMuXG4gICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgIGNvbnN0IHByb2plY3ROYW1lcyA9IHRoaXMuZ2V0UHJvamVjdE5hbWVzQnlUYXJnZXQodGFyZ2V0KTtcbiAgICAgIGlmICghcHJvamVjdE5hbWVzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uTWlzc2luZ1RhcmdldCgnQ2Fubm90IGRldGVybWluZSBwcm9qZWN0IG9yIHRhcmdldCBmb3IgY29tbWFuZC4nKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHByb2plY3ROYW1lcykge1xuICAgICAgICByZXN1bHQgfD0gYXdhaXQgdGhpcy5ydW5TaW5nbGVUYXJnZXQoeyBjb25maWd1cmF0aW9uLCB0YXJnZXQsIHByb2plY3QgfSwgYXJjaGl0ZWN0T3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJ1blNpbmdsZVRhcmdldCh7IGNvbmZpZ3VyYXRpb24sIHRhcmdldCwgcHJvamVjdCB9LCBhcmNoaXRlY3RPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFyY2hpdGVjdFByb2plY3QoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IG9wdGlvbnMsIHBvc2l0aW9uYWwgfSA9IHRoaXMuY29udGV4dC5hcmdzO1xuICAgIGNvbnN0IFssIHByb2plY3ROYW1lXSA9IHBvc2l0aW9uYWw7XG5cbiAgICBpZiAocHJvamVjdE5hbWUpIHtcbiAgICAgIHJldHVybiBwcm9qZWN0TmFtZTtcbiAgICB9XG5cbiAgICAvLyBZYXJncyBhbGxvd3MgcG9zaXRpb25hbCBhcmdzIHRvIGJlIHVzZWQgYXMgZmxhZ3MuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zWydwcm9qZWN0J10gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gb3B0aW9uc1sncHJvamVjdCddO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZ2V0QXJjaGl0ZWN0VGFyZ2V0KCk7XG4gICAgY29uc3QgcHJvamVjdEZyb21UYXJnZXQgPSB0aGlzLmdldFByb2plY3ROYW1lc0J5VGFyZ2V0KHRhcmdldCk7XG5cbiAgICByZXR1cm4gcHJvamVjdEZyb21UYXJnZXQ/Lmxlbmd0aCA/IHByb2plY3RGcm9tVGFyZ2V0WzBdIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgQG1lbW9pemVcbiAgcHJpdmF0ZSBnZXRQcm9qZWN0TmFtZXNCeVRhcmdldCh0YXJnZXQ6IHN0cmluZyk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSB0aGlzLmdldFdvcmtzcGFjZU9yVGhyb3coKTtcbiAgICBjb25zdCBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWU6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IFtuYW1lLCBwcm9qZWN0XSBvZiB3b3Jrc3BhY2UucHJvamVjdHMpIHtcbiAgICAgIGlmIChwcm9qZWN0LnRhcmdldHMuaGFzKHRhcmdldCkpIHtcbiAgICAgICAgYWxsUHJvamVjdHNGb3JUYXJnZXROYW1lLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFsbFByb2plY3RzRm9yVGFyZ2V0TmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubXVsdGlUYXJnZXQpIHtcbiAgICAgIC8vIEZvciBtdWx0aSB0YXJnZXQgY29tbWFuZHMsIHdlIGFsd2F5cyBsaXN0IGFsbCBwcm9qZWN0cyB0aGF0IGhhdmUgdGhlIHRhcmdldC5cbiAgICAgIHJldHVybiBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBhbGxQcm9qZWN0c0ZvclRhcmdldE5hbWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1heWJlUHJvamVjdCA9IGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2UpO1xuICAgICAgaWYgKG1heWJlUHJvamVjdCkge1xuICAgICAgICByZXR1cm4gYWxsUHJvamVjdHNGb3JUYXJnZXROYW1lLmluY2x1ZGVzKG1heWJlUHJvamVjdCkgPyBbbWF5YmVQcm9qZWN0XSA6IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyBnZXRZYXJnc0NvbXBsZXRpb25zLCBoZWxwIH0gPSB0aGlzLmNvbnRleHQuYXJncy5vcHRpb25zO1xuICAgICAgaWYgKCFnZXRZYXJnc0NvbXBsZXRpb25zICYmICFoZWxwKSB7XG4gICAgICAgIC8vIE9ubHkgaXNzdWUgdGhlIGJlbG93IGVycm9yIHdoZW4gbm90IGluIGhlbHAgLyBjb21wbGV0aW9uIG1vZGUuXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBkZXRlcm1pbmUgcHJvamVjdCBmb3IgY29tbWFuZC5cXG4nICtcbiAgICAgICAgICAgICdUaGlzIGlzIGEgbXVsdGktcHJvamVjdCB3b3Jrc3BhY2UgYW5kIG1vcmUgdGhhbiBvbmUgcHJvamVjdCBzdXBwb3J0cyB0aGlzIGNvbW1hbmQuICcgK1xuICAgICAgICAgICAgYFJ1biBcIm5nICR7dGhpcy5jb21tYW5kfVwiIHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQgZm9yIGEgc3BlY2lmaWMgcHJvamVjdCBvciBjaGFuZ2UgdGhlIGN1cnJlbnQgYCArXG4gICAgICAgICAgICAnd29ya2luZyBkaXJlY3RvcnkgdG8gYSBwcm9qZWN0IGRpcmVjdG9yeS5cXG5cXG4nICtcbiAgICAgICAgICAgIGBBdmFpbGFibGUgcHJvamVjdHMgYXJlOlxcbiR7YWxsUHJvamVjdHNGb3JUYXJnZXROYW1lXG4gICAgICAgICAgICAgIC5zb3J0KClcbiAgICAgICAgICAgICAgLm1hcCgocCkgPT4gYC0gJHtwfWApXG4gICAgICAgICAgICAgIC5qb2luKCdcXG4nKX1gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgYSBzb3J0ZWQgbGlzdCBvZiBwcm9qZWN0IG5hbWVzIHRvIGJlIHVzZWQgZm9yIGF1dG8gY29tcGxldGlvbi4gKi9cbiAgcHJpdmF0ZSBnZXRQcm9qZWN0Q2hvaWNlcygpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuY29udGV4dDtcblxuICAgIHJldHVybiB3b3Jrc3BhY2UgPyBbLi4ud29ya3NwYWNlLnByb2plY3RzLmtleXMoKV0uc29ydCgpIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIGEgc29ydGVkIGxpc3Qgb2YgY29uZmlndXJhdGlvbiBuYW1lcyB0byBiZSB1c2VkIGZvciBhdXRvIGNvbXBsZXRpb24uICovXG4gIHByaXZhdGUgZ2V0Q29uZmlndXJhdGlvbkNob2ljZXMocHJvamVjdDogc3RyaW5nKTogc3RyaW5nW10gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHByb2plY3REZWZpbml0aW9uID0gdGhpcy5jb250ZXh0LndvcmtzcGFjZT8ucHJvamVjdHMuZ2V0KHByb2plY3QpO1xuICAgIGlmICghcHJvamVjdERlZmluaXRpb24pIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5nZXRBcmNoaXRlY3RUYXJnZXQoKTtcbiAgICBjb25zdCBjb25maWd1cmF0aW9ucyA9IHByb2plY3REZWZpbml0aW9uLnRhcmdldHMuZ2V0KHRhcmdldCk/LmNvbmZpZ3VyYXRpb25zO1xuXG4gICAgcmV0dXJuIGNvbmZpZ3VyYXRpb25zID8gT2JqZWN0LmtleXMoY29uZmlndXJhdGlvbnMpLnNvcnQoKSA6IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19