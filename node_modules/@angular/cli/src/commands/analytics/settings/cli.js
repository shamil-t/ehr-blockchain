"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsPromptModule = exports.AnalyticsEnableModule = exports.AnalyticsDisableModule = void 0;
const analytics_1 = require("../../../analytics/analytics");
const command_module_1 = require("../../../command-builder/command-module");
class AnalyticsSettingModule extends command_module_1.CommandModule {
    builder(localYargs) {
        return localYargs
            .option('global', {
            description: `Configure analytics gathering and reporting globally in the caller's home directory.`,
            alias: ['g'],
            type: 'boolean',
            default: false,
        })
            .strict();
    }
}
class AnalyticsDisableModule extends AnalyticsSettingModule {
    constructor() {
        super(...arguments);
        this.command = 'disable';
        this.aliases = 'off';
        this.describe = 'Disables analytics gathering and reporting for the user.';
    }
    async run({ global }) {
        await (0, analytics_1.setAnalyticsConfig)(global, false);
        process.stderr.write(await (0, analytics_1.getAnalyticsInfoString)(this.context));
    }
}
exports.AnalyticsDisableModule = AnalyticsDisableModule;
class AnalyticsEnableModule extends AnalyticsSettingModule {
    constructor() {
        super(...arguments);
        this.command = 'enable';
        this.aliases = 'on';
        this.describe = 'Enables analytics gathering and reporting for the user.';
    }
    async run({ global }) {
        await (0, analytics_1.setAnalyticsConfig)(global, true);
        process.stderr.write(await (0, analytics_1.getAnalyticsInfoString)(this.context));
    }
}
exports.AnalyticsEnableModule = AnalyticsEnableModule;
class AnalyticsPromptModule extends AnalyticsSettingModule {
    constructor() {
        super(...arguments);
        this.command = 'prompt';
        this.describe = 'Prompts the user to set the analytics gathering status interactively.';
    }
    async run({ global }) {
        await (0, analytics_1.promptAnalytics)(this.context, global, true);
    }
}
exports.AnalyticsPromptModule = AnalyticsPromptModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2FuYWx5dGljcy9zZXR0aW5ncy9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsNERBSXNDO0FBQ3RDLDRFQUlpRDtBQU1qRCxNQUFlLHNCQUNiLFNBQVEsOEJBQW1DO0lBSzNDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVU7YUFDZCxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ2hCLFdBQVcsRUFBRSxzRkFBc0Y7WUFDbkcsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ1osSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPLEVBQUUsS0FBSztTQUNmLENBQUM7YUFDRCxNQUFNLEVBQUUsQ0FBQztJQUNkLENBQUM7Q0FHRjtBQUVELE1BQWEsc0JBQ1gsU0FBUSxzQkFBc0I7SUFEaEM7O1FBSUUsWUFBTyxHQUFHLFNBQVMsQ0FBQztRQUNwQixZQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLGFBQVEsR0FBRywwREFBMEQsQ0FBQztJQU14RSxDQUFDO0lBSkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBaUM7UUFDakQsTUFBTSxJQUFBLDhCQUFrQixFQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUEsa0NBQXNCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBWkQsd0RBWUM7QUFFRCxNQUFhLHFCQUNYLFNBQVEsc0JBQXNCO0lBRGhDOztRQUlFLFlBQU8sR0FBRyxRQUFRLENBQUM7UUFDbkIsWUFBTyxHQUFHLElBQUksQ0FBQztRQUNmLGFBQVEsR0FBRyx5REFBeUQsQ0FBQztJQUt2RSxDQUFDO0lBSkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBaUM7UUFDakQsTUFBTSxJQUFBLDhCQUFrQixFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUEsa0NBQXNCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBWEQsc0RBV0M7QUFFRCxNQUFhLHFCQUNYLFNBQVEsc0JBQXNCO0lBRGhDOztRQUlFLFlBQU8sR0FBRyxRQUFRLENBQUM7UUFDbkIsYUFBUSxHQUFHLHVFQUF1RSxDQUFDO0lBS3JGLENBQUM7SUFIQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFpQztRQUNqRCxNQUFNLElBQUEsMkJBQWUsRUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFWRCxzREFVQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHtcbiAgZ2V0QW5hbHl0aWNzSW5mb1N0cmluZyxcbiAgcHJvbXB0QW5hbHl0aWNzLFxuICBzZXRBbmFseXRpY3NDb25maWcsXG59IGZyb20gJy4uLy4uLy4uL2FuYWx5dGljcy9hbmFseXRpY3MnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZSxcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBPcHRpb25zLFxufSBmcm9tICcuLi8uLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuXG5pbnRlcmZhY2UgQW5hbHl0aWNzQ29tbWFuZEFyZ3Mge1xuICBnbG9iYWw6IGJvb2xlYW47XG59XG5cbmFic3RyYWN0IGNsYXNzIEFuYWx5dGljc1NldHRpbmdNb2R1bGVcbiAgZXh0ZW5kcyBDb21tYW5kTW9kdWxlPEFuYWx5dGljc0NvbW1hbmRBcmdzPlxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbjxBbmFseXRpY3NDb21tYW5kQXJncz5cbntcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aD86IHN0cmluZztcblxuICBidWlsZGVyKGxvY2FsWWFyZ3M6IEFyZ3YpOiBBcmd2PEFuYWx5dGljc0NvbW1hbmRBcmdzPiB7XG4gICAgcmV0dXJuIGxvY2FsWWFyZ3NcbiAgICAgIC5vcHRpb24oJ2dsb2JhbCcsIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBDb25maWd1cmUgYW5hbHl0aWNzIGdhdGhlcmluZyBhbmQgcmVwb3J0aW5nIGdsb2JhbGx5IGluIHRoZSBjYWxsZXIncyBob21lIGRpcmVjdG9yeS5gLFxuICAgICAgICBhbGlhczogWydnJ10sXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9KVxuICAgICAgLnN0cmljdCgpO1xuICB9XG5cbiAgYWJzdHJhY3Qgb3ZlcnJpZGUgcnVuKHsgZ2xvYmFsIH06IE9wdGlvbnM8QW5hbHl0aWNzQ29tbWFuZEFyZ3M+KTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFuYWx5dGljc0Rpc2FibGVNb2R1bGVcbiAgZXh0ZW5kcyBBbmFseXRpY3NTZXR0aW5nTW9kdWxlXG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uPEFuYWx5dGljc0NvbW1hbmRBcmdzPlxue1xuICBjb21tYW5kID0gJ2Rpc2FibGUnO1xuICBhbGlhc2VzID0gJ29mZic7XG4gIGRlc2NyaWJlID0gJ0Rpc2FibGVzIGFuYWx5dGljcyBnYXRoZXJpbmcgYW5kIHJlcG9ydGluZyBmb3IgdGhlIHVzZXIuJztcblxuICBhc3luYyBydW4oeyBnbG9iYWwgfTogT3B0aW9uczxBbmFseXRpY3NDb21tYW5kQXJncz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzZXRBbmFseXRpY3NDb25maWcoZ2xvYmFsLCBmYWxzZSk7XG4gICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUoYXdhaXQgZ2V0QW5hbHl0aWNzSW5mb1N0cmluZyh0aGlzLmNvbnRleHQpKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQW5hbHl0aWNzRW5hYmxlTW9kdWxlXG4gIGV4dGVuZHMgQW5hbHl0aWNzU2V0dGluZ01vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbjxBbmFseXRpY3NDb21tYW5kQXJncz5cbntcbiAgY29tbWFuZCA9ICdlbmFibGUnO1xuICBhbGlhc2VzID0gJ29uJztcbiAgZGVzY3JpYmUgPSAnRW5hYmxlcyBhbmFseXRpY3MgZ2F0aGVyaW5nIGFuZCByZXBvcnRpbmcgZm9yIHRoZSB1c2VyLic7XG4gIGFzeW5jIHJ1bih7IGdsb2JhbCB9OiBPcHRpb25zPEFuYWx5dGljc0NvbW1hbmRBcmdzPik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHNldEFuYWx5dGljc0NvbmZpZyhnbG9iYWwsIHRydWUpO1xuICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKGF3YWl0IGdldEFuYWx5dGljc0luZm9TdHJpbmcodGhpcy5jb250ZXh0KSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFuYWx5dGljc1Byb21wdE1vZHVsZVxuICBleHRlbmRzIEFuYWx5dGljc1NldHRpbmdNb2R1bGVcbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb248QW5hbHl0aWNzQ29tbWFuZEFyZ3M+XG57XG4gIGNvbW1hbmQgPSAncHJvbXB0JztcbiAgZGVzY3JpYmUgPSAnUHJvbXB0cyB0aGUgdXNlciB0byBzZXQgdGhlIGFuYWx5dGljcyBnYXRoZXJpbmcgc3RhdHVzIGludGVyYWN0aXZlbHkuJztcblxuICBhc3luYyBydW4oeyBnbG9iYWwgfTogT3B0aW9uczxBbmFseXRpY3NDb21tYW5kQXJncz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBwcm9tcHRBbmFseXRpY3ModGhpcy5jb250ZXh0LCBnbG9iYWwsIHRydWUpO1xuICB9XG59XG4iXX0=