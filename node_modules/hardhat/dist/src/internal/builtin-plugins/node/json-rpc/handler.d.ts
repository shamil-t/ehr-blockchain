import type { EthereumProvider } from "../../../../types/providers.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type WebSocket from "ws";
export declare class JsonRpcHandler {
    #private;
    constructor(provider: EthereumProvider);
    handleHttp: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    handleWs: (ws: WebSocket) => Promise<void>;
}
//# sourceMappingURL=handler.d.ts.map