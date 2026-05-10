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
const architect_command_module_1 = require("../../command-builder/architect-command-module");
const command_config_1 = require("../command-config");
class TestCommandModule extends architect_command_module_1.ArchitectCommandModule {
    constructor() {
        super(...arguments);
        this.multiTarget = true;
        this.command = 'test [project]';
        this.aliases = command_config_1.RootCommands['test'].aliases;
        this.describe = 'Runs unit tests in a project.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
}
exports.default = TestCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL3Rlc3QvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTRCO0FBQzVCLDZGQUF3RjtBQUV4RixzREFBaUQ7QUFFakQsTUFBcUIsaUJBQ25CLFNBQVEsaURBQXNCO0lBRGhDOztRQUlFLGdCQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ25CLFlBQU8sR0FBRyxnQkFBZ0IsQ0FBQztRQUMzQixZQUFPLEdBQUcsNkJBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDdkMsYUFBUSxHQUFHLCtCQUErQixDQUFDO1FBQzNDLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FBQTtBQVRELG9DQVNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFyY2hpdGVjdENvbW1hbmRNb2R1bGUgfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvYXJjaGl0ZWN0LWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBSb290Q29tbWFuZHMgfSBmcm9tICcuLi9jb21tYW5kLWNvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlc3RDb21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgQXJjaGl0ZWN0Q29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvblxue1xuICBtdWx0aVRhcmdldCA9IHRydWU7XG4gIGNvbW1hbmQgPSAndGVzdCBbcHJvamVjdF0nO1xuICBhbGlhc2VzID0gUm9vdENvbW1hbmRzWyd0ZXN0J10uYWxpYXNlcztcbiAgZGVzY3JpYmUgPSAnUnVucyB1bml0IHRlc3RzIGluIGEgcHJvamVjdC4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoID0gam9pbihfX2Rpcm5hbWUsICdsb25nLWRlc2NyaXB0aW9uLm1kJyk7XG59XG4iXX0=