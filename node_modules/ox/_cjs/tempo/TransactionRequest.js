"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromRpc = fromRpc;
exports.toRpc = toRpc;
const Hex = require("../core/Hex.js");
const ox_TransactionRequest = require("../core/TransactionRequest.js");
const AuthorizationTempo = require("./AuthorizationTempo.js");
const KeyAuthorization = require("./KeyAuthorization.js");
const TempoAddress = require("./TempoAddress.js");
const TokenId = require("./TokenId.js");
const Transaction = require("./Transaction.js");
function fromRpc(request) {
    const { authorizationList: _, ...rest } = request;
    const request_ = ox_TransactionRequest.fromRpc(rest);
    if (typeof request.type !== 'undefined')
        request_.type =
            Transaction.fromRpcType[request.type] || request_.type;
    if (request.authorizationList)
        request_.authorizationList = AuthorizationTempo.fromRpcList(request.authorizationList);
    if (request.calls)
        request_.calls = request.calls.map((call) => {
            const mapped = {
                to: call.to,
                data: call.data,
            };
            if (call.value && call.value !== '0x')
                mapped.value = Hex.toBigInt(call.value);
            return mapped;
        });
    if (typeof request.feeToken !== 'undefined')
        request_.feeToken = request.feeToken;
    if (request.keyAuthorization)
        request_.keyAuthorization = KeyAuthorization.fromRpc(request.keyAuthorization);
    if (typeof request.validBefore !== 'undefined')
        request_.validBefore = Hex.toNumber(request.validBefore);
    if (typeof request.validAfter !== 'undefined')
        request_.validAfter = Hex.toNumber(request.validAfter);
    if (typeof request.nonceKey !== 'undefined')
        request_.nonceKey = Hex.toBigInt(request.nonceKey);
    return request_;
}
function toRpc(request) {
    const request_rpc = ox_TransactionRequest.toRpc({
        ...request,
        authorizationList: undefined,
    });
    if (request.authorizationList)
        request_rpc.authorizationList = AuthorizationTempo.toRpcList(request.authorizationList);
    if (request.calls)
        request_rpc.calls = request.calls.map((call) => ({
            to: call.to ? TempoAddress.resolve(call.to) : call.to,
            value: call.value ? Hex.fromNumber(call.value) : '0x',
            data: call.data ?? '0x',
        }));
    else if (request.to || request.data || request.value)
        request_rpc.calls = [
            {
                to: request.to ? TempoAddress.resolve(request.to) : undefined,
                value: request.value ? Hex.fromNumber(request.value) : '0x',
                data: request.data ?? '0x',
            },
        ];
    if (typeof request.feeToken !== 'undefined')
        request_rpc.feeToken = TokenId.toAddress(request.feeToken);
    if (request.keyAuthorization)
        request_rpc.keyAuthorization = KeyAuthorization.toRpc(request.keyAuthorization);
    if (typeof request.validBefore !== 'undefined')
        request_rpc.validBefore = Hex.fromNumber(request.validBefore);
    if (typeof request.validAfter !== 'undefined')
        request_rpc.validAfter = Hex.fromNumber(request.validAfter);
    const nonceKey = (() => {
        if (request.nonceKey === 'random')
            return Hex.random(6);
        if (typeof request.nonceKey === 'bigint')
            return Hex.fromNumber(request.nonceKey);
        return undefined;
    })();
    if (nonceKey)
        request_rpc.nonceKey = nonceKey;
    if (typeof request.calls !== 'undefined' ||
        typeof request.feePayer !== 'undefined' ||
        typeof request.feeToken !== 'undefined' ||
        typeof request.keyAuthorization !== 'undefined' ||
        typeof request.nonceKey !== 'undefined' ||
        typeof request.validBefore !== 'undefined' ||
        typeof request.validAfter !== 'undefined' ||
        request.type === 'tempo') {
        request_rpc.type = Transaction.toRpcType.tempo;
        delete request_rpc.data;
        delete request_rpc.input;
        delete request_rpc.to;
        delete request_rpc.value;
    }
    return request_rpc;
}
//# sourceMappingURL=TransactionRequest.js.map