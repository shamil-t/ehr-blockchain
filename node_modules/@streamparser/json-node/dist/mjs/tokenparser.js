import { Transform, } from "stream";
import { TokenParser } from "@streamparser/json";
export default class TokenParserTransform extends Transform {
    constructor(opts = {}, transformOpts = {}) {
        super(Object.assign(Object.assign({}, transformOpts), { writableObjectMode: true, readableObjectMode: true }));
        this.tokenParser = new TokenParser(opts);
        this.tokenParser.onValue = (parsedTokenInfo) => this.push(parsedTokenInfo);
        this.tokenParser.onError = (err) => {
            throw err;
        };
        this.tokenParser.onEnd = () => {
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
            this.tokenParser.write(chunk);
            done();
        }
        catch (err) {
            done(err);
        }
    }
    _final(callback) {
        try {
            if (!this.tokenParser.isEnded)
                this.tokenParser.end();
            callback();
        }
        catch (err) {
            callback(err);
        }
    }
}
//# sourceMappingURL=tokenparser.js.map