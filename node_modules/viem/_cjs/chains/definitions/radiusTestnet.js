"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.radiusTestnet = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.radiusTestnet = (0, defineChain_js_1.defineChain)({
    id: 72_344,
    name: 'Radius Test Network',
    nativeCurrency: { name: 'Radius USD', symbol: 'RUSD', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.radiustech.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Radius Test Network Explorer',
            url: 'https://testnet.radiustech.xyz',
        },
    },
    testnet: true,
});
//# sourceMappingURL=radiusTestnet.js.map