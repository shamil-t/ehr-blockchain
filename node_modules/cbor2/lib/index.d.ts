import { D as DecodeOptions } from './options-BZO68bQ0.js';
export { C as CommentOptions, c as DecodeStreamOptions, d as DecodeValue, b as Decodeable, h as DiagnosticSizes, E as EncodeOptions, M as MtAiValue, O as ObjectCreator, P as Parent, e as ParentConstructor, f as RequiredCommentOptions, R as RequiredDecodeOptions, a as RequiredEncodeOptions, i as Simple, S as Sliceable, g as StringNormalization, T as TagNumber, j as TaggedValue, k as ToCBOR, l as Writer, W as WriterOptions } from './options-BZO68bQ0.js';
export { version } from './version.js';
export { DecodeStream, ValueGenerator } from './decodeStream.js';
export { decode } from './decoder.js';
export { diagnose } from './diagnostic.js';
export { comment } from './comment.js';
export { cdeEncodeOptions, dcborEncodeOptions, defaultEncodeOptions, encode, encodedNumber } from './encoder.js';
export { Tag } from './tag.js';
export { OriginalEncoding, getEncoded, saveEncoded, saveEncodedLength, unbox } from './box.js';
import './sorts.js';
import './constants.js';

declare const cdeDecodeOptions: DecodeOptions;
declare const dcborDecodeOptions: DecodeOptions;
declare const defaultDecodeOptions: Required<DecodeOptions>;

export { DecodeOptions, cdeDecodeOptions, dcborDecodeOptions, defaultDecodeOptions };
