"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xpla = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.xpla = (0, defineChain_js_1.defineChain)({
    id: 37,
    name: 'CONX Chain',
    nativeCurrency: {
        decimals: 18,
        name: 'XPLA',
        symbol: 'XPLA',
    },
    rpcUrls: {
        default: {
            http: ['https://dimension-evm-rpc.xpla.dev'],
        },
    },
    blockExplorers: {
        default: {
            name: 'CONX Explorer',
            url: 'https://explorer.conx.xyz',
        },
    },
    testnet: false,
});
//# sourceMappingURL=xpla.js.map