import type { EthereumProvider, JsonRpcRequest, JsonRpcResponse, RequestArguments, SuccessfulJsonRpcResponse } from "../../../types/providers.js";
import EventEmitter from "node:events";
export declare abstract class BaseProvider extends EventEmitter implements EthereumProvider {
    abstract request(requestArguments: RequestArguments): Promise<SuccessfulJsonRpcResponse["result"]>;
    abstract close(): Promise<void>;
    send(method: string, params?: unknown[]): Promise<SuccessfulJsonRpcResponse["result"]>;
    sendAsync(jsonRpcRequest: JsonRpcRequest, callback: (error: any, jsonRpcResponse: JsonRpcResponse) => void): void;
}
//# sourceMappingURL=base-provider.d.ts.map