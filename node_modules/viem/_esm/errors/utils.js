export const getContractAddress = (address) => address;
/**
 * Returns the URL with any embedded basic-auth credentials stripped, so
 * error messages and logs don't leak secrets when an RPC URL like
 * `https://user:pass@host` is used.
 */
export const getUrl = (url) => {
    try {
        const parsed = new URL(url);
        if (!parsed.username && !parsed.password)
            return url;
        parsed.username = '';
        parsed.password = '';
        return parsed.toString();
    }
    catch {
        return url;
    }
};
//# sourceMappingURL=utils.js.map