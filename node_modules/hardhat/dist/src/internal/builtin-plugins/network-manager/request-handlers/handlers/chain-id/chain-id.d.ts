import type { EthereumProvider } from "../../../../../../types/providers.js";
/**
 * This class is responsible for retrieving the chain ID of the network.
 * It uses the provider to fetch the chain ID via two methods: 'eth_chainId' and,
 * as a fallback, 'net_version' if the first one fails. The chain ID is cached
 * after being retrieved to avoid redundant requests.
 */
export declare class ChainId {
    #private;
    protected readonly provider: EthereumProvider;
    constructor(provider: EthereumProvider);
    protected getChainId(): Promise<number>;
}
//# sourceMappingURL=chain-id.d.ts.map