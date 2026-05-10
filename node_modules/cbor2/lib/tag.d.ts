import { k as ToCBOR, b as Decodeable, T as TagNumber, R as RequiredDecodeOptions, f as RequiredCommentOptions } from './options-BZO68bQ0.js';
import './sorts.js';

/**
 * Apply this to a TagDecoder function to get commenting support.
 */
interface Commenter {
    /**
     * If true, do not output text for child nodes.  The comment function
     * will handle that.  If true, ensure that the text returned by the comment
     * function ends in a newline.
     * @default false
     */
    noChildren?: boolean;
    /**
     * When commenting on this tag, if this function returns a string, it will
     * be appended after the tag number and a colon.
     *
     * @param tag The tag to comment on.
     * @param opts Options.
     * @param depth How deep are we in indentation clicks so far?
     */
    comment?(tag: Tag, opts: RequiredCommentOptions, depth: number): string;
}
type BaseDecoder = (tag: Tag, opts: RequiredDecodeOptions) => unknown;
type TagDecoder = BaseDecoder & Commenter;
/**
 * A CBOR tagged value.
 * @see [IANA Registry](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml)
 */
declare class Tag implements ToCBOR, Decodeable {
    #private;
    readonly tag: TagNumber;
    contents: unknown;
    /**
     * A tag wrapped around another value.
     *
     * @param tag The tag number.
     * @param contents The value that follows the tag number.
     */
    constructor(tag: TagNumber, contents?: unknown);
    /**
     * When constructing the commented version of this tag, should the contents
     * be written as well?  If true, the comment function should output the
     * contents values itself (only used for tag 24 so far).
     *
     * @type {boolean}
     * @readonly
     */
    get noChildren(): boolean;
    /**
     * Register a decoder for a give tag number.
     *
     * @param tag The tag number.
     * @param decoder Decoder function.
     * @param description If provided, use this when commenting to add a type
     *   name in parens after the tag number.
     * @returns Old decoder for this tag, if there was one.
     */
    static registerDecoder(tag: TagNumber, decoder: TagDecoder, description?: string): TagDecoder | undefined;
    /**
     * Remove the encoder for this tag number.
     *
     * @param tag Tag number.
     * @returns Old decoder, if there was one.
     */
    static clearDecoder(tag: TagNumber): TagDecoder | undefined;
    /**
     * Get the decoder for a given tag number.
     *
     * @param tag The tag number.
     * @returns The decoder function, if there is one.
     */
    static getDecoder(tag: TagNumber): TagDecoder | undefined;
    /**
     * Get all registered decoders clone of the map.
     */
    static getAllDecoders(): ReadonlyMap<TagNumber, TagDecoder>;
    /**
     * Iterate over just the contents, so that the tag works more like an
     * array.  Yields One time, the contained value.
     */
    [Symbol.iterator](): Generator<unknown, void, undefined>;
    /**
     * Makes Tag act like an array, so that no special casing is needed when
     * the tag's contents are available.
     *
     * @param contents The value associated with the tag.
     * @returns Always returns 1.
     */
    push(contents: unknown): number;
    /**
     * Convert this tagged value to a useful data type, if possible.
     *
     * @param options Options for decoding.
     * @returns The converted value.
     */
    decode(options: RequiredDecodeOptions): unknown;
    comment(options: RequiredCommentOptions, depth: number): string | undefined;
    toCBOR(): [TagNumber, unknown];
}

export { type BaseDecoder, type Commenter, Tag, type TagDecoder };
