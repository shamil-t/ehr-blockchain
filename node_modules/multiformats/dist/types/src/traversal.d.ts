export type CID<C = number, A = number, V = 0 | 1> = import('./cid').CID<unknown, C, A, V>;
export type BlockView<T = unknown, C = number, A = number, V = 0 | 1> = import('./block/interface.js').BlockView<T, C, A, V>;
/**
 * @template [C=number] - multicodec code corresponding to codec used to encode the block
 * @template [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template [V=0|1] - CID version
 * @typedef {import('./cid').CID<unknown, C, A, V>} CID
 */
/**
 * @template [T=unknown] - Logical type of the data encoded in the block
 * @template [C=number] - multicodec code corresponding to codec used to encode the block
 * @template [A=number] - multicodec code corresponding to the hashing algorithm used in CID creation.
 * @template [V=0|1] - CID version
 * @typedef {import('./block/interface.js').BlockView<T, C, A, V>} BlockView
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