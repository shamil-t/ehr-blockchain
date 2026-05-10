import type { Protocol } from './index.js'

const V = -1
export const names: Record<string, Protocol> = {}
export const codes: Record<number, Protocol> = {}

export const table: Array<[number, number, string, boolean?, boolean?]> = [
  [4, 32, 'ip4'],
  [6, 16, 'tcp'],
  [33, 16, 'dccp'],
  [41, 128, 'ip6'],
  [42, V, 'ip6zone'],
  [43, 8, 'ipcidr'],
  [53, V, 'dns', true],
  [54, V, 'dns4', true],
  [55, V, 'dns6', true],
  [56, V, 'dnsaddr', true],
  [132, 16, 'sctp'],
  [273, 16, 'udp'],
  [275, 0, 'p2p-webrtc-star'],
  [276, 0, 'p2p-webrtc-direct'],
  [277, 0, 'p2p-stardust'],
  [280, 0, 'webrtc-direct'],
  [281, 0, 'webrtc'],
  [290, 0, 'p2p-circuit'],
  [301, 0, 'udt'],
  [302, 0, 'utp'],
  [400, V, 'unix', false, true],
  // `ipfs` is added before `p2p` for legacy support.
  // All text representations will default to `p2p`, but `ipfs` will
  // still be supported
  [421, V, 'ipfs'],
  // `p2p` is the preferred name for 421, and is now the default
  [421, V, 'p2p'],
  [443, 0, 'https'],
  [444, 96, 'onion'],
  [445, 296, 'onion3'],
  [446, V, 'garlic64'],
  [448, 0, 'tls'],
  [449, V, 'sni'],
  [460, 0, 'quic'],
  [461, 0, 'quic-v1'],
  [465, 0, 'webtransport'],
  [466, V, 'certhash'],
  [477, 0, 'ws'],
  [478, 0, 'wss'],
  [479, 0, 'p2p-websocket-star'],
  [480, 0, 'http'],
  [777, V, 'memory']
]

// populate tables
table.forEach(row => {
  const proto = createProtocol(...row)
  codes[proto.code] = proto
  names[proto.name] = proto
})

export function createProtocol (code: number, size: number, name: string, resolvable?: any, path?: any): Protocol {
  return {
    code,
    size,
    name,
    resolvable: Boolean(resolvable),
    path: Boolean(path)
  }
}

/**
 * For the passed proto string or number, return a {@link Protocol}
 *
 * @example
 *
 * ```js
 * import { protocol } from '@multiformats/multiaddr'
 *
 * console.info(protocol(4))
 * // { code: 4, size: 32, name: 'ip4', resolvable: false, path: false }
 * ```
 */
export function getProtocol (proto: number | string): Protocol {
  if (typeof proto === 'number') {
    if (codes[proto] != null) {
      return codes[proto]
    }

    throw new Error(`no protocol with code: ${proto}`)
  } else if (typeof proto === 'string') {
    if (names[proto] != null) {
      return names[proto]
    }

    throw new Error(`no protocol with name: ${proto}`)
  }

  throw new Error(`invalid protocol id type: ${typeof proto}`)
}
