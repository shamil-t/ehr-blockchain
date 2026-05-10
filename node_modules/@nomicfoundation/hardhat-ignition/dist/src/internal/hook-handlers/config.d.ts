import type { ConfigurationVariableResolver, HardhatConfig, HardhatUserConfig } from "hardhat/types/config";
import type { ConfigHooks } from "hardhat/types/hooks";
declare const _default: () => Promise<Partial<ConfigHooks>>;
export default _default;
export declare function resolveUserConfig(userConfig: HardhatUserConfig, resolveConfigurationVariable: ConfigurationVariableResolver, next: (nextUserConfig: HardhatUserConfig, nextResolveConfigurationVariable: ConfigurationVariableResolver) => Promise<HardhatConfig>): Promise<HardhatConfig>;
//# sourceMappingURL=config.d.ts.map