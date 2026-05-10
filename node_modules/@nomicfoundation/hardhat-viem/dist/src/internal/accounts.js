const accountsCache = new WeakMap();
export async function getAccounts(provider) {
    const cachedAccounts = accountsCache.get(provider);
    if (cachedAccounts !== undefined) {
        return cachedAccounts;
    }
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    -- We know that the provider is going to return an array of accounts */
    const accounts = (await provider.request({
        method: "eth_accounts",
    }));
    accountsCache.set(provider, accounts);
    return accounts;
}
//# sourceMappingURL=accounts.js.map