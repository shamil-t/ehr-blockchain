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
class BuildCommandModule extends architect_command_module_1.ArchitectCommandModule {
    constructor() {
        super(...arguments);
        this.multiTarget = false;
        this.command = 'build [project]';
        this.aliases = command_config_1.RootCommands['build'].aliases;
        this.describe = 'Compiles an Angular application or library into an output directory named dist/ at the given output path.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
}
exports.default = BuildCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2J1aWxkL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtCQUE0QjtBQUM1Qiw2RkFBd0Y7QUFFeEYsc0RBQWlEO0FBRWpELE1BQXFCLGtCQUNuQixTQUFRLGlEQUFzQjtJQURoQzs7UUFJRSxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixZQUFPLEdBQUcsaUJBQWlCLENBQUM7UUFDNUIsWUFBTyxHQUFHLDZCQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3hDLGFBQVEsR0FDTiwyR0FBMkcsQ0FBQztRQUM5Ryx3QkFBbUIsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0NBQUE7QUFWRCxxQ0FVQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBBcmNoaXRlY3RDb21tYW5kTW9kdWxlIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2FyY2hpdGVjdC1jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24gfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHsgUm9vdENvbW1hbmRzIH0gZnJvbSAnLi4vY29tbWFuZC1jb25maWcnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWlsZENvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBBcmNoaXRlY3RDb21tYW5kTW9kdWxlXG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uXG57XG4gIG11bHRpVGFyZ2V0ID0gZmFsc2U7XG4gIGNvbW1hbmQgPSAnYnVpbGQgW3Byb2plY3RdJztcbiAgYWxpYXNlcyA9IFJvb3RDb21tYW5kc1snYnVpbGQnXS5hbGlhc2VzO1xuICBkZXNjcmliZSA9XG4gICAgJ0NvbXBpbGVzIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gb3IgbGlicmFyeSBpbnRvIGFuIG91dHB1dCBkaXJlY3RvcnkgbmFtZWQgZGlzdC8gYXQgdGhlIGdpdmVuIG91dHB1dCBwYXRoLic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGggPSBqb2luKF9fZGlybmFtZSwgJ2xvbmctZGVzY3JpcHRpb24ubWQnKTtcbn1cbiJdfQ==