import type { Address } from 'abitype';
export type ErrorType<name extends string = 'Error'> = Error & {
    name: name;
};
export declare const getContractAddress: (address: Address) => `0x${string}`;
/**
 * Returns the URL with any embedded basic-auth credentials stripped, so
 * error messages and logs don't leak secrets when an RPC URL like
 * `https://user:pass@host` is used.
 */
export declare const getUrl: (url: string) => string;
//# sourceMappingURL=utils.d.ts.map