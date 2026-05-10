import type { JsonRpcServer } from "../../../../types/network.js";
import type { EthereumProvider } from "../../../../types/providers.js";
export interface JsonRpcServerConfig {
    hostname: string;
    port?: number;
    provider: EthereumProvider;
}
export declare class JsonRpcServerImplementation implements JsonRpcServer {
    #private;
    constructor(config: JsonRpcServerConfig);
    listen: () => Promise<{
        address: string;
        port: number;
    }>;
    afterClosed: () => Promise<void>;
    close: () => Promise<void>;
}
//# sourceMappingURL=server.d.ts.map