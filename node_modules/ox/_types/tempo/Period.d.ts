/**
 * Returns the number of seconds in `n` days.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.days(1) // 86400
 * ```
 */
export declare function days(n: number): number;
/**
 * Returns the number of seconds in `n` hours.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.hours(2) // 7200
 * ```
 */
export declare function hours(n: number): number;
/**
 * Returns the number of seconds in `n` minutes.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.minutes(5) // 300
 * ```
 */
export declare function minutes(n: number): number;
/**
 * Returns the number of seconds in `n` months (30 days).
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.months(1) // 2592000
 * ```
 */
export declare function months(n: number): number;
/**
 * Returns the number of seconds in `n` seconds.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.seconds(30) // 30
 * ```
 */
export declare function seconds(n: number): number;
/**
 * Returns the number of seconds in `n` weeks.
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.weeks(1) // 604800
 * ```
 */
export declare function weeks(n: number): number;
/**
 * Returns the number of seconds in `n` years (365 days).
 *
 * @example
 * ```ts twoslash
 * import { Period } from 'ox/tempo'
 *
 * const seconds = Period.years(1) // 31536000
 * ```
 */
export declare function years(n: number): number;
//# sourceMappingURL=Period.d.ts.map