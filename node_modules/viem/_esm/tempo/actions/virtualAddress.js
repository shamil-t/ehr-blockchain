import * as Hex from 'ox/Hex';
import { readContract } from '../../actions/public/readContract.js';
import { writeContract } from '../../actions/wallet/writeContract.js';
import { writeContractSync } from '../../actions/wallet/writeContractSync.js';
import { zeroAddress } from '../../constants/address.js';
import { parseEventLogs } from '../../utils/abi/parseEventLogs.js';
import * as Abis from '../Abis.js';
import * as Addresses from '../Addresses.js';
import { defineCall } from '../internal/utils.js';
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
export async function getMasterAddress(client, parameters) {
    const address = await readContract(client, {
        ...parameters,
        ...getMasterAddress.call({ masterId: parameters.masterId }),
    });
    if (address === zeroAddress)
        return null;
    return address;
}
(function (getMasterAddress) {
    /**
     * Defines a call to the `getMaster` function.
     *
     * @param args - Arguments.
     * @returns The call.
     */
    function call(args) {
        const { masterId } = args;
        return defineCall({
            address: Addresses.addressRegistry,
            abi: Abis.addressRegistry,
            args: [masterId],
            functionName: 'getMaster',
        });
    }
    getMasterAddress.call = call;
})(getMasterAddress || (getMasterAddress = {}));
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
export async function resolve(client, parameters) {
    if (!isVirtual(parameters.address))
        return parameters.address;
    const masterId = Hex.slice(parameters.address, 0, 4);
    return getMasterAddress(client, { ...parameters, masterId });
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
export async function registerMaster(client, parameters) {
    return registerMaster.inner(writeContract, client, parameters);
}
(function (registerMaster) {
    /** @internal */
    async function inner(action, client, parameters) {
        const { salt, ...rest } = parameters;
        const call = registerMaster.call({ salt });
        return (await action(client, {
            ...rest,
            ...call,
        }));
    }
    registerMaster.inner = inner;
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
    function call(args) {
        const { salt } = args;
        return defineCall({
            address: Addresses.addressRegistry,
            abi: Abis.addressRegistry,
            functionName: 'registerVirtualMaster',
            args: [salt],
        });
    }
    registerMaster.call = call;
    function extractEvent(logs) {
        const [log] = parseEventLogs({
            abi: Abis.addressRegistry,
            logs,
            eventName: 'MasterRegistered',
            strict: true,
        });
        if (!log)
            throw new Error('`MasterRegistered` event not found.');
        return log;
    }
    registerMaster.extractEvent = extractEvent;
})(registerMaster || (registerMaster = {}));
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
export async function registerMasterSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await registerMaster.inner(writeContractSync, client, {
        ...rest,
        throwOnReceiptRevert,
    });
    const { args } = registerMaster.extractEvent(receipt.logs);
    return {
        ...args,
        receipt,
    };
}
const virtualMagic = '0xfdfdfdfdfdfdfdfdfdfd';
/** @internal */
function isVirtual(address) {
    return Hex.slice(address, 4, 14).toLowerCase() === virtualMagic;
}
//# sourceMappingURL=virtualAddress.js.map