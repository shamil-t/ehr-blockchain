export async function resolveTestUserConfig(userConfig, resolvedConfig) {
    return {
        ...resolvedConfig,
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the
        empty object is typed correctly by core type, but not when the solidity test
        plugins extensions are included  */
        test: userConfig.test ?? {},
    };
}
//# sourceMappingURL=config.js.map