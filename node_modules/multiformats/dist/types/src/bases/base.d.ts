export function or<L extends string, R extends string>(left: API.UnibaseDecoder<L> | API.CombobaseDecoder<L>, right: API.UnibaseDecoder<R> | API.CombobaseDecoder<R>): ComposedDecoder<L | R>;
/**
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {API.MultibaseCodec<Prefix>}
 * @implements {API.MultibaseEncoder<Prefix>}
 * @implements {API.MultibaseDecoder<Prefix>}
 * @implements {API.BaseCodec}
 * @implements {API.BaseEncoder}
 * @implements {API.BaseDecoder}
 */
export class Codec<Base extends string, Prefix extends string> implements API.MultibaseCodec<Prefix>, API.MultibaseEncoder<Prefix>, API.MultibaseDecoder<Prefix>, API.BaseCodec, API.BaseEncoder, API.BaseDecoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(bytes:Uint8Array) => string} baseEncode
     * @param {(text:string) => Uint8Array} baseDecode
     */
    constructor(name: Base, prefix: Prefix, baseEncode: (bytes: Uint8Array) => string, baseDecode: (text: string) => Uint8Array);
    name: Base;
    prefix: Prefix;
    baseEncode: (bytes: Uint8Array) => string;
    baseDecode: (text: string) => Uint8Array;
    encoder: Encoder<Base, Prefix>;
    decoder: Decoder<Base, Prefix>;
    /**
     * @param {Uint8Array} input
     */
    encode(input: Uint8Array): API.Multibase<Prefix>;
    /**
     * @param {string} input
     */
    decode(input: string): Uint8Array;
}
export function from<Base extends string, Prefix extends string>({ name, prefix, encode, decode }: {
    name: Base;
    prefix: Prefix;
    encode: (bytes: Uint8Array) => string;
    decode: (input: string) => Uint8Array;
}): Codec<Base, Prefix>;
export function baseX<Base extends string, Prefix extends string>({ prefix, name, alphabet }: {
    name: Base;
    prefix: Prefix;
    alphabet: string;
}): Codec<Base, Prefix>;
export function rfc4648<Base extends string, Prefix extends string>({ name, prefix, bitsPerChar, alphabet }: {
    name: Base;
    prefix: Prefix;
    alphabet: string;
    bitsPerChar: number;
}): Codec<Base, Prefix>;
export type Decoders<Prefix extends string> = Record<Prefix, API.UnibaseDecoder<Prefix>>;
import * as API from "./interface.js";
/**
 * @template {string} Prefix
 * @typedef {Record<Prefix, API.UnibaseDecoder<Prefix>>} Decoders
 */
/**
 * @template {string} Prefix
 * @implements {API.MultibaseDecoder<Prefix>}
 * @implements {API.CombobaseDecoder<Prefix>}
 */
declare class ComposedDecoder<Prefix extends string> implements API.MultibaseDecoder<Prefix>, API.CombobaseDecoder<Prefix> {
    /**
     * @param {Decoders<Prefix>} decoders
     */
    constructor(decoders: Decoders<Prefix>);
    decoders: Decoders<Prefix>;
    /**
     * @template {string} OtherPrefix
     * @param {API.UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
     * @returns {ComposedDecoder<Prefix|OtherPrefix>}
     */
    or<OtherPrefix extends string>(decoder: API.UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix>;
    /**
     * @param {string} input
     * @returns {Uint8Array}
     */
    decode(input: string): Uint8Array;
}
/**
 * Class represents both BaseEncoder and MultibaseEncoder meaning it
 * can be used to encode to multibase or base encode without multibase
 * prefix.
 *
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {API.MultibaseEncoder<Prefix>}
 * @implements {API.BaseEncoder}
 */
declare class Encoder<Base extends string, Prefix extends string> implements API.MultibaseEncoder<Prefix>, API.BaseEncoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(bytes:Uint8Array) => string} baseEncode
     */
    constructor(name: Base, prefix: Prefix, baseEncode: (bytes: Uint8Array) => string);
    name: Base;
    prefix: Prefix;
    baseEncode: (bytes: Uint8Array) => string;
    /**
     * @param {Uint8Array} bytes
     * @returns {API.Multibase<Prefix>}
     */
    encode(bytes: Uint8Array): API.Multibase<Prefix>;
}
/**
 * @template {string} Prefix
 */
/**
 * Class represents both BaseDecoder and MultibaseDecoder so it could be used
 * to decode multibases (with matching prefix) or just base decode strings
 * with corresponding base encoding.
 *
 * @class
 * @template {string} Base
 * @template {string} Prefix
 * @implements {API.MultibaseDecoder<Prefix>}
 * @implements {API.UnibaseDecoder<Prefix>}
 * @implements {API.BaseDecoder}
 */
declare class Decoder<Base extends string, Prefix extends string> implements API.MultibaseDecoder<Prefix>, API.UnibaseDecoder<Prefix>, API.BaseDecoder {
    /**
     * @param {Base} name
     * @param {Prefix} prefix
     * @param {(text:string) => Uint8Array} baseDecode
     */
    constructor(name: Base, prefix: Prefix, baseDecode: (text: string) => Uint8Array);
    name: Base;
    prefix: Prefix;
    /** @private */
    private prefixCodePoint;
    baseDecode: (text: string) => Uint8Array;
    /**
     * @param {string} text
     */
    decode(text: string): Uint8Array;
    /**
     * @template {string} OtherPrefix
     * @param {API.UnibaseDecoder<OtherPrefix>|ComposedDecoder<OtherPrefix>} decoder
     * @returns {ComposedDecoder<Prefix|OtherPrefix>}
     */
    or<OtherPrefix extends string>(decoder: API.UnibaseDecoder<OtherPrefix> | ComposedDecoder<OtherPrefix>): ComposedDecoder<Prefix | OtherPrefix>;
}
export {};
//# sourceMappingURL=base.d.ts.map