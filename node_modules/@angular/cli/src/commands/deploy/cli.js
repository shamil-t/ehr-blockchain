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
class DeployCommandModule extends architect_command_module_1.ArchitectCommandModule {
    constructor() {
        super(...arguments);
        // The below choices should be kept in sync with the list in https://angular.io/guide/deployment
        this.missingTargetChoices = [
            {
                name: 'Amazon S3',
                value: '@jefiozie/ngx-aws-deploy',
            },
            {
                name: 'Firebase',
                value: '@angular/fire',
            },
            {
                name: 'Netlify',
                value: '@netlify-builder/deploy',
            },
            {
                name: 'NPM',
                value: 'ngx-deploy-npm',
            },
            {
                name: 'GitHub Pages',
                value: 'angular-cli-ghpages',
            },
        ];
        this.multiTarget = false;
        this.command = 'deploy [project]';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
        this.describe = 'Invokes the deploy builder for a specified project or for the default project in the workspace.';
    }
}
exports.default = DeployCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2RlcGxveS9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBNEI7QUFFNUIsNkZBQXdGO0FBR3hGLE1BQXFCLG1CQUNuQixTQUFRLGlEQUFzQjtJQURoQzs7UUFJRSxnR0FBZ0c7UUFDdkYseUJBQW9CLEdBQTBCO1lBQ3JEO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUsMEJBQTBCO2FBQ2xDO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLEtBQUssRUFBRSxlQUFlO2FBQ3ZCO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxFQUFFLHlCQUF5QjthQUNqQztZQUNEO2dCQUNFLElBQUksRUFBRSxLQUFLO2dCQUNYLEtBQUssRUFBRSxnQkFBZ0I7YUFDeEI7WUFDRDtnQkFDRSxJQUFJLEVBQUUsY0FBYztnQkFDcEIsS0FBSyxFQUFFLHFCQUFxQjthQUM3QjtTQUNGLENBQUM7UUFFRixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixZQUFPLEdBQUcsa0JBQWtCLENBQUM7UUFDN0Isd0JBQW1CLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDN0QsYUFBUSxHQUNOLGlHQUFpRyxDQUFDO0lBQ3RHLENBQUM7Q0FBQTtBQWpDRCxzQ0FpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgTWlzc2luZ1RhcmdldENob2ljZSB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9hcmNoaXRlY3QtYmFzZS1jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBBcmNoaXRlY3RDb21tYW5kTW9kdWxlIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL2FyY2hpdGVjdC1jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24gfSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXBsb3lDb21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgQXJjaGl0ZWN0Q29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvblxue1xuICAvLyBUaGUgYmVsb3cgY2hvaWNlcyBzaG91bGQgYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGxpc3QgaW4gaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2RlcGxveW1lbnRcbiAgb3ZlcnJpZGUgbWlzc2luZ1RhcmdldENob2ljZXM6IE1pc3NpbmdUYXJnZXRDaG9pY2VbXSA9IFtcbiAgICB7XG4gICAgICBuYW1lOiAnQW1hem9uIFMzJyxcbiAgICAgIHZhbHVlOiAnQGplZmlvemllL25neC1hd3MtZGVwbG95JyxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdGaXJlYmFzZScsXG4gICAgICB2YWx1ZTogJ0Bhbmd1bGFyL2ZpcmUnLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ05ldGxpZnknLFxuICAgICAgdmFsdWU6ICdAbmV0bGlmeS1idWlsZGVyL2RlcGxveScsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnTlBNJyxcbiAgICAgIHZhbHVlOiAnbmd4LWRlcGxveS1ucG0nLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ0dpdEh1YiBQYWdlcycsXG4gICAgICB2YWx1ZTogJ2FuZ3VsYXItY2xpLWdocGFnZXMnLFxuICAgIH0sXG4gIF07XG5cbiAgbXVsdGlUYXJnZXQgPSBmYWxzZTtcbiAgY29tbWFuZCA9ICdkZXBsb3kgW3Byb2plY3RdJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aCA9IGpvaW4oX19kaXJuYW1lLCAnbG9uZy1kZXNjcmlwdGlvbi5tZCcpO1xuICBkZXNjcmliZSA9XG4gICAgJ0ludm9rZXMgdGhlIGRlcGxveSBidWlsZGVyIGZvciBhIHNwZWNpZmllZCBwcm9qZWN0IG9yIGZvciB0aGUgZGVmYXVsdCBwcm9qZWN0IGluIHRoZSB3b3Jrc3BhY2UuJztcbn1cbiJdfQ==