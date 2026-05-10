"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const command_module_1 = require("../../command-builder/command-module");
const command_1 = require("../../command-builder/utilities/command");
const color_1 = require("../../utilities/color");
const completion_1 = require("../../utilities/completion");
const error_1 = require("../../utilities/error");
class CompletionCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'completion';
        this.describe = 'Set up Angular CLI autocompletion for your terminal.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
    builder(localYargs) {
        return (0, command_1.addCommandModuleToYargs)(localYargs, CompletionScriptCommandModule, this.context);
    }
    async run() {
        let rcFile;
        try {
            rcFile = await (0, completion_1.initializeAutocomplete)();
        }
        catch (err) {
            (0, error_1.assertIsError)(err);
            this.context.logger.error(err.message);
            return 1;
        }
        this.context.logger.info(`
Appended \`source <(ng completion script)\` to \`${rcFile}\`. Restart your terminal or run the following to autocomplete \`ng\` commands:

    ${color_1.colors.yellow('source <(ng completion script)')}
      `.trim());
        if ((await (0, completion_1.hasGlobalCliInstall)()) === false) {
            this.context.logger.warn('Setup completed successfully, but there does not seem to be a global install of the' +
                ' Angular CLI. For autocompletion to work, the CLI will need to be on your `$PATH`, which' +
                ' is typically done with the `-g` flag in `npm install -g @angular/cli`.' +
                '\n\n' +
                'For more information, see https://angular.io/cli/completion#global-install');
        }
        return 0;
    }
}
exports.default = CompletionCommandModule;
class CompletionScriptCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'script';
        this.describe = 'Generate a bash and zsh real-time type-ahead autocompletion script.';
        this.longDescriptionPath = undefined;
    }
    builder(localYargs) {
        return localYargs;
    }
    run() {
        yargs_1.default.showCompletionScript();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NvbXBsZXRpb24vY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsK0JBQTRCO0FBQzVCLGtEQUFvQztBQUNwQyx5RUFBa0c7QUFDbEcscUVBQWtGO0FBQ2xGLGlEQUErQztBQUMvQywyREFBeUY7QUFDekYsaURBQXNEO0FBRXRELE1BQXFCLHVCQUNuQixTQUFRLDhCQUFhO0lBRHZCOztRQUlFLFlBQU8sR0FBRyxZQUFZLENBQUM7UUFDdkIsYUFBUSxHQUFHLHNEQUFzRCxDQUFDO1FBQ2xFLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBcUMvRCxDQUFDO0lBbkNDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLElBQUEsaUNBQXVCLEVBQUMsVUFBVSxFQUFFLDZCQUE2QixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUc7UUFDUCxJQUFJLE1BQWMsQ0FBQztRQUNuQixJQUFJO1lBQ0YsTUFBTSxHQUFHLE1BQU0sSUFBQSxtQ0FBc0IsR0FBRSxDQUFDO1NBQ3pDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFBLHFCQUFhLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV2QyxPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUN0QjttREFDNkMsTUFBTTs7TUFFbkQsY0FBTSxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQztPQUM5QyxDQUFDLElBQUksRUFBRSxDQUNULENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxJQUFBLGdDQUFtQixHQUFFLENBQUMsS0FBSyxLQUFLLEVBQUU7WUFDM0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUN0QixxRkFBcUY7Z0JBQ25GLDBGQUEwRjtnQkFDMUYseUVBQXlFO2dCQUN6RSxNQUFNO2dCQUNOLDRFQUE0RSxDQUMvRSxDQUFDO1NBQ0g7UUFFRCxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7Q0FDRjtBQTNDRCwwQ0EyQ0M7QUFFRCxNQUFNLDZCQUE4QixTQUFRLDhCQUFhO0lBQXpEOztRQUNFLFlBQU8sR0FBRyxRQUFRLENBQUM7UUFDbkIsYUFBUSxHQUFHLHFFQUFxRSxDQUFDO1FBQ2pGLHdCQUFtQixHQUFHLFNBQVMsQ0FBQztJQVNsQyxDQUFDO0lBUEMsT0FBTyxDQUFDLFVBQWdCO1FBQ3RCLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxHQUFHO1FBQ0QsZUFBSyxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDL0IsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB5YXJncywgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgQ29tbWFuZE1vZHVsZSwgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IGFkZENvbW1hbmRNb2R1bGVUb1lhcmdzIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL3V0aWxpdGllcy9jb21tYW5kJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb2xvcic7XG5pbXBvcnQgeyBoYXNHbG9iYWxDbGlJbnN0YWxsLCBpbml0aWFsaXplQXV0b2NvbXBsZXRlIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2NvbXBsZXRpb24nO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9lcnJvcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBsZXRpb25Db21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgQ29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvblxue1xuICBjb21tYW5kID0gJ2NvbXBsZXRpb24nO1xuICBkZXNjcmliZSA9ICdTZXQgdXAgQW5ndWxhciBDTEkgYXV0b2NvbXBsZXRpb24gZm9yIHlvdXIgdGVybWluYWwuJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aCA9IGpvaW4oX19kaXJuYW1lLCAnbG9uZy1kZXNjcmlwdGlvbi5tZCcpO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Yge1xuICAgIHJldHVybiBhZGRDb21tYW5kTW9kdWxlVG9ZYXJncyhsb2NhbFlhcmdzLCBDb21wbGV0aW9uU2NyaXB0Q29tbWFuZE1vZHVsZSwgdGhpcy5jb250ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIHJ1bigpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByY0ZpbGU6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgcmNGaWxlID0gYXdhaXQgaW5pdGlhbGl6ZUF1dG9jb21wbGV0ZSgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXNzZXJ0SXNFcnJvcihlcnIpO1xuICAgICAgdGhpcy5jb250ZXh0LmxvZ2dlci5lcnJvcihlcnIubWVzc2FnZSk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIHRoaXMuY29udGV4dC5sb2dnZXIuaW5mbyhcbiAgICAgIGBcbkFwcGVuZGVkIFxcYHNvdXJjZSA8KG5nIGNvbXBsZXRpb24gc2NyaXB0KVxcYCB0byBcXGAke3JjRmlsZX1cXGAuIFJlc3RhcnQgeW91ciB0ZXJtaW5hbCBvciBydW4gdGhlIGZvbGxvd2luZyB0byBhdXRvY29tcGxldGUgXFxgbmdcXGAgY29tbWFuZHM6XG5cbiAgICAke2NvbG9ycy55ZWxsb3coJ3NvdXJjZSA8KG5nIGNvbXBsZXRpb24gc2NyaXB0KScpfVxuICAgICAgYC50cmltKCksXG4gICAgKTtcblxuICAgIGlmICgoYXdhaXQgaGFzR2xvYmFsQ2xpSW5zdGFsbCgpKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIud2FybihcbiAgICAgICAgJ1NldHVwIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHksIGJ1dCB0aGVyZSBkb2VzIG5vdCBzZWVtIHRvIGJlIGEgZ2xvYmFsIGluc3RhbGwgb2YgdGhlJyArXG4gICAgICAgICAgJyBBbmd1bGFyIENMSS4gRm9yIGF1dG9jb21wbGV0aW9uIHRvIHdvcmssIHRoZSBDTEkgd2lsbCBuZWVkIHRvIGJlIG9uIHlvdXIgYCRQQVRIYCwgd2hpY2gnICtcbiAgICAgICAgICAnIGlzIHR5cGljYWxseSBkb25lIHdpdGggdGhlIGAtZ2AgZmxhZyBpbiBgbnBtIGluc3RhbGwgLWcgQGFuZ3VsYXIvY2xpYC4nICtcbiAgICAgICAgICAnXFxuXFxuJyArXG4gICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2NsaS9jb21wbGV0aW9uI2dsb2JhbC1pbnN0YWxsJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuY2xhc3MgQ29tcGxldGlvblNjcmlwdENvbW1hbmRNb2R1bGUgZXh0ZW5kcyBDb21tYW5kTW9kdWxlIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uIHtcbiAgY29tbWFuZCA9ICdzY3JpcHQnO1xuICBkZXNjcmliZSA9ICdHZW5lcmF0ZSBhIGJhc2ggYW5kIHpzaCByZWFsLXRpbWUgdHlwZS1haGVhZCBhdXRvY29tcGxldGlvbiBzY3JpcHQuJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aCA9IHVuZGVmaW5lZDtcblxuICBidWlsZGVyKGxvY2FsWWFyZ3M6IEFyZ3YpOiBBcmd2IHtcbiAgICByZXR1cm4gbG9jYWxZYXJncztcbiAgfVxuXG4gIHJ1bigpOiB2b2lkIHtcbiAgICB5YXJncy5zaG93Q29tcGxldGlvblNjcmlwdCgpO1xuICB9XG59XG4iXX0=