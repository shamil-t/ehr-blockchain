import EventEmitter from "node:events";
import util from "node:util";
import { ensureNodeErrnoExceptionError } from "@nomicfoundation/hardhat-utils/error";
export class BaseProvider extends EventEmitter {
    send(method, params) {
        return this.request({ method, params });
    }
    sendAsync(jsonRpcRequest, callback) {
        const handleJsonRpcRequest = async () => {
            let jsonRpcResponse;
            try {
                const result = await this.request({
                    method: jsonRpcRequest.method,
                    params: jsonRpcRequest.params,
                });
                jsonRpcResponse = {
                    jsonrpc: "2.0",
                    id: jsonRpcRequest.id,
                    result,
                };
            }
            catch (error) {
                ensureNodeErrnoExceptionError(error);
                const errorCode = parseInt(`${error.code}`, 10);
                jsonRpcResponse = {
                    jsonrpc: "2.0",
                    id: jsonRpcRequest.id,
                    error: {
                        code: !isNaN(errorCode) ? errorCode : -1,
                        message: error.message,
                        data: {
                            stack: error.stack,
                            name: error.name,
                        },
                    },
                };
            }
            return jsonRpcResponse;
        };
        util.callbackify(handleJsonRpcRequest)(callback);
    }
}
//# sourceMappingURL=base-provider.js.map