"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const path_1 = require("path");
const command_module_1 = require("../../command-builder/command-module");
const config_1 = require("../../utilities/config");
const json_file_1 = require("../../utilities/json-file");
class ConfigCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'config [json-path] [value]';
        this.describe = 'Retrieves or sets Angular configuration values in the angular.json file for the workspace.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
    builder(localYargs) {
        return localYargs
            .positional('json-path', {
            description: `The configuration key to set or query, in JSON path format. ` +
                `For example: "a[3].foo.bar[2]". If no new value is provided, returns the current value of this key.`,
            type: 'string',
        })
            .positional('value', {
            description: 'If provided, a new value for the given configuration key.',
            type: 'string',
        })
            .option('global', {
            description: `Access the global configuration in the caller's home directory.`,
            alias: ['g'],
            type: 'boolean',
            default: false,
        })
            .strict();
    }
    async run(options) {
        const level = options.global ? 'global' : 'local';
        const [config] = await (0, config_1.getWorkspaceRaw)(level);
        if (options.value == undefined) {
            if (!config) {
                this.context.logger.error('No config found.');
                return 1;
            }
            return this.get(config, options);
        }
        else {
            return this.set(options);
        }
    }
    get(jsonFile, options) {
        const { logger } = this.context;
        const value = options.jsonPath
            ? jsonFile.get(parseJsonPath(options.jsonPath))
            : jsonFile.content;
        if (value === undefined) {
            logger.error('Value cannot be found.');
            return 1;
        }
        else if (typeof value === 'string') {
            logger.info(value);
        }
        else {
            logger.info(JSON.stringify(value, null, 2));
        }
        return 0;
    }
    async set(options) {
        if (!options.jsonPath?.trim()) {
            throw new command_module_1.CommandModuleError('Invalid Path.');
        }
        const [config, configPath] = await (0, config_1.getWorkspaceRaw)(options.global ? 'global' : 'local');
        const { logger } = this.context;
        if (!config || !configPath) {
            throw new command_module_1.CommandModuleError('Confguration file cannot be found.');
        }
        const normalizeUUIDValue = (v) => (v === '' ? (0, crypto_1.randomUUID)() : `${v}`);
        const value = options.jsonPath === 'cli.analyticsSharing.uuid'
            ? normalizeUUIDValue(options.value)
            : options.value;
        const modified = config.modify(parseJsonPath(options.jsonPath), normalizeValue(value));
        if (!modified) {
            logger.error('Value cannot be found.');
            return 1;
        }
        await (0, config_1.validateWorkspace)((0, json_file_1.parseJson)(config.content), options.global ?? false);
        config.save();
        return 0;
    }
}
exports.default = ConfigCommandModule;
/**
 * Splits a JSON path string into fragments. Fragments can be used to get the value referenced
 * by the path. For example, a path of "a[3].foo.bar[2]" would give you a fragment array of
 * ["a", 3, "foo", "bar", 2].
 * @param path The JSON string to parse.
 * @returns {(string|number)[]} The fragments for the string.
 * @private
 */
function parseJsonPath(path) {
    const fragments = (path || '').split(/\./g);
    const result = [];
    while (fragments.length > 0) {
        const fragment = fragments.shift();
        if (fragment == undefined) {
            break;
        }
        const match = fragment.match(/([^[]+)((\[.*\])*)/);
        if (!match) {
            throw new command_module_1.CommandModuleError('Invalid JSON path.');
        }
        result.push(match[1]);
        if (match[2]) {
            const indices = match[2]
                .slice(1, -1)
                .split('][')
                .map((x) => (/^\d$/.test(x) ? +x : x.replace(/"|'/g, '')));
            result.push(...indices);
        }
    }
    return result.filter((fragment) => fragment != null);
}
function normalizeValue(value) {
    const valueString = `${value}`.trim();
    switch (valueString) {
        case 'true':
            return true;
        case 'false':
            return false;
        case 'null':
            return null;
        case 'undefined':
            return undefined;
    }
    if (isFinite(+valueString)) {
        return +valueString;
    }
    try {
        // We use `JSON.parse` instead of `parseJson` because the latter will parse UUIDs
        // and convert them into a numberic entities.
        // Example: 73b61974-182c-48e4-b4c6-30ddf08c5c98 -> 73.
        // These values should never contain comments, therefore using `JSON.parse` is safe.
        return JSON.parse(valueString);
    }
    catch {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NvbmZpZy9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFHSCxtQ0FBb0M7QUFDcEMsK0JBQTRCO0FBRTVCLHlFQUs4QztBQUM5QyxtREFBNEU7QUFDNUUseURBQWdFO0FBUWhFLE1BQXFCLG1CQUNuQixTQUFRLDhCQUFnQztJQUQxQzs7UUFJRSxZQUFPLEdBQUcsNEJBQTRCLENBQUM7UUFDdkMsYUFBUSxHQUNOLDRGQUE0RixDQUFDO1FBQy9GLHdCQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBNkYvRCxDQUFDO0lBM0ZDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVU7YUFDZCxVQUFVLENBQUMsV0FBVyxFQUFFO1lBQ3ZCLFdBQVcsRUFDVCw4REFBOEQ7Z0JBQzlELHFHQUFxRztZQUN2RyxJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUM7YUFDRCxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ25CLFdBQVcsRUFBRSwyREFBMkQ7WUFDeEUsSUFBSSxFQUFFLFFBQVE7U0FDZixDQUFDO2FBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUNoQixXQUFXLEVBQUUsaUVBQWlFO1lBQzlFLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNaLElBQUksRUFBRSxTQUFTO1lBQ2YsT0FBTyxFQUFFLEtBQUs7U0FDZixDQUFDO2FBQ0QsTUFBTSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFtQztRQUMzQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNsRCxNQUFNLENBQUMs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QUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7U0FDekI7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxLQUE0QztJQUNsRSxNQUFNLFdBQVcsR0FBRyxHQUFHLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3RDLFFBQVEsV0FBVyxFQUFFO1FBQ25CLEtBQUssTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDO1FBQ2QsS0FBSyxPQUFPO1lBQ1YsT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLE1BQU07WUFDVCxPQUFPLElBQUksQ0FBQztRQUNkLEtBQUssV0FBVztZQUNkLE9BQU8sU0FBUyxDQUFDO0tBQ3BCO0lBRUQsSUFBSSxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUMxQixPQUFPLENBQUMsV0FBVyxDQUFDO0tBQ3JCO0lBRUQsSUFBSTtRQUNGLGlGQUFpRjtRQUNqRiw2Q0FBNkM7UUFDN0MsdURBQXVEO1FBQ3ZELG9GQUFvRjtRQUNwRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDaEM7SUFBQyxNQUFNO1FBQ04sT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgSnNvblZhbHVlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZSxcbiAgQ29tbWFuZE1vZHVsZUVycm9yLFxuICBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24sXG4gIE9wdGlvbnMsXG59IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2VSYXcsIHZhbGlkYXRlV29ya3NwYWNlIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2NvbmZpZyc7XG5pbXBvcnQgeyBKU09ORmlsZSwgcGFyc2VKc29uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2pzb24tZmlsZSc7XG5cbmludGVyZmFjZSBDb25maWdDb21tYW5kQXJncyB7XG4gICdqc29uLXBhdGgnPzogc3RyaW5nO1xuICB2YWx1ZT86IHN0cmluZztcbiAgZ2xvYmFsPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlnQ29tbWFuZE1vZHVsZVxuICBleHRlbmRzIENvbW1hbmRNb2R1bGU8Q29uZmlnQ29tbWFuZEFyZ3M+XG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uPENvbmZpZ0NvbW1hbmRBcmdzPlxue1xuICBjb21tYW5kID0gJ2NvbmZpZyBbanNvbi1wYXRoXSBbdmFsdWVdJztcbiAgZGVzY3JpYmUgPVxuICAgICdSZXRyaWV2ZXMgb3Igc2V0cyBBbmd1bGFyIGNvbmZpZ3VyYXRpb24gdmFsdWVzIGluIHRoZSBhbmd1bGFyLmpzb24gZmlsZSBmb3IgdGhlIHdvcmtzcGFjZS4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoID0gam9pbihfX2Rpcm5hbWUsICdsb25nLWRlc2NyaXB0aW9uLm1kJyk7XG5cbiAgYnVpbGRlcihsb2NhbFlhcmdzOiBBcmd2KTogQXJndjxDb25maWdDb21tYW5kQXJncz4ge1xuICAgIHJldHVybiBsb2NhbFlhcmdzXG4gICAgICAucG9zaXRpb25hbCgnanNvbi1wYXRoJywge1xuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICBgVGhlIGNvbmZpZ3VyYXRpb24ga2V5IHRvIHNldCBvciBxdWVyeSwgaW4gSlNPTiBwYXRoIGZvcm1hdC4gYCArXG4gICAgICAgICAgYEZvciBleGFtcGxlOiBcImFbM10uZm9vLmJhclsyXVwiLiBJZiBubyBuZXcgdmFsdWUgaXMgcHJvdmlkZWQsIHJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhpcyBrZXkuYCxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICB9KVxuICAgICAgLnBvc2l0aW9uYWwoJ3ZhbHVlJywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0lmIHByb3ZpZGVkLCBhIG5ldyB2YWx1ZSBmb3IgdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24ga2V5LicsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ2dsb2JhbCcsIHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBBY2Nlc3MgdGhlIGdsb2JhbCBjb25maWd1cmF0aW9uIGluIHRoZSBjYWxsZXIncyBob21lIGRpcmVjdG9yeS5gLFxuICAgICAgICBhbGlhczogWydnJ10sXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9KVxuICAgICAgLnN0cmljdCgpO1xuICB9XG5cbiAgYXN5bmMgcnVuKG9wdGlvbnM6IE9wdGlvbnM8Q29uZmlnQ29tbWFuZEFyZ3M+KTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgY29uc3QgbGV2ZWwgPSBvcHRpb25zLmdsb2JhbCA/ICdnbG9iYWwnIDogJ2xvY2FsJztcbiAgICBjb25zdCBbY29uZmlnXSA9IGF3YWl0IGdldFdvcmtzcGFjZVJhdyhsZXZlbCk7XG5cbiAgICBpZiAob3B0aW9ucy52YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIuZXJyb3IoJ05vIGNvbmZpZyBmb3VuZC4nKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0KGNvbmZpZywgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldChvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldChqc29uRmlsZTogSlNPTkZpbGUsIG9wdGlvbnM6IE9wdGlvbnM8Q29uZmlnQ29tbWFuZEFyZ3M+KTogbnVtYmVyIHtcbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdGhpcy5jb250ZXh0O1xuXG4gICAgY29uc3QgdmFsdWUgPSBvcHRpb25zLmpzb25QYXRoXG4gICAgICA/IGpzb25GaWxlLmdldChwYXJzZUpzb25QYXRoKG9wdGlvbnMuanNvblBhdGgpKVxuICAgICAgOiBqc29uRmlsZS5jb250ZW50O1xuXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignVmFsdWUgY2Fubm90IGJlIGZvdW5kLicpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxvZ2dlci5pbmZvKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmluZm8oSlNPTi5zdHJpbmdpZnkodmFsdWUsIG51bGwsIDIpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2V0KG9wdGlvbnM6IE9wdGlvbnM8Q29uZmlnQ29tbWFuZEFyZ3M+KTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgaWYgKCFvcHRpb25zLmpzb25QYXRoPy50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoJ0ludmFsaWQgUGF0aC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBbY29uZmlnLCBjb25maWdQYXRoXSA9IGF3YWl0IGdldFdvcmtzcGFjZVJhdyhvcHRpb25zLmdsb2JhbCA/ICdnbG9iYWwnIDogJ2xvY2FsJyk7XG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcblxuICAgIGlmICghY29uZmlnIHx8ICFjb25maWdQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZE1vZHVsZUVycm9yKCdDb25mZ3VyYXRpb24gZmlsZSBjYW5ub3QgYmUgZm91bmQuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplVVVJRFZhbHVlID0gKHY6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4gKHYgPT09ICcnID8gcmFuZG9tVVVJRCgpIDogYCR7dn1gKTtcblxuICAgIGNvbnN0IHZhbHVlID1cbiAgICAgIG9wdGlvbnMuanNvblBhdGggPT09ICdjbGkuYW5hbHl0aWNzU2hhcmluZy51dWlkJ1xuICAgICAgICA/IG5vcm1hbGl6ZVVVSURWYWx1ZShvcHRpb25zLnZhbHVlKVxuICAgICAgICA6IG9wdGlvbnMudmFsdWU7XG5cbiAgICBjb25zdCBtb2RpZmllZCA9IGNvbmZpZy5tb2RpZnkocGFyc2VKc29uUGF0aChvcHRpb25zLmpzb25QYXRoKSwgbm9ybWFsaXplVmFsdWUodmFsdWUpKTtcblxuICAgIGlmICghbW9kaWZpZWQpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignVmFsdWUgY2Fubm90IGJlIGZvdW5kLicpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBhd2FpdCB2YWxpZGF0ZVdvcmtzcGFjZShwYXJzZUpzb24oY29uZmlnLmNvbnRlbnQpLCBvcHRpb25zLmdsb2JhbCA/PyBmYWxzZSk7XG5cbiAgICBjb25maWcuc2F2ZSgpO1xuXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuLyoqXG4gKiBTcGxpdHMgYSBKU09OIHBhdGggc3RyaW5nIGludG8gZnJhZ21lbnRzLiBGcmFnbWVudHMgY2FuIGJlIHVzZWQgdG8gZ2V0IHRoZSB2YWx1ZSByZWZlcmVuY2VkXG4gKiBieSB0aGUgcGF0aC4gRm9yIGV4YW1wbGUsIGEgcGF0aCBvZiBcImFbM10uZm9vLmJhclsyXVwiIHdvdWxkIGdpdmUgeW91IGEgZnJhZ21lbnQgYXJyYXkgb2ZcbiAqIFtcImFcIiwgMywgXCJmb29cIiwgXCJiYXJcIiwgMl0uXG4gKiBAcGFyYW0gcGF0aCBUaGUgSlNPTiBzdHJpbmcgdG8gcGFyc2UuXG4gKiBAcmV0dXJucyB7KHN0cmluZ3xudW1iZXIpW119IFRoZSBmcmFnbWVudHMgZm9yIHRoZSBzdHJpbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwYXJzZUpzb25QYXRoKHBhdGg6IHN0cmluZyk6IChzdHJpbmcgfCBudW1iZXIpW10ge1xuICBjb25zdCBmcmFnbWVudHMgPSAocGF0aCB8fCAnJykuc3BsaXQoL1xcLi9nKTtcbiAgY29uc3QgcmVzdWx0OiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gW107XG5cbiAgd2hpbGUgKGZyYWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBmcmFnbWVudHMuc2hpZnQoKTtcbiAgICBpZiAoZnJhZ21lbnQgPT0gdW5kZWZpbmVkKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaCA9IGZyYWdtZW50Lm1hdGNoKC8oW15bXSspKChcXFsuKlxcXSkqKS8pO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHRocm93IG5ldyBDb21tYW5kTW9kdWxlRXJyb3IoJ0ludmFsaWQgSlNPTiBwYXRoLicpO1xuICAgIH1cblxuICAgIHJlc3VsdC5wdXNoKG1hdGNoWzFdKTtcbiAgICBpZiAobWF0Y2hbMl0pIHtcbiAgICAgIGNvbnN0IGluZGljZXMgPSBtYXRjaFsyXVxuICAgICAgICAuc2xpY2UoMSwgLTEpXG4gICAgICAgIC5zcGxpdCgnXVsnKVxuICAgICAgICAubWFwKCh4KSA9PiAoL15cXGQkLy50ZXN0KHgpID8gK3ggOiB4LnJlcGxhY2UoL1wifCcvZywgJycpKSk7XG4gICAgICByZXN1bHQucHVzaCguLi5pbmRpY2VzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0LmZpbHRlcigoZnJhZ21lbnQpID0+IGZyYWdtZW50ICE9IG51bGwpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgYm9vbGVhbiB8IG51bWJlcik6IEpzb25WYWx1ZSB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHZhbHVlU3RyaW5nID0gYCR7dmFsdWV9YC50cmltKCk7XG4gIHN3aXRjaCAodmFsdWVTdHJpbmcpIHtcbiAgICBjYXNlICd0cnVlJzpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNhc2UgJ2ZhbHNlJzpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjYXNlICdudWxsJzpcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKGlzRmluaXRlKCt2YWx1ZVN0cmluZykpIHtcbiAgICByZXR1cm4gK3ZhbHVlU3RyaW5nO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBXZSB1c2UgYEpTT04ucGFyc2VgIGluc3RlYWQgb2YgYHBhcnNlSnNvbmAgYmVjYXVzZSB0aGUgbGF0dGVyIHdpbGwgcGFyc2UgVVVJRHNcbiAgICAvLyBhbmQgY29udmVydCB0aGVtIGludG8gYSBudW1iZXJpYyBlbnRpdGllcy5cbiAgICAvLyBFeGFtcGxlOiA3M2I2MTk3NC0xODJjLTQ4ZTQtYjRjNi0zMGRkZjA4YzVjOTggLT4gNzMuXG4gICAgLy8gVGhlc2UgdmFsdWVzIHNob3VsZCBuZXZlciBjb250YWluIGNvbW1lbnRzLCB0aGVyZWZvcmUgdXNpbmcgYEpTT04ucGFyc2VgIGlzIHNhZmUuXG4gICAgcmV0dXJuIEpTT04ucGFyc2UodmFsdWVTdHJpbmcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==