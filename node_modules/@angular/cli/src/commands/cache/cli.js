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
const command_module_1 = require("../../command-builder/command-module");
const command_1 = require("../../command-builder/utilities/command");
const cli_1 = require("./clean/cli");
const cli_2 = require("./info/cli");
const cli_3 = require("./settings/cli");
class CacheCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'cache';
        this.describe = 'Configure persistent disk cache and retrieve cache statistics.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
        this.scope = command_module_1.CommandScope.In;
    }
    builder(localYargs) {
        const subcommands = [
            cli_3.CacheEnableModule,
            cli_3.CacheDisableModule,
            cli_1.CacheCleanModule,
            cli_2.CacheInfoCommandModule,
        ].sort();
        for (const module of subcommands) {
            localYargs = (0, command_1.addCommandModuleToYargs)(localYargs, module, this.context);
        }
        return localYargs.demandCommand(1, command_1.demandCommandFailureMessage).strict();
    }
    run(_options) { }
}
exports.default = CacheCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NhY2hlL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE0QjtBQUU1Qix5RUFLOEM7QUFDOUMscUVBR2lEO0FBQ2pELHFDQUErQztBQUMvQyxvQ0FBb0Q7QUFDcEQsd0NBQXVFO0FBRXZFLE1BQXFCLGtCQUNuQixTQUFRLDhCQUFhO0lBRHZCOztRQUlFLFlBQU8sR0FBRyxPQUFPLENBQUM7UUFDbEIsYUFBUSxHQUFHLGdFQUFnRSxDQUFDO1FBQzVFLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3BELFVBQUssR0FBRyw2QkFBWSxDQUFDLEVBQUUsQ0FBQztJQWtCbkMsQ0FBQztJQWhCQyxPQUFPLENBQUMsVUFBZ0I7UUFDdEIsTUFBTSxXQUFXLEdBQUc7WUFDbEIsdUJBQWlCO1lBQ2pCLHdCQUFrQjtZQUNsQixzQkFBZ0I7WUFDaEIsNEJBQXNCO1NBQ3ZCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFVCxLQUFLLE1BQU0sTUFBTSxJQUFJLFdBQVcsRUFBRTtZQUNoQyxVQUFVLEdBQUcsSUFBQSxpQ0FBdUIsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN4RTtRQUVELE9BQU8sVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUscUNBQTJCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMzRSxDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQXFCLElBQVMsQ0FBQztDQUNwQztBQXpCRCxxQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQXJndiB9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGUsXG4gIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbixcbiAgQ29tbWFuZFNjb3BlLFxuICBPcHRpb25zLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHtcbiAgYWRkQ29tbWFuZE1vZHVsZVRvWWFyZ3MsXG4gIGRlbWFuZENvbW1hbmRGYWlsdXJlTWVzc2FnZSxcbn0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL3V0aWxpdGllcy9jb21tYW5kJztcbmltcG9ydCB7IENhY2hlQ2xlYW5Nb2R1bGUgfSBmcm9tICcuL2NsZWFuL2NsaSc7XG5pbXBvcnQgeyBDYWNoZUluZm9Db21tYW5kTW9kdWxlIH0gZnJvbSAnLi9pbmZvL2NsaSc7XG5pbXBvcnQgeyBDYWNoZURpc2FibGVNb2R1bGUsIENhY2hlRW5hYmxlTW9kdWxlIH0gZnJvbSAnLi9zZXR0aW5ncy9jbGknO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYWNoZUNvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBDb21tYW5kTW9kdWxlXG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uXG57XG4gIGNvbW1hbmQgPSAnY2FjaGUnO1xuICBkZXNjcmliZSA9ICdDb25maWd1cmUgcGVyc2lzdGVudCBkaXNrIGNhY2hlIGFuZCByZXRyaWV2ZSBjYWNoZSBzdGF0aXN0aWNzLic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGggPSBqb2luKF9fZGlybmFtZSwgJ2xvbmctZGVzY3JpcHRpb24ubWQnKTtcbiAgb3ZlcnJpZGUgc2NvcGUgPSBDb21tYW5kU2NvcGUuSW47XG5cbiAgYnVpbGRlcihsb2NhbFlhcmdzOiBBcmd2KTogQXJndiB7XG4gICAgY29uc3Qgc3ViY29tbWFuZHMgPSBbXG4gICAgICBDYWNoZUVuYWJsZU1vZHVsZSxcbiAgICAgIENhY2hlRGlzYWJsZU1vZHVsZSxcbiAgICAgIENhY2hlQ2xlYW5Nb2R1bGUsXG4gICAgICBDYWNoZUluZm9Db21tYW5kTW9kdWxlLFxuICAgIF0uc29ydCgpO1xuXG4gICAgZm9yIChjb25zdCBtb2R1bGUgb2Ygc3ViY29tbWFuZHMpIHtcbiAgICAgIGxvY2FsWWFyZ3MgPSBhZGRDb21tYW5kTW9kdWxlVG9ZYXJncyhsb2NhbFlhcmdzLCBtb2R1bGUsIHRoaXMuY29udGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsWWFyZ3MuZGVtYW5kQ29tbWFuZCgxLCBkZW1hbmRDb21tYW5kRmFpbHVyZU1lc3NhZ2UpLnN0cmljdCgpO1xuICB9XG5cbiAgcnVuKF9vcHRpb25zOiBPcHRpb25zPHt9Pik6IHZvaWQge31cbn1cbiJdfQ==