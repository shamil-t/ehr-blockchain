/**
 * Base offset for deriving zone chain IDs.
 *
 * Zone chain IDs are computed as `chainIdBase + zoneId`.
 */
export const chainIdBase = 4_217_000_000;
/**
 * Derives a zone ID from a zone chain ID.
 *
 * Zone chain IDs follow the formula `4_217_000_000 + zoneId`, so a chain ID
 * of `4217000006` corresponds to zone ID `6`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const zoneId = ZoneId.fromChainId(4_217_000_006)
 * // @log: 6
 * ```
 *
 * @param chainId - The zone chain ID.
 * @returns The zone ID.
 */
export function fromChainId(chainId) {
    return chainId - chainIdBase;
}
/**
 * Derives a zone chain ID from a zone ID.
 *
 * Zone chain IDs follow the formula `4_217_000_000 + zoneId`, so zone ID
 * `6` corresponds to chain ID `4217000006`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const chainId = ZoneId.toChainId(6)
 * // @log: 4217000006
 * ```
 *
 * @param zoneId - The zone ID.
 * @returns The zone chain ID.
 */
export function toChainId(zoneId) {
    return chainIdBase + zoneId;
}
//# sourceMappingURL=ZoneId.js.map