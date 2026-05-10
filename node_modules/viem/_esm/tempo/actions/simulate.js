import * as BlockOverrides from 'ox/BlockOverrides';
import { parseAccount, } from '../../accounts/utils/parseAccount.js';
import { AbiDecodingZeroDataError } from '../../errors/abi.js';
import { RawContractError } from '../../errors/contract.js';
import { UnknownNodeError } from '../../errors/node.js';
import { decodeFunctionResult, } from '../../utils/abi/decodeFunctionResult.js';
import { encodeFunctionData, } from '../../utils/abi/encodeFunctionData.js';
import { concat } from '../../utils/data/concat.js';
import { numberToHex, } from '../../utils/encoding/toHex.js';
import { getContractError } from '../../utils/errors/getContractError.js';
import { getNodeError, } from '../../utils/errors/getNodeError.js';
import { formatBlock, } from '../../utils/formatters/block.js';
import { formatLog } from '../../utils/formatters/log.js';
import { formatTransactionRequest, } from '../../utils/formatters/transactionRequest.js';
import { serializeStateOverride, } from '../../utils/stateOverride.js';
import { assertRequest, } from '../../utils/transaction/assertRequest.js';
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
export async function simulateBlocks(client, parameters) {
    const { blockNumber, blockTag = client.experimental_blockTag ?? 'latest', blocks, returnFullTransactions, traceTransfers, validation, } = parameters;
    try {
        const blockStateCalls = [];
        for (const block of blocks) {
            const blockOverrides = block.blockOverrides
                ? BlockOverrides.toRpc(block.blockOverrides)
                : undefined;
            const calls = block.calls.map((call_) => {
                const call = call_;
                const account = call.account
                    ? parseAccount(call.account)
                    : client.account
                        ? parseAccount(client.account)
                        : undefined;
                const data = call.abi ? encodeFunctionData(call) : call.data;
                const request = {
                    ...call,
                    account,
                    data: call.dataSuffix
                        ? concat([data || '0x', call.dataSuffix])
                        : data,
                    from: call.from ?? account?.address,
                };
                assertRequest(request);
                return formatTransactionRequest(request);
            });
            const stateOverrides = block.stateOverrides
                ? serializeStateOverride(block.stateOverrides)
                : undefined;
            blockStateCalls.push({
                blockOverrides,
                calls,
                stateOverrides,
            });
        }
        const blockNumberHex = typeof blockNumber === 'bigint' ? numberToHex(blockNumber) : undefined;
        const block = blockNumberHex || blockTag;
        const result = await client.request({
            method: 'tempo_simulateV1',
            params: [
                {
                    blockStateCalls,
                    returnFullTransactions,
                    traceTransfers,
                    validation,
                },
                block,
            ],
        });
        return {
            blocks: result.blocks.map((block, i) => ({
                ...formatBlock(block),
                calls: block.calls?.map((call, j) => {
                    const { abi, args, functionName, to } = blocks[i].calls[j];
                    const data = call.error?.data ?? call.returnData;
                    const gasUsed = BigInt(call.gasUsed);
                    const logs = call.logs?.map((log) => formatLog(log));
                    const status = call.status === '0x1' ? 'success' : 'failure';
                    const result = abi && status === 'success' && data !== '0x'
                        ? decodeFunctionResult({
                            abi,
                            data,
                            functionName,
                        })
                        : null;
                    const error = (() => {
                        if (status === 'success')
                            return undefined;
                        let error;
                        if (data === '0x')
                            error = new AbiDecodingZeroDataError();
                        else if (data)
                            error = new RawContractError({ data });
                        if (!error)
                            return undefined;
                        return getContractError(error, {
                            abi: (abi ?? []),
                            address: to ?? '0x',
                            args,
                            functionName: functionName ?? '<unknown>',
                        });
                    })();
                    return {
                        data,
                        gasUsed,
                        logs,
                        status,
                        ...(status === 'success'
                            ? {
                                result,
                            }
                            : {
                                error,
                            }),
                    };
                }),
            })),
            tokenMetadata: result.tokenMetadata ?? {},
        };
    }
    catch (e) {
        const cause = e;
        const error = getNodeError(cause, {});
        if (error instanceof UnknownNodeError)
            throw cause;
        throw error;
    }
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
export async function simulateCalls(client, parameters) {
    const { blockNumber, blockTag, calls, stateOverrides, traceTransfers, validation, } = parameters;
    const account = parameters.account
        ? parseAccount(parameters.account)
        : undefined;
    const result = await simulateBlocks(client, {
        blockNumber,
        blockTag: blockTag,
        blocks: [
            {
                calls: calls.map((call) => ({
                    ...call,
                    from: account?.address,
                })),
                stateOverrides,
            },
        ],
        traceTransfers,
        validation,
    });
    const { calls: block_calls, ...block } = result.blocks[0];
    return {
        block,
        results: block_calls,
        tokenMetadata: result.tokenMetadata,
    };
}
//# sourceMappingURL=simulate.js.map