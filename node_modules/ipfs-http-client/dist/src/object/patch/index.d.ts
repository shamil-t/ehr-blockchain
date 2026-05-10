/**
 * @param {import('../../types').Options} config
 */
export function createPatch(config: import('../../types').Options): {
    addLink: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, link: import("@ipld/dag-pb/dist/src/interface.js").PBLink, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    appendData: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    rmLink: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, link: string | import("@ipld/dag-pb/dist/src/interface.js").PBLink, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    setData: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
};
//# sourceMappingURL=index.d.ts.map