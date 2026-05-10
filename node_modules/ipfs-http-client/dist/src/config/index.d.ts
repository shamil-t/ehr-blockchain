/**
 * @param {import('../types').Options} config
 */
export function createConfig(config: import('../types').Options): {
    getAll: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/config/index.js").Config>;
    get: (key: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<string | object>;
    set: (key: string, value: any, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    replace: (config: import("ipfs-core-types/src/config/index.js").Config, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    profiles: {
        apply: (name: string, options?: (import("ipfs-core-types/src/config/profiles/index.js").ProfilesApplyOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/config/profiles/index.js").ProfilesApplyResult>;
        list: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/config/profiles/index.js").Profile[]>;
    };
};
//# sourceMappingURL=index.d.ts.map