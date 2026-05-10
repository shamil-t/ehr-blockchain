/**
 * @packageDocumentation
 *
 * Provides methods for converting
 */

import { IpNet } from '@chainsafe/netmask'
import { base32 } from 'multiformats/bases/base32'
import { base58btc } from 'multiformats/bases/base58'
import { bases } from 'multiformats/basics'
import { CID } from 'multiformats/cid'
import * as Digest from 'multiformats/hashes/digest'
import * as varint from 'uint8-varint'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import * as ip from './ip.js'
import { getProtocol } from './protocols-table.js'
import type { Multiaddr } from './index.js'

const ip4Protocol = getProtocol('ip4')
const ip6Protocol = getProtocol('ip6')
const ipcidrProtocol = getProtocol('ipcidr')

/**
 * converts (serializes) addresses
 */
export function convert (proto: string, a: string): Uint8Array
export function convert (proto: string, a: Uint8Array): string
export function convert (proto: string, a: string | Uint8Array): Uint8Array | string {
  if (a instanceof Uint8Array) {
    return convertToString(proto, a)
  } else {
    return convertToBytes(proto, a)
  }
}

/**
 * Convert [code,Uint8Array] to string
 */
export function convertToString (proto: number | string, buf: Uint8Array): string {
  const protocol = getProtocol(proto)
  switch (protocol.code) {
    case 4: // ipv4
    case 41: // ipv6
      return bytes2ip(buf)
    case 42: // ipv6zone
      return bytes2str(buf)

    case 6: // tcp
    case 273: // udp
    case 33: // dccp
    case 132: // sctp
      return bytes2port(buf).toString()

    case 53: // dns
    case 54: // dns4
    case 55: // dns6
    case 56: // dnsaddr
    case 400: // unix
    case 449: // sni
    case 777: // memory
      return bytes2str(buf)

    case 421: // ipfs
      return bytes2mh(buf)
    case 444: // onion
      return bytes2onion(buf)
    case 445: // onion3
      return bytes2onion(buf)
    case 466: // certhash
      return bytes2mb(buf)
    default:
      return uint8ArrayToString(buf, 'base16') // no clue. convert to hex
  }
}

export function convertToBytes (proto: string | number, str: string): Uint8Array {
  const protocol = getProtocol(proto)
  switch (protocol.code) {
    case 4: // ipv4
      return ip2bytes(str)
    case 41: // ipv6
      return ip2bytes(str)
    case 42: // ipv6zone
      return str2bytes(str)

    case 6: // tcp
    case 273: // udp
    case 33: // dccp
    case 132: // sctp
      return port2bytes(parseInt(str, 10))

    case 53: // dns
    case 54: // dns4
    case 55: // dns6
    case 56: // dnsaddr
    case 400: // unix
    case 449: // sni
    case 777: // memory
      return str2bytes(str)

    case 421: // ipfs
      return mh2bytes(str)
    case 444: // onion
      return onion2bytes(str)
    case 445: // onion3
      return onion32bytes(str)
    case 466: // certhash
      return mb2bytes(str)
    default:
      return uint8ArrayFromString(str, 'base16') // no clue. convert from hex
  }
}

export function convertToIpNet (multiaddr: Multiaddr): IpNet {
  let mask: string | undefined
  let addr: string | undefined
  multiaddr.stringTuples().forEach(([code, value]) => {
    if (code === ip4Protocol.code || code === ip6Protocol.code) {
      addr = value
    }
    if (code === ipcidrProtocol.code) {
      mask = value
    }
  })
  if (mask == null || addr == null) {
    throw new Error('Invalid multiaddr')
  }
  return new IpNet(addr, mask)
}

const decoders = Object.values(bases).map((c) => c.decoder)
const anybaseDecoder = (function () {
  let acc = decoders[0].or(decoders[1])
  decoders.slice(2).forEach((d) => (acc = acc.or(d)))
  return acc
})()

function ip2bytes (ipString: string): Uint8Array {
  if (!ip.isIP(ipString)) {
    throw new Error('invalid ip address')
  }
  return ip.toBytes(ipString)
}

function bytes2ip (ipBuff: Uint8Array): string {
  const ipString = ip.toString(ipBuff, 0, ipBuff.length)
  if (ipString == null) {
    throw new Error('ipBuff is required')
  }
  if (!ip.isIP(ipString)) {
    throw new Error('invalid ip address')
  }
  return ipString
}

function port2bytes (port: number): Uint8Array {
  const buf = new ArrayBuffer(2)
  const view = new DataView(buf)
  view.setUint16(0, port)

  return new Uint8Array(buf)
}

function bytes2port (buf: Uint8Array): number {
  const view = new DataView(buf.buffer)
  return view.getUint16(buf.byteOffset)
}

function str2bytes (str: string): Uint8Array {
  const buf = uint8ArrayFromString(str)
  const size = Uint8Array.from(varint.encode(buf.length))
  return uint8ArrayConcat([size, buf], size.length + buf.length)
}

function bytes2str (buf: Uint8Array): string {
  const size = varint.decode(buf)
  buf = buf.slice(varint.encodingLength(size))

  if (buf.length !== size) {
    throw new Error('inconsistent lengths')
  }

  return uint8ArrayToString(buf)
}

function mh2bytes (hash: string): Uint8Array {
  let mh

  if (hash[0] === 'Q' || hash[0] === '1') {
    mh = Digest.decode(base58btc.decode(`z${hash}`)).bytes
  } else {
    mh = CID.parse(hash).multihash.bytes
  }

  // the address is a varint prefixed multihash string representation
  const size = Uint8Array.from(varint.encode(mh.length))
  return uint8ArrayConcat([size, mh], size.length + mh.length)
}

function mb2bytes (mbstr: string): Uint8Array {
  const mb = anybaseDecoder.decode(mbstr)
  const size = Uint8Array.from(varint.encode(mb.length))
  return uint8ArrayConcat([size, mb], size.length + mb.length)
}
function bytes2mb (buf: Uint8Array): string {
  const size = varint.decode(buf)
  const hash = buf.slice(varint.encodingLength(size))

  if (hash.length !== size) {
    throw new Error('inconsistent lengths')
  }

  return 'u' + uint8ArrayToString(hash, 'base64url')
}

/**
 * Converts bytes to bas58btc string
 */
function bytes2mh (buf: Uint8Array): string {
  const size = varint.decode(buf)
  const address = buf.slice(varint.encodingLength(size))

  if (address.length !== size) {
    throw new Error('inconsistent lengths')
  }

  return uint8ArrayToString(address, 'base58btc')
}

function onion2bytes (str: string): Uint8Array {
  const addr = str.split(':')
  if (addr.length !== 2) {
    throw new Error(`failed to parse onion addr: ["'${addr.join('", "')}'"]' does not contain a port number`)
  }
  if (addr[0].length !== 16) {
    throw new Error(`failed to parse onion addr: ${addr[0]} not a Tor onion address.`)
  }

  // onion addresses do not include the multibase prefix, add it before decoding
  const buf = base32.decode('b' + addr[0])

  // onion port number
  const port = parseInt(addr[1], 10)
  if (port < 1 || port > 65536) {
    throw new Error('Port number is not in range(1, 65536)')
  }
  const portBuf = port2bytes(port)
  return uint8ArrayConcat([buf, portBuf], buf.length + portBuf.length)
}

function onion32bytes (str: string): Uint8Array {
  const addr = str.split(':')
  if (addr.length !== 2) {
    throw new Error(`failed to parse onion addr: ["'${addr.join('", "')}'"]' does not contain a port number`)
  }
  if (addr[0].length !== 56) {
    throw new Error(`failed to parse onion addr: ${addr[0]} not a Tor onion3 address.`)
  }
  // onion addresses do not include the multibase prefix, add it before decoding
  const buf = base32.decode(`b${addr[0]}`)

  // onion port number
  const port = parseInt(addr[1], 10)
  if (port < 1 || port > 65536) {
    throw new Error('Port number is not in range(1, 65536)')
  }
  const portBuf = port2bytes(port)
  return uint8ArrayConcat([buf, portBuf], buf.length + portBuf.length)
}

function bytes2onion (buf: Uint8Array): string {
  const addrBytes = buf.slice(0, buf.length - 2)
  const portBytes = buf.slice(buf.length - 2)
  const addr = uint8ArrayToString(addrBytes, 'base32')
  const port = bytes2port(portBytes)
  return `${addr}:${port}`
}
