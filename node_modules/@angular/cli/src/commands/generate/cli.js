"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const command_module_1 = require("../../command-builder/command-module");
const schematics_command_module_1 = require("../../command-builder/schematics-command-module");
const command_1 = require("../../command-builder/utilities/command");
const command_config_1 = require("../command-config");
class GenerateCommandModule extends schematics_command_module_1.SchematicsCommandModule {
    constructor() {
        super(...arguments);
        this.command = 'generate';
        this.aliases = command_config_1.RootCommands['generate'].aliases;
        this.describe = 'Generates and/or modifies files based on a schematic.';
    }
    async builder(argv) {
        let localYargs = (await super.builder(argv)).command({
            command: '$0 <schematic>',
            describe: 'Run the provided schematic.',
            builder: (localYargs) => localYargs
                .positional('schematic', {
                describe: 'The [collection:schematic] to run.',
                type: 'string',
                demandOption: true,
            })
                .strict(),
            handler: (options) => this.handler(options),
        });
        for (const [schematicName, collectionName] of await this.getSchematicsToRegister()) {
            const workflow = this.getOrCreateWorkflowForBuilder(collectionName);
            const collection = workflow.engine.createCollection(collectionName);
            const { description: { schemaJson, aliases: schematicAliases, hidden: schematicHidden, description: schematicDescription, }, } = collection.createSchematic(schematicName, true);
            if (!schemaJson) {
                continue;
            }
            const { 'x-deprecated': xDeprecated, description = schematicDescription, hidden = schematicHidden, } = schemaJson;
            const options = await this.getSchematicOptions(collection, schematicName, workflow);
            localYargs = localYargs.command({
                command: await this.generateCommandString(collectionName, schematicName, options),
                // When 'describe' is set to false, it results in a hidden command.
                describe: hidden === true ? false : typeof description === 'string' ? description : '',
                deprecated: xDeprecated === true || typeof xDeprecated === 'string' ? xDeprecated : false,
                aliases: Array.isArray(schematicAliases)
                    ? await this.generateCommandAliasesStrings(collectionName, schematicAliases)
                    : undefined,
                builder: (localYargs) => this.addSchemaOptionsToCommand(localYargs, options).strict(),
                handler: (options) => this.handler({
                    ...options,
                    schematic: `${collectionName}:${schematicName}`,
                }),
            });
        }
        return localYargs.demandCommand(1, command_1.demandCommandFailureMessage);
    }
    async run(options) {
        const { dryRun, schematic, defaults, force, interactive, ...schematicOptions } = options;
        const [collectionName, schematicName] = this.parseSchematicInfo(schematic);
        if (!collectionName || !schematicName) {
            throw new command_module_1.CommandModuleError('A collection and schematic is required during execution.');
        }
        return this.runSchematic({
            collectionName,
            schematicName,
            schematicOptions,
            executionOptions: {
                dryRun,
                defaults,
                force,
                interactive,
            },
        });
    }
    async getCollectionNames() {
        const [collectionName] = this.parseSchematicInfo(
        // positional = [generate, component] or [generate]
        this.context.args.positional[1]);
        return collectionName ? [collectionName] : [...(await this.getSchematicCollections())];
    }
    async shouldAddCollectionNameAsPartOfCommand() {
        const [collectionNameFromArgs] = this.parseSchematicInfo(
        // positional = [generate, component] or [generate]
        this.context.args.positional[1]);
        const schematicCollectionsFromConfig = await this.getSchematicCollections();
        const collectionNames = await this.getCollectionNames();
        // Only add the collection name as part of the command when it's not a known
        // schematics collection or when it has been provided via the CLI.
        // Ex:`ng generate @schematics/angular:c`
        return (!!collectionNameFromArgs ||
            !collectionNames.some((c) => schematicCollectionsFromConfig.has(c)));
    }
    /**
     * Generate an aliases string array to be passed to the command builder.
     *
     * @example `[component]` or `[@schematics/angular:component]`.
     */
    async generateCommandAliasesStrings(collectionName, schematicAliases) {
        // Only add the collection name as part of the command when it's not a known
        // schematics collection or when it has been provided via the CLI.
        // Ex:`ng generate @schematics/angular:c`
        return (await this.shouldAddCollectionNameAsPartOfCommand())
            ? schematicAliases.map((alias) => `${collectionName}:${alias}`)
            : schematicAliases;
    }
    /**
     * Generate a command string to be passed to the command builder.
     *
     * @example `component [name]` or `@schematics/angular:component [name]`.
     */
    async generateCommandString(collectionName, schematicName, options) {
        const dasherizedSchematicName = core_1.strings.dasherize(schematicName);
        // Only add the collection name as part of the command when it's not a known
        // schematics collection or when it has been provided via the CLI.
        // Ex:`ng generate @schematics/angular:component`
        const commandName = (await this.shouldAddCollectionNameAsPartOfCommand())
            ? collectionName + ':' + dasherizedSchematicName
            : dasherizedSchematicName;
        const positionalArgs = options
            .filter((o) => o.positional !== undefined)
            .map((o) => {
            const label = `${core_1.strings.dasherize(o.name)}${o.type === 'array' ? ' ..' : ''}`;
            return o.required ? `<${label}>` : `[${label}]`;
        })
            .join(' ');
        return `${commandName}${positionalArgs ? ' ' + positionalArgs : ''}`;
    }
    /**
     * Get schematics that can to be registered as subcommands.
     */
    async *getSchematics() {
        const seenNames = new Set();
        for (const collectionName of await this.getCollectionNames()) {
            const workflow = this.getOrCreateWorkflowForBuilder(collectionName);
            const collection = workflow.engine.createCollection(collectionName);
            for (const schematicName of collection.listSchematicNames(true /** includeHidden */)) {
                // If a schematic with this same name is already registered skip.
                if (!seenNames.has(schematicName)) {
                    seenNames.add(schematicName);
                    yield {
                        schematicName,
                        collectionName,
                        schematicAliases: this.listSchematicAliases(collection, schematicName),
                    };
                }
            }
        }
    }
    listSchematicAliases(collection, schematicName) {
        const description = collection.description.schematics[schematicName];
        if (description) {
            return description.aliases && new Set(description.aliases);
        }
        // Extended collections
        if (collection.baseDescriptions) {
            for (const base of collection.baseDescriptions) {
                const description = base.schematics[schematicName];
                if (description) {
                    return description.aliases && new Set(description.aliases);
                }
            }
        }
        return undefined;
    }
    /**
     * Get schematics that should to be registered as subcommands.
     *
     * @returns a sorted list of schematic that needs to be registered as subcommands.
     */
    async getSchematicsToRegister() {
        const schematicsToRegister = [];
        const [, schematicNameFromArgs] = this.parseSchematicInfo(
        // positional = [generate, component] or [generate]
        this.context.args.positional[1]);
        for await (const { schematicName, collectionName, schematicAliases } of this.getSchematics()) {
            if (schematicNameFromArgs &&
                (schematicName === schematicNameFromArgs || schematicAliases?.has(schematicNameFromArgs))) {
                return [[schematicName, collectionName]];
            }
            schematicsToRegister.push([schematicName, collectionName]);
        }
        // Didn't find the schematic or no schematic name was provided Ex: `ng generate --help`.
        return schematicsToRegister.sort(([nameA], [nameB]) => nameA.localeCompare(nameB, undefined, { sensitivity: 'accent' }));
    }
}
exports.default = GenerateCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2dlbmVyYXRlL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOztBQUVILCtDQUErQztBQU8vQyx5RUFLOEM7QUFDOUMsK0ZBR3lEO0FBQ3pELHFFQUFzRjtBQUV0RixzREFBaUQ7QUFNakQsTUFBcUIscUJBQ25CLFNBQVEsbURBQXVCO0lBRGpDOztRQUlFLFlBQU8sR0FBRyxVQUFVLENBQUM7UUFDckIsWUFBTyxHQUFHLDZCQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzNDLGFBQVEsR0FBRyx1REFBdUQsQ0FBQztJQW1QckUsQ0FBQztJQWhQVSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVU7UUFDL0IsSUFBSSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDbkQsT0FBTyxFQUFFLGdCQUFnQjtZQUN6QixRQUFRLEVBQUUsNkJBQTZCO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQ3RCLFVBQVU7aUJBQ1AsVUFBVSxDQUFDLFdBQVcsRUFBRTtnQkFDdkIsUUFBUSxFQUFFLG9DQUFvQztnQkFDOUMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsWUFBWSxFQUFFLElBQUk7YUFDbkIsQ0FBQztpQkFDRCxNQUFNLEVBQUU7WUFDYixPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBa0QsQ0FBQztTQUN2RixDQUFDLENBQUM7UUFFSCxLQUFLLE1BQU0sQ0FBQyxhQUFhLEVBQUUsY0FBYyxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsRUFBRTtZQUNsRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDcEUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVwRSxNQUFNLEVBQ0osV0FBVyxFQUFFLEVBQ1gsVUFBVSxFQUNWLE9BQU8sRUFBRSxnQkFBZ0IsRUFDekIsTUFBTSxFQUFFLGVBQWUsRUFDdkIsV0FBVyxFQUFFLG9CQUFvQixHQUNsQyxHQUNGLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFcEQsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDZixTQUFTO2FBQ1Y7WUFFRCxNQUFNLEVBQ0osY0FBYyxFQUFFLFdBQVcsRUFDM0IsV0FBVyxHQUFHLG9CQUFvQixFQUNsQyxNQUFNLEdBQUcsZUFBZSxHQUN6QixHQUFHLFVBQVUsQ0FBQztZQUNmLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFcEYsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUM7Z0JBQzlCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQztnQkFDakYsbUVBQW1FO2dCQUNuRSxRQUFRLEVBQUUsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEYsVUFBVSxFQUFFLFdBQVcsS0FBSyxJQUFJLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUs7Z0JBQ3pGLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO29CQUN0QyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDO29CQUM1RSxDQUFDLENBQUMsU0FBUztnQkFDYixPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFO2dCQUNyRixPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDO29CQUNYLEdBQUcsT0FBTztvQkFDVixTQUFTLEVBQUUsR0FBRyxjQUFjLElBQUksYUFBYSxFQUFFO2lCQUtoRCxDQUFDO2FBQ0wsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLHFDQUEyQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBb0Q7UUFDNUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsR0FBRyxnQkFBZ0IsRUFBRSxHQUFHLE9BQU8sQ0FBQztRQUV6RixNQUFNLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUzRSxJQUFJLENBQUMsY0FBYyxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3JDLE1BQU0sSUFBSSxtQ0FBa0IsQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1NBQzFGO1FBRUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3ZCLGNBQWM7WUFDZCxhQUFhO1lBQ2IsZ0JBQWdCO1lBQ2hCLGdCQUFnQixFQUFFO2dCQUNoQixNQUFNO2dCQUNOLFFBQVE7Z0JBQ1IsS0FBSztnQkFDTCxXQUFXO2FBQ1o7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGtCQUFrQjtRQUM5QixNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQjtRQUM5QyxtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUNoQyxDQUFDO1FBRUYsT0FBTyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLENBQUM7SUFFTyxLQUFLLENBQUMsc0NBQXNDO1FBQ2xELE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0I7UUFDdEQsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FDaEMsQ0FBQztRQUVGLE1BQU0sOEJBQThCLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUM1RSxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRXhELDRFQUE0RTtRQUM1RSxrRUFBa0U7UUFDbEUseUNBQXlDO1FBQ3pDLE9BQU8sQ0FDTCxDQUFDLENBQUMsc0JBQXNCO1lBQ3hCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsOEJBQThCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ3BFLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLEtBQUssQ0FBQyw2QkFBNkIsQ0FDekMsY0FBc0IsRUFDdEIsZ0JBQTBCO1FBRTFCLDRFQUE0RTtRQUM1RSxrRUFBa0U7UUFDbEUseUNBQXlDO1FBQ3pDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxDQUFDO1lBQzFELENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsY0FBYyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQy9ELENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLEtBQUssQ0FBQyxxQkFBcUIsQ0FDakMsY0FBc0IsRUFDdEIsYUFBcUIsRUFDckIsT0FBaUI7UUFFakIsTUFBTSx1QkFBdUIsR0FBRyxjQUFPLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRWpFLDRFQUE0RTtRQUM1RSxrRUFBa0U7UUFDbEUsaURBQWlEO1FBQ2pELE1BQU0sV0FBVyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsc0NBQXNDLEVBQUUsQ0FBQztZQUN2RSxDQUFDLENBQUMsY0FBYyxHQUFHLEdBQUcsR0FBRyx1QkFBdUI7WUFDaEQsQ0FBQyxDQUFDLHVCQUF1QixDQUFDO1FBRTVCLE1BQU0sY0FBYyxHQUFHLE9BQU87YUFDM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQzthQUN6QyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNULE1BQU0sS0FBSyxHQUFHLEdBQUcsY0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7WUFFL0UsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO1FBQ2xELENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUViLE9BQU8sR0FBRyxXQUFXLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMsQ0FBQyxhQUFhO1FBSzFCLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDcEMsS0FBSyxNQUFNLGNBQWMsSUFBSSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFO1lBQzVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXBFLEtBQUssTUFBTSxhQUFhLElBQUksVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO2dCQUNwRixpRUFBaUU7Z0JBQ2pFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFO29CQUNqQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUU3QixNQUFNO3dCQUNKLGFBQWE7d0JBQ2IsY0FBYzt3QkFDZCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQztxQkFDdkUsQ0FBQztpQkFDSDthQUNGO1NBQ0Y7SUFDSCxDQUFDO0lBRU8sb0JBQW9CLENBQzFCLFVBQXVGLEVBQ3ZGLGFBQXFCO1FBRXJCLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxFQUFFO1lBQ2YsT0FBTyxXQUFXLENBQUMsT0FBTyxJQUFJLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM1RDtRQUVELHVCQUF1QjtRQUN2QixJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtZQUMvQixLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDOUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxXQUFXLEVBQUU7b0JBQ2YsT0FBTyxXQUFXLENBQUMsT0FBTyxJQUFJLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDNUQ7YUFDRjtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxLQUFLLENBQUMsdUJBQXVCO1FBR25DLE1BQU0sb0JBQW9CLEdBQXNELEVBQUUsQ0FBQztRQUNuRixNQUFNLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0I7UUFDdkQsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FDaEMsQ0FBQztRQUVGLElBQUksS0FBSyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQzVGLElBQ0UscUJBQXFCO2dCQUNyQixDQUFDLGFBQWEsS0FBSyxxQkFBcUIsSUFBSSxnQkFBZ0IsRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxFQUN6RjtnQkFDQSxPQUFPLENBQUMsQ0FBQyxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQzthQUMxQztZQUVELG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1NBQzVEO1FBRUQsd0ZBQXdGO1FBQ3hGLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FDcEQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQ2pFLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF6UEQsd0NBeVBDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHN0cmluZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtcbiAgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbixcbiAgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgeyBBcmd1bWVudHNDYW1lbENhc2UsIEFyZ3YgfSBmcm9tICd5YXJncyc7XG5pbXBvcnQge1xuICBDb21tYW5kTW9kdWxlRXJyb3IsXG4gIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbixcbiAgT3B0aW9ucyxcbiAgT3RoZXJPcHRpb25zLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHtcbiAgU2NoZW1hdGljc0NvbW1hbmRBcmdzLFxuICBTY2hlbWF0aWNzQ29tbWFuZE1vZHVsZSxcbn0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL3NjaGVtYXRpY3MtY29tbWFuZC1tb2R1bGUnO1xuaW1wb3J0IHsgZGVtYW5kQ29tbWFuZEZhaWx1cmVNZXNzYWdlIH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL3V0aWxpdGllcy9jb21tYW5kJztcbmltcG9ydCB7IE9wdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvanNvbi1zY2hlbWEnO1xuaW1wb3J0IHsgUm9vdENvbW1hbmRzIH0gZnJvbSAnLi4vY29tbWFuZC1jb25maWcnO1xuXG5pbnRlcmZhY2UgR2VuZXJhdGVDb21tYW5kQXJncyBleHRlbmRzIFNjaGVtYXRpY3NDb21tYW5kQXJncyB7XG4gIHNjaGVtYXRpYz86IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuZXJhdGVDb21tYW5kTW9kdWxlXG4gIGV4dGVuZHMgU2NoZW1hdGljc0NvbW1hbmRNb2R1bGVcbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb248R2VuZXJhdGVDb21tYW5kQXJncz5cbntcbiAgY29tbWFuZCA9ICdnZW5lcmF0ZSc7XG4gIGFsaWFzZXMgPSBSb290Q29tbWFuZHNbJ2dlbmVyYXRlJ10uYWxpYXNlcztcbiAgZGVzY3JpYmUgPSAnR2VuZXJhdGVzIGFuZC9vciBtb2RpZmllcyBmaWxlcyBiYXNlZCBvbiBhIHNjaGVtYXRpYy4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoPzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIG92ZXJyaWRlIGFzeW5jIGJ1aWxkZXIoYXJndjogQXJndik6IFByb21pc2U8QXJndjxHZW5lcmF0ZUNvbW1hbmRBcmdzPj4ge1xuICAgIGxldCBsb2NhbFlhcmdzID0gKGF3YWl0IHN1cGVyLmJ1aWxkZXIoYXJndikpLmNvbW1hbmQoe1xuICAgICAgY29tbWFuZDogJyQwIDxzY2hlbWF0aWM+JyxcbiAgICAgIGRlc2NyaWJlOiAnUnVuIHRoZSBwcm92aWRlZCBzY2hlbWF0aWMuJyxcbiAgICAgIGJ1aWxkZXI6IChsb2NhbFlhcmdzKSA9PlxuICAgICAgICBsb2NhbFlhcmdzXG4gICAgICAgICAgLnBvc2l0aW9uYWwoJ3NjaGVtYXRpYycsIHtcbiAgICAgICAgICAgIGRlc2NyaWJlOiAnVGhlIFtjb2xsZWN0aW9uOnNjaGVtYXRpY10gdG8gcnVuLicsXG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlbWFuZE9wdGlvbjogdHJ1ZSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zdHJpY3QoKSxcbiAgICAgIGhhbmRsZXI6IChvcHRpb25zKSA9PiB0aGlzLmhhbmRsZXIob3B0aW9ucyBhcyBBcmd1bWVudHNDYW1lbENhc2U8R2VuZXJhdGVDb21tYW5kQXJncz4pLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBbc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbk5hbWVdIG9mIGF3YWl0IHRoaXMuZ2V0U2NoZW1hdGljc1RvUmVnaXN0ZXIoKSkge1xuICAgICAgY29uc3Qgd29ya2Zsb3cgPSB0aGlzLmdldE9yQ3JlYXRlV29ya2Zsb3dGb3JCdWlsZGVyKGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB3b3JrZmxvdy5lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZGVzY3JpcHRpb246IHtcbiAgICAgICAgICBzY2hlbWFKc29uLFxuICAgICAgICAgIGFsaWFzZXM6IHNjaGVtYXRpY0FsaWFzZXMsXG4gICAgICAgICAgaGlkZGVuOiBzY2hlbWF0aWNIaWRkZW4sXG4gICAgICAgICAgZGVzY3JpcHRpb246IHNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICAgICAgICB9LFxuICAgICAgfSA9IGNvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKHNjaGVtYXRpY05hbWUsIHRydWUpO1xuXG4gICAgICBpZiAoIXNjaGVtYUpzb24pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgJ3gtZGVwcmVjYXRlZCc6IHhEZXByZWNhdGVkLFxuICAgICAgICBkZXNjcmlwdGlvbiA9IHNjaGVtYXRpY0Rlc2NyaXB0aW9uLFxuICAgICAgICBoaWRkZW4gPSBzY2hlbWF0aWNIaWRkZW4sXG4gICAgICB9ID0gc2NoZW1hSnNvbjtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCB0aGlzLmdldFNjaGVtYXRpY09wdGlvbnMoY29sbGVjdGlvbiwgc2NoZW1hdGljTmFtZSwgd29ya2Zsb3cpO1xuXG4gICAgICBsb2NhbFlhcmdzID0gbG9jYWxZYXJncy5jb21tYW5kKHtcbiAgICAgICAgY29tbWFuZDogYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbW1hbmRTdHJpbmcoY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWUsIG9wdGlvbnMpLFxuICAgICAgICAvLyBXaGVuICdkZXNjcmliZScgaXMgc2V0IHRvIGZhbHNlLCBpdCByZXN1bHRzIGluIGEgaGlkZGVuIGNvbW1hbmQuXG4gICAgICAgIGRlc2NyaWJlOiBoaWRkZW4gPT09IHRydWUgPyBmYWxzZSA6IHR5cGVvZiBkZXNjcmlwdGlvbiA9PT0gJ3N0cmluZycgPyBkZXNjcmlwdGlvbiA6ICcnLFxuICAgICAgICBkZXByZWNhdGVkOiB4RGVwcmVjYXRlZCA9PT0gdHJ1ZSB8fCB0eXBlb2YgeERlcHJlY2F0ZWQgPT09ICdzdHJpbmcnID8geERlcHJlY2F0ZWQgOiBmYWxzZSxcbiAgICAgICAgYWxpYXNlczogQXJyYXkuaXNBcnJheShzY2hlbWF0aWNBbGlhc2VzKVxuICAgICAgICAgID8gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbW1hbmRBbGlhc2VzU3RyaW5ncyhjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljQWxpYXNlcylcbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgYnVpbGRlcjogKGxvY2FsWWFyZ3MpID0+IHRoaXMuYWRkU2NoZW1hT3B0aW9uc1RvQ29tbWFuZChsb2NhbFlhcmdzLCBvcHRpb25zKS5zdHJpY3QoKSxcbiAgICAgICAgaGFuZGxlcjogKG9wdGlvbnMpID0+XG4gICAgICAgICAgdGhpcy5oYW5kbGVyKHtcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICBzY2hlbWF0aWM6IGAke2NvbGxlY3Rpb25OYW1lfToke3NjaGVtYXRpY05hbWV9YCxcbiAgICAgICAgICB9IGFzIEFyZ3VtZW50c0NhbWVsQ2FzZTxcbiAgICAgICAgICAgIFNjaGVtYXRpY3NDb21tYW5kQXJncyAmIHtcbiAgICAgICAgICAgICAgc2NoZW1hdGljOiBzdHJpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgPiksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYWxZYXJncy5kZW1hbmRDb21tYW5kKDEsIGRlbWFuZENvbW1hbmRGYWlsdXJlTWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBydW4ob3B0aW9uczogT3B0aW9uczxHZW5lcmF0ZUNvbW1hbmRBcmdzPiAmIE90aGVyT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD4ge1xuICAgIGNvbnN0IHsgZHJ5UnVuLCBzY2hlbWF0aWMsIGRlZmF1bHRzLCBmb3JjZSwgaW50ZXJhY3RpdmUsIC4uLnNjaGVtYXRpY09wdGlvbnMgfSA9IG9wdGlvbnM7XG5cbiAgICBjb25zdCBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gdGhpcy5wYXJzZVNjaGVtYXRpY0luZm8oc2NoZW1hdGljKTtcblxuICAgIGlmICghY29sbGVjdGlvbk5hbWUgfHwgIXNjaGVtYXRpY05hbWUpIHtcbiAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoJ0EgY29sbGVjdGlvbiBhbmQgc2NoZW1hdGljIGlzIHJlcXVpcmVkIGR1cmluZyBleGVjdXRpb24uJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucnVuU2NoZW1hdGljKHtcbiAgICAgIGNvbGxlY3Rpb25OYW1lLFxuICAgICAgc2NoZW1hdGljTmFtZSxcbiAgICAgIHNjaGVtYXRpY09wdGlvbnMsXG4gICAgICBleGVjdXRpb25PcHRpb25zOiB7XG4gICAgICAgIGRyeVJ1bixcbiAgICAgICAgZGVmYXVsdHMsXG4gICAgICAgIGZvcmNlLFxuICAgICAgICBpbnRlcmFjdGl2ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldENvbGxlY3Rpb25OYW1lcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgW2NvbGxlY3Rpb25OYW1lXSA9IHRoaXMucGFyc2VTY2hlbWF0aWNJbmZvKFxuICAgICAgLy8gcG9zaXRpb25hbCA9IFtnZW5lcmF0ZSwgY29tcG9uZW50XSBvciBbZ2VuZXJhdGVdXG4gICAgICB0aGlzLmNvbnRleHQuYXJncy5wb3NpdGlvbmFsWzFdLFxuICAgICk7XG5cbiAgICByZXR1cm4gY29sbGVjdGlvbk5hbWUgPyBbY29sbGVjdGlvbk5hbWVdIDogWy4uLihhd2FpdCB0aGlzLmdldFNjaGVtYXRpY0NvbGxlY3Rpb25zKCkpXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2hvdWxkQWRkQ29sbGVjdGlvbk5hbWVBc1BhcnRPZkNvbW1hbmQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgW2NvbGxlY3Rpb25OYW1lRnJvbUFyZ3NdID0gdGhpcy5wYXJzZVNjaGVtYXRpY0luZm8oXG4gICAgICAvLyBwb3NpdGlvbmFsID0gW2dlbmVyYXRlLCBjb21wb25lbnRdIG9yIFtnZW5lcmF0ZV1cbiAgICAgIHRoaXMuY29udGV4dC5hcmdzLnBvc2l0aW9uYWxbMV0sXG4gICAgKTtcblxuICAgIGNvbnN0IHNjaGVtYXRpY0NvbGxlY3Rpb25zRnJvbUNvbmZpZyA9IGF3YWl0IHRoaXMuZ2V0U2NoZW1hdGljQ29sbGVjdGlvbnMoKTtcbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZXMgPSBhd2FpdCB0aGlzLmdldENvbGxlY3Rpb25OYW1lcygpO1xuXG4gICAgLy8gT25seSBhZGQgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBwYXJ0IG9mIHRoZSBjb21tYW5kIHdoZW4gaXQncyBub3QgYSBrbm93blxuICAgIC8vIHNjaGVtYXRpY3MgY29sbGVjdGlvbiBvciB3aGVuIGl0IGhhcyBiZWVuIHByb3ZpZGVkIHZpYSB0aGUgQ0xJLlxuICAgIC8vIEV4OmBuZyBnZW5lcmF0ZSBAc2NoZW1hdGljcy9hbmd1bGFyOmNgXG4gICAgcmV0dXJuIChcbiAgICAgICEhY29sbGVjdGlvbk5hbWVGcm9tQXJncyB8fFxuICAgICAgIWNvbGxlY3Rpb25OYW1lcy5zb21lKChjKSA9PiBzY2hlbWF0aWNDb2xsZWN0aW9uc0Zyb21Db25maWcuaGFzKGMpKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYW4gYWxpYXNlcyBzdHJpbmcgYXJyYXkgdG8gYmUgcGFzc2VkIHRvIHRoZSBjb21tYW5kIGJ1aWxkZXIuXG4gICAqXG4gICAqIEBleGFtcGxlIGBbY29tcG9uZW50XWAgb3IgYFtAc2NoZW1hdGljcy9hbmd1bGFyOmNvbXBvbmVudF1gLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUNvbW1hbmRBbGlhc2VzU3RyaW5ncyhcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxuICAgIHNjaGVtYXRpY0FsaWFzZXM6IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgLy8gT25seSBhZGQgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBwYXJ0IG9mIHRoZSBjb21tYW5kIHdoZW4gaXQncyBub3QgYSBrbm93blxuICAgIC8vIHNjaGVtYXRpY3MgY29sbGVjdGlvbiBvciB3aGVuIGl0IGhhcyBiZWVuIHByb3ZpZGVkIHZpYSB0aGUgQ0xJLlxuICAgIC8vIEV4OmBuZyBnZW5lcmF0ZSBAc2NoZW1hdGljcy9hbmd1bGFyOmNgXG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNob3VsZEFkZENvbGxlY3Rpb25OYW1lQXNQYXJ0T2ZDb21tYW5kKCkpXG4gICAgICA/IHNjaGVtYXRpY0FsaWFzZXMubWFwKChhbGlhcykgPT4gYCR7Y29sbGVjdGlvbk5hbWV9OiR7YWxpYXN9YClcbiAgICAgIDogc2NoZW1hdGljQWxpYXNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGNvbW1hbmQgc3RyaW5nIHRvIGJlIHBhc3NlZCB0byB0aGUgY29tbWFuZCBidWlsZGVyLlxuICAgKlxuICAgKiBAZXhhbXBsZSBgY29tcG9uZW50IFtuYW1lXWAgb3IgYEBzY2hlbWF0aWNzL2FuZ3VsYXI6Y29tcG9uZW50IFtuYW1lXWAuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQ29tbWFuZFN0cmluZyhcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zOiBPcHRpb25bXSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXNoZXJpemVkU2NoZW1hdGljTmFtZSA9IHN0cmluZ3MuZGFzaGVyaXplKHNjaGVtYXRpY05hbWUpO1xuXG4gICAgLy8gT25seSBhZGQgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBwYXJ0IG9mIHRoZSBjb21tYW5kIHdoZW4gaXQncyBub3QgYSBrbm93blxuICAgIC8vIHNjaGVtYXRpY3MgY29sbGVjdGlvbiBvciB3aGVuIGl0IGhhcyBiZWVuIHByb3ZpZGVkIHZpYSB0aGUgQ0xJLlxuICAgIC8vIEV4OmBuZyBnZW5lcmF0ZSBAc2NoZW1hdGljcy9hbmd1bGFyOmNvbXBvbmVudGBcbiAgICBjb25zdCBjb21tYW5kTmFtZSA9IChhd2FpdCB0aGlzLnNob3VsZEFkZENvbGxlY3Rpb25OYW1lQXNQYXJ0T2ZDb21tYW5kKCkpXG4gICAgICA/IGNvbGxlY3Rpb25OYW1lICsgJzonICsgZGFzaGVyaXplZFNjaGVtYXRpY05hbWVcbiAgICAgIDogZGFzaGVyaXplZFNjaGVtYXRpY05hbWU7XG5cbiAgICBjb25zdCBwb3NpdGlvbmFsQXJncyA9IG9wdGlvbnNcbiAgICAgIC5maWx0ZXIoKG8pID0+IG8ucG9zaXRpb25hbCAhPT0gdW5kZWZpbmVkKVxuICAgICAgLm1hcCgobykgPT4ge1xuICAgICAgICBjb25zdCBsYWJlbCA9IGAke3N0cmluZ3MuZGFzaGVyaXplKG8ubmFtZSl9JHtvLnR5cGUgPT09ICdhcnJheScgPyAnIC4uJyA6ICcnfWA7XG5cbiAgICAgICAgcmV0dXJuIG8ucmVxdWlyZWQgPyBgPCR7bGFiZWx9PmAgOiBgWyR7bGFiZWx9XWA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBgJHtjb21tYW5kTmFtZX0ke3Bvc2l0aW9uYWxBcmdzID8gJyAnICsgcG9zaXRpb25hbEFyZ3MgOiAnJ31gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzY2hlbWF0aWNzIHRoYXQgY2FuIHRvIGJlIHJlZ2lzdGVyZWQgYXMgc3ViY29tbWFuZHMuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jICpnZXRTY2hlbWF0aWNzKCk6IEFzeW5jR2VuZXJhdG9yPHtcbiAgICBzY2hlbWF0aWNOYW1lOiBzdHJpbmc7XG4gICAgc2NoZW1hdGljQWxpYXNlcz86IFNldDxzdHJpbmc+O1xuICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmc7XG4gIH0+IHtcbiAgICBjb25zdCBzZWVuTmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb25OYW1lIG9mIGF3YWl0IHRoaXMuZ2V0Q29sbGVjdGlvbk5hbWVzKCkpIHtcbiAgICAgIGNvbnN0IHdvcmtmbG93ID0gdGhpcy5nZXRPckNyZWF0ZVdvcmtmbG93Rm9yQnVpbGRlcihjb2xsZWN0aW9uTmFtZSk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uID0gd29ya2Zsb3cuZW5naW5lLmNyZWF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUpO1xuXG4gICAgICBmb3IgKGNvbnN0IHNjaGVtYXRpY05hbWUgb2YgY29sbGVjdGlvbi5saXN0U2NoZW1hdGljTmFtZXModHJ1ZSAvKiogaW5jbHVkZUhpZGRlbiAqLykpIHtcbiAgICAgICAgLy8gSWYgYSBzY2hlbWF0aWMgd2l0aCB0aGlzIHNhbWUgbmFtZSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQgc2tpcC5cbiAgICAgICAgaWYgKCFzZWVuTmFtZXMuaGFzKHNjaGVtYXRpY05hbWUpKSB7XG4gICAgICAgICAgc2Vlbk5hbWVzLmFkZChzY2hlbWF0aWNOYW1lKTtcblxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHNjaGVtYXRpY05hbWUsXG4gICAgICAgICAgICBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICAgIHNjaGVtYXRpY0FsaWFzZXM6IHRoaXMubGlzdFNjaGVtYXRpY0FsaWFzZXMoY29sbGVjdGlvbiwgc2NoZW1hdGljTmFtZSksXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbGlzdFNjaGVtYXRpY0FsaWFzZXMoXG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2NyaXB0aW9uLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY3JpcHRpb24+LFxuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZyxcbiAgKTogU2V0PHN0cmluZz4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5zY2hlbWF0aWNzW3NjaGVtYXRpY05hbWVdO1xuICAgIGlmIChkZXNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uLmFsaWFzZXMgJiYgbmV3IFNldChkZXNjcmlwdGlvbi5hbGlhc2VzKTtcbiAgICB9XG5cbiAgICAvLyBFeHRlbmRlZCBjb2xsZWN0aW9uc1xuICAgIGlmIChjb2xsZWN0aW9uLmJhc2VEZXNjcmlwdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgYmFzZSBvZiBjb2xsZWN0aW9uLmJhc2VEZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBiYXNlLnNjaGVtYXRpY3Nbc2NoZW1hdGljTmFtZV07XG4gICAgICAgIGlmIChkZXNjcmlwdGlvbikge1xuICAgICAgICAgIHJldHVybiBkZXNjcmlwdGlvbi5hbGlhc2VzICYmIG5ldyBTZXQoZGVzY3JpcHRpb24uYWxpYXNlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzY2hlbWF0aWNzIHRoYXQgc2hvdWxkIHRvIGJlIHJlZ2lzdGVyZWQgYXMgc3ViY29tbWFuZHMuXG4gICAqXG4gICAqIEByZXR1cm5zIGEgc29ydGVkIGxpc3Qgb2Ygc2NoZW1hdGljIHRoYXQgbmVlZHMgdG8gYmUgcmVnaXN0ZXJlZCBhcyBzdWJjb21tYW5kcy5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0U2NoZW1hdGljc1RvUmVnaXN0ZXIoKTogUHJvbWlzZTxcbiAgICBbc2NoZW1hdGljTmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uTmFtZTogc3RyaW5nXVtdXG4gID4ge1xuICAgIGNvbnN0IHNjaGVtYXRpY3NUb1JlZ2lzdGVyOiBbc2NoZW1hdGljTmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uTmFtZTogc3RyaW5nXVtdID0gW107XG4gICAgY29uc3QgWywgc2NoZW1hdGljTmFtZUZyb21BcmdzXSA9IHRoaXMucGFyc2VTY2hlbWF0aWNJbmZvKFxuICAgICAgLy8gcG9zaXRpb25hbCA9IFtnZW5lcmF0ZSwgY29tcG9uZW50XSBvciBbZ2VuZXJhdGVdXG4gICAgICB0aGlzLmNvbnRleHQuYXJncy5wb3NpdGlvbmFsWzFdLFxuICAgICk7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IHsgc2NoZW1hdGljTmFtZSwgY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY0FsaWFzZXMgfSBvZiB0aGlzLmdldFNjaGVtYXRpY3MoKSkge1xuICAgICAgaWYgKFxuICAgICAgICBzY2hlbWF0aWNOYW1lRnJvbUFyZ3MgJiZcbiAgICAgICAgKHNjaGVtYXRpY05hbWUgPT09IHNjaGVtYXRpY05hbWVGcm9tQXJncyB8fCBzY2hlbWF0aWNBbGlhc2VzPy5oYXMoc2NoZW1hdGljTmFtZUZyb21BcmdzKSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gW1tzY2hlbWF0aWNOYW1lLCBjb2xsZWN0aW9uTmFtZV1dO1xuICAgICAgfVxuXG4gICAgICBzY2hlbWF0aWNzVG9SZWdpc3Rlci5wdXNoKFtzY2hlbWF0aWNOYW1lLCBjb2xsZWN0aW9uTmFtZV0pO1xuICAgIH1cblxuICAgIC8vIERpZG4ndCBmaW5kIHRoZSBzY2hlbWF0aWMgb3Igbm8gc2NoZW1hdGljIG5hbWUgd2FzIHByb3ZpZGVkIEV4OiBgbmcgZ2VuZXJhdGUgLS1oZWxwYC5cbiAgICByZXR1cm4gc2NoZW1hdGljc1RvUmVnaXN0ZXIuc29ydCgoW25hbWVBXSwgW25hbWVCXSkgPT5cbiAgICAgIG5hbWVBLmxvY2FsZUNvbXBhcmUobmFtZUIsIHVuZGVmaW5lZCwgeyBzZW5zaXRpdml0eTogJ2FjY2VudCcgfSksXG4gICAgKTtcbiAgfVxufVxuIl19