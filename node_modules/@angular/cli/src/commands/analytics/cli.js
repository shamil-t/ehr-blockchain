"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const command_module_1 = require("../../command-builder/command-module");
const command_1 = require("../../command-builder/utilities/command");
const cli_1 = require("./info/cli");
const cli_2 = require("./settings/cli");
class AnalyticsCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'analytics';
        this.describe = 'Configures the gathering of Angular CLI usage metrics.';
        this.longDescriptionPath = (0, node_path_1.join)(__dirname, 'long-description.md');
    }
    builder(localYargs) {
        const subcommands = [
            cli_1.AnalyticsInfoCommandModule,
            cli_2.AnalyticsDisableModule,
            cli_2.AnalyticsEnableModule,
            cli_2.AnalyticsPromptModule,
        ].sort(); // sort by class name.
        for (const module of subcommands) {
            localYargs = (0, command_1.addCommandModuleToYargs)(localYargs, module, this.context);
        }
        return localYargs.demandCommand(1, command_1.demandCommandFailureMessage).strict();
    }
    run(_options) { }
}
exports.default = AnalyticsCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2FuYWx5dGljcy9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCx5Q0FBaUM7QUFFakMseUVBSThDO0FBQzlDLHFFQUdpRDtBQUNqRCxvQ0FBd0Q7QUFDeEQsd0NBSXdCO0FBRXhCLE1BQXFCLHNCQUNuQixTQUFRLDhCQUFhO0lBRHZCOztRQUlFLFlBQU8sR0FBRyxXQUFXLENBQUM7UUFDdEIsYUFBUSxHQUFHLHdEQUF3RCxDQUFDO1FBQ3BFLHdCQUFtQixHQUFHLElBQUEsZ0JBQUksRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQWtCL0QsQ0FBQztJQWhCQyxPQUFPLENBQUMsVUFBZ0I7UUFDdEIsTUFBTSxXQUFXLEdBQUc7WUFDbEIsZ0NBQTBCO1lBQzFCLDRCQUFzQjtZQUN0QiwyQkFBcUI7WUFDckIsMkJBQXFCO1NBQ3RCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxzQkFBc0I7UUFFaEMsS0FBSyxNQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7WUFDaEMsVUFBVSxHQUFHLElBQUEsaUNBQXVCLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDeEU7UUFFRCxPQUFPLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLHFDQUEyQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDM0UsQ0FBQztJQUVELEdBQUcsQ0FBQyxRQUFxQixJQUFTLENBQUM7Q0FDcEM7QUF4QkQseUNBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgQXJndiB9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGUsXG4gIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbixcbiAgT3B0aW9ucyxcbn0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7XG4gIGFkZENvbW1hbmRNb2R1bGVUb1lhcmdzLFxuICBkZW1hbmRDb21tYW5kRmFpbHVyZU1lc3NhZ2UsXG59IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvY29tbWFuZCc7XG5pbXBvcnQgeyBBbmFseXRpY3NJbmZvQ29tbWFuZE1vZHVsZSB9IGZyb20gJy4vaW5mby9jbGknO1xuaW1wb3J0IHtcbiAgQW5hbHl0aWNzRGlzYWJsZU1vZHVsZSxcbiAgQW5hbHl0aWNzRW5hYmxlTW9kdWxlLFxuICBBbmFseXRpY3NQcm9tcHRNb2R1bGUsXG59IGZyb20gJy4vc2V0dGluZ3MvY2xpJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQW5hbHl0aWNzQ29tbWFuZE1vZHVsZVxuICBleHRlbmRzIENvbW1hbmRNb2R1bGVcbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb25cbntcbiAgY29tbWFuZCA9ICdhbmFseXRpY3MnO1xuICBkZXNjcmliZSA9ICdDb25maWd1cmVzIHRoZSBnYXRoZXJpbmcgb2YgQW5ndWxhciBDTEkgdXNhZ2UgbWV0cmljcy4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoID0gam9pbihfX2Rpcm5hbWUsICdsb25nLWRlc2NyaXB0aW9uLm1kJyk7XG5cbiAgYnVpbGRlcihsb2NhbFlhcmdzOiBBcmd2KTogQXJndiB7XG4gICAgY29uc3Qgc3ViY29tbWFuZHMgPSBbXG4gICAgICBBbmFseXRpY3NJbmZvQ29tbWFuZE1vZHVsZSxcbiAgICAgIEFuYWx5dGljc0Rpc2FibGVNb2R1bGUsXG4gICAgICBBbmFseXRpY3NFbmFibGVNb2R1bGUsXG4gICAgICBBbmFseXRpY3NQcm9tcHRNb2R1bGUsXG4gICAgXS5zb3J0KCk7IC8vIHNvcnQgYnkgY2xhc3MgbmFtZS5cblxuICAgIGZvciAoY29uc3QgbW9kdWxlIG9mIHN1YmNvbW1hbmRzKSB7XG4gICAgICBsb2NhbFlhcmdzID0gYWRkQ29tbWFuZE1vZHVsZVRvWWFyZ3MobG9jYWxZYXJncywgbW9kdWxlLCB0aGlzLmNvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbFlhcmdzLmRlbWFuZENvbW1hbmQoMSwgZGVtYW5kQ29tbWFuZEZhaWx1cmVNZXNzYWdlKS5zdHJpY3QoKTtcbiAgfVxuXG4gIHJ1bihfb3B0aW9uczogT3B0aW9uczx7fT4pOiB2b2lkIHt9XG59XG4iXX0=