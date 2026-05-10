import { convertToIpNet } from '../convert.js'
import { multiaddr, type Multiaddr, type MultiaddrInput } from '../index.js'
import type { IpNet } from '@chainsafe/netmask'

/**
 * A utility class to determine if a Multiaddr contains another
 * multiaddr.
 *
 * This can be used with ipcidr ranges to determine if a given
 * multiaddr is in a ipcidr range.
 *
 * @example
 *
 * ```js
 * import { multiaddr, MultiaddrFilter } from '@multiformats/multiaddr'
 *
 * const range = multiaddr('/ip4/192.168.10.10/ipcidr/24')
 * const filter = new MultiaddrFilter(range)
 *
 * const input = multiaddr('/ip4/192.168.10.2/udp/60')
 * console.info(filter.contains(input)) // true
 * ```
 */
export class MultiaddrFilter {
  private readonly multiaddr: Multiaddr
  private readonly netmask: IpNet

  public constructor (input: MultiaddrInput) {
    this.multiaddr = multiaddr(input)
    this.netmask = convertToIpNet(this.multiaddr)
  }

  public contains (input: MultiaddrInput): boolean {
    if (input == null) return false
    const m = multiaddr(input)
    let ip
    for (const [code, value] of m.stringTuples()) {
      if (code === 4 || code === 41) {
        ip = value
        break
      }
    }
    if (ip === undefined) return false
    return this.netmask.contains(ip)
  }
}
