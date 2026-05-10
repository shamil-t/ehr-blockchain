declare const symbol: unique symbol;
export type Appendable = Uint8ArrayList | Uint8Array;
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
export declare function isUint8ArrayList(value: any): value is Uint8ArrayList;
export declare class Uint8ArrayList implements Iterable<Uint8Array> {
    private bufs;
    length: number;
    readonly [symbol] = true;
    constructor(...data: Appendable[]);
    [Symbol.iterator](): Iterator<Uint8Array>;
    get byteLength(): number;
    /**
     * Add one or more `bufs` to the end of this Uint8ArrayList
     */
    append(...bufs: Appendable[]): void;
    /**
     * Add all `bufs` to the end of this Uint8ArrayList
     */
    appendAll(bufs: Appendable[]): void;
    /**
     * Add one or more `bufs` to the start of this Uint8ArrayList
     */
    prepend(...bufs: Appendable[]): void;
    /**
     * Add all `bufs` to the start of this Uint8ArrayList
     */
    prependAll(bufs: Appendable[]): void;
    /**
     * Read the value at `index`
     */
    get(index: number): number;
    /**
     * Set the value at `index` to `value`
     */
    set(index: number, value: number): void;
    /**
     * Copy bytes from `buf` to the index specified by `offset`
     */
    write(buf: Appendable, offset?: number): void;
    /**
     * Remove bytes from the front of the pool
     */
    consume(bytes: number): void;
    /**
     * Extracts a section of an array and returns a new array.
     *
     * This is a copy operation as it is with Uint8Arrays and Arrays
     * - note this is different to the behaviour of Node Buffers.
     */
    slice(beginInclusive?: number, endExclusive?: number): Uint8Array;
    /**
     * Returns a alloc from the given start and end element index.
     *
     * In the best case where the data extracted comes from a single Uint8Array
     * internally this is a no-copy operation otherwise it is a copy operation.
     */
    subarray(beginInclusive?: number, endExclusive?: number): Uint8Array;
    /**
     * Returns a allocList from the given start and end element index.
     *
     * This is a no-copy operation.
     */
    sublist(beginInclusive?: number, endExclusive?: number): Uint8ArrayList;
    private _subList;
    indexOf(search: Uint8ArrayList | Uint8Array, offset?: number): number;
    getInt8(byteOffset: number): number;
    setInt8(byteOffset: number, value: number): void;
    getInt16(byteOffset: number, littleEndian?: boolean): number;
    setInt16(byteOffset: number, value: number, littleEndian?: boolean): void;
    getInt32(byteOffset: number, littleEndian?: boolean): number;
    setInt32(byteOffset: number, value: number, littleEndian?: boolean): void;
    getBigInt64(byteOffset: number, littleEndian?: boolean): bigint;
    setBigInt64(byteOffset: number, value: bigint, littleEndian?: boolean): void;
    getUint8(byteOffset: number): number;
    setUint8(byteOffset: number, value: number): void;
    getUint16(byteOffset: number, littleEndian?: boolean): number;
    setUint16(byteOffset: number, value: number, littleEndian?: boolean): void;
    getUint32(byteOffset: number, littleEndian?: boolean): number;
    setUint32(byteOffset: number, value: number, littleEndian?: boolean): void;
    getBigUint64(byteOffset: number, littleEndian?: boolean): bigint;
    setBigUint64(byteOffset: number, value: bigint, littleEndian?: boolean): void;
    getFloat32(byteOffset: number, littleEndian?: boolean): number;
    setFloat32(byteOffset: number, value: number, littleEndian?: boolean): void;
    getFloat64(byteOffset: number, littleEndian?: boolean): number;
    setFloat64(byteOffset: number, value: number, littleEndian?: boolean): void;
    equals(other: any): other is Uint8ArrayList;
    /**
     * Create a Uint8ArrayList from a pre-existing list of Uint8Arrays.  Use this
     * method if you know the total size of all the Uint8Arrays ahead of time.
     */
    static fromUint8Arrays(bufs: Uint8Array[], length?: number): Uint8ArrayList;
}
export {};
//# sourceMappingURL=index.d.ts.map