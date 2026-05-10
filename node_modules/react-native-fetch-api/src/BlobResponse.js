import BlobManager from "react-native/Libraries/Blob/BlobManager";
import Response from "./Response";

class BlobResponse extends Response {
    constructor(blobData, options) {
        const blob = BlobManager.createFromOptions(blobData);
        super(blob, options);
        this._blobData = blobData;
    }

    clone() {
        return new BlobResponse(this._blobData, {
            status: this.status,
            statusText: this.statusText,
            headers: new Headers(this.headers),
            url: this.url,
        });
    }
}

export default BlobResponse;
