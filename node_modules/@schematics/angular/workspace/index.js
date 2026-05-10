"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const latest_versions_1 = require("../utility/latest-versions");
function default_1(options) {
    return (0, schematics_1.mergeWith)((0, schematics_1.apply)((0, schematics_1.url)('./files'), [
        options.minimal ? (0, schematics_1.filter)((path) => !path.endsWith('editorconfig.template')) : (0, schematics_1.noop)(),
        (0, schematics_1.applyTemplates)({
            utils: schematics_1.strings,
            ...options,
            'dot': '.',
            latestVersions: latest_versions_1.latestVersions,
        }),
    ]));
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvd29ya3NwYWNlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsMkRBU29DO0FBQ3BDLGdFQUE0RDtBQUc1RCxtQkFBeUIsT0FBeUI7SUFDaEQsT0FBTyxJQUFBLHNCQUFTLEVBQ2QsSUFBQSxrQkFBSyxFQUFDLElBQUEsZ0JBQUcsRUFBQyxTQUFTLENBQUMsRUFBRTtRQUNwQixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFBLG1CQUFNLEVBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsaUJBQUksR0FBRTtRQUNwRixJQUFBLDJCQUFjLEVBQUM7WUFDYixLQUFLLEVBQUUsb0JBQU87WUFDZCxHQUFHLE9BQU87WUFDVixLQUFLLEVBQUUsR0FBRztZQUNWLGNBQWMsRUFBZCxnQ0FBYztTQUNmLENBQUM7S0FDSCxDQUFDLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFaRCw0QkFZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBSdWxlLFxuICBhcHBseSxcbiAgYXBwbHlUZW1wbGF0ZXMsXG4gIGZpbHRlcixcbiAgbWVyZ2VXaXRoLFxuICBub29wLFxuICBzdHJpbmdzLFxuICB1cmwsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGxhdGVzdFZlcnNpb25zIH0gZnJvbSAnLi4vdXRpbGl0eS9sYXRlc3QtdmVyc2lvbnMnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFdvcmtzcGFjZU9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBXb3Jrc3BhY2VPcHRpb25zKTogUnVsZSB7XG4gIHJldHVybiBtZXJnZVdpdGgoXG4gICAgYXBwbHkodXJsKCcuL2ZpbGVzJyksIFtcbiAgICAgIG9wdGlvbnMubWluaW1hbCA/IGZpbHRlcigocGF0aCkgPT4gIXBhdGguZW5kc1dpdGgoJ2VkaXRvcmNvbmZpZy50ZW1wbGF0ZScpKSA6IG5vb3AoKSxcbiAgICAgIGFwcGx5VGVtcGxhdGVzKHtcbiAgICAgICAgdXRpbHM6IHN0cmluZ3MsXG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICdkb3QnOiAnLicsXG4gICAgICAgIGxhdGVzdFZlcnNpb25zLFxuICAgICAgfSksXG4gICAgXSksXG4gICk7XG59XG4iXX0=