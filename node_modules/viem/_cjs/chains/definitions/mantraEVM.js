"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mantraEVM = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.mantraEVM = (0, defineChain_js_1.defineChain)({
    id: 5888,
    name: 'MANTRA EVM',
    nativeCurrency: {
        decimals: 18,
        name: 'MANTRA',
        symbol: 'MANTRA',
    },
    rpcUrls: {
        default: {
            http: ['https://evm.mantrachain.io'],
            webSocket: ['https://evm.mantrachain.io/ws'],
        },
    },
    blockExplorers: {
        default: {
            name: 'MANTRA Blockscout Explorer',
            url: 'https://blockscout.mantrascan.io',
        },
    },
});
//# sourceMappingURL=mantraEVM.js.map