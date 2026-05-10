import { ExecutionSateType } from "../../execution/types/execution-state.js";
export function getNetworkExecutionStates(deploymentState) {
    const exStates = [];
    for (const exState of Object.values(deploymentState.executionStates)) {
        if (exState.type === ExecutionSateType.DEPLOYMENT_EXECUTION_STATE ||
            exState.type === ExecutionSateType.CALL_EXECUTION_STATE ||
            exState.type === ExecutionSateType.SEND_DATA_EXECUTION_STATE ||
            exState.type === ExecutionSateType.STATIC_CALL_EXECUTION_STATE) {
            exStates.push(exState);
        }
    }
    return exStates;
}
//# sourceMappingURL=get-network-execution-states.js.map