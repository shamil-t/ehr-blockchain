"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const architect_command_module_1 = require("../../command-builder/architect-command-module");
const command_config_1 = require("../command-config");
class E2eCommandModule extends architect_command_module_1.ArchitectCommandModule {
    constructor() {
        super(...arguments);
        this.missingTargetChoices = [
            {
                name: 'Cypress',
                value: '@cypress/schematic',
            },
            {
                name: 'Nightwatch',
                value: '@nightwatch/schematics',
            },
            {
                name: 'WebdriverIO',
                value: '@wdio/schematics',
            },
            {
                name: 'Puppeteer',
                value: '@puppeteer/ng-schematics',
            },
        ];
        this.multiTarget = true;
        this.command = 'e2e [project]';
        this.aliases = command_config_1.RootCommands['e2e'].aliases;
        this.describe = 'Builds and serves an Angular application, then runs end-to-end tests.';
    }
}
exports.default = E2eCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2UyZS9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFHSCw2RkFBd0Y7QUFFeEYsc0RBQWlEO0FBRWpELE1BQXFCLGdCQUNuQixTQUFRLGlEQUFzQjtJQURoQzs7UUFJVyx5QkFBb0IsR0FBMEI7WUFDckQ7Z0JBQ0UsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxFQUFFLG9CQUFvQjthQUM1QjtZQUNEO2dCQUNFLElBQUksRUFBRSxZQUFZO2dCQUNsQixLQUFLLEVBQUUsd0JBQXdCO2FBQ2hDO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLEtBQUssRUFBRSxrQkFBa0I7YUFDMUI7WUFDRDtnQkFDRSxJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSyxFQUFFLDBCQUEwQjthQUNsQztTQUNGLENBQUM7UUFFRixnQkFBVyxHQUFHLElBQUksQ0FBQztRQUNuQixZQUFPLEdBQUcsZUFBZSxDQUFDO1FBQzFCLFlBQU8sR0FBRyw2QkFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN0QyxhQUFRLEdBQUcsdUVBQXVFLENBQUM7SUFFckYsQ0FBQztDQUFBO0FBNUJELG1DQTRCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBNaXNzaW5nVGFyZ2V0Q2hvaWNlIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2FyY2hpdGVjdC1iYXNlLWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IEFyY2hpdGVjdENvbW1hbmRNb2R1bGUgfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvYXJjaGl0ZWN0LWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBSb290Q29tbWFuZHMgfSBmcm9tICcuLi9jb21tYW5kLWNvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEUyZUNvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBBcmNoaXRlY3RDb21tYW5kTW9kdWxlXG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uXG57XG4gIG92ZXJyaWRlIG1pc3NpbmdUYXJnZXRDaG9pY2VzOiBNaXNzaW5nVGFyZ2V0Q2hvaWNlW10gPSBbXG4gICAge1xuICAgICAgbmFtZTogJ0N5cHJlc3MnLFxuICAgICAgdmFsdWU6ICdAY3lwcmVzcy9zY2hlbWF0aWMnLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ05pZ2h0d2F0Y2gnLFxuICAgICAgdmFsdWU6ICdAbmlnaHR3YXRjaC9zY2hlbWF0aWNzJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdXZWJkcml2ZXJJTycsXG4gICAgICB2YWx1ZTogJ0B3ZGlvL3NjaGVtYXRpY3MnLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ1B1cHBldGVlcicsXG4gICAgICB2YWx1ZTogJ0BwdXBwZXRlZXIvbmctc2NoZW1hdGljcycsXG4gICAgfSxcbiAgXTtcblxuICBtdWx0aVRhcmdldCA9IHRydWU7XG4gIGNvbW1hbmQgPSAnZTJlIFtwcm9qZWN0XSc7XG4gIGFsaWFzZXMgPSBSb290Q29tbWFuZHNbJ2UyZSddLmFsaWFzZXM7XG4gIGRlc2NyaWJlID0gJ0J1aWxkcyBhbmQgc2VydmVzIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24sIHRoZW4gcnVucyBlbmQtdG8tZW5kIHRlc3RzLic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGg/OiBzdHJpbmc7XG59XG4iXX0=