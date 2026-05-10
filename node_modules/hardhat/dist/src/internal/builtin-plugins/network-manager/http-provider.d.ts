import type { JsonRpcRequestWrapperFunction } from "./network-manager.js";
import type { RequestArguments, SuccessfulJsonRpcResponse } from "../../../types/providers.js";
import type { Dispatcher } from "@nomicfoundation/hardhat-utils/request";
import { BaseProvider } from "./base-provider.js";
interface HttpProviderConfig {
    url: string;
    networkName: string;
    extraHeaders?: Record<string, string>;
    timeout: number;
    jsonRpcRequestWrapper?: JsonRpcRequestWrapperFunction;
    testDispatcher?: Dispatcher;
}
export declare class HttpProvider extends BaseProvider {
    #private;
    /**
     * Creates a new instance of `HttpProvider`.
     */
    static create({ url, networkName, extraHeaders, timeout, jsonRpcRequestWrapper, testDispatcher, }: HttpProviderConfig): Promise<HttpProvider>;
    /**
     * @private
     *
     * This constructor is intended for internal use only.
     * Use the static method {@link HttpProvider.create} to create an instance of
     * `HttpProvider`.
     */
    private constructor();
    request(requestArguments: RequestArguments): Promise<SuccessfulJsonRpcResponse["result"]>;
    close(): Promise<void>;
}
/**
 * Gets either a pool or proxy dispatcher depending on the URL and the
 * proxy configuration. This function is used internally by
 * `HttpProvider.create` and should not be used directly.
 */
export declare function getHttpDispatcher(url: string, timeout?: number): Promise<Dispatcher>;
export {};
//# sourceMappingURL=http-provider.d.ts.map