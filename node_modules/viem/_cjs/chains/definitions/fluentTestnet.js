"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluentTestnet = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.fluentTestnet = (0, defineChain_js_1.defineChain)({
    id: 20_994,
    name: 'Fluent Testnet',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.fluent.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Fluent Testnet Explorer',
            url: 'https://testnet.fluentscan.xyz',
        },
    },
    testnet: true,
});
//# sourceMappingURL=fluentTestnet.js.map