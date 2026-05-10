import { derivePrivateKeys } from "../../../accounts/derive-private-keys.js";
import { LocalAccountsHandler } from "./local-accounts.js";
/**
 * This handler takes a long time to load because it imports LocalAccountsHandler.
 * Currently, it is only used in the handlers array where it is imported dynamically.
 */
export class HDWalletHandler extends LocalAccountsHandler {
    static async create(provider, mnemonic, hdpath = "m/44'/60'/0'/0/", initialIndex = 0, count = 10, passphrase = "") {
        const privateKeys = await derivePrivateKeys(mnemonic, hdpath, initialIndex, count, passphrase);
        return new HDWalletHandler(provider, privateKeys);
    }
    constructor(provider, privateKeys) {
        super(provider, privateKeys);
    }
}
//# sourceMappingURL=hd-wallet-handler.js.map