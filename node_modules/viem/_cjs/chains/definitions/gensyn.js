"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gensyn = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.gensyn = (0, defineChain_js_1.defineChain)({
    id: 685_689,
    name: 'Gensyn Mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://gensyn-mainnet.g.alchemy.com/public'] },
    },
    blockExplorers: {
        default: {
            name: 'Blockscout',
            url: 'https://gensyn-mainnet.explorer.alchemy.com',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 0,
        },
    },
});
//# sourceMappingURL=gensyn.js.map