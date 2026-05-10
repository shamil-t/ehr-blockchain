/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Represents the header configuration options for an HTTP request.
 * Instances are immutable. Modifying methods return a cloned
 * instance with the change. The original object is never changed.
 *
 * @publicApi
 */
export class HttpHeaders {
    /**  Constructs a new HTTP header object with the given values.*/
    constructor(headers) {
        /**
         * Internal map of lowercased header names to the normalized
         * form of the name (the form seen first).
         */
        this.normalizedNames = new Map();
        /**
         * Queued updates to be materialized the next initialization.
         */
        this.lazyUpdate = null;
        if (!headers) {
            this.headers = new Map();
        }
        else if (typeof headers === 'string') {
            this.lazyInit = () => {
                this.headers = new Map();
                headers.split('\n').forEach(line => {
                    const index = line.indexOf(':');
                    if (index > 0) {
                        const name = line.slice(0, index);
                        const key = name.toLowerCase();
                        const value = line.slice(index + 1).trim();
                        this.maybeSetNormalizedName(name, key);
                        if (this.headers.has(key)) {
                            this.headers.get(key).push(value);
                        }
                        else {
                            this.headers.set(key, [value]);
                        }
                    }
                });
            };
        }
        else if (typeof Headers !== 'undefined' && headers instanceof Headers) {
            this.headers = new Map();
            headers.forEach((values, name) => {
                this.setHeaderEntries(name, values);
            });
        }
        else {
            this.lazyInit = () => {
                if (typeof ngDevMode === 'undefined' || ngDevMode) {
                    assertValidHeaders(headers);
                }
                this.headers = new Map();
                Object.entries(headers).forEach(([name, values]) => {
                    this.setHeaderEntries(name, values);
                });
            };
        }
    }
    /**
     * Checks for existence of a given header.
     *
     * @param name The header name to check for existence.
     *
     * @returns True if the header exists, false otherwise.
     */
    has(name) {
        this.init();
        return this.headers.has(name.toLowerCase());
    }
    /**
     * Retrieves the first value of a given header.
     *
     * @param name The header name.
     *
     * @returns The value string if the header exists, null otherwise
     */
    get(name) {
        this.init();
        const values = this.headers.get(name.toLowerCase());
        return values && values.length > 0 ? values[0] : null;
    }
    /**
     * Retrieves the names of the headers.
     *
     * @returns A list of header names.
     */
    keys() {
        this.init();
        return Array.from(this.normalizedNames.values());
    }
    /**
     * Retrieves a list of values for a given header.
     *
     * @param name The header name from which to retrieve values.
     *
     * @returns A string of values if the header exists, null otherwise.
     */
    getAll(name) {
        this.init();
        return this.headers.get(name.toLowerCase()) || null;
    }
    /**
     * Appends a new value to the existing set of values for a header
     * and returns them in a clone of the original instance.
     *
     * @param name The header name for which to append the values.
     * @param value The value to append.
     *
     * @returns A clone of the HTTP headers object with the value appended to the given header.
     */
    append(name, value) {
        return this.clone({ name, value, op: 'a' });
    }
    /**
     * Sets or modifies a value for a given header in a clone of the original instance.
     * If the header already exists, its value is replaced with the given value
     * in the returned object.
     *
     * @param name The header name.
     * @param value The value or values to set or override for the given header.
     *
     * @returns A clone of the HTTP headers object with the newly set header value.
     */
    set(name, value) {
        return this.clone({ name, value, op: 's' });
    }
    /**
     * Deletes values for a given header in a clone of the original instance.
     *
     * @param name The header name.
     * @param value The value or values to delete for the given header.
     *
     * @returns A clone of the HTTP headers object with the given value deleted.
     */
    delete(name, value) {
        return this.clone({ name, value, op: 'd' });
    }
    maybeSetNormalizedName(name, lcName) {
        if (!this.normalizedNames.has(lcName)) {
            this.normalizedNames.set(lcName, name);
        }
    }
    init() {
        if (!!this.lazyInit) {
            if (this.lazyInit instanceof HttpHeaders) {
                this.copyFrom(this.lazyInit);
            }
            else {
                this.lazyInit();
            }
            this.lazyInit = null;
            if (!!this.lazyUpdate) {
                this.lazyUpdate.forEach(update => this.applyUpdate(update));
                this.lazyUpdate = null;
            }
        }
    }
    copyFrom(other) {
        other.init();
        Array.from(other.headers.keys()).forEach(key => {
            this.headers.set(key, other.headers.get(key));
            this.normalizedNames.set(key, other.normalizedNames.get(key));
        });
    }
    clone(update) {
        const clone = new HttpHeaders();
        clone.lazyInit =
            (!!this.lazyInit && this.lazyInit instanceof HttpHeaders) ? this.lazyInit : this;
        clone.lazyUpdate = (this.lazyUpdate || []).concat([update]);
        return clone;
    }
    applyUpdate(update) {
        const key = update.name.toLowerCase();
        switch (update.op) {
            case 'a':
            case 's':
                let value = update.value;
                if (typeof value === 'string') {
                    value = [value];
                }
                if (value.length === 0) {
                    return;
                }
                this.maybeSetNormalizedName(update.name, key);
                const base = (update.op === 'a' ? this.headers.get(key) : undefined) || [];
                base.push(...value);
                this.headers.set(key, base);
                break;
            case 'd':
                const toDelete = update.value;
                if (!toDelete) {
                    this.headers.delete(key);
                    this.normalizedNames.delete(key);
                }
                else {
                    let existing = this.headers.get(key);
                    if (!existing) {
                        return;
                    }
                    existing = existing.filter(value => toDelete.indexOf(value) === -1);
                    if (existing.length === 0) {
                        this.headers.delete(key);
                        this.normalizedNames.delete(key);
                    }
                    else {
                        this.headers.set(key, existing);
                    }
                }
                break;
        }
    }
    setHeaderEntries(name, values) {
        const headerValues = (Array.isArray(values) ? values : [values]).map((value) => value.toString());
        const key = name.toLowerCase();
        this.headers.set(key, headerValues);
        this.maybeSetNormalizedName(name, key);
    }
    /**
     * @internal
     */
    forEach(fn) {
        this.init();
        Array.from(this.normalizedNames.keys())
            .forEach(key => fn(this.normalizedNames.get(key), this.headers.get(key)));
    }
}
/**
 * Verifies that the headers object has the right shape: the values
 * must be either strings, numbers or arrays. Throws an error if an invalid
 * header value is present.
 */
function assertValidHeaders(headers) {
    for (const [key, value] of Object.entries(headers)) {
        if (!(typeof value === 'string' || typeof value === 'number') && !Array.isArray(value)) {
            throw new Error(`Unexpected value of the \`${key}\` header provided. ` +
                `Expecting either a string, a number or an array, but got: \`${value}\`.`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhZGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9odHRwL3NyYy9oZWFkZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQVFIOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxXQUFXO0lBd0J0QixpRUFBaUU7SUFFakUsWUFBWSxPQUFnRjtRQWxCNUY7OztXQUdHO1FBQ0ssb0JBQWUsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU96RDs7V0FFRztRQUNLLGVBQVUsR0FBa0IsSUFBSSxDQUFDO1FBS3ZDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFvQixDQUFDO1NBQzVDO2FBQU0sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUM7Z0JBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNqQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7d0JBQ2IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ2xDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQzNDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUs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RUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ2xELElBQUksQ0FBQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDdEYsTUFBTSxJQUFJLEtBQUssQ0FDWCw2QkFBNkIsR0FBRyxzQkFBc0I7Z0JBQ3RELCtEQUErRCxLQUFLLEtBQUssQ0FBQyxDQUFDO1NBQ2hGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmludGVyZmFjZSBVcGRhdGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZhbHVlPzogc3RyaW5nfHN0cmluZ1tdO1xuICBvcDogJ2EnfCdzJ3wnZCc7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaGVhZGVyIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgYW4gSFRUUCByZXF1ZXN0LlxuICogSW5zdGFuY2VzIGFyZSBpbW11dGFibGUuIE1vZGlmeWluZyBtZXRob2RzIHJldHVybiBhIGNsb25lZFxuICogaW5zdGFuY2Ugd2l0aCB0aGUgY2hhbmdlLiBUaGUgb3JpZ2luYWwgb2JqZWN0IGlzIG5ldmVyIGNoYW5nZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSHR0cEhlYWRlcnMge1xuICAvKipcbiAgICogSW50ZXJuYWwgbWFwIG9mIGxvd2VyY2FzZSBoZWFkZXIgbmFtZXMgdG8gdmFsdWVzLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgaGVhZGVycyE6IE1hcDxzdHJpbmcsIHN0cmluZ1tdPjtcblxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtYXAgb2YgbG93ZXJjYXNlZCBoZWFkZXIgbmFtZXMgdG8gdGhlIG5vcm1hbGl6ZWRcbiAgICogZm9ybSBvZiB0aGUgbmFtZSAodGhlIGZvcm0gc2VlbiBmaXJzdCkuXG4gICAqL1xuICBwcml2YXRlIG5vcm1hbGl6ZWROYW1lczogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ29tcGxldGUgdGhlIGxhenkgaW5pdGlhbGl6YXRpb24gb2YgdGhpcyBvYmplY3QgKG5lZWRlZCBiZWZvcmUgcmVhZGluZykuXG4gICAqL1xuICBwcml2YXRlIGxhenlJbml0ITogSHR0cEhlYWRlcnN8RnVuY3Rpb258bnVsbDtcblxuICAvKipcbiAgICogUXVldWVkIHVwZGF0ZXMgdG8gYmUgbWF0ZXJpYWxpemVkIHRoZSBuZXh0IGluaXRpYWxpemF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBsYXp5VXBkYXRlOiBVcGRhdGVbXXxudWxsID0gbnVsbDtcblxuICAvKiogIENvbnN0cnVjdHMgYSBuZXcgSFRUUCBoZWFkZXIgb2JqZWN0IHdpdGggdGhlIGdpdmVuIHZhbHVlcy4qL1xuXG4gIGNvbnN0cnVjdG9yKGhlYWRlcnM/OiBzdHJpbmd8e1tuYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCAoc3RyaW5nIHwgbnVtYmVyKVtdfXxIZWFkZXJzKSB7XG4gICAgaWYgKCFoZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaGVhZGVycyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMubGF6eUluaXQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICAgICAgaGVhZGVycy5zcGxpdCgnXFxuJykuZm9yRWFjaChsaW5lID0+IHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IGxpbmUuaW5kZXhPZignOicpO1xuICAgICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBsaW5lLnNsaWNlKDAsIGluZGV4KTtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbGluZS5zbGljZShpbmRleCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMubWF5YmVTZXROb3JtYWxpemVkTmFtZShuYW1lLCBrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaGVhZGVycy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuZ2V0KGtleSkhLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChrZXksIFt2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIEhlYWRlcnMgIT09ICd1bmRlZmluZWQnICYmIGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG4gICAgICBoZWFkZXJzLmZvckVhY2goKHZhbHVlczogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGhpcy5zZXRIZWFkZXJFbnRyaWVzKG5hbWUsIHZhbHVlcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sYXp5SW5pdCA9ICgpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgICAgIGFzc2VydFZhbGlkSGVhZGVycyhoZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGhlYWRlcnMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZXNdKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXRIZWFkZXJFbnRyaWVzKG5hbWUsIHZhbHVlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGZvciBleGlzdGVuY2Ugb2YgYSBnaXZlbiBoZWFkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBoZWFkZXIgbmFtZSB0byBjaGVjayBmb3IgZXhpc3RlbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBoZWFkZXIgZXhpc3RzLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBoYXMobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdGhpcy5pbml0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5oZWFkZXJzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZmlyc3QgdmFsdWUgb2YgYSBnaXZlbiBoZWFkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBoZWFkZXIgbmFtZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZhbHVlIHN0cmluZyBpZiB0aGUgaGVhZGVyIGV4aXN0cywgbnVsbCBvdGhlcndpc2VcbiAgICovXG4gIGdldChuYW1lOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgdGhpcy5pbml0KCk7XG5cbiAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLmhlYWRlcnMuZ2V0KG5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgcmV0dXJuIHZhbHVlcyAmJiB2YWx1ZXMubGVuZ3RoID4gMCA/IHZhbHVlc1swXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBuYW1lcyBvZiB0aGUgaGVhZGVycy5cbiAgICpcbiAgICogQHJldHVybnMgQSBsaXN0IG9mIGhlYWRlciBuYW1lcy5cbiAgICovXG4gIGtleXMoKTogc3RyaW5nW10ge1xuICAgIHRoaXMuaW5pdCgpO1xuXG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5ub3JtYWxpemVkTmFtZXMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGxpc3Qgb2YgdmFsdWVzIGZvciBhIGdpdmVuIGhlYWRlci5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIGhlYWRlciBuYW1lIGZyb20gd2hpY2ggdG8gcmV0cmlldmUgdmFsdWVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyBvZiB2YWx1ZXMgaWYgdGhlIGhlYWRlciBleGlzdHMsIG51bGwgb3RoZXJ3aXNlLlxuICAgKi9cbiAgZ2V0QWxsKG5hbWU6IHN0cmluZyk6IHN0cmluZ1tdfG51bGwge1xuICAgIHRoaXMuaW5pdCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuaGVhZGVycy5nZXQobmFtZS50b0xvd2VyQ2FzZSgpKSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgYSBuZXcgdmFsdWUgdG8gdGhlIGV4aXN0aW5nIHNldCBvZiB2YWx1ZXMgZm9yIGEgaGVhZGVyXG4gICAqIGFuZCByZXR1cm5zIHRoZW0gaW4gYSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBoZWFkZXIgbmFtZSBmb3Igd2hpY2ggdG8gYXBwZW5kIHRoZSB2YWx1ZXMuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gYXBwZW5kLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNsb25lIG9mIHRoZSBIVFRQIGhlYWRlcnMgb2JqZWN0IHdpdGggdGhlIHZhbHVlIGFwcGVuZGVkIHRvIHRoZSBnaXZlbiBoZWFkZXIuXG4gICAqL1xuXG4gIGFwcGVuZChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8c3RyaW5nW10pOiBIdHRwSGVhZGVycyB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoe25hbWUsIHZhbHVlLCBvcDogJ2EnfSk7XG4gIH1cbiAgLyoqXG4gICAqIFNldHMgb3IgbW9kaWZpZXMgYSB2YWx1ZSBmb3IgYSBnaXZlbiBoZWFkZXIgaW4gYSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgaW5zdGFuY2UuXG4gICAqIElmIHRoZSBoZWFkZXIgYWxyZWFkeSBleGlzdHMsIGl0cyB2YWx1ZSBpcyByZXBsYWNlZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZVxuICAgKiBpbiB0aGUgcmV0dXJuZWQgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaGVhZGVyIG5hbWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgb3IgdmFsdWVzIHRvIHNldCBvciBvdmVycmlkZSBmb3IgdGhlIGdpdmVuIGhlYWRlci5cbiAgICpcbiAgICogQHJldHVybnMgQSBjbG9uZSBvZiB0aGUgSFRUUCBoZWFkZXJzIG9iamVjdCB3aXRoIHRoZSBuZXdseSBzZXQgaGVhZGVyIHZhbHVlLlxuICAgKi9cbiAgc2V0KG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xzdHJpbmdbXSk6IEh0dHBIZWFkZXJzIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZSh7bmFtZSwgdmFsdWUsIG9wOiAncyd9KTtcbiAgfVxuICAvKipcbiAgICogRGVsZXRlcyB2YWx1ZXMgZm9yIGEgZ2l2ZW4gaGVhZGVyIGluIGEgY2xvbmUgb2YgdGhlIG9yaWdpbmFsIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaGVhZGVyIG5hbWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgb3IgdmFsdWVzIHRvIGRlbGV0ZSBmb3IgdGhlIGdpdmVuIGhlYWRlci5cbiAgICpcbiAgICogQHJldHVybnMgQSBjbG9uZSBvZiB0aGUgSFRUUCBoZWFkZXJzIG9iamVjdCB3aXRoIHRoZSBnaXZlbiB2YWx1ZSBkZWxldGVkLlxuICAgKi9cbiAgZGVsZXRlKG5hbWU6IHN0cmluZywgdmFsdWU/OiBzdHJpbmd8c3RyaW5nW10pOiBIdHRwSGVhZGVycyB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoe25hbWUsIHZhbHVlLCBvcDogJ2QnfSk7XG4gIH1cblxuICBwcml2YXRlIG1heWJlU2V0Tm9ybWFsaXplZE5hbWUobmFtZTogc3RyaW5nLCBsY05hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5ub3JtYWxpemVkTmFtZXMuaGFzKGxjTmFtZSkpIHtcbiAgICAgIHRoaXMubm9ybWFsaXplZE5hbWVzLnNldChsY05hbWUsIG5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcbiAgICBpZiAoISF0aGlzLmxhenlJbml0KSB7XG4gICAgICBpZiAodGhpcy5sYXp5SW5pdCBpbnN0YW5jZW9mIEh0dHBIZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuY29weUZyb20odGhpcy5sYXp5SW5pdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxhenlJbml0KCk7XG4gICAgICB9XG4gICAgICB0aGlzLmxhenlJbml0ID0gbnVsbDtcbiAgICAgIGlmICghIXRoaXMubGF6eVVwZGF0ZSkge1xuICAgICAgICB0aGlzLmxhenlVcGRhdGUuZm9yRWFjaCh1cGRhdGUgPT4gdGhpcy5hcHBseVVwZGF0ZSh1cGRhdGUpKTtcbiAgICAgICAgdGhpcy5sYXp5VXBkYXRlID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNvcHlGcm9tKG90aGVyOiBIdHRwSGVhZGVycykge1xuICAgIG90aGVyLmluaXQoKTtcbiAgICBBcnJheS5mcm9tKG90aGVyLmhlYWRlcnMua2V5cygpKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICB0aGlzLmhlYWRlcnMuc2V0KGtleSwgb3RoZXIuaGVhZGVycy5nZXQoa2V5KSEpO1xuICAgICAgdGhpcy5ub3JtYWxpemVkTmFtZXMuc2V0KGtleSwgb3RoZXIubm9ybWFsaXplZE5hbWVzLmdldChrZXkpISk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNsb25lKHVwZGF0ZTogVXBkYXRlKTogSHR0cEhlYWRlcnMge1xuICAgIGNvbnN0IGNsb25lID0gbmV3IEh0dHBIZWFkZXJzKCk7XG4gICAgY2xvbmUubGF6eUluaXQgPVxuICAgICAgICAoISF0aGlzLmxhenlJbml0ICYmIHRoaXMubGF6eUluaXQgaW5zdGFuY2VvZiBIdHRwSGVhZGVycykgPyB0aGlzLmxhenlJbml0IDogdGhpcztcbiAgICBjbG9uZS5sYXp5VXBkYXRlID0gKHRoaXMubGF6eVVwZGF0ZSB8fCBbXSkuY29uY2F0KFt1cGRhdGVdKTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VXBkYXRlKHVwZGF0ZTogVXBkYXRlKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gdXBkYXRlLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBzd2l0Y2ggKHVwZGF0ZS5vcCkge1xuICAgICAgY2FzZSAnYSc6XG4gICAgICBjYXNlICdzJzpcbiAgICAgICAgbGV0IHZhbHVlID0gdXBkYXRlLnZhbHVlITtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSA9IFt2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1heWJlU2V0Tm9ybWFsaXplZE5hbWUodXBkYXRlLm5hbWUsIGtleSk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSAodXBkYXRlLm9wID09PSAnYScgPyB0aGlzLmhlYWRlcnMuZ2V0KGtleSkgOiB1bmRlZmluZWQpIHx8IFtdO1xuICAgICAgICBiYXNlLnB1c2goLi4udmFsdWUpO1xuICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KGtleSwgYmFzZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNvbnN0IHRvRGVsZXRlID0gdXBkYXRlLnZhbHVlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCF0b0RlbGV0ZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5kZWxldGUoa2V5KTtcbiAgICAgICAgICB0aGlzLm5vcm1hbGl6ZWROYW1lcy5kZWxldGUoa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgZXhpc3RpbmcgPSB0aGlzLmhlYWRlcnMuZ2V0KGtleSk7XG4gICAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBleGlzdGluZyA9IGV4aXN0aW5nLmZpbHRlcih2YWx1ZSA9PiB0b0RlbGV0ZS5pbmRleE9mKHZhbHVlKSA9PT0gLTEpO1xuICAgICAgICAgIGlmIChleGlzdGluZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIHRoaXMubm9ybWFsaXplZE5hbWVzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KGtleSwgZXhpc3RpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldEhlYWRlckVudHJpZXMobmFtZTogc3RyaW5nLCB2YWx1ZXM6IGFueSkge1xuICAgIGNvbnN0IGhlYWRlclZhbHVlcyA9XG4gICAgICAgIChBcnJheS5pc0FycmF5KHZhbHVlcykgPyB2YWx1ZXMgOiBbdmFsdWVzXSkubWFwKCh2YWx1ZSkgPT4gdmFsdWUudG9TdHJpbmcoKSk7XG4gICAgY29uc3Qga2V5ID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMuaGVhZGVycy5zZXQoa2V5LCBoZWFkZXJWYWx1ZXMpO1xuICAgIHRoaXMubWF5YmVTZXROb3JtYWxpemVkTmFtZShuYW1lLCBrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZm9yRWFjaChmbjogKG5hbWU6IHN0cmluZywgdmFsdWVzOiBzdHJpbmdbXSkgPT4gdm9pZCkge1xuICAgIHRoaXMuaW5pdCgpO1xuICAgIEFycmF5LmZyb20odGhpcy5ub3JtYWxpemVkTmFtZXMua2V5cygpKVxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZm4odGhpcy5ub3JtYWxpemVkTmFtZXMuZ2V0KGtleSkhLCB0aGlzLmhlYWRlcnMuZ2V0KGtleSkhKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWZXJpZmllcyB0aGF0IHRoZSBoZWFkZXJzIG9iamVjdCBoYXMgdGhlIHJpZ2h0IHNoYXBlOiB0aGUgdmFsdWVzXG4gKiBtdXN0IGJlIGVpdGhlciBzdHJpbmdzLCBudW1iZXJzIG9yIGFycmF5cy4gVGhyb3dzIGFuIGVycm9yIGlmIGFuIGludmFsaWRcbiAqIGhlYWRlciB2YWx1ZSBpcyBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBhc3NlcnRWYWxpZEhlYWRlcnMoaGVhZGVyczogUmVjb3JkPHN0cmluZywgdW5rbm93bj58SGVhZGVycyk6XG4gICAgYXNzZXJ0cyBoZWFkZXJzIGlzIFJlY29yZDxzdHJpbmcsIHN0cmluZ3xzdHJpbmdbXXxudW1iZXJ8bnVtYmVyW10+IHtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoaGVhZGVycykpIHtcbiAgICBpZiAoISh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHZhbHVlIG9mIHRoZSBcXGAke2tleX1cXGAgaGVhZGVyIHByb3ZpZGVkLiBgICtcbiAgICAgICAgICBgRXhwZWN0aW5nIGVpdGhlciBhIHN0cmluZywgYSBudW1iZXIgb3IgYW4gYXJyYXksIGJ1dCBnb3Q6IFxcYCR7dmFsdWV9XFxgLmApO1xuICAgIH1cbiAgfVxufVxuIl19