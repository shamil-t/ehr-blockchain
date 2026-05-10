import { isIPv4, isIPv6 } from '@chainsafe/is-ip'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export { isIP } from '@chainsafe/is-ip'
export const isV4 = isIPv4
export const isV6 = isIPv6

// Copied from https://github.com/indutny/node-ip/blob/master/lib/ip.js#L7
// but with buf/offset args removed because we don't use them
export const toBytes = function (ip: string): Uint8Array {
  let offset = 0
  ip = ip.toString().trim()

  if (isV4(ip)) {
    const bytes = new Uint8Array(offset + 4)

    ip.split(/\./g).forEach((byte) => {
      bytes[offset++] = parseInt(byte, 10) & 0xff
    })

    return bytes
  }

  if (isV6(ip)) {
    const sections = ip.split(':', 8)

    let i
    for (i = 0; i < sections.length; i++) {
      const isv4 = isV4(sections[i])
      let v4Buffer: Uint8Array | undefined

      if (isv4) {
        v4Buffer = toBytes(sections[i])
        sections[i] = uint8ArrayToString(v4Buffer.slice(0, 2), 'base16')
      }

      if (v4Buffer != null && ++i < 8) {
        sections.splice(i, 0, uint8ArrayToString(v4Buffer.slice(2, 4), 'base16'))
      }
    }

    if (sections[0] === '') {
      while (sections.length < 8) sections.unshift('0')
    } else if (sections[sections.length - 1] === '') {
      while (sections.length < 8) sections.push('0')
    } else if (sections.length < 8) {
      for (i = 0; i < sections.length && sections[i] !== ''; i++);
      const argv: [number, number, ...string[]] = [i, 1]
      for (i = 9 - sections.length; i > 0; i--) {
        argv.push('0')
      }
      sections.splice.apply(sections, argv)
    }

    const bytes = new Uint8Array(offset + 16)

    for (i = 0; i < sections.length; i++) {
      const word = parseInt(sections[i], 16)
      bytes[offset++] = (word >> 8) & 0xff
      bytes[offset++] = word & 0xff
    }

    return bytes
  }

  throw new Error('invalid ip address')
}

// Copied from https://github.com/indutny/node-ip/blob/master/lib/ip.js#L63
export const toString = function (buf: Uint8Array, offset: number = 0, length?: number): string {
  offset = ~~offset
  length = length ?? (buf.length - offset)

  const view = new DataView(buf.buffer)

  if (length === 4) {
    const result = []

    // IPv4
    for (let i = 0; i < length; i++) {
      result.push(buf[offset + i])
    }

    return result.join('.')
  }

  if (length === 16) {
    const result = []

    // IPv6
    for (let i = 0; i < length; i += 2) {
      result.push(view.getUint16(offset + i).toString(16))
    }

    return result.join(':')
      .replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3')
      .replace(/:{3,4}/, '::')
  }

  return ''
}
