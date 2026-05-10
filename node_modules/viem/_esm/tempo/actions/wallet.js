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
export async function send(client, parameters = {}) {
    return client.request({
        method: 'wallet_send',
        params: [parameters],
    }, { retryCount: 0 });
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
export async function swap(client, parameters = {}) {
    return client.request({
        method: 'wallet_swap',
        params: [parameters],
    }, { retryCount: 0 });
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
export async function deposit(client, parameters = {}) {
    return client.request({
        method: 'wallet_deposit',
        params: [parameters],
    }, { retryCount: 0 });
}
//# sourceMappingURL=wallet.js.map