/**
 * @packageDocumentation
 *
 * An implementation of a Multiaddr in JavaScript
 *
 * @example
 *
 * ```js
 * import { multiaddr } from '@multiformats/multiaddr'
 *
 * const ma = multiaddr('/ip4/127.0.0.1/tcp/1234')
 * ```
 */

import * as codec from './codec.js'
import { getProtocol, names } from './protocols-table.js'
import varint from 'varint'
import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'
import errCode from 'err-code'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'

const inspect = Symbol.for('nodejs.util.inspect.custom')

const DNS_CODES = [
  getProtocol('dns').code,
  getProtocol('dns4').code,
  getProtocol('dns6').code,
  getProtocol('dnsaddr').code
]

/**
 * Protocols are present in the protocol table
 */
export interface Protocol {
  code: number
  size: number
  name: string
  resolvable?: boolean | undefined
  path?: boolean | undefined
}

/**
 * A plain JavaScript object representation of a {@link Multiaddr}
 */
export interface MultiaddrObject {
  family: 4 | 6
  host: string
  transport: string
  port: number
}

/**
 * A NodeAddress is an IPv4/IPv6 address/TCP port combination
 */
export interface NodeAddress {
  family: 4 | 6
  address: string
  port: number
}

/**
 * These types can be parsed into a {@link Multiaddr} object
 */
export type MultiaddrInput = string | Multiaddr | Uint8Array | null

/**
 * A Resolver is a function that takes a {@link Multiaddr} and resolves it into one
 * or more string representations of that {@link Multiaddr}.
 */
export interface Resolver { (addr: Multiaddr, options?: AbortOptions): Promise<string[]> }

/**
 * A code/value pair
 */
export type Tuple = [number, Uint8Array?]

/**
 * A code/value pair with the value as a string
 */
export type StringTuple = [number, string?]

/**
 * Allows aborting long-lived operations
 */
export interface AbortOptions {
  signal?: AbortSignal
}

/**
 * All configured {@link Resolver}s
 */
export const resolvers = new Map<string, Resolver>()
const symbol = Symbol.for('@multiformats/js-multiaddr/multiaddr')

export interface Multiaddr {
  bytes: Uint8Array

  /**
   * Returns Multiaddr as a String
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').toString()
   * // '/ip4/127.0.0.1/tcp/4001'
   * ```
   */
  toString: () => string

  /**
   * Returns Multiaddr as a JSON encoded object
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * JSON.stringify(multiaddr('/ip4/127.0.0.1/tcp/4001'))
   * // '/ip4/127.0.0.1/tcp/4001'
   * ```
   */
  toJSON: () => string

  /**
   * Returns Multiaddr as a convinient options object to be used with net.createConnection
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').toOptions()
   * // { family: 4, host: '127.0.0.1', transport: 'tcp', port: 4001 }
   * ```
   */
  toOptions: () => MultiaddrObject

  /**
   * Returns the protocols the Multiaddr is defined with, as an array of objects, in
   * left-to-right order. Each object contains the protocol code, protocol name,
   * and the size of its address space in bits.
   * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').protos()
   * // [ { code: 4, size: 32, name: 'ip4' },
   * //   { code: 6, size: 16, name: 'tcp' } ]
   * ```
   */
  protos: () => Protocol[]

  /**
   * Returns the codes of the protocols in left-to-right order.
   * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').protoCodes()
   * // [ 4, 6 ]
   * ```
   */
  protoCodes: () => number[]

  /**
   * Returns the names of the protocols in left-to-right order.
   * [See list of protocols](https://github.com/multiformats/multiaddr/blob/master/protocols.csv)
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').protoNames()
   * // [ 'ip4', 'tcp' ]
   * ```
   */
  protoNames: () => string[]

  /**
   * Returns a tuple of parts
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').tuples()
   * // [ [ 4, <Buffer 7f 00 00 01> ], [ 6, <Buffer 0f a1> ] ]
   * ```
   */
  tuples: () => Tuple[]

  /**
   * Returns a tuple of string/number parts
   * - tuples[][0] = code of protocol
   * - tuples[][1] = contents of address
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').stringTuples()
   * // [ [ 4, '127.0.0.1' ], [ 6, '4001' ] ]
   * ```
   */
  stringTuples: () => StringTuple[]

  /**
   * Encapsulates a Multiaddr in another Multiaddr
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
   *
   * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
   * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
   *
   * const mh3 = mh1.encapsulate(mh2)
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001)
   *
   * mh3.toString()
   * // '/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001'
   * ```
   *
   * @param {MultiaddrInput} addr - Multiaddr to add into this Multiaddr
   */
  encapsulate: (addr: MultiaddrInput) => Multiaddr

  /**
   * Decapsulates a Multiaddr from another Multiaddr
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
   *
   * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
   * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
   *
   * const mh3 = mh1.encapsulate(mh2)
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ip4/127.0.0.1/tcp/4001)
   *
   * mh3.decapsulate(mh2).toString()
   * // '/ip4/8.8.8.8/tcp/1080'
   * ```
   *
   * @param {Multiaddr | string} addr - Multiaddr to remove from this Multiaddr
   */
  decapsulate: (addr: Multiaddr | string) => Multiaddr

  /**
   * A more reliable version of `decapsulate` if you are targeting a
   * specific code, such as 421 (the `p2p` protocol code). The last index of the code
   * will be removed from the `Multiaddr`, and a new instance will be returned.
   * If the code is not present, the original `Multiaddr` is returned.
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const addr = multiaddr('/ip4/0.0.0.0/tcp/8080/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC')
   * // Multiaddr(/ip4/0.0.0.0/tcp/8080/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC)
   *
   * addr.decapsulateCode(421).toString()
   * // '/ip4/0.0.0.0/tcp/8080'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/8080').decapsulateCode(421).toString()
   * // '/ip4/127.0.0.1/tcp/8080'
   * ```
   */
  decapsulateCode: (code: number) => Multiaddr

  /**
   * Extract the peerId if the multiaddr contains one
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080/ipfs/QmValidBase58string')
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080/ipfs/QmValidBase58string)
   *
   * // should return QmValidBase58string or null if the id is missing or invalid
   * const peerId = mh1.getPeerId()
   * ```
   */
  getPeerId: () => string | null

  /**
   * Extract the path if the multiaddr contains one
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080/unix/tmp/p2p.sock')
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080/unix/tmp/p2p.sock)
   *
   * // should return utf8 string or null if the id is missing or invalid
   * const path = mh1.getPath()
   * ```
   */
  getPath: () => string | null

  /**
   * Checks if two Multiaddrs are the same
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/8.8.8.8/tcp/1080')
   * // Multiaddr(/ip4/8.8.8.8/tcp/1080)
   *
   * const mh2 = multiaddr('/ip4/127.0.0.1/tcp/4001')
   * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
   *
   * mh1.equals(mh1)
   * // true
   *
   * mh1.equals(mh2)
   * // false
   * ```
   */
  equals: (addr: { bytes: Uint8Array }) => boolean

  /**
   * Resolve multiaddr if containing resolvable hostname.
   *
   * @example
   * ```js
   * import { multiaddr, resolvers } from '@multiformats/multiaddr'
   *
   * resolvers.set('dnsaddr', resolverFunction)
   * const mh1 = multiaddr('/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb')
   * const resolvedMultiaddrs = await mh1.resolve()
   * // [
   * //   Multiaddr(/ip4/147.75.83.83/tcp/4001/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb),
   * //   Multiaddr(/ip4/147.75.83.83/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb),
   * //   Multiaddr(/ip4/147.75.83.83/udp/4001/quic/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb)
   * // ]
   * ```
   */
  resolve: (options?: AbortOptions) => Promise<Multiaddr[]>

  /**
   * Gets a Multiaddrs node-friendly address object. Note that protocol information
   * is left out: in Node (and most network systems) the protocol is unknowable
   * given only the address.
   *
   * Has to be a ThinWaist Address, otherwise throws error
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * multiaddr('/ip4/127.0.0.1/tcp/4001').nodeAddress()
   * // {family: 4, address: '127.0.0.1', port: 4001}
   * ```
   */
  nodeAddress: () => NodeAddress

  /**
   * Returns if a Multiaddr is a Thin Waist address or not.
   *
   * Thin Waist is if a Multiaddr adheres to the standard combination of:
   *
   * `{IPv4, IPv6}/{TCP, UDP}`
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * const mh1 = multiaddr('/ip4/127.0.0.1/tcp/4001')
   * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
   * const mh2 = multiaddr('/ip4/192.168.2.1/tcp/5001')
   * // Multiaddr(/ip4/192.168.2.1/tcp/5001)
   * const mh3 = mh1.encapsulate(mh2)
   * // Multiaddr(/ip4/127.0.0.1/tcp/4001/ip4/192.168.2.1/tcp/5001)
   * const mh4 = multiaddr('/ip4/127.0.0.1/tcp/2000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a')
   * // Multiaddr(/ip4/127.0.0.1/tcp/2000/wss/p2p-webrtc-star/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSooo2a)
   * mh1.isThinWaistAddress()
   * // true
   * mh2.isThinWaistAddress()
   * // true
   * mh3.isThinWaistAddress()
   * // false
   * mh4.isThinWaistAddress()
   * // false
   * ```
   */
  isThinWaistAddress: (addr?: Multiaddr) => boolean
}

/**
 * Creates a Multiaddr from a node-friendly address object
 *
 * @example
 * ```js
 * import { fromNodeAddress } from '@multiformats/multiaddr'
 *
 * fromNodeAddress({address: '127.0.0.1', port: '4001'}, 'tcp')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 */
export function fromNodeAddress (addr: NodeAddress, transport: string): Multiaddr {
  if (addr == null) {
    throw new Error('requires node address object')
  }
  if (transport == null) {
    throw new Error('requires transport protocol')
  }
  let ip: string | undefined
  let host = addr.address
  switch (addr.family) {
    case 4:
      ip = 'ip4'
      break
    case 6:
      ip = 'ip6'

      if (host.includes('%')) {
        const parts = host.split('%')

        if (parts.length !== 2) {
          throw Error('Multiple ip6 zones in multiaddr')
        }

        host = parts[0]
        const zone = parts[1]
        ip = `/ip6zone/${zone}/ip6`
      }
      break
    default:
      throw Error('Invalid addr family, should be 4 or 6.')
  }
  return new DefaultMultiaddr('/' + [ip, host, transport, addr.port].join('/'))
}

/**
 * Returns if something is a {@link Multiaddr} that is a resolvable name
 *
 * @example
 *
 * ```js
 * import { isName, multiaddr } from '@multiformats/multiaddr'
 *
 * isName(multiaddr('/ip4/127.0.0.1'))
 * // false
 * isName(multiaddr('/dns/ipfs.io'))
 * // true
 * ```
 */
export function isName (addr: Multiaddr): boolean {
  if (!isMultiaddr(addr)) {
    return false
  }

  // if a part of the multiaddr is resolvable, then return true
  return addr.protos().some((proto) => proto.resolvable)
}

/**
 * Check if object is a {@link Multiaddr} instance
 *
 * @example
 *
 * ```js
 * import { isMultiaddr, multiaddr } from '@multiformats/multiaddr'
 *
 * isMultiaddr(5)
 * // false
 * isMultiaddr(multiaddr('/ip4/127.0.0.1'))
 * // true
 * ```
 */
export function isMultiaddr (value: any): value is Multiaddr {
  return Boolean(value?.[symbol])
}

/**
 * Creates a {@link Multiaddr} from a {@link MultiaddrInput}
 */
class DefaultMultiaddr implements Multiaddr {
  public bytes: Uint8Array
  #string?: string
  #tuples?: Tuple[]
  #stringTuples?: StringTuple[]

  [symbol]: boolean = true

  constructor (addr?: MultiaddrInput) {
    // default
    if (addr == null) {
      addr = ''
    }

    if (addr instanceof Uint8Array) {
      this.bytes = codec.fromBytes(addr)
    } else if (typeof addr === 'string') {
      if (addr.length > 0 && addr.charAt(0) !== '/') {
        throw new Error(`multiaddr "${addr}" must start with a "/"`)
      }
      this.bytes = codec.fromString(addr)
    } else if (isMultiaddr(addr)) { // Multiaddr
      this.bytes = codec.fromBytes(addr.bytes) // validate + copy buffer
    } else {
      throw new Error('addr must be a string, Buffer, or another Multiaddr')
    }
  }

  toString (): string {
    if (this.#string == null) {
      this.#string = codec.bytesToString(this.bytes)
    }

    return this.#string
  }

  toJSON (): string {
    return this.toString()
  }

  toOptions (): MultiaddrObject {
    let family: 4 | 6 | undefined
    let transport: string | undefined
    let host: string | undefined
    let port: number | undefined
    let zone = ''

    const tcp = getProtocol('tcp')
    const udp = getProtocol('udp')
    const ip4 = getProtocol('ip4')
    const ip6 = getProtocol('ip6')
    const dns6 = getProtocol('dns6')
    const ip6zone = getProtocol('ip6zone')

    for (const [code, value] of this.stringTuples()) {
      if (code === ip6zone.code) {
        zone = `%${value ?? ''}`
      }

      // default to https when protocol & port are omitted from DNS addrs
      if (DNS_CODES.includes(code)) {
        transport = tcp.name
        port = 443
        host = `${value ?? ''}${zone}`
        family = code === dns6.code ? 6 : 4
      }

      if (code === tcp.code || code === udp.code) {
        transport = getProtocol(code).name
        port = parseInt(value ?? '')
      }

      if (code === ip4.code || code === ip6.code) {
        transport = getProtocol(code).name
        host = `${value ?? ''}${zone}`
        family = code === ip6.code ? 6 : 4
      }
    }

    if (family == null || transport == null || host == null || port == null) {
      throw new Error('multiaddr must have a valid format: "/{ip4, ip6, dns4, dns6, dnsaddr}/{address}/{tcp, udp}/{port}".')
    }

    const opts: MultiaddrObject = {
      family,
      host,
      transport,
      port
    }

    return opts
  }

  protos (): Protocol[] {
    return this.protoCodes().map(code => Object.assign({}, getProtocol(code)))
  }

  protoCodes (): number[] {
    const codes: number[] = []
    const buf = this.bytes
    let i = 0
    while (i < buf.length) {
      const code = varint.decode(buf, i)
      const n = varint.decode.bytes ?? 0

      const p = getProtocol(code)
      const size = codec.sizeForAddr(p, buf.slice(i + n))

      i += (size + n)
      codes.push(code)
    }

    return codes
  }

  protoNames (): string[] {
    return this.protos().map(proto => proto.name)
  }

  tuples (): Array<[number, Uint8Array?]> {
    if (this.#tuples == null) {
      this.#tuples = codec.bytesToTuples(this.bytes)
    }

    return this.#tuples
  }

  stringTuples (): Array<[number, string?]> {
    if (this.#stringTuples == null) {
      this.#stringTuples = codec.tuplesToStringTuples(this.tuples())
    }

    return this.#stringTuples
  }

  encapsulate (addr: MultiaddrInput): Multiaddr {
    addr = new DefaultMultiaddr(addr)
    return new DefaultMultiaddr(this.toString() + addr.toString())
  }

  decapsulate (addr: Multiaddr | string): Multiaddr {
    const addrString = addr.toString()
    const s = this.toString()
    const i = s.lastIndexOf(addrString)
    if (i < 0) {
      throw new Error(`Address ${this.toString()} does not contain subaddress: ${addr.toString()}`)
    }
    return new DefaultMultiaddr(s.slice(0, i))
  }

  decapsulateCode (code: number): Multiaddr {
    const tuples = this.tuples()
    for (let i = tuples.length - 1; i >= 0; i--) {
      if (tuples[i][0] === code) {
        return new DefaultMultiaddr(codec.tuplesToBytes(tuples.slice(0, i)))
      }
    }
    return this
  }

  getPeerId (): string | null {
    try {
      const tuples = this.stringTuples().filter((tuple) => {
        if (tuple[0] === names.ipfs.code) {
          return true
        }
        return false
      })

      // Get the last ipfs tuple ['ipfs', 'peerid string']
      const tuple = tuples.pop()
      if (tuple?.[1] != null) {
        const peerIdStr = tuple[1]

        // peer id is base58btc encoded string but not multibase encoded so add the `z`
        // prefix so we can validate that it is correctly encoded
        if (peerIdStr[0] === 'Q' || peerIdStr[0] === '1') {
          return uint8ArrayToString(base58btc.decode(`z${peerIdStr}`), 'base58btc')
        }

        // try to parse peer id as CID
        return uint8ArrayToString(CID.parse(peerIdStr).multihash.bytes, 'base58btc')
      }

      return null
    } catch (e) {
      return null
    }
  }

  getPath (): string | null {
    let path = null
    try {
      path = this.stringTuples().filter((tuple) => {
        const proto = getProtocol(tuple[0])
        if (proto.path === true) {
          return true
        }
        return false
      })[0][1]

      if (path == null) {
        path = null
      }
    } catch {
      path = null
    }
    return path
  }

  equals (addr: { bytes: Uint8Array }): boolean {
    return uint8ArrayEquals(this.bytes, addr.bytes)
  }

  async resolve (options?: AbortOptions): Promise<Multiaddr[]> {
    const resolvableProto = this.protos().find((p) => p.resolvable)

    // Multiaddr is not resolvable?
    if (resolvableProto == null) {
      return [this]
    }

    const resolver = resolvers.get(resolvableProto.name)
    if (resolver == null) {
      throw errCode(new Error(`no available resolver for ${resolvableProto.name}`), 'ERR_NO_AVAILABLE_RESOLVER')
    }

    const addresses = await resolver(this, options)
    return addresses.map((a) => new DefaultMultiaddr(a))
  }

  nodeAddress (): NodeAddress {
    const options = this.toOptions()

    if (options.transport !== 'tcp' && options.transport !== 'udp') {
      throw new Error(`multiaddr must have a valid format - no protocol with name: "${options.transport}". Must have a valid transport protocol: "{tcp, udp}"`)
    }

    return {
      family: options.family,
      address: options.host,
      port: options.port
    }
  }

  isThinWaistAddress (addr?: Multiaddr): boolean {
    const protos = (addr ?? this).protos()

    if (protos.length !== 2) {
      return false
    }

    if (protos[0].code !== 4 && protos[0].code !== 41) {
      return false
    }
    if (protos[1].code !== 6 && protos[1].code !== 273) {
      return false
    }
    return true
  }

  /**
   * Returns Multiaddr as a human-readable string
   * https://nodejs.org/api/util.html#utilinspectcustom
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * console.info(multiaddr('/ip4/127.0.0.1/tcp/4001'))
   * // 'Multiaddr(/ip4/127.0.0.1/tcp/4001)'
   * ```
   */
  [inspect] (): string {
    return `Multiaddr(${codec.bytesToString(this.bytes)})`
  }
}

/**
 * A function that takes a {@link MultiaddrInput} and returns a {@link Multiaddr}
 *
 * @example
 * ```js
 * import { multiaddr } from '@libp2p/multiaddr'
 *
 * multiaddr('/ip4/127.0.0.1/tcp/4001')
 * // Multiaddr(/ip4/127.0.0.1/tcp/4001)
 * ```
 *
 * @param {MultiaddrInput} [addr] - If String or Uint8Array, needs to adhere to the address format of a [multiaddr](https://github.com/multiformats/multiaddr#string-format)
 */
export function multiaddr (addr?: MultiaddrInput): Multiaddr {
  return new DefaultMultiaddr(addr)
}

export { getProtocol as protocols }
