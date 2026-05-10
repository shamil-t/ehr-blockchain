import type { Address } from 'abitype';
import * as Hex from 'ox/Hex';
import { TokenId, ZoneRpcAuthentication } from 'ox/tempo';
import type { Account } from '../../accounts/types.js';
import { type SendTransactionReturnType } from '../../actions/wallet/sendTransaction.js';
import type { Client } from '../../clients/createClient.js';
import type { Transport } from '../../clients/transports/createTransport.js';
import type { BaseErrorType } from '../../errors/base.js';
import type { Chain } from '../../types/chain.js';
import type { Compute } from '../../types/utils.js';
import type { RequestErrorType } from '../../utils/buildRequest.js';
import type { GetAccountParameter, ReadParameters, WriteParameters } from '../internal/types.js';
import * as Storage from '../Storage.js';
import type { TransactionReceipt } from '../Transaction.js';
export type EncryptedPayload = {
    ciphertext: Hex.Hex;
    ephemeralPubkeyX: Hex.Hex;
    ephemeralPubkeyYParity: number;
    nonce: Hex.Hex;
    tag: Hex.Hex;
};
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
export declare function deposit<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: deposit.Parameters<chain, account>): Promise<deposit.ReturnValue>;
export declare namespace deposit {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & Omit<Args, 'chainId' | 'recipient'> & {
        /** Recipient address in the zone. @default `account.address` */
        recipient?: Address | undefined;
    };
    type Args = {
        /** Amount of tokens to deposit. */
        amount: bigint;
        /** Parent chain ID (e.g. `42431` for moderato). */
        chainId: number;
        /** Optional deposit memo. @default `0x00...00` */
        memo?: Hex.Hex | undefined;
        /** Recipient address in the zone. */
        recipient: Address;
        /** Token address or ID to deposit. */
        token: TokenId.TokenIdOrAddress;
        /** Zone ID (e.g. `7`). */
        zoneId: number;
    };
    type ReturnValue = SendTransactionReturnType;
    type ErrorType = BaseErrorType;
    /**
     * Defines the calls to approve and deposit tokens into a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args: Args): (({
        abi: [{
            readonly name: "approve";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "spender";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
            readonly outputs: readonly [{
                readonly type: "bool";
            }];
        }];
        functionName: "approve";
    } & {
        args: readonly [spender: `0x${string}`, amount: bigint];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }) | ({
        abi: [{
            readonly name: "deposit";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly name: "_token";
                readonly type: "address";
            }, {
                readonly name: "to";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint128";
            }, {
                readonly name: "memo";
                readonly type: "bytes32";
            }];
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "bytes32";
            }];
        }];
        functionName: "deposit";
    } & {
        args: readonly [_token: `0x${string}`, to: `0x${string}`, amount: bigint, memo: `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }))[];
}
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
export declare function depositSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: depositSync.Parameters<chain, account>): Promise<depositSync.ReturnValue>;
export declare namespace depositSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = deposit.Parameters<chain, account>;
    type Args = deposit.Args;
    type ReturnValue = Compute<{
        /** Transaction receipt. */
        receipt: TransactionReceipt;
    }>;
    type ErrorType = BaseErrorType;
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
export declare function encryptedDeposit<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: encryptedDeposit.Parameters<chain, account>): Promise<encryptedDeposit.ReturnValue>;
export declare namespace encryptedDeposit {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & Omit<Args, 'chainId' | 'encrypted' | 'keyIndex' | 'recipient'> & {
        /** Recipient address in the zone. @default `account.address` */
        recipient?: Address | undefined;
    };
    type Args = {
        /** Amount of tokens to deposit. */
        amount: bigint;
        /** Parent chain ID (e.g. `42431` for moderato). */
        chainId: number;
        /** Encrypted deposit payload. */
        encrypted: EncryptedPayload;
        /** Encryption key index from the portal contract. */
        keyIndex: bigint;
        /** Optional deposit memo. @default `0x00...00` */
        memo?: Hex.Hex | undefined;
        /** Recipient address in the zone. */
        recipient: Address;
        /** Token address or ID to deposit. */
        token: TokenId.TokenIdOrAddress;
        /** Zone ID (e.g. `7`). */
        zoneId: number;
    };
    type ReturnValue = SendTransactionReturnType;
    type ErrorType = BaseErrorType;
    /**
     * Defines the calls to approve and deposit tokens into a zone (encrypted).
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args: Args): (({
        abi: [{
            readonly name: "approve";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "spender";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
            readonly outputs: readonly [{
                readonly type: "bool";
            }];
        }];
        functionName: "approve";
    } & {
        args: readonly [spender: `0x${string}`, amount: bigint];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }) | ({
        abi: [{
            readonly name: "depositEncrypted";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint128";
            }, {
                readonly name: "keyIndex";
                readonly type: "uint256";
            }, {
                readonly name: "encrypted";
                readonly type: "tuple";
                readonly components: readonly [{
                    readonly name: "ephemeralPubkeyX";
                    readonly type: "bytes32";
                }, {
                    readonly name: "ephemeralPubkeyYParity";
                    readonly type: "uint8";
                }, {
                    readonly name: "ciphertext";
                    readonly type: "bytes";
                }, {
                    readonly name: "nonce";
                    readonly type: "bytes12";
                }, {
                    readonly name: "tag";
                    readonly type: "bytes16";
                }];
            }];
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "bytes32";
            }];
        }];
        functionName: "depositEncrypted";
    } & {
        args: readonly [token: `0x${string}`, amount: bigint, bigint, {
            ephemeralPubkeyX: `0x${string}`;
            ephemeralPubkeyYParity: number;
            ciphertext: `0x${string}`;
            nonce: `0x${string}`;
            tag: `0x${string}`;
        }];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }))[];
}
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
export declare function encryptedDepositSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: encryptedDepositSync.Parameters<chain, account>): Promise<encryptedDepositSync.ReturnValue>;
export declare namespace encryptedDepositSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = encryptedDeposit.Parameters<chain, account>;
    type Args = encryptedDeposit.Args;
    type ReturnValue = Compute<{
        /** Transaction receipt. */
        receipt: TransactionReceipt;
    }>;
    type ErrorType = BaseErrorType;
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
export declare function getAuthorizationTokenInfo<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>): Promise<getAuthorizationTokenInfo.ReturnType>;
export declare namespace getAuthorizationTokenInfo {
    type RpcReturnType = {
        account: Address;
        expiresAt: Hex.Hex;
    };
    type ReturnType = {
        account: Address;
        expiresAt: bigint;
    };
    type ErrorType = RequestErrorType | BaseErrorType;
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
export declare function getDepositStatus<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: getDepositStatus.Parameters): Promise<getDepositStatus.ReturnType>;
export declare namespace getDepositStatus {
    type DepositStatus = 'failed' | 'pending' | 'processed';
    type DepositKind = 'encrypted' | 'regular';
    type DepositRpc = {
        amount: Hex.Hex;
        depositHash: Hex.Hex;
        kind: DepositKind;
        memo: Hex.Hex | null;
        recipient: Address | null;
        sender: Address;
        status: DepositStatus;
        token: Address;
    };
    type Deposit = {
        amount: bigint;
        depositHash: Hex.Hex;
        kind: DepositKind;
        memo: Hex.Hex | null;
        recipient: Address | null;
        sender: Address;
        status: DepositStatus;
        token: Address;
    };
    type RpcReturnType = {
        deposits: readonly DepositRpc[];
        processed: boolean;
        tempoBlockNumber: Hex.Hex;
        zoneProcessedThrough: Hex.Hex;
    };
    type Parameters = {
        tempoBlockNumber: bigint;
    };
    type ReturnType = {
        deposits: readonly Deposit[];
        processed: boolean;
        tempoBlockNumber: bigint;
        zoneProcessedThrough: bigint;
    };
    type ErrorType = RequestErrorType | BaseErrorType;
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
export declare function getWithdrawalFee<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters?: getWithdrawalFee.Parameters): Promise<getWithdrawalFee.ReturnType>;
export declare namespace getWithdrawalFee {
    type Parameters = ReadParameters & {
        /** Gas limit for the withdrawal callback. @default `0n` */
        gas?: bigint | undefined;
    };
    type ReturnType = bigint;
    type ErrorType = RequestErrorType | BaseErrorType;
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
export declare function getZoneInfo<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>): Promise<getZoneInfo.ReturnType>;
export declare namespace getZoneInfo {
    type RpcReturnType = {
        chainId: Hex.Hex;
        sequencer: Address;
        zoneId: Hex.Hex;
        zoneTokens: readonly Address[];
    };
    type ReturnType = {
        chainId: number;
        sequencer: Address;
        zoneId: number;
        zoneTokens: readonly Address[];
    };
    type ErrorType = RequestErrorType | BaseErrorType;
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
export declare function requestWithdrawal<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: requestWithdrawal.Parameters<chain, account>): Promise<requestWithdrawal.ReturnValue>;
export declare namespace requestWithdrawal {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & Omit<Args, 'to'> & {
        /** Recipient address on the parent Tempo chain. @default `account.address` */
        to?: Address | undefined;
    };
    type Args = {
        /** Amount of tokens to withdraw. */
        amount: bigint;
        /** Optional callback data for the recipient. @default `'0x'` */
        data?: Hex.Hex | undefined;
        /** Fallback address if callback fails. @default `to` */
        fallbackRecipient?: Address | undefined;
        /** Gas limit reserved for the withdrawal callback on the parent chain. @default `0n` */
        gas?: bigint | undefined;
        /** Optional withdrawal memo. @default `0x00...00` */
        memo?: Hex.Hex | undefined;
        /** Recipient address on the parent Tempo chain. */
        to: Address;
        /** Token address or ID to withdraw. */
        token: TokenId.TokenIdOrAddress;
    };
    type ReturnValue = SendTransactionReturnType;
    type ErrorType = BaseErrorType;
    /**
     * Defines the calls to approve and request a withdrawal from a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args: Args): (({
        abi: [{
            readonly name: "approve";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "spender";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
            readonly outputs: readonly [{
                readonly type: "bool";
            }];
        }];
        functionName: "approve";
    } & {
        args: readonly [spender: `0x${string}`, amount: bigint];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }) | ({
        abi: [{
            readonly name: "requestWithdrawal";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "to";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint128";
            }, {
                readonly name: "memo";
                readonly type: "bytes32";
            }, {
                readonly name: "gasLimit";
                readonly type: "uint64";
            }, {
                readonly name: "fallbackRecipient";
                readonly type: "address";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }, {
                readonly name: "revealTo";
                readonly type: "bytes";
            }];
            readonly outputs: readonly [];
        }];
        functionName: "requestWithdrawal";
    } & {
        args: readonly [token: `0x${string}`, to: `0x${string}`, amount: bigint, memo: `0x${string}`, gasLimit: bigint, `0x${string}`, data: `0x${string}`, `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }))[];
}
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
export declare function requestWithdrawalSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: requestWithdrawalSync.Parameters<chain, account>): Promise<requestWithdrawalSync.ReturnValue>;
export declare namespace requestWithdrawalSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = requestWithdrawal.Parameters<chain, account>;
    type Args = requestWithdrawal.Args;
    type ReturnValue = Compute<{
        /** Transaction receipt. */
        receipt: TransactionReceipt;
    }>;
    type ErrorType = BaseErrorType;
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
export declare function requestVerifiableWithdrawal<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: requestVerifiableWithdrawal.Parameters<chain, account>): Promise<requestVerifiableWithdrawal.ReturnValue>;
export declare namespace requestVerifiableWithdrawal {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = WriteParameters<chain, account> & Omit<Args, 'to'> & {
        /** Recipient address on the parent Tempo chain. @default `account.address` */
        to?: Address | undefined;
    };
    type Args = requestWithdrawal.Args & {
        /** 33-byte compressed secp256k1 public key for encrypted reveal. */
        revealTo: Hex.Hex;
    };
    type ReturnValue = SendTransactionReturnType;
    type ErrorType = BaseErrorType;
    /**
     * Defines the calls to approve and request a verifiable withdrawal from a zone.
     *
     * @param args - Arguments.
     * @returns The calls.
     */
    function calls(args: Args): (({
        abi: [{
            readonly name: "approve";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly type: "address";
                readonly name: "spender";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
            readonly outputs: readonly [{
                readonly type: "bool";
            }];
        }];
        functionName: "approve";
    } & {
        args: readonly [spender: `0x${string}`, amount: bigint];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }) | ({
        abi: [{
            readonly name: "requestWithdrawal";
            readonly type: "function";
            readonly stateMutability: "nonpayable";
            readonly inputs: readonly [{
                readonly name: "token";
                readonly type: "address";
            }, {
                readonly name: "to";
                readonly type: "address";
            }, {
                readonly name: "amount";
                readonly type: "uint128";
            }, {
                readonly name: "memo";
                readonly type: "bytes32";
            }, {
                readonly name: "gasLimit";
                readonly type: "uint64";
            }, {
                readonly name: "fallbackRecipient";
                readonly type: "address";
            }, {
                readonly name: "data";
                readonly type: "bytes";
            }, {
                readonly name: "revealTo";
                readonly type: "bytes";
            }];
            readonly outputs: readonly [];
        }];
        functionName: "requestWithdrawal";
    } & {
        args: readonly [token: `0x${string}`, to: `0x${string}`, amount: bigint, memo: `0x${string}`, gasLimit: bigint, `0x${string}`, data: `0x${string}`, `0x${string}`];
    } & {
        address: Address;
    } & {
        data: import("../../index.js").Hex;
        to: Address;
    }))[];
}
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
export declare function requestVerifiableWithdrawalSync<chain extends Chain | undefined, account extends Account | undefined>(client: Client<Transport, chain, account>, parameters: requestVerifiableWithdrawalSync.Parameters<chain, account>): Promise<requestVerifiableWithdrawalSync.ReturnValue>;
export declare namespace requestVerifiableWithdrawalSync {
    type Parameters<chain extends Chain | undefined = Chain | undefined, account extends Account | undefined = Account | undefined> = requestVerifiableWithdrawal.Parameters<chain, account>;
    type Args = requestVerifiableWithdrawal.Args;
    type ReturnValue = Compute<{
        /** Transaction receipt. */
        receipt: TransactionReceipt;
    }>;
    type ErrorType = BaseErrorType;
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
export declare function signAuthorizationToken<chain extends Chain | undefined, account extends Account | undefined, accountOverride extends Account | Address | undefined = undefined>(client: Client<Transport, chain, account>, parameters?: signAuthorizationToken.Parameters<account, accountOverride>): Promise<signAuthorizationToken.ReturnType>;
export declare namespace signAuthorizationToken {
    type Parameters<account extends Account | undefined = Account | undefined, accountOverride extends Account | Address | undefined = Account | Address | undefined> = GetAccountParameter<account, accountOverride> & {
        /** Chain override. @default `client.chain`. */
        chain?: Chain | undefined;
        /** Token expiry as a unix timestamp (seconds). @default `issuedAt + 86_400`. */
        expiresAt?: number | undefined;
        /** Token issue time as a unix timestamp (seconds). @default `Date.now() / 1000`. */
        issuedAt?: number | undefined;
        /** Storage to persist the token. @default sessionStorage (web) or memory (server). */
        storage?: Storage.Storage | undefined;
    };
    type ReturnType = {
        authentication: ZoneRpcAuthentication.ZoneRpcAuthentication;
        token: Hex.Hex;
    };
    type ErrorType = BaseErrorType;
}
//# sourceMappingURL=zone.d.ts.map