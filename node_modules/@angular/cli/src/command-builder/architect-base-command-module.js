"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectBaseCommandModule = void 0;
const architect_1 = require("@angular-devkit/architect");
const node_1 = require("@angular-devkit/architect/node");
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const analytics_1 = require("../analytics/analytics");
const analytics_parameters_1 = require("../analytics/analytics-parameters");
const error_1 = require("../utilities/error");
const prompt_1 = require("../utilities/prompt");
const tty_1 = require("../utilities/tty");
const command_module_1 = require("./command-module");
const json_schema_1 = require("./utilities/json-schema");
class ArchitectBaseCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.scope = command_module_1.CommandScope.In;
    }
    async runSingleTarget(target, options) {
        const architectHost = await this.getArchitectHost();
        let builderName;
        try {
            builderName = await architectHost.getBuilderNameForTarget(target);
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            return this.onMissingTarget(e.message);
        }
        const { logger } = this.context;
        const run = await this.getArchitect().scheduleTarget(target, options, {
            logger,
        });
        const analytics = (0, analytics_1.isPackageNameSafeForAnalytics)(builderName)
            ? await this.getAnalytics()
            : undefined;
        let outputSubscription;
        if (analytics) {
            analytics.reportArchitectRunEvent({
                [analytics_parameters_1.EventCustomDimension.BuilderTarget]: builderName,
            });
            let firstRun = true;
            outputSubscription = run.output.subscribe(({ stats }) => {
                const parameters = this.builderStatsToAnalyticsParameters(stats, builderName);
                if (!parameters) {
                    return;
                }
                if (firstRun) {
                    firstRun = false;
                    analytics.reportBuildRunEvent(parameters);
                }
                else {
                    analytics.reportRebuildRunEvent(parameters);
                }
            });
        }
        try {
            const { error, success } = await run.lastOutput;
            if (error) {
                logger.error(error);
            }
            return success ? 0 : 1;
        }
        finally {
            await run.stop();
            outputSubscription?.unsubscribe();
        }
    }
    builderStatsToAnalyticsParameters(stats, builderName) {
        if (!stats || typeof stats !== 'object' || !('durationInMs' in stats)) {
            return undefined;
        }
        const { optimization, allChunksCount, aot, lazyChunksCount, initialChunksCount, durationInMs, changedChunksCount, cssSizeInBytes, jsSizeInBytes, ngComponentCount, } = stats;
        return {
            [analytics_parameters_1.EventCustomDimension.BuilderTarget]: builderName,
            [analytics_parameters_1.EventCustomDimension.Aot]: aot,
            [analytics_parameters_1.EventCustomDimension.Optimization]: optimization,
            [analytics_parameters_1.EventCustomMetric.AllChunksCount]: allChunksCount,
            [analytics_parameters_1.EventCustomMetric.LazyChunksCount]: lazyChunksCount,
            [analytics_parameters_1.EventCustomMetric.InitialChunksCount]: initialChunksCount,
            [analytics_parameters_1.EventCustomMetric.ChangedChunksCount]: changedChunksCount,
            [analytics_parameters_1.EventCustomMetric.DurationInMs]: durationInMs,
            [analytics_parameters_1.EventCustomMetric.JsSizeInBytes]: jsSizeInBytes,
            [analytics_parameters_1.EventCustomMetric.CssSizeInBytes]: cssSizeInBytes,
            [analytics_parameters_1.EventCustomMetric.NgComponentCount]: ngComponentCount,
        };
    }
    getArchitectHost() {
        if (this._architectHost) {
            return this._architectHost;
        }
        const workspace = this.getWorkspaceOrThrow();
        return (this._architectHost = new node_1.WorkspaceNodeModulesArchitectHost(workspace, workspace.basePath));
    }
    getArchitect() {
        if (this._architect) {
            return this._architect;
        }
        const registry = new core_1.json.schema.CoreSchemaRegistry();
        registry.addPostTransform(core_1.json.schema.transforms.addUndefinedDefaults);
        registry.useXDeprecatedProvider((msg) => this.context.logger.warn(msg));
        const architectHost = this.getArchitectHost();
        return (this._architect = new architect_1.Architect(architectHost, registry));
    }
    async getArchitectTargetOptions(target) {
        const architectHost = this.getArchitectHost();
        let builderConf;
        try {
            builderConf = await architectHost.getBuilderNameForTarget(target);
        }
        catch {
            return [];
        }
        let builderDesc;
        try {
            builderDesc = await architectHost.resolveBuilder(builderConf);
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            if (e.code === 'MODULE_NOT_FOUND') {
                this.warnOnMissingNodeModules();
                throw new command_module_1.CommandModuleError(`Could not find the '${builderConf}' builder's node package.`);
            }
            throw e;
        }
        return (0, json_schema_1.parseJsonSchemaToOptions)(new core_1.json.schema.CoreSchemaRegistry(), builderDesc.optionSchema, true);
    }
    warnOnMissingNodeModules() {
        const basePath = this.context.workspace?.basePath;
        if (!basePath) {
            return;
        }
        // Check for a `node_modules` directory (npm, yarn non-PnP, etc.)
        if ((0, fs_1.existsSync)((0, path_1.resolve)(basePath, 'node_modules'))) {
            return;
        }
        // Check for yarn PnP files
        if ((0, fs_1.existsSync)((0, path_1.resolve)(basePath, '.pnp.js')) ||
            (0, fs_1.existsSync)((0, path_1.resolve)(basePath, '.pnp.cjs')) ||
            (0, fs_1.existsSync)((0, path_1.resolve)(basePath, '.pnp.mjs'))) {
            return;
        }
        this.context.logger.warn(`Node packages may not be installed. Try installing with '${this.context.packageManager.name} install'.`);
    }
    getArchitectTarget() {
        return this.commandName;
    }
    async onMissingTarget(defaultMessage) {
        const { logger } = this.context;
        const choices = this.missingTargetChoices;
        if (!choices?.length) {
            logger.error(defaultMessage);
            return 1;
        }
        const missingTargetMessage = `Cannot find "${this.getArchitectTarget()}" target for the specified project.\n` +
            `You can add a package that implements these capabilities.\n\n` +
            `For example:\n` +
            choices.map(({ name, value }) => `  ${name}: ng add ${value}`).join('\n') +
            '\n';
        if ((0, tty_1.isTTY)()) {
            // Use prompts to ask the user if they'd like to install a package.
            logger.warn(missingTargetMessage);
            const packageToInstall = await this.getMissingTargetPackageToInstall(choices);
            if (packageToInstall) {
                // Example run: `ng add @angular-eslint/schematics`.
                const binPath = (0, path_1.resolve)(__dirname, '../../bin/ng.js');
                const { error } = (0, child_process_1.spawnSync)(process.execPath, [binPath, 'add', packageToInstall], {
                    stdio: 'inherit',
                });
                if (error) {
                    throw error;
                }
            }
        }
        else {
            // Non TTY display error message.
            logger.error(missingTargetMessage);
        }
        return 1;
    }
    async getMissingTargetPackageToInstall(choices) {
        if (choices.length === 1) {
            // Single choice
            const { name, value } = choices[0];
            if (await (0, prompt_1.askConfirmation)(`Would you like to add ${name} now?`, true, false)) {
                return value;
            }
            return null;
        }
        // Multiple choice
        return (0, prompt_1.askQuestion)(`Would you like to add a package with "${this.getArchitectTarget()}" capabilities now?`, [
            {
                name: 'No',
                value: null,
            },
            ...choices,
        ], 0, null);
    }
}
exports.ArchitectBaseCommandModule = ArchitectBaseCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJjaGl0ZWN0LWJhc2UtY29tbWFuZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZC1idWlsZGVyL2FyY2hpdGVjdC1iYXNlLWNvbW1hbmQtbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHlEQUE4RDtBQUM5RCx5REFHd0M7QUFDeEMsK0NBQTRDO0FBQzVDLGlEQUEwQztBQUMxQywyQkFBZ0M7QUFDaEMsK0JBQStCO0FBQy9CLHNEQUF1RTtBQUN2RSw0RUFBNEY7QUFDNUYsOENBQW1EO0FBQ25ELGdEQUFtRTtBQUNuRSwwQ0FBeUM7QUFDekMscURBTTBCO0FBQzFCLHlEQUEyRTtBQU8zRSxNQUFzQiwwQkFDcEIsU0FBUSw4QkFBZ0I7SUFEMUI7O1FBSVcsVUFBSyxHQUFHLDZCQUFZLENBQUMsRUFBRSxDQUFDO0lBOFBuQyxDQUFDO0lBM1BXLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBYyxFQUFFLE9BQXFCO1FBQ25FLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFcEQsSUFBSSxXQUFtQixDQUFDO1FBQ3hCLElBQUk7WUFDRixXQUFXLEdBQUcsTUFBTSxhQUFhLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDbkU7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUEscUJBQWEsRUFBQyxDQUFDLENBQUMsQ0FBQztZQUVqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3hDO1FBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDaEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsY0FBYyxDQUFDLE1B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QyxRQUFRLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEVBQUU7b0JBQ2hGLEtBQUssRUFBRSxTQUFTO2lCQUNqQixDQUFDLENBQUM7Z0JBRUgsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsTUFBTSxLQUFLLENBQUM7aUJBQ2I7YUFDRjtTQUNGO2FBQU07WUFDTCxpQ0FBaUM7WUFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3BDO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU8sS0FBSyxDQUFDLGdDQUFnQyxDQUM1QyxPQUE4QjtRQUU5QixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLGdCQUFnQjtZQUNoQixNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxJQUFJLE1BQU0sSUFBQSx3QkFBZSxFQUFDLHlCQUF5QixJQUFJLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQzVFLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsa0JBQWtCO1FBQ2xCLE9BQU8sSUFBQSxvQkFBVyxFQUNoQix5Q0FBeUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLHFCQUFxQixFQUN2RjtZQUNFO2dCQUNFLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSxJQUFJO2FBQ1o7WUFDRCxHQUFHLE9BQU87U0FDWCxFQUNELENBQUMsRUFDRCxJQUFJLENBQ0wsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWxRRCxnRUFrUUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQXJjaGl0ZWN0LCBUYXJnZXQgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7XG4gIE5vZGVNb2R1bGVzQnVpbGRlckluZm8sXG4gIFdvcmtzcGFjZU5vZGVNb2R1bGVzQXJjaGl0ZWN0SG9zdCxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdC9ub2RlJztcbmltcG9ydCB7IGpzb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBzcGF3blN5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBpc1BhY2thZ2VOYW1lU2FmZUZvckFuYWx5dGljcyB9IGZyb20gJy4uL2FuYWx5dGljcy9hbmFseXRpY3MnO1xuaW1wb3J0IHsgRXZlbnRDdXN0b21EaW1lbnNpb24sIEV2ZW50Q3VzdG9tTWV0cmljIH0gZnJvbSAnLi4vYW5hbHl0aWNzL2FuYWx5dGljcy1wYXJhbWV0ZXJzJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi91dGlsaXRpZXMvZXJyb3InO1xuaW1wb3J0IHsgYXNrQ29uZmlybWF0aW9uLCBhc2tRdWVzdGlvbiB9IGZyb20gJy4uL3V0aWxpdGllcy9wcm9tcHQnO1xuaW1wb3J0IHsgaXNUVFkgfSBmcm9tICcuLi91dGlsaXRpZXMvdHR5JztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGUsXG4gIENvbW1hbmRNb2R1bGVFcnJvcixcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBDb21tYW5kU2NvcGUsXG4gIE90aGVyT3B0aW9ucyxcbn0gZnJvbSAnLi9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBPcHRpb24sIHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyB9IGZyb20gJy4vdXRpbGl0aWVzL2pzb24tc2NoZW1hJztcblxuZXhwb3J0IGludGVyZmFjZSBNaXNzaW5nVGFyZ2V0Q2hvaWNlIHtcbiAgbmFtZTogc3RyaW5nO1xuICB2YWx1ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQXJjaGl0ZWN0QmFzZUNvbW1hbmRNb2R1bGU8VCBleHRlbmRzIG9iamVjdD5cbiAgZXh0ZW5kcyBDb21tYW5kTW9kdWxlPFQ+XG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uPFQ+XG57XG4gIG92ZXJyaWRlIHNjb3BlID0gQ29tbWFuZFNjb3BlLkluO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWlzc2luZ1RhcmdldENob2ljZXM6IE1pc3NpbmdUYXJnZXRDaG9pY2VbXSB8IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgYXN5bmMgcnVuU2luZ2xlVGFyZ2V0KHRhcmdldDogVGFyZ2V0LCBvcHRpb25zOiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGFyY2hpdGVjdEhvc3QgPSBhd2FpdCB0aGlzLmdldEFyY2hpdGVjdEhvc3QoKTtcblxuICAgIGxldCBidWlsZGVyTmFtZTogc3RyaW5nO1xuICAgIHRyeSB7XG4gICAgICBidWlsZGVyTmFtZSA9IGF3YWl0IGFyY2hpdGVjdEhvc3QuZ2V0QnVpbGRlck5hbWVGb3JUYXJnZXQodGFyZ2V0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuXG4gICAgICByZXR1cm4gdGhpcy5vbk1pc3NpbmdUYXJnZXQoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHJ1biA9IGF3YWl0IHRoaXMuZ2V0QXJjaGl0ZWN0KCkuc2NoZWR1bGVUYXJnZXQodGFyZ2V0LCBvcHRpb25zIGFzIGpzb24uSnNvbk9iamVjdCwge1xuICAgICAgbG9nZ2VyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYW5hbHl0aWNzID0gaXNQYWNrYWdlTmFtZVNhZmVGb3JBbmFseXRpY3MoYnVpbGRlck5hbWUpXG4gICAgICA/IGF3YWl0IHRoaXMuZ2V0QW5hbHl0aWNzKClcbiAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgbGV0IG91dHB1dFN1YnNjcmlwdGlvbjtcbiAgICBpZiAoYW5hbHl0aWNzKSB7XG4gICAgICBhbmFseXRpY3MucmVwb3J0QXJjaGl0ZWN0UnVuRXZlbnQoe1xuICAgICAgICBbRXZlbnRDdXN0b21EaW1lbnNpb24uQnVpbGRlclRhcmdldF06IGJ1aWxkZXJOYW1lLFxuICAgICAgfSk7XG5cbiAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XG4gICAgICBvdXRwdXRTdWJzY3JpcHRpb24gPSBydW4ub3V0cHV0LnN1YnNjcmliZSgoeyBzdGF0cyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSB0aGlzLmJ1aWxkZXJTdGF0c1RvQW5hbHl0aWNzUGFyYW1ldGVycyhzdGF0cywgYnVpbGRlck5hbWUpO1xuICAgICAgICBpZiAoIXBhcmFtZXRlcnMpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlyc3RSdW4pIHtcbiAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICAgIGFuYWx5dGljcy5yZXBvcnRCdWlsZFJ1bkV2ZW50KHBhcmFtZXRlcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuYWx5dGljcy5yZXBvcnRSZWJ1aWxkUnVuRXZlbnQocGFyYW1ldGVycyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGVycm9yLCBzdWNjZXNzIH0gPSBhd2FpdCBydW4ubGFzdE91dHB1dDtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoZXJyb3IpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3VjY2VzcyA/IDAgOiAxO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBydW4uc3RvcCgpO1xuICAgICAgb3V0cHV0U3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRlclN0YXRzVG9BbmFseXRpY3NQYXJhbWV0ZXJzKFxuICAgIHN0YXRzOiBqc29uLkpzb25WYWx1ZSxcbiAgICBidWlsZGVyTmFtZTogc3RyaW5nLFxuICApOiBQYXJ0aWFsPFxuICAgIHwgUmVjb3JkPEV2ZW50Q3VzdG9tRGltZW5zaW9uICYgRXZlbnRDdXN0b21NZXRyaWMsIHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCB8IGJvb2xlYW4+XG4gICAgfCB1bmRlZmluZWRcbiAgPiB7XG4gICAgaWYgKCFzdGF0cyB8fCB0eXBlb2Ygc3RhdHMgIT09ICdvYmplY3QnIHx8ICEoJ2R1cmF0aW9uSW5NcycgaW4gc3RhdHMpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIG9wdGltaXphdGlvbixcbiAgICAgIGFsbENodW5rc0NvdW50LFxuICAgICAgYW90LFxuICAgICAgbGF6eUNodW5rc0NvdW50LFxuICAgICAgaW5pdGlhbENodW5rc0NvdW50LFxuICAgICAgZHVyYXRpb25Jbk1zLFxuICAgICAgY2hhbmdlZENodW5rc0NvdW50LFxuICAgICAgY3NzU2l6ZUluQnl0ZXMsXG4gICAgICBqc1NpemVJbkJ5dGVzLFxuICAgICAgbmdDb21wb25lbnRDb3VudCxcbiAgICB9ID0gc3RhdHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgW0V2ZW50Q3VzdG9tRGltZW5zaW9uLkJ1aWxkZXJUYXJnZXRdOiBidWlsZGVyTmFtZSxcbiAgICAgIFtFdmVudEN1c3RvbURpbWVuc2lvbi5Bb3RdOiBhb3QsXG4gICAgICBbRXZlbnRDdXN0b21EaW1lbnNpb24uT3B0aW1pemF0aW9uXTogb3B0aW1pemF0aW9uLFxuICAgICAgW0V2ZW50Q3VzdG9tTWV0cmljLkFsbENodW5rc0NvdW50XTogYWxsQ2h1bmtzQ291bnQsXG4gICAgICBbRXZlbnRDdXN0b21NZXRyaWMuTGF6eUNodW5rc0NvdW50XTogbGF6eUNodW5rc0NvdW50LFxuICAgICAgW0V2ZW50Q3VzdG9tTWV0cmljLkluaXRpYWxDaHVua3NDb3VudF06IGluaXRpYWxDaHVua3NDb3VudCxcbiAgICAgIFtFdmVudEN1c3RvbU1ldHJpYy5DaGFuZ2VkQ2h1bmtzQ291bnRdOiBjaGFuZ2VkQ2h1bmtzQ291bnQsXG4gICAgICBbRXZlbnRDdXN0b21NZXRyaWMuRHVyYXRpb25Jbk1zXTogZHVyYXRpb25Jbk1zLFxuICAgICAgW0V2ZW50Q3VzdG9tTWV0cmljLkpzU2l6ZUluQnl0ZXNdOiBqc1NpemVJbkJ5dGVzLFxuICAgICAgW0V2ZW50Q3VzdG9tTWV0cmljLkNzc1NpemVJbkJ5dGVzXTogY3NzU2l6ZUluQnl0ZXMsXG4gICAgICBbRXZlbnRDdXN0b21NZXRyaWMuTmdDb21wb25lbnRDb3VudF06IG5nQ29tcG9uZW50Q291bnQsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX2FyY2hpdGVjdEhvc3Q6IFdvcmtzcGFjZU5vZGVNb2R1bGVzQXJjaGl0ZWN0SG9zdCB8IHVuZGVmaW5lZDtcbiAgcHJvdGVjdGVkIGdldEFyY2hpdGVjdEhvc3QoKTogV29ya3NwYWNlTm9kZU1vZHVsZXNBcmNoaXRlY3RIb3N0IHtcbiAgICBpZiAodGhpcy5fYXJjaGl0ZWN0SG9zdCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FyY2hpdGVjdEhvc3Q7XG4gICAgfVxuXG4gICAgY29uc3Qgd29ya3NwYWNlID0gdGhpcy5nZXRXb3Jrc3BhY2VPclRocm93KCk7XG5cbiAgICByZXR1cm4gKHRoaXMuX2FyY2hpdGVjdEhvc3QgPSBuZXcgV29ya3NwYWNlTm9kZU1vZHVsZXNBcmNoaXRlY3RIb3N0KFxuICAgICAgd29ya3NwYWNlLFxuICAgICAgd29ya3NwYWNlLmJhc2VQYXRoLFxuICAgICkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXJjaGl0ZWN0OiBBcmNoaXRlY3QgfCB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCBnZXRBcmNoaXRlY3QoKTogQXJjaGl0ZWN0IHtcbiAgICBpZiAodGhpcy5fYXJjaGl0ZWN0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXJjaGl0ZWN0O1xuICAgIH1cblxuICAgIGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IGpzb24uc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeSgpO1xuICAgIHJlZ2lzdHJ5LmFkZFBvc3RUcmFuc2Zvcm0oanNvbi5zY2hlbWEudHJhbnNmb3Jtcy5hZGRVbmRlZmluZWREZWZhdWx0cyk7XG4gICAgcmVnaXN0cnkudXNlWERlcHJlY2F0ZWRQcm92aWRlcigobXNnKSA9PiB0aGlzLmNvbnRleHQubG9nZ2VyLndhcm4obXNnKSk7XG5cbiAgICBjb25zdCBhcmNoaXRlY3RIb3N0ID0gdGhpcy5nZXRBcmNoaXRlY3RIb3N0KCk7XG5cbiAgICByZXR1cm4gKHRoaXMuX2FyY2hpdGVjdCA9IG5ldyBBcmNoaXRlY3QoYXJjaGl0ZWN0SG9zdCwgcmVnaXN0cnkpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBcmNoaXRlY3RUYXJnZXRPcHRpb25zKHRhcmdldDogVGFyZ2V0KTogUHJvbWlzZTxPcHRpb25bXT4ge1xuICAgIGNvbnN0IGFyY2hpdGVjdEhvc3QgPSB0aGlzLmdldEFyY2hpdGVjdEhvc3QoKTtcbiAgICBsZXQgYnVpbGRlckNvbmY6IHN0cmluZztcblxuICAgIHRyeSB7XG4gICAgICBidWlsZGVyQ29uZiA9IGF3YWl0IGFyY2hpdGVjdEhvc3QuZ2V0QnVpbGRlck5hbWVGb3JUYXJnZXQodGFyZ2V0KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBsZXQgYnVpbGRlckRlc2M6IE5vZGVNb2R1bGVzQnVpbGRlckluZm87XG4gICAgdHJ5IHtcbiAgICAgIGJ1aWxkZXJEZXNjID0gYXdhaXQgYXJjaGl0ZWN0SG9zdC5yZXNvbHZlQnVpbGRlcihidWlsZGVyQ29uZik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgIGlmIChlLmNvZGUgPT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgICB0aGlzLndhcm5Pbk1pc3NpbmdOb2RlTW9kdWxlcygpO1xuICAgICAgICB0aHJvdyBuZXcgQ29tbWFuZE1vZHVsZUVycm9yKGBDb3VsZCBub3QgZmluZCB0aGUgJyR7YnVpbGRlckNvbmZ9JyBidWlsZGVyJ3Mgbm9kZSBwYWNrYWdlLmApO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZUpzb25TY2hlbWFUb09wdGlvbnMoXG4gICAgICBuZXcganNvbi5zY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KCksXG4gICAgICBidWlsZGVyRGVzYy5vcHRpb25TY2hlbWEgYXMganNvbi5Kc29uT2JqZWN0LFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSB3YXJuT25NaXNzaW5nTm9kZU1vZHVsZXMoKTogdm9pZCB7XG4gICAgY29uc3QgYmFzZVBhdGggPSB0aGlzLmNvbnRleHQud29ya3NwYWNlPy5iYXNlUGF0aDtcbiAgICBpZiAoIWJhc2VQYXRoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGEgYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5IChucG0sIHlhcm4gbm9uLVBuUCwgZXRjLilcbiAgICBpZiAoZXhpc3RzU3luYyhyZXNvbHZlKGJhc2VQYXRoLCAnbm9kZV9tb2R1bGVzJykpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHlhcm4gUG5QIGZpbGVzXG4gICAgaWYgKFxuICAgICAgZXhpc3RzU3luYyhyZXNvbHZlKGJhc2VQYXRoLCAnLnBucC5qcycpKSB8fFxuICAgICAgZXhpc3RzU3luYyhyZXNvbHZlKGJhc2VQYXRoLCAnLnBucC5janMnKSkgfHxcbiAgICAgIGV4aXN0c1N5bmMocmVzb2x2ZShiYXNlUGF0aCwgJy5wbnAubWpzJykpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jb250ZXh0LmxvZ2dlci53YXJuKFxuICAgICAgYE5vZGUgcGFja2FnZXMgbWF5IG5vdCBiZSBpbnN0YWxsZWQuIFRyeSBpbnN0YWxsaW5nIHdpdGggJyR7dGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLm5hbWV9IGluc3RhbGwnLmAsXG4gICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRBcmNoaXRlY3RUYXJnZXQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jb21tYW5kTmFtZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBvbk1pc3NpbmdUYXJnZXQoZGVmYXVsdE1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8MT4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgY2hvaWNlcyA9IHRoaXMubWlzc2luZ1RhcmdldENob2ljZXM7XG5cbiAgICBpZiAoIWNob2ljZXM/Lmxlbmd0aCkge1xuICAgICAgbG9nZ2VyLmVycm9yKGRlZmF1bHRNZXNzYWdlKTtcblxuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgY29uc3QgbWlzc2luZ1RhcmdldE1lc3NhZ2UgPVxuICAgICAgYENhbm5vdCBmaW5kIFwiJHt0aGlzLmdldEFyY2hpdGVjdFRhcmdldCgpfVwiIHRhcmdldCBmb3IgdGhlIHNwZWNpZmllZCBwcm9qZWN0LlxcbmAgK1xuICAgICAgYFlvdSBjYW4gYWRkIGEgcGFja2FnZSB0aGF0IGltcGxlbWVudHMgdGhlc2UgY2FwYWJpbGl0aWVzLlxcblxcbmAgK1xuICAgICAgYEZvciBleGFtcGxlOlxcbmAgK1xuICAgICAgY2hvaWNlcy5tYXAoKHsgbmFtZSwgdmFsdWUgfSkgPT4gYCAgJHtuYW1lfTogbmcgYWRkICR7dmFsdWV9YCkuam9pbignXFxuJykgK1xuICAgICAgJ1xcbic7XG5cbiAgICBpZiAoaXNUVFkoKSkge1xuICAgICAgLy8gVXNlIHByb21wdHMgdG8gYXNrIHRoZSB1c2VyIGlmIHRoZXknZCBsaWtlIHRvIGluc3RhbGwgYSBwYWNrYWdlLlxuICAgICAgbG9nZ2VyLndhcm4obWlzc2luZ1RhcmdldE1lc3NhZ2UpO1xuXG4gICAgICBjb25zdCBwYWNrYWdlVG9JbnN0YWxsID0gYXdhaXQgdGhpcy5nZXRNaXNzaW5nVGFyZ2V0UGFja2FnZVRvSW5zdGFsbChjaG9pY2VzKTtcbiAgICAgIGlmIChwYWNrYWdlVG9JbnN0YWxsKSB7XG4gICAgICAgIC8vIEV4YW1wbGUgcnVuOiBgbmcgYWRkIEBhbmd1bGFyLWVzbGludC9zY2hlbWF0aWNzYC5cbiAgICAgICAgY29uc3QgYmluUGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vYmluL25nLmpzJyk7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IgfSA9IHNwYXduU3luYyhwcm9jZXNzLmV4ZWNQYXRoLCBbYmluUGF0aCwgJ2FkZCcsIHBhY2thZ2VUb0luc3RhbGxdLCB7XG4gICAgICAgICAgc3RkaW86ICdpbmhlcml0JyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm9uIFRUWSBkaXNwbGF5IGVycm9yIG1lc3NhZ2UuXG4gICAgICBsb2dnZXIuZXJyb3IobWlzc2luZ1RhcmdldE1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiAxO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRNaXNzaW5nVGFyZ2V0UGFja2FnZVRvSW5zdGFsbChcbiAgICBjaG9pY2VzOiBNaXNzaW5nVGFyZ2V0Q2hvaWNlW10sXG4gICk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmIChjaG9pY2VzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gU2luZ2xlIGNob2ljZVxuICAgICAgY29uc3QgeyBuYW1lLCB2YWx1ZSB9ID0gY2hvaWNlc1swXTtcbiAgICAgIGlmIChhd2FpdCBhc2tDb25maXJtYXRpb24oYFdvdWxkIHlvdSBsaWtlIHRvIGFkZCAke25hbWV9IG5vdz9gLCB0cnVlLCBmYWxzZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBNdWx0aXBsZSBjaG9pY2VcbiAgICByZXR1cm4gYXNrUXVlc3Rpb24oXG4gICAgICBgV291bGQgeW91IGxpa2UgdG8gYWRkIGEgcGFja2FnZSB3aXRoIFwiJHt0aGlzLmdldEFyY2hpdGVjdFRhcmdldCgpfVwiIGNhcGFiaWxpdGllcyBub3c/YCxcbiAgICAgIFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdObycsXG4gICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIC4uLmNob2ljZXMsXG4gICAgICBdLFxuICAgICAgMCxcbiAgICAgIG51bGwsXG4gICAgKTtcbiAgfVxufVxuIl19