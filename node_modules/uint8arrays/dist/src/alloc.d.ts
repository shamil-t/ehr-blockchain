/**
 * Returns a `Uint8Array` of the requested size. Referenced memory will
 * be initialized to 0.
 */
export declare function alloc(size?: number): Uint8Array;
/**
 * Where possible returns a Uint8Array of the requested size that references
 * uninitialized memory. Only use if you are certain you will immediately
 * overwrite every value in the returned `Uint8Array`.
 */
export declare function allocUnsafe(size?: number): Uint8Array;
//# sourceMappingURL=alloc.d.ts.map