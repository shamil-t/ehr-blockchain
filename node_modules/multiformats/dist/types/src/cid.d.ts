export * from "./link/interface.js";
export function format<T extends API.Link<unknown, number, number, API.Version>, Prefix extends string>(link: T, base?: API.MultibaseEncoder<Prefix> | undefined): API.ToString<T, Prefix>;
export function toJSON<Link extends API.UnknownLink>(link: Link): API.LinkJSON<Link>;
export function fromJSON<Link extends API.UnknownLink>(json: API.LinkJSON<Link>): CID<unknown, number, number, API.Version>;
/**
 * @template {unknown} [Data=unknown]
 * @template {number} [Format=number]
 * @template {number} [Alg=number]
 * @template {API.Version} [Version=API.Version]
 * @implements {API.Link<Data, Format, Alg, Version>}
 */
export class CID<Data extends unknown = unknown, Format extends number = number, Alg extends number = number, Version extends API.Version = API.Version> implements API.Link<Data, Format, Alg, Version> {
    /**
     * @template {unknown} Data
     * @template {number} Format
     * @template {number} Alg
     * @template {API.Version} Version
     * @param {API.Link<Data, Format, Alg, Version>} self
     * @param {unknown} other
     * @returns {other is CID}
     */
    static equals<Data_1 extends unknown, Format_1 extends number, Alg_1 extends number, Version_1 extends API.Version>(self: API.Link<Data_1, Format_1, Alg_1, Version_1>, other: unknown): other is CID<any, number, number, API.Version>;
    /**
     * Takes any input `value` and returns a `CID` instance if it was
     * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
     * it will return value back. If `value` is not instance of this CID
     * class, but is compatible CID it will return new instance of this
     * `CID` class. Otherwise returns null.
     *
     * This allows two different incompatible versions of CID library to
     * co-exist and interop as long as binary interface is compatible.
     *
     * @template {unknown} Data
     * @template {number} Format
     * @template {number} Alg
     * @template {API.Version} Version
     * @template {unknown} U
     * @param {API.Link<Data, Format, Alg, Version>|U} input
     * @returns {CID<Data, Format, Alg, Version>|null}
     */
    static asCID<Data_2 extends unknown, Format_2 extends number, Alg_2 extends number, Version_2 extends API.Version, U extends unknown>(input: U | API.Link<Data_2, Format_2, Alg_2, Version_2>): CID<Data_2, Format_2, Alg_2, Version_2> | null;
    /**
     *
     * @template {unknown} Data
     * @template {number} Format
     * @template {number} Alg
     * @template {API.Version} Version
     * @param {Version} version - Version of the CID
     * @param {Format} code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param {API.MultihashDigest<Alg>} digest - (Multi)hash of the of the content.
     * @returns {CID<Data, Format, Alg, Version>}
     */
    static create<Data_3 extends unknown, Format_3 extends number, Alg_3 extends number, Version_3 extends API.Version>(version: Version_3, code: Format_3, digest: API.MultihashDigest<Alg_3>): CID<Data_3, Format_3, Alg_3, Version_3>;
    /**
     * Simplified version of `create` for CIDv0.
     *
     * @template {unknown} [T=unknown]
     * @param {API.MultihashDigest<typeof SHA_256_CODE>} digest - Multihash.
     * @returns {CID<T, typeof DAG_PB_CODE, typeof SHA_256_CODE, 0>}
     */
    static createV0<T extends unknown = unknown>(digest: API.MultihashDigest<typeof SHA_256_CODE>): CID<T, 112, 18, 0>;
    /**
     * Simplified version of `create` for CIDv1.
     *
     * @template {unknown} Data
     * @template {number} Code
     * @template {number} Alg
     * @param {Code} code - Content encoding format code.
     * @param {API.MultihashDigest<Alg>} digest - Miltihash of the content.
     * @returns {CID<Data, Code, Alg, 1>}
     */
    static createV1<Data_4 extends unknown, Code extends number, Alg_4 extends number>(code: Code, digest: API.MultihashDigest<Alg_4>): CID<Data_4, Code, Alg_4, 1>;
    /**
     * Decoded a CID from its binary representation. The byte array must contain
     * only the CID with no additional bytes.
     *
     * An error will be thrown if the bytes provided do not contain a valid
     * binary representation of a CID.
     *
     * @template {unknown} Data
     * @template {number} Code
     * @template {number} Alg
     * @template {API.Version} Ver
     * @param {API.ByteView<API.Link<Data, Code, Alg, Ver>>} bytes
     * @returns {CID<Data, Code, Alg, Ver>}
     */
    static decode<Data_5 extends unknown, Code_1 extends number, Alg_5 extends number, Ver extends API.Version>(bytes: API.ByteView<API.Link<Data_5, Code_1, Alg_5, Ver>>): CID<Data_5, Code_1, Alg_5, Ver>;
    /**
     * Decoded a CID from its binary representation at the beginning of a byte
     * array.
     *
     * Returns an array with the first element containing the CID and the second
     * element containing the remainder of the original byte array. The remainder
     * will be a zero-length byte array if the provided bytes only contained a
     * binary CID representation.
     *
     * @template {unknown} T
     * @template {number} C
     * @template {number} A
     * @template {API.Version} V
     * @param {API.ByteView<API.Link<T, C, A, V>>} bytes
     * @returns {[CID<T, C, A, V>, Uint8Array]}
     */
    static decodeFirst<T_1 extends unknown, C extends number, A extends number, V extends API.Version>(bytes: API.ByteView<API.Link<T_1, C, A, V>>): [CID<T_1, C, A, V>, Uint8Array];
    /**
     * Inspect the initial bytes of a CID to determine its properties.
     *
     * Involves decoding up to 4 varints. Typically this will require only 4 to 6
     * bytes but for larger multicodec code values and larger multihash digest
     * lengths these varints can be quite large. It is recommended that at least
     * 10 bytes be made available in the `initialBytes` argument for a complete
     * inspection.
     *
     * @template {unknown} T
     * @template {number} C
     * @template {number} A
     * @template {API.Version} V
     * @param {API.ByteView<API.Link<T, C, A, V>>} initialBytes
     * @returns {{ version:V, codec:C, multihashCode:A, digestSize:number, multihashSize:number, size:number }}
     */
    static inspectBytes<T_2 extends unknown, C_1 extends number, A_1 extends number, V_1 extends API.Version>(initialBytes: API.ByteView<API.Link<T_2, C_1, A_1, V_1>>): {
        version: V_1;
        codec: C_1;
        multihashCode: A_1;
        digestSize: number;
        multihashSize: number;
        size: number;
    };
    /**
     * Takes cid in a string representation and creates an instance. If `base`
     * decoder is not provided will use a default from the configuration. It will
     * throw an error if encoding of the CID is not compatible with supplied (or
     * a default decoder).
     *
     * @template {string} Prefix
     * @template {unknown} Data
     * @template {number} Code
     * @template {number} Alg
     * @template {API.Version} Ver
     * @param {API.ToString<API.Link<Data, Code, Alg, Ver>, Prefix>} source
     * @param {API.MultibaseDecoder<Prefix>} [base]
     * @returns {CID<Data, Code, Alg, Ver>}
     */
    static parse<Prefix extends string, Data_6 extends unknown, Code_2 extends number, Alg_6 extends number, Ver_1 extends API.Version>(source: API.ToString<API.Link<Data_6, Code_2, Alg_6, Ver_1>, Prefix>, base?: API.MultibaseDecoder<Prefix> | undefined): CID<Data_6, Code_2, Alg_6, Ver_1>;
    /**
     * @param {Version} version - Version of the CID
     * @param {Format} code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param {API.MultihashDigest<Alg>} multihash - (Multi)hash of the of the content.
     * @param {Uint8Array} bytes
     *
     */
    constructor(version: Version, code: Format, multihash: API.MultihashDigest<Alg>, bytes: Uint8Array);
    /** @readonly */
    readonly code: Format;
    /** @readonly */
    readonly version: Version;
    /** @readonly */
    readonly multihash: API.MultihashDigest<Alg>;
    /** @readonly */
    readonly bytes: Uint8Array;
    /** @readonly */
    readonly '/': Uint8Array;
    /**
     * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
     * please either use `CID.asCID(cid)` or switch to new signalling mechanism
     *
     * @deprecated
     */
    get asCID(): CID<Data, Format, Alg, Version>;
    get byteOffset(): number;
    get byteLength(): number;
    /**
     * @returns {CID<Data, API.DAG_PB, API.SHA_256, 0>}
     */
    toV0(): CID<Data, API.DAG_PB, API.SHA_256, 0>;
    /**
     * @returns {CID<Data, Format, Alg, 1>}
     */
    toV1(): CID<Data, Format, Alg, 1>;
    /**
     * @param {unknown} other
     * @returns {other is CID<Data, Format, Alg, Version>}
     */
    equals(other: unknown): other is CID<Data, Format, Alg, Version>;
    /**
     * @param {API.MultibaseEncoder<string>} [base]
     * @returns {string}
     */
    toString(base?: API.MultibaseEncoder<string> | undefined): string;
    toJSON(): {
        '/': API.ToString<CID<Data, Format, Alg, Version>, string>;
    };
    link(): CID<Data, Format, Alg, Version>;
    get [Symbol.toStringTag](): string;
}
import * as API from "./link/interface.js";
declare const SHA_256_CODE: 18;
declare const DAG_PB_CODE: 112;
//# sourceMappingURL=cid.d.ts.map