export const name: "dag-cbor";
export const code: 113;
export function encode<T>(node: T): import("multiformats/cid").ByteView<T>;
export function decode<T>(data: import("multiformats/cid").ByteView<T>): T;
export type ByteView<T> = import('multiformats/codecs/interface').ByteView<T>;
//# sourceMappingURL=index.d.ts.map