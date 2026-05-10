/**
 * @param {import('../../types').Options} config
 */
export function createProfiles(config: import('../../types').Options): {
    apply: (name: string, options?: (import("ipfs-core-types/src/config/profiles/index.js").ProfilesApplyOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/config/profiles/index.js").ProfilesApplyResult>;
    list: (options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/config/profiles/index.js").Profile[]>;
};
//# sourceMappingURL=index.d.ts.map