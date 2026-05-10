"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const tokenizer_js_1 = __importDefault(require("@streamparser/json/tokenizer.js"));
class TokenizerTransform extends stream_1.Transform {
    constructor(opts = {}, transformOpts = {}) {
        super(Object.assign(Object.assign({}, transformOpts), { writableObjectMode: true, readableObjectMode: true }));
        this.tokenizer = new tokenizer_js_1.default(opts);
        this.tokenizer.onToken = (parsedTokenInfo) => this.push(parsedTokenInfo);
        this.tokenizer.onError = (err) => {
            throw err;
        };
        this.tokenizer.onEnd = () => {
            if (!this.writableEnded)
                this.end();
        };
    }
    /**
     * Main function that send data to the parser to be processed.
     *
     * @param {Buffer} chunk Incoming data
     * @param {String} encoding Encoding of the incoming data. Defaults to 'utf8'
     * @param {Function} done Called when the proceesing of the supplied chunk is done
     */
    _transform(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunk, encoding, done) {
        try {
            this.tokenizer.write(chunk);
            done();
        }
        catch (err) {
            done(err);
        }
    }
    _final(callback) {
        try {
            if (!this.tokenizer.isEnded)
                this.tokenizer.end();
            callback();
        }
        catch (err) {
            callback(err);
        }
    }
}
exports.default = TokenizerTransform;
//# sourceMappingURL=tokenizer.js.map