import type { EdrNetworkForkingConfig, EdrNetworkHDAccountsConfig, EdrNetworkMiningConfig, HardhatUserConfig, HttpNetworkHDAccountsConfig, HttpNetworkHDAccountsUserConfig } from "../../../types/config.js";
import type { HardhatUserConfigValidationError } from "../../../types/hooks.js";
export declare function validateNetworkUserConfig(userConfig: HardhatUserConfig): Promise<HardhatUserConfigValidationError[]>;
export declare function isHttpNetworkHdAccountsUserConfig(accounts: unknown): accounts is HttpNetworkHDAccountsUserConfig;
export declare function isHttpNetworkHdAccountsConfig(accounts: unknown): accounts is HttpNetworkHDAccountsConfig;
export declare function isEdrNetworkHdAccountsConfig(accounts: unknown): accounts is EdrNetworkHDAccountsConfig;
export declare function isEdrNetworkForkingConfig(forking: unknown): forking is EdrNetworkForkingConfig;
export declare function isEdrNetworkMiningConfig(mining: unknown): mining is EdrNetworkMiningConfig;
//# sourceMappingURL=type-validation.d.ts.map