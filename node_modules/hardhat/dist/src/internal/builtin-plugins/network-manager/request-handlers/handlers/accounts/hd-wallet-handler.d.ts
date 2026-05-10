import type { EthereumProvider } from "../../../../../../types/providers.js";
import { LocalAccountsHandler } from "./local-accounts.js";
/**
 * This handler takes a long time to load because it imports LocalAccountsHandler.
 * Currently, it is only used in the handlers array where it is imported dynamically.
 */
export declare class HDWalletHandler extends LocalAccountsHandler {
    static create(provider: EthereumProvider, mnemonic: string, hdpath?: string, initialIndex?: number, count?: number, passphrase?: string): Promise<HDWalletHandler>;
    private constructor();
}
//# sourceMappingURL=hd-wallet-handler.d.ts.map