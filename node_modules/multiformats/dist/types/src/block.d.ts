export type RequiredCreateOptions = {
    cid: CID;
};
/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @param {object} options
 * @param {T} options.value
 * @param {API.BlockEncoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
export function encode<T extends unknown, Code extends number, Alg extends number>({ value, codec, hasher }: {
    value: T;
    codec: API.BlockEncoder<Code, T>;
    hasher: API.MultihashHasher<Alg>;
}): Promise<API.BlockView<T, Code, Alg, 1>>;
/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @param {object} options
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg>>}
 */
export function decode<T extends unknown, Code extends number, Alg extends number>({ bytes, codec, hasher }: {
    bytes: API.ByteView<T>;
    codec: API.BlockDecoder<Code, T>;
    hasher: API.MultihashHasher<Alg>;
}): Promise<API.BlockView<T, Code, Alg, 1>>;
/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @param {object} options
 * @param {API.Link<T, Code, Alg, V>} options.cid
 * @param {API.ByteView<T>} options.bytes
 * @param {API.BlockDecoder<Code, T>} options.codec
 * @param {API.MultihashHasher<Alg>} options.hasher
 * @returns {Promise<API.BlockView<T, Code, Alg, V>>}
 */
export function create<T extends unknown, Code extends number, Alg extends number, V extends API.Version>({ bytes, cid, hasher, codec }: {
    cid: API.Link<T, Code, Alg, V>;
    bytes: API.ByteView<T>;
    codec: API.BlockDecoder<Code, T>;
    hasher: API.MultihashHasher<Alg>;
}): Promise<API.BlockView<T, Code, Alg, V>>;
/**
 * @typedef {object} RequiredCreateOptions
 * @property {CID} options.cid
 */
/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} Code - multicodec code corresponding to codec used to encode the block
 * @template {number} Alg - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @param {{ cid: API.Link<T, Code, Alg, V>, value:T, codec?: API.BlockDecoder<Code, T>, bytes: API.ByteView<T> }|{cid:API.Link<T, Code, Alg, V>, bytes:API.ByteView<T>, value?:void, codec:API.BlockDecoder<Code, T>}} options
 * @returns {API.BlockView<T, Code, Alg, V>}
 */
export function createUnsafe<T extends unknown, Code extends number, Alg extends number, V extends API.Version>({ bytes, cid, value: maybeValue, codec }: {
    cid: API.Link<T, Code, Alg, V>;
    value: T;
    codec?: API.BlockDecoder<Code, T> | undefined;
    bytes: API.ByteView<T>;
} | {
    cid: API.Link<T, Code, Alg, V>;
    bytes: API.ByteView<T>;
    value?: void | undefined;
    codec: API.BlockDecoder<Code, T>;
}): API.BlockView<T, Code, Alg, V>;
/**
 * @template {unknown} T - Logical type of the data encoded in the block
 * @template {number} C - multicodec code corresponding to codec used to encode the block
 * @template {number} A - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template {API.Version} V - CID version
 * @implements {API.BlockView<T, C, A, V>}
 */
export class Block<T extends unknown, C extends number, A extends number, V extends API.Version> implements API.BlockView<T, C, A, V> {
    /**
     * @param {object} options
     * @param {CID<T, C, A, V>} options.cid
     * @param {API.ByteView<T>} options.bytes
     * @param {T} options.value
     */
    constructor({ cid, bytes, value }: {
        cid: CID<T, C, A, V>;
        bytes: API.ByteView<T>;
        value: T;
    });
    cid: CID<T, C, A, V>;
    bytes: API.ByteView<T>;
    value: T;
    asBlock: Block<T, C, A, V>;
    links(): Iterable<[string, CID<any, number, number, API.Version>]>;
    tree(): Iterable<string>;
    /**
     *
     * @param {string} [path]
     * @returns {API.BlockCursorView<unknown>}
     */
    get(path?: string | undefined): API.BlockCursorView<unknown>;
}
import * as API from "./interface.js";
import { CID } from "./index.js";
//# sourceMappingURL=block.d.ts.map