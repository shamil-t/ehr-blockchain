export function findExecutionStatesByType(exStateType, deployment) {
    const exStates = Object.values(deployment.executionStates).filter((exs) => exs.type === exStateType);
    return exStates;
}
//# sourceMappingURL=find-execution-states-by-type.js.map