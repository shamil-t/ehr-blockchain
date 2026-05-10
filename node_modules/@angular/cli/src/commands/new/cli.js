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
const schematics_command_module_1 = require("../../command-builder/schematics-command-module");
const version_1 = require("../../utilities/version");
const command_config_1 = require("../command-config");
class NewCommandModule extends schematics_command_module_1.SchematicsCommandModule {
    constructor() {
        super(...arguments);
        this.schematicName = 'ng-new';
        this.scope = command_module_1.CommandScope.Out;
        this.allowPrivateSchematics = true;
        this.command = 'new [name]';
        this.aliases = command_config_1.RootCommands['new'].aliases;
        this.describe = 'Creates a new Angular workspace.';
        this.longDescriptionPath = (0, node_path_1.join)(__dirname, 'long-description.md');
    }
    async builder(argv) {
        const localYargs = (await super.builder(argv)).option('collection', {
            alias: 'c',
            describe: 'A collection of schematics to use in generating the initial application.',
            type: 'string',
        });
        const { options: { collection: collectionNameFromArgs }, } = this.context.args;
        const collectionName = typeof collectionNameFromArgs === 'string'
            ? collectionNameFromArgs
            : await this.getCollectionFromConfig();
        const workflow = await this.getOrCreateWorkflowForBuilder(collectionName);
        const collection = workflow.engine.createCollection(collectionName);
        const options = await this.getSchematicOptions(collection, this.schematicName, workflow);
        return this.addSchemaOptionsToCommand(localYargs, options);
    }
    async run(options) {
        // Register the version of the CLI in the registry.
        const collectionName = options.collection ?? (await this.getCollectionFromConfig());
        const { dryRun, force, interactive, defaults, collection, ...schematicOptions } = options;
        const workflow = await this.getOrCreateWorkflowForExecution(collectionName, {
            dryRun,
            force,
            interactive,
            defaults,
        });
        workflow.registry.addSmartDefaultProvider('ng-cli-version', () => version_1.VERSION.full);
        // Compatibility check for NPM 7
        if (collectionName === '@schematics/angular' &&
            !schematicOptions.skipInstall &&
            (schematicOptions.packageManager === undefined || schematicOptions.packageManager === 'npm')) {
            this.context.packageManager.ensureCompatibility();
        }
        return this.runSchematic({
            collectionName,
            schematicName: this.schematicName,
            schematicOptions,
            executionOptions: {
                dryRun,
                force,
                interactive,
                defaults,
            },
        });
    }
    /** Find a collection from config that has an `ng-new` schematic. */
    async getCollectionFromConfig() {
        for (const collectionName of await this.getSchematicCollections()) {
            const workflow = this.getOrCreateWorkflowForBuilder(collectionName);
            const collection = workflow.engine.createCollection(collectionName);
            const schematicsInCollection = collection.description.schematics;
            if (Object.keys(schematicsInCollection).includes(this.schematicName)) {
                return collectionName;
            }
        }
        return schematics_command_module_1.DEFAULT_SCHEMATICS_COLLECTION;
    }
}
exports.default = NewCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL25ldy9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCx5Q0FBaUM7QUFFakMseUVBSzhDO0FBQzlDLCtGQUl5RDtBQUN6RCxxREFBa0Q7QUFDbEQsc0RBQWlEO0FBTWpELE1BQXFCLGdCQUNuQixTQUFRLG1EQUF1QjtJQURqQzs7UUFJbUIsa0JBQWEsR0FBRyxRQUFRLENBQUM7UUFDakMsVUFBSyxHQUFHLDZCQUFZLENBQUMsR0FBRyxDQUFDO1FBQ2YsMkJBQXNCLEdBQUcsSUFBSSxDQUFDO1FBRWpELFlBQU8sR0FBRyxZQUFZLENBQUM7UUFDdkIsWUFBTyxHQUFHLDZCQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3RDLGFBQVEsR0FBRyxrQ0FBa0MsQ0FBQztRQUM5Qyx3QkFBbUIsR0FBRyxJQUFBLGdCQUFJLEVBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUF5RS9ELENBQUM7SUF2RVUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFVO1FBQy9CLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRTtZQUNsRSxLQUFLLEVBQUUsR0FBRztZQUNWLFFBQVEsRUFBRSwwRUFBMEU7WUFDcEYsSUFBSSxFQUFFLFFBQVE7U0FDZixDQUFDLENBQUM7UUFFSCxNQUFNLEVBQ0osT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFLHNCQUFzQixFQUFFLEdBQ2hELEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFFdEIsTUFBTSxjQUFjLEdBQ2xCLE9BQU8sc0JBQXNCLEtBQUssUUFBUTtZQUN4QyxDQUFDLENBQUMsc0JBQXNCO1lBQ3hCLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRTNDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFekYsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQStDO1FBQ3ZELG1EQUFtRDtRQUNuRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsZ0JBQWdCLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDMUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsK0JBQStCLENBQUMsY0FBYyxFQUFFO1lBQzFFLE1BQU07WUFDTixLQUFLO1lBQ0wsV0FBVztZQUNYLFFBQVE7U0FDVCxDQUFDLENBQUM7UUFDSCxRQUFRLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEYsZ0NBQWdDO1FBQ2hDLElBQ0UsY0FBYyxLQUFLLHFCQUFxQjtZQUN4QyxDQUFDLGdCQUFnQixDQUFDLFdBQVc7WUFDN0IsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEtBQUssU0FBUyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsS0FBSyxLQUFLLENBQUMsRUFDNUY7WUFDQSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQ25EO1FBRUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3ZCLGNBQWM7WUFDZCxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMsZ0JBQWdCO1lBQ2hCLGdCQUFnQixFQUFFO2dCQUNoQixNQUFNO2dCQUNOLEtBQUs7Z0JBQ0wsV0FBVztnQkFDWCxRQUFRO2FBQ1Q7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsb0VBQW9FO0lBQzVELEtBQUssQ0FBQyx1QkFBdUI7UUFDbkMsS0FBSyxNQUFNLGNBQWMsSUFBSSxNQUFNLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxFQUFFO1lBQ2pFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sc0JBQXNCLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUM7WUFFakUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDcEUsT0FBTyxjQUFjLENBQUM7YUFDdkI7U0FDRjtRQUVELE9BQU8seURBQTZCLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBcEZELG1DQW9GQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IEFyZ3YgfSBmcm9tICd5YXJncyc7XG5pbXBvcnQge1xuICBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24sXG4gIENvbW1hbmRTY29wZSxcbiAgT3B0aW9ucyxcbiAgT3RoZXJPcHRpb25zLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9TQ0hFTUFUSUNTX0NPTExFQ1RJT04sXG4gIFNjaGVtYXRpY3NDb21tYW5kQXJncyxcbiAgU2NoZW1hdGljc0NvbW1hbmRNb2R1bGUsXG59IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9zY2hlbWF0aWNzLWNvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IFZFUlNJT04gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvdmVyc2lvbic7XG5pbXBvcnQgeyBSb290Q29tbWFuZHMgfSBmcm9tICcuLi9jb21tYW5kLWNvbmZpZyc7XG5cbmludGVyZmFjZSBOZXdDb21tYW5kQXJncyBleHRlbmRzIFNjaGVtYXRpY3NDb21tYW5kQXJncyB7XG4gIGNvbGxlY3Rpb24/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5ld0NvbW1hbmRNb2R1bGVcbiAgZXh0ZW5kcyBTY2hlbWF0aWNzQ29tbWFuZE1vZHVsZVxuICBpbXBsZW1lbnRzIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbjxOZXdDb21tYW5kQXJncz5cbntcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlbWF0aWNOYW1lID0gJ25nLW5ldyc7XG4gIG92ZXJyaWRlIHNjb3BlID0gQ29tbWFuZFNjb3BlLk91dDtcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIGFsbG93UHJpdmF0ZVNjaGVtYXRpY3MgPSB0cnVlO1xuXG4gIGNvbW1hbmQgPSAnbmV3IFtuYW1lXSc7XG4gIGFsaWFzZXMgPSBSb290Q29tbWFuZHNbJ25ldyddLmFsaWFzZXM7XG4gIGRlc2NyaWJlID0gJ0NyZWF0ZXMgYSBuZXcgQW5ndWxhciB3b3Jrc3BhY2UuJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aCA9IGpvaW4oX19kaXJuYW1lLCAnbG9uZy1kZXNjcmlwdGlvbi5tZCcpO1xuXG4gIG92ZXJyaWRlIGFzeW5jIGJ1aWxkZXIoYXJndjogQXJndik6IFByb21pc2U8QXJndjxOZXdDb21tYW5kQXJncz4+IHtcbiAgICBjb25zdCBsb2NhbFlhcmdzID0gKGF3YWl0IHN1cGVyLmJ1aWxkZXIoYXJndikpLm9wdGlvbignY29sbGVjdGlvbicsIHtcbiAgICAgIGFsaWFzOiAnYycsXG4gICAgICBkZXNjcmliZTogJ0EgY29sbGVjdGlvbiBvZiBzY2hlbWF0aWNzIHRvIHVzZSBpbiBnZW5lcmF0aW5nIHRoZSBpbml0aWFsIGFwcGxpY2F0aW9uLicsXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHtcbiAgICAgIG9wdGlvbnM6IHsgY29sbGVjdGlvbjogY29sbGVjdGlvbk5hbWVGcm9tQXJncyB9LFxuICAgIH0gPSB0aGlzLmNvbnRleHQuYXJncztcblxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID1cbiAgICAgIHR5cGVvZiBjb2xsZWN0aW9uTmFtZUZyb21BcmdzID09PSAnc3RyaW5nJ1xuICAgICAgICA/IGNvbGxlY3Rpb25OYW1lRnJvbUFyZ3NcbiAgICAgICAgOiBhd2FpdCB0aGlzLmdldENvbGxlY3Rpb25Gcm9tQ29uZmlnKCk7XG5cbiAgICBjb25zdCB3b3JrZmxvdyA9IGF3YWl0IHRoaXMuZ2V0T3JDcmVhdGVXb3JrZmxvd0ZvckJ1aWxkZXIoY29sbGVjdGlvbk5hbWUpO1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB3b3JrZmxvdy5lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuZ2V0U2NoZW1hdGljT3B0aW9ucyhjb2xsZWN0aW9uLCB0aGlzLnNjaGVtYXRpY05hbWUsIHdvcmtmbG93KTtcblxuICAgIHJldHVybiB0aGlzLmFkZFNjaGVtYU9wdGlvbnNUb0NvbW1hbmQobG9jYWxZYXJncywgb3B0aW9ucyk7XG4gIH1cblxuICBhc3luYyBydW4ob3B0aW9uczogT3B0aW9uczxOZXdDb21tYW5kQXJncz4gJiBPdGhlck9wdGlvbnMpOiBQcm9taXNlPG51bWJlciB8IHZvaWQ+IHtcbiAgICAvLyBSZWdpc3RlciB0aGUgdmVyc2lvbiBvZiB0aGUgQ0xJIGluIHRoZSByZWdpc3RyeS5cbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IG9wdGlvbnMuY29sbGVjdGlvbiA/PyAoYXdhaXQgdGhpcy5nZXRDb2xsZWN0aW9uRnJvbUNvbmZpZygpKTtcbiAgICBjb25zdCB7IGRyeVJ1biwgZm9yY2UsIGludGVyYWN0aXZlLCBkZWZhdWx0cywgY29sbGVjdGlvbiwgLi4uc2NoZW1hdGljT3B0aW9ucyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCB3b3JrZmxvdyA9IGF3YWl0IHRoaXMuZ2V0T3JDcmVhdGVXb3JrZmxvd0ZvckV4ZWN1dGlvbihjb2xsZWN0aW9uTmFtZSwge1xuICAgICAgZHJ5UnVuLFxuICAgICAgZm9yY2UsXG4gICAgICBpbnRlcmFjdGl2ZSxcbiAgICAgIGRlZmF1bHRzLFxuICAgIH0pO1xuICAgIHdvcmtmbG93LnJlZ2lzdHJ5LmFkZFNtYXJ0RGVmYXVsdFByb3ZpZGVyKCduZy1jbGktdmVyc2lvbicsICgpID0+IFZFUlNJT04uZnVsbCk7XG5cbiAgICAvLyBDb21wYXRpYmlsaXR5IGNoZWNrIGZvciBOUE0gN1xuICAgIGlmIChcbiAgICAgIGNvbGxlY3Rpb25OYW1lID09PSAnQHNjaGVtYXRpY3MvYW5ndWxhcicgJiZcbiAgICAgICFzY2hlbWF0aWNPcHRpb25zLnNraXBJbnN0YWxsICYmXG4gICAgICAoc2NoZW1hdGljT3B0aW9ucy5wYWNrYWdlTWFuYWdlciA9PT0gdW5kZWZpbmVkIHx8IHNjaGVtYXRpY09wdGlvbnMucGFja2FnZU1hbmFnZXIgPT09ICducG0nKVxuICAgICkge1xuICAgICAgdGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLmVuc3VyZUNvbXBhdGliaWxpdHkoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ydW5TY2hlbWF0aWMoe1xuICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgICBzY2hlbWF0aWNOYW1lOiB0aGlzLnNjaGVtYXRpY05hbWUsXG4gICAgICBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgZXhlY3V0aW9uT3B0aW9uczoge1xuICAgICAgICBkcnlSdW4sXG4gICAgICAgIGZvcmNlLFxuICAgICAgICBpbnRlcmFjdGl2ZSxcbiAgICAgICAgZGVmYXVsdHMsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEZpbmQgYSBjb2xsZWN0aW9uIGZyb20gY29uZmlnIHRoYXQgaGFzIGFuIGBuZy1uZXdgIHNjaGVtYXRpYy4gKi9cbiAgcHJpdmF0ZSBhc3luYyBnZXRDb2xsZWN0aW9uRnJvbUNvbmZpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGZvciAoY29uc3QgY29sbGVjdGlvbk5hbWUgb2YgYXdhaXQgdGhpcy5nZXRTY2hlbWF0aWNDb2xsZWN0aW9ucygpKSB7XG4gICAgICBjb25zdCB3b3JrZmxvdyA9IHRoaXMuZ2V0T3JDcmVhdGVXb3JrZmxvd0ZvckJ1aWxkZXIoY29sbGVjdGlvbk5hbWUpO1xuICAgICAgY29uc3QgY29sbGVjdGlvbiA9IHdvcmtmbG93LmVuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY3NJbkNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uLnNjaGVtYXRpY3M7XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhzY2hlbWF0aWNzSW5Db2xsZWN0aW9uKS5pbmNsdWRlcyh0aGlzLnNjaGVtYXRpY05hbWUpKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uTmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gREVGQVVMVF9TQ0hFTUFUSUNTX0NPTExFQ1RJT047XG4gIH1cbn1cbiJdfQ==