"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandModuleError = exports.CommandModule = exports.CommandScope = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const analytics_1 = require("../analytics/analytics");
const analytics_collector_1 = require("../analytics/analytics-collector");
const analytics_parameters_1 = require("../analytics/analytics-parameters");
const completion_1 = require("../utilities/completion");
const memoize_1 = require("../utilities/memoize");
var CommandScope;
(function (CommandScope) {
    /** Command can only run inside an Angular workspace. */
    CommandScope[CommandScope["In"] = 0] = "In";
    /** Command can only run outside an Angular workspace. */
    CommandScope[CommandScope["Out"] = 1] = "Out";
    /** Command can run inside and outside an Angular workspace. */
    CommandScope[CommandScope["Both"] = 2] = "Both";
})(CommandScope || (exports.CommandScope = CommandScope = {}));
class CommandModule {
    constructor(context) {
        this.context = context;
        this.shouldReportAnalytics = true;
        this.scope = CommandScope.Both;
        this.optionsWithAnalytics = new Map();
    }
    /**
     * Description object which contains the long command descroption.
     * This is used to generate JSON help wich is used in AIO.
     *
     * `false` will result in a hidden command.
     */
    get fullDescribe() {
        return this.describe === false
            ? false
            : {
                describe: this.describe,
                ...(this.longDescriptionPath
                    ? {
                        longDescriptionRelativePath: path
                            .relative(path.join(__dirname, '../../../../'), this.longDescriptionPath)
                            .replace(/\\/g, path.posix.sep),
                        longDescription: (0, fs_1.readFileSync)(this.longDescriptionPath, 'utf8').replace(/\r\n/g, '\n'),
                    }
                    : {}),
            };
    }
    get commandName() {
        return this.command.split(' ', 1)[0];
    }
    async handler(args) {
        const { _, $0, ...options } = args;
        // Camelize options as yargs will return the object in kebab-case when camel casing is disabled.
        const camelCasedOptions = {};
        for (const [key, value] of Object.entries(options)) {
            camelCasedOptions[helpers_1.Parser.camelCase(key)] = value;
        }
        // Set up autocompletion if appropriate.
        const autocompletionExitCode = await (0, completion_1.considerSettingUpAutocompletion)(this.commandName, this.context.logger);
        if (autocompletionExitCode !== undefined) {
            process.exitCode = autocompletionExitCode;
            return;
        }
        // Gather and report analytics.
        const analytics = await this.getAnalytics();
        const stopPeriodicFlushes = analytics && analytics.periodFlush();
        let exitCode;
        try {
            if (analytics) {
                this.reportCommandRunAnalytics(analytics);
                this.reportWorkspaceInfoAnalytics(analytics);
            }
            exitCode = await this.run(camelCasedOptions);
        }
        catch (e) {
            if (e instanceof core_1.schema.SchemaValidationException) {
                this.context.logger.fatal(`Error: ${e.message}`);
                exitCode = 1;
            }
            else {
                throw e;
            }
        }
        finally {
            await stopPeriodicFlushes?.();
            if (typeof exitCode === 'number' && exitCode > 0) {
                process.exitCode = exitCode;
            }
        }
    }
    async getAnalytics() {
        if (!this.shouldReportAnalytics) {
            return undefined;
        }
        const userId = await (0, analytics_1.getAnalyticsUserId)(this.context, 
        // Don't prompt for `ng update` and `ng analytics` commands.
        ['update', 'analytics'].includes(this.commandName));
        return userId ? new analytics_collector_1.AnalyticsCollector(this.context, userId) : undefined;
    }
    /**
     * Adds schema options to a command also this keeps track of options that are required for analytics.
     * **Note:** This method should be called from the command bundler method.
     */
    addSchemaOptionsToCommand(localYargs, options) {
        const booleanOptionsWithNoPrefix = new Set();
        for (const option of options) {
            const { default: defaultVal, positional, deprecated, description, alias, userAnalytics, type, hidden, name, choices, } = option;
            const sharedOptions = {
                alias,
                hidden,
                description,
                deprecated,
                choices,
                // This should only be done when `--help` is used otherwise default will override options set in angular.json.
                ...(this.context.args.options.help ? { default: defaultVal } : {}),
            };
            let dashedName = core_1.strings.dasherize(name);
            // Handle options which have been defined in the schema with `no` prefix.
            if (type === 'boolean' && dashedName.startsWith('no-')) {
                dashedName = dashedName.slice(3);
                booleanOptionsWithNoPrefix.add(dashedName);
            }
            if (positional === undefined) {
                localYargs = localYargs.option(dashedName, {
                    type,
                    ...sharedOptions,
                });
            }
            else {
                localYargs = localYargs.positional(dashedName, {
                    type: type === 'array' || type === 'count' ? 'string' : type,
                    ...sharedOptions,
                });
            }
            // Record option of analytics.
            if (userAnalytics !== undefined) {
                this.optionsWithAnalytics.set(name, userAnalytics);
            }
        }
        // Handle options which have been defined in the schema with `no` prefix.
        if (booleanOptionsWithNoPrefix.size) {
            localYargs.middleware((options) => {
                for (const key of booleanOptionsWithNoPrefix) {
                    if (key in options) {
                        options[`no-${key}`] = !options[key];
                        delete options[key];
                    }
                }
            }, false);
        }
        return localYargs;
    }
    getWorkspaceOrThrow() {
        const { workspace } = this.context;
        if (!workspace) {
            throw new CommandModuleError('A workspace is required for this command.');
        }
        return workspace;
    }
    /**
     * Flush on an interval (if the event loop is waiting).
     *
     * @returns a method that when called will terminate the periodic
     * flush and call flush one last time.
     */
    getAnalyticsParameters(options) {
        const parameters = {};
        const validEventCustomDimensionAndMetrics = new Set([
            ...Object.values(analytics_parameters_1.EventCustomDimension),
            ...Object.values(analytics_parameters_1.EventCustomMetric),
        ]);
        for (const [name, ua] of this.optionsWithAnalytics) {
            const value = options[name];
            if ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') &&
                validEventCustomDimensionAndMetrics.has(ua)) {
                parameters[ua] = value;
            }
        }
        return parameters;
    }
    reportCommandRunAnalytics(analytics) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internalMethods = yargs_1.default.getInternalMethods();
        // $0 generate component [name] -> generate_component
        // $0 add <collection> -> add
        const fullCommand = internalMethods.getUsageInstance().getUsage()[0][0]
            .split(' ')
            .filter((x) => {
            const code = x.charCodeAt(0);
            return code >= 97 && code <= 122;
        })
            .join('_');
        analytics.reportCommandRunEvent(fullCommand);
    }
    reportWorkspaceInfoAnalytics(analytics) {
        const { workspace } = this.context;
        if (!workspace) {
            return;
        }
        let applicationProjectsCount = 0;
        let librariesProjectsCount = 0;
        for (const project of workspace.projects.values()) {
            switch (project.extensions['projectType']) {
                case 'application':
                    applicationProjectsCount++;
                    break;
                case 'library':
                    librariesProjectsCount++;
                    break;
            }
        }
        analytics.reportWorkspaceInfoEvent({
            [analytics_parameters_1.EventCustomMetric.AllProjectsCount]: librariesProjectsCount + applicationProjectsCount,
            [analytics_parameters_1.EventCustomMetric.ApplicationProjectsCount]: applicationProjectsCount,
            [analytics_parameters_1.EventCustomMetric.LibraryProjectsCount]: librariesProjectsCount,
        });
    }
}
exports.CommandModule = CommandModule;
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommandModule.prototype, "getAnalytics", null);
/**
 * Creates an known command module error.
 * This is used so during executation we can filter between known validation error and real non handled errors.
 */
class CommandModuleError extends Error {
}
exports.CommandModuleError = CommandModuleError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQWdFO0FBQ2hFLDJCQUFrQztBQUNsQywyQ0FBNkI7QUFDN0Isa0RBUWU7QUFDZiwyQ0FBc0Q7QUFDdEQsc0RBQTREO0FBQzVELDBFQUFzRTtBQUN0RSw0RUFBNEY7QUFDNUYsd0RBQTBFO0FBRTFFLGtEQUErQztBQU0vQyxJQUFZLFlBT1g7QUFQRCxXQUFZLFlBQVk7SUFDdEIsd0RBQXdEO0lBQ3hELDJDQUFFLENBQUE7SUFDRix5REFBeUQ7SUFDekQsNkNBQUcsQ0FBQTtJQUNILCtEQUErRDtJQUMvRCwrQ0FBSSxDQUFBO0FBQ04sQ0FBQyxFQVBXLFlBQVksNEJBQVosWUFBWSxRQU92QjtBQXdDRCxNQUFzQixhQUFhO0lBU2pDLFlBQStCLE9BQXVCO1FBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBTG5DLDBCQUFxQixHQUFZLElBQUksQ0FBQztRQUNoRCxVQUFLLEdBQWlCLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFFaEMseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFFVCxDQUFDO0lBRTFEOzs7OztPQUtHO0lBQ0gsSUFBVyxZQUFZO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLO1lBQzVCLENBQUMsQ0FBQyxLQUFLO1lBQ1AsQ0FBQyxDQUFDO2dCQUNFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUI7b0JBQzFCLENBQUMsQ0FBQzt3QkFDRSwyQkFBMkIsRUFBRSxJQUFJOzZCQUM5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QWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGxvZ2dpbmcsIHNjaGVtYSwgc3RyaW5ncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeWFyZ3MsIHtcbiAgQXJndW1lbnRzLFxuICBBcmd1bWVudHNDYW1lbENhc2UsXG4gIEFyZ3YsXG4gIENhbWVsQ2FzZUtleSxcbiAgUG9zaXRpb25hbE9wdGlvbnMsXG4gIENvbW1hbmRNb2R1bGUgYXMgWWFyZ3NDb21tYW5kTW9kdWxlLFxuICBPcHRpb25zIGFzIFlhcmdzT3B0aW9ucyxcbn0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgUGFyc2VyIGFzIHlhcmdzUGFyc2VyIH0gZnJvbSAneWFyZ3MvaGVscGVycyc7XG5pbXBvcnQgeyBnZXRBbmFseXRpY3NVc2VySWQgfSBmcm9tICcuLi9hbmFseXRpY3MvYW5hbHl0aWNzJztcbmltcG9ydCB7IEFuYWx5dGljc0NvbGxlY3RvciB9IGZyb20gJy4uL2FuYWx5dGljcy9hbmFseXRpY3MtY29sbGVjdG9yJztcbmltcG9ydCB7IEV2ZW50Q3VzdG9tRGltZW5zaW9uLCBFdmVudEN1c3RvbU1ldHJpYyB9IGZyb20gJy4uL2FuYWx5dGljcy9hbmFseXRpY3MtcGFyYW1ldGVycyc7XG5pbXBvcnQgeyBjb25zaWRlclNldHRpbmdVcEF1dG9jb21wbGV0aW9uIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NvbXBsZXRpb24nO1xuaW1wb3J0IHsgQW5ndWxhcldvcmtzcGFjZSB9IGZyb20gJy4uL3V0aWxpdGllcy9jb25maWcnO1xuaW1wb3J0IHsgbWVtb2l6ZSB9IGZyb20gJy4uL3V0aWxpdGllcy9tZW1vaXplJztcbmltcG9ydCB7IFBhY2thZ2VNYW5hZ2VyVXRpbHMgfSBmcm9tICcuLi91dGlsaXRpZXMvcGFja2FnZS1tYW5hZ2VyJztcbmltcG9ydCB7IE9wdGlvbiB9IGZyb20gJy4vdXRpbGl0aWVzL2pzb24tc2NoZW1hJztcblxuZXhwb3J0IHR5cGUgT3B0aW9uczxUPiA9IHsgW2tleSBpbiBrZXlvZiBUIGFzIENhbWVsQ2FzZUtleTxrZXk+XTogVFtrZXldIH07XG5cbmV4cG9ydCBlbnVtIENvbW1hbmRTY29wZSB7XG4gIC8qKiBDb21tYW5kIGNhbiBvbmx5IHJ1biBpbnNpZGUgYW4gQW5ndWxhciB3b3Jrc3BhY2UuICovXG4gIEluLFxuICAvKiogQ29tbWFuZCBjYW4gb25seSBydW4gb3V0c2lkZSBhbiBBbmd1bGFyIHdvcmtzcGFjZS4gKi9cbiAgT3V0LFxuICAvKiogQ29tbWFuZCBjYW4gcnVuIGluc2lkZSBhbmQgb3V0c2lkZSBhbiBBbmd1bGFyIHdvcmtzcGFjZS4gKi9cbiAgQm90aCxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kQ29udGV4dCB7XG4gIGN1cnJlbnREaXJlY3Rvcnk6IHN0cmluZztcbiAgcm9vdDogc3RyaW5nO1xuICB3b3Jrc3BhY2U/OiBBbmd1bGFyV29ya3NwYWNlO1xuICBnbG9iYWxDb25maWd1cmF0aW9uOiBBbmd1bGFyV29ya3NwYWNlO1xuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyO1xuICBwYWNrYWdlTWFuYWdlcjogUGFja2FnZU1hbmFnZXJVdGlscztcbiAgLyoqIEFyZ3VtZW50cyBwYXJzZWQgaW4gZnJlZS1mcm9tIHdpdGhvdXQgcGFyc2VyIGNvbmZpZ3VyYXRpb24uICovXG4gIGFyZ3M6IHtcbiAgICBwb3NpdGlvbmFsOiBzdHJpbmdbXTtcbiAgICBvcHRpb25zOiB7XG4gICAgICBoZWxwOiBib29sZWFuO1xuICAgICAganNvbkhlbHA6IGJvb2xlYW47XG4gICAgICBnZXRZYXJnc0NvbXBsZXRpb25zOiBib29sZWFuO1xuICAgIH0gJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgT3RoZXJPcHRpb25zID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uPFQgZXh0ZW5kcyB7fSA9IHt9PlxuICBleHRlbmRzIE9taXQ8WWFyZ3NDb21tYW5kTW9kdWxlPHt9LCBUPiwgJ2J1aWxkZXInIHwgJ2hhbmRsZXInPiB7XG4gIC8qKiBTY29wZSBpbiB3aGljaCB0aGUgY29tbWFuZCBjYW4gYmUgZXhlY3V0ZWQgaW4uICovXG4gIHNjb3BlOiBDb21tYW5kU2NvcGU7XG4gIC8qKiBQYXRoIHVzZWQgdG8gbG9hZCB0aGUgbG9uZyBkZXNjcmlwdGlvbiBmb3IgdGhlIGNvbW1hbmQgaW4gSlNPTiBoZWxwIHRleHQuICovXG4gIGxvbmdEZXNjcmlwdGlvblBhdGg/OiBzdHJpbmc7XG4gIC8qKiBPYmplY3QgZGVjbGFyaW5nIHRoZSBvcHRpb25zIHRoZSBjb21tYW5kIGFjY2VwdHMsIG9yIGEgZnVuY3Rpb24gYWNjZXB0aW5nIGFuZCByZXR1cm5pbmcgYSB5YXJncyBpbnN0YW5jZS4gKi9cbiAgYnVpbGRlcihhcmd2OiBBcmd2KTogUHJvbWlzZTxBcmd2PFQ+PiB8IEFyZ3Y8VD47XG4gIC8qKiBBIGZ1bmN0aW9uIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRoZSBwYXJzZWQgYXJndi4gKi9cbiAgcnVuKG9wdGlvbnM6IE9wdGlvbnM8VD4gJiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlciB8IHZvaWQ+IHwgbnVtYmVyIHwgdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGdWxsRGVzY3JpYmUge1xuICBkZXNjcmliZT86IHN0cmluZztcbiAgbG9uZ0Rlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBsb25nRGVzY3JpcHRpb25SZWxhdGl2ZVBhdGg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kTW9kdWxlPFQgZXh0ZW5kcyB7fSA9IHt9PiBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbjxUPiB7XG4gIGFic3RyYWN0IHJlYWRvbmx5IGNvbW1hbmQ6IHN0cmluZztcbiAgYWJzdHJhY3QgcmVhZG9ubHkgZGVzY3JpYmU6IHN0cmluZyB8IGZhbHNlO1xuICBhYnN0cmFjdCByZWFkb25seSBsb25nRGVzY3JpcHRpb25QYXRoPzogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgc2hvdWxkUmVwb3J0QW5hbHl0aWNzOiBib29sZWFuID0gdHJ1ZTtcbiAgcmVhZG9ubHkgc2NvcGU6IENvbW1hbmRTY29wZSA9IENvbW1hbmRTY29wZS5Cb3RoO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uc1dpdGhBbmFseXRpY3MgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCByZWFkb25seSBjb250ZXh0OiBDb21tYW5kQ29udGV4dCkge31cblxuICAvKipcbiAgICogRGVzY3JpcHRpb24gb2JqZWN0IHdoaWNoIGNvbnRhaW5zIHRoZSBsb25nIGNvbW1hbmQgZGVzY3JvcHRpb24uXG4gICAqIFRoaXMgaXMgdXNlZCB0byBnZW5lcmF0ZSBKU09OIGhlbHAgd2ljaCBpcyB1c2VkIGluIEFJTy5cbiAgICpcbiAgICogYGZhbHNlYCB3aWxsIHJlc3VsdCBpbiBhIGhpZGRlbiBjb21tYW5kLlxuICAgKi9cbiAgcHVibGljIGdldCBmdWxsRGVzY3JpYmUoKTogRnVsbERlc2NyaWJlIHwgZmFsc2Uge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlID09PSBmYWxzZVxuICAgICAgPyBmYWxzZVxuICAgICAgOiB7XG4gICAgICAgICAgZGVzY3JpYmU6IHRoaXMuZGVzY3JpYmUsXG4gICAgICAgICAgLi4uKHRoaXMubG9uZ0Rlc2NyaXB0aW9uUGF0aFxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgbG9uZ0Rlc2NyaXB0aW9uUmVsYXRpdmVQYXRoOiBwYXRoXG4gICAgICAgICAgICAgICAgICAucmVsYXRpdmUocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uLy4uLycpLCB0aGlzLmxvbmdEZXNjcmlwdGlvblBhdGgpXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCBwYXRoLnBvc2l4LnNlcCksXG4gICAgICAgICAgICAgICAgbG9uZ0Rlc2NyaXB0aW9uOiByZWFkRmlsZVN5bmModGhpcy5sb25nRGVzY3JpcHRpb25QYXRoLCAndXRmOCcpLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAvXFxyXFxuL2csXG4gICAgICAgICAgICAgICAgICAnXFxuJyxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHt9KSxcbiAgICAgICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXQgY29tbWFuZE5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jb21tYW5kLnNwbGl0KCcgJywgMSlbMF07XG4gIH1cblxuICBhYnN0cmFjdCBidWlsZGVyKGFyZ3Y6IEFyZ3YpOiBQcm9taXNlPEFyZ3Y8VD4+IHwgQXJndjxUPjtcbiAgYWJzdHJhY3QgcnVuKG9wdGlvbnM6IE9wdGlvbnM8VD4gJiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlciB8IHZvaWQ+IHwgbnVtYmVyIHwgdm9pZDtcblxuICBhc3luYyBoYW5kbGVyKGFyZ3M6IEFyZ3VtZW50c0NhbWVsQ2FzZTxUPiAmIE90aGVyT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgXywgJDAsIC4uLm9wdGlvbnMgfSA9IGFyZ3M7XG5cbiAgICAvLyBDYW1lbGl6ZSBvcHRpb25zIGFzIHlhcmdzIHdpbGwgcmV0dXJuIHRoZSBvYmplY3QgaW4ga2ViYWItY2FzZSB3aGVuIGNhbWVsIGNhc2luZyBpcyBkaXNhYmxlZC5cbiAgICBjb25zdCBjYW1lbENhc2VkT3B0aW9uczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvcHRpb25zKSkge1xuICAgICAgY2FtZWxDYXNlZE9wdGlvbnNbeWFyZ3NQYXJzZXIuY2FtZWxDYXNlKGtleSldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gU2V0IHVwIGF1dG9jb21wbGV0aW9uIGlmIGFwcHJvcHJpYXRlLlxuICAgIGNvbnN0IGF1dG9jb21wbGV0aW9uRXhpdENvZGUgPSBhd2FpdCBjb25zaWRlclNldHRpbmdVcEF1dG9jb21wbGV0aW9uKFxuICAgICAgdGhpcy5jb21tYW5kTmFtZSxcbiAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIsXG4gICAgKTtcbiAgICBpZiAoYXV0b2NvbXBsZXRpb25FeGl0Q29kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm9jZXNzLmV4aXRDb2RlID0gYXV0b2NvbXBsZXRpb25FeGl0Q29kZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEdhdGhlciBhbmQgcmVwb3J0IGFuYWx5dGljcy5cbiAgICBjb25zdCBhbmFseXRpY3MgPSBhd2FpdCB0aGlzLmdldEFuYWx5dGljcygpO1xuICAgIGNvbnN0IHN0b3BQZXJpb2RpY0ZsdXNoZXMgPSBhbmFseXRpY3MgJiYgYW5hbHl0aWNzLnBlcmlvZEZsdXNoKCk7XG5cbiAgICBsZXQgZXhpdENvZGU6IG51bWJlciB8IHZvaWQgfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChhbmFseXRpY3MpIHtcbiAgICAgICAgdGhpcy5yZXBvcnRDb21tYW5kUnVuQW5hbHl0aWNzKGFuYWx5dGljcyk7XG4gICAgICAgIHRoaXMucmVwb3J0V29ya3NwYWNlSW5mb0FuYWx5dGljcyhhbmFseXRpY3MpO1xuICAgICAgfVxuXG4gICAgICBleGl0Q29kZSA9IGF3YWl0IHRoaXMucnVuKGNhbWVsQ2FzZWRPcHRpb25zIGFzIE9wdGlvbnM8VD4gJiBPdGhlck9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2Ygc2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24pIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxvZ2dlci5mYXRhbChgRXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICBleGl0Q29kZSA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCBzdG9wUGVyaW9kaWNGbHVzaGVzPy4oKTtcblxuICAgICAgaWYgKHR5cGVvZiBleGl0Q29kZSA9PT0gJ251bWJlcicgJiYgZXhpdENvZGUgPiAwKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdENvZGUgPSBleGl0Q29kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBAbWVtb2l6ZVxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QW5hbHl0aWNzKCk6IFByb21pc2U8QW5hbHl0aWNzQ29sbGVjdG9yIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCF0aGlzLnNob3VsZFJlcG9ydEFuYWx5dGljcykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VySWQgPSBhd2FpdCBnZXRBbmFseXRpY3NVc2VySWQoXG4gICAgICB0aGlzLmNvbnRleHQsXG4gICAgICAvLyBEb24ndCBwcm9tcHQgZm9yIGBuZyB1cGRhdGVgIGFuZCBgbmcgYW5hbHl0aWNzYCBjb21tYW5kcy5cbiAgICAgIFsndXBkYXRlJywgJ2FuYWx5dGljcyddLmluY2x1ZGVzKHRoaXMuY29tbWFuZE5hbWUpLFxuICAgICk7XG5cbiAgICByZXR1cm4gdXNlcklkID8gbmV3IEFuYWx5dGljc0NvbGxlY3Rvcih0aGlzLmNvbnRleHQsIHVzZXJJZCkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBzY2hlbWEgb3B0aW9ucyB0byBhIGNvbW1hbmQgYWxzbyB0aGlzIGtlZXBzIHRyYWNrIG9mIG9wdGlvbnMgdGhhdCBhcmUgcmVxdWlyZWQgZm9yIGFuYWx5dGljcy5cbiAgICogKipOb3RlOioqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgZnJvbSB0aGUgY29tbWFuZCBidW5kbGVyIG1ldGhvZC5cbiAgICovXG4gIHByb3RlY3RlZCBhZGRTY2hlbWFPcHRpb25zVG9Db21tYW5kPFQ+KGxvY2FsWWFyZ3M6IEFyZ3Y8VD4sIG9wdGlvbnM6IE9wdGlvbltdKTogQXJndjxUPiB7XG4gICAgY29uc3QgYm9vbGVhbk9wdGlvbnNXaXRoTm9QcmVmaXggPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbCxcbiAgICAgICAgcG9zaXRpb25hbCxcbiAgICAgICAgZGVwcmVjYXRlZCxcbiAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgIGFsaWFzLFxuICAgICAgICB1c2VyQW5hbHl0aWNzLFxuICAgICAgICB0eXBlLFxuICAgICAgICBoaWRkZW4sXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGNob2ljZXMsXG4gICAgICB9ID0gb3B0aW9uO1xuXG4gICAgICBjb25zdCBzaGFyZWRPcHRpb25zOiBZYXJnc09wdGlvbnMgJiBQb3NpdGlvbmFsT3B0aW9ucyA9IHtcbiAgICAgICAgYWxpYXMsXG4gICAgICAgIGhpZGRlbixcbiAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgIGRlcHJlY2F0ZWQsXG4gICAgICAgIGNob2ljZXMsXG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIG9ubHkgYmUgZG9uZSB3aGVuIGAtLWhlbHBgIGlzIHVzZWQgb3RoZXJ3aXNlIGRlZmF1bHQgd2lsbCBvdmVycmlkZSBvcHRpb25zIHNldCBpbiBhbmd1bGFyLmpzb24uXG4gICAgICAgIC4uLih0aGlzLmNvbnRleHQuYXJncy5vcHRpb25zLmhlbHAgPyB7IGRlZmF1bHQ6IGRlZmF1bHRWYWwgfSA6IHt9KSxcbiAgICAgIH07XG5cbiAgICAgIGxldCBkYXNoZWROYW1lID0gc3RyaW5ncy5kYXNoZXJpemUobmFtZSk7XG5cbiAgICAgIC8vIEhhbmRsZSBvcHRpb25zIHdoaWNoIGhhdmUgYmVlbiBkZWZpbmVkIGluIHRoZSBzY2hlbWEgd2l0aCBgbm9gIHByZWZpeC5cbiAgICAgIGlmICh0eXBlID09PSAnYm9vbGVhbicgJiYgZGFzaGVkTmFtZS5zdGFydHNXaXRoKCduby0nKSkge1xuICAgICAgICBkYXNoZWROYW1lID0gZGFzaGVkTmFtZS5zbGljZSgzKTtcbiAgICAgICAgYm9vbGVhbk9wdGlvbnNXaXRoTm9QcmVmaXguYWRkKGRhc2hlZE5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zaXRpb25hbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGxvY2FsWWFyZ3MgPSBsb2NhbFlhcmdzLm9wdGlvbihkYXNoZWROYW1lLCB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICAuLi5zaGFyZWRPcHRpb25zLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvY2FsWWFyZ3MgPSBsb2NhbFlhcmdzLnBvc2l0aW9uYWwoZGFzaGVkTmFtZSwge1xuICAgICAgICAgIHR5cGU6IHR5cGUgPT09ICdhcnJheScgfHwgdHlwZSA9PT0gJ2NvdW50JyA/ICdzdHJpbmcnIDogdHlwZSxcbiAgICAgICAgICAuLi5zaGFyZWRPcHRpb25zLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVjb3JkIG9wdGlvbiBvZiBhbmFseXRpY3MuXG4gICAgICBpZiAodXNlckFuYWx5dGljcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9uc1dpdGhBbmFseXRpY3Muc2V0KG5hbWUsIHVzZXJBbmFseXRpY3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBvcHRpb25zIHdoaWNoIGhhdmUgYmVlbiBkZWZpbmVkIGluIHRoZSBzY2hlbWEgd2l0aCBgbm9gIHByZWZpeC5cbiAgICBpZiAoYm9vbGVhbk9wdGlvbnNXaXRoTm9QcmVmaXguc2l6ZSkge1xuICAgICAgbG9jYWxZYXJncy5taWRkbGV3YXJlKChvcHRpb25zOiBBcmd1bWVudHMpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgYm9vbGVhbk9wdGlvbnNXaXRoTm9QcmVmaXgpIHtcbiAgICAgICAgICBpZiAoa2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnNbYG5vLSR7a2V5fWBdID0gIW9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zW2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsWWFyZ3M7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0V29ya3NwYWNlT3JUaHJvdygpOiBBbmd1bGFyV29ya3NwYWNlIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGlmICghd29ya3NwYWNlKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZE1vZHVsZUVycm9yKCdBIHdvcmtzcGFjZSBpcyByZXF1aXJlZCBmb3IgdGhpcyBjb21tYW5kLicpO1xuICAgIH1cblxuICAgIHJldHVybiB3b3Jrc3BhY2U7XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggb24gYW4gaW50ZXJ2YWwgKGlmIHRoZSBldmVudCBsb29wIGlzIHdhaXRpbmcpLlxuICAgKlxuICAgKiBAcmV0dXJucyBhIG1ldGhvZCB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgdGVybWluYXRlIHRoZSBwZXJpb2RpY1xuICAgKiBmbHVzaCBhbmQgY2FsbCBmbHVzaCBvbmUgbGFzdCB0aW1lLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldEFuYWx5dGljc1BhcmFtZXRlcnMoXG4gICAgb3B0aW9uczogKE9wdGlvbnM8VD4gJiBPdGhlck9wdGlvbnMpIHwgT3RoZXJPcHRpb25zLFxuICApOiBQYXJ0aWFsPFJlY29yZDxFdmVudEN1c3RvbURpbWVuc2lvbiB8IEV2ZW50Q3VzdG9tTWV0cmljLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyPj4ge1xuICAgIGNvbnN0IHBhcmFtZXRlcnM6IFBhcnRpYWw8XG4gICAgICBSZWNvcmQ8RXZlbnRDdXN0b21EaW1lbnNpb24gfCBFdmVudEN1c3RvbU1ldHJpYywgc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlcj5cbiAgICA+ID0ge307XG5cbiAgICBjb25zdCB2YWxpZEV2ZW50Q3VzdG9tRGltZW5zaW9uQW5kTWV0cmljcyA9IG5ldyBTZXQoW1xuICAgICAgLi4uT2JqZWN0LnZhbHVlcyhFdmVudEN1c3RvbURpbWVuc2lvbiksXG4gICAgICAuLi5PYmplY3QudmFsdWVzKEV2ZW50Q3VzdG9tTWV0cmljKSxcbiAgICBdKTtcblxuICAgIGZvciAoY29uc3QgW25hbWUsIHVhXSBvZiB0aGlzLm9wdGlvbnNXaXRoQW5hbHl0aWNzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICBpZiAoXG4gICAgICAgICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpICYmXG4gICAgICAgIHZhbGlkRXZlbnRDdXN0b21EaW1lbnNpb25BbmRNZXRyaWNzLmhhcyh1YSBhcyBFdmVudEN1c3RvbURpbWVuc2lvbiB8IEV2ZW50Q3VzdG9tTWV0cmljKVxuICAgICAgKSB7XG4gICAgICAgIHBhcmFtZXRlcnNbdWEgYXMgRXZlbnRDdXN0b21EaW1lbnNpb24gfCBFdmVudEN1c3RvbU1ldHJpY10gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFyYW1ldGVycztcbiAgfVxuXG4gIHByaXZhdGUgcmVwb3J0Q29tbWFuZFJ1bkFuYWx5dGljcyhhbmFseXRpY3M6IEFuYWx5dGljc0NvbGxlY3Rvcik6IHZvaWQge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgaW50ZXJuYWxNZXRob2RzID0gKHlhcmdzIGFzIGFueSkuZ2V0SW50ZXJuYWxNZXRob2RzKCk7XG4gICAgLy8gJDAgZ2VuZXJhdGUgY29tcG9uZW50IFtuYW1lXSAtPiBnZW5lcmF0ZV9jb21wb25lbnRcbiAgICAvLyAkMCBhZGQgPGNvbGxlY3Rpb24+IC0+IGFkZFxuICAgIGNvbnN0IGZ1bGxDb21tYW5kID0gKGludGVybmFsTWV0aG9kcy5nZXRVc2FnZUluc3RhbmNlKCkuZ2V0VXNhZ2UoKVswXVswXSBhcyBzdHJpbmcpXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLmZpbHRlcigoeCkgPT4ge1xuICAgICAgICBjb25zdCBjb2RlID0geC5jaGFyQ29kZUF0KDApO1xuXG4gICAgICAgIHJldHVybiBjb2RlID49IDk3ICYmIGNvZGUgPD0gMTIyO1xuICAgICAgfSlcbiAgICAgIC5qb2luKCdfJyk7XG5cbiAgICBhbmFseXRpY3MucmVwb3J0Q29tbWFuZFJ1bkV2ZW50KGZ1bGxDb21tYW5kKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVwb3J0V29ya3NwYWNlSW5mb0FuYWx5dGljcyhhbmFseXRpY3M6IEFuYWx5dGljc0NvbGxlY3Rvcik6IHZvaWQge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgaWYgKCF3b3Jrc3BhY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgYXBwbGljYXRpb25Qcm9qZWN0c0NvdW50ID0gMDtcbiAgICBsZXQgbGlicmFyaWVzUHJvamVjdHNDb3VudCA9IDA7XG4gICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHdvcmtzcGFjZS5wcm9qZWN0cy52YWx1ZXMoKSkge1xuICAgICAgc3dpdGNoIChwcm9qZWN0LmV4dGVuc2lvbnNbJ3Byb2plY3RUeXBlJ10pIHtcbiAgICAgICAgY2FzZSAnYXBwbGljYXRpb24nOlxuICAgICAgICAgIGFwcGxpY2F0aW9uUHJvamVjdHNDb3VudCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsaWJyYXJ5JzpcbiAgICAgICAgICBsaWJyYXJpZXNQcm9qZWN0c0NvdW50Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYW5hbHl0aWNzLnJlcG9ydFdvcmtzcGFjZUluZm9FdmVudCh7XG4gICAgICBbRXZlbnRDdXN0b21NZXRyaWMuQWxsUHJvamVjdHNDb3VudF06IGxpYnJhcmllc1Byb2plY3RzQ291bnQgKyBhcHBsaWNhdGlvblByb2plY3RzQ291bnQsXG4gICAgICBbRXZlbnRDdXN0b21NZXRyaWMuQXBwbGljYXRpb25Qcm9qZWN0c0NvdW50XTogYXBwbGljYXRpb25Qcm9qZWN0c0NvdW50LFxuICAgICAgW0V2ZW50Q3VzdG9tTWV0cmljLkxpYnJhcnlQcm9qZWN0c0NvdW50XTogbGlicmFyaWVzUHJvamVjdHNDb3VudCxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4ga25vd24gY29tbWFuZCBtb2R1bGUgZXJyb3IuXG4gKiBUaGlzIGlzIHVzZWQgc28gZHVyaW5nIGV4ZWN1dGF0aW9uIHdlIGNhbiBmaWx0ZXIgYmV0d2VlbiBrbm93biB2YWxpZGF0aW9uIGVycm9yIGFuZCByZWFsIG5vbiBoYW5kbGVkIGVycm9ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbW1hbmRNb2R1bGVFcnJvciBleHRlbmRzIEVycm9yIHt9XG4iXX0=