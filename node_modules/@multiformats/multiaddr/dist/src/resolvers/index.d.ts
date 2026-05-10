/**
 * @packageDocumentation
 *
 * Provides strategies for resolving multiaddrs.
 */
import type { AbortOptions, Multiaddr } from '../index.js';
/**
 * Resolver for dnsaddr addresses.
 *
 * @example
 *
 * ```typescript
 * import { dnsaddrResolver } from '@multiformats/multiaddr/resolvers'
 * import { multiaddr } from '@multiformats/multiaddr'
 *
 * const ma = multiaddr('/dnsaddr/bootstrap.libp2p.io')
 * const addresses = await dnsaddrResolver(ma)
 *
 * console.info(addresses)
 * //[
 * //  '/dnsaddr/am6.bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
 * //  '/dnsaddr/ny5.bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
 * //  '/dnsaddr/sg1.bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
 * //  '/dnsaddr/sv15.bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
 * //]
 * ```
 */
export declare function dnsaddrResolver(addr: Multiaddr, options?: AbortOptions): Promise<string[]>;
//# sourceMappingURL=index.d.ts.map