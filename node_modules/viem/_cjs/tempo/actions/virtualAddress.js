"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMasterAddress = getMasterAddress;
exports.resolve = resolve;
exports.registerMaster = registerMaster;
exports.registerMasterSync = registerMasterSync;
const Hex = require("ox/Hex");
const readContract_js_1 = require("../../actions/public/readContract.js");
const writeContract_js_1 = require("../../actions/wallet/writeContract.js");
const writeContractSync_js_1 = require("../../actions/wallet/writeContractSync.js");
const address_js_1 = require("../../constants/address.js");
const parseEventLogs_js_1 = require("../../utils/abi/parseEventLogs.js");
const Abis = require("../Abis.js");
const Addresses = require("../Addresses.js");
const utils_js_1 = require("../internal/utils.js");
async function getMasterAddress(client, parameters) {
    const address = await (0, readContract_js_1.readContract)(client, {
        ...parameters,
        ...getMasterAddress.call({ masterId: parameters.masterId }),
    });
    if (address === address_js_1.zeroAddress)
        return null;
    return address;
}
(function (getMasterAddress) {
    function call(args) {
        const { masterId } = args;
        return (0, utils_js_1.defineCall)({
            address: Addresses.addressRegistry,
            abi: Abis.addressRegistry,
            args: [masterId],
            functionName: 'getMaster',
        });
    }
    getMasterAddress.call = call;
})(getMasterAddress || (exports.getMasterAddress = getMasterAddress = {}));
async function resolve(client, parameters) {
    if (!isVirtual(parameters.address))
        return parameters.address;
    const masterId = Hex.slice(parameters.address, 0, 4);
    return getMasterAddress(client, { ...parameters, masterId });
}
async function registerMaster(client, parameters) {
    return registerMaster.inner(writeContract_js_1.writeContract, client, parameters);
}
(function (registerMaster) {
    async function inner(action, client, parameters) {
        const { salt, ...rest } = parameters;
        const call = registerMaster.call({ salt });
        return (await action(client, {
            ...rest,
            ...call,
        }));
    }
    registerMaster.inner = inner;
    function call(args) {
        const { salt } = args;
        return (0, utils_js_1.defineCall)({
            address: Addresses.addressRegistry,
            abi: Abis.addressRegistry,
            functionName: 'registerVirtualMaster',
            args: [salt],
        });
    }
    registerMaster.call = call;
    function extractEvent(logs) {
        const [log] = (0, parseEventLogs_js_1.parseEventLogs)({
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
})(registerMaster || (exports.registerMaster = registerMaster = {}));
async function registerMasterSync(client, parameters) {
    const { throwOnReceiptRevert = true, ...rest } = parameters;
    const receipt = await registerMaster.inner(writeContractSync_js_1.writeContractSync, client, {
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
function isVirtual(address) {
    return Hex.slice(address, 4, 14).toLowerCase() === virtualMagic;
}
//# sourceMappingURL=virtualAddress.js.map