import * as Bytes from 'ox/Bytes';
import * as Hex from 'ox/Hex';
import * as PublicKey from 'ox/PublicKey';
import * as Secp256k1 from 'ox/Secp256k1';
import { TokenId, ZoneId, ZoneRpcAuthentication } from 'ox/tempo';
import { parseAccount } from '../../accounts/utils/parseAccount.js';
import { readContract } from '../../actions/public/readContract.js';
import { sendTransaction, } from '../../actions/wallet/sendTransaction.js';
import { sendTransactionSync } from '../../actions/wallet/sendTransactionSync.js';
import { zeroHash } from '../../constants/bytes.js';
import * as Abis from '../Abis.js';
import * as Addresses from '../Addresses.js';
import { defineCall } from '../internal/utils.js';
import * as Storage from '../Storage.js';
import * as ZoneAbis from '../zones/Abis.js';
import { getPortalAddress } from '../zones/zone.js';
/**
 * Deposits tokens into a zone on the parent Tempo chain.
 * Batches approve and deposit into a single transaction.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { tempoModerato } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempoModerato,
 *   transport: http(),
 * })
 *
 * const hash = await Actions.zone.deposit(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   zoneId: 7,
 * })
 * ```
 *
 * @param client - Wallet client connected to the parent Tempo chain.
 * @param parameters - Deposit parameters.
 * @returns The transaction hash.
 */
export async function deposit(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const args = { ...parameters, chainId, recipient };
    return sendTransaction(client, {
        ...rest,
        calls: deposit.calls(args),
    });
}
(function (deposit) {
    /**
     * Defines the calls to approve and deposit tokens into a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args) {
        const { amount, chainId, memo = zeroHash, recipient, token, zoneId } = args;
        const portalAddress = getPortalAddress(chainId, zoneId);
        return [
            defineCall({
                address: TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [portalAddress, amount],
            }),
            defineCall({
                address: portalAddress,
                abi: ZoneAbis.zonePortal,
                functionName: 'deposit',
                args: [TokenId.toAddress(token), recipient, amount, memo],
            }),
        ];
    }
    deposit.calls = calls;
})(deposit || (deposit = {}));
/**
 * Deposits tokens into a zone on the parent Tempo chain and waits for the
 * transaction receipt.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { tempoModerato } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempoModerato,
 *   transport: http(),
 * })
 *
 * const result = await Actions.zone.depositSync(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   zoneId: 7,
 * })
 * ```
 *
 * @param client - Wallet client connected to the parent Tempo chain.
 * @param parameters - Deposit parameters.
 * @returns The transaction receipt.
 */
export async function depositSync(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const args = { ...parameters, chainId, recipient };
    const receipt = await sendTransactionSync(client, {
        ...rest,
        throwOnReceiptRevert,
        calls: deposit.calls(args),
    });
    return { receipt };
}
/**
 * Deposits tokens into a zone on the parent Tempo chain with encrypted
 * recipient and memo. Batches approve and depositEncrypted into a single
 * transaction.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { tempoModerato } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempoModerato,
 *   transport: http(),
 * })
 *
 * const hash = await Actions.zone.encryptedDeposit(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   zoneId: 7,
 * })
 * ```
 *
 * @param client - Wallet client connected to the parent Tempo chain.
 * @param parameters - Encrypted deposit parameters.
 * @returns The transaction hash.
 */
export async function encryptedDeposit(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const portalAddress = getPortalAddress(chainId, parameters.zoneId);
    const [publicKey, keyIndex] = await Promise.all([
        readContract(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'sequencerEncryptionKey',
        }),
        readContract(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'encryptionKeyCount',
        }),
    ]);
    if (keyIndex === 0n) {
        throw new Error('No sequencer encryption key configured.');
    }
    const encrypted = await encryptDepositPayload({ x: publicKey[0], yParity: publicKey[1] }, recipient, portalAddress, keyIndex - 1n, parameters.memo);
    const args = {
        ...parameters,
        chainId,
        encrypted,
        keyIndex: keyIndex - 1n,
        recipient,
    };
    return sendTransaction(client, {
        ...rest,
        calls: encryptedDeposit.calls(args),
    });
}
(function (encryptedDeposit) {
    /**
     * Defines the calls to approve and deposit tokens into a zone (encrypted).
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args) {
        const { amount, chainId, encrypted, keyIndex, token, zoneId } = args;
        const portalAddress = getPortalAddress(chainId, zoneId);
        return [
            defineCall({
                address: TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [portalAddress, amount],
            }),
            defineCall({
                address: portalAddress,
                abi: ZoneAbis.zonePortal,
                functionName: 'depositEncrypted',
                args: [
                    TokenId.toAddress(token),
                    amount,
                    keyIndex,
                    {
                        ephemeralPubkeyX: encrypted.ephemeralPubkeyX,
                        ephemeralPubkeyYParity: encrypted.ephemeralPubkeyYParity,
                        ciphertext: encrypted.ciphertext,
                        nonce: encrypted.nonce,
                        tag: encrypted.tag,
                    },
                ],
            }),
        ];
    }
    encryptedDeposit.calls = calls;
})(encryptedDeposit || (encryptedDeposit = {}));
/**
 * Deposits tokens into a zone on the parent Tempo chain with encrypted
 * recipient and memo, and waits for the transaction receipt.
 *
 * @example
 * ```ts
 * import { createClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { tempoModerato } from 'viem/chains'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: tempoModerato,
 *   transport: http(),
 * })
 *
 * const result = await Actions.zone.encryptedDepositSync(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   zoneId: 7,
 * })
 * ```
 *
 * @param client - Wallet client connected to the parent Tempo chain.
 * @param parameters - Encrypted deposit parameters.
 * @returns The transaction receipt.
 */
export async function encryptedDepositSync(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const portalAddress = getPortalAddress(chainId, parameters.zoneId);
    const [publicKey, keyIndex] = await Promise.all([
        readContract(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'sequencerEncryptionKey',
        }),
        readContract(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'encryptionKeyCount',
        }),
    ]);
    if (keyIndex === 0n) {
        throw new Error('No sequencer encryption key configured.');
    }
    const encrypted = await encryptDepositPayload({ x: publicKey[0], yParity: publicKey[1] }, recipient, portalAddress, keyIndex - 1n, parameters.memo);
    const args = {
        ...parameters,
        chainId,
        encrypted,
        keyIndex: keyIndex - 1n,
        recipient,
    };
    const receipt = await sendTransactionSync(client, {
        ...rest,
        throwOnReceiptRevert,
        calls: encryptedDeposit.calls(args),
    });
    return { receipt };
}
/**
 * Returns the authenticated account address and authorization token expiry.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const info = await Actions.zone.getAuthorizationTokenInfo(client)
 * ```
 *
 * @param client - Zone client.
 * @returns Authorization token info.
 */
export async function getAuthorizationTokenInfo(client) {
    const info = await client.request({
        method: 'zone_getAuthorizationTokenInfo',
        params: [],
    });
    return {
        account: info.account,
        expiresAt: Hex.toBigInt(info.expiresAt),
    };
}
/**
 * Returns deposit processing status for a given Tempo block number.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const status = await Actions.zone.getDepositStatus(client, {
 *   tempoBlockNumber: 42n,
 * })
 * ```
 *
 * @param client - Zone client.
 * @param parameters - Parameters including the Tempo block number.
 * @returns Deposit status.
 */
export async function getDepositStatus(client, parameters) {
    const { tempoBlockNumber } = parameters;
    const status = await client.request({
        method: 'zone_getDepositStatus',
        params: [Hex.fromNumber(tempoBlockNumber)],
    });
    return {
        deposits: status.deposits.map((deposit) => ({
            amount: Hex.toBigInt(deposit.amount),
            depositHash: deposit.depositHash,
            kind: deposit.kind,
            memo: deposit.memo,
            recipient: deposit.recipient,
            sender: deposit.sender,
            status: deposit.status,
            token: deposit.token,
        })),
        processed: status.processed,
        tempoBlockNumber: Hex.toBigInt(status.tempoBlockNumber),
        zoneProcessedThrough: Hex.toBigInt(status.zoneProcessedThrough),
    };
}
/**
 * Returns the fee required for a withdrawal from a zone, given a gas limit.
 *
 * The client must be connected to the **zone chain**.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const fee = await Actions.zone.getWithdrawalFee(client)
 * ```
 *
 * @param client - Zone client.
 * @param parameters - Optional gas limit parameter.
 * @returns The withdrawal fee as a bigint.
 */
export async function getWithdrawalFee(client, parameters = {}) {
    const { gas = 0n, ...rest } = parameters;
    return readContract(client, {
        ...rest,
        address: Addresses.zoneOutbox,
        abi: ZoneAbis.zoneOutbox,
        functionName: 'calculateWithdrawalFee',
        args: [gas],
    });
}
/**
 * Returns the current zone metadata.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const info = await Actions.zone.getZoneInfo(client)
 * ```
 *
 * @param client - Zone client.
 * @returns Zone metadata.
 */
export async function getZoneInfo(client) {
    const info = await client.request({
        method: 'zone_getZoneInfo',
        params: [],
    });
    return {
        chainId: Hex.toNumber(info.chainId),
        sequencer: info.sequencer,
        zoneId: Hex.toNumber(info.zoneId),
        zoneTokens: info.zoneTokens,
    };
}
/**
 * Requests a withdrawal from a zone to the parent Tempo chain via the
 * ZoneOutbox contract.
 *
 * The client must be connected to the **zone chain**.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const hash = await Actions.zone.requestWithdrawal(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 * })
 * ```
 *
 * @param client - Wallet client connected to the zone chain.
 * @param parameters - Withdrawal parameters.
 * @returns The transaction hash.
 */
export async function requestWithdrawal(client, parameters) {
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    return sendTransaction(client, {
        ...rest,
        calls: requestWithdrawal.calls(args),
    });
}
(function (requestWithdrawal) {
    /**
     * Defines the calls to approve and request a withdrawal from a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args) {
        const { amount, data = '0x', fallbackRecipient = args.to, gas = 0n, memo = zeroHash, to, token, } = args;
        return [
            defineCall({
                address: TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [Addresses.zoneOutbox, amount],
            }),
            defineCall({
                address: Addresses.zoneOutbox,
                abi: ZoneAbis.zoneOutbox,
                functionName: 'requestWithdrawal',
                args: [
                    TokenId.toAddress(token),
                    to,
                    amount,
                    memo,
                    gas,
                    fallbackRecipient,
                    data,
                    '0x',
                ],
            }),
        ];
    }
    requestWithdrawal.calls = calls;
})(requestWithdrawal || (requestWithdrawal = {}));
/**
 * Requests a withdrawal from a zone to the parent Tempo chain and waits for
 * the transaction receipt.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const result = await Actions.zone.requestWithdrawalSync(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 * })
 * ```
 *
 * @param client - Wallet client connected to the zone chain.
 * @param parameters - Withdrawal parameters.
 * @returns The transaction receipt.
 */
export async function requestWithdrawalSync(client, parameters) {
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    const receipt = await sendTransactionSync(client, {
        ...rest,
        calls: requestWithdrawal.calls(args),
        throwOnReceiptRevert,
    });
    return { receipt };
}
/**
 * Requests a verifiable withdrawal from a zone to the parent Tempo chain via
 * the ZoneOutbox contract. Includes a `revealTo` public key so the sequencer
 * can encrypt the withdrawal details.
 *
 * The client must be connected to the **zone chain**.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const hash = await Actions.zone.requestVerifiableWithdrawal(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   revealTo: '0x02abc...def',
 * })
 * ```
 *
 * @param client - Wallet client connected to the zone chain.
 * @param parameters - Verifiable withdrawal parameters.
 * @returns The transaction hash.
 */
export async function requestVerifiableWithdrawal(client, parameters) {
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    return sendTransaction(client, {
        ...rest,
        calls: requestVerifiableWithdrawal.calls(args),
    });
}
(function (requestVerifiableWithdrawal) {
    /**
     * Defines the calls to approve and request a verifiable withdrawal from a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args) {
        const { amount, data = '0x', fallbackRecipient = args.to, gas = 0n, memo = zeroHash, revealTo, to, token, } = args;
        return [
            defineCall({
                address: TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [Addresses.zoneOutbox, amount],
            }),
            defineCall({
                address: Addresses.zoneOutbox,
                abi: ZoneAbis.zoneOutbox,
                functionName: 'requestWithdrawal',
                args: [
                    TokenId.toAddress(token),
                    to,
                    amount,
                    memo,
                    gas,
                    fallbackRecipient,
                    data,
                    revealTo,
                ],
            }),
        ];
    }
    requestVerifiableWithdrawal.calls = calls;
})(requestVerifiableWithdrawal || (requestVerifiableWithdrawal = {}));
/**
 * Requests a verifiable withdrawal from a zone to the parent Tempo chain and
 * waits for the transaction receipt.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const result = await Actions.zone.requestVerifiableWithdrawalSync(client, {
 *   token: '0x20c0...0001',
 *   amount: 1_000_000n,
 *   revealTo: '0x02abc...def',
 * })
 * ```
 *
 * @param client - Wallet client connected to the zone chain.
 * @param parameters - Verifiable withdrawal parameters.
 * @returns The transaction receipt.
 */
export async function requestVerifiableWithdrawalSync(client, parameters) {
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? parseAccount(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    const receipt = await sendTransactionSync(client, {
        ...rest,
        calls: requestVerifiableWithdrawal.calls(args),
        throwOnReceiptRevert,
    });
    return { receipt };
}
/**
 * Signs a zone authorization token and stores it for the zone HTTP transport.
 *
 * Zone chains should define `contracts.zonePortal` with the portal address.
 * The `zoneId` is derived from `ZoneId.fromChainId(chain.id)` and can be overridden.
 *
 * @example
 * ```ts
 * import { createClient } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { http, zoneModerato } from 'viem/tempo/zones'
 * import { Actions } from 'viem/tempo'
 *
 * const client = createClient({
 *   account: privateKeyToAccount('0x...'),
 *   chain: zoneModerato(7),
 *   transport: http(),
 * })
 *
 * const result = await Actions.zone.signAuthorizationToken(client)
 * ```
 *
 * @param client - Zone wallet client.
 * @param parameters - Options including optional storage override.
 * @returns The authentication object and serialized token.
 */
export async function signAuthorizationToken(client, parameters = {}) {
    const { account = client.account, issuedAt = Math.floor(Date.now() / 1000), expiresAt = issuedAt + 86_400, storage = Storage.defaultStorage(), } = parameters;
    const chain = parameters.chain ?? client.chain;
    if (!chain)
        throw new Error('`signAuthorizationToken` requires a chain.');
    const account_ = account ? parseAccount(account) : undefined;
    if (!account_ || !account_.sign)
        throw new Error('`account` with `sign` is required.');
    const storageKey = `auth:${account_.address.toLowerCase()}:${chain.id}`;
    const authentication = ZoneRpcAuthentication.from({
        chainId: chain.id,
        expiresAt,
        issuedAt,
        zoneId: ZoneId.fromChainId(chain.id),
    });
    const payload = ZoneRpcAuthentication.getSignPayload(authentication);
    const signature = await account_.sign({ hash: payload });
    const token = ZoneRpcAuthentication.serialize(authentication, {
        signature,
    });
    await storage.setItem(storageKey, token);
    await storage.setItem(`auth:token:${chain.id}`, token);
    return { authentication, token };
}
/**
 * Encrypts a deposit payload (recipient + memo) using ECIES with AES-256-GCM.
 *
 * @internal
 */
async function encryptDepositPayload(publicKey, recipient, portalAddress, keyIndex, memo = zeroHash) {
    const sequencerPublicKey = PublicKey.from({
        prefix: publicKey.yParity,
        x: Hex.toBigInt(publicKey.x),
    });
    const { privateKey: ephemeralPrivateKey, publicKey: ephemeralPublicKey } = Secp256k1.createKeyPair();
    const compressedEphemeral = PublicKey.compress(ephemeralPublicKey);
    const sharedSecret = Secp256k1.getSharedSecret({
        privateKey: ephemeralPrivateKey,
        publicKey: sequencerPublicKey,
        as: 'Bytes',
    });
    const hkdfKey = await globalThis.crypto.subtle.importKey('raw', sharedSecret.slice(1), 'HKDF', false, ['deriveKey']);
    const aesKey = await globalThis.crypto.subtle.deriveKey({
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode('ecies-aes-key'),
        info: buildDepositHkdfInfo(portalAddress, keyIndex, Hex.fromNumber(compressedEphemeral.x, { size: 32 })),
    }, hkdfKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const nonce = Bytes.random(12);
    const plaintext = buildDepositPlaintext(recipient, memo);
    const ciphertextWithTag = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, Bytes.from(plaintext)));
    const ciphertext = ciphertextWithTag.slice(0, -16);
    const tag = ciphertextWithTag.slice(-16);
    return {
        ciphertext: Hex.fromBytes(ciphertext),
        ephemeralPubkeyX: Hex.fromNumber(compressedEphemeral.x, { size: 32 }),
        ephemeralPubkeyYParity: compressedEphemeral.prefix,
        nonce: Hex.fromBytes(nonce),
        tag: Hex.fromBytes(tag),
    };
}
function buildDepositPlaintext(recipient, memo) {
    return Bytes.concat(Bytes.from(recipient), Bytes.from(memo), new Uint8Array(12));
}
function buildDepositHkdfInfo(portalAddress, keyIndex, ephemeralPubkeyX) {
    return Bytes.concat(Bytes.from(portalAddress), Bytes.fromNumber(keyIndex, { size: 32 }), Bytes.from(ephemeralPubkeyX));
}
//# sourceMappingURL=zone.js.map