"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUndefinedDefaults = void 0;
const utils_1 = require("../utils");
const utility_1 = require("./utility");
function addUndefinedDefaults(value, _pointer, schema) {
    if (typeof schema === 'boolean' || schema === undefined) {
        return value;
    }
    value ?? (value = schema.default);
    const types = (0, utility_1.getTypesOfSchema)(schema);
    if (types.size === 0) {
        return value;
    }
    let type;
    if (types.size === 1) {
        // only one potential type
        type = Array.from(types)[0];
    }
    else if (types.size === 2 && types.has('array') && types.has('object')) {
        // need to create one of them and array is simpler
        type = 'array';
    }
    else if (schema.properties && types.has('object')) {
        // assume object
        type = 'object';
    }
    else if (schema.items && types.has('array')) {
        // assume array
        type = 'array';
    }
    else {
        // anything else needs to be checked by the consumer anyway
        return value;
    }
    if (type === 'array') {
        return value == undefined ? [] : value;
    }
    if (type === 'object') {
        let newValue;
        if (value == undefined) {
            newValue = {};
        }
        else if ((0, utils_1.isJsonObject)(value)) {
            newValue = value;
        }
        else {
            return value;
        }
        if (!(0, utils_1.isJsonObject)(schema.properties)) {
            return newValue;
        }
        for (const [propName, schemaObject] of Object.entries(schema.properties)) {
            if (propName === '$schema' || !(0, utils_1.isJsonObject)(schemaObject)) {
                continue;
            }
            const value = newValue[propName];
            if (value === undefined) {
                newValue[propName] = schemaObject.default;
            }
            else if ((0, utils_1.isJsonObject)(value)) {
                // Basic support for oneOf and anyOf.
                const propertySchemas = schemaObject.oneOf || schemaObject.anyOf;
                const allProperties = Object.keys(value);
                // Locate a schema which declares all the properties that the object contains.
                const adjustedSchema = (0, utils_1.isJsonArray)(propertySchemas) &&
                    propertySchemas.find((s) => {
                        if (!(0, utils_1.isJsonObject)(s)) {
                            return false;
                        }
                        const schemaType = (0, utility_1.getTypesOfSchema)(s);
                        if (schemaType.size === 1 && schemaType.has('object') && (0, utils_1.isJsonObject)(s.properties)) {
                            const properties = Object.keys(s.properties);
                            return allProperties.every((key) => properties.includes(key));
                        }
                        return false;
                    });
                if (adjustedSchema && (0, utils_1.isJsonObject)(adjustedSchema)) {
                    newValue[propName] = addUndefinedDefaults(value, _pointer, adjustedSchema);
                }
            }
        }
        return newValue;
    }
    return value;
}
exports.addUndefinedDefaults = addUndefinedDefaults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3Jtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2pzb24vc2NoZW1hL3RyYW5zZm9ybXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsb0NBQTRFO0FBRzVFLHVDQUE2QztBQUU3QyxTQUFnQixvQkFBb0IsQ0FDbEMsS0FBZ0IsRUFDaEIsUUFBcUIsRUFDckIsTUFBbUI7SUFFbkIsSUFBSSxPQUFPLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUN2RCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsS0FBSyxLQUFMLEtBQUssR0FBSyxNQUFNLENBQUMsT0FBTyxFQUFDO0lBRXpCLE1BQU0sS0FBSyxHQUFHLElBQUEsMEJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtRQUNwQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsSUFBSSxJQUFJLENBQUM7SUFDVCxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1FBQ3BCLDBCQUEwQjtRQUMxQixJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM3QjtTQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3hFLGtEQUFrRDtRQUNsRCxJQUFJLEdBQUcsT0FBTyxDQUFDO0tBQ2hCO1NBQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbkQsZ0JBQWdCO1FBQ2hCLElBQUksR0FBRyxRQUFRLENBQUM7S0FDakI7U0FBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM3QyxlQUFlO1FBQ2YsSUFBSSxHQUFHLE9BQU8sQ0FBQztLQUNoQjtTQUFNO1FBQ0wsMkRBQTJEO1FBQzNELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7UUFDcEIsT0FBTyxLQUFLLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUN4QztJQUVELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQixJQUFJLFFBQVEsQ0FBQztRQUNiLElBQUksS0FBSyxJQUFJLFNBQVMsRUFBRTtZQUN0QixRQUFRLEdBQUcsRUFBZ0IsQ0FBQztTQUM3QjthQUFNLElBQUksSUFBQSxvQkFBWSxFQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzlCLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDbEI7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJLENBQUMsSUFBQSxvQkFBWSxFQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNwQyxPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUVELEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN4RSxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFBLG9CQUFZLEVBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ3pELFNBQVM7YUFDVjtZQUVELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDO2FBQzNDO2lCQUFNLElBQUksSUFBQSxvQkFBWSxFQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM5QixxQ0FBcUM7Z0JBQ3JDLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxLQUFLLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQztnQkFDakUsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekMsOEVBQThFO2dCQUM5RSxNQUFNLGNBQWMsR0FDbEIsSUFBQSxtQkFBVyxFQUFDLGVBQWUsQ0FBQztvQkFDNUIsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUN6QixJQUFJLENBQUMsSUFBQSxvQkFBWSxFQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUNwQixPQUFPLEtBQUssQ0FBQzt5QkFDZDt3QkFFRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDBCQUFnQixFQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN2QyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksSUFBQSxvQkFBWSxFQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRTs0QkFDbkYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBRTdDLE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUMvRDt3QkFFRCxPQUFPLEtBQUssQ0FBQztvQkFDZixDQUFDLENBQUMsQ0FBQztnQkFFTCxJQUFJLGNBQWMsSUFBSSxJQUFBLG9CQUFZLEVBQUMsY0FBYyxDQUFDLEVBQUU7b0JBQ2xELFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2lCQUM1RTthQUNGO1NBQ0Y7UUFFRCxPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQTVGRCxvREE0RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgSnNvbk9iamVjdCwgSnNvblZhbHVlLCBpc0pzb25BcnJheSwgaXNKc29uT2JqZWN0IH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgSnNvblBvaW50ZXIgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBKc29uU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgZ2V0VHlwZXNPZlNjaGVtYSB9IGZyb20gJy4vdXRpbGl0eSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRVbmRlZmluZWREZWZhdWx0cyhcbiAgdmFsdWU6IEpzb25WYWx1ZSxcbiAgX3BvaW50ZXI6IEpzb25Qb2ludGVyLFxuICBzY2hlbWE/OiBKc29uU2NoZW1hLFxuKTogSnNvblZhbHVlIHtcbiAgaWYgKHR5cGVvZiBzY2hlbWEgPT09ICdib29sZWFuJyB8fCBzY2hlbWEgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHZhbHVlID8/PSBzY2hlbWEuZGVmYXVsdDtcblxuICBjb25zdCB0eXBlcyA9IGdldFR5cGVzT2ZTY2hlbWEoc2NoZW1hKTtcbiAgaWYgKHR5cGVzLnNpemUgPT09IDApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBsZXQgdHlwZTtcbiAgaWYgKHR5cGVzLnNpemUgPT09IDEpIHtcbiAgICAvLyBvbmx5IG9uZSBwb3RlbnRpYWwgdHlwZVxuICAgIHR5cGUgPSBBcnJheS5mcm9tKHR5cGVzKVswXTtcbiAgfSBlbHNlIGlmICh0eXBlcy5zaXplID09PSAyICYmIHR5cGVzLmhhcygnYXJyYXknKSAmJiB0eXBlcy5oYXMoJ29iamVjdCcpKSB7XG4gICAgLy8gbmVlZCB0byBjcmVhdGUgb25lIG9mIHRoZW0gYW5kIGFycmF5IGlzIHNpbXBsZXJcbiAgICB0eXBlID0gJ2FycmF5JztcbiAgfSBlbHNlIGlmIChzY2hlbWEucHJvcGVydGllcyAmJiB0eXBlcy5oYXMoJ29iamVjdCcpKSB7XG4gICAgLy8gYXNzdW1lIG9iamVjdFxuICAgIHR5cGUgPSAnb2JqZWN0JztcbiAgfSBlbHNlIGlmIChzY2hlbWEuaXRlbXMgJiYgdHlwZXMuaGFzKCdhcnJheScpKSB7XG4gICAgLy8gYXNzdW1lIGFycmF5XG4gICAgdHlwZSA9ICdhcnJheSc7XG4gIH0gZWxzZSB7XG4gICAgLy8gYW55dGhpbmcgZWxzZSBuZWVkcyB0byBiZSBjaGVja2VkIGJ5IHRoZSBjb25zdW1lciBhbnl3YXlcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBpZiAodHlwZSA9PT0gJ2FycmF5Jykge1xuICAgIHJldHVybiB2YWx1ZSA9PSB1bmRlZmluZWQgPyBbXSA6IHZhbHVlO1xuICB9XG5cbiAgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IG5ld1ZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgIG5ld1ZhbHVlID0ge30gYXMgSnNvbk9iamVjdDtcbiAgICB9IGVsc2UgaWYgKGlzSnNvbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgIG5ld1ZhbHVlID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzSnNvbk9iamVjdChzY2hlbWEucHJvcGVydGllcykpIHtcbiAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtwcm9wTmFtZSwgc2NoZW1hT2JqZWN0XSBvZiBPYmplY3QuZW50cmllcyhzY2hlbWEucHJvcGVydGllcykpIHtcbiAgICAgIGlmIChwcm9wTmFtZSA9PT0gJyRzY2hlbWEnIHx8ICFpc0pzb25PYmplY3Qoc2NoZW1hT2JqZWN0KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmFsdWUgPSBuZXdWYWx1ZVtwcm9wTmFtZV07XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuZXdWYWx1ZVtwcm9wTmFtZV0gPSBzY2hlbWFPYmplY3QuZGVmYXVsdDtcbiAgICAgIH0gZWxzZSBpZiAoaXNKc29uT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAvLyBCYXNpYyBzdXBwb3J0IGZvciBvbmVPZiBhbmQgYW55T2YuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5U2NoZW1hcyA9IHNjaGVtYU9iamVjdC5vbmVPZiB8fCBzY2hlbWFPYmplY3QuYW55T2Y7XG4gICAgICAgIGNvbnN0IGFsbFByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgICAgIC8vIExvY2F0ZSBhIHNjaGVtYSB3aGljaCBkZWNsYXJlcyBhbGwgdGhlIHByb3BlcnRpZXMgdGhhdCB0aGUgb2JqZWN0IGNvbnRhaW5zLlxuICAgICAgICBjb25zdCBhZGp1c3RlZFNjaGVtYSA9XG4gICAgICAgICAgaXNKc29uQXJyYXkocHJvcGVydHlTY2hlbWFzKSAmJlxuICAgICAgICAgIHByb3BlcnR5U2NoZW1hcy5maW5kKChzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWlzSnNvbk9iamVjdChzKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNjaGVtYVR5cGUgPSBnZXRUeXBlc09mU2NoZW1hKHMpO1xuICAgICAgICAgICAgaWYgKHNjaGVtYVR5cGUuc2l6ZSA9PT0gMSAmJiBzY2hlbWFUeXBlLmhhcygnb2JqZWN0JykgJiYgaXNKc29uT2JqZWN0KHMucHJvcGVydGllcykpIHtcbiAgICAgICAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IE9iamVjdC5rZXlzKHMucHJvcGVydGllcyk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIGFsbFByb3BlcnRpZXMuZXZlcnkoKGtleSkgPT4gcHJvcGVydGllcy5pbmNsdWRlcyhrZXkpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChhZGp1c3RlZFNjaGVtYSAmJiBpc0pzb25PYmplY3QoYWRqdXN0ZWRTY2hlbWEpKSB7XG4gICAgICAgICAgbmV3VmFsdWVbcHJvcE5hbWVdID0gYWRkVW5kZWZpbmVkRGVmYXVsdHModmFsdWUsIF9wb2ludGVyLCBhZGp1c3RlZFNjaGVtYSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3VmFsdWU7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG4iXX0=