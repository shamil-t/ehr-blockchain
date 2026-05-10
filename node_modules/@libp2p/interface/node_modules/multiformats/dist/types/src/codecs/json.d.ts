export const name: "json";
export const code: 512;
export function encode<T>(node: T): import("./interface.js").ByteView<T>;
export function decode<T>(data: import("./interface.js").ByteView<T>): T;
export type ByteView<T> = import('./interface.js').ByteView<T>;
//# sourceMappingURL=json.d.ts.map