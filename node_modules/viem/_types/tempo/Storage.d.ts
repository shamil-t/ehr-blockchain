import type { MaybePromise } from '../types/utils.js';
export type Storage = {
    getItem(key: string): MaybePromise<string | null | undefined>;
    setItem(key: string, value: string): MaybePromise<void>;
    removeItem(key: string): MaybePromise<void>;
};
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
export declare function from(storage: Storage, options?: from.Options): Storage;
export declare namespace from {
    type Options = {
        /** Key prefix prepended to all storage keys. */
        key?: string | undefined;
    };
}
/** Creates an in-memory storage backed by a `Map`. */
export declare function memory(options?: from.Options): Storage;
/** Creates a storage backed by `globalThis.sessionStorage`. */
export declare function session(options?: from.Options): Storage;
/**
 * Returns the default storage for the current environment.
 *
 * Returns a singleton so that the zone transport and actions share the
 * same instance without requiring explicit plumbing.
 *
 * - Browser: `sessionStorage`
 * - Server/unsupported: in-memory `Map`-based storage
 */
export declare function defaultStorage(): Storage;
//# sourceMappingURL=Storage.d.ts.map