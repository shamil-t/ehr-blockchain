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
class LintCommandModule extends architect_command_module_1.ArchitectCommandModule {
    constructor() {
        super(...arguments);
        this.missingTargetChoices = [
            {
                name: 'ESLint',
                value: '@angular-eslint/schematics',
            },
        ];
        this.multiTarget = true;
        this.command = 'lint [project]';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
        this.describe = 'Runs linting tools on Angular application code in a given project folder.';
    }
}
exports.default = LintCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2xpbnQvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsK0JBQTRCO0FBRTVCLDZGQUF3RjtBQUd4RixNQUFxQixpQkFDbkIsU0FBUSxpREFBc0I7SUFEaEM7O1FBSVcseUJBQW9CLEdBQTBCO1lBQ3JEO2dCQUNFLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSw0QkFBNEI7YUFDcEM7U0FDRixDQUFDO1FBRUYsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFDbkIsWUFBTyxHQUFHLGdCQUFnQixDQUFDO1FBQzNCLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQzdELGFBQVEsR0FBRywyRUFBMkUsQ0FBQztJQUN6RixDQUFDO0NBQUE7QUFmRCxvQ0FlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBNaXNzaW5nVGFyZ2V0Q2hvaWNlIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2FyY2hpdGVjdC1iYXNlLWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IEFyY2hpdGVjdENvbW1hbmRNb2R1bGUgfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvYXJjaGl0ZWN0LWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbnRDb21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgQXJjaGl0ZWN0Q29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvblxue1xuICBvdmVycmlkZSBtaXNzaW5nVGFyZ2V0Q2hvaWNlczogTWlzc2luZ1RhcmdldENob2ljZVtdID0gW1xuICAgIHtcbiAgICAgIG5hbWU6ICdFU0xpbnQnLFxuICAgICAgdmFsdWU6ICdAYW5ndWxhci1lc2xpbnQvc2NoZW1hdGljcycsXG4gICAgfSxcbiAgXTtcblxuICBtdWx0aVRhcmdldCA9IHRydWU7XG4gIGNvbW1hbmQgPSAnbGludCBbcHJvamVjdF0nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoID0gam9pbihfX2Rpcm5hbWUsICdsb25nLWRlc2NyaXB0aW9uLm1kJyk7XG4gIGRlc2NyaWJlID0gJ1J1bnMgbGludGluZyB0b29scyBvbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNvZGUgaW4gYSBnaXZlbiBwcm9qZWN0IGZvbGRlci4nO1xufVxuIl19