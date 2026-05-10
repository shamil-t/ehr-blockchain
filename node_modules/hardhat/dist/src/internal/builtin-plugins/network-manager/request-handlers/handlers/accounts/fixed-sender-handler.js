import { SenderHandler } from "./sender.js";
/**
 * This class provides a fixed sender address for transactions.
 * It overrides the getSender method of the base class to always return the sender address specified during instantiation,
 * ensuring that all JSON-RPC requests use this fixed sender.
 */
export class FixedSenderHandler extends SenderHandler {
    #sender;
    constructor(provider, sender) {
        super(provider);
        this.#sender = sender;
    }
    async getSender() {
        return this.#sender;
    }
}
//# sourceMappingURL=fixed-sender-handler.js.map