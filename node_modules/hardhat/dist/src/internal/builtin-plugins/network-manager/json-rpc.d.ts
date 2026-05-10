import type { FailedJsonRpcResponse, JsonRpcRequest, JsonRpcResponse, RequestArguments, SuccessfulJsonRpcResponse } from "../../../types/providers.js";
/**
 * Gets a JSON-RPC 2.0 request object.
 * See https://www.jsonrpc.org/specification#request_object
 */
export declare function getJsonRpcRequest(id: number | string, method: string, params?: unknown[] | object): JsonRpcRequest;
export declare function parseJsonRpcResponse(text: string): JsonRpcResponse;
export declare function isJsonRpcRequest(payload: unknown): payload is JsonRpcRequest;
export declare function isJsonRpcResponse(payload: unknown): payload is JsonRpcResponse;
export declare function isSuccessfulJsonRpcResponse(payload: JsonRpcResponse): payload is SuccessfulJsonRpcResponse;
export declare function isFailedJsonRpcResponse(payload: JsonRpcResponse): payload is FailedJsonRpcResponse;
export declare function getRequestParams(requestArguments: RequestArguments): unknown[];
//# sourceMappingURL=json-rpc.d.ts.map