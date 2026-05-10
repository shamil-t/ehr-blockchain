import { Writable } from 'node:stream';
export class DevNullStream extends Writable {
    _write(_chunk, _encoding, cb) {
        cb();
    }
}
//# sourceMappingURL=dev-null-stream.js.map