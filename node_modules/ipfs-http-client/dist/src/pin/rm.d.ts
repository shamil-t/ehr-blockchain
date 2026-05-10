export function createRm(config: import('../types').Options): (ipfsPath: string | import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/pin").RmOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PinAPI = import('ipfs-core-types/src/pin').API<HTTPClientExtraOptions>;
//# sourceMappingURL=rm.d.ts.map