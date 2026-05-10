/* eslint-disable @typescript-eslint/ban-types */
// this ignore is so we can use {} as the default value for the options
// extensions below - it normally means "any non-nullish value" but here
// we are using it as an intersection type - see the aside at the bottom:
// https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492

/**
 * @packageDocumentation
 *
 * An abstraction of the Datastore/Blockstore codebases.
 */

/**
 * An iterable or async iterable of values
 */
export type AwaitIterable<T> = Iterable<T> | AsyncIterable<T>

/**
 * A value or a promise of a value
 */
export type Await<T> = Promise<T> | T

/**
 * Options for async operations.
 */
export interface AbortOptions {
  signal?: AbortSignal
}

export interface Store<Key, Value, Pair, HasOptionsExtension = {},
  PutOptionsExtension = {}, PutManyOptionsExtension = {},
  GetOptionsExtension = {}, GetManyOptionsExtension = {},
  DeleteOptionsExtension = {}, DeleteManyOptionsExtension = {}> {
  /**
   * Check for the existence of a value for the passed key
   *
   * @example
   * ```js
   *const exists = await store.has(new Key('awesome'))
   *
   *if (exists) {
   *  console.log('it is there')
   *} else {
   *  console.log('it is not there')
   *}
   *```
   */
  has(key: Key, options?: AbortOptions & HasOptionsExtension): Await<boolean>

  /**
   * Store the passed value under the passed key
   *
   * @example
   *
   * ```js
   * await store.put([{ key: new Key('awesome'), value: new Uint8Array([0, 1, 2, 3]) }])
   * ```
   */
  put(key: Key, val: Value, options?: AbortOptions & PutOptionsExtension): Await<Key>

  /**
   * Store the given key/value pairs
   *
   * @example
   * ```js
   * const source = [{ key: new Key('awesome'), value: new Uint8Array([0, 1, 2, 3]) }]
   *
   * for await (const { key, value } of store.putMany(source)) {
   *   console.info(`put content for key ${key}`)
   * }
   * ```
   */
  putMany(
    source: AwaitIterable<Pair>,
    options?: AbortOptions & PutManyOptionsExtension
  ): AwaitIterable<Key>

  /**
   * Retrieve the value stored under the given key
   *
   * @example
   * ```js
   * const value = await store.get(new Key('awesome'))
   * console.log('got content: %s', value.toString('utf8'))
   * // => got content: datastore
   * ```
   */
  get(key: Key, options?: AbortOptions & GetOptionsExtension): Await<Value>

  /**
   * Retrieve values for the passed keys
   *
   * @example
   * ```js
   * for await (const { key, value } of store.getMany([new Key('awesome')])) {
   *   console.log(`got "${key}" = "${new TextDecoder('utf8').decode(value)}"`')
   *   // => got "/awesome" = "datastore"
   * }
   * ```
   */
  getMany(
    source: AwaitIterable<Key>,
    options?: AbortOptions & GetManyOptionsExtension
  ): AwaitIterable<Pair>

  /**
   * Remove the record for the passed key
   *
   * @example
   *
   * ```js
   * await store.delete(new Key('awesome'))
   * console.log('deleted awesome content :(')
   * ```
   */
  delete(key: Key, options?: AbortOptions & DeleteOptionsExtension): Await<void>

  /**
   * Remove values for the passed keys
   *
   * @example
   *
   * ```js
   * const source = [new Key('awesome')]
   *
   * for await (const key of store.deleteMany(source)) {
   *   console.log(`deleted content with key ${key}`)
   * }
   * ```
   */
  deleteMany(
    source: AwaitIterable<Key>,
    options?: AbortOptions & DeleteManyOptionsExtension
  ): AwaitIterable<Key>
}
