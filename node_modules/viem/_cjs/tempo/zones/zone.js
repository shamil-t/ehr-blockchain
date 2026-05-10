"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoneModerato = exports.zone = exports.portalAddresses = void 0;
exports.getPortalAddress = getPortalAddress;
exports.from = from;
const tempo_1 = require("ox/tempo");
const tempo_js_1 = require("../../chains/definitions/tempo.js");
const tempoModerato_js_1 = require("../../chains/definitions/tempoModerato.js");
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
const chainConfig_js_1 = require("../chainConfig.js");
exports.portalAddresses = {
    [tempoModerato_js_1.tempoModerato.id]: {
        6: '0x7069DeC4E64Fd07334A0933eDe836C17259c9B23',
        7: '0x3F5296303400B56271b476F5A0B9cBF74350D6Ac',
    },
};
function getPortalAddress(chainId, zoneId) {
    const address = exports.portalAddresses[chainId]?.[zoneId];
    if (!address)
        throw new Error(`No portal address configured for zone ${zoneId} on chain ${chainId}.`);
    return address;
}
const overrides = {
    6: {
        name: 'Zone A',
        rpcUrl: 'https://rpc-zone-a.testnet.tempo.xyz',
    },
    7: {
        name: 'Zone B',
        rpcUrl: 'https://rpc-zone-b.testnet.tempo.xyz',
    },
};
exports.zone = from({
    sourceId: tempo_js_1.tempo.id,
    rpcHost: 'tempo.xyz',
});
exports.zoneModerato = from({
    sourceId: tempoModerato_js_1.tempoModerato.id,
    rpcHost: 'tempoxyz.dev',
});
function from(options) {
    return (id) => {
        const chainId = tempo_1.ZoneId.toChainId(id);
        const paddedId = String(id).padStart(3, '0');
        const override = overrides[id];
        return (0, defineChain_js_1.defineChain)({
            ...chainConfig_js_1.chainConfig,
            id: chainId,
            name: override?.name ?? `Tempo Zone ${paddedId}`,
            nativeCurrency: {
                name: 'USD',
                symbol: 'USD',
                decimals: 6,
            },
            rpcUrls: {
                default: {
                    http: [
                        override?.rpcUrl ??
                            `https://rpc-zone-${paddedId}.${options.rpcHost}`,
                    ],
                },
            },
            sourceId: options.sourceId,
        });
    };
}
//# sourceMappingURL=zone.js.map