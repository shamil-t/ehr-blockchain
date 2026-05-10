"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepCopy = void 0;
const copySymbol = Symbol();
function deepCopy(value) {
    if (Array.isArray(value)) {
        return value.map((o) => deepCopy(o));
    }
    else if (value && typeof value === 'object') {
        const valueCasted = value;
        if (valueCasted[copySymbol]) {
            // This is a circular dependency. Just return the cloned value.
            return valueCasted[copySymbol];
        }
        if (valueCasted['toJSON']) {
            return JSON.parse(valueCasted['toJSON']());
        }
        const copy = Object.create(Object.getPrototypeOf(valueCasted));
        valueCasted[copySymbol] = copy;
        for (const key of Object.getOwnPropertyNames(valueCasted)) {
            copy[key] = deepCopy(valueCasted[key]);
        }
        delete valueCasted[copySymbol];
        return copy;
    }
    else {
        return value;
    }
}
exports.deepCopy = deepCopy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdXRpbHMvb2JqZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILE1BQU0sVUFBVSxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBRTVCLFNBQWdCLFFBQVEsQ0FBSSxLQUFRO0lBQ2xDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN4QixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBaUIsQ0FBQztLQUN0RDtTQUFNLElBQUksS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUM3QyxNQUFNLFdBQVcsR0FBRyxLQUtuQixDQUFDO1FBRUYsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDM0IsK0RBQStEO1lBQy9ELE9BQU8sV0FBVyxDQUFDLFVBQVUsQ0FBTSxDQUFDO1NBQ3JDO1FBRUQsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRCxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQy9CLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDeEM7UUFDRCxPQUFPLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUvQixPQUFPLElBQUksQ0FBQztLQUNiO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQztBQS9CRCw0QkErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuY29uc3QgY29weVN5bWJvbCA9IFN5bWJvbCgpO1xuXG5leHBvcnQgZnVuY3Rpb24gZGVlcENvcHk8VD4odmFsdWU6IFQpOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgobykgPT4gZGVlcENvcHkobykpIGFzIHVua25vd24gYXMgVDtcbiAgfSBlbHNlIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgY29uc3QgdmFsdWVDYXN0ZWQgPSB2YWx1ZSBhcyB1bmtub3duIGFzIHtcbiAgICAgIFtjb3B5U3ltYm9sXT86IFQ7XG4gICAgICB0b0pTT04/OiAoKSA9PiBzdHJpbmc7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgW2tleTogc3RyaW5nXTogYW55O1xuICAgIH07XG5cbiAgICBpZiAodmFsdWVDYXN0ZWRbY29weVN5bWJvbF0pIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjaXJjdWxhciBkZXBlbmRlbmN5LiBKdXN0IHJldHVybiB0aGUgY2xvbmVkIHZhbHVlLlxuICAgICAgcmV0dXJuIHZhbHVlQ2FzdGVkW2NvcHlTeW1ib2xdIGFzIFQ7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlQ2FzdGVkWyd0b0pTT04nXSkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UodmFsdWVDYXN0ZWRbJ3RvSlNPTiddKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvcHkgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZUNhc3RlZCkpO1xuICAgIHZhbHVlQ2FzdGVkW2NvcHlTeW1ib2xdID0gY29weTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZUNhc3RlZCkpIHtcbiAgICAgIGNvcHlba2V5XSA9IGRlZXBDb3B5KHZhbHVlQ2FzdGVkW2tleV0pO1xuICAgIH1cbiAgICBkZWxldGUgdmFsdWVDYXN0ZWRbY29weVN5bWJvbF07XG5cbiAgICByZXR1cm4gY29weTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==