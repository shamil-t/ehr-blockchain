import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { DEFAULT_NETWORK_NAME, GENERIC_CHAIN_TYPE, } from "../../../constants.js";
import { resolveChainDescriptors, resolveEdrNetwork, resolveHttpNetwork, } from "../config-resolution.js";
import { validateNetworkUserConfig } from "../type-validation.js";
export default async () => ({
    extendUserConfig,
    validateUserConfig: validateNetworkUserConfig,
    resolveUserConfig,
});
export async function extendUserConfig(config, next) {
    const extendedConfig = await next(config);
    const networks = extendedConfig.networks ?? {};
    const localhostConfig = networks.localhost;
    const defaultConfig = networks.default;
    const nodeConfig = networks.node;
    let extendedLocalhostConfig;
    if (localhostConfig === undefined ||
        localhostConfig.type === undefined ||
        localhostConfig.type === "http") {
        extendedLocalhostConfig = {
            url: "http://localhost:8545",
            type: "http",
            /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              -- We cast it here because otherwise TS complains that some fields are
              always overwritten, which is not true for js incomplete configs. */
            ...localhostConfig,
        };
    }
    else {
        extendedLocalhostConfig = localhostConfig;
    }
    const defaultEdrNetworkConfigValues = {
        chainId: 31337,
        gas: "auto",
        gasMultiplier: 1,
        gasPrice: "auto",
        type: "edr-simulated",
    };
    let extendedDefaultConfig;
    if (defaultConfig === undefined ||
        defaultConfig.type === undefined ||
        defaultConfig.type === "edr-simulated") {
        extendedDefaultConfig = {
            ...defaultEdrNetworkConfigValues,
            /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              -- We cast it here because otherwise TS complains that some fields are
              always overwritten, which is not true for js incomplete configs. */
            ...defaultConfig,
        };
    }
    else {
        extendedDefaultConfig = defaultConfig;
    }
    let extendedNodeConfig;
    if (nodeConfig === undefined ||
        nodeConfig.type === undefined ||
        nodeConfig.type === "edr-simulated") {
        extendedNodeConfig = {
            ...defaultEdrNetworkConfigValues,
            /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              -- We cast it here because otherwise TS complains that url and http will
              be always overwritten, which is not true for js incomplete configs. */
            ...nodeConfig,
        };
    }
    else {
        extendedNodeConfig = nodeConfig;
    }
    return {
        ...extendedConfig,
        networks: {
            ...networks,
            localhost: extendedLocalhostConfig,
            [DEFAULT_NETWORK_NAME]: extendedDefaultConfig,
            node: extendedNodeConfig,
        },
    };
}
export async function resolveUserConfig(userConfig, resolveConfigurationVariable, next) {
    const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
    const resolvedDefaultChainType = userConfig.defaultChainType ?? GENERIC_CHAIN_TYPE;
    const networks = userConfig.networks ?? {};
    const resolvedNetworks = {};
    for (const [networkName, networkConfig] of Object.entries(networks)) {
        const networkType = networkConfig.type;
        if (networkType !== "http" && networkType !== "edr-simulated") {
            throw new HardhatError(HardhatError.ERRORS.CORE.NETWORK.INVALID_NETWORK_TYPE, {
                networkName,
                networkType,
            });
        }
        resolvedNetworks[networkName] =
            networkConfig.type === "http"
                ? resolveHttpNetwork(networkConfig, resolveConfigurationVariable)
                : resolveEdrNetwork(networkConfig, resolvedDefaultChainType, resolvedConfig.paths.cache, resolveConfigurationVariable);
    }
    return {
        ...resolvedConfig,
        chainDescriptors: await resolveChainDescriptors(userConfig.chainDescriptors),
        defaultChainType: resolvedDefaultChainType,
        networks: resolvedNetworks,
    };
}
//# sourceMappingURL=config.js.map