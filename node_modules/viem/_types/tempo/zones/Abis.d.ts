export declare const zonePortal: readonly [{
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
}, {
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
}, {
    readonly name: "sequencerEncryptionKey";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "x";
        readonly type: "bytes32";
    }, {
        readonly name: "yParity";
        readonly type: "uint8";
    }];
}, {
    readonly name: "encryptionKeyCount";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}];
export declare const zoneOutbox: readonly [{
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
}, {
    readonly name: "calculateWithdrawalFee";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "gasLimit";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [{
        readonly name: "fee";
        readonly type: "uint128";
    }];
}];
//# sourceMappingURL=Abis.d.ts.map