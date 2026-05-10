"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoize = void 0;
/**
 * A decorator that memoizes methods and getters.
 *
 * **Note**: Be cautious where and how to use this decorator as the size of the cache will grow unbounded.
 *
 * @see https://en.wikipedia.org/wiki/Memoization
 */
function memoize(target, propertyKey, descriptor) {
    const descriptorPropertyName = descriptor.get ? 'get' : 'value';
    const originalMethod = descriptor[descriptorPropertyName];
    if (typeof originalMethod !== 'function') {
        throw new Error('Memoize decorator can only be used on methods or get accessors.');
    }
    const cache = new Map();
    return {
        ...descriptor,
        [descriptorPropertyName]: function (...args) {
            for (const arg of args) {
                if (!isJSONSerializable(arg)) {
                    throw new Error(`Argument ${isNonPrimitive(arg) ? arg.toString() : arg} is JSON serializable.`);
                }
            }
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = originalMethod.apply(this, args);
            cache.set(key, result);
            return result;
        },
    };
}
exports.memoize = memoize;
/** Method to check if value is a non primitive. */
function isNonPrimitive(value) {
    return ((value !== null && typeof value === 'object') ||
        typeof value === 'function' ||
        typeof value === 'symbol');
}
/** Method to check if the values are JSON serializable */
function isJSONSerializable(value) {
    if (!isNonPrimitive(value)) {
        // Can be seralized since it's a primitive.
        return true;
    }
    let nestedValues;
    if (Array.isArray(value)) {
        // It's an array, check each item.
        nestedValues = value;
    }
    else if (Object.prototype.toString.call(value) === '[object Object]') {
        // It's a plain object, check each value.
        nestedValues = Object.values(value);
    }
    if (!nestedValues || nestedValues.some((v) => !isJSONSerializable(v))) {
        return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtb2l6ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy91dGlsaXRpZXMvbWVtb2l6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixPQUFPLENBQ3JCLE1BQWMsRUFDZCxXQUE0QixFQUM1QixVQUFzQztJQUV0QyxNQUFNLHNCQUFzQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQ2hFLE1BQU0sY0FBYyxHQUFZLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRW5FLElBQUksT0FBTyxjQUFjLEtBQUssVUFBVSxFQUFFO1FBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUVBQWlFLENBQUMsQ0FBQztLQUNwRjtJQUVELE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO0lBRXpDLE9BQU87UUFDTCxHQUFHLFVBQVU7UUFDYixDQUFDLHNCQUFzQixDQUFDLEVBQUUsVUFBeUIsR0FBRyxJQUFlO1lBQ25FLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO2dCQUN0QixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQ2IsWUFBWSxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyx3QkFBd0IsQ0FDL0UsQ0FBQztpQkFDSDthQUNGO1lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2xCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN2QjtZQUVELE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXZCLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXBDRCwwQkFvQ0M7QUFFRCxtREFBbUQ7QUFDbkQsU0FBUyxjQUFjLENBQUMsS0FBYztJQUNwQyxPQUFPLENBQ0wsQ0FBQyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQztRQUM3QyxPQUFPLEtBQUssS0FBSyxVQUFVO1FBQzNCLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FDMUIsQ0FBQztBQUNKLENBQUM7QUFFRCwwREFBMEQ7QUFDMUQsU0FBUyxrQkFBa0IsQ0FBQyxLQUFjO0lBQ3hDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDMUIsMkNBQTJDO1FBQzNDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxJQUFJLFlBQW1DLENBQUM7SUFDeEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLGtDQUFrQztRQUNsQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0tBQ3RCO1NBQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssaUJBQWlCLEVBQUU7UUFDdEUseUNBQXlDO1FBQ3pDLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsSUFBSSxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDckUsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEEgZGVjb3JhdG9yIHRoYXQgbWVtb2l6ZXMgbWV0aG9kcyBhbmQgZ2V0dGVycy5cbiAqXG4gKiAqKk5vdGUqKjogQmUgY2F1dGlvdXMgd2hlcmUgYW5kIGhvdyB0byB1c2UgdGhpcyBkZWNvcmF0b3IgYXMgdGhlIHNpemUgb2YgdGhlIGNhY2hlIHdpbGwgZ3JvdyB1bmJvdW5kZWQuXG4gKlxuICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NZW1vaXphdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVtb2l6ZTxUPihcbiAgdGFyZ2V0OiBPYmplY3QsXG4gIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wsXG4gIGRlc2NyaXB0b3I6IFR5cGVkUHJvcGVydHlEZXNjcmlwdG9yPFQ+LFxuKTogVHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8VD4ge1xuICBjb25zdCBkZXNjcmlwdG9yUHJvcGVydHlOYW1lID0gZGVzY3JpcHRvci5nZXQgPyAnZ2V0JyA6ICd2YWx1ZSc7XG4gIGNvbnN0IG9yaWdpbmFsTWV0aG9kOiB1bmtub3duID0gZGVzY3JpcHRvcltkZXNjcmlwdG9yUHJvcGVydHlOYW1lXTtcblxuICBpZiAodHlwZW9mIG9yaWdpbmFsTWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZW1vaXplIGRlY29yYXRvciBjYW4gb25seSBiZSB1c2VkIG9uIG1ldGhvZHMgb3IgZ2V0IGFjY2Vzc29ycy4nKTtcbiAgfVxuXG4gIGNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHVua25vd24+KCk7XG5cbiAgcmV0dXJuIHtcbiAgICAuLi5kZXNjcmlwdG9yLFxuICAgIFtkZXNjcmlwdG9yUHJvcGVydHlOYW1lXTogZnVuY3Rpb24gKHRoaXM6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkge1xuICAgICAgZm9yIChjb25zdCBhcmcgb2YgYXJncykge1xuICAgICAgICBpZiAoIWlzSlNPTlNlcmlhbGl6YWJsZShhcmcpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEFyZ3VtZW50ICR7aXNOb25QcmltaXRpdmUoYXJnKSA/IGFyZy50b1N0cmluZygpIDogYXJnfSBpcyBKU09OIHNlcmlhbGl6YWJsZS5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3Qga2V5ID0gSlNPTi5zdHJpbmdpZnkoYXJncyk7XG4gICAgICBpZiAoY2FjaGUuaGFzKGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChrZXkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIGNhY2hlLnNldChrZXksIHJlc3VsdCk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqIE1ldGhvZCB0byBjaGVjayBpZiB2YWx1ZSBpcyBhIG5vbiBwcmltaXRpdmUuICovXG5mdW5jdGlvbiBpc05vblByaW1pdGl2ZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIG9iamVjdCB8IEZ1bmN0aW9uIHwgc3ltYm9sIHtcbiAgcmV0dXJuIChcbiAgICAodmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdzeW1ib2wnXG4gICk7XG59XG5cbi8qKiBNZXRob2QgdG8gY2hlY2sgaWYgdGhlIHZhbHVlcyBhcmUgSlNPTiBzZXJpYWxpemFibGUgKi9cbmZ1bmN0aW9uIGlzSlNPTlNlcmlhbGl6YWJsZSh2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAoIWlzTm9uUHJpbWl0aXZlKHZhbHVlKSkge1xuICAgIC8vIENhbiBiZSBzZXJhbGl6ZWQgc2luY2UgaXQncyBhIHByaW1pdGl2ZS5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGxldCBuZXN0ZWRWYWx1ZXM6IHVua25vd25bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gSXQncyBhbiBhcnJheSwgY2hlY2sgZWFjaCBpdGVtLlxuICAgIG5lc3RlZFZhbHVlcyA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgLy8gSXQncyBhIHBsYWluIG9iamVjdCwgY2hlY2sgZWFjaCB2YWx1ZS5cbiAgICBuZXN0ZWRWYWx1ZXMgPSBPYmplY3QudmFsdWVzKHZhbHVlKTtcbiAgfVxuXG4gIGlmICghbmVzdGVkVmFsdWVzIHx8IG5lc3RlZFZhbHVlcy5zb21lKCh2KSA9PiAhaXNKU09OU2VyaWFsaXphYmxlKHYpKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuIl19