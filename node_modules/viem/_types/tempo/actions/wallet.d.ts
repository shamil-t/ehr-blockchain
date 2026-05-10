import type { Address } from 'abitype';
import type { Client } from '../../clients/createClient.js';
import type { Transport } from '../../clients/transports/createTransport.js';
import type { ErrorType as CoreErrorType } from '../../errors/utils.js';
import type { Chain } from '../../types/chain.js';
import type { RequestErrorType } from '../../utils/buildRequest.js';
import type { TransactionReceipt } from '../Transaction.js';
/**
 * Opens the wallet send flow with optional pre-filled send fields.
 *
 * @example
 * ```ts
 * import { createClient, custom } from 'viem'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   transport: custom(window.ethereum),
 * })
 *
 * const { receipt } = await Actions.wallet.send(client, {
 *   to: '0x...',
 *   token: '0x...',
 *   value: '1.5',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The submitted send receipt and chain ID.
 */
export declare function send<chain extends Chain | undefined>(client: Client<Transport, chain>, parameters?: send.Parameters): Promise<send.ReturnValue>;
export declare namespace send {
    type Parameters = {
        /**
         * Fee payer override. `false` to disable the wallet's default fee payer,
         * a URL string to use a custom fee payer service.
         */
        feePayer?: boolean | string | undefined;
        /** Recipient address to pre-fill. */
        to?: Address | undefined;
        /** Token contract address to pre-fill. Omit to let the user choose. */
        token?: Address | undefined;
        /** Human-readable amount to pre-fill (for example, "1.5"). */
        value?: string | undefined;
    };
    type ReturnValue = {
        /** Chain ID the send was submitted to. */
        chainId: number;
        /** Receipt of the submitted send. */
        receipt: TransactionReceipt;
    };
    type ErrorType = RequestErrorType | CoreErrorType;
}
/**
 * Opens the wallet swap flow with optional pre-filled swap fields.
 *
 * @example
 * ```ts
 * import { createClient, custom } from 'viem'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   transport: custom(window.ethereum),
 * })
 *
 * const { receipt } = await Actions.wallet.swap(client, {
 *   amount: '1.5',
 *   token: '0x...',
 *   type: 'sell',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The submitted swap receipt.
 */
export declare function swap<chain extends Chain | undefined>(client: Client<Transport, chain>, parameters?: swap.Parameters): Promise<swap.ReturnValue>;
export declare namespace swap {
    type Parameters = {
        /** Human-readable amount to pre-fill (for example, "1.5"). */
        amount?: string | undefined;
        /**
         * Other side of the swap pair. For buys, this is the token to sell.
         * For sells, this is the token to buy.
         */
        pairToken?: Address | undefined;
        /** Maximum allowed slippage as a decimal fraction, for example `0.05`. */
        slippage?: number | undefined;
        /** Token to buy or sell. Omit to let the user choose. */
        token?: Address | undefined;
        /** Whether the amount is an exact buy or sell amount. */
        type?: 'buy' | 'sell' | undefined;
    };
    type ReturnValue = {
        /** Receipt of the submitted swap. */
        receipt: TransactionReceipt;
    };
    type ErrorType = RequestErrorType | CoreErrorType;
}
/**
 * Opens the wallet deposit flow with optional pre-filled deposit fields.
 *
 * @example
 * ```ts
 * import { createClient, custom } from 'viem'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   transport: custom(window.ethereum),
 * })
 *
 * const result = await Actions.wallet.deposit(client, {
 *   token: '0x...',
 *   value: '1.5',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns Receipts for onchain deposit operations, when applicable.
 */
export declare function deposit<chain extends Chain | undefined>(client: Client<Transport, chain>, parameters?: deposit.Parameters): Promise<deposit.ReturnValue>;
export declare namespace deposit {
    type Parameters = {
        /** Deposit address to pre-fill. */
        address?: Address | undefined;
        /** Source chain ID to pre-fill. */
        chainId?: number | undefined;
        /** Human-readable account display name. */
        displayName?: string | undefined;
        /** Token contract address to pre-fill. Omit to let the user choose. */
        token?: Address | undefined;
        /** Human-readable amount to pre-fill (for example, "1.5"). */
        value?: string | undefined;
    };
    type ReturnValue = {
        /** Receipts of any onchain operations performed during the deposit. */
        receipts?: readonly TransactionReceipt[] | undefined;
    } | undefined;
    type ErrorType = RequestErrorType | CoreErrorType;
}
//# sourceMappingURL=wallet.d.ts.map