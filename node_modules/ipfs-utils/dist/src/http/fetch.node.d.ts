export type NodeReadableStream = import('stream').Readable;
export type FetchOptions = import('../types').FetchOptions;
export type ProgressFn = import('../types').ProgressFn;
/**
 * @param {string|Request} url
 * @param {FetchOptions} [options]
 * @returns {Promise<Response>}
 */
export function fetch(url: string | Request, options?: import("../types").FetchOptions | undefined): Promise<Response>;
import { Request } from "../fetch";
import { Headers } from "../fetch";
import { Response } from "../fetch";
export { Request, Headers };
//# sourceMappingURL=fetch.node.d.ts.map