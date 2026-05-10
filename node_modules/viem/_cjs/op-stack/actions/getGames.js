"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGames = getGames;
const multicall_js_1 = require("../../actions/public/multicall.js");
const readContract_js_1 = require("../../actions/public/readContract.js");
const abis_js_1 = require("../abis.js");
async function getGames(client, parameters) {
    const { chain = client.chain, l2BlockNumber, limit = 100, targetChain, } = parameters;
    const portalAddress = (() => {
        if (parameters.portalAddress)
            return parameters.portalAddress;
        if (chain)
            return targetChain.contracts.portal[chain.id].address;
        return Object.values(targetChain.contracts.portal)[0].address;
    })();
    const disputeGameFactoryAddress = (() => {
        if (parameters.disputeGameFactoryAddress)
            return parameters.disputeGameFactoryAddress;
        if (chain)
            return targetChain.contracts.disputeGameFactory[chain.id].address;
        return Object.values(targetChain.contracts.disputeGameFactory)[0].address;
    })();
    const [gameCount, gameType] = await Promise.all([
        (0, readContract_js_1.readContract)(client, {
            abi: abis_js_1.disputeGameFactoryAbi,
            functionName: 'gameCount',
            args: [],
            address: disputeGameFactoryAddress,
        }),
        (0, readContract_js_1.readContract)(client, {
            abi: abis_js_1.portal2Abi,
            functionName: 'respectedGameType',
            address: portalAddress,
        }),
    ]);
    const rawGames = (await (0, readContract_js_1.readContract)(client, {
        abi: abis_js_1.disputeGameFactoryAbi,
        functionName: 'findLatestGames',
        address: disputeGameFactoryAddress,
        args: [
            gameType,
            BigInt(Math.max(0, Number(gameCount - 1n))),
            BigInt(Math.min(limit, Number(gameCount))),
        ],
    }));
    const l2SequenceNumbers = await (0, multicall_js_1.multicall)(client, {
        allowFailure: false,
        contracts: rawGames.map((game) => ({
            abi: abis_js_1.disputeGameAbi,
            address: `0x${game.metadata.slice(26)}`,
            functionName: 'l2SequenceNumber',
        })),
    });
    const games = rawGames
        .map((game, i) => {
        const blockNumber = l2SequenceNumbers[i];
        return !l2BlockNumber || blockNumber > l2BlockNumber
            ? { ...game, l2BlockNumber: blockNumber }
            : null;
    })
        .filter(Boolean);
    return games;
}
//# sourceMappingURL=getGames.js.map