"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSchemas = exports.isJsonSchema = void 0;
const utils_1 = require("../utils");
function isJsonSchema(value) {
    return (0, utils_1.isJsonObject)(value) || value === false || value === true;
}
exports.isJsonSchema = isJsonSchema;
/**
 * Return a schema that is the merge of all subschemas, ie. it should validate all the schemas
 * that were passed in. It is possible to make an invalid schema this way, e.g. by using
 * `mergeSchemas({ type: 'number' }, { type: 'string' })`, which will never validate.
 * @param schemas All schemas to be merged.
 */
function mergeSchemas(...schemas) {
    return schemas.reduce((prev, curr) => {
        if (curr === undefined) {
            return prev;
        }
        if (prev === false || curr === false) {
            return false;
        }
        else if (prev === true) {
            return curr;
        }
        else if (curr === true) {
            return prev;
        }
        else if (Array.isArray(prev.allOf)) {
            if (Array.isArray(curr.allOf)) {
                return { ...prev, allOf: [...prev.allOf, ...curr.allOf] };
            }
            else {
                return { ...prev, allOf: [...prev.allOf, curr] };
            }
        }
        else if (Array.isArray(curr.allOf)) {
            return { ...prev, allOf: [prev, ...curr.allOf] };
        }
        else {
            return { ...prev, allOf: [prev, curr] };
        }
    }, true);
}
exports.mergeSchemas = mergeSchemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvanNvbi9zY2hlbWEvc2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILG9DQUErRDtBQVMvRCxTQUFnQixZQUFZLENBQUMsS0FBYztJQUN6QyxPQUFPLElBQUEsb0JBQVksRUFBQyxLQUFrQixDQUFDLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDO0FBQy9FLENBQUM7QUFGRCxvQ0FFQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLEdBQUcsT0FBbUM7SUFDakUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFhLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO1FBQy9DLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUN0QixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7WUFDcEMsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUN4QixPQUFPLElBQUksQ0FBQztTQUNiO2FBQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3BDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLE9BQU8sRUFBRSxHQUFHLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzthQUMzRDtpQkFBTTtnQkFDTCxPQUFPLEVBQUUsR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7YUFDbEQ7U0FDRjthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDcEMsT0FBTyxFQUFFLEdBQUcsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1NBQ2xEO2FBQU07WUFDTCxPQUFPLEVBQUUsR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7U0FDekM7SUFDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDWCxDQUFDO0FBeEJELG9DQXdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBKc29uT2JqZWN0LCBKc29uVmFsdWUsIGlzSnNvbk9iamVjdCB9IGZyb20gJy4uL3V0aWxzJztcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIGludGVyZmFjZSBmb3IgSnNvblNjaGVtYSAodG8gY29tZSkuIEpzb25TY2hlbWFzIGFyZSBhbHNvIEpzb25PYmplY3QuXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgdHlwZSBKc29uU2NoZW1hID0gSnNvbk9iamVjdCB8IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0pzb25TY2hlbWEodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBKc29uU2NoZW1hIHtcbiAgcmV0dXJuIGlzSnNvbk9iamVjdCh2YWx1ZSBhcyBKc29uVmFsdWUpIHx8IHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PT0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzY2hlbWEgdGhhdCBpcyB0aGUgbWVyZ2Ugb2YgYWxsIHN1YnNjaGVtYXMsIGllLiBpdCBzaG91bGQgdmFsaWRhdGUgYWxsIHRoZSBzY2hlbWFzXG4gKiB0aGF0IHdlcmUgcGFzc2VkIGluLiBJdCBpcyBwb3NzaWJsZSB0byBtYWtlIGFuIGludmFsaWQgc2NoZW1hIHRoaXMgd2F5LCBlLmcuIGJ5IHVzaW5nXG4gKiBgbWVyZ2VTY2hlbWFzKHsgdHlwZTogJ251bWJlcicgfSwgeyB0eXBlOiAnc3RyaW5nJyB9KWAsIHdoaWNoIHdpbGwgbmV2ZXIgdmFsaWRhdGUuXG4gKiBAcGFyYW0gc2NoZW1hcyBBbGwgc2NoZW1hcyB0byBiZSBtZXJnZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVNjaGVtYXMoLi4uc2NoZW1hczogKEpzb25TY2hlbWEgfCB1bmRlZmluZWQpW10pOiBKc29uU2NoZW1hIHtcbiAgcmV0dXJuIHNjaGVtYXMucmVkdWNlPEpzb25TY2hlbWE+KChwcmV2LCBjdXJyKSA9PiB7XG4gICAgaWYgKGN1cnIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfVxuXG4gICAgaWYgKHByZXYgPT09IGZhbHNlIHx8IGN1cnIgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChwcmV2ID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gY3VycjtcbiAgICB9IGVsc2UgaWYgKGN1cnIgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwcmV2LmFsbE9mKSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3Vyci5hbGxPZikpIHtcbiAgICAgICAgcmV0dXJuIHsgLi4ucHJldiwgYWxsT2Y6IFsuLi5wcmV2LmFsbE9mLCAuLi5jdXJyLmFsbE9mXSB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHsgLi4ucHJldiwgYWxsT2Y6IFsuLi5wcmV2LmFsbE9mLCBjdXJyXSB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXJyLmFsbE9mKSkge1xuICAgICAgcmV0dXJuIHsgLi4ucHJldiwgYWxsT2Y6IFtwcmV2LCAuLi5jdXJyLmFsbE9mXSB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4geyAuLi5wcmV2LCBhbGxPZjogW3ByZXYsIGN1cnJdIH07XG4gICAgfVxuICB9LCB0cnVlKTtcbn1cbiJdfQ==