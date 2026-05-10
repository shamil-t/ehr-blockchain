import { EIP1193Provider, LegacyRequestProvider, LegacySendAsyncProvider, LegacySendProvider, SupportedProviders, Web3BaseProvider, MetaMaskProvider } from 'web3-types';
export declare const isWeb3Provider: <API extends unknown>(provider: SupportedProviders<API>) => provider is Web3BaseProvider<API>;
export declare const isMetaMaskProvider: <API extends unknown>(provider: SupportedProviders<API>) => provider is MetaMaskProvider<API>;
export declare const isLegacyRequestProvider: <API extends unknown>(provider: SupportedProviders<API>) => provider is LegacyRequestProvider;
export declare const isEIP1193Provider: <API extends unknown>(provider: SupportedProviders<API>) => provider is EIP1193Provider<API>;
export declare const isLegacySendProvider: <API extends unknown>(provider: SupportedProviders<API>) => provider is LegacySendProvider;
export declare const isLegacySendAsyncProvider: <API extends unknown>(provider: SupportedProviders<API>) => provider is LegacySendAsyncProvider;
export declare const isSupportedProvider: <API extends unknown>(provider: SupportedProviders<API>) => provider is SupportedProviders<API>;
export declare const isSupportSubscriptions: <API extends unknown>(provider: SupportedProviders<API>) => boolean;
//# sourceMappingURL=utils.d.ts.map