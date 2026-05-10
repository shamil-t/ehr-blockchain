/**
 * @param {import('ipfs-core-utils/multicodecs').Multicodecs} codecs
 * @param {import('../types').Options} config
 */
export function createObject(codecs: import('ipfs-core-utils/multicodecs').Multicodecs, config: import('../types').Options): {
    data: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<Uint8Array>;
    get: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@ipld/dag-pb/dist/src/interface.js").PBNode>;
    links: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@ipld/dag-pb/dist/src/interface.js").PBLink[]>;
    new: (options?: (import("ipfs-core-types/src/object/index.js").NewObjectOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    put: (obj: import("@ipld/dag-pb/dist/src/interface.js").PBNode, options?: (import("ipfs-core-types/src/object/index.js").PutOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    stat: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/object/index.js").StatResult>;
    patch: {
        addLink: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, link: import("@ipld/dag-pb/dist/src/interface.js").PBLink, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
        appendData: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
        rmLink: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, link: string | import("@ipld/dag-pb/dist/src/interface.js").PBLink, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
        setData: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    };
};
//# sourceMappingURL=index.d.ts.map