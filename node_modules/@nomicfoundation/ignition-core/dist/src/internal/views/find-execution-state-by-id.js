import { assertIgnitionInvariant } from "../utils/assertions.js";
export function findExecutionStateById(exStateType, deployment, futureId) {
    const exState = deployment.executionStates[futureId];
    assertIgnitionInvariant(exState !== undefined, `Expected execution state for ${futureId} to exist, but it did not`);
    assertIgnitionInvariant(exState.type === exStateType, `Expected execution state for ${futureId} to be a ${exStateType}, but instead it was ${exState.type}`);
    return exState;
}
//# sourceMappingURL=find-execution-state-by-id.js.map