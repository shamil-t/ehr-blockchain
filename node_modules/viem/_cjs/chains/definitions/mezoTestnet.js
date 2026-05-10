"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mezoTestnet = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.mezoTestnet = (0, defineChain_js_1.defineChain)({
    id: 31_611,
    name: 'Mezo Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Bitcoin',
        symbol: 'BTC',
    },
    rpcUrls: {
        default: { http: ['https://rpc.test.mezo.org'] },
    },
    blockExplorers: {
        default: {
            name: 'Mezo Testnet Explorer',
            url: 'https://explorer.test.mezo.org',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 3_328_573,
        },
    },
    testnet: true,
});
//# sourceMappingURL=mezoTestnet.js.map