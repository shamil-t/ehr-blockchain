/**
 * @packageDocumentation
 *
 * A class that lets you do operations over a list of Uint8Arrays without
 * copying them.
 *
 * ```js
 * import { Uint8ArrayList } from 'uint8arraylist'
 *
 * const list = new Uint8ArrayList()
 * list.append(Uint8Array.from([0, 1, 2]))
 * list.append(Uint8Array.from([3, 4, 5]))
 *
 * list.subarray()
 * // -> Uint8Array([0, 1, 2, 3, 4, 5])
 *
 * list.consume(3)
 * list.subarray()
 * // -> Uint8Array([3, 4, 5])
 *
 * // you can also iterate over the list
 * for (const buf of list) {
 *   // ..do something with `buf`
 * }
 *
 * list.subarray(0, 1)
 * // -> Uint8Array([0])
 * ```
 *
 * ## Converting Uint8ArrayLists to Uint8Arrays
 *
 * There are two ways to turn a `Uint8ArrayList` into a `Uint8Array` - `.slice` and `.subarray` and one way to turn a `Uint8ArrayList` into a `Uint8ArrayList` with different contents - `.sublist`.
 *
 * ### slice
 *
 * Slice follows the same semantics as [Uint8Array.slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice) in that it creates a new `Uint8Array` and copies bytes into it using an optional offset & length.
 *
 * ```js
 * const list = new Uint8ArrayList()
 * list.append(Uint8Array.from([0, 1, 2]))
 * list.append(Uint8Array.from([3, 4, 5]))
 *
 * list.slice(0, 1)
 * // -> Uint8Array([0])
 * ```
 *
 * ### subarray
 *
 * Subarray attempts to follow the same semantics as [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray) with one important different - this is a no-copy operation, unless the requested bytes span two internal buffers in which case it is a copy operation.
 *
 * ```js
 * const list = new Uint8ArrayList()
 * list.append(Uint8Array.from([0, 1, 2]))
 * list.append(Uint8Array.from([3, 4, 5]))
 *
 * list.subarray(0, 1)
 * // -> Uint8Array([0]) - no-copy
 *
 * list.subarray(2, 5)
 * // -> Uint8Array([2, 3, 4]) - copy
 * ```
 *
 * ### sublist
 *
 * Sublist creates and returns a new `Uint8ArrayList` that shares the underlying buffers with the original so is always a no-copy operation.
 *
 * ```js
 * const list = new Uint8ArrayList()
 * list.append(Uint8Array.from([0, 1, 2]))
 * list.append(Uint8Array.from([3, 4, 5]))
 *
 * list.sublist(0, 1)
 * // -> Uint8ArrayList([0]) - no-copy
 *
 * list.sublist(2, 5)
 * // -> Uint8ArrayList([2], [3, 4]) - no-copy
 * ```
 *
 * ## Inspiration
 *
 * Borrows liberally from [bl](https://www.npmjs.com/package/bl) but only uses native JS types.
 */
import { allocUnsafe, alloc } from 'uint8arrays/alloc'
import { concat } from 'uint8arrays/concat'
import { equals } from 'uint8arrays/equals'

const symbol = Symbol.for('@achingbrain/uint8arraylist')

export type Appendable = Uint8ArrayList | Uint8Array

function findBufAndOffset (bufs: Uint8Array[], index: number): { buf: Uint8Array, index: number } {
  if (index == null || index < 0) {
    throw new RangeError('index is out of bounds')
  }

  let offset = 0

  for (const buf of bufs) {
    const bufEnd = offset + buf.byteLength

    if (index < bufEnd) {
      return {
        buf,
        index: index - offset
      }
    }

    offset = bufEnd
  }

  throw new RangeError('index is out of bounds')
}

/**
 * Check if object is a CID instance
 *
 * @example
 *
 * ```js
 * import { isUint8ArrayList, Uint8ArrayList } from 'uint8arraylist'
 *
 * isUint8ArrayList(true) // false
 * isUint8ArrayList([]) // false
 * isUint8ArrayList(new Uint8ArrayList()) // true
 * ```
 */
export function isUint8ArrayList (value: any): value is Uint8ArrayList {
  return Boolean(value?.[symbol])
}

export class Uint8ArrayList implements Iterable<Uint8Array> {
  private bufs: Uint8Array[]
  public length: number
  public readonly [symbol] = true

  constructor (...data: Appendable[]) {
    this.bufs = []
    this.length = 0

    if (data.length > 0) {
      this.appendAll(data)
    }
  }

  * [Symbol.iterator] (): Iterator<Uint8Array> {
    yield * this.bufs
  }

  get byteLength (): number {
    return this.length
  }

  /**
   * Add one or more `bufs` to the end of this Uint8ArrayList
   */
  append (...bufs: Appendable[]): void {
    this.appendAll(bufs)
  }

  /**
   * Add all `bufs` to the end of this Uint8ArrayList
   */
  appendAll (bufs: Appendable[]): void {
    let length = 0

    for (const buf of bufs) {
      if (buf instanceof Uint8Array) {
        length += buf.byteLength
        this.bufs.push(buf)
      } else if (isUint8ArrayList(buf)) {
        length += buf.byteLength
        this.bufs.push(...buf.bufs)
      } else {
        throw new Error('Could not append value, must be an Uint8Array or a Uint8ArrayList')
      }
    }

    this.length += length
  }

  /**
   * Add one or more `bufs` to the start of this Uint8ArrayList
   */
  prepend (...bufs: Appendable[]): void {
    this.prependAll(bufs)
  }

  /**
   * Add all `bufs` to the start of this Uint8ArrayList
   */
  prependAll (bufs: Appendable[]): void {
    let length = 0

    for (const buf of bufs.reverse()) {
      if (buf instanceof Uint8Array) {
        length += buf.byteLength
        this.bufs.unshift(buf)
      } else if (isUint8ArrayList(buf)) {
        length += buf.byteLength
        this.bufs.unshift(...buf.bufs)
      } else {
        throw new Error('Could not prepend value, must be an Uint8Array or a Uint8ArrayList')
      }
    }

    this.length += length
  }

  /**
   * Read the value at `index`
   */
  get (index: number): number {
    const res = findBufAndOffset(this.bufs, index)

    return res.buf[res.index]
  }

  /**
   * Set the value at `index` to `value`
   */
  set (index: number, value: number): void {
    const res = findBufAndOffset(this.bufs, index)

    res.buf[res.index] = value
  }

  /**
   * Copy bytes from `buf` to the index specified by `offset`
   */
  write (buf: Appendable, offset: number = 0): void {
    if (buf instanceof Uint8Array) {
      for (let i = 0; i < buf.length; i++) {
        this.set(offset + i, buf[i])
      }
    } else if (isUint8ArrayList(buf)) {
      for (let i = 0; i < buf.length; i++) {
        this.set(offset + i, buf.get(i))
      }
    } else {
      throw new Error('Could not write value, must be an Uint8Array or a Uint8ArrayList')
    }
  }

  /**
   * Remove bytes from the front of the pool
   */
  consume (bytes: number): void {
    // first, normalize the argument, in accordance with how Buffer does it
    bytes = Math.trunc(bytes)

    // do nothing if not a positive number
    if (Number.isNaN(bytes) || bytes <= 0) {
      return
    }

    // if consuming all bytes, skip iterating
    if (bytes === this.byteLength) {
      this.bufs = []
      this.length = 0
      return
    }

    while (this.bufs.length > 0) {
      if (bytes >= this.bufs[0].byteLength) {
        bytes -= this.bufs[0].byteLength
        this.length -= this.bufs[0].byteLength
        this.bufs.shift()
      } else {
        this.bufs[0] = this.bufs[0].subarray(bytes)
        this.length -= bytes
        break
      }
    }
  }

  /**
   * Extracts a section of an array and returns a new array.
   *
   * This is a copy operation as it is with Uint8Arrays and Arrays
   * - note this is different to the behaviour of Node Buffers.
   */
  slice (beginInclusive?: number, endExclusive?: number): Uint8Array {
    const { bufs, length } = this._subList(beginInclusive, endExclusive)

    return concat(bufs, length)
  }

  /**
   * Returns a alloc from the given start and end element index.
   *
   * In the best case where the data extracted comes from a single Uint8Array
   * internally this is a no-copy operation otherwise it is a copy operation.
   */
  subarray (beginInclusive?: number, endExclusive?: number): Uint8Array {
    const { bufs, length } = this._subList(beginInclusive, endExclusive)

    if (bufs.length === 1) {
      return bufs[0]
    }

    return concat(bufs, length)
  }

  /**
   * Returns a allocList from the given start and end element index.
   *
   * This is a no-copy operation.
   */
  sublist (beginInclusive?: number, endExclusive?: number): Uint8ArrayList {
    const { bufs, length } = this._subList(beginInclusive, endExclusive)

    const list = new Uint8ArrayList()
    list.length = length
    // don't loop, just set the bufs
    list.bufs = [...bufs]

    return list
  }

  private _subList (beginInclusive?: number, endExclusive?: number): { bufs: Uint8Array[], length: number } {
    beginInclusive = beginInclusive ?? 0
    endExclusive = endExclusive ?? this.length

    if (beginInclusive < 0) {
      beginInclusive = this.length + beginInclusive
    }

    if (endExclusive < 0) {
      endExclusive = this.length + endExclusive
    }

    if (beginInclusive < 0 || endExclusive > this.length) {
      throw new RangeError('index is out of bounds')
    }

    if (beginInclusive === endExclusive) {
      return { bufs: [], length: 0 }
    }

    if (beginInclusive === 0 && endExclusive === this.length) {
      return { bufs: this.bufs, length: this.length }
    }

    const bufs: Uint8Array[] = []
    let offset = 0

    for (let i = 0; i < this.bufs.length; i++) {
      const buf = this.bufs[i]
      const bufStart = offset
      const bufEnd = bufStart + buf.byteLength

      // for next loop
      offset = bufEnd

      if (beginInclusive >= bufEnd) {
        // start after this buf
        continue
      }

      const sliceStartInBuf = beginInclusive >= bufStart && beginInclusive < bufEnd
      const sliceEndsInBuf = endExclusive > bufStart && endExclusive <= bufEnd

      if (sliceStartInBuf && sliceEndsInBuf) {
        // slice is wholly contained within this buffer
        if (beginInclusive === bufStart && endExclusive === bufEnd) {
          // requested whole buffer
          bufs.push(buf)
          break
        }

        // requested part of buffer
        const start = beginInclusive - bufStart
        bufs.push(buf.subarray(start, start + (endExclusive - beginInclusive)))
        break
      }

      if (sliceStartInBuf) {
        // slice starts in this buffer
        if (beginInclusive === 0) {
          // requested whole buffer
          bufs.push(buf)
          continue
        }

        // requested part of buffer
        bufs.push(buf.subarray(beginInclusive - bufStart))
        continue
      }

      if (sliceEndsInBuf) {
        if (endExclusive === bufEnd) {
          // requested whole buffer
          bufs.push(buf)
          break
        }

        // requested part of buffer
        bufs.push(buf.subarray(0, endExclusive - bufStart))
        break
      }

      // slice started before this buffer and ends after it
      bufs.push(buf)
    }

    return { bufs, length: endExclusive - beginInclusive }
  }

  indexOf (search: Uint8ArrayList | Uint8Array, offset: number = 0): number {
    if (!isUint8ArrayList(search) && !(search instanceof Uint8Array)) {
      throw new TypeError('The "value" argument must be a Uint8ArrayList or Uint8Array')
    }

    const needle = search instanceof Uint8Array ? search : search.subarray()

    offset = Number(offset ?? 0)

    if (isNaN(offset)) {
      offset = 0
    }

    if (offset < 0) {
      offset = this.length + offset
    }

    if (offset < 0) {
      offset = 0
    }

    if (search.length === 0) {
      return offset > this.length ? this.length : offset
    }

    // https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm
    const M: number = needle.byteLength

    if (M === 0) {
      throw new TypeError('search must be at least 1 byte long')
    }

    // radix
    const radix: number = 256
    const rightmostPositions: Int32Array = new Int32Array(radix)

    // position of the rightmost occurrence of the byte c in the pattern
    for (let c: number = 0; c < radix; c++) {
      // -1 for bytes not in pattern
      rightmostPositions[c] = -1
    }

    for (let j = 0; j < M; j++) {
      // rightmost position for bytes in pattern
      rightmostPositions[needle[j]] = j
    }

    // Return offset of first match, -1 if no match
    const right = rightmostPositions
    const lastIndex = this.byteLength - needle.byteLength
    const lastPatIndex = needle.byteLength - 1
    let skip: number

    for (let i = offset; i <= lastIndex; i += skip) {
      skip = 0

      for (let j = lastPatIndex; j >= 0; j--) {
        const char: number = this.get(i + j)

        if (needle[j] !== char) {
          skip = Math.max(1, j - right[char])
          break
        }
      }

      if (skip === 0) {
        return i
      }
    }

    return -1
  }

  getInt8 (byteOffset: number): number {
    const buf = this.subarray(byteOffset, byteOffset + 1)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getInt8(0)
  }

  setInt8 (byteOffset: number, value: number): void {
    const buf = allocUnsafe(1)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setInt8(0, value)

    this.write(buf, byteOffset)
  }

  getInt16 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 2)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getInt16(0, littleEndian)
  }

  setInt16 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(2)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setInt16(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getInt32 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getInt32(0, littleEndian)
  }

  setInt32 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setInt32(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getBigInt64 (byteOffset: number, littleEndian?: boolean): bigint {
    const buf = this.subarray(byteOffset, byteOffset + 8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getBigInt64(0, littleEndian)
  }

  setBigInt64 (byteOffset: number, value: bigint, littleEndian?: boolean): void {
    const buf = alloc(8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setBigInt64(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getUint8 (byteOffset: number): number {
    const buf = this.subarray(byteOffset, byteOffset + 1)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getUint8(0)
  }

  setUint8 (byteOffset: number, value: number): void {
    const buf = allocUnsafe(1)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setUint8(0, value)

    this.write(buf, byteOffset)
  }

  getUint16 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 2)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getUint16(0, littleEndian)
  }

  setUint16 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(2)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setUint16(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getUint32 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getUint32(0, littleEndian)
  }

  setUint32 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setUint32(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getBigUint64 (byteOffset: number, littleEndian?: boolean): bigint {
    const buf = this.subarray(byteOffset, byteOffset + 8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getBigUint64(0, littleEndian)
  }

  setBigUint64 (byteOffset: number, value: bigint, littleEndian?: boolean): void {
    const buf = alloc(8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setBigUint64(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getFloat32 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getFloat32(0, littleEndian)
  }

  setFloat32 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(4)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setFloat32(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  getFloat64 (byteOffset: number, littleEndian?: boolean): number {
    const buf = this.subarray(byteOffset, byteOffset + 8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

    return view.getFloat64(0, littleEndian)
  }

  setFloat64 (byteOffset: number, value: number, littleEndian?: boolean): void {
    const buf = alloc(8)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    view.setFloat64(0, value, littleEndian)

    this.write(buf, byteOffset)
  }

  equals (other: any): other is Uint8ArrayList {
    if (other == null) {
      return false
    }

    if (!(other instanceof Uint8ArrayList)) {
      return false
    }

    if (other.bufs.length !== this.bufs.length) {
      return false
    }

    for (let i = 0; i < this.bufs.length; i++) {
      if (!equals(this.bufs[i], other.bufs[i])) {
        return false
      }
    }

    return true
  }

  /**
   * Create a Uint8ArrayList from a pre-existing list of Uint8Arrays.  Use this
   * method if you know the total size of all the Uint8Arrays ahead of time.
   */
  static fromUint8Arrays (bufs: Uint8Array[], length?: number): Uint8ArrayList {
    const list = new Uint8ArrayList()
    list.bufs = bufs

    if (length == null) {
      length = bufs.reduce((acc, curr) => acc + curr.byteLength, 0)
    }

    list.length = length

    return list
  }
}

/*
function indexOf (needle: Uint8Array, haystack: Uint8Array, offset = 0) {
  for (let i = offset; i < haystack.byteLength; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        break
      }

      if (j === needle.byteLength -1) {
        return i
      }
    }

    if (haystack.byteLength - i < needle.byteLength) {
      break
    }
  }

  return -1
}
*/
