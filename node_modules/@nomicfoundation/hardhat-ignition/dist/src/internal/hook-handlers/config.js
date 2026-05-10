import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors";
import { resolveFromRoot } from "@nomicfoundation/hardhat-utils/path";
export default async () => ({
    resolveUserConfig,
});
export async function resolveUserConfig(userConfig, resolveConfigurationVariable, next) {
    const resolvedConfig = await next(userConfig, resolveConfigurationVariable);
    const updatedNetworks = Object.fromEntries(Object.entries(resolvedConfig.networks).map(([networkName, networkConfig]) => {
        assertHardhatInvariant(userConfig.networks !== undefined, "Networks are undefined");
        const givenIgnition = userConfig.networks[networkName].ignition ?? {};
        return [
            networkName,
            {
                ...networkConfig,
                ignition: {
                    maxFeePerGasLimit: givenIgnition.maxFeePerGasLimit,
                    maxFeePerGas: givenIgnition.maxFeePerGas,
                    maxPriorityFeePerGas: givenIgnition.maxPriorityFeePerGas,
                    gasPrice: givenIgnition.gasPrice,
                    disableFeeBumping: givenIgnition.disableFeeBumping,
                    explorerUrl: givenIgnition.explorerUrl,
                    maxRetries: givenIgnition.maxRetries,
                    retryInterval: givenIgnition.retryInterval,
                },
            },
        ];
    }));
    const paths = resolvedConfig.paths ?? {};
    const ignition = userConfig.ignition ?? {};
    return {
        ...resolvedConfig,
        networks: updatedNetworks,
        paths: {
            ...paths,
            ignition: resolveFromRoot(resolvedConfig.paths.root, userConfig.paths?.ignition ?? "ignition"),
        },
        ignition: {
            ...ignition,
        },
    };
}
//# sourceMappingURL=config.js.map