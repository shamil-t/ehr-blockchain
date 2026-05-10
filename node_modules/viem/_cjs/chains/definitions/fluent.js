"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluent = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.fluent = (0, defineChain_js_1.defineChain)({
    id: 25_363,
    name: 'Fluent',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.fluent.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Fluent Explorer',
            url: 'https://fluentscan.xyz',
        },
    },
    testnet: false,
});
//# sourceMappingURL=fluent.js.map