import type { EthereumProvider } from "../../../../../../types/providers.js";
/**
 * This class handles gas estimation for transactions by applying a multiplier to the estimated gas value.
 * It requests a gas estimation from the provider and multiplies it by a predefined gas multiplier, ensuring the gas does not exceed the block's gas limit.
 * If an execution error occurs, the method returns the block's gas limit instead.
 * The block gas limit is cached after the first retrieval to optimize performance.
 */
export declare abstract class MultipliedGasEstimation {
    #private;
    constructor(provider: EthereumProvider, gasMultiplier: number);
    protected getMultipliedGasEstimation(params: any[]): Promise<string>;
}
//# sourceMappingURL=multiplied-gas-estimation.d.ts.map