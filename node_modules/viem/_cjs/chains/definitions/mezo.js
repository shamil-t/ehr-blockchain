"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mezo = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.mezo = (0, defineChain_js_1.defineChain)({
    id: 31_612,
    name: 'Mezo',
    nativeCurrency: {
        decimals: 18,
        name: 'Bitcoin',
        symbol: 'BTC',
    },
    rpcUrls: {
        default: { http: ['https://rpc.mezo.org'] },
    },
    blockExplorers: {
        default: {
            name: 'Mezo Explorer',
            url: 'https://explorer.mezo.org',
        },
    },
});
//# sourceMappingURL=mezo.js.map