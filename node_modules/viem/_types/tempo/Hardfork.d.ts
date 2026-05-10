export declare const hardforks: readonly ["genesis", "t0", "t1", "t1a", "t1b", "t1c", "t2", "t3"];
export type Hardfork = (typeof hardforks)[number];
/** Returns `true` if `current` is before `target`. */
export declare function lt(current: string, target: Hardfork): boolean;
//# sourceMappingURL=Hardfork.d.ts.map