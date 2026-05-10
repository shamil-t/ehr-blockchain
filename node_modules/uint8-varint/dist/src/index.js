/* eslint-disable no-fallthrough */
import { allocUnsafe } from 'uint8arrays/alloc';
const N1 = Math.pow(2, 7);
const N2 = Math.pow(2, 14);
const N3 = Math.pow(2, 21);
const N4 = Math.pow(2, 28);
const N5 = Math.pow(2, 35);
const N6 = Math.pow(2, 42);
const N7 = Math.pow(2, 49);
/** Most significant bit of a byte */
const MSB = 0x80;
/** Rest of the bits in a byte */
const REST = 0x7f;
export function encodingLength(value) {
    if (value < N1) {
        return 1;
    }
    if (value < N2) {
        return 2;
    }
    if (value < N3) {
        return 3;
    }
    if (value < N4) {
        return 4;
    }
    if (value < N5) {
        return 5;
    }
    if (value < N6) {
        return 6;
    }
    if (value < N7) {
        return 7;
    }
    if (Number.MAX_SAFE_INTEGER != null && value > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Could not encode varint');
    }
    return 8;
}
export function encodeUint8Array(value, buf, offset = 0) {
    switch (encodingLength(value)) {
        case 8: {
            buf[offset++] = (value & 0xFF) | MSB;
            value /= 128;
        }
        case 7: {
            buf[offset++] = (value & 0xFF) | MSB;
            value /= 128;
        }
        case 6: {
            buf[offset++] = (value & 0xFF) | MSB;
            value /= 128;
        }
        case 5: {
            buf[offset++] = (value & 0xFF) | MSB;
            value /= 128;
        }
        case 4: {
            buf[offset++] = (value & 0xFF) | MSB;
            value >>>= 7;
        }
        case 3: {
            buf[offset++] = (value & 0xFF) | MSB;
            value >>>= 7;
        }
        case 2: {
            buf[offset++] = (value & 0xFF) | MSB;
            value >>>= 7;
        }
        case 1: {
            buf[offset++] = (value & 0xFF);
            value >>>= 7;
            break;
        }
        default: throw new Error('unreachable');
    }
    return buf;
}
export function encodeUint8ArrayList(value, buf, offset = 0) {
    switch (encodingLength(value)) {
        case 8: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value /= 128;
        }
        case 7: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value /= 128;
        }
        case 6: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value /= 128;
        }
        case 5: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value /= 128;
        }
        case 4: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value >>>= 7;
        }
        case 3: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value >>>= 7;
        }
        case 2: {
            buf.set(offset++, (value & 0xFF) | MSB);
            value >>>= 7;
        }
        case 1: {
            buf.set(offset++, (value & 0xFF));
            value >>>= 7;
            break;
        }
        default: throw new Error('unreachable');
    }
    return buf;
}
export function decodeUint8Array(buf, offset) {
    let b = buf[offset];
    let res = 0;
    res += b & REST;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 1];
    res += (b & REST) << 7;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 2];
    res += (b & REST) << 14;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 3];
    res += (b & REST) << 21;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 4];
    res += (b & REST) * N4;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 5];
    res += (b & REST) * N5;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 6];
    res += (b & REST) * N6;
    if (b < MSB) {
        return res;
    }
    b = buf[offset + 7];
    res += (b & REST) * N7;
    if (b < MSB) {
        return res;
    }
    throw new RangeError('Could not decode varint');
}
export function decodeUint8ArrayList(buf, offset) {
    let b = buf.get(offset);
    let res = 0;
    res += b & REST;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 1);
    res += (b & REST) << 7;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 2);
    res += (b & REST) << 14;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 3);
    res += (b & REST) << 21;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 4);
    res += (b & REST) * N4;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 5);
    res += (b & REST) * N5;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 6);
    res += (b & REST) * N6;
    if (b < MSB) {
        return res;
    }
    b = buf.get(offset + 7);
    res += (b & REST) * N7;
    if (b < MSB) {
        return res;
    }
    throw new RangeError('Could not decode varint');
}
export function encode(value, buf, offset = 0) {
    if (buf == null) {
        buf = allocUnsafe(encodingLength(value));
    }
    if (buf instanceof Uint8Array) {
        return encodeUint8Array(value, buf, offset);
    }
    else {
        return encodeUint8ArrayList(value, buf, offset);
    }
}
export function decode(buf, offset = 0) {
    if (buf instanceof Uint8Array) {
        return decodeUint8Array(buf, offset);
    }
    else {
        return decodeUint8ArrayList(buf, offset);
    }
}
//# sourceMappingURL=index.js.map