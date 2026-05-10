import { toByteArray } from "base64-js";
import Response from "./Response";

class ArrayBufferResponse extends Response {
    constructor(base64, options) {
        const buffer = toByteArray(base64);
        super(buffer, options);
        this._base64 = base64;
    }

    clone() {
        return new ArrayBufferResponse(this._base64, {
            status: this.status,
            statusText: this.statusText,
            headers: new Headers(this.headers),
            url: this.url,
        });
    }
}

export default ArrayBufferResponse;
