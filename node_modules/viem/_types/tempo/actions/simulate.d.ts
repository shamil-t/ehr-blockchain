import type { AbiStateMutability, Address, Narrow } from 'abitype';
import * as BlockOverrides from 'ox/BlockOverrides';
import { type ParseAccountErrorType } from '../../accounts/utils/parseAccount.js';
import type { Client } from '../../clients/createClient.js';
import type { Transport } from '../../clients/transports/createTransport.js';
import type { ErrorType as ErrorType_ } from '../../errors/utils.js';
import type { Account } from '../../types/account.js';
import type { Block, BlockTag } from '../../types/block.js';
import type { Calls } from '../../types/calls.js';
import type { Chain } from '../../types/chain.js';
import type { Log } from '../../types/log.js';
import type { Hex } from '../../types/misc.js';
import type { MulticallResults } from '../../types/multicall.js';
import type { StateOverride } from '../../types/stateOverride.js';
import type { TransactionRequest } from '../../types/transaction.js';
import type { ExactPartial, UnionOmit } from '../../types/utils.js';
import { type DecodeFunctionResultErrorType } from '../../utils/abi/decodeFunctionResult.js';
import { type EncodeFunctionDataErrorType } from '../../utils/abi/encodeFunctionData.js';
import { type NumberToHexErrorType } from '../../utils/encoding/toHex.js';
import { type GetNodeErrorReturnType } from '../../utils/errors/getNodeError.js';
import { type FormatBlockErrorType } from '../../utils/formatters/block.js';
import { type FormatTransactionRequestErrorType } from '../../utils/formatters/transactionRequest.js';
import { type SerializeStateOverrideErrorType } from '../../utils/stateOverride.js';
import { type AssertRequestErrorType } from '../../utils/transaction/assertRequest.js';
export type TokenMetadata = {
    [address: Hex]: {
        name: string;
        symbol: string;
        currency: string;
    };
};
type CallExtraProperties = ExactPartial<UnionOmit<TransactionRequest, 'blobs' | 'data' | 'kzg' | 'to' | 'sidecars' | 'value'>> & {
    /** Account attached to the call (msg.sender). */
    account?: Account | Address | undefined;
    /** Recipient. `null` if contract deployment. */
    to?: Address | null | undefined;
};
/**
 * Simulates a set of calls on block(s) via `tempo_simulateV1`.
 *
 * Returns simulated block results and token metadata for any TIP-20
 * tokens involved in the simulation.
 *
 * @example
 * ```ts
 * import { createClient, http, parseUnits } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: '0x...',
 *   chain: tempo,
 *   transport: http(),
 * })
 *
 * const { blocks, tokenMetadata } = await Actions.simulate.simulateBlocks(client, {
 *   blocks: [{
 *     calls: [
 *       Actions.token.transfer.call({
 *         token: '0x20c0...01',
 *         to: '0x...',
 *         amount: parseUnits('100', 6),
 *       }),
 *     ],
 *   }],
 *   traceTransfers: true,
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - {@link simulateBlocks.Parameters}
 * @returns Simulated blocks and token metadata. {@link simulateBlocks.ReturnType}
 */
export declare function simulateBlocks<chain extends Chain | undefined, const calls extends readonly unknown[]>(client: Client<Transport, chain>, parameters: simulateBlocks.Parameters<calls>): Promise<simulateBlocks.ReturnType<calls>>;
export declare namespace simulateBlocks {
    type Parameters<calls extends readonly unknown[] = readonly unknown[]> = {
        /** Blocks to simulate. */
        blocks: readonly {
            /** Block overrides. */
            blockOverrides?: BlockOverrides.BlockOverrides | undefined;
            /** Calls to execute. */
            calls: Calls<Narrow<calls>, CallExtraProperties>;
            /** State overrides. */
            stateOverrides?: StateOverride | undefined;
        }[];
        /** Whether to return the full transactions. */
        returnFullTransactions?: boolean | undefined;
        /** Whether to trace transfers. */
        traceTransfers?: boolean | undefined;
        /** Whether to enable validation mode. */
        validation?: boolean | undefined;
    } & ({
        /** The balance of the account at a block number. */
        blockNumber?: bigint | undefined;
        blockTag?: undefined;
    } | {
        blockNumber?: undefined;
        /**
         * The balance of the account at a block tag.
         * @default 'latest'
         */
        blockTag?: BlockTag | undefined;
    });
    type ReturnType<calls extends readonly unknown[] = readonly unknown[]> = {
        blocks: readonly (Block & {
            calls: MulticallResults<Narrow<calls>, true, {
                extraProperties: {
                    data: Hex;
                    gasUsed: bigint;
                    logs?: Log[] | undefined;
                };
                error: Error;
                mutability: AbiStateMutability;
            }>;
        })[];
        tokenMetadata: TokenMetadata;
    };
    type ErrorType = AssertRequestErrorType | DecodeFunctionResultErrorType | EncodeFunctionDataErrorType | FormatBlockErrorType | FormatTransactionRequestErrorType | GetNodeErrorReturnType | ParseAccountErrorType | SerializeStateOverrideErrorType | NumberToHexErrorType | ErrorType_;
}
/**
 * Simulates execution of a batch of calls via `tempo_simulateV1`.
 *
 * A convenience wrapper around {@link simulateBlocks} that runs all
 * calls in a single block and returns flattened results.
 *
 * @example
 * ```ts
 * import { createClient, http, parseUnits } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions, Addresses } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: '0x...',
 *   chain: tempo,
 *   transport: http(),
 * })
 *
 * const { results, tokenMetadata } = await Actions.simulate.simulateCalls(client, {
 *   calls: [
 *     Actions.token.approve.call({
 *       token: '0x20c0...01',
 *       spender: Addresses.stablecoinDex,
 *       amount: parseUnits('100', 6),
 *     }),
 *     Actions.dex.buy.call({
 *       tokenIn: '0x20c0...01',
 *       tokenOut: '0x20c0...02',
 *       amountOut: parseUnits('10', 6),
 *       maxAmountIn: parseUnits('100', 6),
 *     }),
 *     Actions.token.transfer.call({
 *       token: '0x20c0...02',
 *       to: '0x...',
 *       amount: parseUnits('10', 6),
 *     }),
 *   ],
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - {@link simulateCalls.Parameters}
 * @returns Results, block, and token metadata. {@link simulateCalls.ReturnType}
 */
export declare function simulateCalls<const calls extends readonly unknown[], chain extends Chain | undefined, account extends Account | Address | undefined = undefined>(client: Client<Transport, chain>, parameters: simulateCalls.Parameters<calls, account>): Promise<simulateCalls.ReturnType<calls>>;
export declare namespace simulateCalls {
    type Parameters<calls extends readonly unknown[] = readonly unknown[], account extends Account | Address | undefined = Account | Address | undefined> = Omit<simulateBlocks.Parameters, 'blocks' | 'returnFullTransactions'> & {
        /** Account attached to the calls (msg.sender). */
        account?: account | undefined;
        /** Calls to simulate. */
        calls: Calls<Narrow<calls>>;
        /** State overrides. */
        stateOverrides?: StateOverride | undefined;
    };
    type ReturnType<calls extends readonly unknown[] = readonly unknown[]> = {
        /** Block results. */
        block: Block;
        /** Call results. */
        results: MulticallResults<Narrow<calls>, true, {
            extraProperties: {
                data: Hex;
                gasUsed: bigint;
                logs?: Log[] | undefined;
            };
            error: Error;
            mutability: AbiStateMutability;
        }>;
        /** Token metadata resolved from the simulation. */
        tokenMetadata: TokenMetadata;
    };
    type ErrorType = simulateBlocks.ErrorType | ErrorType_;
}
export {};
//# sourceMappingURL=simulate.d.ts.map