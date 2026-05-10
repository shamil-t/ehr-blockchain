/**
 * @param {import('../../../types').Options} config
 */
export function createService(config: import('../../../types').Options): {
    add: (name: string, credentials: import("ipfs-core-types/src/pin/remote/service/index.js").Credentials & import("ipfs-core-types").AbortOptions & import("../../../types").HTTPClientExtraOptions) => Promise<void>;
    ls: (options?: {}) => Promise<import("ipfs-core-types/src/pin/remote/service/index.js").RemotePinServiceWithStat[]>;
    rm: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../../../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map