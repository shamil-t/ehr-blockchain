"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hyperEvm = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.hyperEvm = (0, defineChain_js_1.defineChain)({
    id: 999,
    name: 'HyperEVM',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    blockExplorers: {
        default: {
            name: 'HyperEVMScan',
            url: 'https://hyperevmscan.io',
        },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            blockCreated: 13051,
        },
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.hyperliquid.xyz/evm'],
        },
    },
    testnet: false,
});
//# sourceMappingURL=hyperEvm.js.map