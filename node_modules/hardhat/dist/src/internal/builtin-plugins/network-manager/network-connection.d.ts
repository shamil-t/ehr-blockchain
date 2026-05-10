import type { NetworkConfig } from "../../../types/config.js";
import type { ChainType, NetworkConnection } from "../../../types/network.js";
import type { EthereumProvider } from "../../../types/providers.js";
export type CloseConnectionFunction<ChainTypeT extends ChainType | string> = (networkConnection: NetworkConnectionImplementation<ChainTypeT>) => Promise<void>;
export declare class NetworkConnectionImplementation<ChainTypeT extends ChainType | string> implements NetworkConnection<ChainTypeT> {
    #private;
    readonly id: number;
    readonly networkName: string;
    readonly networkConfig: Readonly<NetworkConfig>;
    readonly chainType: ChainTypeT;
    static create<ChainTypeT extends ChainType | string>(id: number, networkName: string, chainType: ChainTypeT, networkConfig: NetworkConfig, closeConnection: CloseConnectionFunction<ChainTypeT>, createProvider: (networkConnection: NetworkConnectionImplementation<ChainTypeT>) => Promise<EthereumProvider>): Promise<NetworkConnectionImplementation<ChainTypeT>>;
    private constructor();
    get provider(): EthereumProvider;
    close(): Promise<void>;
}
//# sourceMappingURL=network-connection.d.ts.map