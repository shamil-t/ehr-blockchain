"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.radius = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.radius = (0, defineChain_js_1.defineChain)({
    id: 723_487,
    name: 'Radius Network',
    nativeCurrency: { name: 'Radius USD', symbol: 'RUSD', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc.radiustech.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Radius Network Explorer',
            url: 'https://network.radiustech.xyz',
        },
    },
    testnet: false,
});
//# sourceMappingURL=radius.js.map