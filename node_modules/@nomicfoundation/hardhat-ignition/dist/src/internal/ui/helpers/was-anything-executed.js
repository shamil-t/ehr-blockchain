/**
 * Was anything executed during the deployment. We determine this based
 * on whether the batcher indicates that there was at least one batch.
 */
export function wasAnythingExecuted({ batches, }) {
    return batches.length > 0;
}
//# sourceMappingURL=was-anything-executed.js.map