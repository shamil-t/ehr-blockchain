"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LruMap = void 0;
class LruMap extends Map {
    constructor(size) {
        super();
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.maxSize = size;
    }
    get(key) {
        const value = super.get(key);
        if (super.has(key)) {
            super.delete(key);
            super.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (super.has(key))
            super.delete(key);
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
            const firstKey = super.keys().next().value;
            if (firstKey !== undefined)
                super.delete(firstKey);
        }
        return this;
    }
}
exports.LruMap = LruMap;
//# sourceMappingURL=lru.js.map