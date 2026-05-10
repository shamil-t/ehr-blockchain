/**
 * A "transform" is both a sink and a source where the values it consumes
 * and the values that can be consumed from it are connected in some way.
 * It is a function that takes a source and returns a source.
 */
export interface Transform<A, B = A> {
    (source: A): B;
}
/**
 * A "sink" is something that consumes (or drains) a source. It is a
 * function that takes a source and iterates over it. It optionally returns
 * a value.
 */
export interface Sink<Source, R = unknown> {
    (source: Source): R;
}
/**
 * A "source" is something that can be consumed. It is an iterable object.
 *
 * This type is a union of both sync and async sources - it is useful to keep
 * code concise but declared types should prefer to specify whether they
 * accept sync or async sources since treating a synchronous source as an
 * asynchronous one can lead to performance degradation due to artificially
 * induced asynchronous behaviour.
 */
export type Source<T> = AsyncIterable<T> | Iterable<T>;
/**
 * A "duplex" is similar to a transform but the values it consumes are not
 * necessarily connected to the values that can be consumed from it. It is
 * an object with two properties, sink and source.
 */
export interface Duplex<TSource = unknown, TSink = TSource, RSink = unknown> {
    source: TSource;
    sink: Sink<TSink, RSink>;
}
//# sourceMappingURL=index.d.ts.map