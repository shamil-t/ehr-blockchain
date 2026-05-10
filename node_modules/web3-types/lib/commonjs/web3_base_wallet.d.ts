import { Transaction } from './eth_types.js';
import { HexString } from './primitives_types.js';
export declare type Cipher = 'aes-128-ctr' | 'aes-128-cbc' | 'aes-256-cbc';
export declare type CipherOptions = {
    salt?: Uint8Array | string;
    iv?: Uint8Array | string;
    kdf?: 'scrypt' | 'pbkdf2';
    dklen?: number;
    c?: number;
    n?: number;
    r?: number;
    p?: number;
};
export declare type ScryptParams = {
    dklen: number;
    n: number;
    p: number;
    r: number;
    salt: Uint8Array | string;
};
export declare type PBKDF2SHA256Params = {
    c: number;
    dklen: number;
    prf: 'hmac-sha256';
    salt: Uint8Array | string;
};
export declare type KeyStore = {
    crypto: {
        cipher: Cipher;
        ciphertext: string;
        cipherparams: {
            iv: string;
        };
        kdf: 'pbkdf2' | 'scrypt';
        kdfparams: ScryptParams | PBKDF2SHA256Params;
        mac: HexString;
    };
    id: string;
    version: 3;
    address: string;
};
export interface Web3BaseWalletAccount {
    [key: string]: unknown;
    readonly address: string;
    readonly privateKey: string;
    readonly signTransaction: (tx: Transaction) => Promise<{
        readonly messageHash: HexString;
        readonly r: HexString;
        readonly s: HexString;
        readonly v: HexString;
        readonly rawTransaction: HexString;
        readonly transactionHash: HexString;
    }>;
    readonly sign: (data: Record<string, unknown> | string) => {
        readonly messageHash: HexString;
        readonly r: HexString;
        readonly s: HexString;
        readonly v: HexString;
        readonly message?: string;
        readonly signature: HexString;
    };
    readonly encrypt: (password: string, options?: Record<string, unknown>) => Promise<KeyStore>;
}
export interface Web3AccountProvider<T> {
    privateKeyToAccount: (privateKey: string) => T;
    create: () => T;
    decrypt: (keystore: KeyStore | string, password: string, options?: Record<string, unknown>) => Promise<T>;
}
export declare abstract class Web3BaseWallet<T extends Web3BaseWalletAccount> extends Array<T> {
    protected readonly _accountProvider: Web3AccountProvider<T>;
    constructor(accountProvider: Web3AccountProvider<T>);
    abstract create(numberOfAccounts: number): this;
    abstract add(account: T | string): this;
    abstract get(addressOrIndex: string | number): T | undefined;
    abstract remove(addressOrIndex: string | number): boolean;
    abstract clear(): this;
    abstract encrypt(password: string, options?: Record<string, unknown>): Promise<KeyStore[]>;
    abstract decrypt(encryptedWallet: KeyStore[], password: string, options?: Record<string, unknown>): Promise<this>;
    abstract save(password: string, keyName?: string): Promise<boolean | never>;
    abstract load(password: string, keyName?: string): Promise<this | never>;
}
