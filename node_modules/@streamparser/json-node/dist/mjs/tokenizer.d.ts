/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { Transform, type TransformOptions, type TransformCallback } from "stream";
import { type TokenizerOptions } from "@streamparser/json/tokenizer.js";
export default class TokenizerTransform extends Transform {
    private tokenizer;
    constructor(opts?: TokenizerOptions, transformOpts?: Omit<TransformOptions, "readableObjectMode" | "writableObjectMode">);
    /**
     * Main function that send data to the parser to be processed.
     *
     * @param {Buffer} chunk Incoming data
     * @param {String} encoding Encoding of the incoming data. Defaults to 'utf8'
     * @param {Function} done Called when the proceesing of the supplied chunk is done
     */
    _transform(chunk: any, encoding: BufferEncoding, done: TransformCallback): void;
    _final(callback: (error?: Error | null) => void): void;
}
//# sourceMappingURL=tokenizer.d.ts.map