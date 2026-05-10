/**
 * Wraps a base storage with an optional key prefix and request
 * deduplication — concurrent `getItem` calls for the same key share
 * a single in-flight promise.
 *
 * @example
 * ```ts
 * import * as Storage from 'viem/tempo/zones'
 *
 * const storage = Storage.from(Storage.memory(), { key: 'tempo' })
 * await storage.setItem('foo', 'bar')
 * // stored under "tempo:foo"
 * ```
 */
export function from(storage, options = {}) {
    const { key } = options;
    const prefix = key ? `${key}:` : '';
    const inflight = new Map();
    return {
        getItem(k) {
            const fullKey = `${prefix}${k}`;
            const existing = inflight.get(fullKey);
            if (existing)
                return existing;
            const result = Promise.resolve(storage.getItem(fullKey)).finally(() => {
                inflight.delete(fullKey);
            });
            inflight.set(fullKey, result);
            return result;
        },
        setItem(k, value) {
            const fullKey = `${prefix}${k}`;
            inflight.delete(fullKey);
            return storage.setItem(fullKey, value);
        },
        removeItem(k) {
            const fullKey = `${prefix}${k}`;
            inflight.delete(fullKey);
            return storage.removeItem(fullKey);
        },
    };
}
/** Creates an in-memory storage backed by a `Map`. */
export function memory(options = {}) {
    const store = new Map();
    return from({
        getItem(key) {
            return store.get(key) ?? null;
        },
        setItem(key, value) {
            store.set(key, value);
        },
        removeItem(key) {
            store.delete(key);
        },
    }, options);
}
/** Creates a storage backed by `globalThis.sessionStorage`. */
export function session(options = {}) {
    return from({
        getItem(key) {
            return globalThis.sessionStorage.getItem(key);
        },
        setItem(key, value) {
            try {
                globalThis.sessionStorage.setItem(key, value);
            }
            catch { }
        },
        removeItem(key) {
            globalThis.sessionStorage.removeItem(key);
        },
    }, options);
}
let _default;
/**
 * Returns the default storage for the current environment.
 *
 * Returns a singleton so that the zone transport and actions share the
 * same instance without requiring explicit plumbing.
 *
 * - Browser: `sessionStorage`
 * - Server/unsupported: in-memory `Map`-based storage
 */
export function defaultStorage() {
    if (_default)
        return _default;
    if (typeof globalThis !== 'undefined' &&
        'sessionStorage' in globalThis &&
        globalThis.sessionStorage)
        _default = session();
    else
        _default = memory();
    return _default;
}
//# sourceMappingURL=Storage.js.map