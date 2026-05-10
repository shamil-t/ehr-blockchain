// Use Uint8Array directly in the browser, use Buffer in Node.js but don't
// speak its name directly to avoid bundlers pulling in the `Buffer` polyfill

// @ts-ignore
export const useBuffer = globalThis.process &&
  // @ts-ignore
  !globalThis.process.browser &&
  // @ts-ignore
  globalThis.Buffer &&
  // @ts-ignore
  typeof globalThis.Buffer.isBuffer === 'function'

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

/**
 * @param {Uint8Array} buf
 * @returns {boolean}
 */
function isBuffer (buf) {
  // @ts-ignore
  return useBuffer && globalThis.Buffer.isBuffer(buf)
}

/**
 * @param {Uint8Array|number[]} buf
 * @returns {Uint8Array}
 */
export function asU8A (buf) {
  /* c8 ignore next */
  if (!(buf instanceof Uint8Array)) {
    return Uint8Array.from(buf)
  }
  return isBuffer(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf
}

export const toString = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return end - start > 64
        ? // eslint-disable-line operator-linebreak
      // @ts-ignore
        globalThis.Buffer.from(bytes.subarray(start, end)).toString('utf8')
        : utf8Slice(bytes, start, end)
    }
  /* c8 ignore next 11 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return end - start > 64
        ? textDecoder.decode(bytes.subarray(start, end))
        : utf8Slice(bytes, start, end)
    }

export const fromString = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length > 64
        ? // eslint-disable-line operator-linebreak
      // @ts-ignore
        globalThis.Buffer.from(string)
        : utf8ToBytes(string)
    }
  /* c8 ignore next 7 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length > 64 ? textEncoder.encode(string) : utf8ToBytes(string)
    }

/**
 * Buffer variant not fast enough for what we need
 * @param {number[]} arr
 * @returns {Uint8Array}
 */
export const fromArray = (arr) => {
  return Uint8Array.from(arr)
}

export const slice = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      if (isBuffer(bytes)) {
        return new Uint8Array(bytes.subarray(start, end))
      }
      return bytes.slice(start, end)
    }
  /* c8 ignore next 9 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end)
    }

export const concat = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      // might get a stray plain Array here
      /* c8 ignore next 1 */
      chunks = chunks.map((c) => c instanceof Uint8Array
        ? c
        // this case is occasionally missed during test runs so becomes coverage-flaky
        /* c8 ignore next 4 */
        : // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c))
      // @ts-ignore
      return asU8A(globalThis.Buffer.concat(chunks, length))
    }
  /* c8 ignore next 19 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      const out = new Uint8Array(length)
      let off = 0
      for (let b of chunks) {
        if (off + b.length > out.length) {
          // final chunk that's bigger than we need
          b = b.subarray(0, out.length - off)
        }
        out.set(b, off)
        off += b.length
      }
      return out
    }

export const alloc = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      // we always write over the contents we expose so this should be safe
      // @ts-ignore
      return globalThis.Buffer.allocUnsafe(size)
    }
  /* c8 ignore next 8 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      return new Uint8Array(size)
    }

export const toHex = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} d
     * @returns {string}
     */
    (d) => {
      if (typeof d === 'string') {
        return d
      }
      // @ts-ignore
      return globalThis.Buffer.from(toBytes(d)).toString('hex')
    }
  /* c8 ignore next 12 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} d
     * @returns {string}
     */
    (d) => {
      if (typeof d === 'string') {
        return d
      }
      // @ts-ignore not smart enough to figure this out
      return Array.prototype.reduce.call(toBytes(d), (p, c) => `${p}${c.toString(16).padStart(2, '0')}`, '')
    }

export const fromHex = useBuffer
  ? // eslint-disable-line operator-linebreak
  /**
   * @param {string|Uint8Array} hex
   * @returns {Uint8Array}
   */
    (hex) => {
      if (hex instanceof Uint8Array) {
        return hex
      }
      // @ts-ignore
      return globalThis.Buffer.from(hex, 'hex')
    }
  /* c8 ignore next 17 */
  : // eslint-disable-line operator-linebreak
  /**
   * @param {string|Uint8Array} hex
   * @returns {Uint8Array}
   */
    (hex) => {
      if (hex instanceof Uint8Array) {
        return hex
      }
      if (!hex.length) {
        return new Uint8Array(0)
      }
      return new Uint8Array(hex.split('')
        .map((/** @type {string} */ c, /** @type {number} */ i, /** @type {string[]} */ d) => i % 2 === 0 ? `0x${c}${d[i + 1]}` : '')
        .filter(Boolean)
        .map((/** @type {string} */ e) => parseInt(e, 16)))
    }

/**
 * @param {Uint8Array|ArrayBuffer|ArrayBufferView} obj
 * @returns {Uint8Array}
 */
function toBytes (obj) {
  if (obj instanceof Uint8Array && obj.constructor.name === 'Uint8Array') {
    return obj
  }
  if (obj instanceof ArrayBuffer) {
    return new Uint8Array(obj)
  }
  if (ArrayBuffer.isView(obj)) {
    return new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength)
  }
  /* c8 ignore next */
  throw new Error('Unknown type, must be binary type')
}

/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
export function compare (b1, b2) {
  /* c8 ignore next 5 */
  if (isBuffer(b1) && isBuffer(b2)) {
    // probably not possible to get here in the current API
    // @ts-ignore Buffer
    return b1.compare(b2)
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] === b2[i]) {
      continue
    }
    return b1[i] < b2[i] ? -1 : 1
  } /* c8 ignore next 3 */
  return 0
}

// The below code is taken from https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
// Licensed Apache-2.0.

/**
 * @param {string} str
 * @returns {number[]}
 */
function utf8ToBytes (str) {
  const out = []
  let p = 0
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c < 128) {
      out[p++] = c
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192
      out[p++] = (c & 63) | 128
    } else if (
      ((c & 0xFC00) === 0xD800) && (i + 1) < str.length &&
      ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF)
      out[p++] = (c >> 18) | 240
      out[p++] = ((c >> 12) & 63) | 128
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    } else {
      out[p++] = (c >> 12) | 224
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    }
  }
  return out
}

// The below code is mostly taken from https://github.com/feross/buffer
// Licensed MIT. Copyright (c) Feross Aboukhadijeh

/**
 * @param {Uint8Array} buf
 * @param {number} offset
 * @param {number} end
 * @returns {string}
 */
function utf8Slice (buf, offset, end) {
  const res = []

  while (offset < end) {
    const firstByte = buf[offset]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xef) ? 4 : (firstByte > 0xdf) ? 3 : (firstByte > 0xbf) ? 2 : 1

    if (offset + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[offset + 1]
          if ((secondByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0x1f) << 0x6 | (secondByte & 0x3f)
            if (tempCodePoint > 0x7f) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[offset + 1]
          thirdByte = buf[offset + 2]
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0xc | (secondByte & 0x3f) << 0x6 | (thirdByte & 0x3f)
            /* c8 ignore next 3 */
            if (tempCodePoint > 0x7ff && (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[offset + 1]
          thirdByte = buf[offset + 2]
          fourthByte = buf[offset + 3]
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80 && (fourthByte & 0xc0) === 0x80) {
            tempCodePoint = (firstByte & 0xf) << 0x12 | (secondByte & 0x3f) << 0xc | (thirdByte & 0x3f) << 0x6 | (fourthByte & 0x3f)
            if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    /* c8 ignore next 5 */
    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xfffd
      bytesPerSequence = 1
    } else if (codePoint > 0xffff) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3ff | 0xd800)
      codePoint = 0xdc00 | codePoint & 0x3ff
    }

    res.push(codePoint)
    offset += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

/**
 * @param {number[]} codePoints
 * @returns {string}
 */
export function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }
  /* c8 ignore next 10 */
  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}
