import { Transform, } from "stream";
import { JSONParser } from "@streamparser/json";
export default class JSONParserTransform extends Transform {
    constructor(opts = {}, transformOpts = {}) {
        super(Object.assign(Object.assign({}, transformOpts), { writableObjectMode: false, readableObjectMode: true }));
        this.jsonParser = new JSONParser(opts);
        this.jsonParser.onValue = (value) => this.push(value);
        this.jsonParser.onError = (err) => {
            throw err;
        };
        this.jsonParser.onEnd = () => {
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
            this.jsonParser.write(chunk);
            done();
        }
        catch (err) {
            done(err);
        }
    }
    _final(callback) {
        try {
            if (!this.jsonParser.isEnded)
                this.jsonParser.end();
            callback();
        }
        catch (err) {
            callback(err);
        }
    }
}
//# sourceMappingURL=jsonparser.js.map