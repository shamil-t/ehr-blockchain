/**
 * @param {import('../types').Options} config
 */
export function createKey(config: import('../types').Options): {
    export: (name: string, password: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<string>;
    gen: (name: string, options?: (import("ipfs-core-types/src/key/index.js").GenOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").Key>;
    import: (name: string, pem: string, password: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").Key>;
    info: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").Key>;
    list: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").Key[]>;
    rename: (oldName: string, newName: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").RenameKeyResult>;
    rm: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/key/index.js").Key>;
};
//# sourceMappingURL=index.d.ts.map