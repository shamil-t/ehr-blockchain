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
exports.jsonHelpUsage = void 0;
const yargs_1 = __importDefault(require("yargs"));
const yargsDefaultCommandRegExp = /^\$0|\*/;
function jsonHelpUsage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localYargs = yargs_1.default;
    const { deprecatedOptions, alias: aliases, array, string, boolean, number, choices, demandedOptions, default: defaultVal, hiddenOptions = [], } = localYargs.getOptions();
    const internalMethods = localYargs.getInternalMethods();
    const usageInstance = internalMethods.getUsageInstance();
    const context = internalMethods.getContext();
    const descriptions = usageInstance.getDescriptions();
    const groups = localYargs.getGroups();
    const positional = groups[usageInstance.getPositionalGroupName()];
    const hidden = new Set(hiddenOptions);
    const normalizeOptions = [];
    const allAliases = new Set([...Object.values(aliases).flat()]);
    for (const [names, type] of [
        [array, 'array'],
        [string, 'string'],
        [boolean, 'boolean'],
        [number, 'number'],
    ]) {
        for (const name of names) {
            if (allAliases.has(name) || hidden.has(name)) {
                // Ignore hidden, aliases and already visited option.
                continue;
            }
            const positionalIndex = positional?.indexOf(name) ?? -1;
            const alias = aliases[name];
            normalizeOptions.push({
                name,
                type,
                deprecated: deprecatedOptions[name],
                aliases: alias?.length > 0 ? alias : undefined,
                default: defaultVal[name],
                required: demandedOptions[name],
                enum: choices[name],
                description: descriptions[name]?.replace('__yargsString__:', ''),
                positional: positionalIndex >= 0 ? positionalIndex : undefined,
            });
        }
    }
    // https://github.com/yargs/yargs/blob/00e4ebbe3acd438e73fdb101e75b4f879eb6d345/lib/usage.ts#L124
    const subcommands = usageInstance.getCommands()
        .map(([name, rawDescription, isDefault, aliases, deprecated]) => ({
        name: name.split(' ', 1)[0].replace(yargsDefaultCommandRegExp, ''),
        command: name.replace(yargsDefaultCommandRegExp, ''),
        default: isDefault || undefined,
        ...parseDescription(rawDescription),
        aliases,
        deprecated,
    }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const [command, rawDescription] = usageInstance.getUsage()[0] ?? [];
    const defaultSubCommand = subcommands.find((x) => x.default)?.command ?? '';
    const otherSubcommands = subcommands.filter((s) => !s.default);
    const output = {
        name: [...context.commands].pop(),
        command: `${command?.replace(yargsDefaultCommandRegExp, localYargs['$0'])}${defaultSubCommand}`,
        ...parseDescription(rawDescription),
        options: normalizeOptions.sort((a, b) => a.name.localeCompare(b.name)),
        subcommands: otherSubcommands.length ? otherSubcommands : undefined,
    };
    return JSON.stringify(output, undefined, 2);
}
exports.jsonHelpUsage = jsonHelpUsage;
function parseDescription(rawDescription) {
    try {
        const { longDescription, describe: shortDescription, longDescriptionRelativePath, } = JSON.parse(rawDescription);
        return {
            shortDescription,
            longDescriptionRelativePath,
            longDescription,
        };
    }
    catch {
        return {
            shortDescription: rawDescription,
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1oZWxwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvanNvbi1oZWxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILGtEQUEwQjtBQWtDMUIsTUFBTSx5QkFBeUIsR0FBRyxTQUFTLENBQUM7QUFFNUMsU0FBZ0IsYUFBYTtJQUMzQiw4REFBOEQ7SUFDOUQsTUFBTSxVQUFVLEdBQUcsZUFBWSxDQUFDO0lBQ2hDLE1BQU0sRUFDSixpQkFBaUIsRUFDakIsS0FBSyxFQUFFLE9BQU8sRUFDZCxLQUFLLEVBQ0wsTUFBTSxFQUNOLE9BQU8sRUFDUCxNQUFNLEVBQ04sT0FBTyxFQUNQLGVBQWUsRUFDZixPQUFPLEVBQUUsVUFBVSxFQUNuQixhQUFhLEdBQUcsRUFBRSxHQUNuQixHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUU1QixNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUN4RCxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUN6RCxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDN0MsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3JELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN0QyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLHNCQUFzQixFQUFFLENBQXlCLENBQUM7SUFFMUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDdEMsTUFBTSxnQkFBZ0IsR0FBcUIsRUFBRSxDQUFDO0lBQzlDLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFXLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV6RSxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDMUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDO1FBQ2hCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztRQUNsQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDcEIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO0tBQ25CLEVBQUU7UUFDRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN4QixJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDNUMscURBQXFEO2dCQUNyRCxTQUFTO2FBQ1Y7WUFFRCxNQUFNLGVBQWUsR0FBRyxVQUFVLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU1QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ3BCLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixVQUFVLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDO2dCQUNuQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDOUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pCLFFBQVEsRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUMvQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDbkIsV0FBVyxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUNoRSxVQUFVLEVBQUUsZUFBZSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQy9ELENBQUMsQ0FBQztTQUNKO0tBQ0Y7SUFFRCxpR0FBaUc7SUFDakcsTUFBTSxXQUFXLEdBQ2YsYUFBYSxDQUFDLFdBQVcsRUFPMUI7U0FDRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQztRQUNsRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLENBQUM7UUFDcEQsT0FBTyxFQUFFLFNBQVMsSUFBSSxTQUFTO1FBQy9CLEdBQUcsZ0JBQWdCLENBQUMsY0FBYyxDQUFDO1FBQ25DLE9BQU87UUFDUCxVQUFVO0tBQ1gsQ0FBQyxDQUFDO1NBQ0YsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFaEQsTUFBTSxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BFLE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7SUFDNUUsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUvRCxNQUFNLE1BQU0sR0FBYTtRQUN2QixJQUFJLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUU7UUFDakMsT0FBTyxFQUFFLEdBQUcsT0FBTyxFQUFFLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsRUFBRTtRQUMvRixHQUFHLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztRQUNuQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxTQUFTO0tBQ3BFLENBQUM7SUFFRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBekZELHNDQXlGQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsY0FBc0I7SUFDOUMsSUFBSTtRQUNGLE1BQU0sRUFDSixlQUFlLEVBQ2YsUUFBUSxFQUFFLGdCQUFnQixFQUMxQiwyQkFBMkIsR0FDNUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBaUIsQ0FBQztRQUUvQyxPQUFPO1lBQ0wsZ0JBQWdCO1lBQ2hCLDJCQUEyQjtZQUMzQixlQUFlO1NBQ2hCLENBQUM7S0FDSDtJQUFDLE1BQU07UUFDTixPQUFPO1lBQ0wsZ0JBQWdCLEVBQUUsY0FBYztTQUNqQyxDQUFDO0tBQ0g7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB5YXJncyBmcm9tICd5YXJncyc7XG5pbXBvcnQgeyBGdWxsRGVzY3JpYmUgfSBmcm9tICcuLi9jb21tYW5kLW1vZHVsZSc7XG5cbmludGVyZmFjZSBKc29uSGVscE9wdGlvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZT86IHN0cmluZztcbiAgZGVwcmVjYXRlZDogYm9vbGVhbiB8IHN0cmluZztcbiAgYWxpYXNlcz86IHN0cmluZ1tdO1xuICBkZWZhdWx0Pzogc3RyaW5nO1xuICByZXF1aXJlZD86IGJvb2xlYW47XG4gIHBvc2l0aW9uYWw/OiBudW1iZXI7XG4gIGVudW0/OiBzdHJpbmdbXTtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBKc29uSGVscERlc2NyaXB0aW9uIHtcbiAgc2hvcnREZXNjcmlwdGlvbj86IHN0cmluZztcbiAgbG9uZ0Rlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBsb25nRGVzY3JpcHRpb25SZWxhdGl2ZVBhdGg/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBKc29uSGVscFN1YmNvbW1hbmQgZXh0ZW5kcyBKc29uSGVscERlc2NyaXB0aW9uIHtcbiAgbmFtZTogc3RyaW5nO1xuICBhbGlhc2VzOiBzdHJpbmdbXTtcbiAgZGVwcmVjYXRlZDogc3RyaW5nIHwgYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBKc29uSGVscCBleHRlbmRzIEpzb25IZWxwRGVzY3JpcHRpb24ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbW1hbmQ6IHN0cmluZztcbiAgb3B0aW9uczogSnNvbkhlbHBPcHRpb25bXTtcbiAgc3ViY29tbWFuZHM/OiBKc29uSGVscFN1YmNvbW1hbmRbXTtcbn1cblxuY29uc3QgeWFyZ3NEZWZhdWx0Q29tbWFuZFJlZ0V4cCA9IC9eXFwkMHxcXCovO1xuXG5leHBvcnQgZnVuY3Rpb24ganNvbkhlbHBVc2FnZSgpOiBzdHJpbmcge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBjb25zdCBsb2NhbFlhcmdzID0geWFyZ3MgYXMgYW55O1xuICBjb25zdCB7XG4gICAgZGVwcmVjYXRlZE9wdGlvbnMsXG4gICAgYWxpYXM6IGFsaWFzZXMsXG4gICAgYXJyYXksXG4gICAgc3RyaW5nLFxuICAgIGJvb2xlYW4sXG4gICAgbnVtYmVyLFxuICAgIGNob2ljZXMsXG4gICAgZGVtYW5kZWRPcHRpb25zLFxuICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgaGlkZGVuT3B0aW9ucyA9IFtdLFxuICB9ID0gbG9jYWxZYXJncy5nZXRPcHRpb25zKCk7XG5cbiAgY29uc3QgaW50ZXJuYWxNZXRob2RzID0gbG9jYWxZYXJncy5nZXRJbnRlcm5hbE1ldGhvZHMoKTtcbiAgY29uc3QgdXNhZ2VJbnN0YW5jZSA9IGludGVybmFsTWV0aG9kcy5nZXRVc2FnZUluc3RhbmNlKCk7XG4gIGNvbnN0IGNvbnRleHQgPSBpbnRlcm5hbE1ldGhvZHMuZ2V0Q29udGV4dCgpO1xuICBjb25zdCBkZXNjcmlwdGlvbnMgPSB1c2FnZUluc3RhbmNlLmdldERlc2NyaXB0aW9ucygpO1xuICBjb25zdCBncm91cHMgPSBsb2NhbFlhcmdzLmdldEdyb3VwcygpO1xuICBjb25zdCBwb3NpdGlvbmFsID0gZ3JvdXBzW3VzYWdlSW5zdGFuY2UuZ2V0UG9zaXRpb25hbEdyb3VwTmFtZSgpXSBhcyBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcblxuICBjb25zdCBoaWRkZW4gPSBuZXcgU2V0KGhpZGRlbk9wdGlvbnMpO1xuICBjb25zdCBub3JtYWxpemVPcHRpb25zOiBKc29uSGVscE9wdGlvbltdID0gW107XG4gIGNvbnN0IGFsbEFsaWFzZXMgPSBuZXcgU2V0KFsuLi5PYmplY3QudmFsdWVzPHN0cmluZ1tdPihhbGlhc2VzKS5mbGF0KCldKTtcblxuICBmb3IgKGNvbnN0IFtuYW1lcywgdHlwZV0gb2YgW1xuICAgIFthcnJheSwgJ2FycmF5J10sXG4gICAgW3N0cmluZywgJ3N0cmluZyddLFxuICAgIFtib29sZWFuLCAnYm9vbGVhbiddLFxuICAgIFtudW1iZXIsICdudW1iZXInXSxcbiAgXSkge1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgaWYgKGFsbEFsaWFzZXMuaGFzKG5hbWUpIHx8IGhpZGRlbi5oYXMobmFtZSkpIHtcbiAgICAgICAgLy8gSWdub3JlIGhpZGRlbiwgYWxpYXNlcyBhbmQgYWxyZWFkeSB2aXNpdGVkIG9wdGlvbi5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBvc2l0aW9uYWxJbmRleCA9IHBvc2l0aW9uYWw/LmluZGV4T2YobmFtZSkgPz8gLTE7XG4gICAgICBjb25zdCBhbGlhcyA9IGFsaWFzZXNbbmFtZV07XG5cbiAgICAgIG5vcm1hbGl6ZU9wdGlvbnMucHVzaCh7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGRlcHJlY2F0ZWRPcHRpb25zW25hbWVdLFxuICAgICAgICBhbGlhc2VzOiBhbGlhcz8ubGVuZ3RoID4gMCA/IGFsaWFzIDogdW5kZWZpbmVkLFxuICAgICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsW25hbWVdLFxuICAgICAgICByZXF1aXJlZDogZGVtYW5kZWRPcHRpb25zW25hbWVdLFxuICAgICAgICBlbnVtOiBjaG9pY2VzW25hbWVdLFxuICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25zW25hbWVdPy5yZXBsYWNlKCdfX3lhcmdzU3RyaW5nX186JywgJycpLFxuICAgICAgICBwb3NpdGlvbmFsOiBwb3NpdGlvbmFsSW5kZXggPj0gMCA/IHBvc2l0aW9uYWxJbmRleCA6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS95YXJncy95YXJncy9ibG9iLzAwZTRlYmJlM2FjZDQzOGU3M2ZkYjEwMWU3NWI0Zjg3OWViNmQzNDUvbGliL3VzYWdlLnRzI0wxMjRcbiAgY29uc3Qgc3ViY29tbWFuZHMgPSAoXG4gICAgdXNhZ2VJbnN0YW5jZS5nZXRDb21tYW5kcygpIGFzIFtcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICBpc0RlZmF1bHQ6IGJvb2xlYW4sXG4gICAgICBhbGlhc2VzOiBzdHJpbmdbXSxcbiAgICAgIGRlcHJlY2F0ZWQ6IHN0cmluZyB8IGJvb2xlYW4sXG4gICAgXVtdXG4gIClcbiAgICAubWFwKChbbmFtZSwgcmF3RGVzY3JpcHRpb24sIGlzRGVmYXVsdCwgYWxpYXNlcywgZGVwcmVjYXRlZF0pID0+ICh7XG4gICAgICBuYW1lOiBuYW1lLnNwbGl0KCcgJywgMSlbMF0ucmVwbGFjZSh5YXJnc0RlZmF1bHRDb21tYW5kUmVnRXhwLCAnJyksXG4gICAgICBjb21tYW5kOiBuYW1lLnJlcGxhY2UoeWFyZ3NEZWZhdWx0Q29tbWFuZFJlZ0V4cCwgJycpLFxuICAgICAgZGVmYXVsdDogaXNEZWZhdWx0IHx8IHVuZGVmaW5lZCxcbiAgICAgIC4uLnBhcnNlRGVzY3JpcHRpb24ocmF3RGVzY3JpcHRpb24pLFxuICAgICAgYWxpYXNlcyxcbiAgICAgIGRlcHJlY2F0ZWQsXG4gICAgfSkpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpO1xuXG4gIGNvbnN0IFtjb21tYW5kLCByYXdEZXNjcmlwdGlvbl0gPSB1c2FnZUluc3RhbmNlLmdldFVzYWdlKClbMF0gPz8gW107XG4gIGNvbnN0IGRlZmF1bHRTdWJDb21tYW5kID0gc3ViY29tbWFuZHMuZmluZCgoeCkgPT4geC5kZWZhdWx0KT8uY29tbWFuZCA/PyAnJztcbiAgY29uc3Qgb3RoZXJTdWJjb21tYW5kcyA9IHN1YmNvbW1hbmRzLmZpbHRlcigocykgPT4gIXMuZGVmYXVsdCk7XG5cbiAgY29uc3Qgb3V0cHV0OiBKc29uSGVscCA9IHtcbiAgICBuYW1lOiBbLi4uY29udGV4dC5jb21tYW5kc10ucG9wKCksXG4gICAgY29tbWFuZDogYCR7Y29tbWFuZD8ucmVwbGFjZSh5YXJnc0RlZmF1bHRDb21tYW5kUmVnRXhwLCBsb2NhbFlhcmdzWyckMCddKX0ke2RlZmF1bHRTdWJDb21tYW5kfWAsXG4gICAgLi4ucGFyc2VEZXNjcmlwdGlvbihyYXdEZXNjcmlwdGlvbiksXG4gICAgb3B0aW9uczogbm9ybWFsaXplT3B0aW9ucy5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKSxcbiAgICBzdWJjb21tYW5kczogb3RoZXJTdWJjb21tYW5kcy5sZW5ndGggPyBvdGhlclN1YmNvbW1hbmRzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShvdXRwdXQsIHVuZGVmaW5lZCwgMik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVzY3JpcHRpb24ocmF3RGVzY3JpcHRpb246IHN0cmluZyk6IEpzb25IZWxwRGVzY3JpcHRpb24ge1xuICB0cnkge1xuICAgIGNvbnN0IHtcbiAgICAgIGxvbmdEZXNjcmlwdGlvbixcbiAgICAgIGRlc2NyaWJlOiBzaG9ydERlc2NyaXB0aW9uLFxuICAgICAgbG9uZ0Rlc2NyaXB0aW9uUmVsYXRpdmVQYXRoLFxuICAgIH0gPSBKU09OLnBhcnNlKHJhd0Rlc2NyaXB0aW9uKSBhcyBGdWxsRGVzY3JpYmU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2hvcnREZXNjcmlwdGlvbixcbiAgICAgIGxvbmdEZXNjcmlwdGlvblJlbGF0aXZlUGF0aCxcbiAgICAgIGxvbmdEZXNjcmlwdGlvbixcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2hvcnREZXNjcmlwdGlvbjogcmF3RGVzY3JpcHRpb24sXG4gICAgfTtcbiAgfVxufVxuIl19