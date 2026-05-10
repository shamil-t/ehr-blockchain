export * from "./link/interface.js";
export function createLegacy(digest: API.MultihashDigest<typeof SHA_256_CODE>): API.LegacyLink;
export function create<Data extends unknown, Code extends number, Alg extends number>(code: Code, digest: API.MultihashDigest<Alg>): API.Link<Data, Code, Alg, 1>;
export function isLink<L extends API.Link<unknown, number, number, 0 | 1>>(value: unknown): value is L & CID<any, number, number, API.Version>;
export function parse<Prefix extends string, Data extends unknown, Code extends number, Alg extends number, Ver extends API.Version>(source: API.ToString<API.Link<Data, Code, Alg, Ver>, Prefix>, base?: API.MultibaseDecoder<Prefix> | undefined): API.Link<Data, Code, Alg, Ver>;
export function decode<Data extends unknown, Code extends number, Alg extends number, Ver extends API.Version>(bytes: API.ByteView<API.Link<Data, Code, Alg, Ver>>): API.Link<Data, Code, Alg, Ver>;
import * as API from "./link/interface.js";
declare const SHA_256_CODE: 18;
import { CID } from './cid.js';
import { format } from './cid.js';
import { toJSON } from './cid.js';
import { fromJSON } from './cid.js';
export { format, toJSON, fromJSON };
//# sourceMappingURL=link.d.ts.map