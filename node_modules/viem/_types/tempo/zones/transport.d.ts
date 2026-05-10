import { type HttpTransport, type HttpTransportConfig } from '../../clients/transports/http.js';
import type { Storage } from '../Storage.js';
export type ZoneHttpConfig = Omit<HttpTransportConfig, 'batch' | 'raw' | 'rpcSchema'> & {
    /** Storage for reading zone authorization tokens. Defaults to sessionStorage (web) or memory (server). */
    storage?: Storage | undefined;
};
/**
 * Creates an HTTP transport with support for Zone authentication tokens.
 *
 * Reads the authorization token from Storage and injects the
 * `X-Authorization-Token` header on every request. Batching is disabled
 * by default because zone tokens are account-scoped.
 *
 * @example
 * ```ts
 * import { createPublicClient } from 'viem'
 * import { http, zone } from 'viem/tempo/zones' // or zoneModerato
 *
 * const client = createPublicClient({
 *   chain: zone(6),
 *   transport: http(),
 * })
 * ```
 */
export declare function http(url?: string | undefined, config?: ZoneHttpConfig): HttpTransport;
//# sourceMappingURL=transport.d.ts.map