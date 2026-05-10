/**
 * @param {import('../types').Options} config
 */
export function createDiag(config: import('../types').Options): {
    cmds: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/diag/index.js").CmdsResult[]>;
    net: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<any>;
    sys: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<any>;
};
//# sourceMappingURL=index.d.ts.map