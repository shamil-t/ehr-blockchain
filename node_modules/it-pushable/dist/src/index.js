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
import deferred from 'p-defer';
import { FIFO } from './fifo.js';
export class AbortError extends Error {
    type;
    code;
    constructor(message, code) {
        super(message ?? 'The operation was aborted');
        this.type = 'aborted';
        this.code = code ?? 'ABORT_ERR';
    }
}
export function pushable(options = {}) {
    const getNext = (buffer) => {
        const next = buffer.shift();
        if (next == null) {
            return { done: true };
        }
        if (next.error != null) {
            throw next.error;
        }
        return {
            done: next.done === true,
            // @ts-expect-error if done is false, value will be present
            value: next.value
        };
    };
    return _pushable(getNext, options);
}
export function pushableV(options = {}) {
    const getNext = (buffer) => {
        let next;
        const values = [];
        while (!buffer.isEmpty()) {
            next = buffer.shift();
            if (next == null) {
                break;
            }
            if (next.error != null) {
                throw next.error;
            }
            if (next.done === false) {
                // @ts-expect-error if done is false value should be pushed
                values.push(next.value);
            }
        }
        if (next == null) {
            return { done: true };
        }
        return {
            done: next.done === true,
            value: values
        };
    };
    return _pushable(getNext, options);
}
function _pushable(getNext, options) {
    options = options ?? {};
    let onEnd = options.onEnd;
    let buffer = new FIFO();
    let pushable;
    let onNext;
    let ended;
    let drain = deferred();
    const waitNext = async () => {
        try {
            if (!buffer.isEmpty()) {
                return getNext(buffer);
            }
            if (ended) {
                return { done: true };
            }
            return await new Promise((resolve, reject) => {
                onNext = (next) => {
                    onNext = null;
                    buffer.push(next);
                    try {
                        resolve(getNext(buffer));
                    }
                    catch (err) {
                        reject(err);
                    }
                    return pushable;
                };
            });
        }
        finally {
            if (buffer.isEmpty()) {
                // settle promise in the microtask queue to give consumers a chance to
                // await after calling .push
                queueMicrotask(() => {
                    drain.resolve();
                    drain = deferred();
                });
            }
        }
    };
    const bufferNext = (next) => {
        if (onNext != null) {
            return onNext(next);
        }
        buffer.push(next);
        return pushable;
    };
    const bufferError = (err) => {
        buffer = new FIFO();
        if (onNext != null) {
            return onNext({ error: err });
        }
        buffer.push({ error: err });
        return pushable;
    };
    const push = (value) => {
        if (ended) {
            return pushable;
        }
        // @ts-expect-error `byteLength` is not declared on PushType
        if (options?.objectMode !== true && value?.byteLength == null) {
            throw new Error('objectMode was not true but tried to push non-Uint8Array value');
        }
        return bufferNext({ done: false, value });
    };
    const end = (err) => {
        if (ended)
            return pushable;
        ended = true;
        return (err != null) ? bufferError(err) : bufferNext({ done: true });
    };
    const _return = () => {
        buffer = new FIFO();
        end();
        return { done: true };
    };
    const _throw = (err) => {
        end(err);
        return { done: true };
    };
    pushable = {
        [Symbol.asyncIterator]() { return this; },
        next: waitNext,
        return: _return,
        throw: _throw,
        push,
        end,
        get readableLength() {
            return buffer.size;
        },
        onEmpty: async (options) => {
            const signal = options?.signal;
            signal?.throwIfAborted();
            if (buffer.isEmpty()) {
                return;
            }
            let cancel;
            let listener;
            if (signal != null) {
                cancel = new Promise((resolve, reject) => {
                    listener = () => {
                        reject(new AbortError());
                    };
                    signal.addEventListener('abort', listener);
                });
            }
            try {
                await Promise.race([
                    drain.promise,
                    cancel
                ]);
            }
            finally {
                if (listener != null && signal != null) {
                    signal?.removeEventListener('abort', listener);
                }
            }
        }
    };
    if (onEnd == null) {
        return pushable;
    }
    const _pushable = pushable;
    pushable = {
        [Symbol.asyncIterator]() { return this; },
        next() {
            return _pushable.next();
        },
        throw(err) {
            _pushable.throw(err);
            if (onEnd != null) {
                onEnd(err);
                onEnd = undefined;
            }
            return { done: true };
        },
        return() {
            _pushable.return();
            if (onEnd != null) {
                onEnd();
                onEnd = undefined;
            }
            return { done: true };
        },
        push,
        end(err) {
            _pushable.end(err);
            if (onEnd != null) {
                onEnd(err);
                onEnd = undefined;
            }
            return pushable;
        },
        get readableLength() {
            return _pushable.readableLength;
        },
        onEmpty: (opts) => {
            return _pushable.onEmpty(opts);
        }
    };
    return pushable;
}
//# sourceMappingURL=index.js.map