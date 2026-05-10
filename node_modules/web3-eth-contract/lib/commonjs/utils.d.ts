import { TransactionForAccessList, AbiFunctionFragment, TransactionWithSenderAPI, TransactionCall, HexString, Address, NonPayableCallOptions, PayableCallOptions, ContractOptions } from 'web3-types';
export declare const getSendTxParams: ({ abi, params, options, contractOptions, }: {
    abi: AbiFunctionFragment;
    params: unknown[];
    options?: ((NonPayableCallOptions | PayableCallOptions) & {
        input?: string | undefined;
        data?: string | undefined;
        to?: string | undefined;
        dataInputFill?: "data" | "input" | "both" | undefined;
    }) | undefined;
    contractOptions: ContractOptions;
}) => TransactionCall;
export declare const getEthTxCallParams: ({ abi, params, options, contractOptions, }: {
    abi: AbiFunctionFragment;
    params: unknown[];
    options?: ((NonPayableCallOptions | PayableCallOptions) & {
        to?: string | undefined;
        dataInputFill?: "data" | "input" | "both" | undefined;
    }) | undefined;
    contractOptions: ContractOptions;
}) => TransactionCall;
export declare const getEstimateGasParams: ({ abi, params, options, contractOptions, }: {
    abi: AbiFunctionFragment;
    params: unknown[];
    options?: ((NonPayableCallOptions | PayableCallOptions) & {
        dataInputFill?: "data" | "input" | "both" | undefined;
    }) | undefined;
    contractOptions: ContractOptions;
}) => Partial<TransactionWithSenderAPI>;
export declare const isWeb3ContractContext: (options: unknown) => options is Partial<import("web3-core").Web3ContextInitOptions<import("web3-types").EthExecutionAPI, {
    logs: typeof import("./log_subscription.js").LogsSubscription;
    newHeads: typeof import("web3-eth").NewHeadsSubscription;
    newBlockHeaders: typeof import("web3-eth").NewHeadsSubscription;
}>>;
export declare const getCreateAccessListParams: ({ abi, params, options, contractOptions, }: {
    abi: AbiFunctionFragment;
    params: unknown[];
    options?: ((NonPayableCallOptions | PayableCallOptions) & {
        to?: string | undefined;
        dataInputFill?: "data" | "input" | "both" | undefined;
    }) | undefined;
    contractOptions: ContractOptions;
}) => TransactionForAccessList;
