"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from = from;
exports.memory = memory;
exports.session = session;
exports.defaultStorage = defaultStorage;
function from(storage, options = {}) {
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
function memory(options = {}) {
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
function session(options = {}) {
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
function defaultStorage() {
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