import type { Protocol } from './index.js';
export declare const names: Record<string, Protocol>;
export declare const codes: Record<number, Protocol>;
export declare const table: Array<[number, number, string, boolean?, boolean?]>;
export declare function createProtocol(code: number, size: number, name: string, resolvable?: any, path?: any): Protocol;
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
export declare function getProtocol(proto: number | string): Protocol;
//# sourceMappingURL=protocols-table.d.ts.map