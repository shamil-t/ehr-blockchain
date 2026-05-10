export function errorHandler(response: Response): Promise<never>;
export class Client extends HTTP {
    /**
     * @param {Options|URL|Multiaddr|string} [options]
     */
    constructor(options?: string | import("../types").Options | URL | import("@multiformats/multiaddr").Multiaddr | undefined);
}
export const HTTPError: typeof HTTP.HTTPError;
export type HTTPOptions = import('ipfs-utils/src/types').HTTPOptions;
export type Options = import('../types').Options;
export type Multiaddr = import('@multiformats/multiaddr').Multiaddr;
import HTTP from "ipfs-utils/src/http.js";
//# sourceMappingURL=core.d.ts.map