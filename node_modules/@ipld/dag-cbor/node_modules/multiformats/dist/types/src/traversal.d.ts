export type CID = import('./cid').CID;
export type BlockView = import('./block/interface.js').BlockView;
/**
 * @typedef {import('./cid').CID} CID
 */
/**
 * @typedef {import('./block/interface.js').BlockView} BlockView
 */
/**
 * @param {object} options
 * @param {CID} options.cid
 * @param {(cid: CID) => Promise<BlockView|null>} options.load
 * @param {Set<string>} [options.seen]
 */
export function walk({ cid, load, seen }: {
    cid: CID;
    load: (cid: CID) => Promise<BlockView | null>;
    seen?: Set<string> | undefined;
}): Promise<void>;
//# sourceMappingURL=traversal.d.ts.map