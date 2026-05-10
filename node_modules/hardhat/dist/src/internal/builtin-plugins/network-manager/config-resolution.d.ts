import type { ConfigurationVariableResolver, EdrNetworkAccountsConfig, EdrNetworkAccountsUserConfig, ChainDescriptorsConfig, ChainDescriptorsUserConfig, EdrNetworkConfig, EdrNetworkForkingConfig, EdrNetworkForkingUserConfig, EdrNetworkMiningConfig, EdrNetworkMiningUserConfig, EdrNetworkUserConfig, GasConfig, GasUserConfig, HttpNetworkAccountsConfig, HttpNetworkAccountsUserConfig, HttpNetworkConfig, HttpNetworkUserConfig } from "../../../types/config.js";
import type { ChainType } from "../../../types/network.js";
export declare function resolveHttpNetwork(networkConfig: HttpNetworkUserConfig, resolveConfigurationVariable: ConfigurationVariableResolver): HttpNetworkConfig;
export declare function resolveEdrNetwork(networkConfig: EdrNetworkUserConfig, defaultChainType: ChainType, cachePath: string, resolveConfigurationVariable: ConfigurationVariableResolver): EdrNetworkConfig;
export declare function resolveGasConfig(value?: GasUserConfig): GasConfig;
export declare function resolveHttpNetworkAccounts(accounts: HttpNetworkAccountsUserConfig | undefined, resolveConfigurationVariable: ConfigurationVariableResolver): HttpNetworkAccountsConfig;
export declare function resolveEdrNetworkAccounts(accounts: EdrNetworkAccountsUserConfig | undefined, resolveConfigurationVariable: ConfigurationVariableResolver): EdrNetworkAccountsConfig;
export declare function resolveForkingConfig(forkingUserConfig: EdrNetworkForkingUserConfig | undefined, cacheDir: string, resolveConfigurationVariable: ConfigurationVariableResolver): EdrNetworkForkingConfig | undefined;
export declare function resolveMiningConfig(miningUserConfig?: EdrNetworkMiningUserConfig | undefined): EdrNetworkMiningConfig;
export declare function resolveCoinbase(coinbase?: string | undefined): Uint8Array;
export declare function resolveChainDescriptors(chainDescriptors: ChainDescriptorsUserConfig | undefined): Promise<ChainDescriptorsConfig>;
export declare function resolveHardfork(hardfork: string | undefined, chainType: ChainType): string;
export declare function resolveInitialBaseFeePerGas(initialBaseFeePerGas: bigint | number | undefined): bigint | undefined;
//# sourceMappingURL=config-resolution.d.ts.map