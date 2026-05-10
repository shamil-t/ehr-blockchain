import type { Address } from 'abitype';
import * as Hex from 'ox/Hex';
import type { Account } from '../../accounts/types.js';
import type { WriteContractReturnType } from '../../actions/wallet/writeContract.js';
import { writeContract } from '../../actions/wallet/writeContract.js';
import { writeContractSync } from '../../actions/wallet/writeContractSync.js';
import type { Client } from '../../clients/createClient.js';
import type { Transport } from '../../clients/transports/createTransport.js';
import type { BaseErrorType } from '../../errors/base.js';
import type { Chain } from '../../types/chain.js';
import type { GetEventArgs } from '../../types/contract.js';
import type { Compute } from '../../types/utils.js';
import * as Abis from '../Abis.js';
import type { ReadParameters, WriteParameters } from '../internal/types.js';
import type { TransactionReceipt } from '../Transaction.js';
/**
 * Gets the master address for a given master ID.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: tempo.extend({ feeToken: '0x20c0000000000000000000000000000000000001' })
 *   transport: http(),
 * })
 *
 * const address = await Actions.virtualAddress.getMasterAddress(client, {
 *   masterId: '0xdeadbeef',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The master address, or null if unregistered.
 */
export declare function getMasterAddress<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: getMasterAddress.Parameters): Promise<getMasterAddress.ReturnValue>;
export declare namespace getMasterAddress {
    type Parameters = ReadParameters & Args;
    type Args = {
        /** The master ID (bytes4). */
        masterId: Hex.Hex;
    };
    type ReturnValue = Address | null;
    type ErrorType = BaseErrorType;
    /**
     * Defines a call to the `getMaster` function.
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args: Args): {
        abi: [{
            readonly name: "getMaster";
            readonly type: "function";
            readonly stateMutability: "view";
            readonly inputs: readonly [{
                readonly type: "bytes4";
                readonly name: "masterId";
            }];
            readonly outputs: readonly [{
                readonly type: "address";
            }];
        }];
        functionName: "getMaster";
    } & {
        args: readonly [`0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
}
/**
 * Resolves a virtual address to its master address.
 *
 * - Non-virtual addresses are returned unchanged.
 * - Virtual addresses with a registered master return the master address.
 * - Virtual addresses with an unregistered master return null.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: tempo.extend({ feeToken: '0x20c0000000000000000000000000000000000001' })
 *   transport: http(),
 * })
 *
 * const recipient = await Actions.virtualAddress.resolve(client, {
 *   address: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The resolved address, or null if virtual and unregistered.
 */
export declare function resolve<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: resolve.Parameters): Promise<resolve.ReturnValue>;
export declare namespace resolve {
    type Parameters = ReadParameters & Args;
    type Args = {
        /** The address to resolve. */
        address: Address;
    };
    type ReturnValue = Address | null;
    type ErrorType = BaseErrorType;
}
/**
 * Registers a virtual master address.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempo.extend({ feeToken: '0x20c0000000000000000000000000000000000001' })
 *   transport: http(),
 * })
 *
 * const hash = await Actions.virtualAddress.registerMaster(client, {
 *   salt: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The transaction hash.
 */
export declare function registerMaster<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: registerMaster.Parameters<chain, account>): Promise<registerMaster.ReturnValue>;
export declare namespace registerMaster {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & Args;
    type Args = {
        /** The salt (bytes32) used for proof-of-work master ID derivation. */
        salt: Hex.Hex;
    };
    type ReturnValue = WriteContractReturnType;
    type ErrorType = BaseErrorType;
    /** @internal */
    function inner<action extends typeof writeContract | typeof writeContractSync, chain extends Chain | undefined, account extends Account | undefined>(action: action, client: Client<Transport, chain, account>, parameters: registerMaster.Parameters<chain, account>): Promise<ReturnType<action>>;
    /**
     * Defines a call to the `registerVirtualMaster` function.
     *
     * Can be passed as a parameter to:
     * - [`estimateContractGas`](https://viem.sh/docs/contract/estimateContractGas): estimate the gas cost of the call
     * - [`simulateContract`](https://viem.sh/docs/contract/simulateContract): simulate the call
     * - [`sendCalls`](https://viem.sh/docs/actions/wallet/sendCalls): send multiple calls
     *
     * @example
     * ```ts
     * import { createClient, http, walletActions } from 'viem'
     * import { tempo } from 'viem/chains'
     * import { Actions } from 'viem/tempo'
     *
     * const client = createClient({
     *   chain: tempo.extend({ feeToken: '0x20c0000000000000000000000000000000000001' })
     *   transport: http(),
     * }).extend(walletActions)
     *
     * const { result } = await client.sendCalls({
     *   calls: [
     *     Actions.virtualAddress.registerMaster.call({
     *       salt: '0x...',
     *     }),
     *   ]
     * })
     * ```
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args: Args): {
        abi: [{
            readonly name: "registerVirtualMaster";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "bytes32";
                readonly name: "salt";
            }];
            readonly outputs: readonly [{
                readonly type: "bytes4";
                readonly name: "masterId";
            }];
        }];
        functionName: "registerVirtualMaster";
    } & {
        args: readonly [salt: `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    };
    function extractEvent(logs: import('../../types/log.js').Log[]): import("../../types/log.js").Log<bigint, number, false, undefined, true, readonly [{
        readonly name: "registerVirtualMaster";
        readonly type: "function";
        readonly stateMutability: "nonpayable";
        readonly inputs: readonly [{
            readonly type: "bytes32";
            readonly name: "salt";
        }];
        readonly outputs: readonly [{
            readonly type: "bytes4";
            readonly name: "masterId";
        }];
    }, {
        readonly name: "getMaster";
        readonly type: "function";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly type: "bytes4";
            readonly name: "masterId";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
        }];
    }, {
        readonly name: "resolveRecipient";
        readonly type: "function";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "to";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
            readonly name: "effectiveRecipient";
        }];
    }, {
        readonly name: "resolveVirtualAddress";
        readonly type: "function";
        readonly stateMutability: "view";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "virtualAddr";
        }];
        readonly outputs: readonly [{
            readonly type: "address";
            readonly name: "master";
        }];
    }, {
        readonly name: "isVirtualAddress";
        readonly type: "function";
        readonly stateMutability: "pure";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "addr";
        }];
        readonly outputs: readonly [{
            readonly type: "bool";
        }];
    }, {
        readonly name: "decodeVirtualAddress";
        readonly type: "function";
        readonly stateMutability: "pure";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "addr";
        }];
        readonly outputs: readonly [{
            readonly type: "bool";
            readonly name: "isVirtual";
        }, {
            readonly type: "bytes4";
            readonly name: "masterId";
        }, {
            readonly type: "bytes6";
            readonly name: "userTag";
        }];
    }, {
        readonly name: "MasterRegistered";
        readonly type: "event";
        readonly inputs: readonly [{
            readonly type: "bytes4";
            readonly name: "masterId";
            readonly indexed: true;
        }, {
            readonly type: "address";
            readonly name: "masterAddress";
            readonly indexed: true;
        }];
    }, {
        readonly name: "MasterIdCollision";
        readonly type: "error";
        readonly inputs: readonly [{
            readonly type: "address";
            readonly name: "master";
        }];
    }, {
        readonly name: "InvalidMasterAddress";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "ProofOfWorkFailed";
        readonly type: "error";
        readonly inputs: readonly [];
    }, {
        readonly name: "VirtualAddressUnregistered";
        readonly type: "error";
        readonly inputs: readonly [];
    }], "MasterRegistered">;
}
/**
 * Registers a virtual master address and waits for confirmation.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { tempo } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempo.extend({ feeToken: '0x20c0000000000000000000000000000000000001' })
 *   transport: http(),
 * })
 *
 * const { receipt, masterId, masterAddress } = await Actions.virtualAddress.registerMasterSync(client, {
 *   salt: '0x...',
 * })
 * ```
 *
 * @param client - Client.
 * @param parameters - Parameters.
 * @returns The transaction receipt and extracted event data.
 */
export declare function registerMasterSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: registerMasterSync.Parameters<chain, account>): Promise<registerMasterSync.ReturnValue>;
export declare namespace registerMasterSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = registerMaster.Parameters<chain, account>;
    type Args = registerMaster.Args;
    type ReturnValue = Compute<GetEventArgs<typeof Abis.addressRegistry, 'MasterRegistered', {
        IndexedOnly: false;
        Required: true;
    }> & {
        receipt: TransactionReceipt;
    }>;
    type ErrorType = BaseErrorType;
}
//# sourceMappingURL=virtualAddress.d.ts.map