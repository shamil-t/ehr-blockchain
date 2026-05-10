import type { ConfigurationVariableResolver, HardhatConfig, HardhatUserConfig } from "../../../../types/config.js";
import type { ConfigHooks } from "../../../../types/hooks.js";
declare const _default: () => Promise<Partial<ConfigHooks>>;
export default _default;
export declare function extendUserConfig(config: HardhatUserConfig, next: (nextConfig: HardhatUserConfig) => Promise<HardhatUserConfig>): Promise<HardhatUserConfig>;
export declare function resolveUserConfig(userConfig: HardhatUserConfig, resolveConfigurationVariable: ConfigurationVariableResolver, next: (nextUserConfig: HardhatUserConfig, nextResolveConfigurationVariable: ConfigurationVariableResolver) => Promise<HardhatConfig>): Promise<HardhatConfig>;
//# sourceMappingURL=config.d.ts.map