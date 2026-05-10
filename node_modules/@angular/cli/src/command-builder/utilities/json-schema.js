"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonSchemaToOptions = void 0;
const core_1 = require("@angular-devkit/core");
async function parseJsonSchemaToOptions(registry, schema, interactive = true) {
    const options = [];
    function visitor(current, pointer, parentSchema) {
        if (!parentSchema) {
            // Ignore root.
            return;
        }
        else if (pointer.split(/\/(?:properties|items|definitions)\//g).length > 2) {
            // Ignore subitems (objects or arrays).
            return;
        }
        else if (core_1.json.isJsonArray(current)) {
            return;
        }
        if (pointer.indexOf('/not/') != -1) {
            // We don't support anyOf/not.
            throw new Error('The "not" keyword is not supported in JSON Schema.');
        }
        const ptr = core_1.json.schema.parseJsonPointer(pointer);
        const name = ptr[ptr.length - 1];
        if (ptr[ptr.length - 2] != 'properties') {
            // Skip any non-property items.
            return;
        }
        const typeSet = core_1.json.schema.getTypesOfSchema(current);
        if (typeSet.size == 0) {
            throw new Error('Cannot find type of schema.');
        }
        // We only support number, string or boolean (or array of those), so remove everything else.
        const types = [...typeSet].filter((x) => {
            switch (x) {
                case 'boolean':
                case 'number':
                case 'string':
                    return true;
                case 'array':
                    // Only include arrays if they're boolean, string or number.
                    if (core_1.json.isJsonObject(current.items) &&
                        typeof current.items.type == 'string' &&
                        ['boolean', 'number', 'string'].includes(current.items.type)) {
                        return true;
                    }
                    return false;
                default:
                    return false;
            }
        });
        if (types.length == 0) {
            // This means it's not usable on the command line. e.g. an Object.
            return;
        }
        // Only keep enum values we support (booleans, numbers and strings).
        const enumValues = ((core_1.json.isJsonArray(current.enum) && current.enum) || []).filter((x) => {
            switch (typeof x) {
                case 'boolean':
                case 'number':
                case 'string':
                    return true;
                default:
                    return false;
            }
        });
        let defaultValue = undefined;
        if (current.default !== undefined) {
            switch (types[0]) {
                case 'string':
                    if (typeof current.default == 'string') {
                        defaultValue = current.default;
                    }
                    break;
                case 'number':
                    if (typeof current.default == 'number') {
                        defaultValue = current.default;
                    }
                    break;
                case 'boolean':
                    if (typeof current.default == 'boolean') {
                        defaultValue = current.default;
                    }
                    break;
            }
        }
        const type = types[0];
        const $default = current.$default;
        const $defaultIndex = core_1.json.isJsonObject($default) && $default['$source'] == 'argv' ? $default['index'] : undefined;
        const positional = typeof $defaultIndex == 'number' ? $defaultIndex : undefined;
        let required = core_1.json.isJsonArray(schema.required) ? schema.required.includes(name) : false;
        if (required && interactive && current['x-prompt']) {
            required = false;
        }
        const alias = core_1.json.isJsonArray(current.aliases)
            ? [...current.aliases].map((x) => '' + x)
            : current.alias
                ? ['' + current.alias]
                : [];
        const format = typeof current.format == 'string' ? current.format : undefined;
        const visible = current.visible === undefined || current.visible === true;
        const hidden = !!current.hidden || !visible;
        const xUserAnalytics = current['x-user-analytics'];
        const userAnalytics = typeof xUserAnalytics === 'string' ? xUserAnalytics : undefined;
        // Deprecated is set only if it's true or a string.
        const xDeprecated = current['x-deprecated'];
        const deprecated = xDeprecated === true || typeof xDeprecated === 'string' ? xDeprecated : undefined;
        const option = {
            name,
            description: '' + (current.description === undefined ? '' : current.description),
            type,
            default: defaultValue,
            choices: enumValues.length ? enumValues : undefined,
            required,
            alias,
            format,
            hidden,
            userAnalytics,
            deprecated,
            positional,
        };
        options.push(option);
    }
    const flattenedSchema = await registry.ɵflatten(schema);
    core_1.json.schema.visitJsonSchema(flattenedSchema, visitor);
    // Sort by positional and name.
    return options.sort((a, b) => {
        if (a.positional) {
            return b.positional ? a.positional - b.positional : a.name.localeCompare(b.name);
        }
        else if (b.positional) {
            return -1;
        }
        return a.name.localeCompare(b.name);
    });
}
exports.parseJsonSchemaToOptions = parseJsonSchemaToOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zY2hlbWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZC1idWlsZGVyL3V0aWxpdGllcy9qc29uLXNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBNEM7QUF1Q3JDLEtBQUssVUFBVSx3QkFBd0IsQ0FDNUMsUUFBb0MsRUFDcEMsTUFBdUIsRUFDdkIsV0FBVyxHQUFHLElBQUk7SUFFbEIsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBRTdCLFNBQVMsT0FBTyxDQUNkLE9BQXlDLEVBQ3pDLE9BQWdDLEVBQ2hDLFlBQStDO1FBRS9DLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDakIsZUFBZTtZQUNmLE9BQU87U0FDUjthQUFNLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDNUUsdUNBQXVDO1lBQ3ZDLE9BQU87U0FDUjthQUFNLElBQUksV0FBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNwQyxPQUFPO1NBQ1I7UUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEMsOEJBQThCO1lBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztTQUN2RTtRQUVELE1BQU0sR0FBRyxHQUFHLFdBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFakMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxZQUFZLEVBQUU7WUFDdkMsK0JBQStCO1lBQy9CLE9BQU87U0FDUjtRQUVELE1BQU0sT0FBTyxHQUFHLFdBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdEQsSUFBSSxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7UUFFRCw0RkFBNEY7UUFDNUYsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3RDLFFBQVEsQ0FBQyxFQUFFO2dCQUNULEtBQUssU0FBUyxDQUFDO2dCQUNmLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssUUFBUTtvQkFDWCxPQUFPLElBQUksQ0FBQztnQkFFZCxLQUFLLE9BQU87b0JBQ1YsNERBQTREO29CQUM1RCxJQUNFLFdBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzt3QkFDaEMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxRQUFRO3dCQUNyQyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQzVEO3dCQUNBLE9BQU8sSUFBSSxDQUFDO3FCQUNiO29CQUVELE9BQU8sS0FBSyxDQUFDO2dCQUVmO29CQUNFLE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1FBQ0gsQ0FBQyxDQUFrRCxDQUFDO1FBRXBELElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDckIsa0VBQWtFO1lBQ2xFLE9BQU87U0FDUjtRQUVELG9FQUFvRTtRQUNwRSxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsV0FBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3ZGLFFBQVEsT0FBTyxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssU0FBUyxDQUFDO2dCQUNmLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssUUFBUTtvQkFDWCxPQUFPLElBQUksQ0FBQztnQkFFZDtvQkFDRSxPQUFPLEtBQUssQ0FBQzthQUNoQjtRQUNILENBQUMsQ0FBK0IsQ0FBQztRQUVqQyxJQUFJLFlBQVksR0FBMEMsU0FBUyxDQUFDO1FBQ3BFLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDakMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssUUFBUTtvQkFDWCxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUU7d0JBQ3RDLFlBQVksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO3FCQUNoQztvQkFDRCxNQUFNO2dCQUNSLEtBQUssUUFBUTtvQkFDWCxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUU7d0JBQ3RDLFlBQVksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO3FCQUNoQztvQkFDRCxNQUFNO2dCQUNSLEtBQUssU0FBUztvQkFDWixJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sSUFBSSxTQUFTLEVBQUU7d0JBQ3ZDLFlBQVksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO3FCQUNoQztvQkFDRCxNQUFNO2FBQ1Q7U0FDRjtRQUVELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ2xDLE1BQU0sYUFBYSxHQUNqQixXQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQy9GLE1BQU0sVUFBVSxHQUNkLE9BQU8sYUFBYSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFFL0QsSUFBSSxRQUFRLEdBQUcsV0FBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDMUYsSUFBSSxRQUFRLElBQUksV0FBVyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNsRCxRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ2xCO1FBRUQsTUFBTSxLQUFLLEdBQUcsV0FBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUs7Z0JBQ2YsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDUCxNQUFNLE1BQU0sR0FBRyxPQUFPLE9BQU8sQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDOUUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFNUMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDbkQsTUFBTSxhQUFhLEdBQUcsT0FBTyxjQUFjLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUV0RixtREFBbUQ7UUFDbkQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sVUFBVSxHQUNkLFdBQVcsS0FBSyxJQUFJLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUVwRixNQUFNLE1BQU0sR0FBVztZQUNyQixJQUFJO1lBQ0osV0FBVyxFQUFFLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDaEYsSUFBSTtZQUNKLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLE9BQU8sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDbkQsUUFBUTtZQUNSLEtBQUs7WUFDTCxNQUFNO1lBQ04sTUFBTTtZQUNOLGFBQWE7WUFDYixVQUFVO1lBQ1YsVUFBVTtTQUNYLENBQUM7UUFFRixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLGVBQWUsR0FBRyxNQUFNLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEQsV0FBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXRELCtCQUErQjtJQUMvQixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0IsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFO1lBQ2hCLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbEY7YUFBTSxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUU7WUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNYO1FBRUQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBcktELDREQXFLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqc29uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHlhcmdzIGZyb20gJ3lhcmdzJztcblxuLyoqXG4gKiBBbiBvcHRpb24gZGVzY3JpcHRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9uIGV4dGVuZHMgeWFyZ3MuT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgb3B0aW9uLlxuICAgKi9cbiAgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgb3B0aW9uIGlzIHJlcXVpcmVkIG9yIG5vdC5cbiAgICovXG4gIHJlcXVpcmVkPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRm9ybWF0IGZpZWxkIG9mIHRoaXMgb3B0aW9uLlxuICAgKi9cbiAgZm9ybWF0Pzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgb3B0aW9uIHNob3VsZCBiZSBoaWRkZW4gZnJvbSB0aGUgaGVscCBvdXRwdXQuIEl0IHdpbGwgc3RpbGwgc2hvdyB1cCBpbiBKU09OIGhlbHAuXG4gICAqL1xuICBoaWRkZW4/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIG9wdGlvbiBjYW4gYmUgdXNlZCBhcyBhbiBhcmd1bWVudCwgdGhlIHBvc2l0aW9uIG9mIHRoZSBhcmd1bWVudC4gT3RoZXJ3aXNlIG9taXR0ZWQuXG4gICAqL1xuICBwb3NpdGlvbmFsPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0byByZXBvcnQgdGhpcyBvcHRpb24gdG8gdGhlIEFuZ3VsYXIgVGVhbSwgYW5kIHdoaWNoIGN1c3RvbSBmaWVsZCB0byB1c2UuXG4gICAqIElmIHRoaXMgaXMgZmFsc2V5LCBkbyBub3QgcmVwb3J0IHRoaXMgb3B0aW9uLlxuICAgKi9cbiAgdXNlckFuYWx5dGljcz86IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSnNvblNjaGVtYVRvT3B0aW9ucyhcbiAgcmVnaXN0cnk6IGpzb24uc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5LFxuICBzY2hlbWE6IGpzb24uSnNvbk9iamVjdCxcbiAgaW50ZXJhY3RpdmUgPSB0cnVlLFxuKTogUHJvbWlzZTxPcHRpb25bXT4ge1xuICBjb25zdCBvcHRpb25zOiBPcHRpb25bXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHZpc2l0b3IoXG4gICAgY3VycmVudDoganNvbi5Kc29uT2JqZWN0IHwganNvbi5Kc29uQXJyYXksXG4gICAgcG9pbnRlcjoganNvbi5zY2hlbWEuSnNvblBvaW50ZXIsXG4gICAgcGFyZW50U2NoZW1hPzoganNvbi5Kc29uT2JqZWN0IHwganNvbi5Kc29uQXJyYXksXG4gICkge1xuICAgIGlmICghcGFyZW50U2NoZW1hKSB7XG4gICAgICAvLyBJZ25vcmUgcm9vdC5cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuc3BsaXQoL1xcLyg/OnByb3BlcnRpZXN8aXRlbXN8ZGVmaW5pdGlvbnMpXFwvL2cpLmxlbmd0aCA+IDIpIHtcbiAgICAgIC8vIElnbm9yZSBzdWJpdGVtcyAob2JqZWN0cyBvciBhcnJheXMpLlxuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoanNvbi5pc0pzb25BcnJheShjdXJyZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwb2ludGVyLmluZGV4T2YoJy9ub3QvJykgIT0gLTEpIHtcbiAgICAgIC8vIFdlIGRvbid0IHN1cHBvcnQgYW55T2Yvbm90LlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgXCJub3RcIiBrZXl3b3JkIGlzIG5vdCBzdXBwb3J0ZWQgaW4gSlNPTiBTY2hlbWEuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcHRyID0ganNvbi5zY2hlbWEucGFyc2VKc29uUG9pbnRlcihwb2ludGVyKTtcbiAgICBjb25zdCBuYW1lID0gcHRyW3B0ci5sZW5ndGggLSAxXTtcblxuICAgIGlmIChwdHJbcHRyLmxlbmd0aCAtIDJdICE9ICdwcm9wZXJ0aWVzJykge1xuICAgICAgLy8gU2tpcCBhbnkgbm9uLXByb3BlcnR5IGl0ZW1zLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGVTZXQgPSBqc29uLnNjaGVtYS5nZXRUeXBlc09mU2NoZW1hKGN1cnJlbnQpO1xuXG4gICAgaWYgKHR5cGVTZXQuc2l6ZSA9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBmaW5kIHR5cGUgb2Ygc2NoZW1hLicpO1xuICAgIH1cblxuICAgIC8vIFdlIG9ubHkgc3VwcG9ydCBudW1iZXIsIHN0cmluZyBvciBib29sZWFuIChvciBhcnJheSBvZiB0aG9zZSksIHNvIHJlbW92ZSBldmVyeXRoaW5nIGVsc2UuXG4gICAgY29uc3QgdHlwZXMgPSBbLi4udHlwZVNldF0uZmlsdGVyKCh4KSA9PiB7XG4gICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY2FzZSAnYXJyYXknOlxuICAgICAgICAgIC8vIE9ubHkgaW5jbHVkZSBhcnJheXMgaWYgdGhleSdyZSBib29sZWFuLCBzdHJpbmcgb3IgbnVtYmVyLlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGpzb24uaXNKc29uT2JqZWN0KGN1cnJlbnQuaXRlbXMpICYmXG4gICAgICAgICAgICB0eXBlb2YgY3VycmVudC5pdGVtcy50eXBlID09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICBbJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ3N0cmluZyddLmluY2x1ZGVzKGN1cnJlbnQuaXRlbXMudHlwZSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KSBhcyAoJ3N0cmluZycgfCAnbnVtYmVyJyB8ICdib29sZWFuJyB8ICdhcnJheScpW107XG5cbiAgICBpZiAodHlwZXMubGVuZ3RoID09IDApIHtcbiAgICAgIC8vIFRoaXMgbWVhbnMgaXQncyBub3QgdXNhYmxlIG9uIHRoZSBjb21tYW5kIGxpbmUuIGUuZy4gYW4gT2JqZWN0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE9ubHkga2VlcCBlbnVtIHZhbHVlcyB3ZSBzdXBwb3J0IChib29sZWFucywgbnVtYmVycyBhbmQgc3RyaW5ncykuXG4gICAgY29uc3QgZW51bVZhbHVlcyA9ICgoanNvbi5pc0pzb25BcnJheShjdXJyZW50LmVudW0pICYmIGN1cnJlbnQuZW51bSkgfHwgW10pLmZpbHRlcigoeCkgPT4ge1xuICAgICAgc3dpdGNoICh0eXBlb2YgeCkge1xuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KSBhcyAoc3RyaW5nIHwgdHJ1ZSB8IG51bWJlcilbXTtcblxuICAgIGxldCBkZWZhdWx0VmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGN1cnJlbnQuZGVmYXVsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzd2l0Y2ggKHR5cGVzWzBdKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50LmRlZmF1bHQgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IGN1cnJlbnQuZGVmYXVsdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50LmRlZmF1bHQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IGN1cnJlbnQuZGVmYXVsdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudC5kZWZhdWx0ID09ICdib29sZWFuJykge1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gY3VycmVudC5kZWZhdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0eXBlID0gdHlwZXNbMF07XG4gICAgY29uc3QgJGRlZmF1bHQgPSBjdXJyZW50LiRkZWZhdWx0O1xuICAgIGNvbnN0ICRkZWZhdWx0SW5kZXggPVxuICAgICAganNvbi5pc0pzb25PYmplY3QoJGRlZmF1bHQpICYmICRkZWZhdWx0Wyckc291cmNlJ10gPT0gJ2FyZ3YnID8gJGRlZmF1bHRbJ2luZGV4J10gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcG9zaXRpb25hbDogbnVtYmVyIHwgdW5kZWZpbmVkID1cbiAgICAgIHR5cGVvZiAkZGVmYXVsdEluZGV4ID09ICdudW1iZXInID8gJGRlZmF1bHRJbmRleCA6IHVuZGVmaW5lZDtcblxuICAgIGxldCByZXF1aXJlZCA9IGpzb24uaXNKc29uQXJyYXkoc2NoZW1hLnJlcXVpcmVkKSA/IHNjaGVtYS5yZXF1aXJlZC5pbmNsdWRlcyhuYW1lKSA6IGZhbHNlO1xuICAgIGlmIChyZXF1aXJlZCAmJiBpbnRlcmFjdGl2ZSAmJiBjdXJyZW50Wyd4LXByb21wdCddKSB7XG4gICAgICByZXF1aXJlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGFsaWFzID0ganNvbi5pc0pzb25BcnJheShjdXJyZW50LmFsaWFzZXMpXG4gICAgICA/IFsuLi5jdXJyZW50LmFsaWFzZXNdLm1hcCgoeCkgPT4gJycgKyB4KVxuICAgICAgOiBjdXJyZW50LmFsaWFzXG4gICAgICA/IFsnJyArIGN1cnJlbnQuYWxpYXNdXG4gICAgICA6IFtdO1xuICAgIGNvbnN0IGZvcm1hdCA9IHR5cGVvZiBjdXJyZW50LmZvcm1hdCA9PSAnc3RyaW5nJyA/IGN1cnJlbnQuZm9ybWF0IDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHZpc2libGUgPSBjdXJyZW50LnZpc2libGUgPT09IHVuZGVmaW5lZCB8fCBjdXJyZW50LnZpc2libGUgPT09IHRydWU7XG4gICAgY29uc3QgaGlkZGVuID0gISFjdXJyZW50LmhpZGRlbiB8fCAhdmlzaWJsZTtcblxuICAgIGNvbnN0IHhVc2VyQW5hbHl0aWNzID0gY3VycmVudFsneC11c2VyLWFuYWx5dGljcyddO1xuICAgIGNvbnN0IHVzZXJBbmFseXRpY3MgPSB0eXBlb2YgeFVzZXJBbmFseXRpY3MgPT09ICdzdHJpbmcnID8geFVzZXJBbmFseXRpY3MgOiB1bmRlZmluZWQ7XG5cbiAgICAvLyBEZXByZWNhdGVkIGlzIHNldCBvbmx5IGlmIGl0J3MgdHJ1ZSBvciBhIHN0cmluZy5cbiAgICBjb25zdCB4RGVwcmVjYXRlZCA9IGN1cnJlbnRbJ3gtZGVwcmVjYXRlZCddO1xuICAgIGNvbnN0IGRlcHJlY2F0ZWQgPVxuICAgICAgeERlcHJlY2F0ZWQgPT09IHRydWUgfHwgdHlwZW9mIHhEZXByZWNhdGVkID09PSAnc3RyaW5nJyA/IHhEZXByZWNhdGVkIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qgb3B0aW9uOiBPcHRpb24gPSB7XG4gICAgICBuYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICcnICsgKGN1cnJlbnQuZGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCA/ICcnIDogY3VycmVudC5kZXNjcmlwdGlvbiksXG4gICAgICB0eXBlLFxuICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbHVlLFxuICAgICAgY2hvaWNlczogZW51bVZhbHVlcy5sZW5ndGggPyBlbnVtVmFsdWVzIDogdW5kZWZpbmVkLFxuICAgICAgcmVxdWlyZWQsXG4gICAgICBhbGlhcyxcbiAgICAgIGZvcm1hdCxcbiAgICAgIGhpZGRlbixcbiAgICAgIHVzZXJBbmFseXRpY3MsXG4gICAgICBkZXByZWNhdGVkLFxuICAgICAgcG9zaXRpb25hbCxcbiAgICB9O1xuXG4gICAgb3B0aW9ucy5wdXNoKG9wdGlvbik7XG4gIH1cblxuICBjb25zdCBmbGF0dGVuZWRTY2hlbWEgPSBhd2FpdCByZWdpc3RyeS7JtWZsYXR0ZW4oc2NoZW1hKTtcbiAganNvbi5zY2hlbWEudmlzaXRKc29uU2NoZW1hKGZsYXR0ZW5lZFNjaGVtYSwgdmlzaXRvcik7XG5cbiAgLy8gU29ydCBieSBwb3NpdGlvbmFsIGFuZCBuYW1lLlxuICByZXR1cm4gb3B0aW9ucy5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKGEucG9zaXRpb25hbCkge1xuICAgICAgcmV0dXJuIGIucG9zaXRpb25hbCA/IGEucG9zaXRpb25hbCAtIGIucG9zaXRpb25hbCA6IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgfSBlbHNlIGlmIChiLnBvc2l0aW9uYWwpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcbiAgfSk7XG59XG4iXX0=