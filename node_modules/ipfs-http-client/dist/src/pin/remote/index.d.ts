/**
 * @param {import('../../types').Options} config
 */
export function createRemote(config: import('../../types').Options): {
    add: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options: import("ipfs-core-types/src/pin/remote/index.js").AddOptions & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => Promise<import("ipfs-core-types/src/pin/remote/index.js").Pin>;
    ls: (query: import("ipfs-core-types/src/pin/remote/index.js").Query & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => AsyncIterable<import("ipfs-core-types/src/pin/remote/index.js").Pin>;
    rm: (query: import("ipfs-core-types/src/pin/remote/index.js").Query & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => Promise<void>;
    rmAll: (query: import("ipfs-core-types/src/pin/remote/index.js").Query & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => Promise<void>;
    service: {
        add: (name: string, credentials: import("ipfs-core-types/src/pin/remote/service/index.js").Credentials & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => Promise<void>;
        ls: (options?: {}) => Promise<import("ipfs-core-types/src/pin/remote/service/index.js").RemotePinServiceWithStat[]>;
        rm: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    };
};
//# sourceMappingURL=index.d.ts.map