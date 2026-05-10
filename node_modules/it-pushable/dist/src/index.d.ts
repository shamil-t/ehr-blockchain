/**
 * @packageDocumentation
 *
 * An iterable that you can push values into.
 *
 * @example
 *
 * ```js
 * import { pushable } from 'it-pushable'
 *
 * const source = pushable()
 *
 * setTimeout(() => source.push('hello'), 100)
 * setTimeout(() => source.push('world'), 200)
 * setTimeout(() => source.end(), 300)
 *
 * const start = Date.now()
 *
 * for await (const value of source) {
 *   console.log(`got "${value}" after ${Date.now() - start}ms`)
 * }
 * console.log(`done after ${Date.now() - start}ms`)
 *
 * // Output:
 * // got "hello" after 105ms
 * // got "world" after 207ms
 * // done after 309ms
 * ```
 *
 * @example
 *
 * ```js
 * import { pushableV } from 'it-pushable'
 * import all from 'it-all'
 *
 * const source = pushableV()
 *
 * source.push(1)
 * source.push(2)
 * source.push(3)
 * source.end()
 *
 * console.info(await all(source))
 *
 * // Output:
 * // [ [1, 2, 3] ]
 * ```
 */
export declare class AbortError extends Error {
    type: string;
    code: string;
    constructor(message?: string, code?: string);
}
export interface AbortOptions {
    signal?: AbortSignal;
}
interface BasePushable<T> {
    /**
     * End the iterable after all values in the buffer (if any) have been yielded. If an
     * error is passed the buffer is cleared immediately and the next iteration will
     * throw the passed error
     */
    end(err?: Error): this;
    /**
     * Push a value into the iterable. Values are yielded from the iterable in the order
     * they are pushed. Values not yet consumed from the iterable are buffered.
     */
    push(value: T): this;
    /**
     * Returns a promise that resolves when the underlying queue becomes empty (e.g.
     * this.readableLength === 0).
     *
     * If an AbortSignal is passed as an option and that signal aborts, it only
     * causes the returned promise to reject - it does not end the pushable.
     */
    onEmpty(options?: AbortOptions): Promise<void>;
    /**
     * This property contains the number of bytes (or objects) in the queue ready to be read.
     *
     * If `objectMode` is true, this is the number of objects in the queue, if false it's the
     * total number of bytes in the queue.
     */
    readableLength: number;
}
/**
 * An iterable that you can push values into.
 */
export interface Pushable<T, R = void, N = unknown> extends AsyncGenerator<T, R, N>, BasePushable<T> {
}
/**
 * Similar to `pushable`, except it yields multiple buffered chunks at a time. All values yielded from the iterable will be arrays.
 */
export interface PushableV<T, R = void, N = unknown> extends AsyncGenerator<T[], R, N>, BasePushable<T> {
}
export interface Options {
    /**
     * A boolean value that means non-`Uint8Array`s will be passed to `.push`, default: `false`
     */
    objectMode?: boolean;
    /**
     * A function called after *all* values have been yielded from the iterator (including
     * buffered values). In the case when the iterator is ended with an error it will be
     * passed the error as a parameter.
     */
    onEnd?(err?: Error): void;
}
export interface DoneResult {
    done: true;
}
export interface ValueResult<T> {
    done: false;
    value: T;
}
export type NextResult<T> = ValueResult<T> | DoneResult;
export interface ObjectPushableOptions extends Options {
    objectMode: true;
}
export interface BytePushableOptions extends Options {
    objectMode?: false;
}
/**
 * Create a new async iterable. The values yielded from calls to `.next()`
 * or when used in a `for await of`loop are "pushed" into the iterable.
 * Returns an async iterable object with additional methods.
 */
export declare function pushable<T extends {
    byteLength: number;
} = Uint8Array>(options?: BytePushableOptions): Pushable<T>;
export declare function pushable<T>(options: ObjectPushableOptions): Pushable<T>;
export declare function pushableV<T extends {
    byteLength: number;
} = Uint8Array>(options?: BytePushableOptions): PushableV<T>;
export declare function pushableV<T>(options: ObjectPushableOptions): PushableV<T>;
export {};
//# sourceMappingURL=index.d.ts.map