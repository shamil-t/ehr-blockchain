/**
 * A "transform" is both a sink and a source where the values it consumes
 * and the values that can be consumed from it are connected in some way.
 * It is a function that takes a source and returns a source.
 */
export interface Transform<A, B = A> {
  (source: Source<A>): Source<B>
}

/**
 * A "sink" is something that consumes (or drains) a source. It is a
 * function that takes a source and iterates over it. It optionally returns
 * a value.
 */
export interface Sink<T, R = Promise<void>> {
  (source: Source<T>): R
}

/**
 * A "source" is something that can be consumed. It is an iterable object.
 */
export type Source<T> = AsyncIterable<T> | Iterable<T>

/**
 * A "duplex" is similar to a transform but the values it consumes are not
 * necessarily connected to the values that can be consumed from it. It is
 * an object with two properties, sink and source.
 */
export interface Duplex<TSource, TSink = TSource, RSink = Promise<void>> {
  source: Source<TSource>
  sink: Sink<TSink, RSink>
}
