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
exports.runCommand = void 0;
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const command_config_1 = require("../commands/command-config");
const color_1 = require("../utilities/color");
const config_1 = require("../utilities/config");
const error_1 = require("../utilities/error");
const package_manager_1 = require("../utilities/package-manager");
const command_module_1 = require("./command-module");
const command_1 = require("./utilities/command");
const json_help_1 = require("./utilities/json-help");
const normalize_options_middleware_1 = require("./utilities/normalize-options-middleware");
const yargsParser = helpers_1.Parser;
async function runCommand(args, logger) {
    const { $0, _, help = false, jsonHelp = false, getYargsCompletions = false, ...rest } = yargsParser(args, {
        boolean: ['help', 'json-help', 'get-yargs-completions'],
        alias: { 'collection': 'c' },
    });
    // When `getYargsCompletions` is true the scriptName 'ng' at index 0 is not removed.
    const positional = getYargsCompletions ? _.slice(1) : _;
    let workspace;
    let globalConfiguration;
    try {
        [workspace, globalConfiguration] = await Promise.all([
            (0, config_1.getWorkspace)('local'),
            (0, config_1.getWorkspace)('global'),
        ]);
    }
    catch (e) {
        (0, error_1.assertIsError)(e);
        logger.fatal(e.message);
        return 1;
    }
    const root = workspace?.basePath ?? process.cwd();
    const context = {
        globalConfiguration,
        workspace,
        logger,
        currentDirectory: process.cwd(),
        root,
        packageManager: new package_manager_1.PackageManagerUtils({ globalConfiguration, workspace, root }),
        args: {
            positional: positional.map((v) => v.toString()),
            options: {
                help,
                jsonHelp,
                getYargsCompletions,
                ...rest,
            },
        },
    };
    let localYargs = (0, yargs_1.default)(args);
    for (const CommandModule of await getCommandsToRegister(positional[0])) {
        localYargs = (0, command_1.addCommandModuleToYargs)(localYargs, CommandModule, context);
    }
    if (jsonHelp) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const usageInstance = localYargs.getInternalMethods().getUsageInstance();
        usageInstance.help = () => (0, json_help_1.jsonHelpUsage)();
    }
    await localYargs
        .scriptName('ng')
        // https://github.com/yargs/yargs/blob/main/docs/advanced.md#customizing-yargs-parser
        .parserConfiguration({
        'populate--': true,
        'unknown-options-as-args': false,
        'dot-notation': false,
        'boolean-negation': true,
        'strip-aliased': true,
        'strip-dashed': true,
        'camel-case-expansion': false,
    })
        .option('json-help', {
        describe: 'Show help in JSON format.',
        implies: ['help'],
        hidden: true,
        type: 'boolean',
    })
        .help('help', 'Shows a help message for this command in the console.')
        // A complete list of strings can be found: https://github.com/yargs/yargs/blob/main/locales/en.json
        .updateStrings({
        'Commands:': color_1.colors.cyan('Commands:'),
        'Options:': color_1.colors.cyan('Options:'),
        'Positionals:': color_1.colors.cyan('Arguments:'),
        'deprecated': color_1.colors.yellow('deprecated'),
        'deprecated: %s': color_1.colors.yellow('deprecated:') + ' %s',
        'Did you mean %s?': 'Unknown command. Did you mean %s?',
    })
        .epilogue('For more information, see https://angular.io/cli/.\n')
        .demandCommand(1, command_1.demandCommandFailureMessage)
        .recommendCommands()
        .middleware(normalize_options_middleware_1.normalizeOptionsMiddleware)
        .version(false)
        .showHelpOnFail(false)
        .strict()
        .fail((msg, err) => {
        throw msg
            ? // Validation failed example: `Unknown argument:`
                new command_module_1.CommandModuleError(msg)
            : // Unknown exception, re-throw.
                err;
    })
        .wrap(yargs_1.default.terminalWidth())
        .parseAsync();
    return process.exitCode ?? 0;
}
exports.runCommand = runCommand;
/**
 * Get the commands that need to be registered.
 * @returns One or more command factories that needs to be registered.
 */
async function getCommandsToRegister(commandName) {
    const commands = [];
    if (commandName in command_config_1.RootCommands) {
        commands.push(command_config_1.RootCommands[commandName]);
    }
    else if (commandName in command_config_1.RootCommandsAliases) {
        commands.push(command_config_1.RootCommandsAliases[commandName]);
    }
    else {
        // Unknown command, register every possible command.
        Object.values(command_config_1.RootCommands).forEach((c) => commands.push(c));
    }
    return Promise.all(commands.map((command) => command.factory().then((m) => m.default)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtcnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILGtEQUEwQjtBQUMxQiwyQ0FBdUM7QUFDdkMsK0RBS29DO0FBQ3BDLDhDQUE0QztBQUM1QyxnREFBcUU7QUFDckUsOENBQW1EO0FBQ25ELGtFQUFtRTtBQUNuRSxxREFBc0U7QUFDdEUsaURBSTZCO0FBQzdCLHFEQUFzRDtBQUN0RCwyRkFBc0Y7QUFFdEYsTUFBTSxXQUFXLEdBQUcsZ0JBQTBDLENBQUM7QUFFeEQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxJQUFjLEVBQUUsTUFBc0I7SUFDckUsTUFBTSxFQUNKLEVBQUUsRUFDRixDQUFDLEVBQ0QsSUFBSSxHQUFHLEtBQUssRUFDWixRQUFRLEdBQUcsS0FBSyxFQUNoQixtQkFBbUIsR0FBRyxLQUFLLEVBQzNCLEdBQUcsSUFBSSxFQUNSLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRTtRQUNwQixPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixDQUFDO1FBQ3ZELEtBQUssRUFBRSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUU7S0FDN0IsQ0FBQyxDQUFDO0lBRUgsb0ZBQW9GO0lBQ3BGLE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFeEQsSUFBSSxTQUF1QyxDQUFDO0lBQzVDLElBQUksbUJBQXFDLENBQUM7SUFDMUMsSUFBSTtRQUNGLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ25ELElB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SUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbG9nZ2luZyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB5YXJncyBmcm9tICd5YXJncyc7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tICd5YXJncy9oZWxwZXJzJztcbmltcG9ydCB7XG4gIENvbW1hbmRDb25maWcsXG4gIENvbW1hbmROYW1lcyxcbiAgUm9vdENvbW1hbmRzLFxuICBSb290Q29tbWFuZHNBbGlhc2VzLFxufSBmcm9tICcuLi9jb21tYW5kcy9jb21tYW5kLWNvbmZpZyc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuLi91dGlsaXRpZXMvY29sb3InO1xuaW1wb3J0IHsgQW5ndWxhcldvcmtzcGFjZSwgZ2V0V29ya3NwYWNlIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NvbmZpZyc7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2Vycm9yJztcbmltcG9ydCB7IFBhY2thZ2VNYW5hZ2VyVXRpbHMgfSBmcm9tICcuLi91dGlsaXRpZXMvcGFja2FnZS1tYW5hZ2VyJztcbmltcG9ydCB7IENvbW1hbmRDb250ZXh0LCBDb21tYW5kTW9kdWxlRXJyb3IgfSBmcm9tICcuL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7XG4gIENvbW1hbmRNb2R1bGVDb25zdHJ1Y3RvcixcbiAgYWRkQ29tbWFuZE1vZHVsZVRvWWFyZ3MsXG4gIGRlbWFuZENvbW1hbmRGYWlsdXJlTWVzc2FnZSxcbn0gZnJvbSAnLi91dGlsaXRpZXMvY29tbWFuZCc7XG5pbXBvcnQgeyBqc29uSGVscFVzYWdlIH0gZnJvbSAnLi91dGlsaXRpZXMvanNvbi1oZWxwJztcbmltcG9ydCB7IG5vcm1hbGl6ZU9wdGlvbnNNaWRkbGV3YXJlIH0gZnJvbSAnLi91dGlsaXRpZXMvbm9ybWFsaXplLW9wdGlvbnMtbWlkZGxld2FyZSc7XG5cbmNvbnN0IHlhcmdzUGFyc2VyID0gUGFyc2VyIGFzIHVua25vd24gYXMgdHlwZW9mIFBhcnNlci5kZWZhdWx0O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuQ29tbWFuZChhcmdzOiBzdHJpbmdbXSwgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gIGNvbnN0IHtcbiAgICAkMCxcbiAgICBfLFxuICAgIGhlbHAgPSBmYWxzZSxcbiAgICBqc29uSGVscCA9IGZhbHNlLFxuICAgIGdldFlhcmdzQ29tcGxldGlvbnMgPSBmYWxzZSxcbiAgICAuLi5yZXN0XG4gIH0gPSB5YXJnc1BhcnNlcihhcmdzLCB7XG4gICAgYm9vbGVhbjogWydoZWxwJywgJ2pzb24taGVscCcsICdnZXQteWFyZ3MtY29tcGxldGlvbnMnXSxcbiAgICBhbGlhczogeyAnY29sbGVjdGlvbic6ICdjJyB9LFxuICB9KTtcblxuICAvLyBXaGVuIGBnZXRZYXJnc0NvbXBsZXRpb25zYCBpcyB0cnVlIHRoZSBzY3JpcHROYW1lICduZycgYXQgaW5kZXggMCBpcyBub3QgcmVtb3ZlZC5cbiAgY29uc3QgcG9zaXRpb25hbCA9IGdldFlhcmdzQ29tcGxldGlvbnMgPyBfLnNsaWNlKDEpIDogXztcblxuICBsZXQgd29ya3NwYWNlOiBBbmd1bGFyV29ya3NwYWNlIHwgdW5kZWZpbmVkO1xuICBsZXQgZ2xvYmFsQ29uZmlndXJhdGlvbjogQW5ndWxhcldvcmtzcGFjZTtcbiAgdHJ5IHtcbiAgICBbd29ya3NwYWNlLCBnbG9iYWxDb25maWd1cmF0aW9uXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIGdldFdvcmtzcGFjZSgnbG9jYWwnKSxcbiAgICAgIGdldFdvcmtzcGFjZSgnZ2xvYmFsJyksXG4gICAgXSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgIGxvZ2dlci5mYXRhbChlLm1lc3NhZ2UpO1xuXG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICBjb25zdCByb290ID0gd29ya3NwYWNlPy5iYXNlUGF0aCA/PyBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBjb250ZXh0OiBDb21tYW5kQ29udGV4dCA9IHtcbiAgICBnbG9iYWxDb25maWd1cmF0aW9uLFxuICAgIHdvcmtzcGFjZSxcbiAgICBsb2dnZXIsXG4gICAgY3VycmVudERpcmVjdG9yeTogcHJvY2Vzcy5jd2QoKSxcbiAgICByb290LFxuICAgIHBhY2thZ2VNYW5hZ2VyOiBuZXcgUGFja2FnZU1hbmFnZXJVdGlscyh7IGdsb2JhbENvbmZpZ3VyYXRpb24sIHdvcmtzcGFjZSwgcm9vdCB9KSxcbiAgICBhcmdzOiB7XG4gICAgICBwb3NpdGlvbmFsOiBwb3NpdGlvbmFsLm1hcCgodikgPT4gdi50b1N0cmluZygpKSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgaGVscCxcbiAgICAgICAganNvbkhlbHAsXG4gICAgICAgIGdldFlhcmdzQ29tcGxldGlvbnMsXG4gICAgICAgIC4uLnJlc3QsXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG5cbiAgbGV0IGxvY2FsWWFyZ3MgPSB5YXJncyhhcmdzKTtcbiAgZm9yIChjb25zdCBDb21tYW5kTW9kdWxlIG9mIGF3YWl0IGdldENvbW1hbmRzVG9SZWdpc3Rlcihwb3NpdGlvbmFsWzBdKSkge1xuICAgIGxvY2FsWWFyZ3MgPSBhZGRDb21tYW5kTW9kdWxlVG9ZYXJncyhsb2NhbFlhcmdzLCBDb21tYW5kTW9kdWxlLCBjb250ZXh0KTtcbiAgfVxuXG4gIGlmIChqc29uSGVscCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgdXNhZ2VJbnN0YW5jZSA9IChsb2NhbFlhcmdzIGFzIGFueSkuZ2V0SW50ZXJuYWxNZXRob2RzKCkuZ2V0VXNhZ2VJbnN0YW5jZSgpO1xuICAgIHVzYWdlSW5zdGFuY2UuaGVscCA9ICgpID0+IGpzb25IZWxwVXNhZ2UoKTtcbiAgfVxuXG4gIGF3YWl0IGxvY2FsWWFyZ3NcbiAgICAuc2NyaXB0TmFtZSgnbmcnKVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS95YXJncy95YXJncy9ibG9iL21haW4vZG9jcy9hZHZhbmNlZC5tZCNjdXN0b21pemluZy15YXJncy1wYXJzZXJcbiAgICAucGFyc2VyQ29uZmlndXJhdGlvbih7XG4gICAgICAncG9wdWxhdGUtLSc6IHRydWUsXG4gICAgICAndW5rbm93bi1vcHRpb25zLWFzLWFyZ3MnOiBmYWxzZSxcbiAgICAgICdkb3Qtbm90YXRpb24nOiBmYWxzZSxcbiAgICAgICdib29sZWFuLW5lZ2F0aW9uJzogdHJ1ZSxcbiAgICAgICdzdHJpcC1hbGlhc2VkJzogdHJ1ZSxcbiAgICAgICdzdHJpcC1kYXNoZWQnOiB0cnVlLFxuICAgICAgJ2NhbWVsLWNhc2UtZXhwYW5zaW9uJzogZmFsc2UsXG4gICAgfSlcbiAgICAub3B0aW9uKCdqc29uLWhlbHAnLCB7XG4gICAgICBkZXNjcmliZTogJ1Nob3cgaGVscCBpbiBKU09OIGZvcm1hdC4nLFxuICAgICAgaW1wbGllczogWydoZWxwJ10sXG4gICAgICBoaWRkZW46IHRydWUsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgfSlcbiAgICAuaGVscCgnaGVscCcsICdTaG93cyBhIGhlbHAgbWVzc2FnZSBmb3IgdGhpcyBjb21tYW5kIGluIHRoZSBjb25zb2xlLicpXG4gICAgLy8gQSBjb21wbGV0ZSBsaXN0IG9mIHN0cmluZ3MgY2FuIGJlIGZvdW5kOiBodHRwczovL2dpdGh1Yi5jb20veWFyZ3MveWFyZ3MvYmxvYi9tYWluL2xvY2FsZXMvZW4uanNvblxuICAgIC51cGRhdGVTdHJpbmdzKHtcbiAgICAgICdDb21tYW5kczonOiBjb2xvcnMuY3lhbignQ29tbWFuZHM6JyksXG4gICAgICAnT3B0aW9uczonOiBjb2xvcnMuY3lhbignT3B0aW9uczonKSxcbiAgICAgICdQb3NpdGlvbmFsczonOiBjb2xvcnMuY3lhbignQXJndW1lbnRzOicpLFxuICAgICAgJ2RlcHJlY2F0ZWQnOiBjb2xvcnMueWVsbG93KCdkZXByZWNhdGVkJyksXG4gICAgICAnZGVwcmVjYXRlZDogJXMnOiBjb2xvcnMueWVsbG93KCdkZXByZWNhdGVkOicpICsgJyAlcycsXG4gICAgICAnRGlkIHlvdSBtZWFuICVzPyc6ICdVbmtub3duIGNvbW1hbmQuIERpZCB5b3UgbWVhbiAlcz8nLFxuICAgIH0pXG4gICAgLmVwaWxvZ3VlKCdGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9jbGkvLlxcbicpXG4gICAgLmRlbWFuZENvbW1hbmQoMSwgZGVtYW5kQ29tbWFuZEZhaWx1cmVNZXNzYWdlKVxuICAgIC5yZWNvbW1lbmRDb21tYW5kcygpXG4gICAgLm1pZGRsZXdhcmUobm9ybWFsaXplT3B0aW9uc01pZGRsZXdhcmUpXG4gICAgLnZlcnNpb24oZmFsc2UpXG4gICAgLnNob3dIZWxwT25GYWlsKGZhbHNlKVxuICAgIC5zdHJpY3QoKVxuICAgIC5mYWlsKChtc2csIGVycikgPT4ge1xuICAgICAgdGhyb3cgbXNnXG4gICAgICAgID8gLy8gVmFsaWRhdGlvbiBmYWlsZWQgZXhhbXBsZTogYFVua25vd24gYXJndW1lbnQ6YFxuICAgICAgICAgIG5ldyBDb21tYW5kTW9kdWxlRXJyb3IobXNnKVxuICAgICAgICA6IC8vIFVua25vd24gZXhjZXB0aW9uLCByZS10aHJvdy5cbiAgICAgICAgICBlcnI7XG4gICAgfSlcbiAgICAud3JhcCh5YXJncy50ZXJtaW5hbFdpZHRoKCkpXG4gICAgLnBhcnNlQXN5bmMoKTtcblxuICByZXR1cm4gcHJvY2Vzcy5leGl0Q29kZSA/PyAwO1xufVxuXG4vKipcbiAqIEdldCB0aGUgY29tbWFuZHMgdGhhdCBuZWVkIHRvIGJlIHJlZ2lzdGVyZWQuXG4gKiBAcmV0dXJucyBPbmUgb3IgbW9yZSBjb21tYW5kIGZhY3RvcmllcyB0aGF0IG5lZWRzIHRvIGJlIHJlZ2lzdGVyZWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdldENvbW1hbmRzVG9SZWdpc3RlcihcbiAgY29tbWFuZE5hbWU6IHN0cmluZyB8IG51bWJlcixcbik6IFByb21pc2U8Q29tbWFuZE1vZHVsZUNvbnN0cnVjdG9yW10+IHtcbiAgY29uc3QgY29tbWFuZHM6IENvbW1hbmRDb25maWdbXSA9IFtdO1xuICBpZiAoY29tbWFuZE5hbWUgaW4gUm9vdENvbW1hbmRzKSB7XG4gICAgY29tbWFuZHMucHVzaChSb290Q29tbWFuZHNbY29tbWFuZE5hbWUgYXMgQ29tbWFuZE5hbWVzXSk7XG4gIH0gZWxzZSBpZiAoY29tbWFuZE5hbWUgaW4gUm9vdENvbW1hbmRzQWxpYXNlcykge1xuICAgIGNvbW1hbmRzLnB1c2goUm9vdENvbW1hbmRzQWxpYXNlc1tjb21tYW5kTmFtZV0pO1xuICB9IGVsc2Uge1xuICAgIC8vIFVua25vd24gY29tbWFuZCwgcmVnaXN0ZXIgZXZlcnkgcG9zc2libGUgY29tbWFuZC5cbiAgICBPYmplY3QudmFsdWVzKFJvb3RDb21tYW5kcykuZm9yRWFjaCgoYykgPT4gY29tbWFuZHMucHVzaChjKSk7XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5hbGwoY29tbWFuZHMubWFwKChjb21tYW5kKSA9PiBjb21tYW5kLmZhY3RvcnkoKS50aGVuKChtKSA9PiBtLmRlZmF1bHQpKSk7XG59XG4iXX0=