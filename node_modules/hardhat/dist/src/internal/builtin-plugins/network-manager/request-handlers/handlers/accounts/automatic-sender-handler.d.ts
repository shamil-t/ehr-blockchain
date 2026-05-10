import { SenderHandler } from "./sender.js";
/**
 * This class automatically retrieves and caches the first available account from the connected provider.
 * It overrides the getSender method of the base class to request the list of accounts if the first account has not been fetched yet,
 * ensuring dynamic selection of the sender for all JSON-RPC requests without requiring manual input.
 */
export declare class AutomaticSenderHandler extends SenderHandler {
    #private;
    protected getSender(): Promise<string | undefined>;
}
//# sourceMappingURL=automatic-sender-handler.d.ts.map