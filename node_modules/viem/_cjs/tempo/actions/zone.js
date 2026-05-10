"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = deposit;
exports.depositSync = depositSync;
exports.encryptedDeposit = encryptedDeposit;
exports.encryptedDepositSync = encryptedDepositSync;
exports.getAuthorizationTokenInfo = getAuthorizationTokenInfo;
exports.getDepositStatus = getDepositStatus;
exports.getWithdrawalFee = getWithdrawalFee;
exports.getZoneInfo = getZoneInfo;
exports.requestWithdrawal = requestWithdrawal;
exports.requestWithdrawalSync = requestWithdrawalSync;
exports.requestVerifiableWithdrawal = requestVerifiableWithdrawal;
exports.requestVerifiableWithdrawalSync = requestVerifiableWithdrawalSync;
exports.signAuthorizationToken = signAuthorizationToken;
const Bytes = require("ox/Bytes");
const Hex = require("ox/Hex");
const PublicKey = require("ox/PublicKey");
const Secp256k1 = require("ox/Secp256k1");
const tempo_1 = require("ox/tempo");
const parseAccount_js_1 = require("../../accounts/utils/parseAccount.js");
const readContract_js_1 = require("../../actions/public/readContract.js");
const sendTransaction_js_1 = require("../../actions/wallet/sendTransaction.js");
const sendTransactionSync_js_1 = require("../../actions/wallet/sendTransactionSync.js");
const bytes_js_1 = require("../../constants/bytes.js");
const Abis = require("../Abis.js");
const Addresses = require("../Addresses.js");
const utils_js_1 = require("../internal/utils.js");
const Storage = require("../Storage.js");
const ZoneAbis = require("../zones/Abis.js");
const zone_js_1 = require("../zones/zone.js");
async function deposit(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const args = { ...parameters, chainId, recipient };
    return (0, sendTransaction_js_1.sendTransaction)(client, {
        ...rest,
        calls: deposit.calls(args),
    });
}
(function (deposit) {
    function calls(args) {
        const { amount, chainId, memo = bytes_js_1.zeroHash, recipient, token, zoneId } = args;
        const portalAddress = (0, zone_js_1.getPortalAddress)(chainId, zoneId);
        return [
            (0, utils_js_1.defineCall)({
                address: tempo_1.TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [portalAddress, amount],
            }),
            (0, utils_js_1.defineCall)({
                address: portalAddress,
                abi: ZoneAbis.zonePortal,
                functionName: 'deposit',
                args: [tempo_1.TokenId.toAddress(token), recipient, amount, memo],
            }),
        ];
    }
    deposit.calls = calls;
})(deposit || (exports.deposit = deposit = {}));
async function depositSync(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const args = { ...parameters, chainId, recipient };
    const receipt = await (0, sendTransactionSync_js_1.sendTransactionSync)(client, {
        ...rest,
        throwOnReceiptRevert,
        calls: deposit.calls(args),
    });
    return { receipt };
}
async function encryptedDeposit(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const portalAddress = (0, zone_js_1.getPortalAddress)(chainId, parameters.zoneId);
    const [publicKey, keyIndex] = await Promise.all([
        (0, readContract_js_1.readContract)(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'sequencerEncryptionKey',
        }),
        (0, readContract_js_1.readContract)(client, {
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
    return (0, sendTransaction_js_1.sendTransaction)(client, {
        ...rest,
        calls: encryptedDeposit.calls(args),
    });
}
(function (encryptedDeposit) {
    function calls(args) {
        const { amount, chainId, encrypted, keyIndex, token, zoneId } = args;
        const portalAddress = (0, zone_js_1.getPortalAddress)(chainId, zoneId);
        return [
            (0, utils_js_1.defineCall)({
                address: tempo_1.TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [portalAddress, amount],
            }),
            (0, utils_js_1.defineCall)({
                address: portalAddress,
                abi: ZoneAbis.zonePortal,
                functionName: 'depositEncrypted',
                args: [
                    tempo_1.TokenId.toAddress(token),
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
})(encryptedDeposit || (exports.encryptedDeposit = encryptedDeposit = {}));
async function encryptedDepositSync(client, parameters) {
    const chainId = client.chain?.id;
    if (!chainId)
        throw new Error('`chain` is required.');
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const recipient = parameters.recipient ?? account_?.address;
    if (!recipient)
        throw new Error('`recipient` is required.');
    const portalAddress = (0, zone_js_1.getPortalAddress)(chainId, parameters.zoneId);
    const [publicKey, keyIndex] = await Promise.all([
        (0, readContract_js_1.readContract)(client, {
            address: portalAddress,
            abi: ZoneAbis.zonePortal,
            functionName: 'sequencerEncryptionKey',
        }),
        (0, readContract_js_1.readContract)(client, {
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
    const receipt = await (0, sendTransactionSync_js_1.sendTransactionSync)(client, {
        ...rest,
        throwOnReceiptRevert,
        calls: encryptedDeposit.calls(args),
    });
    return { receipt };
}
async function getAuthorizationTokenInfo(client) {
    const info = await client.request({
        method: 'zone_getAuthorizationTokenInfo',
        params: [],
    });
    return {
        account: info.account,
        expiresAt: Hex.toBigInt(info.expiresAt),
    };
}
async function getDepositStatus(client, parameters) {
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
async function getWithdrawalFee(client, parameters = {}) {
    const { gas = 0n, ...rest } = parameters;
    return (0, readContract_js_1.readContract)(client, {
        ...rest,
        address: Addresses.zoneOutbox,
        abi: ZoneAbis.zoneOutbox,
        functionName: 'calculateWithdrawalFee',
        args: [gas],
    });
}
async function getZoneInfo(client) {
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
async function requestWithdrawal(client, parameters) {
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    return (0, sendTransaction_js_1.sendTransaction)(client, {
        ...rest,
        calls: requestWithdrawal.calls(args),
    });
}
(function (requestWithdrawal) {
    function calls(args) {
        const { amount, data = '0x', fallbackRecipient = args.to, gas = 0n, memo = bytes_js_1.zeroHash, to, token, } = args;
        return [
            (0, utils_js_1.defineCall)({
                address: tempo_1.TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [Addresses.zoneOutbox, amount],
            }),
            (0, utils_js_1.defineCall)({
                address: Addresses.zoneOutbox,
                abi: ZoneAbis.zoneOutbox,
                functionName: 'requestWithdrawal',
                args: [
                    tempo_1.TokenId.toAddress(token),
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
})(requestWithdrawal || (exports.requestWithdrawal = requestWithdrawal = {}));
async function requestWithdrawalSync(client, parameters) {
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    const receipt = await (0, sendTransactionSync_js_1.sendTransactionSync)(client, {
        ...rest,
        calls: requestWithdrawal.calls(args),
        throwOnReceiptRevert,
    });
    return { receipt };
}
async function requestVerifiableWithdrawal(client, parameters) {
    const { account = client.account, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    return (0, sendTransaction_js_1.sendTransaction)(client, {
        ...rest,
        calls: requestVerifiableWithdrawal.calls(args),
    });
}
(function (requestVerifiableWithdrawal) {
    function calls(args) {
        const { amount, data = '0x', fallbackRecipient = args.to, gas = 0n, memo = bytes_js_1.zeroHash, revealTo, to, token, } = args;
        return [
            (0, utils_js_1.defineCall)({
                address: tempo_1.TokenId.toAddress(token),
                abi: Abis.tip20,
                functionName: 'approve',
                args: [Addresses.zoneOutbox, amount],
            }),
            (0, utils_js_1.defineCall)({
                address: Addresses.zoneOutbox,
                abi: ZoneAbis.zoneOutbox,
                functionName: 'requestWithdrawal',
                args: [
                    tempo_1.TokenId.toAddress(token),
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
})(requestVerifiableWithdrawal || (exports.requestVerifiableWithdrawal = requestVerifiableWithdrawal = {}));
async function requestVerifiableWithdrawalSync(client, parameters) {
    const { account = client.account, throwOnReceiptRevert = true, ...rest } = parameters;
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account)
        throw new Error('`account` is required.');
    const to = parameters.to ?? account_?.address;
    if (!to)
        throw new Error('`to` is required.');
    const args = { ...parameters, to };
    const receipt = await (0, sendTransactionSync_js_1.sendTransactionSync)(client, {
        ...rest,
        calls: requestVerifiableWithdrawal.calls(args),
        throwOnReceiptRevert,
    });
    return { receipt };
}
async function signAuthorizationToken(client, parameters = {}) {
    const { account = client.account, issuedAt = Math.floor(Date.now() / 1000), expiresAt = issuedAt + 86_400, storage = Storage.defaultStorage(), } = parameters;
    const chain = parameters.chain ?? client.chain;
    if (!chain)
        throw new Error('`signAuthorizationToken` requires a chain.');
    const account_ = account ? (0, parseAccount_js_1.parseAccount)(account) : undefined;
    if (!account_ || !account_.sign)
        throw new Error('`account` with `sign` is required.');
    const storageKey = `auth:${account_.address.toLowerCase()}:${chain.id}`;
    const authentication = tempo_1.ZoneRpcAuthentication.from({
        chainId: chain.id,
        expiresAt,
        issuedAt,
        zoneId: tempo_1.ZoneId.fromChainId(chain.id),
    });
    const payload = tempo_1.ZoneRpcAuthentication.getSignPayload(authentication);
    const signature = await account_.sign({ hash: payload });
    const token = tempo_1.ZoneRpcAuthentication.serialize(authentication, {
        signature,
    });
    await storage.setItem(storageKey, token);
    await storage.setItem(`auth:token:${chain.id}`, token);
    return { authentication, token };
}
async function encryptDepositPayload(publicKey, recipient, portalAddress, keyIndex, memo = bytes_js_1.zeroHash) {
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